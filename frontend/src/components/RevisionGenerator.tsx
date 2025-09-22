'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ImageUpload } from '@/components/ImageUpload';
import { EducationLevelSelector } from '@/components/EducationLevelSelector';
import { QuestionCountSelector } from '@/components/QuestionCountSelector';
import { RevisionPreview } from '@/components/RevisionPreview';
import { generateRevisionSheet, GenerateRevisionResponse, getAIModels, AIModelInfo, getLessonsPdfUrl, getExercisesPdfUrl, getCorrectionsPdfUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Sparkles, Download, RotateCcw, Loader2, FileText, BookOpen, Eye } from 'lucide-react';

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  stage: string;
  result: GenerateRevisionResponse | null;
}

export function RevisionGenerator() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [educationLevel, setEducationLevel] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [preferredAI, setPreferredAI] = useState<'openai' | 'mistral'>('openai');
  const [generation, setGeneration] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    stage: '',
    result: null
  });
  const [aiModels, setAIModels] = useState<{
    openai: AIModelInfo;
    mistral: AIModelInfo;
  } | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);

  const { toast } = useToast();
  const router = useRouter();

  // Fetch AI model information on component mount
  useEffect(() => {
    const fetchAIModels = async () => {
      try {
        const response = await getAIModels();
        setAIModels(response.models);

        // Set preferred AI based on availability
        if (response.models.openai.available) {
          setPreferredAI('openai');
        } else if (response.models.mistral.available) {
          setPreferredAI('mistral');
        }
      } catch (error) {
        console.error('Failed to fetch AI models:', error);
        toast({
          title: "Erreur de configuration",
          description: "Impossible de récupérer les informations des modèles IA",
          variant: "destructive",
        });
      } finally {
        setLoadingModels(false);
      }
    };

    fetchAIModels();
  }, [toast]);

  const canGenerate = selectedImage &&
                     educationLevel &&
                     questionCount &&
                     !generation.isGenerating &&
                     aiModels &&
                     (aiModels.openai.available || aiModels.mistral.available) &&
                     ((preferredAI === 'openai' && aiModels.openai.available) ||
                      (preferredAI === 'mistral' && aiModels.mistral.available));

  const handleGenerate = async () => {
    if (!selectedImage || !educationLevel) return;

    setGeneration({
      isGenerating: true,
      progress: 0,
      stage: 'Téléchargement de l\'image...',
      result: null
    });

    try {
      setGeneration(prev => ({
        ...prev,
        progress: 20,
        stage: 'Analyse de l\'image par l\'IA...'
      }));

      const result = await generateRevisionSheet(selectedImage, educationLevel, preferredAI, questionCount);

      setGeneration(prev => ({
        ...prev,
        progress: 80,
        stage: 'Génération des 3 PDFs...'
      }));

      setTimeout(() => {
        setGeneration({
          isGenerating: false,
          progress: 100,
          stage: 'Terminé !',
          result
        });

        toast({
          title: "Fiche de révision générée !",
          description: `Votre fiche "${result.title}" est prête. Les 3 PDFs seront disponibles dans quelques instants.`,
        });
      }, 2000);

    } catch (error) {
      console.error('Generation error:', error);

      setGeneration({
        isGenerating: false,
        progress: 0,
        stage: '',
        result: null
      });

      toast({
        title: "Erreur lors de la génération",
        description: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setEducationLevel('');
    setQuestionCount(4);
    setGeneration({
      isGenerating: false,
      progress: 0,
      stage: '',
      result: null
    });
  };

  const handleViewDetail = () => {
    if (generation.result) {
      router.push(`/revision/${generation.result.id}`);
    }
  };

  // Remove this function since we now import the URL functions from api.ts

  if (generation.result) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Sparkles className="w-5 h-5" />
              Fiche de révision générée
            </CardTitle>
            <CardDescription>
              Votre fiche a été créée avec succès en utilisant {
                generation.result.provider === 'openai'
                  ? (aiModels?.openai.displayName || 'OpenAI')
                  : (aiModels?.mistral.displayName || 'Mistral AI')
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-auto p-4"
                >
                  <a
                    href={getLessonsPdfUrl(generation.result.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-semibold">Leçons</div>
                      <div className="text-xs opacity-75">Cours uniquement</div>
                    </div>
                  </a>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-auto p-4"
                >
                  <a
                    href={getExercisesPdfUrl(generation.result.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-semibold">Exercices</div>
                      <div className="text-xs opacity-75">Sans corrections</div>
                    </div>
                  </a>
                </Button>

                <Button
                  asChild
                  size="lg"
                  className="h-auto p-4"
                >
                  <a
                    href={getCorrectionsPdfUrl(generation.result.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-semibold">Corrections</div>
                      <div className="text-xs opacity-75">Réponses incluses</div>
                    </div>
                  </a>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleViewDetail}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Voir le détail complet
                </Button>

                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Générer une nouvelle fiche
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <RevisionPreview
          content={generation.result.content}
          title={generation.result.title}
          educationLevel={educationLevel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Générateur de fiche de révision
          </CardTitle>
          <CardDescription>
            Transformez une photo de cours en fiche de révision personnalisée avec l’IA
          </CardDescription>
        </CardHeader>
      </Card>

      <ImageUpload
        onImageSelect={setSelectedImage}
        selectedImage={selectedImage}
        disabled={generation.isGenerating}
      />

      <EducationLevelSelector
        value={educationLevel}
        onValueChange={setEducationLevel}
        disabled={generation.isGenerating}
      />

      <QuestionCountSelector
        value={questionCount}
        onValueChange={setQuestionCount}
        disabled={generation.isGenerating}
      />

      {/* AI Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intelligence artificielle</CardTitle>
          <CardDescription>
            Choisissez le modèle d’IA à utiliser pour générer votre fiche
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingModels ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Chargement des modèles...</span>
            </div>
          ) : aiModels ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={preferredAI === 'openai' ? 'default' : 'outline'}
                onClick={() => setPreferredAI('openai')}
                disabled={generation.isGenerating || !aiModels.openai.available}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <div className="font-semibold">OpenAI</div>
                <div className="text-xs text-center opacity-75">
                  {aiModels.openai.available ? aiModels.openai.displayName : 'Non disponible'}
                </div>
                {aiModels.openai.apiType === 'responses' && (
                  <div className="text-xs text-center opacity-50">
                    (API Responses)
                  </div>
                )}
              </Button>

              <Button
                variant={preferredAI === 'mistral' ? 'default' : 'outline'}
                onClick={() => setPreferredAI('mistral')}
                disabled={generation.isGenerating || !aiModels.mistral.available}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <div className="font-semibold">Mistral AI</div>
                <div className="text-xs text-center opacity-75">
                  {aiModels.mistral.available ? aiModels.mistral.displayName : 'Non disponible'}
                </div>
              </Button>
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              <p>Impossible de charger les informations des modèles</p>
            </div>
          )}

          {aiModels && !aiModels.openai.available && !aiModels.mistral.available && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive text-center">
                ⚠️ Aucune clé API configurée. Veuillez configurer au moins une clé API pour OpenAI ou Mistral.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {generation.isGenerating && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 animate-spin" />
                <span className="font-medium">{generation.stage}</span>
              </div>

              <Progress value={generation.progress} className="w-full" />

              <p className="text-sm text-muted-foreground">
                La génération peut prendre jusqu’à 2 minutes selon la complexité de l’image...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          size="lg"
          className="w-full sm:w-auto min-w-[200px]"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Générer la fiche de révision
        </Button>
      </div>
    </div>
  );
}