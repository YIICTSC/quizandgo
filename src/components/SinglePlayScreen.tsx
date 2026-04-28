import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GolfGame from './GolfGame';
import ProblemVisual from './ProblemVisual';
import { playCorrectSound, playIncorrectSound, startBGM, stopBGM } from '../lib/sound';
import { addItemToInventory, GameItemId, getRandomItemChoices } from '../gameItems';
import { findMatchingOptionIndex, matchesAnswerText, matchesSpeechAnswer, shuffleOptionsWithFirstCorrect } from '../lib/answerMatching';
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
  shotsPerQuestion = 3,
  debugHole,
  debugFreePlay = false,
  onReturnToTitle,
}: {
  questions?: SinglePlayQuestion[];
  mode: string;
  timeLimit: number;
  gameTitle: string;
  shotsPerQuestion?: number;
  debugHole?: number;
  debugFreePlay?: boolean;
  onReturnToTitle: () => void;
}) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [holesCompleted, setHolesCompleted] = useState(() => Math.max(0, (debugHole || 1) - 1));
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [currentStrokes, setCurrentStrokes] = useState(0);
  const [shotsRemaining, setShotsRemaining] = useState(0);
  const [canShoot, setCanShoot] = useState(debugFreePlay);
  const [ballInMotion, setBallInMotion] = useState(false);
  const [pinBallToStart, setPinBallToStart] = useState(!debugFreePlay);
  const [question, setQuestion] = useState<SinglePlayQuestion | null>(debugFreePlay ? null : null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [items, setItems] = useState<GameItemId[]>([]);
  const [activeItemId, setActiveItemId] = useState<GameItemId | null>(null);
  const [pendingItemChoices, setPendingItemChoices] = useState<GameItemId[] | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const optionColors = ['#e3342f', '#3490dc', '#f6993f', '#38c172'];

  const pickQuestion = useCallback(() => {
    if (mode !== 'custom') {
      return generateMathQuestion(mode);
    }
    if (!questions?.length) return null;
    const source = questions[Math.floor(Math.random() * questions.length)];
    const { correctAnswer, shuffledOptions } = shuffleOptionsWithFirstCorrect(source.options, source.answer);
    return {
      ...source,
      answer: correctAnswer,
      options: shuffledOptions,
    };
  }, [mode, questions]);

  const me = useMemo(() => ({
    id: 'single-player',
    name: 'あなた',
    color: '#38bdf8',
    holesCompleted,
    totalStrokes,
    currentStrokes,
    canShoot,
    shotsRemaining,
  }), [canShoot, currentStrokes, holesCompleted, shotsRemaining, totalStrokes]);

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
    setSelectedAnswerIndex(null);
    setSpeechTranscript('');
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
    if (!debugFreePlay) {
      setNextQuestion();
    }
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
  }, [debugFreePlay, setNextQuestion, stopRecognition]);

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
      const correct = matchesSpeechAnswer(transcript, question.speechPrompt);
      if (correct) {
        playCorrectSound();
        setAnswerResult(true);
        setShotsRemaining(shotsPerQuestion);
        setCanShoot(true);
        setPinBallToStart(false);
        window.setTimeout(() => setQuestion(null), 1000);
      } else {
        playIncorrectSound();
        setAnswerResult(false);
        window.setTimeout(() => setNextQuestion(), 2200);
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
    const correct = matchesAnswerText(option, question.answer);
    setAnswerResult(correct);

    if (correct) {
      playCorrectSound();
      setShotsRemaining(shotsPerQuestion);
      setCanShoot(true);
      setPinBallToStart(false);
      window.setTimeout(() => setQuestion(null), 1000);
    } else {
      playIncorrectSound();
      window.setTimeout(() => setNextQuestion(), 2200);
    }
  };

  const onSinglePlayerShot = useCallback(() => {
    setItems((current) => (activeItemId ? consumeOneInventoryItem(current, activeItemId) : current));
    setActiveItemId(null);
    setShotsRemaining((current) => Math.max(0, current - 1));
    setCanShoot(false);
    setBallInMotion(true);
    setCurrentStrokes((current) => current + 1);
    setTotalStrokes((current) => current + 1);
  }, [activeItemId]);

  const onSingleBallStopped = useCallback(() => {
    setBallInMotion(false);
    if (debugFreePlay) {
      setCanShoot(true);
      return;
    }
    if (!canShoot && !question && timeRemaining > 0) {
      if (shotsRemaining > 0) {
        setCanShoot(true);
        return;
      }
      setNextQuestion();
    }
  }, [canShoot, debugFreePlay, question, setNextQuestion, shotsRemaining, timeRemaining]);

  const onSingleHoleCompleted = useCallback(() => {
    setHolesCompleted((current) => current + 1);
    setCurrentStrokes(0);
    setShotsRemaining(0);
    setBallInMotion(false);
    setActiveItemId(null);
    if (debugFreePlay) {
      setCanShoot(true);
      setPinBallToStart(false);
      setPendingItemChoices(null);
      setQuestion(null);
      return;
    }
    setCanShoot(false);
    setPinBallToStart(true);
    if (timeRemaining > 0) {
      setPendingItemChoices(getRandomItemChoices(2));
    }
  }, [debugFreePlay, setNextQuestion, timeRemaining]);

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

  const moveDebugHole = (delta: number) => {
    setHolesCompleted((current) => Math.max(0, Math.min(29, current + delta)));
    setCurrentStrokes(0);
    setBallInMotion(false);
    setCanShoot(true);
    setPinBallToStart(false);
    setQuestion(null);
    setPendingItemChoices(null);
    setActiveItemId(null);
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
              {debugFreePlay ? <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-200">DEBUG FREE PLAY</span> : null}
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
                {!debugFreePlay && (
                  <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono md:text-sm">
                    残り打数: <span className="font-bold text-orange-300">{shotsRemaining}</span>
                  </div>
                )}
              </div>
              <div className="w-full max-w-[360px] flex-none">
                <ItemSlots
                  items={items}
                  activeItemId={activeItemId}
                  disabled={debugFreePlay || Boolean(pendingItemChoices?.length)}
                  onSelectItem={setActiveItemId}
                />
              </div>
              {debugFreePlay ? (
                <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2">
                  <button onClick={() => moveDebugHole(-1)} className="rounded-lg bg-slate-800 px-3 py-1 text-sm font-bold text-white hover:bg-slate-700">前のホール</button>
                  <div className="text-sm font-bold text-cyan-100">Hole {holesCompleted + 1}</div>
                  <button onClick={() => moveDebugHole(1)} className="rounded-lg bg-slate-800 px-3 py-1 text-sm font-bold text-white hover:bg-slate-700">次のホール</button>
                </div>
              ) : null}
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

          {pendingItemChoices?.length && !debugFreePlay ? (
            <ItemRewardOverlay choices={pendingItemChoices} onChoose={chooseRewardItem} />
          ) : null}

          {question && !debugFreePlay && !pendingItemChoices?.length && (!canShoot || answerResult !== null) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 p-4 backdrop-blur-md md:p-8">
              {answerResult === null || answerResult === false ? (
                <div className="max-h-full w-full max-w-2xl overflow-y-auto animate-in fade-in zoom-in duration-300">
                  <h2 className="mb-3 break-words text-center text-xl font-bold leading-snug md:text-3xl">{question.question}</h2>
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
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={startSpeechRecognition}
                          disabled={!speechSupported || isListening}
                          className="rounded-xl bg-emerald-600 px-4 py-3 text-base font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600"
                        >
                          {isListening ? '聞き取り中...' : (question.speechPrompt.buttonLabel || '話して答える')}
                        </button>
                        {speechTranscript ? <div className="text-sm text-emerald-200">認識結果: {speechTranscript}</div> : null}
                      </div>
                    )}
                  </div>
                )}
                {question.hint && (
                  <div className="mb-4 text-center">
                    <p className="inline-block rounded-lg bg-slate-800/50 px-4 py-2 text-base text-yellow-300 md:text-lg">
                      💡 ヒント: {question.hint}
                    </p>
                  </div>
                )}
                {question.speechPrompt?.freeResponse ? (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center">
                    <p className="text-lg text-emerald-100">この問題は音声回答タイプです。上のボタンから話して答えてください。</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    {question.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedAnswerIndex(i);
                          submitAnswer(opt);
                        }}
                        disabled={answerResult !== null}
                        className={`min-h-16 break-words rounded-2xl p-3 text-base font-bold leading-snug shadow-lg transition-transform md:min-h-20 md:p-4 md:text-xl ${
                          answerResult !== null ? 'cursor-not-allowed' : ''
                        } ${getOptionStateClass(i)}`}
                        style={{
                          backgroundColor: optionColors[i % 4]
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {answerResult === false ? (
                  <div className="mt-6 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-3 text-center text-lg font-bold text-emerald-100">
                    正解は <span className="text-emerald-300">{question.answer}</span> です
                  </div>
                ) : null}
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
