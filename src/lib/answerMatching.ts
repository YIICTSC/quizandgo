const SMALL_NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS_NUMBER_WORDS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const canonicalizeEnglishNumbers = (value: string) => {
  const tokens = String(value || '')
    .replace(/-/g, ' ')
    .match(/\d+|[a-zA-Z]+|[^\s]/g);

  if (!tokens) return String(value || '');

  const normalizedTokens: string[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const lower = token.toLowerCase();

    if (/^\d+$/.test(token)) {
      normalizedTokens.push(token);
      continue;
    }

    if (!(lower in SMALL_NUMBER_WORDS) && !(lower in TENS_NUMBER_WORDS) && lower !== 'hundred' && lower !== 'thousand') {
      normalizedTokens.push(token);
      continue;
    }

    let total = 0;
    let current = 0;
    let consumed = 0;

    for (let j = i; j < tokens.length; j += 1) {
      const part = tokens[j].toLowerCase();
      if (part in SMALL_NUMBER_WORDS) {
        current += SMALL_NUMBER_WORDS[part];
        consumed += 1;
        continue;
      }
      if (part in TENS_NUMBER_WORDS) {
        current += TENS_NUMBER_WORDS[part];
        consumed += 1;
        continue;
      }
      if (part === 'hundred') {
        current = Math.max(1, current) * 100;
        consumed += 1;
        continue;
      }
      if (part === 'thousand') {
        total += Math.max(1, current) * 1000;
        current = 0;
        consumed += 1;
        continue;
      }
      break;
    }

    if (consumed > 0) {
      normalizedTokens.push(String(total + current));
      i += consumed - 1;
      continue;
    }

    normalizedTokens.push(token);
  }

  return normalizedTokens.join(' ');
};

export const normalizeAnswerText = (value: string) => {
  return canonicalizeEnglishNumbers(String(value || ''))
    .replace(/\bI'm\b/gi, 'I am')
    .replace(/\byou're\b/gi, 'you are')
    .replace(/\bhe's\b/gi, 'he is')
    .replace(/\bshe's\b/gi, 'she is')
    .replace(/\bit's\b/gi, 'it is')
    .replace(/\bwe're\b/gi, 'we are')
    .replace(/\bthey're\b/gi, 'they are')
    .replace(/\bdon't\b/gi, 'do not')
    .replace(/\bdoesn't\b/gi, 'does not')
    .replace(/\bdidn't\b/gi, 'did not')
    .replace(/\bcan't\b/gi, 'cannot')
    .replace(/\bwon't\b/gi, 'will not')
    .replace(/\bwouldn't\b/gi, 'would not')
    .replace(/\（.*?\）|\(.*?\)/g, '')
    .replace(/[\s　]+/g, '')
    .replace(/[.,!?'"`:\-]/g, '')
    .toLowerCase()
    .trim();
};

export const matchesAnswerText = (input: string, answer: string) => {
  return normalizeAnswerText(input) === normalizeAnswerText(answer);
};

export const shuffleOptionsWithFirstCorrect = (options: string[], fallbackAnswer = '') => {
  const normalizedOptions = Array.isArray(options) ? [...options] : [];
  const correctAnswer = normalizedOptions[0] ?? fallbackAnswer;
  const shuffledOptions = [correctAnswer, ...normalizedOptions.slice(1)].sort(() => Math.random() - 0.5);
  return {
    correctAnswer,
    shuffledOptions,
  };
};

export const findMatchingOptionIndex = (options: string[], answer: string) => {
  return options.findIndex((option) => matchesAnswerText(option, answer));
};

export const matchesSpeechAnswer = (
  transcript: string,
  speechPrompt: {
    expected: string;
    alternates?: string[];
    keywords?: string[];
    minKeywordHits?: number;
  }
) => {
  const normalizedTranscript = normalizeAnswerText(transcript);
  const answers = [speechPrompt.expected, ...(speechPrompt.alternates || [])];
  const exactMatch = answers.some((answer) => {
    const normalizedAnswer = normalizeAnswerText(answer);
    return normalizedTranscript.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedTranscript);
  });

  if (exactMatch) return true;

  if (speechPrompt.keywords?.length) {
    const hits = speechPrompt.keywords.filter((keyword) =>
      normalizedTranscript.includes(normalizeAnswerText(keyword))
    ).length;
    return hits >= (speechPrompt.minKeywordHits || speechPrompt.keywords.length);
  }

  return false;
};
