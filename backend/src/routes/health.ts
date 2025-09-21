import express from 'express';
import { getDatabase } from '../models/database';
import { EDUCATION_LEVELS } from '../config/education';

const router = express.Router();

// Helper function to get AI model configurations
const getAIModelConfig = () => {
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const mistralModel = 'pixtral-12b-2409'; // Fixed model for Mistral

  return {
    openai: {
      available: !!process.env.OPENAI_API_KEY,
      model: openaiModel,
      displayName: getOpenAIDisplayName(openaiModel),
      apiType: /^gpt-5/i.test(openaiModel) ? 'responses' : 'chat-completions'
    },
    mistral: {
      available: !!process.env.MISTRAL_API_KEY,
      model: mistralModel,
      displayName: 'Pixtral 12B',
      apiType: 'chat-completions'
    }
  };
};

// Helper function to get display names for OpenAI models
const getOpenAIDisplayName = (model: string): string => {
  const modelMap: { [key: string]: string } = {
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4o': 'GPT-4o',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4-vision-preview': 'GPT-4 Vision',
    'gpt-5-preview': 'GPT-5 Preview',
    'gpt-5': 'GPT-5'
  };

  // Check for exact match first
  if (modelMap[model]) {
    return modelMap[model];
  }

  // Check for pattern matches
  if (/^gpt-5/i.test(model)) {
    return 'GPT-5 Series';
  }
  if (/^gpt-4o/i.test(model)) {
    return 'GPT-4o Series';
  }
  if (/^gpt-4/i.test(model)) {
    return 'GPT-4 Series';
  }

  // Fallback to formatted model name
  return model.toUpperCase().replace(/-/g, ' ');
};

router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM revision_sheets');
    const result = stmt.get() as { count: number };
    const aiConfig = getAIModelConfig();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        totalSheets: result.count
      },
      ai: aiConfig,
      features: {
        aiProviders: Object.keys(aiConfig).filter(provider => aiConfig[provider as keyof typeof aiConfig].available),
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

// New endpoint specifically for AI model information
router.get('/ai-models', (req, res) => {
  try {
    const aiConfig = getAIModelConfig();

    res.json({
      success: true,
      models: aiConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI models endpoint failed:', error);
    res.status(500).json({
      success: false,
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