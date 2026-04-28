import React, { useState, useEffect, useRef } from 'react';
import { Player, Card as ICard, CardType, TargetType, LanguageMode, VSRecord, VisualEffectInstance } from '../types';
import Card from './Card';
import { trans } from '../utils/textUtils';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { p2pService, P2PEvent } from '../services/p2pService';
import { CHARACTERS, CARDS_LIBRARY } from '../constants';
import { getUpgradedCard } from '../utils/cardUtils';
import { Heart, Shield, Zap, Swords, Trophy, Skull, Home, AlertCircle, TrendingDown, Droplets, Sword, Hexagon, Radiation, Activity, ShieldPlus, Flame, Wifi, WifiOff, Layers, X, Sparkles } from 'lucide-react';

interface P2PVSBattleSceneProps {
    player1: Player;
    player2: Player;
    isHost: boolean;
    onFinish: (winner: 1 | 2) => void;
    languageMode: LanguageMode;
}

type GamePhase = 'BATTLE' | 'RESULT' | 'DISCONNECTED';
type SelectionType = 'DISCARD' | 'COPY' | 'EXHAUST';

interface SelectionState {
    active: boolean;
    type: SelectionType;
    amount: number;
    originCardId?: string;
    pending?: {
        current: Player;
        target: Player;
        actionLog: string;
    };
}

const VFXOverlay: React.FC<{ effects: VisualEffectInstance[], targetId: string }> = ({ effects, targetId }) => {
    const activeOnThisTarget = effects.filter(e => e.targetId === targetId);
    if (activeOnThisTarget.length === 0) return null;

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none overflow-visible">
            {activeOnThisTarget.map(vfx => (
                <div key={vfx.id} className="absolute inset-0 flex items-center justify-center">
                    {vfx.type === 'SLASH' && (
                        <div
                            className="w-40 md:w-48 h-2 bg-gradient-to-r from-transparent via-white to-transparent animate-slash-vfx shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                            style={{
                                transform: `rotate(${vfx.rotation !== undefined ? vfx.rotation : 45}deg)`,
                                animationDelay: `${vfx.delay || 0}ms`,
                                animationFillMode: 'both'
                            }}
                        ></div>
                    )}
                    {vfx.type === 'BLOCK' && (
                        <div
                            className="relative flex items-center justify-center"
                            style={{ animationDelay: `${vfx.delay || 0}ms`, animationFillMode: 'both' }}
                        >
                            <div className="absolute w-24 md:w-32 h-24 md:h-32 border-4 border-blue-400 rounded-full animate-pulse-expand opacity-0"></div>
                            <div className="animate-block-vfx p-3 md:p-4 bg-blue-500/30 border-2 border-blue-300 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                                <Shield size={40} className="text-blue-100 fill-blue-500/50" />
                            </div>
                        </div>
                    )}
                    {vfx.type === 'BUFF' && (
                        <div className="animate-buff-vfx p-2" style={{ animationDelay: `${vfx.delay || 0}ms`, animationFillMode: 'both' }}>
                            <Sparkles size={48} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                        </div>
                    )}
                    {vfx.type === 'DEBUFF' && (
                        <div className="animate-debuff-vfx p-2" style={{ animationDelay: `${vfx.delay || 0}ms`, animationFillMode: 'both' }}>
                            <Skull size={48} className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                        </div>
                    )}
                    {vfx.type === 'HEAL' && (
                        <div className="animate-heal-vfx" style={{ animationDelay: `${vfx.delay || 0}ms`, animationFillMode: 'both' }}>
                            <Heart size={48} className="text-green-300 fill-green-500/50 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                        </div>
                    )}
                    {vfx.type === 'FIRE' && (
                        <div className="relative flex items-center justify-center" style={{ animationDelay: `${vfx.delay || 0}ms`, animationFillMode: 'both' }}>
                            <div className="absolute w-20 h-20 bg-orange-500/40 blur-xl animate-ping rounded-full"></div>
                            <div className="animate-fire-vfx">
                                <Flame size={56} className="text-orange-400 fill-orange-600/50 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]" />
                            </div>
                        </div>
                    )}
                    {vfx.type === 'EXPLOSION' && (
                        <div
                            className="w-24 h-24 md:w-32 md:h-32 bg-orange-500 rounded-full animate-explosion-vfx shadow-[0_0_40px_orange]"
                            style={{ animationDelay: `${vfx.delay || 0}ms`, animationFillMode: 'both' }}
                        ></div>
                    )}
                    {vfx.type === 'LIGHTNING' && (
                        <div
                            className="w-3 md:w-4 h-48 md:h-64 bg-cyan-200 animate-lightning-vfx shadow-[0_0_30px_cyan]"
                            style={{
                                animationDelay: `${vfx.delay || 0}ms`,
                                transform: `rotate(${vfx.rotation || 0}deg)`,
                                animationFillMode: 'both'
                            }}
                        ></div>
                    )}
                    {vfx.type === 'CRITICAL' && (
                        <div
                            className="w-40 h-40 md:w-64 md:h-64 border-8 border-yellow-400 rounded-full animate-critical-vfx"
                            style={{ animationDelay: `${vfx.delay || 0}ms`, animationFillMode: 'both' }}
                        ></div>
                    )}
                    {vfx.type === 'SHOCKWAVE' && (
                        <div
                            className="w-12 h-12 md:w-16 md:h-16 border-4 border-white/50 rounded-full animate-shockwave-vfx"
                            style={{ animationDelay: `${vfx.delay || 0}ms`, animationFillMode: 'both' }}
                        ></div>
                    )}
                    {vfx.type === 'FLASH' && (
                        <div
                            className="absolute w-[200vw] h-[200vh] bg-white animate-flash-vfx"
                            style={{ animationDelay: `${vfx.delay || 0}ms`, animationFillMode: 'both' }}
                        ></div>
                    )}
                </div>
            ))}
            <style>
                {`
                    @keyframes slash-vfx {
                        0% { transform: rotate(45deg) scaleX(0) translateX(-100%); opacity: 0; }
                        20% { transform: rotate(45deg) scaleX(1.8) translateX(0); opacity: 1; }
                        100% { transform: rotate(45deg) scaleX(2.5) translateX(100%); opacity: 0; }
                    }
                    @keyframes block-vfx {
                        0% { transform: scale(0.4); opacity: 0; }
                        20% { transform: scale(1.3); opacity: 1; }
                        30% { transform: scale(1); opacity: 1; }
                        100% { transform: scale(0.9); opacity: 0; }
                    }
                    @keyframes pulse-expand {
                        0% { transform: scale(0.5); opacity: 0.8; border-width: 8px; }
                        100% { transform: scale(1.5); opacity: 0; border-width: 1px; }
                    }
                    @keyframes buff-vfx {
                        0% { transform: translateY(30px) scale(0.5) rotate(0deg); opacity: 0; }
                        50% { transform: translateY(-10px) scale(1.2) rotate(180deg); opacity: 1; }
                        100% { transform: translateY(-50px) scale(0.8) rotate(360deg); opacity: 0; }
                    }
                    @keyframes debuff-vfx {
                         0% { transform: scale(2); filter: brightness(3) blur(5px); opacity: 0; }
                         20% { transform: scale(1); filter: brightness(1) blur(0); opacity: 1; }
                         80% { transform: scale(0.95); opacity: 1; }
                         100% { transform: scale(0.7); filter: blur(2px); opacity: 0; }
                    }
                    @keyframes heal-vfx {
                        0% { transform: scale(0.3) translateY(20px); opacity: 0; }
                        40% { transform: scale(1.4) translateY(-10px); opacity: 1; }
                        100% { transform: scale(1.8) translateY(-40px); opacity: 0; }
                    }
                    @keyframes fire-vfx {
                         0% { transform: scale(0.4) translateY(20px); opacity: 0; }
                         30% { transform: scale(1.4) translateY(-10px); filter: brightness(1.5); opacity: 1; }
                         100% { transform: scale(2) translateY(-60px); filter: blur(4px); opacity: 0; }
                    }
                    @keyframes explosion-vfx {
                        0% { transform: scale(0.1); opacity: 1; filter: brightness(2); }
                        50% { transform: scale(1.5); opacity: 0.8; }
                        100% { transform: scale(2); opacity: 0; }
                    }
                    @keyframes lightning-vfx {
                        0% { transform: scaleY(0); opacity: 0; }
                        10% { transform: scaleY(1); opacity: 1; }
                        20% { opacity: 0; }
                        30% { opacity: 1; }
                        40% { opacity: 0; }
                        50% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    @keyframes critical-vfx {
                        0% { transform: scale(0.5); opacity: 0; border-width: 20px; }
                        20% { transform: scale(1.2); opacity: 1; border-width: 10px; }
                        100% { transform: scale(1.5); opacity: 0; border-width: 1px; }
                    }
                    @keyframes shockwave-vfx {
                        0% { transform: scale(1); opacity: 1; border-width: 10px; }
                        100% { transform: scale(4); opacity: 0; border-width: 1px; }
                    }
                    @keyframes flash-vfx {
                        0% { opacity: 0; }
                        20% { opacity: 0.8; }
                        100% { opacity: 0; }
                    }
                `}
            </style>
        </div>
    );
};

