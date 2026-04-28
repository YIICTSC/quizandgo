
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { ArrowLeft, RotateCcw, Heart, Pause, Sparkles, Zap, Flame, Shield, Swords, Target, Radiation, Droplets, Recycle, Volume2, Music, Mic, Activity, Wind, Maximize2, Minimize2, Crosshair, FastForward, Dice5, Star, Skull } from 'lucide-react';
import { HERO_IMAGE_DATA } from '../constants';
import PixelSprite, { SPRITE_TEMPLATES, createPixelSpriteCanvas } from './PixelSprite';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import MathChallengeScreen from './MathChallengeScreen';
import { GameMode } from '../types';

// --- GAME CONSTANTS ---
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const PLAYER_SPEED = 4;
const BASE_XP_REQUIREMENT = 10;
const ZOOM_SCALE = 1.25;
const FIXED_STEP_MS = 1000 / 60;

// --- TYPES ---
type WeaponType = 
    'PENCIL' | 'ERASER' | 'RULER' | 'HIGHLIGHTER' | 'FLASK' | 'RECORDER' | 
    'SOCCER' | 'UWABAKI' | 'CURRY' | 'COMPASS' | 'MOP' | 'MAGNIFIER' |
    'STAPLER' | 'CUTTER' | 'ART_BRUSH' | 'GLOBE' | 'PROTRACTOR_SWING' | 'CHALK_SMOKE' |
    'SCISSORS' | 'TAPE' | 'DICTIONARY' | 'PAPER_PLANE_S' | 'GLUE_STICK' | 'HAND_BELL' | 
    'COMPASS_SPIKE' | 'WHISTLE_S' | 'MAGNET_U' | 'TRIANGLE_RULER_S' | 'STAPLE_REMOVER' | 'JUMP_ROPE' |
    'PRISM' | 'TROWEL' | 'LUNCH_TRAY' | 'BASKETBALL' | 'DUSTER' | 'FOUNTAIN_PEN' | 
    'SCHOOL_CHIME' | 'TRUMPET' | 'CLAY' | 'BROADCAST_MIC';

type PassiveType = 
    'PROTEIN' | 'DRILL' | 'PROTRACTOR' | 'SHOES' | 'PAD' | 'LUNCHBOX' | 
    'MAGNET' | 'TEXTBOOK' | 'ABACUS' | 'CONSOLE' | 'MILK' | 'ORIGAMI';

interface ItemSpriteConfig {
    template: string;
    color: string;
    highlight: string;
}

interface WeaponDef {
    id: WeaponType;
    name: string;
    desc: string;
    evolvedName: string;
    evolvedDesc: string;
    synergy: PassiveType;
    sprite: ItemSpriteConfig;
    animType: 'PROJECTILE' | 'SWING' | 'STAY' | 'BEAM' | 'BLAST' | 'STAB' | 'CIRCLE' | 'SPLATTER' | 'RAINBOW';
}

interface PassiveDef {
    id: PassiveType;
    name: string;
    desc: string;
    sprite: ItemSpriteConfig;
}

