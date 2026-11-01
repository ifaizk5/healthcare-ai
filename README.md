# HealthLens — Healthcare AI/ML Engineering & Inference Platform

**HealthLens** is an end-to-end healthcare AI experimentation and inference platform demonstrating production-oriented Machine Learning Engineering capabilities across data engineering, classical ML, deep learning, clinical NLP, model evaluation, SHAP explainability, FastAPI APIs, PostgreSQL database, MLflow tracking, and a React + TypeScript frontend interface.

> **DISCLAIMER:** HealthLens is an educational and research demonstration platform. It is not a medical diagnostic system and must not be used to make clinical decisions.

---

## 🚀 Key Features

### 1. Data Engineering & Validation Engine (pandas + Polars)
- Supports **CSV** and **Parquet** structured uploads up to 100MB.
- **Validation Engine**: Automatically detects missing columns, duplicate rows, data types, constant columns, potential ID columns, and class imbalance.
- **Data Engine**: Uses `pandas` for exploratory data analysis (EDA) and summary statistics; uses `Polars` for fast multi-threaded data cleaning, filtering, and missing value imputation.
- **Data Leakage Prevention**: Enforces strict train/val/test splits (70% train / 15% validation / 15% test, stratified split with configurable seed `42`). Preprocessing scalers and encoders are fitted strictly on `X_train` and transformed on validation/testing sets.

### 2. Machine Learning Engine (5 Algorithm Families)
Supports configuration-driven training across 5 model families:
1. **Logistic Regression** (scikit-learn)
2. **Random Forest Classifier** (scikit-learn)
3. **Gradient Boosted Trees** (XGBoost)
4. **Feed-Forward Neural Network** (PyTorch MLP)
5. **Feed-Forward Neural Network** (TensorFlow / Keras equivalent)

Hyperparameters are driven by YAML configurations in `configs/`.

### 3. Healthcare Evaluation & Benchmarking
- **Mandatory Metrics**: Accuracy, Precision, Recall / Sensitivity, F1-Score, ROC-AUC, PR-AUC, Confusion Matrix, and Inference Latency (ms).
- **Error Analysis**: True Positive (TP), True Negative (TN), False Positive (FP), and False Negative (FN) slice extractions.
- **Decision Threshold Optimization**: Configurable classification threshold slider (0.10 to 0.90) with recall prioritization for risk sensitivity.

### 4. SHAP Explainability & Feature Attribution
- Explains patient-level risk predictions using **SHAP (SHapley Additive exPlanations)**.
- Quantifies exact feature contributions (+ / - risk score impact) for model transparency.

### 5. Clinical NLP Engine (Hugging Face Transformers)
- **Named Entity Recognition (NER)**: Extracts Medications, Symptoms, Conditions, Procedures, and Lab Results.
- **Clinical Text Classification**: Classifies note acuity and urgency.
- **Cosine Semantic Search**: Vector embeddings search over clinical discharge summaries.
- **Structured Note Summarization**: Auto-extracts Symptoms, Conditions, Medications, and Investigations.

### 6. MLOps & Model Registry
- **MLflow Integration**: Logs hyperparameters, evaluation metrics, confusion matrices, and model artifacts.
- **Model Registry Lifecycle**: Managed model states (`EXPERIMENTAL`, `VALIDATED`, `PRODUCTION`, `ARCHIVED`).
- **Complete Model Artifact Packaging**: Saves fitted preprocessing scaler + trained model + schema metadata together to prevent inference-time feature mismatch.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Lucide React, Vanilla CSS Design System.
- **Backend API**: Python 3.11/3.14, FastAPI, Pydantic v2, Uvicorn.
- **Data Processing**: Polars, pandas, NumPy.
- **Machine Learning & DL**: scikit-learn, XGBoost, PyTorch, Hugging Face Transformers, SHAP.
- **Database & Storage**: PostgreSQL (SQLAlchemy ORM), SQLite fallback, MLflow.
- **Containerization**: Docker Compose (Frontend, Backend, PostgreSQL, MLflow).

---

## 📊 Datasets

Both datasets are public, de-identified and free. Data files are gitignored, so build them once with:

```bash
py scripts/prepare_datasets.py      # downloads to data/raw/, writes sample_data/
```

| Dataset | Used for | Prepared file | Size |
|---|---|---|---|
| [Diabetes 130-US Hospitals (1999–2008)](https://archive.ics.uci.edu/dataset/296) — UCI #296, CC BY 4.0 | Primary target: **30-day readmission** (`readmitted_30d`) | `sample_data/diabetes_readmission.csv` | 69,970 patients × 29 features, 9.0% positive |
| [MTSamples medical transcriptions](https://www.kaggle.com/datasets/tboyle10/medicaltranscriptions) — CC0 | NLP: specialty classifier (TF-IDF + LR, 16 specialties) and semantic search | `sample_data/mtsamples_notes.csv` | 4,966 notes |

Readmission preprocessing: one encounter per patient (avoids patient leakage across splits), excludes deaths/hospice discharges, buckets age to midpoints, encodes labs/meds numerically, and groups the primary ICD-9 diagnosis (Strack et al., 2014). Models use `class_weight: balanced` because of the 9% positive rate.

Baseline test-set results (threshold 0.5): ROC-AUC ≈ 0.62 for LR/RF/XGBoost/PyTorch, recall 0.52–0.62. The MTSamples specialty classifier reaches 56% accuracy and 0.57 macro-F1 across 16 classes.

---

## 💻 Quick Start & Running Locally

### Option 1: Development Servers (Python & Node)

#### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Build the datasets (once, from the project root)
py ../scripts/prepare_datasets.py

# Start FastAPI server (seeds the readmission dataset & trains baseline models on first start)
uvicorn app.main:app --reload --port 8000
```
Open API docs at: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open application at: [http://localhost:5173](http://localhost:5173)

---

### Option 2: Docker Compose Setup

Run the entire platform (PostgreSQL + MLflow + FastAPI + React) in one command:
```bash
docker compose up --build
```

---

## 🧪 Automated Testing

Run unit tests for data leakage prevention, validation engine, and model evaluation:
```bash
cd backend
pytest -v
```

---

## 🔑 Demo Login Credentials

- **Admin MLE**: `admin@healthlens.ai` / `AdminSecret123!`
- **Demo User**: `demo@healthlens.ai` / `DemoUser123!`
