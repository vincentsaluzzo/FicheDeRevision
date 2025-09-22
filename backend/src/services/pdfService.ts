import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { AIResponse, Exercise } from '../types';
import { getEducationLevel } from '../config/education';

type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bulletList'; items: string[] };

type PdfDoc = PDFKit.PDFDocument;

interface ExerciseSectionOptions {
  heading: string;
  showAnswers: boolean;
  showExplanations: boolean;
  showAnswerSpace: boolean;
}

const DEFAULT_MARGINS = 56; // ≈20mm

export const generateAllPDFs = async (
  aiResponse: AIResponse,
  educationLevel: string,
  imagePath?: string
): Promise<{ lessonsPdf: string; exercisesPdf: string; correctionsPdf: string }> => {
  try {
    const [lessonsPdf, exercisesPdf, correctionsPdf] = await Promise.all([
      generateLessonPDF(aiResponse, educationLevel, imagePath),
      generateExercisesPDF(aiResponse, educationLevel),
      generateCorrectionsPDF(aiResponse, educationLevel)
    ]);

    return {
      lessonsPdf,
      exercisesPdf,
      correctionsPdf
    };
  } catch (error) {
    console.error('Error generating all PDFs:', error);
    throw new Error(`Failed to generate PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generatePDF = async (
  aiResponse: AIResponse,
  educationLevel: string,
  imagePath?: string,
  includeAnswers: boolean = true
): Promise<string> => {
  const level = getEducationLevel(educationLevel);
  if (!level) {
    throw new Error(`Invalid education level: ${educationLevel}`);
  }

  const pdfPath = createPdfPath(includeAnswers ? 'avec_corrections' : 'exercices');
  const dateLabel = new Intl.DateTimeFormat('fr-FR').format(new Date());

  return createPdf(pdfPath, doc => {
    addHeader(
      doc,
      aiResponse.title,
      level,
      includeAnswers ? `Fiche de révision avec corrections - ${dateLabel}` : `Fiche d'exercices - ${dateLabel}`
    );

    addImageSection(doc, imagePath);
    addContentSection(doc, aiResponse.content);
    addExercisesSection(doc, aiResponse.exercises, {
      heading: 'Exercices',
      showAnswers: includeAnswers,
      showExplanations: includeAnswers,
      showAnswerSpace: !includeAnswers
    });

    addFooter(doc, [
      `Fiche générée pour le niveau ${level.name}`,
      includeAnswers
        ? 'Corrigé inclus pour vérifier vos réponses.'
        : 'Complétez les exercices avant de consulter les corrections.'
    ]);
  });
};

export const generateLessonPDF = async (
  aiResponse: AIResponse,
  educationLevel: string,
  imagePath?: string
): Promise<string> => {
  const level = getEducationLevel(educationLevel);
  if (!level) {
    throw new Error(`Invalid education level: ${educationLevel}`);
  }

  const pdfPath = createPdfPath('lessons');
  const dateLabel = new Intl.DateTimeFormat('fr-FR').format(new Date());

  return createPdf(pdfPath, doc => {
    addHeader(doc, aiResponse.title, level, `Leçon - ${dateLabel}`);
    addImageSection(doc, imagePath);
    addContentSection(doc, aiResponse.content);

    addFooter(doc, [
      `Leçon générée pour le niveau ${level.name}`,
      'Complétez avec les exercices et vérifiez avec les corrections.'
    ]);
  });
};

export const generateExercisesPDF = async (
  aiResponse: AIResponse,
  educationLevel: string
): Promise<string> => {
  const level = getEducationLevel(educationLevel);
  if (!level) {
    throw new Error(`Invalid education level: ${educationLevel}`);
  }

  const pdfPath = createPdfPath('exercises');
  const dateLabel = new Intl.DateTimeFormat('fr-FR').format(new Date());

  return createPdf(pdfPath, doc => {
    addHeader(doc, aiResponse.title, level, `Exercices - ${dateLabel}`);
    addIntroParagraph(
      doc,
      'Complétez les exercices puis utilisez la fiche de correction pour vérifier vos réponses.'
    );
    addExercisesSection(doc, aiResponse.exercises, {
      heading: 'Exercices',
      showAnswers: false,
      showExplanations: false,
      showAnswerSpace: true
    });

    addFooter(doc, [
      `Exercices générés pour le niveau ${level.name}`,
      'Répondez avant de consulter la fiche de correction.'
    ]);
  });
};

