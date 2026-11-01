"""
Download and prepare the HealthLens public datasets.

1. Diabetes 130-US Hospitals (1999-2008) — UCI ML Repository #296, CC BY 4.0
   Strack et al., "Impact of HbA1c Measurement on Hospital Readmission Rates", 2014.
   -> sample_data/diabetes_readmission.csv  (primary tabular target: readmitted_30d)

2. MTSamples medical transcriptions — CC0 (Kaggle tboyle10/medicaltranscriptions mirror)
   -> sample_data/mtsamples_notes.csv  (clinical NLP: specialty classification + semantic search)

Usage (from project root):
    py scripts/prepare_datasets.py            # download if missing, then process
    py scripts/prepare_datasets.py --force    # re-download raw files
"""
import argparse
import io
import os
import sys
import urllib.request
import zipfile

import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(ROOT, "data", "raw")
OUT_DIR = os.path.join(ROOT, "sample_data")

DIABETES_URL = "https://archive.ics.uci.edu/static/public/296/diabetes+130-us+hospitals+for+years+1999-2008.zip"
MTSAMPLES_URLS = [
    "https://raw.githubusercontent.com/socd06/medical-nlp/master/data/mtsamples.csv",
    "https://raw.githubusercontent.com/Abonia1/Clinical-NLP-on-MTSamples/master/mtsamples.csv",
]

# Discharge dispositions meaning the patient died or went to hospice (cannot be readmitted).
EXCLUDED_DISCHARGE_IDS = {11, 13, 14, 19, 20, 21}

DIABETES_MED_COLUMNS = [
    "metformin", "repaglinide", "nateglinide", "chlorpropamide", "glimepiride", "acetohexamide",
    "glipizide", "glyburide", "tolbutamide", "pioglitazone", "rosiglitazone", "acarbose", "miglitol",
    "troglitazone", "tolazamide", "examide", "citoglipton", "insulin", "glyburide-metformin",
    "glipizide-metformin", "glimepiride-pioglitazone", "metformin-rosiglitazone", "metformin-pioglitazone",
]

# MTSamples categories that describe a document type rather than a clinical specialty.
NON_SPECIALTY_CATEGORIES = {
    "Surgery", "Consult - History and Phy.", "SOAP / Chart / Progress Notes", "Discharge Summary",
    "Letters", "Office Notes", "IME-QME-Work Comp etc.", "Emergency Room Reports",
}
MIN_SPECIALTY_SAMPLES = 50


