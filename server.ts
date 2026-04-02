import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { addItemToInventory, GameItemId, getRandomItemChoices } from './src/gameItems.ts';
import { findMatchingOptionIndex, shuffleOptionsWithFirstCorrect } from './src/lib/answerMatching.ts';

const PORT = Number(process.env.PORT || 3000);

// ==========================================
// 型定義 (Type Definitions)
// ==========================================

interface Player {
  id: string;
  name: string;
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
  lastBroadcastX?: number;
  lastBroadcastY?: number;
  lastBroadcastAt?: number;
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
}

const rooms: Record<string, Room> = {};
const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3', '#FFB533'];

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

  Object.values(room.players).forEach((player) => {
    resetPlayerState(player, { preserveTeam: options?.preserveTeams });
    player.currentQuestion = getQuestionForRoom(room);
  });
};

const resetRoomToWaiting = (room: Room) => {
  room.state = 'waiting';
  room.timeRemaining = room.timeLimit || 300;
  room.questions = undefined;
  room.teamNames = {};
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
      };
      socket.join(roomId);
      socket.emit('roomCreated', roomId);
      socket.emit('roomStateUpdate', rooms[roomId]);
    });

    socket.on('joinRoom', ({ roomId, name }) => {
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
          lastBroadcastX: 100,
          lastBroadcastY: 100,
          lastBroadcastAt: 0,
        };
        
        // If joining mid-game, generate an initial question for them
        if (room.state === 'teamReveal') {
          assignRandomTeams(room, room.teamCount);
        }

        if (room.state === 'playing') {
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

    socket.on('startGame', ({ roomId, mode, timeLimit, questions, shotsPerQuestion, teamMode, teamCount }) => {
      const room = rooms[roomId];
      if (room && room.hostId === socket.id) {
        room.shotsPerQuestion = Math.max(1, Math.min(5, Number(shotsPerQuestion) || 3));
        room.teamMode = Boolean(teamMode);
        room.teamCount = Math.max(2, Math.min(10, Number(teamCount) || room.teamCount || 2));

        if (room.teamMode) {
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
    });

    socket.on('returnToLobby', ({ roomId }) => {
      const room = rooms[roomId];
      if (room && room.hostId === socket.id) {
        resetRoomToWaiting(room);
        io.to(roomId).emit('roomStateUpdate', room);
      }
    });

    socket.on('closeRoom', ({ roomId }) => {
      const room = rooms[roomId];
      if (room && room.hostId === socket.id) {
        io.to(roomId).emit('error', 'Host closed the room');
        delete rooms[roomId];
      }
    });

    socket.on('submitAnswer', ({ roomId, answerIndex, isSpeechCorrect }) => {
      console.log(`[submitAnswer] Player ${socket.id} in room ${roomId} submitted answer ${answerIndex}`);
      const room = rooms[roomId];
      const player = room?.players[socket.id];
      
      if (room && player && player.currentQuestion) {
        const currentQuestion = player.currentQuestion;
        const isCorrect = typeof isSpeechCorrect === 'boolean'
          ? isSpeechCorrect
          : answerIndex === currentQuestion.correctIndex;
        console.log(`[submitAnswer] isCorrect: ${isCorrect}, correctIndex: ${currentQuestion.correctIndex}`);
        if (isCorrect) {
          player.correctAnswers += 1;
          if (room.gameType === 'quiz') {
            player.currentQuestion = getQuestionForRoom(room);
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
          if (room.gameType === 'quiz') {
            setTimeout(() => {
              socket.emit('personalQuestion', {
                text: player.currentQuestion.text,
                options: player.currentQuestion.options,
                hint: player.currentQuestion.hint,
                visual: player.currentQuestion.visual,
                audioPrompt: player.currentQuestion.audioPrompt,
                speechPrompt: player.currentQuestion.speechPrompt,
              });
            }, 700);
          }
        } else {
          // 不正解の場合は新しい問題を生成（当てずっぽう防止）
          player.currentQuestion = getQuestionForRoom(room);
          socket.emit('answerResult', {
            correct: false,
            correctIndex: currentQuestion.correctIndex,
            correctText: currentQuestion.correctText,
          });
          setTimeout(() => {
            socket.emit('personalQuestion', {
              text: player.currentQuestion.text,
              options: player.currentQuestion.options,
              hint: player.currentQuestion.hint,
              visual: player.currentQuestion.visual,
              audioPrompt: player.currentQuestion.audioPrompt,
              speechPrompt: player.currentQuestion.speechPrompt,
            });
          }, 2200); // 正解を確認する時間を少し長めに確保
        }
        io.to(roomId).emit('roomStateUpdate', room);
      } else {
        console.log(`[submitAnswer] Failed: room=${!!room}, player=${!!player}, currentQuestion=${!!player?.currentQuestion}`);
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
