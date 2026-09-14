import time
import numpy as np
from typing import Dict, Any, List
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, precision_recall_curve, roc_curve, auc, confusion_matrix
)
from app.services.ml_engine import ModelTrainerEngine

class ModelEvaluationService:
    """
    Healthcare-oriented ML Model Evaluation Engine.
    Computes all mandatory metrics, ROC/PR curves, confusion matrix,
    latency benchmarking, and error analysis slices.
    """

    @classmethod
    def evaluate_model(
        cls, 
        model: Any, 
        model_type: str, 
        X_test: np.ndarray, 
        y_test: np.ndarray,
        threshold: float = 0.50
    ) -> Dict[str, Any]:
        
        # Benchmark latency
        start_time = time.time()
        probs = ModelTrainerEngine.predict_proba(model, model_type, X_test)
        latency_ms = round((time.time() - start_time) * 1000, 2)

        preds = (probs >= threshold).astype(int)

        # Basic Metrics
        acc = float(accuracy_score(y_test, preds))
        prec = float(precision_score(y_test, preds, zero_division=0))
        rec = float(recall_score(y_test, preds, zero_division=0))
        f1 = float(f1_score(y_test, preds, zero_division=0))

        # AUC Metrics
        try:
            roc_auc = float(roc_auc_score(y_test, probs))
        except Exception:
            roc_auc = 0.0

        p_vals, r_vals, _ = precision_recall_curve(y_test, probs)
        pr_auc = float(auc(r_vals, p_vals))

        # Confusion Matrix
        cm = confusion_matrix(y_test, preds)
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)

        # ROC Curve Points (subsampled for clean API JSON response)
        fpr, tpr, _ = roc_curve(y_test, probs)
        roc_points = [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)} for f, t in zip(fpr[::max(1, len(fpr)//50)], tpr[::max(1, len(tpr)//50)])]

        # PR Curve Points
        pr_points = [{"precision": round(float(p), 4), "recall": round(float(r), 4)} for p, r in zip(p_vals[::max(1, len(p_vals)//50)], r_vals[::max(1, len(r_vals)//50)])]

        # PRD Section 28 Error Analysis Breakdown
        tp_indices = np.where((y_test == 1) & (preds == 1))[0].tolist()
        tn_indices = np.where((y_test == 0) & (preds == 0))[0].tolist()
        fp_indices = np.where((y_test == 0) & (preds == 1))[0].tolist()
        fn_indices = np.where((y_test == 1) & (preds == 0))[0].tolist()

        return {
            "metrics": {
                "accuracy": round(acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "roc_auc": round(roc_auc, 4),
                "pr_auc": round(pr_auc, 4),
                "latency_ms": latency_ms,
                "threshold_used": threshold
            },
            "confusion_matrix": {
                "tp": int(tp),
                "fp": int(fp),
                "tn": int(tn),
                "fn": int(fn)
            },
            "curves": {
                "roc": roc_points,
                "pr": pr_points
            },
            "error_analysis": {
                "tp_count": len(tp_indices),
                "tn_count": len(tn_indices),
                "fp_count": len(fp_indices),
                "fn_count": len(fn_indices),
                "sample_fp_indices": fp_indices[:5],
                "sample_fn_indices": fn_indices[:5]
            }
        }
