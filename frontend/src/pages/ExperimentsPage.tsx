import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { Experiment } from '../types';
import { RefreshCw } from 'lucide-react';

export const ExperimentsPage: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      const list = await ApiService.listExperiments();
      setExperiments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '2.5rem auto', padding: '0 2rem' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="section-num" style={{ marginBottom: '0.4rem' }}>
              01 / EXPERIMENT TRACKING & AUDIT LOG
            </div>
            <h1 className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 600, color: '#191716', lineHeight: 1.15 }}>
              MLflow Experimentation Registry
            </h1>
            <p style={{ color: '#625E5A', fontSize: '0.9rem', marginTop: '0.4rem', fontFamily: 'Inter, sans-serif' }}>
              Comprehensive log of hyperparameter variations, evaluation metrics, and dataset version tags per model training run.
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ borderRadius: '0px', fontSize: '0.75rem', padding: '0.5rem 0.85rem' }} 
            onClick={loadExperiments}
          >
            <RefreshCw size={13} />
            <span>RE-INDEX RUNS</span>
          </button>
        </div>
        <div className="thin-divider" style={{ marginTop: '1.5rem' }} />
      </div>

      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '2rem', borderRadius: '0px' }}>
        <div className="section-num" style={{ marginBottom: '0.4rem' }}>
          02 / RUN RECORD LOG ({experiments.length})
        </div>
        <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#191716', marginBottom: '1.25rem' }}>
          Training Runs & Validation Records
        </h3>

        {experiments.length === 0 ? (
          <p style={{ color: '#625E5A', textAlign: 'center', padding: '3rem', fontFamily: 'Inter, sans-serif' }}>
            No experiments logged yet. Train a model to record training runs here.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>MODEL & TYPE</th>
                  <th>DATASET TAG</th>
                  <th>HYPERPARAMETERS</th>
                  <th>ROC-AUC</th>
                  <th>SENSITIVITY</th>
                  <th>ACCURACY</th>
                  <th>DURATION</th>
                  <th>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => (
                  <tr key={exp.id}>
                    <td style={{ fontFamily: 'monospace', color: '#625E5A', fontSize: '0.75rem' }}>#{exp.id}</td>
                    <td>
                      <div className="font-serif" style={{ fontWeight: 600, color: '#191716', fontSize: '1.05rem' }}>{exp.name}</div>
                      <span style={{ fontSize: '0.625rem', color: '#B4232D', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                        {exp.model_type}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.7rem', border: '1px solid #D8D2CC', padding: '1px 6px', color: '#191716' }}>
                        {exp.dataset_version_tag}
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <pre style={{ fontSize: '0.725rem', backgroundColor: '#FAF9F6', padding: '0.4rem', border: '1px solid #D8D2CC', borderRadius: '0px', overflowX: 'auto', margin: 0 }}>
                        {JSON.stringify(exp.hyperparams.model || exp.hyperparams, null, 1)}
                      </pre>
                    </td>
                    <td className="num-serif" style={{ color: '#B4232D', fontSize: '1.1rem' }}>
                      {exp.metrics?.roc_auc !== undefined ? exp.metrics.roc_auc : 'N/A'}
                    </td>
                    <td className="num-serif" style={{ color: '#861C24', fontSize: '1.1rem' }}>
                      {exp.metrics?.recall !== undefined ? exp.metrics.recall : 'N/A'}
                    </td>
                    <td className="num-serif" style={{ color: '#191716', fontSize: '1.1rem' }}>
                      {exp.metrics?.accuracy !== undefined ? exp.metrics.accuracy : 'N/A'}
                    </td>
                    <td style={{ color: '#625E5A', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif' }}>
                      {exp.metrics?.training_duration_seconds !== undefined ? `${exp.metrics.training_duration_seconds}s` : '< 1s'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#625E5A', fontFamily: 'Inter, sans-serif' }}>
                      {new Date(exp.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

