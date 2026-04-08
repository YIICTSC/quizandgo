import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { addItemToInventory, GameItemId, getRandomItemChoices } from './src/gameItems.ts';
import { findMatchingOptionIndex, shuffleOptionsWithFirstCorrect } from './src/lib/answerMatching.ts';
import { BOMBER_BASE_HEIGHT, BOMBER_BASE_WIDTH, getBomberDimensions } from './src/lib/bomberDimensions.ts';
import { AvatarConfig, createRandomAvatar, normalizeAvatar } from './src/avatar.ts';
import {
  DODGE_BALL_LIFETIME_MS,
  DODGE_BALL_RADIUS,
  DODGE_BALL_SPEED,
  DODGE_HEIGHT,
  DODGE_MOVE_SPEED,
  DODGE_PLAYER_RADIUS,
  DODGE_RESPAWN_MS,
  DODGE_SPECIAL_SHOT_MIN_RUNUP_MS,
  DODGE_THROW_COOLDOWN_MS,
  DODGE_THROW_SPAWN_OFFSET,
  getDodgeCourtSize,
  DODGE_WIDTH,
} from './src/lib/dodgeConfig.ts';

const PORT = Number(process.env.PORT || 3000);

// ==========================================
// 型定義 (Type Definitions)
// ==========================================

interface Player {
  id: string;
  name: string;
  isPseudo?: boolean;
  avatar: AvatarConfig;
  holesCompleted: number; // クリアしたホール数
  totalStrokes: number;   // 全ホールの合計打数
  currentStrokes: number; // 現在のホールの打数
  correctAnswers: number;
  quizPoints: number;
  quizCombo: number;
  maxQuizCombo: number;
  fastestAnswerMs: number | null;
  lastQuestionIssuedAt: number | null;
  quizLives: number;
  battleRoyaleWins: number;
  currentBattlePairId?: string | null;
  currentBattlePairIds?: string[];
  canShoot: boolean;
  x: number;
  y: number;
  color: string;
  currentQuestion?: any;  // プレイヤーごとの現在の問題
  items: GameItemId[];
  activeItemId: GameItemId | null;
  pendingItemChoices: GameItemId[] | null;
  shotsRemaining: number;
  teamId: number | null;
  bomberX: number;
  bomberY: number;
  bomberSpawnX: number;
  bomberSpawnY: number;
  alive: boolean;
  respawnAt: number | null;
  kills: number;
  blocksDestroyed: number;
  deaths: number;
  timeAliveMs: number;
  bombsAvailable: number;
  bombRange: number;
  fireLevel: number;
  hasKickBomb: boolean;
  hasShield: boolean;
  hasRemoteBomb: boolean;
  hasPierceFire: boolean;
  moveSpeedLevel: number;
  territoryCells: number;
  lastBomberMoveAt?: number;
  lastBroadcastX?: number;
  lastBroadcastY?: number;
  lastBroadcastAt?: number;
  dodgeValue: number;
  dodgeHasBall: boolean;
  dodgeFacing: 'up' | 'down' | 'left' | 'right';
  dodgeMoveDirection: 'up' | 'down' | 'left' | 'right' | null;
  dodgeMoveVector: { x: number; y: number } | null;
  dodgeAimVector: { x: number; y: number } | null;
  dodgeInvulnerableUntil: number | null;
  lastDodgeThrowAt?: number;
  dodgeRunupStartedAt: number | null;
  dodgeRole?: 'infield' | 'outfield';
  dodgeReadyToAssist?: boolean;
}

type BomberCell = 'solid' | 'breakable' | 'floor';
type BomberItemId = 'fire_up' | 'kick_bomb' | 'shield' | 'remote_bomb' | 'pierce_fire' | 'speed_up';

interface BomberBomb {
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
}

interface BomberExplosion {
  id: string;
  ownerId: string;
  cells: { x: number; y: number }[];
  expiresAt: number;
}

interface BomberItemPickup {
  id: string;
  itemId: BomberItemId;
  x: number;
  y: number;
}

interface BomberState {
  width: number;
  height: number;
  grid: BomberCell[][];
  bombs: BomberBomb[];
  explosions: BomberExplosion[];
  itemDrops: BomberItemPickup[];
  cellOwners: (string | null)[][];
}

interface DodgeBall {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  dodgeValue: number;
  expiresAt: number;
  spawnedAt: number;
  shotType?: 'normal' | 'fast' | 'wave' | 'homing';
  sourceRole?: 'infield' | 'outfield';
}

interface DodgeState {
  width: number;
  height: number;
  playerRadius: number;
  balls: DodgeBall[];
  lastBallOwnerAddedAt: number;
}

interface Room {
  id: string;
  hostId: string;
  gameType: string;
  players: Record<string, Player>;
  state: 'waiting' | 'teamReveal' | 'playing' | 'results';
  questionMode: string;
  timeLimit?: number;
  timeRemaining?: number;
  questions?: any[]; // Custom questions from Host
  shotsPerQuestion?: number;
  teamMode?: boolean;
  teamCount?: number;
  teamNames?: Record<number, string>;
  bomberFriendlyFire?: boolean;
  bomberState?: BomberState | null;
  dodgeState?: DodgeState | null;
  quizVariant?: 'classic' | 'combo' | 'speed' | 'team_battle' | 'boss' | 'battle_royale';
  bossHp?: number;
  bossMaxHp?: number;
  quizBattleLives?: number;
  quizBattleQuestionLimit?: number;
  quizBattlePhase?: 'matchup' | 'question' | 'reveal' | 'result';
  quizBattleRound?: number;
  quizBattlePairs?: {
    id: string;
    playerIds: string[];
    primaryPlayerId?: string | null;
    winnerId: string | null;
    loserIds: string[];
    resolved: boolean;
    question?: any;
    answerCounts?: number[];
    answers?: Record<string, { answerIndex: number | null; answeredAt: number; correct: boolean }>;
    resultLabel?: string;
  }[];
  dodgeMode?: 'single' | 'team';
  dodgeWinnerTeamId?: number | null;
  debugPseudoPlayerCount?: number;
  debugIncludeHostAsPseudoPlayer?: boolean;
}

const rooms: Record<string, Room> = {};
const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3', '#FFB533'];
const BOMBER_WIDTH = BOMBER_BASE_WIDTH;
const BOMBER_HEIGHT = BOMBER_BASE_HEIGHT;
const BOMBER_RESPAWN_MS = 2500;
const BOMBER_EXPLOSION_MS = 500;
const BOMBER_BOMB_DELAY_MS = 2000;
const BOMBER_ITEM_DROP_RATE = 0.22;
const BOMBER_MAX_FIRE_LEVEL = 4;
const BOMBER_MAX_SPEED_LEVEL = 3;
const BOMBER_ITEM_POOL: BomberItemId[] = ['fire_up', 'kick_bomb', 'shield', 'remote_bomb', 'pierce_fire', 'speed_up'];
const BOMBER_GAME_TYPES = new Set(['bomber', 'team_bomber', 'color_bomber']);

const randomBomberItemId = (): BomberItemId => BOMBER_ITEM_POOL[Math.floor(Math.random() * BOMBER_ITEM_POOL.length)];
const isBomberGameType = (gameType?: string) => BOMBER_GAME_TYPES.has(gameType || '');
const isTeamBomberGameType = (gameType?: string) => gameType === 'team_bomber';
const isColorBomberGameType = (gameType?: string) => gameType === 'color_bomber';
const isDodgeGameType = (gameType?: string) => gameType === 'dodge';
const isTeamDodgeMode = (room?: Room) => isDodgeGameType(room?.gameType) && room?.dodgeMode === 'team';
const DODGE_SINGLE_OUTFIELD_DEPTH = 58;
const DODGE_BALL_OWNER_ADD_INTERVAL_MS = 60_000;
const DODGE_BALL_RADIUS_GAIN_PER_VALUE = 0.85;
const getDodgeTeamSide = (teamId?: number | null) => (teamId === 2 ? 'right' : 'left');
const getDodgeInfieldRange = (room: Room, player: Player) => {
  const courtWidth = room.dodgeState?.width ?? DODGE_WIDTH;
  const courtHeight = room.dodgeState?.height ?? DODGE_HEIGHT;
  const mid = courtWidth / 2;
  const isRight = getDodgeTeamSide(player.teamId) === 'right';
  if (!isTeamDodgeMode(room)) {
    if (player.dodgeRole === 'outfield') {
      return { minX: DODGE_PLAYER_RADIUS, maxX: courtWidth - DODGE_PLAYER_RADIUS };
    }
    return {
      minX: DODGE_SINGLE_OUTFIELD_DEPTH + DODGE_PLAYER_RADIUS,
      maxX: courtWidth - DODGE_SINGLE_OUTFIELD_DEPTH - DODGE_PLAYER_RADIUS,
      minY: DODGE_SINGLE_OUTFIELD_DEPTH + DODGE_PLAYER_RADIUS,
      maxY: courtHeight - DODGE_SINGLE_OUTFIELD_DEPTH - DODGE_PLAYER_RADIUS,
    };
  }
  if (player.dodgeRole === 'outfield') {
    return isRight
      ? { minX: courtWidth - DODGE_PLAYER_RADIUS - 42, maxX: courtWidth - DODGE_PLAYER_RADIUS, minY: DODGE_PLAYER_RADIUS, maxY: courtHeight - DODGE_PLAYER_RADIUS }
      : { minX: DODGE_PLAYER_RADIUS, maxX: DODGE_PLAYER_RADIUS + 42, minY: DODGE_PLAYER_RADIUS, maxY: courtHeight - DODGE_PLAYER_RADIUS };
  }
  return isRight
    ? { minX: mid + DODGE_PLAYER_RADIUS, maxX: courtWidth - DODGE_PLAYER_RADIUS, minY: DODGE_PLAYER_RADIUS, maxY: courtHeight - DODGE_PLAYER_RADIUS }
    : { minX: DODGE_PLAYER_RADIUS, maxX: mid - DODGE_PLAYER_RADIUS, minY: DODGE_PLAYER_RADIUS, maxY: courtHeight - DODGE_PLAYER_RADIUS };
};
const isSingleDodgeOutfieldZone = (x: number, y: number, width = DODGE_WIDTH, height = DODGE_HEIGHT) =>
  x <= DODGE_SINGLE_OUTFIELD_DEPTH ||
  x >= width - DODGE_SINGLE_OUTFIELD_DEPTH ||
  y <= DODGE_SINGLE_OUTFIELD_DEPTH ||
  y >= height - DODGE_SINGLE_OUTFIELD_DEPTH;

const clampSingleDodgeOutfieldPosition = (x: number, y: number, width = DODGE_WIDTH, height = DODGE_HEIGHT) => {
  const clampedX = clamp(x, DODGE_PLAYER_RADIUS, width - DODGE_PLAYER_RADIUS);
  const clampedY = clamp(y, DODGE_PLAYER_RADIUS, height - DODGE_PLAYER_RADIUS);
  if (isSingleDodgeOutfieldZone(clampedX, clampedY, width, height)) {
    return { x: clampedX, y: clampedY };
  }
  const targetLeft = DODGE_SINGLE_OUTFIELD_DEPTH;
  const targetRight = width - DODGE_SINGLE_OUTFIELD_DEPTH;
  const targetTop = DODGE_SINGLE_OUTFIELD_DEPTH;
  const targetBottom = height - DODGE_SINGLE_OUTFIELD_DEPTH;
  const options = [
    { x: targetLeft, y: clampedY },
    { x: targetRight, y: clampedY },
    { x: clampedX, y: targetTop },
    { x: clampedX, y: targetBottom },
  ];
  return options.sort((a, b) => Math.hypot(a.x - clampedX, a.y - clampedY) - Math.hypot(b.x - clampedX, b.y - clampedY))[0];
};

