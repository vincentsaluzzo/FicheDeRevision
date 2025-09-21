import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { AIResponse, Exercise } from '../types';
import { getEducationLevel } from '../config/education';

export const generatePDF = async (
  aiResponse: AIResponse,
  educationLevel: string,
  imagePath?: string
): Promise<string> => {
  let browser;

  try {
    const level = getEducationLevel(educationLevel);
    if (!level) {
      throw new Error(`Invalid education level: ${educationLevel}`);
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    const html = generateHTML(aiResponse, level, imagePath);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const uploadsDir = process.env.UPLOADS_DIR || './uploads';
    const pdfPath = path.join(uploadsDir, `revision_${Date.now()}.pdf`);

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true
    });

    return pdfPath;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const generateHTML = (aiResponse: AIResponse, level: any, imagePath?: string): string => {
  const imageSection = imagePath ? `
    <div class="image-section">
      <img src="file://${path.resolve(imagePath)}" alt="Lesson Image" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
    </div>
  ` : '';

  const exercisesHTML = aiResponse.exercises.map((exercise, index) =>
    generateExerciseHTML(exercise, index + 1)
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
          <div class="date">Fiche de révision - ${new Date().toLocaleDateString('fr-FR')}</div>
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
          <p>Gardez cette fiche pour vos révisions !</p>
        </footer>
      </div>
    </body>
    </html>
  `;
};

const generateExerciseHTML = (exercise: Exercise, index: number): string => {
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
          ${exercise.explanation ? `
            <div class="answer-section">
              <strong>Réponse :</strong> ${exercise.answer}<br>
              <strong>Explication :</strong> ${exercise.explanation}
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
          ${exercise.explanation ? `
            <div class="answer-section">
              <strong>Réponse :</strong> ${exercise.answer}<br>
              <strong>Explication :</strong> ${exercise.explanation}
            </div>
          ` : ''}
        </div>
      `;

    case 'fill_blank':
      return `
        <div class="exercise">
          <h3>Exercice ${index} - Compléter</h3>
          <p class="question">${exercise.question}</p>
          ${exercise.explanation ? `
            <div class="answer-section">
              <strong>Réponse :</strong> ${exercise.answer}<br>
              <strong>Explication :</strong> ${exercise.explanation}
            </div>
          ` : ''}
        </div>
      `;

    default:
      return `
        <div class="exercise">
          <h3>Exercice ${index}</h3>
          <p class="question">${exercise.question}</p>
          ${exercise.explanation ? `
            <div class="answer-section">
              <strong>Réponse suggérée :</strong> ${exercise.answer}<br>
              ${exercise.explanation ? `<strong>Explication :</strong> ${exercise.explanation}` : ''}
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