const WEAPONS: Record<WeaponType, WeaponDef> = {
    PENCIL: { 
        id: 'PENCIL', name: 'ロケット鉛筆', desc: '近くの敵を攻撃', 
        evolvedName: 'ガトリング・シャープ', evolvedDesc: '超高速連射', synergy: 'LUNCHBOX',
        sprite: { template: 'SWORD', color: '#fbbf24', highlight: '#fcd34d' },
        animType: 'PROJECTILE'
    },
    ERASER: { 
        id: 'ERASER', name: '消しゴムシールド', desc: '周囲を回転', 
        evolvedName: '修正液バリア', evolvedDesc: '触れた敵を消滅', synergy: 'PAD',
        sprite: { template: 'SHIELD', color: '#f3f4f6', highlight: '#ffffff' },
        animType: 'STAY'
    },
    RULER: { 
        id: 'RULER', name: '30cm定規', desc: '手元からのなぎ払い', 
        evolvedName: '三角定規ブーメラン', evolvedDesc: '全方位への衝撃波', synergy: 'PROTRACTOR',
        sprite: { template: 'SWORD', color: '#22c55e', highlight: '#86efac' },
        animType: 'SWING'
    },
    HIGHLIGHTER: { 
        id: 'HIGHLIGHTER', name: '蛍光ペン', desc: '直線ビーム', 
        evolvedName: 'レーザーポインター', evolvedDesc: '天からの極太レーザー', synergy: 'TEXTBOOK',
        sprite: { template: 'SWORD', color: '#f0abfc', highlight: '#fae8ff' },
        animType: 'BEAM'
    },
    FLASK: { 
        id: 'FLASK', name: '理科室のフラスコ', desc: '爆発する瓶を投げる', 
        evolvedName: '実験失敗', evolvedDesc: '毒の霧を撒き散らす', synergy: 'MAGNET',
        sprite: { template: 'POTION', color: '#3b82f6', highlight: '#93c5fd' },
        animType: 'PROJECTILE'
    },
    RECORDER: { 
        id: 'RECORDER', name: 'リコーダー', desc: '音波で押し返す', 
        evolvedName: '校内放送(メタル)', evolvedDesc: '画面全体攻撃＆スタン', synergy: 'DRILL',
        sprite: { template: 'SWORD', color: '#fca5a5', highlight: '#ffe4e6' },
        animType: 'BLAST'
    },
    SOCCER: { 
        id: 'SOCCER', name: 'サッカーボール', desc: '跳ね返るボール', 
        evolvedName: 'ドッジボールの神', evolvedDesc: '超高速乱反射', synergy: 'SHOES',
        sprite: { template: 'SLIME', color: '#ffffff', highlight: '#d1d5db' },
        animType: 'PROJECTILE'
    },
    UWABAKI: { 
        id: 'UWABAKI', name: '上履きミサイル', desc: '強敵を追尾', 
        evolvedName: 'ドローン配送', evolvedDesc: '編隊爆撃', synergy: 'CONSOLE',
        sprite: { template: 'SHOE', color: '#ef4444', highlight: '#fca5a5' },
        animType: 'PROJECTILE'
    },
    CURRY: { 
        id: 'CURRY', name: '給食のカレー', desc: 'ダメージ床生成', 
        evolvedName: '激辛麻婆豆腐', evolvedDesc: 'マグマ地帯を生成', synergy: 'MILK',
        sprite: { template: 'SLIME', color: '#d97706', highlight: '#fbbf24' },
        animType: 'STAY'
    },
    COMPASS: { 
        id: 'COMPASS', name: 'コンパス針', desc: '進行方向へ突き', 
        evolvedName: 'ドリルスパイラル', evolvedDesc: '無敵突進', synergy: 'PROTEIN',
        sprite: { template: 'SWORD', color: '#94a3b8', highlight: '#cbd5e1' },
        animType: 'PROJECTILE'
    },
    MOP: { 
        id: 'MOP', name: '掃除モップ', desc: '広範囲なぎ払い', 
        evolvedName: '聖なるハタキ', evolvedDesc: '弾消し＆衝撃波', synergy: 'ORIGAMI',
        sprite: { template: 'PLANT', color: '#a8a29e', highlight: '#e7e5e4' },
        animType: 'SWING'
    },
    MAGNIFIER: { 
        id: 'MAGNIFIER', name: '虫眼鏡', desc: '定点照射攻撃', 
        evolvedName: '天体望遠鏡', evolvedDesc: '巨大な光の柱', synergy: 'ABACUS',
        sprite: { template: 'EYE', color: '#60a5fa', highlight: '#bfdbfe' },
        animType: 'BEAM'
    },
    STAPLER: { 
        id: 'STAPLER', name: 'ホッチキス', desc: '正面に針を連射', 
        evolvedName: '全自動製本機', evolvedDesc: '全方位に針を連射', synergy: 'DRILL',
        sprite: { template: 'ROBOT', color: '#4b5563', highlight: '#cbd5e1' },
        animType: 'PROJECTILE'
    },
    CUTTER: { 
        id: 'CUTTER', name: 'カッターナイフ', desc: '超近距離の鋭い一撃', 
        evolvedName: '断罪の刃', evolvedDesc: '画面を切り裂く絶技', synergy: 'PROTEIN',
        sprite: { template: 'SWORD', color: '#334155', highlight: '#94a3b8' },
        animType: 'SWING'
    },
    ART_BRUSH: { 
        id: 'ART_BRUSH', name: '美術の筆', desc: '色鮮やかな絵の具を撒く', 
        evolvedName: '巨匠のキャンバス', evolvedDesc: '色彩の暴力', synergy: 'ORIGAMI',
        sprite: { template: 'PLANT', color: '#f43f5e', highlight: '#fb7185' },
        animType: 'STAY'
    },
    GLOBE: { 
        id: 'GLOBE', name: '地球儀', desc: '公転して敵を弾く', 
        evolvedName: 'ブラックホール', evolvedDesc: '敵を吸い寄せ消滅させる', synergy: 'MAGNET',
        sprite: { template: 'SLIME', color: '#0369a1', highlight: '#38bdf8' },
        animType: 'STAY'
    },
    PROTRACTOR_SWING: { 
        id: 'PROTRACTOR_SWING', name: '分度器', desc: '完璧な角度で薙ぎ払う', 
        evolvedName: '黄金比の円舞', evolvedDesc: '全方位を完璧に防御', synergy: 'PROTRACTOR',
        sprite: { template: 'SHIELD', color: '#d946ef', highlight: '#f5d0fe' },
        animType: 'SWING'
    },
    CHALK_SMOKE: { 
        id: 'CHALK_SMOKE', name: 'チョークの粉', desc: '敵を混乱させる煙', 
        evolvedName: 'ホワイトアウト', evolvedDesc: '画面上の敵を停止させる', synergy: 'TEXTBOOK',
        sprite: { template: 'SLIME', color: '#f8fafc', highlight: '#ffffff' },
        animType: 'STAY'
    },
    SCISSORS: { 
        id: 'SCISSORS', name: 'ハサミ', desc: '二本の刃で切り裂く', 
        evolvedName: '神の裁断', evolvedDesc: '敵を二分する', synergy: 'PAD',
        sprite: { template: 'SWORD', color: '#475569', highlight: '#f1f5f9' },
        animType: 'SWING'
    },
    TAPE: { 
        id: 'TAPE', name: 'セロハンテープ', desc: '敵の動きを封じる', 
        evolvedName: '蜘蛛の巣の牢獄', evolvedDesc: '広範囲の敵を完全拘束', synergy: 'LUNCHBOX',
        sprite: { template: 'SLIME', color: '#e2e8f0', highlight: '#f8fafc' },
        animType: 'PROJECTILE'
    },
    DICTIONARY: { 
        id: 'DICTIONARY', name: '分厚い辞書', desc: '重い辞書を投げつける', 
        evolvedName: '百科事典プレス', evolvedDesc: '巨大な本が敵を圧殺', synergy: 'PAD',
        sprite: { template: 'NOTEBOOK', color: '#7c2d12', highlight: '#9a3412' },
        animType: 'PROJECTILE'
    },
    PAPER_PLANE_S: { 
        id: 'PAPER_PLANE_S', name: '紙飛行機', desc: 'ジグザグに飛ぶ貫通攻撃', 
        evolvedName: 'ステルス戦闘機', evolvedDesc: '超高速で敵を貫く', synergy: 'SHOES',
        sprite: { template: 'FLIER', color: '#ffffff', highlight: '#e2e8f0' },
        animType: 'PROJECTILE'
    },
    GLUE_STICK: { 
        id: 'GLUE_STICK', name: 'スティックのり', desc: 'ネバネバの足場を作る', 
        evolvedName: '超強力接着剤', evolvedDesc: '敵の動きを完全に止める床', synergy: 'MILK',
        sprite: { template: 'POTION', color: '#3b82f6', highlight: '#60a5fa' },
        animType: 'STAY'
    },
    HAND_BELL: { 
        id: 'HAND_BELL', name: 'ハンドベル', desc: '一定時間ごとに周囲を攻撃', 
        evolvedName: '大聖堂の鐘', evolvedDesc: '強力な衝撃波を放つ', synergy: 'TEXTBOOK',
        sprite: { template: 'LIGHTNING', color: '#facc15', highlight: '#fef08a' },
        animType: 'BLAST'
    },
    COMPASS_SPIKE: { 
        id: 'COMPASS_SPIKE', name: 'コンパスの針', desc: '前方に高速で突きを放つ', 
        evolvedName: '千本針', evolvedDesc: '超範囲の連続突き', synergy: 'PROTEIN',
        sprite: { template: 'SWORD', color: '#cbd5e1', highlight: '#f8fafc' },
        animType: 'STAB'
    },
    WHISTLE_S: { 
        id: 'WHISTLE_S', name: '先生の笛', desc: '音圧で敵を弾き飛ばす', 
        evolvedName: '超音波カッター', evolvedDesc: '全方位に殺傷音波', synergy: 'DRILL',
        sprite: { template: 'LIGHTNING', color: '#ef4444', highlight: '#fca5a5' },
        animType: 'BLAST'
    },
    MAGNET_U: { 
        id: 'MAGNET_U', name: 'U字磁石', desc: '敵を中央に吸い寄せる', 
        evolvedName: '電磁波地獄', evolvedDesc: '強力に敵を集め粉砕する', synergy: 'MAGNET',
        sprite: { template: 'SHIELD', color: '#ef4444', highlight: '#3b82f6' },
        animType: 'CIRCLE'
    },
    TRIANGLE_RULER_S: { 
        id: 'TRIANGLE_RULER_S', name: '三角定規', desc: '回転しながら飛ぶカッター', 
        evolvedName: 'プラズマカッター', evolvedDesc: '敵を切り裂く光輪', synergy: 'PROTRACTOR',
        sprite: { template: 'SWORD', color: '#4ade80', highlight: '#bbf7d0' },
        animType: 'PROJECTILE'
    },
    STAPLE_REMOVER: { 
        id: 'STAPLE_REMOVER', name: '針抜き', desc: '近距離に高威力の噛みつき', 
        evolvedName: 'デストラクター', evolvedDesc: '敵の防御を無視して粉砕', synergy: 'LUNCHBOX',
        sprite: { template: 'FIST', color: '#475569', highlight: '#94a3b8' },
        animType: 'STAB'
    },
    JUMP_ROPE: { 
        id: 'JUMP_ROPE', name: 'なわとび', desc: '周囲を円状になぎ払う', 
        evolvedName: '光の鎖', evolvedDesc: '広い範囲を拘束・攻撃', synergy: 'ORIGAMI',
        sprite: { template: 'FIST', color: '#facc15', highlight: '#ffffff' },
        animType: 'CIRCLE'
    },
    PRISM: { 
        id: 'PRISM', name: 'プリズム', desc: '虹色の光を放つ', 
        evolvedName: 'オーロラ・カノン', evolvedDesc: '画面を焼き尽くす七色の光', synergy: 'TEXTBOOK',
        sprite: { template: 'GEM', color: '#ffffff', highlight: '#fdf4ff' },
        animType: 'RAINBOW'
    },
    TROWEL: { 
        id: 'TROWEL', name: '移植ゴテ', desc: '地面からトゲを出す', 
        evolvedName: '大地の怒り', evolvedDesc: '無数の岩の槍を突き出す', synergy: 'PROTEIN',
        sprite: { template: 'SWORD', color: '#78350f', highlight: '#b45309' },
        animType: 'STAB'
    },
    LUNCH_TRAY: { 
        id: 'LUNCH_TRAY', name: '給食用トレイ', desc: '回転して敵を弾く', 
        evolvedName: '鋼鉄の円盤', evolvedDesc: '触れた敵を切り刻む', synergy: 'PAD',
        sprite: { template: 'SHIELD', color: '#94a3b8', highlight: '#e2e8f0' },
        animType: 'STAY'
    },
    BASKETBALL: { 
        id: 'BASKETBALL', name: 'バスケットボール', desc: 'ドリブルで衝撃波', 
        evolvedName: 'ダンク・インパクト', evolvedDesc: '爆発的な衝撃波を連続発生', synergy: 'SHOES',
        sprite: { template: 'SLIME', color: '#f97316', highlight: '#fdba74' },
        animType: 'BLAST'
    },
    DUSTER: { 
        id: 'DUSTER', name: '黒板消し', desc: '粉塵を撒き散らす', 
        evolvedName: 'ダスト・ノヴァ', evolvedDesc: '画面中を煙に包み爆破', synergy: 'DRILL',
        sprite: { template: 'NOTEBOOK', color: '#1e40af', highlight: '#60a5fa' },
        animType: 'BLAST'
    },
    FOUNTAIN_PEN: { 
        id: 'FOUNTAIN_PEN', name: '万年筆', desc: 'インクの跡を残す', 
        evolvedName: 'インクの海', evolvedDesc: '敵を溺れさせる巨大インク溜まり', synergy: 'MAGNET',
        sprite: { template: 'SWORD', color: '#000000', highlight: '#424242' },
        animType: 'SPLATTER'
    },
    SCHOOL_CHIME: { 
        id: 'SCHOOL_CHIME', name: '学校のチャイム', desc: '音圧リングで攻撃', 
        evolvedName: '終焉の鐘', evolvedDesc: '画面中の敵の魂を削る', synergy: 'TEXTBOOK',
        sprite: { template: 'HAND_BELL', color: '#fbbf24', highlight: '#ffffff' },
        animType: 'CIRCLE'
    },
    TRUMPET: { 
        id: 'TRUMPET', name: 'トランペット', desc: '前方に音の壁', 
        evolvedName: '凱旋のファンファーレ', evolvedDesc: '敵を消し飛ばす黄金の波動', synergy: 'ORIGAMI',
        sprite: { template: 'TRUMPET', color: '#fbbf24', highlight: '#fef3c7' },
        animType: 'BEAM'
    },
    CLAY: { 
        id: 'CLAY', name: '図工の粘土', desc: '粘着弾を投げる', 
        evolvedName: 'クレイ・ゴーレム', evolvedDesc: '敵を拘束し続ける巨人の手', synergy: 'MILK',
        sprite: { template: 'SLIME', color: '#8d6e63', highlight: '#d7ccc8' },
        animType: 'PROJECTILE'
    },
    BROADCAST_MIC: { 
        id: 'BROADCAST_MIC', name: '放送用マイク', desc: '広範囲にエコー攻撃', 
        evolvedName: '神の宣告', evolvedDesc: '敵を跪かせる聖なる叫び', synergy: 'ABACUS',
        sprite: { template: 'MIC', color: '#475569', highlight: '#94a3b8' },
        animType: 'CIRCLE'
    }
};

const PASSIVES: Record<PassiveType, PassiveDef> = {
    PROTEIN: { id: 'PROTEIN', name: 'ムキムキプロテイン', desc: 'ダメージ +15%', sprite: { template: 'MUSCLE', color: '#ef4444', highlight: '#fca5a5' } },
    DRILL: { id: 'DRILL', name: '計算ドリル', desc: 'クールダウン -8%', sprite: { template: 'NOTEBOOK', color: '#fcd34d', highlight: '#fef08a' } },
    PROTRACTOR: { id: 'PROTRACTOR', name: '分度器', desc: '攻撃範囲 +15%', sprite: { template: 'SHIELD', color: '#60a5fa', highlight: '#bfdbfe' } },
    SHOES: { id: 'SHOES', name: '瞬足シューズ', desc: '移動速度 +12%', sprite: { template: 'SHOE', color: '#3b82f6', highlight: '#93c5fd' } },
    PAD: { id: 'PAD', name: '硬い下敷き', desc: '被ダメ -2', sprite: { template: 'SHIELD', color: '#a855f7', highlight: '#d8b4fe' } },
    LUNCHBOX: { id: 'LUNCHBOX', name: '早弁セット', desc: '弾速 +15%', sprite: { template: 'BACKPACK', color: '#f97316', highlight: '#fdba74' } },
    MAGNET: { id: 'MAGNET', name: 'U字磁石', desc: '回収範囲大幅拡大', sprite: { template: 'SHIELD', color: '#ef4444', highlight: '#d1d5db' } }, 
    TEXTBOOK: { id: 'TEXTBOOK', name: '教科書', desc: '効果時間 +15%', sprite: { template: 'NOTEBOOK', color: '#22c55e', highlight: '#86efac' } },
    ABACUS: { id: 'ABACUS', name: 'そろばん', desc: '発射数 +1', sprite: { template: 'NOTEBOOK', color: '#78350f', highlight: '#b45309' } },
    CONSOLE: { id: 'CONSOLE', name: 'ゲーム機', desc: 'クリティカル率UP', sprite: { template: 'ROBOT', color: '#4b5563', highlight: '#9ca3af' } },
    MILK: { id: 'MILK', name: '牛乳', desc: 'HP自然回復量UP', sprite: { template: 'POTION', color: '#ffffff', highlight: '#e5e7eb' } },
    ORIGAMI: { id: 'ORIGAMI', name: '金ピカ折り紙', desc: '獲得ゴールド+20%', sprite: { template: 'FLIER', color: '#eab308', highlight: '#fef08a' } },
};

