import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import wkhtmltopdfInstaller from 'wkhtmltopdf-installer';
import { AIResponse, Exercise } from '../types';
import { getEducationLevel } from '../config/education';

export const generateAllPDFs = async (
  aiResponse: AIResponse,
  educationLevel: string,
  imagePath?: string
): Promise<{ lessonsPdf: string; exercisesPdf: string; correctionsPdf: string }> => {
  try {
    const [lessonsPdf, exercisesPdf, correctionsPdf] = await Promise.all([
      generateLessonPDF(aiResponse, educationLevel, imagePath),     // Lessons only
      generateExercisesPDF(aiResponse, educationLevel),             // Exercises only
      generateCorrectionsPDF(aiResponse, educationLevel)            // Corrections only
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

const wkhtmltopdfBinary =
  process.env.WKHTMLTOPDF_PATH ||
  (wkhtmltopdfInstaller as { path?: string }).path ||
  'wkhtmltopdf';

const createPdfFromHtml = async (html: string, pdfPath: string): Promise<void> => {
  await fs.promises.mkdir(path.dirname(pdfPath), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const wkhtmltopdf = spawn(
      wkhtmltopdfBinary,
      [
        '-',
        pdfPath,
        '--quiet',
        '--enable-local-file-access',
        '--print-media-type',
        '--page-size',
        'A4',
        '--margin-top',
        '20mm',
        '--margin-right',
        '15mm',
        '--margin-bottom',
        '20mm',
        '--margin-left',
        '15mm'
      ],
      { stdio: ['pipe', 'ignore', 'pipe'] }
    );

    let stderr = '';

    wkhtmltopdf.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    wkhtmltopdf.on('error', (error) => {
      reject(error);
    });

    wkhtmltopdf.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`wkhtmltopdf exited with code ${code}: ${stderr}`));
      }
    });

    wkhtmltopdf.stdin.write(html);
    wkhtmltopdf.stdin.end();
  });
};

