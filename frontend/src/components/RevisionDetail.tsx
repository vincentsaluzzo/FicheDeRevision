'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RevisionPreview } from '@/components/RevisionPreview';
import { getRevisionSheet, getLessonsPdfUrl, getExercisesPdfUrl, getCorrectionsPdfUrl, getImageUrl, RevisionSheet } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  Loader2,
  AlertCircle,
  FileText,
  BookOpen,
  Calendar,
  Brain,
  GraduationCap,
  Image as ImageIcon
} from 'lucide-react';

interface RevisionDetailProps {
  revisionId: string;
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function RevisionDetail({ revisionId }: RevisionDetailProps) {
  const [sheet, setSheet] = useState<RevisionSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRevisionSheet();
  }, [revisionId]);

  const loadRevisionSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRevisionSheet(revisionId);
      setSheet(response.data);
    } catch (err) {
      setError('Impossible de charger la fiche de révision');
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger la fiche de révision",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLessons = () => {
    if (!sheet?.hasLessonsPdf) {
      toast({
        title: "PDF non disponible",
        description: "Le PDF des leçons n'est pas encore généré",
        variant: "destructive",
      });
      return;
    }

    const url = getLessonsPdfUrl(sheet.id);
    window.open(url, '_blank');
  };

  const handleDownloadExercises = () => {
    if (!sheet?.hasExercisesPdf) {
      toast({
        title: "PDF non disponible",
        description: "Le PDF des exercices n'est pas encore généré",
        variant: "destructive",
      });
      return;
    }

    const url = getExercisesPdfUrl(sheet.id);
    window.open(url, '_blank');
  };

  const handleDownloadCorrections = () => {
    if (!sheet?.hasCorrectionsPdf) {
      toast({
        title: "PDF non disponible",
        description: "Le PDF avec corrections n'est pas encore généré",
        variant: "destructive",
      });
      return;
    }

    const url = getCorrectionsPdfUrl(sheet.id);
    window.open(url, '_blank');
  };

  const getAIProviderBadge = (provider: 'openai' | 'mistral') => {
    return provider === 'openai' ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        OpenAI
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        Mistral AI
      </Badge>
    );
  };

  const getEducationLevelColor = (level: string) => {
    const primaryLevels = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];
    const collegeLevels = ['6E', '5E', '4E', '3E'];

    if (primaryLevels.includes(level)) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (collegeLevels.includes(level)) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement de la fiche de révision...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !sheet) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <div>
              <p className="font-medium">Erreur de chargement</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={loadRevisionSheet} size="sm">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card with Sheet Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{sheet.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(sheet.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  {getAIProviderBadge(sheet.aiProvider)}
                </div>
              </div>
            </div>
            <Badge className={getEducationLevelColor(sheet.educationLevel)}>
              <GraduationCap className="w-3 h-3 mr-1" />
              {sheet.educationLevel}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Download Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Télécharger les PDFs</CardTitle>
          <CardDescription>
            Trois versions distinctes de votre fiche de révision
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={handleDownloadLessons}
              disabled={!sheet.hasLessonsPdf}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              <div className="text-center">
                <div className="font-semibold text-sm">Leçons</div>
                <div className="text-xs opacity-75">Cours uniquement</div>
              </div>
              {!sheet.hasLessonsPdf && (
                <div className="text-xs text-muted-foreground">En cours...</div>
              )}
            </Button>

            <Button
              onClick={handleDownloadExercises}
              disabled={!sheet.hasExercisesPdf}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              <div className="text-center">
                <div className="font-semibold text-sm">Exercices</div>
                <div className="text-xs opacity-75">Sans corrections</div>
              </div>
              {!sheet.hasExercisesPdf && (
                <div className="text-xs text-muted-foreground">En cours...</div>
              )}
            </Button>

            <Button
              onClick={handleDownloadCorrections}
              disabled={!sheet.hasCorrectionsPdf}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Download className="w-5 h-5" />
              <div className="text-center">
                <div className="font-semibold text-sm">Corrections</div>
                <div className="text-xs opacity-75">Réponses incluses</div>
              </div>
              {!sheet.hasCorrectionsPdf && (
                <div className="text-xs text-muted-foreground">En cours...</div>
              )}
            </Button>
          </div>

          {(!sheet.hasLessonsPdf || !sheet.hasExercisesPdf || !sheet.hasCorrectionsPdf) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                ⏳ Les PDFs sont en cours de génération. Ils seront disponibles dans quelques instants.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview (if available) */}
      {sheet.hasImage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Image source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <img
                src={getImageUrl(sheet.id)}
                alt="Image source du cours"
                className="max-w-full h-auto rounded-lg border shadow-sm"
                style={{ maxHeight: '400px' }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Preview */}
      <RevisionPreview
        content={sheet.content}
        title={sheet.title}
        educationLevel={sheet.educationLevel}
      />
    </div>
  );
}