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

## 💻 Quick Start & Running Locally

### Option 1: Development Servers (Python & Node)

#### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (Runs database startup seeder with sample heart disease dataset & initial trained models)
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
