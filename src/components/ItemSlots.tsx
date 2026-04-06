import { GAME_ITEM_MAP, GameItemId } from '../gameItems';

export default function ItemSlots({
  items,
  activeItemId,
  onSelectItem,
  disabled = false,
}: {
  items: GameItemId[];
  activeItemId?: GameItemId | null;
  onSelectItem?: (itemId: GameItemId | null) => void;
  disabled?: boolean;
}) {
  const slots = Array.from({ length: 3 }, (_, index) => items[index] || null);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/95 px-3 py-2 shadow-xl">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs font-bold tracking-wide text-slate-400">アイテム</div>
        {activeItemId ? (
          <div className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-100">
            使用待機: <span className="font-bold">{GAME_ITEM_MAP[activeItemId].shortName}</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500">3スロット</div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((itemId, index) => {
          const item = itemId ? GAME_ITEM_MAP[itemId] : null;
          const isActive = itemId && activeItemId === itemId;

          return (
            <button
              key={`${itemId || 'empty'}-${index}`}
              type="button"
              disabled={disabled || !itemId}
              onClick={() => onSelectItem?.(isActive ? null : itemId)}
              className={`min-h-[64px] rounded-lg border px-2 py-2 text-left transition ${
                item
                  ? isActive
                    ? 'scale-[1.02] border-white text-white shadow-lg'
                    : 'border-slate-600 text-white hover:border-slate-400 hover:bg-slate-700'
                  : 'border-dashed border-slate-700 text-slate-500'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              style={item ? { backgroundColor: isActive ? item.color : `${item.color}22` } : undefined}
              title={item?.description || '空きスロット'}
            >
              {item ? (
                <>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-white/70">
                    <span>{index + 1}</span>
                    <img
                      src={item.iconAsset}
                      alt={`${item.name} アイコン`}
                      className="h-6 w-6 rounded border border-white/20 bg-slate-900/60 p-0.5"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-xs font-bold leading-tight">{item.shortName}</div>
                  <div className="mt-1 line-clamp-2 text-[10px] leading-snug text-white/75">{item.description}</div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-bold">空き</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