const P2PVSBattleScene: React.FC<P2PVSBattleSceneProps> = ({ player1, player2, isHost, onFinish, languageMode }) => {
    const [phase, setPhase] = useState<GamePhase>('BATTLE');
    const [myName] = useState(player1.name || '');
    const [opponentName, setOpponentName] = useState(player2.name || '');
    const [p1State, setP1State] = useState<Player>(() => initPlayer(player1));
    const [p2State, setP2State] = useState<Player>(() => initPlayer(player2));
    const [isMyTurn, setIsMyTurn] = useState<boolean>(isHost);
    const [isAnimating, setIsAnimating] = useState(false);
    const [logs, setLogs] = useState<string[]>(['対戦開始！']);
    const [turnCount, setTurnCount] = useState(1);
    const [winner, setWinner] = useState<1 | 2 | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('CONNECTED');
    const [activeEffects, setActiveEffects] = useState<VisualEffectInstance[]>([]);
    const [opponentActionPulse, setOpponentActionPulse] = useState(false);
    const [selectionState, setSelectionState] = useState<SelectionState>({
        active: false,
        type: 'DISCARD',
        amount: 0
    });
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
    const phaseRef = useRef<GamePhase>(phase);
    const p1Ref = useRef<Player>(p1State);
    const p2Ref = useRef<Player>(p2State);

    const opponentCharName = CHARACTERS.find(c => c.id === player2.id)?.name || 'OPPONENT';
    const myDisplayName = myName.trim() || 'あなた';
    const opponentDisplayName = opponentName || opponentCharName;

    function initPlayer(p: Player): Player {
        const deck = [...p.deck].sort(() => Math.random() - 0.5);
        const drawPile = [...deck];
        const hand = drawPile.splice(0, 5);
        return {
            ...p,
            currentEnergy: 3,
            maxEnergy: 3,
            block: 0,
            hand: hand,
            drawPile: drawPile,
            discardPile: [],
            powers: { ...p.powers },
            echoes: p.echoes || 0,
            cardsPlayedThisTurn: 0,
            attacksPlayedThisTurn: 0,
            typesPlayedThisTurn: [],
            relicCounters: { ...p.relicCounters },
            nextTurnEnergy: 0,
            nextTurnDraw: 0,
            turnFlags: {},
            floatingText: null
        };
    }

    const shuffle = <T,>(array: T[]) => {
        return array.sort(() => Math.random() - 0.5);
    };

    const drawCards = (state: Player, count: number) => {
        for (let i = 0; i < count; i++) {
            if (state.drawPile.length === 0) {
                if (state.discardPile.length === 0) break;
                state.drawPile = shuffle([...state.discardPile]);
                state.discardPile = [];
            }
            const drawn = state.drawPile.pop();
            if (!drawn) break;
            const nextCard = { ...drawn };
            if ((state.relics.some(r => r.id === 'SNECKO_EYE') || state.powers['CONFUSED'] > 0) && nextCard.cost >= 0) {
                nextCard.cost = Math.floor(Math.random() * 4);
            }
            if (nextCard.name === '虚無' || nextCard.name === 'VOID') {
                state.currentEnergy = Math.max(0, state.currentEnergy - 1);
            }
            state.hand.push(nextCard);
            if (state.powers['EVOLVE'] && (nextCard.type === CardType.STATUS || nextCard.type === CardType.CURSE)) {
                const extra = state.powers['EVOLVE'];
                drawCards(state, extra);
            }
        }
    };
    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        p1Ref.current = p1State;
    }, [p1State]);

    useEffect(() => {
        p2Ref.current = p2State;
    }, [p2State]);

    const triggerRemoteActionFeedback = (prevMe: Player, nextMe: Player, lastAction?: string) => {
        if (!lastAction || !lastAction.includes('を使用')) return;

        setOpponentActionPulse(true);
        setTimeout(() => setOpponentActionPulse(false), 420);

        const tookDamage = nextMe.currentHp < prevMe.currentHp;
        const lostBlock = nextMe.block < prevMe.block;
        const nextEffects: VisualEffectInstance[] = [];

        // Opponent acted: show a cast-like effect on opponent.
        nextEffects.push({ id: `vfx-remote-cast-${Date.now()}`, type: 'BUFF', targetId: 'opponent' });

        if (tookDamage || lostBlock) {
            nextEffects.push({ id: `vfx-remote-hit-${Date.now()}`, type: 'SLASH', targetId: 'player', rotation: 45 });
            audioService.playSound('attack');
        } else {
            audioService.playSound('block');
        }

        setActiveEffects(nextEffects);
        setTimeout(() => setActiveEffects([]), 750);
    };

    useEffect(() => {
        p2pService.onData = (data: P2PEvent) => {
            if (data.type === 'STATE_UPDATE') {
                const prevMe = p1Ref.current;
                setP2State(data.myState);
                setP1State(data.yourState);

                if (typeof data.receiverTurn === 'boolean') {
                    setIsMyTurn(data.receiverTurn);
                }

                if (!isHost && typeof data.turnCount === 'number') {
                    setTurnCount(data.turnCount);
                }

                if (data.senderName) {
                    setOpponentName(data.senderName);
                }

                if (data.lastAction) {
                    addLog(data.lastAction);
                    triggerRemoteActionFeedback(prevMe, data.yourState, data.lastAction);
                }

                if (phaseRef.current === 'BATTLE') {
                    if (data.yourState?.currentHp <= 0) {
                        finishMatch(2);
                    } else if (data.myState?.currentHp <= 0) {
                        finishMatch(1);
                    }
                }
            } else if (data.type === 'GIVE_UP') {
                addLog('相手が降参しました');
                finishMatch(1);
            }
        };

        p2pService.onClose = () => {
            setConnectionStatus('DISCONNECTED');
            setPhase('DISCONNECTED');
        };

        return () => {
            p2pService.onData = null;
            p2pService.onClose = null;
        };
    }, []);

    useEffect(() => {
        if (phase === 'BATTLE') {
            audioService.playBGM('battle');
        } else if (phase === 'RESULT' || phase === 'DISCONNECTED') {
            audioService.stopBGM();
        }
    }, [phase]);

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev.slice(0, 3)]);

    const toggleSelectCard = (cardId: string) => {
        if (!selectionState.active) return;
        setSelectedCardIds(prev => {
            if (prev.includes(cardId)) {
                return prev.filter(id => id !== cardId);
            }
            if (prev.length >= selectionState.amount) return prev;
            return [...prev, cardId];
        });
    };

    useEffect(() => {
        if (!selectionState.active) return;
        if (selectionState.amount > 0 && selectedCardIds.length === selectionState.amount) {
            finalizeSelection();
        }
    }, [selectedCardIds, selectionState.active, selectionState.amount]);

    const finalizeSelection = () => {
        if (!selectionState.active || selectedCardIds.length !== selectionState.amount || !selectionState.pending) {
            return;
        }

        const updatedCurrent = { ...selectionState.pending.current };
        const updatedTarget = { ...selectionState.pending.target };
        const toProcess = updatedCurrent.hand.filter(c => selectedCardIds.includes(c.id));

        if (selectionState.type === 'DISCARD') {
            updatedCurrent.hand = updatedCurrent.hand.filter(c => !selectedCardIds.includes(c.id));
            toProcess.forEach(c => {
                if (c.name === 'カンニングペーパー' || c.name === 'STRATEGIST') {
                    updatedCurrent.nextTurnEnergy += 2;
                }
                updatedCurrent.discardPile.push(c);
            });
        } else if (selectionState.type === 'EXHAUST') {
            updatedCurrent.hand = updatedCurrent.hand.filter(c => !selectedCardIds.includes(c.id));
            if (updatedCurrent.powers['FEEL_NO_PAIN']) {
                updatedCurrent.block += updatedCurrent.powers['FEEL_NO_PAIN'] * toProcess.length;
            }
        } else if (selectionState.type === 'COPY') {
            toProcess.forEach(c => {
                const copy = { ...c, id: `copy-${Date.now()}-${Math.random()}` };
                if (updatedCurrent.hand.length < 10) updatedCurrent.hand.push(copy);
                else updatedCurrent.discardPile.push(copy);
            });
        }

        setP1State(updatedCurrent);
        setP2State(updatedTarget);

        const selectionLog = selectionState.type === 'DISCARD'
            ? `${selectedCardIds.length}枚捨てた`
            : selectionState.type === 'EXHAUST'
                ? `${selectedCardIds.length}枚廃棄した`
                : `${selectedCardIds.length}枚コピーした`;

        addLog(selectionLog);
        syncStateWith(updatedCurrent, updatedTarget, `${selectionState.pending.actionLog} / ${selectionLog}`, false);

        setSelectionState({ active: false, type: 'DISCARD', amount: 0 });
        setSelectedCardIds([]);
    };

    const syncStateWith = (
        myState: Player,
        yourState: Player,
        action?: string,
        receiverTurn?: boolean,
        turnCountOverride?: number
    ) => {
        p2pService.send({
            type: 'STATE_UPDATE',
            myState,
            yourState,
            lastAction: action,
            receiverTurn,
            turnCount: isHost ? (turnCountOverride ?? turnCount) : undefined,
            senderName: myDisplayName
        });
    };

    const applyDebuff = (target: Player, powerId: string, amount: number): Player => {
        const nextPowers = { ...target.powers };
        if (nextPowers['ARTIFACT'] && nextPowers['ARTIFACT'] > 0) {
            nextPowers['ARTIFACT']--;
            addLog('アーティファクトで無効化！');
            return { ...target, powers: nextPowers };
        }
        nextPowers[powerId] = (nextPowers[powerId] || 0) + amount;
        return { ...target, powers: nextPowers };
    };

    const getFilteredCardPool = (): ICard[] => {
        return Object.values(CARDS_LIBRARY)
            .filter(c => c.type !== CardType.STATUS && c.type !== CardType.CURSE && c.rarity !== 'SPECIAL')
            .map((c, i) => ({ ...c, id: `vs-pool-${i}-${Math.random()}` }));
    };

    const clearCombatDebuffs = (player: Player): Player => {
        const nextPowers = { ...player.powers };
        ['WEAK', 'VULNERABLE', 'FRAIL', 'CONFUSED'].forEach(powerId => {
            if (nextPowers[powerId] > 0) nextPowers[powerId] = 0;
        });
        return { ...player, powers: nextPowers };
    };

    const reviveWithTailEffect = (player: Player): Player | null => {
        const hasTailRelic = player.relics.some(r => r.id === 'LIZARD_TAIL') && !player.relicCounters['LIZARD_TAIL_USED'];
        const hasTailPower = (player.powers['LIZARD_TAIL'] || 0) > 0;
        if (!hasTailRelic && !hasTailPower) return null;

        const nextPlayer: Player = {
            ...player,
            powers: { ...player.powers },
            relicCounters: { ...player.relicCounters },
            currentHp: Math.max(1, Math.floor(player.maxHp * 0.5)),
            floatingText: { id: `revive-${Date.now()}`, text: '復活！', color: 'text-green-500', iconType: 'heart' }
        };

        if (hasTailRelic) {
            nextPlayer.relicCounters['LIZARD_TAIL_USED'] = 1;
        } else {
            nextPlayer.powers['LIZARD_TAIL'] = Math.max(0, (nextPlayer.powers['LIZARD_TAIL'] || 0) - 1);
        }

        return nextPlayer;
    };

    const handlePlayCard = (card: ICard) => {
        if (!isMyTurn || isAnimating || phase !== 'BATTLE' || selectionState.active) {
            return;
        }

        if (card.unplayable) {
            audioService.playSound('wrong');
            return;
        }

        const isAttack = card.type === CardType.ATTACK || String(card.type) === 'ATTACK';
        if (turnCount === 1 && isAttack && isHost) {
            audioService.playSound('wrong');
            addLog('先攻1ターン目は攻撃できません');
            return;
        }

        const current = p1State;
        const target = p2State;

        const hasChoker = current.relics.some(r => r.id === 'VELVET_CHOKER') && current.cardsPlayedThisTurn >= 6;
        if (hasChoker) {
            audioService.playSound('wrong');
            return;
        }

        const hasNormality = current.hand.some(c => c.name === '退屈' || c.name === 'NORMALITY') && current.cardsPlayedThisTurn >= 3;
        if (hasNormality) {
            audioService.playSound('wrong');
            return;
        }

        const isClashDisabled = card.playCondition === 'HAND_ONLY_ATTACKS' && current.hand.some(c => c.type !== CardType.ATTACK && c.id !== card.id);
        const isGrandFinaleDisabled = card.playCondition === 'DRAW_PILE_EMPTY' && current.drawPile.length > 0;
        if (isClashDisabled || isGrandFinaleDisabled) {
            audioService.playSound('wrong');
            return;
        }

        let effectiveCost = card.cost;
        if (current.powers['CORRUPTION'] && card.type === CardType.SKILL) {
            effectiveCost = 0;
        }

        if (current.currentEnergy < effectiveCost) {
            audioService.playSound('wrong');
            return;
        }

        setIsAnimating(true);
        audioService.playSound(isAttack ? 'attack' : 'block');

        let nextCurrent = { ...current, powers: { ...current.powers }, relicCounters: { ...current.relicCounters }, turnFlags: { ...current.turnFlags } };
        let nextTarget = { ...target, powers: { ...target.powers } };
        const nextActiveEffects: VisualEffectInstance[] = [];

        nextCurrent.currentEnergy -= effectiveCost;
        nextCurrent.hand = nextCurrent.hand.filter(c => c.id !== card.id);
        nextCurrent.cardsPlayedThisTurn++;

        if (!nextCurrent.typesPlayedThisTurn.includes(card.type)) {
            nextCurrent.typesPlayedThisTurn.push(card.type);
        }

        if (isAttack) {
            nextCurrent.attacksPlayedThisTurn++;
        }

        const actionLog = `${myDisplayName}が${card.name}を使用`;
        addLog(actionLog);

        if (card.gold) {
            nextCurrent.gold += card.gold;
            addLog(`${card.gold}ゴールドを獲得`);
        }

        if (card.blockMultiplier) {
            nextCurrent.block = Math.floor(nextCurrent.block * card.blockMultiplier);
        }

        if (card.shuffleHandToDraw) {
            nextCurrent.drawPile = shuffle([...nextCurrent.drawPile, ...nextCurrent.discardPile]);
            nextCurrent.discardPile = [];
            addLog('捨て札を山札に混ぜた');
        }

        if (card.upgradeDeck) {
            nextCurrent.hand = nextCurrent.hand.map(c => getUpgradedCard(c));
            nextCurrent.drawPile = nextCurrent.drawPile.map(c => getUpgradedCard(c));
            nextCurrent.discardPile = nextCurrent.discardPile.map(c => getUpgradedCard(c));
            addLog('デッキ全体を強化！');
        }

        const matchesCardName = (...names: string[]) =>
            names.includes(card.name) || names.some(n => card.originalNames?.includes(n));

        if (matchesCardName('発見', 'DISCOVERY', 'ゼロの発見', 'SANSU_ZERO')) {
            const pool = getFilteredCardPool();
            for (let i = 0; i < 3; i++) {
                const template = pool[Math.floor(Math.random() * pool.length)];
                if (!template) break;
                let newCard = { ...template, id: `discovery-${Date.now()}-${Math.random()}` };
                if (nextCurrent.powers['MASTER_REALITY']) newCard = getUpgradedCard(newCard);
                if (nextCurrent.hand.length < 10) nextCurrent.hand.push(newCard);
                else nextCurrent.discardPile.push(newCard);
                addLog(`${newCard.name}を手札に加えた！`);
            }
        }

        if (matchesCardName('山勘', 'GAMBLE', '単位変換', 'SANSU_UNIT')) {
            const handToReplace = [...nextCurrent.hand];
            nextCurrent.hand = [];
            handToReplace.forEach(c => {
                if (c.name === 'カンニングペーパー' || c.name === 'STRATEGIST') {
                    nextCurrent.nextTurnEnergy += 2;
                }
                nextCurrent.discardPile.push(c);
            });
            drawCards(nextCurrent, handToReplace.length);
            addLog(`${handToReplace.length}枚入れ替えた`);
        }

        // 高優先: 手札操作系の差別化
        if (matchesCardName('パニック', 'MADNESS')) {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id);
            if (pool.length > 0) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                pick.cost = 0;
                addLog(`パニック: 「${pick.name}」が0コストになった`);
            }
        }
        if (matchesCardName('魅惑のカカオ', 'SWEET_CACAO')) {
            const handToReplace = [...nextCurrent.hand];
            nextCurrent.hand = [];
            handToReplace.forEach(c => nextCurrent.discardPile.push(c));
            drawCards(nextCurrent, handToReplace.length);
            addLog(`魅惑のカカオ: 手札を${handToReplace.length}枚入れ替え`);
        }

        // 高優先: コピー系の差別化
        const addCopy = (template: ICard) => {
            let copy = { ...template, id: `copy-${Date.now()}-${Math.random()}` };
            if (nextCurrent.powers['MASTER_REALITY']) copy = getUpgradedCard(copy);
            if (nextCurrent.hand.length < 10) nextCurrent.hand.push(copy);
            else nextCurrent.discardPile.push(copy);
            addLog(`${copy.name}をコピーした`);
        };
        if (matchesCardName('カンニング', 'HOLOGRAM')) {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id && c.type === CardType.ATTACK);
            if (pool.length > 0) addCopy(pool[Math.floor(Math.random() * pool.length)]);
        }
        if (matchesCardName('お人形遊び', 'GIRLS_DOLL_HOUSE')) {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id && c.type === CardType.SKILL);
            if (pool.length > 0) addCopy(pool[Math.floor(Math.random() * pool.length)]);
        }
        if (matchesCardName('二刀流', 'DUAL_WIELD')) {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id && (c.type === CardType.ATTACK || c.type === CardType.POWER));
            if (pool.length > 0) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                addCopy(pick);
                addCopy(pick);
            }
        }
        if (matchesCardName('フォークダンス', 'PE_DANCE')) {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id);
            if (pool.length > 0) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                addCopy(pick);
                const discardPool = nextCurrent.hand.filter(c => c.id !== pick.id);
                if (discardPool.length > 0) {
                    const toss = discardPool[Math.floor(Math.random() * discardPool.length)];
                    nextCurrent.hand = nextCurrent.hand.filter(c => c.id !== toss.id);
                    nextCurrent.discardPile.push(toss);
                    addLog(`フォークダンス: 「${toss.name}」を捨てた`);
                }
            }
        }
        if (matchesCardName('鏡 (星新一)', 'KAGAMI_HOSHI')) {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id);
            if (pool.length > 0) {
                addCopy(pool[Math.floor(Math.random() * pool.length)]);
                nextCurrent = applyDebuff(nextCurrent, 'VULNERABLE', 1);
                addLog('鏡: 自分にびくびく1（反動）');
            }
        }
        if (matchesCardName('きてんの窓', 'KITSUNE_NO_MADO')) {
            const hiCost = nextCurrent.hand.filter(c => c.id !== card.id && c.cost >= 2);
            const pool = hiCost.length > 0 ? hiCost : nextCurrent.hand.filter(c => c.id !== card.id);
            if (pool.length > 0) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                const copy = { ...pick, cost: 0 };
                addCopy(copy);
                addLog('きてんの窓: 高コスト優先コピーを0コスト化');
            }
        }

        // 高優先: エナジー獲得系の差別化
        if (matchesCardName('覚醒のコーヒー', 'AWAKE_COFFEE')) {
            drawCards(nextCurrent, 1);
            nextCurrent.currentHp = Math.max(0, nextCurrent.currentHp - 1);
            addLog('覚醒のコーヒー: 1ドロー（反動でHP-1）');
        }
        if (matchesCardName('産業革命', 'SYAKAI_REVOLUTION')) {
            nextCurrent.currentEnergy = Math.max(0, nextCurrent.currentEnergy - 1);
            nextCurrent.nextTurnEnergy += 1;
            drawCards(nextCurrent, 1);
            addLog('産業革命: Eを来ターンへ分割し1ドロー');
        }

        // 中優先: びくびく付与系の差別化
        if (card.id === 'RIKA_MICROSCOPE') {
            nextCurrent.nextTurnDraw += 1;
            addLog('顕微鏡: 次ターン1ドロー');
        }
        if (card.id === 'GIRLS_SPARKLE_DUST') {
            nextTarget = applyDebuff(nextTarget, 'WEAK', 1);
            addLog('キラキラの粉: へろへろ1を追加');
        }
        if (card.id === 'TRIP') {
            nextCurrent.block += 3;
            addLog('足払い: ブロック3を獲得');
        }
        if (card.id === 'JACHI_BOGYAKU') {
            drawCards(nextCurrent, 1);
            addLog('邪智暴虐: 1ドロー');
        }

        // 中優先: 全体多段/連撃系の差別化
        if (card.id === 'ISSUN_BOSHI') {
            nextCurrent.block += 3;
            addLog('一寸法師: 連撃後にブロック3');
        }
        if (card.id === 'PE_JUMP') {
            nextCurrent.currentHp = Math.max(0, nextCurrent.currentHp - 1);
            addLog('縄跳び: 反動でHP-1');
        }
        if (card.id === 'GIRLS_CANDY_SHOWER') {
            nextTarget = applyDebuff(nextTarget, 'WEAK', 1);
            addLog('飴玉の嵐: へろへろ1を付与');
        }
        if (card.id === 'SWORD_BOOMERANG') {
            nextCurrent.currentEnergy += 1;
            addLog('ブーメラン: エネルギー+1');
        }

        // 中優先: ブロック+ドロー系の差別化
        if (card.id === 'KAIKETSU_ZORORI') {
            nextCurrent.block += 3;
            addLog('かいけつゾロリ: ブロック3');
        }
        if (card.id === 'ACROBATICS') {
            nextCurrent.block += 2;
            addLog('側転: ブロック2');
        }
        if (card.id === 'BOYS_MECHA_DIVE') {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id);
            if (pool.length > 0) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                pick.cost = 0;
                addLog(`電脳世界へのダイブ: 「${pick.name}」を0コスト化`);
            }
        }
        if (card.id === 'OUT_HIDDEN_SHORTCUT' && nextCurrent.drawPile.length > 0) {
            const hiCost = nextCurrent.drawPile.filter(c => c.cost >= 2);
            const pool = hiCost.length > 0 ? hiCost : nextCurrent.drawPile;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            nextCurrent.drawPile = nextCurrent.drawPile.filter(c => c.id !== pick.id);
            if (nextCurrent.hand.length < 10) nextCurrent.hand.push({ ...pick, cost: 0 });
            else nextCurrent.discardPile.push({ ...pick, cost: 0 });
            addLog(`秘密の近道: 「${pick.name}」を0コストで手札へ`);
        }

        if (nextCurrent.powers['AFTER_IMAGE']) {
            nextCurrent.block += nextCurrent.powers['AFTER_IMAGE'];
        }
        if (nextCurrent.powers['HEAL_ON_PLAY']) {
            const beforeHp = nextCurrent.currentHp;
            nextCurrent.currentHp = Math.min(nextCurrent.maxHp, nextCurrent.currentHp + nextCurrent.powers['HEAL_ON_PLAY']);
            if (nextCurrent.currentHp > beforeHp) {
                nextCurrent.floatingText = {
                    id: `heal-on-play-${Date.now()}`,
                    text: `+${nextCurrent.currentHp - beforeHp}`,
                    color: 'text-green-500',
                    iconType: 'heart'
                };
                nextActiveEffects.push({ id: `vfx-heal-play-${Date.now()}`, type: 'HEAL', targetId: 'player' });
            }
        }
        if (card.type === CardType.SKILL && nextCurrent.powers['SKILL_BLOCK']) {
            nextCurrent.block += nextCurrent.powers['SKILL_BLOCK'];
            nextActiveEffects.push({ id: `vfx-skill-block-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
        }
        if (nextCurrent.powers['THOUSAND_CUTS']) {
            let dmg = nextCurrent.powers['THOUSAND_CUTS'];
            if (nextTarget.block >= dmg) {
                nextTarget.block -= dmg;
            } else {
                dmg -= nextTarget.block;
                nextTarget.block = 0;
                nextTarget.currentHp = Math.max(0, nextTarget.currentHp - dmg);
            }
        }

        let activations = 1;
        if (nextCurrent.echoes > 0) {
            activations++;
            nextCurrent.echoes--;
            addLog('反響で再発動！');
        }
        if (card.type === CardType.SKILL && nextCurrent.powers['BURST'] > 0) {
            activations++;
            nextCurrent.powers['BURST']--;
            addLog('バーストで再発動！');
        }
        if (card.type === CardType.ATTACK && nextCurrent.relics.some(r => r.id === 'NECRONOMICON') && card.cost >= 2 && !nextCurrent.turnFlags['NECRONOMICON_USED']) {
            activations++;
            nextCurrent.turnFlags['NECRONOMICON_USED'] = true;
            addLog('ネクロノミコンで再発動！');
        }

        for (let act = 0; act < activations; act++) {
            let hits = 1;
            if (card.playCopies) hits += card.playCopies;
            if (card.hitsPerSkillInHand) hits = nextCurrent.hand.filter(c => c.type === CardType.SKILL).length;
            if (card.hitsPerAttackPlayed) hits = nextCurrent.attacksPlayedThisTurn;

            for (let h = 0; h < hits; h++) {
                if (card.damage !== undefined || card.damageBasedOnBlock || card.damagePerCardInHand || card.damagePerAttackPlayed || card.damagePerStrike || card.damagePerCardInDraw) {
                    let baseDmg = card.damage || 0;
                    if (card.damageBasedOnBlock) baseDmg += nextCurrent.block;
                    if (card.damagePerCardInHand) baseDmg += nextCurrent.hand.length * card.damagePerCardInHand;
                    if (card.damagePerAttackPlayed) baseDmg += nextCurrent.attacksPlayedThisTurn * card.damagePerAttackPlayed;
                    if (card.damagePerStrike) baseDmg += nextCurrent.deck.filter(c => c.name.includes('えんぴつ攻撃')).length * card.damagePerStrike;
                    if (card.damagePerCardInDraw) baseDmg += nextCurrent.drawPile.length * card.damagePerCardInDraw;

                    const strScaling = card.strengthScaling || 1;
                    baseDmg += (nextCurrent.strength + (nextCurrent.powers['STRENGTH'] || 0)) * strScaling;

                    let multiplier = 1;
                    if (isAttack && nextCurrent.relics.some(r => r.id === 'PEN_NIB')) {
                        nextCurrent.relicCounters['PEN_NIB'] = (nextCurrent.relicCounters['PEN_NIB'] || 0) + 1;
                        if (nextCurrent.relicCounters['PEN_NIB'] >= 10) {
                            multiplier = 2;
                            nextCurrent.relicCounters['PEN_NIB'] = 0;
                            addLog('ペン先効果でダメージ2倍！');
                        }
                    }

                    let finalDmg = Math.floor(baseDmg * multiplier);
                    if (nextCurrent.powers['WEAK'] > 0) finalDmg = Math.floor(finalDmg * 0.75);
                    if (nextTarget.powers['VULNERABLE'] > 0) finalDmg = Math.floor(finalDmg * 1.5);
                    if (nextTarget.powers['INTANGIBLE'] > 0) finalDmg = 1;

                    const damageBeforeBlock = finalDmg;
                    if (nextTarget.block >= finalDmg) {
                        nextTarget.block -= finalDmg;
                        finalDmg = 0;
                    } else {
                        finalDmg -= nextTarget.block;
                        nextTarget.block = 0;
                        nextTarget.currentHp = Math.max(0, nextTarget.currentHp - finalDmg);
                    }

                    if (card.lifesteal && damageBeforeBlock > 0) {
                        const actualHeal = Math.min(damageBeforeBlock, target.currentHp);
                        nextCurrent.currentHp = Math.min(nextCurrent.maxHp, nextCurrent.currentHp + actualHeal);
                    }

                    if (damageBeforeBlock > 0 && nextTarget.powers['THORNS'] > 0) {
                        nextCurrent.currentHp = Math.max(0, nextCurrent.currentHp - nextTarget.powers['THORNS']);
                    }

                    if (nextTarget.currentHp <= 0) {
                        if (card.fatalEnergy) nextCurrent.currentEnergy += card.fatalEnergy;
                        if (card.fatalPermanentDamage) {
                            nextCurrent.deck = nextCurrent.deck.map(dc => {
                                if (dc.id === card.id) {
                                    const newDmg = (dc.damage || 0) + card.fatalPermanentDamage!;
                                    return {
                                        ...dc,
                                        damage: newDmg,
                                        description: dc.description.replace(/(\\d+)(ダメージ)/, `${newDmg}$2`)
                                    };
                                }
                                return dc;
                            });
                        }
                        if (card.fatalMaxHp) {
                            nextCurrent.maxHp += card.fatalMaxHp;
                            nextCurrent.currentHp += card.fatalMaxHp;
                        }
                    }
                }
            }
        }

        if (card.block) {
            let blk = card.block;
            if (nextCurrent.powers['DEXTERITY']) blk += nextCurrent.powers['DEXTERITY'];
            if (nextCurrent.powers['FRAIL'] > 0) blk = Math.floor(blk * 0.75);
            nextCurrent.block += blk;
            nextActiveEffects.push({ id: `vfx-block-${Date.now()}`, type: 'BLOCK', targetId: 'player' });
        }
        if (card.doubleBlock) nextCurrent.block *= 2;

        if (card.heal) {
            nextCurrent.currentHp = Math.min(nextCurrent.maxHp, nextCurrent.currentHp + card.heal);
            nextActiveEffects.push({ id: `vfx-heal-${Date.now()}`, type: 'HEAL', targetId: 'player' });
        }
        if (card.energy) nextCurrent.currentEnergy += card.energy;

        if (card.selfDamage) {
            nextCurrent.currentHp = Math.max(0, nextCurrent.currentHp - card.selfDamage);
            if (nextCurrent.powers['RUPTURE'] > 0) {
                nextCurrent.powers['STRENGTH'] = (nextCurrent.powers['STRENGTH'] || 0) + nextCurrent.powers['RUPTURE'];
                addLog('ルプチャーで筋力上昇');
            }
        }

        if (card.strength) nextCurrent.strength += card.strength;
        if (card.doubleStrength) nextCurrent.strength *= 2;

        if (card.draw) {
            drawCards(nextCurrent, card.draw);
        }

        if (card.upgradeHand) nextCurrent.hand = nextCurrent.hand.map(c => getUpgradedCard(c));
        if (card.nextTurnEnergy) nextCurrent.nextTurnEnergy += card.nextTurnEnergy;
        if (card.nextTurnDraw) nextCurrent.nextTurnDraw += card.nextTurnDraw;

        if (card.poison) {
            let amt = card.poison;
            if (nextCurrent.relics.some(r => r.id === 'SNAKE_SKULL')) amt += 1;
            nextTarget = applyDebuff(nextTarget, 'POISON', amt);
            nextActiveEffects.push({ id: `vfx-debuff-${Date.now()}`, type: 'DEBUFF', targetId: 'opponent' });
        }
        if (card.weak) {
            nextTarget = applyDebuff(nextTarget, 'WEAK', card.weak);
            nextActiveEffects.push({ id: `vfx-debuff-${Date.now()}-w`, type: 'DEBUFF', targetId: 'opponent' });
        }
        if (card.vulnerable) {
            if (card.target === TargetType.SELF) {
                nextCurrent = applyDebuff(nextCurrent, 'VULNERABLE', card.vulnerable);
                nextActiveEffects.push({ id: `vfx-debuff-${Date.now()}-self-v`, type: 'DEBUFF', targetId: 'player' });
            } else {
                nextTarget = applyDebuff(nextTarget, 'VULNERABLE', card.vulnerable);
                nextActiveEffects.push({ id: `vfx-debuff-${Date.now()}-v`, type: 'DEBUFF', targetId: 'opponent' });
            }
        }
        if (card.poisonMultiplier && nextTarget.powers['POISON'] > 0) {
            nextTarget.powers['POISON'] *= card.poisonMultiplier;
            nextActiveEffects.push({ id: `vfx-debuff-${Date.now()}-pm`, type: 'DEBUFF', targetId: 'opponent' });
        }

        if (card.applyPower) {
            const pid = card.applyPower.id;
            const amt = card.applyPower.amount;
            const debuffs = ['WEAK', 'VULNERABLE', 'POISON', 'FRAIL', 'CONFUSED'];
            if (debuffs.includes(pid)) {
                nextTarget = applyDebuff(nextTarget, pid, amt);
                nextActiveEffects.push({ id: `vfx-debuff-${Date.now()}-ap`, type: 'DEBUFF', targetId: 'opponent' });
            } else if (pid === 'CLEAR_DEBUFFS') {
                nextCurrent = clearCombatDebuffs(nextCurrent);
                nextActiveEffects.push({ id: `vfx-cleanse-${Date.now()}`, type: 'HEAL', targetId: 'player' });
            } else {
                nextCurrent.powers[pid] = (nextCurrent.powers[pid] || 0) + amt;
                nextActiveEffects.push({ id: `vfx-buff-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            }
        }

        if (card.addCardToHand) {
            for (let i = 0; i < card.addCardToHand.count; i++) {
                const template = CARDS_LIBRARY[card.addCardToHand.cardName];
                if (template) {
                    let newC = { ...template, id: `gen-hand-${Date.now()}-${Math.random()}` };
                    if (card.addCardToHand.cost0) newC.cost = 0;
                    if (nextCurrent.powers['MASTER_REALITY']) newC = getUpgradedCard(newC);
                    if (nextCurrent.hand.length < 10) nextCurrent.hand.push(newC);
                    else nextCurrent.discardPile.push(newC);
                }
            }
        }
        if (card.addCardToDraw) {
            for (let i = 0; i < card.addCardToDraw.count; i++) {
                const template = CARDS_LIBRARY[card.addCardToDraw.cardName];
                if (template) nextCurrent.drawPile.push({ ...template, id: `gen-draw-${Date.now()}-${Math.random()}` });
            }
            nextCurrent.drawPile = shuffle(nextCurrent.drawPile);
        }
        if (card.addCardToDiscard) {
            for (let i = 0; i < card.addCardToDiscard.count; i++) {
                const template = CARDS_LIBRARY[card.addCardToDiscard.cardName];
                if (template) nextCurrent.discardPile.push({ ...template, id: `gen-discard-${Date.now()}-${Math.random()}` });
            }
        }

        const shouldExhaust = card.exhaust || (card.type === CardType.SKILL && nextCurrent.powers['CORRUPTION']);
        if (shouldExhaust || card.promptsExhaust === 99) {
            nextCurrent.discardPile = nextCurrent.discardPile.filter(c => c.id !== card.id);
            if (nextCurrent.powers['FEEL_NO_PAIN']) nextCurrent.block += nextCurrent.powers['FEEL_NO_PAIN'];
        } else if (card.type !== CardType.POWER) {
            nextCurrent.discardPile.push(card);
        }

        if (card.promptsExhaust === 99) {
            if (
                card.name === '断捨離' ||
                card.name === 'SEVER_SOUL' ||
                card.name === '読書感想文' ||
                card.name === 'KOKUGO_BOOK_REPORT' ||
                card.originalNames?.includes('断捨離') ||
                card.originalNames?.includes('SEVER_SOUL') ||
                card.originalNames?.includes('読書感想文') ||
                card.originalNames?.includes('KOKUGO_BOOK_REPORT')
            ) {
                const cardsToExhaust = nextCurrent.hand.filter(c => c.type !== CardType.ATTACK);
                if (nextCurrent.powers['FEEL_NO_PAIN']) nextCurrent.block += nextCurrent.powers['FEEL_NO_PAIN'] * cardsToExhaust.length;
                nextCurrent.hand = nextCurrent.hand.filter(c => c.type === CardType.ATTACK);
            } else if (card.name === '大掃除' || card.name === 'FIEND_FIRE' || card.originalNames?.includes('大掃除') || card.originalNames?.includes('FIEND_FIRE')) {
                const cardsToExhaust = nextCurrent.hand.length;
                if (nextCurrent.powers['FEEL_NO_PAIN']) nextCurrent.block += nextCurrent.powers['FEEL_NO_PAIN'] * cardsToExhaust;
                nextCurrent.hand = [];
            }
        }

        if (card.promptsDiscard || card.promptsCopy || (card.promptsExhaust && card.promptsExhaust !== 99)) {
            const selectionType: SelectionType = card.promptsDiscard
                ? 'DISCARD'
                : card.promptsCopy
                    ? 'COPY'
                    : 'EXHAUST';
            const amount = card.promptsDiscard || card.promptsCopy || card.promptsExhaust || 0;

            setP1State(nextCurrent);
            setP2State(nextTarget);
            setSelectionState({
                active: true,
                type: selectionType,
                amount: amount,
                originCardId: card.id,
                pending: { current: nextCurrent, target: nextTarget, actionLog }
            });
            setSelectedCardIds([]);
            setIsAnimating(false);
            return;
        }

        if (isAttack) {
            nextActiveEffects.push({ id: `vfx-slash-${Date.now()}`, type: 'SLASH', targetId: 'opponent', rotation: 45 });
        }

        const revivedTarget = nextTarget.currentHp <= 0 ? reviveWithTailEffect(nextTarget) : null;
        if (revivedTarget) nextTarget = revivedTarget;
        const revivedCurrent = nextCurrent.currentHp <= 0 ? reviveWithTailEffect(nextCurrent) : null;
        if (revivedCurrent) nextCurrent = revivedCurrent;

        setP1State(nextCurrent);
        setP2State(nextTarget);
        if (nextActiveEffects.length > 0) {
            setActiveEffects(nextActiveEffects);
            setTimeout(() => setActiveEffects([]), 900);
        }

        syncStateWith(nextCurrent, nextTarget, actionLog, false);

        setIsAnimating(false);

        if (nextTarget.currentHp <= 0 || nextCurrent.currentHp <= 0) {
            if (nextTarget.currentHp <= 0) finishMatch(1);
            else finishMatch(2);
        }
    };

    const handleEndTurn = () => {
        if (!isMyTurn || isAnimating || phase !== 'BATTLE' || selectionState.active) return;

        const current = p1State;

        let updatedCurrent = { ...current, powers: { ...current.powers } };

        if (updatedCurrent.powers['POISON'] > 0) {
            const poisonDmg = updatedCurrent.powers['POISON'];
            updatedCurrent.currentHp = Math.max(0, updatedCurrent.currentHp - poisonDmg);
            updatedCurrent.powers['POISON']--;
        }

        if (updatedCurrent.powers['REGEN'] > 0) {
            const healAmt = updatedCurrent.powers['REGEN'];
            updatedCurrent.currentHp = Math.min(updatedCurrent.maxHp, updatedCurrent.currentHp + healAmt);
            updatedCurrent.powers['REGEN']--;
            addLog('再生で回復');
        }

        if (updatedCurrent.powers['METALLICIZE'] > 0) {
            updatedCurrent.block += updatedCurrent.powers['METALLICIZE'];
            addLog('メタリサイズでブロック');
        }

        ['WEAK', 'VULNERABLE', 'FRAIL', 'CONFUSED'].forEach(p => {
            if (updatedCurrent.powers[p]) updatedCurrent.powers[p]--;
        });

        const revivedCurrent = updatedCurrent.currentHp <= 0 ? reviveWithTailEffect(updatedCurrent) : null;
        if (revivedCurrent) {
            updatedCurrent = revivedCurrent;
        }

        if (updatedCurrent.hand.length > 0) {
            const remain = [...updatedCurrent.hand];
            updatedCurrent.hand = [];
            remain.forEach(c => {
                if (c.name === 'カンニングペーパー' || c.name === 'STRATEGIST') {
                    updatedCurrent.nextTurnEnergy += 2;
                }
                updatedCurrent.discardPile.push(c);
            });
        }

        setP1State(updatedCurrent);

        if (updatedCurrent.currentHp <= 0) {
            finishMatch(2);
            return;
        }

        const nextTurnCount = isHost ? turnCount + 1 : turnCount;
        if (isHost) setTurnCount(nextTurnCount);

        const processed = { ...p2State };
        if (!processed.powers['BARRICADE']) processed.block = 0;
        processed.currentEnergy = processed.maxEnergy + (processed.nextTurnEnergy || 0);
        processed.nextTurnEnergy = 0;
        processed.cardsPlayedThisTurn = 0;
        processed.attacksPlayedThisTurn = 0;
        processed.typesPlayedThisTurn = [];
        processed.echoes = processed.powers['ECHO_FORM'] || 0;
        processed.turnFlags = { ...processed.turnFlags, NECRONOMICON_USED: false };

        let drawCount = 5 + (processed.nextTurnDraw || 0);
        processed.nextTurnDraw = 0;

        drawCards(processed, drawCount - processed.hand.length);

        setP2State(processed);
        setIsMyTurn(false);

        const turnLog = `${opponentDisplayName}のターン`;
        addLog(turnLog);

        syncStateWith(updatedCurrent, processed, turnLog, true, nextTurnCount);

        audioService.playSound('select');
    };

    const finishMatch = (matchWinner: 1 | 2) => {
        setWinner(matchWinner);
        setPhase('RESULT');
        audioService.playSound('win');

        const p1Char = CHARACTERS.find(c => c.id === player1.id)?.name || '主人公';
        const p2Char = CHARACTERS.find(c => c.id === player2.id)?.name || '主人公';
        const record: VSRecord = {
            id: `vs-${Date.now()}`,
            date: Date.now(),
            opponentName: opponentDisplayName,
            playerCharName: p1Char,
            opponentCharName: p2Char,
            victory: matchWinner === 1,
            turns: turnCount
        };
        storageService.saveVSRecord(record);
    };

    const renderPowers = (powers: Record<string, number>, strength: number) => {
        const badges = [];
        const totalStr = strength + (powers['STRENGTH'] || 0);
        if (totalStr !== 0) {
            badges.push(
                <div key="str" className="flex items-center bg-red-900/60 border border-red-500 rounded px-1 gap-1 text-[10px]" title="筋力">
                    <Sword size={10} className="text-red-400" />
                    <span className="font-bold text-red-100">{totalStr}</span>
                </div>
            );
        }
        if (powers['DEXTERITY']) {
            badges.push(
                <div key="dex" className="flex items-center bg-blue-900/60 border border-blue-500 rounded px-1 gap-1 text-[10px]" title="敏捷">
                    <Shield size={10} className="text-blue-400" />
                    <span className="font-bold text-blue-100">{powers['DEXTERITY']}</span>
                </div>
            );
        }
        if (powers['WEAK']) {
            badges.push(
                <div key="weak" className="flex items-center bg-purple-900/60 border border-purple-500 rounded px-1 gap-1 text-[10px]" title="弱体">
                    <TrendingDown size={10} className="text-purple-400" />
                    <span className="font-bold text-purple-100">{powers['WEAK']}</span>
                </div>
            );
        }
        if (powers['VULNERABLE']) {
            badges.push(
                <div key="vuln" className="flex items-center bg-orange-900/60 border border-orange-500 rounded px-1 gap-1 text-[10px]" title="脆弱">
                    <AlertCircle size={10} className="text-orange-400" />
                    <span className="font-bold text-orange-100">{powers['VULNERABLE']}</span>
                </div>
            );
        }
        if (powers['POISON']) {
            badges.push(
                <div key="poison" className="flex items-center bg-green-900/60 border border-green-500 rounded px-1 gap-1 text-[10px]" title="毒">
                    <Droplets size={10} className="text-green-400" />
                    <span className="font-bold text-green-100">{powers['POISON']}</span>
                </div>
            );
        }
        if (powers['ARTIFACT']) {
            badges.push(
                <div key="art" className="flex items-center bg-yellow-900/60 border border-yellow-500 rounded px-1 gap-1 text-[10px]" title="アーティファクト">
                    <Hexagon size={10} className="text-yellow-300" />
                    <span className="font-bold text-yellow-100">{powers['ARTIFACT']}</span>
                </div>
            );
        }
        if (powers['THORNS']) {
            badges.push(
                <div key="thorns" className="flex items-center bg-orange-900/60 border border-orange-500 rounded px-1 gap-1 text-[10px]" title="トゲ">
                    <Radiation size={10} className="text-orange-400" />
                    <span className="font-bold text-orange-100">{powers['THORNS']}</span>
                </div>
            );
        }
        if (powers['REGEN']) {
            badges.push(
                <div key="regen" className="flex items-center bg-green-900/60 border border-green-500 rounded px-1 gap-1 text-[10px]" title="再生">
                    <Activity size={10} className="text-green-400" />
                    <span className="font-bold text-green-100">{powers['REGEN']}</span>
                </div>
            );
        }
        if (powers['METALLICIZE']) {
            badges.push(
                <div key="metal" className="flex items-center bg-blue-900/60 border border-blue-400 rounded px-1 gap-1 text-[10px]" title="メタリサイズ">
                    <ShieldPlus size={10} className="text-blue-200" />
                    <span className="font-bold text-blue-100">{powers['METALLICIZE']}</span>
                </div>
            );
        }
        if (powers['RUPTURE']) {
            badges.push(
                <div key="rupture" className="flex items-center bg-purple-900/60 border border-purple-500 rounded px-1 gap-1 text-[10px]" title="ルプチャー">
                    <Flame size={10} className="text-purple-300" />
                    <span className="font-bold text-purple-100">{powers['RUPTURE']}</span>
                </div>
            );
        }
        return badges;
    };

    if (phase === 'DISCONNECTED') {
        return (
            <div className="flex flex-col h-full w-full bg-slate-950 items-center justify-center p-6 text-white font-mono">
                <div className="bg-slate-900 border-4 border-red-600 p-8 rounded-3xl w-full max-w-md shadow-2xl text-center">
                    <WifiOff size={80} className="text-red-500 mx-auto mb-6 animate-pulse" />
                    <h2 className="text-3xl font-black text-red-500 italic mb-4">接続が切れました</h2>
                    <p className="text-gray-400 mb-8">P2P接続が切断されました</p>
                    <button
                        onClick={() => onFinish(1)}
                        className="w-full bg-white text-slate-900 font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                    >
                        <Home size={20} /> タイトルへ戻る
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'RESULT') {
        return (
            <div className="flex flex-col h-full w-full bg-slate-950 items-center justify-center p-6 text-white font-mono">
                <div className="bg-slate-900 border-4 border-indigo-500 p-8 rounded-3xl w-full max-w-md shadow-[0_0_60px_rgba(79,70,229,0.4)] text-center animate-in zoom-in duration-300">
                    {winner === 1 ? (
                        <>
                            <Trophy size={80} className="text-yellow-400 mx-auto mb-6 animate-bounce" />
                            <h2 className="text-5xl font-black text-yellow-400 italic mb-2 tracking-tighter">WINNER!</h2>
                        </>
                    ) : (
                        <>
                            <Skull size={80} className="text-red-500 mx-auto mb-6 animate-pulse" />
                            <h2 className="text-5xl font-black text-red-500 italic mb-2 tracking-tighter">DEFEATED</h2>
                        </>
                    )}
                    <div className="bg-black/40 rounded-2xl p-6 border border-indigo-900/50 mb-8 mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-left">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">You</p>
                                <p className="text-xl font-black text-indigo-100">{myDisplayName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Turns</p>
                                <p className="text-xl font-black text-indigo-400">{turnCount}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => onFinish(winner!)}
                        className="w-full bg-white text-slate-900 font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                    >
                        <Home size={20} /> タイトルへ戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-gray-900 text-white relative overflow-hidden">
            <div className="shrink-0 bg-black border-b-2 border-gray-700 p-1.5 md:p-2 z-30 relative min-h-[3.1rem] md:min-h-[4rem] flex flex-col justify-center shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-1 md:gap-0">
                    <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-green-500/50 self-start">
                        <Wifi size={16} className="text-green-400 animate-pulse" />
                        <span className="text-green-400 text-xs font-bold">P2P接続中</span>
                    </div>
                    <div className="text-yellow-400 text-xs md:text-sm font-bold bg-gray-900/80 px-3 py-1 rounded border border-yellow-700 self-start md:self-auto">
                        TURN {turnCount}
                    </div>
                    <div className="text-xs text-gray-400 self-start md:self-auto">{isMyTurn ? `${myDisplayName}のターン` : `${opponentDisplayName}のターン`}</div>
                </div>
                <div className="text-[10px] md:text-xs text-green-400 truncate leading-snug mt-0.5 md:mt-1">
                    <span className="animate-pulse mr-2">&gt;&gt;</span> {logs[0]}
                </div>
            </div>

            <div className="flex-1 relative overflow-y-auto custom-scrollbar flex flex-col justify-start p-2 bg-gray-800/50 gap-2 md:gap-4">
                <div className="flex justify-center items-start pt-2 md:pt-8 gap-2 min-h-[106px] md:min-h-[180px] shrink-0">
                    <div className="flex flex-col items-center z-10 transition-all duration-200 relative">
                        <div className={`absolute -top-5 md:-top-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 text-[10px] md:text-xs font-extrabold px-2 py-0.5 md:py-1 rounded border-2 whitespace-nowrap shadow-xl flex items-center justify-center min-w-[54px] ${!isMyTurn ? 'bg-red-600 text-white border-white animate-pulse' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                            {!isMyTurn ? (
                                <>
                                    <Swords size={10} className="mr-1" />
                                    相手のターン
                                </>
                            ) : (
                                <>待機中</>
                            )}
                        </div>

                        <div className="relative mb-1 md:mb-2">
                            <img
                                src={player2.imageData}
                                alt={opponentDisplayName}
                                className={`w-16 h-16 md:w-20 md:h-20 rounded-md object-cover border border-gray-700 bg-black/40 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-transform ${opponentActionPulse ? 'animate-opponent-act' : ''}`}
                                style={{ imageRendering: player2.imageData.startsWith('data:image/svg+xml') ? 'pixelated' : 'auto' }}
                            />
                            <VFXOverlay effects={activeEffects} targetId="opponent" />
                        </div>

                        <div className="text-[11px] md:text-sm font-bold text-red-400 mb-0 max-w-[120px] text-center truncate">{opponentDisplayName}</div>
                        <div className="text-[9px] text-red-300 mb-0.5 md:mb-1 max-w-[120px] text-center truncate">{opponentCharName}</div>

                        <div className="w-28 md:w-32 bg-gray-800 rounded-full h-2.5 md:h-3 border border-gray-600 overflow-hidden mb-0.5 md:mb-1 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                                style={{ width: `${(p2State.currentHp / p2State.maxHp) * 100}%` }}
                            />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-red-300 font-bold">
                            <Heart size={10} fill="currentColor" />
                            {p2State.currentHp}/{p2State.maxHp}
                        </div>

                        {p2State.block > 0 && (
                            <div className="mt-1 flex items-center gap-1 bg-blue-900/60 border border-blue-500 rounded px-1.5 py-0.5">
                                <Shield size={12} className="text-blue-400" />
                                <span className="text-blue-100 font-bold text-xs">{p2State.block}</span>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-1 mt-1 md:mt-2 max-w-[140px] justify-center">
                            {renderPowers(p2State.powers, p2State.strength)}
                        </div>

                        <div className="mt-1 md:mt-2 bg-yellow-900/50 px-2 py-0.5 rounded-full border border-yellow-500 text-yellow-400 font-bold flex items-center gap-1 text-xs">
                            <Zap size={12} fill="currentColor" />
                            {p2State.currentEnergy}/{p2State.maxEnergy}
                        </div>

                        <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-gray-400 flex items-center gap-1">
                            <Layers size={10} />
                            手札: {p2State.hand.length}枚
                        </div>
                    </div>
                </div>

                <div className="shrink-0 -mt-1 md:mt-0">
                    <div className="bg-black/60 rounded-lg p-1.5 md:p-2 mb-2 border border-blue-500/30 flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-2 md:gap-3 relative">
                        <VFXOverlay effects={activeEffects} targetId="player" />
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap md:flex-nowrap">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                                    <Heart size={12} />
                                    HP
                                </div>
                                <div className="w-28 md:w-32 bg-gray-800 rounded-full h-2.5 md:h-3 border border-gray-600 overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300"
                                        style={{ width: `${(p1State.currentHp / p1State.maxHp) * 100}%` }}
                                    />
                                </div>
                                <div className="text-[10px] md:text-xs text-green-300 font-bold mt-0.5">
                                    {p1State.currentHp}/{p1State.maxHp}
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                                    <Shield size={12} />
                                    ブロック
                                </div>
                                <div className="text-xl md:text-2xl font-black text-blue-400">
                                    {p1State.block}
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                                    <Zap size={12} />
                                    エナジー
                                </div>
                                <div className="text-xl md:text-2xl font-black text-yellow-400">
                                    {p1State.currentEnergy}/{p1State.maxEnergy}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1 max-w-[200px] justify-start md:justify-center flex-1">
                            {renderPowers(p1State.powers, p1State.strength)}
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto md:ml-auto justify-between md:justify-start">
                            <div className="text-[10px] text-gray-400 flex flex-col leading-tight">
                                <span className="flex items-center"><Layers size={10} className="mr-1" /> {p1State.drawPile.length}</span>
                                <span className="flex items-center"><X size={10} className="mr-1" /> {p1State.discardPile.length}</span>
                            </div>
                            <button
                                onClick={!isAnimating ? handleEndTurn : undefined}
                                disabled={!isMyTurn || isAnimating || selectionState.active}
                                className={`
                                    bg-red-600 border-2 border-white px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded
                                    ${isMyTurn && !isAnimating && !selectionState.active ? 'hover:bg-red-500 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}
                                `}
                            >
                                ターン終了
                            </button>
                        </div>
                    </div>

                    {selectionState.active && (
                        <div className="bg-blue-900/40 border border-blue-400/40 rounded-lg p-2 mb-2 flex items-center justify-between gap-2 text-xs">
                            <div className="font-bold text-blue-200">
                                {selectionState.type === 'DISCARD' && `捨てるカードを選択 (${selectedCardIds.length}/${selectionState.amount})`}
                                {selectionState.type === 'COPY' && `コピーするカードを選択 (${selectedCardIds.length}/${selectionState.amount})`}
                                {selectionState.type === 'EXHAUST' && `廃棄するカードを選択 (${selectedCardIds.length}/${selectionState.amount})`}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedCardIds([])}
                                    className="px-3 py-1 rounded border text-xs font-bold bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={finalizeSelection}
                                    disabled={selectedCardIds.length !== selectionState.amount}
                                    className={`px-3 py-1 rounded border text-xs font-bold ${selectedCardIds.length === selectionState.amount ? 'bg-blue-500 border-blue-200 text-white' : 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'}`}
                                >
                                    確定
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="h-44 md:h-52 bg-transparent relative z-10 -mt-2 md:mt-0">
                        <div className="group/hand w-full h-full overflow-x-auto px-6 flex items-end justify-start md:justify-center pb-3 md:pb-2 custom-scrollbar touch-pan-x" style={{ overflowY: 'visible' }}>
                            {p1State.hand.map((card, i) => {
                                const isAttack = card.type === CardType.ATTACK || String(card.type) === 'ATTACK';
                                const isAttackRestricted = turnCount === 1 && isAttack && isHost;
                                const isClashDisabled = card.playCondition === 'HAND_ONLY_ATTACKS' && p1State.hand.some(c => c.type !== CardType.ATTACK && c.id !== card.id);
                                const isGrandFinaleDisabled = card.playCondition === 'DRAW_PILE_EMPTY' && p1State.drawPile.length > 0;
                                const isChokerDisabled = p1State.relics.some(r => r.id === 'VELVET_CHOKER') && p1State.cardsPlayedThisTurn >= 6;
                                const isNormalityDisabled = p1State.hand.some(c => c.name === '退屈' || c.name === 'NORMALITY') && p1State.cardsPlayedThisTurn >= 3;
                                const displayCard = { ...card };
                                if (p1State.powers['CORRUPTION'] && card.type === CardType.SKILL) {
                                    displayCard.cost = 0;
                                }
                                const isDisabled = selectionState.active
                                    ? false
                                    : (!isMyTurn
                                        || isAnimating
                                        || p1State.currentEnergy < displayCard.cost
                                        || isAttackRestricted
                                        || isClashDisabled
                                        || isGrandFinaleDisabled
                                        || isChokerDisabled
                                        || isNormalityDisabled
                                        || card.unplayable);

                                const mid = (p1State.hand.length - 1) / 2;
                                const dist = i - mid;
                                const rotation = dist * 2.5;
                                const translateY = Math.abs(dist) * 3;

                                const isSelected = selectionState.active && selectedCardIds.includes(card.id);

                                return (
                                    <div
                                        key={card.id}
                                        className={`inline-block align-middle transition-all duration-500 ease-out w-24 h-36 md:w-32 md:h-48 shrink-0 relative 
                                            -ml-16 first:ml-0 md:ml-0 
                                            group-hover/hand:-ml-2 group-active/hand:-ml-2
                                            ${isSelected ? 'cursor-pointer -translate-y-6 z-30 scale-110' : 'hover:-translate-y-3 hover:z-20'}
                                        `}
                                        style={{
                                            transform: isSelected ? 'translateY(-24px) scale(1.05)' : `rotate(${rotation}deg) translateY(${translateY}px)`,
                                            zIndex: isSelected ? 40 : 10 + i
                                        }}
                                    >
                                        <div className="absolute -top-2 md:top-0 left-0 origin-top-left scale-[0.7] sm:scale-90 md:scale-100">
                                            <Card
                                                card={displayCard}
                                                onClick={() => {
                                                    if (selectionState.active) {
                                                        toggleSelectCard(card.id);
                                                    } else {
                                                        handlePlayCard(card);
                                                    }
                                                }}
                                                disabled={isDisabled}
                                                languageMode={languageMode}
                                            />
                                        </div>
                                        {isSelected && (
                                            <div className="absolute inset-0 rounded-lg ring-4 ring-blue-400 pointer-events-none" />
                                        )}
                                    </div>
                                );
                            })}
                            <div className="w-12 shrink-0"></div>
                        </div>
                    </div>

                </div>
            </div>
            <style>
                {`
                    @keyframes opponent-act {
                        0% { transform: translateX(0) scale(1); }
                        35% { transform: translateX(-8px) scale(1.06); }
                        100% { transform: translateX(0) scale(1); }
                    }
                    .animate-opponent-act {
                        animation: opponent-act 0.42s ease-out;
                    }
                `}
            </style>
        </div>
    );
};

export default P2PVSBattleScene;








