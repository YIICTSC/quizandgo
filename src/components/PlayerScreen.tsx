import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import GolfGame from './GolfGame';
import { playCorrectSound, playDefeatSound, playExplosionSound, playIncorrectSound, playSpecialShotSound, stopBGM } from '../lib/sound';
import { calculateGameScore } from '../lib/scoring';
import { matchesSpeechAnswer } from '../lib/answerMatching';
import ProblemVisual from './ProblemVisual';
import ItemSlots from './ItemSlots';
import ItemRewardOverlay from './ItemRewardOverlay';
import { GameItemId } from '../gameItems';
import BomberGame from './BomberGame';
import DodgeGame from './DodgeGame';
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

export default function PlayerScreen({
  roomId,
  playerName,
  onSwitchToHostScreen,
}: {
  roomId: string;
  playerName: string;
  onSwitchToHostScreen?: () => void;
}) {
  const [roomState, setRoomState] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
  const [correctAnswerText, setCorrectAnswerText] = useState<string | null>(null);
  const [battleAnswerSubmitted, setBattleAnswerSubmitted] = useState(false);
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
  const previousSpecialBallCountRef = useRef(0);
  const isQuizMode = roomState?.gameType === 'quiz';
  const isDodgeMode = roomState?.gameType === 'dodge';
  const isBomberMode = isBomberGameType(roomState?.gameType);
  const quizVariant = roomState?.quizVariant || 'classic';
  const quizVariantLabel =
    quizVariant === 'combo' ? 'コンボクイズ' :
    quizVariant === 'speed' ? '早押しポイント' :
    quizVariant === 'team_battle' ? 'チームクイズバトル' :
    quizVariant === 'boss' ? 'ボスクイズ' :
    quizVariant === 'battle_royale' ? '早押しバトルロイヤル' :
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
    if (isBomberMode || isDodgeMode) {
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
  }, [applyLocalAnswerResult, isBomberMode, isDodgeMode, roomId]);

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
      setBattleAnswerSubmitted(false);
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
          if (!isQuizMode && !isBomberMode && !isDodgeMode) {
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
  }, [isBomberMode, isDodgeMode, isQuizMode, roomId, stopRecognition]);

  useEffect(() => {
    const me = roomState?.players?.[socket.id];
    if (!me?.currentQuestion) return;
    setQuestion((current) => {
      if (current?.text === me.currentQuestion.text) {
        return current;
      }
      return {
        text: me.currentQuestion.text,
        options: me.currentQuestion.options,
        hint: me.currentQuestion.hint,
        visual: me.currentQuestion.visual,
        audioPrompt: me.currentQuestion.audioPrompt,
        speechPrompt: me.currentQuestion.speechPrompt,
      };
    });
  }, [roomState]);

  useEffect(() => {
    if (!isDodgeMode || !roomState) return;
    const specialBallCount = (roomState.dodgeState?.balls || []).filter((ball: any) => ball.shotType && ball.shotType !== 'normal').length;
    if (specialBallCount > previousSpecialBallCountRef.current) {
      playSpecialShotSound();
    }
    previousSpecialBallCountRef.current = specialBallCount;
  }, [isDodgeMode, roomState]);

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
    if (roomState?.quizBattlePhase !== 'question') {
      setBattleAnswerSubmitted(false);
    }
  }, [roomState?.quizBattlePhase]);

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

  const handleDodgeMove = useCallback((direction: 'up' | 'down' | 'left' | 'right' | null) => {
    socket.emit('setDodgeMove', { roomId, direction });
  }, [roomId]);

  const handleDodgeMoveVector = useCallback((vector: { x: number; y: number } | null) => {
    socket.emit('setDodgeMoveVector', { roomId, vector });
  }, [roomId]);

  const handleDodgeThrow = useCallback((vector?: { x: number; y: number }) => {
    socket.emit('throwDodgeBall', { roomId, vector });
  }, [roomId]);

  const hostSwitchButton = onSwitchToHostScreen ? (
    <button
      onClick={onSwitchToHostScreen}
      className="fixed right-4 top-4 z-50 rounded-xl border border-fuchsia-300/40 bg-fuchsia-500/20 px-4 py-2 text-sm font-bold text-fuchsia-100 shadow-lg backdrop-blur transition-colors hover:bg-fuchsia-500/35"
    >
      ホスト画面へ切り替え
    </button>
  ) : null;
  const hostRemainingSeconds = timeRemaining ?? roomState?.timeRemaining ?? roomState?.timeLimit ?? null;
  const hostPersistentGameInfo = onSwitchToHostScreen ? (
    <div className="fixed left-4 top-4 z-50 flex flex-wrap items-center gap-2 rounded-xl border border-cyan-300/35 bg-slate-950/85 px-3 py-2 text-xs font-mono shadow-lg backdrop-blur md:text-sm">
      <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-cyan-100">
        PIN: <span className="font-black tracking-[0.2em] text-cyan-300">{roomId}</span>
      </div>
      <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-yellow-100">
        残り: <span className="font-black text-yellow-300">{hostRemainingSeconds ?? '--'}</span>
      </div>
    </div>
  ) : null;

  if (!roomState) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        {hostSwitchButton}
        {hostPersistentGameInfo}
        読み込み中...
      </div>
    );
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
  const myBattlePair = (roomState.quizBattlePairs || []).find((pair: any) => pair.id === me?.currentBattlePairId) || null;
  const myBattleOpponentIds = (myBattlePair?.playerIds || []).filter((id: string) => id !== socket.id);
  const myBattleOpponents = myBattleOpponentIds.map((id: string) => roomState.players?.[id]).filter(Boolean);
  const myBattleQuestion = myBattlePair?.question || question;
  const myBattleAnswered = Boolean(myBattlePair?.answers?.[socket.id]);
  const getBattleCardExpression = (playerId?: string) => {
    if (!playerId || !myBattlePair) return 'normal' as const;
    if (myBattlePair.winnerId === playerId) return 'happy' as const;
    if (myBattlePair.loserIds?.includes(playerId)) return 'sad' as const;
    return 'normal' as const;
  };
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
        {hostSwitchButton}
        {hostPersistentGameInfo}
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
        {hostSwitchButton}
        {hostPersistentGameInfo}
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
        {hostSwitchButton}
        {hostPersistentGameInfo}
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
              <div className="text-sm text-slate-400">{isQuizMode ? 'モード' : isBomberMode || isDodgeMode ? '撃破' : 'クリアホール'}</div>
              <div className="text-3xl font-mono font-bold text-green-400">{isQuizMode ? 'QUIZ' : isBomberMode || isDodgeMode ? (me?.kills || 0) : me?.holesCompleted}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">{isQuizMode ? '残り時間' : isBomberMode ? '破壊' : isDodgeMode ? '被弾' : '打数'}</div>
              <div className="text-3xl font-mono font-bold text-blue-400">{isQuizMode ? (timeRemaining ?? roomState?.timeRemaining ?? 0) : isBomberMode ? (me?.blocksDestroyed || 0) : isDodgeMode ? (me?.deaths || 0) : me?.totalStrokes}</div>
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
          {hostSwitchButton}
          {hostPersistentGameInfo}
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
            {quizVariant === 'battle_royale' && roomState?.quizBattlePhase === 'matchup' ? (
              <div className="rounded-[2rem] border border-fuchsia-400/35 bg-[radial-gradient(circle_at_top,#701a75,#0f172a_62%)] p-6 text-center shadow-[0_0_50px_rgba(168,85,247,0.2)] md:p-8">
                <div className="mb-3 text-sm font-black tracking-[0.35em] text-fuchsia-200">NEXT MATCH</div>
                <div className={`grid items-center gap-4 ${myBattleOpponents.length >= 2 ? 'md:grid-cols-[1fr_auto_1fr_auto_1fr]' : 'md:grid-cols-[1fr_auto_1fr]'}`}>
                  <div className="rounded-[1.5rem] border border-cyan-300/25 bg-slate-950/55 p-4">
                    <div className="mb-3 flex justify-center">
                      <AvatarPreview avatar={me?.avatar} size={88} />
                    </div>
                    <div className="text-3xl font-black text-white">{playerName}</div>
                    <div className="mt-2 text-sm font-bold text-cyan-200">LIFE {me?.quizLives ?? 0}</div>
                  </div>
                  <div className="text-5xl font-black tracking-[0.18em] text-fuchsia-200 md:text-6xl">VS</div>
                  <div className="rounded-[1.5rem] border border-rose-300/25 bg-slate-950/55 p-4">
                    <div className="mb-3 flex justify-center">
                      <AvatarPreview avatar={myBattleOpponents[0]?.avatar} size={88} />
                    </div>
                    <div className="text-3xl font-black text-white">{myBattleOpponents[0]?.name || 'WAIT'}</div>
                    <div className="mt-2 text-sm font-bold text-rose-200">LIFE {myBattleOpponents[0]?.quizLives ?? '-'}</div>
                  </div>
                  {myBattleOpponents.length >= 2 ? (
                    <>
                      <div className="text-5xl font-black tracking-[0.18em] text-amber-200 md:text-6xl">VS</div>
                      <div className="rounded-[1.5rem] border border-amber-300/25 bg-slate-950/55 p-4">
                        <div className="mb-3 flex justify-center">
                          <AvatarPreview avatar={myBattleOpponents[1]?.avatar} size={88} />
                        </div>
                        <div className="text-3xl font-black text-white">{myBattleOpponents[1]?.name || 'WAIT'}</div>
                        <div className="mt-2 text-sm font-bold text-amber-200">LIFE {myBattleOpponents[1]?.quizLives ?? '-'}</div>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="mt-5 text-sm font-bold tracking-[0.2em] text-fuchsia-100/75">
                  {myBattleOpponents.length > 0 ? 'READY FOR THE QUIZ FIGHT' : 'WAITING FOR NEXT ROUND'}
                </div>
              </div>
            ) : quizVariant === 'battle_royale' && roomState?.quizBattlePhase === 'question' ? (
              question ? (
                <div className="rounded-[2rem] border border-fuchsia-400/25 bg-slate-900/70 p-5 md:p-7">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black tracking-[0.3em] text-fuchsia-200">QUESTION BATTLE</div>
                      <div className="mt-1 text-sm text-slate-300">
                        {myBattleOpponents.length > 0
                          ? `${playerName} VS ${myBattleOpponents.map((player: any) => player.name).join(' / ')}`
                          : '待機中'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="rounded-xl border border-cyan-300/25 bg-cyan-500/10 px-3 py-2 text-sm font-bold text-cyan-100">
                        LIFE {me?.quizLives ?? 0}
                      </div>
                      <div className="rounded-xl border border-yellow-300/25 bg-yellow-500/10 px-3 py-2 text-sm font-bold text-yellow-100">
                        残り {timeRemaining ?? roomState?.timeRemaining ?? 0}秒
                      </div>
                    </div>
                  </div>
                  <h2 className="mb-5 text-center text-3xl font-black leading-snug md:text-5xl">{question.text}</h2>
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
                          <button onClick={startSpeechRecognition} disabled={!speechSupported || isListening || battleAnswerSubmitted || myBattleAnswered} className="rounded-xl bg-emerald-600 px-4 py-3 text-base font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600">
                            {isListening ? '聞き取り中...' : (question.speechPrompt.buttonLabel || '話して答える')}
                          </button>
                          {speechTranscript ? <div className="text-sm text-emerald-200">認識結果: {speechTranscript}</div> : null}
                        </div>
                      )}
                    </div>
                  )}
                  {question.speechPrompt?.freeResponse ? (
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center text-base text-emerald-100">
                      この問題は音声回答タイプです。上のボタンから話して答えてください。
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:gap-5">
                      {question.options.map((opt: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedAnswerIndex(i);
                            setBattleAnswerSubmitted(true);
                            socket.emit('submitAnswer', { roomId, answerIndex: i });
                          }}
                          disabled={answerResult !== null || battleAnswerSubmitted || myBattleAnswered}
                          className={`rounded-2xl p-4 text-xl font-bold shadow-lg transition-transform md:p-7 md:text-3xl ${answerResult !== null || battleAnswerSubmitted || myBattleAnswered ? 'cursor-not-allowed' : ''} ${getOptionStateClass(i)}`}
                          style={{ backgroundColor: optionColors[i % 4] }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {battleAnswerSubmitted || myBattleAnswered ? (
                    <div className="mt-5 rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-3 text-center text-base font-bold text-fuchsia-100">
                      回答を送信しました。全員の回答がそろうか、タイムアップになるまで待機します。
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-fuchsia-400/25 bg-slate-900/70 p-8 text-center text-slate-300">
                  問題を準備しています...
                </div>
              )
            ) : quizVariant === 'battle_royale' && roomState?.quizBattlePhase === 'reveal' ? (
              <div className="rounded-2xl bg-slate-900/60 p-4 md:p-6">
                <h2 className="mb-4 text-center text-2xl font-bold md:text-4xl">{myBattleQuestion?.text}</h2>
                {myBattleQuestion?.visual ? <ProblemVisual visual={myBattleQuestion.visual} /> : null}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {(myBattleQuestion?.options || []).map((opt: string, i: number) => {
                    const total = (myBattlePair?.answerCounts || []).reduce((sum: number, count: number) => sum + count, 0);
                    const count = myBattlePair?.answerCounts?.[i] || 0;
                    const ratio = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div
                        key={i}
                        className={`rounded-2xl border-2 p-4 text-center ${i === myBattleQuestion?.correctIndex ? 'border-emerald-300 bg-emerald-500/15' : 'border-slate-700 bg-slate-800/70'}`}
                      >
                        <div className="text-lg font-bold">{opt}</div>
                        <div className="mt-2 text-sm text-slate-300">選択 {count}人 / {ratio}%</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 text-center text-sm text-slate-300">全体の選択割合を集計中</div>
              </div>
            ) : quizVariant === 'battle_royale' && roomState?.quizBattlePhase === 'result' ? (
              <div className="rounded-[2rem] border border-fuchsia-400/35 bg-[radial-gradient(circle_at_top,#4c1d95,#0f172a_62%)] p-6 text-center shadow-[0_0_50px_rgba(168,85,247,0.2)] md:p-8">
                <div className="mb-2 text-sm font-black tracking-[0.35em] text-fuchsia-200">ROUND RESULT</div>
                <div className="mb-5 text-4xl font-black text-white">{myBattlePair?.resultLabel || '勝敗判定中'}</div>
                <div className={`grid items-center gap-4 ${myBattleOpponents.length >= 2 ? 'md:grid-cols-[1fr_auto_1fr_auto_1fr]' : 'md:grid-cols-[1fr_auto_1fr]'}`}>
                  <div className={`rounded-[1.5rem] border p-4 ${myBattlePair?.winnerId === socket.id ? 'border-emerald-300 bg-emerald-500/12' : myBattlePair?.loserIds?.includes(socket.id) ? 'border-rose-300 bg-rose-500/12' : 'border-slate-700 bg-slate-950/50'}`}>
                    <div className="mb-3 flex justify-center">
                      <AvatarPreview avatar={me?.avatar} size={82} expression={getBattleCardExpression(socket.id)} />
                    </div>
                    <div className="text-2xl font-black text-white">{playerName}</div>
                    <div className={`mt-2 text-sm font-black ${myBattlePair?.winnerId === socket.id ? 'text-emerald-200' : myBattlePair?.loserIds?.includes(socket.id) ? 'text-rose-200' : 'text-slate-300'}`}>
                      {myBattlePair?.winnerId === socket.id ? 'WINNER' : myBattlePair?.loserIds?.includes(socket.id) ? 'LOSE' : 'WAIT'}
                    </div>
                  </div>
                  <div className="text-4xl font-black tracking-[0.18em] text-fuchsia-200 md:text-5xl">VS</div>
                  <div className={`rounded-[1.5rem] border p-4 ${myBattlePair?.winnerId === myBattleOpponents[0]?.id ? 'border-emerald-300 bg-emerald-500/12' : myBattlePair?.loserIds?.includes(myBattleOpponents[0]?.id) ? 'border-rose-300 bg-rose-500/12' : 'border-slate-700 bg-slate-950/50'}`}>
                    <div className="mb-3 flex justify-center">
                      <AvatarPreview avatar={myBattleOpponents[0]?.avatar} size={82} expression={getBattleCardExpression(myBattleOpponents[0]?.id)} />
                    </div>
                    <div className="text-2xl font-black text-white">{myBattleOpponents[0]?.name || 'WAIT'}</div>
                    <div className={`mt-2 text-sm font-black ${myBattlePair?.winnerId === myBattleOpponents[0]?.id ? 'text-emerald-200' : myBattlePair?.loserIds?.includes(myBattleOpponents[0]?.id) ? 'text-rose-200' : 'text-slate-300'}`}>
                      {myBattlePair?.winnerId === myBattleOpponents[0]?.id ? 'WINNER' : myBattlePair?.loserIds?.includes(myBattleOpponents[0]?.id) ? 'LOSE' : 'WAIT'}
                    </div>
                  </div>
                  {myBattleOpponents.length >= 2 ? (
                    <>
                      <div className="text-4xl font-black tracking-[0.18em] text-amber-200 md:text-5xl">VS</div>
                      <div className={`rounded-[1.5rem] border p-4 ${myBattlePair?.winnerId === myBattleOpponents[1]?.id ? 'border-emerald-300 bg-emerald-500/12' : myBattlePair?.loserIds?.includes(myBattleOpponents[1]?.id) ? 'border-rose-300 bg-rose-500/12' : 'border-slate-700 bg-slate-950/50'}`}>
                        <div className="mb-3 flex justify-center">
                          <AvatarPreview avatar={myBattleOpponents[1]?.avatar} size={82} expression={getBattleCardExpression(myBattleOpponents[1]?.id)} />
                        </div>
                        <div className="text-2xl font-black text-white">{myBattleOpponents[1]?.name || 'WAIT'}</div>
                        <div className={`mt-2 text-sm font-black ${myBattlePair?.winnerId === myBattleOpponents[1]?.id ? 'text-emerald-200' : myBattlePair?.loserIds?.includes(myBattleOpponents[1]?.id) ? 'text-rose-200' : 'text-slate-300'}`}>
                          {myBattlePair?.winnerId === myBattleOpponents[1]?.id ? 'WINNER' : myBattlePair?.loserIds?.includes(myBattleOpponents[1]?.id) ? 'LOSE' : 'WAIT'}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="mt-5 text-sm font-bold tracking-[0.2em] text-fuchsia-100/75">NEXT MATCH IS COMING...</div>
              </div>
            ) : question ? (
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
                              if (quizVariant === 'battle_royale') {
                                setBattleAnswerSubmitted(true);
                              }
                              socket.emit('submitAnswer', { roomId, answerIndex: i });
                            }}
                            disabled={answerResult !== null || (quizVariant === 'battle_royale' && (battleAnswerSubmitted || myBattleAnswered))}
                            className={`rounded-2xl p-4 text-xl font-bold shadow-lg transition-transform md:p-6 md:text-2xl ${answerResult !== null ? 'cursor-not-allowed' : ''} ${getOptionStateClass(i)}`}
                            style={{ backgroundColor: optionColors[i % 4] }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                    {quizVariant === 'battle_royale' && (battleAnswerSubmitted || myBattleAnswered) ? (
                      <div className="mt-4 rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-3 text-center text-sm font-bold text-fuchsia-100">
                        回答を送信しました。ほかの参加者の回答を待っています。
                      </div>
                    ) : null}
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
          {hostSwitchButton}
          {hostPersistentGameInfo}
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
    if (isDodgeMode) {
      return (
        <div className="h-screen overflow-hidden bg-slate-900 text-white">
          {hostSwitchButton}
          {hostPersistentGameInfo}
          <div className="mx-auto flex h-full max-w-7xl flex-col gap-2 p-2 md:p-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AvatarPreview avatar={me?.avatar} size={38} />
                  <div>
                    <div className="text-lg font-bold md:text-xl">{playerName}</div>
                    <div className="text-xs text-slate-400">
                      バトルドッジ {roomState?.dodgeMode === 'team' ? '（チーム戦）' : '（個人戦）'}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">残り: <span className="font-bold text-yellow-300">{timeRemaining ?? roomState?.timeRemaining ?? 0}</span></div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">ボール: <span className="font-bold text-cyan-300">{me?.dodgeBallStock || 0}</span></div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">撃破: <span className="font-bold text-emerald-300">{me?.kills || 0}</span></div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">被弾: <span className="font-bold text-rose-300">{me?.deaths || 0}</span></div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">正答: <span className="font-bold text-amber-300">{me?.correctAnswers || 0}</span></div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">
                    役割: <span className="font-bold text-violet-300">{me?.dodgeRole === 'outfield' ? '外野' : '内野'}</span>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">スコア: <span className="font-bold text-yellow-300">{calculateGameScore(roomState?.gameType, me || {})}</span></div>
                </div>
              </div>
            </div>
            <div className="grid min-h-0 flex-1 gap-2 grid-rows-[minmax(0,1fr)_minmax(0,40vh)] lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-1">
              <div className="min-h-0 rounded-2xl border border-slate-700 bg-slate-800 p-2">
                <DodgeGame
                  me={me}
                  players={roomState.players}
                  dodgeState={roomState.dodgeState}
                  onSetMove={handleDodgeMove}
                  onSetMoveVector={handleDodgeMoveVector}
                  onThrow={handleDodgeThrow}
                />
              </div>
              <div className="min-h-0 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-3">
                {!me?.alive ? (
                  <div className="mb-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-center">
                    <div className="text-xl font-black text-rose-300">OUT!</div>
                    <div className="mt-1 text-xs text-rose-100">少し待つとコートへ戻ります。</div>
                  </div>
                ) : null}
                {me?.dodgeRole === 'outfield' ? (
                  <div className="mb-3 rounded-2xl border border-violet-400/40 bg-violet-500/10 p-3 text-center">
                    <div className="text-lg font-black text-violet-200">外野プレイ中</div>
                    <div className="mt-1 text-xs text-violet-100">
                      {roomState?.dodgeMode === 'team'
                        ? '正解してから味方の球を受けると投げられます。敵内野に当てると内野復帰！'
                        : 'コート外周を自由に移動できます。相手内野に当てると内野復帰！'}
                    </div>
                    {roomState?.dodgeMode === 'team' ? (
                      <div className="mt-1 text-xs font-bold text-violet-300">
                        {me?.dodgeReadyToAssist ? '投球準備OK' : 'まず問題に正解しよう'}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {question ? (
                  <div className="flex h-full min-h-0 flex-col gap-3">
                    <div className="rounded-2xl bg-slate-900/50 p-3">
                      <div className="mb-2 text-[11px] font-bold text-slate-400">正解するとボールを1個補充</div>
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
                        正解。ボールを1個補充しました。
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
        {hostSwitchButton}
        {hostPersistentGameInfo}
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
