import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { socket } from '../socket';
import { playHitSound, playCupInSound } from '../lib/sound';
import { GAME_ITEM_MAP, GameItemId } from '../gameItems';

const DEFAULT_BALL_PHYSICS = {
  restitution: 0.85,
  friction: 0.01,
  frictionStatic: 0.05,
  frictionAir: 0.01,
};

type Level = {
  startPos: { x: number, y: number };
  holePos: { x: number, y: number };
  createWorld: () => Matter.Body[];
};

const COLORS = {
  grass: '#4ade80',
  obstacle: '#f87171',
  dirt: '#b45309',
  water: '#38bdf8',
  waterDeep: '#0f766e',
  cloud: '#bfdbfe',
};

const grassRect = (x: number, y: number, width: number, height: number, options: Matter.IBodyDefinition = {}) =>
  Matter.Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    label: 'grass',
    render: { fillStyle: COLORS.grass },
    ...options,
  });

const wallRect = (x: number, y: number, width: number, height: number, options: Matter.IBodyDefinition = {}) =>
  Matter.Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    label: 'wall',
    render: { fillStyle: COLORS.obstacle },
    ...options,
  });

const dirtRect = (x: number, y: number, width: number, height: number, options: Matter.IBodyDefinition = {}) =>
  Matter.Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    label: 'dirt',
    render: { fillStyle: COLORS.dirt },
    ...options,
  });

const waterRect = (x: number, y: number, width: number, height: number, options: Matter.IBodyDefinition = {}) =>
  Matter.Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    label: 'water',
    render: { fillStyle: COLORS.water },
    ...options,
  });

const cloudRect = (x: number, y: number, width: number, height: number, options: Matter.IBodyDefinition = {}) =>
  Matter.Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    label: 'cloud',
    render: { fillStyle: COLORS.cloud },
    ...options,
  });

const bounds = ({
  floor = true,
  ceiling = true,
  left = true,
  right = true,
}: {
  floor?: boolean;
  ceiling?: boolean;
  left?: boolean;
  right?: boolean;
} = {}) => {
  const bodies: Matter.Body[] = [];
  if (floor) bodies.push(grassRect(400, 590, 810, 60));
  if (ceiling) bodies.push(grassRect(400, 0, 810, 60));
  if (left) bodies.push(grassRect(0, 300, 60, 600));
  if (right) bodies.push(grassRect(800, 300, 60, 600));
  return bodies;
};

