'use client';

import { RevisionHistory } from '@/components/RevisionHistory';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const router = useRouter();

  const handleViewDetail = (revisionId: string) => {
    router.push(`/revision/${revisionId}`);
  };

  return <RevisionHistory onViewDetail={handleViewDetail} />;
}