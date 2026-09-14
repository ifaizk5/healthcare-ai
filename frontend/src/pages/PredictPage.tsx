import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ModelVersion, PredictionResult } from '../types';
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

export const PredictPage: React.FC = () => {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<number>(0.50);
  
  // Patient Clinical Features Form State
  const [features, setFeatures] = useState<Record<string, number>>({
    age: 63,
    sex: 1,
    cp: 3,
    trestbps: 145,
    chol: 233,
    fbs: 1,
    restecg: 0,
    thalach: 150,
    exang: 0,
    oldpeak: 2.3,
    slope: 0,
    ca: 0,
    thal: 1,
  });

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

  // Sample Preset Patient Profiles for fast testing
  const loadPresetProfile = (type: 'high_risk' | 'low_risk') => {
    if (type === 'high_risk') {
      setFeatures({
        age: 68, sex: 1, cp: 0, trestbps: 160, chol: 280, fbs: 1, restecg: 1, thalach: 110, exang: 1, oldpeak: 3.4, slope: 1, ca: 2, thal: 3
      });
    } else {
      setFeatures({
        age: 41, sex: 0, cp: 2, trestbps: 115, chol: 190, fbs: 0, restecg: 0, thalach: 175, exang: 0, oldpeak: 0.0, slope: 2, ca: 0, thal: 2
      });
    }
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
                <div>
                  <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Age (years)</label>
                  <input type="number" value={features.age} onChange={(e) => handleFeatureChange('age', parseFloat(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Sex (1=Male, 0=Female)</label>
                  <select value={features.sex} onChange={(e) => handleFeatureChange('sex', parseInt(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}>
                    <option value={1}>1 - Male</option>
                    <option value={0}>0 - Female</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Chest Pain Type (cp)</label>
                  <select value={features.cp} onChange={(e) => handleFeatureChange('cp', parseInt(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}>
                    <option value={0}>0 - Typical Angina</option>
                    <option value={1}>1 - Atypical Angina</option>
                    <option value={2}>2 - Non-anginal Pain</option>
                    <option value={3}>3 - Asymptomatic</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Resting BP (mm Hg)</label>
                  <input type="number" value={features.trestbps} onChange={(e) => handleFeatureChange('trestbps', parseFloat(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Serum Cholesterol (mg/dL)</label>
                  <input type="number" value={features.chol} onChange={(e) => handleFeatureChange('chol', parseFloat(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Fasting Blood Sugar &gt;120</label>
                  <select value={features.fbs} onChange={(e) => handleFeatureChange('fbs', parseInt(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}>
                    <option value={1}>1 - True (&gt;120 mg/dL)</option>
                    <option value={0}>0 - False (&le;120 mg/dL)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Max Heart Rate (thalach)</label>
                  <input type="number" value={features.thalach} onChange={(e) => handleFeatureChange('thalach', parseFloat(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Exercise Angina (exang)</label>
                  <select value={features.exang} onChange={(e) => handleFeatureChange('exang', parseInt(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}>
                    <option value={1}>1 - Yes</option>
                    <option value={0}>0 - No</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>ST Depression (oldpeak)</label>
                  <input type="number" step="0.1" value={features.oldpeak} onChange={(e) => handleFeatureChange('oldpeak', parseFloat(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Major Vessels (ca: 0-3)</label>
                  <input type="number" value={features.ca} onChange={(e) => handleFeatureChange('ca', parseInt(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }} />
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

