import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const DEBUG_AI = process.env.DEBUG_AI === 'true';

const debugLog = (message: string, data?: any) => {
  if (DEBUG_AI) {
    console.log(`[ROUTE DEBUG] ${message}`);
    if (data !== undefined) {
      console.log('[ROUTE DEBUG]', JSON.stringify(data, null, 2));
    }
  }
};

import { uploadMiddleware, handleMulterError } from '../middleware/upload';
import { processImage } from '../services/imageService';
import { generateRevision } from '../services/aiService';
import { generateAllPDFs } from '../services/pdfService';
import {
  createRevisionSheet,
  getRevisionSheet,
  getAllRevisionSheets,
  getRevisionSheetsByEducationLevel,
  updateRevisionSheetAllPdfs,
  deleteRevisionSheet
} from '../models/database';
import { isValidEducationLevel } from '../config/education';

const router = express.Router();

router.post('/generate', uploadMiddleware.single('image'), handleMulterError, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    debugLog("=== New revision generation request ===");
    debugLog("Request body:", req.body);
    debugLog("File info:", req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : null);

    if (!req.file) {
      debugLog("No file provided in request");
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { educationLevel, preferredAI = 'openai', questionCount = 4 } = req.body;

    debugLog("Request parameters:", {
      educationLevel,
      preferredAI,
      questionCount
    });

    if (!educationLevel || !isValidEducationLevel(educationLevel)) {
      debugLog("Invalid education level:", educationLevel);
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing education level'
      });
    }

    if (preferredAI && !['openai', 'mistral'].includes(preferredAI)) {
      debugLog("Invalid AI provider:", preferredAI);
      return res.status(400).json({
        success: false,
        message: 'Invalid AI provider. Must be "openai" or "mistral"'
      });
    }

    const numQuestions = parseInt(questionCount as string, 10);
    if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 10) {
      debugLog("Invalid question count:", questionCount);
      return res.status(400).json({
        success: false,
        message: 'Invalid question count. Must be between 1 and 10'
      });
    }

    debugLog("Processing uploaded image...");
    const processedImage = await processImage(req.file.path);

    debugLog("Starting AI generation...");
    const startTime = Date.now();
    const { response: aiResponse, provider } = await generateRevision(
      processedImage.processedPath,
      educationLevel,
      preferredAI,
      numQuestions
    );
    const endTime = Date.now();

    debugLog(`AI generation completed in ${endTime - startTime}ms with provider: ${provider}`);

    const id = uuidv4();
    debugLog("Generated revision sheet ID:", id);

    debugLog("Saving to database...");
    const revisionSheet = createRevisionSheet({
      id,
      title: aiResponse.title,
      educationLevel: educationLevel.toUpperCase(),
      imagePath: processedImage.processedPath,
      lessonsPdfPath: '',
      exercisesPdfPath: '',
      correctionsPdfPath: '',
      content: JSON.stringify(aiResponse),
      aiProvider: provider
    });

    debugLog("Database save completed");

    const response = {
      success: true,
      id: revisionSheet.id,
      title: aiResponse.title,
      content: aiResponse,
      provider,
      message: 'Revision sheet generated successfully. PDF generation starting...'
    };

    debugLog("Sending response to client:", response);
    res.json(response);

    debugLog("Starting background PDF generation (all three versions)...");
    generateAllPDFs(aiResponse, educationLevel, processedImage.processedPath)
      .then(({ lessonsPdf, exercisesPdf, correctionsPdf }) => {
        updateRevisionSheetAllPdfs(id, lessonsPdf, exercisesPdf, correctionsPdf);
        debugLog(`All PDFs generated successfully for ${id}:`, {
          lessons: lessonsPdf,
          exercises: exercisesPdf,
          corrections: correctionsPdf
        });
        console.log(`All PDFs generated for revision sheet ${id}: lessons=${lessonsPdf}, exercises=${exercisesPdf}, corrections=${correctionsPdf}`);
      })
      .catch(error => {
        debugLog(`PDF generation failed for ${id}:`, error);
        console.error(`Failed to generate PDFs for revision sheet ${id}:`, error);
      });

    debugLog("=== Revision generation request completed ===");

  } catch (error) {
    debugLog("=== Revision generation request failed ===");
    debugLog("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Revision generation error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate revision sheet'
    });
  }
});

router.get('/:id', (req: Request, res: Response): Response | void => {
  try {
    const { id } = req.params;
    const revisionSheet = getRevisionSheet(id);

    if (!revisionSheet) {
      return res.status(404).json({
        success: false,
        message: 'Revision sheet not found'
      });
    }

    const content = JSON.parse(revisionSheet.content);

    res.json({
      success: true,
      data: {
        id: revisionSheet.id,
        title: revisionSheet.title,
        educationLevel: revisionSheet.educationLevel,
        content,
        aiProvider: revisionSheet.aiProvider,
        createdAt: revisionSheet.createdAt,
        updatedAt: revisionSheet.updatedAt,
        hasImage: !!revisionSheet.imagePath,
        hasLessonsPdf: !!revisionSheet.lessonsPdfPath,
        hasExercisesPdf: !!revisionSheet.exercisesPdfPath,
        hasCorrectionsPdf: !!revisionSheet.correctionsPdfPath
      }
    });
  } catch (error) {
    console.error('Error fetching revision sheet:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch revision sheet'
    });
  }
});

