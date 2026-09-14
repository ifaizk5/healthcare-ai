import os
import pandas as pd
import numpy as np
from app.services.data_pipeline import HealthcareDataPipeline
from app.services.feature_engineering import HealthcareFeatureEngineer

def test_dataset_validation():
    df = pd.DataFrame({
        "age": [50, 60, 45, 70],
        "sex": [1, 0, 1, 0],
        "target": [1, 0, 1, 0]
    })
    val = HealthcareDataPipeline.validate_dataset(df, target_column="target")
    assert val["is_valid"] is True
    assert val["row_count"] == 4
    assert val["column_count"] == 3

def test_data_leakage_prevention():
    """
    PRD Section 15 — Verify scaler is fit ONLY on training set.
    """
    df = pd.DataFrame({
        "age": np.random.randint(30, 80, 100),
        "chol": np.random.randint(150, 300, 100),
        "target": np.random.choice([0, 1], 100)
    })
    
    splits, scaler, feature_names = HealthcareDataPipeline.split_and_transform_without_leakage(
        df, target_column="target", test_size=0.15, val_size=0.15, random_state=42
    )

    # Check scaled train mean is close to 0 (since it was fit on train)
    train_mean = np.abs(splits["X_train"].mean(axis=0))
    assert np.all(train_mean < 0.2)

    # Check test and validation set shapes sum to total dataset size (100)
    assert len(splits["y_train"]) + len(splits["y_val"]) + len(splits["y_test"]) == 100
    assert len(splits["y_test"]) in [14, 15, 16]
    assert len(splits["y_val"]) in [14, 15, 16]
