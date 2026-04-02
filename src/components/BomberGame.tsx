import { useEffect } from 'react';

type BomberGameProps = {
  roomId: string;
  me: any;
  players: Record<string, any>;
  bomberState: any;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onPlaceBomb: () => void;
};

const CONTROL_BUTTON =
  'pointer-events-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-slate-900/65 text-lg font-black text-white shadow-lg backdrop-blur-sm active:scale-95 active:bg-slate-800/90 md:h-12 md:w-12 md:text-xl';

export default function BomberGame({ roomId, me, players, bomberState, onMove, onPlaceBomb }: BomberGameProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (['ArrowUp', 'w', 'W'].includes(event.key)) {
        event.preventDefault();
        onMove('up');
      } else if (['ArrowDown', 's', 'S'].includes(event.key)) {
        event.preventDefault();
        onMove('down');
      } else if (['ArrowLeft', 'a', 'A'].includes(event.key)) {
        event.preventDefault();
        onMove('left');
      } else if (['ArrowRight', 'd', 'D'].includes(event.key)) {
        event.preventDefault();
        onMove('right');
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        onPlaceBomb();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onMove, onPlaceBomb, roomId]);

  if (!bomberState) {
    return <div className="flex h-full items-center justify-center text-slate-400">盤面を準備しています...</div>;
  }

  const width = bomberState.width || 21;
  const height = bomberState.height || 15;
  const cellWidthPercent = 100 / width;
  const cellHeightPercent = 100 / height;
  const boardStyle = {
    gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
  } as const;

  const alivePlayers = Object.values(players || {});

  return (
    <div className="relative flex h-full min-h-0 flex-col items-center">
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/70 p-2">
        <div className="relative mx-auto grid h-full max-h-full w-full max-w-full" style={{ ...boardStyle, aspectRatio: `${width} / ${height}` }}>
          {bomberState.grid.flatMap((row: string[], y: number) =>
            row.map((cell: string, x: number) => {
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

          {alivePlayers.map((player: any) => (
            <div
              key={player.id}
              className={`absolute flex items-center justify-center rounded-lg border-2 text-[10px] font-black text-slate-950 ${
                player.alive ? 'opacity-100' : 'opacity-35'
              }`}
              style={{
                width: `calc(${cellWidthPercent}% - 6px)`,
                height: `calc(${cellHeightPercent}% - 6px)`,
                left: `calc(${player.bomberX * cellWidthPercent}% + 3px)`,
                top: `calc(${player.bomberY * cellHeightPercent}% + 3px)`,
                backgroundColor: player.color || 'white',
                borderColor: player.id === me?.id ? '#ffffff' : 'rgba(255,255,255,0.35)',
              }}
            >
              {String(player.name || '?').slice(0, 1)}
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="absolute bottom-3 left-3 grid grid-cols-3 gap-2 md:bottom-4 md:left-4">
          <div />
          <button className={CONTROL_BUTTON} onClick={() => onMove('up')}>↑</button>
          <div />
          <button className={CONTROL_BUTTON} onClick={() => onMove('left')}>←</button>
          <div className="h-11 w-11 md:h-12 md:w-12" />
          <button className={CONTROL_BUTTON} onClick={() => onMove('right')}>→</button>
          <div />
          <button className={CONTROL_BUTTON} onClick={() => onMove('down')}>↓</button>
          <div />
        </div>
        <button
          className="pointer-events-auto absolute bottom-4 right-3 flex h-14 w-20 items-center justify-center rounded-2xl border border-rose-300/30 bg-rose-600/80 text-sm font-black tracking-wide text-white shadow-[0_0_20px_rgba(244,63,94,0.35)] backdrop-blur-sm active:scale-95 active:bg-rose-500 md:bottom-5 md:right-4"
          onClick={onPlaceBomb}
        >
          BOMB
        </button>
      </div>
    </div>
  );
}
