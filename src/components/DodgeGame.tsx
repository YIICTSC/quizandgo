import { useEffect, useRef, useState } from 'react';
import AvatarPreview from './AvatarPreview';

type DodgeDirection = 'up' | 'down' | 'left' | 'right';
type MoveVector = { x: number; y: number };

const DODGE_MOVE_SPEED = 340;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
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

type DodgeGameProps = {
  me?: any;
  players: Record<string, any>;
  dodgeState: any;
  onSetMove?: (direction: DodgeDirection | null) => void;
  onSetMoveVector?: (vector: MoveVector | null) => void;
  onThrow?: () => void;
  readOnly?: boolean;
};

export default function DodgeGame({ me, players, dodgeState, onSetMove, onSetMoveVector, onThrow, readOnly = false }: DodgeGameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [boardViewport, setBoardViewport] = useState<{ width: number; height: number } | null>(null);
  const activeDirectionRef = useRef<DodgeDirection | null>(null);
  const activeVectorRef = useRef<MoveVector | null>(null);
  const onSetMoveRef = useRef(onSetMove);
  const onSetMoveVectorRef = useRef(onSetMoveVector);
  const onThrowRef = useRef(onThrow);
  const [displayPositions, setDisplayPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [joystickState, setJoystickState] = useState<{ active: boolean; originX: number; originY: number; knobX: number; knobY: number }>({
    active: false,
    originX: 0,
    originY: 0,
    knobX: 0,
    knobY: 0,
  });
  const joystickPointerIdRef = useRef<number | null>(null);

  const width = dodgeState?.width || 960;
  const height = dodgeState?.height || 540;
  const playerRadius = dodgeState?.playerRadius || 22;
  const aspect = width / height;

  useEffect(() => {
    onSetMoveRef.current = onSetMove;
    onSetMoveVectorRef.current = onSetMoveVector;
    onThrowRef.current = onThrow;
  }, [onSetMove, onSetMoveVector, onThrow]);

  const setMoveDirection = (direction: DodgeDirection | null) => {
    activeVectorRef.current = null;
    activeDirectionRef.current = direction;
    onSetMoveRef.current?.(direction);
  };

  const setMoveVector = (vector: MoveVector | null) => {
    if (!vector) {
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
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      setDisplayPositions((current) => {
        let changed = false;
        const next: Record<string, { x: number; y: number }> = {};

        Object.entries(players || {}).forEach(([id, player]: [string, any]) => {
          const currentPos = current[id] || { x: player.x, y: player.y };
          let nextX = currentPos.x;
          let nextY = currentPos.y;

          if (!readOnly && me?.id === id && player.alive) {
            const moveVector = activeVectorRef.current || getMoveVector(activeDirectionRef.current);
            if (moveVector.x || moveVector.y) {
              nextX = clamp(currentPos.x + moveVector.x * DODGE_MOVE_SPEED * dt, playerRadius, width - playerRadius);
              nextY = clamp(currentPos.y + moveVector.y * DODGE_MOVE_SPEED * dt, playerRadius, height - playerRadius);
            } else {
              nextX = currentPos.x + (player.x - currentPos.x) * 0.72;
              nextY = currentPos.y + (player.y - currentPos.y) * 0.72;
            }
          } else {
            nextX = currentPos.x + (player.x - currentPos.x) * 0.52;
            nextY = currentPos.y + (player.y - currentPos.y) * 0.52;
          }

          if (!player.alive) {
            nextX = player.x;
            nextY = player.y;
          }

          if (Math.abs(nextX - currentPos.x) > 0.05 || Math.abs(nextY - currentPos.y) > 0.05) {
            changed = true;
          }

          next[id] = {
            x: Math.abs(player.x - nextX) < 0.08 ? player.x : nextX,
            y: Math.abs(player.y - nextY) < 0.08 ? player.y : nextY,
          };
        });

        return changed ? next : current;
      });

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [me?.id, playerRadius, players, readOnly, width, height]);

  useEffect(() => {
    if (readOnly || !onSetMoveRef.current || !onThrowRef.current) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(event.key)) {
        event.preventDefault();
        if (activeDirectionRef.current !== 'up') setMoveDirection('up');
      } else if (['ArrowDown', 's', 'S'].includes(event.key)) {
        event.preventDefault();
        if (activeDirectionRef.current !== 'down') setMoveDirection('down');
      } else if (['ArrowLeft', 'a', 'A'].includes(event.key)) {
        event.preventDefault();
        if (activeDirectionRef.current !== 'left') setMoveDirection('left');
      } else if (['ArrowRight', 'd', 'D'].includes(event.key)) {
        event.preventDefault();
        if (activeDirectionRef.current !== 'right') setMoveDirection('right');
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        onThrowRef.current?.();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (
        (activeDirectionRef.current === 'up' && ['ArrowUp', 'w', 'W'].includes(event.key)) ||
        (activeDirectionRef.current === 'down' && ['ArrowDown', 's', 'S'].includes(event.key)) ||
        (activeDirectionRef.current === 'left' && ['ArrowLeft', 'a', 'A'].includes(event.key)) ||
        (activeDirectionRef.current === 'right' && ['ArrowRight', 'd', 'D'].includes(event.key))
      ) {
        setMoveVector(null);
      }
    };

    const stopAll = () => setMoveVector(null);

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

  if (!dodgeState) {
    return <div className="flex h-full items-center justify-center text-slate-400">コートを準備しています...</div>;
  }

  const joystickRadius = 64;

  const moveJoystick = (event: any) => {
    if (joystickPointerIdRef.current !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const dx = localX - joystickState.originX;
    const dy = localY - joystickState.originY;
    const distance = Math.hypot(dx, dy);
    const ratio = distance > joystickRadius ? joystickRadius / distance : 1;
    const limitedX = dx * ratio;
    const limitedY = dy * ratio;
    setJoystickState((current) => ({
      ...current,
      knobX: limitedX,
      knobY: limitedY,
    }));
    setMoveVector({
      x: limitedX / joystickRadius,
      y: limitedY / joystickRadius,
    });
  };

  const releaseJoystick = (event?: any) => {
    if (event && joystickPointerIdRef.current !== event.pointerId) return;
    joystickPointerIdRef.current = null;
    setJoystickState((current) => ({
      ...current,
      active: false,
      knobX: 0,
      knobY: 0,
    }));
    setMoveVector(null);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col items-center">
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
            <div className="absolute bottom-[12%] left-1/2 h-[30%] w-[16%] -translate-x-1/2 rounded-[999px] border border-white/10 bg-white/5" />
            <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/15" />

            {(dodgeState.balls || []).map((ball: any) => (
              <div
                key={ball.id}
                className="absolute rounded-full border border-white/40 bg-orange-400 shadow-[0_0_18px_rgba(251,146,60,0.55)]"
                style={{
                  width: `${(ball.radius * 2 / width) * 100}%`,
                  height: `${(ball.radius * 2 / height) * 100}%`,
                  left: `${((ball.x - ball.radius) / width) * 100}%`,
                  top: `${((ball.y - ball.radius) / height) * 100}%`,
                  willChange: 'left, top',
                }}
              />
            ))}

            {Object.values(players || {}).map((player: any) => {
              const displayPos = displayPositions[player.id] || { x: player.x, y: player.y };
              const sizePercent = ((playerRadius * 2) / width) * 100;
              const heightPercent = ((playerRadius * 2 + 24) / height) * 100;
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
                      <AvatarPreview avatar={player.avatar} size={Math.max(20, Math.min(30, playerRadius + 4))} />
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
            onClick={onThrow}
          >
            THROW
          </button>
        </div>
      ) : null}
    </div>
  );
}