interface Entity {
    id: number;
    x: number;
    y: number;
    type: string;
    width: number;
    height: number;
    hp: number;
    maxHp: number;
    speed: number;
    damage: number;
    vx: number;
    vy: number;
    dead: boolean;
    flashTime: number;
    frozen?: number;
    knockback?: { x: number, y: number, time: number };
    knockbackImmune?: boolean; 
    defense?: number; 
}

interface Projectile {
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    damage: number;
    type: WeaponType | 'EVOLVED';
    subType?: WeaponType; 
    duration: number;
    maxDuration: number;
    penetration: number;
    rotation: number;
    scale: number;
    knockback: number;
    hitIds: number[]; 
    speed?: number;
    swingAngle?: number;
}

interface Gem {
    id: number;
    x: number;
    y: number;
    value: number;
    collected: boolean;
}

interface DamageText {
    id: number;
    x: number;
    y: number;
    value: number | string;
    color: string;
    life: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;
    type: 'SPARK' | 'SMOKE' | 'BUBBLE' | 'SLASH_TRACE' | 'RING' | 'GLOW' | 'RAINBOW';
    scale?: number;
}

interface MathChallengeScreenProps {
  onComplete: (correctCount: number) => void;
  mode: GameMode;
  debugSkip?: boolean;
  isChallenge?: boolean;
  streak?: number;
}

interface SchoolyardSurvivorScreenProps {
    onBack: () => void;
}

// --- UTILS ---
const createFlashSprite = (source: HTMLCanvasElement): HTMLCanvasElement => {
    const c = document.createElement('canvas');
    c.width = source.width;
    c.height = source.height;
    const ctx = c.getContext('2d');
    if (ctx) {
        ctx.drawImage(source, 0, 0);
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, c.width, c.height);
    }
    return c;
};

const createSchoolyardBackground = (): HTMLCanvasElement => {
    const c = document.createElement('canvas');
    c.width = WORLD_WIDTH;
    c.height = WORLD_HEIGHT;
    const ctx = c.getContext('2d');
    if (!ctx) return c;
    ctx.fillStyle = '#5d4037'; 
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    for (let i = 0; i < 4000; i++) {
        const x = Math.random() * WORLD_WIDTH;
        const y = Math.random() * WORLD_HEIGHT;
        const size = Math.random() * 4 + 1;
        const type = Math.random();
        if (type < 0.6) ctx.fillStyle = '#4e342e'; 
        else if (type < 0.9) ctx.fillStyle = '#8d6e63';
        else ctx.fillStyle = '#33691e';
        ctx.fillRect(x, y, size, size);
    }
    return c;
};

