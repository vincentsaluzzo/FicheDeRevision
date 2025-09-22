import { NextRequest, NextResponse } from 'next/server';

import { EDUCATION_LEVELS } from '@/server/config/education';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    levels: EDUCATION_LEVELS,
    total: EDUCATION_LEVELS.length,
  });
}
