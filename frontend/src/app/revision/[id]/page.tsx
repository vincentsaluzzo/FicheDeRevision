'use client';

import { RevisionDetail } from '@/components/RevisionDetail';
import { useParams } from 'next/navigation';

export default function RevisionDetailPage() {
  const params = useParams();
  const revisionId = params.id as string;

  return <RevisionDetail revisionId={revisionId} />;
}