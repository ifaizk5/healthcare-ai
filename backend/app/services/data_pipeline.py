import os
import hashlib
import numpy as np
import pandas as pd
import polars as pl
from typing import Dict, Any, Tuple, List
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder

class HealthcareDataPipeline:
    """
    Healthcare Data Pipeline with pandas & Polars processing, dataset validation,
    strict data leakage prevention, and reproducible feature engineering.
    """

    @staticmethod
    def compute_file_hash(file_path: str) -> str:
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        return hasher.hexdigest()

    @staticmethod
    def load_dataset(file_path: str) -> pd.DataFrame:
        if file_path.endswith(".csv"):
            return pd.read_csv(file_path)
        elif file_path.endswith(".parquet"):
            return pd.read_parquet(file_path)
        else:
            raise ValueError("Unsupported file format. Only CSV and Parquet are supported.")

    @staticmethod
    def validate_dataset(df: pd.DataFrame, target_column: str = None) -> Dict[str, Any]:
        """
        Validation engine required by PRD Section 10:
        Detects missing values, duplicate rows, invalid types, constant columns,
        potential ID columns, and class imbalance.
        """
        row_count, col_count = df.shape
        missing_per_col = df.isnull().sum().to_dict()
        duplicate_rows = int(df.duplicated().sum())
        
        column_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
        constant_columns = [col for col in df.columns if df[col].nunique() <= 1]
        
        # Detect potential ID columns (e.g., unique values equal to row count)
        potential_id_cols = [
            col for col in df.columns 
            if df[col].nunique() == row_count and df[col].dtype in ['int64', 'object']
        ]

        class_imbalance = None
        target_valid = True
        validation_message = "Dataset passed validation."

        if target_column:
            if target_column not in df.columns:
                target_valid = False
                validation_message = f"Target column '{target_column}' not found in dataset."
            else:
                value_counts = df[target_column].value_counts().to_dict()
                total = len(df)
                class_imbalance = {str(k): {"count": int(v), "ratio": round(v / total, 4)} for k, v in value_counts.items()}
                if len(value_counts) <= 1:
                    target_valid = False
                    validation_message = f"Target column '{target_column}' contains only 1 class."

        is_valid = target_valid and (duplicate_rows < row_count * 0.9)

        return {
            "is_valid": is_valid,
            "validation_message": validation_message,
            "row_count": row_count,
            "column_count": col_count,
            "missing_values": missing_per_col,
            "duplicate_rows": duplicate_rows,
            "column_types": column_types,
            "constant_columns": constant_columns,
            "potential_id_columns": potential_id_cols,
            "class_imbalance": class_imbalance
        }

    @staticmethod
    def polars_preprocess(df_pd: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Uses Polars for fast high-throughput transformation, filtering, and aggregation
        as specified in PRD Section 12.
        """
        pl_df = pl.from_pandas(df_pd)

        # Polars cleaning: Drop duplicate rows & fill missing numeric nulls with median
        numeric_cols = [col for col, dtype in zip(pl_df.columns, pl_df.dtypes) if dtype in [pl.Float64, pl.Float32, pl.Int64, pl.Int32]]
        
        # Polars transformations
        exprs = []
        for col in numeric_cols:
            exprs.append(pl.col(col).fill_null(pl.col(col).median()))
            
        pl_cleaned = pl_df.with_columns(exprs).unique()
        
        # Convert back to pandas for scikit-learn / PyTorch / TF interoperability
        cleaned_pd = pl_cleaned.to_pandas()
        
        polars_meta = {
            "processed_by": "Polars Engine",
            "original_rows": len(df_pd),
            "cleaned_rows": len(cleaned_pd),
            "numeric_imputed_columns": numeric_cols
        }
        
        return cleaned_pd, polars_meta

    @staticmethod
    def split_and_transform_without_leakage(
        df: pd.DataFrame, 
        target_column: str,
        test_size: float = 0.15,
        val_size: float = 0.15,
        random_state: int = 42
    ) -> Tuple[Dict[str, np.ndarray], Any, List[str]]:
        """
        PRD Section 15 — Hard Requirement: Data Leakage Prevention.
        Scaler/Encoder is fitted ONLY on training split X_train.
        Validation and Test sets are transformed using X_train parameters.
        Stratified 70/15/15 default split.
        """
        X = df.drop(columns=[target_column])
        y = df[target_column].values

        # Ensure all columns in X are numeric
        X_encoded = pd.get_dummies(X, drop_first=True)
        feature_names = list(X_encoded.columns)

        # First split: train + val vs test (85% vs 15%)
        X_train_val, X_test, y_train_val, y_test = train_test_split(
            X_encoded, y, test_size=test_size, random_state=random_state, stratify=y
        )

        # Second split: train vs val (70% vs 15% overall)
        relative_val_size = val_size / (1.0 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_train_val, y_train_val, test_size=relative_val_size, random_state=random_state, stratify=y_train_val
        )

        # STAGE 2: PREPROCESSING / SCALING FIT ONLY ON X_train
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        
        # Transform val and test using fitted scaler (no leakage!)
        X_val_scaled = scaler.transform(X_val)
        X_test_scaled = scaler.transform(X_test)

        splits = {
            "X_train": X_train_scaled,
            "y_train": y_train,
            "X_val": X_val_scaled,
            "y_val": y_val,
            "X_test": X_test_scaled,
            "y_test": y_test,
            "X_train_raw": X_train,
            "X_test_raw": X_test
        }

        return splits, scaler, feature_names
