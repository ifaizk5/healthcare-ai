import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ModelVersion, Dataset } from '../types';
import { Play, RefreshCw } from 'lucide-react';

export const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  const [selectedModelType, setSelectedModelType] = useState('random_forest');
  const [customModelName, setCustomModelName] = useState('Random Forest Risk Classifier');
  const [training, setTraining] = useState(false);
  const [sortKey, setSortKey] = useState<'roc_auc' | 'recall' | 'accuracy' | 'latency_ms'>('roc_auc');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mList, dList] = await Promise.all([ApiService.listModels(), ApiService.listDatasets()]);
      setModels(mList);
      setDatasets(dList);
      if (dList.length > 0) setSelectedDatasetId(dList[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDatasetId) return;
    setTraining(true);
    setMsg(null);

    try {
      await ApiService.startTraining(selectedDatasetId, selectedModelType, customModelName);
      setMsg('Model training job submitted! Refreshing registry...');
      setTimeout(loadData, 2000);
    } catch (err: any) {
      setMsg(`Training failed: ${err.message}`);
    } finally {
      setTraining(false);
    }
  };

  const handleStatusChange = async (versionId: number, status: string) => {
    try {
      await ApiService.updateModelStatus(versionId, status);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const sortedModels = [...models].sort((a, b) => {
    const valA = a[sortKey] ?? 0;
    const valB = b[sortKey] ?? 0;
    return sortKey === 'latency_ms' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '2.5rem auto', padding: '0 2rem' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="section-num" style={{ marginBottom: '0.4rem' }}>
              01 / MODEL REGISTRY & BENCHMARKING
            </div>
            <h1 className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 600, color: '#191716', lineHeight: 1.15 }}>
              Algorithm Registry & Lifecycle Audit
            </h1>
            <p style={{ color: '#625E5A', fontSize: '0.9rem', marginTop: '0.4rem', fontFamily: 'Inter, sans-serif' }}>
              Versioned machine learning and deep learning artifacts tracked across lifecycle states (EXPERIMENTAL &rarr; VALIDATED &rarr; PRODUCTION &rarr; ARCHIVED).
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ borderRadius: '0px', fontSize: '0.75rem', padding: '0.5rem 0.85rem' }} 
            onClick={loadData}
          >
            <RefreshCw size={13} />
            <span>RE-INDEX REGISTRY</span>
          </button>
        </div>
        <div className="thin-divider" style={{ marginTop: '1.5rem' }} />
      </div>

      {/* Train New Model Panel */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', borderTop: '4px solid #B4232D', padding: '2rem', borderRadius: '0px', marginBottom: '2.5rem' }}>
        <div className="section-num" style={{ marginBottom: '0.4rem' }}>
          02 / TRAIN NEW ALGORITHM
        </div>
        <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#191716', marginBottom: '1.25rem' }}>
          Configure & Launch Training Run
        </h3>

        {msg && (
          <div style={{ backgroundColor: '#F4DDDE', borderLeft: '4px solid #B4232D', color: '#64141A', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.825rem', fontFamily: 'Inter, sans-serif' }}>
            {msg}
          </div>
        )}

        <form onSubmit={handleStartTraining} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
              Training Dataset
            </label>
            <select value={selectedDatasetId || ''} onChange={(e) => setSelectedDatasetId(Number(e.target.value))} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.row_count} rows)</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
              Model Architecture
            </label>
            <select 
              value={selectedModelType} 
              onChange={(e) => {
                setSelectedModelType(e.target.value);
                if (e.target.value === 'logistic_regression') setCustomModelName('Logistic Regression Baseline');
                else if (e.target.value === 'random_forest') setCustomModelName('Random Forest Risk Classifier');
                else if (e.target.value === 'xgboost') setCustomModelName('XGBoost Boosted Trees');
                else if (e.target.value === 'pytorch_nn') setCustomModelName('PyTorch Feed-Forward NN');
                else if (e.target.value === 'tf_nn') setCustomModelName('TensorFlow Feed-Forward NN');
              }}
              style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}
            >
              <option value="random_forest">Random Forest Classifier (scikit-learn)</option>
              <option value="logistic_regression">Logistic Regression (scikit-learn)</option>
              <option value="xgboost">Gradient Boosted Trees (XGBoost)</option>
              <option value="pytorch_nn">PyTorch Neural Network (PyTorch)</option>
              <option value="tf_nn">TensorFlow Neural Network (Keras)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
              Model Identifier Name
            </label>
            <input type="text" value={customModelName} onChange={(e) => setCustomModelName(e.target.value)} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }} required />
          </div>

          <div>
            <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
              Hyperparameter Config
            </label>
            <input type="text" value={`configs/${selectedModelType}.yaml`} disabled style={{ backgroundColor: '#FAF9F6', color: '#625E5A', borderRadius: '0px', borderColor: '#D8D2CC' }} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ borderRadius: '0px', padding: '0.65rem 1.25rem' }} disabled={training}>
            <Play size={14} />
            <span>{training ? 'TRAINING...' : 'LAUNCH TRAINING'}</span>
          </button>
        </form>
      </div>

      {/* Model Benchmark & Registry Table */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '2rem', borderRadius: '0px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #D8D2CC' }}>
          <div>
            <div className="section-num" style={{ marginBottom: '0.2rem' }}>
              03 / ARTIFACT REGISTRY ({models.length})
            </div>
            <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#191716' }}>
              Registered Clinical Models
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
            <span style={{ color: '#625E5A', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>SORT BY METRIC:</span>
            {(['roc_auc', 'recall', 'accuracy', 'latency_ms'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                style={{
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.675rem',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  border: '1px solid #D8D2CC',
                  borderRadius: '0px',
                  backgroundColor: sortKey === key ? '#B4232D' : '#FAF9F6',
                  color: sortKey === key ? '#FFFFFF' : '#625E5A',
                  cursor: 'pointer'
                }}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>MODEL IDENTIFIER</th>
                <th>FRAMEWORK</th>
                <th>VERSION</th>
                <th>LIFECYCLE STATE</th>
                <th>ROC-AUC</th>
                <th>SENSITIVITY</th>
                <th>PRECISION</th>
                <th>ACCURACY</th>
                <th>LATENCY</th>
                <th>STATE PROMOTION</th>
              </tr>
            </thead>
            <tbody>
              {sortedModels.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="font-serif" style={{ fontWeight: 600, color: '#191716', fontSize: '1.05rem' }}>{m.model_name}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.625rem', color: '#B4232D', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                      {m.model_type}
                    </span>
                  </td>
                  <td className="num-serif" style={{ color: '#B4232D', fontSize: '1.1rem' }}>{m.version_tag}</td>
                  <td>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '2px 6px',
                      backgroundColor: m.status === 'PRODUCTION' ? '#B4232D' : m.status === 'VALIDATED' ? '#64141A' : '#FAF9F6',
                      color: m.status === 'PRODUCTION' || m.status === 'VALIDATED' ? '#FFFFFF' : '#191716',
                      border: '1px solid #D8D2CC'
                    }}>
                      {m.status}
                    </span>
                  </td>
                  <td className="num-serif" style={{ color: '#B4232D', fontSize: '1.1rem' }}>{m.roc_auc ?? '—'}</td>
                  <td className="num-serif" style={{ color: '#861C24', fontSize: '1.1rem' }}>{m.recall ?? '—'}</td>
                  <td className="num-serif" style={{ color: '#191716', fontSize: '1.1rem' }}>{m.precision ?? '—'}</td>
                  <td className="num-serif" style={{ color: '#191716', fontSize: '1.1rem' }}>{m.accuracy ?? '—'}</td>
                  <td style={{ color: '#625E5A', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif' }}>{m.latency_ms ? `${m.latency_ms} ms` : '—'}</td>
                  <td>
                    <select
                      value={m.status}
                      onChange={(e) => handleStatusChange(m.id, e.target.value)}
                      style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem', borderRadius: '0px', borderColor: '#D8D2CC' }}
                    >
                      <option value="EXPERIMENTAL">EXPERIMENTAL</option>
                      <option value="VALIDATED">VALIDATED (Inference Ready)</option>
                      <option value="PRODUCTION">PRODUCTION</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