const getDodgeOutfieldPoint = (player: Player, width = DODGE_WIDTH, height = DODGE_HEIGHT) => {
  const isRight = getDodgeTeamSide(player.teamId) === 'right';
  return {
    x: isRight ? width - DODGE_PLAYER_RADIUS - 18 : DODGE_PLAYER_RADIUS + 18,
    y: height / 2,
  };
};
const getSingleDodgeOutfieldPoint = (width = DODGE_WIDTH, height = DODGE_HEIGHT) => {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) {
    return { x: DODGE_SINGLE_OUTFIELD_DEPTH, y: height * (0.2 + Math.random() * 0.6) };
  }
  if (side === 1) {
    return { x: width - DODGE_SINGLE_OUTFIELD_DEPTH, y: height * (0.2 + Math.random() * 0.6) };
  }
  if (side === 2) {
    return { x: width * (0.2 + Math.random() * 0.6), y: DODGE_SINGLE_OUTFIELD_DEPTH };
  }
  return { x: width * (0.2 + Math.random() * 0.6), y: height - DODGE_SINGLE_OUTFIELD_DEPTH };
};
const roomUsesTeams = (room: Room) =>
  room.gameType === 'golf' ||
  room.gameType === 'team_bomber' ||
  (room.gameType === 'dodge' && room.dodgeMode === 'team') ||
  (room.gameType === 'color_bomber' && room.teamMode) ||
  (room.gameType === 'quiz' && room.quizVariant === 'team_battle' && room.teamMode);

const isQuizBattleRoyale = (room?: Room) => room?.gameType === 'quiz' && room?.quizVariant === 'battle_royale';
const getBomberMoveRepeatMs = (moveSpeedLevel = 0) => {
  const clamped = Math.max(0, Math.min(BOMBER_MAX_SPEED_LEVEL, moveSpeedLevel));
  return [180, 160, 140, 125][clamped];
};

const consumeOneInventoryItem = (inventory: GameItemId[], itemId: GameItemId) => {
  const index = inventory.indexOf(itemId);
  if (index === -1) return inventory;
  return [...inventory.slice(0, index), ...inventory.slice(index + 1)];
};

const getTeamInitial = (name: string) => {
  const trimmed = String(name || '').trim();
  if (!trimmed) return '?';
  return Array.from(trimmed)[0];
};

const createBasePlayer = (id: string, name: string, color: string, avatar?: AvatarConfig, isPseudo = false): Player => ({
  id,
  name,
  isPseudo,
  avatar: normalizeAvatar(avatar ?? createRandomAvatar()),
  holesCompleted: 0,
  totalStrokes: 0,
  currentStrokes: 0,
  correctAnswers: 0,
  quizPoints: 0,
  quizCombo: 0,
  maxQuizCombo: 0,
  fastestAnswerMs: null,
  lastQuestionIssuedAt: null,
  quizLives: 0,
  battleRoyaleWins: 0,
  currentBattlePairId: null,
  currentBattlePairIds: [],
  canShoot: false,
  x: 100,
  y: 100,
  color,
  items: [],
  activeItemId: null,
  pendingItemChoices: null,
  shotsRemaining: 0,
  teamId: null,
  bomberX: 1,
  bomberY: 1,
  bomberSpawnX: 1,
  bomberSpawnY: 1,
  alive: true,
  respawnAt: null,
  kills: 0,
  blocksDestroyed: 0,
  deaths: 0,
  timeAliveMs: 0,
  bombsAvailable: 1,
  bombRange: 2,
  fireLevel: 0,
  hasKickBomb: false,
  hasShield: false,
  hasRemoteBomb: false,
  hasPierceFire: false,
  moveSpeedLevel: 0,
  territoryCells: 0,
  lastBomberMoveAt: 0,
  lastBroadcastX: 100,
  lastBroadcastY: 100,
  lastBroadcastAt: 0,
  dodgeValue: 0,
  dodgeHasBall: false,
  dodgeFacing: 'right',
  dodgeMoveDirection: null,
  dodgeMoveVector: null,
  dodgeAimVector: null,
  dodgeInvulnerableUntil: null,
  lastDodgeThrowAt: 0,
  dodgeRunupStartedAt: null,
  dodgeRole: 'infield',
  dodgeReadyToAssist: false,
});

const randomFloorPosition = (grid: BomberCell[][], used: Set<string>) => {
  const candidates: { x: number; y: number }[] = [];
  for (let y = 1; y < grid.length - 1; y += 1) {
    for (let x = 1; x < grid[y].length - 1; x += 1) {
      if (grid[y][x] === 'floor' && !used.has(`${x},${y}`)) {
        candidates.push({ x, y });
      }
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)] || { x: 1, y: 1 };
};

const createBomberGrid = (width = BOMBER_WIDTH, height = BOMBER_HEIGHT) => {
  const grid: BomberCell[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      if (isBorder) return 'solid';
      if (x % 2 === 0 && y % 2 === 0) return 'solid';
      return Math.random() < 0.42 ? 'breakable' : 'floor';
    })
  );

  return grid;
};

