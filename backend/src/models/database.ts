import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DatabaseRevisionSheet, RevisionSheet } from '../types';

const dbPath = process.env.DATABASE_PATH || './database.sqlite';
const uploadsDir = process.env.UPLOADS_DIR || './uploads';

let db: Database.Database;

export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    db = new Database(dbPath);

    db.exec(`
      CREATE TABLE IF NOT EXISTS revision_sheets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        education_level TEXT NOT NULL,
        image_path TEXT NOT NULL,
        lessons_pdf_path TEXT,
        exercises_pdf_path TEXT,
        corrections_pdf_path TEXT,
        content TEXT NOT NULL,
        ai_provider TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: Add new columns if they don't exist (for existing databases)
    try {
      db.exec(`ALTER TABLE revision_sheets ADD COLUMN lessons_pdf_path TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      db.exec(`ALTER TABLE revision_sheets ADD COLUMN exercises_pdf_path TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      db.exec(`ALTER TABLE revision_sheets ADD COLUMN corrections_pdf_path TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_revision_sheets_education_level
      ON revision_sheets(education_level)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_revision_sheets_created_at
      ON revision_sheets(created_at DESC)
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const createRevisionSheet = (sheet: Omit<RevisionSheet, 'createdAt' | 'updatedAt'>): RevisionSheet => {
  const now = new Date();
  const stmt = db.prepare(`
    INSERT INTO revision_sheets (
      id, title, education_level, image_path, lessons_pdf_path, exercises_pdf_path, corrections_pdf_path, content, ai_provider, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    sheet.id,
    sheet.title,
    sheet.educationLevel,
    sheet.imagePath,
    sheet.lessonsPdfPath,
    sheet.exercisesPdfPath,
    sheet.correctionsPdfPath,
    sheet.content,
    sheet.aiProvider,
    now.toISOString(),
    now.toISOString()
  );

  return {
    ...sheet,
    createdAt: now,
    updatedAt: now
  };
};

export const getRevisionSheet = (id: string): RevisionSheet | null => {
  const stmt = db.prepare('SELECT * FROM revision_sheets WHERE id = ?');
  const row = stmt.get(id) as DatabaseRevisionSheet | undefined;

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    educationLevel: row.education_level,
    imagePath: row.image_path,
    lessonsPdfPath: row.lessons_pdf_path || '',
    exercisesPdfPath: row.exercises_pdf_path || '',
    correctionsPdfPath: row.corrections_pdf_path || '',
    content: row.content,
    aiProvider: row.ai_provider as 'openai' | 'mistral',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
};

export const getAllRevisionSheets = (limit: number = 50, offset: number = 0): RevisionSheet[] => {
  const stmt = db.prepare(`
    SELECT * FROM revision_sheets
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);

  const rows = stmt.all(limit, offset) as DatabaseRevisionSheet[];

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    educationLevel: row.education_level,
    imagePath: row.image_path,
    lessonsPdfPath: row.lessons_pdf_path || '',
    exercisesPdfPath: row.exercises_pdf_path || '',
    correctionsPdfPath: row.corrections_pdf_path || '',
    content: row.content,
    aiProvider: row.ai_provider as 'openai' | 'mistral',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }));
};

export const getRevisionSheetsByEducationLevel = (educationLevel: string): RevisionSheet[] => {
  const stmt = db.prepare(`
    SELECT * FROM revision_sheets
    WHERE education_level = ?
    ORDER BY created_at DESC
  `);

  const rows = stmt.all(educationLevel) as DatabaseRevisionSheet[];

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    educationLevel: row.education_level,
    imagePath: row.image_path,
    lessonsPdfPath: row.lessons_pdf_path || '',
    exercisesPdfPath: row.exercises_pdf_path || '',
    correctionsPdfPath: row.corrections_pdf_path || '',
    content: row.content,
    aiProvider: row.ai_provider as 'openai' | 'mistral',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }));
};

export const updateRevisionSheetAllPdfs = (id: string, lessonsPdfPath: string, exercisesPdfPath: string, correctionsPdfPath: string): void => {
  const stmt = db.prepare(`
    UPDATE revision_sheets
    SET lessons_pdf_path = ?, exercises_pdf_path = ?, corrections_pdf_path = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(lessonsPdfPath, exercisesPdfPath, correctionsPdfPath, id);
};

// Legacy function for backward compatibility
export const updateRevisionSheetPdfPaths = (id: string, exercisesPdfPath: string, correctionsPdfPath: string): void => {
  const stmt = db.prepare(`
    UPDATE revision_sheets
    SET exercises_pdf_path = ?, corrections_pdf_path = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(exercisesPdfPath, correctionsPdfPath, id);
};

// Keep backward compatibility
export const updateRevisionSheetPdfPath = (id: string, pdfPath: string): void => {
  const stmt = db.prepare(`
    UPDATE revision_sheets
    SET corrections_pdf_path = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(pdfPath, id);
};

export const deleteRevisionSheet = (id: string): boolean => {
  const stmt = db.prepare('DELETE FROM revision_sheets WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

export const getDatabase = (): Database.Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

export const closeDatabase = (): void => {
  if (db) {
    db.close();
  }
};