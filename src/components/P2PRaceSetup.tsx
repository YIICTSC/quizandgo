import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameMode, Player } from '../types';
import { p2pService, P2PEvent } from '../services/p2pService';
import { X, Wifi, Users, Loader, AlertCircle, Copy, Check } from 'lucide-react';
import { audioService } from '../services/audioService';

interface RaceStartPayload {
    isHost: boolean;
    name: string;
    roomCode: string;
    durationSec: number;
    endAt: number;
    mode?: GameMode;
    participants: Array<{ peerId: string; name: string; imageData?: string }>;
}

interface P2PRaceSetupProps {
    player: Player;
    onRaceStart: (payload: RaceStartPayload) => void;
    onClose: () => void;
}

const P2PRaceSetup: React.FC<P2PRaceSetupProps> = ({ player, onRaceStart, onClose }) => {
    const [mode, setMode] = useState<'SELECT' | 'HOST' | 'JOIN'>('SELECT');
    const [myName, setMyName] = useState('');
    const [battleCode, setBattleCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');
    const [durationSec, setDurationSec] = useState(600);
    const [participants, setParticipants] = useState<Array<{ peerId: string; name: string; imageData?: string }>>([]);
    const [joinSent, setJoinSent] = useState(false);
    const [inviteUrlCopied, setInviteUrlCopied] = useState(false);
    const [hostSelectedMode, setHostSelectedMode] = useState<GameMode | undefined>(undefined);
    const joinInFlightRef = useRef(false);

    const canStart = useMemo(() => mode === 'HOST' && status === 'CONNECTED' && participants.length >= 1, [mode, status, participants.length]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const presetCode = (params.get('racePin') || '').normalize('NFKC').replace(/[^0-9]/g, '').slice(0, 6);
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
            if (data.type === 'RACE_JOIN' && mode === 'HOST' && fromPeerId) {
                setParticipants(prev => {
                    const exists = prev.some(p => p.peerId === fromPeerId);
                    const next = exists
                        ? prev.map(p => p.peerId === fromPeerId ? { ...p, name: data.name, imageData: data.imageData } : p)
                        : [...prev, { peerId: fromPeerId, name: data.name, imageData: data.imageData }];
                    p2pService.send({ type: 'RACE_PARTICIPANTS', participants: next });
                    return next;
                });
            }

            if (data.type === 'RACE_PARTICIPANTS') {
                setParticipants(data.participants);
            }

            if (data.type === 'RACE_MODE_SET' && mode === 'JOIN') {
                setHostSelectedMode(data.mode as GameMode);
            }

            if (data.type === 'RACE_START') {
                onRaceStart({
                    isHost: mode === 'HOST',
                    name: myName.trim(),
                    roomCode: battleCode,
                    durationSec: data.durationSec,
                    endAt: data.endAt,
                    mode: (data.mode as GameMode | undefined) ?? hostSelectedMode,
                    participants
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
    }, [mode, myName, onRaceStart, participants, battleCode, hostSelectedMode]);

    useEffect(() => {
        if (mode === 'JOIN' && status === 'CONNECTED' && myName.trim() && !joinSent) {
            p2pService.send({ type: 'RACE_JOIN', name: myName.trim(), imageData: player.imageData });
            setJoinSent(true);
        }
    }, [mode, status, myName, joinSent, player.imageData]);

    const handleCreateRoom = async () => {
        if (!myName.trim()) return;
        setStatus('CONNECTING');
        setErrorMsg('');
        try {
            const code = await p2pService.initHost();
            setBattleCode(code);
            setMode('HOST');
            setStatus('CONNECTED');
            setParticipants([{ peerId: 'host', name: myName.trim(), imageData: player.imageData }]);
            setJoinSent(false);
            audioService.playSound('select');
        } catch (err: any) {
            setStatus('ERROR');
            setErrorMsg(err?.message || 'ルーム作成に失敗');
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
            setJoinSent(false);
            audioService.playSound('select');
        } catch (err: any) {
            joinInFlightRef.current = false;
            setStatus('ERROR');
            setErrorMsg(err?.message || '接続に失敗');
        }
    };

    const handleStart = () => {
        if (!canStart) return;
        const endAt = Date.now() + durationSec * 1000;
        p2pService.send({ type: 'RACE_START', endAt, durationSec });
        onRaceStart({
            isHost: true,
            name: myName.trim(),
            roomCode: battleCode,
            durationSec,
            endAt,
            participants
        });
    };

    const handleBack = () => {
        joinInFlightRef.current = false;
        p2pService.close();
        onClose();
    };

    const handleCopyInviteUrl = () => {
        if (typeof window === 'undefined' || !battleCode) return;
        const inviteUrl = new URL(window.location.href);
        inviteUrl.searchParams.set('racePin', battleCode);
        navigator.clipboard.writeText(inviteUrl.toString());
        setInviteUrlCopied(true);
        audioService.playSound('select');
        setTimeout(() => setInviteUrlCopied(false), 2000);
    };

    const recommendedPlayerText = '推奨同時接続数: 2〜8人';
    const cautionPlayerText = '10〜12人は回線次第、20人以上は非推奨';

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 flex items-center justify-center p-4 text-white">
            <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl w-full max-w-lg p-6 relative">
                <button onClick={handleBack} className="absolute top-3 right-3 text-gray-400 hover:text-white"><X size={22} /></button>

                <h2 className="text-2xl font-black mb-4">レースモード</h2>

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

                <div className="mb-4 rounded-lg border border-indigo-500/40 bg-indigo-950/30 px-3 py-2 text-xs">
                    <div className="font-bold text-indigo-200">{recommendedPlayerText}</div>
                    <div className="mt-1 text-indigo-100/80">{cautionPlayerText}</div>
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
                            className="w-full bg-emerald-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg"
                        >
                            <Users size={20} /> ルームに参加
                        </button>
                    </div>
                )}

                {mode === 'HOST' && (
                    <div className="space-y-3">
                        {!battleCode ? (
                            <>
                                <div className="text-sm text-gray-300">作成者名を入力してルームを作成します。</div>
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
                                    onClick={handleCopyInviteUrl}
                                    className={`w-full py-2.5 rounded font-bold flex items-center justify-center gap-2 transition-colors ${inviteUrlCopied ? 'bg-emerald-600 text-white' : 'bg-indigo-900/60 hover:bg-indigo-800/70 text-indigo-100'}`}
                                >
                                    {inviteUrlCopied ? <Check size={16} /> : <Copy size={16} />}
                                    {inviteUrlCopied ? 'URLをコピーしました！' : 'PIN入力済みURLをコピー'}
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-300">制限時間</span>
                                    <select value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))} className="bg-black/60 border border-gray-600 rounded px-2 py-1">
                                        <option value={60}>1分</option>
                                        <option value={300}>5分</option>
                                        <option value={600}>10分</option>
                                        <option value={900}>15分</option>
                                        <option value={1200}>20分</option>
                                        <option value={1500}>25分</option>
                                        <option value={1800}>30分</option>
                                        <option value={2100}>35分</option>
                                        <option value={2400}>40分</option>
                                        <option value={2700}>45分</option>
                                        <option value={3000}>50分</option>
                                    </select>
                                </div>
                                <div className="bg-black/40 border border-gray-700 rounded p-3 max-h-44 overflow-auto">
                                    <div className="text-sm font-bold mb-2 flex items-center gap-1"><Users size={14} /> 参加者 {participants.length}</div>
                                    {participants.map(p => (
                                        <div key={p.peerId} className="text-sm text-gray-200">- {p.name}</div>
                                    ))}
                                </div>
                                <button onClick={handleStart} disabled={!canStart} className="w-full bg-emerald-600 disabled:bg-gray-700 py-3 rounded font-bold">レース開始</button>
                            </>
                        )}
                    </div>
                )}

                {mode === 'JOIN' && (
                    <div className="space-y-3">
                        {!battleCode ? (
                            <>
                                <div className="text-sm text-gray-300">参加コードを入力してルームへ接続します。</div>
                                <input
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value.normalize('NFKC').replace(/[^0-9]/g, '').slice(0, 6))}
                                    placeholder="6桁コード"
                                    className="w-full min-w-0 bg-black/60 border border-gray-600 rounded px-3 py-3 text-center text-2xl font-black tracking-[0.35em]"
                                />
                                <button
                                    onClick={handleJoinRoom}
                                    disabled={!myName.trim() || inputCode.length !== 6 || status === 'CONNECTING'}
                                    className="w-full bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-300 px-4 py-3 rounded font-bold flex items-center justify-center gap-2"
                                >
                                    {status === 'CONNECTING' ? <Loader size={18} className="animate-spin" /> : <Users size={18} />}
                                    {status === 'CONNECTING' ? '接続中...' : '参加する'}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="bg-black/40 border border-gray-700 rounded p-3 text-sm text-gray-200">コード: {battleCode}</div>
                                <div className="bg-black/40 border border-gray-700 rounded p-3 max-h-44 overflow-auto">
                                    <div className="text-sm font-bold mb-2 flex items-center gap-1"><Users size={14} /> 参加者</div>
                                    {participants.length === 0 ? <div className="text-sm text-gray-400">待機中...</div> : participants.map(p => (
                                        <div key={p.peerId} className="text-sm text-gray-200">- {p.name}</div>
                                    ))}
                                </div>
                                <div className="text-sm text-gray-400 flex items-center gap-2"><Loader size={14} className="animate-spin" /> ホストの開始待ち</div>
                            </>
                        )}
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="mt-4 bg-red-900/40 border border-red-500 rounded p-3 text-sm flex items-center gap-2"><AlertCircle size={14} /> {errorMsg}</div>
                )}
            </div>
        </div>
    );
};

export default P2PRaceSetup;
