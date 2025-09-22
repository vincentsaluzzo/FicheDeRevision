import { NextRequest, NextResponse } from 'next/server';

import { isValidEducationLevel } from '@/server/config/education';
import {
  ensureDatabase,
  getAllRevisionSheets,
  getRevisionSheetsByEducationLevel,
} from '@/server/models/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();

    const searchParams = request.nextUrl.searchParams;
    const educationLevelParam = searchParams.get('educationLevel');
    const limitParam = searchParams.get('limit') ?? '50';
    const offsetParam = searchParams.get('offset') ?? '0';

    const limit = Number.parseInt(limitParam, 10);
    const offset = Number.parseInt(offsetParam, 10);

    if (educationLevelParam && !isValidEducationLevel(educationLevelParam)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid education level',
        },
        { status: 400 },
      );
    }

    const revisionSheets = educationLevelParam
      ? getRevisionSheetsByEducationLevel(educationLevelParam.toUpperCase())
      : getAllRevisionSheets(Number.isNaN(limit) ? 50 : limit, Number.isNaN(offset) ? 0 : offset);

    const data = revisionSheets.map((sheet) => ({
      id: sheet.id,
      title: sheet.title,
      educationLevel: sheet.educationLevel,
      aiProvider: sheet.aiProvider,
      createdAt: sheet.createdAt,
      updatedAt: sheet.updatedAt,
      hasImage: !!sheet.imagePath,
      hasLessonsPdf: !!sheet.lessonsPdfPath,
      hasExercisesPdf: !!sheet.exercisesPdfPath,
      hasCorrectionsPdf: !!sheet.correctionsPdfPath,
    }));

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error('Error fetching revision sheets:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch revision sheets',
      },
      { status: 500 },
    );
  }
}
