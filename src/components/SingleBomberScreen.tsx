import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BomberGame from './BomberGame';
import ProblemVisual from './ProblemVisual';
import { calculateGameScore } from '../lib/scoring';
import { findMatchingOptionIndex, matchesSpeechAnswer, shuffleOptionsWithFirstCorrect } from '../lib/answerMatching';
import { playCorrectSound, playDefeatSound, playExplosionSound, playIncorrectSound, startBGM, stopBGM } from '../lib/sound';
import { getBomberDimensions } from '../lib/bomberDimensions';
import { AVATAR_STORAGE_KEY, AvatarConfig, createRandomAvatar, normalizeAvatar } from '../avatar';
import { BOMBER_ITEM_META, BomberItemId } from '../lib/bomberItems';
import { withBaseUrl } from '../lib/assetPath';

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

type SingleBomberQuestion = {
  question?: string;
  text?: string;
  answer: string;
  options: string[];
  hint?: string;
  visual?: any;
  audioPrompt?: any;
  speechPrompt?: any;
};

type BomberCell = 'solid' | 'breakable' | 'floor';
type Enemy = { id: string; name: string; color: string; x: number; y: number; alive: boolean; avatar: AvatarConfig };
type Bomb = {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  explodeAt: number;
  range: number;
  remote: boolean;
  pierce: boolean;
  movingDx?: number;
  movingDy?: number;
};
type Explosion = { id: string; ownerId: string; cells: { x: number; y: number }[]; expiresAt: number };
type ItemDrop = { id: string; itemId: BomberItemId; x: number; y: number };

const BASE_WIDTH = 21;
const BASE_HEIGHT = 15;
const BOMB_DELAY_MS = 2000;
const EXPLOSION_MS = 500;
const RESPAWN_MS = 2200;
const ITEM_DROP_RATE = 0.22;
const MAX_FIRE_LEVEL = 4;
const ITEM_POOL: BomberItemId[] = ['fire_up', 'kick_bomb', 'shield', 'remote_bomb', 'pierce_fire', 'speed_up'];
const getEnemyMoveTickInterval = (floor: number) => Math.max(2, 7 - Math.floor((floor - 1) / 2));
const MAX_SPEED_LEVEL = 3;

const shuffle = <T,>(values: T[]) => [...values].sort(() => Math.random() - 0.5);
const toOddSize = (value: number) => {
  const rounded = Math.max(5, Math.ceil(value));
  return rounded % 2 === 1 ? rounded : rounded + 1;
};

const getDimensionsForFloor = (floor: number) => ({
  width: Math.max(BASE_WIDTH, toOddSize(BASE_WIDTH + Math.floor((floor - 1) / 2) * 2)),
  height: Math.max(BASE_HEIGHT, toOddSize(BASE_HEIGHT + Math.floor((floor - 1) / 3) * 2)),
});

const createGrid = (width: number, height: number) =>
  Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      if (isBorder) return 'solid' as BomberCell;
      if (x % 2 === 0 && y % 2 === 0) return 'solid' as BomberCell;
      return Math.random() < 0.42 ? 'breakable' : 'floor';
    })
  );

const clearSpawnArea = (grid: BomberCell[][], x: number, y: number) => {
  [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
    const nx = x + dx;
    const ny = y + dy;
    if (grid[ny]?.[nx] && grid[ny][nx] !== 'solid') {
      grid[ny][nx] = 'floor';
    }
  });
};

const randomFloorPosition = (grid: BomberCell[][], used: Set<string>) => {
  const candidates: { x: number; y: number }[] = [];
  for (let y = 1; y < grid.length - 1; y += 1) {
    for (let x = 1; x < grid[y].length - 1; x += 1) {
      if (grid[y][x] === 'floor' && !used.has(`${x},${y}`)) candidates.push({ x, y });
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)] || { x: 1, y: 1 };
};

const isBlocked = (grid: BomberCell[][], bombs: Bomb[], x: number, y: number) => {
  if (!grid[y]?.[x]) return true;
  if (grid[y][x] !== 'floor') return true;
  return bombs.some((bomb) => bomb.x === x && bomb.y === y);
};

const advanceMovingBombs = (grid: BomberCell[][], bombs: Bomb[]) =>
  bombs.map((bomb, index) => {
    if (!bomb.movingDx && !bomb.movingDy) return bomb;
    const nextX = bomb.x + (bomb.movingDx || 0);
    const nextY = bomb.y + (bomb.movingDy || 0);
    const blocked =
      !grid[nextY]?.[nextX] ||
      grid[nextY][nextX] !== 'floor' ||
      bombs.some((otherBomb, otherIndex) => otherIndex !== index && otherBomb.x === nextX && otherBomb.y === nextY);
    if (blocked) {
      return { ...bomb, movingDx: 0, movingDy: 0 };
    }
    return { ...bomb, x: nextX, y: nextY };
  });

