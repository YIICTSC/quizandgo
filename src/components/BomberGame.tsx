import { useEffect, useRef, useState } from 'react';
import AvatarPreview from './AvatarPreview';

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

const CONTROL_BUTTON =
  'pointer-events-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/40 text-lg font-black text-white shadow-lg backdrop-blur-sm active:scale-95 active:bg-slate-800/65 md:h-12 md:w-12 md:text-xl';

const itemLabelMap: Record<string, string> = {
  fire_up: '🔥',
  kick_bomb: '🥾',
  shield: '🛡️',
  remote_bomb: '📡',
  pierce_fire: '💥',
  speed_up: '⚡',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
  const bindMoveButton = (direction: 'up' | 'down' | 'left' | 'right') => ({
    onPointerDown: (event: any) => {
      event.preventDefault();
      startMoveHold(direction);
    },
    onPointerUp: () => stopMoveHold(),
    onPointerCancel: () => stopMoveHold(),
    onPointerLeave: () => {
      if (activeMoveDirectionRef.current === direction) {
        stopMoveHold();
      }
    },
  });

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
              className="absolute inset-0 grid transition-transform duration-200 ease-out"
              style={{
                ...boardStyle,
                transformOrigin: 'top left',
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoomScale})`,
              }}
            >
              {bomberState.grid.flatMap((row: string[], y: number) =>
                row.map((cell: string, x: number) => {
                  const ownerId = bomberState.cellOwners?.[y]?.[x];
                  const ownerColor = ownerId ? players?.[ownerId]?.color : null;
                  const className =
                    cell === 'solid'
                      ? 'bg-slate-500'
                      : cell === 'breakable'
                        ? 'bg-amber-700'
                        : 'bg-slate-900';
                  return (
                    <div
                      key={`cell-${x}-${y}`}
                      className={`border border-slate-800/50 ${className}`}
                      style={
                        cell === 'floor' && ownerColor
                          ? {
                              background: `linear-gradient(135deg, ${ownerColor}66, ${ownerColor}22)`,
                            }
                          : undefined
                      }
                    />
                  );
                })
              )}

              {bomberState.bombs.map((bomb: any) => (
                <div
                  key={bomb.id}
                  className="absolute flex items-center justify-center rounded-full border-2 border-white/40 bg-rose-500 text-xs font-black text-white"
                  style={{
                    width: `calc(${cellWidthPercent}% - 6px)`,
                    height: `calc(${cellHeightPercent}% - 6px)`,
                    left: `calc(${bomb.x * cellWidthPercent}% + 3px)`,
                    top: `calc(${bomb.y * cellHeightPercent}% + 3px)`,
                  }}
                >
                  B
                </div>
              ))}

              {bomberState.explosions.map((explosion: any) =>
                explosion.cells.map((cell: any, index: number) => (
                  <div
                    key={`${explosion.id}-${cell.x}-${cell.y}-${index}`}
                    className="absolute rounded-lg bg-orange-400/80 shadow-[0_0_18px_rgba(251,146,60,0.7)]"
                    style={{
                      width: `calc(${cellWidthPercent}% - 4px)`,
                      height: `calc(${cellHeightPercent}% - 4px)`,
                      left: `calc(${cell.x * cellWidthPercent}% + 2px)`,
                      top: `calc(${cell.y * cellHeightPercent}% + 2px)`,
                    }}
                  />
                ))
              )}

              {(bomberState.itemDrops || []).map((drop: any) => (
                <div
                  key={drop.id}
                  className="absolute flex items-center justify-center rounded-md border border-white/25 bg-slate-800/80 text-[10px]"
                  style={{
                    width: `calc(${cellWidthPercent}% - 8px)`,
                    height: `calc(${cellHeightPercent}% - 8px)`,
                    left: `calc(${drop.x * cellWidthPercent}% + 4px)`,
                    top: `calc(${drop.y * cellHeightPercent}% + 4px)`,
                  }}
                  title={drop.itemId}
                >
                  {itemLabelMap[drop.itemId] || '⭐'}
                </div>
              ))}

              {alivePlayers.map((player: any) => (
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
                      <AvatarPreview avatar={player.avatar} size={22} />
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
              ))}
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
        <div className="absolute bottom-3 left-3 grid grid-cols-3 gap-2 md:bottom-4 md:left-4">
          <div />
          <button className={CONTROL_BUTTON} {...bindMoveButton('up')}>↑</button>
          <div />
          <button className={CONTROL_BUTTON} {...bindMoveButton('left')}>←</button>
          <div className="h-11 w-11 md:h-12 md:w-12" />
          <button className={CONTROL_BUTTON} {...bindMoveButton('right')}>→</button>
          <div />
          <button className={CONTROL_BUTTON} {...bindMoveButton('down')}>↓</button>
          <div />
        </div>
        <button
          className="pointer-events-auto absolute bottom-4 right-3 flex h-14 w-20 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-600/55 text-sm font-black tracking-wide text-white shadow-[0_0_20px_rgba(244,63,94,0.25)] backdrop-blur-sm active:scale-95 active:bg-rose-500/75 md:bottom-5 md:right-4"
          onClick={onPlaceBomb}
        >
          BOMB
        </button>
        {canUseRemote && onDetonateRemote ? (
          <button
            className="pointer-events-auto absolute bottom-20 right-3 flex h-12 w-20 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-600/55 text-xs font-black tracking-wide text-white shadow-[0_0_18px_rgba(34,211,238,0.25)] backdrop-blur-sm active:scale-95 active:bg-cyan-500/75 md:bottom-22 md:right-4"
            onClick={onDetonateRemote}
          >
            REMOTE
          </button>
        ) : null}
      </div>
    </div>
  );
}
