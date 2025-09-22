'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AIResponse } from '@/lib/api';
import { BookOpen, Brain, CheckCircle } from 'lucide-react';

interface RevisionPreviewProps {
  content: AIResponse;
  title: string;
  educationLevel: string;
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function RevisionPreview({ content, title, educationLevel }: RevisionPreviewProps) {
  const renderExercise = (exercise: any, index: number) => {
    switch (exercise.type) {
      case 'multiple_choice':
        return (
          <div key={index} className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              QCM
            </h4>
            <p className="text-sm">{exercise.question}</p>
            {exercise.options && (
              <div className="space-y-1 ml-4">
                {exercise.options.map((option: string, optIndex: number) => (
                  <div key={optIndex} className="text-sm text-muted-foreground">
                    {option}
                  </div>
                ))}
              </div>
            )}
            {exercise.answer && (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                <strong>Réponse:</strong> {exercise.answer}
              </div>
            )}
          </div>
        );

      case 'true_false':
        return (
          <div key={index} className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              Vrai/Faux
            </h4>
            <p className="text-sm">{exercise.question}</p>
            {exercise.answer && (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                <strong>Réponse:</strong> {exercise.answer}
              </div>
            )}
          </div>
        );

      case 'fill_blank':
        return (
          <div key={index} className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <span className="bg-orange-100 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              Compléter
            </h4>
            <p className="text-sm">{exercise.question}</p>
            {exercise.answer && (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                <strong>Réponse:</strong> {exercise.answer}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div key={index} className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <span className="bg-gray-100 text-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              Question
            </h4>
            <p className="text-sm">{exercise.question}</p>
            {exercise.answer && (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                <strong>Réponse suggérée:</strong> {exercise.answer}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {title}
              </CardTitle>
              <CardDescription>
                Aperçu de votre fiche de révision pour le niveau {educationLevel}
              </CardDescription>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              {educationLevel}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Points clés à retenir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {content.content.split('\n').map((paragraph, index) => {
              if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('• ')) {
                return (
                  <div key={index} className="flex items-start gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{paragraph.trim().substring(2)}</span>
                  </div>
                );
              } else if (paragraph.trim()) {
                return (
                  <p key={index} className="text-sm mb-2">
                    {paragraph.trim()}
                  </p>
                );
              }
              return null;
            })}
          </div>
        </CardContent>
      </Card>

      {content.exercises && content.exercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exercices</CardTitle>
            <CardDescription>
              {content.exercises.length} exercice{content.exercises.length > 1 ? 's' : ''} pour tester vos connaissances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {content.exercises.map((exercise, index) => renderExercise(exercise, index))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          ✨ Cette fiche a été générée automatiquement par l’IA
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Le PDF est optimisé pour l’impression et contient tous les éléments ci-dessus
        </p>
      </div>
    </div>
  );
}