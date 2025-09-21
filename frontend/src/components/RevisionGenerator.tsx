'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ImageUpload } from '@/components/ImageUpload';
import { EducationLevelSelector } from '@/components/EducationLevelSelector';
import { RevisionPreview } from '@/components/RevisionPreview';
import { generateRevisionSheet, GenerateRevisionResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Download, RotateCcw } from 'lucide-react';

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  stage: string;
  result: GenerateRevisionResponse | null;
}

export function RevisionGenerator() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [educationLevel, setEducationLevel] = useState<string>('');
  const [preferredAI, setPreferredAI] = useState<'openai' | 'mistral'>('openai');
  const [generation, setGeneration] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    stage: '',
    result: null
  });

  const { toast } = useToast();

  const canGenerate = selectedImage && educationLevel && !generation.isGenerating;

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

      const result = await generateRevisionSheet(selectedImage, educationLevel, preferredAI);

      setGeneration(prev => ({
        ...prev,
        progress: 80,
        stage: 'Génération du PDF...'
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
          description: `Votre fiche "${result.title}" est prête. Le PDF sera disponible dans quelques instants.`,
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
    setGeneration({
      isGenerating: false,
      progress: 0,
      stage: '',
      result: null
    });
  };

  const getPdfUrl = (id: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${apiUrl}/api/revision/${id}/pdf`;
  };

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
              Votre fiche a été créée avec succès using {generation.result.provider === 'openai' ? 'OpenAI' : 'Mistral AI'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="flex-1"
                size="lg"
              >
                <a
                  href={getPdfUrl(generation.result.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le PDF
                </a>
              </Button>

              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Nouvelle fiche
              </Button>
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
            Transformez une photo de cours en fiche de révision personnalisée avec l'IA
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

      {/* AI Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intelligence artificielle</CardTitle>
          <CardDescription>
            Choisissez le modèle d'IA à utiliser pour générer votre fiche
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={preferredAI === 'openai' ? 'default' : 'outline'}
              onClick={() => setPreferredAI('openai')}
              disabled={generation.isGenerating}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <div className="font-semibold">OpenAI</div>
              <div className="text-xs text-center opacity-75">
                GPT-4 Vision
              </div>
            </Button>

            <Button
              variant={preferredAI === 'mistral' ? 'default' : 'outline'}
              onClick={() => setPreferredAI('mistral')}
              disabled={generation.isGenerating}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <div className="font-semibold">Mistral AI</div>
              <div className="text-xs text-center opacity-75">
                Pixtral
              </div>
            </Button>
          </div>
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
                La génération peut prendre jusqu'à 2 minutes selon la complexité de l'image...
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