const buildExplosionCells = (grid: BomberCell[][], originX: number, originY: number, range: number, pierce = false) => {
  const cells = [{ x: originX, y: originY }];
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dy] of directions) {
    for (let step = 1; step <= range; step += 1) {
      const x = originX + dx * step;
      const y = originY + dy * step;
      const cell = grid[y]?.[x];
      if (!cell || cell === 'solid') break;
      cells.push({ x, y });
      if (cell === 'breakable' && !pierce) break;
    }
  }
  return cells;
};

const randomItem = (): BomberItemId => ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];

const generateMathQuestion = (type: string): SingleBomberQuestion => {
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
    if (offset !== 0 && answer + offset >= 0) options.add(answer + offset);
  }

  return {
    question: text,
    answer: String(answer),
    options: shuffle(Array.from(options).map(String)),
  };
};

export default function SingleBomberScreen({
  questions,
  mode,
  timeLimit,
  gameTitle,
  debugPlayerCount,
  onReturnToTitle,
}: {
  questions?: SingleBomberQuestion[];
  mode: string;
  timeLimit: number;
  gameTitle: string;
  debugPlayerCount?: number;
  onReturnToTitle: () => void;
}) {
  if (mode === 'debug_multiplayer_map' && debugPlayerCount) {
    return <BomberMapDebugScreen gameTitle={gameTitle} playerCount={debugPlayerCount} onReturnToTitle={onReturnToTitle} />;
  }

  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [singleAvatar] = useState<AvatarConfig>(() => {
    try {
      const saved = window.localStorage.getItem(AVATAR_STORAGE_KEY);
      const avatar = normalizeAvatar(saved ? JSON.parse(saved) : null);
      window.localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatar));
      return avatar;
    } catch (e) {
      return createRandomAvatar();
    }
  });
  const [floor, setFloor] = useState(1);
  const [grid, setGrid] = useState<BomberCell[][]>([]);
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [itemDrops, setItemDrops] = useState<ItemDrop[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1, spawnX: 1, spawnY: 1, alive: true, respawnAt: null as number | null });
  const [bombsAvailable, setBombsAvailable] = useState(1);
  const [fireLevel, setFireLevel] = useState(0);
  const [bombRange, setBombRange] = useState(2);
  const [hasKickBomb, setHasKickBomb] = useState(false);
  const [hasShield, setHasShield] = useState(false);
  const [hasRemoteBomb, setHasRemoteBomb] = useState(false);
  const [hasPierceFire, setHasPierceFire] = useState(false);
  const [moveSpeedLevel, setMoveSpeedLevel] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [kills, setKills] = useState(0);
  const [blocksDestroyed, setBlocksDestroyed] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [timeAliveMs, setTimeAliveMs] = useState(0);
  const [question, setQuestion] = useState<SingleBomberQuestion | null>(null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
  const [correctAnswerText, setCorrectAnswerText] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const bomberItems = [
    ...(fireLevel > 0 ? [{ itemId: 'fire_up' as const, count: fireLevel }] : []),
    ...(moveSpeedLevel > 0 ? [{ itemId: 'speed_up' as const, count: moveSpeedLevel }] : []),
    ...(hasKickBomb ? [{ itemId: 'kick_bomb' as const }] : []),
    ...(hasShield ? [{ itemId: 'shield' as const }] : []),
    ...(hasRemoteBomb ? [{ itemId: 'remote_bomb' as const }] : []),
    ...(hasPierceFire ? [{ itemId: 'pierce_fire' as const }] : []),
  ];
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const enemyTickRef = useRef(0);
  const prevExplosionCountRef = useRef(0);
  const prevAliveRef = useRef<boolean | null>(null);
  const optionColors = ['#e3342f', '#3490dc', '#f6993f', '#38c172'];

  const pickQuestion = useCallback(() => {
    if (mode !== 'custom') return generateMathQuestion(mode);
    if (!questions?.length) return null;
    const source = questions[Math.floor(Math.random() * questions.length)];
    const { correctAnswer, shuffledOptions } = shuffleOptionsWithFirstCorrect(source.options, source.answer);
    return { ...source, answer: correctAnswer, options: shuffledOptions };
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

  const defeatByEnemy = useCallback((x: number, y: number) => {
    setDeaths((current) => current + 1);
    setPlayerPos((current) => {
      if (!current.alive) return current;
      return { ...current, x: current.spawnX, y: current.spawnY, alive: false, respawnAt: Date.now() + RESPAWN_MS };
    });
  }, []);

  const defeatByExplosion = useCallback((x: number, y: number) => {
    if (hasShield) {
      setHasShield(false);
      return;
    }

    const dropped: BomberItemId[] = [
      ...Array.from({ length: fireLevel }, () => 'fire_up' as const),
      ...(hasKickBomb ? (['kick_bomb'] as const) : []),
      ...(hasRemoteBomb ? (['remote_bomb'] as const) : []),
      ...(hasPierceFire ? (['pierce_fire'] as const) : []),
      ...(hasShield ? (['shield'] as const) : []),
      ...Array.from({ length: moveSpeedLevel }, () => 'speed_up' as const),
    ];
    if (dropped.length > 0) {
      setItemDrops((current) => {
        const used = new Set(current.map((item) => `${item.x},${item.y}`));
        const additions = dropped.flatMap((itemId, index) => {
          for (let tries = 0; tries < 20; tries += 1) {
            const nx = x + (Math.floor(Math.random() * 7) - 3);
            const ny = y + (Math.floor(Math.random() * 7) - 3);
            if (!grid[ny]?.[nx] || grid[ny][nx] !== 'floor') continue;
            const key = `${nx},${ny}`;
            if (used.has(key)) continue;
            used.add(key);
            return [{ id: `drop-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`, itemId, x: nx, y: ny }];
          }
          return [];
        });
        return [...current, ...additions];
      });
    }

    setFireLevel(0);
    setBombRange(2);
    setHasKickBomb(false);
    setHasShield(false);
    setHasRemoteBomb(false);
    setHasPierceFire(false);
    setMoveSpeedLevel(0);
    setDeaths((current) => current + 1);
    setPlayerPos((current) => {
      if (!current.alive) return current;
      return { ...current, x: current.spawnX, y: current.spawnY, alive: false, respawnAt: Date.now() + RESPAWN_MS };
    });
  }, [fireLevel, grid, hasKickBomb, hasPierceFire, hasRemoteBomb, hasShield, moveSpeedLevel]);

  const resolveImmediateHazardAt = useCallback((x: number, y: number) => {
    const hitExplosion = explosions.some((explosion) => explosion.cells.some((cell) => cell.x === x && cell.y === y));
    if (hitExplosion) {
      defeatByExplosion(x, y);
      return true;
    }
    const hitEnemy = enemies.some((enemy) => enemy.alive && enemy.x === x && enemy.y === y);
    if (hitEnemy) {
      defeatByEnemy(x, y);
      return true;
    }
    return false;
  }, [defeatByEnemy, defeatByExplosion, enemies, explosions]);

  const prepareFloor = useCallback((nextFloor: number) => {
    const { width, height } = getDimensionsForFloor(nextFloor);
    const nextGrid = createGrid(width, height);
    const used = new Set<string>();
    const playerSpawn = randomFloorPosition(nextGrid, used);
    clearSpawnArea(nextGrid, playerSpawn.x, playerSpawn.y);
    used.add(`${playerSpawn.x},${playerSpawn.y}`);

    const enemyCount = Math.min(3 + nextFloor, 12);
    const nextEnemies: Enemy[] = Array.from({ length: enemyCount }, (_, index) => {
      const spawn = randomFloorPosition(nextGrid, used);
      clearSpawnArea(nextGrid, spawn.x, spawn.y);
      used.add(`${spawn.x},${spawn.y}`);
      return {
        id: `enemy-${nextFloor}-${index}`,
        name: `E${index + 1}`,
        color: ['#fb7185', '#f59e0b', '#a78bfa', '#34d399'][index % 4],
        x: spawn.x,
        y: spawn.y,
        alive: true,
        avatar: createRandomAvatar(),
      };
    });

    setGrid(nextGrid);
    setBombs([]);
    setExplosions([]);
    setItemDrops([]);
    setEnemies(nextEnemies);
    setPlayerPos({ x: playerSpawn.x, y: playerSpawn.y, spawnX: playerSpawn.x, spawnY: playerSpawn.y, alive: true, respawnAt: null });
    setBombsAvailable(1);
    setFireLevel(0);
    setBombRange(2);
    setHasKickBomb(false);
    setHasShield(false);
    setHasRemoteBomb(false);
    setHasPierceFire(false);
    setMoveSpeedLevel(0);
    setQuestion(pickQuestion());
    setAnswerResult(null);
    setSelectedAnswerIndex(null);
    setCorrectAnswerIndex(null);
    setCorrectAnswerText(null);
    setSpeechTranscript('');
  }, [pickQuestion]);

  useEffect(() => {
    setSpeechSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    prepareFloor(1);
    startBGM('bomber_play');

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
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [prepareFloor, stopRecognition]);

  useEffect(() => {
    if (!question?.audioPrompt || answerResult !== null) return;
    if (question.audioPrompt.autoPlay === false) return;
    const timer = window.setTimeout(() => speakPrompt(question.audioPrompt.text, question.audioPrompt.lang || 'ja-JP'), 250);
    return () => window.clearTimeout(timer);
  }, [answerResult, question, speakPrompt]);

  useEffect(() => {
    if (!grid.length || timeRemaining <= 0) return;

    const interval = window.setInterval(() => {
      const now = Date.now();
      setTimeAliveMs((current) => current + (playerPos.alive ? 100 : 0));
      setBombs((current) => advanceMovingBombs(grid, current));
      setBombs((currentBombs) => {
        const dueBombs = currentBombs.filter((bomb) => bomb.explodeAt <= now);
        if (dueBombs.length === 0) return currentBombs;

        const pendingBombs = [...dueBombs];
        const explodedIds = new Set<string>();
        const pendingById = new Map(pendingBombs.map((bomb) => [bomb.id, bomb]));
        let remainingBombs = currentBombs.filter((bomb) => bomb.explodeAt > now);

        setGrid((currentGrid) => {
          const nextGrid = currentGrid.map((row) => [...row]);
          while (pendingBombs.length > 0) {
            const bomb = pendingBombs.shift();
            if (!bomb || explodedIds.has(bomb.id)) continue;
            explodedIds.add(bomb.id);
            const cells = buildExplosionCells(nextGrid, bomb.x, bomb.y, bomb.range, bomb.pierce);
            setExplosions((current) => [...current, { id: `${bomb.id}-exp`, ownerId: bomb.ownerId, cells, expiresAt: now + EXPLOSION_MS }]);

            const chainTargets = remainingBombs.filter((target) => cells.some((cell) => cell.x === target.x && cell.y === target.y));
            if (chainTargets.length > 0) {
              chainTargets.forEach((target) => {
                if (!explodedIds.has(target.id) && !pendingById.has(target.id)) {
                  pendingBombs.push(target);
                  pendingById.set(target.id, target);
                }
              });
              const chainTargetIds = new Set(chainTargets.map((target) => target.id));
              remainingBombs = remainingBombs.filter((target) => !chainTargetIds.has(target.id));
            }

            let destroyed = 0;
            cells.forEach(({ x, y }) => {
              if (nextGrid[y]?.[x] === 'breakable') {
                nextGrid[y][x] = 'floor';
                destroyed += 1;
                if (Math.random() < ITEM_DROP_RATE) {
                  setItemDrops((current) => [
                    ...current,
                    { id: `drop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, itemId: randomItem(), x, y },
                  ]);
                }
              }
            });
            if (destroyed > 0) setBlocksDestroyed((current) => current + destroyed);

            setEnemies((currentEnemies) => {
              let killsThisBomb = 0;
              const nextEnemies = currentEnemies.map((enemy) => {
                if (!enemy.alive) return enemy;
                const hit = cells.some((cell) => cell.x === enemy.x && cell.y === enemy.y);
                if (!hit) return enemy;
                killsThisBomb += 1;
                return { ...enemy, alive: false };
              });
              if (killsThisBomb > 0) setKills((current) => current + killsThisBomb);
              return nextEnemies;
            });

            setPlayerPos((currentPlayer) => {
              if (!currentPlayer.alive) return currentPlayer;
              const hit = cells.some((cell) => cell.x === currentPlayer.x && cell.y === currentPlayer.y);
              if (!hit) return currentPlayer;
              if (hasShield) {
                setHasShield(false);
                return currentPlayer;
              }
              const dropped: BomberItemId[] = [
                ...Array.from({ length: fireLevel }, () => 'fire_up' as const),
                ...(hasKickBomb ? (['kick_bomb'] as const) : []),
                ...(hasRemoteBomb ? (['remote_bomb'] as const) : []),
                ...(hasPierceFire ? (['pierce_fire'] as const) : []),
                ...(hasShield ? (['shield'] as const) : []),
                ...Array.from({ length: moveSpeedLevel }, () => 'speed_up' as const),
              ];
              if (dropped.length > 0) {
                setItemDrops((current) => {
                  const used = new Set(current.map((item) => `${item.x},${item.y}`));
                  const additions = dropped.flatMap((itemId, index) => {
                    for (let tries = 0; tries < 20; tries += 1) {
                      const nx = currentPlayer.x + (Math.floor(Math.random() * 7) - 3);
                      const ny = currentPlayer.y + (Math.floor(Math.random() * 7) - 3);
                      if (!nextGrid[ny]?.[nx] || nextGrid[ny][nx] !== 'floor') continue;
                      const key = `${nx},${ny}`;
                      if (used.has(key)) continue;
                      used.add(key);
                      return [{ id: `drop-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`, itemId, x: nx, y: ny }];
                    }
                    return [];
                  });
                  return [...current, ...additions];
                });
              }
              setFireLevel(0);
              setBombRange(2);
              setHasKickBomb(false);
              setHasShield(false);
              setHasRemoteBomb(false);
              setHasPierceFire(false);
              setMoveSpeedLevel(0);
              setDeaths((current) => current + 1);
              return { ...currentPlayer, x: currentPlayer.spawnX, y: currentPlayer.spawnY, alive: false, respawnAt: now + RESPAWN_MS };
            });
          }
          return nextGrid;
        });

        return remainingBombs.filter((bomb) => !explodedIds.has(bomb.id));
      });

      setExplosions((current) => current.filter((explosion) => explosion.expiresAt > now));
      setPlayerPos((current) => {
        if (!current.alive && current.respawnAt && now >= current.respawnAt) {
          return { ...current, alive: true, respawnAt: null, x: current.spawnX, y: current.spawnY };
        }
        return current;
      });

      setItemDrops((current) => {
        if (!playerPos.alive) return current;
        const pickupIndex = current.findIndex((drop) => drop.x === playerPos.x && drop.y === playerPos.y);
        if (pickupIndex === -1) return current;
        const pickup = current[pickupIndex];
        if (pickup.itemId === 'fire_up') {
          setFireLevel((value) => {
            const next = Math.min(MAX_FIRE_LEVEL, value + 1);
            setBombRange(2 + next);
            return next;
          });
        } else if (pickup.itemId === 'kick_bomb') {
          setHasKickBomb(true);
        } else if (pickup.itemId === 'shield') {
          setHasShield(true);
        } else if (pickup.itemId === 'remote_bomb') {
          setHasRemoteBomb(true);
        } else if (pickup.itemId === 'pierce_fire') {
          setHasPierceFire(true);
        } else if (pickup.itemId === 'speed_up') {
          setMoveSpeedLevel((value) => Math.min(MAX_SPEED_LEVEL, value + 1));
        }
        return [...current.slice(0, pickupIndex), ...current.slice(pickupIndex + 1)];
      });

      enemyTickRef.current += 1;
      if (enemyTickRef.current % getEnemyMoveTickInterval(floor) === 0) {
        setEnemies((currentEnemies) =>
          currentEnemies.map((enemy) => {
            if (!enemy.alive) return enemy;
            const dirs = shuffle([
              { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 },
            ]);
            const next = dirs.find((dir) => !isBlocked(grid, bombs, enemy.x + dir.x, enemy.y + dir.y));
            if (!next) return enemy;
            return { ...enemy, x: enemy.x + next.x, y: enemy.y + next.y };
          })
        );
      }

      setPlayerPos((current) => {
        if (!current.alive) return current;
        const touchedEnemy = enemies.some((enemy) => enemy.alive && enemy.x === current.x && enemy.y === current.y);
        if (!touchedEnemy) return current;
        setDeaths((value) => value + 1);
        return { ...current, x: current.spawnX, y: current.spawnY, alive: false, respawnAt: now + RESPAWN_MS };
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [bombs, enemies, fireLevel, floor, grid, hasKickBomb, hasPierceFire, hasRemoteBomb, hasShield, moveSpeedLevel, playerPos.alive, playerPos.x, playerPos.y, prepareFloor, timeRemaining]);

  useEffect(() => {
    const aliveEnemies = enemies.filter((enemy) => enemy.alive);
    if (grid.length > 0 && aliveEnemies.length === 0 && timeRemaining > 0) {
      const nextFloor = floor + 1;
      setFloor(nextFloor);
      prepareFloor(nextFloor);
    }
  }, [enemies, floor, grid.length, prepareFloor, timeRemaining]);

  useEffect(() => {
    const explosionCount = explosions.length;
    if (explosionCount > prevExplosionCountRef.current) playExplosionSound();
    prevExplosionCountRef.current = explosionCount;
    if (prevAliveRef.current === true && playerPos.alive === false) playDefeatSound();
    prevAliveRef.current = playerPos.alive;
  }, [explosions.length, playerPos.alive]);

  const getOptionStateClass = (index: number) => {
    if (answerResult === null) return 'hover:scale-105 active:scale-95';
    if (index === correctAnswerIndex) return 'scale-[1.02] border-4 border-emerald-200 ring-4 ring-emerald-500/40 opacity-100';
    if (!answerResult && index === selectedAnswerIndex) return 'border-4 border-rose-200 ring-4 ring-rose-500/40 opacity-100';
    return 'opacity-35';
  };

  const moveToNextQuestion = useCallback((delay: number) => {
    window.setTimeout(() => {
      setQuestion(pickQuestion());
      setAnswerResult(null);
      setSelectedAnswerIndex(null);
      setCorrectAnswerIndex(null);
      setCorrectAnswerText(null);
      setSpeechTranscript('');
    }, delay);
  }, [pickQuestion]);

  const submitAnswer = useCallback((answerIndex?: number, isSpeechCorrect?: boolean) => {
    if (!question) return;
    const correctIndex = findMatchingOptionIndex(question.options, question.answer);
    const correct = typeof isSpeechCorrect === 'boolean' ? isSpeechCorrect : answerIndex === correctIndex;
    setAnswerResult(correct);
    setCorrectAnswerIndex(correctIndex);
    setCorrectAnswerText(question.answer);
    if (correct) {
      setCorrectAnswers((current) => current + 1);
      setBombsAvailable((current) => current + 1);
      playCorrectSound();
      moveToNextQuestion(700);
    } else {
      playIncorrectSound();
      moveToNextQuestion(2200);
    }
  }, [moveToNextQuestion, question]);

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
      submitAnswer(undefined, matchesSpeechAnswer(transcript, question.speechPrompt));
    };
    recognition.onerror = () => stopRecognition();
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [answerResult, isListening, question, stopRecognition, submitAnswer]);

  const me = useMemo(() => ({
    id: 'single-player',
    name: 'あなた',
    color: '#38bdf8',
    avatar: singleAvatar,
    bomberX: playerPos.x,
    bomberY: playerPos.y,
    alive: playerPos.alive,
    kills,
    blocksDestroyed,
    correctAnswers,
    deaths,
    timeAliveMs,
    bombsAvailable,
    fireLevel,
    moveSpeedLevel,
    hasKickBomb,
    hasShield,
    hasRemoteBomb,
    hasPierceFire,
  }), [bombsAvailable, blocksDestroyed, correctAnswers, deaths, fireLevel, hasKickBomb, hasPierceFire, hasRemoteBomb, hasShield, kills, moveSpeedLevel, playerPos.alive, playerPos.x, playerPos.y, singleAvatar, timeAliveMs]);

  const combinedPlayers = useMemo(() => {
    const players: Record<string, any> = { [me.id]: me };
    enemies.forEach((enemy) => {
      players[enemy.id] = {
        id: enemy.id,
        name: enemy.name,
        color: enemy.color,
        avatar: enemy.avatar,
        bomberX: enemy.x,
        bomberY: enemy.y,
        alive: enemy.alive,
      };
    });
    return players;
  }, [enemies, me]);

  if (timeRemaining <= 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl font-bold mb-8 text-yellow-400">クイズボンバー終了</h1>
        <p className="text-2xl text-slate-300 mb-12">{gameTitle} の結果です。</p>
        <div className="bg-slate-800 px-12 py-8 rounded-2xl border border-slate-700 shadow-2xl text-center">
          <div className="text-xl text-slate-400 mb-2">あなたの成績</div>
          <div className="text-4xl font-bold mb-4 text-sky-400">Floor {floor}</div>
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div><div className="text-sm text-slate-400">撃破</div><div className="text-3xl font-mono font-bold text-rose-300">{kills}</div></div>
            <div><div className="text-sm text-slate-400">破壊</div><div className="text-3xl font-mono font-bold text-amber-300">{blocksDestroyed}</div></div>
            <div><div className="text-sm text-slate-400">正答数</div><div className="text-3xl font-mono font-bold text-cyan-300">{correctAnswers}</div></div>
            <div><div className="text-sm text-slate-400">最終スコア</div><div className="text-3xl font-mono font-bold text-yellow-300">{calculateGameScore('bomber', { kills, blocksDestroyed, correctAnswers, deaths, timeAliveMs })}</div></div>
          </div>
          <button onClick={onReturnToTitle} className="mt-8 rounded-xl bg-slate-700 px-6 py-3 text-lg font-bold text-white hover:bg-slate-600">タイトル画面に戻る</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-y-auto bg-slate-900 text-white lg:overflow-hidden">
      <div className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col gap-2 p-2 md:p-3 lg:h-full lg:min-h-0">
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-sky-400" />
              <div>
                <div className="text-lg font-bold md:text-xl">あなた</div>
                <div className="text-xs text-slate-400">クイズボンバー シングル / Floor {floor}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
              <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">残り: <span className="font-bold text-yellow-300">{timeRemaining}</span></div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">爆弾: <span className="font-bold text-rose-300">{bombsAvailable}</span></div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">敵: <span className="font-bold text-red-300">{enemies.filter((enemy) => enemy.alive).length}</span></div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-2.5 py-1.5">撃破: <span className="font-bold text-emerald-300">{kills}</span></div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
            {bomberItems.map(({ itemId, count }) => {
              const item = BOMBER_ITEM_META[itemId];
              return (
                <span key={`${itemId}-${count || 1}`} className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 font-bold text-cyan-100">
                  <img src={withBaseUrl(item.iconAsset)} alt={`${item.label} アイコン`} className="h-4 w-4 rounded-sm border border-white/20 bg-slate-900/60 p-[1px]" />
                  <span>{item.label}{count ? `x${count}` : ''}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-2 grid-rows-[minmax(360px,1fr)_minmax(260px,auto)] md:grid-rows-[minmax(420px,1fr)_minmax(260px,34dvh)] lg:grid-cols-[minmax(0,1fr)_330px] lg:grid-rows-1">
          <div className="min-h-[360px] rounded-2xl border border-slate-700 bg-slate-800 p-2 md:min-h-[420px] lg:min-h-0">
            <BomberGame
              roomId="single-bomber"
              me={me}
              players={combinedPlayers}
              bomberState={{ width: grid[0]?.length || BASE_WIDTH, height: grid.length || BASE_HEIGHT, grid, bombs, explosions, itemDrops }}
              onMove={(direction) => {
                if (!playerPos.alive) return;
                const deltas = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
                const [dx, dy] = deltas[direction];
                const nextX = playerPos.x + dx;
                const nextY = playerPos.y + dy;
                const bombIndex = bombs.findIndex((bomb) => bomb.x === nextX && bomb.y === nextY);
                if (bombIndex !== -1) {
                  if (!hasKickBomb) return;
                  const kickX = nextX + dx;
                  const kickY = nextY + dy;
                  if (isBlocked(grid, bombs, kickX, kickY)) return;
                  setBombs((current) => current.map((bomb, index) => (
                    index === bombIndex ? { ...bomb, x: kickX, y: kickY, movingDx: dx, movingDy: dy } : bomb
                  )));
                } else if (isBlocked(grid, bombs, nextX, nextY)) {
                  return;
                }
                setPlayerPos((current) => ({ ...current, x: nextX, y: nextY }));
                resolveImmediateHazardAt(nextX, nextY);
              }}
              onPlaceBomb={() => {
                if (!playerPos.alive || bombsAvailable <= 0) return;
                if (bombs.some((bomb) => bomb.x === playerPos.x && bomb.y === playerPos.y)) return;
                setBombs((current) => [
                  ...current,
                  {
                    id: `single-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    ownerId: me.id,
                    x: playerPos.x,
                    y: playerPos.y,
                    explodeAt: hasRemoteBomb ? Number.POSITIVE_INFINITY : Date.now() + BOMB_DELAY_MS,
                    range: bombRange,
                    remote: hasRemoteBomb,
                    pierce: hasPierceFire,
                    movingDx: 0,
                    movingDy: 0,
                  },
                ]);
                setBombsAvailable((current) => current - 1);
              }}
              canUseRemote={hasRemoteBomb}
              onDetonateRemote={() => {
                const now = Date.now();
                setBombs((current) => current.map((bomb) => (
                  bomb.ownerId === me.id && bomb.remote ? { ...bomb, explodeAt: Math.min(bomb.explodeAt, now) } : bomb
                )));
              }}
            />
          </div>
          <div className="min-h-[260px] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-3 lg:min-h-0">
            {!playerPos.alive ? (
              <div className="mb-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-center">
                <div className="text-xl font-black text-rose-300">やられた！</div>
                <div className="mt-1 text-xs text-rose-100">少し待つと復活します。</div>
              </div>
            ) : null}
            {question ? (
              <div className="flex h-full min-h-0 flex-col gap-3">
                <div className="shrink-0 rounded-2xl bg-slate-900/50 p-3">
                  <div className="mb-2 text-[11px] font-bold text-slate-400">爆弾は使うと減る（正解で1個補充）</div>
                  <h2 className="break-words text-lg font-black leading-snug md:text-xl">{question.text || question.question}</h2>
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
                {question.hint ? <div className="break-words text-xs text-yellow-300">ヒント: {question.hint}</div> : null}
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
                          submitAnswer(i);
                        }}
                        disabled={answerResult !== null}
                        className={`min-h-12 break-words rounded-2xl p-2.5 text-sm font-bold leading-snug shadow-lg transition-transform md:text-base ${answerResult !== null ? 'cursor-not-allowed' : ''} ${getOptionStateClass(i)}`}
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

function BomberMapDebugScreen({
  gameTitle,
  playerCount,
  onReturnToTitle,
}: {
  gameTitle: string;
  playerCount: number;
  onReturnToTitle: () => void;
}) {
  const { width, height } = getBomberDimensions(playerCount);
  const [grid, setGrid] = useState<BomberCell[][]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);

  const demoPlayers = useMemo(() => {
    if (!grid.length) return {} as Record<string, any>;
    const floorCells = grid.flatMap((row, y) =>
      row.flatMap((cell, x) => (cell === 'floor' ? [{ x, y }] : []))
    );
    if (floorCells.length === 0) return {} as Record<string, any>;

    const step = Math.max(1, Math.floor(floorCells.length / playerCount));
    const colors = ['#38bdf8', '#f87171', '#fbbf24', '#4ade80', '#c084fc', '#fb7185', '#22d3ee', '#f97316'];
    const players: Record<string, any> = {};

    for (let index = 0; index < playerCount; index += 1) {
      const cell = floorCells[Math.min(index * step, floorCells.length - 1)];
      players[`debug-${index + 1}`] = {
        id: `debug-${index + 1}`,
        name: index === 0 ? 'あなた' : `P${index + 1}`,
        color: colors[index % colors.length],
        bomberX: cell.x,
        bomberY: cell.y,
        alive: true,
      };
    }

    return players;
  }, [grid, playerCount]);

  useEffect(() => {
    startBGM('bomber_play');
    const nextGrid = createGrid(width, height);
    setGrid(nextGrid);
    const spawn = nextGrid.flatMap((row, y) =>
      row.flatMap((cell, x) => (cell === 'floor' ? [{ x, y }] : []))
    )[0] || { x: 1, y: 1 };
    clearSpawnArea(nextGrid, spawn.x, spawn.y);
    setGrid([...nextGrid.map((row) => [...row])]);
    setPlayerPos(spawn);

    return () => stopBGM();
  }, [height, width]);

  useEffect(() => {
    if (!grid.length) return;

    const interval = window.setInterval(() => {
      const now = Date.now();
      setBombs((currentBombs) => {
        const dueBombs = currentBombs.filter((bomb) => bomb.explodeAt <= now);
        if (dueBombs.length === 0) return advanceMovingBombs(grid, currentBombs);

        const pendingBombs = [...dueBombs];
        const explodedIds = new Set<string>();
        const pendingById = new Map(pendingBombs.map((bomb) => [bomb.id, bomb]));
        let remainingBombs = advanceMovingBombs(grid, currentBombs.filter((bomb) => bomb.explodeAt > now));

        setGrid((currentGrid) => {
          const nextGrid = currentGrid.map((row) => [...row]);
          while (pendingBombs.length > 0) {
            const bomb = pendingBombs.shift();
            if (!bomb || explodedIds.has(bomb.id)) continue;
            explodedIds.add(bomb.id);
            const cells = buildExplosionCells(nextGrid, bomb.x, bomb.y, bomb.range, bomb.pierce);
            setExplosions((current) => [...current, { id: `${bomb.id}-exp`, ownerId: bomb.ownerId, cells, expiresAt: now + EXPLOSION_MS }]);

            const chainTargets = remainingBombs.filter((target) => cells.some((cell) => cell.x === target.x && cell.y === target.y));
            if (chainTargets.length > 0) {
              chainTargets.forEach((target) => {
                if (!explodedIds.has(target.id) && !pendingById.has(target.id)) {
                  pendingBombs.push(target);
                  pendingById.set(target.id, target);
                }
              });
              const chainTargetIds = new Set(chainTargets.map((target) => target.id));
              remainingBombs = remainingBombs.filter((target) => !chainTargetIds.has(target.id));
            }

            cells.forEach(({ x, y }) => {
              if (nextGrid[y]?.[x] === 'breakable') {
                nextGrid[y][x] = 'floor';
              }
            });
          }
          return nextGrid;
        });

        return remainingBombs.filter((bomb) => !explodedIds.has(bomb.id));
      });

      setExplosions((current) => current.filter((explosion) => explosion.expiresAt > now));
    }, 100);

    return () => window.clearInterval(interval);
  }, [grid]);

  const occupied = useMemo(() => {
    const taken = new Set<string>();
    Object.values(demoPlayers).forEach((player: any) => {
      if (player.name !== 'あなた') taken.add(`${player.bomberX},${player.bomberY}`);
    });
    return taken;
  }, [demoPlayers]);

  const me = useMemo(() => ({
    ...(demoPlayers['debug-1'] || {
      id: 'debug-1',
      name: 'あなた',
      color: '#38bdf8',
      bomberX: playerPos.x,
      bomberY: playerPos.y,
      alive: true,
    }),
    bomberX: playerPos.x,
    bomberY: playerPos.y,
  }), [demoPlayers, playerPos.x, playerPos.y]);

  const players = useMemo(() => ({
    ...demoPlayers,
    'debug-1': me,
  }), [demoPlayers, me]);

  return (
    <div className="h-screen overflow-hidden bg-slate-900 text-white">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-2 p-2 md:p-3">
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-800 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold tracking-[0.3em] text-cyan-300">DEBUG MULTIPLAYER MAP</div>
              <div className="mt-1 text-xl font-black text-white">{gameTitle}</div>
              <div className="mt-1 text-xs text-slate-400">人数 {playerCount}人 / {width} x {height} / {width * height} マス</div>
            </div>
            <button onClick={onReturnToTitle} className="rounded-xl border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700">
              タイトルへ戻る
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-0 rounded-2xl border border-slate-700 bg-slate-800 p-2">
            <BomberGame
              roomId="debug-bomber-map"
              me={me}
              players={players}
              bomberState={{ width, height, grid, bombs, explosions, itemDrops: [] }}
              onMove={(direction) => {
                const deltas = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
                const [dx, dy] = deltas[direction];
                const nextX = playerPos.x + dx;
                const nextY = playerPos.y + dy;
                if (!grid[nextY]?.[nextX] || grid[nextY][nextX] !== 'floor') return;
                if (bombs.some((bomb) => bomb.x === nextX && bomb.y === nextY)) return;
                if (occupied.has(`${nextX},${nextY}`)) return;
                setPlayerPos({ x: nextX, y: nextY });
              }}
              onPlaceBomb={() => {
                if (!grid[playerPos.y]?.[playerPos.x] || grid[playerPos.y][playerPos.x] !== 'floor') return;
                if (bombs.some((bomb) => bomb.x === playerPos.x && bomb.y === playerPos.y)) return;
                setBombs((current) => [
                  ...current,
                  {
                    id: `debug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    ownerId: me.id,
                    x: playerPos.x,
                    y: playerPos.y,
                    explodeAt: Date.now() + BOMB_DELAY_MS,
                    range: 2,
                    remote: false,
                    pierce: false,
                    movingDx: 0,
                    movingDy: 0,
                  },
                ]);
              }}
            />
          </div>
          <div className="hidden min-h-0 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-3 lg:block">
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3">
              <div className="text-sm font-bold text-cyan-200">確認内容</div>
              <div className="mt-2 text-sm text-slate-200">サーバー計算式と同じ寸法でマップを生成し、{playerCount}人分のダミープレイヤーを配置しています。</div>
              <div className="mt-2 text-xs text-slate-400">十字キー / WASD で自分だけ移動できます。ほかのプレイヤー表示は固定です。</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2">横幅: <span className="font-mono font-bold text-cyan-300">{width}</span></div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2">縦幅: <span className="font-mono font-bold text-cyan-300">{height}</span></div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2">総マス: <span className="font-mono font-bold text-cyan-300">{width * height}</span></div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2">表示人数: <span className="font-mono font-bold text-cyan-300">{playerCount}</span></div>
            </div>
            <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-900/40 p-3">
              <div className="mb-2 text-sm font-bold text-slate-200">表示プレイヤー</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                {Object.values(players).map((player: any) => (
                  <div key={player.id} className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1.5">
                    {player.name} <span className="font-mono text-slate-500">({player.bomberX},{player.bomberY})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
