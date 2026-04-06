import { useEffect, useRef, useState } from 'react';
import AvatarPreview from './AvatarPreview';
import { BOMBER_ITEM_META, BomberItemId } from '../lib/bomberItems';

type BomberGameProps = {
  roomId: string;
  me: any;
  players: Record<string, any>;
  bomberState: any;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onPlaceBomb: () => void;
  onDetonateRemote?: () => void;
  canUseRemote?: boolean;
};

const floorTileStyle = {
  backgroundColor: '#3f3f46',
  backgroundImage:
    'linear-gradient(0deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05)), repeating-linear-gradient(0deg, #3f3f46 0 3px, #52525b 3px 4px, #3f3f46 4px 8px), repeating-linear-gradient(90deg, #3f3f46 0 3px, #52525b 3px 4px, #3f3f46 4px 8px)',
} as const;

const solidTileStyle = {
  backgroundColor: '#7c5d42',
  backgroundImage:
    'linear-gradient(145deg, rgba(255,255,255,0.22) 0 20%, transparent 20% 100%), repeating-linear-gradient(0deg, #6b4f37 0 3px, #7c5d42 3px 6px), repeating-linear-gradient(90deg, #6b4f37 0 3px, #7c5d42 3px 6px)',
  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(41,25,14,0.7)',
} as const;

