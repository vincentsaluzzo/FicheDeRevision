import sharp from 'sharp';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DEBUG_AI = process.env.DEBUG_AI === 'true';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

const debugLog = (message: string, data?: any) => {
  if (DEBUG_AI) {
    console.log(`[IMAGE DEBUG] ${message}`);
    if (data !== undefined) {
      console.log('[IMAGE DEBUG]', JSON.stringify(data, null, 2));
    }
  }
};

export interface ProcessedImage {
  originalPath: string;
  processedPath: string;
  thumbnailPath: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export const processImage = async (imagePath: string): Promise<ProcessedImage> => {
  try {
    debugLog("=== Starting image processing ===");
    debugLog("Input image path:", imagePath);

    const image = sharp(imagePath);
    const metadata = await image.metadata();

    debugLog("Image metadata:", metadata);

    if (!metadata.width || !metadata.height) {
      debugLog("Invalid metadata - missing dimensions");
      throw new Error('Invalid image metadata');
    }

    const dir = path.dirname(imagePath);
    const filename = path.basename(imagePath, path.extname(imagePath));

    const processedPath = path.join(dir, `${filename}_processed.jpg`);
    const thumbnailPath = path.join(dir, `${filename}_thumb.jpg`);

    debugLog("Output paths:", {
      processedPath,
      thumbnailPath
    });

    debugLog("Creating processed image...");
    await image
      .jpeg({ quality: 85, progressive: true })
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(processedPath);

    debugLog("Creating thumbnail...");
    await image
      .jpeg({ quality: 80 })
      .resize(300, 300, {
        fit: 'cover'
      })
      .toFile(thumbnailPath);

    const processedStats = fs.statSync(processedPath);
    debugLog("Processed image stats:", {
      size: processedStats.size,
      sizeKB: Math.round(processedStats.size / 1024)
    });

    const result = {
      originalPath: imagePath,
      processedPath,
      thumbnailPath,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || 'unknown',
        size: processedStats.size
      }
    };

    debugLog("=== Image processing completed ===");
    debugLog("Result:", result);

    return result;
  } catch (error) {
    debugLog("=== Image processing failed ===");
    debugLog("Error:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    console.error('Error processing image:', error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getUploadsDir = (): string => {
  const configured = process.env.UPLOADS_DIR;
  return configured ? path.resolve(configured) : path.join(process.cwd(), 'uploads');
};

const ensureUploadsDir = async () => {
  const uploadsDir = getUploadsDir();
  await fsPromises.mkdir(uploadsDir, { recursive: true });
  return uploadsDir;
};

const getExtensionFromFile = (file: File): string => {
  const nameExt = path.extname(file.name);
  if (nameExt) {
    return nameExt;
  }

  switch (file.type) {
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/heic':
    case 'image/heif':
      return '.heic';
    default:
      return '.jpg';
  }
};

export const saveUploadedFile = async (file: File): Promise<string> => {
  if (!(file instanceof File)) {
    throw new Error('Invalid file upload');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  if (file.size === 0) {
    throw new Error('Empty file provided');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`);
  }

  const uploadsDir = await ensureUploadsDir();
  const extension = getExtensionFromFile(file);
  const filename = `image_${randomUUID()}${extension}`;
  const targetPath = path.join(uploadsDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  await fsPromises.writeFile(targetPath, Buffer.from(arrayBuffer));

  debugLog('Uploaded file saved', { targetPath, size: file.size, mimeType: file.type });

  return targetPath;
};

export const deleteImageFiles = async (imagePaths: string[]): Promise<void> => {
  const deletePromises = imagePaths.map(imagePath => {
    return new Promise<void>((resolve) => {
      fs.unlink(imagePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Failed to delete image: ${imagePath}`, err);
        }
        resolve();
      });
    });
  });

  await Promise.all(deletePromises);
};

export const getImageBase64 = async (imagePath: string): Promise<string> => {
  try {
    debugLog("=== Converting image to base64 ===");
    debugLog("Image path:", imagePath);

    const imageBuffer = fs.readFileSync(imagePath);
    debugLog("Image buffer size:", {
      bytes: imageBuffer.length,
      kb: Math.round(imageBuffer.length / 1024),
      mb: Math.round(imageBuffer.length / 1024 / 1024 * 100) / 100
    });

    const base64 = imageBuffer.toString('base64');
    debugLog("Base64 conversion completed:", {
      base64Length: base64.length,
      estimatedSizeKB: Math.round(base64.length * 0.75 / 1024)
    });

    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    debugLog("Final data URL:", {
      mimeType,
      totalLength: dataUrl.length,
      preview: dataUrl.substring(0, 100) + "..."
    });

    debugLog("=== Base64 conversion completed ===");
    return dataUrl;
  } catch (error) {
    debugLog("=== Base64 conversion failed ===");
    debugLog("Error:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image for AI analysis');
  }
};