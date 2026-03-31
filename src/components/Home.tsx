import { useEffect, useState } from 'react';
import { startBGM, stopBGM } from '../lib/sound';

const HOST_GAME_OPTIONS = [
  { id: 'golf', title: 'ゴルフゲーム', subtitle: '現在プレイ可能', available: true },
  { id: 'quiz', title: 'クイズモード', subtitle: '現在プレイ可能', available: true },
];

export default function Home({
  onJoin,
  onCreate,
  onStartSinglePlayer,
}: {
  onJoin: (id: string, name: string) => void,
  onCreate: (gameType: string) => void,
  onStartSinglePlayer: (gameType: string) => void,
}) {
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [singlePlayerMode, setSinglePlayerMode] = useState(false);

  useEffect(() => {
    startBGM('title');
    return () => stopBGM();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-bold mb-12 text-center bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
        Quiz & Go!
      </h1>
      
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
                  : '遊ぶゲームを選んで部屋を作成します。現在はゴルフゲームのみ利用できます。'}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {HOST_GAME_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (option.available) {
                        if (singlePlayerMode) {
                          onStartSinglePlayer(option.id);
                        } else {
                          onCreate(option.id);
                        }
                      }
                    }}
                    disabled={!option.available}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      option.available
                        ? 'border-green-400 bg-green-500/10 hover:bg-green-500/20'
                        : 'cursor-not-allowed border-slate-600 bg-slate-700/70 opacity-80'
                    }`}
                  >
                    <div className="text-base font-bold text-white">{option.title}</div>
                    <div className={`mt-2 text-xs ${option.available ? 'text-green-300' : 'text-slate-400'}`}>{option.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
