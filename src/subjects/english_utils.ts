import { GeneralProblem, d } from './utils';

export interface EnglishWordItem {
  en: string;
  jp: string;
  hint?: string;
  speech?: string;
  speechAlternates?: string[];
  exampleEn?: string;
  exampleJp?: string;
}

export interface EnglishResponseItem {
  promptEn: string;
  promptJp: string;
  answerEn: string;
  answerJp: string;
  promptSpeech?: string;
  answerSpeech?: string;
  answerSpeechAlternates?: string[];
}

export const cycleProblems = (problems: GeneralProblem[]) => {
  const result = [...problems];
  while (result.length < 20) {
    result.push({ ...problems[result.length % problems.length] });
  }
  return result;
};

export const uniqueEnglishWordItems = (items: EnglishWordItem[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.en}__${item.jp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const pickDistinct = (pool: string[], answer: string, start: number, count: number) => {
  const uniques = Array.from(new Set(pool.filter((item) => item !== answer)));
  if (uniques.length === 0) return [];
  const picked: string[] = [];
  for (let i = 0; picked.length < count && i < uniques.length * 2; i += 1) {
    const candidate = uniques[(start + i) % uniques.length];
    if (!picked.includes(candidate)) picked.push(candidate);
  }
  return picked;
};

export const buildWordUnit = (
  items: EnglishWordItem[],
  options: { enableListening?: boolean; enableSpeaking?: boolean; listeningPrompt?: string; speakingPrompt?: string; enableSentenceExamples?: boolean } = {},
): GeneralProblem[] => {
  const enableListening = options.enableListening !== false;
  const enableSpeaking = options.enableSpeaking === true;
  const enableSentenceExamples = options.enableSentenceExamples !== false;
  const jpPool = items.map((item) => item.jp);
  const enPool = items.map((item) => item.en);
  const makeSpeechAlternates = (item: EnglishWordItem) => {
    const base = item.speech || item.en;
    const normalized = base.replace(/[.!?]/g, '');
    return Array.from(new Set([
      normalized,
      normalized.toLowerCase(),
      base,
      ...(item.speechAlternates || []),
    ]));
  };

  const problems: GeneralProblem[] = [];
  const buildExampleSentence = (item: EnglishWordItem) => {
    if (item.exampleEn && item.exampleJp) return { en: item.exampleEn, jp: item.exampleJp };
    const trimmed = item.en.replace(/[.!?]/g, '');
    if (/^\d+$/.test(item.jp)) {
      return { en: `I have ${trimmed} books.`, jp: `わたしは ${item.jp}さつの 本を もっています。` };
    }
    if (trimmed.includes("o'clock") || trimmed.includes('half past') || trimmed.startsWith('It is ')) {
      return { en: trimmed.startsWith('It is ') ? trimmed : `It is ${trimmed}.`, jp: `${item.jp} を あらわす 文。` };
    }
    if (/^(happy|sad|sleepy|hungry|fine|tired|angry|great|hot|cold|warm|cool|sunny|cloudy|rainy|snowy|windy)$/i.test(trimmed)) {
      return { en: `I am ${trimmed}.`, jp: `わたしは ${item.jp}です。` };
    }
    if (/^(get up|eat breakfast|go to school|study|play|go to bed|brush my teeth|do homework)$/i.test(trimmed)) {
      return { en: `I ${trimmed} every day.`, jp: `わたしは 毎日 ${item.jp}。` };
    }
    if (/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)$/i.test(trimmed)) {
      return { en: `I like ${trimmed}.`, jp: `文の中で ${item.jp} が 出てくる。` };
    }
    if (/^(red|blue|yellow|green|black|white|pink|orange|brown|purple)$/i.test(trimmed)) {
      return { en: `This is ${trimmed}.`, jp: `これは ${item.jp}です。` };
    }
    if (/^[a-z][a-z ]+$/i.test(trimmed) && !trimmed.includes('I ') && !trimmed.includes('My ') && !trimmed.includes('This ') && !trimmed.includes('We ')) {
      return { en: `I like ${trimmed}.`, jp: `わたしは ${item.jp}が すきです。` };
    }
    return null;
  };

  items.forEach((item, index) => {
    problems.push({
        question: `「${item.en}」は 日本語で なんという？`,
        answer: item.jp,
        options: d(item.jp, ...pickDistinct(jpPool, item.jp, index + 1, 3)),
        hint: item.hint || '英語の意味を考えよう。',
      });
    problems.push({
        question: `「${item.jp}」は 英語で なんという？`,
        answer: item.en,
        options: d(item.en, ...pickDistinct(enPool, item.en, index + 2, 3)),
        hint: item.hint || '英語を選ぼう。',
      });
    if (enableListening) {
      problems.push({
        question: options.listeningPrompt || 'おとを きいて、あてはまる 英語を えらぼう。',
        answer: item.en,
        options: d(item.en, ...pickDistinct(enPool, item.en, index + 3, 3)),
        hint: '発音を聞き取ろう。',
        audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
      });
      problems.push({
        question: 'おとを きいて、あてはまる 日本語を えらぼう。',
        answer: item.jp,
        options: d(item.jp, ...pickDistinct(jpPool, item.jp, index + 4, 3)),
        hint: '英語の音から意味を考える。',
        audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
      });
    }
    if (enableSpeaking) {
      problems.push({
        question: options.speakingPrompt || `「${item.jp}」を 英語で いってみよう。`,
        answer: item.en,
        options: d(item.en, ...pickDistinct(enPool, item.en, index + 5, 3)),
        hint: 'マイク対応ブラウザなら発話判定もできる。',
        speechPrompt: { expected: item.speech || item.en, alternates: makeSpeechAlternates(item), lang: 'en-US', buttonLabel: 'えいごで はなす' },
        audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: false },
      });
    }
    if (enableSentenceExamples) {
      const example = buildExampleSentence(item);
      if (example) {
        problems.push({
          question: `つぎの文の「${item.en}」に 近い いみは どれ？\n${example.en}`,
          answer: item.jp,
          options: d(item.jp, ...pickDistinct(jpPool, item.jp, index + 6, 3)),
          hint: '単語が 文の中で どう使われるか見よう。',
          audioPrompt: { text: example.en, lang: 'en-US', autoPlay: false },
        });
      }
    }
  });
  return problems;
};

