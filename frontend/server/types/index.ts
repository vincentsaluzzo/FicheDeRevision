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
  lessonsPdfPath: string;
  exercisesPdfPath: string;
  correctionsPdfPath: string;
  content: string;
  aiProvider: 'openai' | 'mistral';
  createdAt: Date;
  updatedAt: Date;
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
  lessons_pdf_path: string;
  exercises_pdf_path: string;
  corrections_pdf_path: string;
  content: string;
  ai_provider: string;
  created_at: string;
  updated_at: string;
}