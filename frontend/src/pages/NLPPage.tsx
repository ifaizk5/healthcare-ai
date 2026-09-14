import React, { useState } from 'react';
import { ApiService } from '../services/api';
import { NLPResult } from '../types';
import { Search, Sparkles } from 'lucide-react';

export const NLPPage: React.FC = () => {
  const [inputText, setInputText] = useState(
    "Patient is a 63-year-old male presenting with chest pain, dyspnea, and elevated serum cholesterol of 233 mg/dL. Resting blood pressure recorded at 145/90 mmHg. Past history of hypertension treated with Lisinopril 10mg daily. ECG revealed normal sinus rhythm with mild ST depression."
  );
  const [analysis, setAnalysis] = useState<NLPResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("diabetes and shortness of breath");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText) return;
    setLoading(true);
    try {
      const res = await ApiService.analyzeClinicalText(inputText);
      setAnalysis(res);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setSearching(true);
    try {
      const res = await ApiService.searchClinicalNotes(query);
      setSearchResults(res.results || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '2.5rem auto', padding: '0 2rem' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="section-num" style={{ marginBottom: '0.4rem' }}>
              01 / CLINICAL NATURAL LANGUAGE PROCESSING
            </div>
            <h1 className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 600, color: '#191716', lineHeight: 1.15 }}>
              Transformer Entity Extraction & Semantic Search
            </h1>
            <p style={{ color: '#625E5A', fontSize: '0.9rem', marginTop: '0.4rem', fontFamily: 'Inter, sans-serif' }}>
              Named Entity Recognition (NER), Transformer text classification, embedding vectors, and cosine semantic similarity search over unstructured clinical notes.
            </p>
          </div>
        </div>
        <div className="thin-divider" style={{ marginTop: '1.5rem' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
        
        {/* Left: Text Input & Entity Extraction */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', borderTop: '4px solid #B4232D', padding: '2rem', borderRadius: '0px' }}>
            <div className="section-num" style={{ marginBottom: '0.4rem' }}>
              02 / UNSTRUCTURED NOTE ANALYSIS
            </div>
            <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#191716', marginBottom: '1.25rem' }}>
              Clinical Note Input
            </h3>

            <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                  Paste Clinical Note / Discharge Summary
                </label>
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{ width: '100%', padding: '0.85rem', fontSize: '0.875rem', borderRadius: '0px', borderColor: '#D8D2CC' }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ borderRadius: '0px', padding: '0.75rem' }} disabled={loading}>
                <Sparkles size={14} />
                <span>{loading ? 'ANALYZING TEXT...' : 'EXTRACT ENTITIES & CLASSIFY'}</span>
              </button>
            </form>
          </div>

          {/* Analysis Results Display */}
          {analysis && (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '2rem', borderRadius: '0px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Classification Badge */}
              <div style={{ backgroundColor: '#64141A', color: '#FFFFFF', padding: '1.5rem', borderRadius: '0px' }}>
                <div style={{ fontSize: '0.65rem', color: '#F4DDDE', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.35rem' }}>
                  TRANSFORMER CLASSIFICATION
                </div>
                <h3 className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.15 }}>
                  {analysis.classification.predicted_category}
                </h3>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#F4DDDE', marginTop: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                  <span>Urgency: <strong style={{ color: '#FFFFFF' }}>{analysis.classification.urgency_level}</strong></span>
                  <span>Confidence: <strong className="num-serif" style={{ color: '#FFFFFF', fontSize: '1rem' }}>{(analysis.classification.confidence_score * 100).toFixed(1)}%</strong></span>
                </div>
              </div>

              {/* Extracted NER Tags */}
              <div>
                <div className="section-num" style={{ marginBottom: '0.4rem' }}>
                  NAMED ENTITIES (NER)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {analysis.entities.map((e, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.725rem',
                        fontFamily: 'Inter, sans-serif',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0px',
                        border: '1px solid #D8D2CC',
                        backgroundColor: e.category === 'Medication' ? '#B4232D' : e.category === 'Symptom' ? '#64141A' : '#FAF9F6',
                        color: e.category === 'Medication' || e.category === 'Symptom' ? '#FFFFFF' : '#191716'
                      }}
                    >
                      {e.text} &bull; <small style={{ opacity: 0.85, textTransform: 'uppercase' }}>{e.category}</small>
                    </span>
                  ))}
                </div>
              </div>

              {/* Structured Summary */}
              <div style={{ borderTop: '1px solid #D8D2CC', paddingTop: '1.25rem' }}>
                <div className="section-num" style={{ marginBottom: '0.5rem' }}>
                  STRUCTURED NOTE SUMMARY
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.825rem', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ backgroundColor: '#FAF9F6', padding: '0.85rem', border: '1px solid #D8D2CC' }}>
                    <strong style={{ color: '#B4232D', display: 'block', fontSize: '0.675rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Symptoms:</strong>
                    {analysis.summary.symptoms.join(', ')}
                  </div>
                  <div style={{ backgroundColor: '#FAF9F6', padding: '0.85rem', border: '1px solid #D8D2CC' }}>
                    <strong style={{ color: '#861C24', display: 'block', fontSize: '0.675rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Conditions:</strong>
                    {analysis.summary.conditions.join(', ')}
                  </div>
                  <div style={{ backgroundColor: '#FAF9F6', padding: '0.85rem', border: '1px solid #D8D2CC' }}>
                    <strong style={{ color: '#191716', display: 'block', fontSize: '0.675rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Medications:</strong>
                    {analysis.summary.medications.join(', ')}
                  </div>
                  <div style={{ backgroundColor: '#FAF9F6', padding: '0.85rem', border: '1px solid #D8D2CC' }}>
                    <strong style={{ color: '#625E5A', display: 'block', fontSize: '0.675rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Investigations:</strong>
                    {analysis.summary.investigations.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Semantic Search over Clinical Notes */}
        <div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '2rem', borderRadius: '0px' }}>
            <div className="section-num" style={{ marginBottom: '0.4rem' }}>
              03 / COSINE SEMANTIC SEARCH
            </div>
            <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#191716', marginBottom: '1.25rem' }}>
              Clinical Note Similarity Query
            </h3>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter query e.g. diabetes and shortness of breath"
                style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '0px', padding: '0.65rem 1.25rem' }} disabled={searching}>
                <Search size={14} />
                <span>SEARCH</span>
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {searchResults.map((res, idx) => (
                <div key={idx} style={{ backgroundColor: '#FAF9F6', padding: '1.25rem', border: '1px solid #D8D2CC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div className="font-serif" style={{ fontWeight: 600, fontSize: '1.05rem', color: '#191716' }}>
                      {res.note_id} &bull; Patient #{res.patient_id}
                    </div>
                    <span className="num-serif" style={{ fontSize: '1.1rem', color: '#B4232D', fontWeight: 600 }}>
                      {(res.similarity_score * 100).toFixed(1)}% SIMILARITY
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#625E5A', marginTop: '0.35rem', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                    {res.snippet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

