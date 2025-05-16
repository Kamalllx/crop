"use client";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Inter, Poppins } from "next/font/google";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Font setup
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

const inter = Inter({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const API_URL = "http://localhost:5328/chat";

export default function Chatbot() {
  const [messages, setMessages] = useState<{ from: string; text: string; id: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Hide welcome message when there are messages
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false);
    }
  }, [messages]);

  // Generate unique ID for each message
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const messageId = generateId();
    // Add only user message to the UI first
    setMessages(prev => [...prev, { from: "user", text: input, id: messageId }]);
    const userInput = input;
    setInput("");
    setLoading(true);
    
    try {
      const res = await axios.post(API_URL, { message: userInput });

      // Add bot response with fancy entrance animation
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          from: "bot", 
          text: res.data.response, 
          id: generateId() 
        }]);
        setLoading(false);
      }, 500); // Small delay for natural conversation flow
    } catch (err) {
      console.error("Error fetching response:", err);
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          { 
            from: "bot", 
            text: "Sorry, I couldn't process your request. Please try again.", 
            id: generateId() 
          }
        ]);
        setLoading(false);
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Custom components for markdown rendering
  const MarkdownComponents = {
    // Override how code blocks are rendered
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <pre className="bg-gray-100 rounded-md p-3 my-2 overflow-x-auto">
          <code
            className={`${match ? `language-${match[1]}` : ''} text-sm`}
            {...props}
          >
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-gray-100 text-green-700 px-1 rounded" {...props}>
          {children}
        </code>
      );
    },
    // Style for links
    a: ({ node, children, ...props }: any) => (
      <a className="text-blue-600 hover:underline" {...props}>
        {children}
      </a>
    ),
    // Style for headings
    h1: ({ node, children, ...props }: any) => (
      <h1 className="text-xl font-bold my-3" {...props}>{children}</h1>
    ),
    h2: ({ node, children, ...props }: any) => (
      <h2 className="text-lg font-bold my-2" {...props}>{children}</h2>
    ),
    h3: ({ node, children, ...props }: any) => (
      <h3 className="text-md font-bold my-2" {...props}>{children}</h3>
    ),
    // Style for paragraphs
    p: ({ node, children, ...props }: any) => (
      <p className="my-2" {...props}>{children}</p>
    ),
    // Style for lists
    ul: ({ node, children, ...props }: any) => (
      <ul className="list-disc pl-5 my-2" {...props}>{children}</ul>
    ),
    ol: ({ node, children, ...props }: any) => (
      <ol className="list-decimal pl-5 my-2" {...props}>{children}</ol>
    ),
    // Style for tables
    table: ({ node, children, ...props }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-300" {...props}>{children}</table>
      </div>
    ),
    thead: ({ node, children, ...props }: any) => (
      <thead className="bg-gray-100" {...props}>{children}</thead>
    ),
    th: ({ node, children, ...props }: any) => (
      <th className="px-3 py-2 border-b border-gray-300 text-left text-sm font-semibold" {...props}>{children}</th>
    ),
    td: ({ node, children, ...props }: any) => (
      <td className="px-3 py-2 border-b border-gray-300 text-sm" {...props}>{children}</td>
    ),
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 to-blue-50 ${poppins.variable} ${inter.variable} font-sans flex items-center justify-center p-4`}>
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn"
        style={{ animationDuration: '0.5s' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mr-4 shadow-md transition-transform hover:scale-110 duration-300">
              <span className="text-green-600 text-2xl">🌱</span>
            </div>
            <div>
              <h1 className="font-poppins font-bold text-2xl tracking-tight">Crop Yield Advisor</h1>
              <p className="text-green-50 text-sm font-inter">Powered by Groq + Machine Learning</p>
            </div>
          </div>
          <div className="bg-green-700 bg-opacity-30 px-3 py-1 rounded-full text-xs font-medium">
            AI Assistant
          </div>
        </div>
        
        {/* Chat area */}
        <div className="h-[450px] overflow-y-auto bg-gray-50 px-4 py-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {showWelcome && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 animate-fadeIn">
              <div className="text-6xl mb-5 animate-float">🌾</div>
              <h3 className="font-poppins font-semibold text-xl mb-3 text-green-700">Welcome to Crop Yield Advisor</h3>
              <p className="max-w-md text-gray-600 font-inter">
                Ask questions about crop yields, growing conditions, soil health, or farming techniques.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
                <div 
                  className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 text-left cursor-pointer hover:bg-green-50"
                  onClick={() => {
                    setInput("What crops grow best in sandy soil?");
                    textareaRef.current?.focus();
                  }}
                >
                  <p className="text-xs text-green-600 font-medium mb-1">Try asking:</p>
                  <p className="text-sm text-gray-700">"What crops grow best in sandy soil?"</p>
                </div>
                <div 
                  className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 text-left cursor-pointer hover:bg-green-50"
                  onClick={() => {
                    setInput("How does rainfall affect corn yield?");
                    textareaRef.current?.focus();
                  }}
                >
                  <p className="text-xs text-green-600 font-medium mb-1">Try asking:</p>
                  <p className="text-sm text-gray-700">"How does rainfall affect corn yield?"</p>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`mb-5 max-w-[85%] animate-message-appear ${
                msg.from === "user" ? "ml-auto" : "mr-auto"
              }`}
            >
              <div 
                className={`px-5 py-3 rounded-xl shadow-sm ${
                  msg.from === "user" 
                    ? "bg-gradient-to-r from-green-600 to-green-500 text-white rounded-br-none" 
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.from === "user" ? (
                  <p className="font-inter">{msg.text}</p>
                ) : (
                  <div className="markdown-body font-inter text-gray-800">
                    <ReactMarkdown 
                      components={MarkdownComponents}
                      remarkPlugins={[remarkGfm]}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              <div 
                className={`flex items-center text-xs mt-1.5 text-gray-500 ${
                  msg.from === "user" ? "justify-end mr-2" : "ml-2"
                }`}
              >
                {msg.from !== "user" && (
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-1.5">
                    <span className="text-green-600 text-xs">🤖</span>
                  </div>
                )}
                <span>{msg.from === "user" ? "You" : "Advisor"}</span>
                {msg.from === "user" && (
                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center ml-1.5">
                    <span className="text-blue-600 text-xs">👤</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="mb-4 max-w-[85%] animate-message-appear">
              <div className="bg-white border border-gray-200 px-5 py-4 rounded-xl rounded-bl-none shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8">
                    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <span className="font-medium text-sm text-gray-600">Processing your question...</span>
                </div>
              </div>
              <div className="flex items-center text-xs mt-1.5 ml-2 text-gray-500">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-1.5">
                  <span className="text-green-600 text-xs">🤖</span>
                </div>
                <span>Advisor</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="border-t border-gray-200 bg-white p-5">
          <div className="flex rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 bg-white overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about crops, soil, climate, or farming techniques..."
              className="flex-1 p-4 outline-none resize-none min-h-[50px] max-h-32 font-inter text-gray-700"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className={`bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-4 m-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${!loading && input.trim() ? 'hover:scale-105' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <div className="flex justify-between items-center mt-3">
            <div className="text-xs text-gray-500 font-inter">
              Press Enter to send, Shift+Enter for new line
            </div>
            <div className="text-xs text-green-600 font-medium font-inter flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Crop data updated May 2025
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