const clearBomberSpawnArea = (grid: BomberCell[][], x: number, y: number) => {
  const deltas = [
    [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
  ];
  deltas.forEach(([dx, dy]) => {
    const nextX = x + dx;
    const nextY = y + dy;
    if (grid[nextY]?.[nextX] && grid[nextY][nextX] !== 'solid') {
      grid[nextY][nextX] = 'floor';
    }
  });
};

const isFloorWithoutBomb = (room: Room, x: number, y: number) => {
  const grid = room.bomberState?.grid;
  if (!grid?.[y]?.[x] || grid[y][x] !== 'floor') return false;
  if (room.bomberState?.bombs.some((bomb) => bomb.x === x && bomb.y === y)) return false;
  return true;
};

const applyBomberItemToPlayer = (player: Player, itemId: BomberItemId) => {
  switch (itemId) {
    case 'fire_up':
      player.fireLevel = Math.min(BOMBER_MAX_FIRE_LEVEL, (player.fireLevel || 0) + 1);
      player.bombRange = 2 + player.fireLevel;
      break;
    case 'kick_bomb':
      player.hasKickBomb = true;
      break;
    case 'shield':
      player.hasShield = true;
      break;
    case 'remote_bomb':
      player.hasRemoteBomb = true;
      break;
    case 'pierce_fire':
      player.hasPierceFire = true;
      break;
    case 'speed_up':
      player.moveSpeedLevel = Math.min(BOMBER_MAX_SPEED_LEVEL, (player.moveSpeedLevel || 0) + 1);
      break;
    default:
      break;
  }
};

const collectPlayerBomberItems = (player: Player): BomberItemId[] => {
  const drops: BomberItemId[] = [];
  for (let i = 0; i < (player.fireLevel || 0); i += 1) {
    drops.push('fire_up');
  }
  if (player.hasKickBomb) drops.push('kick_bomb');
  if (player.hasShield) drops.push('shield');
  if (player.hasRemoteBomb) drops.push('remote_bomb');
  if (player.hasPierceFire) drops.push('pierce_fire');
  for (let i = 0; i < (player.moveSpeedLevel || 0); i += 1) {
    drops.push('speed_up');
  }
  return drops;
};

const resetBomberItems = (player: Player) => {
  player.fireLevel = 0;
  player.hasKickBomb = false;
  player.hasShield = false;
  player.hasRemoteBomb = false;
  player.hasPierceFire = false;
  player.moveSpeedLevel = 0;
  player.bombRange = 2;
};

const recomputeColorTerritory = (room: Room) => {
  if (!room.bomberState?.cellOwners) return;
  const counts: Record<string, number> = {};
  room.bomberState.cellOwners.forEach((row) => {
    row.forEach((ownerId) => {
      if (!ownerId) return;
      counts[ownerId] = (counts[ownerId] || 0) + 1;
    });
  });
  Object.values(room.players).forEach((player) => {
    player.territoryCells = counts[player.id] || 0;
  });
};

const scatterDroppedItems = (room: Room, itemIds: BomberItemId[], around?: { x: number; y: number }) => {
  if (!room.bomberState || itemIds.length === 0) return;
  const used = new Set<string>(
    room.bomberState.itemDrops.map((drop) => `${drop.x},${drop.y}`)
  );
  const localCandidates: { x: number; y: number }[] = [];
  if (around) {
    for (let radius = 1; radius <= 5; radius += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const x = around.x + dx;
          const y = around.y + dy;
          if (!isFloorWithoutBomb(room, x, y)) continue;
          if (used.has(`${x},${y}`)) continue;
          localCandidates.push({ x, y });
        }
      }
    }
  }
  itemIds.forEach((itemId) => {
    let target = localCandidates.pop();
    if (!target) {
      target = randomFloorPosition(room.bomberState!.grid, used);
      if (!isFloorWithoutBomb(room, target.x, target.y)) return;
    }
    const key = `${target.x},${target.y}`;
    if (used.has(key)) return;
    used.add(key);
    room.bomberState!.itemDrops.push({
      id: `drop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      itemId,
      x: target.x,
      y: target.y,
    });
  });
};

const defeatBomberPlayer = (room: Room, player: Player, owner?: Player | null, now = Date.now()) => {
  if (!player.alive) return;

  if (player.hasShield) {
    player.hasShield = false;
    return;
  }

  const dropX = player.bomberX;
  const dropY = player.bomberY;
  const droppedItems = collectPlayerBomberItems(player);
  resetBomberItems(player);
  scatterDroppedItems(room, droppedItems, { x: dropX, y: dropY });

  player.alive = false;
  player.deaths += 1;
  player.respawnAt = now + BOMBER_RESPAWN_MS;
  player.bomberX = player.bomberSpawnX;
  player.bomberY = player.bomberSpawnY;
  if (owner && owner.id !== player.id) {
    owner.kills += 1;
  }
};

const createBomberState = (players: Player[]): BomberState => {
  const { width, height } = getBomberDimensions(players.length);
  const grid = createBomberGrid(width, height);
  const used = new Set<string>();

  players.forEach((player) => {
    const spawn = randomFloorPosition(grid, used);
    clearBomberSpawnArea(grid, spawn.x, spawn.y);
    used.add(`${spawn.x},${spawn.y}`);
    player.bomberX = spawn.x;
    player.bomberY = spawn.y;
    player.bomberSpawnX = spawn.x;
    player.bomberSpawnY = spawn.y;
  });

  return {
    width,
    height,
    grid,
    bombs: [],
    explosions: [],
    itemDrops: [],
    cellOwners: Array.from({ length: height }, () => Array.from({ length: width }, () => null)),
  };
};

const isBomberCellBlocked = (room: Room, x: number, y: number) => {
  const grid = room.bomberState?.grid;
  if (!grid || !grid[y] || !grid[y][x]) return true;
  if (grid[y][x] !== 'floor') return true;
  return Boolean(room.bomberState?.bombs.some((bomb) => bomb.x === x && bomb.y === y));
};

const tryKickBomb = (room: Room, bomb: BomberBomb, dx: number, dy: number) => {
  const nextX = bomb.x + dx;
  const nextY = bomb.y + dy;
  if (!isFloorWithoutBomb(room, nextX, nextY)) return false;
  bomb.x = nextX;
  bomb.y = nextY;
  bomb.movingDx = dx;
  bomb.movingDy = dy;
  return true;
};

const advanceRoomMovingBombs = (room: Room) => {
  if (!room.bomberState) return;
  room.bomberState.bombs = room.bomberState.bombs.map((bomb, index, bombs) => {
    if (!bomb.movingDx && !bomb.movingDy) return bomb;
    const nextX = bomb.x + (bomb.movingDx || 0);
    const nextY = bomb.y + (bomb.movingDy || 0);
    const blocked =
      !room.bomberState?.grid[nextY]?.[nextX] ||
      room.bomberState.grid[nextY][nextX] !== 'floor' ||
      bombs.some((otherBomb, otherIndex) => otherIndex !== index && otherBomb.x === nextX && otherBomb.y === nextY);
    if (blocked) {
      return { ...bomb, movingDx: 0, movingDy: 0 };
    }
    return { ...bomb, x: nextX, y: nextY };
  });
};

const buildExplosionCells = (room: Room, originX: number, originY: number, range: number, pierce = false) => {
  const cells: { x: number; y: number }[] = [{ x: originX, y: originY }];
  const grid = room.bomberState?.grid;
  if (!grid) return cells;

  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];

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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getDodgeSpawnPoints = (playerCount: number, width = DODGE_WIDTH, height = DODGE_HEIGHT) => {
  const cols = Math.max(2, Math.ceil(Math.sqrt(playerCount * (16 / 9))));
  const rows = Math.max(2, Math.ceil(playerCount / cols));
  const marginX = 90;
  const marginY = 70;
  const usableWidth = width - marginX * 2;
  const usableHeight = height - marginY * 2;
  const points: { x: number; y: number }[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      points.push({
        x: marginX + (usableWidth * (col + 0.5)) / cols,
        y: marginY + (usableHeight * (row + 0.5)) / rows,
      });
    }
  }

  return points;
};

const assignDodgeSpawnPositions = (room: Room, players: Player[]) => {
  const width = room.dodgeState?.width ?? DODGE_WIDTH;
  const height = room.dodgeState?.height ?? DODGE_HEIGHT;
  if (isTeamDodgeMode(room)) {
    const left = players.filter((player) => getDodgeTeamSide(player.teamId) === 'left');
    const right = players.filter((player) => getDodgeTeamSide(player.teamId) === 'right');
    const layoutTeam = (members: Player[], isRight: boolean) => {
      const lanes = Math.max(1, members.length);
      members.forEach((player, index) => {
        const y = ((index + 1) / (lanes + 1)) * height;
        const x = isRight ? width * 0.75 : width * 0.25;
        player.x = x;
        player.y = y;
        player.dodgeFacing = isRight ? 'left' : 'right';
        player.dodgeRole = 'infield';
        player.dodgeReadyToAssist = false;
        player.dodgeMoveDirection = null;
        player.dodgeMoveVector = null;
        player.dodgeAimVector = null;
        player.dodgeRunupStartedAt = null;
        player.dodgeInvulnerableUntil = Date.now() + 800;
      });
    };
    layoutTeam(left, false);
    layoutTeam(right, true);
    return;
  }

  const points = getDodgeSpawnPoints(players.length || 1, width, height).sort(() => Math.random() - 0.5);
  players.forEach((player, index) => {
    const point = points[index] || { x: width / 2, y: height / 2 };
    player.x = point.x;
    player.y = point.y;
    player.dodgeFacing = point.x < width / 2 ? 'right' : 'left';
    player.dodgeRole = 'infield';
    player.dodgeReadyToAssist = false;
    player.dodgeMoveDirection = null;
    player.dodgeMoveVector = null;
    player.dodgeAimVector = null;
    player.dodgeRunupStartedAt = null;
    player.dodgeInvulnerableUntil = Date.now() + 800;
  });
};

const createDodgeState = (room: Room, players: Player[]): DodgeState => {
  const court = getDodgeCourtSize(players.length);
  const now = Date.now();
  room.dodgeState = {
    width: court.width,
    height: court.height,
    playerRadius: DODGE_PLAYER_RADIUS,
    balls: [],
    lastBallOwnerAddedAt: now,
  };
  assignDodgeSpawnPositions(room, players);
  players.forEach((player) => {
    player.dodgeHasBall = false;
    player.dodgeValue = 0;
  });
  const starter = players[Math.floor(Math.random() * players.length)];
  if (starter) {
    starter.dodgeHasBall = true;
  }
  return {
    width: court.width,
    height: court.height,
    playerRadius: DODGE_PLAYER_RADIUS,
    balls: [],
    lastBallOwnerAddedAt: now,
  };
};

const addRandomBallOwner = (room: Room) => {
  const candidates = Object.values(room.players).filter((player) => player.alive && !player.dodgeHasBall);
  if (candidates.length === 0) return;
  const nextOwner = candidates[Math.floor(Math.random() * candidates.length)];
  nextOwner.dodgeHasBall = true;
};

const handBallToInfieldPlayer = (room: Room, sourceTeamId?: number | null) => {
  const infieldCandidates = Object.values(room.players).filter((player) => {
    if (!player.alive || player.dodgeRole !== 'infield') return false;
    if (!isTeamDodgeMode(room)) return true;
    return player.teamId === sourceTeamId;
  });
  if (infieldCandidates.length === 0) return;
  const nextOwner = infieldCandidates[Math.floor(Math.random() * infieldCandidates.length)];
  nextOwner.dodgeHasBall = true;
};

const redistributeMissedDodgeBall = (room: Room, lastOwnerId: string) => {
  const lastOwner = room.players[lastOwnerId];
  const allAlivePlayers = Object.values(room.players).filter((player) => player.alive);
  if (allAlivePlayers.length === 0) return;

  const pickRandomEligible = (players: Player[]) => {
    const withoutBall = players.filter((player) => !player.dodgeHasBall);
    const pool = withoutBall.length > 0 ? withoutBall : players;
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)] || null;
  };

  if (!isTeamDodgeMode(room) || !lastOwner?.teamId) {
    const nextOwner = pickRandomEligible(allAlivePlayers);
    if (nextOwner) nextOwner.dodgeHasBall = true;
    return;
  }

  const enemyCandidates = allAlivePlayers.filter((player) => player.teamId != null && player.teamId !== lastOwner.teamId);
  const nextOwner = pickRandomEligible(enemyCandidates.length > 0 ? enemyCandidates : allAlivePlayers);
  if (nextOwner) nextOwner.dodgeHasBall = true;
};

const respawnDodgePlayer = (room: Room, player: Player) => {
  if (!room.dodgeState) return;
  const { width, height } = room.dodgeState;
  if (isTeamDodgeMode(room)) {
    const point = getDodgeOutfieldPoint(player, width, height);
    player.x = point.x;
    player.y = point.y;
    player.alive = true;
    player.respawnAt = null;
    player.dodgeRole = 'outfield';
    player.dodgeReadyToAssist = false;
    player.dodgeMoveDirection = null;
    player.dodgeMoveVector = null;
    player.dodgeAimVector = null;
    player.dodgeRunupStartedAt = null;
    player.dodgeInvulnerableUntil = Date.now() + 600;
    player.dodgeFacing = getDodgeTeamSide(player.teamId) === 'right' ? 'left' : 'right';
    return;
  }
  const point = getSingleDodgeOutfieldPoint(width, height);
  player.x = point.x;
  player.y = point.y;
  player.alive = true;
  player.respawnAt = null;
  player.dodgeRole = 'outfield';
  player.dodgeReadyToAssist = true;
  player.dodgeMoveDirection = null;
  player.dodgeMoveVector = null;
  player.dodgeAimVector = null;
  player.dodgeRunupStartedAt = null;
  player.dodgeInvulnerableUntil = Date.now() + 1200;
  player.dodgeFacing = point.x < width / 2 ? 'right' : 'left';
};

const defeatDodgePlayer = (room: Room, player: Player, owner: Player | null, ballId: string, now: number) => {
  if (!room.dodgeState || !player.alive) return;
  if (isTeamDodgeMode(room)) {
    if (player.dodgeRole === 'infield') {
      player.dodgeRole = 'outfield';
      player.dodgeReadyToAssist = false;
      const point = getDodgeOutfieldPoint(player, room.dodgeState.width, room.dodgeState.height);
      player.x = point.x;
      player.y = point.y;
      player.alive = true;
      player.respawnAt = null;
      player.dodgeInvulnerableUntil = now + 500;
    } else {
      player.alive = false;
      player.respawnAt = now + DODGE_RESPAWN_MS;
    }
  } else {
    if (player.dodgeRole === 'infield') {
      const point = getSingleDodgeOutfieldPoint(room.dodgeState.width, room.dodgeState.height);
      player.x = point.x;
      player.y = point.y;
      player.dodgeRole = 'outfield';
      player.dodgeReadyToAssist = true;
      player.alive = true;
      player.respawnAt = null;
      player.dodgeInvulnerableUntil = now + 500;
    } else {
      player.alive = false;
      player.respawnAt = now + DODGE_RESPAWN_MS;
    }
  }
  player.deaths += 1;
  player.dodgeMoveDirection = null;
  player.dodgeMoveVector = null;
  player.dodgeAimVector = null;
  player.dodgeRunupStartedAt = null;
  player.dodgeInvulnerableUntil = null;
  if (owner && owner.id !== player.id) {
    owner.kills += 1;
  }
  room.dodgeState.balls = room.dodgeState.balls.filter((ball) => ball.id !== ballId);
};

const resolveTeamDodgeWinner = (room: Room) => {
  if (!isTeamDodgeMode(room)) return null;
  const infieldByTeam = [1, 2].map((teamId) =>
    Object.values(room.players).filter((player) => player.teamId === teamId && player.dodgeRole === 'infield').length
  );
  if (infieldByTeam[0] === 0 && infieldByTeam[1] > 0) return 2;
  if (infieldByTeam[1] === 0 && infieldByTeam[0] > 0) return 1;
  return null;
};

const restoreSingleDodgeInfieldIfEmpty = (room: Room, now: number) => {
  if (isTeamDodgeMode(room) || !isDodgeGameType(room.gameType)) return;
  const players = Object.values(room.players).filter((player) => player.alive);
  const infieldPlayers = players.filter((player) => player.dodgeRole === 'infield');
  if (infieldPlayers.length > 0) return;

  const outfieldPlayers = players.filter((player) => player.dodgeRole === 'outfield');
  if (outfieldPlayers.length === 0) return;
  const width = room.dodgeState?.width ?? DODGE_WIDTH;
  const height = room.dodgeState?.height ?? DODGE_HEIGHT;
  const points = getDodgeSpawnPoints(outfieldPlayers.length || 1, width, height).sort(() => Math.random() - 0.5);
  outfieldPlayers.forEach((player, index) => {
    const point = points[index] || { x: width / 2, y: height / 2 };
    player.x = point.x;
    player.y = point.y;
    player.dodgeFacing = point.x < width / 2 ? 'right' : 'left';
    player.dodgeRole = 'infield';
    player.dodgeReadyToAssist = false;
    player.dodgeMoveDirection = null;
    player.dodgeMoveVector = null;
    player.dodgeAimVector = null;
    player.dodgeRunupStartedAt = null;
    player.dodgeInvulnerableUntil = now + 700;
  });
};

const getDodgeMoveVector = (direction: Player['dodgeMoveDirection']) => {
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

const getNormalizedDodgeMoveVector = (vector: Player['dodgeMoveVector']): { x: number; y: number } => {
  if (!vector) return { x: 0, y: 0 };
  const length = Math.hypot(vector.x, vector.y);
  if (!length) return { x: 0, y: 0 };
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
};

const updateDodgeRunupState = (player: Player, isMoving: boolean, now: number) => {
  if (!isMoving) {
    player.dodgeRunupStartedAt = null;
    return;
  }
  if (!player.dodgeRunupStartedAt) {
    player.dodgeRunupStartedAt = now;
  }
};

const resetPlayerState = (player: Player, options?: { preserveTeam?: boolean }) => {
  player.holesCompleted = 0;
  player.totalStrokes = 0;
  player.currentStrokes = 0;
  player.correctAnswers = 0;
  player.quizPoints = 0;
  player.quizCombo = 0;
  player.maxQuizCombo = 0;
  player.fastestAnswerMs = null;
  player.lastQuestionIssuedAt = null;
  player.quizLives = 0;
  player.battleRoyaleWins = 0;
  player.currentBattlePairId = null;
  player.currentBattlePairIds = [];
  player.canShoot = false;
  player.x = 100;
  player.y = 100;
  player.currentQuestion = undefined;
  player.items = [];
  player.activeItemId = null;
  player.pendingItemChoices = null;
  player.shotsRemaining = 0;
  if (!options?.preserveTeam) {
    player.teamId = null;
  }
  player.bomberX = 1;
  player.bomberY = 1;
  player.bomberSpawnX = 1;
  player.bomberSpawnY = 1;
  player.alive = true;
  player.respawnAt = null;
  player.kills = 0;
  player.blocksDestroyed = 0;
  player.deaths = 0;
  player.timeAliveMs = 0;
  player.bombsAvailable = 1;
  player.bombRange = 2;
  player.fireLevel = 0;
  player.hasKickBomb = false;
  player.hasShield = false;
  player.hasRemoteBomb = false;
  player.hasPierceFire = false;
  player.moveSpeedLevel = 0;
  player.territoryCells = 0;
  player.lastBomberMoveAt = 0;
  player.lastBroadcastX = 100;
  player.lastBroadcastY = 100;
  player.lastBroadcastAt = 0;
  player.dodgeValue = 0;
  player.dodgeHasBall = false;
  player.dodgeFacing = 'right';
  player.dodgeMoveDirection = null;
  player.dodgeMoveVector = null;
  player.dodgeAimVector = null;
  player.dodgeInvulnerableUntil = null;
  player.lastDodgeThrowAt = 0;
  player.dodgeRunupStartedAt = null;
  player.dodgeRole = 'infield';
  player.dodgeReadyToAssist = false;
};

const emitPersonalQuestion = (io: Server, player: Player) => {
  if (!player.currentQuestion) return;
  player.lastQuestionIssuedAt = Date.now();
  io.to(player.id).emit('personalQuestion', {
    text: player.currentQuestion.text,
    options: player.currentQuestion.options,
    hint: player.currentQuestion.hint,
    visual: player.currentQuestion.visual,
    audioPrompt: player.currentQuestion.audioPrompt,
    speechPrompt: player.currentQuestion.speechPrompt,
  });
};

const pairBattleRoyalePlayers = (players: Player[]) => {
  const shuffled = [...players].sort((a, b) => {
    if (a.quizLives !== b.quizLives) return a.quizLives - b.quizLives;
    return Math.random() - 0.5;
  });
  const pairs: Player[][] = [];
  if (shuffled.length % 2 === 1 && shuffled.length >= 3) {
    const strongest = shuffled.pop();
    const weakest = shuffled.shift();
    const secondWeakest = shuffled.shift();
    if (strongest && weakest && secondWeakest) {
      pairs.push([strongest, weakest, secondWeakest]);
    }
  }
  for (let index = 0; index < shuffled.length; index += 2) {
    pairs.push(shuffled.slice(index, index + 2));
  }
  return pairs;
};

const buildBattleRoyaleQuestionPayload = (question: any) => question
  ? {
      text: question.text,
      options: question.options,
      hint: question.hint,
      visual: question.visual,
      audioPrompt: question.audioPrompt,
      speechPrompt: question.speechPrompt,
    }
  : null;

const resolveBattleRoyalePair = (room: Room, pair: NonNullable<Room['quizBattlePairs']>[number], reason: 'answered' | 'timeout') => {
  if (pair.resolved) return;

  const answerMap = pair.answers || {};
  const players = pair.playerIds
    .map((playerId) => ({
      player: room.players[playerId],
      answer: answerMap[playerId],
    }))
    .filter((entry) => entry.player);

  const correctEntries = players
    .filter((entry) => entry.answer?.correct)
    .sort((a, b) => (a.answer!.answeredAt - b.answer!.answeredAt));

  pair.resolved = true;

  if (correctEntries.length > 0) {
    const winner = correctEntries[0].player;
    pair.winnerId = winner.id;
    pair.loserIds = pair.playerIds.filter((playerId) => playerId !== winner.id);
    winner.correctAnswers += 1;
    winner.quizPoints += 180;
    winner.battleRoyaleWins += 1;
    pair.loserIds.forEach((loserId) => {
      const loser = room.players[loserId];
      if (!loser) return;
      loser.quizLives -= 1;
      loser.currentQuestion = undefined;
    });
    winner.currentQuestion = undefined;
    pair.resultLabel = pair.playerIds.length >= 3
      ? `${winner.name} が3人勝負を制した`
      : `${winner.name} の勝利`;
    return;
  }

  pair.winnerId = null;
  pair.loserIds = [...pair.playerIds];
  pair.playerIds.forEach((playerId) => {
    const player = room.players[playerId];
    if (!player) return;
    player.quizLives -= 1;
    player.currentQuestion = undefined;
  });
  pair.resultLabel = reason === 'timeout' ? '時間切れで全員敗北' : '全員不正解で敗北';
};

const assignRandomTeams = (room: Room, requestedTeamCount?: number) => {
  const players = Object.values(room.players);
  if (players.length === 0) {
    room.teamCount = Math.max(2, Math.min(10, requestedTeamCount || room.teamCount || 2));
    room.teamNames = {};
    return;
  }

  const teamCount = Math.max(2, Math.min(10, requestedTeamCount || room.teamCount || 2, players.length));
  room.teamCount = teamCount;

  const shuffled = [...players].sort(() => Math.random() - 0.5);
  shuffled.forEach((player, index) => {
    player.teamId = (index % teamCount) + 1;
  });

  room.teamNames = {};
  for (let teamId = 1; teamId <= teamCount; teamId += 1) {
    const teamMembers = Object.values(room.players)
      .filter((player) => player.teamId === teamId)
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    room.teamNames[teamId] = teamMembers.map((player) => getTeamInitial(player.name)).join('') || `Team ${teamId}`;
  }
};

const prepareRoomForGame = (room: Room, mode: string, timeLimit?: number, questions?: any[], options?: { preserveTeams?: boolean }) => {
  if (room.teamMode && options?.preserveTeams) {
    const hasMissingTeam = Object.values(room.players).some((player) => player.teamId == null);
    if (hasMissingTeam) {
      assignRandomTeams(room, room.teamCount);
    }
  }

  room.state = 'playing';
  room.questionMode = mode;
  room.timeLimit = timeLimit || 300;
  room.timeRemaining = room.timeLimit;
  room.questions = questions;
  room.shotsPerQuestion = room.shotsPerQuestion || 3;
  room.bomberState = null;
  room.dodgeState = null;
  room.dodgeWinnerTeamId = null;
  room.quizBattlePairs = [];
  room.quizBattleRound = 0;
  room.quizBattlePhase = undefined;
  if (room.gameType === 'quiz' && room.quizVariant === 'boss') {
    const playerCount = Math.max(1, Object.keys(room.players).length);
    room.bossMaxHp = 1500 + playerCount * 500;
    room.bossHp = room.bossMaxHp;
  } else {
    room.bossMaxHp = undefined;
    room.bossHp = undefined;
  }

  Object.values(room.players).forEach((player) => {
    resetPlayerState(player, { preserveTeam: options?.preserveTeams });
    player.currentQuestion = getQuestionForRoom(room);
  });

  if (isBomberGameType(room.gameType)) {
    room.bomberState = createBomberState(Object.values(room.players));
  }
  if (isDodgeGameType(room.gameType)) {
    room.dodgeState = createDodgeState(room, Object.values(room.players));
  }
};

const beginBattleRoyaleRevealPhase = (io: Server, roomId: string) => {
  const room = rooms[roomId];
  if (!room || !isQuizBattleRoyale(room) || room.state !== 'playing') return;
  const pairs = room.quizBattlePairs || [];
  if (pairs.some((pair) => !pair.resolved)) return;

  room.quizBattlePhase = 'reveal';
  room.timeRemaining = 4;
  io.to(roomId).emit('roomStateUpdate', room);

  setTimeout(() => {
    const latestRoom = rooms[roomId];
    if (!latestRoom || !isQuizBattleRoyale(latestRoom) || latestRoom.state !== 'playing') return;
    if (latestRoom.quizBattlePhase !== 'reveal') return;
    latestRoom.quizBattlePhase = 'result';
    latestRoom.timeRemaining = 3;
    io.to(roomId).emit('roomStateUpdate', latestRoom);
    setTimeout(() => finalizeBattleRoyaleRoundIfNeeded(io, roomId), 3000);
  }, 4000);
};

const finalizeBattleRoyaleRoundIfNeeded = (io: Server, roomId: string) => {
  const room = rooms[roomId];
  if (!room || !isQuizBattleRoyale(room) || room.state !== 'playing') return;
  const pairs = room.quizBattlePairs || [];
  if (pairs.some((pair) => !pair.resolved)) return;

  const survivors = Object.values(room.players).filter((player) => player.quizLives > 0);
  if (survivors.length <= 1) {
    room.state = 'results';
    io.to(roomId).emit('roomStateUpdate', room);
    return;
  }

  const nextRound = (room.quizBattleRound || 0) + 1;
  room.quizBattleRound = nextRound;
  room.quizBattlePhase = 'matchup';
  room.timeRemaining = 3;
  room.quizBattlePairs = [];
  Object.values(room.players).forEach((player) => {
    player.currentQuestion = undefined;
    player.currentBattlePairId = null;
    player.currentBattlePairIds = [];
  });

  const groups = pairBattleRoyalePlayers(Object.values(room.players));
  const sharedBattleQuestion = getQuestionForRoom(room);

  groups.forEach((group, index) => {
    const pairId = `battle-${nextRound}-${index}`;
    const question = group.length >= 2 ? sharedBattleQuestion : null;
    room.quizBattlePairs?.push({
      id: pairId,
      playerIds: group.map((player) => player.id),
      primaryPlayerId: group.length >= 3 ? group[0].id : null,
      winnerId: group.length === 1 ? group[0].id : null,
      loserIds: [],
      resolved: group.length === 1,
      question,
      answerCounts: question?.options?.map(() => 0) || [],
      answers: {},
      resultLabel: group.length === 1 ? '不戦勝' : '',
    });
    group.forEach((player) => {
      player.currentBattlePairId = pairId;
      player.currentBattlePairIds = [pairId];
      player.currentQuestion = question || undefined;
    });
    if (group.length === 1) {
      group[0].quizPoints += 30;
    }
  });

  io.to(roomId).emit('roomStateUpdate', room);

  const scheduledRound = nextRound;
  setTimeout(() => {
    const latestRoom = rooms[roomId];
    if (!latestRoom || !isQuizBattleRoyale(latestRoom) || latestRoom.state !== 'playing') return;
    if (latestRoom.quizBattleRound !== scheduledRound) return;

    latestRoom.quizBattlePhase = 'question';
    latestRoom.timeRemaining = latestRoom.quizBattleQuestionLimit || 10;
    Object.values(latestRoom.players).forEach((player) => {
      if (player.currentQuestion) {
        emitPersonalQuestion(io, player);
      }
    });
    io.to(roomId).emit('roomStateUpdate', latestRoom);

    const battleTimer = setInterval(() => {
      const timerRoom = rooms[roomId];
      if (!timerRoom || !isQuizBattleRoyale(timerRoom) || timerRoom.state !== 'playing' || timerRoom.quizBattleRound !== scheduledRound) {
        clearInterval(battleTimer);
        return;
      }
      timerRoom.timeRemaining = Math.max(0, (timerRoom.timeRemaining || 0) - 1);
      io.to(roomId).emit('timeUpdate', timerRoom.timeRemaining);
      if (timerRoom.timeRemaining <= 0) {
        clearInterval(battleTimer);
        (timerRoom.quizBattlePairs || []).forEach((pair) => {
          if (pair.resolved || pair.playerIds.length < 2) return;
          resolveBattleRoyalePair(timerRoom, pair, 'timeout');
        });
        io.to(roomId).emit('roomStateUpdate', timerRoom);
        beginBattleRoyaleRevealPhase(io, roomId);
      }
    }, 1000);
  }, 2200);
};

const resetRoomToWaiting = (room: Room) => {
  room.state = 'waiting';
  room.timeRemaining = room.timeLimit || 300;
  room.questions = undefined;
  room.teamNames = {};
  room.bomberState = null;
  room.dodgeState = null;
  room.bossHp = undefined;
  room.bossMaxHp = undefined;
  Object.values(room.players).forEach((player) => resetPlayerState(player));
};

const simulatePseudoPlayersLoad = (room: Room) => {
  const pseudoPlayers = Object.values(room.players).filter((player) => player.isPseudo);
  if (pseudoPlayers.length === 0) return;

  pseudoPlayers.forEach((player) => {
    // 疑似的なCPU負荷を発生させる（参加人数に比例）
    let accumulator = 0;
    for (let i = 0; i < 180; i += 1) {
      accumulator += Math.sin((i + 1) * 0.13) * Math.cos((i + 1) * 0.07);
    }

    if (room.gameType === 'quiz') {
      if (Math.random() < 0.68) {
        player.correctAnswers += 1;
        if (room.quizVariant === 'combo') {
          player.quizCombo += 1;
          player.maxQuizCombo = Math.max(player.maxQuizCombo, player.quizCombo);
          player.quizPoints += 100 + (player.quizCombo - 1) * 25;
        } else if (room.quizVariant === 'speed') {
          player.quizPoints += 140;
          player.fastestAnswerMs = player.fastestAnswerMs == null ? 1200 : Math.min(player.fastestAnswerMs, 1200);
        } else if (room.quizVariant === 'boss') {
          const damage = 95;
          player.quizPoints += damage;
          room.bossHp = Math.max(0, (room.bossHp || room.bossMaxHp || 0) - damage);
        } else {
          player.quizPoints += 100;
        }
      } else if (room.quizVariant === 'combo') {
        player.quizCombo = 0;
      }
      player.currentQuestion = getQuestionForRoom(room);
      return;
    }

    if (isBomberGameType(room.gameType)) {
      player.timeAliveMs += 850;
      player.blocksDestroyed += Math.random() < 0.45 ? 1 : 0;
      player.kills += Math.random() < 0.18 ? 1 : 0;
      player.deaths += Math.random() < 0.14 ? 1 : 0;
      player.currentQuestion = getQuestionForRoom(room);
      return;
    }

    if (isDodgeGameType(room.gameType)) {
      player.timeAliveMs += 900;
      player.kills += Math.random() < 0.22 ? 1 : 0;
      player.deaths += Math.random() < 0.2 ? 1 : 0;
      player.currentQuestion = getQuestionForRoom(room);
      return;
    }

    // golf など
    const strokes = 2 + Math.floor(Math.random() * 5);
    player.currentStrokes += 1;
    player.totalStrokes += strokes;
    player.holesCompleted += Math.random() < 0.35 ? 1 : 0;
    player.canShoot = accumulator > -9999;
  });

  if (room.gameType === 'quiz' && room.quizVariant === 'boss' && (room.bossHp || 0) <= 0) {
    room.state = 'results';
  }
};

const startRoomTimer = (io: Server, roomId: string) => {
  const timerInterval = setInterval(() => {
    if (rooms[roomId] && rooms[roomId].state === 'playing') {
      simulatePseudoPlayersLoad(rooms[roomId]);
      rooms[roomId].timeRemaining -= 1;
      io.to(roomId).emit('timeUpdate', rooms[roomId].timeRemaining);
      io.to(roomId).emit('roomStateUpdate', rooms[roomId]);

      if (rooms[roomId].timeRemaining <= 0) {
        clearInterval(timerInterval);
        rooms[roomId].state = 'results';
        io.to(roomId).emit('roomStateUpdate', rooms[roomId]);
      }
    } else {
      clearInterval(timerInterval);
    }
  }, 1000);
};

const explodeBomb = (room: Room, bomb: BomberBomb, now: number) => {
  if (!room.bomberState) return;

  room.bomberState.bombs = room.bomberState.bombs.filter((candidate) => candidate.id !== bomb.id);
  const cells = buildExplosionCells(room, bomb.x, bomb.y, bomb.range, bomb.pierce);
  room.bomberState.explosions.push({
    id: `${bomb.id}-explosion`,
    ownerId: bomb.ownerId,
    cells,
    expiresAt: now + BOMBER_EXPLOSION_MS,
  });

  const owner = room.players[bomb.ownerId];
  cells.forEach(({ x, y }) => {
    if (room.bomberState?.grid[y]?.[x] === 'breakable') {
      room.bomberState.grid[y][x] = 'floor';
      if (owner) owner.blocksDestroyed += 1;
      if (Math.random() < BOMBER_ITEM_DROP_RATE) {
        room.bomberState.itemDrops.push({
          id: `drop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          itemId: randomBomberItemId(),
          x,
          y,
        });
      }
    }
    if (isColorBomberGameType(room.gameType) && room.bomberState?.grid[y]?.[x] !== 'solid') {
      room.bomberState.cellOwners[y][x] = bomb.ownerId;
    }
  });
  if (isColorBomberGameType(room.gameType)) {
    recomputeColorTerritory(room);
  }

  const touchedBombs = room.bomberState.bombs.filter((candidate) =>
    cells.some((cell) => cell.x === candidate.x && cell.y === candidate.y)
  );
  touchedBombs.forEach((candidate) => {
    candidate.explodeAt = Math.min(candidate.explodeAt, now);
  });

  Object.values(room.players).forEach((player) => {
    if (!player.alive) return;
    const hit = cells.some((cell) => cell.x === player.bomberX && cell.y === player.bomberY);
    if (!hit) return;
    if (roomUsesTeams(room) && !room.bomberFriendlyFire && owner && player.teamId && owner.teamId && player.teamId === owner.teamId) {
      return;
    }

    defeatBomberPlayer(room, player, bomb.ownerId !== player.id ? owner : null, now);
  });
};

