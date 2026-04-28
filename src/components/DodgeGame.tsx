import { useEffect, useRef, useState } from 'react';
import AvatarPreview from './AvatarPreview';
import { DODGE_MOVE_SPEED } from '../lib/dodgeConfig';

type DodgeDirection = 'up' | 'down' | 'left' | 'right';
type MoveVector = { x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const SINGLE_OUTFIELD_DEPTH = 58;
const normalizeVector = (vector: MoveVector) => {
  const length = Math.hypot(vector.x, vector.y);
  if (!length) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
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

const getDirectionFromDelta = (dx: number, dy: number): DodgeDirection | null => {
  if (Math.abs(dx) < 0.6 && Math.abs(dy) < 0.6) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
};

type DodgeGameProps = {
  me?: any;
  players: Record<string, any>;
  dodgeState: any;
  onSetMove?: (direction: DodgeDirection | null) => void;
  onSetMoveVector?: (vector: MoveVector | null) => void;
  onThrow?: (aimVector?: MoveVector) => void;
  readOnly?: boolean;
  dodgeMode?: 'single' | 'team';
};

export default function DodgeGame({ me, players, dodgeState, onSetMove, onSetMoveVector, onThrow, readOnly = false, dodgeMode = 'single' }: DodgeGameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [boardViewport, setBoardViewport] = useState<{ width: number; height: number } | null>(null);
  const activeDirectionRef = useRef<DodgeDirection | null>(null);
  const activeVectorRef = useRef<MoveVector | null>(null);
  const onSetMoveRef = useRef(onSetMove);
  const onSetMoveVectorRef = useRef(onSetMoveVector);
  const onThrowRef = useRef(onThrow);
  const motionStateRef = useRef({
    players,
    balls: dodgeState?.balls || [],
    meId: me?.id,
    playerRadius: dodgeState?.playerRadius || 22,
    readOnly,
    width: dodgeState?.width || 960,
    height: dodgeState?.height || 540,
  });
  const [displayPositions, setDisplayPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [displayBallPositions, setDisplayBallPositions] = useState<Record<string, { x: number; y: number; radius: number; dodgeValue?: number; shotType?: string }>>({});
  const [facingByPlayer, setFacingByPlayer] = useState<Record<string, DodgeDirection>>({});
  const previousPositionByPlayerRef = useRef<Record<string, { x: number; y: number }>>({});
  const localStopGraceUntilRef = useRef(0);
  const [joystickState, setJoystickState] = useState<{ active: boolean; originX: number; originY: number; knobX: number; knobY: number }>({
    active: false,
    originX: 0,
    originY: 0,
    knobX: 0,
    knobY: 0,
  });
  const joystickPointerIdRef = useRef<number | null>(null);
  const pressedDirectionsRef = useRef<Set<DodgeDirection>>(new Set());
  const joystickVectorRef = useRef<MoveVector>({ x: 0, y: 0 });

  const width = dodgeState?.width || 960;
  const height = dodgeState?.height || 540;
  const playerRadius = dodgeState?.playerRadius || 22;
  const aspect = width / height;

  useEffect(() => {
    onSetMoveRef.current = onSetMove;
    onSetMoveVectorRef.current = onSetMoveVector;
    onThrowRef.current = onThrow;
  }, [onSetMove, onSetMoveVector, onThrow]);

  useEffect(() => {
    motionStateRef.current = {
      players,
      balls: dodgeState?.balls || [],
      meId: me?.id,
      playerRadius,
      readOnly,
      width,
      height,
    };
  }, [dodgeState?.balls, height, me?.id, playerRadius, players, readOnly, width]);

  const getCurrentAimVector = () => {
    const vector = activeVectorRef.current || getMoveVector(activeDirectionRef.current);
    const normalized = normalizeVector(vector);
    if (!normalized.x && !normalized.y) return undefined;
    return normalized;
  };

  const setMoveDirection = (direction: DodgeDirection | null) => {
    activeVectorRef.current = null;
    activeDirectionRef.current = direction;
    onSetMoveRef.current?.(direction);
  };

  const setMoveVector = (vector: MoveVector | null) => {
    if (!vector) {
      localStopGraceUntilRef.current = performance.now() + 140;
      activeVectorRef.current = null;
      onSetMoveVectorRef.current?.(null);
      setMoveDirection(null);
      return;
    }
    const normalized = normalizeVector(vector);
    activeVectorRef.current = normalized;
    onSetMoveVectorRef.current?.(normalized);
  };

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const updateViewport = () => {
      const rect = frame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      let nextWidth = rect.width;
      let nextHeight = nextWidth / aspect;
      if (nextHeight > rect.height) {
        nextHeight = rect.height;
        nextWidth = nextHeight * aspect;
      }
      setBoardViewport({ width: nextWidth, height: nextHeight });
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(frame);
    window.addEventListener('resize', updateViewport);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateViewport);
    };
  }, [aspect]);

  useEffect(() => {
    const ids = new Set(Object.keys(players || {}));
    setDisplayPositions((current) => {
      const next = { ...current };
      Object.entries(players || {}).forEach(([id, player]: [string, any]) => {
        if (!next[id]) {
          next[id] = { x: player.x, y: player.y };
        } else if (id !== me?.id && (!player.alive || !current[id])) {
          next[id] = { x: player.x, y: player.y };
        }
      });
      Object.keys(next).forEach((id) => {
        if (!ids.has(id)) {
          delete next[id];
        }
      });
      return next;
    });
  }, [me?.id, players]);

  useEffect(() => {
    const ballIds = new Set((dodgeState?.balls || []).map((ball: any) => String(ball.id)));
      setDisplayBallPositions((current) => {
        const next = { ...current };
        (dodgeState?.balls || []).forEach((ball: any) => {
          const id = String(ball.id);
          if (!next[id]) {
            next[id] = { x: ball.x, y: ball.y, radius: ball.radius, dodgeValue: ball.dodgeValue, shotType: ball.shotType };
          } else {
            next[id] = { ...next[id], radius: ball.radius, dodgeValue: ball.dodgeValue, shotType: ball.shotType };
          }
        });
      Object.keys(next).forEach((id) => {
        if (!ballIds.has(id)) delete next[id];
      });
      return next;
    });
  }, [dodgeState?.balls]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const motion = motionStateRef.current;

      setDisplayPositions((current) => {
        let changed = false;
        const next: Record<string, { x: number; y: number }> = {};

        Object.entries(motion.players || {}).forEach(([id, player]: [string, any]) => {
          const currentPos = current[id] || { x: player.x, y: player.y };
          let nextX = currentPos.x;
          let nextY = currentPos.y;

          if (!motion.readOnly && motion.meId === id && player.alive) {
            const moveVector = activeVectorRef.current || getMoveVector(activeDirectionRef.current);
            if (moveVector.x || moveVector.y) {
              const predictedX = clamp(currentPos.x + moveVector.x * DODGE_MOVE_SPEED * dt, motion.playerRadius, motion.width - motion.playerRadius);
              const predictedY = clamp(currentPos.y + moveVector.y * DODGE_MOVE_SPEED * dt, motion.playerRadius, motion.height - motion.playerRadius);
              const correction = Math.min(0.35, 1 - Math.exp(-6 * dt));
              nextX = predictedX + (player.x - predictedX) * correction;
              nextY = predictedY + (player.y - predictedY) * correction;
            } else {
              const isWithinStopGrace = now < localStopGraceUntilRef.current;
              if (!isWithinStopGrace) {
                const easing = 1 - Math.exp(-9 * dt);
                nextX = currentPos.x + (player.x - currentPos.x) * easing;
                nextY = currentPos.y + (player.y - currentPos.y) * easing;
              }
            }
          } else {
            const easing = 1 - Math.exp(-20 * dt);
            nextX = currentPos.x + (player.x - currentPos.x) * easing;
            nextY = currentPos.y + (player.y - currentPos.y) * easing;
          }

          if (!player.alive) {
            nextX = player.x;
            nextY = player.y;
          }

          if (Math.abs(nextX - currentPos.x) > 0.02 || Math.abs(nextY - currentPos.y) > 0.02) {
            changed = true;
          }

          next[id] = {
            x: Math.abs(player.x - nextX) < 0.03 ? player.x : nextX,
            y: Math.abs(player.y - nextY) < 0.03 ? player.y : nextY,
          };
        });

        return changed ? next : current;
      });

      setDisplayBallPositions((current) => {
        const next: Record<string, { x: number; y: number; radius: number; dodgeValue?: number; shotType?: string }> = {};
        let changed = false;
        (motion.balls || []).forEach((ball: any) => {
          const id = String(ball.id);
          const currentPos = current[id] || { x: ball.x, y: ball.y, radius: ball.radius, dodgeValue: ball.dodgeValue, shotType: ball.shotType };
          const distance = Math.hypot(ball.x - currentPos.x, ball.y - currentPos.y);
          const snapDistance = Math.max(ball.radius * 8, 120);
          const easing = 1 - Math.exp(-30 * dt);
          const nextX = distance > snapDistance ? ball.x : currentPos.x + (ball.x - currentPos.x) * easing;
          const nextY = distance > snapDistance ? ball.y : currentPos.y + (ball.y - currentPos.y) * easing;
          if (Math.abs(nextX - currentPos.x) > 0.02 || Math.abs(nextY - currentPos.y) > 0.02 || currentPos.radius !== ball.radius || currentPos.shotType !== ball.shotType || currentPos.dodgeValue !== ball.dodgeValue) {
            changed = true;
          }
          next[id] = {
            x: Math.abs(ball.x - nextX) < 0.02 ? ball.x : nextX,
            y: Math.abs(ball.y - nextY) < 0.02 ? ball.y : nextY,
            radius: ball.radius,
            dodgeValue: ball.dodgeValue,
            shotType: ball.shotType,
          };
        });
        if (!changed && Object.keys(current).length === Object.keys(next).length) return current;
        return next;
      });

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (readOnly || !onSetMoveRef.current || !onThrowRef.current) return;

    const getDirectionFromKey = (key: string): DodgeDirection | null => {
      if (['ArrowUp', 'w', 'W'].includes(key)) return 'up';
      if (['ArrowDown', 's', 'S'].includes(key)) return 'down';
      if (['ArrowLeft', 'a', 'A'].includes(key)) return 'left';
      if (['ArrowRight', 'd', 'D'].includes(key)) return 'right';
      return null;
    };

    const updateKeyboardMoveVector = () => {
      const pressed = pressedDirectionsRef.current;
      const vector = {
        x: (pressed.has('right') ? 1 : 0) - (pressed.has('left') ? 1 : 0),
        y: (pressed.has('down') ? 1 : 0) - (pressed.has('up') ? 1 : 0),
      };
      if (!vector.x && !vector.y) {
        setMoveVector(null);
        return;
      }
      setMoveVector(vector);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const direction = getDirectionFromKey(event.key);
      if (direction) {
        event.preventDefault();
        if (!pressedDirectionsRef.current.has(direction)) {
          pressedDirectionsRef.current.add(direction);
          updateKeyboardMoveVector();
        }
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        onThrowRef.current?.(getCurrentAimVector());
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const direction = getDirectionFromKey(event.key);
      if (!direction) return;
      if (pressedDirectionsRef.current.has(direction)) {
        pressedDirectionsRef.current.delete(direction);
        updateKeyboardMoveVector();
      }
    };

    const stopAll = () => {
      pressedDirectionsRef.current.clear();
      setMoveVector(null);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', stopAll);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', stopAll);
      setMoveVector(null);
    };
  }, [readOnly]);

  useEffect(() => {
    const nextPositions: Record<string, { x: number; y: number }> = {};
    const nextFacingUpdates: Record<string, DodgeDirection> = {};
    Object.values(players || {}).forEach((player: any) => {
      if (typeof player?.x !== 'number' || typeof player?.y !== 'number') return;
      const previous = previousPositionByPlayerRef.current[player.id];
      const directionFromMove = previous ? getDirectionFromDelta(player.x - previous.x, player.y - previous.y) : null;
      const fallbackDirection: DodgeDirection | null = player.dodgeFacing || null;
      const nextDirection = directionFromMove || fallbackDirection;
      if (nextDirection) {
        nextFacingUpdates[player.id] = nextDirection;
      }
      nextPositions[player.id] = { x: player.x, y: player.y };
    });
    previousPositionByPlayerRef.current = nextPositions;
    setFacingByPlayer((current) => {
      let changed = false;
      const merged = { ...current };
      Object.entries(nextFacingUpdates).forEach(([id, direction]) => {
        if (merged[id] !== direction) {
          merged[id] = direction;
          changed = true;
        }
      });
      return changed ? merged : current;
    });
  }, [players]);

  if (!dodgeState) {
    return <div className="flex h-full items-center justify-center text-slate-400">コートを準備しています...</div>;
  }

  const joystickRadius = 64;
  const aliveCount = Object.values(players || {}).filter((player: any) => player.alive).length;

  const moveJoystick = (event: any) => {
    if (joystickPointerIdRef.current !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const dx = localX - joystickState.originX;
    const dy = localY - joystickState.originY;
    const distance = Math.hypot(dx, dy);
    const ratio = distance > joystickRadius ? joystickRadius / distance : 1;
    const rawX = (dx * ratio) / joystickRadius;
    const rawY = (dy * ratio) / joystickRadius;
    const smoothing = 0.4;
    const smoothedX = joystickVectorRef.current.x + (rawX - joystickVectorRef.current.x) * smoothing;
    const smoothedY = joystickVectorRef.current.y + (rawY - joystickVectorRef.current.y) * smoothing;
    joystickVectorRef.current = { x: smoothedX, y: smoothedY };
    const limitedX = smoothedX * joystickRadius;
    const limitedY = smoothedY * joystickRadius;
    setJoystickState((current) => ({
      ...current,
      knobX: limitedX,
      knobY: limitedY,
    }));
    setMoveVector(joystickVectorRef.current);
  };

  const releaseJoystick = (event?: any) => {
    if (event && joystickPointerIdRef.current !== event.pointerId) return;
    joystickPointerIdRef.current = null;
    joystickVectorRef.current = { x: 0, y: 0 };
    setJoystickState((current) => ({
      ...current,
      active: false,
      knobX: 0,
      knobY: 0,
    }));
    setMoveVector(null);
  };

  return (
    <div className="relative flex h-full min-h-[260px] w-full flex-col items-center">
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/70 p-2">
        <div ref={frameRef} className="relative flex h-full w-full items-center justify-center overflow-hidden">
          <div
            className="relative overflow-hidden rounded-[1.75rem] border border-slate-700 bg-[radial-gradient(circle_at_top,#1e3a5f,#0f172a_58%,#020617)]"
            style={{
              width: boardViewport?.width ?? '100%',
              height: boardViewport?.height ?? '100%',
            }}
          >
            <div className="absolute inset-[5.5%] rounded-[1.5rem] border-2 border-white/25" />
            <div className="absolute left-1/2 top-1/2 h-[30%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-white/10 bg-white/5" />
            <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/15" />

            {dodgeMode === 'single' ? (
              <div
                className="pointer-events-none absolute border border-white/10"
                style={{
                  left: `${(SINGLE_OUTFIELD_DEPTH / width) * 100}%`,
                  top: `${(SINGLE_OUTFIELD_DEPTH / height) * 100}%`,
                  width: `${((width - SINGLE_OUTFIELD_DEPTH * 2) / width) * 100}%`,
                  height: `${((height - SINGLE_OUTFIELD_DEPTH * 2) / height) * 100}%`,
                }}
              />
            ) : null}

            {(Object.entries(displayBallPositions) as Array<[string, { x: number; y: number; radius: number; dodgeValue?: number; shotType?: string }]>).map(([id, ball]) => (
              <div
                key={id}
                className={`absolute flex items-center justify-center rounded-full border text-[10px] font-black text-slate-950 ${
                  ball.shotType === 'fast'
                    ? 'border-rose-200 bg-rose-400 shadow-[0_0_22px_rgba(251,113,133,0.72)]'
                    : ball.shotType === 'wave'
                      ? 'border-fuchsia-200 bg-fuchsia-400 shadow-[0_0_22px_rgba(232,121,249,0.72)]'
                      : ball.shotType === 'homing'
                        ? 'border-lime-200 bg-lime-400 shadow-[0_0_22px_rgba(163,230,53,0.72)]'
                        : 'border-white/40 bg-orange-400 shadow-[0_0_18px_rgba(251,146,60,0.55)]'
                }`}
                style={{
                  width: `${(ball.radius * 2 / width) * 100}%`,
                  height: `${(ball.radius * 2 / height) * 100}%`,
                  left: `${((ball.x - ball.radius) / width) * 100}%`,
                  top: `${((ball.y - ball.radius) / height) * 100}%`,
                  willChange: 'left, top, transform',
                  transform: 'translateZ(0)',
                }}
              >
                {ball.dodgeValue ?? 0}
              </div>
            ))}

            {Object.values(players || {}).map((player: any) => {
              const displayPos = displayPositions[player.id] || { x: player.x, y: player.y };
              const sizePercent = ((playerRadius * 2) / width) * 100;
              const heightPercent = ((playerRadius * 2 + 24) / height) * 100;
              const isWinner = aliveCount === 1 && player.alive;
              const expression = isWinner ? 'happy' : player.alive ? 'normal' : 'sad';
              const faceDirection = facingByPlayer[player.id] || player.dodgeFacing || 'front';
              return (
                <div
                  key={player.id}
                  className={`absolute ${player.alive ? 'opacity-100' : 'opacity-30'} transition-opacity duration-150`}
                  style={{
                    width: `${sizePercent}%`,
                    height: `${heightPercent}%`,
                    left: `${((displayPos.x - playerRadius) / width) * 100}%`,
                    top: `${((displayPos.y - playerRadius - 12) / height) * 100}%`,
                    transition: 'opacity 120ms linear',
                  }}
                >
                  <div className="relative h-full w-full">
                    <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
                      <AvatarPreview
                        avatar={player.avatar}
                        size={Math.max(20, Math.min(30, playerRadius + 4))}
                        faceDirection={faceDirection}
                        expression={expression} viewMode="topdown"
                      />
                    </div>
                    <div
                      className="absolute bottom-0 left-0 z-0 flex items-center justify-center rounded-2xl border-2 text-[10px] font-black text-slate-950 shadow-md"
                      style={{
                        width: '100%',
                        height: 'calc(100% - 14px)',
                        backgroundColor: player.color || 'white',
                        borderColor: player.id === me?.id ? '#ffffff' : 'rgba(255,255,255,0.35)',
                      }}
                    >
                      {String(player.name || '?').slice(0, 1)}
                    </div>
                    {player.dodgeHasBall ? (
                      <div className="absolute -right-2 -top-2 rounded-full border border-amber-200 bg-amber-400 px-1.5 text-[10px] font-black leading-5 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.65)]">
                        🏐
                      </div>
                    ) : null}
                    {player.dodgeRole === 'outfield' ? (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-violet-500/80 px-2 py-0.5 text-[9px] font-bold text-white">
                        外
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!readOnly ? (
        <div className="pointer-events-none absolute inset-0 z-20">
          <div
            className="pointer-events-auto absolute inset-0 touch-none"
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture?.(event.pointerId);
              const rect = event.currentTarget.getBoundingClientRect();
              joystickPointerIdRef.current = event.pointerId;
              setJoystickState({
                active: true,
                originX: event.clientX - rect.left,
                originY: event.clientY - rect.top,
                knobX: 0,
                knobY: 0,
              });
              joystickVectorRef.current = { x: 0, y: 0 };
            }}
            onPointerMove={moveJoystick}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture?.(event.pointerId);
              releaseJoystick(event);
            }}
            onPointerCancel={(event) => {
              event.currentTarget.releasePointerCapture?.(event.pointerId);
              releaseJoystick(event);
            }}
          >
            {joystickState.active ? (
              <div className="absolute inset-0">
                <div
                  className="absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/30 bg-cyan-500/10"
                  style={{
                    left: joystickState.originX,
                    top: joystickState.originY,
                  }}
                />
                <div
                  className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/70 bg-cyan-400/60 shadow-[0_0_18px_rgba(34,211,238,0.6)]"
                  style={{
                    left: joystickState.originX + joystickState.knobX,
                    top: joystickState.originY + joystickState.knobY,
                  }}
                />
              </div>
            ) : null}
          </div>
          <button
            className="pointer-events-auto absolute bottom-4 right-3 z-30 flex h-14 w-24 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-600/65 text-sm font-black tracking-wide text-white shadow-[0_0_20px_rgba(34,211,238,0.25)] backdrop-blur-sm active:scale-95 active:bg-cyan-500/75 md:bottom-5 md:right-4"
            onPointerDown={(event) => {
              event.preventDefault();
              onThrowRef.current?.(getCurrentAimVector());
            }}
            onClick={(event) => event.preventDefault()}
          >
            THROW
          </button>
        </div>
      ) : null}
    </div>
  );
}
