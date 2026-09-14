import { Dataset, ValidationSummary, ModelVersion, PredictionResult, NLPResult, Experiment } from '../types';

const API_BASE = 'http://localhost:8000/api/v1';

export class ApiService {
  private static token: string | null = localStorage.getItem('healthlens_token');

  static setToken(token: string) {
    this.token = token;
    localStorage.setItem('healthlens_token', token);
  }

  static getToken(): string | null {
    return this.token;
  }

  static clearToken() {
    this.token = null;
    localStorage.removeItem('healthlens_token');
  }

  private static getHeaders() {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Auth
  static async login(email: string, pass: string) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', pass);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    if (!res.ok) throw new Error('Login failed. Please check your credentials.');
    const data = await res.json();
    this.setToken(data.access_token);
    return data;
  }

  static async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: this.getHeaders() });
    if (!res.ok) return null;
    return await res.json();
  }

  // Datasets
  static async listDatasets(): Promise<Dataset[]> {
    const res = await fetch(`${API_BASE}/datasets`, { headers: this.getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  }

  static async getDatasetValidation(datasetId: number): Promise<ValidationSummary | null> {
    const res = await fetch(`${API_BASE}/datasets/${datasetId}/validation`, { headers: this.getHeaders() });
    if (!res.ok) return null;
    return await res.json();
  }

  static async uploadDataset(formData: FormData): Promise<Dataset> {
    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return await res.json();
  }

  // Training & Models
  static async startTraining(datasetId: number, modelType: string, modelName: string) {
    const res = await fetch(`${API_BASE}/training/run`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId, model_type: modelType, model_name: modelName }),
    });
    if (!res.ok) throw new Error('Failed to submit training job');
    return await res.json();
  }

  static async listModels(): Promise<ModelVersion[]> {
    const res = await fetch(`${API_BASE}/models`, { headers: this.getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  }

  static async updateModelStatus(versionId: number, status: string) {
    const res = await fetch(`${API_BASE}/models/${versionId}/status`, {
      method: 'PATCH',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Status update failed');
    return await res.json();
  }

  // Predictions
  static async predictPatientRisk(modelVersionId: number, features: Record<string, number>, threshold: number): Promise<PredictionResult> {
    const res = await fetch(`${API_BASE}/predictions/patient-risk`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_version_id: modelVersionId, features, threshold }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Prediction failed');
    }
    return await res.json();
  }

  // NLP
  static async analyzeClinicalText(text: string): Promise<NLPResult> {
    const res = await fetch(`${API_BASE}/nlp/analyze`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('NLP analysis failed');
    return await res.json();
  }

  static async searchClinicalNotes(query: string) {
    const res = await fetch(`${API_BASE}/nlp/search`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('Semantic search failed');
    return await res.json();
  }

  // Experiments
  static async listExperiments(): Promise<Experiment[]> {
    const res = await fetch(`${API_BASE}/experiments`, { headers: this.getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  }
}
