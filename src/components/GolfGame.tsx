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

const LEVELS: Level[] = [
  {
    // Level 1: Classic
    startPos: { x: 100, y: 500 },
    holePos: { x: 700, y: 550 },
    createWorld: () => [
      Matter.Bodies.rectangle(400, 590, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(0, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(800, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(400, 0, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(300, 400, 20, 200, { isStatic: true, render: { fillStyle: '#f87171' } }),
      Matter.Bodies.rectangle(500, 200, 20, 200, { isStatic: true, render: { fillStyle: '#f87171' } }),
    ]
  },
  {
    // Level 2: The High Wall
    startPos: { x: 100, y: 500 },
    holePos: { x: 700, y: 550 },
    createWorld: () => [
      Matter.Bodies.rectangle(400, 590, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(0, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(800, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(400, 0, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(400, 450, 40, 250, { isStatic: true, render: { fillStyle: '#f87171' } }),
    ]
  },
  {
    // Level 3: The Tunnel
    startPos: { x: 100, y: 500 },
    holePos: { x: 700, y: 500 },
    createWorld: () => [
      Matter.Bodies.rectangle(400, 590, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(0, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(800, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(400, 0, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      // Lower wall (blocks direct path)
      Matter.Bodies.rectangle(400, 430, 40, 280, { isStatic: true, render: { fillStyle: '#f87171' } }),
      // Upper wall (blocks path above tunnel)
      Matter.Bodies.rectangle(400, 100, 40, 160, { isStatic: true, render: { fillStyle: '#f87171' } }),
      // Tunnel bottom
      Matter.Bodies.rectangle(400, 280, 300, 20, { isStatic: true, render: { fillStyle: '#f87171' } }),
      // Tunnel top
      Matter.Bodies.rectangle(400, 190, 300, 20, { isStatic: true, render: { fillStyle: '#f87171' } }),
    ]
  },
  {
    // Level 4: The Pyramid
    startPos: { x: 100, y: 500 },
    holePos: { x: 700, y: 500 },
    createWorld: () => [
      Matter.Bodies.rectangle(400, 590, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(0, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(800, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(400, 0, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(250, 500, 100, 150, { isStatic: true, render: { fillStyle: '#f87171' } }),
      Matter.Bodies.rectangle(400, 450, 100, 250, { isStatic: true, render: { fillStyle: '#f87171' } }),
      Matter.Bodies.rectangle(550, 500, 100, 150, { isStatic: true, render: { fillStyle: '#f87171' } }),
    ]
  },
  {
    // Level 5: Floating Islands
    startPos: { x: 100, y: 200 },
    holePos: { x: 700, y: 200 },
    createWorld: () => [
      Matter.Bodies.rectangle(0, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(800, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(400, 0, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(100, 300, 200, 40, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(400, 400, 150, 40, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(700, 300, 200, 40, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(400, 590, 810, 60, { isSensor: true, isStatic: true, render: { fillStyle: '#1e293b' } }),
    ]
  },
  {
    // Level 6: The Long Drive (Horizontal)
    startPos: { x: 50, y: 500 },
    holePos: { x: 750, y: 100 },
    createWorld: () => [
      Matter.Bodies.rectangle(400, 590, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(0, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(800, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(400, 0, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      // Platforms stepping up
      Matter.Bodies.rectangle(200, 450, 100, 20, { isStatic: true, render: { fillStyle: '#f87171' } }),
      Matter.Bodies.rectangle(400, 350, 100, 20, { isStatic: true, render: { fillStyle: '#f87171' } }),
      Matter.Bodies.rectangle(600, 250, 100, 20, { isStatic: true, render: { fillStyle: '#f87171' } }),
      Matter.Bodies.rectangle(750, 150, 100, 20, { isStatic: true, render: { fillStyle: '#4ade80' } }),
    ]
  },
  {
    // Level 7: The Vertical Drop
    startPos: { x: 100, y: 100 },
    holePos: { x: 700, y: 550 },
    createWorld: () => [
      Matter.Bodies.rectangle(400, 590, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(0, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(800, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(400, 0, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      // Starting platform
      Matter.Bodies.rectangle(100, 150, 150, 20, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      // Bouncing walls
      Matter.Bodies.rectangle(300, 250, 20, 150, { isStatic: true, angle: Math.PI / 4, render: { fillStyle: '#f87171' } }),
      Matter.Bodies.rectangle(500, 400, 20, 150, { isStatic: true, angle: -Math.PI / 4, render: { fillStyle: '#f87171' } }),
    ]
  },
  {
    // Level 8: The Maze
    startPos: { x: 50, y: 50 },
    holePos: { x: 750, y: 550 },
    createWorld: () => [
      Matter.Bodies.rectangle(400, 590, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(0, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(800, 300, 60, 600, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      Matter.Bodies.rectangle(400, 0, 810, 60, { isStatic: true, render: { fillStyle: '#4ade80' } }),
      
      // Top corridor floor (gap on right)
      Matter.Bodies.rectangle(325, 150, 650, 20, { isStatic: true, render: { fillStyle: '#f87171' } }),
      // Hurdle in top corridor
      Matter.Bodies.rectangle(400, 120, 20, 40, { isStatic: true, render: { fillStyle: '#f87171' } }),
      
      // Middle corridor floor (gap on left)
      Matter.Bodies.rectangle(475, 300, 650, 20, { isStatic: true, render: { fillStyle: '#f87171' } }),
      // Hurdle in middle corridor
      Matter.Bodies.rectangle(400, 270, 20, 40, { isStatic: true, render: { fillStyle: '#f87171' } }),
      
      // Bottom corridor floor (gap on right)
      Matter.Bodies.rectangle(325, 450, 650, 20, { isStatic: true, render: { fillStyle: '#f87171' } }),
      // Hurdle in bottom corridor
      Matter.Bodies.rectangle(400, 420, 20, 40, { isStatic: true, render: { fillStyle: '#f87171' } }),
    ]
  }
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
        const collidesWithWall = pair.bodyA === ball
          ? pair.bodyB.isStatic && !pair.bodyB.isSensor
          : pair.bodyB === ball
            ? pair.bodyA.isStatic && !pair.bodyA.isSensor
            : false;

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
