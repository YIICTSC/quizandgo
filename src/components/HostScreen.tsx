import { useEffect, useState, useMemo } from 'react';
import { socket } from '../socket';
import { startBGM, stopBGM } from '../lib/sound';
import { calculateGameScore } from '../lib/scoring';
import { getAllUnits, SubjectUnit } from '../subjects';
import { getSubjectUnitDisplayName } from '../subjects/unit-display-name-map';

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
  onStartSinglePlayer?: (payload: { mode: string; questions?: any[]; timeLimit: number; gameTitle: string }) => void;
}) {
  const [roomState, setRoomState] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<string>('mix');
  const [inputMinutes, setInputMinutes] = useState<string>('5'); // Default 5 minutes
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

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

  useEffect(() => {
    startBGM('host');
    return () => stopBGM();
  }, []);

  if (!isSinglePlayer && !roomState) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">読み込み中...</div>;
  }

  const currentRoomState = isSinglePlayer ? { state: 'waiting', players: {} } : roomState;
  const players = Object.values(currentRoomState.players);
  const selectedQuestionCount = units
    .filter((u) => selectedUnits.includes(u.unit))
    .reduce((total, unit) => total + unit.questions.length, 0);
  
  // ランキング順にソート（スコアが高い順）
  const resolvedGameType = isSinglePlayer ? gameType : currentRoomState?.gameType || gameType;
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
      });
      return;
    }

    socket.emit('startGame', { roomId, mode: selectedMode, timeLimit, questions });
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

  return (
    <div className="h-screen overflow-hidden bg-slate-900 text-white p-3 md:p-4">
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold md:text-3xl">{isSinglePlayer ? 'Quiz & Go! シングル設定' : 'Quiz & Go! ホスト画面'}</h1>
          {!isSinglePlayer && (
            <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 md:px-6 md:py-3">
              <span className="mr-3 text-sm text-slate-400 md:text-lg">ゲームPIN:</span>
              <span className="text-2xl font-mono font-bold tracking-widest text-green-400 md:text-4xl">{roomId}</span>
            </div>
          )}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="min-h-0 space-y-4 lg:col-span-2">
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
                  <div className="mb-2 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-600 bg-slate-700/50 p-2.5">
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
                    <div className="grid h-full min-h-0 grid-cols-1 gap-2">
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
                    <div className="min-h-0">
                      <label className="mb-1 block text-[11px] font-medium text-slate-300">単元を選ぶ（複数選択可）</label>
                      <div key={`${selectedSubject}-${selectedGrade}`} className="grid max-h-[52vh] grid-cols-2 gap-2 overflow-y-auto rounded-lg pr-1 xl:max-h-[58vh]">
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
                    <button 
                      onClick={startGame}
                      disabled={(!isSinglePlayer && players.length === 0) || (selectedMode === 'custom' && selectedQuestionCount === 0)}
                      className="rounded-xl bg-green-500 px-5 py-2 text-sm font-bold text-white shadow-lg transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-slate-600 md:text-base"
                    >
                      {isSinglePlayer ? 'シングルプレイ開始' : 'ゲーム開始'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isSinglePlayer && currentRoomState.state === 'playing' && (
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 flex flex-col items-center justify-center min-h-[400px]">
                <h2 className="text-3xl font-bold mb-8 text-center text-green-400">{resolvedGameType === 'quiz' ? 'クイズ進行中' : 'ゲーム進行中'}</h2>
                
                <div className="text-center mb-8">
                  <p className="text-xl text-slate-400 mb-2">残り時間</p>
                  <div className={`text-8xl font-mono font-bold tracking-wider ${
                    timeRemaining !== null && timeRemaining <= 30 ? 'text-red-500 animate-pulse' : 'text-white'
                  }`}>
                    {timeRemaining !== null ? formatTime(timeRemaining) : formatTime(roomState.timeLimit || 300)}
                  </div>
                </div>

                <p className="text-center text-slate-400 text-lg">
                  このPINで途中参加できます: <span className="font-bold text-white">{roomId}</span>
                </p>
              </div>
            )}

            {!isSinglePlayer && currentRoomState.state === 'results' && (
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center">
                <h2 className="text-4xl font-bold mb-6 text-yellow-400">ゲーム終了</h2>
                <p className="text-2xl text-slate-300 mb-8">結果を確認してください。</p>
                <div className="text-6xl mb-8">🏆</div>
                <p className="text-xl text-slate-400 mb-8">右側のランキングで最終結果を確認できます。</p>
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
          <div className="min-h-0">
            <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-700 bg-slate-800 p-4 md:p-5">
              <h2 className="mb-4 flex shrink-0 items-center justify-between text-xl font-bold">
                <span>{currentRoomState.state === 'playing' ? '現在の順位' : '参加者一覧'}</span>
                <span className="bg-slate-700 px-3 py-1 rounded-full text-sm">{players.length}</span>
              </h2>
              
              <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
                {sortedPlayers.map((p: any, index: number) => (
                  <div key={p.id} className="relative overflow-hidden rounded-xl bg-slate-700 p-3">
                    {currentRoomState.state === 'playing' && (
                      <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                        index === 0 ? 'bg-yellow-400' : 
                        index === 1 ? 'bg-slate-300' : 
                        index === 2 ? 'bg-amber-600' : 'bg-transparent'
                      }`}></div>
                    )}
                    <div className="flex items-center justify-between gap-3 pl-2">
                      <div className="flex items-center space-x-3">
                        {currentRoomState.state === 'playing' && (
                          <span className="w-6 font-bold text-slate-400">{index + 1}.</span>
                        )}
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color || 'white' }}></div>
                        <span className="font-bold text-base md:text-lg">{p.name}</span>
                      </div>
                      {(currentRoomState.state === 'playing' || currentRoomState.state === 'results') && (
                        <div className="flex space-x-4 text-right">
                          {resolvedGameType === 'quiz' ? (
                            <div>
                              <div className="text-xs text-slate-400">正答数</div>
                              <div className="font-mono text-base font-bold text-cyan-300 md:text-lg">{p.correctAnswers || 0}</div>
                            </div>
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
                            <div className="text-xs text-slate-400">{resolvedGameType === 'quiz' ? 'スコア' : '正答'}</div>
                            <div className={`font-mono text-base font-bold md:text-lg ${resolvedGameType === 'quiz' ? 'text-yellow-300' : 'text-cyan-300'}`}>
                              {resolvedGameType === 'quiz' ? calculateGameScore(resolvedGameType, p) : (p.correctAnswers || 0)}
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
    </div>
  );
}
