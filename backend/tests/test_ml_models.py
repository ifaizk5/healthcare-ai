import numpy as np
import pandas as pd
from app.services.data_pipeline import HealthcareDataPipeline
from app.services.ml_engine import ModelTrainerEngine
from app.services.evaluation_service import ModelEvaluationService

def test_classical_and_dl_training():
    df = pd.DataFrame({
        "age": [63, 37, 41, 56, 57, 57, 56, 44, 52, 57, 54, 48, 49, 64, 58, 50, 58, 66, 43, 69],
        "chol": [233, 250, 204, 236, 354, 192, 294, 263, 199, 168, 239, 275, 266, 211, 283, 219, 240, 226, 247, 239],
        "target": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    })

    splits, scaler, feature_names = HealthcareDataPipeline.split_and_transform_without_leakage(
        df, target_column="target", test_size=0.2, val_size=0.2, random_state=42
    )

    # Test Random Forest
    rf_model, duration = ModelTrainerEngine.train_model("random_forest", {"model": {"n_estimators": 10}}, splits)
    rf_eval = ModelEvaluationService.evaluate_model(rf_model, "random_forest", splits["X_test"], splits["y_test"])
    assert "roc_auc" in rf_eval["metrics"]
    assert "recall" in rf_eval["metrics"]

    # Test Logistic Regression
    lr_model, _ = ModelTrainerEngine.train_model("logistic_regression", {"model": {"max_iter": 100}}, splits)
    lr_eval = ModelEvaluationService.evaluate_model(lr_model, "logistic_regression", splits["X_test"], splits["y_test"])
    assert "accuracy" in lr_eval["metrics"]

    # Test PyTorch NN
    pt_model, _ = ModelTrainerEngine.train_model("pytorch_nn", {"model": {"epochs": 5, "batch_size": 4}}, splits)
    pt_eval = ModelEvaluationService.evaluate_model(pt_model, "pytorch_nn", splits["X_test"], splits["y_test"])
    assert pt_eval["metrics"]["accuracy"] >= 0.0
