'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RevisionGenerator } from '@/components/RevisionGenerator';
import { RevisionHistory } from '@/components/RevisionHistory';
import { GraduationCap, Plus, History, Sparkles } from 'lucide-react';

type View = 'generator' | 'history';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<View>('generator');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Fiche de Révision
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Transformez vos photos de cours en fiches de révision personnalisées avec l'intelligence artificielle
          </p>
        </div>

        {/* Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={currentView === 'generator' ? 'default' : 'outline'}
                onClick={() => setCurrentView('generator')}
                className="h-12 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nouvelle fiche</span>
                <span className="sm:hidden">Créer</span>
              </Button>

              <Button
                variant={currentView === 'history' ? 'default' : 'outline'}
                onClick={() => setCurrentView('history')}
                className="h-12 flex items-center justify-center gap-2"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Historique</span>
                <span className="sm:hidden">Fiches</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
          {currentView === 'generator' ? (
            <RevisionGenerator />
          ) : (
            <RevisionHistory />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Propulsé par l'intelligence artificielle</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Générez des fiches de révision adaptées au système éducatif français
          </p>
        </div>
      </div>
    </div>
  );
}