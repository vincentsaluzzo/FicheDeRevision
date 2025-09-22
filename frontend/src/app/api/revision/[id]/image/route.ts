import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

import { ensureDatabase, getRevisionSheet } from '@/server/models/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getMimeType = (filePath: string): string => {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.heic':
    case '.heif':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
};

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

    if (!revisionSheet.imagePath) {
      return NextResponse.json(
        {
          success: false,
          message: 'Image not found',
        },
        { status: 404 },
      );
    }

    const absolutePath = path.resolve(revisionSheet.imagePath);
    const imageBuffer = await fs.readFile(absolutePath);

    return new NextResponse(imageBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': getMimeType(absolutePath),
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to serve image',
      },
      { status: 500 },
    );
  }
}
