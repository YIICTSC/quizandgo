/// <reference types="vite/client" />
import { GeneralProblem } from './utils';
import { SCIENCE_UNIT_DATA } from './science_units';
import { SOCIAL_UNIT_DATA } from './social_units';
import { SCIENCE_GRADE_UNITS } from '../scienceUnitConfig';
import { SOCIAL_GRADE_UNITS } from '../socialUnitConfig';

export const allSubjects = import.meta.glob('./*.ts', { eager: true });

export interface SubjectUnit {
  subject: string;
  grade: string;
  unit: string;
  questions: GeneralProblem[];
  displayName?: string;
}

const RAW_MODE_DISPLAY_NAMES: Record<string, string> = {
  IT_WINDOWS: 'Windows',
  IT_IPAD: 'iPad',
  IT_CHROMEBOOK: 'Chromebook',
  IT_INTERNET: 'スマホ・ネット',
  IT_LITERACY: '情報リテラシー',
  IT_PROGRAMMING: 'プログラミング',
  IT_SECURITY: 'モラル・セキュリティ',
  MAP_SYMBOLS: '地図記号',
  PREFECTURES: '都道府県',
  PREF_CAPITALS: '県庁所在地',
};

const createRawUnits = (): SubjectUnit[] => {
  const units: SubjectUnit[] = [];
  for (const [path, module] of Object.entries(allSubjects)) {
    const filename = path.replace('./', '').replace('.ts', '');
    const parts = filename.split('_');
    const subject = parts[0];
    const grade = parts[1] || 'general';

    if (filename.includes('utils') || filename.includes('units') || filename === 'index') continue;

    for (const [exportName, exportedData] of Object.entries(module as any)) {
      if (exportName.endsWith('_DATA')) {
        if (subject === 'math' && /^MATH_G\d+_DATA$/.test(exportName)) {
          continue;
        }

        if (Array.isArray(exportedData)) {
          units.push({
            subject,
            grade,
            unit: exportName,
            questions: exportedData as GeneralProblem[],
            displayName: RAW_MODE_DISPLAY_NAMES[exportName],
          });
        } else if (typeof exportedData === 'object' && exportedData !== null) {
          for (const [unitName, questions] of Object.entries(exportedData)) {
            if (Array.isArray(questions) && questions.length > 0) {
              units.push({
                subject,
                grade,
                unit: unitName,
                questions: questions as GeneralProblem[],
                displayName: RAW_MODE_DISPLAY_NAMES[unitName],
              });
            }
          }
        }
      }
    }
  }
  return units;
};

const parseAliasMode = (mode: string) => {
  const [subjectPrefix, gradeText] = mode.split('_');
  const gradeNumber = Number(gradeText);
  if (!subjectPrefix || !Number.isFinite(gradeNumber)) return null;

  return {
    subject: subjectPrefix.toLowerCase(),
    grade: `g${gradeNumber}`,
  };
};

const createAliasUnits = (rawUnits: SubjectUnit[]): SubjectUnit[] => {
  const byUnit = new Map(rawUnits.map((unit) => [unit.unit, unit]));
  const createAliasUnit = (
    mode: string,
    sourceMode: string,
    displayName: string,
    dedicatedQuestions?: GeneralProblem[],
  ): SubjectUnit[] => {
    if (!sourceMode || sourceMode === '__NO_SOURCE__') return [];

    const parsed = parseAliasMode(mode);
    const questions = dedicatedQuestions ?? byUnit.get(sourceMode)?.questions;
    if (!parsed || !questions?.length) return [];

    return [{
      subject: parsed.subject,
      grade: parsed.grade,
      unit: mode,
      questions,
      displayName,
    }];
  };

  const scienceAndLifeUnits = Object.values(SCIENCE_GRADE_UNITS)
    .flat()
    .flatMap((option) => createAliasUnit(
      option.mode,
      option.sourceMode,
      option.name,
      SCIENCE_UNIT_DATA[option.mode],
    ));

  const socialUnits = Object.values(SOCIAL_GRADE_UNITS)
    .flat()
    .flatMap((option) => createAliasUnit(
      option.mode,
      option.sourceMode,
      option.name,
      SOCIAL_UNIT_DATA[option.mode],
    ));

  return [...scienceAndLifeUnits, ...socialUnits];
};

export const getAllUnits = (): SubjectUnit[] => {
  const rawUnits = createRawUnits();
  return [...rawUnits, ...createAliasUnits(rawUnits)];
};
