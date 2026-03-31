import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { addItemToInventory, GameItemId, getRandomItemChoices } from './src/gameItems.ts';

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
  canShoot: boolean;
  x: number;
  y: number;
  color: string;
  currentQuestion?: any;  // プレイヤーごとの現在の問題
  items: GameItemId[];
  activeItemId: GameItemId | null;
  pendingItemChoices: GameItemId[] | null;
}

interface Room {
  id: string;
  hostId: string;
  players: Record<string, Player>;
  state: 'waiting' | 'playing' | 'results';
  questionMode: string;
  timeLimit?: number;
  timeRemaining?: number;
  questions?: any[]; // Custom questions from Host
}

const rooms: Record<string, Room> = {};
const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3', '#FFB533'];

const consumeOneInventoryItem = (inventory: GameItemId[], itemId: GameItemId) => {
  const index = inventory.indexOf(itemId);
  if (index === -1) return inventory;
  return [...inventory.slice(0, index), ...inventory.slice(index + 1)];
};

const resetPlayerState = (player: Player) => {
  player.holesCompleted = 0;
  player.totalStrokes = 0;
  player.currentStrokes = 0;
  player.canShoot = false;
  player.x = 100;
  player.y = 100;
  player.currentQuestion = undefined;
  player.items = [];
  player.activeItemId = null;
  player.pendingItemChoices = null;
};

const prepareRoomForGame = (room: Room, mode: string, timeLimit?: number, questions?: any[]) => {
  room.state = 'playing';
  room.questionMode = mode;
  room.timeLimit = timeLimit || 300;
  room.timeRemaining = room.timeLimit;
  room.questions = questions;

  Object.values(room.players).forEach((player) => {
    resetPlayerState(player);
    player.currentQuestion = getQuestionForRoom(room);
  });
};

const resetRoomToWaiting = (room: Room) => {
  room.state = 'waiting';
  room.timeRemaining = room.timeLimit || 300;
  room.questions = undefined;
  Object.values(room.players).forEach(resetPlayerState);
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
  const correctIndex = optionsArray.indexOf(answer);

  return {
    text,
    options: optionsArray.map(String),
    correctIndex
  };
};

const getQuestionForRoom = (room: Room) => {
  if (room.questions && room.questions.length > 0) {
    const q = room.questions[Math.floor(Math.random() * room.questions.length)];
    // q is GeneralProblem: { question, answer, options, hint, visual }
    const optionsArray = [...q.options].sort(() => Math.random() - 0.5);
    const correctIndex = optionsArray.indexOf(q.answer);
    return {
      text: q.question,
      options: optionsArray,
      correctIndex,
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

    socket.on('createRoom', () => {
      // Generate a 6-digit numeric PIN
      const roomId = Math.floor(100000 + Math.random() * 900000).toString();
      rooms[roomId] = {
        id: roomId,
        hostId: socket.id,
        players: {},
        state: 'waiting',
        questionMode: 'mix',
        timeLimit: 300, // Default 5 minutes
        timeRemaining: 300,
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
          canShoot: false,
          x: 100,
          y: 100,
          color,
          items: [],
          activeItemId: null,
          pendingItemChoices: null,
        };
        
        // If joining mid-game, generate an initial question for them
        if (room.state === 'playing') {
          room.players[socket.id].currentQuestion = getQuestionForRoom(room);
          socket.emit('personalQuestion', {
            text: room.players[socket.id].currentQuestion.text,
            options: room.players[socket.id].currentQuestion.options,
            hint: room.players[socket.id].currentQuestion.hint,
            visual: room.players[socket.id].currentQuestion.visual,
            audioPrompt: room.players[socket.id].currentQuestion.audioPrompt,
            speechPrompt: room.players[socket.id].currentQuestion.speechPrompt,
          });
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

    socket.on('startGame', ({ roomId, mode, timeLimit, questions }) => {
      const room = rooms[roomId];
      if (room && room.hostId === socket.id) {
        prepareRoomForGame(room, mode, timeLimit, questions);

        // 全プレイヤーに最初の問題を生成して送信
        Object.values(room.players).forEach(p => {
          io.to(p.id).emit('personalQuestion', {
            text: p.currentQuestion.text,
            options: p.currentQuestion.options,
            hint: p.currentQuestion.hint,
            visual: p.currentQuestion.visual,
            audioPrompt: p.currentQuestion.audioPrompt,
            speechPrompt: p.currentQuestion.speechPrompt,
          });
        });
        
        io.to(roomId).emit('roomStateUpdate', room);

        // Start timer
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
      }
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
        const isCorrect = typeof isSpeechCorrect === 'boolean'
          ? isSpeechCorrect
          : answerIndex === player.currentQuestion.correctIndex;
        console.log(`[submitAnswer] isCorrect: ${isCorrect}, correctIndex: ${player.currentQuestion.correctIndex}`);
        if (isCorrect) {
          player.canShoot = true;
          player.currentQuestion = null;
          socket.emit('answerResult', { correct: true });
        } else {
          // 不正解の場合は新しい問題を生成（当てずっぽう防止）
          player.currentQuestion = getQuestionForRoom(room);
          socket.emit('answerResult', { correct: false });
          setTimeout(() => {
            socket.emit('personalQuestion', {
              text: player.currentQuestion.text,
              options: player.currentQuestion.options,
              hint: player.currentQuestion.hint,
              visual: player.currentQuestion.visual,
              audioPrompt: player.currentQuestion.audioPrompt,
              speechPrompt: player.currentQuestion.speechPrompt,
            });
          }, 1500); // 1.5秒後に次の問題を表示
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
      }
    });

    socket.on('ballMoved', ({ roomId, x, y }) => {
      const room = rooms[roomId];
      if (room && room.players[socket.id]) {
        room.players[socket.id].x = x;
        room.players[socket.id].y = y;
        socket.to(roomId).emit('playerMoved', {
          playerId: socket.id,
          x,
          y
        });
      }
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
