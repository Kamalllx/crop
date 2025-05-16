import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain, create_extraction_chain
from langchain.memory import ConversationBufferMemory

from extraction_schema import CropQuery
from crop_yield import CropYieldModel

GROQ_API_KEY="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"

app = Flask(__name__)
CORS(app)

ml_model = CropYieldModel(model_type="rnn")
ml_model.load_model()

llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model="llama3-70b-8192",
    temperature=0.2
)

# Extraction chain using Pydantic schema
extraction_chain = create_extraction_chain(
    schema=CropQuery.schema(),
    llm=llm
)

response_prompt = PromptTemplate(
    input_variables=["history", "input", "ml_result"],
    template=(
        "You are an agricultural assistant. "
        "If the user asks for crop yield prediction and provides details, "
        "use the ML model result: {ml_result}. Otherwise, answer as a helpful assistant.\n"
        "Chat history:\n{history}\nUser: {input}\nAssistant:"
    )
)
memory = ConversationBufferMemory(memory_key="history", input_key="input")
response_chain = LLMChain(llm=llm, prompt=response_prompt, memory=memory)

def format_markdown_response(details_list, ml_results, groq_response):
    md = "### Details provided\n"
    if details_list:
        for i, details in enumerate(details_list):
            md += f"\n**Crop {i+1}:**\n"
            md += "\n".join([f"- **{k}**: {v}" for k, v in details.items()])
    else:
        md += "_No structured crop details provided._"
    md += "\n\n### ML Model Analysis\n"
    if ml_results:
        for i, result in enumerate(ml_results):
            md += f"\n**Crop {i+1}:** {result}"
    else:
        md += "_ML model was not used due to insufficient details._"
    md += "\n\n### Combined Analysis response by Groq\n"
    md += groq_response
    return md

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        user_input = data.get("message", "")
        session_id = data.get("session_id", "default")

        # Stage 1: Use structured extraction chain (use .invoke, output is a list)
        extraction_output = extraction_chain.invoke(user_input)
        # Ensure extraction_output is a list of dicts
        if isinstance(extraction_output, list):
            crop_queries = extraction_output
        elif extraction_output:
            crop_queries = [extraction_output]
        else:
            crop_queries = []

        ml_results = []
        for crop_query in crop_queries:
            try:
                ml_pred = ml_model.predict_single(crop_query)
                ml_results.append(f"Based on the ML model, the predicted crop yield will be **{ml_pred}**.")
            except Exception as e:
                ml_results.append(f"ML model could not process this crop: {e}")

        # Stage 2: Generate assistant response (use .invoke)
        groq_response = response_chain.invoke({"input": user_input, "ml_result": "\n".join(ml_results)})
        markdown_response = format_markdown_response(crop_queries, ml_results, groq_response["text"])
        return jsonify({
            "response": markdown_response,
            "ml_result": ml_results,
            "extracted": crop_queries
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        result = ml_model.predict_single(data)
        return jsonify({"prediction": result})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5328, debug=True)