const breakableTileStyle = {
  backgroundColor: '#c08457',
  backgroundImage:
    'linear-gradient(135deg, rgba(255,255,255,0.22) 0 15%, transparent 15% 100%), repeating-linear-gradient(0deg, #b27748 0 2px, #c08457 2px 4px), repeating-linear-gradient(90deg, #b27748 0 2px, #c08457 2px 4px)',
  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(120,53,15,0.65)',
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const getDirectionFromDelta = (dx: number, dy: number): 'up' | 'down' | 'left' | 'right' | null => {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
};

const getAutoZoomScale = (width: number, height: number) => {
  const maxSide = Math.max(width, height);
  const area = width * height;
  if (maxSide <= 21 && area <= 400) return 1;
  if (maxSide <= 31 && area <= 800) return 1.25;
  if (maxSide <= 45 && area <= 1600) return 1.55;
  return 1.95;
};

const getBomberMoveRepeatMs = (moveSpeedLevel = 0) => {
  const clamped = Math.max(0, Math.min(3, moveSpeedLevel));
  return [180, 160, 140, 125][clamped];
};

export default function BomberGame({ roomId, me, players, bomberState, onMove, onPlaceBomb, onDetonateRemote, canUseRemote = false }: BomberGameProps) {
  const boardFrameRef = useRef<HTMLDivElement | null>(null);
  const [boardViewport, setBoardViewport] = useState<{ width: number; height: number } | null>(null);
  const moveHoldIntervalRef = useRef<number | null>(null);
  const activeMoveDirectionRef = useRef<'up' | 'down' | 'left' | 'right' | null>(null);
  const joystickPointerIdRef = useRef<number | null>(null);
  const previousPositionByPlayerRef = useRef<Record<string, { x: number; y: number }>>({});
  const [facingByPlayer, setFacingByPlayer] = useState<Record<string, 'up' | 'down' | 'left' | 'right'>>({});
  const [joystickState, setJoystickState] = useState<{ active: boolean; originX: number; originY: number; knobX: number; knobY: number }>({
    active: false,
    originX: 0,
    originY: 0,
    knobX: 0,
    knobY: 0,
  });
  const moveRepeatMs = getBomberMoveRepeatMs(me?.moveSpeedLevel || 0);

  const stopMoveHold = () => {
    activeMoveDirectionRef.current = null;
    if (moveHoldIntervalRef.current !== null) {
      window.clearInterval(moveHoldIntervalRef.current);
      moveHoldIntervalRef.current = null;
    }
  };

  const startMoveHold = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (activeMoveDirectionRef.current === direction && moveHoldIntervalRef.current !== null) {
      return;
    }

    stopMoveHold();
    activeMoveDirectionRef.current = direction;
    onMove(direction);
    moveHoldIntervalRef.current = window.setInterval(() => {
      if (activeMoveDirectionRef.current !== direction) return;
      onMove(direction);
    }, moveRepeatMs);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(event.key)) {
        event.preventDefault();
        startMoveHold('up');
      } else if (['ArrowDown', 's', 'S'].includes(event.key)) {
        event.preventDefault();
        startMoveHold('down');
      } else if (['ArrowLeft', 'a', 'A'].includes(event.key)) {
        event.preventDefault();
        startMoveHold('left');
      } else if (['ArrowRight', 'd', 'D'].includes(event.key)) {
        event.preventDefault();
        startMoveHold('right');
      } else if (event.key === ' ' || event.key === 'Enter' || event.key === 'b' || event.key === 'B') {
        event.preventDefault();
        onPlaceBomb();
      } else if ((event.key === 'r' || event.key === 'R') && canUseRemote && onDetonateRemote) {
        event.preventDefault();
        onDetonateRemote();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (
        (activeMoveDirectionRef.current === 'up' && ['ArrowUp', 'w', 'W'].includes(event.key)) ||
        (activeMoveDirectionRef.current === 'down' && ['ArrowDown', 's', 'S'].includes(event.key)) ||
        (activeMoveDirectionRef.current === 'left' && ['ArrowLeft', 'a', 'A'].includes(event.key)) ||
        (activeMoveDirectionRef.current === 'right' && ['ArrowRight', 'd', 'D'].includes(event.key))
      ) {
        stopMoveHold();
      }
    };

    const stopAllMovement = () => {
      stopMoveHold();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', stopAllMovement);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', stopAllMovement);
      stopMoveHold();
    };
  }, [canUseRemote, moveRepeatMs, onDetonateRemote, onMove, onPlaceBomb, roomId]);

  if (!bomberState) {
    return <div className="flex h-full items-center justify-center text-slate-400">盤面を準備しています...</div>;
  }

  const width = bomberState.width || 21;
  const height = bomberState.height || 15;
  const aspect = width / height;
  const zoomScale = getAutoZoomScale(width, height);
  const cellWidthPercent = 100 / width;
  const cellHeightPercent = 100 / height;
  const boardStyle = {
    gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
  } as const;
  useEffect(() => {
    const frame = boardFrameRef.current;
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

      setBoardViewport({
        width: nextWidth,
        height: nextHeight,
      });
    };

    updateViewport();
    const observer = new ResizeObserver(() => updateViewport());
    observer.observe(frame);
    window.addEventListener('resize', updateViewport);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateViewport);
    };
  }, [aspect]);

  useEffect(() => {
    const nextPositions: Record<string, { x: number; y: number }> = {};
    const nextFacingUpdates: Record<string, 'up' | 'down' | 'left' | 'right'> = {};

    Object.values(players || {}).forEach((player: any) => {
      if (typeof player?.bomberX !== 'number' || typeof player?.bomberY !== 'number') return;
      const previous = previousPositionByPlayerRef.current[player.id];
      const direction = previous ? getDirectionFromDelta(player.bomberX - previous.x, player.bomberY - previous.y) : null;
      if (direction) {
        nextFacingUpdates[player.id] = direction;
      }
      nextPositions[player.id] = { x: player.bomberX, y: player.bomberY };
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

  const translate = (() => {
    if (!boardViewport || zoomScale === 1) {
      return { x: 0, y: 0 };
    }

    const scaledWidth = boardViewport.width * zoomScale;
    const scaledHeight = boardViewport.height * zoomScale;
    const meXRatio = ((me?.bomberX || 0) + 0.5) / width;
    const meYRatio = ((me?.bomberY || 0) + 0.5) / height;
    const meX = scaledWidth * meXRatio;
    const meY = scaledHeight * meYRatio;

    const focusX = boardViewport.width * 0.42;
    const focusY = boardViewport.height * 0.32;
    const minTranslateX = boardViewport.width - scaledWidth;
    const minTranslateY = boardViewport.height - scaledHeight;

    let x = focusX - meX;
    let y = focusY - meY;

    x = clamp(x, minTranslateX, 0);
    y = clamp(y, minTranslateY, 0);

    // When the player reaches the far right/bottom area, pin the camera to that edge
    // so the outer wall is guaranteed to remain visible.
    if (meXRatio >= 0.78) {
      x = minTranslateX;
    }
    if (meYRatio >= 0.78) {
      y = minTranslateY;
    }

    return { x, y };
  })();

  const alivePlayers = Object.values(players || {});
  const aliveCount = alivePlayers.filter((player: any) => player.alive).length;
  const joystickRadius = 64;
  const joystickDeadZone = joystickRadius * 0.32;
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
    if (distance < joystickDeadZone) {
      stopMoveHold();
      return;
    }
    const direction = getDirectionFromDelta(limitedX, limitedY);
    if (direction) {
      startMoveHold(direction);
    }
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
    stopMoveHold();
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col items-center">
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/70 p-2">
        <div ref={boardFrameRef} className="relative flex h-full w-full items-center justify-center overflow-hidden">
          <div
            className="relative shrink-0 overflow-hidden"
            style={{
              width: boardViewport?.width ?? '100%',
              height: boardViewport?.height ?? '100%',
            }}
          >
            <div
              className="absolute inset-0 grid will-change-transform"
              style={{
                ...boardStyle,
                transformOrigin: 'top left',
                transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${zoomScale})`,
                transition: `transform ${moveRepeatMs}ms linear`,
              }}
            >
              {bomberState.grid.flatMap((row: string[], y: number) =>
                row.map((cell: string, x: number) => {
                  const ownerId = bomberState.cellOwners?.[y]?.[x];
                  const ownerColor = ownerId ? players?.[ownerId]?.color : null;
                  const tileStyle = cell === 'solid' ? solidTileStyle : cell === 'breakable' ? breakableTileStyle : floorTileStyle;
                  return (
                    <div
                      key={`cell-${x}-${y}`}
                      className="border border-stone-900/60"
                      style={
                        cell === 'floor' && ownerColor
                          ? {
                              ...tileStyle,
                              boxShadow: `inset 0 0 0 1px ${ownerColor}55`,
                            }
                          : tileStyle
                      }
                    />
                  );
                })
              )}

              {bomberState.bombs.map((bomb: any) => (
                <div
                  key={bomb.id}
                  className="absolute border border-slate-900 bg-slate-800"
                  style={{
                    width: `calc(${cellWidthPercent}% - 6px)`,
                    height: `calc(${cellHeightPercent}% - 6px)`,
                    left: `calc(${bomb.x * cellWidthPercent}% + 3px)`,
                    top: `calc(${bomb.y * cellHeightPercent}% + 3px)`,
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.45)',
                  }}
                >
                  <div className="relative h-full w-full">
                    <div className="absolute left-[12%] top-[12%] h-[20%] w-[20%] bg-white/60" />
                    <div className="absolute left-[55%] top-[14%] h-[28%] w-[18%] bg-orange-400" />
                    <div className="absolute left-[62%] top-[-10%] h-[18%] w-[8%] bg-zinc-700" />
                  </div>
                </div>
              ))}

              {bomberState.explosions.map((explosion: any) =>
                explosion.cells.map((cell: any, index: number) => (
                  <div
                    key={`${explosion.id}-${cell.x}-${cell.y}-${index}`}
                    className="absolute border border-orange-950/70"
                    style={{
                      width: `calc(${cellWidthPercent}% - 4px)`,
                      height: `calc(${cellHeightPercent}% - 4px)`,
                      left: `calc(${cell.x * cellWidthPercent}% + 2px)`,
                      top: `calc(${cell.y * cellHeightPercent}% + 2px)`,
                      background: 'repeating-linear-gradient(0deg, #facc15 0 3px, #fb923c 3px 6px, #ea580c 6px 9px)',
                      boxShadow: '0 0 12px rgba(251,146,60,0.4), inset 0 2px 0 rgba(255,255,255,0.35)',
                    }}
                  />
                ))
              )}

              {(bomberState.itemDrops || []).map((drop: any) => (
                
                <div
                  key={drop.id}
                  className="absolute flex items-center justify-center border border-slate-900 bg-amber-100/95"
                  style={{
                    width: `calc(${cellWidthPercent}% - 8px)`,
                    height: `calc(${cellHeightPercent}% - 8px)`,
                    left: `calc(${drop.x * cellWidthPercent}% + 4px)`,
                    top: `calc(${drop.y * cellHeightPercent}% + 4px)`,
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.65), inset 0 -2px 0 rgba(120,53,15,0.4)',
                  }}
                  title={drop.itemId}
                >
                  <img
                    src={BOMBER_ITEM_META[(drop.itemId as BomberItemId) || 'speed_up']?.iconAsset || BOMBER_ITEM_META.speed_up.iconAsset}
                    alt={`${drop.itemId} アイテム`}
                    className="h-[82%] w-[82%] rounded-[2px] border border-slate-900/60 bg-slate-950/20 p-[1px]"
                    loading="lazy"
                  />
                </div>
              ))}

              {alivePlayers.map((player: any) => {
                const isWinner = aliveCount === 1 && player.alive;
                const expression = isWinner ? 'happy' : player.alive ? 'normal' : 'sad';
                const faceDirection = (player.id === me?.id && activeMoveDirectionRef.current) || facingByPlayer[player.id] || 'front';
                return (
                <div
                  key={player.id}
                  className={`absolute ${
                    player.alive ? 'opacity-100' : 'opacity-35'
                  }`}
                  style={{
                    width: `calc(${cellWidthPercent}% - 6px)`,
                    height: `calc(${cellHeightPercent}% + 8px)`,
                    left: `calc(${player.bomberX * cellWidthPercent}% + 3px)`,
                    top: `calc(${player.bomberY * cellHeightPercent}% - 5px)`,
                    transition: player.alive
                      ? `left ${getBomberMoveRepeatMs(player.moveSpeedLevel || 0)}ms linear, top ${getBomberMoveRepeatMs(player.moveSpeedLevel || 0)}ms linear, opacity 120ms linear`
                      : 'opacity 120ms linear',
                  }}
                >
                  <div className="relative h-full w-full">
                    <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
                      <AvatarPreview avatar={player.avatar} size={22} faceDirection={faceDirection} expression={expression} viewMode="topdown" />
                    </div>
                    <div
                      className="absolute bottom-0 left-0 z-0 flex items-center justify-center rounded-lg border-2 text-[10px] font-black text-slate-950"
                      style={{
                        width: '100%',
                        height: 'calc(100% - 12px)',
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
      </div>
      {zoomScale > 1 ? (
        <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-full border border-cyan-400/30 bg-slate-900/75 px-3 py-1 text-[10px] font-bold tracking-wide text-cyan-100 backdrop-blur-sm md:right-4 md:top-4">
          AUTO ZOOM x{zoomScale.toFixed(2)}
        </div>
      ) : null}
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
                className="absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/40 bg-amber-500/15"
                style={{
                  left: joystickState.originX,
                  top: joystickState.originY,
                }}
              />
              <div
                className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/70 bg-amber-300/70 shadow-[0_0_18px_rgba(251,191,36,0.55)]"
                style={{
                  left: joystickState.originX + joystickState.knobX,
                  top: joystickState.originY + joystickState.knobY,
                }}
              />
            </div>
          ) : null}
        </div>
        <button
          className="pointer-events-auto absolute bottom-4 right-3 z-30 flex h-14 w-20 items-center justify-center rounded-md border-2 border-rose-950 bg-rose-400 text-sm font-black tracking-wide text-rose-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.35),inset_0_-3px_0_rgba(136,19,55,0.78),0_6px_0_rgba(136,19,55,0.85)] active:translate-y-[2px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(136,19,55,0.78),0_3px_0_rgba(136,19,55,0.85)] md:bottom-5 md:right-4"
          onClick={onPlaceBomb}
        >
          BOMB
        </button>
        {canUseRemote && onDetonateRemote ? (
          <button
            className="pointer-events-auto absolute bottom-20 right-3 z-30 flex h-12 w-20 items-center justify-center rounded-md border-2 border-cyan-950 bg-cyan-300 text-xs font-black tracking-wide text-cyan-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-3px_0_rgba(8,47,73,0.78),0_6px_0_rgba(8,47,73,0.82)] active:translate-y-[2px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(8,47,73,0.75),0_3px_0_rgba(8,47,73,0.82)] md:bottom-22 md:right-4"
            onClick={onDetonateRemote}
          >
            REMOTE
          </button>
        ) : null}
      </div>
    </div>
  );
}
