export interface User {
  id: number;
  email: string;
  full_name?: string;
  role: 'ADMIN' | 'USER';
}

export interface Dataset {
  id: number;
  name: string;
  description?: string;
  file_format: string;
  row_count: number;
  column_count: number;
  upload_date: string;
  target_column?: string;
  processing_status: string;
}

export interface ValidationSummary {
  is_valid: boolean;
  validation_message: string;
  row_count: number;
  column_count: number;
  missing_values: Record<string, number>;
  duplicate_rows: number;
  column_types: Record<string, string>;
  constant_columns: string[];
  potential_id_columns: string[];
  class_imbalance?: Record<string, { count: number; ratio: number }>;
}

export interface ModelVersion {
  id: number;
  model_id: number;
  model_name: string;
  model_type: string;
  version_tag: string;
  status: 'EXPERIMENTAL' | 'VALIDATED' | 'PRODUCTION' | 'ARCHIVED';
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  roc_auc?: number;
  pr_auc?: number;
  latency_ms?: number;
  created_at: string;
}

export interface ShapExplanation {
  feature: string;
  value: number;
  shap_value: number;
  impact: 'HIGH_RISK' | 'LOW_RISK' | 'NEUTRAL';
}

export interface PredictionResult {
  prediction_id: number;
  predicted_class: number;
  probability: number;
  probability_percentage: string;
  risk_category: 'LOW' | 'MODERATE' | 'HIGH';
  threshold_used: number;
  model_name: string;
  model_version: string;
  shap_explanations: ShapExplanation[];
}

export interface NLPResult {
  classification: {
    predicted_category: string;
    urgency_level: string;
    confidence_score: number;
  };
  entities: Array<{ text: string; category: string }>;
  summary: {
    symptoms: string[];
    conditions: string[];
    medications: string[];
    investigations: string[];
  };
}

export interface Experiment {
  id: number;
  name: string;
  dataset_version_tag: string;
  framework: string;
  model_type: string;
  hyperparams: Record<string, any>;
  metrics: Record<string, any>;
  created_at: string;
}
