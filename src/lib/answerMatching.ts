export const normalizeAnswerText = (value: string) => {
  return String(value || '')
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
