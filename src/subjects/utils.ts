export type ProblemVisual =
    | { kind: 'clock'; hour: number; minute: number }
    | { kind: 'polygon'; sides: number; labels?: string[]; showDiagonals?: boolean }
    | { kind: 'angle'; degrees: number; rightAngleMark?: boolean; parallelLines?: boolean; labels?: string[] }
    | { kind: 'circle'; showRadius?: boolean; showDiameter?: boolean; showChord?: boolean; centralAngle?: number; inscribedAngle?: number; labels?: string[] }
    | { kind: 'cube'; showHiddenEdges?: boolean; labels?: string[] }
    | { kind: 'prism'; baseSides: number; labels?: string[] }
    | { kind: 'cylinder'; showNet?: boolean; showRadius?: boolean; showHeight?: boolean }
    | { kind: 'pyramid'; baseSides: number }
    | { kind: 'cone'; showRadius?: boolean; showHeight?: boolean; showNet?: boolean }
    | { kind: 'parabola'; a: number; markX?: number }
    | { kind: 'bar_chart'; values: number[]; labels?: string[] }
    | { kind: 'dots'; counts: number[]; labels?: string[] }
    | { kind: 'number_sequence'; values: number[] }
    | { kind: 'fraction'; numerator: number; denominator: number; whole?: number }
    | { kind: 'fraction_operation'; left: { n: number; d: number }; right: { n: number; d: number }; op: '+' | '-' | '×' | '÷' | '>' | '<' }
    | { kind: 'map_symbol'; symbol: string };

export interface GeneralProblem {
    question: string;
    answer: string;
    options: string[];
    hint?: string;
    visual?: ProblemVisual;
    audioPrompt?: {
        text: string;
        lang?: string;
        autoPlay?: boolean;
    };
    speechPrompt?: {
        expected: string;
        alternates?: string[];
        keywords?: string[];
        minKeywordHits?: number;
        lang?: string;
        buttonLabel?: string;
        freeResponse?: boolean;
        examples?: string[];
    };
}

/**
 * 正解の選択肢とその他の選択肢を並べる。
 * シャッフルはコンポーネント側で行うため、ここでは行わない。
 */
export const d = (ans: string, ...others: string[]) => [ans, ...others];

const problemSignature = (problem: GeneralProblem): string =>
    JSON.stringify({
        question: problem.question,
        answer: problem.answer,
        options: problem.options,
        hint: problem.hint,
        visual: problem.visual,
        audioPrompt: problem.audioPrompt,
        speechPrompt: problem.speechPrompt,
    });

export const fillGeneratedUnitProblems = (
    unitData: Record<string, GeneralProblem[]>,
    makeProblem: (unitId: string, n: number) => GeneralProblem,
    options: { min?: number; maxAttempts?: number; duplicatePatience?: number } = {},
): void => {
    const min = options.min ?? 50;
    const maxAttempts = options.maxAttempts ?? 240;
    const duplicatePatience = options.duplicatePatience ?? 80;

    Object.keys(unitData).forEach((unitId) => {
        const problems = unitData[unitId];
        const seen = new Set(problems.map(problemSignature));
        let n = problems.length;
        let duplicateStreak = 0;

        while (n < maxAttempts && (problems.length < min || duplicateStreak < duplicatePatience)) {
            const problem = makeProblem(unitId, n);
            const signature = problemSignature(problem);
            if (!seen.has(signature)) {
                problems.push(problem);
                seen.add(signature);
                duplicateStreak = 0;
            } else {
                duplicateStreak += 1;
            }
            n += 1;
        }

        while (problems.length < min) {
            problems.push(makeProblem(unitId, problems.length));
        }
    });
};
