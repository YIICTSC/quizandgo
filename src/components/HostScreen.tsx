import { useEffect, useState, useMemo } from 'react';
import { socket } from '../socket';
import { startBGM, stopBGM } from '../lib/sound';
import { calculateGameScore } from '../lib/scoring';
import { getAllUnits, SubjectUnit } from '../subjects';
import { getSubjectUnitDisplayName } from '../subjects/unit-display-name-map';
import AvatarPreview from './AvatarPreview';

const SUBJECT_LABELS: Record<string, string> = {
  math: '算数・数学',
  social: '社会',
  science: '理科',
  english: '英語',
  kokugo: '国語',
  kanji: '漢字',
  it: 'IT・情報',
  life: '生活',
  map: '地図',
};

const QUIZ_VARIANTS = [
  {
    id: 'classic',
    title: 'クラシック',
    description: '通常のクイズモードです。正答ごとに100点ずつ加算されます。',
  },
  {
    id: 'combo',
    title: 'コンボクイズ',
    description: '連続正解でコンボが伸び、後半ほど高得点になります。不正解でコンボはリセットです。',
  },
  {
    id: 'speed',
    title: '早押しポイント',
    description: '早く答えるほど高得点です。最速回答タイムも記録されます。',
  },
  {
    id: 'team_battle',
    title: 'チームクイズバトル',
    description: 'ランダムチームに分かれて、チーム合計スコアで競います。',
  },
  {
    id: 'boss',
    title: 'ボスクイズ',
    description: '全員でボスHPを削る協力戦です。正解すると大きなダメージを与えます。',
  },
  {
    id: 'battle_royale',
    title: '早押しバトルロイヤル',
    description: '1対1の早押しを繰り返し、最後の1人になるまで戦います。負けるとライフが減ります。',
  },
] as const;

const getGradeLabel = (grade: string) => {
  const n = parseInt(grade.replace('g', ''), 10);
  if (n >= 1 && n <= 6) return `小${n}`;
  if (n >= 7 && n <= 9) return `中${n - 6}`;
  return grade;
};

const getReadableUnitName = (unit: SubjectUnit) => {
  if (unit.displayName) return unit.displayName;
  if (unit.subject === 'kanji') {
    return `${getGradeLabel(unit.grade)}漢字`;
  }
  return getSubjectUnitDisplayName(unit.unit);
};

const isBomberGameType = (gameType?: string) =>
  gameType === 'bomber' || gameType === 'team_bomber' || gameType === 'color_bomber';
const isDodgeGameType = (gameType?: string) => gameType === 'dodge';

const isBattleQuizVariant = (variant?: string) =>
  variant === 'team_battle' || variant === 'boss' || variant === 'battle_royale';

