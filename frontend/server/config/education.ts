import { EducationLevel } from '../types';

export const EDUCATION_LEVELS: EducationLevel[] = [
  {
    code: 'CP',
    name: 'Cours Préparatoire',
    description: 'Première année d\'apprentissage de la lecture et de l\'écriture',
    ageRange: '6-7 ans'
  },
  {
    code: 'CE1',
    name: 'Cours Élémentaire 1ère année',
    description: 'Consolidation de la lecture et introduction des mathématiques',
    ageRange: '7-8 ans'
  },
  {
    code: 'CE2',
    name: 'Cours Élémentaire 2ème année',
    description: 'Approfondissement des acquis fondamentaux',
    ageRange: '8-9 ans'
  },
  {
    code: 'CM1',
    name: 'Cours Moyen 1ère année',
    description: 'Préparation progressive au collège',
    ageRange: '9-10 ans'
  },
  {
    code: 'CM2',
    name: 'Cours Moyen 2ème année',
    description: 'Dernière année du primaire, préparation au collège',
    ageRange: '10-11 ans'
  },
  {
    code: '6E',
    name: 'Sixième',
    description: 'Première année du collège, cycle d\'adaptation',
    ageRange: '11-12 ans'
  },
  {
    code: '5E',
    name: 'Cinquième',
    description: 'Cycle central du collège',
    ageRange: '12-13 ans'
  },
  {
    code: '4E',
    name: 'Quatrième',
    description: 'Cycle central du collège, approfondissement',
    ageRange: '13-14 ans'
  },
  {
    code: '3E',
    name: 'Troisième',
    description: 'Dernière année du collège, préparation au lycée',
    ageRange: '14-15 ans'
  }
];

export const getEducationLevel = (code: string): EducationLevel | undefined => {
  return EDUCATION_LEVELS.find(level => level.code === code.toUpperCase());
};

export const isValidEducationLevel = (code: string): boolean => {
  return EDUCATION_LEVELS.some(level => level.code === code.toUpperCase());
};