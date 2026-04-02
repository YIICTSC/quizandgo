import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import GolfGame from './GolfGame';
import { playCorrectSound, playIncorrectSound, stopBGM } from '../lib/sound';
import { calculateGameScore } from '../lib/scoring';
import { matchesSpeechAnswer } from '../lib/answerMatching';
import ProblemVisual from './ProblemVisual';
import ItemSlots from './ItemSlots';
import ItemRewardOverlay from './ItemRewardOverlay';
import { GameItemId } from '../gameItems';

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

export default function PlayerScreen({ roomId, playerName }: { roomId: string, playerName: string }) {
  const [roomState, setRoomState] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
  const [correctAnswerText, setCorrectAnswerText] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const isQuizMode = roomState?.gameType === 'quiz';
  const optionColors = ['#e3342f', '#3490dc', '#f6993f', '#38c172'];

  const getOptionStateClass = (index: number) => {
    if (answerResult === null) {
      return 'hover:scale-105 active:scale-95';
    }
    if (index === correctAnswerIndex) {
      return 'scale-[1.02] border-4 border-emerald-200 ring-4 ring-emerald-500/40 opacity-100';
    }
    if (!answerResult && index === selectedAnswerIndex) {
      return 'border-4 border-rose-200 ring-4 ring-rose-500/40 opacity-100';
    }
    return 'opacity-35';
  };

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
      socket.emit('submitAnswer', { roomId, isSpeechCorrect: correct });
    };
    recognition.onerror = () => {
      stopRecognition();
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [answerResult, isListening, question, roomId, stopRecognition]);

  useEffect(() => {
    setSpeechSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));

    const onRoomStateUpdate = (room: any) => {
      setRoomState(room);
    };

    const onPersonalQuestion = (q: any) => {
      setQuestion(q);
      setAnswerResult(null);
      setSelectedAnswerIndex(null);
      setCorrectAnswerIndex(null);
      setCorrectAnswerText(null);
      setSpeechTranscript('');
    };
    const onTimeUpdate = (time: number) => {
      setTimeRemaining(time);
    };

    const onAnswerResult = ({ correct, correctIndex, correctText }: { correct: boolean; correctIndex?: number; correctText?: string }) => {
      setAnswerResult(correct);
      setCorrectAnswerIndex(typeof correctIndex === 'number' ? correctIndex : null);
      setCorrectAnswerText(correctText || null);
      if (correct) {
        playCorrectSound();
        setTimeout(() => {
          if (!isQuizMode) {
            setQuestion(null);
          }
        }, 700);
      } else {
        playIncorrectSound();
      }
    };

    socket.on('roomStateUpdate', onRoomStateUpdate);
    socket.on('personalQuestion', onPersonalQuestion);
    socket.on('answerResult', onAnswerResult);
    socket.on('timeUpdate', onTimeUpdate);

    socket.emit('getRoomState', roomId);

    return () => {
      stopRecognition();
      stopBGM();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      socket.off('roomStateUpdate', onRoomStateUpdate);
      socket.off('personalQuestion', onPersonalQuestion);
      socket.off('answerResult', onAnswerResult);
      socket.off('timeUpdate', onTimeUpdate);
    };
  }, [isQuizMode, roomId, stopRecognition]);

  useEffect(() => {
    stopBGM();
  }, [roomState]);

  useEffect(() => {
    if (!question?.audioPrompt || answerResult !== null) return;
    if (question.audioPrompt.autoPlay === false) return;

    const timer = window.setTimeout(() => {
      speakPrompt(question.audioPrompt.text, question.audioPrompt.lang || 'ja-JP');
    }, 250);

    return () => window.clearTimeout(timer);
  }, [answerResult, question, speakPrompt]);

  if (!roomState) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">読み込み中...</div>;
  }

  const me = roomState.players[socket.id];

  if (roomState.state === 'waiting') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8">参加完了！</h1>
        <p className="text-2xl text-slate-400 mb-12">ホストの開始を待っています...</p>
        <div className="bg-slate-800 px-12 py-6 rounded-2xl border border-slate-700 shadow-2xl">
          <span className="text-3xl font-bold" style={{ color: me?.color || 'white' }}>{playerName}</span>
        </div>
      </div>
    );
  }

  if (roomState.state === 'results') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl font-bold mb-8 text-yellow-400">ゲーム終了</h1>
        <p className="text-2xl text-slate-300 mb-12">最終結果はホスト画面で確認してください。</p>
        <div className="bg-slate-800 px-12 py-8 rounded-2xl border border-slate-700 shadow-2xl text-center">
          <div className="text-xl text-slate-400 mb-2">あなたの成績</div>
          <div className="text-4xl font-bold mb-4" style={{ color: me?.color || 'white' }}>{playerName}</div>
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div>
              <div className="text-sm text-slate-400">{isQuizMode ? 'モード' : 'クリアホール'}</div>
              <div className="text-3xl font-mono font-bold text-green-400">{isQuizMode ? 'QUIZ' : me?.holesCompleted}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">{isQuizMode ? '残り時間' : '打数'}</div>
              <div className="text-3xl font-mono font-bold text-blue-400">{isQuizMode ? (timeRemaining ?? roomState?.timeRemaining ?? 0) : me?.totalStrokes}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">正答数</div>
              <div className="text-3xl font-mono font-bold text-cyan-300">{me?.correctAnswers || 0}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">最終スコア</div>
              <div className="text-3xl font-mono font-bold text-yellow-300">{calculateGameScore(roomState?.gameType, me || {})}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roomState.state === 'playing') {
    if (isQuizMode) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-800 p-4 shadow-2xl md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xl font-bold">{playerName}</div>
                <div className="text-sm text-slate-400">クイズモード</div>
              </div>
              <div className="flex gap-2">
                <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-mono">残り: <span className="font-bold text-yellow-300">{timeRemaining ?? roomState?.timeRemaining ?? 0}</span></div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-mono">正答: <span className="font-bold text-cyan-300">{me?.correctAnswers || 0}</span></div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-mono">スコア: <span className="font-bold text-yellow-300">{calculateGameScore('quiz', me || {})}</span></div>
              </div>
            </div>
            {question ? (
              <div className="rounded-2xl bg-slate-900/60 p-4 md:p-6">
                <h2 className="mb-4 text-center text-2xl font-bold md:text-4xl">{question.text}</h2>
                {question.visual && <ProblemVisual visual={question.visual} />}
                {(question.audioPrompt || question.speechPrompt) && (
                  <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
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
                {question.hint ? <div className="mb-4 text-center text-sm text-yellow-300">{question.hint}</div> : null}
                {question.speechPrompt?.freeResponse ? (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center text-lg text-emerald-100">
                    この問題は音声回答タイプです。上のボタンから話して答えてください。
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {question.options.map((opt: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedAnswerIndex(i);
                          socket.emit('submitAnswer', { roomId, answerIndex: i });
                        }}
                        disabled={answerResult !== null}
                        className={`rounded-2xl p-4 text-xl font-bold shadow-lg transition-transform md:p-6 md:text-2xl ${answerResult !== null ? 'cursor-not-allowed' : ''} ${getOptionStateClass(i)}`}
                        style={{ backgroundColor: optionColors[i % 4] }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {!answerResult && correctAnswerText ? (
                  <div className="mt-5 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-3 text-center text-base font-bold text-emerald-100 md:text-lg">
                    正解は <span className="text-emerald-300">{correctAnswerText}</span> です
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      );
    }
    const pendingChoices = (me?.pendingItemChoices || []) as GameItemId[];
    const inventory = (me?.items || []) as GameItemId[];

    return (
      <div className="h-screen overflow-hidden bg-slate-900 text-white">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3 p-3 md:p-4">
          <div className="shrink-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center space-x-3">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: me?.color || 'white' }}></div>
                <span className="truncate text-xl font-bold md:text-2xl">{playerName}</span>
              </div>
              <div className="flex flex-1 flex-wrap items-start justify-end gap-2">
                <div className="flex gap-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono md:text-sm">
                    クリア: <span className="font-bold text-green-400">{me?.holesCompleted}</span>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono md:text-sm">
                    打数: <span className="font-bold text-blue-400">{me?.totalStrokes}</span>
                  </div>
                </div>
                <div className="w-full max-w-[360px] flex-none">
                  <ItemSlots
                    items={inventory}
                    activeItemId={me?.activeItemId || null}
                    disabled={pendingChoices.length > 0}
                    onSelectItem={(itemId) => socket.emit('selectActiveItem', { roomId, itemId })}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border-4 border-slate-700 bg-slate-800 shadow-2xl">
            <GolfGame roomId={roomId} me={me} players={roomState.players} activeItemId={me?.activeItemId || null} />

            {pendingChoices.length > 0 && (
              <ItemRewardOverlay
                choices={pendingChoices}
                onChoose={(itemId) => socket.emit('chooseRewardItem', { roomId, itemId })}
              />
            )}
          
            {/* Question Overlay */}
            {question && pendingChoices.length === 0 && (!me?.canShoot || answerResult !== null) && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 p-4 backdrop-blur-md md:p-8">
                {answerResult === null || answerResult === false ? (
                  <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-300">
                    <h2 className="mb-4 text-center text-2xl font-bold md:text-4xl">{question.text}</h2>
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
                    <div className="text-center mb-8">
                      <p className="text-xl text-yellow-300 bg-slate-800/50 py-2 px-4 rounded-lg inline-block">
                        💡 ヒント: {question.hint}
                      </p>
                    </div>
                  )}
                  {question.speechPrompt?.freeResponse ? (
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center">
                      <p className="text-lg text-emerald-100">この問題は音声回答タイプです。上のボタンから話して答えてください。</p>
                      {question.speechPrompt.examples?.length ? (
                        <p className="mt-3 text-sm text-emerald-200">例: {question.speechPrompt.examples.join(' / ')}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:gap-6">
                      {question.options.map((opt: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedAnswerIndex(i);
                            socket.emit('submitAnswer', { roomId, answerIndex: i });
                          }}
                        disabled={answerResult !== null}
                        className={`rounded-2xl p-4 text-xl font-bold transition-transform shadow-lg md:p-8 md:text-3xl ${
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
                  {answerResult === false && correctAnswerText ? (
                    <div className="mt-6 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-3 text-center text-lg font-bold text-emerald-100">
                      正解は <span className="text-emerald-300">{correctAnswerText}</span> です
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

  return <div>不明な状態です</div>;
}
