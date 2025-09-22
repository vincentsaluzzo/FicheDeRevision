import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

import { isValidEducationLevel } from '@/server/config/education';
import {
  createRevisionSheet,
  ensureDatabase,
  updateRevisionSheetAllPdfs,
} from '@/server/models/database';
import { generateRevision } from '@/server/services/aiService';
import {
  processImage,
  saveUploadedFile,
} from '@/server/services/imageService';
import { generateAllPDFs } from '@/server/services/pdfService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEBUG_AI = process.env.DEBUG_AI === 'true';

const debugLog = (message: string, data?: unknown) => {
  if (!DEBUG_AI) {
    return;
  }

  console.log(`[ROUTE DEBUG] ${message}`);
  if (data !== undefined) {
    console.log('[ROUTE DEBUG]', JSON.stringify(data, null, 2));
  }
};

const INVALID_PROVIDER_MESSAGE = 'Invalid AI provider. Must be "openai" or "mistral"';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!(imageFile instanceof File)) {
      debugLog('No file provided in request');
      return NextResponse.json(
        {
          success: false,
          message: 'No image file provided',
        },
        { status: 400 },
      );
    }

    const educationLevel = `${formData.get('educationLevel') ?? ''}`.trim();
    const preferredAI = `${formData.get('preferredAI') ?? 'openai'}`.trim() as
      | 'openai'
      | 'mistral';
    const questionCountRaw = `${formData.get('questionCount') ?? '4'}`.trim();

    debugLog('=== New revision generation request ===');
    debugLog('Request parameters', {
      educationLevel,
      preferredAI,
      questionCount: questionCountRaw,
      file: {
        name: imageFile.name,
        type: imageFile.type,
        size: imageFile.size,
      },
    });

    if (!educationLevel || !isValidEducationLevel(educationLevel)) {
      debugLog('Invalid education level', educationLevel);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or missing education level',
        },
        { status: 400 },
      );
    }

    if (preferredAI && !['openai', 'mistral'].includes(preferredAI)) {
      debugLog('Invalid AI provider', preferredAI);
      return NextResponse.json(
        {
          success: false,
          message: INVALID_PROVIDER_MESSAGE,
        },
        { status: 400 },
      );
    }

    const questionCount = Number.parseInt(questionCountRaw, 10);
    if (Number.isNaN(questionCount) || questionCount < 1 || questionCount > 10) {
      debugLog('Invalid question count', questionCountRaw);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid question count. Must be between 1 and 10',
        },
        { status: 400 },
      );
    }

    debugLog('Saving uploaded image...');
    const originalPath = await saveUploadedFile(imageFile);

    debugLog('Processing uploaded image...');
    const processedImage = await processImage(originalPath);

    debugLog('Starting AI generation...');
    const startTime = Date.now();
    const { response: aiResponse, provider } = await generateRevision(
      processedImage.processedPath,
      educationLevel,
      preferredAI,
      questionCount,
    );
    const endTime = Date.now();

    debugLog(`AI generation completed in ${endTime - startTime}ms`, {
      provider,
    });

    const id = randomUUID();
    debugLog('Generated revision sheet ID', id);

    debugLog('Saving to database...');
    const revisionSheet = createRevisionSheet({
      id,
      title: aiResponse.title,
      educationLevel: educationLevel.toUpperCase(),
      imagePath: processedImage.processedPath,
      lessonsPdfPath: '',
      exercisesPdfPath: '',
      correctionsPdfPath: '',
      content: JSON.stringify(aiResponse),
      aiProvider: provider,
    });

    const responsePayload = {
      success: true,
      id: revisionSheet.id,
      title: aiResponse.title,
      content: aiResponse,
      provider,
      message: 'Revision sheet generated successfully. PDF generation starting...',
    } as const;

    debugLog('Sending response to client', responsePayload);

    // Trigger PDF generation in the background
    debugLog('Starting background PDF generation (all three versions)...');
    generateAllPDFs(aiResponse, educationLevel, processedImage.processedPath)
      .then(({ lessonsPdf, exercisesPdf, correctionsPdf }) => {
        updateRevisionSheetAllPdfs(id, lessonsPdf, exercisesPdf, correctionsPdf);
        debugLog(`All PDFs generated successfully for ${id}`, {
          lessons: lessonsPdf,
          exercises: exercisesPdf,
          corrections: correctionsPdf,
        });
        console.log(
          `All PDFs generated for revision sheet ${id}: lessons=${lessonsPdf}, exercises=${exercisesPdf}, corrections=${correctionsPdf}`,
        );
      })
      .catch((error) => {
        debugLog(`PDF generation failed for ${id}`, error);
        console.error(`Failed to generate PDFs for revision sheet ${id}:`, error);
      });

    debugLog('=== Revision generation request completed ===');

    return NextResponse.json(responsePayload);
  } catch (error) {
    debugLog('=== Revision generation request failed ===', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    console.error('Revision generation error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate revision sheet',
      },
      { status: 500 },
    );
  }
}