def _download(url: str) -> bytes:
    print(f"  downloading {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "HealthLens-dataset-prep"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()


def fetch_raw(force: bool = False) -> None:
    os.makedirs(RAW_DIR, exist_ok=True)

    diabetes_csv = os.path.join(RAW_DIR, "diabetic_data.csv")
    if force or not os.path.exists(diabetes_csv):
        with zipfile.ZipFile(io.BytesIO(_download(DIABETES_URL))) as zf:
            for name in ("diabetic_data.csv", "IDS_mapping.csv"):
                with open(os.path.join(RAW_DIR, name), "wb") as f:
                    f.write(zf.read(name))

    mtsamples_csv = os.path.join(RAW_DIR, "mtsamples.csv")
    if force or not os.path.exists(mtsamples_csv):
        for url in MTSAMPLES_URLS:
            try:
                data = _download(url)
                with open(mtsamples_csv, "wb") as f:
                    f.write(data)
                break
            except Exception as e:  # try the next mirror
                print(f"  failed: {e}")
        else:
            sys.exit("Could not download MTSamples. Download mtsamples.csv from "
                     "kaggle.com/datasets/tboyle10/medicaltranscriptions into data/raw/.")


def _icd9_group(code) -> str:
    """Primary diagnosis grouping from Strack et al. (2014)."""
    if pd.isna(code) or code == "?":
        return "other"
    code = str(code)
    if code.startswith(("V", "E")):
        return "other"
    value = float(code)
    if code.startswith("250"):
        return "diabetes"
    if 390 <= value <= 459 or int(value) == 785:
        return "circulatory"
    if 460 <= value <= 519 or int(value) == 786:
        return "respiratory"
    if 520 <= value <= 579 or int(value) == 787:
        return "digestive"
    if 800 <= value <= 999:
        return "injury"
    if 710 <= value <= 739:
        return "musculoskeletal"
    if 580 <= value <= 629 or int(value) == 788:
        return "genitourinary"
    if 140 <= value <= 239:
        return "neoplasms"
    return "other"


def prepare_diabetes() -> pd.DataFrame:
    df = pd.read_csv(os.path.join(RAW_DIR, "diabetic_data.csv"), na_values="?", low_memory=False)
    raw_rows = len(df)

    # Keep each patient's first encounter only so the same patient can't land in both train and test.
    df = df.sort_values("encounter_id").drop_duplicates("patient_nbr", keep="first")
    df = df[~df["discharge_disposition_id"].isin(EXCLUDED_DISCHARGE_IDS)]
    df = df[df["gender"] != "Unknown/Invalid"]

    out = pd.DataFrame(index=df.index)
    # "[70-80)" -> 75
    out["age"] = df["age"].str.extract(r"\[(\d+)-").astype(int)[0] + 5
    out["is_male"] = (df["gender"] == "Male").astype(int)
    for col in ["time_in_hospital", "num_lab_procedures", "num_procedures", "num_medications",
                "number_outpatient", "number_emergency", "number_inpatient", "number_diagnoses"]:
        out[col] = df[col].astype(int)

    # Lab results: 0 = not measured, 1 = normal, 2 = elevated, 3 = high
    out["a1c_result"] = df["A1Cresult"].map({"Norm": 1, ">7": 2, ">8": 3}).fillna(0).astype(int)
    out["max_glu_serum"] = df["max_glu_serum"].map({"Norm": 1, ">200": 2, ">300": 3}).fillna(0).astype(int)

    meds = df[DIABETES_MED_COLUMNS]
    out["num_diabetes_meds"] = (meds != "No").sum(axis=1)
    out["num_med_dose_changes"] = meds.isin(["Up", "Down"]).sum(axis=1)
    out["on_insulin"] = (df["insulin"] != "No").astype(int)
    out["on_metformin"] = (df["metformin"] != "No").astype(int)
    out["med_changed"] = (df["change"] == "Ch").astype(int)
    out["diabetes_med_prescribed"] = (df["diabetesMed"] == "Yes").astype(int)

    out["emergency_admission"] = (df["admission_type_id"] == 1).astype(int)
    out["admitted_from_er"] = (df["admission_source_id"] == 7).astype(int)
    out["discharged_home"] = (df["discharge_disposition_id"] == 1).astype(int)

    groups = df["diag_1"].map(_icd9_group)
    for g in ["circulatory", "respiratory", "digestive", "diabetes", "injury",
              "musculoskeletal", "genitourinary", "neoplasms"]:
        out[f"primary_diag_{g}"] = (groups == g).astype(int)

    out["readmitted_30d"] = (df["readmitted"] == "<30").astype(int)

    path = os.path.join(OUT_DIR, "diabetes_readmission.csv")
    out.to_csv(path, index=False)
    print(f"  {raw_rows:,} raw encounters -> {len(out):,} patients x {out.shape[1] - 1} features "
          f"({out['readmitted_30d'].mean():.1%} readmitted <30 days) -> {path}")
    return out


def prepare_mtsamples() -> pd.DataFrame:
    df = pd.read_csv(os.path.join(RAW_DIR, "mtsamples.csv"))
    df = df.dropna(subset=["transcription"])
    df["medical_specialty"] = df["medical_specialty"].str.strip()
    df["sample_name"] = df["sample_name"].str.strip()
    df["description"] = df["description"].str.strip()
    # MTSamples uses ",  " as a section separator (e.g. "SUBJECTIVE:,  ...")
    df["transcription"] = df["transcription"].str.replace(r",\s{2,}", " ", regex=True).str.strip()

    counts = df["medical_specialty"].value_counts()
    trainable = set(counts[counts >= MIN_SPECIALTY_SAMPLES].index) - NON_SPECIALTY_CATEGORIES
    df["use_for_classification"] = df["medical_specialty"].isin(trainable).astype(int)

    out = pd.DataFrame({
        "id": [f"MTS-{i:05d}" for i in range(len(df))],
        "medical_specialty": df["medical_specialty"].values,
        "sample_name": df["sample_name"].values,
        "description": df["description"].values,
        "text": df["transcription"].values,
        "use_for_classification": df["use_for_classification"].values,
    })
    path = os.path.join(OUT_DIR, "mtsamples_notes.csv")
    out.to_csv(path, index=False)
    print(f"  {len(out):,} notes, {out['use_for_classification'].sum():,} labelled across "
          f"{len(trainable)} specialties for classification -> {path}")
    return out


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="re-download raw files")
    args = parser.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    print("Fetching raw datasets...")
    fetch_raw(force=args.force)
    print("Preparing Diabetes 130-US Hospitals (readmission)...")
    prepare_diabetes()
    print("Preparing MTSamples (clinical notes)...")
    prepare_mtsamples()
    print("Done.")
