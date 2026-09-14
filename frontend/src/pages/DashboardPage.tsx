import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { Dataset, ModelVersion, Experiment } from '../types';
import { ArrowRight, Zap } from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dsList, mdList, expList] = await Promise.all([
          ApiService.listDatasets(),
          ApiService.listModels(),
          ApiService.listExperiments()
        ]);
        setDatasets(dsList);
        setModels(mdList);
        setExperiments(expList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const avgRocAuc = models.length > 0
    ? (models.reduce((acc, m) => acc + (m.roc_auc || 0), 0) / models.length).toFixed(3)
    : '0.000';

  const bestModel = [...models].sort((a, b) => (b.roc_auc || 0) - (a.roc_auc || 0))[0];

  return (
    <div style={{ maxWidth: '1440px', margin: '2.5rem auto', padding: '0 2rem' }}>
      
      {/* Editorial Hero Header Section */}
      <div style={{ marginBottom: '3rem' }}>
        <div className="section-num" style={{ marginBottom: '0.5rem' }}>
          01 / SYSTEM OVERVIEW & CLINICAL INTELLIGENCE
        </div>
        <div className="thin-divider" style={{ marginBottom: '2rem' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem', alignItems: 'flex-start' }}>
          <div>
            <h1 className="font-serif" style={{ fontSize: '2.8rem', fontWeight: 600, color: '#191716', lineHeight: 1.1, marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
              Clinical intelligence,<br />
              without the noise.
            </h1>
            <p style={{ color: '#625E5A', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '680px', fontFamily: 'Inter, sans-serif' }}>
              Institutional healthcare risk experimentation system engineered for high-precision patient classification. Combines structured data validation (pandas + Polars), strict data leakage prevention, classical ensemble models, deep neural networks, SHAP explainability, and clinical Hugging Face NLP.
            </p>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '1.75rem', borderRadius: '0px', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.675rem', color: '#B4232D', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.5rem' }}>
                PRIMARY OPERATIONS
              </div>
              <p style={{ fontSize: '0.825rem', color: '#625E5A', marginBottom: '1.25rem', fontFamily: 'Inter, sans-serif' }}>
                Execute real-time inference or inspect validated patient cohorts.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button className="btn btn-primary" style={{ borderRadius: '0px', width: '100%', justifyContent: 'center' }} onClick={() => onNavigate('predict')}>
                <span>RUN RISK INFERENCE</span>
              </button>
              <button className="btn btn-secondary" style={{ borderRadius: '0px', width: '100%', justifyContent: 'center' }} onClick={() => onNavigate('datasets')}>
                <span>INSPECT DATASETS</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stat Metrics — Editorial Typography */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div className="section-num" style={{ marginBottom: '0.5rem' }}>
          02 / KEY CLINICAL METRICS
        </div>
        <div className="thin-divider" style={{ marginBottom: '1.5rem' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '1.5rem', borderRadius: '0px', borderTop: '3px solid #B4232D' }}>
            <div className="num-serif" style={{ fontSize: '3rem', color: '#191716', lineHeight: 1 }}>
              {datasets.length}
            </div>
            <div style={{ fontSize: '0.675rem', color: '#625E5A', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: '0.75rem' }}>
              VALIDATED DATASETS
            </div>
            <p style={{ fontSize: '0.75rem', color: '#B4232D', marginTop: '0.25rem' }}>Polars & pandas pipeline</p>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '1.5rem', borderRadius: '0px', borderTop: '3px solid #B4232D' }}>
            <div className="num-serif" style={{ fontSize: '3rem', color: '#191716', lineHeight: 1 }}>
              {models.length}
            </div>
            <div style={{ fontSize: '0.675rem', color: '#625E5A', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: '0.75rem' }}>
              REGISTERED MODELS
            </div>
            <p style={{ fontSize: '0.75rem', color: '#B4232D', marginTop: '0.25rem' }}>XGBoost, Random Forest, PyTorch</p>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '1.5rem', borderRadius: '0px', borderTop: '3px solid #B4232D' }}>
            <div className="num-serif" style={{ fontSize: '3rem', color: '#191716', lineHeight: 1 }}>
              {experiments.length}
            </div>
            <div style={{ fontSize: '0.675rem', color: '#625E5A', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: '0.75rem' }}>
              LOGGED EXPERIMENTS
            </div>
            <p style={{ fontSize: '0.75rem', color: '#B4232D', marginTop: '0.25rem' }}>MLflow tracking history</p>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '1.5rem', borderRadius: '0px', borderTop: '3px solid #B4232D' }}>
            <div className="num-serif" style={{ fontSize: '3rem', color: '#B4232D', lineHeight: 1 }}>
              {avgRocAuc}
            </div>
            <div style={{ fontSize: '0.675rem', color: '#625E5A', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: '0.75rem' }}>
              AVERAGE ROC-AUC SCORE
            </div>
            <p style={{ fontSize: '0.75rem', color: '#625E5A', marginTop: '0.25rem' }}>Cross-model benchmark score</p>
          </div>
        </div>
      </div>

      {/* Model Benchmark Table & Top Performer Accent Box */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' }}>
        
        {/* Model Benchmarks List */}
        <div>
          <div className="section-num" style={{ marginBottom: '0.5rem' }}>
            03 / MODEL PERFORMANCE BENCHMARKS
          </div>
          <div className="thin-divider" style={{ marginBottom: '1.25rem' }} />

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '1.5rem', borderRadius: '0px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #D8D2CC' }}>
              <span style={{ fontSize: '0.725rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                ALGORITHM PERFORMANCE RECORD
              </span>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.725rem', padding: '0.35rem 0.65rem', borderRadius: '0px' }} 
                onClick={() => onNavigate('models')}
              >
                <span>OPEN REGISTRY</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {models.map((m) => {
                const score = (m.roc_auc || 0) * 100;
                const recall = (m.recall || 0) * 100;
                return (
                  <div key={m.id} style={{ backgroundColor: '#FAF9F6', padding: '1rem 1.25rem', border: '1px solid #D8D2CC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="font-serif" style={{ fontWeight: 600, fontSize: '1.1rem', color: '#191716' }}>
                          {m.model_name}
                        </span>
                        <span style={{ fontSize: '0.625rem', fontFamily: 'Inter, sans-serif', color: '#B4232D', border: '1px solid #D8D2CC', padding: '1px 5px', textTransform: 'uppercase' }}>
                          {m.version_tag}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.775rem', fontFamily: 'Inter, sans-serif', color: '#625E5A' }}>
                        <span>ROC-AUC: <strong className="num-serif" style={{ color: '#B4232D', fontSize: '0.95rem' }}>{score.toFixed(1)}%</strong></span>
                        <span>Sensitivity: <strong className="num-serif" style={{ color: '#861C24', fontSize: '0.95rem' }}>{recall.toFixed(1)}%</strong></span>
                        <span>Latency: <strong>{m.latency_ms || 1.2} ms</strong></span>
                      </div>
                    </div>
                    {/* Restrained Clinical Bar Visualizer */}
                    <div style={{ height: '4px', backgroundColor: '#D8D2CC', marginTop: '0.5rem' }}>
                      <div style={{ width: `${score}%`, height: '100%', backgroundColor: '#B4232D', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Performer Red Accent Box */}
        <div>
          <div className="section-num" style={{ marginBottom: '0.5rem' }}>
            04 / BENCHMARK LEADER
          </div>
          <div className="thin-divider" style={{ marginBottom: '1.25rem' }} />

          <div style={{ backgroundColor: '#64141A', color: '#FFFFFF', padding: '2rem', borderRadius: '0px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 'calc(100% - 2.5rem)' }}>
            <div>
              <div style={{ fontSize: '0.675rem', color: '#F4DDDE', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '0.75rem' }}>
                PRIMARY BENCHMARK ALGORITHM
              </div>

              {bestModel ? (
                <div>
                  <h3 className="font-serif" style={{ fontSize: '2.1rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.15, marginBottom: '0.25rem' }}>
                    {bestModel.model_name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#F4DDDE', marginBottom: '1.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Framework: {bestModel.model_type.toUpperCase()}
                  </p>
                  
                  <div className="thin-divider" style={{ borderColor: 'rgba(255, 255, 255, 0.2)', marginBottom: '1.5rem' }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <span style={{ color: '#F4DDDE', display: 'block', fontSize: '0.675rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ROC-AUC</span>
                      <span className="num-serif" style={{ fontSize: '1.8rem', color: '#FFFFFF', lineHeight: 1.1 }}>{bestModel.roc_auc}</span>
                    </div>
                    <div>
                      <span style={{ color: '#F4DDDE', display: 'block', fontSize: '0.675rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recall</span>
                      <span className="num-serif" style={{ fontSize: '1.8rem', color: '#FFFFFF', lineHeight: 1.1 }}>{bestModel.recall}</span>
                    </div>
                    <div>
                      <span style={{ color: '#F4DDDE', display: 'block', fontSize: '0.675rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accuracy</span>
                      <span className="num-serif" style={{ fontSize: '1.4rem', color: '#FFFFFF' }}>{bestModel.accuracy}</span>
                    </div>
                    <div>
                      <span style={{ color: '#F4DDDE', display: 'block', fontSize: '0.675rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</span>
                      <span style={{ fontSize: '0.675rem', border: '1px solid #FFFFFF', padding: '1px 6px', textTransform: 'uppercase', display: 'inline-block', marginTop: '4px' }}>
                        {bestModel.status}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#F4DDDE' }}>No models trained yet.</p>
              )}
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button 
                onClick={() => onNavigate('predict')}
                style={{
                  width: '100%',
                  backgroundColor: '#B4232D',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem',
                  fontSize: '0.75rem',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Zap size={14} />
                <span>EXECUTE INFERENCE</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

