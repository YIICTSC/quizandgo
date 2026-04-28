import { useCallback, useEffect, useRef, useState } from 'react';
import ProblemVisual from './ProblemVisual';
import { playCorrectSound, playIncorrectSound, startBGM, stopBGM } from '../lib/sound';
import { calculateQuizScore } from '../lib/scoring';
import { findMatchingOptionIndex, matchesAnswerText, matchesSpeechAnswer, shuffleOptionsWithFirstCorrect } from '../lib/answerMatching';

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

type QuizQuestion = {
  question?: string;
  text?: string;
  answer: string;
  options: string[];
  hint?: string;
  visual?: any;
  audioPrompt?: any;
  speechPrompt?: any;
};

const shuffle = <T,>(values: T[]) => [...values].sort(() => Math.random() - 0.5);
const generateMathQuestion = (type: string): QuizQuestion => {
  const resolvedType = type === 'mix' ? ['add', 'sub', 'mul', 'div'][Math.floor(Math.random() * 4)] : type;

  let num1 = 0;
  let num2 = 0;
  let answer = 0;
  let text = '';

  switch (resolvedType) {
    case 'add':
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      answer = num1 + num2;
      text = `${num1} + ${num2} = ?`;
      break;
    case 'sub':
      num1 = Math.floor(Math.random() * 20) + 10;
      num2 = Math.floor(Math.random() * num1);
      answer = num1 - num2;
      text = `${num1} - ${num2} = ?`;
      break;
    case 'mul':
      num1 = Math.floor(Math.random() * 9) + 1;
      num2 = Math.floor(Math.random() * 9) + 1;
      answer = num1 * num2;
      text = `${num1} × ${num2} = ?`;
      break;
    case 'div':
      num2 = Math.floor(Math.random() * 9) + 2;
      answer = Math.floor(Math.random() * 9) + 2;
      num1 = num2 * answer;
      text = `${num1} ÷ ${num2} = ?`;
      break;
    default:
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      answer = num1 + num2;
      text = `${num1} + ${num2} = ?`;
      break;
  }

  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 11) - 5;
    if (offset !== 0 && answer + offset >= 0) {
      options.add(answer + offset);
    }
  }

  return {
    question: text,
    answer: String(answer),
    options: shuffle(Array.from(options).map(String)),
  };
};