export const generateCorrectionsPDF = async (
  aiResponse: AIResponse,
  educationLevel: string
): Promise<string> => {
  const level = getEducationLevel(educationLevel);
  if (!level) {
    throw new Error(`Invalid education level: ${educationLevel}`);
  }

  const pdfPath = createPdfPath('corrections');
  const dateLabel = new Intl.DateTimeFormat('fr-FR').format(new Date());

  return createPdf(pdfPath, doc => {
    addHeader(doc, aiResponse.title, level, `Fiche de corrections - ${dateLabel}`);
    addExercisesSection(doc, aiResponse.exercises, {
      heading: 'Corrections et explications',
      showAnswers: true,
      showExplanations: true,
      showAnswerSpace: false
    });

    addFooter(doc, [
      `Corrections générées pour le niveau ${level.name}`,
      'Utilisez cette fiche pour comprendre et progresser.'
    ]);
  });
};

const createPdfPath = (suffix: string): string => {
  const uploadsDir = process.env.UPLOADS_DIR || './uploads';
  ensureDirectory(uploadsDir);
  return path.join(uploadsDir, `revision_${suffix}_${Date.now()}.pdf`);
};

const createPdf = async (filePath: string, build: (doc: PdfDoc) => void): Promise<string> => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: DEFAULT_MARGINS,
      bottom: DEFAULT_MARGINS,
      left: DEFAULT_MARGINS,
      right: DEFAULT_MARGINS
    }
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const completion = new Promise<string>((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });

  try {
    build(doc);
    doc.end();
  } catch (error) {
    doc.end();
    stream.destroy(error as Error);
    throw error;
  }

  return completion;
};

const ensureDirectory = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const addHeader = (
  doc: PdfDoc,
  title: string,
  level: { code: string; name: string; ageRange: string },
  subtitle: string
): void => {
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#1f2933')
    .text(title, { align: 'center' });

  doc
    .moveDown(0.3)
    .font('Helvetica')
    .fontSize(12)
    .fillColor('#4a5568')
    .text(`${level.code} • ${level.name} • ${level.ageRange}`, { align: 'center' });

  doc
    .moveDown(0.2)
    .fontSize(11)
    .text(subtitle, { align: 'center' });

  doc
    .moveDown(0.8)
    .strokeColor('#CBD5E0')
    .lineWidth(1)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();

  doc.moveDown(0.8).strokeColor('#000000').fillColor('#1f2933');
};

const addImageSection = (doc: PdfDoc, imagePath?: string): void => {
  if (!imagePath) {
    return;
  }

  try {
    if (!fs.existsSync(imagePath)) {
      return;
    }

    const maxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    doc.moveDown(0.6);
    doc.image(imagePath, {
      fit: [maxWidth, 240],
      align: 'center'
    });
    doc.moveDown(0.8);
  } catch (error) {
    console.warn('Unable to embed image in PDF:', error);
  }
};

const addContentSection = (doc: PdfDoc, content: string): void => {
  const blocks = parseContent(content);
  if (blocks.length === 0) {
    return;
  }

  addSectionTitle(doc, 'Points clés à retenir');

  for (const block of blocks) {
    if (block.type === 'paragraph') {
      doc.font('Helvetica').fontSize(12).fillColor('#1f2933').text(block.text);
      doc.moveDown(0.5);
    } else {
      for (const item of block.items) {
        doc.font('Helvetica').fontSize(12).fillColor('#1f2933').text(`• ${item}`, {
          indent: 12
        });
      }
      doc.moveDown(0.5);
    }
  }

  doc.moveDown(0.8);
};

const addIntroParagraph = (doc: PdfDoc, text: string): void => {
  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor('#1f2933')
    .text(text);

  doc.moveDown(0.8);
};

