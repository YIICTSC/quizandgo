import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { addItemToInventory, GameItemId, getRandomItemChoices } from './src/gameItems.ts';
import { findMatchingOptionIndex, shuffleOptionsWithFirstCorrect } from './src/lib/answerMatching.ts';
import { BOMBER_BASE_HEIGHT, BOMBER_BASE_WIDTH, getBomberDimensions } from './src/lib/bomberDimensions.ts';
import { AvatarConfig, normalizeAvatar } from './src/avatar.ts';

const PORT = Number(process.env.PORT || 3000);

// ==========================================
// 型定義 (Type Definitions)
// ==========================================

interface Player {
  id: string;
  name: string;
  avatar: AvatarConfig;
  holesCompleted: number; // クリアしたホール数
  totalStrokes: number;   // 全ホールの合計打数
  currentStrokes: number; // 現在のホールの打数
  correctAnswers: number;
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
const roomUsesTeams = (room: Room) =>
  room.gameType === 'golf' || room.gameType === 'team_bomber' || (room.gameType === 'color_bomber' && room.teamMode);
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

const resetPlayerState = (player: Player, options?: { preserveTeam?: boolean }) => {
  player.holesCompleted = 0;
  player.totalStrokes = 0;
  player.currentStrokes = 0;
  player.correctAnswers = 0;
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
};

const emitPersonalQuestion = (io: Server, player: Player) => {
  if (!player.currentQuestion) return;
  io.to(player.id).emit('personalQuestion', {
    text: player.currentQuestion.text,
    options: player.currentQuestion.options,
    hint: player.currentQuestion.hint,
    visual: player.currentQuestion.visual,
    audioPrompt: player.currentQuestion.audioPrompt,
    speechPrompt: player.currentQuestion.speechPrompt,
  });
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

  Object.values(room.players).forEach((player) => {
    resetPlayerState(player, { preserveTeam: options?.preserveTeams });
    player.currentQuestion = getQuestionForRoom(room);
  });

  if (isBomberGameType(room.gameType)) {
    room.bomberState = createBomberState(Object.values(room.players));
  }
};

const resetRoomToWaiting = (room: Room) => {
  room.state = 'waiting';
  room.timeRemaining = room.timeLimit || 300;
  room.questions = undefined;
  room.teamNames = {};
  room.bomberState = null;
  Object.values(room.players).forEach((player) => resetPlayerState(player));
};

const startRoomTimer = (io: Server, roomId: string) => {
  const timerInterval = setInterval(() => {
    if (rooms[roomId] && rooms[roomId].state === 'playing') {
      rooms[roomId].timeRemaining -= 1;
      io.to(roomId).emit('timeUpdate', rooms[roomId].timeRemaining);

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

    socket.on('createRoom', ({ gameType }: { gameType?: string } = {}) => {
      // Generate a 6-digit numeric PIN
      const roomId = Math.floor(100000 + Math.random() * 900000).toString();
      rooms[roomId] = {
        id: roomId,
        hostId: socket.id,
        gameType: gameType || 'golf',
        players: {},
        state: 'waiting',
        questionMode: 'mix',
        timeLimit: 300, // Default 5 minutes
        timeRemaining: 300,
        shotsPerQuestion: 3,
        teamMode: false,
        teamCount: 2,
        teamNames: {},
        bomberFriendlyFire: false,
        bomberState: null,
      };
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
        room.players[socket.id] = {
          id: socket.id,
          name,
          avatar: normalizeAvatar(avatar),
          holesCompleted: 0,
          totalStrokes: 0,
          currentStrokes: 0,
          correctAnswers: 0,
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
        };
        
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

    socket.on('startGame', ({ roomId, mode, timeLimit, questions, shotsPerQuestion, teamMode, teamCount, bomberFriendlyFire }) => {
      const room = rooms[roomId];
      if (room && room.hostId === socket.id) {
        room.shotsPerQuestion = Math.max(1, Math.min(5, Number(shotsPerQuestion) || 3));
        room.teamMode = isTeamBomberGameType(room.gameType) ? true : Boolean(teamMode);
        room.teamCount = Math.max(2, Math.min(10, Number(teamCount) || room.teamCount || 2));
        room.bomberFriendlyFire = Boolean(bomberFriendlyFire);

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
        Object.values(room.players).forEach((player) => emitPersonalQuestion(io, player));
        io.to(roomId).emit('roomStateUpdate', room);
        startRoomTimer(io, roomId);
        if (isBomberGameType(room.gameType)) {
          startBomberLoop(io, roomId);
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
        const isCorrect = typeof isSpeechCorrect === 'boolean'
          ? isSpeechCorrect
          : answerIndex === currentQuestion.correctIndex;
        console.log(`[submitAnswer] isCorrect: ${isCorrect}, correctIndex: ${currentQuestion.correctIndex}`);
        if (isCorrect) {
          player.correctAnswers += 1;
          if (room.gameType === 'quiz') {
            player.currentQuestion = getQuestionForRoom(room);
            nextQuestion = player.currentQuestion;
            nextDelayMs = 700;
          } else if (isBomberGameType(room.gameType)) {
            player.bombsAvailable = (player.bombsAvailable || 0) + 1;
            player.currentQuestion = getQuestionForRoom(room);
            nextQuestion = player.currentQuestion;
            nextDelayMs = 700;
          } else {
            player.canShoot = true;
            player.currentQuestion = null;
            player.shotsRemaining = room.shotsPerQuestion || 3;
          }
          socket.emit('answerResult', {
            correct: true,
            correctIndex: currentQuestion.correctIndex,
            correctText: currentQuestion.correctText,
          });
          if (room.gameType === 'quiz' || isBomberGameType(room.gameType)) {
            setTimeout(() => {
              emitPersonalQuestion(io, player);
            }, nextDelayMs || 700);
          }
        } else {
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
