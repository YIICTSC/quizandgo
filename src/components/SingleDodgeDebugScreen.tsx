import { useEffect, useMemo, useRef, useState } from 'react';
import DodgeGame from './DodgeGame';
import { AVATAR_STORAGE_KEY, AvatarConfig, createRandomAvatar, normalizeAvatar } from '../avatar';
import { playDefeatSound, startBGM, stopBGM } from '../lib/sound';

type DodgeDirection = 'up' | 'down' | 'left' | 'right';
type MoveVector = { x: number; y: number };

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

const DODGE_WIDTH = 960;
const DODGE_HEIGHT = 540;
const DODGE_PLAYER_RADIUS = 22;
const DODGE_BALL_RADIUS = 11;
const DODGE_MOVE_SPEED = 340;
const DODGE_BALL_SPEED = 560;
const DODGE_BALL_LIFETIME_MS = 1700;
const DODGE_THROW_COOLDOWN_MS = 360;
const DODGE_RESPAWN_MS = 2200;
const BOT_COUNT = 3;
const BOT_COLORS = ['#f97316', '#22c55e', '#a855f7', '#f43f5e', '#06b6d4'];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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

const createBot = (index: number): DebugPlayer => {
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
    dodgeBallStock: 999,
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
  try {
    const saved = window.localStorage.getItem(AVATAR_STORAGE_KEY);
    const avatar = normalizeAvatar(saved ? JSON.parse(saved) : null);
    window.localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatar));
    return avatar;
  } catch {
    return createRandomAvatar();
  }
};

const createInitialPlayers = () => {
  const meSpawn = spawnPoints[0];
  const me: DebugPlayer = {
    id: 'me',
    name: 'YOU',
    x: meSpawn.x,
    y: meSpawn.y,
    alive: true,
    color: '#fde047',
    avatar: loadPlayerAvatar(),
    dodgeBallStock: 999,
    kills: 0,
    deaths: 0,
    correctAnswers: 0,
    score: 0,
    dodgeFacing: 'right',
    respawnAt: null,
  };
  return [me, ...Array.from({ length: BOT_COUNT }, (_, index) => createBot(index))];
};

export default function SingleDodgeDebugScreen({
  onReturnToTitle,
}: {
  onReturnToTitle: () => void;
}) {
  const [players, setPlayers] = useState<DebugPlayer[]>(() => createInitialPlayers());
  const [balls, setBalls] = useState<DebugBall[]>([]);
  const [heldDirection, setHeldDirection] = useState<DodgeDirection | null>(null);
  const [heldVector, setHeldVector] = useState<MoveVector | null>(null);
  const [lastThrowAt, setLastThrowAt] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const heldDirectionRef = useRef<DodgeDirection | null>(null);
  const heldVectorRef = useRef<MoveVector | null>(null);
  const lastTickRef = useRef(performance.now());
  const defeatSoundCooldownRef = useRef(0);
  const playersRef = useRef<DebugPlayer[]>(players);

  const handleSetHeldDirection = (direction: DodgeDirection | null) => {
    heldDirectionRef.current = direction;
    setHeldDirection(direction);
  };

  const handleSetHeldVector = (vector: MoveVector | null) => {
    heldVectorRef.current = vector;
    setHeldVector(vector);
  };

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    startBGM('play');
    return () => stopBGM();
  }, []);

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
  }, []);

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
    const vector = heldVectorRef.current || getMoveVector(me.dodgeFacing);
    if (!vector.x && !vector.y) return;
    setLastThrowAt(now);
    setBalls((current) => [
      ...current,
      {
        id: `me-${now}`,
        ownerId: 'me',
        x: me.x + vector.x * (DODGE_PLAYER_RADIUS + DODGE_BALL_RADIUS + 4),
        y: me.y + vector.y * (DODGE_PLAYER_RADIUS + DODGE_BALL_RADIUS + 4),
        vx: vector.x * DODGE_BALL_SPEED,
        vy: vector.y * DODGE_BALL_SPEED,
        radius: DODGE_BALL_RADIUS,
        expiresAt: now + DODGE_BALL_LIFETIME_MS,
      },
    ]);
  };

  const resetArena = () => {
    setPlayers(createInitialPlayers());
    setBalls([]);
    handleSetHeldDirection(null);
    handleSetHeldVector(null);
    heldDirectionRef.current = null;
    heldVectorRef.current = null;
    setLastThrowAt(0);
    setElapsedSeconds(0);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950 text-white">
      <div className="border-b border-slate-800 bg-slate-900/90 px-3 py-2.5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold tracking-[0.25em] text-cyan-300">DEBUG DODGE</div>
            <h1 className="text-lg font-black text-white sm:text-2xl">バトルドッジ 挙動確認</h1>
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
          <div className="mb-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 sm:mb-4 sm:p-4">
            <div className="text-xs font-bold tracking-[0.22em] text-amber-200">CHECK POINT</div>
            <div className="mt-2 text-sm text-slate-100">
              移動、向き、投球、被弾、復活の挙動をローカルで確認できます。
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="rounded-xl bg-slate-800/80 px-3 py-2">移動方向: {me?.dodgeFacing ?? '-'}</div>
              <div className="rounded-xl bg-slate-800/80 px-3 py-2">飛行中ボール: {balls.length}</div>
              <div className="rounded-xl bg-slate-800/80 px-3 py-2">撃破: {me?.kills ?? 0}</div>
              <div className="rounded-xl bg-slate-800/80 px-3 py-2">被弾: {me?.deaths ?? 0}</div>
            </div>
          </div>

          <div className="mb-3 rounded-2xl border border-slate-700 bg-slate-800/70 p-3 sm:mb-4 sm:p-4">
            <div className="text-sm font-bold text-white">操作</div>
            <div className="mt-2 space-y-1 text-sm text-slate-300">
              <div>・盤面のどこでもタッチするとジョイスティックが表示され、360°移動できます</div>
              <div>・十字キー / WASD でも移動できます</div>
              <div>・右下の `THROW` か Space / Enter で投球</div>
              <div>・最後に動いた向きへボールが飛びます</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-bold text-white">ローカル参加者</div>
              <div className="text-xs text-slate-400">{Math.floor(elapsedSeconds)} sec</div>
            </div>
            <div className="space-y-2">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: player.color }} />
                    <div>
                      <div className="text-sm font-bold text-white">{player.id === 'me' ? 'YOU' : player.name}</div>
                      <div className="text-xs text-slate-400">{player.alive ? '出場中' : '復活待ち'}</div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-300">
                    <div>K {player.kills}</div>
                    <div>D {player.deaths}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
