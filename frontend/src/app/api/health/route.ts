import { NextRequest, NextResponse } from 'next/server';

import { EDUCATION_LEVELS } from '@/server/config/education';
import { ensureDatabase, getDatabase } from '@/server/models/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getOpenAIDisplayName = (model: string): string => {
  const modelMap: Record<string, string> = {
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4o': 'GPT-4o',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4-vision-preview': 'GPT-4 Vision',
    'gpt-5-preview': 'GPT-5 Preview',
    'gpt-5': 'GPT-5',
  };

  if (modelMap[model]) {
    return modelMap[model];
  }

  if (/^gpt-5/i.test(model)) {
    return 'GPT-5 Series';
  }
  if (/^gpt-4o/i.test(model)) {
    return 'GPT-4o Series';
  }
  if (/^gpt-4/i.test(model)) {
    return 'GPT-4 Series';
  }

  return model.toUpperCase().replace(/-/g, ' ');
};

const getAIModelConfig = () => {
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const mistralModel = 'pixtral-12b-2409';

  return {
    openai: {
      available: !!process.env.OPENAI_API_KEY,
      model: openaiModel,
      displayName: getOpenAIDisplayName(openaiModel),
      apiType: /^gpt-5/i.test(openaiModel) ? 'responses' : 'chat-completions',
    },
    mistral: {
      available: !!process.env.MISTRAL_API_KEY,
      model: mistralModel,
      displayName: 'Pixtral 12B',
      apiType: 'chat-completions',
    },
  } as const;
};

export async function GET(_request: NextRequest) {
  try {
    await ensureDatabase();

    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM revision_sheets');
    const result = stmt.get() as { count: number };
    const aiConfig = getAIModelConfig();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        totalSheets: result.count,
      },
      ai: aiConfig,
      features: {
        aiProviders: Object.keys(aiConfig).filter(
          (provider) => aiConfig[provider as keyof typeof aiConfig].available,
        ),
        supportedFormats: ['pdf'],
        educationLevels: EDUCATION_LEVELS.map((level) => level.code),
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