const startBomberLoop = (io: Server, roomId: string) => {
  const interval = setInterval(() => {
    const room = rooms[roomId];
    if (!room || room.state !== 'playing' || !isBomberGameType(room.gameType) || !room.bomberState) {
      clearInterval(interval);
      return;
    }

    const now = Date.now();
    const elapsed = 100;
    advanceRoomMovingBombs(room);
    Object.values(room.players).forEach((player) => {
      if (player.alive) {
        player.timeAliveMs += elapsed;
      } else if (player.respawnAt && now >= player.respawnAt) {
        player.alive = true;
        player.respawnAt = null;
        player.bomberX = player.bomberSpawnX;
        player.bomberY = player.bomberSpawnY;
      }
    });

    Object.values(room.players).forEach((player) => {
      if (!player.alive || !room.bomberState) return;
      const pickupIndex = room.bomberState.itemDrops.findIndex(
        (drop) => drop.x === player.bomberX && drop.y === player.bomberY
      );
      if (pickupIndex === -1) return;
      const [pickup] = room.bomberState.itemDrops.splice(pickupIndex, 1);
      if (!pickup) return;
      applyBomberItemToPlayer(player, pickup.itemId);
    });

    const dueBombs = room.bomberState.bombs.filter((bomb) => bomb.explodeAt <= now);
    dueBombs.forEach((bomb) => explodeBomb(room, bomb, now));
    room.bomberState.explosions = room.bomberState.explosions.filter((explosion) => explosion.expiresAt > now);
    io.to(roomId).emit('roomStateUpdate', room);
  }, 100);
};

