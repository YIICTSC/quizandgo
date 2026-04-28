
import { Enemy, Player, Card as ICard, CardType, SelectionState, Potion, FloatingText, EnemyIntentType, LanguageMode, ParryState, VisualEffectInstance, CoopSupportCard } from '../types';
import Card, { KEYWORD_DEFINITIONS } from './Card';
import { Heart, Shield, Zap, Skull, Layers, X, Sword, AlertCircle, TrendingDown, Droplets, Hexagon, Gem, FlaskConical, Info, FileText, MoreHorizontal, Users, Sparkles, MessageCircle, Mic, ArrowRight, MousePointer2, ChevronsRight, ChevronDown, Flame, RotateCcw, Triangle, Settings } from 'lucide-react';
import PixelSprite from './PixelSprite';
import EnemyIllustration from './EnemyIllustration';
import { audioService } from '../services/audioService';
import { trans } from '../utils/textUtils';
import { HERO_IMAGE_DATA, CARDS_LIBRARY, STATUS_CARDS } from '../constants';
import { ENEMY_ILLUSTRATION_SIZE_CLASS } from '../constants/uiSizing';
import { getUpgradedCard, synthesizeCards } from '../utils/cardUtils';
import { getCardIllustrationPaths } from '../utils/cardIllustration';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { storageService } from '../services/storageService';

const POWER_DEFINITIONS: Record<string, { name: string, desc: string }> = {
    WEAK: { name: "へろへろ", desc: "攻撃で与えるダメージが25%減っちゃう。" },
    VULNERABLE: { name: "びくびく", desc: "攻撃から受けるダメージが50%増えちゃう。" },
    POISON: { name: "ドクドク", desc: "ターン終了時にHPダメージを受け、数値が1減る。" },
    STRENGTH: { name: "ムキムキ", desc: "攻撃ダメージがその数値分アップ！" },
    DEXTERITY: { name: "カチカチ", desc: "ブロックを得るカードの効果がその数値分アップ！" },
    ARTIFACT: { name: "キラキラ", desc: "次に受ける悪い効果（デバフ）を無効化する。" },
    INTANGIBLE: { name: "スケスケ", desc: "受けるダメージとHP減少が1になる。" },
    THORNS: { name: "トゲトゲ", desc: "攻撃を受けた時、相手にその数値分のダメージを返す。" },
    THORNS_DESC: { name: "トゲトゲ", desc: "攻撃を受けた時、相手にその数値分のダメージを返す。" },
    METALLICIZE: { name: "金属化", desc: "ターン終了時、その数値分のブロックを得る。" },
    REGEN: { name: "じわじわ回復", desc: "ターン終了時、その数値分HPを回復し、数値が1減る。" },
    STRENGTH_DOWN: { name: "ムキムキダウン", desc: "ターン終了時、ムキムキが通常の値に戻る。" },
    CONFUSED: { name: "混乱", desc: "カードのコストがランダムに変化する。" },
    LOSE_STRENGTH: { name: "反動", desc: "ターン終了時、ムキムキを失う。" },

    // Renamed Powers
    DEMON_FORM: { name: "反抗期", desc: "ターン開始時、ムキムキになる。" },
    ECHO_FORM: { name: "予習復習", desc: "各ターン、最初にプレイしたカードを2回使用する。" },
    BARRICADE: { name: "秘密基地", desc: "ターン開始時にブロックが消えなくなる。" },
    NOXIOUS_FUMES: { name: "異臭騒ぎ", desc: "ターン開始時、敵全体をドクドクにする。" },
    INFINITE_BLADES: { name: '鉛筆削り', desc: 'ターン開始時、手札にえんぴつの削りかすを加える。' },
    AFTER_IMAGE: { name: '反復横跳び', desc: 'カードを使用する度、ブロック1を得る。' },
    THOUSAND_CUTS: { name: '千本ノック', desc: 'カードを使用する度、敵全体にダメージを与える。' },
    TOOLS_OF_THE_TRADE: { name: '整理整頓', desc: 'ターン開始時、1枚引いて1枚捨てる。' },
    ENVENOM: { name: '悪口', desc: '攻撃でダメージを与えた時、ドクドク1を与える。' },
    STATIC_DISCHARGE: { name: '摩擦熱', desc: '攻撃を受けた時、ランダムな敵にダメージを与える。' },
    BUFFER: { name: '心の壁', desc: '次に受ける HPダメージを0にする。' },
    CREATIVE_AI: { name: '自由研究', desc: 'ターン開始時、ランダムなパワーカードを加える。' },
    DEVA_FORM: { name: '受験勉強', desc: 'ターン開始時、エネルギーを得る。' },
    MASTER_REALITY: { name: '模範解答', desc: 'カードが生成された時、それをアップグレードする。' },
    BURST: { name: 'バースト', desc: '次にプレイするスキルカードが2回発動する。' },
    DOUBLE_POISON: { name: '化学反応', desc: 'ドクドクの効果を増幅させる。' },
    CORRUPTION: { name: '賞味期限', desc: 'スキルカードのコストが0になり、使用時に廃棄される。' },
    FEEL_NO_PAIN: { name: '我慢大会', desc: 'カードが廃棄される度、ブロックを得る。' },
    RUPTURE: { name: '成長痛', desc: 'HPを失った時、ムキムキを得る。' },
    EVOLVE: { name: '進級', desc: '状態異常カードを引いた時、カードを引く。' },
    APOTHEOSIS: { name: '覚醒', desc: 'デッキの全てのカードがアップグレードされる。' },
    ACCURACY: { name: '精度上昇', desc: 'えんぴつの削りかすのダメージが増加する。' },
    STRATEGIST: { name: 'カンニングペーパー', desc: 'このカードが捨てられた時、エネルギーを得る。' },
    INFLAME: { name: 'やる気スイッチ', desc: 'ムキムキを得る。' },
};

// Component for handling floating damage/heal numbers
export const FloatingTextOverlay: React.FC<{ data: FloatingText | null, languageMode: LanguageMode, offset?: string }> = ({ data, languageMode, offset = "-top-4 -left-4" }) => {
    if (!data) return null;

    return (
        <div
            key={data.id} // Forces re-mount to restart animation on new ID
            className={`absolute ${offset} z-50 font-bold text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)] pointer-events-none ${data.color} flex items-center bg-black/40 rounded-lg px-2 py-0.5 backdrop-blur-[2px] border border-white/10`}
            style={{
                animation: 'float-pop-fade 0.9s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards'
            }}
        >
            <style>
                {`
                    @keyframes float-pop-fade {
                        0% { transform: translateY(0) scale(0.5); opacity: 0; }
                        15% { transform: translateY(-15px) scale(1.4); opacity: 1; }
                        30% { transform: translateY(-10px) scale(1.1); opacity: 1; }
                        100% { transform: translateY(-40px) scale(1); opacity: 0; }
                    }
                `}
            </style>
            {data.iconType === 'zap' && <Zap size={16} className="mr-1 fill-current" />}
            {data.iconType === 'sword' && <Sword size={16} className="mr-1 fill-current" />}
            {data.iconType === 'shield' && <Shield size={16} className="mr-1 fill-current" />}
            {data.iconType === 'heart' && <Heart size={16} className="mr-1 fill-current" />}
            {data.iconType === 'poison' && <Droplets size={16} className="mr-1 fill-current" />}
            {data.iconType === 'skull' && <Skull size={16} className="mr-1 fill-current" />}
            {trans(data.text, languageMode)}
        </div>
    );
};

// Component for handling visual effects like slashes
export const VFXOverlay: React.FC<{ effects: VisualEffectInstance[], targetId: string }> = ({ effects, targetId }) => {
    const activeOnThisTarget = effects.filter(e => e.targetId === targetId);
    if (activeOnThisTarget.length === 0) return null;

    const IMPACT_VFX_TYPES = new Set(['SLASH', 'FIRE', 'EXPLOSION', 'LIGHTNING', 'CRITICAL', 'FLASH', 'SHOCKWAVE']);
    const getUnifiedCategory = (type: VisualEffectInstance['type']) => {
        if (['SLASH', 'FIRE', 'EXPLOSION', 'LIGHTNING', 'CRITICAL', 'SHOCKWAVE'].includes(type)) return 'OFFENSE';
        if (type === 'BLOCK') return 'DEFENSE';
        if (type === 'BUFF') return 'BUFF';
        if (type === 'DEBUFF') return 'DEBUFF';
        if (type === 'HEAL') return 'RECOVERY';
        return 'UTILITY';
    };
    const getUnifiedPreludeClass = (type: VisualEffectInstance['type']) => {
        const category = getUnifiedCategory(type);
        if (category === 'OFFENSE') return 'border-orange-300/70';
        if (category === 'DEFENSE') return 'border-cyan-300/70';
        if (category === 'BUFF') return 'border-yellow-300/70';
        if (category === 'DEBUFF') return 'border-fuchsia-400/70';
        if (category === 'RECOVERY') return 'border-emerald-300/70';
        return 'border-white/50';
    };
    const MAX_SIMULTANEOUS_VFX = 6;
    const prioritizedEffects = [...activeOnThisTarget]
        .sort((a, b) => {
            const aImpact = IMPACT_VFX_TYPES.has(a.type) ? 1 : 0;
            const bImpact = IMPACT_VFX_TYPES.has(b.type) ? 1 : 0;
            if (aImpact !== bImpact) return bImpact - aImpact;
            return (a.delay || 0) - (b.delay || 0);
        })
        .slice(0, MAX_SIMULTANEOUS_VFX);
    const droppedEffectCount = Math.max(0, activeOnThisTarget.length - prioritizedEffects.length);

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none overflow-visible">
            {prioritizedEffects.map((vfx, index) => {
                const impactType = IMPACT_VFX_TYPES.has(vfx.type);
                const queuedDelay = impactType ? 0 : Math.min(200, index * 40);
                const totalDelay = (vfx.delay || 0) + queuedDelay;
                return (
                <div key={vfx.id} className="absolute inset-0 flex items-center justify-center">
                    {vfx.type !== 'FLASH' && (
                        <div
                            className={`absolute w-20 h-20 rounded-full border-2 ${getUnifiedPreludeClass(vfx.type)}`}
                            style={{
                                animation: 'unified-vfx-prelude 260ms ease-out',
                                animationDelay: `${Math.max(0, totalDelay - 50)}ms`,
                                animationFillMode: 'both'
                            }}
                        ></div>
                    )}
                    {vfx.type === 'SLASH' && (
                        <div
                            className="w-48 h-2 bg-gradient-to-r from-transparent via-white to-transparent animate-slash-vfx shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                            style={{
                                transform: `rotate(${vfx.rotation !== undefined ? vfx.rotation : 45}deg)`,
                                animationDelay: `${totalDelay}ms`,
                                animationFillMode: 'both'
                            }}
                        ></div>
                    )}
                    {vfx.type === 'BLOCK' && (
                        <div
                            className="relative flex items-center justify-center"
                            style={{ animationDelay: `${totalDelay}ms`, animationFillMode: 'both' }}
                        >
                            <div className="absolute w-32 h-32 border-4 border-blue-400 rounded-full animate-pulse-expand opacity-0"></div>
                            <div className="animate-block-vfx p-4 bg-blue-500/30 border-2 border-blue-300 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                                <Shield size={48} className="text-blue-100 fill-blue-500/50" />
                            </div>
                        </div>
                    )}
                    {vfx.type === 'BUFF' && (
                        <div className="animate-buff-vfx p-2" style={{ animationDelay: `${totalDelay}ms`, animationFillMode: 'both' }}>
                            <Sparkles size={56} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                        </div>
                    )}
                    {vfx.type === 'DEBUFF' && (
                        <div className="animate-debuff-vfx p-2" style={{ animationDelay: `${totalDelay}ms`, animationFillMode: 'both' }}>
                            <Skull size={56} className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                        </div>
                    )}
                    {vfx.type === 'HEAL' && (
                        <div className="animate-heal-vfx" style={{ animationDelay: `${totalDelay}ms`, animationFillMode: 'both' }}>
                            <Heart size={56} className="text-green-300 fill-green-500/50 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                        </div>
                    )}
                    {vfx.type === 'FIRE' && (
                        <div className="relative flex items-center justify-center" style={{ animationDelay: `${totalDelay}ms`, animationFillMode: 'both' }}>
                            <div className="absolute w-24 h-24 bg-orange-500/40 blur-xl animate-ping rounded-full"></div>
                            <div className="animate-fire-vfx">
                                <Flame size={64} className="text-orange-400 fill-orange-600/50 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]" />
                            </div>
                        </div>
                    )}
                    {vfx.type === 'EXPLOSION' && (
                        <div
                            className="w-32 h-32 bg-orange-500 rounded-full animate-explosion-vfx shadow-[0_0_40px_orange]"
                            style={{ animationDelay: `${totalDelay}ms`, animationFillMode: 'both' }}
                        ></div>
                    )}
                    {vfx.type === 'LIGHTNING' && (
                        <div
                            className="w-4 h-64 bg-cyan-200 animate-lightning-vfx shadow-[0_0_30px_cyan]"
                            style={{
                                animationDelay: `${totalDelay}ms`,
                                transform: `rotate(${vfx.rotation || 0}deg)`,
                                animationFillMode: 'both'
                            }}
                        ></div>
                    )}
                    {vfx.type === 'CRITICAL' && (
                        <div
                            className="w-64 h-64 border-8 border-yellow-400 rounded-full animate-critical-vfx"
                            style={{ animationDelay: `${totalDelay}ms`, animationFillMode: 'both' }}
                        ></div>
                    )}
                    {vfx.type === 'SHOCKWAVE' && (
                        <div
                            className="w-16 h-16 border-4 border-white/50 rounded-full animate-shockwave-vfx"
                            style={{ animationDelay: `${totalDelay}ms`, animationFillMode: 'both' }}
                        ></div>
                    )}
                    {vfx.type === 'FLASH' && (
                        <div
                            className="absolute w-[200vw] h-[200vh] bg-white animate-flash-vfx"
                            style={{ animationDelay: `${totalDelay}ms`, animationFillMode: 'both' }}
                        ></div>
                    )}
                </div>
            )})}
            <style>
                {`
                    @keyframes slash-vfx {
                        0% { transform: rotate(45deg) scaleX(0) translateX(-100%); opacity: 0; }
                        20% { transform: rotate(45deg) scaleX(1.8) translateX(0); opacity: 1; }
                        100% { transform: rotate(45deg) scaleX(2.5) translateX(100%); opacity: 0; }
                    }
                    @keyframes unified-vfx-prelude {
                        0% { transform: scale(0.4); opacity: 0; }
                        35% { transform: scale(1.05); opacity: 0.9; }
                        100% { transform: scale(1.45); opacity: 0; }
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
                    @keyframes screen-shake {
                        0% { transform: translate(0, 0); }
                        10% { transform: translate(-4px, -4px); }
                        20% { transform: translate(4px, 4px); }
                        30% { transform: translate(-4px, 4px); }
                        40% { transform: translate(4px, -4px); }
                        50% { transform: translate(-2px, -2px); }
                        60% { transform: translate(2px, 2px); }
                        70% { transform: translate(-2px, 2px); }
                        80% { transform: translate(2px, -2px); }
                        100% { transform: translate(0, 0); }
                    }
                    .animate-screen-shake {
                        animation: screen-shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                    }
                `}
            </style>
        </div>
    );
};