export const buildListeningReviewUnit = (items: EnglishWordItem[], promptText = '学年の ことばを きいて、あてはまる 英語を えらぼう。'): GeneralProblem[] => {
  const enPool = items.map((item) => item.en);
  const jpPool = items.map((item) => item.jp);
  return items.flatMap((item, index) => ([
    {
      question: promptText,
      answer: item.en,
      options: d(item.en, ...pickDistinct(enPool, item.en, index + 1, 3)),
      hint: '学年でならった表現を聞き取ろう。',
      audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
    },
    {
      question: '学年の ことばを きいて、あてはまる 日本語を えらぼう。',
      answer: item.jp,
      options: d(item.jp, ...pickDistinct(jpPool, item.jp, index + 2, 3)),
      hint: '意味までセットで思い出そう。',
      audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
    },
  ]));
};

export const buildSpeakingReviewUnit = (items: EnglishWordItem[], promptText = '学年の ことばを 英語で いってみよう。'): GeneralProblem[] => {
  const enPool = items.map((item) => item.en);
  const makeSpeechAlternates = (item: EnglishWordItem) => {
    const base = item.speech || item.en;
    const normalized = base.replace(/[.!?]/g, '');
    return Array.from(new Set([
      normalized,
      normalized.toLowerCase(),
      base,
      ...(item.speechAlternates || []),
    ]));
  };

  return items.map((item, index) => ({
    question: `${promptText}\n「${item.jp}」`,
    answer: item.en,
    options: d(item.en, ...pickDistinct(enPool, item.en, index + 3, 3)),
    hint: 'マイクで発音して確認。',
    speechPrompt: {
      expected: item.speech || item.en,
      alternates: makeSpeechAlternates(item),
      lang: 'en-US',
      buttonLabel: 'えいごで はなす',
    },
    audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: false },
  }));
};

