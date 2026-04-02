import { useEffect, useState } from 'react';
import { isBGMEnabled, setBGMEnabled, startBGM, stopBGM } from '../lib/sound';

const HOST_GAME_OPTIONS = [
  { id: 'golf', title: 'ゴルフゲーム', subtitle: '現在プレイ可能', available: true },
  { id: 'quiz', title: 'クイズモード', subtitle: '現在プレイ可能', available: true },
  { id: 'bomber', title: 'クイズボンバー', subtitle: '現在プレイ可能', available: true, singleAvailable: false },
];

export default function Home({
  onJoin,
  onCreate,
  onStartSinglePlayer,
  onStartDebugCourse,
}: {
  onJoin: (id: string, name: string) => void,
  onCreate: (gameType: string) => void,
  onStartSinglePlayer: (gameType: string) => void,
  onStartDebugCourse: (hole: number) => void,
}) {
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [singlePlayerMode, setSinglePlayerMode] = useState(false);
  const [titleTapCount, setTitleTapCount] = useState(0);
  const [showDebugMenu, setShowDebugMenu] = useState(false);
  const [isBgmOn, setIsBgmOn] = useState(() => isBGMEnabled());

  useEffect(() => {
    startBGM('title');
    return () => stopBGM();
  }, []);

  useEffect(() => {
    if (titleTapCount === 0) return;
    const timer = window.setTimeout(() => setTitleTapCount(0), 1400);
    return () => window.clearTimeout(timer);
  }, [titleTapCount]);

  const handleTitleTap = () => {
    setTitleTapCount((current) => {
      const next = current + 1;
      if (next >= 10) {
        setShowDebugMenu(true);
        return 0;
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <h1
        onClick={handleTitleTap}
        className="text-5xl font-bold mb-12 text-center bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text cursor-pointer select-none"
      >
        Quiz & Go!
      </h1>

      <button
        onClick={() => {
          const next = !isBgmOn;
          setIsBgmOn(next);
          setBGMEnabled(next);
          if (next) {
            startBGM('title');
          }
        }}
        className={`mb-6 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
          isBgmOn
            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
            : 'border-slate-500 bg-slate-700 text-slate-200 hover:bg-slate-600'
        }`}
      >
        BGM: {isBgmOn ? 'ON' : 'OFF'}
      </button>

      
      <div className="w-full max-w-5xl bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
        <div className="space-y-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-slate-200">ゲームに参加</h2>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="ゲームPIN" 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono text-center text-xl tracking-widest"
                  maxLength={6}
                />
                <input 
                  type="text" 
                  placeholder="ニックネーム" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl"
                  maxLength={15}
                />
                <button 
                  onClick={() => {
                    if (roomId.trim() && name.trim()) {
                      onJoin(roomId.trim(), name.trim());
                    }
                  }}
                  disabled={!roomId.trim() || !name.trim()}
                  className="w-full py-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold text-xl transition-colors"
                >
                  参加する
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-slate-600" />
                <span className="text-sm text-slate-400">ホストとして開始</span>
                <div className="h-px flex-1 bg-slate-600" />
              </div>

              <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3">
                <div>
                  <div className="font-bold text-white">シングルプレイ</div>
                  <div className="text-xs text-slate-400">ONにすると1人でそのまま遊べます</div>
                </div>
                <button
                  onClick={() => setSinglePlayerMode((current) => !current)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    singlePlayerMode ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-200'
                  }`}
                >
                  {singlePlayerMode ? 'ON' : 'OFF'}
                </button>
              </div>

              <p className="mb-4 text-sm text-slate-400">
                {singlePlayerMode
                  ? '遊ぶゲームを選ぶと、単元選択のあとにシングルプレイが始まります。'
                  : '遊ぶゲームを選んで部屋を作成します。'}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {HOST_GAME_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      const canStart = option.available && (!singlePlayerMode || option.singleAvailable !== false);
                      if (canStart) {
                        if (singlePlayerMode) {
                          onStartSinglePlayer(option.id);
                        } else {
                          onCreate(option.id);
                        }
                      }
                    }}
                    disabled={!option.available || (singlePlayerMode && option.singleAvailable === false)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      option.available && (!singlePlayerMode || option.singleAvailable !== false)
                        ? 'border-green-400 bg-green-500/10 hover:bg-green-500/20'
                        : 'cursor-not-allowed border-slate-600 bg-slate-700/70 opacity-80'
                    }`}
                  >
                    <div className="text-base font-bold text-white">{option.title}</div>
                    <div className={`mt-2 text-xs ${option.available && (!singlePlayerMode || option.singleAvailable !== false) ? 'text-green-300' : 'text-slate-400'}`}>
                      {singlePlayerMode && option.singleAvailable === false ? 'シングル未対応' : option.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDebugMenu ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-3xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold tracking-[0.3em] text-cyan-300">DEBUG MENU</div>
                <h2 className="mt-1 text-2xl font-black text-white">開発用メニュー</h2>
                <p className="mt-1 text-sm text-slate-400">今後のゲーム追加も見越した検証メニューです。現在はゴルフコース確認に対応しています。</p>
              </div>
              <button
                onClick={() => setShowDebugMenu(false)}
                className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
              >
                閉じる
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                <div className="mb-2 text-sm font-bold text-cyan-200">ゴルフコース確認</div>
                <p className="mb-4 text-sm text-slate-300">任意ホールから問題なしのフリープレイで起動し、地形とギミック配置を確認します。</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {Array.from({ length: 30 }, (_, index) => index + 1).map((hole) => (
                    <button
                      key={hole}
                      onClick={() => onStartDebugCourse(hole)}
                      className="rounded-xl border border-cyan-400/40 bg-slate-800 px-3 py-2 text-sm font-bold text-white hover:bg-cyan-500/20"
                    >
                      Hole {hole}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
                <div className="mb-2 text-sm font-bold text-slate-200">拡張予定</div>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2">クイズモード検証</div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2">参加通信テスト</div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2">音声・BGM確認</div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2">今後のゲーム別デバッグ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