const addExercisesSection = (
  doc: PdfDoc,
  exercises: Exercise[],
  options: ExerciseSectionOptions
): void => {
  if (!exercises || exercises.length === 0) {
    return;
  }

  addSectionTitle(doc, options.heading);

  exercises.forEach((exercise, index) => {
    addExercise(doc, exercise, index + 1, options);
  });
};

const addExercise = (
  doc: PdfDoc,
  exercise: Exercise,
  index: number,
  options: ExerciseSectionOptions
): void => {
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor('#2d3748')
    .text(`Exercice ${index} - ${getExerciseLabel(exercise.type)}`);

  doc
    .moveDown(0.2)
    .font('Helvetica')
    .fontSize(12)
    .fillColor('#1f2933')
    .text(exercise.question);

  doc.moveDown(0.3);

  if (exercise.type === 'multiple_choice' && exercise.options?.length) {
    exercise.options.forEach(option => {
      doc.text(`- ${option}`, { indent: 12 });
    });
    doc.moveDown(0.3);
  }

  if (exercise.type === 'true_false') {
    doc.text('- Vrai', { indent: 12 });
    doc.text('- Faux', { indent: 12 });
    doc.moveDown(0.3);
  }

  if (options.showAnswers && exercise.answer) {
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#22543d')
      .text('Réponse :');

    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#2f855a')
      .text(exercise.answer);

    doc.moveDown(0.3);
  }

  if (options.showExplanations && exercise.explanation) {
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#22543d')
      .text('Explication :');

    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#2f855a')
      .text(exercise.explanation);

    doc.moveDown(0.3);
  }

  if (options.showAnswerSpace) {
    addAnswerSpace(doc, exercise);
  }

  doc.moveDown(0.8).fillColor('#1f2933');
};

const addAnswerSpace = (doc: PdfDoc, exercise: Exercise): void => {
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#1a365d')
    .text('Ta réponse :');

  doc.font('Helvetica').fontSize(11).fillColor('#1f2933');

  switch (exercise.type) {
    case 'multiple_choice':
      doc.text('________________________________________');
      break;

    case 'true_false':
      doc.text('Réponse : ____________');
      doc.moveDown(0.2);
      doc.text('Justification :');
      for (let i = 0; i < 3; i += 1) {
        doc.text('________________________________________');
      }
      break;

    case 'fill_blank':
      for (let i = 1; i <= 3; i += 1) {
        doc.text(`${i}. ________________________________`);
      }
      break;

    case 'short_answer':
    default:
      for (let i = 0; i < 4; i += 1) {
        doc.text('________________________________________');
      }
      break;
  }

  doc.moveDown(0.4);
};

const addFooter = (doc: PdfDoc, lines: string[]): void => {
  if (!lines.length) {
    return;
  }

  doc
    .moveDown(1)
    .strokeColor('#E2E8F0')
    .lineWidth(1)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();

  doc.moveDown(0.4).font('Helvetica').fontSize(10).fillColor('#4a5568');

  lines.forEach(line => {
    doc.text(line, { align: 'center' });
  });

  doc.fillColor('#1f2933');
};

const addSectionTitle = (doc: PdfDoc, title: string): void => {
  doc
    .font('Helvetica-Bold')
    .fontSize(15)
    .fillColor('#2b6cb0')
    .text(title);

  doc.moveDown(0.5).fillColor('#1f2933');
};

const parseContent = (content: string): ContentBlock[] => {
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const blocks: ContentBlock[] = [];
  let currentBullets: string[] = [];

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      blocks.push({ type: 'bulletList', items: currentBullets });
      currentBullets = [];
    }
  };

  lines.forEach(line => {
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      const cleaned = line.replace(/^[-*•]\s*/, '').trim();
      currentBullets.push(cleaned);
    } else {
      flushBullets();
      blocks.push({ type: 'paragraph', text: line });
    }
  });

  flushBullets();

  return blocks;
};

const getExerciseLabel = (type: Exercise['type']): string => {
  switch (type) {
    case 'multiple_choice':
      return 'QCM';
    case 'fill_blank':
      return 'Compléter';
    case 'true_false':
      return 'Vrai ou Faux';
    case 'short_answer':
    default:
      return 'Question ouverte';
  }
};
