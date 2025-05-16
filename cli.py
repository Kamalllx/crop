import argparse
import pandas as pd
from core import CropYieldModel

def get_model_choice():
    print("\nSelect model to use:")
    print("1. RNN")
    print("2. LSTM")
    print("3. Feedforward Neural Network")
    choice = input("Enter choice [1/2/3]: ").strip()
    if choice == "1":
        return "rnn"
    elif choice == "2":
        return "lstm"
    elif choice == "3":
        return "ff"
    else:
        print("Invalid choice. Defaulting to RNN.")
        return "rnn"

def input_sample():
    print("\nEnter the following details:")
    state = input("State_Name: ").strip()
    district = input("District_Name: ").strip()
    year = int(input("Crop_Year (e.g., 2013): ").strip())
    season = input("Season: ").strip()
    crop = input("Crop: ").strip()
    area = float(input("Area (in hectares): ").strip())
    # Production is not needed for prediction
    return {
        "State_Name": state,
        "District_Name": district,
        "Crop_Year": year,
        "Season": season,
        "Crop": crop,
        "Area": area
    }

def main():
    parser = argparse.ArgumentParser(description="Crop Yield Prediction CLI")
    parser.add_argument('--batch', type=str, help="Path to CSV file for batch prediction")
    args = parser.parse_args()

    model_choice = get_model_choice()
    model = CropYieldModel(model_type=model_choice)
    model.load_model()

    if args.batch:
        df = pd.read_csv(args.batch)
        preds = model.predict(df)
        for i, pred in enumerate(preds):
            result = "HIGH" if pred == 1 else "LESS"
            print(f"Sample {i+1}: Predicted Crop Yield will be {result}")
    else:
        sample = input_sample()
        try:
            pred = model.predict_single(sample)
            result = "HIGH" if pred == 1 else "LESS"
            print(f"\nPrediction: Crop Yield will be {result}")
        except Exception as e:
            print(f"Error in prediction: {e}")

if __name__ == "__main__":
    main()
