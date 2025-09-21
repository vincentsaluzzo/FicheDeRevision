'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  onImageSelect,
  selectedImage,
  disabled = false,
  className
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (selectedImage) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedImage);
    } else {
      setPreview(null);
    }
  }, [selectedImage]);

  React.useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      handleFileSelect(imageFile);
    }
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setCameraStream(stream);
      setShowCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback to file input
      fileInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `lesson_${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFileSelect(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const clearImage = () => {
    onImageSelect(null as any);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (showCamera) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto max-h-[60vh] object-cover rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex justify-center gap-4 mt-4">
              <Button
                onClick={capturePhoto}
                size="lg"
                className="flex-1 max-w-[200px]"
              >
                <Camera className="w-5 h-5 mr-2" />
                Capturer
              </Button>

              <Button
                onClick={stopCamera}
                variant="outline"
                size="lg"
              >
                <X className="w-5 h-5 mr-2" />
                Annuler
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (preview) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-[60vh] object-cover rounded-lg"
            />

            <Button
              onClick={clearImage}
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={disabled}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Changer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div
          className={cn(
            "upload-area border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragOver && "drag-over",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="w-12 h-12 text-muted-foreground" />
            </div>

            <div>
              <h3 className="text-lg font-semibold">Ajouter une photo de cours</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Glissez-déposez votre image ou utilisez les boutons ci-dessous
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={startCamera}
                disabled={disabled}
                className="flex-1 max-w-[200px]"
              >
                <Camera className="w-4 h-4 mr-2" />
                Prendre une photo
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={disabled}
                className="flex-1 max-w-[200px]"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choisir un fichier
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Formats supportés: JPG, PNG, WebP (max 10MB)
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}