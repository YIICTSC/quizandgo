import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Player } from '../types';
import { p2pService, P2PEvent } from '../services/p2pService';
import { X, Wifi, Users, Loader, AlertCircle, Swords, Copy, Check } from 'lucide-react';
import { audioService } from '../services/audioService';

export interface CoopParticipantPayload {
  peerId: string;
  name: string;
  voiceEnabled?: boolean;
  imageData?: string;
  selectedCharacterId?: string;
  maxHp?: number;
  currentHp?: number;
  block?: number;
  nextTurnEnergy?: number;
  strength?: number;
  buffer?: number;
  revivedThisBattle?: boolean;
  quizResolved?: boolean;
  quizCorrectCount?: number;
  eventResolved?: boolean;
  restResolved?: boolean;
  shopResolved?: boolean;
  rewardResolved?: boolean;
  treasureResolved?: boolean;
}

export interface CoopStartPayload {
  isHost: boolean;
  name: string;
  roomCode: string;
  participants: CoopParticipantPayload[];
  battleMode: 'TURN_BASED' | 'REALTIME';
}

interface CoopSetupScreenProps {
  player: Player;
  onStart: (payload: CoopStartPayload) => void;
  onClose: () => void;
}

const MAX_COOP_PLAYERS = 4;

const CoopSetupScreen: React.FC<CoopSetupScreenProps> = ({ player, onStart, onClose }) => {
  const [mode, setMode] = useState<'SELECT' | 'HOST' | 'JOIN'>('SELECT');
  const [myName, setMyName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');
  const [participants, setParticipants] = useState<CoopParticipantPayload[]>([]);
  const [joinSent, setJoinSent] = useState(false);
  const [inviteUrlCopied, setInviteUrlCopied] = useState(false);
  const [battleMode, setBattleMode] = useState<'TURN_BASED' | 'REALTIME'>('TURN_BASED');
  const joinInFlightRef = useRef(false);
  const startTriggeredRef = useRef(false);
  const participantsRef = useRef<CoopParticipantPayload[]>([]);

  const canStart = useMemo(
    () => mode === 'HOST' && status === 'CONNECTED' && participants.length >= 1 && participants.length <= MAX_COOP_PLAYERS,
    [mode, status, participants.length]
  );

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const presetCode = (params.get('coopPin') || '').normalize('NFKC').replace(/[^0-9]/g, '').slice(0, 6);
    if (presetCode.length === 6) {
      setMode('JOIN');
      setInputCode(presetCode);
    }
  }, []);

  useEffect(() => {
    p2pService.onConnect = () => {
      setStatus('CONNECTED');
    };

    p2pService.onData = (data: P2PEvent, fromPeerId?: string) => {
      if (data.type === 'COOP_JOIN' && mode === 'HOST' && fromPeerId) {
        setParticipants(prev => {
          const withoutPeer = prev.filter(p => p.peerId !== fromPeerId);
          if (withoutPeer.length >= MAX_COOP_PLAYERS) {
            p2pService.sendTo(fromPeerId, {
              type: 'COOP_PARTICIPANTS',
              participants: prev
            });
            return prev;
          }
          const next = [...withoutPeer, { peerId: fromPeerId, name: data.name, imageData: data.imageData }];
          p2pService.send({ type: 'COOP_PARTICIPANTS', participants: next, decisionOwnerIndex: 0 });
          return next;
        });
      }

      if (data.type === 'COOP_PARTICIPANTS') {
        setParticipants(data.participants);
      }

      if (data.type === 'COOP_START') {
        if (startTriggeredRef.current) return;
        startTriggeredRef.current = true;
        const latestParticipants = participantsRef.current;
        onStart({
          isHost: mode === 'HOST',
          name: myName.trim(),
          roomCode: data.roomCode || roomCode,
          participants: (data.participants && data.participants.length > 0) ? data.participants : latestParticipants,
          battleMode: data.battleMode === 'REALTIME' ? 'REALTIME' : 'TURN_BASED'
        });
      }
    };

    p2pService.onClose = () => {
      setStatus('IDLE');
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
  }, [mode, myName, onStart, participants, roomCode]);

  useEffect(() => {
    if (mode === 'JOIN' && status === 'CONNECTED' && myName.trim() && !joinSent) {
      p2pService.send({ type: 'COOP_JOIN', name: myName.trim(), imageData: player.imageData });
      setJoinSent(true);
    }
  }, [mode, status, myName, joinSent, player.imageData]);

  const handleCreateRoom = async () => {
    if (!myName.trim()) return;
    setStatus('CONNECTING');
    setErrorMsg('');
    try {
      const code = await p2pService.initHost();
      const hostPeerId = p2pService.getMyId() || 'host';
      setRoomCode(code);
      setMode('HOST');
      setStatus('CONNECTED');
      setParticipants([{ peerId: hostPeerId, name: myName.trim(), imageData: player.imageData }]);
      setJoinSent(false);
      startTriggeredRef.current = false;
      audioService.playSound('select');
    } catch (err: any) {
      setStatus('ERROR');
      setErrorMsg(err?.message || 'ルーム作成に失敗');
      audioService.playSound('wrong');
    }
  };

  const handleJoinRoom = async () => {
    if (joinInFlightRef.current || status === 'CONNECTING' || roomCode) return;
    if (!myName.trim() || inputCode.length !== 6) return;
    joinInFlightRef.current = true;
    setStatus('CONNECTING');
    setErrorMsg('');
    try {
      await p2pService.connect(inputCode);
      setRoomCode(inputCode);
      setMode('JOIN');
      setJoinSent(false);
      startTriggeredRef.current = false;
      audioService.playSound('select');
    } catch (err: any) {
      joinInFlightRef.current = false;
      setStatus('ERROR');
      setErrorMsg(err?.message || '接続に失敗');
      audioService.playSound('wrong');
    }
  };

  const handleStart = () => {
    if (!canStart) return;
    const currentParticipants = participantsRef.current;
    const startParticipants = currentParticipants.map(({ imageData, ...rest }) => rest);
    const payload: CoopStartPayload = {
      isHost: true,
      name: myName.trim(),
      roomCode,
      participants: currentParticipants,
      battleMode
    };
    startTriggeredRef.current = true;
    onStart(payload);
    try {
      p2pService.send({ type: 'COOP_START', roomCode, participants: startParticipants, battleMode });
    } catch (err) {
      console.warn('Failed to broadcast COOP_START, but local coop session was started.', err);
    }
  };

  const handleBack = () => {
    joinInFlightRef.current = false;
    p2pService.close();
    onClose();
  };

  const handleCopyInviteUrl = () => {
    if (typeof window === 'undefined' || !roomCode) return;
    const inviteUrl = new URL(window.location.href);
    inviteUrl.searchParams.set('coopPin', roomCode);
    navigator.clipboard.writeText(inviteUrl.toString());
    setInviteUrlCopied(true);
    audioService.playSound('select');
    setTimeout(() => setInviteUrlCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/95 flex items-center justify-center p-4 text-white">
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl w-full max-w-lg p-6 relative">
        <button onClick={handleBack} className="absolute top-3 right-3 text-gray-400 hover:text-white">
          <X size={22} />
        </button>

        <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
          <Users size={24} className="text-emerald-300" />
          協力モード
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

        <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-100">
          1〜4人で同じ冒険に挑むモードです。まずは部屋作成、参加、共通モード選択、同行表示まで導入します。
        </div>

        {mode === 'SELECT' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setMode('HOST');
                setStatus('IDLE');
                setErrorMsg('');
              }}
              className="w-full bg-emerald-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg"
            >
              <Wifi size={20} /> ルームを作成
            </button>
            <button
              onClick={() => {
                setMode('JOIN');
                setStatus('IDLE');
                setErrorMsg('');
              }}
              className="w-full bg-cyan-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg"
            >
              <Users size={20} /> ルームに参加
            </button>
          </div>
        )}

        {mode === 'HOST' && (
          <div className="space-y-3">
            {!roomCode ? (
              <>
                <div className="text-sm text-gray-300">作成者名を入力して協力ルームを作成します。</div>
                <button
                  onClick={handleCreateRoom}
                  disabled={!myName.trim() || status === 'CONNECTING'}
                  className="w-full bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-300 py-3 rounded font-bold flex items-center justify-center gap-2"
                >
                  {status === 'CONNECTING' ? <Loader size={18} className="animate-spin" /> : <Wifi size={18} />}
                  {status === 'CONNECTING' ? '作成中...' : 'ルームを作成'}
                </button>
              </>
            ) : (
              <>
                <div className="bg-black/40 border border-emerald-500/60 rounded p-3 text-center">
                  <div className="text-xs text-emerald-200/90 mb-1">ルームコード</div>
                  <div className="text-2xl font-black tracking-[0.35em] tabular-nums text-emerald-100">{roomCode}</div>
                </div>
                <button
                  onClick={handleCopyInviteUrl}
                  className={`w-full py-2.5 rounded font-bold flex items-center justify-center gap-2 transition-colors ${inviteUrlCopied ? 'bg-emerald-600 text-white' : 'bg-emerald-900/60 hover:bg-emerald-800/70 text-emerald-100'}`}
                >
                  {inviteUrlCopied ? <Check size={16} /> : <Copy size={16} />}
                  {inviteUrlCopied ? 'URLをコピーしました！' : '招待URLをコピー'}
                </button>
                <div className="bg-black/40 border border-gray-700 rounded p-3 max-h-44 overflow-auto">
                  <div className="text-sm font-bold mb-2 flex items-center gap-1">
                    <Users size={14} /> 参加者 {participants.length} / {MAX_COOP_PLAYERS}
                  </div>
                  {participants.map(p => (
                    <div key={p.peerId} className="text-sm text-gray-200">- {p.name}</div>
                  ))}
                </div>
                <div className="bg-black/40 border border-emerald-500/40 rounded p-3 space-y-2">
                  <div className="text-xs text-emerald-200/90">戦闘進行モード（ホストが開始時に選択）</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setBattleMode('TURN_BASED')}
                      className={`px-3 py-2 rounded text-sm font-bold border ${battleMode === 'TURN_BASED' ? 'bg-emerald-600 border-emerald-300 text-white' : 'bg-slate-800 border-slate-600 text-gray-200'}`}
                    >
                      ターンベース
                    </button>
                    <button
                      onClick={() => setBattleMode('REALTIME')}
                      className={`px-3 py-2 rounded text-sm font-bold border ${battleMode === 'REALTIME' ? 'bg-cyan-600 border-cyan-300 text-white' : 'bg-slate-800 border-slate-600 text-gray-200'}`}
                    >
                      リアルタイム
                    </button>
                  </div>
                  <div className="text-[11px] text-gray-300">
                    {battleMode === 'TURN_BASED'
                      ? 'これまで通り、順番に行動します。'
                      : '全員が同時にカードを使用し、全員がターン終了後に敵が行動します。'}
                  </div>
                </div>
                <button
                  onClick={handleStart}
                  disabled={!canStart}
                  className="w-full bg-emerald-600 disabled:bg-gray-700 py-3 rounded font-bold flex items-center justify-center gap-2"
                >
                  <Swords size={18} /> 協力開始
                </button>
              </>
            )}
          </div>
        )}

        {mode === 'JOIN' && (
          <div className="space-y-3">
            {!roomCode ? (
              <>
                <div className="text-sm text-gray-300">参加コードを入力して協力ルームへ接続します。</div>
                <input
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.normalize('NFKC').replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="6桁コード"
                  className="w-full min-w-0 bg-black/60 border border-gray-600 rounded px-3 py-3 text-center text-2xl font-black tracking-[0.35em]"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!myName.trim() || inputCode.length !== 6 || status === 'CONNECTING'}
                  className="w-full bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-300 px-4 py-3 rounded font-bold flex items-center justify-center gap-2"
                >
                  {status === 'CONNECTING' ? <Loader size={18} className="animate-spin" /> : <Users size={18} />}
                  {status === 'CONNECTING' ? '接続中...' : '参加する'}
                </button>
              </>
            ) : (
              <>
                <div className="bg-black/40 border border-gray-700 rounded p-3 text-sm text-gray-200">コード: {roomCode}</div>
                <div className="bg-black/40 border border-gray-700 rounded p-3 max-h-44 overflow-auto">
                  <div className="text-sm font-bold mb-2 flex items-center gap-1">
                    <Users size={14} /> 参加者 {participants.length} / {MAX_COOP_PLAYERS}
                  </div>
                  {participants.length === 0 ? (
                    <div className="text-sm text-gray-400">待機中...</div>
                  ) : participants.map(p => (
                    <div key={p.peerId} className="text-sm text-gray-200">- {p.name}</div>
                  ))}
                </div>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <Loader size={14} className="animate-spin" /> ホストの開始待ち
                </div>
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

export default CoopSetupScreen;
