'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

interface EducationLevel {
  code: string;
  name: string;
  description: string;
  ageRange: string;
}

const EDUCATION_LEVELS: EducationLevel[] = [
  {
    code: 'CP',
    name: 'Cours Préparatoire',
    description: 'Première année d’apprentissage de la lecture et de l’écriture',
    ageRange: '6-7 ans'
  },
  {
    code: 'CE1',
    name: 'Cours Élémentaire 1ère année',
    description: 'Consolidation de la lecture et introduction des mathématiques',
    ageRange: '7-8 ans'
  },
  {
    code: 'CE2',
    name: 'Cours Élémentaire 2ème année',
    description: 'Approfondissement des acquis fondamentaux',
    ageRange: '8-9 ans'
  },
  {
    code: 'CM1',
    name: 'Cours Moyen 1ère année',
    description: 'Préparation progressive au collège',
    ageRange: '9-10 ans'
  },
  {
    code: 'CM2',
    name: 'Cours Moyen 2ème année',
    description: 'Dernière année du primaire, préparation au collège',
    ageRange: '10-11 ans'
  },
  {
    code: '6E',
    name: 'Sixième',
    description: 'Première année du collège, cycle d’adaptation',
    ageRange: '11-12 ans'
  },
  {
    code: '5E',
    name: 'Cinquième',
    description: 'Cycle central du collège',
    ageRange: '12-13 ans'
  },
  {
    code: '4E',
    name: 'Quatrième',
    description: 'Cycle central du collège, approfondissement',
    ageRange: '13-14 ans'
  },
  {
    code: '3E',
    name: 'Troisième',
    description: 'Dernière année du collège, préparation au lycée',
    ageRange: '14-15 ans'
  }
];

interface EducationLevelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function EducationLevelSelector({
  value,
  onValueChange,
  disabled = false
}: EducationLevelSelectorProps) {
  const selectedLevel = EDUCATION_LEVELS.find(level => level.code === value);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Niveau scolaire
        </CardTitle>
        <CardDescription>
          Choisissez le niveau de l’élève pour adapter le contenu de la fiche de révision
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {EDUCATION_LEVELS.map((level) => (
            <Button
              key={level.code}
              variant={value === level.code ? 'default' : 'outline'}
              onClick={() => onValueChange(level.code)}
              disabled={disabled}
              className={`h-12 flex flex-col items-center justify-center text-xs sm:text-sm transition-all ${
                value === level.code
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-secondary/80'
              }`}
              size="sm"
            >
              <span className="font-bold text-base">{level.code}</span>
              <span className="text-xs opacity-75 leading-none mt-0.5">
                {level.ageRange}
              </span>
            </Button>
          ))}
        </div>

        {selectedLevel && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {selectedLevel.code}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-primary">
                  {selectedLevel.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedLevel.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                    {selectedLevel.ageRange}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • Contenu adapté au niveau
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
              Primaire
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              CP → CM2
            </div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
              Collège
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              6E → 3E
            </div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
              Adaptatif
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              IA personnalisée
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { EDUCATION_LEVELS };