const startDodgeLoop = (io: Server, roomId: string) => {
  const interval = setInterval(() => {
    const room = rooms[roomId];
    if (!room || room.state !== 'playing' || !isDodgeGameType(room.gameType) || !room.dodgeState) {
      clearInterval(interval);
      return;
    }

    const now = Date.now();
    let hasWinner = false;
    const dt = 0.1;
    const { width, height, playerRadius } = room.dodgeState;
    if (room.dodgeState.lastBallOwnerAddedAt + DODGE_BALL_OWNER_ADD_INTERVAL_MS <= now) {
      addRandomBallOwner(room);
      room.dodgeState.lastBallOwnerAddedAt = now;
    }

    Object.values(room.players).forEach((player) => {
      if (player.alive) {
        player.timeAliveMs += 100;
        const move = player.dodgeMoveVector
          ? getNormalizedDodgeMoveVector(player.dodgeMoveVector)
          : getDodgeMoveVector(player.dodgeMoveDirection);
        const range = getDodgeInfieldRange(room, player);
        const nextX = clamp(player.x + move.x * DODGE_MOVE_SPEED * dt, range.minX, range.maxX);
        const nextY = clamp(player.y + move.y * DODGE_MOVE_SPEED * dt, range.minY ?? playerRadius, range.maxY ?? height - playerRadius);
        if (!isTeamDodgeMode(room) && player.dodgeRole === 'outfield') {
          const clamped = clampSingleDodgeOutfieldPosition(nextX, nextY, width, height);
          player.x = clamped.x;
          player.y = clamped.y;
        } else {
          player.x = nextX;
          player.y = nextY;
        }
      } else if (player.respawnAt && now >= player.respawnAt) {
        respawnDodgePlayer(room, player);
      }
    });

    room.dodgeState.balls = room.dodgeState.balls.filter((ball) => {
      if (ball.expiresAt <= now) return false;
      const ageMs = now - (ball.spawnedAt || now);
      if (ball.shotType === 'wave') {
        const magnitude = Math.sin(ageMs / 90) * 18;
        if (Math.abs(ball.vx) > Math.abs(ball.vy)) {
          ball.y += magnitude * dt;
        } else {
          ball.x += magnitude * dt;
        }
      } else if (ball.shotType === 'homing') {
        const owner = room.players[ball.ownerId];
        const enemies = Object.values(room.players).filter((player) => {
          if (!player.alive || player.id === ball.ownerId) return false;
          if (!isTeamDodgeMode(room) || !owner) return true;
          return player.teamId !== owner.teamId && player.dodgeRole === 'infield';
        });
        const target = enemies.sort((a, b) => Math.hypot(a.x - ball.x, a.y - ball.y) - Math.hypot(b.x - ball.x, b.y - ball.y))[0];
        if (target) {
          const toTarget = { x: target.x - ball.x, y: target.y - ball.y };
          const len = Math.hypot(toTarget.x, toTarget.y) || 1;
          const dir = { x: toTarget.x / len, y: toTarget.y / len };
          ball.vx = ball.vx * 0.88 + dir.x * DODGE_BALL_SPEED * 0.5;
          ball.vy = ball.vy * 0.88 + dir.y * DODGE_BALL_SPEED * 0.5;
        }
      }
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (
        ball.x < -ball.radius ||
        ball.x > width + ball.radius ||
        ball.y < -ball.radius ||
        ball.y > height + ball.radius
      ) {
        redistributeMissedDodgeBall(room, ball.ownerId);
        return false;
      }

      for (const player of Object.values(room.players)) {
        if (!player.alive || player.id === ball.ownerId) continue;
        if (isTeamDodgeMode(room)) {
          const owner = room.players[ball.ownerId];
          if (owner && owner.teamId === player.teamId) continue;
        }
        if ((player.dodgeInvulnerableUntil || 0) > now) continue;
        if (Math.hypot(player.x - ball.x, player.y - ball.y) <= playerRadius + ball.radius) {
          const owner = room.players[ball.ownerId] || null;
          if (player.dodgeRole === 'outfield' || (player.dodgeValue || 0) > (ball.dodgeValue || 0)) {
            player.dodgeHasBall = true;
            if (player.dodgeRole === 'outfield') {
              player.dodgeValue = Math.max(player.dodgeValue || 0, 1);
            }
            return false;
          }
          const wasInfieldHit = player.dodgeRole === 'infield';
          defeatDodgePlayer(room, player, owner, ball.id, now);
          handBallToInfieldPlayer(room, isTeamDodgeMode(room) ? owner?.teamId : null);
          if (
            owner?.dodgeRole === 'outfield' &&
            wasInfieldHit &&
            (isTeamDodgeMode(room) || (isDodgeGameType(room.gameType) && room.dodgeMode === 'single'))
          ) {
            owner.dodgeRole = 'infield';
            owner.dodgeReadyToAssist = false;
            owner.dodgeInvulnerableUntil = now + 700;
            owner.x = isTeamDodgeMode(room)
              ? (getDodgeTeamSide(owner.teamId) === 'right' ? width * 0.74 : width * 0.26)
              : width * (0.35 + Math.random() * 0.3);
            owner.y = clamp(owner.y, DODGE_PLAYER_RADIUS, height - DODGE_PLAYER_RADIUS);
          }
          restoreSingleDodgeInfieldIfEmpty(room, now);
          const winner = resolveTeamDodgeWinner(room);
          if (winner) {
            room.dodgeWinnerTeamId = winner;
            room.state = 'results';
            hasWinner = true;
          }
          return false;
        }
      }

      return true;
    });

    io.to(roomId).emit('roomStateUpdate', room);
    if (hasWinner) {
      clearInterval(interval);
    }
  }, 100);
};

