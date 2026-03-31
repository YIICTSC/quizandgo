import { GAME_ITEM_MAP, GameItemId } from '../gameItems';

export default function ItemRewardOverlay({
  choices,
  onChoose,
}: {
  choices: GameItemId[];
  onChoose: (itemId: GameItemId) => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/88 p-3 backdrop-blur-md md:p-6">
      <div className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-800 p-4 shadow-2xl md:p-8">
        <div className="mb-4 shrink-0 text-center md:mb-6">
          <div className="text-[10px] font-bold tracking-[0.24em] text-yellow-300 md:text-sm md:tracking-[0.3em]">HOLE CLEAR</div>
          <h2 className="mt-2 text-2xl font-bold text-white md:mt-3 md:text-4xl">アイテムをえらぼう</h2>
          <p className="mt-2 text-sm text-slate-300 md:mt-3 md:text-lg">ランダムに出た2つのうち、1つだけ獲得できます。</p>
        </div>
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 md:gap-4">
          {choices.map((itemId) => {
            const item = GAME_ITEM_MAP[itemId];
            return (
              <button
                key={itemId}
                type="button"
                onClick={() => onChoose(itemId)}
                className="rounded-2xl border border-white/10 p-4 text-left text-white transition hover:scale-[1.01] hover:border-white/30 md:p-6"
                style={{ background: `linear-gradient(135deg, ${item.color}, #0f172a)` }}
              >
                <div className="text-[10px] font-bold tracking-[0.24em] text-white/70 md:text-xs md:tracking-[0.3em]">ITEM</div>
                <div className="mt-1.5 text-xl font-bold md:mt-2 md:text-3xl">{item.name}</div>
                <div className="mt-2 text-sm leading-relaxed text-white/85 md:mt-3 md:text-base">{item.description}</div>
                <div className="mt-3 text-xs font-bold text-white/90 md:mt-5 md:text-sm">これを受け取る</div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 shrink-0 text-center text-[11px] text-slate-400 md:mt-4 md:text-sm">4個目を取ると、一番古いアイテムと入れ替わります。</div>
      </div>
    </div>
  );
}
