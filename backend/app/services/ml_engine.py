import os
import time
import pickle
import yaml
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

try:
    import tensorflow as tf
except ImportError:
    tf = None


class PyTorchMLP(nn.Module):
    def __init__(self, input_dim: int, hidden_layers: list = [64, 32], dropout_rate: float = 0.2):
        super(PyTorchMLP, self).__init__()
        layers = []
        in_dim = input_dim
        for h_dim in hidden_layers:
            layers.append(nn.Linear(in_dim, h_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout_rate))
            in_dim = h_dim
        layers.append(nn.Linear(in_dim, 1))
        layers.append(nn.Sigmoid())
        self.model = nn.Sequential(*layers)

    def forward(self, x):
        return self.model(x)


class ModelTrainerEngine:
    """
    Unified ML/DL Training Engine supporting 5 model families:
    1. Logistic Regression
    2. Random Forest
    3. XGBoost
    4. PyTorch Feed-Forward Neural Network
    5. TensorFlow Feed-Forward Neural Network
    """

    @staticmethod
    def load_config(config_path: str) -> Dict[str, Any]:
        with open(config_path, "r") as f:
            return yaml.safe_load(f)

    @classmethod
    def train_model(
        cls, 
        model_type: str, 
        config: Dict[str, Any], 
        splits: Dict[str, np.ndarray]
    ) -> Tuple[Any, float]:
        X_train, y_train = splits["X_train"], splits["y_train"]
        X_val, y_val = splits["X_val"], splits["y_val"]

        start_time = time.time()

        if model_type == "logistic_regression":
            params = config.get("model", {})
            model = LogisticRegression(
                C=params.get("C", 1.0),
                penalty=params.get("penalty", "l2"),
                solver=params.get("solver", "lbfgs"),
                max_iter=params.get("max_iter", 1000),
                random_state=params.get("random_state", 42)
            )
            model.fit(X_train, y_train)

        elif model_type == "random_forest":
            params = config.get("model", {})
            model = RandomForestClassifier(
                n_estimators=params.get("n_estimators", 100),
                max_depth=params.get("max_depth", 10),
                min_samples_split=params.get("min_samples_split", 2),
                random_state=params.get("random_state", 42)
            )
            model.fit(X_train, y_train)

        elif model_type == "xgboost":
            params = config.get("model", {})
            model = xgb.XGBClassifier(
                n_estimators=params.get("n_estimators", 100),
                max_depth=params.get("max_depth", 6),
                learning_rate=params.get("learning_rate", 0.05),
                subsample=params.get("subsample", 0.8),
                random_state=params.get("random_state", 42),
                eval_metric="logloss"
            )
            model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

        elif model_type == "pytorch_nn":
            params = config.get("model", {})
            input_dim = X_train.shape[1]
            hidden_layers = params.get("hidden_layers", [64, 32])
            dropout_rate = params.get("dropout_rate", 0.2)
            lr = params.get("learning_rate", 0.001)
            batch_size = params.get("batch_size", 16)
            epochs = params.get("epochs", 30)

            pytorch_net = PyTorchMLP(input_dim=input_dim, hidden_layers=hidden_layers, dropout_rate=dropout_rate)
            criterion = nn.BCELoss()
            optimizer = optim.Adam(pytorch_net.parameters(), lr=lr)

            X_tensor = torch.tensor(X_train, dtype=torch.float32)
            y_tensor = torch.tensor(y_train, dtype=torch.float32).unsqueeze(1)
            dataset = TensorDataset(X_tensor, y_tensor)
            dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

            pytorch_net.train()
            for epoch in range(epochs):
                for batch_x, batch_y in dataloader:
                    optimizer.zero_grad()
                    outputs = pytorch_net(batch_x)
                    loss = criterion(outputs, batch_y)
                    loss.backward()
                    optimizer.step()

            pytorch_net.eval()
            model = pytorch_net

        elif model_type == "tf_nn":
            if tf is None:
                # If TensorFlow is not installed on Python 3.14, train PyTorch NN as equivalent feed-forward model
                return cls.train_model("pytorch_nn", config, splits)

            params = config.get("model", {})

            input_dim = X_train.shape[1]
            hidden_layers = params.get("hidden_layers", [64, 32])
            dropout_rate = params.get("dropout_rate", 0.2)
            lr = params.get("learning_rate", 0.001)
            batch_size = params.get("batch_size", 16)
            epochs = params.get("epochs", 30)

            tf_model = tf.keras.Sequential()
            tf_model.add(tf.keras.layers.Input(shape=(input_dim,)))
            for h_dim in hidden_layers:
                tf_model.add(tf.keras.layers.Dense(h_dim, activation='relu'))
                tf_model.add(tf.keras.layers.Dropout(dropout_rate))
            tf_model.add(tf.keras.layers.Dense(1, activation='sigmoid'))

            tf_model.compile(
                optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
                loss='binary_crossentropy',
                metrics=['accuracy']
            )

            tf_model.fit(
                X_train, y_train,
                validation_data=(X_val, y_val),
                batch_size=batch_size,
                epochs=epochs,
                verbose=0
            )
            model = tf_model

        else:
            raise ValueError(f"Unknown model type: {model_type}")

        training_duration = round(time.time() - start_time, 4)
        return model, training_duration

    @classmethod
    def predict_proba(cls, model: Any, model_type: str, X: np.ndarray) -> np.ndarray:
        if model_type in ["logistic_regression", "random_forest", "xgboost"]:
            return model.predict_proba(X)[:, 1]
        elif model_type == "pytorch_nn":
            model.eval()
            with torch.no_grad():
                X_tensor = torch.tensor(X, dtype=torch.float32)
                probs = model(X_tensor).numpy().flatten()
            return probs
        elif model_type == "tf_nn":
            probs = model.predict(X, verbose=0).flatten()
            return probs
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
