import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AIResponse, Exercise } from '../src/types';
import { EDUCATION_LEVELS } from '../src/config/education';
import {
  formatContent,
  generateExerciseHTML,
  generateHTML,
  generateLessonsHTML,
  generateExercisesHTML,
  generateCorrectionsHTML,
  generateCorrectionHTML
} from '../src/services/pdfService';

const sampleResponse: AIResponse = {
  title: 'Les fractions',
  content: '- Définition\n- Exemple\nComprendre les fractions',
  exercises: [
    {
      type: 'multiple_choice',
      question: 'Quelle est la moitié de 6 ?',
      options: ['1', '2', '3'],
      answer: '3',
      explanation: 'La moitié de 6 est 3.'
    },
    {
      type: 'true_false',
      question: '1/2 est égal à 0,5',
      answer: 'Vrai',
      explanation: '1/2 correspond à 0,5.'
    },
    {
      type: 'fill_blank',
      question: 'Complète : 3/4 = __ / 8',
      answer: '6/8'
    },
    {
      type: 'short_answer',
      question: 'Explique ce qu\'est une fraction.',
      answer: 'Une fraction représente une partie d\'un tout.'
    }
  ]
};

const level = EDUCATION_LEVELS[0];

describe('pdfService helpers', () => {
  it('formats content into HTML paragraphs and lists', () => {
    const html = formatContent(sampleResponse.content);
    assert.ok(html.includes('<li>Définition</li>'));
    assert.ok(html.includes('<li>Exemple</li>'));
    assert.ok(html.includes('<p>Comprendre les fractions</p>'));
    assert.ok(!html.includes('- Définition'));
  });

  it('generates exercise HTML with answers when requested', () => {
    const exercise = sampleResponse.exercises[0];
    const html = generateExerciseHTML(exercise, 1, true);
    assert.ok(html.includes('Exercice 1 - QCM'));
    assert.ok(html.includes('<strong>Réponse :</strong> 3'));
    assert.ok(html.includes('Explication'));
  });

  it('generates exercise HTML without answers when requested', () => {
    const exercise = sampleResponse.exercises[0];
    const html = generateExerciseHTML(exercise, 1, false);
    assert.ok(html.includes('Exercice 1 - QCM'));
    assert.ok(html.includes('Ta réponse'));
    assert.ok(!html.includes('<strong>Réponse :</strong>'));
  });

  it('creates specific layouts for each exercise type', () => {
    const [, trueFalse, fillBlank, openQuestion] = sampleResponse.exercises;
    const trueFalseHtml = generateExerciseHTML(trueFalse, 2, true);
    assert.ok(trueFalseHtml.includes('Vrai ou Faux'));
    assert.ok(trueFalseHtml.includes('□ Vrai'));
    assert.ok(trueFalseHtml.includes('□ Faux'));

    const fillBlankHtml = generateExerciseHTML(fillBlank, 3, false);
    assert.ok(fillBlankHtml.includes('Compléter'));
    assert.ok(fillBlankHtml.includes('Tes réponses'));

    const openHtml = generateExerciseHTML(openQuestion, 4, false);
    assert.ok(openHtml.includes('Question ouverte'));
    assert.ok(openHtml.includes('Ta réponse'));
  });

  it('generates full revision HTML with optional answers', () => {
    const htmlWithAnswers = generateHTML(sampleResponse, level, undefined, true);
    assert.ok(htmlWithAnswers.includes(level.code));
    assert.ok(htmlWithAnswers.includes('Fiche de révision avec corrections'));
    assert.ok(htmlWithAnswers.includes('<section class="exercises-section">'));

    const htmlWithoutAnswers = generateHTML(sampleResponse, level, undefined, false);
    assert.ok(htmlWithoutAnswers.includes('Fiche d\'exercices'));
    assert.ok(!htmlWithoutAnswers.includes('Corrigé inclus'));
  });

  it('generates lesson, exercise and correction specific HTML blocks', () => {
    const lessonHtml = generateLessonsHTML(sampleResponse, level);
    assert.ok(lessonHtml.includes('Leçon -'));
    assert.ok(lessonHtml.includes('Points clés à retenir'));

    const exercisesHtml = generateExercisesHTML(sampleResponse, level);
    assert.ok(exercisesHtml.includes('📝 Exercices'));
    assert.ok(!exercisesHtml.includes('<strong>Réponse :</strong>'));

    const correctionsHtml = generateCorrectionsHTML(sampleResponse, level);
    assert.ok(correctionsHtml.includes('Corrections et explications'));
    assert.ok(correctionsHtml.includes('<strong>✅ Réponse :</strong> 3'));
  });

  it('generates correction entries with explanations', () => {
    const exercise: Exercise = {
      type: 'short_answer',
      question: 'Définis une fraction.',
      answer: 'Partage d\'un tout en parts égales.',
      explanation: 'On divise un objet en parties équivalentes.'
    };
    const correctionHtml = generateCorrectionHTML(exercise, 1);
    assert.ok(correctionHtml.includes('Exercice 1'));
    assert.ok(correctionHtml.includes('Partage d\'un tout en parts égales.'));
    assert.ok(correctionHtml.includes('Explication'));
  });
});
