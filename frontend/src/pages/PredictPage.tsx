import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ModelVersion, PredictionResult } from '../types';
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

const YES_NO = [{ value: 1, label: 'Yes' }, { value: 0, label: 'No' }];

const DIAGNOSIS_GROUPS = [
  { key: 'circulatory', label: 'Circulatory' },
  { key: 'respiratory', label: 'Respiratory' },
  { key: 'digestive', label: 'Digestive' },
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'injury', label: 'Injury' },
  { key: 'musculoskeletal', label: 'Musculoskeletal' },
  { key: 'genitourinary', label: 'Genitourinary' },
  { key: 'neoplasms', label: 'Neoplasms' },
];

const FEATURE_FIELDS: { key: string; label: string; options?: { value: number; label: string }[] }[] = [
  { key: 'age', label: 'Age (years)' },
  { key: 'is_male', label: 'Sex', options: [{ value: 1, label: 'Male' }, { value: 0, label: 'Female' }] },
  { key: 'time_in_hospital', label: 'Length of Stay (days)' },
  { key: 'number_inpatient', label: 'Inpatient Visits (prior yr)' },
  { key: 'number_emergency', label: 'ER Visits (prior yr)' },
  { key: 'number_outpatient', label: 'Outpatient Visits (prior yr)' },
  { key: 'number_diagnoses', label: 'Number of Diagnoses' },
  { key: 'num_medications', label: 'Number of Medications' },
  { key: 'num_lab_procedures', label: 'Lab Procedures' },
  { key: 'num_procedures', label: 'Procedures' },
  { key: 'a1c_result', label: 'HbA1c Result', options: [
    { value: 0, label: 'Not measured' }, { value: 1, label: 'Normal' }, { value: 2, label: '>7%' }, { value: 3, label: '>8%' },
  ] },
  { key: 'max_glu_serum', label: 'Max Glucose Serum', options: [
    { value: 0, label: 'Not measured' }, { value: 1, label: 'Normal' }, { value: 2, label: '>200' }, { value: 3, label: '>300' },
  ] },
  { key: 'num_diabetes_meds', label: 'Diabetes Meds (count)' },
  { key: 'on_insulin', label: 'On Insulin', options: YES_NO },
  { key: 'med_changed', label: 'Diabetes Med Changed', options: YES_NO },
  { key: 'emergency_admission', label: 'Emergency Admission', options: YES_NO },
  { key: 'discharged_home', label: 'Discharged Home', options: YES_NO },
];

// Every model feature must be sent; fields without an input keep these defaults.
const BASE_PATIENT: Record<string, number> = {
  age: 65, is_male: 0, time_in_hospital: 4, num_lab_procedures: 43, num_procedures: 1, num_medications: 15,
  number_outpatient: 0, number_emergency: 0, number_inpatient: 0, number_diagnoses: 7,
  a1c_result: 0, max_glu_serum: 0, num_diabetes_meds: 1, num_med_dose_changes: 0, on_insulin: 1, on_metformin: 0,
  med_changed: 0, diabetes_med_prescribed: 1, emergency_admission: 1, admitted_from_er: 1, discharged_home: 1,
  primary_diag_circulatory: 1, primary_diag_respiratory: 0, primary_diag_digestive: 0, primary_diag_diabetes: 0,
  primary_diag_injury: 0, primary_diag_musculoskeletal: 0, primary_diag_genitourinary: 0, primary_diag_neoplasms: 0,
};

const HIGH_RISK_PATIENT: Record<string, number> = {
  age: 75, is_male: 1, time_in_hospital: 9, num_lab_procedures: 65, num_medications: 26,
  number_outpatient: 2, number_emergency: 2, number_inpatient: 4, number_diagnoses: 9,
  num_diabetes_meds: 2, num_med_dose_changes: 1, on_insulin: 1, med_changed: 1, discharged_home: 0,
};

const LOW_RISK_PATIENT: Record<string, number> = {
  age: 45, time_in_hospital: 2, num_lab_procedures: 30, num_procedures: 0, num_medications: 8,
  number_diagnoses: 4, a1c_result: 1, on_insulin: 0, on_metformin: 1, emergency_admission: 0, admitted_from_er: 0,
  primary_diag_circulatory: 0, primary_diag_digestive: 1,
};