interface BattleSceneProps {
    player: Player;
    companions?: Array<{ id: string; name: string; maxHp: number; currentHp: number; imageData: string; floatingText: FloatingText | null; }>;
    coopSelfPeerId?: string;
    coopEffectOwnerPeerId?: string | null;
    coopTurnQueue?: Array<{ id: string; type: 'SELF' | 'ALLY' | 'ENEMY'; label: string }>;
    coopCanAct?: boolean;
    coopTurnOwnerLabel?: string;
    coopSupportCards?: CoopSupportCard[];
    onUseCoopSupport?: (card: CoopSupportCard, targetPeerId?: string) => void;
    selfDown?: boolean;
    enemies: Enemy[];
    selectedEnemyId: string | null;
    onSelectEnemy: (id: string) => void;
    onPlayCard: (card: ICard) => void;
    onPlaySynthesizedCard: (card: ICard) => void;
    onEndTurn: () => void;
    turnLog: string;
    narrative: string;
    lastActionTime: number;
    lastActionType: CardType | null;
    actingEnemyId: string | null;
    selectionState: SelectionState;
    onHandSelection: (card: ICard) => void;
    onCancelSelection: () => void;
    onUsePotion: (potion: Potion) => void;
    combatLog: string[];
    languageMode: LanguageMode;
    codexOptions?: ICard[];
    onCodexSelect: (card: ICard | null) => void;
    parryState?: ParryState;
    onParry: () => void;
    activeEffects: VisualEffectInstance[];
    finisherCutinCard?: ICard | null;
    hideEnemyIntents?: boolean;
    onOpenSettings?: () => void;
}

type DrawEntryAnimation = {
    cardId: string;
    delayMs: number;
};

