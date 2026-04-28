
import React, { useEffect, useRef, useState } from 'react';
import { MapNode, NodeType, Player, LanguageMode } from '../types';
import { Swords, Skull, BedDouble, ShoppingBag, HelpCircle, AlertTriangle, PlayCircle, Coins, Heart, Layers, X, Home, MessageSquare, Settings } from 'lucide-react';
import { MAP_WIDTH, MAP_HEIGHT } from '../services/mapGenerator';
import Card from './Card';
import { trans } from '../utils/textUtils';

interface MapScreenProps {
    nodes: MapNode[];
    currentNodeId: string | null;
    onNodeSelect: (node: MapNode) => void;
    onReturnToTitle: () => void;
    onOpenSettings?: () => void;
    player: Player;
    languageMode: LanguageMode;
    narrative?: string;
    act: number;
    floor: number;
    typingMode?: boolean;
    selectionHoldMs?: number;
    selectionDisabled?: boolean;
    selectionDisabledMessage?: string;
}

const MapScreen: React.FC<MapScreenProps> = ({ nodes, currentNodeId, onNodeSelect, onReturnToTitle, onOpenSettings, player, languageMode, narrative, act, floor, typingMode = false, selectionHoldMs = 0, selectionDisabled = false, selectionDisabledMessage }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showDeck, setShowDeck] = useState(false);
    const holdTimerRef = useRef<number | null>(null);

    // 現在地へのオートスクロール
    useEffect(() => {
        if (scrollRef.current) {
            const currentNode = nodes.find(n => n.id === currentNodeId);
            const totalHeight = MAP_HEIGHT * 100 + 200;
            let targetScroll = totalHeight;

            if (currentNode) {
                const nodeBottom = currentNode.y * 100 + 100;
                targetScroll = totalHeight - nodeBottom - (scrollRef.current.clientHeight / 2);
            } else {
                targetScroll = scrollRef.current.scrollHeight;
            }

            scrollRef.current.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });
        }
    }, [currentNodeId, nodes]);

    const getNodeIcon = (type: NodeType) => {
        switch (type) {
            case NodeType.COMBAT: return <Swords size={20} />;
            case NodeType.ELITE: return <Skull size={20} className="text-red-500" />;
            case NodeType.REST: return <BedDouble size={20} className="text-green-400" />;
            case NodeType.SHOP: return <ShoppingBag size={20} className="text-yellow-400" />;
            case NodeType.EVENT: return <HelpCircle size={20} className="text-blue-400" />;
            case NodeType.BOSS: return <AlertTriangle size={32} className="text-red-600 animate-pulse" />;
            case NodeType.START: return <PlayCircle size={20} />;
            default: return <div className="w-3 h-3 rounded-full bg-white" />;
        }
    };

    const getGridPosition = (node: MapNode) => {
        const left = `${((node.x + 0.5) / MAP_WIDTH) * 100}%`;
        const bottom = `${node.y * 100 + 100}px`;
        return { left, bottom };
    };

    // 選択可能なノードの判定
    let availableNodeIds: string[] = [];
    if (!currentNodeId) {
        availableNodeIds = nodes.filter(n => n.y === 0).map(n => n.id);
    } else {
        const currentNode = nodes.find(n => n.id === currentNodeId);
        if (currentNode) {
            availableNodeIds = currentNode.nextNodes;
        }
    }
    const availableNodes = nodes.filter(n => availableNodeIds.includes(n.id));

    useEffect(() => {
        if (!typingMode || showDeck || selectionDisabled) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'd') {
                e.preventDefault();
                setShowDeck(true);
                return;
            }
            if (e.key === '0' || e.key === 'Escape') {
                e.preventDefault();
                onReturnToTitle();
                return;
            }
            if (e.key >= '1' && e.key <= '9') {
                const node = availableNodes[Number(e.key) - 1];
                if (!node) return;
                e.preventDefault();
                onNodeSelect(node);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (availableNodes[0]) onNodeSelect(availableNodes[0]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [typingMode, showDeck, availableNodes, onNodeSelect, selectionDisabled]);

    useEffect(() => () => {
        if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
    }, []);

    useEffect(() => {
        if (!typingMode || !showDeck) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === '0' || e.key === 'Enter' || e.key.toLowerCase() === 'd') {
                e.preventDefault();
                setShowDeck(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [typingMode, showDeck]);

    // 経路データの作成
    const connections = [];
    nodes.forEach(node => {
        node.nextNodes.forEach(nextId => {
            const nextNode = nodes.find(n => n.id === nextId);
            if (nextNode) {
                connections.push({ from: node, to: nextNode });
            }
        });
    });

    const sortedDeck = [...player.deck].sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="flex flex-col h-full w-full bg-slate-950 relative overflow-hidden">
            {/* 背景テクスチャ（黒板風） */}
            <div className="absolute inset-0 texture-dark-matter opacity-40 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-black pointer-events-none"></div>

            {/* 上部ステータスバー (モバイル最適化版) */}
            <div className="p-1.5 md:p-3 bg-black/80 border-b-2 border-slate-700 z-30 flex justify-between items-center shadow-2xl backdrop-blur-md shrink-0">
                <div className="flex gap-1 md:gap-3 items-center">
                    <button
                        onClick={onReturnToTitle}
                        className="flex items-center gap-1 text-gray-400 hover:text-white border border-gray-700 px-1.5 py-0.5 md:px-2 md:py-1 rounded transition-colors cursor-pointer"
                    >
                        <Home size={12} className="md:size-3.5" />
                        <span className="text-[9px] md:text-[10px] font-bold uppercase hidden sm:inline">{trans("タイトルへ戻る", languageMode)}</span>
                        {typingMode && <span className="rounded border border-cyan-300 bg-cyan-950/95 px-1 py-0.5 text-[8px] font-black text-cyan-200">0</span>}
                    </button>
                    <div className="flex items-center text-red-400 bg-red-950/40 border border-red-500/30 px-1.5 py-0.5 md:px-3 md:py-1 rounded shadow-inner gap-1">
                        <Heart size={14} className="md:size-4 fill-red-500/20" />
                        <span className="font-bold text-xs md:text-sm">{player.currentHp}</span>
                    </div>
                    <div className="flex items-center text-yellow-400 bg-yellow-950/40 border border-yellow-500/30 px-1.5 py-0.5 md:px-3 md:py-1 rounded shadow-inner gap-1">
                        <Coins size={14} className="md:size-4" />
                        <span className="font-bold text-xs md:text-sm">{player.gold}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-tighter mb-0.5">
                        {trans("第", languageMode)}{act}{trans("章", languageMode)} - {floor}F
                    </h2>
                    <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    <button
                        onClick={() => setShowDeck(true)}
                        className="flex items-center gap-1 md:gap-2 text-blue-300 border-2 border-blue-500/20 bg-blue-900/20 px-2 py-0.5 md:px-3 md:py-1 rounded hover:bg-blue-800/40 hover:border-blue-400 transition-all cursor-pointer group"
                    >
                        <Layers size={14} className="md:size-4 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-[10px] md:text-sm uppercase"><span className="hidden sm:inline">DECK </span>({player.deck.length})</span>
                        {typingMode && <span className="rounded border border-cyan-300 bg-cyan-950/95 px-1 py-0.5 text-[8px] font-black text-cyan-200">D</span>}
                    </button>
                    {onOpenSettings && (
                        <button
                            onClick={onOpenSettings}
                            className="flex h-7 w-7 md:h-9 md:w-9 items-center justify-center border-2 border-slate-500 bg-slate-800 text-slate-200 shadow-[2px_2px_0_0_rgba(15,23,42,0.95)] transition-all hover:bg-slate-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                            title="セッティング"
                        >
                            <Settings size={14} className="md:size-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* ナラティブバー (追加) */}
            {narrative && (
                <div className="bg-black/60 border-b border-green-500/30 px-4 py-2 z-20 flex items-center justify-center animate-in fade-in slide-in-from-top-1 duration-500">
                    <div className="max-w-2xl w-full flex items-center gap-3">
                        <MessageSquare size={16} className="text-green-400 shrink-0 animate-pulse" />
                        <span className="text-xs md:text-sm text-green-300 font-bold italic tracking-wider drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">
                            {trans(narrative, languageMode)}
                        </span>
                    </div>
                </div>
            )}

            {/* メインマップエリア */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto relative custom-scrollbar z-10" style={{ scrollBehavior: 'smooth' }}>
                <div className="relative w-full max-w-2xl mx-auto" style={{ height: `${MAP_HEIGHT * 100 + 300}px` }}>

                    {/* 経路描画 (SVG) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        {connections.map((conn, idx) => {
                            const x1 = ((conn.from.x + 0.5) / MAP_WIDTH) * 100;
                            const y1 = (conn.from.y * 100 + 120);
                            const x2 = ((conn.to.x + 0.5) / MAP_WIDTH) * 100;
                            const y2 = (conn.to.y * 100 + 80);

                            const totalH = MAP_HEIGHT * 100 + 300;
                            const svgY1 = totalH - y1;
                            const svgY2 = totalH - y2;

                            let strokeColor = "rgba(71, 85, 105, 0.4)"; // 灰色
                            let strokeWidth = "2";
                            let dashArray = "6, 4";

                            const isCurrentPath = conn.from.completed && currentNodeId === conn.from.id && availableNodeIds.includes(conn.to.id);
                            const isPastPath = conn.from.completed && conn.to.completed;

                            if (isCurrentPath) {
                                strokeColor = "#fbbf24";
                                strokeWidth = "3";
                                dashArray = "0"; // 実線
                            } else if (isPastPath) {
                                strokeColor = "rgba(148, 163, 184, 0.6)";
                                dashArray = "0";
                            }

                            return (
                                <line
                                    key={`${conn.from.id}-${conn.to.id}`}
                                    x1={`${x1}%`} y1={svgY1}
                                    x2={`${x2}%`} y2={svgY2}
                                    stroke={strokeColor}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={dashArray}
                                    filter={isCurrentPath ? "url(#glow)" : ""}
                                    className="transition-all duration-1000"
                                />
                            );
                        })}
                    </svg>

                    {/* ノードの配置 */}
                    {nodes.map(node => {
                        const isAvailable = availableNodeIds.includes(node.id);
                        const isCurrent = currentNodeId === node.id;
                        const isCompleted = node.completed;
                        const { left, bottom } = getGridPosition(node);

                        let nodeBaseStyle = "border-4 transition-all duration-500 z-10 scale-100";
                        let bgClass = "bg-slate-900 border-slate-700 text-slate-500 shadow-lg";

                        if (isCompleted) {
                            bgClass = "bg-slate-800 border-slate-600 text-slate-400 opacity-40 grayscale";
                        }
                        if (isCurrent) {
                            bgClass = "bg-slate-900 border-yellow-500 text-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.4)]";
                        }
                        if (isAvailable && !selectionDisabled) {
                            bgClass = "bg-white border-blue-400 text-slate-900 cursor-pointer hover:scale-110 hover:shadow-[0_0_20px_rgba(96,165,250,0.6)]";
                        } else if (isAvailable && selectionDisabled) {
                            bgClass = "bg-slate-100/70 border-slate-400 text-slate-700 opacity-70";
                        }

                        return (
                            <div
                                key={node.id}
                                className={`absolute w-12 h-12 -ml-6 flex items-center justify-center rounded-2xl ${nodeBaseStyle} ${bgClass}`}
                                style={{ left, bottom }}
                                onClick={() => isAvailable && !selectionDisabled && selectionHoldMs <= 0 ? onNodeSelect(node) : null}
                                onPointerDown={() => {
                                    if (!isAvailable || selectionDisabled || selectionHoldMs <= 0) return;
                                    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
                                    holdTimerRef.current = window.setTimeout(() => onNodeSelect(node), selectionHoldMs);
                                }}
                                onPointerUp={() => {
                                    if (holdTimerRef.current) {
                                        window.clearTimeout(holdTimerRef.current);
                                        holdTimerRef.current = null;
                                    }
                                }}
                                onPointerLeave={() => {
                                    if (holdTimerRef.current) {
                                        window.clearTimeout(holdTimerRef.current);
                                        holdTimerRef.current = null;
                                    }
                                }}
                            >
                                {typingMode && isAvailable && (
                                    <div className="absolute -right-2 -top-2 z-30 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">
                                        {availableNodes.findIndex(n => n.id === node.id) + 1}
                                    </div>
                                )}
                                {/* プレイヤーアバター表示 */}
                                {isCurrent && (
                                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-14 h-14 z-20 animate-bounce">
                                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-md"></div>
                                        <img
                                            src={player.imageData}
                                            className="w-full h-full pixel-art relative z-10"
                                            alt="Player Location"
                                            style={{ imageRendering: 'pixelated' }}
                                        />
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/40 rounded-full blur-[1px]"></div>
                                    </div>
                                )}

                                {/* ノードアイコン */}
                                {getNodeIcon(node.type)}

                                {/* 選択可能時のアニメーションリング */}
                                {isAvailable && !selectionDisabled && (
                                    <div className="absolute inset-[-8px] border-2 border-blue-400/50 rounded-2xl animate-ping opacity-30"></div>
                                )}

                                {node.type === NodeType.BOSS && !isCompleted && (
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded border border-white animate-pulse uppercase tracking-widest">Boss</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* フッターガイド */}
            <div className="p-2 bg-black/90 border-t border-slate-800 text-[10px] text-center text-slate-500 z-30 font-bold tracking-widest uppercase">
                {selectionDisabled ? (selectionDisabledMessage || trans("ホストの選択を待っています", languageMode)) : trans("次の目的地を選択してください", languageMode)}
                {typingMode && <span className="ml-2 text-cyan-300">1-9 / Enter / D / 0</span>}
            </div>

            {selectionDisabled && (
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center px-4">
                    <div className="rounded-2xl border border-emerald-400/50 bg-slate-950/85 px-5 py-4 text-center text-white shadow-2xl backdrop-blur">
                        <div className="text-lg font-black text-emerald-200 mb-1">協力モード待機中</div>
                        <div className="text-sm text-emerald-100">{selectionDisabledMessage || trans("ホストの選択を待っています", languageMode)}</div>
                    </div>
                </div>
            )}

            {/* デッキ確認用モーダル */}
            {showDeck && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowDeck(false)}>
                    <div className="bg-slate-900 border-4 border-slate-700 w-full max-w-4xl h-[85vh] flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,1)] rounded-xl" onClick={e => e.stopPropagation()}>
                        <div className="bg-black/50 border-b-2 border-slate-700 p-5 flex justify-between items-center">
                            <div className="flex flex-col">
                                <h2 className="text-white text-2xl font-black flex items-center tracking-tighter">
                                    <Layers className="mr-3 text-blue-400" /> {trans("デッキ一覧", languageMode)}
                                </h2>
                                <p className="text-slate-500 text-xs mt-1 font-bold">{trans("現在", languageMode)} {player.deck.length} {trans("枚のカードを所持しています", languageMode)}</p>
                            </div>
                            <button onClick={() => setShowDeck(false)} className="text-slate-400 hover:text-white p-2 border-2 border-slate-700 hover:border-white rounded-lg transition-all cursor-pointer">
                                <X size={24} />
                                {typingMode && <span className="ml-2 rounded border border-cyan-300 bg-cyan-950/95 px-1 py-0.5 text-[8px] font-black text-cyan-200">Esc</span>}
                            </button>
                        </div>

                        <div className="p-6 md:p-10 overflow-y-auto flex-grow texture-carbon-fibre custom-scrollbar">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center pb-10">
                                {sortedDeck.map((card) => (
                                    <div key={card.id} className="scale-95 hover:scale-105 transition-transform duration-200">
                                        <Card
                                            card={card}
                                            onClick={() => { }}
                                            disabled={false}
                                            languageMode={languageMode}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-black/50 border-t-2 border-slate-800 text-center">
                            <button onClick={() => setShowDeck(false)} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-2 rounded-lg font-bold border border-slate-600 transition-colors">
                                {trans("閉じる", languageMode)}{typingMode && ' [Enter]'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapScreen;
