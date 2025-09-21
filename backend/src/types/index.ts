export interface EducationLevel {
  code: string;
  name: string;
  description: string;
  ageRange: string;
}

export interface RevisionSheet {
  id: string;
  title: string;
  educationLevel: string;
  imagePath: string;
  pdfPath: string;
  content: string;
  aiProvider: 'openai' | 'mistral';
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateRevisionRequest {
  image: Express.Multer.File;
  educationLevel: string;
  preferredAI?: 'openai' | 'mistral';
}

export interface GenerateRevisionResponse {
  id: string;
  title: string;
  content: string;
  pdfUrl: string;
  success: boolean;
  message?: string;
}

export interface AIResponse {
  title: string;
  content: string;
  exercises: Exercise[];
}

export interface Exercise {
  type: 'multiple_choice' | 'fill_blank' | 'short_answer' | 'true_false';
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface DatabaseRevisionSheet {
  id: string;
  title: string;
  education_level: string;
  image_path: string;
  pdf_path: string;
  content: string;
  ai_provider: string;
  created_at: string;
  updated_at: string;
}