# Product Requirements Document — HealthLens

**Product:** HealthLens
**Type:** End-to-End Healthcare AI/ML Engineering Platform
**Version:** 1.0
**Status:** Development Specification
**Primary Goal:** Demonstrate production-oriented Machine Learning Engineering capabilities across data engineering, classical ML, deep learning, NLP, model evaluation, explainability, APIs, databases, and frontend integration.

---

# 1. Product Definition

## 1.1 Product Summary

HealthLens is a web-based healthcare AI experimentation and inference platform that allows authorized users to:

1. Upload and validate structured healthcare datasets.
2. Explore and preprocess healthcare data.
3. Engineer machine-learning features.
4. Train and evaluate multiple ML/DL models.
5. Compare models using standardized metrics.
6. Generate patient-level risk predictions.
7. Explain predictions using feature attribution.
8. Analyze clinical text using transformer-based NLP.
9. Track experiments and model versions.
10. Expose trained models through production-style APIs.
11. Interact with all functionality through a professional web interface.

HealthLens is a **research/educational system**, not a medical diagnostic product.

---

# 2. Problem Statement

Healthcare datasets are complex, heterogeneous, and frequently contain:

* Missing values
* Imbalanced classes
* Numerical and categorical variables
* High-dimensional features
* Clinical text
* Multiple possible prediction targets

A machine-learning engineer must therefore understand more than model training.

They must be able to:

> **ingest → clean → transform → engineer → train → evaluate → compare → explain → deploy → monitor**

HealthLens will demonstrate this complete workflow in one cohesive system.

---

# 3. Primary Objective

The project must demonstrate competency in:

### Required

* Python
* NumPy
* pandas
* Polars
* SQL
* scikit-learn
* PyTorch
* TensorFlow
* Hugging Face
* Git
* ML evaluation
* Feature engineering
* Basic UI/UX
* REST APIs

### Secondary

* FastAPI
* PostgreSQL
* Docker
* MLflow
* SHAP
* CI/CD
* Model versioning
* Automated testing

---

# 4. Non-Goals

The following are explicitly **out of scope for v1**.

### ❌ Real patient data

Only public, de-identified datasets or synthetic data may be used.

### ❌ Medical diagnosis

The system must never claim:

> "You have disease X."

It may say:

> "The model predicts a high probability of the target outcome."

### ❌ Real clinical deployment

The platform is not intended for use by hospitals or physicians.

### ❌ Medical advice

The system does not provide treatment recommendations.

### ❌ Full-scale LLM chatbot

A generic ChatGPT clone is not part of the product.

### ❌ Mobile application

Web only.

### ❌ Multiple unrelated healthcare problems

The core ML problem must remain focused.

---

# 5. Core Use Case

## Patient Risk Prediction

The primary ML task is:

> **Predict whether a patient belongs to a predefined healthcare risk/outcome class based on structured clinical features.**

The exact target must be determined from the selected public dataset.

The project must use **one primary prediction target** throughout the platform.

Example:

```text
Input patient data
        ↓
Preprocessing
        ↓
Feature engineering
        ↓
ML model
        ↓
Probability
        ↓
Risk classification
        ↓
Explanation
```

---

# 6. Secondary Use Case

## Clinical Text Analysis

Users can submit clinical text and receive:

* Text classification
* Extracted entities
* Embeddings
* Semantic similarity/search

Example:

```text
Clinical note
     ↓
Tokenizer
     ↓
Transformer
     ↓
NLP model
     ↓
Prediction + entities
```

This module exists specifically to demonstrate **Hugging Face + NLP/LLM workflows**.

---

# 7. Target Users

## 7.1 ML Engineer

Primary user.

Needs to:

* Upload data
* Train models
* Compare models
* inspect metrics
* inspect errors
* deploy models

## 7.2 Researcher

Needs to:

* Run experiments
* Compare algorithms
* inspect datasets
* track experiments
* export results

## 7.3 Demonstration User

Needs to:

* Enter sample patient information
* generate prediction
* understand the result
* inspect model explanation

---

