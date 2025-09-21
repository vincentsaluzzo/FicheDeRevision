import express from 'express';
import { getDatabase } from '../models/database';
import { EDUCATION_LEVELS } from '../config/education';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM revision_sheets');
    const result = stmt.get() as { count: number };

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        totalSheets: result.count
      },
      features: {
        aiProviders: ['openai', 'mistral'],
        supportedFormats: ['pdf'],
        educationLevels: EDUCATION_LEVELS.map(level => level.code)
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/education-levels', (req, res) => {
  res.json({
    levels: EDUCATION_LEVELS,
    total: EDUCATION_LEVELS.length
  });
});

export default router;