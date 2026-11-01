import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { Dataset, ValidationSummary } from '../types';
import { Upload, RefreshCw } from 'lucide-react';

export const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetCol, setTargetCol] = useState('target');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const list = await ApiService.listDatasets();
      setDatasets(list);
      if (list.length > 0) {
        selectDataset(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectDataset = async (dataset: Dataset) => {
    setSelectedDataset(dataset);
    const val = await ApiService.getDatasetValidation(dataset.id);
    setValidation(val);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) return;
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('target_column', targetCol);

      const created = await ApiService.uploadDataset(formData);
      await loadDatasets();
      selectDataset(created);
      setName('');
      setDescription('');
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '2.5rem auto', padding: '0 2rem' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="section-num" style={{ marginBottom: '0.4rem' }}>
              01 / CLINICAL DATA PIPELINE & VALIDATION
            </div>
            <h1 className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 600, color: '#191716', lineHeight: 1.15 }}>
              Dataset Repository & Ingestion Engine
            </h1>
            <p style={{ color: '#625E5A', fontSize: '0.9rem', marginTop: '0.4rem', fontFamily: 'Inter, sans-serif' }}>
              Multi-threaded Polars transformation engine paired with pandas exploratory statistics and strict leakage validation.
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ borderRadius: '0px', fontSize: '0.75rem', padding: '0.5rem 0.85rem' }} 
            onClick={loadDatasets}
          >
            <RefreshCw size={13} />
            <span>RE-INDEX REPOSITORY</span>
          </button>
        </div>
        <div className="thin-divider" style={{ marginTop: '1.5rem' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
        
        {/* Upload & Dataset Selector Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Upload Card */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '1.75rem', borderRadius: '0px' }}>
            <div className="section-num" style={{ marginBottom: '0.4rem' }}>
              02 / INGESTION FORM
            </div>
            <h3 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 600, color: '#191716', marginBottom: '1.25rem' }}>
              Upload Patient Record Set
            </h3>

            {error && (
              <div style={{ backgroundColor: '#F4DDDE', borderLeft: '4px solid #B4232D', color: '#64141A', padding: '0.65rem 0.85rem', fontSize: '0.8rem', marginBottom: '1rem', fontFamily: 'Inter, sans-serif' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                  Dataset Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diabetes 130-US Hospitals Readmission"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                  Clinical Description
                </label>
                <input
                  type="text"
                  placeholder="De-identified patient cohort features"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                  Target Label Column
                </label>
                <input
                  type="text"
                  placeholder="target"
                  value={targetCol}
                  onChange={(e) => setTargetCol(e.target.value)}
                  style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.675rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                  File Source (CSV / Parquet &le; 100MB)
                </label>
                <input
                  type="file"
                  accept=".csv,.parquet"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  style={{ borderRadius: '0px', borderColor: '#D8D2CC', padding: '0.4rem' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '0.5rem', borderRadius: '0px', padding: '0.65rem' }} 
                disabled={uploading}
              >
                <Upload size={14} />
                <span>{uploading ? 'INGESTING & VALIDATING...' : 'UPLOAD & VALIDATE COHORT'}</span>
              </button>
            </form>
          </div>

          {/* Dataset List */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '1.75rem', borderRadius: '0px' }}>
            <div className="section-num" style={{ marginBottom: '0.4rem' }}>
              03 / REPOSITORY INDEX
            </div>
            <h3 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 600, color: '#191716', marginBottom: '1.25rem' }}>
              Active Datasets
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {datasets.map((d) => {
                const isSelected = selectedDataset?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => selectDataset(d)}
                    style={{
                      padding: '1rem',
                      borderRadius: '0px',
                      border: isSelected ? '1px solid #B4232D' : '1px solid #D8D2CC',
                      backgroundColor: isSelected ? '#FAF9F6' : '#FFFFFF',
                      borderLeft: isSelected ? '4px solid #B4232D' : '1px solid #D8D2CC',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="font-serif" style={{ fontWeight: 600, fontSize: '1.05rem', color: '#191716' }}>
                        {d.name}
                      </span>
                      <span style={{ fontSize: '0.625rem', color: '#B4232D', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                        {d.processing_status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#625E5A', marginTop: '0.35rem', fontFamily: 'Inter, sans-serif' }}>
                      <span className="num-serif" style={{ fontSize: '0.9rem', color: '#191716' }}>{d.row_count}</span> rows &bull; <span className="num-serif" style={{ fontSize: '0.9rem', color: '#191716' }}>{d.column_count}</span> cols &bull; {d.file_format.toUpperCase()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dataset Details & Validation Report Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {selectedDataset && validation ? (
            <>
              {/* Validation Summary Header Card */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', borderTop: '4px solid #B4232D', padding: '2rem', borderRadius: '0px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.675rem', color: validation.is_valid ? '#B4232D' : '#64141A', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.35rem' }}>
                      {validation.is_valid ? 'VALIDATED COHORT — READY FOR MODELING' : 'VALIDATION FAILED'}
                    </div>
                    <h2 className="font-serif" style={{ fontSize: '2rem', fontWeight: 600, color: '#191716', lineHeight: 1.15 }}>
                      {selectedDataset.name}
                    </h2>
                    <p style={{ color: '#625E5A', fontSize: '0.875rem', marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>
                      {selectedDataset.description}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.775rem', color: '#625E5A', fontFamily: 'Inter, sans-serif' }}>
                    <div>Target Column: <strong style={{ color: '#B4232D' }}>{selectedDataset.target_column}</strong></div>
                    <div>Uploaded: {new Date(selectedDataset.upload_date).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Stat Grid — Cormorant Garamond Numbers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', backgroundColor: '#FAF9F6', padding: '1.25rem', border: '1px solid #D8D2CC' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#625E5A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>RECORD COUNT</span>
                    <div className="num-serif" style={{ fontSize: '1.8rem', color: '#191716', lineHeight: 1.1 }}>{validation.row_count}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#625E5A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>FEATURE COLUMNS</span>
                    <div className="num-serif" style={{ fontSize: '1.8rem', color: '#191716', lineHeight: 1.1 }}>{validation.column_count}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#625E5A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>DUPLICATES</span>
                    <div className="num-serif" style={{ fontSize: '1.8rem', color: validation.duplicate_rows > 0 ? '#B4232D' : '#191716', lineHeight: 1.1 }}>
                      {validation.duplicate_rows}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#625E5A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>PIPELINE ENGINE</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#B4232D', marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>Polars + pandas</div>
                  </div>
                </div>
              </div>

              {/* Class Imbalance & Feature Schema Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                
                {/* Target Class Distribution */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '1.75rem', borderRadius: '0px' }}>
                  <div className="section-num" style={{ marginBottom: '0.4rem' }}>
                    04 / TARGET DISTRIBUTION
                  </div>
                  <h3 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 600, color: '#191716', marginBottom: '1.25rem' }}>
                    Class Imbalance Profile
                  </h3>

                  {validation.class_imbalance ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {Object.entries(validation.class_imbalance).map(([clsKey, clsInfo]) => (
                        <div key={clsKey} style={{ backgroundColor: '#FAF9F6', padding: '1rem', border: '1px solid #D8D2CC' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', fontFamily: 'Inter, sans-serif' }}>
                            <span style={{ fontWeight: 600, color: '#191716' }}>
                              Class {clsKey} {clsKey === '1' ? '(High Risk / Positive)' : '(Low Risk / Negative)'}
                            </span>
                            <strong style={{ color: clsKey === '1' ? '#B4232D' : '#625E5A' }}>
                              <span className="num-serif" style={{ fontSize: '0.95rem' }}>{clsInfo.count}</span> ({(clsInfo.ratio * 100).toFixed(1)}%)
                            </strong>
                          </div>
                          <div style={{ height: '4px', backgroundColor: '#D8D2CC' }}>
                            <div
                              style={{
                                width: `${clsInfo.ratio * 100}%`,
                                height: '100%',
                                backgroundColor: clsKey === '1' ? '#B4232D' : '#625E5A'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#625E5A', fontSize: '0.85rem' }}>No class imbalance data.</p>
                  )}
                </div>

                {/* Feature Column Schema */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '1.75rem', borderRadius: '0px' }}>
                  <div className="section-num" style={{ marginBottom: '0.4rem' }}>
                    05 / FEATURE SCHEMA
                  </div>
                  <h3 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 600, color: '#191716', marginBottom: '1.25rem' }}>
                    Column Types & Specs
                  </h3>

                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>COLUMN NAME</th>
                          <th>DATA TYPE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(validation.column_types || {}).map(([colName, colDtype]) => (
                          <tr key={colName}>
                            <td style={{ fontWeight: 600, color: colName === selectedDataset.target_column ? '#B4232D' : '#191716' }}>
                              {colName} {colName === selectedDataset.target_column && '(Target)'}
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#625E5A' }}>{colDtype}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '4rem 2rem', textAlign: 'center' }}>
              <p className="font-serif" style={{ fontSize: '1.4rem', color: '#625E5A' }}>
                Select a dataset from the repository index to review validation reports.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