export default function HostScreen({
  roomId,
  onReturnToTitle,
  mode = 'host',
  gameTitle = 'ゴルフゲーム',
  gameType = 'golf',
  onStartSinglePlayer,
}: {
  roomId: string;
  onReturnToTitle: () => void;
  mode?: 'host' | 'single';
  gameTitle?: string;
  gameType?: string;
  onStartSinglePlayer?: (payload: { mode: string; questions?: any[]; timeLimit: number; gameTitle: string; shotsPerQuestion: number }) => void;
}) {
  const [roomState, setRoomState] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<string>('mix');
  const [quizVariant, setQuizVariant] = useState<string>('classic');
  const [quizBattleLives, setQuizBattleLives] = useState<number>(3);
  const [quizBattleQuestionLimit, setQuizBattleQuestionLimit] = useState<number>(10);
  const [inputMinutes, setInputMinutes] = useState<string>('5'); // Default 5 minutes
  const [shotsPerQuestion, setShotsPerQuestion] = useState<number>(3);
  const [teamMode, setTeamMode] = useState(false);
  const [teamCount, setTeamCount] = useState<number>(2);
  const [dodgeMode, setDodgeMode] = useState<'single' | 'team'>('single');
  const [bomberFriendlyFire, setBomberFriendlyFire] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [resultsRevealStep, setResultsRevealStep] = useState<number>(0);
  const [showPinOverlay, setShowPinOverlay] = useState(false);
  const [inviteCopyState, setInviteCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [showQuizVariantModal, setShowQuizVariantModal] = useState(false);
  const [quizVariantDraft, setQuizVariantDraft] = useState<string>('classic');
  const [quizBattleLivesDraft, setQuizBattleLivesDraft] = useState<number>(3);
  const [quizBattleQuestionLimitDraft, setQuizBattleQuestionLimitDraft] = useState<number>(10);
  const [teamCountDraft, setTeamCountDraft] = useState<number>(2);

  const isSinglePlayer = mode === 'single';
  const allUnits = useMemo(() => getAllUnits(), []);
  const subjects = useMemo(() => Array.from(new Set(allUnits.map(u => u.subject))), [allUnits]);

  const orderedSubjects = ['math', 'social', 'science', 'english', 'kokugo', 'kanji', 'it', 'life', 'map'];
  const availableSubjects = useMemo(() => orderedSubjects.filter(s => subjects.includes(s)), [orderedSubjects, subjects]);

  const [selectedSubject, setSelectedSubject] = useState<string>(availableSubjects[0] || 'math');

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [availableSubjects, selectedSubject]);
  
  const grades = useMemo(() => {
    const matched = Array.from(new Set<string>(allUnits.filter(u => u.subject === selectedSubject).map(u => u.grade))).sort();
    // 学年は小学1〜6、 中学1〜3を優先表示
    return matched.filter(g => /^g[1-9]$/.test(g));
  }, [allUnits, selectedSubject]);
  const subjectUsesGrades = grades.length > 0;
  
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const getFirstGradeForSubject = (subject: string) => {
    const matched = Array.from(new Set<string>(allUnits.filter(u => u.subject === subject).map(u => u.grade))).sort();
    return matched.find((g) => /^g[1-9]$/.test(g)) || '';
  };
  
  useEffect(() => {
    if (grades.length > 0) {
      setSelectedGrade(grades[0]);
    } else {
      setSelectedGrade('');
    }
  }, [grades]);

  const units = useMemo(() => {
    const matched = allUnits.filter((u) =>
      u.subject === selectedSubject && (!subjectUsesGrades || u.grade === selectedGrade)
    );
    if (['science', 'social', 'life'].includes(selectedSubject)) {
      const aliasUnits = matched.filter((u) => Boolean(u.displayName));
      if (aliasUnits.length > 0) {
        return aliasUnits;
      }
    }
    return matched;
  }, [allUnits, selectedSubject, selectedGrade, subjectUsesGrades]);

  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  const handleSubjectChange = (subject: string) => {
    const nextGrade = getFirstGradeForSubject(subject);
    setSelectedSubject(subject);
    setSelectedGrade(nextGrade);
    setSelectedUnits([]);
  };

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    setSelectedUnits([]);
  };

  useEffect(() => {
    if (units.length > 0) {
      setSelectedUnits((current) => {
        const available = new Set(units.map((unit) => unit.unit));
        const kept = current.filter((unit) => available.has(unit));
        return kept.length > 0 ? kept : [units[0].unit];
      });
    } else {
      setSelectedUnits([]);
    }
  }, [units]);

  const toggleUnitSelection = (unitKey: string) => {
    setSelectedUnits((current) =>
      current.includes(unitKey)
        ? current.filter((value) => value !== unitKey)
        : [...current, unitKey]
    );
  };

  useEffect(() => {
    if (isSinglePlayer) return;
    const onRoomStateUpdate = (room: any) => {
      setRoomState(room);
    };

    const onTimeUpdate = (time: number) => {
      setTimeRemaining(time);
    };

    socket.on('roomStateUpdate', onRoomStateUpdate);
    socket.on('timeUpdate', onTimeUpdate);

    socket.emit('getRoomState', roomId);

    return () => {
      socket.off('roomStateUpdate', onRoomStateUpdate);
      socket.off('timeUpdate', onTimeUpdate);
    };
  }, [isSinglePlayer, roomId]);

  const currentRoomState = isSinglePlayer ? { state: 'waiting', players: {} } : (roomState ?? { state: 'loading', players: {} });
  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined' || !roomId) return '';
    const url = new URL(import.meta.env.BASE_URL || '/', window.location.origin);
    url.searchParams.set('pin', roomId);
    return url.toString();
  }, [roomId]);
  const players = Object.values(currentRoomState.players);
  const selectedQuestionCount = units
    .filter((u) => selectedUnits.includes(u.unit))
    .reduce((total, unit) => total + unit.questions.length, 0);
  const selectedQuizVariant = QUIZ_VARIANTS.find((variant) => variant.id === quizVariant) || QUIZ_VARIANTS[0];
  const selectedQuizVariantDraft =
    QUIZ_VARIANTS.find((variant) => variant.id === quizVariantDraft) || QUIZ_VARIANTS[0];
  const activeQuizVariant = isSinglePlayer ? quizVariant : currentRoomState?.quizVariant || quizVariant;
  
  // ランキング順にソート（スコアが高い順）
  const resolvedGameType = isSinglePlayer ? gameType : currentRoomState?.gameType || gameType;
  const effectiveTeamMode =
    resolvedGameType === 'team_bomber' ||
    (resolvedGameType === 'color_bomber' ? teamMode : teamMode) ||
    (resolvedGameType === 'dodge' && dodgeMode === 'team');
  const sortedPlayers = [...players].sort((a: any, b: any) => {
    const scoreDiff = calculateGameScore(resolvedGameType, b) - calculateGameScore(resolvedGameType, a);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    if (resolvedGameType === 'quiz') {
      return (b.correctAnswers || 0) - (a.correctAnswers || 0);
    }
    return a.totalStrokes - b.totalStrokes;
  });
  const supportsPodiumReveal = resolvedGameType === 'golf' || isBomberGameType(resolvedGameType) || isDodgeGameType(resolvedGameType);
  const handleCopyInviteUrl = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setInviteCopyState('copied');
    } catch (e) {
      setInviteCopyState('error');
    }
    window.setTimeout(() => setInviteCopyState('idle'), 2200);
  };
  const podiumPlayers = useMemo(() => {
    if (!supportsPodiumReveal) return [];
    return sortedPlayers.slice(0, 3);
  }, [sortedPlayers, supportsPodiumReveal]);
  const teamGroups = useMemo(() => {
    const count = Math.max(2, Number(currentRoomState.teamCount) || teamCount || 2);
    return Array.from({ length: count }, (_, index) => ({
      teamId: index + 1,
      teamName: currentRoomState.teamNames?.[index + 1] || `Team ${index + 1}`,
      members: sortedPlayers.filter((player: any) => player.teamId === index + 1),
    }));
  }, [currentRoomState.teamCount, currentRoomState.teamNames, sortedPlayers, teamCount]);
  const requiresMorePlayersForTeams =
    !isSinglePlayer &&
    (resolvedGameType === 'golf' || resolvedGameType === 'team_bomber' || resolvedGameType === 'color_bomber' || resolvedGameType === 'quiz' || resolvedGameType === 'dodge') &&
    effectiveTeamMode &&
    players.length < teamCount;
  const isTeamAggregateResults = !isSinglePlayer && (
    ((resolvedGameType === 'golf' || resolvedGameType === 'team_bomber' || resolvedGameType === 'color_bomber' || resolvedGameType === 'dodge') && currentRoomState.teamMode)
    || (resolvedGameType === 'quiz' && currentRoomState.quizVariant === 'team_battle' && currentRoomState.teamMode)
  );
  const teamRankings = useMemo(() => {
    if (!isTeamAggregateResults) return [];
    return teamGroups
      .filter(({ members }) => members.length > 0)
      .map(({ teamId, teamName, members }) => {
        const teamStats = members.reduce(
          (acc, player: any) => {
            acc.holesCompleted += player.holesCompleted || 0;
            acc.totalStrokes += player.totalStrokes || 0;
            acc.correctAnswers += player.correctAnswers || 0;
            acc.kills += player.kills || 0;
            acc.blocksDestroyed += player.blocksDestroyed || 0;
            acc.deaths += player.deaths || 0;
            acc.timeAliveMs += player.timeAliveMs || 0;
            acc.territoryCells += player.territoryCells || 0;
            acc.quizPoints += player.quizPoints || 0;
            acc.maxQuizCombo = Math.max(acc.maxQuizCombo, player.maxQuizCombo || 0);
            return acc;
          },
          { holesCompleted: 0, totalStrokes: 0, correctAnswers: 0, kills: 0, blocksDestroyed: 0, deaths: 0, timeAliveMs: 0, territoryCells: 0, quizPoints: 0, maxQuizCombo: 0 }
        );
        return {
          teamId,
          teamName,
          members,
          teamStats,
          teamScore: calculateGameScore(resolvedGameType, teamStats),
        };
      })
      .sort((a, b) => {
        const scoreDiff = b.teamScore - a.teamScore;
        if (scoreDiff !== 0) return scoreDiff;
        return a.teamStats.totalStrokes - b.teamStats.totalStrokes;
      });
  }, [isTeamAggregateResults, resolvedGameType, teamGroups]);
  const podiumTeams = useMemo(() => {
    if (!isTeamAggregateResults) return [];
    return teamRankings.slice(0, 3);
  }, [isTeamAggregateResults, teamRankings]);
  const bgmScene = useMemo(() => {
    if (isBomberGameType(resolvedGameType)) {
      if (currentRoomState.state === 'results') return 'bomber_results';
      if (currentRoomState.state === 'playing') {
        return (timeRemaining ?? currentRoomState.timeRemaining ?? 0) <= 10 ? 'bomber_last10' : 'bomber_play';
      }
      return 'bomber_host';
    }
    if (isDodgeGameType(resolvedGameType)) {
      if (currentRoomState.state === 'results') return 'dodge_results';
      if (currentRoomState.state === 'playing') {
        return (timeRemaining ?? currentRoomState.timeRemaining ?? 0) <= 10 ? 'dodge_last10' : 'dodge_play';
      }
      return 'dodge_host';
    }
    if (resolvedGameType === 'quiz') {
      if (isBattleQuizVariant(activeQuizVariant)) {
        if (currentRoomState.state === 'results') return 'bomber_results';
        if (currentRoomState.state === 'playing') {
          return activeQuizVariant === 'battle_royale' && (timeRemaining ?? currentRoomState.timeRemaining ?? 0) <= 10
            ? 'bomber_last10'
            : 'bomber_play';
        }
        return 'bomber_host';
      }
      if (currentRoomState.state === 'results') return 'results';
      if (currentRoomState.state === 'playing') return 'play';
      return 'host';
    }
    if (currentRoomState.state === 'results') return 'results';
    if (currentRoomState.state === 'playing') return 'play';
    return 'host';
  }, [activeQuizVariant, currentRoomState.state, currentRoomState.timeRemaining, isSinglePlayer, resolvedGameType, timeRemaining]);

  useEffect(() => {
    startBGM(bgmScene);
    return () => stopBGM();
  }, [bgmScene]);

  const openQuizVariantModal = () => {
    setQuizVariantDraft(quizVariant);
    setQuizBattleLivesDraft(quizBattleLives);
    setQuizBattleQuestionLimitDraft(quizBattleQuestionLimit);
    setTeamCountDraft(teamCount);
    setShowQuizVariantModal(true);
  };

  const applyQuizVariantSelection = () => {
    setQuizVariant(quizVariantDraft);
    setQuizBattleLives(quizBattleLivesDraft);
    setQuizBattleQuestionLimit(quizBattleQuestionLimitDraft);
    if (quizVariantDraft === 'team_battle') {
      setTeamCount(teamCountDraft);
    }
    setShowQuizVariantModal(false);
  };

  useEffect(() => {
    if (isSinglePlayer || currentRoomState.state !== 'results' || (!supportsPodiumReveal && !isTeamAggregateResults)) {
      setResultsRevealStep(0);
      return;
    }

    const count = Math.min(3, isTeamAggregateResults ? podiumTeams.length : podiumPlayers.length);
    if (count === 0) {
      setResultsRevealStep(0);
      return;
    }

    setResultsRevealStep(1);
    const timers = Array.from({ length: count - 1 }, (_, index) =>
      window.setTimeout(() => {
        setResultsRevealStep(index + 2);
      }, (index + 1) * 1300)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isSinglePlayer, currentRoomState.state, podiumPlayers.length, podiumTeams.length, isTeamAggregateResults, supportsPodiumReveal]);

  const startGame = () => {
    const timeLimit = (parseInt(inputMinutes) || 5) * 60;
    
    let questions: any[] | undefined = undefined;
    if (selectedMode === 'custom') {
      const chosenUnits = units.filter((unit) => selectedUnits.includes(unit.unit));
      if (chosenUnits.length > 0) {
        questions = chosenUnits.flatMap((unit) => unit.questions);
      }
    }
    
    if (isSinglePlayer) {
      onStartSinglePlayer?.({
        mode: selectedMode,
        questions,
        timeLimit,
        gameTitle,
        shotsPerQuestion,
      });
      return;
    }

    socket.emit('startGame', {
      roomId,
      mode: selectedMode,
      timeLimit,
      questions,
      shotsPerQuestion,
      teamMode: effectiveTeamMode,
      teamCount,
      dodgeMode,
      bomberFriendlyFire,
      quizVariant,
      quizBattleLives,
      quizBattleQuestionLimit,
    });
  };

  const retrySameQuestions = () => {
    startGame();
  };

  const retryWithDifferentQuestions = () => {
    setSelectedUnits([]);
    setTimeRemaining(null);
    socket.emit('returnToLobby', { roomId });
  };

  const handleReturnToTitle = () => {
    if (!isSinglePlayer) {
      socket.emit('closeRoom', { roomId });
    }
    onReturnToTitle();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getRevealRankLabel = (indexFromBottom: number, total: number) => {
    return total - indexFromBottom;
  };

  const renderTeamBoard = (compact = false) => (
    <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
      {teamGroups.map(({ teamId, teamName, members }) => (
        <div key={teamId} className="rounded-2xl border border-slate-600 bg-slate-900/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-lg font-black text-cyan-200">{teamName}</div>
              <div className="text-xs text-slate-400">チーム {teamId}</div>
            </div>
            <div className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-200">
              {members.length}人
            </div>
          </div>
          <div className="space-y-2">
            {members.length > 0 ? members.map((player: any) => (
              <div key={player.id} className="flex items-center gap-3 rounded-xl bg-slate-800/80 px-3 py-2">
                <AvatarPreview avatar={player.avatar} size={34} className="shrink-0" />
                <span className="truncate font-bold text-white">{player.name}</span>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-slate-700 px-3 py-4 text-center text-sm text-slate-500">
                まだメンバーなし
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
  const getTeamName = (teamId: number | null | undefined) =>
    teamId ? currentRoomState.teamNames?.[teamId] || `Team ${teamId}` : null;
  const getTeamMemberNames = (teamId: number | null | undefined) =>
    teamId
      ? sortedPlayers.filter((player: any) => player.teamId === teamId).map((player: any) => player.name)
      : [];

  return (
    <div className="h-[100dvh] overflow-y-auto bg-slate-900 p-3 text-white md:p-4 lg:overflow-hidden">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col lg:h-full">
        <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold md:text-3xl">{isSinglePlayer ? 'Quiz & Go! シングル設定' : 'Quiz & Go! ホスト画面'}</h1>
          {!isSinglePlayer && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => setShowPinOverlay(true)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-left transition-colors hover:bg-slate-700 md:px-6 md:py-3"
              >
                <span className="mr-3 text-sm text-slate-400 md:text-lg">ゲームPIN:</span>
                <span className="text-2xl font-mono font-bold tracking-widest text-green-400 md:text-4xl">{roomId}</span>
              </button>
              <button
                onClick={handleCopyInviteUrl}
                className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-100 transition-colors hover:bg-cyan-500/20 md:px-5 md:py-3"
              >
                招待URLをコピー
              </button>
              {inviteCopyState !== 'idle' ? (
                <div className={`text-xs font-bold ${inviteCopyState === 'copied' ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {inviteCopyState === 'copied' ? 'コピーしました' : 'コピーできませんでした'}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="min-h-0 space-y-4 lg:col-span-2">
            {!isSinglePlayer && !roomState && (
              <div className="flex h-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
                <div className="text-center text-white">
                  <div className="text-xl font-bold">読み込み中...</div>
                </div>
              </div>
            )}

            {currentRoomState.state === 'waiting' && (
              <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-700 bg-slate-800 p-3">
                <h2 className="mb-2 shrink-0 text-base font-bold md:text-lg">ゲーム設定</h2>

                <div className="mb-2 shrink-0 grid grid-cols-1 gap-2 xl:grid-cols-[200px_1fr]">
                  <div className="rounded-xl border border-slate-600 bg-slate-700/40 p-2.5">
                    <div className="mb-1 text-[10px] text-slate-400">選択中のゲーム</div>
                    <div className="text-sm font-bold text-white md:text-base">{gameTitle}</div>
                  </div>

                  <div className="rounded-xl border border-slate-600 bg-slate-700/30 p-2">
                    <p className="mb-1.5 text-[11px] text-slate-300">出題する問題の種類</p>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {[
                        { id: 'add', label: 'たし算' },
                        { id: 'sub', label: 'ひき算' },
                        { id: 'mul', label: 'かけ算' },
                        { id: 'div', label: 'わり算' },
                        { id: 'mix', label: 'すべて' },
                        { id: 'custom', label: '教科・単元' }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => setSelectedMode(mode.id as any)}
                          className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition-colors md:text-[11px] ${
                            selectedMode === mode.id 
                              ? 'bg-blue-500 text-white border-2 border-blue-400' 
                              : 'bg-slate-700 text-slate-300 border-2 border-transparent hover:bg-slate-600'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedMode === 'custom' && (
                  <div className="mb-2 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-600 bg-slate-700/50 p-2.5 flex flex-col">
                    <div className="mb-2 flex flex-wrap items-center gap-1">
                      <h3 className="mr-1 text-sm font-bold text-white md:text-base">単元の選択</h3>
                      {availableSubjects.map(s => (
                        <button
                          key={s}
                          onClick={() => handleSubjectChange(s)}
                          className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold transition-colors md:text-[10px] ${
                            selectedSubject === s
                              ? 'border-blue-400 bg-blue-500 text-white'
                              : 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {SUBJECT_LABELS[s] || s}
                        </button>
                      ))}
                    </div>
                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-2">
                    {/* 学年選択 */}
                    {subjectUsesGrades && (
                    <div className="shrink-0">
                      <div className="mb-1 flex flex-wrap items-center gap-1">
                        <label className="mr-1 text-[11px] font-medium text-slate-300">学年を選ぶ</label>
                        {grades.map(g => {
                          return (
                            <button
                              key={g}
                              onClick={() => handleGradeChange(g)}
                              className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold transition-colors md:text-[10px] ${
                                selectedGrade === g 
                                  ? 'bg-green-500 text-white border-green-400' 
                                  : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                              }`}
                            >
                              {getGradeLabel(g)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    )}

                    {/* 単元選択 */}
                    <div className="min-h-0 flex flex-col">
                      <label className="mb-1 block text-[11px] font-medium text-slate-300">単元を選ぶ（複数選択可）</label>
                      <div key={`${selectedSubject}-${selectedGrade}`} className="grid min-h-0 flex-1 auto-rows-max grid-cols-2 gap-2 overflow-y-auto rounded-lg pr-1 content-start">
                        {units.map(u => (
                          <button
                            key={u.unit}
                            onClick={() => toggleUnitSelection(u.unit)}
                            className={`rounded-lg border px-3 py-2 text-left text-xs font-bold transition-colors ${
                              selectedUnits.includes(u.unit)
                                ? 'bg-purple-500/40 text-white border-purple-400' 
                                : 'bg-slate-700/40 text-slate-200 border-slate-600 hover:bg-slate-700/70'
                            }`}
                          >
                            <div className="line-clamp-2 leading-snug">{getReadableUnitName(u)}</div>
                            <div className="mt-2 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400">{u.questions.length}問</span>
                              {selectedUnits.includes(u.unit) ? <span className="text-white">選択中</span> : null}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedUnits.length > 0 && (
                      <p className="rounded-lg bg-slate-800 p-2 text-[10px] text-slate-200 md:text-[11px]">
                        ✓ 選択中: <span className="font-bold">{selectedUnits.length}単元 / {selectedQuestionCount}問</span>
                        <span className="mt-1 block text-slate-300 line-clamp-2">
                          {units
                            .filter((u) => selectedUnits.includes(u.unit))
                            .map((unit) => getReadableUnitName(unit))
                            .join(' / ')}
                        </span>
                      </p>
                    )}
                    </div>
                  </div>
                )}

                <div className="shrink-0 border-t border-slate-700 pt-2">
                  <p className="mb-2 text-center text-[11px] text-slate-400 md:text-xs">
                    {isSinglePlayer ? '単元を選んでシングルプレイを開始できます。' : (players.length === 0 ? '参加者を待っています...' : `${players.length}人が参加中`)}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {resolvedGameType === 'quiz' ? (
                      <button
                        onClick={openQuizVariantModal}
                        className="flex min-w-[220px] items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-left transition-colors hover:bg-amber-500/15"
                      >
                        <div>
                          <div className="text-[11px] font-bold text-amber-100">遊び方</div>
                          <div className="text-sm font-bold text-white">{selectedQuizVariant.title}</div>
                          <div className="line-clamp-1 text-[10px] text-amber-50/80">{selectedQuizVariant.description}</div>
                        </div>
                        <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-200">
                          変更
                        </span>
                      </button>
                    ) : null}
                    {resolvedGameType === 'quiz' && quizVariant === 'team_battle' && !isSinglePlayer ? (
                      <div className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700/40 px-3 py-2">
                        <span className="text-[11px] font-bold text-slate-300">チーム数</span>
                        <select
                          value={teamCount}
                          onChange={(e) => setTeamCount(Number(e.target.value))}
                          className="rounded-lg border-2 border-slate-600 bg-slate-700 px-2 py-1 text-sm font-bold text-white focus:border-amber-300 focus:outline-none"
                        >
                          {Array.from({ length: 9 }, (_, index) => index + 2).map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                        <span className="text-[11px] font-bold text-slate-300">チーム</span>
                      </div>
                    ) : null}
                    {resolvedGameType === 'quiz' && quizVariant === 'battle_royale' ? (
                      <>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700/40 px-3 py-2">
                          <span className="text-[11px] font-bold text-slate-300">ライフ</span>
                          <select
                            value={quizBattleLives}
                            onChange={(e) => setQuizBattleLives(Number(e.target.value))}
                            className="rounded-lg border-2 border-slate-600 bg-slate-700 px-2 py-1 text-sm font-bold text-white focus:border-amber-300 focus:outline-none"
                          >
                            {[1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700/40 px-3 py-2">
                          <span className="text-[11px] font-bold text-slate-300">1問制限</span>
                          <select
                            value={quizBattleQuestionLimit}
                            onChange={(e) => setQuizBattleQuestionLimit(Number(e.target.value))}
                            className="rounded-lg border-2 border-slate-600 bg-slate-700 px-2 py-1 text-sm font-bold text-white focus:border-amber-300 focus:outline-none"
                          >
                            {Array.from({ length: 11 }, (_, index) => index + 10).map((value) => (
                              <option key={value} value={value}>{value}秒</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : null}
                    {!(resolvedGameType === 'quiz' && quizVariant === 'battle_royale') ? (
                      <div className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700/40 px-3 py-2">
                        <span className="text-[11px] font-bold text-slate-300">制限時間</span>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={inputMinutes}
                          onChange={(e) => setInputMinutes(e.target.value)}
                          className="w-14 rounded-lg border-2 border-slate-600 bg-slate-700 px-2 py-1 text-center text-sm font-bold text-white focus:border-green-400 focus:outline-none"
                        />
                        <span className="text-[11px] font-bold text-slate-300">分</span>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-[11px] font-bold text-amber-100">
                        最後の1人が残るまで続行
                      </div>
                    )}
                    {(resolvedGameType === 'golf' || resolvedGameType === 'team_bomber' || resolvedGameType === 'color_bomber') && (
                      <>
                        {resolvedGameType === 'golf' && (
                          <div className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700/40 px-3 py-2">
                            <span className="text-[11px] font-bold text-slate-300">1問ごとの打数</span>
                            <select
                              value={shotsPerQuestion}
                              onChange={(e) => setShotsPerQuestion(Number(e.target.value))}
                              className="rounded-lg border-2 border-slate-600 bg-slate-700 px-2 py-1 text-sm font-bold text-white focus:border-green-400 focus:outline-none"
                            >
                              {[1, 2, 3, 4, 5].map((value) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              ))}
                            </select>
                            <span className="text-[11px] font-bold text-slate-300">打</span>
                          </div>
                        )}
                        {!isSinglePlayer && resolvedGameType === 'golf' && (
                          <>
                            <button
                              onClick={() => setTeamMode((current) => !current)}
                              className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                                teamMode
                                  ? 'border border-cyan-300 bg-cyan-500 text-slate-950'
                                  : 'border border-slate-600 bg-slate-700/40 text-slate-200 hover:bg-slate-700'
                              }`}
                            >
                              チームモード {teamMode ? 'ON' : 'OFF'}
                            </button>
                            {teamMode && (
                              <div className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700/40 px-3 py-2">
                                <span className="text-[11px] font-bold text-slate-300">チーム数</span>
                                <select
                                  value={teamCount}
                                  onChange={(e) => setTeamCount(Number(e.target.value))}
                                  className="rounded-lg border-2 border-slate-600 bg-slate-700 px-2 py-1 text-sm font-bold text-white focus:border-cyan-400 focus:outline-none"
                                >
                                  {Array.from({ length: 9 }, (_, index) => index + 2).map((value) => (
                                    <option key={value} value={value}>
                                      {value}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-[11px] font-bold text-slate-300">チーム</span>
                              </div>
                            )}
                          </>
                        )}
                        {!isSinglePlayer && resolvedGameType === 'team_bomber' && (
                          <>
                            <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2">
                              <span className="text-[11px] font-bold text-cyan-200">チームボンバー</span>
                              <span className="text-[11px] text-cyan-100">開始時に自動でチーム分けします</span>
                              <select
                                value={teamCount}
                                onChange={(e) => setTeamCount(Number(e.target.value))}
                                className="rounded-lg border-2 border-cyan-500/40 bg-slate-700 px-2 py-1 text-sm font-bold text-white focus:border-cyan-300 focus:outline-none"
                              >
                                {Array.from({ length: 9 }, (_, index) => index + 2).map((value) => (
                                  <option key={value} value={value}>
                                    {value}
                                  </option>
                                ))}
                              </select>
                              <span className="text-[11px] font-bold text-cyan-200">チーム</span>
                            </div>
                            <button
                              onClick={() => setBomberFriendlyFire((current) => !current)}
                              className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                                bomberFriendlyFire
                                  ? 'border border-rose-300 bg-rose-500 text-white'
                                  : 'border border-slate-600 bg-slate-700/40 text-slate-200 hover:bg-slate-700'
                              }`}
                            >
                              チーム誤爆 {bomberFriendlyFire ? 'ON' : 'OFF'}
                            </button>
                          </>
                        )}
                        {!isSinglePlayer && resolvedGameType === 'color_bomber' && (
                          <>
                            <button
                              onClick={() => setTeamMode((current) => !current)}
                              className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                                teamMode
                                  ? 'border border-cyan-300 bg-cyan-500 text-slate-950'
                                  : 'border border-slate-600 bg-slate-700/40 text-slate-200 hover:bg-slate-700'
                              }`}
                            >
                              {teamMode ? 'チーム戦' : '個人戦'}
                            </button>
                            {teamMode && (
                              <div className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700/40 px-3 py-2">
                                <span className="text-[11px] font-bold text-slate-300">チーム数</span>
                                <select
                                  value={teamCount}
                                  onChange={(e) => setTeamCount(Number(e.target.value))}
                                  className="rounded-lg border-2 border-slate-600 bg-slate-700 px-2 py-1 text-sm font-bold text-white focus:border-cyan-400 focus:outline-none"
                                >
                                  {Array.from({ length: 9 }, (_, index) => index + 2).map((value) => (
                                    <option key={value} value={value}>
                                      {value}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-[11px] font-bold text-slate-300">チーム</span>
                              </div>
                            )}
                            {teamMode && (
                              <button
                                onClick={() => setBomberFriendlyFire((current) => !current)}
                                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                                  bomberFriendlyFire
                                    ? 'border border-rose-300 bg-rose-500 text-white'
                                    : 'border border-slate-600 bg-slate-700/40 text-slate-200 hover:bg-slate-700'
                                }`}
                              >
                                チーム誤爆 {bomberFriendlyFire ? 'ON' : 'OFF'}
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                    {!isSinglePlayer && resolvedGameType === 'dodge' && (
                      <div className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700/40 px-3 py-2">
                        <span className="text-[11px] font-bold text-slate-300">モード</span>
                        <button
                          onClick={() => setDodgeMode('single')}
                          className={`rounded-lg px-3 py-1 text-xs font-bold ${dodgeMode === 'single' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-200'}`}
                        >
                          個人戦
                        </button>
                        <button
                          onClick={() => {
                            setDodgeMode('team');
                            setTeamCount(2);
                          }}
                          className={`rounded-lg px-3 py-1 text-xs font-bold ${dodgeMode === 'team' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-200'}`}
                        >
                          チーム戦
                        </button>
                        {dodgeMode === 'team' ? <span className="text-[11px] text-cyan-200">2チーム固定</span> : null}
                      </div>
                    )}
                    <button 
                      onClick={startGame}
                      disabled={(!isSinglePlayer && players.length === 0) || (selectedMode === 'custom' && selectedQuestionCount === 0) || requiresMorePlayersForTeams}
                      className="rounded-xl bg-green-500 px-5 py-2 text-sm font-bold text-white shadow-lg transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-slate-600 md:text-base"
                    >
                      {isSinglePlayer ? 'シングルプレイ開始' : 'ゲーム開始'}
                    </button>
                  </div>
                  {requiresMorePlayersForTeams ? (
                    <p className="mt-2 text-center text-[11px] text-cyan-300">
                      チームモードでは、{teamCount}チーム以上に分けられる参加人数が必要です。
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {!isSinglePlayer && currentRoomState.state === 'teamReveal' && (
              <div className="flex h-full min-h-0 flex-col rounded-2xl border border-cyan-500/30 bg-slate-800 p-4">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-cyan-200">チーム発表</h2>
                    <p className="mt-1 text-sm text-slate-300">
                      ランダムでチーム分けしました。必要ならシャッフルしてから開始できます。
                    </p>
                  </div>
                  <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-200">
                    {currentRoomState.teamCount || teamCount}チーム
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  {renderTeamBoard()}
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-3 border-t border-slate-700 pt-4">
                  <button
                    onClick={() => socket.emit('reshuffleTeams', { roomId })}
                    className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-400"
                  >
                    チームをリシャッフル
                  </button>
                  <button
                    onClick={() => socket.emit('confirmTeamsAndStart', { roomId })}
                    className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-green-400"
                  >
                    このチームで開始
                  </button>
                </div>
              </div>
            )}

            {!isSinglePlayer && currentRoomState.state === 'playing' && (
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 flex flex-col items-center justify-center min-h-[400px]">
                <h2 className="text-3xl font-bold mb-8 text-center text-green-400">{resolvedGameType === 'quiz' ? 'クイズ進行中' : 'ゲーム進行中'}</h2>
                {isBomberGameType(resolvedGameType) && (
                  <p className="mb-6 max-w-xl text-center text-slate-300">
                    {resolvedGameType === 'color_bomber'
                      ? '正解で爆弾を補充し、爆風で床を自分の色に染めながらスコアを伸ばします。途中参加もこのPINから可能です。'
                      : resolvedGameType === 'team_bomber'
                        ? '正解で爆弾を補充し、味方と連携して相手チームを倒します。途中参加もこのPINから可能です。'
                        : '正解で爆弾を補充し、移動と爆風で相手を倒します。途中参加もこのPINから可能です。'}
                  </p>
                )}
                {isDodgeGameType(resolvedGameType) && (
                  <p className="mb-6 max-w-xl text-center text-slate-300">
                    {currentRoomState.dodgeMode === 'team'
                      ? '2チーム固定。内野は自陣のみ移動可能で、当たると外野へ。外野は正解後に味方ボールで投球し、敵内野に当てると復帰できます。'
                      : '正解でボールを補充し、相手へ当てて撃破を重ねるスコアアタックです。'}
                  </p>
                )}
                
                <div className="text-center mb-8">
                  <p className="text-xl text-slate-400 mb-2">残り時間</p>
                  <div className={`text-8xl font-mono font-bold tracking-wider ${
                    timeRemaining !== null && timeRemaining <= 30 ? 'text-red-500 animate-pulse' : 'text-white'
                  }`}>
                    {timeRemaining !== null ? formatTime(timeRemaining) : formatTime(roomState.timeLimit || 300)}
                  </div>
                </div>

                {resolvedGameType === 'quiz' && currentRoomState.quizVariant === 'battle_royale' ? (
                  <div className="mb-8 w-full max-w-4xl rounded-2xl border border-fuchsia-400/30 bg-slate-900/50 p-5 text-left">
                    <div className="mb-2 text-sm font-bold tracking-[0.25em] text-fuchsia-200">
                      {currentRoomState.quizBattlePhase === 'question' ? 'NOW QUESTION' : currentRoomState.quizBattlePhase === 'reveal' ? 'ANSWER STATS' : currentRoomState.quizBattlePhase === 'result' ? 'BATTLE RESULT' : 'MATCH UP'}
                    </div>
                    {(() => {
                      const activeQuestion = (currentRoomState.quizBattlePairs || []).find((pair: any) => pair.question)?.question;
                      if (!activeQuestion) {
                        return <div className="text-sm text-slate-300">再マッチ準備中です。</div>;
                      }
                      if (currentRoomState.quizBattlePhase === 'question') {
                        return (
                          <>
                            <div className="text-xl font-bold text-white">{activeQuestion.text}</div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {(activeQuestion.options || []).map((opt: string, index: number) => (
                                <div
                                  key={index}
                                  className="rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-slate-100"
                                >
                                  <div className="font-bold">{opt}</div>
                                  <div className="mt-1 text-xs text-slate-400">タイムアップ後に全体集計を表示します</div>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      }
                      return (
                        <>
                          <div className="text-xl font-bold text-white">{activeQuestion.text}</div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {(activeQuestion.options || []).map((opt: string, index: number) => {
                              const totalCount = (currentRoomState.quizBattlePairs || []).reduce((sum: number, pair: any) => sum + (pair.answerCounts?.[index] || 0), 0);
                              return (
                                <div
                                  key={index}
                                  className={`rounded-xl px-3 py-2 text-sm ${index === activeQuestion.correctIndex ? 'border border-emerald-300 bg-emerald-500/15 text-emerald-100' : 'border border-slate-700 bg-slate-800/70 text-slate-100'}`}
                                >
                                  <div className="font-bold">{opt}</div>
                                  <div className="mt-1 text-xs text-slate-300">全体選択: {totalCount}人</div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : null}

                {isDodgeGameType(resolvedGameType) ? (
                  <div className="mb-8 w-full max-w-4xl rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 text-left">
                    <div className="mb-2 text-sm font-bold tracking-[0.25em] text-cyan-200">QUIZ DODGE STATUS</div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                        <div className="text-xs text-slate-400">参加人数</div>
                        <div className="mt-1 text-3xl font-black text-white">{players.length}</div>
                      </div>
                      <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                        <div className="text-xs text-slate-400">飛んでいるボール</div>
                        <div className="mt-1 text-3xl font-black text-cyan-200">{currentRoomState.dodgeState?.balls?.length || 0}</div>
                      </div>
                      <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                        <div className="text-xs text-slate-400">復活待ち</div>
                        <div className="mt-1 text-3xl font-black text-rose-200">
                          {players.filter((player: any) => !player.alive).length}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                      ホスト側では全体コートの同期表示を省略しています。右側ランキングと問題進行を見ながら司会進行してください。
                    </div>
                  </div>
                ) : null}

                <p className="text-center text-slate-400 text-lg">
                  このPINで途中参加できます:{' '}
                  <button
                    onClick={() => setShowPinOverlay(true)}
                    className="font-bold text-white underline decoration-dotted underline-offset-4 hover:text-green-300"
                  >
                    {roomId}
                  </button>
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleCopyInviteUrl}
                    className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-100 transition-colors hover:bg-cyan-500/20"
                  >
                    PIN付き招待URLをコピー
                  </button>
                  {inviteCopyState !== 'idle' ? (
                    <span className={`text-sm font-bold ${inviteCopyState === 'copied' ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {inviteCopyState === 'copied' ? '参加用URLをコピーしました' : 'コピーできませんでした'}
                    </span>
                  ) : null}
                </div>
                <button
                  onClick={() => socket.emit('endGameEarly', { roomId })}
                  className="mt-8 rounded-xl border border-rose-300/40 bg-rose-500/15 px-6 py-3 text-base font-bold text-rose-100 transition-colors hover:bg-rose-500/25"
                >
                  早期終了して結果発表へ
                </button>
              </div>
            )}

            {!isSinglePlayer && currentRoomState.state === 'results' && (
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center">
                <h2 className="text-4xl font-bold mb-4 text-yellow-400">ゲーム終了</h2>
                {supportsPodiumReveal && (isTeamAggregateResults ? podiumTeams.length > 0 : podiumPlayers.length > 0) ? (
                  <div className="mb-8">
                    <p className="text-xl text-slate-300 mb-4">{isTeamAggregateResults ? '最終チームランキング発表' : '最終ランキング発表'}</p>
                    <div className="mx-auto mb-4 flex max-w-3xl items-end justify-center gap-3 md:gap-5">
                      {(isTeamAggregateResults ? podiumTeams : podiumPlayers)
                        .slice()
                        .reverse()
                        .map((entry: any, revealIndexFromBottom: number) => {
                          const rank = getRevealRankLabel(revealIndexFromBottom, isTeamAggregateResults ? podiumTeams.length : podiumPlayers.length);
                          const revealed = resultsRevealStep > revealIndexFromBottom;
                          const accent =
                            rank === 1 ? 'border-yellow-400 bg-yellow-500/15 text-yellow-100' :
                            rank === 2 ? 'border-slate-300 bg-slate-400/10 text-slate-100' :
                            'border-amber-500 bg-amber-500/10 text-amber-100';
                          const heightClass =
                            rank === 1 ? 'h-72 md:h-80' :
                            rank === 2 ? 'h-56 md:h-64' :
                            'h-44 md:h-52';

                          return (
                            <div
                              key={isTeamAggregateResults ? `team-${entry.teamId}` : entry.id}
                              className={`flex w-28 flex-col justify-between rounded-2xl border px-3 py-4 text-center transition-all duration-700 md:w-40 ${heightClass} ${
                                revealed
                                  ? `${accent} opacity-100 translate-y-0 scale-100 shadow-[0_0_30px_rgba(250,204,21,0.15)]`
                                  : 'border-slate-700 bg-slate-900/50 opacity-0 translate-y-10 scale-95'
                              }`}
                            >
                              <div>
                                <div className="text-3xl font-black md:text-4xl">{rank}位</div>
                                {!isTeamAggregateResults && (
                                  <div className="mt-2 flex justify-center">
                                    <AvatarPreview avatar={entry.avatar} size={42} />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="text-lg font-bold leading-tight md:text-2xl">{isTeamAggregateResults ? entry.teamName : entry.name}</div>
                                {isTeamAggregateResults ? (
                                  <div className="space-y-1">
                                    <div className="text-[10px] leading-snug opacity-80 md:text-xs">
                                      {entry.members.map((member: any) => member.name).join(' / ')}
                                    </div>
                                  </div>
                                ) : (() => {
                                  const teamName = getTeamName(entry.teamId);
                                  const teamMembers = getTeamMemberNames(entry.teamId);
                                  return teamName ? (
                                    <div className="space-y-1">
                                      <div className="rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] font-bold text-cyan-100 md:text-xs">
                                        {teamName}
                                      </div>
                                      <div className="text-[10px] leading-snug opacity-80 md:text-xs">
                                        {teamMembers.join(' / ')}
                                      </div>
                                    </div>
                                  ) : null;
                                })()}
                                <div className="text-xs opacity-80 md:text-sm">
                                  {rank === 1 ? 'チャンピオン' : rank === 2 ? 'あと一歩' : 'ナイスラン'}
                                </div>
                                <div className="pt-2">
                                  <div className="text-[10px] opacity-70 md:text-xs">最終スコア</div>
                                  <div className="text-2xl font-black md:text-3xl">
                                    {isTeamAggregateResults ? entry.teamScore : calculateGameScore(resolvedGameType, entry)}
                                  </div>
                                  {isTeamAggregateResults ? (
                                    <div className="pt-1 text-[10px] opacity-80 md:text-xs">
                                      {resolvedGameType === 'team_bomber'
                                        ? `合計撃破 ${entry.teamStats.kills} / 合計破壊 ${entry.teamStats.blocksDestroyed}`
                                        : resolvedGameType === 'color_bomber'
                                          ? `合計色面積 ${entry.teamStats.territoryCells} / 合計正答 ${entry.teamStats.correctAnswers}`
                                          : resolvedGameType === 'quiz'
                                            ? `合計スコア ${entry.teamStats.quizPoints || entry.teamScore} / 合計正答 ${entry.teamStats.correctAnswers}`
                                          : `合計打数 ${entry.teamStats.totalStrokes}`}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <p className="text-base text-slate-400">3位から順に発表します。</p>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl text-slate-300 mb-8">結果を確認してください。</p>
                    <div className="text-6xl mb-8">🏆</div>
                    <p className="text-xl text-slate-400 mb-8">右側のランキングで最終結果を確認できます。</p>
                  </>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={retrySameQuestions}
                    disabled={players.length === 0 || (selectedMode === 'custom' && selectedQuestionCount === 0)}
                    className="rounded-xl bg-green-500 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                  >
                    リトライ
                  </button>
                  <button
                    onClick={retryWithDifferentQuestions}
                    className="rounded-xl bg-blue-500 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-blue-400"
                  >
                    問題を変えてリトライ
                  </button>
                  <button
                    onClick={handleReturnToTitle}
                    className="rounded-xl bg-slate-700 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-slate-600"
                  >
                    タイトル画面に戻る
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isSinglePlayer && (
          <div className={`min-h-0 ${currentRoomState.state === 'waiting' ? 'max-h-[38vh] lg:max-h-none' : ''}`}>
            <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-700 bg-slate-800 p-4 md:p-5">
              <h2 className="mb-4 flex shrink-0 items-center justify-between text-xl font-bold">
                <span>
                  {currentRoomState.state === 'playing'
                    ? '現在の順位'
                    : currentRoomState.state === 'teamReveal'
                      ? 'チーム一覧'
                      : isTeamAggregateResults
                        ? '最終チーム順位'
                        : '参加者一覧'}
                </span>
                <span className="bg-slate-700 px-3 py-1 rounded-full text-sm">{players.length}</span>
              </h2>
              
              <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
                {currentRoomState.state === 'playing' && resolvedGameType === 'quiz' && currentRoomState.quizVariant === 'battle_royale' ? (
                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3">
                    <div className="mb-2 text-sm font-bold text-amber-100">現在のVS一覧</div>
                    <div className="space-y-2">
                      {(currentRoomState.quizBattlePairs || []).map((pair: any) => (
                        <div key={pair.id} className="rounded-lg bg-slate-900/50 px-3 py-2 text-xs text-slate-100">
                          {pair.playerIds.length >= 2 ? (
                            <>
                              <div className="font-bold">
                                {pair.playerIds.length === 3
                                  ? `${currentRoomState.players?.[pair.primaryPlayerId]?.name || '?'} VS ${pair.playerIds.filter((id: string) => id !== pair.primaryPlayerId).map((id: string) => currentRoomState.players?.[id]?.name || '?').join(' / ')}`
                                  : `${currentRoomState.players?.[pair.playerIds[0]]?.name || '?'} VS ${currentRoomState.players?.[pair.playerIds[1]]?.name || '?'}`
                                }
                              </div>
                              {(currentRoomState.quizBattlePhase === 'reveal' || currentRoomState.quizBattlePhase === 'result') && pair.resultLabel ? (
                                <div className="mt-1 text-[11px] text-fuchsia-200">{pair.resultLabel}</div>
                              ) : null}
                            </>
                          ) : (
                            <div className="font-bold">{currentRoomState.players?.[pair.playerIds[0]]?.name || '?'} は待機</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {currentRoomState.state === 'teamReveal' && (
                  <div className="space-y-3">
                    {renderTeamBoard(true)}
                  </div>
                )}
                {currentRoomState.state === 'results' && isTeamAggregateResults && teamRankings.map((team: any, index: number) => (
                  <div key={`result-team-${team.teamId}`} className="rounded-xl bg-slate-700 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-6 font-bold text-slate-400">{index + 1}.</span>
                          <span className="font-bold text-base text-cyan-200 md:text-lg">{team.teamName}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-300">
                          {team.members.map((member: any) => member.name).join(' / ')}
                        </div>
                      </div>
                      <div className="flex space-x-4 text-right">
                        {resolvedGameType === 'team_bomber' ? (
                          <>
                            <div>
                              <div className="text-xs text-slate-400">合計撃破</div>
                              <div className="font-mono text-base font-bold text-rose-300 md:text-lg">{team.teamStats.kills}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">合計破壊</div>
                              <div className="font-mono text-base font-bold text-amber-300 md:text-lg">{team.teamStats.blocksDestroyed}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">合計正答</div>
                              <div className="font-mono text-base font-bold text-cyan-300 md:text-lg">{team.teamStats.correctAnswers}</div>
                            </div>
                          </>
                        ) : resolvedGameType === 'color_bomber' ? (
                          <>
                            <div>
                              <div className="text-xs text-slate-400">合計色面積</div>
                              <div className="font-mono text-base font-bold text-fuchsia-300 md:text-lg">{team.teamStats.territoryCells}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">合計撃破</div>
                              <div className="font-mono text-base font-bold text-rose-300 md:text-lg">{team.teamStats.kills}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">合計正答</div>
                              <div className="font-mono text-base font-bold text-cyan-300 md:text-lg">{team.teamStats.correctAnswers}</div>
                            </div>
                          </>
                        ) : resolvedGameType === 'quiz' ? (
                          <>
                            <div>
                              <div className="text-xs text-slate-400">合計スコア</div>
                              <div className="font-mono text-base font-bold text-yellow-300 md:text-lg">{team.teamStats.quizPoints || team.teamScore}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">合計正答</div>
                              <div className="font-mono text-base font-bold text-cyan-300 md:text-lg">{team.teamStats.correctAnswers}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">最大コンボ</div>
                              <div className="font-mono text-base font-bold text-emerald-300 md:text-lg">{team.teamStats.maxQuizCombo || 0}</div>
                            </div>
                          </>
                        ) : resolvedGameType === 'dodge' ? (
                          <>
                            <div>
                              <div className="text-xs text-slate-400">合計撃破</div>
                              <div className="font-mono text-base font-bold text-rose-300 md:text-lg">{team.teamStats.kills}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">合計被弾</div>
                              <div className="font-mono text-base font-bold text-blue-300 md:text-lg">{team.teamStats.deaths}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">合計正答</div>
                              <div className="font-mono text-base font-bold text-cyan-300 md:text-lg">{team.teamStats.correctAnswers}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <div className="text-xs text-slate-400">合計ホール</div>
                              <div className="font-mono text-base font-bold text-green-400 md:text-lg">{team.teamStats.holesCompleted}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">合計打数</div>
                              <div className="font-mono text-base font-bold md:text-lg">{team.teamStats.totalStrokes}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">合計正答</div>
                              <div className="font-mono text-base font-bold text-cyan-300 md:text-lg">{team.teamStats.correctAnswers}</div>
                            </div>
                          </>
                        )}
                        <div>
                          <div className="text-xs text-slate-400">チームスコア</div>
                          <div className="font-mono text-base font-bold text-yellow-300 md:text-lg">{team.teamScore}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {currentRoomState.state !== 'teamReveal' && !(currentRoomState.state === 'results' && isTeamAggregateResults) && sortedPlayers.map((p: any, index: number) => (
                  <div
                    key={p.id}
                    className={`relative overflow-hidden rounded-xl bg-slate-700 p-3 transition-all duration-700 ${
                      currentRoomState.state === 'results' && supportsPodiumReveal
                        ? (() => {
                            const podiumIndex = podiumPlayers.findIndex((player: any) => player.id === p.id);
                            if (podiumIndex === -1) return 'opacity-100';
                            const revealIndex = podiumPlayers.length - podiumIndex - 1;
                            return resultsRevealStep > revealIndex ? 'opacity-100 translate-x-0' : 'opacity-35 translate-x-2';
                          })()
                        : ''
                    }`}
                  >
                    {currentRoomState.state === 'playing' && (
                      <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                        index === 0 ? 'bg-yellow-400' : 
                        index === 1 ? 'bg-slate-300' : 
                        index === 2 ? 'bg-amber-600' : 'bg-transparent'
                      }`}></div>
                    )}
                    <div className="flex items-center justify-between gap-3 pl-2">
                      <div className="min-w-0 flex items-center space-x-3">
                        {currentRoomState.state === 'playing' && (
                          <span className="w-6 font-bold text-slate-400">{index + 1}.</span>
                        )}
                        <AvatarPreview avatar={p.avatar} size={36} className="shrink-0" />
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-bold text-base md:text-lg">{p.name}</span>
                            {(resolvedGameType === 'golf' || resolvedGameType === 'team_bomber' || (resolvedGameType === 'color_bomber' && currentRoomState.teamMode) || (resolvedGameType === 'dodge' && currentRoomState.teamMode)) && p.teamId ? (
                              <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                                {getTeamName(p.teamId)}
                              </span>
                            ) : null}
                          </div>
                          {currentRoomState.state === 'results' && (resolvedGameType === 'golf' || resolvedGameType === 'team_bomber' || (resolvedGameType === 'color_bomber' && currentRoomState.teamMode) || (resolvedGameType === 'dodge' && currentRoomState.teamMode)) && p.teamId ? (
                            <div className="mt-1 truncate text-[11px] text-slate-400">
                              {getTeamMemberNames(p.teamId).join(' / ')}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      {(currentRoomState.state === 'playing' || currentRoomState.state === 'results') && (
                        <div className="flex space-x-4 text-right">
                          {resolvedGameType === 'quiz' ? (
                            <>
                              <div>
                                <div className="text-xs text-slate-400">{currentRoomState.quizVariant === 'battle_royale' ? 'ライフ' : '正答数'}</div>
                                <div className="font-mono text-base font-bold text-cyan-300 md:text-lg">
                                  {currentRoomState.quizVariant === 'battle_royale' ? (p.quizLives ?? 0) : (p.correctAnswers || 0)}
                                </div>
                              </div>
                              {currentRoomState.quizVariant === 'battle_royale' ? (
                                <div>
                                  <div className="text-xs text-slate-400">対戦相手</div>
                                  <div className="font-mono text-base font-bold text-rose-300 md:text-lg">
                                    {(() => {
                                      const pair = (currentRoomState.quizBattlePairs || []).find((entry: any) => entry.id === p.currentBattlePairId);
                                      if (!pair || pair.playerIds.length < 2) return '待機';
                                      const opponentIds = pair.playerIds.filter((id: string) => id !== p.id);
                                      return opponentIds.length > 0
                                        ? opponentIds.map((id: string) => currentRoomState.players?.[id]?.name || '-').join(' / ')
                                        : '待機';
                                    })()}
                                  </div>
                                </div>
                              ) : null}
                            </>
                          ) : isBomberGameType(resolvedGameType) ? (
                            <>
                              <div>
                                <div className="text-xs text-slate-400">撃破</div>
                                <div className="font-mono text-base font-bold text-rose-300 md:text-lg">{p.kills || 0}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400">{resolvedGameType === 'color_bomber' ? '色面積' : '破壊'}</div>
                                <div className="font-mono text-base font-bold text-amber-300 md:text-lg">{resolvedGameType === 'color_bomber' ? (p.territoryCells || 0) : (p.blocksDestroyed || 0)}</div>
                              </div>
                            </>
                          ) : isDodgeGameType(resolvedGameType) ? (
                            <>
                              <div>
                                <div className="text-xs text-slate-400">撃破</div>
                                <div className="font-mono text-base font-bold text-rose-300 md:text-lg">{p.kills || 0}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400">被弾</div>
                                <div className="font-mono text-base font-bold text-blue-300 md:text-lg">{p.deaths || 0}</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <div className="text-xs text-slate-400">クリアホール</div>
                                <div className="font-mono text-base font-bold text-green-400 md:text-lg">{p.holesCompleted}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400">打数</div>
                                <div className="font-mono text-base font-bold md:text-lg">{p.totalStrokes}</div>
                              </div>
                            </>
                          )}
                          <div>
                            <div className="text-xs text-slate-400">{resolvedGameType === 'golf' ? '正答' : isBomberGameType(resolvedGameType) ? (resolvedGameType === 'color_bomber' ? '正答' : '生存') : isDodgeGameType(resolvedGameType) ? '正答' : 'スコア'}</div>
                            <div className={`font-mono text-base font-bold md:text-lg ${resolvedGameType === 'quiz' ? 'text-yellow-300' : isBomberGameType(resolvedGameType) ? 'text-emerald-300' : 'text-cyan-300'}`}>
                              {resolvedGameType === 'quiz'
                                ? calculateGameScore(resolvedGameType, p)
                                : isBomberGameType(resolvedGameType)
                                  ? (resolvedGameType === 'color_bomber' ? (p.correctAnswers || 0) : `${Math.floor((p.timeAliveMs || 0) / 1000)}秒`)
                                  : isDodgeGameType(resolvedGameType)
                                    ? (p.correctAnswers || 0)
                                  : (p.correctAnswers || 0)}
                            </div>
                          </div>
                          {resolvedGameType !== 'quiz' && (
                          <div>
                            <div className="text-xs text-slate-400">{currentRoomState.state === 'results' ? '最終スコア' : 'スコア'}</div>
                            <div className="font-mono text-base font-bold text-yellow-300 md:text-lg">{calculateGameScore(resolvedGameType, p)}</div>
                          </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {players.length === 0 && (
                  <div className="text-center text-slate-500 py-8">
                    まだ参加者はいません
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {resolvedGameType === 'quiz' && showQuizVariantModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[1.75rem] border border-amber-400/20 bg-slate-900 p-5 shadow-2xl md:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-black text-amber-100 md:text-2xl">クイズモードを選ぶ</div>
                <div className="mt-1 text-sm text-slate-300">遊び方を決めてから設定画面へ戻ります。</div>
              </div>
              <button
                onClick={() => setShowQuizVariantModal(false)}
                className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 transition-colors hover:bg-slate-700"
              >
                閉じる
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {QUIZ_VARIANTS.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setQuizVariantDraft(variant.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                    quizVariantDraft === variant.id
                      ? 'border-amber-300 bg-amber-500/20 text-white'
                      : 'border-slate-700 bg-slate-800/70 text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-black">{variant.title}</div>
                    {quizVariantDraft === variant.id ? (
                      <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-200">選択中</span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-xs leading-relaxed text-slate-300">{variant.description}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {quizVariantDraft === 'team_battle' && !isSinglePlayer ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/70 px-4 py-3">
                  <span className="text-sm font-bold text-slate-200">チーム数</span>
                  <select
                    value={teamCountDraft}
                    onChange={(e) => setTeamCountDraft(Number(e.target.value))}
                    className="rounded-lg border-2 border-slate-600 bg-slate-700 px-2 py-1 text-sm font-bold text-white focus:border-amber-300 focus:outline-none"
                  >
                    {Array.from({ length: 9 }, (_, index) => index + 2).map((value) => (
                      <option key={value} value={value}>
                        {value}チーム
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {quizVariantDraft === 'battle_royale' ? (
                <>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/70 px-4 py-3">
                    <span className="text-sm font-bold text-slate-200">ライフ</span>
                    <select
                      value={quizBattleLivesDraft}
                      onChange={(e) => setQuizBattleLivesDraft(Number(e.target.value))}
                      className="rounded-lg border-2 border-slate-600 bg-slate-700 px-2 py-1 text-sm font-bold text-white focus:border-amber-300 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/70 px-4 py-3">
                    <span className="text-sm font-bold text-slate-200">1問の制限時間</span>
                    <select
                      value={quizBattleQuestionLimitDraft}
                      onChange={(e) => setQuizBattleQuestionLimitDraft(Number(e.target.value))}
                      className="rounded-lg border-2 border-slate-600 bg-slate-700 px-2 py-1 text-sm font-bold text-white focus:border-amber-300 focus:outline-none"
                    >
                      {Array.from({ length: 11 }, (_, index) => index + 10).map((value) => (
                        <option key={value} value={value}>
                          {value}秒
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => setShowQuizVariantModal(false)}
                className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-colors hover:bg-slate-700"
              >
                キャンセル
              </button>
              <button
                onClick={applyQuizVariantSelection}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-black text-slate-950 transition-colors hover:bg-amber-400"
              >
                決定して戻る
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!isSinglePlayer && showPinOverlay ? (
        <button
          onClick={() => setShowPinOverlay(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/92 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-5xl rounded-[2rem] border border-green-400/30 bg-slate-900 p-8 text-center shadow-[0_0_60px_rgba(34,197,94,0.18)] md:p-12">
            <div className="text-lg font-bold tracking-[0.35em] text-slate-400 md:text-2xl">GAME PIN</div>
            <div className="mt-6 font-mono text-[4.5rem] font-black tracking-[0.18em] text-green-400 md:text-[9rem]">
              {roomId}
            </div>
            <div className="mt-6 text-base text-slate-300 md:text-2xl">参加者にこのPINを見せてください</div>
            <div className="mt-4 break-all rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100 md:text-lg">
              {inviteUrl}
            </div>
            <div className="mt-4">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleCopyInviteUrl();
                }}
                className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-100 transition-colors hover:bg-cyan-500/20 md:text-base"
              >
                PIN付き招待URLをコピー
              </button>
            </div>
            <div className="mt-4 text-sm text-slate-500 md:text-base">画面をクリックすると閉じます</div>
          </div>
        </button>
      ) : null}
    </div>
  );
}
