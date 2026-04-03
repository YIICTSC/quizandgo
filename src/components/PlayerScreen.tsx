import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import GolfGame from './GolfGame';
import { playCorrectSound, playDefeatSound, playExplosionSound, playIncorrectSound, stopBGM } from '../lib/sound';
import { calculateGameScore } from '../lib/scoring';
import { matchesSpeechAnswer } from '../lib/answerMatching';
import ProblemVisual from './ProblemVisual';
import ItemSlots from './ItemSlots';
import ItemRewardOverlay from './ItemRewardOverlay';
import { GameItemId } from '../gameItems';
import BomberGame from './BomberGame';
import AvatarPreview from './AvatarPreview';
import AvatarEditor from './AvatarEditor';
import { AVATAR_STORAGE_KEY, AvatarConfig, createRandomAvatar, normalizeAvatar } from '../avatar';

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

const isBomberGameType = (gameType?: string) =>
  gameType === 'bomber' || gameType === 'team_bomber' || gameType === 'color_bomber';

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
  const [editableAvatar, setEditableAvatar] = useState<AvatarConfig>(() => {
    try {
      const saved = window.localStorage.getItem(AVATAR_STORAGE_KEY);
      return normalizeAvatar(saved ? JSON.parse(saved) : null);
    } catch (e) {
      return createRandomAvatar();
    }
  });
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const ignoreNextServerAnswerRef = useRef(false);
  const ignoreNextServerQuestionRef = useRef(false);
  const previousExplosionCountRef = useRef(0);
  const previousAliveRef = useRef<boolean | null>(null);
  const isQuizMode = roomState?.gameType === 'quiz';
  const isBomberMode = isBomberGameType(roomState?.gameType);
  const quizVariant = roomState?.quizVariant || 'classic';
  const quizVariantLabel =
    quizVariant === 'combo' ? 'コンボクイズ' :
    quizVariant === 'speed' ? '早押しポイント' :
    quizVariant === 'team_battle' ? 'チームクイズバトル' :
    quizVariant === 'boss' ? 'ボスクイズ' :
    'クラシック';
  const isTeamBomberMode = roomState?.gameType === 'team_bomber';
  const isColorBomberMode = roomState?.gameType === 'color_bomber';
  const hasBomberTeams = isTeamBomberMode || (isColorBomberMode && roomState?.teamMode);
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

  const applyLocalAnswerResult = useCallback((payload: { correct: boolean; correctIndex?: number; correctText?: string; nextQuestion?: any; nextDelayMs?: number | null }) => {
    setAnswerResult(payload.correct);
    setCorrectAnswerIndex(typeof payload.correctIndex === 'number' ? payload.correctIndex : null);
    setCorrectAnswerText(payload.correctText || null);
    if (payload.correct) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }

    if (payload.nextQuestion) {
      window.setTimeout(() => {
        setQuestion(payload.nextQuestion);
        setAnswerResult(null);
        setSelectedAnswerIndex(null);
        setCorrectAnswerIndex(null);
        setCorrectAnswerText(null);
        setSpeechTranscript('');
      }, payload.nextDelayMs || (payload.correct ? 700 : 2200));
    }
  }, []);

  const submitAnswer = useCallback((payload: { answerIndex?: number; isSpeechCorrect?: boolean }) => {
    if (isBomberMode) {
      socket.emit('submitAnswer', { roomId, ...payload }, (response?: any) => {
        if (!response?.ok) return;
        ignoreNextServerAnswerRef.current = true;
        if (response.nextQuestion) {
          ignoreNextServerQuestionRef.current = true;
        }
        applyLocalAnswerResult(response);
      });
      return;
    }

    socket.emit('submitAnswer', { roomId, ...payload });
  }, [applyLocalAnswerResult, isBomberMode, roomId]);

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
      submitAnswer({ isSpeechCorrect: correct });
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
  }, [answerResult, isListening, question, stopRecognition, submitAnswer]);

  useEffect(() => {
    setSpeechSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));

    const onRoomStateUpdate = (room: any) => {
      setRoomState(room);
    };

    const onPersonalQuestion = (q: any) => {
      if (ignoreNextServerQuestionRef.current) {
        ignoreNextServerQuestionRef.current = false;
        return;
      }
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
      if (ignoreNextServerAnswerRef.current) {
        ignoreNextServerAnswerRef.current = false;
        return;
      }
      setAnswerResult(correct);
      setCorrectAnswerIndex(typeof correctIndex === 'number' ? correctIndex : null);
      setCorrectAnswerText(correctText || null);
      if (correct) {
        playCorrectSound();
        setTimeout(() => {
          if (!isQuizMode && !isBomberMode) {
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
  }, [isBomberMode, isQuizMode, roomId, stopRecognition]);

  useEffect(() => {
    stopBGM();
  }, [roomState]);

  useEffect(() => {
    if (!isBomberMode || !roomState) return;

    const explosionCount = roomState.bomberState?.explosions?.length || 0;
    if (explosionCount > previousExplosionCountRef.current) {
      playExplosionSound();
    }
    previousExplosionCountRef.current = explosionCount;

    const alive = roomState.players?.[socket.id]?.alive;
    if (previousAliveRef.current === true && alive === false) {
      playDefeatSound();
    }
    previousAliveRef.current = typeof alive === 'boolean' ? alive : null;
  }, [isBomberMode, roomState]);

  useEffect(() => {
    if (!question?.audioPrompt || answerResult !== null) return;
    if (question.audioPrompt.autoPlay === false) return;

    const timer = window.setTimeout(() => {
      speakPrompt(question.audioPrompt.text, question.audioPrompt.lang || 'ja-JP');
    }, 250);

    return () => window.clearTimeout(timer);
  }, [answerResult, question, speakPrompt]);

  useEffect(() => {
    if (roomState?.state !== 'waiting') return;
    const me = roomState?.players?.[socket.id];
    if (!me?.avatar) return;
    setEditableAvatar((current) => {
      const next = normalizeAvatar(me.avatar);
      return JSON.stringify(current) === JSON.stringify(next) ? current : next;
    });
  }, [roomState]);

  const handleAvatarChange = useCallback((nextAvatar: AvatarConfig) => {
    const normalized = normalizeAvatar(nextAvatar);
    setEditableAvatar(normalized);
    try {
      window.localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) {}
    socket.emit('updateAvatar', { roomId, avatar: normalized });
  }, [roomId]);

  if (!roomState) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">読み込み中...</div>;
  }

  const me = roomState.players[socket.id];
  const sortedPlayers = Object.values(roomState.players || {}).sort((a: any, b: any) => {
    const scoreDiff = calculateGameScore(roomState?.gameType, b) - calculateGameScore(roomState?.gameType, a);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    if (roomState?.gameType === 'quiz') {
      return (b.correctAnswers || 0) - (a.correctAnswers || 0);
    }
    return (a.totalStrokes || 0) - (b.totalStrokes || 0);
  });
  const myRank = Math.max(0, sortedPlayers.findIndex((player: any) => player.id === socket.id)) + 1;
  const myTeamId = me?.teamId ?? null;
  const teammates = sortedPlayers.filter((player: any) => player.teamId === myTeamId);
  const myTeamName = myTeamId ? (roomState.teamNames?.[myTeamId] || `Team ${myTeamId}`) : null;
  const bomberItems = [
    me?.fireLevel > 0 ? `🔥x${me.fireLevel}` : null,
    (me?.moveSpeedLevel || 0) > 0 ? `⚡x${me.moveSpeedLevel}` : null,
    me?.hasKickBomb ? '🥾キック' : null,
    me?.hasShield ? '🛡️シールド' : null,
    me?.hasRemoteBomb ? '📡リモコン' : null,
    me?.hasPierceFire ? '💥貫通' : null,
  ].filter(Boolean);

  if (roomState.state === 'waiting') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-4xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-700 bg-slate-800 p-5 shadow-2xl md:p-8">
            <div className="mb-5 text-center">
              <h1 className="text-4xl font-black">参加完了！</h1>
              <p className="mt-3 text-lg text-slate-400">ホストの開始を待ちながら、アバターを作成できます。</p>
            </div>
            <div className="mb-5 flex items-center justify-center gap-4 rounded-2xl border border-slate-700 bg-slate-900/40 px-6 py-4">
              <AvatarPreview avatar={editableAvatar} size={72} />
              <div>
                <div className="text-sm text-slate-400">参加中の名前</div>
                <div className="text-3xl font-bold" style={{ color: me?.color || 'white' }}>{playerName}</div>
              </div>
            </div>
            <AvatarEditor avatar={editableAvatar} onChange={handleAvatarChange} compact />
            <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              パーツは軽量な設定値だけ保存します。ホスト画面の参加者一覧にもすぐ反映されます。
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roomState.state === 'teamReveal') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl rounded-3xl border border-cyan-500/30 bg-slate-800 p-6 shadow-2xl md:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-4xl font-black text-cyan-200 md:text-5xl">チーム発表</h1>
            <p className="mt-3 text-lg text-slate-300">ホストがチーム分けを確定するまでお待ちください。</p>
          </div>
          <div className="mb-6 flex justify-center">
            <div className="rounded-full border border-cyan-300/40 bg-cyan-500/15 px-8 py-4 text-2xl font-black text-cyan-100">
              あなたは {myTeamName ?? '-'}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
            <div className="mb-3 text-lg font-bold text-slate-100">チームメイト</div>
            <div className="grid gap-3 md:grid-cols-2">
              {teammates.map((player: any) => (
                <div key={player.id} className="flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3">
                  <AvatarPreview avatar={player.avatar} size={36} />
                  <span className="font-bold">{player.name}</span>
                </div>
              ))}
            </div>
          </div>
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
          <div className="mb-4 flex justify-center">
            <AvatarPreview avatar={me?.avatar} size={88} />
          </div>
          <div className="text-4xl font-bold mb-4" style={{ color: me?.color || 'white' }}>{playerName}</div>
          <div className="mx-auto mb-6 inline-flex rounded-full border border-yellow-400/40 bg-yellow-500/15 px-6 py-3 text-xl font-black text-yellow-200">
            {myRank}位
          </div>
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div>
              <div className="text-sm text-slate-400">{isQuizMode ? 'モード' : isBomberMode ? '撃破' : 'クリアホール'}</div>
              <div className="text-3xl font-mono font-bold text-green-400">{isQuizMode ? 'QUIZ' : isBomberMode ? (me?.kills || 0) : me?.holesCompleted}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">{isQuizMode ? '残り時間' : isBomberMode ? '破壊' : '打数'}</div>
              <div className="text-3xl font-mono font-bold text-blue-400">{isQuizMode ? (timeRemaining ?? roomState?.timeRemaining ?? 0) : isBomberMode ? (me?.blocksDestroyed || 0) : me?.totalStrokes}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">{isBomberMode ? '正答数' : '正答数'}</div>
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
                <div className="text-sm text-slate-400">クイズモード / {quizVariantLabel}</div>
              </div>
              <div className="flex gap-2">
                <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-mono">残り: <span className="font-bold text-yellow-300">{timeRemaining ?? roomState?.timeRemaining ?? 0}</span></div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-mono">正答: <span className="font-bold text-cyan-300">{me?.correctAnswers || 0}</span></div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-mono">スコア: <span className="font-bold text-yellow-300">{calculateGameScore('quiz', me || {})}</span></div>
              </div>
            </div>
            {quizVariant === 'boss' ? (
              <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3">
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-rose-100">
                  <span>ボスHP</span>
                  <span>{roomState?.bossHp || 0} / {roomState?.bossMaxHp || 0}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-slate-900/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-300"
                    style={{ width: `${roomState?.bossMaxHp ? ((roomState?.bossHp || 0) / roomState.bossMaxHp) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ) : null}
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
    if (isBomberMode) {
      return (
        <div className="h-screen overflow-hidden bg-slate-900 text-white">
          <div className="mx-auto flex h-full max-w-7xl flex-col gap-2 p-2 md:p-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AvatarPreview avatar={me?.avatar} size={38} />
                  <div>
                    <div className="text-lg font-bold md:text-xl">{playerName}</div>
                    <div className="text-xs text-slate-400">
                      {isTeamBomberMode ? 'チームボンバー' : isColorBomberMode ? 'カラーボンバー' : 'クイズボンバー'}
                    </div>
                    {hasBomberTeams && myTeamName ? (
                      <div className="mt-1 text-[11px] font-bold text-cyan-200">{myTeamName}</div>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">残り: <span className="font-bold text-yellow-300">{timeRemaining ?? roomState?.timeRemaining ?? 0}</span></div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">爆弾: <span className="font-bold text-rose-300">{me?.bombsAvailable || 0}</span></div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">撃破: <span className="font-bold text-emerald-300">{me?.kills || 0}</span></div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">破壊: <span className="font-bold text-amber-300">{me?.blocksDestroyed || 0}</span></div>
                  {isColorBomberMode ? <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">色: <span className="font-bold text-fuchsia-300">{me?.territoryCells || 0}</span></div> : null}
                  {isTeamBomberMode ? <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">誤爆: <span className="font-bold text-rose-300">{roomState?.bomberFriendlyFire ? 'ON' : 'OFF'}</span></div> : null}
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">スコア: <span className="font-bold text-cyan-300">{calculateGameScore(roomState?.gameType, me || {})}</span></div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {bomberItems.length > 0 ? bomberItems.map((item) => (
                  <span key={item as string} className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-100">
                    {item}
                  </span>
                )) : (
                  <span className="text-[10px] text-slate-400">所持アイテムなし</span>
                )}
              </div>
              {hasBomberTeams ? (
                <div className="mt-2 rounded-xl border border-cyan-500/20 bg-slate-900/30 px-3 py-2 text-xs text-cyan-100">
                  <div className="mb-1 font-bold text-cyan-200">チームメイト</div>
                  <div className="flex flex-wrap gap-2">
                    {teammates.map((player: any) => (
                      <span key={player.id} className="rounded-full bg-cyan-500/15 px-2.5 py-1 font-bold">
                        {player.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="grid min-h-0 flex-1 gap-2 grid-rows-[minmax(0,1fr)_minmax(0,38vh)] lg:grid-cols-[minmax(0,1fr)_330px] lg:grid-rows-1">
              <div className="min-h-0 rounded-2xl border border-slate-700 bg-slate-800 p-2">
                <BomberGame
                  roomId={roomId}
                  me={me}
                  players={roomState.players}
                  bomberState={roomState.bomberState}
                  onMove={(direction) => socket.emit('moveBomber', { roomId, direction })}
                  onPlaceBomb={() => socket.emit('placeBomberBomb', { roomId })}
                  canUseRemote={Boolean(me?.hasRemoteBomb)}
                  onDetonateRemote={() => socket.emit('detonateRemoteBomb', { roomId })}
                />
              </div>
              <div className="min-h-0 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-3">
                {!me?.alive ? (
                  <div className="mb-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-center">
                    <div className="text-xl font-black text-rose-300">やられた！</div>
                    <div className="mt-1 text-xs text-rose-100">少し待つと復活します。</div>
                  </div>
                ) : null}
                {question ? (
                  <div className="flex h-full min-h-0 flex-col gap-3">
                    <div className="rounded-2xl bg-slate-900/50 p-3">
                      <div className="mb-2 text-[11px] font-bold text-slate-400">正解すると爆弾を1個補充</div>
                      <h2 className="text-xl font-black leading-snug md:text-2xl">{question.text}</h2>
                    </div>
                    {question.visual ? <ProblemVisual visual={question.visual} /> : null}
                    {(question.audioPrompt || question.speechPrompt) && (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {question.audioPrompt && (
                          <button onClick={() => speakPrompt(question.audioPrompt.text, question.audioPrompt.lang || 'ja-JP')} className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-bold text-white hover:bg-sky-500">
                            音声を再生
                          </button>
                        )}
                        {question.speechPrompt && (
                          <div className="flex flex-col items-center gap-2">
                            <button onClick={startSpeechRecognition} disabled={!speechSupported || isListening} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600">
                              {isListening ? '聞き取り中...' : (question.speechPrompt.buttonLabel || '話して答える')}
                            </button>
                            {speechTranscript ? <div className="text-sm text-emerald-200">認識結果: {speechTranscript}</div> : null}
                          </div>
                        )}
                      </div>
                    )}
                    {question.hint ? <div className="text-xs text-yellow-300">ヒント: {question.hint}</div> : null}
                    {question.speechPrompt?.freeResponse ? (
                      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center text-base text-emerald-100">
                        この問題は音声回答タイプです。上のボタンから話して答えてください。
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {question.options.map((opt: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedAnswerIndex(i);
                              submitAnswer({ answerIndex: i });
                            }}
                            disabled={answerResult !== null}
                            className={`rounded-2xl p-3 text-base font-bold shadow-lg transition-transform md:text-lg ${answerResult !== null ? 'cursor-not-allowed' : ''} ${getOptionStateClass(i)}`}
                            style={{ backgroundColor: optionColors[i % 4] }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                    {answerResult === false && correctAnswerText ? (
                      <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-3 py-2 text-center text-sm font-bold text-emerald-100">
                        正解は <span className="text-emerald-300">{correctAnswerText}</span> です
                      </div>
                    ) : null}
                    {answerResult === true ? (
                      <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-center text-sm font-bold text-cyan-100">
                        正解。爆弾を1個補充しました。
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">問題を準備しています...</div>
                )}
              </div>
            </div>
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
                {myTeamId ? (
                  <span className="rounded-full border border-cyan-300/30 bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-200">
                    {myTeamName}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-1 flex-wrap items-start justify-end gap-2">
                <div className="flex gap-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono md:text-sm">
                    クリア: <span className="font-bold text-green-400">{me?.holesCompleted}</span>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono md:text-sm">
                    打数: <span className="font-bold text-blue-400">{me?.totalStrokes}</span>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono md:text-sm">
                    残り打数: <span className="font-bold text-orange-300">{me?.shotsRemaining || 0}</span>
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
                {myTeamId ? (
                  <div className="w-full rounded-xl border border-cyan-500/20 bg-slate-800/80 px-3 py-2 text-xs text-cyan-100">
                    <div className="mb-1 font-bold text-cyan-200">チームメイト</div>
                    <div className="flex flex-wrap gap-2">
                      {teammates.map((player: any) => (
                        <span key={player.id} className="rounded-full bg-cyan-500/15 px-2.5 py-1 font-bold">
                          {player.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
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
                          submitAnswer({ answerIndex: i });
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