# 8. System Modules

HealthLens v1 consists of **eight mandatory modules**.

```text
1. Authentication
2. Dataset Management
3. Data Processing
4. Model Training
5. Model Evaluation
6. Prediction & Explainability
7. Clinical NLP
8. Experiment/Model Registry
```

---

# 9. Module 1 — Authentication

## Requirements

The application must support:

* Registration
* Login
* Logout
* Password hashing
* JWT authentication
* Protected API routes

### Roles

Only two roles are required:

```text
ADMIN
USER
```

### Acceptance Criteria

* Unauthenticated users cannot access protected endpoints.
* Passwords must never be stored in plaintext.
* JWT expiration must be implemented.
* Role-protected endpoints must reject unauthorized users.

---

# 10. Module 2 — Dataset Management

Users must be able to:

### Upload

Supported:

```text
CSV
Parquet
```

Maximum initial upload size:

**100 MB**

### Dataset metadata

The system must store:

* Dataset name
* Description
* File format
* Row count
* Column count
* Upload date
* Owner
* Target column
* Processing status

### Dataset validation

The system must detect:

* Missing columns
* Duplicate rows
* Missing values
* Invalid data types
* Constant columns
* Potential ID columns
* Class imbalance

### Acceptance Criteria

A dataset cannot enter model training unless validation succeeds.

---

# 11. Module 3 — Data Processing Pipeline

The pipeline must follow:

```text
Raw Dataset
    ↓
Validation
    ↓
Cleaning
    ↓
Type Conversion
    ↓
Missing Value Handling
    ↓
Categorical Encoding
    ↓
Numerical Scaling
    ↓
Feature Engineering
    ↓
Train / Validation / Test Split
```

---

# 12. pandas + Polars Requirement

Both must have meaningful usage.

### pandas

Used for:

* Exploratory analysis
* statistical summaries
* visualization preparation

### Polars

Used for:

* large-data transformations
* filtering
* aggregation
* preprocessing

The project documentation must explicitly explain why each was selected.

---

# 13. NumPy Requirement

NumPy must be used for:

* numerical transformations
* array operations
* model input preparation
* statistical calculations where appropriate

Do not add artificial NumPy operations simply to satisfy the technology requirement.

---

# 14. Feature Engineering

The system must support reusable feature transformations.

Examples:

```text
Age normalization
BMI categories
Admission frequency
Length-of-stay groups
Comorbidity count
Laboratory abnormality indicators
Medication count
```

Feature engineering must be reproducible.

The same preprocessing pipeline must be applied during:

```text
Training
Validation
Testing
Inference
```

---

# 15. Data Leakage Prevention

This is a **hard requirement**.

The system must ensure that:

> Test-set information must never influence training or feature preprocessing.

For example:

❌ Fit scaler on entire dataset.

Correct:

```text
Training data
     ↓
fit scaler
     ↓
Validation/Test
     ↓
transform only
```

The README must document the leakage-prevention strategy.

---

# 16. Dataset Splitting

Default:

```text
Training:   70%
Validation: 15%
Testing:    15%
```

For classification:

**Stratified splitting is mandatory.**

Random seed must be configurable but default to:

```text
42
```

---

# 17. Module 4 — Model Training

HealthLens must implement at least **four model families**.

## Classical ML

### Model 1

Logistic Regression

### Model 2

Random Forest

### Model 3

Gradient Boosting / XGBoost

---

# 18. Deep Learning

At least two neural-network implementations are required.

### PyTorch

Implement:

```text
Feed-forward neural network
```

### TensorFlow/Keras

Implement:

```text
Equivalent feed-forward neural network
```

Both must solve the same prediction problem.

This enables meaningful benchmarking.

---

# 19. Training Pipeline

Every model must follow a consistent workflow:

```text
Dataset
 ↓
Preprocessing
 ↓
Feature Engineering
 ↓
Train
 ↓
Validation
 ↓
Hyperparameter configuration
 ↓
Final evaluation
 ↓
Model artifact
 ↓
MLflow tracking
```

---

# 20. Hyperparameter Configuration

