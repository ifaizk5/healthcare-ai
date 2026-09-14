import React from 'react';

export const SettingsPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '1440px', margin: '2.5rem auto', padding: '0 2rem' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="section-num" style={{ marginBottom: '0.4rem' }}>
              01 / SYSTEM ARCHITECTURE & SPECIFICATIONS
            </div>
            <h1 className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 600, color: '#191716', lineHeight: 1.15 }}>
              Platform Configuration & Infrastructure
            </h1>
            <p style={{ color: '#625E5A', fontSize: '0.9rem', marginTop: '0.4rem', fontFamily: 'Inter, sans-serif' }}>
              HealthLens Fast API microservices specs, database connection strings, and security policies.
            </p>
          </div>
        </div>
        <div className="thin-divider" style={{ marginTop: '1.5rem' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
        
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', borderTop: '4px solid #B4232D', padding: '2rem', borderRadius: '0px' }}>
          <div className="section-num" style={{ marginBottom: '0.4rem' }}>
            02 / ENDPOINT CONFIGURATION
          </div>
          <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#191716', marginBottom: '1.25rem' }}>
            Backend Microservices
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #D8D2CC' }}>
              <span style={{ color: '#625E5A', fontWeight: 600 }}>FastAPI Base Endpoint:</span>
              <strong style={{ color: '#B4232D', fontFamily: 'monospace' }}>http://localhost:8000/api/v1</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #D8D2CC' }}>
              <span style={{ color: '#625E5A', fontWeight: 600 }}>Swagger API Docs:</span>
              <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" style={{ color: '#B4232D', textDecoration: 'underline', fontWeight: 600 }}>
                http://localhost:8000/docs
              </a>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #D8D2CC' }}>
              <span style={{ color: '#625E5A', fontWeight: 600 }}>Data Pipeline Engine:</span>
              <span style={{ color: '#191716' }}>Polars multi-threaded + pandas</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #D8D2CC' }}>
              <span style={{ color: '#625E5A', fontWeight: 600 }}>ML/DL Frameworks:</span>
              <span style={{ color: '#191716' }}>scikit-learn, PyTorch, XGBoost, Transformers</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '2rem', borderRadius: '0px' }}>
          <div className="section-num" style={{ marginBottom: '0.4rem' }}>
            03 / PERSISTENCE & AUDIT ENGINE
          </div>
          <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#191716', marginBottom: '1.25rem' }}>
            Database & Model Registry
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #D8D2CC' }}>
              <span style={{ color: '#625E5A', fontWeight: 600 }}>Relational Database:</span>
              <span style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'uppercase', color: '#FFFFFF', backgroundColor: '#B4232D', padding: '2px 6px' }}>
                SQLite / PostgreSQL Active
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #D8D2CC' }}>
              <span style={{ color: '#625E5A', fontWeight: 600 }}>MLflow Tracking URI:</span>
              <span style={{ fontFamily: 'monospace', color: '#861C24', fontWeight: 600 }}>sqlite:///./mlflow.db</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #D8D2CC' }}>
              <span style={{ color: '#625E5A', fontWeight: 600 }}>Data Leakage Policy:</span>
              <span style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'uppercase', color: '#B4232D', border: '1px solid #D8D2CC', padding: '2px 6px' }}>
                Stratified 70/15/15 Active
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