export const PredictPage: React.FC = () => {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<number>(0.50);
  
  // Patient encounter features (Diabetes 130-US Hospitals readmission schema)
  const [features, setFeatures] = useState<Record<string, number>>({ ...BASE_PATIENT });

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadModels() {
      const list = await ApiService.listModels();
      const validated = list.filter((m) => m.status === 'VALIDATED' || m.status === 'PRODUCTION');
      setModels(validated.length > 0 ? validated : list);
      if (validated.length > 0) {
        setSelectedModelId(validated[0].id);
      } else if (list.length > 0) {
        setSelectedModelId(list[0].id);
      }
    }
    loadModels();
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModelId) return;
    setPredicting(true);
    setError(null);

    try {
      const res = await ApiService.predictPatientRisk(selectedModelId, features, threshold);
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPredicting(false);
    }
  };

  const handleFeatureChange = (key: string, val: number) => {
    setFeatures((prev) => ({ ...prev, [key]: val }));
  };

  const primaryDiagnosis =
    DIAGNOSIS_GROUPS.find((g) => features[`primary_diag_${g.key}`] === 1)?.key ?? 'other';

  const setPrimaryDiagnosis = (group: string) => {
    setFeatures((prev) => {
      const next = { ...prev };
      DIAGNOSIS_GROUPS.forEach((g) => { next[`primary_diag_${g.key}`] = g.key === group ? 1 : 0; });
      return next;
    });
  };

  // Sample Preset Patient Profiles for fast testing
  const loadPresetProfile = (type: 'high_risk' | 'low_risk') => {
    setFeatures({ ...BASE_PATIENT, ...(type === 'high_risk' ? HIGH_RISK_PATIENT : LOW_RISK_PATIENT) });
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '2.5rem auto', padding: '0 2rem' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="section-num" style={{ marginBottom: '0.4rem' }}>
              01 / CLINICAL INFERENCE & EXPLAINABILITY
            </div>
            <h1 className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 600, color: '#191716', lineHeight: 1.15 }}>
              Patient Risk Predictor & SHAP Attribution
            </h1>
            <p style={{ color: '#625E5A', fontSize: '0.9rem', marginTop: '0.4rem', fontFamily: 'Inter, sans-serif' }}>
              Real-time patient classification engine with user-controlled decision cutoffs and SHAP feature explanations.
            </p>
          </div>
        </div>
        <div className="thin-divider" style={{ marginTop: '1.5rem' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
        
        {/* Left Column: Form & Preset Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Preset Buttons */}
          <div style={{ backgroundColor: '#FAF9F6', border: '1px solid #D8D2CC', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.725rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              PRESET CLINICAL COHORTS:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => loadPresetProfile('high_risk')} className="btn btn-secondary" style={{ fontSize: '0.725rem', padding: '0.4rem 0.65rem', borderRadius: '0px' }}>
                LOAD HIGH RISK
              </button>
              <button onClick={() => loadPresetProfile('low_risk')} className="btn btn-secondary" style={{ fontSize: '0.725rem', padding: '0.4rem 0.65rem', borderRadius: '0px' }}>
                LOAD LOW RISK
              </button>
            </div>
          </div>

          {/* Clinical Feature Input Form */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', borderTop: '4px solid #B4232D', padding: '2rem', borderRadius: '0px' }}>
            <div className="section-num" style={{ marginBottom: '0.4rem' }}>
              02 / PATIENT CLINICAL PARAMETERS
            </div>
            <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#191716', marginBottom: '1.25rem' }}>
              Physiological Indicators
            </h3>

            {error && (
              <div style={{ backgroundColor: '#F4DDDE', borderLeft: '4px solid #B4232D', color: '#64141A', padding: '0.75rem 1rem', fontSize: '0.825rem', marginBottom: '1.25rem', fontFamily: 'Inter, sans-serif' }}>
                {error}
              </div>
            )}

            <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Select Model Version */}
              <div>
                <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                  Select Model Artifact
                </label>
                <select value={selectedModelId || ''} onChange={(e) => setSelectedModelId(Number(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.model_name} ({m.version_tag}) — ROC-AUC: {m.roc_auc} | Recall: {m.recall}
                    </option>
                  ))}
                </select>
              </div>

              {/* Threshold Slider */}
              <div style={{ backgroundColor: '#FAF9F6', padding: '1rem', border: '1px solid #D8D2CC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', fontFamily: 'Inter, sans-serif' }}>
                  <span style={{ fontWeight: 600, color: '#191716' }}>Decision Threshold Cutoff</span>
                  <strong className="num-serif" style={{ color: '#B4232D', fontSize: '1.1rem' }}>{threshold.toFixed(2)}</strong>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', color: '#625E5A', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <span>&larr; High Recall (Sensitivity)</span>
                  <span>High Precision &rarr;</span>
                </div>
              </div>

              {/* Feature Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {FEATURE_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>{field.label}</label>
                    {field.options ? (
                      <select value={features[field.key]} onChange={(e) => handleFeatureChange(field.key, parseInt(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}>
                        {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input type="number" min={0} value={features[field.key]} onChange={(e) => handleFeatureChange(field.key, parseFloat(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }} />
                    )}
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Primary Diagnosis (ICD-9 group)</label>
                  <select value={primaryDiagnosis} onChange={(e) => setPrimaryDiagnosis(e.target.value)} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}>
                    {DIAGNOSIS_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '0.75rem', borderRadius: '0px', padding: '0.75rem' }} 
                disabled={predicting}
              >
                <Zap size={15} />
                <span>{predicting ? 'CALCULATING RISK & SHAP...' : 'EXECUTE PATIENT RISK INFERENCE'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Risk Prediction Output & SHAP Waterfall */}
        <div>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Prediction Banner Card — Red Accent Block */}
              <div style={{
                backgroundColor: result.risk_category === 'HIGH' ? '#64141A' : '#FFFFFF',
                color: result.risk_category === 'HIGH' ? '#FFFFFF' : '#191716',
                border: '1px solid #D8D2CC',
                padding: '2.25rem',
                borderRadius: '0px'
              }}>
                <div style={{ fontSize: '0.675rem', color: result.risk_category === 'HIGH' ? '#F4DDDE' : '#B4232D', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '0.5rem' }}>
                  03 / INFERENCE EVALUATION REPORT
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                  <span className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 600 }}>
                    {result.risk_category} RISK CLASSIFICATION
                  </span>
                  <span className="num-serif" style={{ fontSize: '3.2rem', fontWeight: 700, lineHeight: 1, color: result.risk_category === 'HIGH' ? '#FFFFFF' : '#B4232D' }}>
                    {result.probability_percentage}
                  </span>
                </div>

                <p style={{ color: result.risk_category === 'HIGH' ? '#F4DDDE' : '#625E5A', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>
                  Evaluated by model <strong>{result.model_name} ({result.model_version})</strong> at decision threshold {result.threshold_used}.
                </p>

                {/* Risk Bar Gauge */}
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ height: '6px', backgroundColor: result.risk_category === 'HIGH' ? 'rgba(255,255,255,0.2)' : '#D8D2CC' }}>
                    <div
                      style={{
                        width: `${result.probability * 100}%`,
                        height: '100%',
                        backgroundColor: result.risk_category === 'HIGH' ? '#FFFFFF' : '#B4232D',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SHAP Feature Attribution Waterfall */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '2rem', borderRadius: '0px' }}>
                <div className="section-num" style={{ marginBottom: '0.4rem' }}>
                  04 / SHAP EXPLAINABILITY WATERFALL
                </div>
                <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#191716', marginBottom: '0.35rem' }}>
                  Feature Attribution Breakdown
                </h3>
                <p style={{ color: '#625E5A', fontSize: '0.8rem', marginBottom: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
                  Quantifies positive/negative feature contributions to individual patient risk score.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {result.shap_explanations.slice(0, 7).map((exp, idx) => {
                    const isPositive = exp.shap_value > 0;
                    return (
                      <div key={idx} style={{ backgroundColor: '#FAF9F6', padding: '0.85rem 1rem', border: '1px solid #D8D2CC' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', fontFamily: 'Inter, sans-serif' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {isPositive ? <ArrowUpRight size={15} color="#B4232D" /> : <ArrowDownRight size={15} color="#625E5A" />}
                            <strong style={{ color: '#191716' }}>{exp.feature}</strong>
                            <span style={{ color: '#625E5A', fontSize: '0.75rem' }}>(val: {exp.value})</span>
                          </div>
                          <span className="num-serif" style={{ fontWeight: 600, fontSize: '1.05rem', color: isPositive ? '#B4232D' : '#625E5A' }}>
                            {isPositive ? `+${exp.shap_value}` : exp.shap_value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '5rem 2rem', textAlign: 'center' }}>
              <h3 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 600, color: '#191716', marginBottom: '0.5rem' }}>
                Awaiting Clinical Evaluation
              </h3>
              <p style={{ color: '#625E5A', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
                Specify patient physiological parameters on the left or select a preset clinical cohort to calculate risk probability and SHAP attribution.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

