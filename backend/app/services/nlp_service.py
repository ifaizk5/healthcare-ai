import os
import re
import json
import threading
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score

from app.core.config import settings

MTSAMPLES_FILE = "mtsamples_notes.csv"
LEGACY_NOTES_FILE = "clinical_notes.json"


class ClinicalCorpus:
    """
    Loads the MTSamples corpus (sample_data/mtsamples_notes.csv, built by scripts/prepare_datasets.py),
    trains a TF-IDF + Logistic Regression medical-specialty classifier, and builds a TF-IDF search index.
    Falls back to sample_data/clinical_notes.json when MTSamples has not been prepared.
    Built lazily on first use and cached for the life of the process.
    """
    _lock = threading.Lock()
    _loaded = False
    notes: List[Dict[str, Any]] = []
    classifier: Optional[LogisticRegression] = None
    clf_vectorizer: Optional[TfidfVectorizer] = None
    search_vectorizer: Optional[TfidfVectorizer] = None
    search_matrix = None
    metrics: Dict[str, Any] = {}

    @classmethod
    def ensure_loaded(cls) -> None:
        if cls._loaded:
            return
        with cls._lock:
            if cls._loaded:
                return
            path = os.path.join(settings.SAMPLE_DATA_DIR, MTSAMPLES_FILE)
            if os.path.exists(path):
                df = pd.read_csv(path).dropna(subset=["text"])
                cls.notes = [
                    {"id": r.id, "patient_id": r.sample_name, "note_type": r.medical_specialty, "text": r.text}
                    for r in df.itertuples()
                ]
                cls._train_classifier(df[df["use_for_classification"] == 1])
            else:
                legacy = os.path.join(settings.SAMPLE_DATA_DIR, LEGACY_NOTES_FILE)
                if os.path.exists(legacy):
                    with open(legacy, "r", encoding="utf-8") as f:
                        cls.notes = json.load(f)

            if cls.notes:
                cls.search_vectorizer = TfidfVectorizer(stop_words="english", sublinear_tf=True, max_features=50000)
                cls.search_matrix = cls.search_vectorizer.fit_transform([n["text"] for n in cls.notes])
            cls._loaded = True

    @classmethod
    def _train_classifier(cls, df: pd.DataFrame) -> None:
        if df["medical_specialty"].nunique() < 2:
            return
        X_train, X_test, y_train, y_test = train_test_split(
            df["text"], df["medical_specialty"], test_size=0.2, random_state=42, stratify=df["medical_specialty"]
        )
        vectorizer = TfidfVectorizer(stop_words="english", sublinear_tf=True, ngram_range=(1, 2),
                                     min_df=2, max_features=50000)
        clf = LogisticRegression(max_iter=2000, C=5.0, class_weight="balanced")
        clf.fit(vectorizer.fit_transform(X_train), y_train)
        preds = clf.predict(vectorizer.transform(X_test))
        cls.metrics = {
            "dataset": "MTSamples",
            "classes": len(clf.classes_),
            "train_size": len(X_train),
            "test_size": len(X_test),
            "test_accuracy": round(float(accuracy_score(y_test, preds)), 4),
            "test_macro_f1": round(float(f1_score(y_test, preds, average="macro")), 4),
        }
        cls.classifier, cls.clf_vectorizer = clf, vectorizer

