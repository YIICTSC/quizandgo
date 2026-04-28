import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../types';
import { p2pService, P2PEvent } from '../services/p2pService';
import { X, Wifi, Users, Loader, AlertCircle, Copy, Check, Swords } from 'lucide-react';
import { audioService } from '../services/audioService';

interface P2PBattleSetupProps {
  player: Player;
  onBattleStart: (opponent: Player, isHost: boolean, myName: string) => void;
  onClose: () => void;
}

const P2PBattleSetup: React.FC<P2PBattleSetupProps> = ({ player, onBattleStart, onClose }) => {
  const [mode, setMode] = useState<'SELECT' | 'HOST' | 'JOIN'>('SELECT');
  const [myName, setMyName] = useState('');
  const [battleCode, setBattleCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteUrlCopied, setInviteUrlCopied] = useState(false);
  const [opponentPlayer, setOpponentPlayer] = useState<Player | null>(null);
  const joinInFlightRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const presetCode = (params.get('vsPin') || '').normalize('NFKC').replace(/[^0-9]/g, '').slice(0, 6);
    if (presetCode.length === 6) {
      setMode('JOIN');
      setInputCode(presetCode);
    }
  }, []);

  useEffect(() => {
    p2pService.onConnect = () => {
      setStatus('CONNECTED');
      setErrorMsg('');
      p2pService.send({ type: 'HANDSHAKE', player: { ...player, name: myName.trim() || 'プレイヤー' } });
    };

    p2pService.onData = (data: P2PEvent) => {
      if (data.type === 'HANDSHAKE') {
        setOpponentPlayer(data.player);
        p2pService.send({ type: 'HANDSHAKE', player: { ...player, name: myName.trim() || 'プレイヤー' } });
      }
    };

    p2pService.onClose = () => {
      setStatus('IDLE');
      setOpponentPlayer(null);
    };

    p2pService.onError = (err) => {
      setStatus('ERROR');
      setErrorMsg(err?.message || '接続エラー');
      audioService.playSound('wrong');
    };

    return () => {
      p2pService.onConnect = null;
      p2pService.onData = null;
      p2pService.onClose = null;
      p2pService.onError = null;
    };
  }, [myName, player]);

  const handleCreateRoom = async () => {
    if (!myName.trim()) return;
    setStatus('CONNECTING');
    setErrorMsg('');
    try {
      const code = await p2pService.initHost();
      setBattleCode(code);
      setMode('HOST');
      setStatus('CONNECTED');
      audioService.playSound('select');
    } catch (err: any) {
      setStatus('ERROR');
      setErrorMsg(err?.message || 'ルーム作成に失敗');
      audioService.playSound('wrong');
    }
  };

  const handleJoinRoom = async () => {
    if (joinInFlightRef.current || status === 'CONNECTING' || battleCode) return;
    if (!myName.trim() || inputCode.length !== 6) return;
    joinInFlightRef.current = true;
    setStatus('CONNECTING');
    setErrorMsg('');
    try {
      await p2pService.connect(inputCode);
      setBattleCode(inputCode);
      setMode('JOIN');
      audioService.playSound('select');
    } catch (err: any) {
      joinInFlightRef.current = false;
      setStatus('ERROR');
      setErrorMsg(err?.message || '接続に失敗');
      audioService.playSound('wrong');
    }
  };

  const handleStartBattle = () => {
    if (!opponentPlayer) return;
    audioService.playSound('select');
    onBattleStart(opponentPlayer, mode === 'HOST', myName.trim() || 'プレイヤー');
  };

  const handleCopyCode = () => {
    if (!battleCode) return;
    navigator.clipboard.writeText(battleCode);
    setCopied(true);
    audioService.playSound('select');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInviteUrl = () => {
    if (typeof window === 'undefined' || !battleCode) return;
    const inviteUrl = new URL(window.location.href);
    inviteUrl.searchParams.set('vsPin', battleCode);
    navigator.clipboard.writeText(inviteUrl.toString());
    setInviteUrlCopied(true);
    audioService.playSound('select');
    setTimeout(() => setInviteUrlCopied(false), 2000);
  };

  const handleBack = () => {
    joinInFlightRef.current = false;
    p2pService.close();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/95 flex items-center justify-center p-4 text-white">
      <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl w-full max-w-lg p-6 relative">
        <button onClick={handleBack} className="absolute top-3 right-3 text-gray-400 hover:text-white">
          <X size={22} />
        </button>

        <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
          <Swords size={24} className="text-indigo-300" />
          VSモード
        </h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">名前</label>
          <input
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
            placeholder="表示名"
            className="w-full bg-black/60 border border-gray-600 rounded px-3 py-2"
            maxLength={20}
          />
        </div>

        <div className="mb-4 rounded-lg border border-indigo-500/40 bg-indigo-950/20 px-3 py-2 text-xs text-indigo-100">
          1対1のリアルタイム対戦モードです。部屋作成か参加を選んで接続してください。
        </div>

        {mode === 'SELECT' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setMode('HOST');
                setStatus('IDLE');
                setErrorMsg('');
              }}
              className="w-full bg-indigo-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg"
            >
              <Wifi size={20} /> ルームを作成
            </button>
            <button
              onClick={() => {
                setMode('JOIN');
                setStatus('IDLE');
                setErrorMsg('');
              }}
              className="w-full bg-violet-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg"
            >
              <Users size={20} /> ルームに参加
            </button>
          </div>
        )}

        {mode === 'HOST' && (
          <div className="space-y-3">
            {!battleCode ? (
              <>
                <div className="text-sm text-gray-300">作成者名を入力して対戦ルームを作成します。</div>
                <button
                  onClick={handleCreateRoom}
                  disabled={!myName.trim() || status === 'CONNECTING'}
                  className="w-full bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-300 py-3 rounded font-bold flex items-center justify-center gap-2"
                >
                  {status === 'CONNECTING' ? <Loader size={18} className="animate-spin" /> : <Wifi size={18} />}
                  {status === 'CONNECTING' ? '作成中...' : 'ルームを作成'}
                </button>
              </>
            ) : (
              <>
                <div className="bg-black/60 border border-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400">ルームコード</div>
                  <div className="text-4xl font-black tracking-widest">{battleCode}</div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className={`w-full py-2.5 rounded font-bold flex items-center justify-center gap-2 transition-colors ${copied ? 'bg-emerald-600 text-white' : 'bg-indigo-900/60 hover:bg-indigo-800/70 text-indigo-100'}`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'コードをコピーしました！' : 'コードをコピー'}
                </button>
                <button
                  onClick={handleCopyInviteUrl}
                  className={`w-full py-2.5 rounded font-bold flex items-center justify-center gap-2 transition-colors ${inviteUrlCopied ? 'bg-emerald-600 text-white' : 'bg-indigo-900/60 hover:bg-indigo-800/70 text-indigo-100'}`}
                >
                  {inviteUrlCopied ? <Check size={16} /> : <Copy size={16} />}
                  {inviteUrlCopied ? 'URLをコピーしました！' : 'PIN入力済みURLをコピー'}
                </button>
                <div className="bg-black/40 border border-gray-700 rounded p-3">
                  <div className="text-sm font-bold mb-2 flex items-center gap-1">
                    <Users size={14} /> 接続状況
                  </div>
                  {opponentPlayer ? (
                    <div className="text-sm text-gray-100">- {opponentPlayer.name || 'ゲスト'} が接続しました</div>
                  ) : (
                    <div className="text-sm text-gray-400">待機中...</div>
                  )}
                </div>
                <button
                  onClick={handleStartBattle}
                  disabled={!opponentPlayer}
                  className="w-full bg-emerald-600 disabled:bg-gray-700 py-3 rounded font-bold flex items-center justify-center gap-2"
                >
                  <Swords size={18} /> 対戦開始
                </button>
              </>
            )}
          </div>
        )}

        {mode === 'JOIN' && (
          <div className="space-y-3">
            {!battleCode ? (
              <>
                <div className="text-sm text-gray-300">参加コードを入力して対戦ルームへ接続します。</div>
                <input
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.normalize('NFKC').replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="6桁コード"
                  className="w-full min-w-0 bg-black/60 border border-gray-600 rounded px-3 py-3 text-center text-2xl font-black tracking-[0.35em]"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!myName.trim() || inputCode.length !== 6 || status === 'CONNECTING'}
                  className="w-full bg-violet-700 disabled:bg-gray-700 disabled:text-gray-300 px-4 py-3 rounded font-bold flex items-center justify-center gap-2"
                >
                  {status === 'CONNECTING' ? <Loader size={18} className="animate-spin" /> : <Users size={18} />}
                  {status === 'CONNECTING' ? '接続中...' : '参加する'}
                </button>
              </>
            ) : (
              <>
                <div className="bg-black/40 border border-gray-700 rounded p-3 text-sm text-gray-200">コード: {battleCode}</div>
                <div className="bg-black/40 border border-gray-700 rounded p-3 max-h-44 overflow-auto">
                  <div className="text-sm font-bold mb-2 flex items-center gap-1">
                    <Users size={14} /> 接続状況
                  </div>
                  {opponentPlayer ? (
                    <div className="text-sm text-gray-100">- {opponentPlayer.name || 'ホスト'} と接続しました</div>
                  ) : (
                    <div className="text-sm text-gray-400">ハンドシェイク中...</div>
                  )}
                </div>
                <button
                  onClick={handleStartBattle}
                  disabled={!opponentPlayer}
                  className="w-full bg-emerald-600 disabled:bg-gray-700 py-3 rounded font-bold flex items-center justify-center gap-2"
                >
                  <Swords size={18} /> 対戦開始
                </button>
              </>
            )}
          </div>
        )}

        {status === 'ERROR' && (
          <div className="mt-4 bg-red-900/40 border border-red-500 rounded p-3 text-sm flex items-center gap-2">
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default P2PBattleSetup;