const BattleScene: React.FC<BattleSceneProps> = ({
    player, companions = [], coopSelfPeerId, coopEffectOwnerPeerId, coopTurnQueue = [], coopCanAct = true, coopTurnOwnerLabel, coopSupportCards = [], onUseCoopSupport, selfDown = false, enemies, selectedEnemyId, onSelectEnemy, onPlayCard, onPlaySynthesizedCard, onEndTurn, turnLog, narrative, lastActionTime, lastActionType, actingEnemyId,
    selectionState, onHandSelection, onCancelSelection, onUsePotion, combatLog, languageMode, codexOptions, onCodexSelect, parryState, onParry, activeEffects, finisherCutinCard, hideEnemyIntents = false, onOpenSettings
}) => {
    const isCoopBattleView = !!coopSelfPeerId || companions.length > 0;
    const shouldRenderPlayerScopedVfxOnSelf = isCoopBattleView
        ? !!coopSelfPeerId && !!coopEffectOwnerPeerId && coopEffectOwnerPeerId === coopSelfPeerId
        : true;
    const getPlayerScopedEffectsForPeer = (peerId: string) => activeEffects
        .filter(effect => effect.targetId === 'player')
        .filter(effect => {
            if (effect.ownerPeerId) return effect.ownerPeerId === peerId;
            if (!isCoopBattleView) return true;
            if (peerId === coopSelfPeerId) return shouldRenderPlayerScopedVfxOnSelf;
            return !!coopEffectOwnerPeerId && coopEffectOwnerPeerId === peerId;
        })
        .map(effect => ({ ...effect, targetId: peerId }));
    const selfScopedEffects = isCoopBattleView && coopSelfPeerId
        ? getPlayerScopedEffectsForPeer(coopSelfPeerId)
        : activeEffects.filter(effect => effect.targetId === 'player');

    const [lastVisibleEnemies, setLastVisibleEnemies] = useState<Enemy[]>([]);
    const [selectedSupportCard, setSelectedSupportCard] = useState<CoopSupportCard | null>(null);
    const [coopSupportHudOpen, setCoopSupportHudOpen] = useState(false);
    const isFinisherActive = !!finisherCutinCard;
    const visualEnemies = isFinisherActive && enemies.length === 0 ? lastVisibleEnemies : enemies;
    const playerHpPercent = (player.currentHp / player.maxHp) * 100;
    const supportNeedsTarget = (card: CoopSupportCard) => (
        card.effectId === 'ALLY_HEAL' ||
        card.effectId === 'ALLY_BLOCK' ||
        card.effectId === 'ALLY_NEXT_ENERGY' ||
        card.effectId === 'ALLY_ATTACK_BOOST' ||
        card.effectId === 'ALLY_BUFFER' ||
        card.effectId === 'REVIVE_BANDAGE' ||
        card.effectId === 'REVIVE_NURSE'
    );
    const isTrueBossPhase2Active = visualEnemies.some(enemy => enemy.enemyType === 'THE_HEART' && enemy.phase === 2);

    useEffect(() => {
        if (enemies.length > 0) {
            setLastVisibleEnemies(enemies.map((e) => ({ ...e })));
        }
    }, [enemies]);

    useEffect(() => {
        if (coopSupportCards.length === 0) {
            setCoopSupportHudOpen(false);
            setSelectedSupportCard(null);
        }
    }, [coopSupportCards.length]);

    const [isActing, setIsActing] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [showDeck, setShowDeck] = useState(false);
    const [showRelicList, setShowRelicList] = useState(false);
    const [tooltip, setTooltip] = useState<{ title: string, msg: string } | null>(null);
    const [potionConfirmation, setPotionConfirmation] = useState<Potion | null>(null);
    const [inspectedCard, setInspectedCard] = useState<ICard | null>(null);
    const [fullscreenArtCard, setFullscreenArtCard] = useState<ICard | null>(null);
    const [showLog, setShowLog] = useState(false);
    const [finisherBurst, setFinisherBurst] = useState(false);
    const [drawEntryAnimations, setDrawEntryAnimations] = useState<DrawEntryAnimation[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const prevHandIdsRef = useRef<string[]>([]);
    const drawEntryTimeoutsRef = useRef<number[]>([]);

    // --- BATTLE TUTORIAL STATE ---
    const [tutorialStep, setTutorialStep] = useState<number | null>(null);

    useEffect(() => {
        if (!storageService.getSeenBattleTutorial()) {
            setTutorialStep(1);
        }
    }, []);

    const closeTutorial = () => {
        setTutorialStep(null);
        storageService.saveSeenBattleTutorial();
    };

    const nextTutorialStep = () => {
        if (tutorialStep === null) return;
        if (tutorialStep >= 5) {
            closeTutorial();
        } else {
            setTutorialStep(tutorialStep + 1);
            audioService.playSound('select');
        }
    };

    // Screen shake on action or damage
    useEffect(() => {
        if (selectionState.active) {
            setIsShaking(false);
            return;
        }
        if (activeEffects.length > 0) {
            const impactTypes = activeEffects.map(e => e.type);
            const hasImpact = impactTypes.some(type => ['SLASH', 'FIRE', 'EXPLOSION', 'LIGHTNING', 'CRITICAL'].includes(type));
            if (hasImpact) {
                const isHeavyImpact = impactTypes.some(type => type === 'CRITICAL' || type === 'EXPLOSION');
                const isMediumImpact = !isHeavyImpact && impactTypes.some(type => type === 'LIGHTNING' || type === 'FIRE');
                const shakeMs = isHeavyImpact ? 520 : (isMediumImpact ? 420 : 320);
                setIsShaking(true);
                const timer = setTimeout(() => setIsShaking(false), shakeMs);
                return () => clearTimeout(timer);
            }
        }
    }, [activeEffects, selectionState.active]);

    useEffect(() => {
        if (!isFinisherActive) {
            setFinisherBurst(false);
            return;
        }
        const timer = setTimeout(() => setFinisherBurst(true), 760);
        return () => clearTimeout(timer);
    }, [isFinisherActive, finisherCutinCard?.id]);

    // Dual Protagonist States
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
    const [isComboing, setIsComboing] = useState(false);
    const [synthesizedCard, setSynthesizedCard] = useState<ICard | null>(null);

    // Check if dual mode is active
    const isDualMode = !!player.partner && player.partner.currentHp > 0;

    // Get latest 2 logs
    const latestLogs = [...combatLog].reverse().slice(0, 2);

    useEffect(() => {
        if (lastActionTime > 0) {
            setIsActing(true);
            const timer = setTimeout(() => {
                setIsActing(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [lastActionTime]);

    // Reset local selection when turn ends or player state changes drastically
    useEffect(() => {
        if (actingEnemyId) {
            setSelectedCardIds([]);
            setSynthesizedCard(null);
        }
    }, [actingEnemyId]);

    // Auto-scroll log
    useEffect(() => {
        if (showLog && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [combatLog, showLog]);

    useEffect(() => {
        const currentHandIds = player.hand.map(card => card.id);
        const previousHandIds = prevHandIdsRef.current;
        const newlyAddedIds = currentHandIds.filter(id => !previousHandIds.includes(id));
        const DRAW_ENTRY_STAGGER_MS = 130;
        const DRAW_ENTRY_DURATION_MS = 720;

        if (newlyAddedIds.length > 0) {
            setDrawEntryAnimations((prev) => {
                const retained = prev.filter(entry => currentHandIds.includes(entry.cardId) && !newlyAddedIds.includes(entry.cardId));
                const additions = newlyAddedIds.map((cardId, index) => ({
                    cardId,
                    delayMs: index * DRAW_ENTRY_STAGGER_MS
                }));
                return [...retained, ...additions];
            });

            newlyAddedIds.forEach((cardId, index) => {
                const timeoutId = window.setTimeout(() => {
                    setDrawEntryAnimations(prev => prev.filter(entry => entry.cardId !== cardId));
                    drawEntryTimeoutsRef.current = drawEntryTimeoutsRef.current.filter(id => id !== timeoutId);
                }, index * DRAW_ENTRY_STAGGER_MS + DRAW_ENTRY_DURATION_MS);
                drawEntryTimeoutsRef.current.push(timeoutId);
            });
        } else {
            setDrawEntryAnimations((prev) => prev.filter(entry => currentHandIds.includes(entry.cardId)));
        }

        prevHandIdsRef.current = currentHandIds;
    }, [player.hand]);

    useEffect(() => {
        return () => {
            drawEntryTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
            drawEntryTimeoutsRef.current = [];
        };
    }, []);

    const drawEntryAnimationMap = useMemo(
        () => new Map(drawEntryAnimations.map(entry => [entry.cardId, entry.delayMs])),
        [drawEntryAnimations]
    );

    const getActionClass = () => {
        if (!isActing) return '';
        switch (lastActionType) {
            case CardType.ATTACK: return '-translate-y-12 scale-105 z-30';
            case CardType.SKILL: return '-translate-x-2 scale-95 brightness-150 sepia-0';
            case CardType.POWER: return 'scale-110 -translate-y-2 brightness-125 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]';
            default: return '';
        }
    };

    const getEnemyActionClass = (enemy: Enemy) => {
        if (actingEnemyId !== enemy.id) return '';
        if (enemy.nextIntent.type === 'ATTACK' || enemy.nextIntent.type === 'ATTACK_DEBUFF' || enemy.nextIntent.type === 'ATTACK_DEFEND') {
            return 'translate-y-16 z-50';
        } else if (enemy.nextIntent.type === 'DEFEND') {
            return 'scale-90 brightness-150';
        } else {
            return 'scale-125 -translate-y-4 brightness-125';
        }
    };

    const showInfo = (title: string, desc: string) => {
        setTooltip({ title, msg: desc });
    };

    const getIntentHoverText = (enemy: Enemy): string => {
        const intent = enemy.nextIntent;
        switch (intent.type) {
            case EnemyIntentType.ATTACK:
                return `通常攻撃: ${intent.value}ダメージ`;
            case EnemyIntentType.DEFEND:
                return `防御: ブロック${intent.value}`;
            case EnemyIntentType.ATTACK_DEFEND:
                return `攻撃しつつ防御: ${intent.value}ダメージ / ブロック${intent.secondaryValue ?? intent.value}`;
            case EnemyIntentType.ATTACK_DEBUFF: {
                const debuffLabelMap: Record<string, string> = {
                    WEAK: 'へろへろ',
                    VULNERABLE: 'びくびく',
                    POISON: '粘液(状態異常カード)',
                    CONFUSED: '混乱'
                };
                const debuffLabel = intent.debuffType ? (debuffLabelMap[intent.debuffType] ?? intent.debuffType) : 'デバフ';
                return `特殊攻撃: ${intent.value}ダメージ + ${debuffLabel}${intent.secondaryValue ? ` ${intent.secondaryValue}` : ''}`;
            }
            case EnemyIntentType.PIERCE_ATTACK:
                return `特殊攻撃: 防御貫通で${intent.value}ダメージ`;
            case EnemyIntentType.BUFF:
                return `強化行動: ムキムキ+${intent.secondaryValue || 2}`;
            case EnemyIntentType.DEBUFF:
                return `妨害行動: ${intent.debuffType || 'デバフ'}${intent.secondaryValue ? ` ${intent.secondaryValue}` : ''}`;
            case EnemyIntentType.SLEEP:
                return '睡眠中: 何もしない';
            default:
                return '次の行動は不明';
        }
    };

    const getProcessedDescription = (card: ICard) => {
        // 数値置換の前に、まず文章全体をtransにかける
        let desc = trans(card.description, languageMode);

        // 動的数値の再適用（trans内でもある程度処理するが、確実を期す）
        if (card.damage !== undefined) desc = desc.replace(/(\d+)ダメージ/g, `${card.damage}${trans("ダメージ", languageMode)}`);
        if (card.block !== undefined) desc = desc.replace(/ブロック(\d+)/g, `${trans("ブロック", languageMode)}${card.block}`);
        if (card.poison !== undefined) desc = desc.replace(/ドクドク(\d+)/g, `${trans("ドクドク", languageMode)}${card.poison}`);
        if (card.weak !== undefined) desc = desc.replace(/へろへろ(\d+)/g, `${trans("へろへろ", languageMode)}${card.weak}`);
        if (card.vulnerable !== undefined) desc = desc.replace(/びくびく(\d+)/g, `${trans("びくびく", languageMode)}${card.vulnerable}`);
        if (card.strength !== undefined) desc = desc.replace(/ムキムキ(\d+)/g, `${trans("ムキムキ", languageMode)}${card.strength}`);

        return (
            <span className={card.upgraded ? "text-green-300 font-bold" : ""}>
                {desc}
            </span>
        );
    };

    const getCardKeywords = (card: ICard) => {
        const keywords = [];
        if (card.exhaust) keywords.push(KEYWORD_DEFINITIONS.EXHAUST);
        if (card.strength || card.description.includes('ムキムキ')) keywords.push(KEYWORD_DEFINITIONS.STRENGTH);
        if (card.vulnerable || card.description.includes('びくびく')) keywords.push(KEYWORD_DEFINITIONS.VULNERABLE);
        if (card.weak || card.description.includes('へろへろ')) keywords.push(KEYWORD_DEFINITIONS.WEAK);
        if (card.block || card.description.includes('ブロック')) keywords.push(KEYWORD_DEFINITIONS.BLOCK);
        if (card.draw || card.description.includes('引く')) keywords.push(KEYWORD_DEFINITIONS.DRAW);
        return keywords;
    };

    const findRelic = (relicId: string) => player.relics.find(r => r.id === relicId);
    const hasChoker = !!findRelic('VELVET_CHOKER');

    const hasNormality = player.hand.some(c => c.name === '退屈' || c.name === 'NORMALITY');
    const normalityRestricted = hasNormality && player.cardsPlayedThisTurn >= 3;

    const sortedDeck = [...player.deck].sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.name.localeCompare(b.name);
    });

    const getRelicCounter = (relicId: string) => {
        if (relicId === 'KUNAI' || relicId === 'SHURIKEN' || relicId === 'ORNAMENTAL_FAN') {
            return player.relicCounters['ATTACK_COUNT'];
        }
        return player.relicCounters[relicId];
    };

    const displayedRelics = [...player.relics].sort((a, b) => {
        const countA = getRelicCounter(a.id) || 0;
        const countB = getRelicCounter(b.id) || 0;
        if (countA > 0 && countB <= 0) return -1;
        if (countA <= 0 && countB > 0) return 1;
        return 0;
    });

    const handleCardClickDual = (card: ICard, disabled: boolean) => {
        if (disabled) {
            if (isDualMode && (hasChoker || normalityRestricted)) audioService.playSound('wrong');
            return;
        }

        if (selectionState.active) {
            onHandSelection(card);
            return;
        }

        if (selectedCardIds.includes(card.id)) {
            setSelectedCardIds(prev => prev.filter(id => id !== card.id));
            audioService.playSound('select');
        } else {
            if (selectedCardIds.length < 2) {
                setSelectedCardIds(prev => [...prev, card.id]);
                audioService.playSound('select');
            }
        }
    };

    const executeDualTurn = async () => {
        if (selectedCardIds.length === 0) return;

        if (selectedCardIds.length === 1) {
            const c1 = player.hand.find(c => c.id === selectedCardIds[0]);
            if (c1) {
                if (player.currentEnergy < c1.cost) {
                    audioService.playSound('wrong');
                    return;
                }
                onPlayCard(c1);
                setSelectedCardIds([]);
            }
            return;
        }

        const c1 = player.hand.find(c => c.id === selectedCardIds[0]);
        const c2 = player.hand.find(c => c.id === selectedCardIds[1]);

        if (!c1 || !c2) return;

        const isCombo = c1.type === c2.type;
        const comboCost = Math.max(c1.cost, c2.cost);
        const totalCost = c1.cost + c2.cost;
        const requiredCost = isCombo ? comboCost : totalCost;

        if (player.currentEnergy < requiredCost) {
            audioService.playSound('wrong');
            return;
        }

        if (isCombo) {
            setIsComboing(true);
            const fused = synthesizeCards(c1, c2);
            setSynthesizedCard(fused);
            audioService.playSound('buff');

            await new Promise(r => setTimeout(r, 1000));
            const comboPayload = { ...fused, _consumedIds: [c1.id, c2.id] };
            onPlaySynthesizedCard(comboPayload);

        } else {
            onPlayCard(c1);
            await new Promise(r => setTimeout(r, 500));
            onPlayCard(c2);
        }

        setSelectedCardIds([]);
        setIsComboing(false);
        setSynthesizedCard(null);
    };

    const onInspect = (card: ICard) => {
        setInspectedCard(card);
        audioService.playSound('select');
    };

    return (
        <div className={`battle-scene-root flex flex-col h-full w-full bg-gray-900 text-white relative overflow-hidden ${isShaking ? 'animate-screen-shake' : ''}`}>
            {finisherCutinCard && (
                <BattleFinisherCutinOverlay card={finisherCutinCard} languageMode={languageMode} />
            )}

            {/* --- BATTLE TUTORIAL OVERLAY --- */}
            {tutorialStep !== null && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="relative w-full h-full max-w-4xl max-h-[600px] flex flex-col pointer-events-none">

                        {/* Step 1: HP & Block */}
                        {tutorialStep === 1 && (
                            <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-full max-w-xl bg-slate-800 border-2 border-green-500 p-4 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-in zoom-in-95 pointer-events-auto">
                                <div className="flex items-center gap-2 text-green-400 font-bold mb-2">
                                    <Heart size={20} className="fill-current" /> じぶんの ステータス
                                </div>
                                <p className="text-white text-sm leading-relaxed mb-4 text-center">
                                    <span className="text-red-400 font-bold">HP</span>が 0になると まけてしまいます。<br />
                                    <span className="text-blue-400 font-bold">ブロック</span>を つかえば、てきの こうげきを ふせげます！<br />
                                    <span className="text-blue-400 font-bold">ブロック</span>は ターンがおわると 0になります。
                                </p>
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] text-gray-400">Step 1/5</div>
                                    <button onClick={nextTutorialStep} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded font-bold text-sm flex items-center gap-1">つぎへ <ArrowRight size={14} /></button>
                                </div>
                                <div className="absolute -bottom-4 left-20 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-green-500"></div>
                            </div>
                        )}

                        {/* Step 2: Enemy Intent */}
                        {tutorialStep === 2 && (
                            <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-full max-w-xl bg-slate-800 border-2 border-red-500 p-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-in zoom-in-95 pointer-events-auto">
                                <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                                    <Skull size={20} className="fill-current" /> てきの こうどう
                                </div>
                                <p className="text-white text-sm leading-relaxed mb-4 text-center">
                                    てきの あたまのうえに マークが でます。<br />
                                    <span className="text-red-400 font-bold">ドクロ</span>は こうげき、<span className="text-blue-400 font-bold">たて</span>は ぼうぎょの しるしです。
                                </p>
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] text-gray-400">Step 2/5</div>
                                    <button onClick={nextTutorialStep} className="bg-red-600 hover:bg-red-500 text-white px-4 py-1 rounded font-bold text-sm flex items-center gap-1">なるほど <ArrowRight size={14} /></button>
                                </div>
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-red-500"></div>
                            </div>
                        )}

                        {/* Step 3: Energy & Deck */}
                        {tutorialStep === 3 && (
                            <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-full max-w-xl bg-slate-800 border-2 border-yellow-500 p-4 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-in zoom-in-95 pointer-events-auto">
                                <div className="flex items-center gap-2 text-yellow-400 font-bold mb-2">
                                    <Zap size={20} className="fill-current" /> エナジーと カード
                                </div>
                                <p className="text-white text-sm leading-relaxed mb-4 text-center">
                                    カードを つかうには <span className="text-yellow-400 font-bold">エナジー</span>が ひつようです。<br />
                                    やまふだが なくなると、すてふだが シャッフルされて もどってきます。
                                </p>
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] text-gray-400">Step 3/5</div>
                                    <button onClick={nextTutorialStep} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-1 rounded font-bold text-sm flex items-center gap-1">つぎへ <ArrowRight size={14} /></button>
                                </div>
                                <div className="absolute -bottom-4 left-12 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-yellow-500"></div>
                            </div>
                        )}

                        {/* Step 4: Card Play */}
                        {tutorialStep === 4 && (
                            <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-full max-w-xl bg-slate-800 border-2 border-blue-500 p-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-in zoom-in-95 pointer-events-auto">
                                <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
                                    <MousePointer2 size={20} className="fill-current" /> カードを つかおう
                                </div>
                                <p className="text-white text-sm leading-relaxed mb-4 text-center">
                                    てふだを タップすると カードを つかえます。<br />
                                    ながおしで、カードの くわしい せつめいを よめるよ！
                                </p>
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] text-gray-400">Step 4/5</div>
                                    <button onClick={nextTutorialStep} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded font-bold text-sm flex items-center gap-1">わかった <ArrowRight size={14} /></button>
                                </div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-blue-500"></div>
                            </div>
                        )}

                        {/* Step 5: End Turn */}
                        {tutorialStep === 5 && (
                            <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-full max-w-xl bg-slate-800 border-2 border-red-400 p-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-in zoom-in-95 pointer-events-auto">
                                <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                                    <ChevronsRight size={20} /> ターンを おわらせる
                                </div>
                                <p className="text-white text-sm leading-relaxed mb-4 text-center">
                                    エナジーを つかいきったら、<span className="text-red-400 font-bold">ターンしゅうりょう</span> ボタンを おしましょう。<br />
                                    さあ、ぼうけんを はじめよう！
                                </p>
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] text-gray-400">Final Step</div>
                                    <button onClick={closeTutorial} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold text-sm animate-pulse">ぼうけんを はじめる！</button>
                                </div>
                                <div className="absolute -bottom-4 right-8 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-red-400"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 1. Top Bar: Narrative & Logs */}
            <div className="shrink-0 bg-black border-b-2 border-gray-700 p-2 z-30 relative min-h-[4rem] flex flex-col justify-center shadow-md">
                <div className="flex flex-col w-full pr-24 overflow-hidden">
                    <div className="text-xs text-green-400 truncate leading-snug mb-0.5 font-bold shadow-black drop-shadow-md">
                        <span className="animate-pulse mr-2">&gt;&gt;</span> {trans(narrative, languageMode)}
                    </div>
                    {latestLogs.length > 0 ? (
                        <>
                            <div className="text-[10px] text-gray-200 truncate leading-snug">
                                {trans(latestLogs[0], languageMode)}
                            </div>
                            {latestLogs.length > 1 && (
                                <div className="text-[10px] text-gray-500 truncate leading-snug">
                                    {trans(latestLogs[1], languageMode)}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-[10px] text-gray-600 italic leading-snug">...</div>
                    )}
                </div>

                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    <div className="text-yellow-400 text-[10px] font-bold bg-gray-900/80 px-2 py-0.5 rounded border border-yellow-700 shadow-sm">
                        {trans(turnLog, languageMode)}
                    </div>
                    {coopTurnQueue.length > 0 && (
                        <div className="max-w-[46vw] sm:max-w-[52vw] rounded border border-emerald-500/40 bg-gray-950/85 px-1.5 py-1 sm:px-2 sm:py-1 shadow-sm">
                            <div className="mb-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.2em] text-emerald-200">Coop Order</div>
                            <div className="flex flex-wrap justify-end gap-0.5 sm:gap-1">
                                {coopTurnQueue.map((slot) => (
                                    <div
                                        key={slot.id}
                                        className={`flex items-center gap-0.5 sm:gap-1 rounded border px-1 py-0.5 sm:px-1.5 text-[8px] sm:text-[9px] font-bold ${
                                            slot.type === 'SELF'
                                                ? 'border-yellow-400 bg-yellow-900/50 text-yellow-100'
                                                : slot.type === 'ALLY'
                                                    ? 'border-emerald-400 bg-emerald-900/40 text-emerald-100'
                                                    : 'border-red-400 bg-red-950/40 text-red-100'
                                        }`}
                                    >
                                        {slot.type === 'SELF' ? <Zap size={9} /> : slot.type === 'ALLY' ? <Users size={9} /> : <Skull size={9} />}
                                        <span className="max-w-[56px] sm:max-w-[96px] truncate">{slot.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        {onOpenSettings && (
                            <button
                                onClick={onOpenSettings}
                                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition-colors bg-black/50 border-gray-600 text-gray-400 hover:text-white hover:border-gray-400"
                                title="セッティング"
                            >
                                <Settings size={10} /> SET
                            </button>
                        )}
                        <button
                            onClick={() => setShowLog(!showLog)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${showLog ? 'bg-gray-700 border-gray-500 text-white' : 'bg-black/50 border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'}`}
                        >
                            <FileText size={10} /> LOG
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Battle Viewport */}
            <div className="battle-view flex-1 min-h-0 relative overflow-y-auto custom-scrollbar flex flex-col justify-between p-2 bg-gray-800/50 gap-4">

                {/* Parry UI Overlay (Bard Special) */}
                {parryState?.active && !parryState.success && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none translate-y-32">
                        <button
                            onClick={(e) => { e.stopPropagation(); onParry(); }}
                            className="bg-black/80 border-4 border-cyan-400 p-6 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.6)] animate-bounce pointer-events-auto group transition-transform active:scale-90"
                        >
                            <div className="flex flex-col items-center">
                                <Mic size={48} className="text-cyan-400 mb-2 group-hover:scale-110" />
                                <span className="text-white font-black text-xl tracking-widest">
                                    {trans("インタビューではねかえせ！", languageMode)}
                                </span>
                                <div className="mt-2 w-16 h-1 bg-cyan-900 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-cyan-400 animate-shrink-width"
                                        style={{ animation: 'shrink 300ms linear forwards' }}
                                    />
                                </div>
                            </div>
                        </button>
                        <style>{`
                    @keyframes shrink {
                        from { width: 100%; }
                        to { width: 0%; }
                    }
                `}</style>
                    </div>
                )}

                {/* Codex Selection Modal */}
                {codexOptions && (
                    <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
                        <h3 className="text-2xl font-bold text-yellow-400 mb-4 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">秘密の攻略本</h3>
                        <p className="text-gray-300 mb-6 text-sm">手札に加えるカードを1枚選んでください</p>
                        <div className="flex flex-wrap justify-center gap-4 mb-8">
                            {codexOptions.map((card) => (
                                <div key={card.id} className="scale-100 hover:scale-105 transition-transform cursor-pointer" onClick={() => onCodexSelect(card)}>
                                    <Card card={card} onClick={() => onCodexSelect(card)} disabled={false} languageMode={languageMode} onInspect={onInspect} />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => onCodexSelect(null)}
                            className="bg-gray-600 hover:bg-green-500 text-white px-8 py-2 rounded font-bold border border-gray-400"
                        >
                            スキップ
                        </button>
                    </div>
                )}

                {/* Combat Log Overlay */}
                {showLog && (
                    <div
                        ref={logContainerRef}
                        className="absolute top-2 right-2 z-[45] w-64 max-h-48 bg-black/80 border border-gray-600 rounded p-2 text-xs text-gray-300 font-mono overflow-y-auto custom-scrollbar shadow-xl backdrop-blur-sm pointer-events-auto overscroll-contain"
                    >
                        <div className="text-center text-gray-500 border-b border-gray-700 pb-1 mb-1 font-bold sticky top-0 bg-black/90 w-full">Battle Log</div>
                        {combatLog.length === 0 ? (
                            <div className="text-center italic opacity-50">No actions yet</div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {combatLog.map((log, i) => (
                                    <div key={i} className="border-b border-gray-800 pb-0.5 last:border-0 leading-tight break-words">
                                        {trans(log, languageMode)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Combo Animation Overlay */}
                {isComboing && synthesizedCard && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/90 border-4 border-yellow-400 p-8 rounded-xl shadow-[0_0_50px_rgba(250,204,21,0.5)] animate-in zoom-in duration-300 flex flex-col items-center">
                            <Sparkles className="text-yellow-400 mb-4 animate-spin" size={48} />
                            <h2 className="text-3xl font-black text-yellow-100 mb-6 tracking-widest text-shadow-lg">友情コンボ！</h2>
                            <div className="scale-125">
                                <Card card={synthesizedCard} onClick={() => { }} disabled={false} languageMode={languageMode} onInspect={onInspect} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Selection Overlay */}
                {selectionState.active && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 z-40 text-center py-2 px-6 border-b-2 border-yellow-500 animate-pulse rounded shadow-xl pointer-events-auto flex flex-col items-center gap-2">
                        <span className="text-yellow-400 font-bold text-sm">
                            {selectionState.type === 'DISCARD' && `${trans("捨てる", languageMode)} (${selectionState.amount})`}
                            {selectionState.type === 'COPY' && `コピー (${selectionState.amount})`}
                            {selectionState.type === 'EXHAUST' && `${trans("廃棄", languageMode)} (${selectionState.amount})`}
                        </span>
                        <button
                            onClick={onCancelSelection}
                            className="bg-red-900/80 hover:bg-red-700 text-white text-[10px] px-3 py-1 rounded border border-red-500 flex items-center gap-1 transition-colors"
                        >
                            <RotateCcw size={10} /> {trans("やめる", languageMode)}
                        </button>
                    </div>
                )}

                {/* Card Inspection Modal */}
                {inspectedCard && (
                    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => { setInspectedCard(null); setFullscreenArtCard(null); }}>
                        <div
                            className="scale-125 md:scale-[1.85] mb-10 transform transition-transform cursor-zoom-in"
                            onClick={(e) => {
                                e.stopPropagation();
                                setFullscreenArtCard(inspectedCard);
                            }}
                            title={trans("タッチでイラスト拡大", languageMode)}
                        >
                            <Card card={inspectedCard} onClick={() => { }} disabled={false} languageMode={languageMode} />
                        </div>
                        <div className="bg-gray-800 border-2 border-white p-4 md:p-6 rounded-lg max-w-sm w-full shadow-2xl relative max-h-[50vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setInspectedCard(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white p-2">
                                <X size={24} />
                            </button>
                            <h3 className="text-2xl font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-2">{trans(inspectedCard.name, languageMode)}</h3>
                            <div className="flex gap-2 mb-4 text-xs text-gray-400 font-mono">
                                <span className="bg-blue-900/50 px-2 py-1 rounded border border-blue-500/30">{trans("コスト", languageMode)}: {inspectedCard.cost}</span>
                                <span className="bg-purple-900/50 px-2 py-1 rounded border border-purple-500/30">{trans(inspectedCard.type, languageMode)}</span>
                            </div>
                            <p className="text-lg text-white mb-6 leading-relaxed whitespace-pre-wrap font-bold bg-black/30 p-3 rounded">
                                {getProcessedDescription(inspectedCard)}
                            </p>

                            <div className="space-y-2">
                                {getCardKeywords(inspectedCard).map((k, idx) => (
                                    <div key={idx} className="flex flex-col text-left text-sm bg-gray-700/50 p-2 rounded border border-gray-600">
                                        <span className="font-bold text-yellow-300 mb-0.5">{trans(k.title, languageMode)}</span>
                                        <span className="text-gray-300 text-xs">{trans(k.desc, languageMode)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {fullscreenArtCard && (
                    <FullscreenCardArtModal
                        card={fullscreenArtCard}
                        languageMode={languageMode}
                        onClose={() => setFullscreenArtCard(null)}
                    />
                )}

                {/* Relic List Modal */}
                {showRelicList && (
                    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowRelicList(false)}>
                        <div className="bg-gray-800 border-2 border-white rounded-lg p-4 w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
                                <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                                    <Gem className="mr-2" /> {trans("所持レリック一覧", languageMode)} ({player.relics.length})
                                </h3>
                                <button onClick={() => setShowRelicList(false)} className="text-gray-400 hover:text-white p-1">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="overflow-y-auto custom-scrollbar flex-grow space-y-2 pr-1">
                                {player.relics.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">レリックを持っていません</div>
                                ) : (
                                    player.relics.map(r => {
                                        const counter = getRelicCounter(r.id);
                                        return (
                                            <div key={r.id} className="bg-black/40 p-3 rounded border border-gray-600 flex items-start gap-3">
                                                <div className="bg-gray-700 p-2 rounded-full border border-yellow-600 shrink-0 relative">
                                                    <Gem size={20} className="text-yellow-400" />
                                                    {counter !== undefined && counter > 0 && (
                                                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border border-white shadow-md">
                                                            {counter}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-yellow-100 text-sm mb-1">{trans(r.name, languageMode)}</div>
                                                    <div className="text-xs text-gray-400 leading-tight">{trans(r.description, languageMode)}</div>
                                                    {counter !== undefined && counter > 0 && (
                                                        <div className="text-[10px] text-blue-300 mt-1">
                                                            Counter: {counter}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <button
                                onClick={() => setShowRelicList(false)}
                                className="mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm font-bold border border-gray-500"
                            >
                                {trans("閉じる", languageMode)}
                            </button>
                        </div>
                    </div>
                )}

                {/* Tooltip Modal Overlay */}
                {tooltip && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setTooltip(null)}>
                        <div className="bg-black border-2 border-white p-4 rounded max-w-xs shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                            <h3 className="text-yellow-400 font-bold mb-2 text-lg border-b border-gray-600 pb-1">{trans(tooltip.title, languageMode)}</h3>
                            <p className="text-white text-sm whitespace-pre-wrap">{trans(tooltip.msg, languageMode)}</p>
                            <button onClick={() => setTooltip(null)} className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded">{trans("閉じる", languageMode)}</button>
                        </div>
                    </div>
                )}

                {/* Potion Confirmation Modal */}
                {potionConfirmation && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setPotionConfirmation(null)}>
                        <div className="bg-gray-900 border-2 border-white p-6 rounded shadow-2xl max-xs w-full text-center animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                            <div className="mb-4 flex justify-center">
                                <div className="w-16 h-16 bg-gray-800 rounded-full border-2 border-white flex items-center justify-center">
                                    <FlaskConical size={32} style={{ color: potionConfirmation.color }} />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{trans(potionConfirmation.name, languageMode)}</h3>
                            <p className="text-gray-300 mb-6 text-sm whitespace-pre-wrap">{trans(potionConfirmation.description, languageMode)}</p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => { onUsePotion(potionConfirmation); setPotionConfirmation(null); }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold border border-white transition-colors"
                                >
                                    {trans("決定", languageMode)}
                                </button>
                                <button
                                    onClick={() => setPotionConfirmation(null)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded border border-gray-500 transition-colors"
                                >
                                    {trans("やめる", languageMode)}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enemies + Player Area */}
                <div className={isTrueBossPhase2Active ? "battle-actors relative min-h-[220px] md:min-h-[320px] pt-2 md:pt-4" : "battle-actors flex flex-col flex-1 min-h-0"}>

                {/* Enemies Area */}
                <div className={isTrueBossPhase2Active ? `battle-enemies-area absolute right-2 md:left-1/2 md:-translate-x-1/2 bottom-0 flex justify-end md:justify-center items-end gap-2 min-h-0 shrink-0 ${isFinisherActive ? 'z-[280]' : 'z-10'}` : `battle-enemies-area flex justify-center items-start pt-8 md:pt-14 gap-2 min-h-[180px] shrink-0 ${isFinisherActive ? 'z-[280]' : ''}`}>
                    {visualEnemies.map((enemy) => {
                        const enemyHpPercent = (enemy.currentHp / enemy.maxHp) * 100;
                        const isSelected = !isFinisherActive && selectedEnemyId === enemy.id;
                        const actionClass = getEnemyActionClass(enemy);
                        const enemyName = trans(enemy.name, languageMode);
                        const enemyNameNeedsScroll = enemyName.length > 5;
                        const isTrueBossPhase2 = enemy.enemyType === 'THE_HEART' && enemy.phase === 2;
                        const enemySvgAliases = isTrueBossPhase2
                            ? ['THE_HEART_PHASE2', '真ボス2形態目', '真ボス_2', '真ボス第二形態', `${enemy.enemyType}_2`]
                            : [];

                        return (
                            <div
                                key={enemy.id}
                                onClick={() => {
                                    if (!isFinisherActive && coopCanAct) onSelectEnemy(enemy.id);
                                }}
                                className={`flex flex-col items-center z-10 transition-all duration-200 cursor-pointer relative ${isSelected && !actionClass ? 'scale-105 z-20' : ''} ${!isSelected && !actionClass ? 'hover:scale-105' : ''} ${actionClass} ${isTrueBossPhase2 ? 'sinister-aura' : ''} ${tutorialStep === 2 ? 'ring-4 ring-red-500 ring-offset-4 ring-offset-transparent animate-pulse rounded-lg' : ''} ${isFinisherActive ? '!z-[300]' : ''}`}
                            >
                                {isTrueBossPhase2 && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-900/20 blur-3xl rounded-full void-backglow pointer-events-none z-0"></div>
                                )}

                                {!isFinisherActive && (
                                    <div
                                        className={`battle-enemy-intent absolute ${isTrueBossPhase2 ? '-top-1 md:-top-6' : '-top-6'} left-1/2 -translate-x-1/2 z-30 transition-all duration-300 text-xs font-extrabold px-1.5 py-0.5 rounded border-2 animate-bounce whitespace-nowrap shadow-xl flex items-center justify-center min-w-[40px] ${hideEnemyIntents ? 'bg-slate-900 text-slate-100 border-slate-500' : enemy.nextIntent.type === 'PIERCE_ATTACK' ? 'bg-red-800 text-white border-yellow-400 scale-125 ring-2 ring-red-400 shadow-red-900/50' : 'bg-white text-black border-red-600'}`}
                                        onClick={(e) => { e.stopPropagation(); showInfo(trans("敵", languageMode), trans("敵の次の行動です。", languageMode)); }}
                                        title={hideEnemyIntents ? "???" : trans(getIntentHoverText(enemy), languageMode)}
                                    >
                                        {hideEnemyIntents ? (
                                            <span className="tracking-[0.25em]">???</span>
                                        ) : (
                                            <>
                                                {(enemy.nextIntent.type === 'ATTACK' || enemy.nextIntent.type === 'ATTACK_DEBUFF' || enemy.nextIntent.type === 'ATTACK_DEFEND' || enemy.nextIntent.type === 'PIERCE_ATTACK') && (
                                                    <>
                                                        {enemy.nextIntent.type === 'PIERCE_ATTACK' ? (
                                                            <div className="relative flex items-center justify-center mr-1.5">
                                                                <Triangle size={18} className="text-yellow-400 fill-yellow-400" />
                                                                <span className="absolute text-[10px] font-black text-red-900 top-[3px]">!</span>
                                                            </div>
                                                        ) : (
                                                            <Skull size={12} className="mr-1 text-red-600" />
                                                        )}
                                                        <span className="inline-flex items-center">
                                                            {enemy.nextIntent.value}
                                                        </span>
                                                        {enemy.nextIntent.type === 'ATTACK_DEFEND' && (
                                                            <span className="inline-flex items-center ml-1.5 text-blue-600">
                                                                <Shield size={11} className="mr-0.5" />
                                                                {enemy.nextIntent.secondaryValue ?? enemy.nextIntent.value}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                                {enemy.nextIntent.type === 'DEFEND' && (
                                                    <><Shield size={12} className="mr-1 text-blue-600" /> {enemy.nextIntent.value}</>
                                                )}
                                                {(enemy.nextIntent.type === 'BUFF' || enemy.nextIntent.type === 'DEBUFF' || enemy.nextIntent.type === 'SLEEP') && (
                                                    <><Zap size={12} className="mr-1 text-yellow-500 fill-yellow-500" /> !</>
                                                )}
                                                {enemy.nextIntent.type === 'UNKNOWN' && <span className="text-gray-600">?</span>}
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className={`battle-enemy-sprite relative mb-1 transition-all duration-700 ${isTrueBossPhase2 ? ENEMY_ILLUSTRATION_SIZE_CLASS.battleTrueBossPhase2 : ENEMY_ILLUSTRATION_SIZE_CLASS.battleNormal}`}>
                                    {isFinisherActive ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            {!finisherBurst && (
                                                <div className="w-full h-full animate-finisher-enemy-focus">
                                                    <EnemyIllustration
                                                        name={enemy.name}
                                                        seed={`${enemy.id}-finisher-main`}
                                                        aliases={enemySvgAliases}
                                                        className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] rotate-[6deg] scale-110"
                                                        size={24}
                                                    />
                                                </div>
                                            )}
                                            {finisherBurst && (
                                                <>
                                                    {[
                                                        { tx: '-110px', ty: '-85px', rot: -42 },
                                                        { tx: '110px', ty: '-85px', rot: 42 },
                                                        { tx: '-130px', ty: '5px', rot: -28 },
                                                        { tx: '130px', ty: '5px', rot: 28 },
                                                        { tx: '-80px', ty: '105px', rot: -33 },
                                                        { tx: '80px', ty: '105px', rot: 33 },
                                                    ].map((v, idx) => (
                                                        <div
                                                            key={`enemy-shatter-${enemy.id}-${idx}`}
                                                            className="absolute w-[42%] h-[42%] animate-finisher-enemy-shatter"
                                                            style={
                                                                {
                                                                    '--tx': v.tx,
                                                                    '--ty': v.ty,
                                                                    '--rot': `${v.rot}deg`,
                                                                    animationDelay: `${idx * 22}ms`
                                                                } as React.CSSProperties
                                                            }
                                                        >
                                                            <EnemyIllustration
                                                                name={enemy.name}
                                                                seed={`${enemy.id}-finisher-piece-${idx}`}
                                                                aliases={enemySvgAliases}
                                                                className="w-full h-full"
                                                                size={16}
                                                            />
                                                        </div>
                                                    ))}
                                                    <div className="absolute w-16 h-16 md:w-24 md:h-24 rounded-full bg-orange-500/90 shadow-[0_0_60px_rgba(249,115,22,0.95)] animate-finisher-enemy-explosion"></div>
                                                    <div className="absolute w-24 h-24 md:w-36 md:h-36 rounded-full border-4 border-yellow-200/90 animate-finisher-enemy-shockwave"></div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <EnemyIllustration name={enemy.name} seed={enemy.id} aliases={enemySvgAliases} className="w-full h-full drop-shadow-lg relative z-10" />
                                    )}
                                    {!isFinisherActive && <FloatingTextOverlay data={enemy.floatingText} languageMode={languageMode} />}
                                    {!isFinisherActive && <VFXOverlay effects={activeEffects} targetId={enemy.id} />}
                                </div>

                                {!isFinisherActive && (
                                    <div className={`${isTrueBossPhase2 ? 'w-32 md:w-40 scale-110' : 'w-24 md:w-28'} bg-black/90 border-2 px-1 py-0.5 text-white text-[9px] md:text-[10px] transition-all shadow-md rounded relative z-10 ${isSelected ? 'border-yellow-400 ring-1 ring-yellow-400/50' : 'border-gray-600'} ${isTrueBossPhase2 ? 'border-purple-500' : ''}`}>
                                    <div className="flex items-center justify-between mb-0.5 h-4 w-full overflow-hidden">
                                        <div className="flex-1 min-w-0 overflow-hidden relative h-full">
                                            {enemyNameNeedsScroll ? (
                                                <div className="flex w-max animate-marquee-scroll text-red-200 font-bold">
                                                    <span className="pr-4">{enemyName}</span>
                                                    <span className="pr-4">{enemyName}</span>
                                                </div>
                                            ) : (
                                                <div className={`${isTrueBossPhase2 ? 'text-purple-400' : 'text-red-200'} font-bold truncate`}>{enemyName}</div>
                                            )}
                                        </div>
                                        {enemy.block > 0 && <span className="text-blue-300 flex items-center bg-blue-900/80 px-1 rounded text-[8px] font-bold ml-1 shrink-0" onClick={(e) => { e.stopPropagation(); showInfo(trans("ブロック", languageMode), trans("次のターン開始時までダメージを防ぐ。", languageMode)); }}><Shield size={8} className="mr-0.5" /> {enemy.block}</span>}
                                    </div>

                                    <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600 mb-0.5" onClick={(e) => { e.stopPropagation(); showInfo("HP", `現在: ${enemy.currentHp} / 最大: ${enemy.maxHp}`); }}>
                                        <div className={`h-full ${isTrueBossPhase2 ? 'bg-gradient-to-r from-purple-800 to-red-600' : 'bg-gradient-to-r from-red-600 to-red-500'} transition-all duration-500`} style={{ width: `${enemyHpPercent}%` }}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white shadow-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-none">
                                            {enemy.currentHp}/{enemy.maxHp}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-0.5 justify-center min-h-[14px]">
                                        {enemy.vulnerable > 0 && (
                                            <div className="flex items-center bg-pink-900/80 rounded px-0.5 border border-pink-500/50 cursor-pointer" onClick={(e) => { e.stopPropagation(); showInfo(trans("脆弱", languageMode), trans("攻撃から受けるダメージが50%増加。", languageMode)); }}>
                                                <AlertCircle size={8} className="text-pink-300" /> <span className="text-[8px] ml-0.5 font-bold">{enemy.vulnerable}</span>
                                            </div>
                                        )}
                                        {enemy.weak > 0 && (
                                            <div className="flex items-center bg-gray-700/80 rounded px-0.5 border border-gray-500/50 cursor-pointer" onClick={(e) => { e.stopPropagation(); showInfo(trans("弱体", languageMode), trans("攻撃で与えるダメージが25%減少。", languageMode)); }}>
                                                <TrendingDown size={8} className="text-gray-300" /> <span className="text-[8px] ml-0.5 font-bold">{enemy.weak}</span>
                                            </div>
                                        )}
                                        {enemy.poison > 0 && (
                                            <div className="flex items-center bg-green-900/80 rounded px-0.5 border border-green-500/50 cursor-pointer" onClick={(e) => { e.stopPropagation(); showInfo(trans("ドクドク", languageMode), trans("ターン終了時にHPダメージを受け、数値が1減る。", languageMode)); }}>
                                                <Droplets size={8} className="text-green-300" /> <span className="text-[8px] ml-0.5 font-bold">{enemy.poison}</span>
                                            </div>
                                        )}
                                        {enemy.artifact > 0 && (
                                            <div className="flex items-center bg-yellow-900/80 rounded px-0.5 border border-yellow-500/50 cursor-pointer" onClick={(e) => { e.stopPropagation(); showInfo(trans("キラキラ", languageMode), trans("デバフを無効化する。", languageMode)); }}>
                                                <Hexagon size={8} className="text-yellow-200" /> <span className="text-[8px] ml-0.5 font-bold">{enemy.artifact}</span>
                                            </div>
                                        )}
                                    </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Player Area */}
                <div className={isTrueBossPhase2Active ? "battle-player-area relative z-20 flex items-end pl-2 pb-2 shrink-0" : "battle-player-area flex items-end pl-2 pb-2 shrink-0 mt-auto"}>
                    <div className={isTrueBossPhase2Active ? "flex flex-col items-start md:flex-row md:items-end relative max-w-[48vw] md:max-w-none" : "flex items-end relative"}>

                        <div className={`battle-player-sprite order-1 w-20 h-20 md:w-24 md:h-24 relative transition-all duration-150 ease-out ${isTrueBossPhase2Active ? 'mr-0 md:mr-2 mb-1 md:mb-0' : 'mr-2'} ${getActionClass()} ${selectedSupportCard ? 'ring-2 ring-emerald-300 rounded-lg cursor-pointer' : ''}`} onClick={() => {
                            if (selectedSupportCard && onUseCoopSupport) {
                                onUseCoopSupport(selectedSupportCard);
                                setSelectedSupportCard(null);
                                return;
                            }
                            showInfo(trans("自分", languageMode), trans("あなたのキャラクター。\nHPが0になるとゲームオーバー。", languageMode));
                        }}>
                            <img
                                src={player.imageData}
                                alt="Hero"
                                className="w-full h-full pixel-art"
                                style={{ imageRendering: 'pixelated' }}
                            />
                            <FloatingTextOverlay data={player.floatingText} languageMode={languageMode} />
                            {(isCoopBattleView ? selfScopedEffects.length > 0 : shouldRenderPlayerScopedVfxOnSelf) && (
                                <VFXOverlay effects={isCoopBattleView ? selfScopedEffects : activeEffects} targetId={isCoopBattleView && coopSelfPeerId ? coopSelfPeerId : "player"} />
                            )}
                        </div>

                        {player.partner && player.partner.currentHp > 0 && (
                            <div className={`order-3 w-16 h-16 md:w-20 md:h-20 relative transition-all duration-150 ease-out ${isTrueBossPhase2Active ? 'mr-0 md:mr-2 -ml-3 md:-ml-6 mb-1 md:mb-0' : 'mr-2 -ml-6'} z-0 ${getActionClass()}`} onClick={() => showInfo(trans(player.partner!.name, languageMode), trans("パートナー。\n倒れるとデッキが1枚しか使えなくなります。", languageMode))}>
                                <img
                                    src={player.partner.imageData}
                                    alt="Partner"
                                    className="w-full h-full pixel-art grayscale-[0.2]"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                                <FloatingTextOverlay data={player.partner.floatingText} languageMode={languageMode} offset="-top-2 -right-2" />

                                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gray-700 rounded-full border border-gray-500 overflow-hidden">
                                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(player.partner.currentHp / player.partner.maxHp) * 100}%` }}></div>
                                </div>
                            </div>
                        )}

                        {companions.length > 0 && (
                            <div className={`order-3 flex items-end gap-1 md:gap-2 ${player.partner && player.partner.currentHp > 0 ? 'ml-0' : 'ml-1'} mb-2`}>
                                {companions.map((companion) => {
                                    const hpPercent = Math.max(0, Math.min(100, (companion.currentHp / Math.max(1, companion.maxHp)) * 100));
                                    const isDown = companion.currentHp <= 0;
                                    return (
                                        <div
                                            key={companion.id}
                                            className={`w-14 md:w-16 shrink-0 ${selectedSupportCard ? 'cursor-pointer' : ''}`}
                                            onClick={() => {
                                                if (selectedSupportCard && onUseCoopSupport) {
                                                    onUseCoopSupport(selectedSupportCard, companion.id);
                                                    setSelectedSupportCard(null);
                                                    return;
                                                }
                                                showInfo(companion.name, trans("協力モードの同行プレイヤー。HPのみを表示します。", languageMode));
                                            }}
                                        >
                                            <div className={`w-14 h-14 md:w-16 md:h-16 relative rounded-lg border border-white/10 bg-black/35 overflow-hidden ${isDown ? 'grayscale opacity-55' : ''} ${selectedSupportCard ? 'ring-2 ring-emerald-300/80' : ''}`}>
                                                <img
                                                    src={companion.imageData}
                                                    alt={companion.name}
                                                    className="w-full h-full pixel-art"
                                                    style={{ imageRendering: 'pixelated' }}
                                                />
                                                <FloatingTextOverlay data={companion.floatingText} languageMode={languageMode} offset="-top-2 -right-1" />
                                                <VFXOverlay effects={getPlayerScopedEffectsForPeer(companion.id)} targetId={companion.id} />
                                            </div>
                                            <div className="mt-1 h-1.5 bg-gray-700 rounded-full border border-gray-500 overflow-hidden">
                                                <div className={`h-full transition-all duration-500 ${isDown ? 'bg-gray-500' : 'bg-green-500'}`} style={{ width: `${hpPercent}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className={`battle-player-stats order-2 bg-black/80 border-2 border-white p-1 text-white text-xs ${isTrueBossPhase2Active ? 'w-28 md:w-40' : 'w-36 md:w-40'} mb-2 shadow-lg rounded z-20 ${tutorialStep === 1 ? 'ring-4 ring-green-500 ring-offset-4 ring-offset-transparent animate-pulse' : ''}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-red-400 flex items-center font-bold" onClick={() => showInfo("HP", trans("ヒットポイント。0になると死亡する。", languageMode))}><Heart size={12} className="mr-1" /> {player.currentHp}/{player.maxHp}</span>
                                <span className="text-blue-400 flex items-center font-bold" onClick={() => showInfo(trans("ブロック", languageMode), trans("次のターン開始時までダメージを防ぐ。", languageMode))}><Shield size={12} className="mr-1" /> {player.block}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-700 rounded-full border border-gray-500 overflow-hidden mb-1">
                                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${playerHpPercent}%` }}></div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-700 pt-1" onClick={() => setShowRelicList(true)}>
                                <div className="flex -space-x-1 overflow-hidden w-20 cursor-pointer hover:bg-white/10 rounded px-1 transition-colors">
                                    {displayedRelics.slice(0, 5).map(r => {
                                        const counter = getRelicCounter(r.id);
                                        return (
                                            <div key={r.id} className="w-4 h-4 md:w-5 md:h-5 bg-gray-700 rounded-full border border-yellow-600 flex items-center justify-center shrink-0 relative group">
                                                <Gem size={10} className="text-yellow-400" />
                                                {counter !== undefined && counter > 0 && (
                                                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white shadow-md z-10 pointer-events-none scale-125">
                                                        {counter}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {player.relics.length > 5 && (
                                        <div className="w-4 h-4 md:w-5 md:h-5 bg-gray-800 rounded-full border border-gray-500 flex items-center justify-center shrink-0 text-[8px] font-bold text-white z-10">
                                            +{player.relics.length - 5}
                                        </div>
                                    )}
                                    {player.relics.length === 0 && <span className="text-[9px] text-gray-500">No Relics</span>}
                                </div>

                                <div className="flex gap-0.5">
                                    {player.potions.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!actingEnemyId && !selectionState.active && coopCanAct) {
                                                    setPotionConfirmation(p);
                                                }
                                            }}
                                            className="w-4 h-4 md:w-5 md:h-5 bg-gray-800 rounded border border-white flex items-center justify-center cursor-pointer hover:scale-110"
                                        >
                                            <FlaskConical size={10} style={{ color: p.color }} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-0.5 mt-1">
                                {player.strength !== 0 && (
                                    <span
                                        className={`flex items-center ${player.strength > 0 ? 'text-red-400' : 'text-gray-400'} text-[9px] font-bold border border-gray-700 px-1 rounded bg-black cursor-pointer`}
                                        onClick={() => showInfo(trans("筋力", languageMode), trans("攻撃カードのダメージを増加させる。", languageMode))}
                                    >
                                        <Sword size={8} className="mr-0.5" /> {player.strength}
                                    </span>
                                )}
                                {Object.entries(player.powers).map(([key, val]) => {
                                    if ((val as number) <= 0) return null;
                                    const def = POWER_DEFINITIONS[key] || { name: key, desc: "効果不明" };
                                    return (
                                        <span key={key} className="text-yellow-400 text-[8px] border border-yellow-600 px-0.5 rounded bg-black/50 cursor-pointer" onClick={() => showInfo(trans(def.name, languageMode), trans(def.desc, languageMode))}>
                                            {trans(def.name, languageMode)}:{val as number}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
            <style>
                {`
                    @keyframes finisher-enemy-focus {
                        0% { transform: scale(0.7) rotate(-4deg); opacity: 0.2; }
                        35% { transform: scale(1.12) rotate(7deg); opacity: 1; }
                        100% { transform: scale(1.08) rotate(6deg); opacity: 1; }
                    }
                    @keyframes finisher-enemy-shatter {
                        0% { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
                        100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.2); opacity: 0; }
                    }
                    @keyframes finisher-enemy-explosion {
                        0% { transform: scale(0.2); opacity: 1; }
                        70% { transform: scale(2.8); opacity: 0.9; }
                        100% { transform: scale(4.2); opacity: 0; }
                    }
                    @keyframes finisher-enemy-shockwave {
                        0% { transform: scale(0.15); opacity: 1; border-width: 8px; }
                        100% { transform: scale(3.8); opacity: 0; border-width: 1px; }
                    }
                    .animate-finisher-enemy-focus { animation: finisher-enemy-focus 0.62s cubic-bezier(.2,.8,.2,1) forwards; }
                    .animate-finisher-enemy-shatter { animation: finisher-enemy-shatter 0.58s cubic-bezier(.12,.84,.25,1) forwards; }
                    .animate-finisher-enemy-explosion { animation: finisher-enemy-explosion 0.85s ease-out forwards; }
                    .animate-finisher-enemy-shockwave { animation: finisher-enemy-shockwave 0.85s ease-out forwards; }
                `}
            </style>

            {coopSupportCards.length > 0 && onUseCoopSupport && (
                <div className="absolute left-2 bottom-14 md:bottom-16 z-40 w-[min(320px,calc(100vw-16px))] md:w-[min(360px,calc(100vw-24px))]">
                    <div className="bg-slate-950/88 border border-emerald-500/70 rounded-xl shadow-2xl backdrop-blur px-3 py-2 text-white">
                        <button
                            onClick={() => setCoopSupportHudOpen(prev => !prev)}
                            className="w-full flex items-center justify-between text-left"
                        >
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-200">Coop Support</div>
                                <div className="text-sm font-black">支援カード {coopSupportCards.length} 枚</div>
                            </div>
                            <ChevronDown className={`transition-transform ${coopSupportHudOpen ? 'rotate-180' : ''}`} size={16} />
                        </button>
                        {coopSupportHudOpen && (
                            <div className="mt-3 space-y-2 max-h-[36vh] overflow-y-auto custom-scrollbar pr-1">
                                {coopSupportCards.map((supportCard, index) => {
                                    const needsTarget = supportNeedsTarget(supportCard);
                                    const isSelected = selectedSupportCard?.id === supportCard.id;
                                    const canUse = !actingEnemyId && !selectionState.active && coopCanAct;
                                    return (
                                        <div key={`${supportCard.id}-${index}`} className={`rounded-lg border p-3 ${isSelected ? 'border-emerald-300/80 bg-emerald-950/35' : 'border-emerald-500/30 bg-emerald-950/20'}`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="font-black text-emerald-100">{trans(supportCard.name, languageMode)}</div>
                                                    <div className="text-[11px] text-emerald-100/80 leading-relaxed">{trans(supportCard.description, languageMode)}</div>
                                                </div>
                                                <div className="text-[10px] font-bold text-emerald-200">{supportCard.rarity}</div>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {needsTarget ? (
                                                    <button
                                                        onClick={() => {
                                                            if (!canUse) return;
                                                            setSelectedSupportCard(current => current?.id === supportCard.id ? null : supportCard);
                                                        }}
                                                        disabled={!canUse}
                                                        className={`rounded border px-2 py-1 text-[11px] font-bold ${
                                                            canUse
                                                                ? isSelected
                                                                    ? 'border-emerald-200 bg-emerald-600/70 text-white hover:bg-emerald-500/80'
                                                                    : 'border-emerald-300/50 bg-emerald-700/40 text-emerald-50 hover:bg-emerald-600/60'
                                                                : 'border-gray-600 bg-gray-700 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        {isSelected ? '対象を選択中' : '対象を選ぶ'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            if (!canUse) return;
                                                            onUseCoopSupport(supportCard);
                                                        }}
                                                        disabled={!canUse}
                                                        className={`rounded border px-2 py-1 text-[11px] font-bold ${
                                                            canUse
                                                                ? 'border-emerald-300/50 bg-emerald-700/40 text-emerald-50 hover:bg-emerald-600/60'
                                                                : 'border-gray-600 bg-gray-700 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        使う
                                                    </button>
                                                )}
                                                {isSelected && (
                                                    <button
                                                        onClick={() => setSelectedSupportCard(null)}
                                                        className="rounded border border-gray-500 bg-gray-800 px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-gray-700"
                                                    >
                                                        取消
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. Control Bar */}
            <div className="h-12 bg-gray-800 border-t-2 border-white flex items-center justify-between px-2 shrink-0 z-20 shadow-lg">
                <div className="flex items-center">
                    <div className={`bg-black border-2 border-yellow-500 text-yellow-400 px-2 py-0.5 rounded-full flex items-center shadow-lg mr-2 ${tutorialStep === 3 ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-transparent animate-pulse' : ''} ${selfDown ? 'opacity-60' : ''}`} onClick={() => showInfo(trans("エネルギー", languageMode), trans("カードを使用するために必要。ターン毎に回復する。", languageMode))}>
                        <Zap size={14} className="mr-1 fill-yellow-400" />
                        <span className="text-lg font-bold">{player.currentEnergy}/{player.maxEnergy}</span>
                    </div>
                    <div className="text-[9px] text-gray-400 flex flex-col leading-tight">
                        <span onClick={() => setShowDeck(true)} className="cursor-pointer hover:text-white flex items-center"><Layers size={10} className="mr-1" /> {player.drawPile.length}</span>
                        <span className="flex items-center" onClick={() => showInfo(trans("捨て札", languageMode), trans("使用済みカード。山札が切れるとリシャッフルされる。", languageMode))}><X size={10} className="mr-1" /> {player.discardPile.length}</span>
                    </div>
                </div>

                {isDualMode && (
                    <button
                        onClick={executeDualTurn}
                        disabled={!!actingEnemyId || selectionState.active || selectedCardIds.length === 0}
                        className={`
                    bg-indigo-600 border-2 border-indigo-300 px-4 py-1.5 text-xs font-bold shadow-lg transition-all rounded flex items-center gap-1 mx-2
                    ${!actingEnemyId && !selectionState.active && selectedCardIds.length > 0 ? 'hover:bg-indigo-500 animate-pulse cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}
                  `}
                    >
                        <Users size={12} /> {trans("GO!", languageMode)}
                    </button>
                )}

                {!coopCanAct && coopTurnOwnerLabel && (
                    <div className="absolute left-1/2 top-2 -translate-x-1/2 z-30 rounded border border-cyan-400/70 bg-cyan-950/85 px-3 py-1 text-xs font-bold text-cyan-100 shadow-lg">
                        {`${trans("進行中", languageMode)}: ${coopTurnOwnerLabel}`}
                    </div>
                )}
                <button
                    onClick={!actingEnemyId && !selectionState.active && coopCanAct ? onEndTurn : undefined}
                    disabled={!!actingEnemyId || selectionState.active || !coopCanAct}
                    className={`
                bg-red-600 border-2 border-white px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded
                ${!actingEnemyId && !selectionState.active && coopCanAct ? 'hover:bg-red-500 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}
                ${tutorialStep === 5 ? 'ring-4 ring-red-400 ring-offset-2 ring-offset-transparent animate-pulse' : ''}
              `}
                >
                    {selectionState.active ? trans("選択", languageMode) : trans("ターン終了", languageMode)}
                </button>
            </div>

            {/* 4. Hand Area */}
            <div className={`battle-hand-area h-60 md:h-64 bg-gray-900 border-t border-gray-700 relative z-10 ${selectionState.active ? 'bg-blue-900/20' : ''} ${selfDown ? 'bg-red-950/20' : ''}`}>
                <style>
                    {`
                        @keyframes battle-hand-card-entry {
                            0% {
                                transform: translateX(-220px) translateY(20px) rotate(-14deg) scale(0.78);
                                opacity: 0;
                            }
                            30% {
                                opacity: 1;
                            }
                            78% {
                                transform: translateX(10px) translateY(-2px) rotate(2deg) scale(1.05);
                                opacity: 1;
                            }
                            100% {
                                transform: translateX(0) translateY(0) rotate(0deg) scale(1);
                                opacity: 1;
                            }
                        }
                    `}
                </style>
                {(selfDown || !coopCanAct) && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
                        <div className={`rounded-lg px-4 py-3 text-center text-sm font-bold shadow-lg ${selfDown ? 'border border-red-500/70 bg-red-950/85 text-red-100' : 'border border-cyan-500/70 bg-cyan-950/85 text-cyan-100'}`}>
                            {selfDown ? trans("戦闘不能", languageMode) : trans("待機中", languageMode)}<br />
                            <span className={`text-xs ${selfDown ? 'text-red-200/90' : 'text-cyan-200/90'}`}>
                                {selfDown ? trans("仲間の支援か蘇生を待っています", languageMode) : `${coopTurnOwnerLabel || trans("他のプレイヤー", languageMode)} ${trans("の行動を待っています", languageMode)}`}
                            </span>
                        </div>
                    </div>
                )}
                <div className="group/hand w-full h-full overflow-x-auto px-8 md:px-10 flex items-end justify-start md:justify-center pt-5 pb-10 md:pb-8 custom-scrollbar touch-pan-x" style={{ overflowY: 'visible' }}>
                    {player.hand.map((card, i) => {
                        const isClashDisabled = card.playCondition === 'HAND_ONLY_ATTACKS' && player.hand.some(c => c.type !== CardType.ATTACK && c.id !== card.id);
                        const isGrandFinaleDisabled = card.playCondition === 'DRAW_PILE_EMPTY' && player.drawPile.length > 0;
                        const isChokerDisabled = player.relics.some(r => r.id === 'VELVET_CHOKER') && player.cardsPlayedThisTurn >= 6;
                        const isNormalityDisabled = player.hand.some(c => c.name === '退屈' || c.name === 'NORMALITY') && player.cardsPlayedThisTurn >= 3;

                        const isSelectedDual = isDualMode && selectedCardIds.includes(card.id);
                        const isSelectedActive = selectionState.active;

                        const specialDisabled = isClashDisabled || isGrandFinaleDisabled || isChokerDisabled || isNormalityDisabled;

                        const displayCard = { ...card };
                        if (player.powers['CORRUPTION'] && card.type === CardType.SKILL) {
                            displayCard.cost = 0;
                        }

                        const mid = (player.hand.length - 1) / 2;
                        const dist = i - mid;
                        const rotation = dist * 2.5;
                        const translateY = Math.abs(dist) * 4;
                        const drawEntryDelayMs = drawEntryAnimationMap.get(card.id);
                        const isDrawEntryAnimating = drawEntryDelayMs !== undefined;
                        const baseZIndex = 10 + i;
                        const selectedZIndex = 40;
                        const animatingZIndex = 60 + i;
                        const cardZIndex = Math.max(
                            isSelectedActive || isSelectedDual ? selectedZIndex : baseZIndex,
                            isDrawEntryAnimating ? animatingZIndex : baseZIndex
                        );

                        return (
                            <div
                                key={card.id}
                                className={`inline-block align-middle transition-all duration-500 ease-out w-28 h-44 md:w-32 md:h-48 shrink-0 relative 
                            ml-0
                            md:group-hover/hand:-ml-2 md:group-active/hand:-ml-2 
                            ${isSelectedActive || isSelectedDual ? 'cursor-pointer -translate-y-8 z-30 scale-110' : 'hover:-translate-y-4 hover:z-20'}
                            ${tutorialStep === 4 ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-transparent animate-pulse rounded-lg' : ''}
                        `}
                                style={{
                                    transform: isSelectedActive || isSelectedDual ? 'translateY(-24px) scale(1.1)' : `rotate(${rotation}deg) translateY(${translateY}px)`,
                                    zIndex: cardZIndex
                                }}
                            >
                                {isDualMode && isSelectedDual && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white shadow-lg z-30 animate-bounce">
                                        {selectedCardIds.indexOf(card.id) === 0 ? "1" : "2"}
                                    </div>
                                )}

                                <div className="absolute top-0 left-0 origin-top-left scale-[0.95] md:scale-100">
                                    <div
                                        className="shadow-lg transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.03]"
                                        style={isDrawEntryAnimating ? {
                                            animationName: 'battle-hand-card-entry',
                                            animationDuration: '720ms',
                                            animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                                            animationDelay: `${drawEntryDelayMs}ms`,
                                            animationFillMode: 'both'
                                        } : undefined}
                                    >
                                        <Card
                                            card={displayCard}
                                            onClick={() => {
                                                if (selfDown || !coopCanAct) return;
                                                if (selectionState.active) {
                                                    onHandSelection(card);
                                                } else {
                                                    if (isDualMode) {
                                                        handleCardClickDual(card, specialDisabled);
                                                    } else {
                                                        if (!specialDisabled) onPlayCard(card);
                                                        else if (isChokerDisabled || isNormalityDisabled) audioService.playSound('wrong');
                                                    }
                                                }
                                            }}
                                            onInspect={onInspect}
                                            disabled={
                                                selectionState.active
                                                    ? false
                                                    : (isDualMode
                                                        ? (!!actingEnemyId || card.unplayable || specialDisabled || selfDown || !coopCanAct)
                                                        : (player.currentEnergy < displayCard.cost || !!actingEnemyId || card.unplayable || specialDisabled || selfDown || !coopCanAct)
                                                    )
                                            }
                                            languageMode={languageMode}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div className="w-20 shrink-0"></div>
                </div>
            </div>

            {showDeck && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeck(false)}>
                    <div className="bg-gray-800 border-4 border-white w-full max-w-md h-[80vh] flex flex-col relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="bg-black border-b-2 border-gray-600 p-4 flex justify-between items-center">
                            <h2 className="text-white text-xl font-bold flex items-center">
                                <Layers className="mr-2" /> {trans("山札", languageMode)} ({trans("残り", languageMode)}{player.drawPile.length}{trans("枚", languageMode)})
                            </h2>
                            <button onClick={() => setShowDeck(false)} className="text-gray-400 hover:text-white p-1">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-grow bg-gray-900/90">
                            <div className="grid grid-cols-3 gap-2 justify-items-center">
                                {[...player.deck].sort((a, b) => a.type.localeCompare(b.type)).map((card) => (
                                    <div key={card.id} className="scale-75 origin-top-left w-24 h-36">
                                        <Card card={card} onClick={() => { }} disabled={false} languageMode={languageMode} onInspect={onInspect} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

const MAX_ILLUSTRATION_REFS = 8;

const extractIllustrationTokens = (card: ICard): string[] => {
    if (card.illustrationRefs && card.illustrationRefs.length > 0) {
        return card.illustrationRefs.filter(Boolean).slice(0, MAX_ILLUSTRATION_REFS);
    }

    const enemyNames = [
        ...(card.enemyIllustrationNames || []),
        ...(card.enemyIllustrationName ? [card.enemyIllustrationName] : []),
    ].filter(Boolean) as string[];
    if (enemyNames.length > 0) return [`enemy:${enemyNames[0]}`];

    if (card.capture && card.textureRef && !card.textureRef.includes('|')) {
        return [`enemy:${card.textureRef}`];
    }

    if (card.name) return [`card:${card.name}`];
    if (card.textureRef) return [`pixel:${card.textureRef}`];
    return [];
};

const FinisherArtPiece: React.FC<{ token: string; seed: string; languageMode: LanguageMode }> = ({ token, seed, languageMode }) => {
    const [imageIndex, setImageIndex] = useState(0);
    const [failed, setFailed] = useState(false);
    const normalized = token.startsWith('enemy:') || token.startsWith('card:') || token.startsWith('pixel:') ? token : `card:${token}`;

    useEffect(() => {
        setImageIndex(0);
        setFailed(false);
    }, [normalized]);

    if (normalized.startsWith('enemy:')) {
        const name = normalized.substring('enemy:'.length);
        return <EnemyIllustration name={name} seed={seed} className="w-full h-full" size={32} />;
    }

    if (normalized.startsWith('pixel:')) {
        const sprite = normalized.substring('pixel:'.length);
        return <PixelSprite seed={seed} name={sprite} className="w-full h-full" size={32} />;
    }

    const cardName = normalized.substring('card:'.length);
    const candidates = getCardIllustrationPaths(seed, trans(cardName, languageMode), [cardName]);
    if (!failed && imageIndex < candidates.length) {
        return (
            <img
                src={candidates[imageIndex]}
                alt={cardName}
                className="w-full h-full object-cover"
                onError={() => {
                    const next = imageIndex + 1;
                    if (next < candidates.length) setImageIndex(next);
                    else setFailed(true);
                }}
            />
        );
    }

    return <div className="w-full h-full bg-black/30" />;
};

export const BattleFinisherCutinOverlay: React.FC<{ card: ICard; languageMode: LanguageMode }> = ({ card, languageMode }) => {
    const translated = trans(card.name, languageMode);
    const illustrationTokens = useMemo(
        () => extractIllustrationTokens(card),
        [card]
    );
    const isComposite = illustrationTokens.length > 1;
    const randomDirectionPool = ['left', 'right', 'up', 'down'] as const;
    const shuffledDirections = useMemo(() => {
        const dirs = [...randomDirectionPool];
        for (let i = dirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }
        return dirs;
    }, [card.id, isComposite]);

    const delayStepMs = useMemo(() => 90 + Math.floor(Math.random() * 70), [card.id, isComposite]);
    const cutinCount = Math.max(illustrationTokens.length, 1);
    const compositeStyleMode = useMemo(() => {
        const modes = ['collage', 'stack', 'stripSlash', 'radialFan', 'neonGrid', 'diagonalTiles', 'centerBurst', 'venetianWave'] as const;
        return modes[Math.floor(Math.random() * modes.length)];
    }, [card.id, isComposite]);
    const tokenRenderOrder = useMemo(() => {
        const ordered = illustrationTokens.map((token, idx) => ({ token, originalIndex: idx }));
        for (let i = ordered.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
        }
        return ordered;
    }, [illustrationTokens, card.id, isComposite]);
    const panelDelays = useMemo(() => {
        const delays: number[] = [];
        let current = 0;
        for (let i = 0; i < cutinCount; i++) {
            current += delayStepMs + Math.floor(Math.random() * 50);
            delays.push(current);
        }
        return delays;
    }, [cutinCount, delayStepMs, card.id, isComposite]);
    const radialAngles = useMemo(() => {
        const list: number[] = [];
        for (let i = 0; i < cutinCount; i++) {
            const base = -42 + (84 / Math.max(1, cutinCount - 1)) * i;
            list.push(base + (Math.random() * 8 - 4));
        }
        return list;
    }, [cutinCount, card.id, isComposite]);
    const burstPositions = useMemo(() => {
        const positions: Array<{ x: number; y: number; scale: number; rot: number }> = [];
        for (let i = 0; i < cutinCount; i++) {
            const ring = i % 2 === 0 ? 18 : 30;
            const theta = ((i / Math.max(1, cutinCount)) * 360 + Math.random() * 28 - 14) * (Math.PI / 180);
            positions.push({
                x: Math.cos(theta) * ring,
                y: Math.sin(theta) * ring,
                scale: 0.88 + Math.random() * 0.28,
                rot: Math.random() * 20 - 10,
            });
        }
        return positions;
    }, [cutinCount, card.id, isComposite]);
    const collagePanels = useMemo(() => {
        if (!isComposite || tokenRenderOrder.length === 0) return [];

        const layouts: Record<number, Array<{ clip: string; tx: string; ty: string; scale: number; rot: number }>> = {
            2: [
                { clip: 'polygon(0% 0%, 64% 0%, 44% 100%, 0% 100%)', tx: '-6%', ty: '-3%', scale: 1.24, rot: -2.5 },
                { clip: 'polygon(64% 0%, 100% 0%, 100% 100%, 44% 100%)', tx: '8%', ty: '4%', scale: 1.24, rot: 2.5 },
            ],
            3: [
                { clip: 'polygon(0% 0%, 55% 0%, 34% 58%, 0% 48%)', tx: '-7%', ty: '-5%', scale: 1.22, rot: -3 },
                { clip: 'polygon(55% 0%, 100% 0%, 100% 52%, 58% 58%)', tx: '7%', ty: '-4%', scale: 1.2, rot: 2.2 },
                { clip: 'polygon(0% 48%, 34% 58%, 58% 58%, 100% 52%, 100% 100%, 0% 100%)', tx: '2%', ty: '6%', scale: 1.16, rot: 1.4 },
            ],
            4: [
                { clip: 'polygon(0% 0%, 50% 0%, 36% 52%, 0% 44%)', tx: '-7%', ty: '-6%', scale: 1.2, rot: -3.2 },
                { clip: 'polygon(50% 0%, 100% 0%, 100% 44%, 64% 52%)', tx: '8%', ty: '-6%', scale: 1.2, rot: 2.8 },
                { clip: 'polygon(0% 44%, 36% 52%, 44% 100%, 0% 100%)', tx: '-5%', ty: '8%', scale: 1.18, rot: -1.8 },
                { clip: 'polygon(64% 52%, 100% 44%, 100% 100%, 44% 100%)', tx: '8%', ty: '8%', scale: 1.18, rot: 2.1 },
            ],
            5: [
                { clip: 'polygon(0% 0%, 46% 0%, 30% 36%, 0% 32%)', tx: '-8%', ty: '-7%', scale: 1.22, rot: -3.4 },
                { clip: 'polygon(46% 0%, 100% 0%, 100% 32%, 70% 36%)', tx: '9%', ty: '-7%', scale: 1.2, rot: 2.8 },
                { clip: 'polygon(0% 32%, 30% 36%, 26% 68%, 0% 62%)', tx: '-7%', ty: '1%', scale: 1.2, rot: -2.2 },
                { clip: 'polygon(30% 36%, 70% 36%, 74% 68%, 26% 68%)', tx: '1%', ty: '1%', scale: 1.16, rot: 1.1 },
                { clip: 'polygon(70% 36%, 100% 32%, 100% 62%, 74% 68%)', tx: '8%', ty: '1%', scale: 1.2, rot: 2.1 },
            ],
            6: [
                { clip: 'polygon(0% 0%, 44% 0%, 30% 34%, 0% 30%)', tx: '-8%', ty: '-7%', scale: 1.22, rot: -3.5 },
                { clip: 'polygon(44% 0%, 100% 0%, 100% 30%, 70% 34%)', tx: '9%', ty: '-7%', scale: 1.2, rot: 3.2 },
                { clip: 'polygon(0% 30%, 30% 34%, 24% 64%, 0% 60%)', tx: '-8%', ty: '-1%', scale: 1.2, rot: -2.5 },
                { clip: 'polygon(30% 34%, 70% 34%, 76% 64%, 24% 64%)', tx: '2%', ty: '0%', scale: 1.15, rot: 1.2 },
                { clip: 'polygon(70% 34%, 100% 30%, 100% 60%, 76% 64%)', tx: '9%', ty: '-1%', scale: 1.2, rot: 2.2 },
                { clip: 'polygon(0% 60%, 24% 64%, 100% 60%, 100% 100%, 0% 100%)', tx: '2%', ty: '9%', scale: 1.14, rot: 1.7 },
            ],
            7: [
                { clip: 'polygon(0% 0%, 40% 0%, 28% 28%, 0% 24%)', tx: '-8%', ty: '-8%', scale: 1.23, rot: -3.8 },
                { clip: 'polygon(40% 0%, 72% 0%, 66% 28%, 28% 28%)', tx: '1%', ty: '-8%', scale: 1.18, rot: 1.1 },
                { clip: 'polygon(72% 0%, 100% 0%, 100% 24%, 66% 28%)', tx: '9%', ty: '-8%', scale: 1.23, rot: 3.2 },
                { clip: 'polygon(0% 24%, 28% 28%, 22% 58%, 0% 54%)', tx: '-8%', ty: '-2%', scale: 1.2, rot: -2.7 },
                { clip: 'polygon(28% 28%, 66% 28%, 72% 58%, 22% 58%)', tx: '2%', ty: '-1%', scale: 1.14, rot: 1.3 },
                { clip: 'polygon(66% 28%, 100% 24%, 100% 54%, 72% 58%)', tx: '9%', ty: '-2%', scale: 1.2, rot: 2.3 },
                { clip: 'polygon(0% 54%, 22% 58%, 100% 54%, 100% 100%, 0% 100%)', tx: '3%', ty: '9%', scale: 1.12, rot: 1.8 },
            ],
            8: [
                { clip: 'polygon(0% 0%, 38% 0%, 26% 24%, 0% 22%)', tx: '-8%', ty: '-8%', scale: 1.23, rot: -3.8 },
                { clip: 'polygon(38% 0%, 68% 0%, 62% 24%, 26% 24%)', tx: '0%', ty: '-8%', scale: 1.18, rot: 1.1 },
                { clip: 'polygon(68% 0%, 100% 0%, 100% 22%, 62% 24%)', tx: '9%', ty: '-8%', scale: 1.23, rot: 3.2 },
                { clip: 'polygon(0% 22%, 26% 24%, 22% 50%, 0% 48%)', tx: '-8%', ty: '-3%', scale: 1.2, rot: -2.8 },
                { clip: 'polygon(26% 24%, 62% 24%, 66% 50%, 22% 50%)', tx: '2%', ty: '-2%', scale: 1.14, rot: 1.2 },
                { clip: 'polygon(62% 24%, 100% 22%, 100% 48%, 66% 50%)', tx: '9%', ty: '-3%', scale: 1.2, rot: 2.3 },
                { clip: 'polygon(0% 48%, 22% 50%, 54% 100%, 0% 100%)', tx: '-5%', ty: '9%', scale: 1.16, rot: -1.7 },
                { clip: 'polygon(22% 50%, 66% 50%, 100% 48%, 100% 100%, 54% 100%)', tx: '7%', ty: '8%', scale: 1.14, rot: 1.9 },
            ],
        };

        const count = Math.max(2, Math.min(8, illustrationTokens.length));
        const panelDefs = layouts[count];
        return panelDefs.map((def, idx) => ({
            ...def,
            token: tokenRenderOrder[idx % tokenRenderOrder.length].token,
            index: idx,
        }));
    }, [illustrationTokens, tokenRenderOrder, isComposite]);

    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];

        for (let i = 0; i < cutinCount; i++) {
            timers.push(
                setTimeout(() => {
                    audioService.playSound('finisher_slash');
                }, panelDelays[i] ?? i * delayStepMs)
            );
        }

        const explosionDelay = Math.max(680, (panelDelays[panelDelays.length - 1] || ((cutinCount - 1) * delayStepMs)) + 220);
        timers.push(
            setTimeout(() => {
                audioService.playSound('finisher_explosion');
            }, explosionDelay)
        );

        return () => {
            timers.forEach((timer) => clearTimeout(timer));
        };
    }, [card.id, cutinCount, delayStepMs, panelDelays]);

    return (
        <div className="absolute inset-0 z-[160] pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent animate-finish-dim"></div>

            {isComposite && compositeStyleMode === 'collage' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[112vw] h-[112vh] border-4 border-white/90 bg-black/25 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.75)]">
                        {collagePanels.map((panel) => (
                            <div
                                key={`collage-${panel.index}`}
                                className={`absolute inset-0 opacity-0 ${
                                    shuffledDirections[panel.index % shuffledDirections.length] === 'left'
                                        ? 'animate-finish-cutin-stack-left'
                                        : shuffledDirections[panel.index % shuffledDirections.length] === 'right'
                                            ? 'animate-finish-cutin-stack-right'
                                            : shuffledDirections[panel.index % shuffledDirections.length] === 'up'
                                                ? 'animate-finish-cutin-stack-up'
                                                : 'animate-finish-cutin-stack-down'
                                }`}
                                style={{
                                    clipPath: panel.clip,
                                    WebkitClipPath: panel.clip,
                                    animationDelay: `${panelDelays[panel.index] ?? panel.index * delayStepMs}ms`,
                                    zIndex: 20 + panel.index
                                }}
                            >
                                <div
                                    className="absolute inset-0 border-[2px] border-white/95 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] bg-black"
                                    style={{ transform: `translate(0%, 0%) scale(${panel.scale}) rotate(${panel.rot}deg)` }}
                                >
                                    <FinisherArtPiece token={panel.token} seed={`${card.id}-collage-${panel.index}`} languageMode={languageMode} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : isComposite && compositeStyleMode === 'stack' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    {tokenRenderOrder.map((entry, idx) => {
                        const frontScale = Math.min(0.78 + idx * 0.045, 1.08);
                        const offsetX = Math.min(idx * 10, 72);
                        const offsetY = Math.min(idx * 5, 36);
                        const angle = [-14, -7, -2, 5, 11, -10, 8, 3][idx % 8];
                        const direction = shuffledDirections[idx % shuffledDirections.length];

                        return (
                            <div
                                key={`stack-${entry.token}-${idx}-${entry.originalIndex}`}
                                className="absolute w-[62vw] max-w-[760px] h-[28vh] max-h-[250px]"
                                style={{
                                    left: `calc(50% - 31vw + ${offsetX}px)`,
                                    top: `calc(34% + ${offsetY}px)`,
                                    transform: `rotate(${angle}deg) scale(${frontScale})`,
                                    zIndex: 20 + idx
                                }}
                            >
                                <div
                                    className={`w-full h-full rounded-2xl overflow-hidden border-4 border-orange-300/70 shadow-[0_0_45px_rgba(251,146,60,0.45)] bg-black/35 opacity-0 ${
                                        direction === 'left'
                                            ? 'animate-finish-cutin-stack-left'
                                            : direction === 'right'
                                                ? 'animate-finish-cutin-stack-right'
                                                : direction === 'up'
                                                    ? 'animate-finish-cutin-stack-up'
                                                    : 'animate-finish-cutin-stack-down'
                                    }`}
                                    style={{ animationDelay: `${panelDelays[idx] ?? idx * delayStepMs}ms` }}
                                >
                                    <FinisherArtPiece token={entry.token} seed={`${card.id}-stack-${idx}`} languageMode={languageMode} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : isComposite && compositeStyleMode === 'stripSlash' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[108vw] h-[108vh] overflow-hidden bg-black/30 border-y-2 border-white/70 shadow-[0_0_60px_rgba(255,255,255,0.18)]">
                        {tokenRenderOrder.map((entry, idx) => {
                            const stripWidth = 100 / cutinCount;
                            const direction = shuffledDirections[idx % shuffledDirections.length];
                            return (
                                <div
                                    key={`strip-${entry.token}-${idx}`}
                                    className={`absolute top-[-8%] h-[116%] opacity-0 ${
                                        direction === 'left'
                                            ? 'animate-finish-cutin-multi-left'
                                            : direction === 'right'
                                                ? 'animate-finish-cutin-multi-right'
                                                : direction === 'up'
                                                    ? 'animate-finish-cutin-multi-up'
                                                    : 'animate-finish-cutin-multi-down'
                                    }`}
                                    style={{
                                        left: `${idx * stripWidth}%`,
                                        width: `${stripWidth + 1.4}%`,
                                        clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                                        WebkitClipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                                        animationDelay: `${panelDelays[idx] ?? idx * delayStepMs}ms`,
                                        zIndex: 20 + idx
                                    }}
                                >
                                    <div className="absolute inset-0 border-l border-r border-white/90 bg-black/60 shadow-[inset_0_0_16px_rgba(255,255,255,0.35)]" />
                                    <FinisherArtPiece token={entry.token} seed={`${card.id}-strip-${idx}`} languageMode={languageMode} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : isComposite && compositeStyleMode === 'radialFan' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                        {tokenRenderOrder.map((entry, idx) => {
                            const angle = radialAngles[idx] ?? 0;
                            const direction = shuffledDirections[idx % shuffledDirections.length];
                            return (
                                <div
                                    key={`radial-${entry.token}-${idx}`}
                                    className={`absolute left-1/2 top-1/2 w-[68vw] max-w-[920px] h-[27vh] max-h-[250px] -translate-x-1/2 -translate-y-1/2 opacity-0 ${
                                        direction === 'left'
                                            ? 'animate-finish-cutin-stack-left'
                                            : direction === 'right'
                                                ? 'animate-finish-cutin-stack-right'
                                                : direction === 'up'
                                                    ? 'animate-finish-cutin-stack-up'
                                                    : 'animate-finish-cutin-stack-down'
                                    }`}
                                    style={{
                                        transform: `translate(-50%, -50%) rotate(${angle}deg) scale(${0.9 + idx * 0.03})`,
                                        transformOrigin: '14% 50%',
                                        animationDelay: `${panelDelays[idx] ?? idx * delayStepMs}ms`,
                                        zIndex: 16 + idx
                                    }}
                                >
                                    <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-cyan-200/80 bg-black/35 shadow-[0_0_42px_rgba(34,211,238,0.35)]">
                                        <FinisherArtPiece token={entry.token} seed={`${card.id}-radial-${idx}`} languageMode={languageMode} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : isComposite && compositeStyleMode === 'neonGrid' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[110vw] h-[110vh] overflow-hidden bg-black/30 border-2 border-cyan-200/70">
                        {tokenRenderOrder.map((entry, idx) => {
                            const cols = Math.min(4, Math.ceil(Math.sqrt(cutinCount)));
                            const rows = Math.ceil(cutinCount / cols);
                            const col = idx % cols;
                            const row = Math.floor(idx / cols);
                            const cellW = 100 / cols;
                            const cellH = 100 / rows;
                            const direction = shuffledDirections[idx % shuffledDirections.length];
                            return (
                                <div
                                    key={`grid-${entry.token}-${idx}`}
                                    className={`absolute opacity-0 ${
                                        direction === 'left'
                                            ? 'animate-finish-cutin-stack-left'
                                            : direction === 'right'
                                                ? 'animate-finish-cutin-stack-right'
                                                : direction === 'up'
                                                    ? 'animate-finish-cutin-stack-up'
                                                    : 'animate-finish-cutin-stack-down'
                                    }`}
                                    style={{
                                        left: `${col * cellW}%`,
                                        top: `${row * cellH}%`,
                                        width: `${cellW + 0.8}%`,
                                        height: `${cellH + 0.8}%`,
                                        clipPath: 'polygon(0% 8%, 8% 0%, 100% 0%, 100% 92%, 92% 100%, 0% 100%)',
                                        WebkitClipPath: 'polygon(0% 8%, 8% 0%, 100% 0%, 100% 92%, 92% 100%, 0% 100%)',
                                        animationDelay: `${panelDelays[idx] ?? idx * delayStepMs}ms`,
                                        zIndex: 18 + idx
                                    }}
                                >
                                    <div className="absolute inset-0 border-[2px] border-cyan-200/90 bg-black/45 shadow-[inset_0_0_20px_rgba(34,211,238,0.35)]" />
                                    <FinisherArtPiece token={entry.token} seed={`${card.id}-grid-${idx}`} languageMode={languageMode} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : isComposite && compositeStyleMode === 'diagonalTiles' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[110vw] h-[110vh] overflow-hidden bg-black/25">
                        {tokenRenderOrder.map((entry, idx) => {
                            const tiles = Math.max(2, Math.ceil(Math.sqrt(cutinCount)));
                            const col = idx % tiles;
                            const row = Math.floor(idx / tiles);
                            const w = 100 / tiles;
                            const h = 100 / Math.ceil(cutinCount / tiles);
                            const direction = shuffledDirections[idx % shuffledDirections.length];
                            return (
                                <div
                                    key={`diag-${entry.token}-${idx}`}
                                    className={`absolute opacity-0 ${
                                        direction === 'left'
                                            ? 'animate-finish-cutin-multi-left'
                                            : direction === 'right'
                                                ? 'animate-finish-cutin-multi-right'
                                                : direction === 'up'
                                                    ? 'animate-finish-cutin-multi-up'
                                                    : 'animate-finish-cutin-multi-down'
                                    }`}
                                    style={{
                                        left: `${col * w}%`,
                                        top: `${row * h}%`,
                                        width: `${w + 0.6}%`,
                                        height: `${h + 0.6}%`,
                                        clipPath: 'polygon(0% 12%, 12% 0%, 100% 0%, 100% 88%, 88% 100%, 0% 100%)',
                                        WebkitClipPath: 'polygon(0% 12%, 12% 0%, 100% 0%, 100% 88%, 88% 100%, 0% 100%)',
                                        transform: `skewX(-6deg) rotate(${(idx % 2 === 0 ? -2 : 2)}deg)`,
                                        animationDelay: `${panelDelays[idx] ?? idx * delayStepMs}ms`,
                                        zIndex: 22 + idx
                                    }}
                                >
                                    <div className="absolute inset-0 border-[2px] border-fuchsia-200/80 bg-black/35 shadow-[0_0_24px_rgba(232,121,249,0.38)]" />
                                    <FinisherArtPiece token={entry.token} seed={`${card.id}-diagonal-${idx}`} languageMode={languageMode} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : isComposite && compositeStyleMode === 'centerBurst' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                        {tokenRenderOrder.map((entry, idx) => {
                            const pos = burstPositions[idx] || { x: 0, y: 0, scale: 1, rot: 0 };
                            const direction = shuffledDirections[idx % shuffledDirections.length];
                            return (
                                <div
                                    key={`burst-${entry.token}-${idx}`}
                                    className={`absolute left-1/2 top-1/2 w-[54vw] max-w-[760px] h-[24vh] max-h-[220px] -translate-x-1/2 -translate-y-1/2 opacity-0 ${
                                        direction === 'left'
                                            ? 'animate-finish-cutin-stack-left'
                                            : direction === 'right'
                                                ? 'animate-finish-cutin-stack-right'
                                                : direction === 'up'
                                                    ? 'animate-finish-cutin-stack-up'
                                                    : 'animate-finish-cutin-stack-down'
                                    }`}
                                    style={{
                                        transform: `translate(calc(-50% + ${pos.x}vw), calc(-50% + ${pos.y}vh)) rotate(${pos.rot}deg) scale(${pos.scale})`,
                                        animationDelay: `${panelDelays[idx] ?? idx * delayStepMs}ms`,
                                        zIndex: 24 + idx
                                    }}
                                >
                                    <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-amber-200/80 bg-black/35 shadow-[0_0_35px_rgba(251,191,36,0.42)]">
                                        <FinisherArtPiece token={entry.token} seed={`${card.id}-burst-${idx}`} languageMode={languageMode} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : isComposite && compositeStyleMode === 'venetianWave' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[112vw] h-[108vh] overflow-hidden bg-black/30 border-y-2 border-sky-200/70">
                        {tokenRenderOrder.map((entry, idx) => {
                            const barCount = Math.max(3, Math.min(8, cutinCount));
                            const barW = 100 / barCount;
                            const waveShift = (idx % 2 === 0 ? -8 : 8);
                            const direction = shuffledDirections[idx % shuffledDirections.length];
                            return (
                                <div
                                    key={`wave-${entry.token}-${idx}`}
                                    className={`absolute top-0 h-full opacity-0 ${
                                        direction === 'left'
                                            ? 'animate-finish-cutin-stack-left'
                                            : direction === 'right'
                                                ? 'animate-finish-cutin-stack-right'
                                                : direction === 'up'
                                                    ? 'animate-finish-cutin-stack-up'
                                                    : 'animate-finish-cutin-stack-down'
                                    }`}
                                    style={{
                                        left: `${idx * barW}%`,
                                        width: `${barW + 1.2}%`,
                                        transform: `translateY(${waveShift}px)`,
                                        clipPath: 'polygon(0% 0%, 100% 0%, 92% 100%, 8% 100%)',
                                        WebkitClipPath: 'polygon(0% 0%, 100% 0%, 92% 100%, 8% 100%)',
                                        animationDelay: `${panelDelays[idx] ?? idx * delayStepMs}ms`,
                                        zIndex: 26 + idx
                                    }}
                                >
                                    <div className="absolute inset-0 border-l border-r border-sky-100/90 bg-black/45 shadow-[inset_0_0_18px_rgba(125,211,252,0.35)]" />
                                    <FinisherArtPiece token={entry.token} seed={`${card.id}-wave-${idx}`} languageMode={languageMode} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center">
                    <div className="w-[78vw] max-w-[920px] h-[42vh] max-h-[360px] animate-finish-cutin rounded-r-2xl overflow-hidden border-y-4 border-r-4 border-orange-300/70 shadow-[0_0_50px_rgba(251,146,60,0.45)] bg-black/30">
                        <FinisherArtPiece token={illustrationTokens[0] || `card:${card.name}`} seed={`${card.id}-finisher`} languageMode={languageMode} />
                    </div>
                </div>
            )}

            <div className="absolute left-6 bottom-8 md:bottom-12 animate-finish-title">
                <div className="text-orange-200 text-xs md:text-sm font-bold tracking-[0.18em] mb-1">{trans("フィニッシュ", languageMode)}</div>
                <div className="text-white text-2xl md:text-4xl font-black drop-shadow-[0_0_18px_rgba(0,0,0,1)]">{translated}</div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-orange-500/90 shadow-[0_0_80px_rgba(249,115,22,0.95)] animate-finish-explosion"></div>
                <div className="absolute w-32 h-32 md:w-52 md:h-52 rounded-full border-4 border-yellow-200/90 animate-finish-shockwave"></div>
            </div>

            <style>
                {`
                    @keyframes finish-cutin {
                        0% { transform: translateX(-110%) skewX(-10deg); opacity: 0; }
                        20% { transform: translateX(-6%) skewX(-6deg); opacity: 1; }
                        100% { transform: translateX(0) skewX(0deg); opacity: 1; }
                    }
                    @keyframes finish-cutin-stack-left {
                        0% { transform: translate(-90px, -24px) scale(0.84); opacity: 0; filter: blur(2px); }
                        55% { transform: translate(8px, 3px) scale(1.04); opacity: 1; filter: blur(0); }
                        100% { transform: translate(0, 0) scale(1); opacity: 1; }
                    }
                    @keyframes finish-cutin-stack-right {
                        0% { transform: translate(90px, -24px) scale(0.84); opacity: 0; filter: blur(2px); }
                        55% { transform: translate(-8px, 3px) scale(1.04); opacity: 1; filter: blur(0); }
                        100% { transform: translate(0, 0) scale(1); opacity: 1; }
                    }
                    @keyframes finish-cutin-stack-up {
                        0% { transform: translate(0, -78px) scale(0.84); opacity: 0; filter: blur(2px); }
                        55% { transform: translate(0, 4px) scale(1.04); opacity: 1; filter: blur(0); }
                        100% { transform: translate(0, 0) scale(1); opacity: 1; }
                    }
                    @keyframes finish-cutin-stack-down {
                        0% { transform: translateY(-42px) scale(0.84); opacity: 0; filter: blur(2px); }
                        55% { transform: translateY(4px) scale(1.04); opacity: 1; filter: blur(0); }
                        100% { transform: translateY(0) scale(1); opacity: 1; }
                    }
                    @keyframes finish-cutin-multi-left {
                        0% { transform: translateX(-120%) scale(1.05); }
                        35% { transform: translateX(-8%) scale(1.02); }
                        100% { transform: translateX(0) scale(1); }
                    }
                    @keyframes finish-cutin-multi-right {
                        0% { transform: translateX(120%) scale(1.05); }
                        35% { transform: translateX(8%) scale(1.02); }
                        100% { transform: translateX(0) scale(1); }
                    }
                    @keyframes finish-cutin-multi-up {
                        0% { transform: translateY(-110%) scale(1.06); }
                        35% { transform: translateY(-8%) scale(1.02); }
                        100% { transform: translateY(0) scale(1); }
                    }
                    @keyframes finish-cutin-multi-down {
                        0% { transform: translateY(110%) scale(1.06); }
                        35% { transform: translateY(8%) scale(1.02); }
                        100% { transform: translateY(0) scale(1); }
                    }
                    @keyframes finish-dim {
                        0% { opacity: 0; }
                        25% { opacity: 1; }
                        100% { opacity: 1; }
                    }
                    @keyframes finish-title {
                        0% { transform: translateY(20px); opacity: 0; }
                        35% { transform: translateY(0); opacity: 1; }
                        100% { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes finish-explosion {
                        0%, 54% { transform: scale(0.15); opacity: 0; }
                        58% { transform: scale(0.35); opacity: 0.9; }
                        75% { transform: scale(2.8); opacity: 0.95; }
                        100% { transform: scale(4.8); opacity: 0; }
                    }
                    @keyframes finish-shockwave {
                        0%, 56% { transform: scale(0.2); opacity: 0; border-width: 10px; }
                        60% { opacity: 1; }
                        100% { transform: scale(4.5); opacity: 0; border-width: 1px; }
                    }
                    .animate-finish-cutin { animation: finish-cutin 0.55s cubic-bezier(.2,.8,.2,1) forwards; }
                    .animate-finish-cutin-stack-left { animation: finish-cutin-stack-left 0.62s cubic-bezier(.2,.8,.2,1) forwards; }
                    .animate-finish-cutin-stack-right { animation: finish-cutin-stack-right 0.62s cubic-bezier(.2,.8,.2,1) forwards; }
                    .animate-finish-cutin-stack-up { animation: finish-cutin-stack-up 0.62s cubic-bezier(.2,.8,.2,1) forwards; }
                    .animate-finish-cutin-stack-down { animation: finish-cutin-stack-down 0.62s cubic-bezier(.2,.8,.2,1) forwards; }
                    .animate-finish-cutin-multi-left { animation: finish-cutin-multi-left 0.62s cubic-bezier(.2,.8,.2,1) forwards; }
                    .animate-finish-cutin-multi-right { animation: finish-cutin-multi-right 0.62s cubic-bezier(.2,.8,.2,1) forwards; }
                    .animate-finish-cutin-multi-up { animation: finish-cutin-multi-up 0.62s cubic-bezier(.2,.8,.2,1) forwards; }
                    .animate-finish-cutin-multi-down { animation: finish-cutin-multi-down 0.62s cubic-bezier(.2,.8,.2,1) forwards; }
                    .animate-finish-dim { animation: finish-dim 0.3s ease-out forwards; }
                    .animate-finish-title { animation: finish-title 0.45s ease-out forwards; }
                    .animate-finish-explosion { animation: finish-explosion 1.2s ease-out forwards; }
                    .animate-finish-shockwave { animation: finish-shockwave 1.2s ease-out forwards; }
                `}
            </style>
        </div>
    );
};

const FullscreenCardArtModal: React.FC<{ card: ICard; languageMode: LanguageMode; onClose: () => void }> = ({ card, languageMode, onClose }) => {
    const translated = trans(card.name, languageMode);
    const imageCandidates = useMemo(
        () => getCardIllustrationPaths(card.id, translated, [card.name]),
        [card.id, card.name, translated]
    );
    const enemyIllustrationNames = useMemo(() => {
        const explicit = [
            ...(card.enemyIllustrationNames || []),
            ...(card.enemyIllustrationName ? [card.enemyIllustrationName] : []),
        ].filter(Boolean) as string[];
        if (explicit.length > 0) return Array.from(new Set(explicit));

        if (card.capture && card.textureRef && !card.textureRef.includes('|')) {
            return [card.textureRef];
        }

        return [];
    }, [card.capture, card.textureRef, card.enemyIllustrationName, card.enemyIllustrationNames]);
    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
        setImageIndex(0);
    }, [card.id, card.name, translated]);

    return (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-3 right-3 text-white/80 hover:text-white p-2"
            >
                <X size={28} />
            </button>

            <div className="w-full h-full max-w-[96vw] max-h-[96vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {enemyIllustrationNames.length > 0 ? (
                    <div className="w-[70vmin] h-[70vmin] max-w-[90vw] max-h-[90vh]">
                        <EnemyIllustration
                            name={enemyIllustrationNames[0]}
                            seed={`${card.id}-enemy-fullscreen`}
                            aliases={enemyIllustrationNames.slice(1)}
                            className="w-full h-full"
                            size={32}
                        />
                    </div>
                ) : imageIndex < imageCandidates.length ? (
                    <img
                        src={imageCandidates[imageIndex]}
                        alt={translated}
                        className="max-w-full max-h-full object-contain rounded"
                        onError={() => setImageIndex((prev) => prev + 1)}
                    />
                ) : card.textureRef ? (
                    <div className="w-[70vmin] h-[70vmin] max-w-[90vw] max-h-[90vh]">
                        <PixelSprite seed={card.id} name={card.textureRef} className="w-full h-full" size={32} />
                    </div>
                ) : (
                    <div className="text-gray-400">{trans("イラストがありません", languageMode)}</div>
                )}
            </div>
        </div>
    );
};

export default BattleScene;
