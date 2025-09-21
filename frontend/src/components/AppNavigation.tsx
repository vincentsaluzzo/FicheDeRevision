'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, History, ArrowLeft } from 'lucide-react';

export function AppNavigation() {
  const pathname = usePathname();

  const isDetailPage = pathname.startsWith('/revision/');
  const isGeneratorPage = pathname === '/' || pathname === '/generator';
  const isHistoryPage = pathname === '/history';

  if (isDetailPage) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <Button asChild variant="outline" className="h-12 flex items-center justify-center gap-2">
            <Link href="/history">
              <ArrowLeft className="w-4 h-4" />
              Retour à l'historique
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            asChild
            variant={isGeneratorPage ? 'default' : 'outline'}
            className="h-12 flex items-center justify-center gap-2"
          >
            <Link href="/generator">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle fiche</span>
              <span className="sm:hidden">Créer</span>
            </Link>
          </Button>

          <Button
            asChild
            variant={isHistoryPage ? 'default' : 'outline'}
            className="h-12 flex items-center justify-center gap-2"
          >
            <Link href="/history">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Historique</span>
              <span className="sm:hidden">Fiches</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}