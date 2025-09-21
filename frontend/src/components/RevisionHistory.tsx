'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllRevisionSheets, RevisionSheet, getPdfUrl } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  History,
  Download,
  Calendar,
  GraduationCap,
  Brain,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function RevisionHistory() {
  const [sheets, setSheets] = useState<RevisionSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllRevisionSheets();
      setSheets(response.data);
    } catch (err) {
      setError('Impossible de charger l\'historique');
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger l'historique des fiches de révision",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (sheet: RevisionSheet) => {
    if (!sheet.hasPdf) {
      toast({
        title: "PDF non disponible",
        description: "Le PDF pour cette fiche n'est pas encore généré",
        variant: "destructive",
      });
      return;
    }

    const url = getPdfUrl(sheet.id);
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement de l'historique...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <div>
              <p className="font-medium">Erreur de chargement</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={loadHistory} size="sm">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sheets.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <History className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Aucune fiche de révision</p>
              <p className="text-sm text-muted-foreground">
                Vos fiches générées apparaîtront ici
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historique des révisions
          </CardTitle>
          <CardDescription>
            {sheets.length} fiche{sheets.length > 1 ? 's' : ''} de révision générée{sheets.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {sheets.map((sheet) => (
          <Card key={sheet.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-primary/10 rounded-lg p-2">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base leading-tight mb-1">
                        {sheet.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(sheet.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          {getAIProviderBadge(sheet.aiProvider)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getEducationLevelColor(sheet.educationLevel)}>
                      <GraduationCap className="w-3 h-3 mr-1" />
                      {sheet.educationLevel}
                    </Badge>

                    {sheet.hasPdf ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        PDF prêt
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        PDF en cours...
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleDownloadPdf(sheet)}
                    disabled={!sheet.hasPdf}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button
          onClick={loadHistory}
          variant="outline"
          size="sm"
        >
          Actualiser
        </Button>
      </div>
    </div>
  );
}