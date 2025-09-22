import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

import { ensureDatabase, getRevisionSheet } from '@/server/models/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sanitizeFileName = (value: string): string =>
  value.replace(/[^a-z0-9-_]+/gi, '_');

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

    if (!revisionSheet.exercisesPdfPath) {
      return NextResponse.json(
        {
          success: false,
          message: 'Exercises PDF not yet generated',
        },
        { status: 404 },
      );
    }

    const absolutePath = path.resolve(revisionSheet.exercisesPdfPath);
    const pdfBuffer = await fs.readFile(absolutePath);
    const filename = `${sanitizeFileName(revisionSheet.title)}_exercices.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error serving exercises PDF:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to serve exercises PDF',
      },
      { status: 500 },
    );
  }
}