export default function SingleQuizScreen({
  questions,
  mode,
  timeLimit,
  gameTitle,
  onReturnToTitle,
}: {
  questions?: QuizQuestion[];
  mode: string;
  timeLimit: number;
  gameTitle: string;
  onReturnToTitle: () => void;
}) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const optionColors = ['#e3342f', '#3490dc', '#f6993f', '#38c172'];

  const pickQuestion = useCallback(() => {
    if (mode !== 'custom') return generateMathQuestion(mode);
    if (!questions?.length) return null;
    const source = questions[Math.floor(Math.random() * questions.length)];
    const { correctAnswer, shuffledOptions } = shuffleOptionsWithFirstCorrect(source.options, source.answer);
    return {
      ...source,
      answer: correctAnswer,
      options: shuffledOptions,
    };
  }, [mode, questions]);

  const stopRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const speakPrompt = useCallback((text: string, lang = 'ja-JP') => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = lang.startsWith('en') ? 0.95 : 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  const moveNextQuestion = useCallback((delay = 700) => {
    window.setTimeout(() => {
      setQuestion(pickQuestion());
      setAnswerResult(null);
      setSelectedAnswerIndex(null);
      setSpeechTranscript('');
    }, delay);
  }, [pickQuestion]);

  const getOptionStateClass = (index: number) => {
    const correctIndex = question ? findMatchingOptionIndex(question.options, question.answer) : -1;
    if (answerResult === null) return 'hover:scale-105 active:scale-95';
    if (index === correctIndex) return 'scale-[1.02] border-4 border-emerald-200 ring-4 ring-emerald-500/40 opacity-100';
    if (!answerResult && index === selectedAnswerIndex) return 'border-4 border-rose-200 ring-4 ring-rose-500/40 opacity-100';
    return 'opacity-35';
  };

  useEffect(() => {
    setSpeechSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    setQuestion(pickQuestion());
    startBGM('play');

    const timer = window.setInterval(() => {
      setTimeRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          stopBGM();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
      stopRecognition();
      stopBGM();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [pickQuestion, stopRecognition]);

  useEffect(() => {
    if (!question?.audioPrompt || answerResult !== null) return;
    if (question.audioPrompt.autoPlay === false) return;

    const timer = window.setTimeout(() => {
      speakPrompt(question.audioPrompt.text, question.audioPrompt.lang || 'ja-JP');
    }, 250);

    return () => window.clearTimeout(timer);
  }, [answerResult, question, speakPrompt]);

  const handleResult = (correct: boolean) => {
    setAnswerResult(correct);
    setAnsweredCount((current) => current + 1);
    if (correct) {
      setCorrectAnswers((current) => current + 1);
      playCorrectSound();
      moveNextQuestion(700);
      return;
    }
    playIncorrectSound();
    moveNextQuestion(2200);
  };

  const startSpeechRecognition = useCallback(() => {
    if (!question?.speechPrompt || answerResult !== null || isListening) return;

    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      alert('このブラウザは音声入力に対応していません。');
      return;
    }

    setSpeechTranscript('');
    const recognition = new RecognitionCtor();
    recognition.lang = question.speechPrompt.lang || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result: any) => result?.[0]?.transcript || '')
        .join(' ')
        .trim();

      setSpeechTranscript(transcript);
      handleResult(matchesSpeechAnswer(transcript, question.speechPrompt));
    };
    recognition.onerror = () => stopRecognition();
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [answerResult, isListening, question, stopRecognition]);

  if (timeRemaining <= 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl font-bold mb-8 text-yellow-400">クイズ終了</h1>
        <p className="text-2xl text-slate-300 mb-12">{gameTitle} の結果です。</p>
        <div className="bg-slate-800 px-12 py-8 rounded-2xl border border-slate-700 shadow-2xl text-center">
          <div className="text-xl text-slate-400 mb-2">あなたの成績</div>
          <div className="text-4xl font-bold mb-4 text-sky-400">あなた</div>
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div>
              <div className="text-sm text-slate-400">正答数</div>
              <div className="text-3xl font-mono font-bold text-cyan-300">{correctAnswers}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">回答数</div>
              <div className="text-3xl font-mono font-bold text-blue-400">{answeredCount}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-slate-400">最終スコア</div>
              <div className="text-4xl font-mono font-bold text-yellow-300">{calculateQuizScore({ correctAnswers })}</div>
            </div>
          </div>
          <button onClick={onReturnToTitle} className="mt-8 rounded-xl bg-slate-700 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-slate-600">
            タイトル画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 p-3 text-white md:p-4">
      <div className="mx-auto flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-800 p-4 shadow-2xl md:p-6">
        <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3 md:mb-5">
          <div>
            <div className="text-xl font-bold">シングルクイズ</div>
            <div className="text-sm text-slate-400">{gameTitle}</div>
          </div>
          <div className="flex gap-2">
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-mono">時間: <span className="font-bold text-yellow-300">{timeRemaining}</span></div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-mono">正答: <span className="font-bold text-cyan-300">{correctAnswers}</span></div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-mono">スコア: <span className="font-bold text-yellow-300">{calculateQuizScore({ correctAnswers })}</span></div>
          </div>
        </div>
        {question ? (
          <div className="min-h-0 overflow-y-auto rounded-2xl bg-slate-900/60 p-4 md:p-5">
            <h2 className="mb-3 break-words text-center text-xl font-bold leading-snug md:mb-4 md:text-3xl">{question.question || question.text}</h2>
            {question.visual && <ProblemVisual visual={question.visual} />}
            {(question.audioPrompt || question.speechPrompt) && (
              <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
                {question.audioPrompt && (
                  <button onClick={() => speakPrompt(question.audioPrompt.text, question.audioPrompt.lang || 'ja-JP')} className="rounded-xl bg-sky-600 px-4 py-3 text-base font-bold text-white hover:bg-sky-500">
                    音声を再生
                  </button>
                )}
                {question.speechPrompt && (
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={startSpeechRecognition} disabled={!speechSupported || isListening} className="rounded-xl bg-emerald-600 px-4 py-3 text-base font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600">
                      {isListening ? '聞き取り中...' : (question.speechPrompt.buttonLabel || '話して答える')}
                    </button>
                    {speechTranscript ? <div className="text-sm text-emerald-200">認識結果: {speechTranscript}</div> : null}
                  </div>
                )}
              </div>
            )}
            {question.hint ? (
              <div className="mb-4 break-words text-center text-sm text-yellow-300">{question.hint}</div>
            ) : null}
            {question.speechPrompt?.freeResponse ? (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center text-lg text-emerald-100">
                この問題は音声回答タイプです。上のボタンから話して答えてください。
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {question.options.map((opt, i) => (
                  <button
                    key={`${opt}-${i}`}
                    onClick={() => {
                      setSelectedAnswerIndex(i);
                      handleResult(matchesAnswerText(opt, question.answer));
                    }}
                    disabled={answerResult !== null}
                    className={`min-h-16 break-words rounded-2xl p-3 text-base font-bold leading-snug shadow-lg transition-transform md:min-h-20 md:p-4 md:text-xl ${answerResult !== null ? 'cursor-not-allowed' : ''} ${getOptionStateClass(i)}`}
                    style={{ backgroundColor: optionColors[i % 4] }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {answerResult === false ? (
              <div className="mt-5 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-3 text-center text-base font-bold text-emerald-100 md:text-lg">
                正解は <span className="text-emerald-300">{question.answer}</span> です
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
