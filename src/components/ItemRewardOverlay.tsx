import { GAME_ITEM_MAP, GameItemId } from '../gameItems';

export default function ItemRewardOverlay({
  choices,
  onChoose,
}: {
  choices: GameItemId[];
  onChoose: (itemId: GameItemId) => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/88 p-6 backdrop-blur-md">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="text-sm font-bold tracking-[0.3em] text-yellow-300">HOLE CLEAR</div>
          <h2 className="mt-3 text-4xl font-bold text-white">アイテムをえらぼう</h2>
          <p className="mt-3 text-lg text-slate-300">ランダムに出た2つのうち、1つだけ獲得できます。</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {choices.map((itemId) => {
            const item = GAME_ITEM_MAP[itemId];
            return (
              <button
                key={itemId}
                type="button"
                onClick={() => onChoose(itemId)}
                className="rounded-2xl border border-white/10 p-6 text-left text-white transition hover:scale-[1.01] hover:border-white/30"
                style={{ background: `linear-gradient(135deg, ${item.color}, #0f172a)` }}
              >
                <div className="text-xs font-bold tracking-[0.3em] text-white/70">ITEM</div>
                <div className="mt-2 text-3xl font-bold">{item.name}</div>
                <div className="mt-3 text-base leading-relaxed text-white/85">{item.description}</div>
                <div className="mt-5 text-sm font-bold text-white/90">これを受け取る</div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 text-center text-sm text-slate-400">4個目を取ると、一番古いアイテムと入れ替わります。</div>
      </div>
    </div>
  );
}