const LEVELS: Level[] = [
  {
    // Level 1: Classic Gates
    startPos: { x: 100, y: 500 },
    holePos: { x: 700, y: 550 },
    createWorld: () => [
      ...bounds(),
      wallRect(300, 420, 20, 200),
      wallRect(500, 240, 20, 240),
    ],
  },
  {
    // Level 2: High Wall
    startPos: { x: 100, y: 500 },
    holePos: { x: 700, y: 550 },
    createWorld: () => [
      ...bounds(),
      wallRect(400, 450, 40, 250),
      dirtRect(620, 560, 160, 18),
    ],
  },
  {
    // Level 3: Tunnel
    startPos: { x: 100, y: 500 },
    holePos: { x: 700, y: 500 },
    createWorld: () => [
      ...bounds(),
      wallRect(400, 430, 40, 280),
      wallRect(400, 100, 40, 160),
      wallRect(400, 280, 300, 20),
      wallRect(400, 190, 300, 20),
    ],
  },
  {
    // Level 4: Pyramid
    startPos: { x: 100, y: 500 },
    holePos: { x: 700, y: 500 },
    createWorld: () => [
      ...bounds(),
      wallRect(250, 500, 100, 150),
      wallRect(400, 450, 100, 250),
      wallRect(550, 500, 100, 150),
    ],
  },
  {
    // Level 5: Floating Islands
    startPos: { x: 100, y: 200 },
    holePos: { x: 700, y: 200 },
    createWorld: () => [
      ...bounds({ floor: false }),
      grassRect(100, 300, 200, 40),
      grassRect(400, 400, 150, 40),
      grassRect(700, 300, 200, 40),
    ],
  },
  {
    // Level 6: Stair Hooks
    startPos: { x: 50, y: 500 },
    holePos: { x: 750, y: 100 },
    createWorld: () => [
      ...bounds(),
      grassRect(200, 470, 130, 18),
      wallRect(140, 446, 14, 48),
      wallRect(258, 446, 14, 48),
      grassRect(400, 360, 130, 18),
      wallRect(340, 336, 14, 48),
      wallRect(458, 336, 14, 48),
      grassRect(600, 250, 130, 18),
      wallRect(540, 226, 14, 48),
      wallRect(658, 226, 14, 48),
      grassRect(738, 150, 120, 18),
      wallRect(682, 126, 14, 48),
    ],
  },
  {
    // Level 7: Vertical Drop
    startPos: { x: 100, y: 100 },
    holePos: { x: 700, y: 550 },
    createWorld: () => [
      ...bounds(),
      grassRect(110, 150, 150, 20),
      wallRect(300, 250, 20, 150, { angle: Math.PI / 4 }),
      wallRect(500, 400, 20, 150, { angle: -Math.PI / 4 }),
    ],
  },
  {
    // Level 8: The Maze
    startPos: { x: 50, y: 50 },
    holePos: { x: 750, y: 550 },
    createWorld: () => [
      ...bounds(),
      wallRect(325, 150, 650, 20),
      wallRect(400, 120, 20, 40),
      wallRect(475, 300, 650, 20),
      wallRect(400, 270, 20, 40),
      wallRect(325, 450, 650, 20),
      wallRect(400, 420, 20, 40),
    ],
  },
  {
    // Level 9: Water Skips
    startPos: { x: 90, y: 520 },
    holePos: { x: 720, y: 520 },
    createWorld: () => [
      ...bounds(),
      grassRect(120, 545, 170, 18),
      grassRect(690, 545, 170, 18),
      waterRect(300, 555, 120, 14),
      waterRect(430, 555, 120, 14),
      waterRect(560, 555, 120, 14),
    ],
  },
  {
    // Level 10: Dirt Detour
    startPos: { x: 90, y: 520 },
    holePos: { x: 720, y: 520 },
    createWorld: () => [
      ...bounds(),
      dirtRect(270, 560, 220, 18),
      wallRect(430, 495, 20, 110),
      grassRect(600, 470, 180, 18),
      wallRect(520, 380, 20, 160),
    ],
  },
  {
    // Level 11: Zigzag Terrace
    startPos: { x: 90, y: 520 },
    holePos: { x: 700, y: 140 },
    createWorld: () => [
      ...bounds(),
      grassRect(180, 500, 220, 18),
      grassRect(380, 390, 220, 18),
      grassRect(580, 280, 220, 18),
      grassRect(710, 170, 140, 18),
      wallRect(290, 442, 16, 90),
      wallRect(490, 332, 16, 90),
    ],
  },
  {
    // Level 12: Twin Ramps
    startPos: { x: 90, y: 540 },
    holePos: { x: 710, y: 540 },
    createWorld: () => [
      ...bounds(),
      wallRect(250, 470, 180, 18, { angle: -0.34 }),
      wallRect(550, 470, 180, 18, { angle: 0.34 }),
      grassRect(400, 330, 180, 18),
      dirtRect(400, 560, 160, 18),
    ],
  },
  {
    // Level 13: Crater Ring
    startPos: { x: 110, y: 500 },
    holePos: { x: 690, y: 500 },
    createWorld: () => [
      ...bounds(),
      wallRect(320, 520, 160, 18, { angle: -0.4 }),
      wallRect(480, 520, 160, 18, { angle: 0.4 }),
      wallRect(400, 430, 180, 18),
      grassRect(400, 560, 110, 18),
    ],
  },
  {
    // Level 14: Split River
    startPos: { x: 100, y: 520 },
    holePos: { x: 710, y: 180 },
    createWorld: () => [
      ...bounds(),
      grassRect(180, 545, 220, 18),
      waterRect(380, 555, 150, 14),
      grassRect(560, 440, 180, 18),
      waterRect(290, 350, 160, 14),
      grassRect(710, 205, 120, 18),
      wallRect(470, 300, 16, 170),
    ],
  },
  {
    // Level 15: Bridge Run
    startPos: { x: 90, y: 500 },
    holePos: { x: 710, y: 500 },
    createWorld: () => [
      ...bounds(),
      grassRect(400, 560, 760, 18),
      wallRect(260, 520, 16, 80),
      wallRect(400, 520, 16, 80),
      wallRect(540, 520, 16, 80),
      grassRect(240, 430, 120, 16),
      grassRect(400, 380, 120, 16),
      grassRect(560, 430, 120, 16),
    ],
  },
  {
    // Level 16: Summit Steps
    startPos: { x: 80, y: 520 },
    holePos: { x: 720, y: 120 },
    createWorld: () => [
      ...bounds(),
      grassRect(150, 520, 160, 18),
      grassRect(280, 430, 140, 18),
      grassRect(420, 340, 140, 18),
      grassRect(560, 250, 140, 18),
      grassRect(710, 160, 120, 18),
      dirtRect(490, 365, 60, 12),
    ],
  },
  {
    // Level 17: Pinball Lane
    startPos: { x: 90, y: 120 },
    holePos: { x: 710, y: 520 },
    createWorld: () => [
      ...bounds(),
      grassRect(110, 160, 150, 18),
      wallRect(250, 220, 18, 130, { angle: 0.5 }),
      wallRect(420, 320, 18, 130, { angle: -0.5 }),
      wallRect(590, 420, 18, 130, { angle: 0.5 }),
      dirtRect(705, 560, 120, 18),
    ],
  },
  {
    // Level 18: Canyon Hops
    startPos: { x: 90, y: 520 },
    holePos: { x: 720, y: 300 },
    createWorld: () => [
      ...bounds({ floor: false }),
      grassRect(110, 560, 160, 18),
      grassRect(290, 470, 90, 18),
      grassRect(440, 390, 90, 18),
      grassRect(590, 330, 90, 18),
      grassRect(720, 325, 120, 18),
    ],
  },
  {
    // Level 19: Dirt Funnel
    startPos: { x: 100, y: 120 },
    holePos: { x: 700, y: 520 },
    createWorld: () => [
      ...bounds(),
      grassRect(110, 160, 130, 18),
      wallRect(260, 220, 220, 18, { angle: 0.42 }),
      wallRect(540, 220, 220, 18, { angle: -0.42 }),
      dirtRect(400, 470, 260, 18),
    ],
  },
  {
    // Level 20: Water Staircase
    startPos: { x: 80, y: 520 },
    holePos: { x: 730, y: 140 },
    createWorld: () => [
      ...bounds(),
      grassRect(150, 520, 170, 18),
      waterRect(270, 460, 90, 14),
      grassRect(390, 390, 130, 18),
      waterRect(510, 320, 90, 14),
      grassRect(640, 230, 130, 18),
      grassRect(730, 160, 100, 18),
    ],
  },
  {
    // Level 21: Castle Gate
    startPos: { x: 90, y: 520 },
    holePos: { x: 710, y: 520 },
    createWorld: () => [
      ...bounds(),
      wallRect(340, 470, 30, 220),
      wallRect(460, 470, 30, 220),
      wallRect(400, 360, 140, 18),
      grassRect(400, 560, 130, 18),
      dirtRect(650, 560, 140, 18),
    ],
  },
  {
    // Level 22: Cloud Hop
    startPos: { x: 90, y: 500 },
    holePos: { x: 720, y: 160 },
    createWorld: () => [
      ...bounds({ floor: false }),
      cloudRect(120, 540, 180, 20),
      cloudRect(300, 430, 120, 20),
      cloudRect(470, 320, 120, 20),
      cloudRect(640, 230, 120, 20),
      grassRect(730, 185, 110, 18),
    ],
  },
  {
    // Level 23: Slalom
    startPos: { x: 80, y: 520 },
    holePos: { x: 720, y: 520 },
    createWorld: () => [
      ...bounds(),
      wallRect(210, 470, 18, 170),
      wallRect(350, 320, 18, 170),
      wallRect(490, 470, 18, 170),
      wallRect(630, 320, 18, 170),
      grassRect(720, 560, 110, 18),
    ],
  },
  {
    // Level 24: Central Tower
    startPos: { x: 100, y: 520 },
    holePos: { x: 700, y: 520 },
    createWorld: () => [
      ...bounds(),
      wallRect(400, 420, 100, 280),
      grassRect(250, 420, 120, 18),
      grassRect(550, 420, 120, 18),
      grassRect(400, 260, 120, 18),
      dirtRect(400, 560, 140, 18),
    ],
  },
  {
    // Level 25: Dune Run
    startPos: { x: 80, y: 520 },
    holePos: { x: 730, y: 520 },
    createWorld: () => [
      ...bounds(),
      wallRect(190, 535, 150, 18, { angle: -0.2 }),
      wallRect(360, 525, 150, 18, { angle: 0.18 }),
      wallRect(530, 535, 150, 18, { angle: -0.2 }),
      dirtRect(360, 560, 500, 18),
    ],
  },
  {
    // Level 26: Cross Roads
    startPos: { x: 100, y: 520 },
    holePos: { x: 700, y: 120 },
    createWorld: () => [
      ...bounds(),
      wallRect(400, 460, 20, 220),
      wallRect(400, 280, 220, 20),
      grassRect(220, 380, 140, 18),
      grassRect(580, 210, 140, 18),
      grassRect(700, 145, 100, 18),
      waterRect(210, 555, 140, 14),
    ],
  },
  {
    // Level 27: Waterfall Pond
    startPos: { x: 100, y: 140 },
    holePos: { x: 700, y: 520 },
    createWorld: () => [
      ...bounds(),
      grassRect(110, 175, 150, 18),
      waterRect(250, 250, 90, 14),
      waterRect(360, 340, 90, 14),
      waterRect(470, 430, 90, 14),
      grassRect(700, 560, 130, 18),
    ],
  },
  {
    // Level 28: Final Ascent
    startPos: { x: 90, y: 520 },
    holePos: { x: 720, y: 90 },
    createWorld: () => [
      ...bounds(),
      grassRect(160, 520, 160, 18),
      wallRect(270, 430, 150, 18, { angle: -0.45 }),
      grassRect(430, 330, 120, 18),
      wallRect(580, 230, 150, 18, { angle: -0.45 }),
      grassRect(720, 110, 100, 18),
    ],
  },
  {
    // Level 29: Gauntlet
    startPos: { x: 90, y: 520 },
    holePos: { x: 720, y: 520 },
    createWorld: () => [
      ...bounds(),
      wallRect(220, 470, 20, 150),
      waterRect(300, 555, 100, 14),
      wallRect(390, 350, 20, 220),
      dirtRect(500, 560, 100, 18),
      wallRect(600, 470, 20, 150),
      grassRect(720, 560, 110, 18),
    ],
  },
  {
    // Level 30: Celebration Circuit
    startPos: { x: 100, y: 500 },
    holePos: { x: 700, y: 140 },
    createWorld: () => [
      ...bounds(),
      grassRect(160, 520, 180, 18),
      waterRect(320, 455, 100, 14),
      grassRect(460, 390, 140, 18),
      dirtRect(600, 325, 120, 16),
      wallRect(300, 260, 220, 18, { angle: 0.3 }),
      grassRect(700, 165, 120, 18),
    ],
  },
];

