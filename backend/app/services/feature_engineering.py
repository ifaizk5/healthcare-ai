import numpy as np
import pandas as pd

class HealthcareFeatureEngineer:
    """
    Reproducible Feature Engineering module required by PRD Section 14.
    Engineers domain-specific healthcare features.
    """

    @staticmethod
    def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
        df_out = df.copy()

        # 1. Age categorization
        if "age" in df_out.columns:
            df_out["age_group_middle"] = ((df_out["age"] >= 40) & (df_out["age"] <= 60)).astype(int)
            df_out["age_group_senior"] = (df_out["age"] > 60).astype(int)

        # 2. Cholesterol to Age Ratio
        if "chol" in df_out.columns and "age" in df_out.columns:
            df_out["chol_age_ratio"] = df_out["chol"] / (df_out["age"] + 1e-5)

        # 3. Laboratory Abnormality Indicator
        if "trestbps" in df_out.columns and "chol" in df_out.columns:
            df_out["lab_abnormal_indicator"] = (
                (df_out["trestbps"] > 140) | (df_out["chol"] > 240)
            ).astype(int)

        # 4. Heart Rate Reserve Ratio (Max Heart Rate vs 220 - Age)
        if "thalach" in df_out.columns and "age" in df_out.columns:
            expected_max_hr = 220 - df_out["age"]
            df_out["hr_reserve_ratio"] = df_out["thalach"] / (expected_max_hr + 1e-5)

        return df_out