Hyperparameters must not be hardcoded throughout the source code.

Use configuration files.

Example:

```yaml
model:
  type: random_forest
  n_estimators: 200
  max_depth: 12
  random_state: 42
```

The training system must support changing model configuration without modifying the training code.

---

# 21. Module 5 — Model Evaluation

Every trained model must be evaluated using:

### Mandatory

* Accuracy
* Precision
* Recall
* F1-score
* ROC-AUC
* PR-AUC
* Confusion matrix

### Recommended

* Specificity
* Sensitivity
* Calibration
* Inference latency

---

# 22. Healthcare Evaluation Priority

Accuracy must **not** be treated as the sole optimization target.

The interface must clearly display:

```text
Accuracy
Precision
Recall
F1
ROC-AUC
PR-AUC
```

The system should allow users to select the preferred optimization metric.

For risk prediction, **recall/sensitivity** should receive particular attention where appropriate.

---

# 23. Model Benchmarking

The platform must provide a model comparison page.

Example:

| Model               | Accuracy | Precision | Recall | F1 | ROC-AUC | Latency |
| ------------------- | -------: | --------: | -----: | -: | ------: | ------: |
| Logistic Regression |        — |         — |      — |  — |       — |       — |
| Random Forest       |        — |         — |      — |  — |       — |       — |
| XGBoost             |        — |         — |      — |  — |       — |       — |
| PyTorch NN          |        — |         — |      — |  — |       — |       — |
| TensorFlow NN       |        — |         — |      — |  — |       — |       — |

Users must be able to sort models by metric.

---

# 24. Model Selection

Users must be able to select:

```text
Best ROC-AUC
Best F1
Best Recall
Best Precision
Fastest inference
```

The system must **not automatically declare a model medically superior**.

It should state:

> "Highest value according to selected evaluation metric."

---

# 25. Module 6 — Prediction

Users must have a form for entering patient features.

Example:

```text
Age
Admission Type
Previous Admissions
Length of Stay
Diagnosis Category
Lab Values
Comorbidity Count
...
```

After submission:

```text
Prediction
Probability
Risk Category
Model Used
Model Version
Timestamp
```

Example UI:

```text
Predicted Risk

HIGH

Probability
78.4%

Model
Random Forest v3
```

---

# 26. Prediction Threshold

The classification threshold must be configurable.

Default:

```text
0.50
```

The system must support threshold experimentation.

Example:

```text
Threshold: 0.30

Recall ↑
Precision ↓
```

This demonstrates practical model optimization.

---

# 27. Explainability

Use **SHAP** for supported models.

The prediction screen must show:

```text
Prediction: HIGH RISK

Top contributing features

Previous admissions      +++
Length of stay           ++
Age                      ++
Comorbidity count        +
```

The system must clearly distinguish:

> **Model explanation ≠ medical causation.**

---

# 28. Error Analysis

The evaluation interface must allow users to inspect:

```text
True Positive
True Negative
False Positive
False Negative
```

Users should be able to filter predictions by error category.

This is particularly important for demonstrating actual ML engineering understanding.

---

# 29. Module 7 — Clinical NLP

The NLP module must accept clinical text.

Example:

```text
Patient presents with elevated glucose,
shortness of breath and previous history
of hypertension.
```

---

# 30. NLP Capabilities

The minimum NLP implementation must include:

### Classification

Classify text according to a defined public dataset task.

### Named Entity Recognition

Extract entities such as:

```text
Disease
Medication
Symptom
Procedure
Body Part
```

Where supported by the selected dataset/model.

### Embeddings

Generate vector representations of text.

### Semantic Search

Allow users to search clinical notes based on semantic similarity.

---

# 31. Hugging Face Requirement

The NLP module must use:

**Hugging Face Transformers**

The project must document:

* model used
* tokenizer
* training/fine-tuning approach
* dataset
* evaluation metrics
* limitations

A pretrained model may be fine-tuned rather than training a transformer from scratch.

---

# 32. LLM Component

An LLM feature is optional for v1 but recommended.