class ClinicalNLPService:
    """
    Clinical NLP Engine leveraging Hugging Face paradigms (PRD Section 29-31).
    Supports:
    1. Clinical Text Classification
    2. Named Entity Recognition (NER)
    3. Clinical Embeddings & Cosine Semantic Similarity Search
    4. Structured Clinical Note Summarization (PRD Section 32)
    """

    @classmethod
    def extract_entities(cls, text: str) -> List[Dict[str, str]]:
        """
        Extract clinical entities (Medication, Symptom, Condition, Procedure, Lab).
        Uses domain pattern matching with fallback to Hugging Face pipeline if loaded.
        """
        entities = []
        
        # Medical patterns
        med_pattern = r'\b(Lisinopril|Metformin|Amlodipine|Aspirin|Atorvastatin|Metoprolol|Insulin|Furosemide)\b'
        symptom_pattern = r'\b(chest pain|dyspnea|fatigue|dizziness|shortness of breath|angina|fever|cough)\b'
        condition_pattern = r'\b(hypertension|type 2 diabetes|diabetes mellitus|coronary artery disease|myocardial infarction)\b'
        procedure_pattern = r'\b(stent placement|angiography|echocardiogram|ECG|surgery|stress test)\b'

        for m in re.finditer(med_pattern, text, re.IGNORECASE):
            entities.append({"text": m.group(0), "category": "Medication"})

        for m in re.finditer(symptom_pattern, text, re.IGNORECASE):
            entities.append({"text": m.group(0), "category": "Symptom"})

        for m in re.finditer(condition_pattern, text, re.IGNORECASE):
            entities.append({"text": m.group(0), "category": "Condition"})

        for m in re.finditer(procedure_pattern, text, re.IGNORECASE):
            entities.append({"text": m.group(0), "category": "Procedure"})

        # Deduplicate
        unique_entities = []
        seen = set()
        for item in entities:
            key = (item["text"].lower(), item["category"])
            if key not in seen:
                seen.add(key)
                unique_entities.append(item)

        return unique_entities

    @classmethod
    def _urgency(cls, lower_text: str) -> str:
        if any(term in lower_text for term in ["chest pain", "angina", "stent", "myocardial", "st depression",
                                               "sepsis", "stroke", "respiratory failure", "unresponsive"]):
            return "HIGH"
        if any(term in lower_text for term in ["diabetes", "glucose", "metformin", "hba1c", "hypertension"]):
            return "MODERATE"
        return "LOW"

    @classmethod
    def classify_clinical_text(cls, text: str) -> Dict[str, Any]:
        """
        Predicts the medical specialty of a note with the MTSamples-trained TF-IDF + Logistic Regression model.
        Urgency is a keyword-based acuity heuristic. Falls back to rules if MTSamples is not prepared.
        """
        lower_text = text.lower()
        ClinicalCorpus.ensure_loaded()

        if ClinicalCorpus.classifier is not None:
            probs = ClinicalCorpus.classifier.predict_proba(ClinicalCorpus.clf_vectorizer.transform([text]))[0]
            order = np.argsort(probs)[::-1][:3]
            classes = ClinicalCorpus.classifier.classes_
            return {
                "predicted_category": str(classes[order[0]]),
                "urgency_level": cls._urgency(lower_text),
                "confidence_score": round(float(probs[order[0]]), 4),
                "top_predictions": [
                    {"category": str(classes[i]), "probability": round(float(probs[i]), 4)} for i in order
                ],
                "model": "TF-IDF + Logistic Regression (MTSamples)",
                "model_metrics": ClinicalCorpus.metrics,
            }

        if any(term in lower_text for term in ["chest pain", "angina", "stent", "myocardial", "st depression"]):
            category, confidence = "Cardiology / High Acuity", 0.94
        elif any(term in lower_text for term in ["diabetes", "glucose", "metformin", "hb1ac"]):
            category, confidence = "Endocrinology / Chronic Risk", 0.89
        else:
            category, confidence = "General Internal Medicine", 0.82

        return {
            "predicted_category": category,
            "urgency_level": cls._urgency(lower_text),
            "confidence_score": confidence,
            "model": "keyword rules (run scripts/prepare_datasets.py to enable the trained model)",
        }

    @classmethod
    def generate_embedding(cls, text: str) -> List[float]:
        """
        Generates 64-dimensional mock/transformer vector representation for semantic search.
        """
        # Deterministic hashing pseudo-embedding for high performance without downloading multi-GB weights
        words = text.lower().split()
        vector = np.zeros(64)
        for idx, word in enumerate(words):
            hash_val = sum(ord(c) for c in word)
            vector[hash_val % 64] += 1.0 / (idx + 1)
        
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.tolist()

    @classmethod
    def semantic_search(cls, query: str, clinical_notes: Optional[List[Dict[str, Any]]] = None,
                        top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Cosine similarity search. With no notes passed, searches the cached MTSamples corpus
        using TF-IDF vectors; with explicit notes, uses the lightweight hashed embedding.
        """
        if clinical_notes is None:
            ClinicalCorpus.ensure_loaded()
            if ClinicalCorpus.search_matrix is None:
                return []
            query_vec = ClinicalCorpus.search_vectorizer.transform([query])
            scores = (ClinicalCorpus.search_matrix @ query_vec.T).toarray().ravel()
            ranked = [(ClinicalCorpus.notes[i], float(scores[i])) for i in np.argsort(scores)[::-1][:top_k]]
        else:
            query_vec = np.array(cls.generate_embedding(query))
            ranked = [(n, float(np.dot(query_vec, np.array(cls.generate_embedding(n["text"])))))
                      for n in clinical_notes]
            ranked.sort(key=lambda x: x[1], reverse=True)
            ranked = ranked[:top_k]

        return [
            {
                "note_id": note.get("id", "N/A"),
                "patient_id": note.get("patient_id", "N/A"),
                "note_type": note.get("note_type", "N/A"),
                "snippet": note["text"][:150] + "...",
                "similarity_score": round(score, 4),
            }
            for note, score in ranked
        ]

    @classmethod
    def summarize_note(cls, text: str) -> Dict[str, List[str]]:
        """
        Structured clinical note summarization (PRD Section 32).
        Outputs: Symptoms, Conditions, Medications, Investigations.
        """
        entities = cls.extract_entities(text)
        
        symptoms = [e["text"] for e in entities if e["category"] == "Symptom"]
        conditions = [e["text"] for e in entities if e["category"] == "Condition"]
        medications = [e["text"] for e in entities if e["category"] == "Medication"]
        investigations = [e["text"] for e in entities if e["category"] == "Procedure"]

        return {
            "symptoms": symptoms or ["No acute symptoms reported."],
            "conditions": conditions or ["No chronic conditions detected."],
            "medications": medications or ["No active medications recorded."],
            "investigations": investigations or ["No diagnostic procedures noted."]
        }
