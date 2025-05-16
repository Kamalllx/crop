import numpy as np
import pandas as pd
import os
import pickle
from tensorflow.keras.models import model_from_json
from sklearn.preprocessing import LabelEncoder, StandardScaler

class CropYieldModel:
    def __init__(self, model_type, model_dir="model", dataset_path="dataset/Agriculture In India.csv"):
        self.model_type = model_type.lower()
        self.model_dir = model_dir
        self.dataset_path = dataset_path
        self.le_state = LabelEncoder()
        self.le_district = LabelEncoder()
        self.le_season = LabelEncoder()
        self.le_crop = LabelEncoder()
        self.scaler = StandardScaler()
        self.model = None
        self.input_shape = None
        self._prepare_encoders_and_scaler()

    def _prepare_encoders_and_scaler(self):
        # Fit encoders and scaler on the full dataset
        df = pd.read_csv(self.dataset_path)
        df.fillna(0, inplace=True)
        df['Production'] = df['Production'].astype(np.int64)
        df['State_Name'] = self.le_state.fit_transform(df['State_Name'])
        df['District_Name'] = self.le_district.fit_transform(df['District_Name'])
        df['Season'] = self.le_season.fit_transform(df['Season'])
        df['Crop'] = self.le_crop.fit_transform(df['Crop'])
        X = df.drop('Production', axis=1).values
        self.scaler.fit(X)
        self.input_shape = X.shape[1]

    def load_model(self):
        json_path = os.path.join(self.model_dir, f"{self.model_type}model.json")
        weights_path = os.path.join(self.model_dir, f"{self.model_type}model_weights.h5")
        
        # Handle model loading with compatibility for older Keras models
        try:
            # First attempt: try direct loading
            with open(json_path, "r") as f:
                model_json = f.read()
            self.model = model_from_json(model_json)
            self.model.load_weights(weights_path)
        except TypeError as e:
            # If direct loading fails, try rebuilding the model based on model type
            print(f"Warning: Could not load model directly. Rebuilding model architecture...")
            
            if self.model_type == "lstm":
                from tensorflow.keras.models import Sequential
                from tensorflow.keras.layers import LSTM, Dense, Dropout
                
                # Recreate the LSTM model architecture
                self.model = Sequential()
                self.model.add(LSTM(512, input_shape=(self.input_shape, 1)))
                self.model.add(Dropout(0.5))
                self.model.add(Dense(256, activation='relu'))
                self.model.add(Dense(2, activation='softmax'))
                
            elif self.model_type == "rnn":
                from tensorflow.keras.models import Sequential
                from tensorflow.keras.layers import Dense
                
                # Recreate the RNN model architecture
                self.model = Sequential()
                self.model.add(Dense(256, input_dim=self.input_shape, activation='relu'))
                self.model.add(Dense(128, activation='relu'))
                self.model.add(Dense(2, activation='softmax'))
                
            elif self.model_type == "ff":
                from tensorflow.keras.models import Sequential
                from tensorflow.keras.layers import Dense
                
                # Recreate the Feedforward model architecture
                self.model = Sequential()
                self.model.add(Dense(64, activation='relu', input_shape=(self.input_shape,)))
                self.model.add(Dense(64, activation='relu'))
                self.model.add(Dense(2, activation='softmax'))
            
            else:
                raise ValueError(f"Unknown model type: {self.model_type}")
            
            # Load weights into the rebuilt model
            self.model.load_weights(weights_path)

    def preprocess_input(self, df):
        # Assumes columns: State_Name, District_Name, Crop_Year, Season, Crop, Area, Production (Production can be missing)
        df = df.copy()
        df['State_Name'] = self.le_state.transform(df['State_Name'])
        df['District_Name'] = self.le_district.transform(df['District_Name'])
        df['Season'] = self.le_season.transform(df['Season'])
        df['Crop'] = self.le_crop.transform(df['Crop'])
        X = df.drop(columns=['Production'], errors='ignore').values
        X = self.scaler.transform(X)
        if self.model_type == "lstm":
            X = X.reshape((X.shape[0], X.shape[1], 1))
        return X

    def predict(self, df):
        X = self.preprocess_input(df)
        preds = self.model.predict(X)
        return np.argmax(preds, axis=1)  # 0: LESS, 1: HIGH

    def predict_single(self, input_dict):
        df = pd.DataFrame([input_dict])
        return self.predict(df)[0]
