import { NextRequest, NextResponse } from 'next/server';

import {
  deleteRevisionSheet,
  ensureDatabase,
  getRevisionSheet,
} from '@/server/models/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await ensureDatabase();

    const revisionSheet = getRevisionSheet(params.id);
    if (!revisionSheet) {
      return NextResponse.json(
        {
          success: false,
          message: 'Revision sheet not found',
        },
        { status: 404 },
      );
    }

    const content = JSON.parse(revisionSheet.content);

    return NextResponse.json({
      success: true,
      data: {
        id: revisionSheet.id,
        title: revisionSheet.title,
        educationLevel: revisionSheet.educationLevel,
        content,
        aiProvider: revisionSheet.aiProvider,
        createdAt: revisionSheet.createdAt,
        updatedAt: revisionSheet.updatedAt,
        hasImage: !!revisionSheet.imagePath,
        hasLessonsPdf: !!revisionSheet.lessonsPdfPath,
        hasExercisesPdf: !!revisionSheet.exercisesPdfPath,
        hasCorrectionsPdf: !!revisionSheet.correctionsPdfPath,
      },
    });
  } catch (error) {
    console.error('Error fetching revision sheet:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch revision sheet',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await ensureDatabase();

    const deleted = deleteRevisionSheet(params.id);
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: 'Revision sheet not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Revision sheet deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting revision sheet:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete revision sheet',
      },
      { status: 500 },
    );
  }
}