export const generatePDF = async (
  aiResponse: AIResponse,
  educationLevel: string,
  imagePath?: string,
  includeAnswers: boolean = true
): Promise<string> => {
  try {
    const level = getEducationLevel(educationLevel);
    if (!level) {
      throw new Error(`Invalid education level: ${educationLevel}`);
    }

    const html = generateHTML(aiResponse, level, imagePath, includeAnswers);
    const uploadsDir = process.env.UPLOADS_DIR || './uploads';
    const suffix = includeAnswers ? 'avec_corrections' : 'exercices';
    const pdfPath = path.join(uploadsDir, `revision_${suffix}_${Date.now()}.pdf`);
    await createPdfFromHtml(html, pdfPath);

    return pdfPath;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate lessons PDF (image + content only, no exercises)
export const generateLessonPDF = async (
  aiResponse: AIResponse,
  educationLevel: string,
  imagePath?: string
): Promise<string> => {
  try {
    const level = getEducationLevel(educationLevel);
    if (!level) {
      throw new Error(`Invalid education level: ${educationLevel}`);
    }

    const html = generateLessonsHTML(aiResponse, level, imagePath);
    const uploadsDir = process.env.UPLOADS_DIR || './uploads';
    const pdfPath = path.join(uploadsDir, `revision_lessons_${Date.now()}.pdf`);
    await createPdfFromHtml(html, pdfPath);

    return pdfPath;
  } catch (error) {
    console.error('Lessons PDF generation error:', error);
    throw new Error(`Failed to generate lessons PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate exercises PDF (exercises only, no answers)
export const generateExercisesPDF = async (
  aiResponse: AIResponse,
  educationLevel: string
): Promise<string> => {
  try {
    const level = getEducationLevel(educationLevel);
    if (!level) {
      throw new Error(`Invalid education level: ${educationLevel}`);
    }

    const html = generateExercisesHTML(aiResponse, level);
    const uploadsDir = process.env.UPLOADS_DIR || './uploads';
    const pdfPath = path.join(uploadsDir, `revision_exercises_${Date.now()}.pdf`);
    await createPdfFromHtml(html, pdfPath);

    return pdfPath;
  } catch (error) {
    console.error('Exercises PDF generation error:', error);
    throw new Error(`Failed to generate exercises PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate corrections PDF (answers and explanations only)
export const generateCorrectionsPDF = async (
  aiResponse: AIResponse,
  educationLevel: string
): Promise<string> => {
  try {
    const level = getEducationLevel(educationLevel);
    if (!level) {
      throw new Error(`Invalid education level: ${educationLevel}`);
    }

    const html = generateCorrectionsHTML(aiResponse, level);
    const uploadsDir = process.env.UPLOADS_DIR || './uploads';
    const pdfPath = path.join(uploadsDir, `revision_corrections_${Date.now()}.pdf`);
    await createPdfFromHtml(html, pdfPath);

    return pdfPath;
  } catch (error) {
    console.error('Corrections PDF generation error:', error);
    throw new Error(`Failed to generate corrections PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const generateHTML = (aiResponse: AIResponse, level: any, imagePath?: string, includeAnswers: boolean = true): string => {
  const imageSection = imagePath ? `
    <div class="image-section">
      <img src="file://${path.resolve(imagePath)}" alt="Lesson Image" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
    </div>
  ` : '';

  const exercisesHTML = aiResponse.exercises.map((exercise, index) =>
    generateExerciseHTML(exercise, index + 1, includeAnswers)
  ).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${aiResponse.title}</title>
      <style>
        ${getCSS()}
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>${aiResponse.title}</h1>
          <div class="level-info">
            <span class="level-badge">${level.code}</span>
            <span class="level-name">${level.name}</span>
            <span class="age-range">${level.ageRange}</span>
          </div>
          <div class="date">
            ${includeAnswers ? 'Fiche de révision avec corrections' : 'Fiche d\'exercices'} - ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </header>

        ${imageSection}

        <section class="content-section">
          <h2>📚 Points clés à retenir</h2>
          <div class="content">
            ${formatContent(aiResponse.content)}
          </div>
        </section>

        ${aiResponse.exercises.length > 0 ? `
          <section class="exercises-section">
            <h2>📝 Exercices</h2>
            ${exercisesHTML}
          </section>
        ` : ''}

        <footer>
          <p>Fiche générée automatiquement pour le niveau ${level.name}</p>
          ${includeAnswers
            ? '<p>Corrigé inclus - utilisez cette fiche pour vérifier vos réponses !</p>'
            : '<p>Complétez les exercices puis vérifiez avec la fiche de correction !</p>'
          }
        </footer>
      </div>
    </body>
    </html>
  `;
};

const generateExerciseHTML = (exercise: Exercise, index: number, includeAnswers: boolean = true): string => {
  switch (exercise.type) {
    case 'multiple_choice':
      return `
        <div class="exercise">
          <h3>Exercice ${index} - QCM</h3>
          <p class="question">${exercise.question}</p>
          <div class="options">
            ${exercise.options?.map(option => `
              <div class="option">□ ${option}</div>
            `).join('') || ''}
          </div>
          ${includeAnswers && exercise.answer ? `
            <div class="answer-section">
              <strong>Réponse :</strong> ${exercise.answer}
              ${exercise.explanation ? `<br><strong>Explication :</strong> ${exercise.explanation}` : ''}
            </div>
          ` : ''}
          ${!includeAnswers ? `
            <div class="answer-space">
              <p><strong>Ta réponse :</strong> ________________</p>
            </div>
          ` : ''}
        </div>
      `;

    case 'true_false':
      return `
        <div class="exercise">
          <h3>Exercice ${index} - Vrai ou Faux</h3>
          <p class="question">${exercise.question}</p>
          <div class="true-false">
            <div class="option">□ Vrai</div>
            <div class="option">□ Faux</div>
          </div>
          ${includeAnswers && exercise.answer ? `
            <div class="answer-section">
              <strong>Réponse :</strong> ${exercise.answer}
              ${exercise.explanation ? `<br><strong>Explication :</strong> ${exercise.explanation}` : ''}
            </div>
          ` : ''}
          ${!includeAnswers ? `
            <div class="answer-space">
              <p><strong>Ta réponse :</strong> ________________</p>
              <p><strong>Justification :</strong></p>
              <div class="justification-lines">
                ___________________________________________________________<br>
                ___________________________________________________________
              </div>
            </div>
          ` : ''}
        </div>
      `;

    case 'fill_blank':
      return `
        <div class="exercise">
          <h3>Exercice ${index} - Compléter</h3>
          <p class="question">${exercise.question}</p>
          ${includeAnswers && exercise.answer ? `
            <div class="answer-section">
              <strong>Réponse :</strong> ${exercise.answer}
              ${exercise.explanation ? `<br><strong>Explication :</strong> ${exercise.explanation}` : ''}
            </div>
          ` : ''}
          ${!includeAnswers ? `
            <div class="answer-space">
              <p><strong>Tes réponses :</strong></p>
              <div class="fill-blank-lines">
                1. ___________________________________________________________<br>
                2. ___________________________________________________________<br>
                3. ___________________________________________________________
              </div>
            </div>
          ` : ''}
        </div>
      `;

    default:
      return `
        <div class="exercise">
          <h3>Exercice ${index} - Question ouverte</h3>
          <p class="question">${exercise.question}</p>
          ${includeAnswers && exercise.answer ? `
            <div class="answer-section">
              <strong>Réponse suggérée :</strong> ${exercise.answer}
              ${exercise.explanation ? `<br><strong>Explication :</strong> ${exercise.explanation}` : ''}
            </div>
          ` : ''}
          ${!includeAnswers ? `
            <div class="answer-space">
              <p><strong>Ta réponse :</strong></p>
              <div class="open-answer-lines">
                ___________________________________________________________<br>
                ___________________________________________________________<br>
                ___________________________________________________________<br>
                ___________________________________________________________<br>
                ___________________________________________________________
              </div>
            </div>
          ` : ''}
        </div>
      `;
  }
};

const formatContent = (content: string): string => {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return `<li>${line.substring(2)}</li>`;
      }
      return `<p>${line}</p>`;
    })
    .join('')
    .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/g, '');
};

const getCSS = (): string => {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f8f9fa;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      min-height: 100vh;
      padding: 0;
    }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }

    h1 {
      font-size: 28px;
      margin-bottom: 15px;
      font-weight: 700;
    }

    .level-info {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .level-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 16px;
    }

    .level-name {
      font-size: 18px;
      font-weight: 500;
    }

    .age-range {
      background: rgba(255, 255, 255, 0.15);
      padding: 4px 12px;
      border-radius: 15px;
      font-size: 14px;
    }

    .date {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 10px;
    }

    .image-section {
      padding: 30px;
      text-align: center;
      background: #f8f9fa;
    }

    .content-section,
    .exercises-section {
      padding: 30px;
    }

    h2 {
      color: #667eea;
      font-size: 22px;
      margin-bottom: 20px;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }

    .content {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      border-left: 4px solid #667eea;
    }

    .content p {
      margin-bottom: 12px;
    }

    .content ul {
      margin-left: 20px;
      margin-bottom: 12px;
    }

    .content li {
      margin-bottom: 8px;
      list-style-type: disc;
    }

    .exercise {
      background: white;
      border: 1px solid #e1e5e9;
      border-radius: 10px;
      padding: 25px;
      margin-bottom: 25px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .exercise h3 {
      color: #495057;
      font-size: 18px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }

    .question {
      font-weight: 500;
      margin-bottom: 15px;
      color: #2c3e50;
    }

    .options {
      margin-bottom: 15px;
    }

    .option {
      padding: 8px 0;
      font-size: 15px;
      display: flex;
      align-items: center;
    }

    .true-false {
      display: flex;
      gap: 30px;
      margin-bottom: 15px;
    }

    .answer-section {
      background: #e8f5e8;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #28a745;
      margin-top: 15px;
      font-size: 14px;
    }

    .answer-space {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #007bff;
      margin-top: 15px;
      font-size: 14px;
    }

    .justification-lines,
    .fill-blank-lines,
    .open-answer-lines {
      margin-top: 10px;
      line-height: 1.8;
      color: #666;
    }

    footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
      border-top: 1px solid #eee;
    }

    footer p {
      margin-bottom: 5px;
    }

    @media print {
      body {
        background: white;
      }

      .container {
        box-shadow: none;
      }

      .exercise {
        break-inside: avoid;
      }
    }
  `;
};

// Generate HTML for lessons PDF (image + content only)
const generateLessonsHTML = (aiResponse: AIResponse, level: any, imagePath?: string): string => {
  const imageSection = imagePath ? `
    <div class="image-section">
      <img src="file://${path.resolve(imagePath)}" alt="Lesson Image" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${aiResponse.title} - Leçon</title>
      <style>
        ${getCSS()}
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>${aiResponse.title}</h1>
          <div class="level-info">
            <span class="level-badge">${level.code}</span>
            <span class="level-name">${level.name}</span>
            <span class="age-range">${level.ageRange}</span>
          </div>
          <div class="date">
            Leçon - ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </header>

        ${imageSection}

        <section class="content-section">
          <h2>📚 Points clés à retenir</h2>
          <div class="content">
            ${formatContent(aiResponse.content)}
          </div>
        </section>

        <footer>
          <p>Leçon générée automatiquement pour le niveau ${level.name}</p>
          <p>Complétez avec les exercices et vérifiez avec les corrections !</p>
        </footer>
      </div>
    </body>
    </html>
  `;
};

// Generate HTML for exercises PDF (exercises only, no answers)
const generateExercisesHTML = (aiResponse: AIResponse, level: any): string => {
  const exercisesHTML = aiResponse.exercises.map((exercise, index) =>
    generateExerciseHTML(exercise, index + 1, false)
  ).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${aiResponse.title} - Exercices</title>
      <style>
        ${getCSS()}
      </style>
    </head>
    <body>
      <div class="container">
        ${aiResponse.exercises.length > 0 ? `
          <section class="exercises-section">
            <h2>📝 Exercices</h2>
            ${exercisesHTML}
          </section>
        ` : ''}

        <footer>
          <p>Exercices générés automatiquement pour le niveau ${level.name}</p>
          <p>Complétez les exercices puis vérifiez avec la fiche de correction !</p>
        </footer>
      </div>
    </body>
    </html>
  `;
};

// Generate HTML for corrections PDF (answers and explanations only)
const generateCorrectionsHTML = (aiResponse: AIResponse, level: any): string => {
  const correctionsHTML = aiResponse.exercises.map((exercise, index) =>
    generateCorrectionHTML(exercise, index + 1)
  ).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${aiResponse.title} - Corrections</title>
      <style>
        ${getCSS()}
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>${aiResponse.title}</h1>
          <div class="level-info">
            <span class="level-badge">${level.code}</span>
            <span class="level-name">${level.name}</span>
            <span class="age-range">${level.ageRange}</span>
          </div>
          <div class="date">
            Fiche de corrections - ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </header>

        ${aiResponse.exercises.length > 0 ? `
          <section class="exercises-section">
            <h2>✅ Corrections et explications</h2>
            ${correctionsHTML}
          </section>
        ` : ''}

        <footer>
          <p>Corrections générées automatiquement pour le niveau ${level.name}</p>
          <p>Utilisez cette fiche pour vérifier vos réponses et comprendre les explications !</p>
        </footer>
      </div>
    </body>
    </html>
  `;
};

// Generate correction HTML for a single exercise (answers and explanations only)
const generateCorrectionHTML = (exercise: Exercise, index: number): string => {
  return `
    <div class="correction">
      <h3>Exercice ${index}</h3>
      <p class="question-ref">${exercise.question}</p>

      <div class="correction-content">
        ${exercise.answer ? `
          <div class="answer">
            <strong>✅ Réponse :</strong> ${exercise.answer}
          </div>
        ` : ''}

        ${exercise.explanation ? `
          <div class="explanation">
            <strong>💡 Explication :</strong> ${exercise.explanation}
          </div>
        ` : ''}
      </div>
    </div>
  `;
};