export const buildRepeatReviewUnit = (items: EnglishWordItem[], promptText = 'おとを きいて、そのまま 英語で くりかえそう。'): GeneralProblem[] => {
  const enPool = items.map((item) => item.en);
  const makeSpeechAlternates = (item: EnglishWordItem) => {
    const base = item.speech || item.en;
    const normalized = base.replace(/[.!?]/g, '');
    return Array.from(new Set([
      normalized,
      normalized.toLowerCase(),
      base,
      ...(item.speechAlternates || []),
    ]));
  };

  return items.flatMap((item, index) => ([
    {
      question: `${promptText}\n「${item.jp}」`,
      answer: item.en,
      options: d(item.en, ...pickDistinct(enPool, item.en, index + 1, 3)),
      hint: '聞いた 英語を そのまま くりかえす。',
      audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
      speechPrompt: {
        expected: item.speech || item.en,
        alternates: makeSpeechAlternates(item),
        lang: 'en-US',
        buttonLabel: 'くりかえす',
      },
    },
    {
      question: 'おとを きいて、同じ 英語を えらぼう。',
      answer: item.en,
      options: d(item.en, ...pickDistinct(enPool, item.en, index + 2, 3)),
      hint: '聞こえた 英語の ならびを たしかめる。',
      audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
    },
    {
      question: `つぎの 日本語を 英語で くりかえそう。\n「${item.jp}」`,
      answer: item.en,
      options: d(item.en, ...pickDistinct(enPool, item.en, index + 3, 3)),
      hint: '例の音を まねして はっきり言う。',
      audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: false },
      speechPrompt: {
        expected: item.speech || item.en,
        alternates: makeSpeechAlternates(item),
        lang: 'en-US',
        buttonLabel: '英語を くりかえす',
      },
    },
  ]));
};

export const buildResponseReviewUnit = (items: EnglishResponseItem[], promptText = '聞かれたことに 英語で こたえよう。'): GeneralProblem[] => {
  const enPool = items.map((item) => item.answerEn);
  const jpPool = items.map((item) => item.answerJp);
  const makeSpeechAlternates = (item: EnglishResponseItem) => {
    const base = item.answerSpeech || item.answerEn;
    const normalized = base.replace(/[.!?]/g, '');
    return Array.from(new Set([
      normalized,
      normalized.toLowerCase(),
      item.answerEn,
      ...(item.answerSpeechAlternates || []),
    ]));
  };

  return items.flatMap((item, index) => ([
    {
      question: `${promptText}\n${item.promptEn}`,
      answer: item.answerEn,
      options: d(item.answerEn, ...pickDistinct(enPool, item.answerEn, index + 1, 3)),
      hint: '質問や 呼びかけに 合う 返事を えらぶ。',
      audioPrompt: { text: item.promptSpeech || item.promptEn, lang: 'en-US', autoPlay: true },
    },
    {
      question: `「${item.promptJp}」への へんじとして 合う 日本語は？`,
      answer: item.answerJp,
      options: d(item.answerJp, ...pickDistinct(jpPool, item.answerJp, index + 2, 3)),
      hint: '返事の いみも あわせて おぼえる。',
      audioPrompt: { text: item.promptSpeech || item.promptEn, lang: 'en-US', autoPlay: false },
    },
    {
      question: `${item.promptEn}\nえいごで こたえよう。`,
      answer: item.answerEn,
      options: d(item.answerEn, ...pickDistinct(enPool, item.answerEn, index + 3, 3)),
      hint: 'みじかく はっきり へんじする。',
      audioPrompt: { text: item.promptSpeech || item.promptEn, lang: 'en-US', autoPlay: false },
      speechPrompt: {
        expected: item.answerSpeech || item.answerEn,
        alternates: makeSpeechAlternates(item),
        lang: 'en-US',
        buttonLabel: 'へんじを はなす',
      },
    },
  ]));
};

export const prompt = (
  question: string,
  answer: string,
  others: string[],
  hint?: string,
  extras: Partial<GeneralProblem> = {},
): GeneralProblem => ({
  question,
  answer,
  options: d(answer, ...others.filter((item) => item !== answer).slice(0, 3)),
  hint,
  ...extras,
});
