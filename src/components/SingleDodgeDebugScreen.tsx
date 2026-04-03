import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DodgeGame from './DodgeGame';
import { AVATAR_STORAGE_KEY, AvatarConfig, createRandomAvatar, normalizeAvatar } from '../avatar';
import { playCorrectSound, playDefeatSound, playIncorrectSound, startBGM, stopBGM } from '../lib/sound';
import { shuffleOptionsWithFirstCorrect } from '../lib/answerMatching';
import {
  DODGE_BALL_LIFETIME_MS,
  DODGE_BALL_RADIUS,
  DODGE_BALL_SPEED,
  DODGE_HEIGHT,
  DODGE_MOVE_SPEED,
  DODGE_PLAYER_RADIUS,
  DODGE_RESPAWN_MS,
  DODGE_THROW_COOLDOWN_MS,
  DODGE_THROW_SPAWN_OFFSET,
  DODGE_WIDTH,
} from '../lib/dodgeConfig';

type DodgeDirection = 'up' | 'down' | 'left' | 'right';
type MoveVector = { x: number; y: number };

type SingleDodgeQuestion = {
  question: string;
  answer: string;
  options: string[];
  hint?: string;
};

type DebugPlayer = {
  id: string;
  name: string;
  x: number;
  y: number;
  alive: boolean;
  color: string;
  avatar: AvatarConfig;
  dodgeBallStock: number;
  kills: number;
  deaths: number;
  correctAnswers: number;
  score: number;
  dodgeFacing: DodgeDirection;
  respawnAt?: number | null;
  nextTurnAt?: number;
};

type DebugBall = {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  expiresAt: number;
};

const BOT_COUNT = 3;
const BOT_COLORS = ['#f97316', '#22c55e', '#a855f7', '#f43f5e', '#06b6d4'];

