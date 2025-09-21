import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for AI processing
});

export interface EducationLevel {
  code: string;
  name: string;
  description: string;
  ageRange: string;
}

export interface Exercise {
  type: 'multiple_choice' | 'fill_blank' | 'short_answer' | 'true_false';
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface AIResponse {
  title: string;
  content: string;
  exercises: Exercise[];
}

export interface RevisionSheet {
  id: string;
  title: string;
  educationLevel: string;
  content: AIResponse;
  aiProvider: 'openai' | 'mistral';
  createdAt: string;
  updatedAt: string;
  hasImage: boolean;
  hasLessonsPdf: boolean;
  hasExercisesPdf: boolean;
  hasCorrectionsPdf: boolean;
}

export interface AIModelInfo {
  available: boolean;
  model: string;
  displayName: string;
  apiType: 'responses' | 'chat-completions';
}

export interface AIModelsResponse {
  success: boolean;
  models: {
    openai: AIModelInfo;
    mistral: AIModelInfo;
  };
  timestamp: string;
}

export interface GenerateRevisionResponse {
  success: boolean;
  id: string;
  title: string;
  content: AIResponse;
  provider: 'openai' | 'mistral';
  message?: string;
}

export const generateRevisionSheet = async (
  imageFile: File,
  educationLevel: string,
  preferredAI: 'openai' | 'mistral' = 'openai'
): Promise<GenerateRevisionResponse> => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('educationLevel', educationLevel);
  formData.append('preferredAI', preferredAI);

  const response = await api.post('/api/revision/generate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getRevisionSheet = async (id: string): Promise<{ success: boolean; data: RevisionSheet }> => {
  const response = await api.get(`/api/revision/${id}`);
  return response.data;
};

export const getAllRevisionSheets = async (
  educationLevel?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ success: boolean; data: RevisionSheet[]; total: number }> => {
  const params = new URLSearchParams();
  if (educationLevel) params.append('educationLevel', educationLevel);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await api.get(`/api/revision?${params.toString()}`);
  return response.data;
};

export const getEducationLevels = async (): Promise<{ levels: EducationLevel[]; total: number }> => {
  const response = await api.get('/api/health/education-levels');
  return response.data;
};

export const getLessonsPdfUrl = (id: string): string => {
  return `${API_BASE_URL}/api/revision/${id}/pdf/lessons`;
};

export const getExercisesPdfUrl = (id: string): string => {
  return `${API_BASE_URL}/api/revision/${id}/pdf/exercises`;
};

export const getCorrectionsPdfUrl = (id: string): string => {
  return `${API_BASE_URL}/api/revision/${id}/pdf/corrections`;
};

// Legacy function for backward compatibility
export const getPdfUrl = (id: string): string => {
  return getCorrectionsPdfUrl(id);
};

export const getImageUrl = (id: string): string => {
  return `${API_BASE_URL}/api/revision/${id}/image`;
};

export const deleteRevisionSheet = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/api/revision/${id}`);
  return response.data;
};

export const getAIModels = async (): Promise<AIModelsResponse> => {
  const response = await api.get('/api/health/ai-models');
  return response.data;
};