If implemented, it should be:

### Clinical note summarization

```text
Clinical note
      ↓
LLM
      ↓
Structured summary
```

Output:

```text
Symptoms:
...

Conditions:
...

Medications:
...

Investigations:
...
```

The system must not generate treatment recommendations.

---

# 33. Module 8 — Experiment Tracking

Use:

**MLflow**

Every training run must record:

### Parameters

```text
learning rate
batch size
epochs
model type
tree count
max depth
etc.
```

### Metrics

```text
accuracy
precision
recall
F1
ROC-AUC
PR-AUC
```

### Artifacts

```text
model
confusion matrix
training curves
feature importance
preprocessing pipeline
```

---

# 34. Model Registry

Each production-ready model must have:

```text
Model Name
Version
Framework
Training Dataset
Metrics
Created At
Status
```

Model states:

```text
EXPERIMENTAL
VALIDATED
PRODUCTION
ARCHIVED
```

Only **VALIDATED** models may be selected for inference.

---

# 35. Database

Use:

**PostgreSQL**

Minimum entities:

```text
users
datasets
dataset_versions
experiments
models
model_versions
predictions
prediction_explanations
nlp_requests
```

---

# 36. SQL Requirement

The backend must use SQL for persistent data access.

Example analytical query:

```text
Average prediction probability by model
Prediction distribution by risk category
Experiment performance history
Dataset statistics
```

Do not use PostgreSQL merely as an authentication database.

---

# 37. Backend

Use:

**FastAPI**

The API must be organized into modules.

Example:

```text
/api/auth
/api/datasets
/api/training
/api/models
/api/predictions
/api/evaluation
/api/nlp
/api/experiments
```

---

# 38. API Documentation

FastAPI's automatically generated OpenAPI documentation must be available.

Every endpoint must contain:

* Request schema
* Response schema
* Error responses
* Authentication requirements
* Description

---

# 39. Asynchronous Training

Model training must **not block normal API requests**.

Minimum implementation:

```text
POST /training/jobs
        ↓
Create training job
        ↓
Background worker
        ↓
Training
        ↓
MLflow
        ↓
Model registry
```

Job states:

```text
QUEUED
RUNNING
COMPLETED
FAILED
CANCELLED
```

---

# 40. Frontend

Use:

**React + TypeScript**

Required pages:

```text
/login
/dashboard
/datasets
/datasets/:id
/experiments
/models
/models/:id
/predict
/nlp
/settings
```

---

# 41. Dashboard

The dashboard must show:

```text
Datasets
Experiments
Models
Predictions
Average performance
Recent training jobs
```

Example:

```text
┌────────────┐ ┌────────────┐ ┌────────────┐
│ Datasets   │ │ Experiments│ │ Models     │
│     8      │ │     24     │ │     17     │
└────────────┘ └────────────┘ └────────────┘

Model Performance
────────────────────────────

ROC-AUC over experiments
```

---

# 42. UI/UX Requirements

The interface must be:

* Professional
* Responsive
* Accessible
* Consistent
* Data-focused

Avoid:

* excessive animations
* unnecessary gradients
* decorative AI graphics
* fake medical imagery
* chatbot-style gimmicks

The UI exists to make the ML system understandable.

---

# 43. Visualization Requirements

Use charts for:

### Dataset

* Class distribution
* Missing values
* Feature distributions

### Models

* ROC curve
* Precision-recall curve
* Confusion matrix
* Feature importance
* SHAP explanation
* Training curves

---

# 44. API Architecture

```text
React
  │
  │ HTTPS
  ▼
FastAPI
  │
  ├── PostgreSQL
  │
  ├── ML Service
  │      ├── sklearn
  │      ├── PyTorch
  │      └── TensorFlow
  │
  ├── NLP Service
  │      └── Hugging Face
  │
  └── MLflow
```

---

# 45. Docker

The entire development environment must be reproducible.

Minimum containers:

```text
frontend
backend
postgres
mlflow
```

Optional:

```text
worker
redis
```

One command should start the system:

```text
docker compose up
```

---