const shuffle = <T,>(values: T[]) => [...values].sort(() => Math.random() - 0.5);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const generateMathQuestion = (type: string): SingleDodgeQuestion => {
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

const getMoveVector = (direction: DodgeDirection | null) => {
  switch (direction) {
    case 'up':
      return { x: 0, y: -1 };
    case 'down':
      return { x: 0, y: 1 };
    case 'left':
      return { x: -1, y: 0 };
    case 'right':
      return { x: 1, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
};

const vectorToFacing = (vector: MoveVector | null): DodgeDirection | null => {
  if (!vector) return null;
  if (Math.abs(vector.x) < 0.08 && Math.abs(vector.y) < 0.08) return null;
  return Math.abs(vector.x) > Math.abs(vector.y) ? (vector.x >= 0 ? 'right' : 'left') : (vector.y >= 0 ? 'down' : 'up');
};

const spawnPoints = [
  { x: 180, y: 150 },
  { x: 180, y: 390 },
  { x: 780, y: 150 },
  { x: 780, y: 390 },
  { x: 480, y: 270 },
];

const createBot = (index: number, debug: boolean): DebugPlayer => {
  const spawn = spawnPoints[index + 1] || spawnPoints[0];
  const directions: DodgeDirection[] = ['left', 'right', 'up', 'down'];
  return {
    id: `bot-${index + 1}`,
    name: `BOT ${index + 1}`,
    x: spawn.x,
    y: spawn.y,
    alive: true,
    color: BOT_COLORS[index % BOT_COLORS.length],
    avatar: createRandomAvatar(),
    dodgeBallStock: debug ? 999 : 1,
    kills: 0,
    deaths: 0,
    correctAnswers: 0,
    score: 0,
    dodgeFacing: directions[index % directions.length],
    respawnAt: null,
    nextTurnAt: performance.now() + 600 + index * 240,
  };
};

const loadPlayerAvatar = () => {
  const saved = window.localStorage.getItem(AVATAR_STORAGE_KEY);
  const avatar = normalizeAvatar(saved ? JSON.parse(saved) : null);
  window.localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatar));
  return avatar;
};

const createInitialPlayers = (debug: boolean) => {
  const meSpawn = spawnPoints[0];
  const me: DebugPlayer = {
    id: 'me',
    name: 'YOU',
    x: meSpawn.x,
    y: meSpawn.y,
    alive: true,
    color: '#fde047',
    avatar: loadPlayerAvatar(),
    dodgeBallStock: debug ? 999 : 0,
    kills: 0,
    deaths: 0,
    correctAnswers: 0,
    score: 0,
    dodgeFacing: 'right',
    respawnAt: null,
  };
  return [me, ...Array.from({ length: BOT_COUNT }, (_, index) => createBot(index, debug))];
};

export default function SingleDodgeDebugScreen({
  questions,
  mode,
  timeLimit,
  gameTitle,
  onReturnToTitle,
}: {
  questions?: SingleDodgeQuestion[];
  mode?: string;
  timeLimit?: number;
  gameTitle?: string;
  onReturnToTitle: () => void;
}) {
  const debugMode = mode === 'debug_dodge';
  const [players, setPlayers] = useState<DebugPlayer[]>(() => createInitialPlayers(debugMode));
  const [balls, setBalls] = useState<DebugBall[]>([]);
  const [heldDirection, setHeldDirection] = useState<DodgeDirection | null>(null);
  const [heldVector, setHeldVector] = useState<MoveVector | null>(null);
  const [lastAimVector, setLastAimVector] = useState<MoveVector>({ x: 1, y: 0 });
  const [lastThrowAt, setLastThrowAt] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(() => debugMode ? 9999 : (timeLimit || 300));
  const [question, setQuestion] = useState<SingleDodgeQuestion | null>(null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const heldDirectionRef = useRef<DodgeDirection | null>(null);
  const heldVectorRef = useRef<MoveVector | null>(null);
  const lastAimVectorRef = useRef<MoveVector>({ x: 1, y: 0 });
  const lastTickRef = useRef(performance.now());
  const defeatSoundCooldownRef = useRef(0);
  const playersRef = useRef<DebugPlayer[]>(players);

  const pickQuestion = useCallback(() => {
    if (debugMode) return null;
    if (mode !== 'custom') {
      return generateMathQuestion(mode || 'mix');
    }
    if (!questions?.length) return null;
    const source = questions[Math.floor(Math.random() * questions.length)];
    const { correctAnswer, shuffledOptions } = shuffleOptionsWithFirstCorrect(source.options, source.answer);
    return {
      ...source,
      answer: correctAnswer,
      options: shuffledOptions,
    };
  }, [debugMode, mode, questions]);

  const setNextQuestion = useCallback(() => {
    setQuestion(pickQuestion());
    setAnswerResult(null);
    setSelectedAnswerIndex(null);
  }, [pickQuestion]);

  const handleSetHeldDirection = (direction: DodgeDirection | null) => {
    heldDirectionRef.current = direction;
    if (direction) {
      const next = getMoveVector(direction);
      lastAimVectorRef.current = next;
      setLastAimVector(next);
    }
    setHeldDirection(direction);
  };

  const handleSetHeldVector = (vector: MoveVector | null) => {
    heldVectorRef.current = vector;
    if (vector && (Math.abs(vector.x) >= 0.08 || Math.abs(vector.y) >= 0.08)) {
      lastAimVectorRef.current = vector;
      setLastAimVector(vector);
    }
    setHeldVector(vector);
  };

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    startBGM('play');
    if (!debugMode) setNextQuestion();

    const timer = window.setInterval(() => {
      if (debugMode) return;
      setTimeRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
      stopBGM();
    };
  }, [debugMode, setNextQuestion]);

  useEffect(() => {
    if (debugMode || timeRemaining > 0) return;
    stopBGM();
  }, [debugMode, timeRemaining]);

  useEffect(() => {
    let frame = 0;
    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      setElapsedSeconds((current) => current + dt);

      setPlayers((currentPlayers) => {
        const me = currentPlayers.find((player) => player.id === 'me');
        const meDirection = heldDirectionRef.current;
        const meVector = heldVectorRef.current || getMoveVector(meDirection);
        const nextFacing = vectorToFacing(heldVectorRef.current) || meDirection;
        const nextPlayers = currentPlayers.map((player) => {
          if (!player.alive) {
            if (player.respawnAt && now >= player.respawnAt) {
              const spawn = player.id === 'me' ? spawnPoints[0] : spawnPoints[(Number(player.id.split('-')[1]) || 1)] || spawnPoints[1];
              return {
                ...player,
                alive: true,
                x: spawn.x,
                y: spawn.y,
                respawnAt: null,
              };
            }
            return player;
          }

          if (player.id === 'me') {
            const nextX = clamp(player.x + meVector.x * DODGE_MOVE_SPEED * dt, DODGE_PLAYER_RADIUS, DODGE_WIDTH - DODGE_PLAYER_RADIUS);
            const nextY = clamp(player.y + meVector.y * DODGE_MOVE_SPEED * dt, DODGE_PLAYER_RADIUS, DODGE_HEIGHT - DODGE_PLAYER_RADIUS);
            return {
              ...player,
              x: nextX,
              y: nextY,
              dodgeFacing: nextFacing || player.dodgeFacing,
            };
          }

          let direction = player.dodgeFacing;
          if (!player.nextTurnAt || now >= player.nextTurnAt) {
            const options: DodgeDirection[] = ['up', 'down', 'left', 'right'];
            if (me && Math.random() < 0.65) {
              const dx = me.x - player.x;
              const dy = me.y - player.y;
              direction = Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'down' : 'up');
            } else {
              direction = options[Math.floor(Math.random() * options.length)];
            }
          }

          const vector = getMoveVector(direction);
          let nextX = clamp(player.x + vector.x * DODGE_MOVE_SPEED * 0.8 * dt, DODGE_PLAYER_RADIUS, DODGE_WIDTH - DODGE_PLAYER_RADIUS);
          let nextY = clamp(player.y + vector.y * DODGE_MOVE_SPEED * 0.8 * dt, DODGE_PLAYER_RADIUS, DODGE_HEIGHT - DODGE_PLAYER_RADIUS);
          const bounced = nextX === DODGE_PLAYER_RADIUS || nextX === DODGE_WIDTH - DODGE_PLAYER_RADIUS || nextY === DODGE_PLAYER_RADIUS || nextY === DODGE_HEIGHT - DODGE_PLAYER_RADIUS;
          if (bounced) {
            const opposite: Record<DodgeDirection, DodgeDirection> = {
              up: 'down',
              down: 'up',
              left: 'right',
              right: 'left',
            };
            direction = opposite[direction];
            const bounceVector = getMoveVector(direction);
            nextX = clamp(player.x + bounceVector.x * DODGE_MOVE_SPEED * 0.8 * dt, DODGE_PLAYER_RADIUS, DODGE_WIDTH - DODGE_PLAYER_RADIUS);
            nextY = clamp(player.y + bounceVector.y * DODGE_MOVE_SPEED * 0.8 * dt, DODGE_PLAYER_RADIUS, DODGE_HEIGHT - DODGE_PLAYER_RADIUS);
          }

          if (!debugMode && now - lastThrowAt > 450 && player.dodgeBallStock > 0 && Math.random() < 0.02) {
            const throwVector = getMoveVector(direction);
            setBalls((current) => [
              ...current,
              {
                id: `${player.id}-${now}`,
                ownerId: player.id,
                x: player.x + throwVector.x * (DODGE_PLAYER_RADIUS + DODGE_BALL_RADIUS + DODGE_THROW_SPAWN_OFFSET),
                y: player.y + throwVector.y * (DODGE_PLAYER_RADIUS + DODGE_BALL_RADIUS + DODGE_THROW_SPAWN_OFFSET),
                vx: throwVector.x * DODGE_BALL_SPEED,
                vy: throwVector.y * DODGE_BALL_SPEED,
                radius: DODGE_BALL_RADIUS,
                expiresAt: now + DODGE_BALL_LIFETIME_MS,
              },
            ]);
            return {
              ...player,
              dodgeBallStock: Math.max(0, player.dodgeBallStock - 1),
              dodgeFacing: direction,
              nextTurnAt: !player.nextTurnAt || now >= player.nextTurnAt ? now + 700 + Math.random() * 900 : player.nextTurnAt,
            };
          }

          return {
            ...player,
            x: nextX,
            y: nextY,
            dodgeFacing: direction,
            nextTurnAt: !player.nextTurnAt || now >= player.nextTurnAt ? now + 700 + Math.random() * 900 : player.nextTurnAt,
          };
        });
        return nextPlayers;
      });

      setBalls((currentBalls) => {
        const activePlayers = playersRef.current;
        const survivors: DebugBall[] = [];
        const defeatedIds = new Set<string>();
        const scorerIds = new Set<string>();

        for (const ball of currentBalls) {
          const nextBall = {
            ...ball,
            x: ball.x + ball.vx * dt,
            y: ball.y + ball.vy * dt,
          };
          const outOfBounds =
            now >= ball.expiresAt ||
            nextBall.x < -DODGE_BALL_RADIUS ||
            nextBall.x > DODGE_WIDTH + DODGE_BALL_RADIUS ||
            nextBall.y < -DODGE_BALL_RADIUS ||
            nextBall.y > DODGE_HEIGHT + DODGE_BALL_RADIUS;
          if (outOfBounds) continue;

          let hit = false;
          for (const player of activePlayers) {
            if (!player.alive || player.id === nextBall.ownerId) continue;
            const distance = Math.hypot(player.x - nextBall.x, player.y - nextBall.y);
            if (distance <= DODGE_PLAYER_RADIUS + nextBall.radius) {
              defeatedIds.add(player.id);
              scorerIds.add(nextBall.ownerId);
              hit = true;
              break;
            }
          }

          if (!hit) {
            survivors.push(nextBall);
          }
        }

        if (defeatedIds.size > 0) {
          setPlayers((currentPlayers) =>
            currentPlayers.map((player) => {
              if (defeatedIds.has(player.id)) {
                if (player.id === 'me' && now - defeatSoundCooldownRef.current > 200) {
                  playDefeatSound();
                  defeatSoundCooldownRef.current = now;
                }
                return {
                  ...player,
                  alive: false,
                  deaths: player.deaths + 1,
                  respawnAt: now + DODGE_RESPAWN_MS,
                };
              }
              if (scorerIds.has(player.id)) {
                return {
                  ...player,
                  kills: player.kills + 1,
                  score: player.score + 300,
                };
              }
              return player;
            })
          );
        }

        return survivors;
      });

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [debugMode, lastThrowAt]);

  const me = players.find((player) => player.id === 'me');
  const playerMap = useMemo(
    () =>
      Object.fromEntries(
        players.map((player) => [
          player.id,
          {
            ...player,
            name: player.id === 'me' ? 'YOU' : player.name,
          },
        ])
      ),
    [players]
  );

  const throwBall = () => {
    const now = performance.now();
    if (!me || !me.alive || now - lastThrowAt < DODGE_THROW_COOLDOWN_MS) return;
    if (!debugMode && me.dodgeBallStock <= 0) return;
    const vector = heldVectorRef.current || lastAimVectorRef.current || getMoveVector(me.dodgeFacing);
    if (!vector.x && !vector.y) return;
    setLastThrowAt(now);
    if (!debugMode) {
      setPlayers((current) => current.map((player) => player.id === 'me' ? { ...player, dodgeBallStock: Math.max(0, player.dodgeBallStock - 1) } : player));
    }
    setBalls((current) => [
      ...current,
      {
        id: `me-${now}`,
        ownerId: 'me',
        x: me.x + vector.x * (DODGE_PLAYER_RADIUS + DODGE_BALL_RADIUS + DODGE_THROW_SPAWN_OFFSET),
        y: me.y + vector.y * (DODGE_PLAYER_RADIUS + DODGE_BALL_RADIUS + DODGE_THROW_SPAWN_OFFSET),
        vx: vector.x * DODGE_BALL_SPEED,
        vy: vector.y * DODGE_BALL_SPEED,
        radius: DODGE_BALL_RADIUS,
        expiresAt: now + DODGE_BALL_LIFETIME_MS,
      },
    ]);
  };

  const submitAnswer = (index: number) => {
    if (!question || answerResult !== null || !me || timeRemaining <= 0) return;
    setSelectedAnswerIndex(index);
    const isCorrect = question.options[index] === question.answer;
    setAnswerResult(isCorrect);
    if (isCorrect) {
      playCorrectSound();
      setPlayers((current) =>
        current.map((player) =>
          player.id === 'me'
            ? { ...player, correctAnswers: player.correctAnswers + 1, dodgeBallStock: player.dodgeBallStock + 1 }
            : player
        )
      );
    } else {
      playIncorrectSound();
    }

    window.setTimeout(() => {
      setNextQuestion();
    }, 700);
  };

  const resetArena = () => {
    setPlayers(createInitialPlayers(debugMode));
    setBalls([]);
    handleSetHeldDirection(null);
    handleSetHeldVector(null);
    heldDirectionRef.current = null;
    heldVectorRef.current = null;
    setLastThrowAt(0);
    setElapsedSeconds(0);
    if (!debugMode) {
      setTimeRemaining(timeLimit || 300);
      setNextQuestion();
    }
  };

  const answerStatus = answerResult == null
    ? '正解するとボール +1'
    : answerResult
      ? '正解！ボール +1'
      : `不正解… 正解: ${question?.answer ?? '-'}`;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950 text-white">
      <div className="border-b border-slate-800 bg-slate-900/90 px-3 py-2.5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold tracking-[0.25em] text-cyan-300">{debugMode ? 'DEBUG DODGE' : 'SINGLE DODGE'}</div>
            <h1 className="text-lg font-black text-white sm:text-2xl">{gameTitle || (debugMode ? 'バトルドッジ 挙動確認' : 'バトルドッジ 1人用')}</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={resetArena}
              className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 sm:px-4 sm:py-2 sm:text-sm"
            >
              リセット
            </button>
            <button
              onClick={onReturnToTitle}
              className="rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500/25 sm:px-4 sm:py-2 sm:text-sm"
            >
              タイトルへ戻る
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="h-[42dvh] min-h-[240px] max-h-[52dvh] w-full flex-none overflow-hidden rounded-2xl sm:h-auto sm:max-h-none sm:min-h-[420px] sm:flex-[1.15]">
          <DodgeGame
            me={me}
            players={playerMap}
            dodgeState={{ width: DODGE_WIDTH, height: DODGE_HEIGHT, playerRadius: DODGE_PLAYER_RADIUS, balls }}
            onSetMove={handleSetHeldDirection}
            onSetMoveVector={handleSetHeldVector}
            onThrow={throwBall}
          />
        </div>

        <div className="w-full min-h-0 flex-1 overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4">
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-slate-300 sm:text-sm">
            <div className="rounded-xl bg-slate-800/80 px-3 py-2">残り時間: <span className="font-bold text-cyan-300">{debugMode ? Math.floor(elapsedSeconds) : timeRemaining}s</span></div>
            <div className="rounded-xl bg-slate-800/80 px-3 py-2">ボール: <span className="font-bold text-cyan-300">{debugMode ? '∞' : (me?.dodgeBallStock ?? 0)}</span></div>
            <div className="rounded-xl bg-slate-800/80 px-3 py-2">撃破: {me?.kills ?? 0}</div>
            <div className="rounded-xl bg-slate-800/80 px-3 py-2">被弾: {me?.deaths ?? 0}</div>
          </div>

          {debugMode ? (
            <div className="mb-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 sm:mb-4 sm:p-4">
              <div className="text-xs font-bold tracking-[0.22em] text-amber-200">CHECK POINT</div>
              <div className="mt-2 text-sm text-slate-100">移動、向き、投球、被弾、復活の挙動をローカルで確認できます。</div>
              <div className="mt-3 text-xs text-slate-300">投球ベクトル: x {lastAimVector.x.toFixed(2)} / y {lastAimVector.y.toFixed(2)}</div>
            </div>
          ) : (
            <div className="mb-3 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 sm:mb-4 sm:p-4">
              <div className="text-xs font-bold tracking-[0.22em] text-cyan-200">問題に答えて投球</div>
              <div className="mt-2 text-sm text-slate-100">{answerStatus}</div>
              {question ? (
                <>
                  <div className="mt-3 text-base font-bold text-white">{question.question}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {question.options.map((option, index) => {
                      const isCorrect = option === question.answer;
                      const isSelected = selectedAnswerIndex === index;
                      const highlight = answerResult == null
                        ? 'border-slate-600 bg-slate-800/70 hover:bg-slate-700'
                        : isCorrect
                          ? 'border-emerald-400 bg-emerald-500/25'
                          : isSelected
                            ? 'border-rose-400 bg-rose-500/25'
                            : 'border-slate-700 bg-slate-800/40 opacity-60';
                      return (
                        <button
                          key={`${option}-${index}`}
                          onClick={() => submitAnswer(index)}
                          disabled={answerResult !== null || timeRemaining <= 0}
                          className={`rounded-xl border px-3 py-2 text-left text-sm font-bold text-white transition ${highlight}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="mt-3 text-sm text-slate-300">問題を準備中...</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
