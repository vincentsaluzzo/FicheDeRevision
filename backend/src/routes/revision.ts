import express from 'express';
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
import { generatePDF } from '../services/pdfService';
import {
  createRevisionSheet,
  getRevisionSheet,
  getAllRevisionSheets,
  getRevisionSheetsByEducationLevel,
  updateRevisionSheetPdfPath,
  deleteRevisionSheet
} from '../models/database';
import { isValidEducationLevel } from '../config/education';

const router = express.Router();

router.post('/generate', uploadMiddleware.single('image'), handleMulterError, async (req, res) => {
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

    const { educationLevel, preferredAI = 'openai' } = req.body;

    debugLog("Request parameters:", {
      educationLevel,
      preferredAI
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

    debugLog("Processing uploaded image...");
    const processedImage = await processImage(req.file.path);

    debugLog("Starting AI generation...");
    const startTime = Date.now();
    const { response: aiResponse, provider } = await generateRevision(
      processedImage.processedPath,
      educationLevel,
      preferredAI
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
      pdfPath: '',
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

    debugLog("Starting background PDF generation...");
    generatePDF(aiResponse, educationLevel, processedImage.processedPath)
      .then(pdfPath => {
        updateRevisionSheetPdfPath(id, pdfPath);
        debugLog(`PDF generated successfully for ${id}: ${pdfPath}`);
        console.log(`PDF generated for revision sheet ${id}: ${pdfPath}`);
      })
      .catch(error => {
        debugLog(`PDF generation failed for ${id}:`, error);
        console.error(`Failed to generate PDF for revision sheet ${id}:`, error);
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
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate revision sheet'
    });
  }
});

router.get('/:id', (req, res) => {
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
        hasPdf: !!revisionSheet.pdfPath
      }
    });
  } catch (error) {
    console.error('Error fetching revision sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revision sheet'
    });
  }
});

router.get('/', (req, res) => {
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
      hasPdf: !!sheet.pdfPath
    }));

    res.json({
      success: true,
      data: responseData,
      total: responseData.length
    });
  } catch (error) {
    console.error('Error fetching revision sheets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revision sheets'
    });
  }
});

router.get('/:id/pdf', (req, res) => {
  try {
    const { id } = req.params;
    const revisionSheet = getRevisionSheet(id);

    if (!revisionSheet) {
      return res.status(404).json({
        success: false,
        message: 'Revision sheet not found'
      });
    }

    if (!revisionSheet.pdfPath) {
      return res.status(404).json({
        success: false,
        message: 'PDF not yet generated'
      });
    }

    const absolutePath = path.resolve(revisionSheet.pdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${revisionSheet.title}.pdf"`);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve PDF'
    });
  }
});

router.get('/:id/image', (req, res) => {
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
    res.status(500).json({
      success: false,
      message: 'Failed to serve image'
    });
  }
});

router.delete('/:id', (req, res) => {
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
    res.status(500).json({
      success: false,
      message: 'Failed to delete revision sheet'
    });
  }
});

export default router;