# 46. Testing Requirements

## Backend

Minimum:

* Authentication tests
* Dataset validation tests
* Prediction API tests
* Model API tests

## ML

Minimum:

* preprocessing tests
* feature engineering tests
* inference tests
* metric calculation tests

## Frontend

Minimum:

* login flow
* prediction form
* dataset upload
* model comparison

---

# 47. CI/CD

GitHub Actions must perform:

```text
Push
 ↓
Install dependencies
 ↓
Lint
 ↓
Unit tests
 ↓
Build
 ↓
Docker build
```

Pull requests must fail if required tests fail.

---

# 48. Git Requirements

Repository must use a professional workflow.

Recommended:

```text
main
develop
feature/*
fix/*
```

Commit examples:

```text
feat: add dataset validation pipeline
feat: implement random forest training
feat: add SHAP prediction explanations
fix: prevent preprocessing data leakage
test: add prediction endpoint tests
```

---

# 49. Security Requirements

Minimum:

* Password hashing
* JWT authentication
* Input validation
* File type validation
* File size limits
* SQL injection protection
* CORS configuration
* Environment variables for secrets
* No API keys committed to Git

`.env` must never be committed.

---

# 50. Privacy Requirements

The application must display a persistent disclaimer:

> **HealthLens is an educational and research demonstration. It is not a medical diagnostic system and must not be used to make clinical decisions.**

The project must never require real patient information.

---

# 51. Logging

Backend logs must include:

```text
timestamp
request ID
endpoint
status
execution time
error information
```

Sensitive data must not be written to logs.

---

# 52. Performance Requirements

### API

Normal API responses:

**< 500 ms**

excluding:

* model training
* large file processing
* transformer inference

### Prediction

Structured ML inference:

**< 1 second**

under normal local conditions.

### Dataset processing

The system must display processing duration.

---

# 53. Error Handling

Every API must return structured errors.

Example:

```json
{
  "error": {
    "code": "INVALID_DATASET",
    "message": "Target column contains only one class."
  }
}
```

Frontend must show human-readable errors.

---

# 54. Data Versioning

Every uploaded dataset must receive:

```text
Dataset ID
Version
Hash
Upload timestamp
```

Example:

```text
HeartRisk
v1
v2
v3
```

Models must reference the exact dataset version used for training.

---

# 55. Reproducibility

Every experiment must store:

```text
Dataset version
Model
Hyperparameters
Random seed
Python version
Library versions
Metrics
Training timestamp
```

The goal:

> Another developer should be able to reproduce an experiment from its metadata.

---

# 56. Model Artifact

A trained model must never be stored without its preprocessing pipeline.

Store:

```text
preprocessor
+
model
+
metadata
```

This prevents inference-time feature mismatch.

---

# 57. Audit Trail

The platform must record:

```text
Who trained model
When
Which dataset
Which parameters
Which metrics
Which model version
```

For predictions:

```text
User
Model
Model version
Input schema version
Prediction
Timestamp
```

---

# 58. MVP Definition

The **MVP is NOT the entire project**.

MVP must contain:

### Phase 1

* Authentication
* Dataset upload
* Validation
* pandas/Polars processing
* PostgreSQL
* Logistic Regression
* Random Forest
* Evaluation
* Prediction
* React dashboard

Only after this works should additional ML frameworks be added.

---

# 59. Phase 2

Add:

* XGBoost
* PyTorch
* TensorFlow
* Model benchmarking
* MLflow
* SHAP
* Model registry

---

# 60. Phase 3

Add:

* Hugging Face
* NER
* Transformer classification
* Embeddings
* Semantic search

---

# 61. Phase 4

Add:

* Docker
* CI/CD
* asynchronous training
* performance optimization
* advanced monitoring

---

# 62. Phase 5 — Optional

Add:

* LLM summarization
* RAG
* threshold optimization UI
* advanced model calibration
* drift detection

---

# 63. Definition of Done

HealthLens is considered **complete** only when all of the following are true:

### Data