// 四則演算の問題を生成する関数
const generateMathQuestion = (type: string) => {
  if (type === 'mix') {
    const types = ['add', 'sub', 'mul', 'div'];
    type = types[Math.floor(Math.random() * types.length)];
  }

  let num1 = 0, num2 = 0, answer = 0, text = '';
  
  switch (type) {
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
  }

  const options = new Set<number>();
  options.add(answer);
  while(options.size < 4) {
    const offset = Math.floor(Math.random() * 11) - 5;
    if (offset !== 0 && answer + offset >= 0) {
      options.add(answer + offset);
    }
  }
  
  const optionsArray = Array.from(options).sort(() => Math.random() - 0.5);
  const correctIndex = findMatchingOptionIndex(optionsArray.map(String), String(answer));

  return {
    text,
    options: optionsArray.map(String),
    correctIndex,
    correctText: String(answer),
  };
};

const getQuestionForRoom = (room: Room) => {
  if (room.questions && room.questions.length > 0) {
    const q = room.questions[Math.floor(Math.random() * room.questions.length)];
    const { correctAnswer, shuffledOptions: optionsArray } = shuffleOptionsWithFirstCorrect(q.options, q.answer);
    const correctIndex = findMatchingOptionIndex(optionsArray, correctAnswer);
    return {
      text: q.question,
      options: optionsArray,
      correctIndex,
      correctText: correctAnswer,
      hint: q.hint,
      visual: q.visual,
      audioPrompt: q.audioPrompt,
      speechPrompt: q.speechPrompt,
    };
  }
  return generateMathQuestion(room.questionMode);
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*' } });

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('createRoom', ({ gameType, debugConfig }: { gameType?: string; debugConfig?: { pseudoPlayerCount?: number; includeHostAsPseudoPlayer?: boolean } } = {}) => {
      // Generate a 6-digit numeric PIN
      const roomId = Math.floor(100000 + Math.random() * 900000).toString();
      const pseudoPlayerCount = Math.max(0, Math.min(300, Number(debugConfig?.pseudoPlayerCount) || 0));
      const includeHostAsPseudoPlayer = Boolean(debugConfig?.includeHostAsPseudoPlayer);
      rooms[roomId] = {
        id: roomId,
        hostId: socket.id,
        gameType: gameType || 'golf',
        players: {},
        state: 'waiting',
        questionMode: 'mix',
        quizVariant: 'classic',
        quizBattleLives: 3,
        quizBattleQuestionLimit: 10,
        quizBattlePhase: undefined,
        quizBattleRound: 0,
        quizBattlePairs: [],
        timeLimit: 300, // Default 5 minutes
        timeRemaining: 300,
        shotsPerQuestion: 3,
        teamMode: false,
        teamCount: 2,
        teamNames: {},
        bomberFriendlyFire: false,
        bomberState: null,
        dodgeState: null,
        dodgeMode: 'single',
        dodgeWinnerTeamId: null,
        debugPseudoPlayerCount: pseudoPlayerCount,
        debugIncludeHostAsPseudoPlayer: includeHostAsPseudoPlayer,
      };
      if (includeHostAsPseudoPlayer) {
        const hostPseudoId = `pseudo-host-${socket.id}`;
        const color = COLORS[Object.keys(rooms[roomId].players).length % COLORS.length];
        rooms[roomId].players[hostPseudoId] = createBasePlayer(hostPseudoId, 'HOST-PLAYER', color, createRandomAvatar(), true);
      }
      for (let index = 0; index < pseudoPlayerCount; index += 1) {
        const pseudoId = `pseudo-${index + 1}-${Math.random().toString(36).slice(2, 8)}`;
        const color = COLORS[Object.keys(rooms[roomId].players).length % COLORS.length];
        rooms[roomId].players[pseudoId] = createBasePlayer(pseudoId, `BOT-${String(index + 1).padStart(3, '0')}`, color, createRandomAvatar(), true);
      }
      socket.join(roomId);
      socket.emit('roomCreated', roomId);
      socket.emit('roomStateUpdate', rooms[roomId]);
    });

    socket.on('joinRoom', ({ roomId, name, avatar }) => {
      const room = rooms[roomId];
      if (room) {
        // Allow mid-game joins
        if (room.state === 'results') {
          socket.emit('error', 'Game has already ended');
          return;
        }
        socket.join(roomId);
        const color = COLORS[Object.keys(room.players).length % COLORS.length];
        room.players[socket.id] = createBasePlayer(socket.id, name, color, avatar, false);
        
        // If joining mid-game, generate an initial question for them
        if (room.state === 'teamReveal') {
          assignRandomTeams(room, room.teamCount);
        }

        if (room.state === 'playing') {
          if (isBomberGameType(room.gameType) && room.bomberState) {
            const used = new Set(
              Object.values(room.players)
                .filter((player) => player.id !== socket.id)
                .map((player) => `${player.bomberSpawnX},${player.bomberSpawnY}`)
            );
            const spawn = randomFloorPosition(room.bomberState.grid, used);
            clearBomberSpawnArea(room.bomberState.grid, spawn.x, spawn.y);
              Object.assign(room.players[socket.id], {
                bomberX: spawn.x,
                bomberY: spawn.y,
                bomberSpawnX: spawn.x,
                bomberSpawnY: spawn.y,
              alive: true,
              bombsAvailable: 1,
              bombRange: 2,
              fireLevel: 0,
              hasKickBomb: false,
              hasShield: false,
              hasRemoteBomb: false,
              hasPierceFire: false,
              moveSpeedLevel: 0,
              territoryCells: 0,
              lastBomberMoveAt: 0,
            });
          } else if (isDodgeGameType(room.gameType) && room.dodgeState) {
            const tempPlayers = Object.values(room.players);
            assignDodgeSpawnPositions(room, tempPlayers);
            Object.assign(room.players[socket.id], {
              alive: true,
              respawnAt: null,
              dodgeValue: 0,
              dodgeHasBall: false,
              dodgeMoveDirection: null,
              dodgeMoveVector: null,
              dodgeAimVector: null,
              dodgeInvulnerableUntil: Date.now() + 1200,
              dodgeRunupStartedAt: null,
              dodgeRole: 'infield',
              dodgeReadyToAssist: false,
            });
          }
          room.players[socket.id].currentQuestion = getQuestionForRoom(room);
          emitPersonalQuestion(io, room.players[socket.id]);
        }
        
        io.to(roomId).emit('roomStateUpdate', room);
      } else {
        socket.emit('error', 'Room not found');
      }
    });

    socket.on('getRoomState', (roomId) => {
      const room = rooms[roomId];
      if (room) {
        socket.emit('roomStateUpdate', room);
      }
    });

    socket.on('leaveRoom', ({ roomId }: { roomId: string }) => {
      const room = rooms[roomId];
      if (!room || !room.players[socket.id]) return;
      delete room.players[socket.id];
      if (room.state === 'teamReveal' && room.teamMode) {
        assignRandomTeams(room, room.teamCount);
      }
      io.to(roomId).emit('roomStateUpdate', room);
    });

    socket.on('startGame', ({ roomId, mode, timeLimit, questions, shotsPerQuestion, teamMode, teamCount, bomberFriendlyFire, bomberBattleMode, bomberVisualMode, quizVariant, quizBattleLives, quizBattleQuestionLimit, dodgeMode }) => {
      const room = rooms[roomId];
      if (room && room.hostId === socket.id) {
        if (room.gameType === 'bomber') {
          if (bomberVisualMode === 'color') {
            room.gameType = 'color_bomber';
          } else if (bomberBattleMode === 'team') {
            room.gameType = 'team_bomber';
          } else {
            room.gameType = 'bomber';
          }
        }
        room.shotsPerQuestion = Math.max(1, Math.min(5, Number(shotsPerQuestion) || 3));
        room.quizVariant = room.gameType === 'quiz'
          ? (['classic', 'combo', 'speed', 'team_battle', 'boss', 'battle_royale'].includes(quizVariant) ? quizVariant : 'classic')
          : room.quizVariant;
        room.quizBattleLives = Math.max(1, Math.min(5, Number(quizBattleLives) || 3));
        room.quizBattleQuestionLimit = Math.max(10, Math.min(20, Number(quizBattleQuestionLimit) || 10));
        room.teamMode = room.gameType === 'quiz'
          ? room.quizVariant === 'team_battle'
          : (isTeamBomberGameType(room.gameType) ? true : Boolean(teamMode));
        room.teamCount = Math.max(2, Math.min(10, Number(teamCount) || room.teamCount || 2));
        room.bomberFriendlyFire = Boolean(bomberFriendlyFire);
        room.dodgeMode = isDodgeGameType(room.gameType) && dodgeMode === 'team' ? 'team' : 'single';
        if (isDodgeGameType(room.gameType)) {
          room.teamMode = room.dodgeMode === 'team';
          room.teamCount = 2;
        }

        if (room.teamMode && roomUsesTeams(room)) {
          room.state = 'teamReveal';
          room.questionMode = mode;
          room.timeLimit = timeLimit || 300;
          room.timeRemaining = room.timeLimit;
          room.questions = questions;
          Object.values(room.players).forEach((player) => resetPlayerState(player));
          assignRandomTeams(room, room.teamCount);
          io.to(roomId).emit('roomStateUpdate', room);
          return;
        }

        prepareRoomForGame(room, mode, timeLimit, questions);
        if (isQuizBattleRoyale(room)) {
          Object.values(room.players).forEach((player) => {
            player.quizLives = room.quizBattleLives || 3;
          });
          finalizeBattleRoyaleRoundIfNeeded(io, roomId);
          return;
        }
        Object.values(room.players).forEach((player) => emitPersonalQuestion(io, player));
        io.to(roomId).emit('roomStateUpdate', room);
        startRoomTimer(io, roomId);
        if (isBomberGameType(room.gameType)) {
          startBomberLoop(io, roomId);
        } else if (isDodgeGameType(room.gameType)) {
          startDodgeLoop(io, roomId);
        }
      }
    });

    socket.on('reshuffleTeams', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.hostId !== socket.id || room.state !== 'teamReveal' || !room.teamMode) return;

      assignRandomTeams(room, room.teamCount);
      io.to(roomId).emit('roomStateUpdate', room);
    });

    socket.on('confirmTeamsAndStart', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.hostId !== socket.id || room.state !== 'teamReveal') return;

      prepareRoomForGame(room, room.questionMode, room.timeLimit, room.questions, { preserveTeams: true });
      Object.values(room.players).forEach((player) => emitPersonalQuestion(io, player));
      io.to(roomId).emit('roomStateUpdate', room);
      startRoomTimer(io, roomId);
      if (isBomberGameType(room.gameType)) {
        startBomberLoop(io, roomId);
      } else if (isDodgeGameType(room.gameType)) {
        startDodgeLoop(io, roomId);
      }
    });

    socket.on('returnToLobby', ({ roomId }) => {
      const room = rooms[roomId];
      if (room && room.hostId === socket.id) {
        resetRoomToWaiting(room);
        io.to(roomId).emit('roomStateUpdate', room);
      }
    });

    socket.on('updateAvatar', ({ roomId, avatar }) => {
      const room = rooms[roomId];
      const player = room?.players?.[socket.id];
      if (!room || !player) return;
      if (room.state !== 'waiting' && room.state !== 'teamReveal') return;

      player.avatar = normalizeAvatar(avatar);
      io.to(roomId).emit('roomStateUpdate', room);
    });

    socket.on('endGameEarly', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.hostId !== socket.id || room.state !== 'playing') return;

      room.state = 'results';
      io.to(roomId).emit('roomStateUpdate', room);
    });

    socket.on('closeRoom', ({ roomId }) => {
      const room = rooms[roomId];
      if (room && room.hostId === socket.id) {
        io.to(roomId).emit('error', 'Host closed the room');
        delete rooms[roomId];
      }
    });

    socket.on('submitAnswer', ({ roomId, answerIndex, isSpeechCorrect }, callback?: (payload: any) => void) => {
      console.log(`[submitAnswer] Player ${socket.id} in room ${roomId} submitted answer ${answerIndex}`);
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      
      if (room && player && player.currentQuestion) {
        const currentQuestion = player.currentQuestion;
        let nextQuestion: any = null;
        let nextDelayMs: number | null = null;
        const answerElapsedMs = player.lastQuestionIssuedAt ? Math.max(0, Date.now() - player.lastQuestionIssuedAt) : null;
        const isCorrect = typeof isSpeechCorrect === 'boolean'
          ? isSpeechCorrect
          : answerIndex === currentQuestion.correctIndex;
        console.log(`[submitAnswer] isCorrect: ${isCorrect}, correctIndex: ${currentQuestion.correctIndex}`);
        if (isQuizBattleRoyale(room)) {
          const pair = (room.quizBattlePairs || []).find((entry) => entry.id === player.currentBattlePairId);
          if (!pair || pair.resolved || room.quizBattlePhase !== 'question') {
            callback?.({ ok: false });
            return;
          }
          pair.answers = pair.answers || {};
          if (pair.answers[player.id]) {
            callback?.({ ok: true, locked: true });
            return;
          }
          if (typeof answerIndex === 'number') {
            pair.answerCounts = pair.answerCounts || currentQuestion.options.map(() => 0);
            pair.answerCounts[answerIndex] = (pair.answerCounts[answerIndex] || 0) + 1;
            pair.answers[player.id] = {
              answerIndex,
              answeredAt: Date.now(),
              correct: isCorrect,
            };
          } else {
            pair.answers[player.id] = {
              answerIndex: null,
              answeredAt: Date.now(),
              correct: isCorrect,
            };
          }

          const answeredCount = Object.keys(pair.answers).length;
          if (answeredCount >= pair.playerIds.length) {
            resolveBattleRoyalePair(room, pair, 'answered');
          }
          callback?.({
            ok: true,
            locked: true,
          });
          io.to(roomId).emit('roomStateUpdate', room);
          beginBattleRoyaleRevealPhase(io, roomId);
          return;
        }
        if (isCorrect) {
          player.correctAnswers += 1;
          if (room.gameType === 'quiz') {
            if (room.quizVariant === 'combo') {
              player.quizCombo += 1;
              player.maxQuizCombo = Math.max(player.maxQuizCombo, player.quizCombo);
              player.quizPoints += 100 + (player.quizCombo - 1) * 35;
            } else if (room.quizVariant === 'speed') {
              const speedBonus = answerElapsedMs == null ? 0 : Math.max(0, 220 - Math.floor(answerElapsedMs / 18));
              player.quizPoints += 100 + speedBonus;
              if (answerElapsedMs != null) {
                player.fastestAnswerMs = player.fastestAnswerMs == null
                  ? answerElapsedMs
                  : Math.min(player.fastestAnswerMs, answerElapsedMs);
              }
            } else if (room.quizVariant === 'team_battle') {
              player.quizPoints += 100;
            } else if (room.quizVariant === 'boss') {
              const bossDamage = 90 + Math.max(0, 40 - Math.floor((answerElapsedMs ?? 0) / 80));
              player.quizPoints += bossDamage;
              room.bossHp = Math.max(0, (room.bossHp || room.bossMaxHp || 0) - bossDamage);
              if (room.bossHp <= 0) {
                room.state = 'results';
              }
            } else {
              player.quizPoints += 100;
            }
            player.currentQuestion = getQuestionForRoom(room);
            nextQuestion = player.currentQuestion;
            nextDelayMs = 700;
          } else if (isBomberGameType(room.gameType)) {
            player.bombsAvailable = (player.bombsAvailable || 0) + 1;
            player.currentQuestion = getQuestionForRoom(room);
            nextQuestion = player.currentQuestion;
            nextDelayMs = 700;
          } else if (isDodgeGameType(room.gameType)) {
            player.dodgeValue = (player.dodgeValue || 0) + (player.dodgeRole === 'outfield' ? 3 : 1);
            if (isTeamDodgeMode(room) && player.dodgeRole === 'outfield') {
              player.dodgeReadyToAssist = true;
            }
            player.currentQuestion = getQuestionForRoom(room);
            nextQuestion = player.currentQuestion;
            nextDelayMs = 700;
          } else {
            player.canShoot = true;
            player.currentQuestion = null;
            player.shotsRemaining = room.shotsPerQuestion || 3;
          }
          if (room.gameType === 'quiz' && room.state === 'results') {
            nextQuestion = null;
            player.currentQuestion = null;
          }
          socket.emit('answerResult', {
            correct: true,
            correctIndex: currentQuestion.correctIndex,
            correctText: currentQuestion.correctText,
          });
          if ((room.gameType === 'quiz' && room.state !== 'results') || isBomberGameType(room.gameType) || isDodgeGameType(room.gameType)) {
            setTimeout(() => {
              emitPersonalQuestion(io, player);
            }, nextDelayMs || 700);
          }
        } else {
          if (room.gameType === 'quiz' && room.quizVariant === 'combo') {
            player.quizCombo = 0;
          }
          // 不正解の場合は新しい問題を生成（当てずっぽう防止）
          player.currentQuestion = getQuestionForRoom(room);
          nextQuestion = player.currentQuestion;
          nextDelayMs = 2200;
          socket.emit('answerResult', {
            correct: false,
            correctIndex: currentQuestion.correctIndex,
            correctText: currentQuestion.correctText,
          });
          setTimeout(() => {
            emitPersonalQuestion(io, player);
          }, nextDelayMs); // 正解を確認する時間を少し長めに確保
        }
        callback?.({
          ok: true,
          correct: isCorrect,
          correctIndex: currentQuestion.correctIndex,
          correctText: currentQuestion.correctText,
          nextQuestion: nextQuestion
            ? {
                text: nextQuestion.text,
                options: nextQuestion.options,
                hint: nextQuestion.hint,
                visual: nextQuestion.visual,
                audioPrompt: nextQuestion.audioPrompt,
                speechPrompt: nextQuestion.speechPrompt,
              }
            : null,
          nextDelayMs,
        });
        io.to(roomId).emit('roomStateUpdate', room);
      } else {
        console.log(`[submitAnswer] Failed: room=${!!room}, player=${!!player}, currentQuestion=${!!player?.currentQuestion}`);
        callback?.({ ok: false });
      }
    });

    socket.on('playerShot', ({ roomId, velocity }) => {
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      
      if (room && player && player.canShoot) {
        player.shotsRemaining = Math.max(0, (player.shotsRemaining || 0) - 1);
        player.canShoot = false;
        player.currentStrokes += 1;
        player.totalStrokes += 1;
        if (player.activeItemId) {
          player.items = consumeOneInventoryItem(player.items, player.activeItemId);
          player.activeItemId = null;
        }
        
        io.to(roomId).emit('playerShotUpdate', {
          playerId: socket.id,
          velocity,
        });
        
        io.to(roomId).emit('roomStateUpdate', room);
      }
    });

    socket.on('ballStopped', (roomId) => {
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      
      // ショット済み(canShoot === false) かつ 問題がない場合のみ次の問題を生成
      if (room && player && !player.canShoot && !player.currentQuestion && !player.pendingItemChoices?.length) {
        if ((player.shotsRemaining || 0) > 0) {
          player.canShoot = true;
        } else {
          player.currentQuestion = getQuestionForRoom(room);
          socket.emit('personalQuestion', {
            text: player.currentQuestion.text,
            options: player.currentQuestion.options,
            hint: player.currentQuestion.hint,
            visual: player.currentQuestion.visual,
            audioPrompt: player.currentQuestion.audioPrompt,
            speechPrompt: player.currentQuestion.speechPrompt,
          });
        }
        io.to(roomId).emit('roomStateUpdate', room);
      }
    });

    socket.on('ballMoved', ({ roomId, x, y }) => {
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      if (!room || !player || room.state !== 'playing') return;

      player.x = x;
      player.y = y;

      const now = Date.now();
      const lastX = player.lastBroadcastX ?? x;
      const lastY = player.lastBroadcastY ?? y;
      const distance = Math.hypot(x - lastX, y - lastY);
      const elapsed = now - (player.lastBroadcastAt ?? 0);

      if (distance < 3 && elapsed < 120) {
        return;
      }

      player.lastBroadcastX = x;
      player.lastBroadcastY = y;
      player.lastBroadcastAt = now;

      socket.to(roomId).emit('playerMoved', {
        playerId: socket.id,
        x,
        y
      });
    });

    socket.on('setDodgeMove', ({ roomId, direction }: { roomId: string; direction: 'up' | 'down' | 'left' | 'right' | null }) => {
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      if (!room || !player || room.state !== 'playing' || !isDodgeGameType(room.gameType) || !room.dodgeState) return;

      player.dodgeMoveDirection = direction;
      player.dodgeMoveVector = null;
      if (direction) {
        player.dodgeFacing = direction;
        player.dodgeAimVector = getDodgeMoveVector(direction);
      }
      updateDodgeRunupState(player, Boolean(direction), Date.now());
      io.to(roomId).emit('roomStateUpdate', room);
    });

    socket.on('setDodgeMoveVector', ({ roomId, vector }: { roomId: string; vector: { x: number; y: number } | null }) => {
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      if (!room || !player || room.state !== 'playing' || !isDodgeGameType(room.gameType) || !room.dodgeState) return;

      if (!vector) {
        player.dodgeMoveVector = null;
        player.dodgeMoveDirection = null;
        updateDodgeRunupState(player, false, Date.now());
        io.to(roomId).emit('roomStateUpdate', room);
        return;
      }

      const clamped = {
        x: clamp(vector.x, -1, 1),
        y: clamp(vector.y, -1, 1),
      };
      const length = Math.hypot(clamped.x, clamped.y);
      if (length < 0.08) {
        player.dodgeMoveVector = null;
        player.dodgeMoveDirection = null;
        updateDodgeRunupState(player, false, Date.now());
      } else {
        player.dodgeMoveVector = {
          x: clamped.x / length,
          y: clamped.y / length,
        };
        player.dodgeAimVector = {
          x: player.dodgeMoveVector.x,
          y: player.dodgeMoveVector.y,
        };
        player.dodgeMoveDirection = null;
        player.dodgeFacing = Math.abs(player.dodgeMoveVector.x) > Math.abs(player.dodgeMoveVector.y)
          ? (player.dodgeMoveVector.x >= 0 ? 'right' : 'left')
          : (player.dodgeMoveVector.y >= 0 ? 'down' : 'up');
        updateDodgeRunupState(player, true, Date.now());
      }
      io.to(roomId).emit('roomStateUpdate', room);
    });

    socket.on('throwDodgeBall', ({ roomId, vector }: { roomId: string; vector?: { x: number; y: number } | null }) => {
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      if (!room || !player || room.state !== 'playing' || !isDodgeGameType(room.gameType) || !room.dodgeState || !player.alive) return;
      if (!player.dodgeHasBall) return;
      if ((player.dodgeValue || 0) <= 0) return;
      if (isTeamDodgeMode(room) && player.dodgeRole === 'outfield' && !player.dodgeReadyToAssist) return;
      const now = Date.now();
      if (now - (player.lastDodgeThrowAt || 0) < DODGE_THROW_COOLDOWN_MS) return;

      const requestedVector = vector
        ? getNormalizedDodgeMoveVector({
          x: clamp(vector.x, -1, 1),
          y: clamp(vector.y, -1, 1),
        })
        : null;
      if (requestedVector && (Math.abs(requestedVector.x) > 0.01 || Math.abs(requestedVector.y) > 0.01)) {
        player.dodgeAimVector = requestedVector;
        player.dodgeFacing = Math.abs(requestedVector.x) > Math.abs(requestedVector.y)
          ? (requestedVector.x >= 0 ? 'right' : 'left')
          : (requestedVector.y >= 0 ? 'down' : 'up');
      }

      const moveVector = requestedVector
        || (player.dodgeMoveVector
        ? getNormalizedDodgeMoveVector(player.dodgeMoveVector)
        : player.dodgeAimVector
          ? getNormalizedDodgeMoveVector(player.dodgeAimVector)
          : getDodgeMoveVector(player.dodgeFacing || player.dodgeMoveDirection));
      const fallbackTowardEnemy = player.x < room.dodgeState.width / 2 ? 1 : -1;
      const throwVector = Math.abs(moveVector.x) < 0.01 && Math.abs(moveVector.y) < 0.01
        ? { x: fallbackTowardEnemy, y: 0 }
        : moveVector;
      const vx = throwVector.x * DODGE_BALL_SPEED;
      const vy = throwVector.y * DODGE_BALL_SPEED;
      if (!vx && !vy) return;
      const throwStrength = Math.hypot(throwVector.x, throwVector.y);
      const runupMs = player.dodgeRunupStartedAt ? now - player.dodgeRunupStartedAt : 0;
      const canSpecial = player.dodgeRole === 'infield'
        && throwStrength > 0.15
        && runupMs >= DODGE_SPECIAL_SHOT_MIN_RUNUP_MS;
      const shotType = canSpecial
        ? (['fast', 'wave', 'homing'][Math.floor(Math.random() * 3)] as 'fast' | 'wave' | 'homing')
        : 'normal';
      const speedScale = shotType === 'fast' ? 1.75 : 1;
      const ballDodgeValue = Math.max(1, Math.floor(player.dodgeValue || 0));
      const ballRadius = DODGE_BALL_RADIUS + Math.sqrt(ballDodgeValue) * DODGE_BALL_RADIUS_GAIN_PER_VALUE;

      room.dodgeState.balls.push({
        id: `dodge-ball-${socket.id}-${now}-${Math.random().toString(36).slice(2, 8)}`,
        ownerId: socket.id,
        x: player.x + throwVector.x * (DODGE_PLAYER_RADIUS + ballRadius + DODGE_THROW_SPAWN_OFFSET),
        y: player.y + throwVector.y * (DODGE_PLAYER_RADIUS + ballRadius + DODGE_THROW_SPAWN_OFFSET),
        vx: vx * speedScale,
        vy: vy * speedScale,
        radius: ballRadius,
        dodgeValue: ballDodgeValue,
        expiresAt: now + DODGE_BALL_LIFETIME_MS,
        spawnedAt: now,
        shotType,
        sourceRole: player.dodgeRole || 'infield',
      });
      player.dodgeValue = 0;
      player.dodgeHasBall = false;
      if (isTeamDodgeMode(room) && player.dodgeRole === 'outfield') {
        player.dodgeReadyToAssist = false;
      }
      player.lastDodgeThrowAt = now;
      io.to(roomId).emit('roomStateUpdate', room);
    });

    socket.on('moveBomber', ({ roomId, direction }: { roomId: string; direction: 'up' | 'down' | 'left' | 'right' }) => {
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      if (!room || !player || room.state !== 'playing' || !isBomberGameType(room.gameType) || !room.bomberState || !player.alive) return;
      const now = Date.now();
      if (now - (player.lastBomberMoveAt || 0) < getBomberMoveRepeatMs(player.moveSpeedLevel || 0)) return;

      const deltas = {
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0],
      } as const;
      const [dx, dy] = deltas[direction] || [0, 0];
      const nextX = player.bomberX + dx;
      const nextY = player.bomberY + dy;
      const blockingBomb = room.bomberState.bombs.find((bomb) => bomb.x === nextX && bomb.y === nextY);
      if (blockingBomb) {
        if (!player.hasKickBomb || !tryKickBomb(room, blockingBomb, dx, dy)) return;
      } else if (isBomberCellBlocked(room, nextX, nextY)) {
        return;
      }

      player.bomberX = nextX;
      player.bomberY = nextY;
      player.lastBomberMoveAt = now;
      const touchingExplosion = room.bomberState.explosions.find((explosion) =>
        explosion.cells.some((cell) => cell.x === player.bomberX && cell.y === player.bomberY)
      );
      if (touchingExplosion) {
        const owner = room.players[touchingExplosion.ownerId];
        if (!(roomUsesTeams(room) && !room.bomberFriendlyFire && owner && player.teamId && owner.teamId && player.teamId === owner.teamId)) {
          defeatBomberPlayer(room, player, owner && owner.id !== player.id ? owner : null);
        }
      }
      io.to(roomId).emit('roomStateUpdate', room);
    });

    socket.on('placeBomberBomb', ({ roomId }: { roomId: string }) => {
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      if (!room || !player || room.state !== 'playing' || !isBomberGameType(room.gameType) || !room.bomberState || !player.alive) return;
      if ((player.bombsAvailable || 0) <= 0) return;
      if (room.bomberState.bombs.some((bomb) => bomb.x === player.bomberX && bomb.y === player.bomberY)) return;

      room.bomberState.bombs.push({
        id: `${socket.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ownerId: socket.id,
        x: player.bomberX,
        y: player.bomberY,
        explodeAt: player.hasRemoteBomb ? Number.POSITIVE_INFINITY : Date.now() + BOMBER_BOMB_DELAY_MS,
        range: player.bombRange,
        remote: player.hasRemoteBomb,
        pierce: player.hasPierceFire,
        movingDx: 0,
        movingDy: 0,
      });
      player.bombsAvailable -= 1;
      io.to(roomId).emit('roomStateUpdate', room);
    });

    socket.on('detonateRemoteBomb', ({ roomId }: { roomId: string }) => {
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      if (!room || !player || room.state !== 'playing' || !isBomberGameType(room.gameType) || !room.bomberState || !player.alive) return;
      const now = Date.now();
      room.bomberState.bombs.forEach((bomb) => {
        if (bomb.ownerId === socket.id && bomb.remote) {
          bomb.explodeAt = Math.min(bomb.explodeAt, now);
        }
      });
      io.to(roomId).emit('roomStateUpdate', room);
    });

    socket.on('holeCompleted', (roomId) => {
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      if (room && player) {
        player.holesCompleted += 1;
        player.currentStrokes = 0; // 次のホールのためにリセット
        player.canShoot = false;
        player.currentQuestion = undefined;
        player.activeItemId = null;
        player.pendingItemChoices = getRandomItemChoices(2);
        player.shotsRemaining = 0;
        io.to(roomId).emit('roomStateUpdate', room);
      }
    });

    socket.on('selectActiveItem', ({ roomId, itemId }: { roomId: string; itemId: GameItemId | null }) => {
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      if (!room || !player) return;

      if (itemId === null) {
        player.activeItemId = null;
      } else if (player.items.includes(itemId)) {
        player.activeItemId = itemId;
      }

      io.to(roomId).emit('roomStateUpdate', room);
    });

    socket.on('chooseRewardItem', ({ roomId, itemId }: { roomId: string; itemId: GameItemId }) => {
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      if (!room || !player || !player.pendingItemChoices?.includes(itemId)) return;

      player.items = addItemToInventory(player.items, itemId, 3);
      player.activeItemId = null;
      player.pendingItemChoices = null;
      player.currentQuestion = getQuestionForRoom(room);

      socket.emit('personalQuestion', {
        text: player.currentQuestion.text,
        options: player.currentQuestion.options,
        hint: player.currentQuestion.hint,
        visual: player.currentQuestion.visual,
        audioPrompt: player.currentQuestion.audioPrompt,
        speechPrompt: player.currentQuestion.speechPrompt,
      });
      io.to(roomId).emit('roomStateUpdate', room);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      for (const roomId in rooms) {
        const room = rooms[roomId];
        if (room.hostId === socket.id) {
          io.to(roomId).emit('error', 'Host disconnected');
          delete rooms[roomId];
        } else if (room.players[socket.id]) {
          delete room.players[socket.id];
          if (room.state === 'teamReveal' && room.teamMode) {
            assignRandomTeams(room, room.teamCount);
          }
          io.to(roomId).emit('roomStateUpdate', room);
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
