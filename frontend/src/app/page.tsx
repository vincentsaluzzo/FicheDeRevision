'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, History, Sparkles, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6" />
            Bienvenue
          </CardTitle>
          <CardDescription className="text-base">
            Choisissez une action pour commencer
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <Button asChild size="lg" className="w-full h-auto p-6 flex flex-col items-center gap-4">
              <Link href="/generator">
                <Plus className="w-8 h-8" />
                <div className="text-center">
                  <div className="text-lg font-semibold">Créer une nouvelle fiche</div>
                  <div className="text-sm opacity-75">
                    Uploadez une photo de cours et générez votre fiche de révision
                  </div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <Button asChild variant="outline" size="lg" className="w-full h-auto p-6 flex flex-col items-center gap-4">
              <Link href="/history">
                <History className="w-8 h-8" />
                <div className="text-center">
                  <div className="text-lg font-semibold">Voir l'historique</div>
                  <div className="text-sm opacity-75">
                    Accédez à vos fiches de révision précédentes
                  </div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">1. Uploadez</h3>
              <p className="text-sm text-muted-foreground">
                Prenez une photo de vos cours ou notes
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">2. Générez</h3>
              <p className="text-sm text-muted-foreground">
                L'IA analyse et crée votre fiche personnalisée
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">3. Téléchargez</h3>
              <p className="text-sm text-muted-foreground">
                Récupérez 3 PDFs : leçons, exercices et corrections
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}