* [ ] Public/de-identified dataset used
* [ ] Upload works
* [ ] Validation works
* [ ] pandas pipeline works
* [ ] Polars pipeline works
* [ ] Feature engineering works
* [ ] Leakage prevention documented

### ML

* [ ] Logistic Regression
* [ ] Random Forest
* [ ] Gradient Boosting/XGBoost
* [ ] PyTorch model
* [ ] TensorFlow model
* [ ] Reproducible training
* [ ] Hyperparameter configuration

### Evaluation

* [ ] Accuracy
* [ ] Precision
* [ ] Recall
* [ ] F1
* [ ] ROC-AUC
* [ ] PR-AUC
* [ ] Confusion matrix
* [ ] ROC curve
* [ ] PR curve
* [ ] Error analysis

### Explainability

* [ ] SHAP
* [ ] Feature importance
* [ ] Prediction explanation

### NLP

* [ ] Hugging Face
* [ ] Transformer
* [ ] Classification
* [ ] NER
* [ ] Embeddings
* [ ] Semantic search

### Backend

* [ ] FastAPI
* [ ] PostgreSQL
* [ ] Authentication
* [ ] REST API
* [ ] OpenAPI documentation
* [ ] Background training jobs

### Frontend

* [ ] React
* [ ] Dashboard
* [ ] Dataset interface
* [ ] Training interface
* [ ] Benchmark interface
* [ ] Prediction interface
* [ ] NLP interface

### MLOps

* [ ] MLflow
* [ ] Experiment tracking
* [ ] Model versions
* [ ] Dataset versions
* [ ] Docker
* [ ] CI/CD

### Quality

* [ ] Unit tests
* [ ] Integration tests
* [ ] Security validation
* [ ] Error handling
* [ ] README
* [ ] Architecture documentation

---

# 64. Final Tech Stack

**Frontend**

```text
React
TypeScript
Vite
Tailwind CSS
Recharts
```

**Backend**

```text
Python
FastAPI
Pydantic
SQLAlchemy
JWT
```

**Data**

```text
PostgreSQL
pandas
Polars
NumPy
```

**Machine Learning**

```text
scikit-learn
XGBoost
PyTorch
TensorFlow
SHAP
```

**NLP**

```text
Hugging Face Transformers
Tokenizers
Sentence Transformers
```

**MLOps**

```text
MLflow
Docker
GitHub Actions
```

---

# 65. Final Product Flow

The finished product should allow someone to experience this entire pipeline:

```text
                 HEALTHLENS
                     │
        ┌────────────┴────────────┐
        │                         │
   STRUCTURED DATA            CLINICAL TEXT
        │                         │
        ▼                         ▼
   Validation                 Tokenization
        │                         │
        ▼                         ▼
 pandas / Polars             Hugging Face
        │                         │
        ▼                         ▼
 Feature Engineering        Transformer NLP
        │                         │
        ▼                         ▼
 ┌───────────────┐          Classification
 │ ML Benchmark  │          NER / Embeddings
 └───────┬───────┘
         │
 ┌───────┼──────────────┐
 ▼       ▼              ▼
sklearn PyTorch     TensorFlow
 │       │              │
 └───────┼──────────────┘
         ▼
    Evaluation
         │
         ▼
      MLflow
         │
         ▼
   Model Registry
         │
         ▼
 Prediction API
         │
    ┌────┴────┐
    ▼         ▼
Prediction  SHAP
    │         │
    └────┬────┘
         ▼
    React Dashboard
```

## The hard rule

**Do not start by building the UI.**

Build it in this order:

**Dataset → preprocessing → baseline model → evaluation → multiple models → API → database → frontend → explainability → PyTorch/TensorFlow → NLP → MLflow → Docker/CI.**

That order will force you to actually understand the ML pipeline rather than ending up with a polished React dashboard sitting on top of notebooks.

Most importantly, when you eventually discuss this project in the MedCare interview, you should be able to explain **why each component exists, how data moves through the system, how you prevented leakage, why you selected your evaluation metrics, and how a trained model becomes a production API**. That's the part that will make the project valuable for an ML Engineer internship.
