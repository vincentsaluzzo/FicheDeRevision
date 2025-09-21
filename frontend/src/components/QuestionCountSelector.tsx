'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface QuestionCountSelectorProps {
  value: number;
  onValueChange: (count: number) => void;
  disabled?: boolean;
}

const questionCounts = [
  { value: 2, label: '2 questions', description: 'Révision rapide' },
  { value: 3, label: '3 questions', description: 'Révision courte' },
  { value: 4, label: '4 questions', description: 'Révision standard' },
  { value: 5, label: '5 questions', description: 'Révision approfondie' },
  { value: 6, label: '6 questions', description: 'Révision complète' },
  { value: 8, label: '8 questions', description: 'Révision intensive' },
];

export function QuestionCountSelector({ value, onValueChange, disabled = false }: QuestionCountSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          Nombre de questions
        </CardTitle>
        <CardDescription>
          Choisissez le nombre d'exercices à générer pour votre fiche
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {questionCounts.map((count) => (
            <Button
              key={count.value}
              variant={value === count.value ? 'default' : 'outline'}
              onClick={() => onValueChange(count.value)}
              disabled={disabled}
              className="h-auto p-3 flex flex-col items-center gap-1"
            >
              <span className="font-semibold">{count.label}</span>
              <span className="text-xs opacity-75">{count.description}</span>
            </Button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Recommandation :</strong> 4 questions offrent un bon équilibre entre temps de génération et couverture du contenu.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}