router.get('/', (req: Request, res: Response): Response | void => {
  try {
    const { educationLevel, limit = '50', offset = '0' } = req.query;

    let revisionSheets;

    if (educationLevel && typeof educationLevel === 'string') {
      if (!isValidEducationLevel(educationLevel)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid education level'
        });
      }
      revisionSheets = getRevisionSheetsByEducationLevel(educationLevel.toUpperCase());
    } else {
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);
      revisionSheets = getAllRevisionSheets(limitNum, offsetNum);
    }

    const responseData = revisionSheets.map(sheet => ({
      id: sheet.id,
      title: sheet.title,
      educationLevel: sheet.educationLevel,
      aiProvider: sheet.aiProvider,
      createdAt: sheet.createdAt,
      updatedAt: sheet.updatedAt,
      hasImage: !!sheet.imagePath,
      hasLessonsPdf: !!sheet.lessonsPdfPath,
      hasExercisesPdf: !!sheet.exercisesPdfPath,
      hasCorrectionsPdf: !!sheet.correctionsPdfPath
    }));

    res.json({
      success: true,
      data: responseData,
      total: responseData.length
    });
  } catch (error) {
    console.error('Error fetching revision sheets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch revision sheets'
    });
  }
});

// Download lessons PDF
router.get('/:id/pdf/lessons', (req: Request, res: Response): Response | void => {
  try {
    const { id } = req.params;
    const revisionSheet = getRevisionSheet(id);

    if (!revisionSheet) {
      return res.status(404).json({
        success: false,
        message: 'Revision sheet not found'
      });
    }

    if (!revisionSheet.lessonsPdfPath) {
      return res.status(404).json({
        success: false,
        message: 'Lessons PDF not yet generated'
      });
    }

    const absolutePath = path.resolve(revisionSheet.lessonsPdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${revisionSheet.title}_lecons.pdf"`);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error serving lessons PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to serve lessons PDF'
    });
  }
});

// Download exercises PDF (without answers)
router.get('/:id/pdf/exercises', (req: Request, res: Response): Response | void => {
  try {
    const { id } = req.params;
    const revisionSheet = getRevisionSheet(id);

    if (!revisionSheet) {
      return res.status(404).json({
        success: false,
        message: 'Revision sheet not found'
      });
    }

    if (!revisionSheet.exercisesPdfPath) {
      return res.status(404).json({
        success: false,
        message: 'Exercises PDF not yet generated'
      });
    }

    const absolutePath = path.resolve(revisionSheet.exercisesPdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${revisionSheet.title}_exercices.pdf"`);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error serving exercises PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to serve exercises PDF'
    });
  }
});

// Download corrections PDF (with answers)
router.get('/:id/pdf/corrections', (req: Request, res: Response): Response | void => {
  try {
    const { id } = req.params;
    const revisionSheet = getRevisionSheet(id);

    if (!revisionSheet) {
      return res.status(404).json({
        success: false,
        message: 'Revision sheet not found'
      });
    }

    if (!revisionSheet.correctionsPdfPath) {
      return res.status(404).json({
        success: false,
        message: 'Corrections PDF not yet generated'
      });
    }

    const absolutePath = path.resolve(revisionSheet.correctionsPdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${revisionSheet.title}_corrections.pdf"`);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error serving corrections PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to serve corrections PDF'
    });
  }
});

// Legacy endpoint for backward compatibility (returns corrections PDF)
router.get('/:id/pdf', (req: Request, res: Response): Response | void => {
  try {
    const { id } = req.params;
    const revisionSheet = getRevisionSheet(id);

    if (!revisionSheet) {
      return res.status(404).json({
        success: false,
        message: 'Revision sheet not found'
      });
    }

    if (!revisionSheet.correctionsPdfPath) {
      return res.status(404).json({
        success: false,
        message: 'PDF not yet generated'
      });
    }

    const absolutePath = path.resolve(revisionSheet.correctionsPdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${revisionSheet.title}_corrections.pdf"`);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error serving PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to serve PDF'
    });
  }
});

router.get('/:id/image', (req: Request, res: Response): Response | void => {
  try {
    const { id } = req.params;
    const revisionSheet = getRevisionSheet(id);

    if (!revisionSheet) {
      return res.status(404).json({
        success: false,
        message: 'Revision sheet not found'
      });
    }

    if (!revisionSheet.imagePath) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const absolutePath = path.resolve(revisionSheet.imagePath);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error serving image:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to serve image'
    });
  }
});

router.delete('/:id', (req: Request, res: Response): Response | void => {
  try {
    const { id } = req.params;
    const deleted = deleteRevisionSheet(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Revision sheet not found'
      });
    }

    res.json({
      success: true,
      message: 'Revision sheet deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting revision sheet:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete revision sheet'
    });
  }
});

export default router;