const SchoolyardSurvivorScreen: React.FC<SchoolyardSurvivorScreenProps> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
    
    const [viewSize, setViewSize] = useState({ width: 800, height: 600 });
    const viewSizeRef = useRef({ width: 800, height: 600 }); 
    const camera = useRef({ x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2 }); 

    const gameState = useRef<'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LEVEL_UP' | 'MATH_CHALLENGE'>('PLAYING');
    const player = useRef<Entity>({ id: 0, x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2, type: 'WARRIOR', width: 24, height: 24, hp: 100, maxHp: 100, speed: PLAYER_SPEED, damage: 0, vx: 0, vy: 0, dead: false, flashTime: 0 });
    const enemies = useRef<Entity[]>([]);
    const projectiles = useRef<Projectile[]>([]);
    const gems = useRef<Gem[]>([]);
    const damageTexts = useRef<DamageText[]>([]);
    const particles = useRef<Particle[]>([]);
    
    const frameCount = useRef(0);
    const score = useRef(0);
    const time = useRef(0);
    const level = useRef(1);
    const xp = useRef(0);
    const nextLevelXp = useRef(BASE_XP_REQUIREMENT);
    const shakeAmount = useRef(0);
    const frameRequestRef = useRef<number | null>(null);
    const lastLoopTimeRef = useRef<number | null>(null);
    const accumulatorRef = useRef(0);
    const isLoopActiveRef = useRef(false);
    const activeTimeouts = useRef<number[]>([]); 

    const [weapons, setWeapons] = useState<Record<WeaponType, { level: number, cooldownTimer: number } | undefined>>(() => {
        const initial: any = {};
        Object.keys(WEAPONS).forEach(k => initial[k] = undefined);
        initial.PENCIL = { level: 1, cooldownTimer: 0 };
        return initial;
    });
    const [passives, setPassives] = useState<Record<PassiveType, number>>({
        PROTEIN: 0, DRILL: 0, PROTRACTOR: 0, SHOES: 0, PAD: 0, LUNCHBOX: 0,
        MAGNET: 0, TEXTBOOK: 0, ABACUS: 0, CONSOLE: 0, MILK: 0, ORIGAMI: 0
    });

    const [upgradeOptions, setUpgradeOptions] = useState<any[]>([]);
    const [uiState, setUiState] = useState({ hp: 100, maxHp: 100, level: 1, time: 0, score: 0, xpPercent: 0, gameOver: false });

    const keys = useRef<Record<string, boolean>>({});
    const joystickRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const [joystickUI, setJoystickUI] = useState<{ active: boolean, startX: number, startY: number, curX: number, curY: number } | null>(null);
    const spriteCache = useRef<Record<string, HTMLCanvasElement>>({});
    const lastDir = useRef<{x:number, y:number}>({x:1, y:0}); 

    useLayoutEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const w = containerRef.current.clientWidth;
                const h = containerRef.current.clientHeight;
                setViewSize({ width: w, height: h });
                viewSizeRef.current = { width: w, height: h };
            }
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const generateFromTemplate = (templateName: string, mainColor: string, highlightColor: string): HTMLCanvasElement => {
        const template = SPRITE_TEMPLATES[templateName] || SPRITE_TEMPLATES['SLIME'];
        const size = 16;
        const scale = 2; 
        const c = document.createElement('canvas');
        c.width = size * scale;
        c.height = size * scale;
        const ctx = c.getContext('2d');
        if(!ctx) return c;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const char = template[y][x];
                if (char === '.') continue;
                ctx.fillStyle = char === '%' ? highlightColor : (char === '@' ? 'black' : mainColor);
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
        return c;
    };

    const stopSurvivorAudio = () => {
        audioService.stopAllAudio();
    };

    const handleExit = () => {
        stopSurvivorAudio();
        clearAllTimeouts();
        onBack();
    };

    useEffect(() => {
        audioService.playBGM('survivor_metal');
        bgCanvasRef.current = createSchoolyardBackground();
        const playerImg = new Image();
        playerImg.src = HERO_IMAGE_DATA;
        playerImg.onload = () => {
             const c = document.createElement('canvas'); c.width = 32; c.height = 32;
             const ctx = c.getContext('2d');
             if(ctx) { ctx.drawImage(playerImg, 0, 0, 32, 32); spriteCache.current['PLAYER'] = c; spriteCache.current['PLAYER_FLASH'] = createFlashSprite(c); }
        };

        const sprites = {
            'ENEMY_1': ['SLIME', '#3b82f6', '#60a5fa'],
            'ENEMY_2': ['BAT', '#a855f7', '#c084fc'],
            'ENEMY_3': ['SKELETON', '#e5e7eb', '#f3f4f6'],
            'ENEMY_4': ['GHOST', '#a5f3fc', '#cffafe'],
            'ENEMY_5': ['ROBOT', '#6b7280', '#9ca3af'],
            'ENEMY_6': ['TEACHER', '#ef4444', '#fca5a5'],
            'ENEMY_7': ['GOLEM', '#94a3b8', '#cbd5e1'], 
        };
        Object.entries(sprites).forEach(([key, [t, c1, c2]]) => {
            const s = generateFromTemplate(t, c1, c2);
            spriteCache.current[key] = s;
            spriteCache.current[`${key}_FLASH`] = createFlashSprite(s);
        });
        Object.values(WEAPONS).forEach(w => {
            spriteCache.current[w.id] = generateFromTemplate(w.sprite.template, w.sprite.color, w.sprite.highlight);
        });
        spriteCache.current['GEM'] = generateFromTemplate('EYE', '#eab308', '#fde047');

        isLoopActiveRef.current = true;
        const loop = (now: number) => {
            if (!isLoopActiveRef.current) return;
            if (lastLoopTimeRef.current === null) {
                lastLoopTimeRef.current = now;
            }
            const delta = Math.min(100, now - lastLoopTimeRef.current);
            lastLoopTimeRef.current = now;
            accumulatorRef.current += delta;

            while (accumulatorRef.current >= FIXED_STEP_MS) {
                if (gameState.current === 'PLAYING') {
                    try {
                        update();
                    } catch (e) {
                        console.error("Update loop error", e);
                    }
                }
                accumulatorRef.current -= FIXED_STEP_MS;
            }

            try {
                draw();
            } catch (e) {
                console.error("Draw loop error", e);
            }
            frameRequestRef.current = requestAnimationFrame(loop);
        };
        frameRequestRef.current = requestAnimationFrame(loop);
        const handleKeyDown = (e: KeyboardEvent) => keys.current[e.code] = true;
        const handleKeyUp = (e: KeyboardEvent) => keys.current[e.code] = false;
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            isLoopActiveRef.current = false;
            if (frameRequestRef.current !== null) {
                cancelAnimationFrame(frameRequestRef.current);
                frameRequestRef.current = null;
            }
            lastLoopTimeRef.current = null;
            accumulatorRef.current = 0;
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            stopSurvivorAudio();
            clearAllTimeouts();
        };
    }, []); 

    const weaponsRef = useRef(weapons);
    useEffect(() => { weaponsRef.current = weapons; }, [weapons]);
    const passivesRef = useRef(passives);
    useEffect(() => { passivesRef.current = passives; }, [passives]);

    const saveRecord = () => {
        try {
            const ownedWeapons = (Object.keys(weaponsRef.current) as WeaponType[]).filter(k => weaponsRef.current[k] !== undefined);
            storageService.saveSurvivorScore({
                id: `survivor-${Date.now()}`,
                date: Date.now(),
                score: Math.floor(scoreRef.current),
                timeSurvived: time.current,
                levelReached: level.current,
                weapons: ownedWeapons
            });
        } catch (e) {
            console.error("Failed to save record", e);
        }
    };

    const handleMathComplete = (correctCount: number) => {
        if (correctCount >= 3) { 
            const healAmount = 15;
            player.current.hp = Math.min(player.current.maxHp, player.current.hp + healAmount);
            damageTexts.current.push({ id: Math.random(), x: player.current.x, y: player.current.y - 30, value: `+${healAmount} HP`, color: 'green', life: 60 });
            audioService.playSound('buff');
        }
        generateUpgrades();
        gameState.current = 'LEVEL_UP';
        audioService.playBGM('survivor_metal'); 
        audioService.playSound('win'); 
        setUiState(prev => ({ ...prev })); 
    };

    const addParticle = (x: number, y: number, type: Particle['type'], color: string, options: Partial<Particle> = {}) => {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3 + 1;
        particles.current.push({
            id: Math.random(),
            x, y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            size: Math.random() * 4 + 2,
            color,
            life: 30,
            maxLife: 30,
            type,
            ...options
        });
    };

    const clearAllTimeouts = () => {
        activeTimeouts.current.forEach(id => window.clearTimeout(id));
        activeTimeouts.current = [];
    };

    const update = () => {
        if (gameState.current !== 'PLAYING') return;

        frameCount.current++;
        if (frameCount.current % 60 === 0) {
            time.current++;
            if (passivesRef.current.MILK > 0) {
                player.current.hp = Math.min(player.current.maxHp, player.current.hp + passivesRef.current.MILK);
            }
            setUiState(prev => ({ ...prev, time: time.current, hp: player.current.hp }));
        }

        const might = 1 + (passivesRef.current.PROTEIN * 0.15);
        const cooldownReduc = 1 - (passivesRef.current.DRILL * 0.08);
        const area = 1 + (passivesRef.current.PROTRACTOR * 0.15);
        const speed = 1 + (passivesRef.current.SHOES * 0.12);
        const defense = passivesRef.current.PAD * 2;
        const projSpeed = 1 + (passivesRef.current.LUNCHBOX * 0.15);
        const magnet = 60 + (passivesRef.current.MAGNET * 30);
        const duration = 1 + (passivesRef.current.TEXTBOOK * 0.15);
        const amount = passivesRef.current.ABACUS;
        const luck = 1 + (passivesRef.current.CONSOLE * 0.15);

        let dx = 0; let dy = 0;
        if (keys.current['ArrowUp'] || keys.current['KeyW']) dy = -1;
        if (keys.current['ArrowDown'] || keys.current['KeyS']) dy = 1;
        if (keys.current['ArrowLeft'] || keys.current['KeyA']) dx = -1;
        if (keys.current['ArrowRight'] || keys.current['KeyD']) dx = 1;
        if (joystickRef.current.x !== 0 || joystickRef.current.y !== 0) { dx = joystickRef.current.x; dy = joystickRef.current.y; }
        
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx*dx + dy*dy);
            if (len > 0) { dx /= len; dy /= len; }
            lastDir.current = { x: dx, y: dy };
        }

        player.current.x += dx * player.current.speed * speed;
        player.current.y += dy * player.current.speed * speed;
        player.current.x = Math.max(16, Math.min(WORLD_WIDTH - 16, player.current.x));
        player.current.y = Math.max(16, Math.min(WORLD_HEIGHT - 16, player.current.y));
        if (player.current.flashTime > 0) player.current.flashTime--;

        const vw = viewSizeRef.current.width / ZOOM_SCALE;
        const vh = viewSizeRef.current.height / ZOOM_SCALE;
        camera.current.x = vw >= WORLD_WIDTH ? WORLD_WIDTH / 2 : Math.max(vw/2, Math.min(WORLD_WIDTH - vw/2, player.current.x));
        camera.current.y = vh >= WORLD_HEIGHT ? WORLD_HEIGHT / 2 : Math.max(vh/2, Math.min(WORLD_HEIGHT - vh/2, player.current.y));

        Object.keys(weaponsRef.current).forEach((key) => {
            const wType = key as WeaponType;
            const wData = weaponsRef.current[wType];
            if (!wData) return;
            wData.cooldownTimer--;
            if (wData.cooldownTimer <= 0) {
                const isEvolved = wData.level >= 8 && passivesRef.current[WEAPONS[wType].synergy] > 0;
                const dmg = 10 * wData.level * might;
                const levelScale = 0.7 + (wData.level * 0.15); 
                const sz = levelScale * area;
                const spd = 5 * projSpeed;
                fireWeapon(wType, wData.level, isEvolved, dmg, sz, spd, duration, amount, luck);
                let baseCd = 60;
                if (['ERASER', 'LUNCH_TRAY', 'PRISM'].includes(wType)) baseCd = 100;
                else if (['RULER', 'COMPASS', 'TROWEL'].includes(wType)) baseCd = 40;
                else if (['HIGHLIGHTER', 'FOUNTAIN_PEN'].includes(wType)) baseCd = 12; 
                else if (['STAPLER', 'BASKETBALL'].includes(wType)) baseCd = 45;
                else if (['RECORDER', 'HAND_BELL', 'SCHOOL_CHIME', 'BROADCAST_MIC'].includes(wType)) baseCd = 180;
                wData.cooldownTimer = Math.max(5, baseCd * Math.pow(0.9, wData.level-1) * cooldownReduc);
            }
        });

        enemies.current.forEach(e => {
            if (e.knockback && e.knockback.time > 0) {
                e.x += e.knockback.x; e.y += e.knockback.y;
                e.knockback.time--;
            } else {
                const angle = Math.atan2(player.current.y - e.y, player.current.x - e.x);
                e.x += Math.cos(angle) * e.speed; e.y += Math.sin(angle) * e.speed;
            }
            const dist = Math.hypot(e.x - player.current.x, e.y - player.current.y);
            if (dist < 20 && player.current.flashTime <= 0) {
                const finalDmg = Math.max(1, e.damage - defense);
                player.current.hp -= finalDmg;
                player.current.flashTime = 30;
                damageTexts.current.push({ id: Math.random(), x: player.current.x, y: player.current.y - 20, value: `-${Math.floor(finalDmg)}`, color: 'red', life: 60 });
                if (player.current.hp <= 0 && gameState.current === 'PLAYING') { 
                    stopSurvivorAudio();
                    gameState.current = 'GAME_OVER'; 
                    saveRecord(); 
                    setUiState(prev => ({ ...prev, gameOver: true, hp: 0 })); 
                    audioService.playSound('lose');
                    clearAllTimeouts(); 
                }
            }
            if (e.flashTime > 0) e.flashTime--;
        });

        if (gameState.current !== 'PLAYING') return;

        for (let i = projectiles.current.length - 1; i >= 0; i--) {
            const p = projectiles.current[i];
            p.duration--;
            
            if (frameCount.current % 3 === 0) {
                if (['PENCIL', 'PAPER_PLANE_S', 'TRIANGLE_RULER_S', 'EVOLVED'].includes(p.type)) {
                    addParticle(p.x, p.y, 'SMOKE', 'rgba(255,255,255,0.3)', { size: 2 * p.scale, life: 15 });
                }
                if (p.type === 'TAPE') {
                    addParticle(p.x, p.y, 'SMOKE', 'rgba(255,255,255,0.5)', { size: 4 * p.scale, life: 10 });
                }
                if (p.type === 'PRISM') {
                    const hue = (frameCount.current * 10) % 360;
                    addParticle(p.x, p.y, 'RAINBOW', `hsla(${hue}, 100%, 70%, 0.5)`, { size: 5 * p.scale, life: 20 });
                }
            }

            if (p.type === 'ERASER' || p.subType === 'ERASER' || p.type === 'LUNCH_TRAY' || p.subType === 'LUNCH_TRAY') {
                const t = frameCount.current * 0.05 + (p.id * 10);
                const radius = 70 * p.scale;
                p.x = player.current.x + Math.cos(t) * radius;
                p.y = player.current.y + Math.sin(t) * radius;
            } else if (p.type === 'GLOBE' || p.subType === 'GLOBE') {
                const t = frameCount.current * 0.03 + (p.id * 5);
                const radius = 100 * p.scale;
                p.x = player.current.x + Math.cos(t) * radius;
                p.y = player.current.y + Math.sin(t) * radius;
                addParticle(p.x, p.y, 'GLOW', 'rgba(100,100,255,0.2)', { life: 15, size: 8 * p.scale });
            } else if (p.type === 'JUMP_ROPE' || p.subType === 'JUMP_ROPE') {
                const t = frameCount.current * 0.15;
                const radius = 120 * p.scale;
                p.x = player.current.x + Math.cos(t) * radius;
                p.y = player.current.y + Math.sin(t) * radius;
                p.rotation = t;
                addParticle(p.x, p.y, 'SPARK', '#facc15', { life: 10, size: 2 * p.scale });
            } else if (p.type === 'MAGNET_U' || p.subType === 'MAGNET_U') {
                const radius = 150 * p.scale;
                enemies.current.forEach(e => {
                    const d = Math.hypot(e.x - player.current.x, e.y - player.current.y);
                    if (d < radius) {
                        e.x += (player.current.x - e.x) * 0.05;
                        e.y += (player.current.y - e.y) * 0.05;
                    }
                });
                p.x = player.current.x; p.y = player.current.y;
                if (frameCount.current % 15 === 0) addParticle(p.x, p.y, 'RING', '#ef4444', { scale: p.scale });
            } else if (p.type === 'HIGHLIGHTER') {
                p.x = player.current.x + Math.cos(p.rotation) * 40; 
                p.y = player.current.y + Math.sin(p.rotation) * 40;
            } else if (p.type === 'TRUMPET') {
                p.x = player.current.x; p.y = player.current.y;
            } else if (p.type === 'PAPER_PLANE_S' || p.subType === 'PAPER_PLANE_S') {
                const wave = Math.sin(frameCount.current * 0.2) * 5;
                const perpX = -p.dy; const perpY = p.dx;
                p.x += p.dx; p.y += p.dy;
                p.x += perpX * 0.1 * wave; p.y += perpY * 0.1 * wave;
            } else if (p.type === 'UWABAKI') {
                let target = null; let maxHp = -1;
                enemies.current.forEach(e => { 
                    if(Math.abs(e.x - p.x) < 400 && Math.abs(e.y - p.y) < 300) {
                        if(e.hp > maxHp){ maxHp = e.hp; target = e; } 
                    }
                });
                if (target) {
                    const angle = Math.atan2((target as Entity).y - p.y, (target as Entity).x - p.x);
                    p.dx = Math.cos(angle) * (p.speed || 0); p.dy = Math.sin(angle) * (p.speed || 0);
                }
                p.x += p.dx; p.y += p.dy;
            } else if (['CURRY', 'ART_BRUSH', 'CHALK_SMOKE', 'GLUE_STICK', 'FOUNTAIN_PEN', 'CLAY'].includes(p.type as string)) {
                if (frameCount.current % 10 === 0) {
                    const color = p.type === 'CURRY' ? '#f97316' : (p.type === 'ART_BRUSH' ? '#f43f5e' : (p.type === 'GLUE_STICK' ? '#60a5fa' : (p.type === 'FOUNTAIN_PEN' ? '#000000' : '#ffffff')));
                    addParticle(p.x + (Math.random()-0.5)*40*p.scale, p.y + (Math.random()-0.5)*40*p.scale, 'BUBBLE', color, { size: 4 * p.scale, life: 20, vy: -1 });
                }
            } else if (WEAPONS[p.type as WeaponType]?.animType === 'SWING' || WEAPONS[p.subType as WeaponType]?.animType === 'SWING') {
                p.x = player.current.x;
                p.y = player.current.y;
            } else if (WEAPONS[p.type as WeaponType]?.animType === 'STAB' || WEAPONS[p.subType as WeaponType]?.animType === 'STAB') {
                const shift = Math.sin(frameCount.current * 0.8) * 30 * p.scale;
                p.x = player.current.x + Math.cos(p.rotation) * (40 * p.scale + shift);
                p.y = player.current.y + Math.sin(p.rotation) * (40 * p.scale + shift);
            } else if (['RECORDER', 'HAND_BELL', 'WHISTLE_S', 'SCHOOL_CHIME', 'BROADCAST_MIC', 'BASKETBALL', 'DUSTER'].includes(p.type as string)) {
                p.x = player.current.x; p.y = player.current.y;
                if (frameCount.current % 20 === 0) {
                    const ringCol = (p.type === 'DUSTER') ? 'gray' : (p.type === 'BROADCAST_MIC' ? '#818cf8' : 'white');
                    addParticle(p.x, p.y, 'RING', ringCol, { scale: p.scale });
                }
            } else {
                p.x += p.dx; p.y += p.dy;
                if (p.type === 'SOCCER') {
                    if (p.x < 0 || p.x > WORLD_WIDTH) { p.dx *= -1; addParticle(p.x, p.y, 'SMOKE', 'white', {size: 8 * p.scale}); }
                    if (p.y < 0 || p.y > WORLD_HEIGHT) { p.dy *= -1; addParticle(p.x, p.y, 'SMOKE', 'white', {size: 8 * p.scale}); }
                }
            }

            let hit = false;
            for (const e of enemies.current) {
                if (p.hitIds.includes(e.id)) continue;
                if (Math.abs(p.x - e.x) > 200 || Math.abs(p.y - e.y) > 200) continue;
                
                let inRange = false;
                const dist = Math.hypot(p.x - e.x, p.y - e.y);

                const animType = WEAPONS[p.type as WeaponType]?.animType || WEAPONS[p.subType as WeaponType]?.animType;

                if (animType === 'SWING') {
                    const range = (p.type === 'CUTTER' || p.subType === 'CUTTER') ? 60 * p.scale : (p.type === 'PROTRACTOR_SWING' || p.subType === 'PROTRACTOR_SWING' ? 90 * p.scale : 100 * p.scale);
                    if (dist < range) {
                        const angleToEnemy = Math.atan2(e.y - p.y, e.x - p.x);
                        let diff = angleToEnemy - p.rotation;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        
                        const arcWidth = (p.type === 'CUTTER' || p.subType === 'CUTTER') ? Math.PI * 0.6 : Math.PI * 1.2;
                        if (Math.abs(diff) < arcWidth / 2) inRange = true;
                    }
                } else if (animType === 'STAB') {
                    if (dist < 50 * p.scale) inRange = true;
                } else if (animType === 'BLAST' || animType === 'CIRCLE') {
                    const blastRange = p.type === 'BROADCAST_MIC' ? 250 : 150;
                    if (dist < blastRange * p.scale) inRange = true;
                } else if (animType === 'BEAM' || p.type === 'TRUMPET') {
                    const angleToEnemy = Math.atan2(e.y - p.y, e.x - p.x);
                    let diff = angleToEnemy - p.rotation;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    const coneWidth = p.type === 'TRUMPET' ? Math.PI * 0.4 : 0.2;
                    if (Math.abs(diff) < coneWidth && dist < 1000) inRange = true;
                } else if (animType === 'RAINBOW') {
                    inRange = true; 
                } else {
                    const range = (p.type === 'RECORDER' || p.type === 'FLASK' || p.type === 'DICTIONARY') ? 60 : 20;
                    if (dist < range * p.scale) inRange = true;
                }

                if (inRange) {
                    if (['HIGHLIGHTER', 'CURRY', 'MAGNIFIER', 'ART_BRUSH', 'CHALK_SMOKE', 'GLUE_STICK', 'HAND_BELL', 'WHISTLE_S', 'MAGNET_U', 'JUMP_ROPE', 'FOUNTAIN_PEN', 'CLAY', 'PRISM', 'SCHOOL_CHIME', 'BROADCAST_MIC', 'DUSTER'].includes(p.type as string) || ['HIGHLIGHTER', 'CURRY', 'MAGNIFIER', 'ART_BRUSH', 'CHALK_SMOKE', 'GLUE_STICK', 'HAND_BELL', 'WHISTLE_S', 'MAGNET_U', 'JUMP_ROPE', 'FOUNTAIN_PEN', 'CLAY', 'PRISM', 'SCHOOL_CHIME', 'BROADCAST_MIC', 'DUSTER'].includes(p.subType as string)) {
                        if (frameCount.current % 10 === 0) applyDamage(e, p);
                    } else {
                        applyDamage(e, p);
                        p.penetration--; if (p.penetration <= 0) hit = true;
                    }
                    if (p.type === 'SOCCER') {
                        p.dx = (Math.random() - 0.5) * (p.speed || 0) * 2;
                        p.dy = (Math.random() - 0.5) * (p.speed || 0) * 2;
                        addParticle(p.x, p.y, 'SMOKE', 'white', {size: 10 * p.scale, life: 10});
                    }
                    if (['TAPE', 'GLUE_STICK', 'CLAY'].includes(p.type as string)) { e.frozen = 60; }
                }
            }
            if (hit || p.duration <= 0) projectiles.current.splice(i, 1);
        }

        const spawnRate = Math.max(5, 60 - Math.floor(time.current / 5));
        if (frameCount.current % spawnRate === 0) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 600; 
            const ex = player.current.x + Math.cos(angle) * dist;
            const ey = player.current.y + Math.sin(angle) * dist;
            const clampX = Math.max(0, Math.min(WORLD_WIDTH, ex));
            const clampY = Math.max(0, Math.min(WORLD_HEIGHT, ey));
            const timeSec = time.current;
            let enemyType = 'ENEMY_1'; let hp = 10; let speed = 1; let width = 24; let height = 24;
            let knockbackImmune = false;
            let defense = 0;

            if (timeSec < 30) { hp = 10; speed = 1 + Math.random() * 0.5; }
            else if (timeSec < 60) { enemyType = Math.random() < 0.5 ? 'ENEMY_1' : 'ENEMY_2'; hp = 15; speed = enemyType === 'ENEMY_2' ? 2.5 : 1.5; }
            else if (timeSec < 120) { enemyType = Math.random() < 0.4 ? 'ENEMY_2' : 'ENEMY_3'; hp = enemyType === 'ENEMY_3' ? 35 : 20; speed = 1.5; }
            else if (timeSec < 180) { 
                const r = Math.random(); 
                if (r < 0.2) { enemyType = 'ENEMY_7'; hp = 120; speed = 0.6; knockbackImmune = true; defense = 2; width = 48; height = 48; } 
                else { enemyType = r < 0.5 ? 'ENEMY_3' : (r < 0.7 ? 'ENEMY_4' : 'ENEMY_5'); hp = 50; speed = enemyType === 'ENEMY_5' ? 3.5 : 1.5; }
            }
            else { 
                const r = Math.random(); 
                if (r < 0.05) { enemyType = 'ENEMY_6'; hp = 400 + (timeSec - 180) * 5; speed = 0.8; width = 48; height = 48; knockbackImmune = true; } 
                else if (r < 0.2) { enemyType = 'ENEMY_7'; hp = 200; speed = 0.5; knockbackImmune = true; defense = 5; width = 52; height = 52; }
                else if (r < 0.4) { enemyType = 'ENEMY_5'; hp = 80; speed = 3.5; knockbackImmune = Math.random() < 0.3; } 
                else { enemyType = 'ENEMY_4'; hp = 70; speed = 2.5; } 
            }
            
            enemies.current.push({ 
                id: Math.random(), x: clampX, y: clampY, type: enemyType, 
                width: width, height: height, hp: hp, maxHp: hp, speed: speed, 
                damage: 5 + Math.floor(timeSec/60), vx: 0, vy: 0, dead: false, 
                flashTime: 0, knockbackImmune, defense
            });
        }

        enemies.current = enemies.current.filter(e => !e.dead);
        for (let i = gems.current.length - 1; i >= 0; i--) {
            const g = gems.current[i];
            const dist = Math.hypot(g.x - player.current.x, g.y - player.current.y);
            if (dist < magnet) { g.x += (player.current.x - g.x) * 0.1; g.y += (player.current.y - g.y) * 0.1; }
            if (dist < 20) {
                xp.current += g.value; gems.current.splice(i, 1);
                if (xp.current >= nextLevelXp.current) { gameState.current = 'MATH_CHALLENGE'; xp.current -= nextLevelXp.current; level.current++; nextLevelXp.current = Math.floor(nextLevelXp.current * 1.25); audioService.playSound('select'); }
                setUiState(prev => ({ ...prev, level: level.current, xpPercent: (xp.current/nextLevelXp.current)*100 }));
            }
        }

        damageTexts.current.forEach(d => { d.y -= 1; d.life--; });
        damageTexts.current = damageTexts.current.filter(d => d.life > 0);
        
        particles.current.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.type === 'BUBBLE') p.vx += (Math.random()-0.5)*0.2;
            if (['RING', 'GLOW', 'RAINBOW'].includes(p.type)) { p.size += 2; }
            p.life--;
        });
        particles.current = particles.current.filter(p => p.life > 0);
        if (shakeAmount.current > 0) shakeAmount.current *= 0.85;

        if (frameCount.current % 10 === 0) {
            setUiState(prev => ({ ...prev, hp: player.current.hp }));
        }
    };

    const applyDamage = (e: Entity, p: Projectile) => {
        let dmg = Math.max(1, p.damage - (e.defense || 0));
        const isCrit = Math.random() < (0.05 * (passivesRef.current.CONSOLE ? 2 : 1));
        if (isCrit) {
            dmg *= 2.5;
            damageTexts.current.push({ id: Math.random(), x: e.x, y: e.y-15, value: `${Math.floor(dmg)}!`, color: '#fbbf24', life: 50 });
            shakeAmount.current = 6;
        } else {
            damageTexts.current.push({ id: Math.random(), x: e.x, y: e.y-10, value: Math.floor(dmg), color: 'white', life: 35 });
        }
        
        e.hp -= dmg; e.flashTime = 5; p.hitIds.push(e.id);
        
        if (p.knockback > 0 && !e.knockbackImmune) {
            const angle = Math.atan2(e.y - p.y, e.x - p.x);
            e.knockback = { x: Math.cos(angle)*p.knockback, y: Math.sin(angle)*p.knockback, time: 5 };
        } else if (p.knockback > 0 && e.knockbackImmune) {
            damageTexts.current.push({ id: Math.random(), x: e.x + 10, y: e.y - 5, value: "!", color: '#94a3b8', life: 20 });
        }

        const sparkCount = isCrit ? 12 : 5;
        for(let i=0; i<sparkCount; i++) addParticle(e.x, e.y, 'SPARK', isCrit ? '#fbbf24' : (WEAPONS[p.type as WeaponType]?.sprite.color || 'white'), { life: 25, size: (isCrit ? 5 : 2.5) * p.scale });

        if (e.hp <= 0 && !e.dead) {
            e.dead = true; score.current += 15;
            const gemVal = e.type === 'ENEMY_6' || e.type === 'ENEMY_7' ? 10 : 1;
            if (Math.random() < 0.75) gems.current.push({ id: Math.random(), x: e.x, y: e.y, value: gemVal, collected: false });
            for(let i=0; i<15; i++) addParticle(e.x, e.y, 'SMOKE', 'rgba(120,120,120,0.6)', { size: (Math.random()*8+3) * p.scale, life: 50 });
            shakeAmount.current = 3;
        }
    };

    const fireWeapon = (type: WeaponType, level: number, evolved: boolean, dmg: number, scale: number, speed: number, duration: number, amount: number, luck: number) => {
        const p = player.current;
        const count = 1 + amount + Math.floor(level/3); 
        if (Math.random() < 0.3 && gameState.current === 'PLAYING') audioService.playSound('attack'); 
        
        const angleToMove = Math.atan2(lastDir.current.y, lastDir.current.x);

        switch (type) {
            case 'PENCIL':
                let target = null; let min = 9999;
                enemies.current.forEach(e => { const d = Math.hypot(e.x-p.x, e.y-p.y); if(d<min){ min=d; target=e; } });
                if (target) {
                    const angle = Math.atan2((target as Entity).y - p.y, (target as Entity).x - p.x);
                    const volleys = evolved ? 4 : 1; 
                    for(let v=0; v<volleys; v++) {
                        const id = window.setTimeout(() => {
                            if (gameState.current === 'PLAYING') {
                                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(angle + (Math.random()-0.5)*0.2) * speed * (evolved?2.5:1), dy: Math.sin(angle + (Math.random()-0.5)*0.2) * speed * (evolved?2.5:1), damage: dmg, type: evolved ? 'EVOLVED' : 'PENCIL', subType: 'PENCIL', duration: 60, maxDuration: 60, penetration: evolved ? 5 : 1 + Math.floor(level/4), rotation: angle, scale: scale, knockback: 2, hitIds: [] });
                            }
                        }, v * 80);
                        activeTimeouts.current.push(id);
                    }
                }
                break;
            case 'DICTIONARY':
                const dAngle = Math.random() * Math.PI * 2;
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(dAngle)*speed*0.6, dy: Math.sin(dAngle)*speed*0.6, damage: dmg*3, type: evolved ? 'EVOLVED' : 'DICTIONARY', subType: 'DICTIONARY', duration: 100, maxDuration: 100, penetration: 999, rotation: dAngle, scale: scale*2, knockback: 15, hitIds: [] });
                break;
            case 'ERASER':
            case 'LUNCH_TRAY':
                for (let i=0; i<count+2; i++) {
                    projectiles.current.push({ id: i, x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg, type: evolved ? 'EVOLVED' : type, subType: type as WeaponType, duration: 120 * duration, maxDuration: 120 * duration, penetration: 999, rotation: 0, scale: scale * (evolved?2:1), knockback: 6, hitIds: [] });
                }
                break;
            case 'PAPER_PLANE_S':
                for(let i=0; i<count; i++) {
                    const pAngle = angleToMove + (Math.random()-0.5)*0.8;
                    projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(pAngle)*speed*1.5, dy: Math.sin(pAngle)*speed*1.5, damage: dmg*0.7, type: evolved ? 'EVOLVED' : 'PAPER_PLANE_S', subType: 'PAPER_PLANE_S', duration: 100, maxDuration: 100, penetration: evolved?99:3, rotation: pAngle, scale: scale, knockback: 2, hitIds: [], speed: speed*1.5 });
                }
                break;
            case 'RULER':
            case 'MOP':
            case 'CUTTER':
            case 'PROTRACTOR_SWING':
            case 'SCISSORS':
                const swingCount = (type === 'SCISSORS' || evolved) ? 2 : 1;
                for(let s=0; s<swingCount; s++) {
                    const id = window.setTimeout(() => {
                        if (gameState.current === 'PLAYING') {
                            const offset = (s % 2 === 0) ? 0 : Math.PI;
                            projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg * (type==='CUTTER'?2.5:1), type: evolved ? 'EVOLVED' : type, subType: type, duration: 25, maxDuration: 25, penetration: 999, rotation: angleToMove + offset, scale: scale * 1.5, knockback: 10, hitIds: [] });
                        }
                    }, s * 150);
                    activeTimeouts.current.push(id);
                }
                break;
            case 'HIGHLIGHTER':
            case 'TRUMPET':
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg/4, type: evolved ? 'EVOLVED' : type, subType: type as WeaponType, duration: 40 * duration, maxDuration: 40 * duration, penetration: 999, rotation: angleToMove, scale: scale * (evolved?2.5:1), knockback: 0, hitIds: [] });
                break;
            case 'STAPLER':
                for(let i=0; i<count+3; i++) {
                    const id = window.setTimeout(() => {
                        if (gameState.current === 'PLAYING') {
                            const spread = evolved ? Math.PI * 2 * Math.random() : angleToMove + (Math.random()-0.5)*0.5;
                            projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(spread)*speed*2, dy: Math.sin(spread)*speed*2, damage: dmg*0.8, type: evolved ? 'EVOLVED' : 'STAPLER', subType: 'STAPLER', duration: 40, maxDuration: 40, penetration: 1, rotation: spread, scale: scale*0.5, knockback: 1, hitIds: [] });
                        }
                    }, i * 50);
                    activeTimeouts.current.push(id);
                }
                break;
            case 'GLOBE':
                for (let i=0; i<count+1; i++) {
                    projectiles.current.push({ id: i, x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg * 1.5, type: evolved ? 'EVOLVED' : 'GLOBE', subType: 'GLOBE', duration: 300 * duration, maxDuration: 300 * duration, penetration: 999, rotation: 0, scale: scale * 1.2, knockback: 15, hitIds: [] });
                }
                break;
            case 'MAGNET_U':
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg/5, type: evolved ? 'EVOLVED' : 'MAGNET_U', subType: 'MAGNET_U', duration: 150, maxDuration: 150, penetration: 999, rotation: 0, scale: scale, knockback: 0, hitIds: [] });
                break;
            case 'COMPASS_SPIKE':
            case 'STAPLE_REMOVER':
            case 'TROWEL':
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg*2, type: evolved ? 'EVOLVED' : type, subType: type as WeaponType, duration: 30, maxDuration: 30, penetration: 999, rotation: angleToMove, scale: scale, knockback: 5, hitIds: [] });
                break;
            case 'RECORDER':
            case 'HAND_BELL':
            case 'WHISTLE_S':
            case 'SCHOOL_CHIME':
            case 'BROADCAST_MIC':
            case 'BASKETBALL':
            case 'DUSTER':
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg, type: evolved ? 'EVOLVED' : type, subType: type as WeaponType, duration: 20, maxDuration: 20, penetration: 999, rotation: 0, scale: scale, knockback: 20, hitIds: [] });
                break;
            case 'SOCCER':
                for(let i=0; i<count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(angle)*speed, dy: Math.sin(angle)*speed, damage: dmg, type: evolved ? 'EVOLVED' : 'SOCCER', subType: 'SOCCER', duration: 150 * duration, maxDuration: 150 * duration, penetration: evolved ? 999 : 5 + Math.floor(level/2), rotation: 0, scale: scale, knockback: 8, hitIds: [], speed: speed });
                }
                break;
            case 'JUMP_ROPE':
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg, type: evolved ? 'EVOLVED' : 'JUMP_ROPE', subType: 'JUMP_ROPE', duration: 200, maxDuration: 200, penetration: 999, rotation: 0, scale: scale, knockback: 5, hitIds: [] });
                break;
            case 'TAPE':
                const tapeAngle = Math.random() * Math.PI * 2;
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(tapeAngle)*speed, dy: Math.sin(tapeAngle)*speed, damage: 5, type: evolved ? 'EVOLVED' : 'TAPE', subType: 'TAPE', duration: 100, maxDuration: 100, penetration: 999, rotation: tapeAngle, scale: scale*2, knockback: 0, hitIds: [] });
                break;
            case 'CHALK_SMOKE':
            case 'ART_BRUSH':
            case 'CURRY':
            case 'GLUE_STICK':
            case 'FOUNTAIN_PEN':
            case 'CLAY':
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg/8, type: evolved ? 'EVOLVED' : type, subType: type as WeaponType, duration: 400 * duration, maxDuration: 400 * duration, penetration: 999, rotation: 0, scale: scale * 2.2, knockback: 0, hitIds: [] });
                break;
            case 'PRISM':
                const prismCount = count + 4;
                for(let i=0; i<prismCount; i++) {
                    const rot = (Math.PI * 2 / prismCount) * i + (frameCount.current * 0.05);
                    projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: 0, dy: 0, damage: dmg/5, type: evolved ? 'EVOLVED' : 'PRISM', subType: 'PRISM', duration: 30 * duration, maxDuration: 30 * duration, penetration: 999, rotation: rot, scale: scale, knockback: 0, hitIds: [] });
                }
                break;
            default:
                const genAngle = Math.random() * Math.PI * 2;
                projectiles.current.push({ id: Math.random(), x: p.x, y: p.y, dx: Math.cos(genAngle)*speed, dy: Math.sin(genAngle)*speed, damage: dmg, type: evolved ? 'EVOLVED' : type, subType: type as WeaponType, duration: 60, maxDuration: 60, penetration: 1, rotation: genAngle, scale: scale, knockback: 2, hitIds: [] });
        }
    };

    const draw = () => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        const { width: viewW, height: viewH } = viewSizeRef.current;
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, viewW, viewH);
        ctx.save();
        
        if (shakeAmount.current > 0.1) {
            ctx.translate((Math.random()-0.5)*shakeAmount.current, (Math.random()-0.5)*shakeAmount.current);
        }

        ctx.translate(viewW/2, viewH/2);
        ctx.scale(ZOOM_SCALE, ZOOM_SCALE);
        ctx.translate(-camera.current.x, -camera.current.y);

        if (bgCanvasRef.current) ctx.drawImage(bgCanvasRef.current, 0, 0);

        gems.current.forEach(g => {
            if (Math.abs(g.x - camera.current.x) > (viewW/ZOOM_SCALE) || Math.abs(g.y - camera.current.y) > (viewH/ZOOM_SCALE)) return;
            const sprite = spriteCache.current['GEM'];
            if(sprite) ctx.drawImage(sprite, g.x-8, g.y-8, 16, 16);
        });

        projectiles.current.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            
            const weaponKey = p.type === 'EVOLVED' ? (p.subType || 'PENCIL') : p.type;
            const animType = WEAPONS[weaponKey as WeaponType]?.animType;

            if (animType === 'SWING') {
                const lifeRatio = p.duration / p.maxDuration;
                const arcWidth = (weaponKey === 'CUTTER') ? Math.PI * 0.7 : (weaponKey === 'PROTRACTOR_SWING' ? Math.PI * 1.6 : Math.PI * 1.3);
                const range = (weaponKey === 'CUTTER') ? 65 * p.scale : (weaponKey === 'PROTRACTOR_SWING' ? 95 * p.scale : 110 * p.scale);
                
                ctx.globalAlpha = lifeRatio;
                ctx.globalCompositeOperation = 'lighter';
                
                ctx.beginPath();
                ctx.arc(0, 0, range, -arcWidth/2, arcWidth/2);
                
                const grad = ctx.createRadialGradient(0,0, range * 0.3, 0,0, range);
                const baseCol = WEAPONS[weaponKey as WeaponType]?.sprite.color || 'white';
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(0.7, baseCol + '44');
                grad.addColorStop(1, 'white');
                
                ctx.strokeStyle = grad;
                ctx.lineWidth = ((weaponKey === 'MOP') ? 30 : 18) * p.scale; 
                ctx.lineCap = 'round';
                ctx.stroke();

                if (frameCount.current % 2 === 0) {
                    const sparkAngle = (Math.random() - 0.5) * arcWidth;
                    addParticle(p.x + Math.cos(p.rotation + sparkAngle) * range, p.y + Math.sin(p.rotation + sparkAngle) * range, 'SLASH_TRACE', baseCol, { life: 8, size: 3 * p.scale });
                }
                ctx.globalCompositeOperation = 'source-over';
            } else if (['HIGHLIGHTER', 'TRUMPET', 'PRISM'].includes(animType as string) || ['HIGHLIGHTER', 'TRUMPET', 'PRISM'].includes(weaponKey as string)) {
                const isEv = p.type === 'EVOLVED';
                const pulse = Math.sin(frameCount.current * 0.4) * 0.3 + 0.7;
                
                ctx.globalCompositeOperation = 'lighter';
                const grad = ctx.createLinearGradient(0, -25 * p.scale, 0, 25 * p.scale);
                
                if (weaponKey === 'PRISM') {
                    const hue = (frameCount.current * 15 + p.id * 50) % 360;
                    grad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0)`);
                    grad.addColorStop(0.5, `hsla(${hue}, 100%, 70%, ${0.5 * pulse})`);
                    grad.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);
                } else {
                    let rgb = isEv ? '255, 100, 255' : '200, 255, 100';
                    if (weaponKey === 'TRUMPET') rgb = '251, 191, 36';
                    grad.addColorStop(0, `rgba(${rgb}, 0)`);
                    grad.addColorStop(0.5, `rgba(${rgb}, ${0.5 * pulse})`);
                    grad.addColorStop(1, `rgba(${rgb}, 0)`);
                }
                
                ctx.fillStyle = grad;
                const beamLen = (weaponKey === 'TRUMPET') ? 300 * p.scale : 1000;
                ctx.fillRect(0, -25 * p.scale, beamLen, 50 * p.scale);
                ctx.fillStyle = 'white';
                ctx.fillRect(0, -3 * p.scale, beamLen, 6 * p.scale);
                ctx.globalCompositeOperation = 'source-over';
            } else if (['RECORDER', 'SCHOOL_CHIME', 'BROADCAST_MIC', 'BASKETBALL', 'DUSTER'].includes(weaponKey as string)) {
                const ringCol = weaponKey === 'BASKETBALL' ? 'rgba(249,115,22,0.5)' : (weaponKey === 'DUSTER' ? 'rgba(150,150,150,0.5)' : 'rgba(255,255,255,0.5)');
                const progress = Math.max(0, 1 - p.duration / p.maxDuration);
                const radius = progress * (weaponKey === 'BROADCAST_MIC' ? 300 : 150) * p.scale; 
                ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2);
                ctx.strokeStyle = ringCol; ctx.lineWidth = 5 * p.scale; ctx.stroke();
            } else if (['CURRY', 'ART_BRUSH', 'CHALK_SMOKE', 'GLUE_STICK', 'FOUNTAIN_PEN', 'CLAY'].includes(p.type as string) || ['CURRY', 'ART_BRUSH', 'CHALK_SMOKE', 'GLUE_STICK', 'FOUNTAIN_PEN', 'CLAY'].includes(p.subType as string)) {
                const color = p.type === 'CURRY' ? 'rgba(255,120,0,0.4)' : (p.type === 'ART_BRUSH' ? 'rgba(244,63,94,0.4)' : (p.type === 'GLUE_STICK' ? 'rgba(96,165,250,0.4)' : (p.type === 'FOUNTAIN_PEN' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.3)')));
                ctx.fillStyle = color;
                ctx.beginPath(); ctx.arc(0,0, 30*p.scale, 0, Math.PI*2); ctx.fill();
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.beginPath(); ctx.arc(0,0, 35*p.scale, 0, Math.PI*2); ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
            } else {
                let spriteKey = p.type === 'EVOLVED' ? (p.subType || 'PENCIL') : p.type;
                const sprite = spriteCache.current[spriteKey];
                if (sprite) {
                    const size = 16 * p.scale;
                    if (['TRIANGLE_RULER_S', 'LUNCH_TRAY'].includes(p.type as string) || ['TRIANGLE_RULER_S', 'LUNCH_TRAY'].includes(p.subType as string)) {
                        ctx.rotate(frameCount.current * 0.5);
                    }
                    ctx.drawImage(sprite, -size/2, -size/2, size, size);
                }
            }
            ctx.restore();
        });

        enemies.current.forEach(e => {
            if (Math.abs(e.x - camera.current.x) > (viewW/ZOOM_SCALE + 50) || Math.abs(e.y - camera.current.y) > (viewH/ZOOM_SCALE + 50)) return;
            const spriteKey = e.flashTime > 0 ? `${e.type}_FLASH` : e.type;
            const sprite = spriteCache.current[spriteKey] || spriteCache.current['ENEMY_1'];
            if (sprite) { 
                const size = Math.max(e.width, e.height); 
                ctx.save();
                if (e.frozen) ctx.filter = 'hue-rotate(180deg) brightness(1.5)';
                ctx.drawImage(sprite, e.x - size/2, e.y - size/2, size * 1.3, size * 1.3); 
                ctx.restore();
            }
        });

        const pKey = player.current.flashTime > 0 ? 'PLAYER_FLASH' : 'PLAYER';
        const pSprite = spriteCache.current[pKey];
        if (pSprite) {
            ctx.save(); ctx.translate(player.current.x, player.current.y);
            if (lastDir.current.x < 0) ctx.scale(-1, 1);
            ctx.drawImage(pSprite, -16, -16, 32, 32); ctx.restore();
        }

        particles.current.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            if (p.type === 'RING') {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.scale || 1), 0, Math.PI*2);
                ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.stroke();
            } else if (['GLOW', 'RAINBOW'].includes(p.type)) {
                ctx.globalCompositeOperation = 'lighter';
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                grad.addColorStop(0, p.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            } else {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        });
        ctx.globalAlpha = 1.0;

        ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center';
        damageTexts.current.forEach(d => {
            const ratio = d.life / 40;
            const scale = ratio > 0.7 ? 1 + (1 - ratio) * 3 : 1;
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.scale(scale, scale);
            ctx.fillStyle = d.color;
            ctx.strokeStyle = 'black'; ctx.lineWidth = 4; ctx.strokeText(d.value.toString(), 0, 0);
            ctx.fillText(d.value.toString(), 0, 0);
            ctx.restore();
        });

        ctx.restore();
    };

    const generateUpgrades = () => {
        const candidates: any[] = [];
        const wKeys = Object.keys(WEAPONS) as WeaponType[];
        const pKeys = Object.keys(PASSIVES) as PassiveType[];
        
        wKeys.forEach(key => {
            const wData = weaponsRef.current[key];
            if (wData && wData.level >= 8 && passivesRef.current[WEAPONS[key].synergy] > 0 && wData.level === 8) candidates.push({ type: 'WEAPON', id: key, isEvo: true });
        });
        wKeys.forEach(key => {
            const wData = weaponsRef.current[key];
            if (!wData) { if (Object.values(weaponsRef.current).filter(v => v !== undefined).length < 8) candidates.push({ type: 'WEAPON', id: key, isNew: true }); }
            else if (wData.level < 8) candidates.push({ type: 'WEAPON', id: key, level: wData.level + 1 });
        });
        pKeys.forEach(key => {
            const level = passivesRef.current[key];
            if (level === 0) { if (Object.values(passivesRef.current).filter((v: number) => v > 0).length < 8) candidates.push({ type: 'PASSIVE', id: key, isNew: true }); }
            else if (level < 5) candidates.push({ type: 'PASSIVE', id: key, level: level + 1 });
        });

        const weightedPool: any[] = [];
        candidates.forEach(opt => {
            const isOwned = (opt.type === 'WEAPON' && weaponsRef.current[opt.id as WeaponType] !== undefined) ||
                          (opt.type === 'PASSIVE' && passivesRef.current[opt.id as PassiveType] > 0);
            
            const weight = isOwned ? 3 : 1; 
            for (let i = 0; i < weight; i++) {
                weightedPool.push(opt);
            }
        });

        const picks = [];
        const count = Math.min(3, candidates.length);
        
        while (picks.length < count && weightedPool.length > 0) {
            const idx = Math.floor(Math.random() * weightedPool.length);
            const selected = weightedPool[idx];
            picks.push(selected);
            for (let i = weightedPool.length - 1; i >= 0; i--) {
                if (weightedPool[i].id === selected.id && weightedPool[i].type === selected.type) {
                    weightedPool.splice(i, 1);
                }
            }
        }

        if (picks.length < 3) picks.push({ type: 'HEAL', id: 'HEAL' });
        setUpgradeOptions(picks);
    };

    const selectUpgrade = (opt: any) => {
        if (opt.type === 'WEAPON') { const key = opt.id as WeaponType; const current = weapons[key]; setWeapons(prev => ({ ...prev, [key]: current ? { ...current, level: current.level + 1 } : { level: 1, cooldownTimer: 0 } })); }
        else if (opt.type === 'PASSIVE') { const key = opt.id as PassiveType; setPassives(prev => ({ ...prev, [key]: prev[key] + 1 })); }
        else if (opt.type === 'HEAL') { player.current.hp = Math.min(player.current.maxHp, player.current.hp + 50); }
        audioService.playSound('buff'); gameState.current = 'PLAYING';
    };

    const handleRestart = () => {
        clearAllTimeouts(); 
        player.current = { ...player.current, x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2, hp: 100, dead: false };
        camera.current = { x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2 };
        enemies.current = []; projectiles.current = []; gems.current = []; damageTexts.current = []; particles.current = [];
        score.current = 0; time.current = 0; frameCount.current = 0; level.current = 1; xp.current = 0; nextLevelXp.current = BASE_XP_REQUIREMENT;
        setWeapons(() => {
            const initial: any = {};
            Object.keys(WEAPONS).forEach(k => initial[k] = undefined);
            initial.PENCIL = { level: 1, cooldownTimer: 0 };
            return initial;
        });
        setPassives({ PROTEIN: 0, DRILL: 0, PROTRACTOR: 0, SHOES: 0, PAD: 0, LUNCHBOX: 0, MAGNET: 0, TEXTBOOK: 0, ABACUS: 0, CONSOLE: 0, MILK: 0, ORIGAMI: 0 });
        setUiState({ hp: 100, maxHp: 100, level: 1, time: 0, score: 0, xpPercent: 0, gameOver: false });
        gameState.current = 'PLAYING'; audioService.playBGM('survivor_metal');
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#020617] text-white relative items-center justify-center font-mono overflow-hidden touch-none select-none" ref={containerRef} onTouchStart={(e) => { if (gameState.current !== 'PLAYING') return; const t = e.touches[0]; setJoystickUI({ active: true, startX: t.clientX, startY: t.clientY, curX: t.clientX, curY: t.clientY }); joystickRef.current = { x: 0, y: 0 }; }} onTouchMove={(e) => { if (!joystickUI?.active) return; const t = e.touches[0]; const dx = t.clientX - joystickUI.startX; const dy = t.clientY - joystickUI.startY; const dist = Math.hypot(dx, dy); const max = 50; setJoystickUI(prev => prev ? ({ ...prev, curX: prev.startX + (dist>max ? dx/dist*max : dx), curY: prev.startY + (dist>max ? dy/dist*max : dy) }) : null); joystickRef.current = { x: dx/max, y: dy/max }; }} onTouchEnd={() => { setJoystickUI(null); joystickRef.current = { x: 0, y: 0 }; }}>
            <div className="absolute top-0 left-0 w-full p-2 flex justify-between items-start pointer-events-none z-10 text-shadow-md">
                <div className="flex flex-col gap-1 w-1/3">
                    <div className="bg-black/60 p-2 rounded-xl border border-blue-500/50 backdrop-blur-md">
                        <div className="text-xl font-bold text-blue-400 leading-none flex items-center gap-1"><Zap size={16}/> LV {uiState.level}</div>
                        <div className="w-full h-3 bg-gray-800 rounded-full mt-2 overflow-hidden border border-gray-700"><div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-200" style={{width: `${uiState.xpPercent}%`}}></div></div>
                    </div>
                    <div className="bg-black/60 p-2 mt-1 rounded-xl border border-red-500/50 text-red-400 font-bold flex items-center backdrop-blur-md">
                        <Heart size={18} className="mr-2 fill-current"/> {Math.ceil(uiState.hp)}
                    </div>
                </div>
                <div className="bg-black/80 p-2 rounded-xl border border-white/20 text-center backdrop-blur-lg shadow-xl"><div className="text-3xl font-black text-white tracking-widest font-mono">{Math.floor(uiState.time/60).toString().padStart(2,'0')}:{(uiState.time%60).toString().padStart(2,'0')}</div><div className="text-xs text-gray-400 font-bold mt-1">SCORE: {score.current}</div></div>
                <div className="w-1/3 flex flex-col items-end gap-1 opacity-90 pt-2"><div className="flex flex-wrap justify-end gap-1 max-w-[160px]">{(Object.keys(weapons) as WeaponType[]).map((k) => { const v = weapons[k]; return v && (<div key={k} className={`w-8 h-8 bg-slate-800 border-2 ${v.level>=8?'border-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]':'border-gray-600'} flex items-center justify-center relative p-1 rounded-lg`}><PixelSprite seed={k} name={`${WEAPONS[k].sprite.template}|${WEAPONS[k].sprite.color}`} className="w-full h-full"/><div className="absolute -bottom-1 -right-1 text-[8px] bg-black px-1 rounded-full leading-none text-white border border-gray-700 font-bold">{v.level}</div></div>)})}</div><div className="flex flex-wrap justify-end gap-1 max-w-[160px] mt-1">{(Object.keys(passives) as PassiveType[]).map((k) => { const v = passives[k]; return v > 0 && (<div key={k} className="w-7 h-7 bg-slate-900/80 border border-gray-700 flex items-center justify-center relative p-1 rounded-lg"><PixelSprite seed={k} name={`${PASSIVES[k].sprite.template}|${PASSIVES[k].sprite.color}`} className="w-full h-full"/><div className="absolute -bottom-1 -right-1 text-[8px] bg-blue-900 px-1 rounded-full leading-none text-white border border-blue-400 font-bold">{v}</div></div>)})}</div></div>
            </div>
            <canvas ref={canvasRef} width={viewSize.width} height={viewSize.height} className="block w-full h-full bg-[#020617]" style={{ imageRendering: 'pixelated' }} />
            {gameState.current === 'MATH_CHALLENGE' && (<div className="absolute inset-0 z-30 pointer-events-auto"><MathChallengeScreen mode={GameMode.MIXED} onComplete={handleMathComplete} /></div>)}
            {gameState.current === 'LEVEL_UP' && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center z-20 animate-in zoom-in duration-250 pointer-events-auto p-4">
                    <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-orange-500 mb-8 animate-pulse italic">LEVEL UP!</h2>
                    <div className="grid grid-cols-1 gap-4 w-full max-md overflow-y-auto max-h-[70vh] p-2 custom-scrollbar">
                        {upgradeOptions.map((opt, idx) => {
                            let itemDef: any = opt.type === 'WEAPON' ? WEAPONS[opt.id as WeaponType] : (opt.type === 'PASSIVE' ? PASSIVES[opt.id as PassiveType] : { name: '特別給食', desc: 'HP 50回復', sprite: { template: 'POTION', color: '#f472b6' } });
                            let isEvo = opt.isEvo;
                            return (
                                <button key={idx} onClick={() => selectUpgrade(opt)} className={`bg-slate-900 border-4 ${isEvo ? 'border-yellow-400 bg-yellow-900/40 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'border-slate-700'} hover:border-blue-400 hover:bg-slate-800 p-4 rounded-2xl flex items-center text-left transition-all group relative overflow-hidden shadow-2xl`}><div className={`w-16 h-16 bg-black/60 mr-4 ${isEvo ? 'animate-bounce' : ''} shrink-0 p-2 border-2 border-slate-600 rounded-xl shadow-inner`}><PixelSprite seed={opt.id} name={`${itemDef.sprite.template}|${itemDef.sprite.color}`} className="w-full h-full"/></div><div className="flex-1"><div className="flex justify-between items-center mb-1"><div className={`text-xl font-black leading-tight ${isEvo ? 'text-yellow-300' : 'text-white'}`}>{isEvo ? itemDef.evolvedName : itemDef.name}</div><div className="text-[10px] text-blue-300 font-black bg-blue-900/60 px-3 py-1 rounded-full border border-blue-400/50 uppercase">{opt.isNew ? 'New Weapon' : (opt.type === 'HEAL' ? 'Bonus' : `Lv ${opt.level || 'Master'}`)}</div></div><div className="text-xs text-gray-300 leading-snug font-bold">{isEvo ? itemDef.evolvedDesc : itemDef.desc}</div>{opt.type === 'WEAPON' && !isEvo && <div className="text-[10px] text-indigo-400 mt-1 flex items-center gap-1 font-black"><Sparkles size={10}/> SYNERGY: {PASSIVES[itemDef.synergy as PassiveType].name}</div>}</div>{isEvo && <div className="absolute top-0 right-0 bg-gradient-to-b from-yellow-400 to-orange-600 text-black text-[10px] font-black px-4 py-1 rounded-bl-xl shadow-lg">協助進化</div>}</button>
                            );
                        })}
                    </div>
                </div>
            )}
            {joystickUI && joystickUI.active && <div className="absolute z-30 pointer-events-none" style={{ left: joystickUI.startX, top: joystickUI.startY, transform: 'translate(-50%, -50%)' }}><div className="w-24 h-24 rounded-full border-4 border-white/30 bg-white/10 backdrop-blur-sm"></div><div className="absolute w-12 h-12 rounded-full bg-white/40 shadow-2xl" style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${joystickUI.curX - joystickUI.startX}px), calc(-50% + ${joystickUI.curY - joystickUI.startY}px))` }}></div></div>}
            {uiState.gameOver && (<div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center z-20 pointer-events-auto animate-in fade-in duration-500"><Skull size={80} className="text-red-500 mb-4 animate-bounce"/><h2 className="text-7xl font-black text-white mb-4 tracking-tighter italic">GAME OVER</h2><div className="text-2xl text-yellow-400 mb-8 font-black bg-black/60 px-8 py-2 rounded-full border border-yellow-500">SURVIVED: {Math.floor(uiState.time/60)}:{(uiState.time%60).toString().padStart(2,'0')}</div><div className="flex flex-col gap-4 w-72"><button onClick={handleRestart} className="bg-white text-black px-8 py-4 rounded-2xl font-black text-xl hover:bg-gray-200 flex items-center justify-center shadow-[0_4px_0_#ccc] active:translate-y-1 active:shadow-none transition-all"><RotateCcw className="mr-2"/> PLAY AGAIN</button><button onClick={handleExit} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xl border-4 border-white/20 hover:bg-gray-900 flex items-center justify-center shadow-2xl transition-all"><ArrowLeft className="mr-2"/> EXIT TO MENU</button></div></div>)}
            {gameState.current === 'PLAYING' && (<button onClick={handleExit} className="absolute top-4 right-4 bg-gray-800/60 hover:bg-red-500/80 text-white p-3 rounded-2xl border-2 border-white/20 z-50 pointer-events-auto shadow-2xl backdrop-blur-lg transition-all"><Pause size={24} /></button>)}
        </div>
    );
};

export default SchoolyardSurvivorScreen;
