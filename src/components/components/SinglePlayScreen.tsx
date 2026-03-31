import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GolfGame from './GolfGame';
import ProblemVisual from './ProblemVisual';
import { playCorrectSound, playIncorrectSound, startBGM, stopBGM } from '../lib/sound';
import { addItemToInventory, GameItemId, getRandomItemChoices } from '../gameItems';
import ItemSlots from './ItemSlots';
import ItemRewardOverlay from './ItemRewardOverlay';

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

const normalizeSpeech = (value: string) => value.toLowerCase().replace(/[.,!?'"`]/g, '').replace(/\s+/g, ' ').trim();

const matchesSpeechPrompt = (transcript: string, speechPrompt: any) => {
  const normalizedTranscript = normalizeSpeech(transcript);
  const candidates = [speechPrompt.expected, ...(speechPrompt.alternates || [])]
    .map((value) => normalizeSpeech(value))
    .filter(Boolean);

  if (candidates.some((value) => value === normalizedTranscript)) {
    return true;
  }

  if (speechPrompt.keywords?.length) {
    const hits = speechPrompt.keywords.filter((keyword: string) => normalizedTranscript.includes(normalizeSpeech(keyword))).length;
    return hits >= (speechPrompt.minKeywordHits || speechPrompt.keywords.length);
  }

  return false;
};

type SinglePlayQuestion = {
  question: string;
  answer: string;
  options: string[];
  hint?: string;
  visual?: any;
  audioPrompt?: any;
  speechPrompt?: any;
};

const shuffle = <T,>(values: T[]) => [...values].sort(() => Math.random() - 0.5);

const consumeOneInventoryItem = (inventory: GameItemId[], itemId: GameItemId) => {
  const index = inventory.indexOf(itemId);
  if (index === -1) return inventory;
  return [...inventory.slice(0, index), ...inventory.slice(index + 1)];
};

const generateMathQuestion = (type: string): SinglePlayQuestion => {
  const resolvedType = type === 'mix'
    ? ['add', 'sub', 'mul', 'div'][Math.floor(Math.random() * 4)]
    : type;

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
      num1 = Math.floor(Math.random() * 9) + 2;
      num2 = Math.floor(Math.random() * 9) + 2;
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

  const options = new Set<number>();
  options.add(answer);
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

export default function SinglePlayScreen({
  questions,
  mode,
  timeLimit,
  gameTitle,
  onReturnToTitle,
}: {
  questions?: SinglePlayQuestion[];
  mode: string;
  timeLimit: number;
  gameTitle: string;
  onReturnToTitle: () => void;
}) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [holesCompleted, setHolesCompleted] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [currentStrokes, setCurrentStrokes] = useState(0);
  const [canShoot, setCanShoot] = useState(false);
  const [ballInMotion, setBallInMotion] = useState(false);
  const [pinBallToStart, setPinBallToStart] = useState(true);
  const [question, setQuestion] = useState<SinglePlayQuestion | null>(null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [items, setItems] = useState<GameItemId[]>([]);
  const [activeItemId, setActiveItemId] = useState<GameItemId | null>(null);
  const [pendingItemChoices, setPendingItemChoices] = useState<GameItemId[] | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const pickQuestion = useCallback(() => {
    if (mode !== 'custom') {
      return generateMathQuestion(mode);
    }
    if (!questions?.length) return null;
    return questions[Math.floor(Math.random() * questions.length)];
  }, [mode, questions]);

  const me = useMemo(() => ({
    id: 'single-player',
    name: 'あなた',
    color: '#38bdf8',
    holesCompleted,
    totalStrokes,
    currentStrokes,
    canShoot,
  }), [canShoot, currentStrokes, holesCompleted, totalStrokes]);

  const speakPrompt = useCallback((text: string, lang = 'ja-JP') => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = lang.startsWith('en') ? 0.95 : 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const setNextQuestion = useCallback(() => {
    setQuestion(pickQuestion());
    setAnswerResult(null);
  }, [pickQuestion]);

  useEffect(() => {
    setSpeechSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    setNextQuestion();
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
  }, [setNextQuestion, stopRecognition]);

  useEffect(() => {
    if (!question?.audioPrompt || answerResult !== null) return;
    if (question.audioPrompt.autoPlay === false) return;

    const timer = window.setTimeout(() => {
      speakPrompt(question.audioPrompt.text, question.audioPrompt.lang || 'ja-JP');
    }, 250);

    return () => window.clearTimeout(timer);
  }, [answerResult, question, speakPrompt]);

  const startSpeechRecognition = useCallback(() => {
    if (!question?.speechPrompt || answerResult !== null || isListening) return;

    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      alert('このブラウザは音声入力に対応していません。');
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = question.speechPrompt.lang || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result: any) => result?.[0]?.transcript || '')
        .join(' ')
        .trim();

      const correct = matchesSpeechPrompt(transcript, question.speechPrompt);
      if (correct) {
        playCorrectSound();
        setAnswerResult(true);
        setCanShoot(true);
        setPinBallToStart(false);
        window.setTimeout(() => setQuestion(null), 1000);
      } else {
        playIncorrectSound();
        setAnswerResult(false);
        window.setTimeout(() => setNextQuestion(), 1500);
      }
    };
    recognition.onerror = () => stopRecognition();
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [answerResult, isListening, question, setNextQuestion, stopRecognition]);

  const submitAnswer = (option: string) => {
    if (!question) return;
    const correct = option === question.answer;
    setAnswerResult(correct);

    if (correct) {
      playCorrectSound();
      setCanShoot(true);
      setPinBallToStart(false);
      window.setTimeout(() => setQuestion(null), 1000);
    } else {
      playIncorrectSound();
      window.setTimeout(() => setNextQuestion(), 1500);
    }
  };

  const onSinglePlayerShot = useCallback(() => {
    setItems((current) => (activeItemId ? consumeOneInventoryItem(current, activeItemId) : current));
    setActiveItemId(null);
    setCanShoot(false);
    setBallInMotion(true);
    setCurrentStrokes((current) => current + 1);
    setTotalStrokes((current) => current + 1);
  }, [activeItemId]);

  const onSingleBallStopped = useCallback(() => {
    setBallInMotion(false);
    if (!canShoot && !question && timeRemaining > 0) {
      setNextQuestion();
    }
  }, [canShoot, question, setNextQuestion, timeRemaining]);

  const onSingleHoleCompleted = useCallback(() => {
    setHolesCompleted((current) => current + 1);
    setCurrentStrokes(0);
    setCanShoot(false);
    setBallInMotion(false);
    setPinBallToStart(true);
    setActiveItemId(null);
    if (timeRemaining > 0) {
      setPendingItemChoices(getRandomItemChoices(2));
    }
  }, [setNextQuestion, timeRemaining]);

  const chooseRewardItem = (itemId: GameItemId) => {
    setItems((current) => addItemToInventory(current, itemId, 3));
    setPendingItemChoices(null);
    window.setTimeout(() => setNextQuestion(), 120);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (timeRemaining <= 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl font-bold mb-8 text-yellow-400">シングルプレイ終了</h1>
        <p className="text-2xl text-slate-300 mb-12">{gameTitle} の結果です。</p>
        <div className="bg-slate-800 px-12 py-8 rounded-2xl border border-slate-700 shadow-2xl text-center">
          <div className="text-xl text-slate-400 mb-2">あなたの成績</div>
          <div className="text-4xl font-bold mb-4 text-sky-400">あなた</div>
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div>
              <div className="text-sm text-slate-400">クリアホール</div>
              <div className="text-3xl font-mono font-bold text-green-400">{holesCompleted}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">打数</div>
              <div className="text-3xl font-mono font-bold text-blue-400">{totalStrokes}</div>
            </div>
          </div>
          <button
            onClick={onReturnToTitle}
            className="mt-8 rounded-xl bg-slate-700 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-slate-600"
          >
            タイトル画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-900 text-white">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3 p-3 md:p-4">
        <div className="shrink-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center space-x-3">
            <div className="w-6 h-6 rounded-full bg-sky-400"></div>
              <span className="text-xl font-bold md:text-2xl">シングルプレイ</span>
              <span className="truncate text-sm text-slate-400">{gameTitle}</span>
            </div>
            <div className="flex flex-1 flex-wrap items-start justify-end gap-2">
              <div className="flex gap-2">
                <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono md:text-sm">
                  時間: <span className="font-bold text-yellow-300">{formatTime(timeRemaining)}</span>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono md:text-sm">
                  クリア: <span className="font-bold text-green-400">{holesCompleted}</span>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono md:text-sm">
                  打数: <span className="font-bold text-blue-400">{totalStrokes}</span>
                </div>
              </div>
              <div className="w-full max-w-[360px] flex-none">
                <ItemSlots
                  items={items}
                  activeItemId={activeItemId}
                  disabled={Boolean(pendingItemChoices?.length)}
                  onSelectItem={setActiveItemId}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border-4 border-slate-700 bg-slate-800 shadow-2xl">
          <GolfGame
            roomId="single-player"
            me={me}
            players={{}}
            isSinglePlayer
            freezeBall={pinBallToStart && !canShoot && !ballInMotion}
            activeItemId={activeItemId}
            onSinglePlayerShot={onSinglePlayerShot}
            onSingleBallStopped={onSingleBallStopped}
            onSingleHoleCompleted={onSingleHoleCompleted}
          />

          {pendingItemChoices?.length ? (
            <ItemRewardOverlay choices={pendingItemChoices} onChoose={chooseRewardItem} />
          ) : null}

          {question && !pendingItemChoices?.length && (!canShoot || answerResult !== null) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 p-4 backdrop-blur-md md:p-8">
              {answerResult === null ? (
                <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-300">
                  <h2 className="mb-4 text-center text-2xl font-bold md:text-4xl">{question.question}</h2>
                {question.visual && <ProblemVisual visual={question.visual} />}
                {(question.audioPrompt || question.speechPrompt) && (
                  <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
                    {question.audioPrompt && (
                      <button
                        onClick={() => speakPrompt(question.audioPrompt.text, question.audioPrompt.lang || 'ja-JP')}
                        className="rounded-xl bg-sky-600 px-4 py-3 text-base font-bold text-white hover:bg-sky-500"
                      >
                        音声を再生
                      </button>
                    )}
                    {question.speechPrompt && (
                      <button
                        onClick={startSpeechRecognition}
                        disabled={!speechSupported || isListening}
                        className="rounded-xl bg-emerald-600 px-4 py-3 text-base font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600"
                      >
                        {isListening ? '聞き取り中...' : (question.speechPrompt.buttonLabel || '話して答える')}
                      </button>
                    )}
                  </div>
                )}
                {question.hint && (
                  <div className="text-center mb-8">
                    <p className="text-xl text-yellow-300 bg-slate-800/50 py-2 px-4 rounded-lg inline-block">
                      💡 ヒント: {question.hint}
                    </p>
                  </div>
                )}
                {question.speechPrompt?.freeResponse ? (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center">
                    <p className="text-lg text-emerald-100">この問題は音声回答タイプです。上のボタンから話して答えてください。</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:gap-6">
                    {question.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => submitAnswer(opt)}
                        disabled={answerResult !== null}
                        className={`rounded-2xl p-4 text-xl font-bold transition-transform shadow-lg md:p-8 md:text-3xl ${
                          answerResult !== null ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                        }`}
                        style={{
                          backgroundColor: ['#e3342f', '#3490dc', '#f6993f', '#38c172'][i % 4]
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in text-center">
                  <h1 className={`mb-4 text-4xl font-bold md:text-6xl ${answerResult ? 'text-green-500' : 'text-red-500'}`}>
                    {answerResult ? '正解！' : 'ざんねん！'}
                  </h1>
                  <p className="text-lg text-slate-300 md:text-2xl">
                    {answerResult ? 'ボールを引っ張ってショット！' : '次の問題を待ってね...'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