export default function GolfGame({
  roomId,
  me,
  players,
  isSinglePlayer = false,
  freezeBall = false,
  activeItemId = null,
  onSinglePlayerShot,
  onSingleBallStopped,
  onSingleHoleCompleted,
  onConsumeActiveItem,
}: {
  roomId: string,
  me: any,
  players: any,
  isSinglePlayer?: boolean,
  freezeBall?: boolean,
  activeItemId?: GameItemId | null,
  onSinglePlayerShot?: (velocity: { x: number; y: number }) => void,
  onSingleBallStopped?: () => void,
  onSingleHoleCompleted?: () => void,
  onConsumeActiveItem?: (itemId: GameItemId) => void,
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const ballRef = useRef<Matter.Body | null>(null);
  const singleBallStoppedRef = useRef(onSingleBallStopped);
  const singleHoleCompletedRef = useRef(onSingleHoleCompleted);
  const activeItemRef = useRef<GameItemId | null>(activeItemId);
  const activeShotItemRef = useRef<GameItemId | null>(null);
  const activeShotMetaRef = useRef({ triggered: false });
  const turboTimeoutRef = useRef<number | null>(null);
  const skipNextStopRef = useRef(false);
  const stickyHoldRef = useRef(false);
  const lastWaterBounceRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const activeTouchIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragCurrentRef = useRef({ x: 0, y: 0 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [activeShotLabel, setActiveShotLabel] = useState<string | null>(null);

  const clearDragState = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
    activePointerIdRef.current = null;
    activeTouchIdRef.current = null;
  };

  const getScaledPointerPosition = (clientX: number, clientY: number) => {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: (clientX - rect.left) * (800 / rect.width),
      y: (clientY - rect.top) * (600 / rect.height),
    };
  };

  const startDragAt = (clientX: number, clientY: number) => {
    if (!me?.canShoot) return false;
    const position = getScaledPointerPosition(clientX, clientY);
    if (!position) return false;
    isDraggingRef.current = true;
    dragStartRef.current = position;
    dragCurrentRef.current = position;
    setIsDragging(true);
    setDragStart(position);
    setDragCurrent(position);
    return true;
  };

  const moveDragAt = (clientX: number, clientY: number) => {
    const position = getScaledPointerPosition(clientX, clientY);
    if (!position) return;
    dragCurrentRef.current = position;
    setDragCurrent(position);
  };

  useEffect(() => {
    singleBallStoppedRef.current = onSingleBallStopped;
  }, [onSingleBallStopped]);

  useEffect(() => {
    singleHoleCompletedRef.current = onSingleHoleCompleted;
  }, [onSingleHoleCompleted]);

  useEffect(() => {
    activeItemRef.current = activeItemId;
  }, [activeItemId]);

  useEffect(() => {
    const resetOnWindowPointerEvent = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      clearDragState();
    };
    const resetOnWindowBlur = () => clearDragState();
    window.addEventListener('pointerup', resetOnWindowPointerEvent);
    window.addEventListener('pointercancel', resetOnWindowPointerEvent);
    window.addEventListener('blur', resetOnWindowBlur);

    return () => {
      window.removeEventListener('pointerup', resetOnWindowPointerEvent);
      window.removeEventListener('pointercancel', resetOnWindowPointerEvent);
      window.removeEventListener('blur', resetOnWindowBlur);
    };
  }, []);

  useEffect(() => {
    const element = sceneRef.current;
    if (!element) return;

    const handleNativeTouchStart = (event: TouchEvent) => {
      if (activeTouchIdRef.current !== null || event.touches.length === 0) return;
      const touch = event.touches.item(0);
      if (!touch) return;
      if (startDragAt(touch.clientX, touch.clientY)) {
        activeTouchIdRef.current = touch.identifier;
        event.preventDefault();
      }
    };

    const handleNativeTouchMove = (event: TouchEvent) => {
      if (activeTouchIdRef.current === null) return;
      let touch: Touch | null = null;
      for (let i = 0; i < event.touches.length; i += 1) {
        const candidate = event.touches.item(i);
        if (candidate?.identifier === activeTouchIdRef.current) {
          touch = candidate;
          break;
        }
      }
      if (!touch) return;
      moveDragAt(touch.clientX, touch.clientY);
      event.preventDefault();
    };

    const handleNativeTouchEnd = (event: TouchEvent) => {
      if (activeTouchIdRef.current === null) return;
      let touch: Touch | null = null;
      for (let i = 0; i < event.changedTouches.length; i += 1) {
        const candidate = event.changedTouches.item(i);
        if (candidate?.identifier === activeTouchIdRef.current) {
          touch = candidate;
          break;
        }
      }
    if (!touch) return;
    dragCurrentRef.current = getScaledPointerPosition(touch.clientX, touch.clientY) || dragCurrentRef.current;
    setDragCurrent(dragCurrentRef.current);
    activeTouchIdRef.current = null;
    event.preventDefault();
    releaseShot();
  };

    element.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
    element.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    window.addEventListener('touchend', handleNativeTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleNativeTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleNativeTouchStart);
      element.removeEventListener('touchmove', handleNativeTouchMove);
      window.removeEventListener('touchend', handleNativeTouchEnd);
      window.removeEventListener('touchcancel', handleNativeTouchEnd);
    };
  }, [me?.canShoot, isDragging, dragStart, dragCurrent]);

  const resetBallPhysics = (ball: Matter.Body) => {
    ball.restitution = DEFAULT_BALL_PHYSICS.restitution;
    ball.friction = DEFAULT_BALL_PHYSICS.friction;
    ball.frictionStatic = DEFAULT_BALL_PHYSICS.frictionStatic;
    ball.frictionAir = DEFAULT_BALL_PHYSICS.frictionAir;
  };

  const clearShotEffect = () => {
    activeShotItemRef.current = null;
    activeShotMetaRef.current = { triggered: false };
    setActiveShotLabel(null);
    if (turboTimeoutRef.current) {
      window.clearTimeout(turboTimeoutRef.current);
      turboTimeoutRef.current = null;
    }
    if (ballRef.current) {
      resetBallPhysics(ballRef.current);
      if (ballRef.current.isStatic && !freezeBall && !stickyHoldRef.current) {
        Matter.Body.setStatic(ballRef.current, false);
      }
    }
  };

  const applyShotItemSetup = (itemId: GameItemId, ball: Matter.Body) => {
    resetBallPhysics(ball);
    activeShotItemRef.current = itemId;
    activeShotMetaRef.current = { triggered: false };
    setActiveShotLabel(GAME_ITEM_MAP[itemId].name);

    switch (itemId) {
      case 'heavy_ball':
        ball.restitution = 0.28;
        ball.friction = 0.03;
        ball.frictionAir = 0.03;
        break;
      case 'ice_ball':
        ball.restitution = 0.93;
        ball.friction = 0.001;
        ball.frictionAir = 0.003;
        break;
      case 'anchor_ball':
        ball.restitution = 0.2;
        ball.friction = 0.09;
        ball.frictionAir = 0.06;
        break;
      case 'feather_ball':
        ball.restitution = 0.9;
        ball.friction = 0.005;
        ball.frictionAir = 0.006;
        break;
      case 'hopper_ball':
        ball.restitution = 1;
        ball.friction = 0.006;
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!sceneRef.current) return;

    const currentLevelIndex = (me?.holesCompleted || 0) % LEVELS.length;
    const level = LEVELS[currentLevelIndex];

    // Setup Matter.js
    const engine = Matter.Engine.create();
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#1e293b' // slate-800
      }
    });

    // Create level bodies
    const staticBodies = level.createWorld();

    // Create hole
    const hole = Matter.Bodies.rectangle(level.holePos.x, level.holePos.y, 40, 20, { 
      label: 'hole',
      isSensor: true, 
      isStatic: true, 
      render: { fillStyle: '#000000' } 
    });

    // Create my ball
    const ball = Matter.Bodies.circle(level.startPos.x, level.startPos.y, 10, {
      restitution: DEFAULT_BALL_PHYSICS.restitution,
      friction: DEFAULT_BALL_PHYSICS.friction,
      frictionStatic: DEFAULT_BALL_PHYSICS.frictionStatic,
      frictionAir: DEFAULT_BALL_PHYSICS.frictionAir,
      density: 0.005,
      label: 'ball',
      render: { fillStyle: me?.color || '#ffffff' }
    });

    Matter.World.add(engine.world, [...staticBodies, hole, ball]);

    Matter.Render.run(render);
    
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    engineRef.current = engine;
    renderRef.current = render;
    runnerRef.current = runner;
    ballRef.current = ball;

    if (freezeBall) {
      Matter.Body.setStatic(ball, true);
    }

    // Sync loop
    let wasMoving = false;
    const syncInterval = setInterval(() => {
      if (ballRef.current) {
        // Out of bounds check
        if (ballRef.current.position.y > 650) {
          Matter.Body.setPosition(ballRef.current, level.startPos);
          Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });
        }

        const speed = Math.sqrt(Math.pow(ballRef.current.velocity.x, 2) + Math.pow(ballRef.current.velocity.y, 2));
        const surfaceContacts = Matter.Query.collides(ballRef.current, staticBodies);
        const isOnDirt = surfaceContacts.some(({ bodyA, bodyB }) => bodyA.label === 'dirt' || bodyB.label === 'dirt');
        if (activeShotItemRef.current === 'feather_ball' && speed > 0.1) {
          Matter.Body.applyForce(ballRef.current, ballRef.current.position, { x: 0, y: -0.00016 });
        }
        if (activeShotItemRef.current === 'magnet_ball') {
          const dx = level.holePos.x - ballRef.current.position.x;
          const dy = level.holePos.y - ballRef.current.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 170 && distance > 10) {
            Matter.Body.applyForce(ballRef.current, ballRef.current.position, {
              x: (dx / distance) * 0.00028,
              y: (dy / distance) * 0.00028,
            });
          }
        }
        if (isOnDirt && speed > 0.12) {
          Matter.Body.setVelocity(ballRef.current, {
            x: ballRef.current.velocity.x * 0.94,
            y: ballRef.current.velocity.y * 0.94,
          });
        }
        if (isSinglePlayer && speed < 0.18) {
          Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(ballRef.current, 0);
        }
        const isMoving = speed > 0.1;

        if (isMoving) {
          if (!isSinglePlayer) {
            socket.emit('ballMoved', {
              roomId,
              x: ballRef.current.position.x,
              y: ballRef.current.position.y
            });
          }
          wasMoving = true;
        } else if (wasMoving) {
          // Ball just stopped
          wasMoving = false;
          if (skipNextStopRef.current) {
            skipNextStopRef.current = false;
            clearShotEffect();
            return;
          }
          clearShotEffect();
          if (isSinglePlayer) {
            singleBallStoppedRef.current?.();
          } else {
            socket.emit('ballStopped', roomId);
          }
        }
      }
    }, 100);

    // Collision detection for hole
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        if ((pair.bodyA === ball && pair.bodyB === hole) || (pair.bodyB === ball && pair.bodyA === hole)) {
          // Hole completed
          skipNextStopRef.current = true;
          playCupInSound();
          clearShotEffect();
          if (isSinglePlayer) {
            singleHoleCompletedRef.current?.();
          } else {
            socket.emit('holeCompleted', roomId);
          }
          stickyHoldRef.current = false;
          // Wait for the next level to load via state update, but reset locally just in case
          Matter.Body.setPosition(ball, level.startPos);
          Matter.Body.setVelocity(ball, { x: 0, y: 0 });
        }
        const otherBody = pair.bodyA === ball
          ? pair.bodyB
          : pair.bodyB === ball
            ? pair.bodyA
            : null;

        if (!otherBody) {
          return;
        }

        if (otherBody.label === 'water') {
          const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y);
          const now = Date.now();
          if (speed > 4.2 && now - lastWaterBounceRef.current > 220) {
            lastWaterBounceRef.current = now;
            Matter.Body.setVelocity(ball, {
              x: ball.velocity.x * 1.03,
              y: -Math.max(3.4, Math.abs(ball.velocity.x) * 0.2),
            });
          } else if (speed > 0.3) {
            Matter.Body.setVelocity(ball, {
              x: ball.velocity.x * 0.82,
              y: ball.velocity.y * 0.55,
            });
          }
        }

        const collidesWithWall = otherBody.isStatic && !otherBody.isSensor;

        if (!collidesWithWall || activeShotMetaRef.current.triggered) {
          return;
        }

        if (activeShotItemRef.current === 'sticky_ball') {
          activeShotMetaRef.current.triggered = true;
          stickyHoldRef.current = true;
          resetBallPhysics(ball);
          Matter.Body.setVelocity(ball, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(ball, 0);
          Matter.Body.setStatic(ball, true);
          activeShotItemRef.current = null;
          setActiveShotLabel(null);
          if (turboTimeoutRef.current) {
            window.clearTimeout(turboTimeoutRef.current);
            turboTimeoutRef.current = null;
          }
          wasMoving = false;
          if (isSinglePlayer) {
            singleBallStoppedRef.current?.();
          } else {
            socket.emit('ballStopped', roomId);
          }
          return;
        }

        if (activeShotItemRef.current === 'hopper_ball') {
          activeShotMetaRef.current.triggered = true;
          Matter.Body.applyForce(ball, ball.position, { x: 0, y: -0.035 });
          return;
        }
      });
    });

    return () => {
      clearInterval(syncInterval);
      clearShotEffect();
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
    };
  }, [roomId, me?.holesCompleted, me?.color, isSinglePlayer, freezeBall]);

  useEffect(() => {
    if (!ballRef.current) return;

    const currentLevelIndex = (me?.holesCompleted || 0) % LEVELS.length;
    const level = LEVELS[currentLevelIndex];

    if (freezeBall) {
      stickyHoldRef.current = false;
      Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(ballRef.current, 0);
      Matter.Body.setPosition(ballRef.current, level.startPos);
      Matter.Body.setStatic(ballRef.current, true);
      return;
    }

    if (ballRef.current.isStatic && !stickyHoldRef.current) {
      Matter.Body.setPosition(ballRef.current, level.startPos);
      Matter.Body.setStatic(ballRef.current, false);
    }
  }, [freezeBall, me?.holesCompleted]);

  const releaseShot = () => {
    if (!isDraggingRef.current || !me?.canShoot || !ballRef.current) {
      clearDragState();
      return;
    }

    const dx = dragStartRef.current.x - dragCurrentRef.current.x;
    const dy = dragStartRef.current.y - dragCurrentRef.current.y;
    const dragDistance = Math.hypot(dx, dy);

    if (dragDistance < 6) {
      clearDragState();
      return;
    }
    
    // Cap velocity
    const maxForce = 0.08;
    const preparedItem = activeItemRef.current;
    const forceMultiplier = preparedItem === 'power_ball'
      ? 1.6
      : preparedItem === 'control_ball'
        ? 0.72
        : 1;
    const forceX = Math.max(-maxForce * forceMultiplier, Math.min(maxForce * forceMultiplier, dx * 0.0004 * forceMultiplier));
    const forceY = Math.max(-maxForce * forceMultiplier, Math.min(maxForce * forceMultiplier, dy * 0.0004 * forceMultiplier));

    if (ballRef.current.isStatic) {
      stickyHoldRef.current = false;
      Matter.Body.setStatic(ballRef.current, false);
    }
    if (preparedItem) {
      applyShotItemSetup(preparedItem, ballRef.current);
      if (preparedItem === 'turbo_ball') {
        turboTimeoutRef.current = window.setTimeout(() => {
          if (!ballRef.current) return;
          const velocity = ballRef.current.velocity;
          const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
          if (speed < 0.02) return;
          Matter.Body.applyForce(ballRef.current, ballRef.current.position, {
            x: velocity.x * 0.0025,
            y: velocity.y * 0.0025,
          });
        }, 260);
      }
      onConsumeActiveItem?.(preparedItem);
      activeItemRef.current = null;
    } else {
      clearShotEffect();
    }

    Matter.Body.applyForce(ballRef.current, ballRef.current.position, { x: forceX, y: forceY });
    clearDragState();
    playHitSound();

    if (isSinglePlayer) {
      onSinglePlayerShot?.({ x: forceX, y: forceY });
    } else {
      socket.emit('playerShot', {
        roomId,
        velocity: { x: forceX, y: forceY }
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    activePointerIdRef.current = e.pointerId;
    sceneRef.current?.setPointerCapture?.(e.pointerId);
    startDragAt(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (!isDragging || activePointerIdRef.current !== e.pointerId) return;
    moveDragAt(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;

    sceneRef.current?.releasePointerCapture?.(e.pointerId);
    releaseShot();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTouchIdRef.current !== null || e.touches.length === 0) return;
    const touch = e.touches[0];
    if (!touch) return;
    if (startDragAt(touch.clientX, touch.clientY)) {
      activeTouchIdRef.current = touch.identifier;
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeTouchIdRef.current === null) return;
    let touch: Touch | null = null;
    for (let i = 0; i < e.touches.length; i += 1) {
      const candidate = e.touches.item(i);
      if (candidate?.identifier === activeTouchIdRef.current) {
        touch = candidate;
        break;
      }
    }
    if (!touch) return;
    moveDragAt(touch.clientX, touch.clientY);
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (activeTouchIdRef.current === null) return;
    let touch: Touch | null = null;
    for (let i = 0; i < e.changedTouches.length; i += 1) {
      const candidate = e.changedTouches.item(i);
      if (candidate?.identifier === activeTouchIdRef.current) {
        touch = candidate;
        break;
      }
    }
    if (!touch) return;
    activeTouchIdRef.current = null;
    e.preventDefault();
    releaseShot();
  };

  return (
    <div className="relative w-full h-full">
      <div 
        ref={sceneRef} 
        className="w-full h-full touch-none select-none [&>canvas]:w-full [&>canvas]:h-full"
        style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Level Indicator */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg font-bold text-xl pointer-events-none">
        Hole {(me?.holesCompleted || 0) + 1}
      </div>

      {activeShotLabel ? (
        <div className="absolute top-4 right-4 bg-amber-400/90 text-slate-950 px-4 py-2 rounded-lg font-bold text-sm pointer-events-none">
          発動中: {activeShotLabel}
        </div>
      ) : null}

      {(() => {
        const currentLevelIndex = (me?.holesCompleted || 0) % LEVELS.length;
        const level = LEVELS[currentLevelIndex];
        return (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${(level.holePos.x / 800) * 100}%`,
              top: `${((level.holePos.y - 58) / 600) * 100}%`,
              transform: 'translate(-50%, 0)',
            }}
          >
            <div className="relative h-[72px] w-12">
              <div className="absolute bottom-0 left-1/2 h-16 w-1.5 -translate-x-1/2 rounded-full bg-slate-100 shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
              <div className="absolute bottom-0 left-1/2 h-2 w-4 -translate-x-1/2 rounded-full bg-slate-300/80" />
              <div className="absolute left-1/2 top-1 h-7 w-8 -translate-x-[1px] overflow-hidden">
                <div className="absolute inset-0 rounded-r-sm bg-gradient-to-br from-rose-400 via-red-500 to-red-700 shadow-lg" />
                <div
                  className="absolute right-0 top-0 h-full w-3 bg-red-900/30"
                  style={{ clipPath: 'polygon(100% 0, 0 18%, 0 82%, 100% 100%)' }}
                />
                <div className="absolute inset-0 rounded-r-sm border border-white/25" />
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Draw drag line and trajectory prediction */}
      {isDragging && (
        <svg className="absolute inset-0 pointer-events-none w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="none">
          {/* Drag Line */}
          <line 
            x1={ballRef.current?.position.x || 0} 
            y1={ballRef.current?.position.y || 0} 
            x2={(ballRef.current?.position.x || 0) - (dragCurrent.x - dragStart.x)} 
            y2={(ballRef.current?.position.y || 0) - (dragCurrent.y - dragStart.y)} 
            stroke="white" 
            strokeWidth="4" 
            strokeDasharray="5,5"
          />
          
          {/* Trajectory Prediction */}
          {(() => {
            if (!ballRef.current) return null;
            
            const dx = dragStart.x - dragCurrent.x;
            const dy = dragStart.y - dragCurrent.y;
            
            const maxForce = 0.08;
            const forceX = Math.max(-maxForce, Math.min(maxForce, dx * 0.0004));
            const forceY = Math.max(-maxForce, Math.min(maxForce, dy * 0.0004));

            // Initial state for prediction
            let px = ballRef.current.position.x;
            let py = ballRef.current.position.y;
            
            // Calculate initial velocity based on force and mass
            // F = m * a => a = F / m
            // v = a * dt (assuming dt is 1 for simplicity in this estimation)
            // Matter.js applies force over time, but for an instantaneous impulse estimation:
            let vx = forceX / ballRef.current.mass;
            let vy = forceY / ballRef.current.mass;

            const points = [];
            const gravity = engineRef.current?.world.gravity || { x: 0, y: 1, scale: 0.001 };
            const frictionAir = ballRef.current.frictionAir;

            // Simulate a few steps for the trajectory
            for (let i = 0; i < 30; i++) {
              // Apply gravity
              vx += gravity.x * gravity.scale * ballRef.current.mass; // Gravity force
              vy += gravity.y * gravity.scale * ballRef.current.mass;

              // Apply air friction (simplified)
              vx *= (1 - frictionAir);
              vy *= (1 - frictionAir);

              px += vx;
              py += vy;

              points.push(`${px},${py}`);
              
              // Stop predicting if it goes out of bounds roughly
              if (py > 600 || px < 0 || px > 800) break;
            }

            if (points.length < 2) return null;

            return (
              <polyline
                points={points.join(' ')}
                fill="none"
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
            );
          })()}
        </svg>
      )}

      {/* Drag to shoot indicator */}
      {me?.canShoot && !isDragging && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
          <div className="bg-black/60 text-white px-8 py-4 rounded-full font-bold text-2xl animate-bounce">
            👆 ボールをドラッグしてショット！
          </div>
        </div>
      )}

      {/* Draw other players */}
      {Object.values(players).map((p: any) => {
        if (p.id === me?.id || p.holesCompleted !== me?.holesCompleted) return null;
        return (
          <div
            key={p.id}
            className="absolute w-5 h-5 rounded-full -ml-2.5 -mt-2.5 pointer-events-none transition-all duration-100"
            style={{
              left: `${(p.x / 800) * 100}%`,
              top: `${(p.y / 600) * 100}%`,
              backgroundColor: p.color || 'white',
              opacity: 0.5
            }}
          >
            <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap text-white">
              {p.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
