
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Wind, Trophy, Zap, Shield, Move, RefreshCw, Layers, Crosshair, Skull, Heart, ChevronsRight, ChevronsLeft, Info, Play, X, Box, Calendar, Hammer, ShoppingBag, Fuel, Palette, Star, Gift, HelpCircle, ArrowRight, Trash2, Settings, Archive, Download, Activity, Radiation, Droplets, Recycle, Repeat, User, Lock, Users, Target, UserPlus, Gauge, Swords, Dice5, Ghost, Rocket, Fan, Cpu } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';
import { storageService, PaperPlaneProgress } from '../services/storageService';

// --- TYPES & CONSTANTS ---

const MAX_ROWS = 5; // Battle grid height
const SHIP_HEIGHT = 3; // Player ship height (Rows)
const SHIP_WIDTH = 3; // Player ship width (Cols) -> Total 9 slots
const MAX_FUEL = 3;
const FINAL_STAGE_NORMAL = 12;

type EnergyColor = 'WHITE' | 'BLUE' | 'ORANGE';

interface EnergyCard {
    id: string;
    value: number;
    color: EnergyColor;
    isTemporary?: boolean; 
}

interface EnergySlot {
    req: EnergyColor | 'ANY';
    value: number | null;
    loadedColor?: EnergyColor | null;
}

interface ShipPart {
    id: string;
    type: 'CANNON' | 'ENGINE' | 'EMPTY' | 'MISSILE' | 'SHIELD' | 'AMPLIFIER'; 
    name: string;
    description?: string;
    slots: EnergySlot[]; // Multiple slots per part
    multiplier: number; // Effect multiplier per energy
    basePower: number; // Flat bonus when activated (Full slots)
    hp: number; // Part HP (Visual mainly)
    specialEffect?: 'RANK_UP' | 'HEAL' | 'RECYCLE' | 'THORNS' | 'WHITE_BONUS' | 'MATCH_BONUS' | 'LOW_SCORE_BOOST' | 'RAINBOW_BONUS' | 'SOLO_DOUBLE' | 'BLUE_BONUS' | 'ORANGE_BONUS' | 'HIGH_SCORE_BOOST' | 'EVEN_BONUS' | 'ODD_BONUS' | 'SEQUENCE_BONUS' | 'MONO_COLOR_BONUS' | 'OVERCHARGE_HEAL' | 'OVERCHARGE_RECYCLE' | 'PRIME_BONUS' | 'SQUARE_BONUS' | 'GCD_BONUS' | 'LCM_BONUS' | 'FIBONACCI_BONUS' | 'MEAN_BONUS' | 'MEDIAN_BONUS' | 'SAME_TYPE_LINK' | 'ROW_UNITY' | 'CENTER_COMMAND' | 'DIAGONAL_LINK' | 'MIRROR_BONUS' | 'TURN_SCALE' | 'DAMAGE_MEMORY' | 'EFFORT_STACK' | 'UNIQUE_VALUE_RECORD' | 'RANDOM_SPIKE' | 'FORECAST_COLOR' | 'NO_CONSUME_CHANCE' | 'PALINDROME_BONUS' | 'SUM_FIFTEEN_BONUS' | 'MULTIPLE_OF_THREE_BONUS' | 'HAND_SIZE_BONUS' | 'TEMP_CARD_BONUS' | 'EDGE_BONUS' | 'CORNER_BONUS' | 'ISOLATION_BONUS' | 'ALT_COLOR_BONUS' | 'LAST_STREAK_BONUS' | 'DIVISOR_BONUS' | 'PRIME_FACTOR_BONUS' | 'SUM_TARGET_BONUS' | 'MOD_MATCH_BONUS' | 'RATIO_BONUS' | 'PRODUCT_SUPPORT_BONUS' | 'MEAN_DOUBLE_BONUS' | 'MODE_BONUS' | 'LOW_SPREAD_BONUS' | 'GCD_FUEL_BONUS' | 'ARITHMETIC_BONUS' | 'CENTER_ADJ_BONUS' | 'ROW_TYPE_LINK' | 'ADJACENT_DIVERSITY_BONUS' | 'ISOLATION_FUEL_BONUS' | 'CENTER_COLUMN_BONUS' | 'RANDOM_SWING' | 'OVERCHARGE_SUPPORT' | 'RAINBOW_HEAL_BONUS' | 'FUEL_RESERVE_BONUS' | 'BLUE_THORNS_BONUS' | 'ECHO_MATCH_BONUS' | 'ALL_UNIQUE_RAINBOW_BONUS' | 'CENTER_FULL_BONUS' | 'UNIQUE_RAINBOW_BONUS'; 
}

interface BattleStats {
    damageTaken: number;
    seenValues: number[];
    partLoadCounts: Record<string, number>;
    lastLoadedPartId: string | null;
    lastLoadedStreak: number;
}

interface Talent {
    id: string;
    name: string;
    description: string;
    effectType: string;
    value: number;
}

interface Pilot {
    id: string;
    name: string;
    spriteName: string;
    intrinsicTalent: Talent;
    randomTalents?: Talent[];
}

interface ShipState {
    yOffset: number; // 0 to MAX_ROWS - SHIP_HEIGHT
    hp: number;
    maxHp: number;
    fuel: number;
    maxFuel: number;
    durability: number; // Enemy only: Stun threshold (Defense Value)
    maxDurability: number;
    isStunned: boolean;
    parts: ShipPart[]; // Array of 9 parts (Row-major: 0,1,2 is Row0)
    
    // New Stats
    starCoins: number;
    vacationDays: number;
    passivePower: number; // From Treasures & Talents
    partInventory: ShipPart[]; 
    talents: Talent[]; // Active talents
    
    // Enemy Specific
    enemyConfig?: {
        energyPerTurn: number;
        colors: EnergyColor[];
        moveChance: number;
    };
}

interface EnemyIntent {
    row: number; // Relative to enemy ship
    type: 'ATTACK' | 'BUFF' | 'DEBUFF';
    value: number;
}

interface PoolState {
    genNumbers: number[];
    genColors: EnergyColor[];
    coolNumbers: number[];
    coolColors: EnergyColor[];
}

type GamePhase = 'TUTORIAL' | 'SETUP' | 'BATTLE' | 'REWARD_SELECT' | 'REWARD_EQUIP' | 'VACATION' | 'GAME_OVER' | 'VICTORY' | 'HANGAR';

type VacationEventType = 'REPAIR' | 'PARTS' | 'ENERGY' | 'COIN' | 'TREASURE' | 'FUEL' | 'ENHANCE' | 'UNKNOWN' | 'SHOP' | 'MODIFY' | 'TRAINING' | 'SACRIFICE' | 'GAMBLE';

interface VacationEvent {
    id: string;
    type: VacationEventType;
    name: string;
    description: string;
    cost: number; // Days
    coinCost?: number; // Star Coins (Optional)
    tier: 1 | 2 | 3; // Value tier
    value?: number; // Specific value increment (e.g. max fuel +1)
}

// Clash Animation Types
interface ClashRowData {
    row: number;
    pPower: number;
    ePower: number;
    pShield: number;
    pThorns: number;
    result: 'PLAYER_HIT' | 'ENEMY_HIT' | 'DRAW' | 'NONE';
    damage: number;
}

interface ClashState {
    active: boolean;
    phase: 'INIT' | 'CLASH' | 'IMPACT' | 'DONE';
    data: ClashRowData[];
}

interface ShipTemplate {
    id: string;
    name: string;
    unlockRank: number;
    layout: ShipPart[]; // 9 slots
    description: string;
    baseHp: number;
    color: string;
}

interface EnemyDataTemplate {
    name: string;
    hp: number;
    durability: number;
    layout: string[]; // 9 slots of part types
    energy: number;
    colors: EnergyColor[];
    moveChance: number;
}

// --- DATA ---

const GENERIC_TALENTS: Talent[] = [
    { id: 'T_HEAL_WIN', name: '勝利の余韻', description: '戦闘勝利時、HPを5回復', effectType: 'HEAL_AFTER_BATTLE', value: 5 },
    { id: 'T_MONEY_WIN', name: 'おこづかい', description: '戦闘勝利時の獲得コイン+15%', effectType: 'EXTRA_COINS', value: 15 },
    { id: 'T_BOMB', name: '先制花火', description: 'バトル開始時に敵に15ダメージ', effectType: 'INITIAL_BOMB', value: 15 },
    { id: 'T_POOL_W', name: '白紙の束', description: '初期プールに「白」のカードを3枚追加', effectType: 'EXTRA_POOL_WHITE', value: 3 },
    { id: 'T_POOL_B', name: '青インクの瓶', description: '初期プールに「青」のカードを2枚追加', effectType: 'EXTRA_POOL_BLUE', value: 2 },
    { id: 'T_POOL_O', name: '夕焼けスケッチ', description: '初期プールに「橙」のカードを1枚追加', effectType: 'EXTRA_POOL_ORANGE', value: 1 },
    { id: 'T_REROLL_DISC', name: '情報網', description: '戦利品リロールのコイン消費を半額(25枚)にする', effectType: 'DISCOUNT_REROLL_REWARD', value: 25 },
    { id: 'T_DRAW_FT', name: '初動重視', description: '一番最初のターンに手札を2枚多く引く', effectType: 'DRAW_CARD_FIRST_TURN', value: 2 },
    { id: 'T_DOUBLE_LOAD', name: '二重装填(初手)', description: '最初のターンに装填するカードの効果値が倍になる', effectType: 'DOUBLE_FIRST_TURN_LOAD', value: 2 },
    { id: 'T_FREE_VACATION', name: '優待券', description: '「休暇」の最初のイベントコストを1日軽減', effectType: 'FREE_FIRST_VACATION', value: 1 },
    { id: 'T_FUEL_ON_CRISIS', name: '火事場の馬鹿力', description: 'ターン開始時、HPが半分以下なら燃料+1', effectType: 'CRISIS_FUEL', value: 1 },
    { id: 'T_OVERCHARGE', name: 'ハイテンション', description: '「6」以上のカードを装填した時、即座に燃料を1回復', effectType: 'OVERCHARGE_FUEL', value: 1 },
];

const PILOTS: Pilot[] = [
    { id: 'PL_HERO', name: '元気な転校生', spriteName: 'HERO_SIDE|赤', intrinsicTalent: { id: 'IT_GUTS', name: 'ド根性', description: '最大HP+10', effectType: 'MAX_HP', value: 10 } },
    { id: 'PL_NERD', name: 'メカニック', spriteName: 'HUMANOID|緑', intrinsicTalent: { id: 'IT_TUNE', name: 'チューニング', description: 'パッシブ出力+2', effectType: 'PASSIVE_POWER', value: 2 } },
    { id: 'PL_GIRL', name: '委員長', spriteName: 'GIRL|青', intrinsicTalent: { id: 'IT_BUDGET', name: '予算管理', description: 'ショップ割引(20%)', effectType: 'SHOP_DISCOUNT', value: 20 } },
    { id: 'PL_SPORT', name: 'エース', spriteName: 'MUSCLE|橙', intrinsicTalent: { id: 'IT_STAMINA', name: 'スタミナ', description: '最大燃料+2', effectType: 'FUEL', value: 2 } },
    { id: 'PL_SENIOR', name: '謎の上級生', spriteName: 'SENIOR|紫', intrinsicTalent: { id: 'IT_SECRET', name: '裏ルート', description: '開始時エネルギー+2', effectType: 'START_ENERGY', value: 2 } },
    { id: 'PL_LIBRARY', name: '図書委員', spriteName: 'HUMANOID|#5e35b1', intrinsicTalent: { id: 'IT_BOOK', name: '静かな集中', description: '開始時エネルギーカード+1', effectType: 'START_ENERGY', value: 1 } },
    { id: 'PL_BROADCAST', name: '放送委員', spriteName: 'HUMANOID|#26a69a', intrinsicTalent: { id: 'IT_VOICE', name: '声量アップ', description: 'パッシブ出力+2', effectType: 'PASSIVE_POWER', value: 2 } },
    { id: 'PL_HEALTH', name: '保健委員', spriteName: 'GIRL|#66bb6a', intrinsicTalent: { id: 'IT_CARE', name: '健康管理', description: '最大HP+12', effectType: 'MAX_HP', value: 12 } },
    { id: 'PL_TREASURER', name: '会計係', spriteName: 'HUMANOID|#ffa726', intrinsicTalent: { id: 'IT_ACCOUNT', name: '節約上手', description: 'ショップ割引(18%)', effectType: 'SHOP_DISCOUNT', value: 18 } },
    { id: 'PL_TRACK', name: '陸上部', spriteName: 'MUSCLE|#29b6f6', intrinsicTalent: { id: 'IT_RUN', name: '全力疾走', description: '最大燃料+3', effectType: 'FUEL', value: 3 } },
    { id: 'PL_ART', name: '美術部', spriteName: 'GIRL|#ec407a', intrinsicTalent: { id: 'IT_COLOR', name: '配色感覚', description: '開始時エネルギーカード+1', effectType: 'START_ENERGY', value: 1 } },
    { id: 'PL_SCIENCE', name: '理科研究会', spriteName: 'HUMANOID|#42a5f5', intrinsicTalent: { id: 'IT_LAB', name: '実験出力', description: 'パッシブ出力+3', effectType: 'PASSIVE_POWER', value: 3 } },
    { id: 'PL_GARDEN', name: '園芸委員', spriteName: 'GIRL|#8bc34a', intrinsicTalent: { id: 'IT_GREEN', name: '土いじり体質', description: '最大HP+8', effectType: 'MAX_HP', value: 8 } },
    { id: 'PL_FESTIVAL', name: '文化祭実行委員', spriteName: 'HERO_SIDE|#ff7043', intrinsicTalent: { id: 'IT_FEST', name: '出店交渉', description: 'ショップ割引(25%)', effectType: 'SHOP_DISCOUNT', value: 25 } },
    { id: 'PL_SOCCER', name: 'サッカー部主将', spriteName: 'MUSCLE|#43a047', intrinsicTalent: { id: 'IT_CAPTAIN', name: 'グラウンド走破', description: '最大燃料+2', effectType: 'FUEL', value: 2 } },
    { id: 'PL_MUSIC', name: '吹奏楽部', spriteName: 'GIRL|#ab47bc', intrinsicTalent: { id: 'IT_RHYTHM', name: 'リズム感', description: '開始時エネルギーカード+2', effectType: 'START_ENERGY', value: 2 } },
    { id: 'PL_CHEM', name: '薬品庫の番人', spriteName: 'SENIOR|#26c6da', intrinsicTalent: { id: 'IT_FORMULA', name: '危険調合', description: 'パッシブ出力+2', effectType: 'PASSIVE_POWER', value: 2 } },
    { id: 'PL_DISCIPLINE', name: '風紀委員', spriteName: 'SENIOR|#8d6e63', intrinsicTalent: { id: 'IT_RULE', name: '規律徹底', description: '最大HP+10', effectType: 'MAX_HP', value: 10 } },
    { id: 'PL_SWEETS', name: '購買部の常連', spriteName: 'HUMANOID|#ffca28', intrinsicTalent: { id: 'IT_BREAD', name: 'パン争奪戦', description: '最大燃料+1', effectType: 'FUEL', value: 1 } },
    { id: 'PL_MAP', name: '地図マニア', spriteName: 'HERO_SIDE|#5c6bc0', intrinsicTalent: { id: 'IT_ROUTE', name: '最短ルート', description: '開始時エネルギーカード+2', effectType: 'START_ENERGY', value: 2 } },
    { id: 'PL_CRAFT', name: '工作名人', spriteName: 'HUMANOID|#8d6e63', intrinsicTalent: { id: 'IT_TOOL', name: '手先の器用さ', description: 'パッシブ出力+2', effectType: 'PASSIVE_POWER', value: 2 } },
    { id: 'PL_STUDENT_PRES', name: '生徒会長', spriteName: 'SENIOR|#ef5350', intrinsicTalent: { id: 'IT_PRESTIGE', name: '影響力', description: 'ショップ割引(22%)', effectType: 'SHOP_DISCOUNT', value: 22 } },
    { id: 'PL_TRANSFER2', name: '旅好き転校生', spriteName: 'HERO_SIDE|#26a69a', intrinsicTalent: { id: 'IT_TRIP', name: '遠征慣れ', description: '最大燃料+2', effectType: 'FUEL', value: 2 } },
    { id: 'PL_CAFE', name: '喫茶部の看板娘', spriteName: 'GIRL|#ff8a65', intrinsicTalent: { id: 'IT_MENU', name: '店番スキル', description: 'ショップ割引(15%)', effectType: 'SHOP_DISCOUNT', value: 15 } },
    { id: 'PL_BOXER', name: 'ボクシング部', spriteName: 'MUSCLE|#ef5350', intrinsicTalent: { id: 'IT_PUNCH', name: '拳圧', description: 'パッシブ出力+3', effectType: 'PASSIVE_POWER', value: 3 } },
    { id: 'PL_OLD_PRO', name: '伝説の卒業生', spriteName: 'SENIOR|#ffd54f', intrinsicTalent: { id: 'IT_LEGEND', name: '置き土産', description: '最大HP+15', effectType: 'MAX_HP', value: 15 } },
];

// Define Ships
const createEmptyPart = (id: string): ShipPart => ({ id, type: 'EMPTY', name: '空き', slots: [], multiplier: 0, basePower: 0, hp: 0 });

const SHIPS: ShipTemplate[] = [
    {
        id: 'SHIP_DEFAULT',
        name: 'チラシ号',
        unlockRank: 0,
        description: 'バランスの良い標準機体。',
        baseHp: 40,
        color: 'bg-emerald-800',
        layout: [
            createEmptyPart('p0'), createEmptyPart('p1'), { id: 'p2', type: 'CANNON', name: '軽量砲', slots: [{req:'WHITE', value:null}], multiplier: 1, basePower: 1, hp: 10 },
            { id: 'p3', type: 'ENGINE', name: '増幅炉', slots: [{req:'BLUE', value:null}], multiplier: 0, basePower: 0, hp: 10, specialEffect: 'RANK_UP' }, createEmptyPart('p4'), { id: 'p5', type: 'CANNON', name: '連装砲', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1, basePower: 2, hp: 10 },
            createEmptyPart('p6'), createEmptyPart('p7'), { id: 'p8', type: 'CANNON', name: '軽量砲', slots: [{req:'WHITE', value:null}], multiplier: 1, basePower: 1, hp: 10 },
        ]
    },
    {
        id: 'SHIP_SPEED',
        name: 'テスト用紙号',
        unlockRank: 5,
        description: '青スロットが多い高機動型。',
        baseHp: 30,
        color: 'bg-blue-800',
        layout: [
            createEmptyPart('p0'), { id: 'p1', type: 'MISSILE', name: '誘導弾', slots: [{req:'BLUE', value:null}], multiplier: 1.5, basePower: 2, hp: 10 }, createEmptyPart('p2'),
            { id: 'p3', type: 'ENGINE', name: '高機動', slots: [{req:'BLUE', value:null}], multiplier: 1.2, basePower: 2, hp: 10 }, createEmptyPart('p4'), { id: 'p5', type: 'ENGINE', name: '高機動', slots: [{req:'BLUE', value:null}], multiplier: 1.2, basePower: 2, hp: 10 },
            createEmptyPart('p6'), { id: 'p7', type: 'MISSILE', name: '誘導弾', slots: [{req:'BLUE', value:null}], multiplier: 1.5, basePower: 2, hp: 10 }, createEmptyPart('p8'),
        ]
    },
    {
        id: 'SHIP_POWER',
        name: '画用紙号',
        unlockRank: 10,
        description: '橙スロットが多い重装甲型。',
        baseHp: 50,
        color: 'bg-orange-800',
        layout: [
            { id: 'p0', type: 'CANNON', name: '重砲', slots: [{req:'ORANGE', value:null}], multiplier: 2, basePower: 3, hp: 15 }, createEmptyPart('p1'), createEmptyPart('p2'),
            createEmptyPart('p3'), { id: 'p4', type: 'SHIELD', name: '装甲板', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 5, hp: 20 }, createEmptyPart('p5'),
            { id: 'p6', type: 'CANNON', name: '重砲', slots: [{req:'ORANGE', value:null}], multiplier: 2, basePower: 3, hp: 15 }, createEmptyPart('p7'), createEmptyPart('p8'),
        ]
    }
];

// Enhanced Enemy Data (3x3 Grid + AI params) - ENGINE Removed, replaced with weapons or empty
const ENEMY_DATA: EnemyDataTemplate[] = [
    { 
        name: "折り紙偵察機", hp: 40, durability: 3, 
        layout: ['EMPTY', 'CANNON', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'CANNON', 'EMPTY'], 
        energy: 2, colors: ['WHITE'], moveChance: 0.3 
    },
    { 
        name: "ノート爆撃機", hp: 60, durability: 4, 
        layout: ['CANNON', 'EMPTY', 'EMPTY', 'CANNON', 'EMPTY', 'EMPTY', 'CANNON', 'EMPTY', 'EMPTY'], 
        energy: 3, colors: ['WHITE', 'BLUE'], moveChance: 0.2 
    },
    { 
        name: "定規戦艦", hp: 90, durability: 8, 
        layout: ['CANNON', 'CANNON', 'EMPTY', 'AMPLIFIER', 'CANNON', 'EMPTY', 'CANNON', 'CANNON', 'EMPTY'], 
        energy: 4, colors: ['WHITE'], moveChance: 0.1 
    },
    { 
        name: "コンパス要塞", hp: 120, durability: 8, 
        layout: ['MISSILE', 'CANNON', 'EMPTY', 'CANNON', 'AMPLIFIER', 'CANNON', 'MISSILE', 'EMPTY', 'EMPTY'], 
        energy: 4, colors: ['WHITE', 'BLUE'], moveChance: 0.1 
    },
    { 
        name: "修正液タンク", hp: 180, durability: 20, 
        layout: ['EMPTY', 'EMPTY', 'EMPTY', 'CANNON', 'AMPLIFIER', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'], 
        energy: 3, colors: ['WHITE', 'ORANGE'], moveChance: 0.05 
    },
    { 
        name: "カッター迎撃機", hp: 70, durability: 4, 
        layout: ['MISSILE', 'EMPTY', 'MISSILE', 'CANNON', 'CANNON', 'EMPTY', 'MISSILE', 'EMPTY', 'MISSILE'], 
        energy: 5, colors: ['BLUE'], moveChance: 0.6 
    },
    { 
        name: "分度器マザー", hp: 150, durability: 7, 
        layout: ['CANNON', 'AMPLIFIER', 'CANNON', 'EMPTY', 'EMPTY', 'EMPTY', 'CANNON', 'AMPLIFIER', 'CANNON'], 
        energy: 5, colors: ['WHITE', 'BLUE'], moveChance: 0.2 
    },
    { 
        name: "彫刻刀デストロイヤー", hp: 200, durability: 11, 
        layout: ['MISSILE', 'CANNON', 'CANNON', 'AMPLIFIER', 'CANNON', 'AMPLIFIER', 'MISSILE', 'CANNON', 'CANNON'], 
        energy: 6, colors: ['ORANGE', 'WHITE'], moveChance: 0.1 
    },
    { 
        name: "暗黒文房具王", hp: 350, durability: 22, 
        layout: ['MISSILE', 'AMPLIFIER', 'MISSILE', 'AMPLIFIER', 'AMPLIFIER', 'AMPLIFIER', 'MISSILE', 'AMPLIFIER', 'MISSILE'], 
        energy: 7, colors: ['ORANGE', 'BLUE', 'WHITE'], moveChance: 0.3 
    },
    {
        name: "プリント追試機",
        hp: 48, durability: 3,
        layout: ['EMPTY', 'CANNON', 'EMPTY', 'EMPTY', 'CANNON', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
        energy: 2, colors: ['WHITE'], moveChance: 0.25
    },
    {
        name: "赤ペン査定機",
        hp: 55, durability: 3,
        layout: ['CANNON', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'CANNON'],
        energy: 3, colors: ['WHITE', 'BLUE'], moveChance: 0.35
    },
    {
        name: "上履きホバー",
        hp: 52, durability: 2,
        layout: ['EMPTY', 'MISSILE', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'MISSILE', 'EMPTY'],
        energy: 3, colors: ['BLUE'], moveChance: 0.65
    },
    {
        name: "黒板けし艇",
        hp: 68, durability: 4,
        layout: ['CANNON', 'EMPTY', 'CANNON', 'EMPTY', 'AMPLIFIER', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
        energy: 3, colors: ['WHITE'], moveChance: 0.15
    },
    {
        name: "チョーク散布機",
        hp: 72, durability: 4,
        layout: ['MISSILE', 'EMPTY', 'MISSILE', 'EMPTY', 'CANNON', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
        energy: 4, colors: ['WHITE', 'BLUE'], moveChance: 0.4
    },
    {
        name: "図書室しおり艇",
        hp: 66, durability: 3,
        layout: ['EMPTY', 'MISSILE', 'EMPTY', 'EMPTY', 'AMPLIFIER', 'EMPTY', 'EMPTY', 'MISSILE', 'EMPTY'],
        energy: 4, colors: ['BLUE'], moveChance: 0.45
    },
    {
        name: "給食ワゴン戦車",
        hp: 88, durability: 6,
        layout: ['EMPTY', 'CANNON', 'EMPTY', 'CANNON', 'EMPTY', 'EMPTY', 'EMPTY', 'CANNON', 'EMPTY'],
        energy: 4, colors: ['WHITE', 'ORANGE'], moveChance: 0.15
    },
    {
        name: "モップローラー",
        hp: 82, durability: 5,
        layout: ['CANNON', 'EMPTY', 'EMPTY', 'AMPLIFIER', 'EMPTY', 'EMPTY', 'CANNON', 'EMPTY', 'EMPTY'],
        energy: 4, colors: ['ORANGE', 'WHITE'], moveChance: 0.2
    },
    {
        name: "理科実験ドローン",
        hp: 90, durability: 5,
        layout: ['MISSILE', 'EMPTY', 'EMPTY', 'EMPTY', 'AMPLIFIER', 'EMPTY', 'EMPTY', 'EMPTY', 'MISSILE'],
        energy: 4, colors: ['BLUE', 'ORANGE'], moveChance: 0.5
    },
    {
        name: "放送室ジャマー",
        hp: 96, durability: 6,
        layout: ['EMPTY', 'CANNON', 'EMPTY', 'AMPLIFIER', 'AMPLIFIER', 'EMPTY', 'EMPTY', 'CANNON', 'EMPTY'],
        energy: 4, colors: ['WHITE', 'BLUE'], moveChance: 0.2
    },
    {
        name: "三角定規ランサー",
        hp: 104, durability: 5,
        layout: ['MISSILE', 'CANNON', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'MISSILE', 'CANNON', 'EMPTY'],
        energy: 5, colors: ['BLUE', 'WHITE'], moveChance: 0.45
    },
    {
        name: "彫刻刀追撃機",
        hp: 112, durability: 6,
        layout: ['CANNON', 'MISSILE', 'EMPTY', 'EMPTY', 'CANNON', 'EMPTY', 'EMPTY', 'MISSILE', 'CANNON'],
        energy: 5, colors: ['ORANGE', 'BLUE'], moveChance: 0.35
    },
    {
        name: "答案シュレッダー",
        hp: 118, durability: 6,
        layout: ['CANNON', 'EMPTY', 'CANNON', 'EMPTY', 'CANNON', 'EMPTY', 'CANNON', 'EMPTY', 'CANNON'],
        energy: 5, colors: ['WHITE', 'ORANGE'], moveChance: 0.1
    },
    {
        name: "校内放送要塞",
        hp: 128, durability: 7,
        layout: ['EMPTY', 'AMPLIFIER', 'EMPTY', 'CANNON', 'CANNON', 'CANNON', 'EMPTY', 'AMPLIFIER', 'EMPTY'],
        energy: 5, colors: ['WHITE', 'BLUE'], moveChance: 0.12
    },
    {
        name: "美術室フレーム砲台",
        hp: 134, durability: 8,
        layout: ['CANNON', 'EMPTY', 'CANNON', 'AMPLIFIER', 'EMPTY', 'AMPLIFIER', 'CANNON', 'EMPTY', 'CANNON'],
        energy: 5, colors: ['WHITE', 'ORANGE'], moveChance: 0.18
    },
    {
        name: "焼却炉ブレイザー",
        hp: 144, durability: 8,
        layout: ['EMPTY', 'MISSILE', 'EMPTY', 'CANNON', 'AMPLIFIER', 'CANNON', 'EMPTY', 'MISSILE', 'EMPTY'],
        energy: 6, colors: ['ORANGE', 'WHITE'], moveChance: 0.28
    },
    {
        name: "体育倉庫ブルドーザー",
        hp: 156, durability: 14,
        layout: ['CANNON', 'CANNON', 'EMPTY', 'EMPTY', 'AMPLIFIER', 'EMPTY', 'CANNON', 'CANNON', 'EMPTY'],
        energy: 6, colors: ['ORANGE', 'WHITE'], moveChance: 0.16
    },
    {
        name: "文化祭ステージ艦",
        hp: 168, durability: 10,
        layout: ['MISSILE', 'EMPTY', 'MISSILE', 'AMPLIFIER', 'CANNON', 'AMPLIFIER', 'MISSILE', 'EMPTY', 'MISSILE'],
        energy: 6, colors: ['BLUE', 'WHITE', 'ORANGE'], moveChance: 0.34
    },
    {
        name: "校庭サーチライト艦",
        hp: 176, durability: 9,
        layout: ['EMPTY', 'MISSILE', 'EMPTY', 'MISSILE', 'AMPLIFIER', 'MISSILE', 'EMPTY', 'MISSILE', 'EMPTY'],
        energy: 6, colors: ['BLUE', 'BLUE', 'WHITE'], moveChance: 0.55
    },
    {
        name: "昼休みパン争奪機",
        hp: 170, durability: 8,
        layout: ['CANNON', 'EMPTY', 'MISSILE', 'EMPTY', 'CANNON', 'EMPTY', 'MISSILE', 'EMPTY', 'CANNON'],
        energy: 6, colors: ['WHITE', 'ORANGE', 'BLUE'], moveChance: 0.42
    },
    {
        name: "理科室プラズマ塔",
        hp: 188, durability: 10,
        layout: ['MISSILE', 'AMPLIFIER', 'MISSILE', 'EMPTY', 'AMPLIFIER', 'EMPTY', 'MISSILE', 'AMPLIFIER', 'MISSILE'],
        energy: 6, colors: ['BLUE', 'ORANGE'], moveChance: 0.22
    },
    {
        name: "卒業アルバム号",
        hp: 196, durability: 11,
        layout: ['CANNON', 'EMPTY', 'CANNON', 'EMPTY', 'AMPLIFIER', 'EMPTY', 'MISSILE', 'EMPTY', 'MISSILE'],
        energy: 6, colors: ['WHITE', 'BLUE'], moveChance: 0.24
    },
    {
        name: "応援団総攻撃艇",
        hp: 210, durability: 12,
        layout: ['CANNON', 'AMPLIFIER', 'CANNON', 'CANNON', 'EMPTY', 'CANNON', 'MISSILE', 'AMPLIFIER', 'MISSILE'],
        energy: 7, colors: ['ORANGE', 'WHITE'], moveChance: 0.22
    },
    {
        name: "裏生徒会旗艦",
        hp: 228, durability: 13,
        layout: ['MISSILE', 'EMPTY', 'MISSILE', 'AMPLIFIER', 'CANNON', 'AMPLIFIER', 'MISSILE', 'EMPTY', 'MISSILE'],
        energy: 7, colors: ['WHITE', 'BLUE', 'ORANGE'], moveChance: 0.3
    },
    {
        name: "校則執行ドレッド",
        hp: 244, durability: 22,
        layout: ['CANNON', 'CANNON', 'MISSILE', 'AMPLIFIER', 'AMPLIFIER', 'EMPTY', 'CANNON', 'CANNON', 'MISSILE'],
        energy: 7, colors: ['ORANGE', 'WHITE', 'BLUE'], moveChance: 0.2
    },
    {
        name: "終業チャイム・オメガ",
        hp: 268, durability: 15,
        layout: ['MISSILE', 'AMPLIFIER', 'MISSILE', 'CANNON', 'AMPLIFIER', 'CANNON', 'MISSILE', 'AMPLIFIER', 'MISSILE'],
        energy: 7, colors: ['BLUE', 'WHITE', 'ORANGE'], moveChance: 0.38
    },
    {
        name: "職員室ペーパードラゴン",
        hp: 290, durability: 18,
        layout: ['CANNON', 'MISSILE', 'CANNON', 'AMPLIFIER', 'CANNON', 'AMPLIFIER', 'CANNON', 'MISSILE', 'CANNON'],
        energy: 8, colors: ['ORANGE', 'WHITE', 'BLUE'], moveChance: 0.18
    },
];

const VACATION_EVENTS_DB: Omit<VacationEvent, 'id'>[] = [
    { type: 'REPAIR', name: '応急修理', description: 'HPを10回復する。', cost: 1, tier: 1 },
    { type: 'REPAIR', name: 'ばんそうこう補修', description: 'HPを6回復する。', cost: 1, tier: 1 },
    { type: 'REPAIR', name: '工具箱メンテ', description: 'HPを15回復する。', cost: 2, tier: 2 },
    { type: 'REPAIR', name: '放課後メンテ会', description: 'HPを20回復する。', cost: 2, tier: 2 },
    { type: 'REPAIR', name: 'ドック入り', description: 'HPを全回復し、最大HPを+5する。', cost: 3, tier: 3 },
    { type: 'REPAIR', name: '特製フレーム交換', description: 'HPを全回復し、最大HPを+8する。', cost: 4, tier: 3 },
    { type: 'FUEL', name: '燃料補給', description: '燃料を最大まで回復。', cost: 1, tier: 1 },
    { type: 'FUEL', name: '理科室アルコール補給', description: '燃料を最大まで回復。', cost: 1, tier: 1 },
    { type: 'FUEL', name: 'ガソリン代カンパ', description: '燃料を全回復し、最大燃料+1。', cost: 2, tier: 2, value: 1 },
    { type: 'FUEL', name: 'タンク増設', description: '最大燃料+1、燃料全回復。', cost: 3, tier: 3, value: 1 },
    { type: 'FUEL', name: '予備タンク配備', description: '最大燃料+1、燃料全回復。', cost: 2, tier: 2, value: 1 },
    { type: 'ENERGY', name: 'エネルギー採掘', description: 'エネルギー生成プールに「6」を追加。', cost: 2, tier: 2 },
    { type: 'ENERGY', name: '算数ドリル強化', description: 'エネルギー生成プールに「5」を追加。', cost: 1, tier: 1 },
    { type: 'ENERGY', name: '色鉛筆ブレンド', description: '生成プールに「青」を追加。', cost: 2, tier: 2 },
    { type: 'ENERGY', name: 'リアクター調整', description: '生成プールに「オレンジ」を追加。', cost: 2, tier: 2 },
    { type: 'ENERGY', name: '朝練集中メニュー', description: 'エネルギー生成プールに「7」を追加。', cost: 3, tier: 3 },
    { type: 'ENERGY', name: '白紙ノート増刷', description: '生成プールに「白」を追加。', cost: 1, tier: 1 },
    { type: 'PARTS', name: 'パーツ回収', description: 'ランダムなパーツを1つ獲得する。', cost: 2, tier: 2 },
    { type: 'PARTS', name: '倉庫の掘り出し物', description: 'ランダムなパーツを1つ獲得する。', cost: 2, tier: 2 },
    { type: 'PARTS', name: '先輩のおさがり', description: 'ランダムなパーツを1つ獲得する。', cost: 1, tier: 1 },
    { type: 'PARTS', name: '軍需物資', description: '高性能なパーツを獲得する。', cost: 4, tier: 3 },
    { type: 'PARTS', name: '文化祭特注パーツ', description: '高性能なパーツを獲得する。', cost: 3, tier: 3 },
    { type: 'COIN', name: 'アルバイト', description: 'スターコインを50獲得。', cost: 1, tier: 1 },
    { type: 'COIN', name: '落とし物係', description: 'スターコインを40獲得。', cost: 1, tier: 1 },
    { type: 'COIN', name: '新聞配達', description: 'スターコインを70獲得。', cost: 1, tier: 1 },
    { type: 'COIN', name: '臨時ボーナス', description: 'スターコインを150獲得。', cost: 2, tier: 2 },
    { type: 'COIN', name: '文化祭の売上', description: 'スターコインを120獲得。', cost: 2, tier: 2 },
    { type: 'COIN', name: 'スポンサー契約', description: 'スターコインを220獲得。', cost: 3, tier: 3 },
    { type: 'TREASURE', name: '謎の宝箱', description: '永続的な攻撃力ボーナスを得る。', cost: 3, tier: 3 },
    { type: 'TREASURE', name: '卒業生の遺産', description: '永続的な攻撃力ボーナスを得る。', cost: 3, tier: 3 },
    { type: 'TREASURE', name: '校庭の埋蔵品', description: '永続的な攻撃力ボーナスを得る。', cost: 2, tier: 2 },
    { type: 'UNKNOWN', name: '謎のイベント', description: '何が起こるかわからない...', cost: 2, tier: 2 },
    { type: 'UNKNOWN', name: '夜の旧校舎', description: '入るたびに結果が変わる...', cost: 2, tier: 2 },
    { type: 'UNKNOWN', name: 'うわさの物置', description: '何かが起きるらしい。', cost: 1, tier: 1 },
    { type: 'SHOP', name: '闇市', description: '高品質なパーツを裏ルートで入手する。', cost: 0, coinCost: 150, tier: 3 },
    { type: 'SHOP', name: '部室バザー', description: 'スターコインで品物を買える。', cost: 0, coinCost: 80, tier: 2 },
    { type: 'SHOP', name: '購買部の特売', description: 'スターコインで品物を買える。', cost: 0, coinCost: 60, tier: 1 },
    { type: 'ENHANCE', name: '特別改造', description: '船体を強化。最大HP+20。', cost: 0, coinCost: 100, tier: 2 },
    { type: 'ENHANCE', name: '溶接ブース強化', description: '船体を強化。最大HP+12。', cost: 0, coinCost: 70, tier: 2 },
    { type: 'ENHANCE', name: 'フレーム補強', description: '船体を強化。最大HP+8。', cost: 0, coinCost: 50, tier: 1 },
    { type: 'TRAINING', name: '極秘訓練', description: 'パッシブパワー(全出力)+1。', cost: 0, coinCost: 200, tier: 3 },
    { type: 'TRAINING', name: '朝練メニュー', description: 'パッシブパワー(全出力)+1。', cost: 0, coinCost: 120, tier: 2 },
    { type: 'TRAINING', name: '筋トレ合宿', description: 'パッシブパワー(全出力)+2。', cost: 0, coinCost: 260, tier: 3, value: 2 },
    { type: 'FUEL', name: 'プレミアム燃料', description: '最大燃料+2、全回復。', cost: 0, coinCost: 80, tier: 2, value: 2 },
    { type: 'FUEL', name: '高濃度ブースト剤', description: '最大燃料+2、全回復。', cost: 0, coinCost: 120, tier: 3, value: 2 },
    { type: 'SACRIFICE', name: '悪魔の契約', description: '最大燃料を1犠牲にし、全出力を+2する。', cost: 0, tier: 3, value: 2 },
    { type: 'SACRIFICE', name: '徹夜の代償', description: '最大燃料を1犠牲にし、全出力を+2する。', cost: 0, tier: 3, value: 2 },
    { type: 'SACRIFICE', name: '課題の先食い', description: '最大燃料を1犠牲にし、全出力を+1する。', cost: 0, tier: 2, value: 1 },
    { type: 'GAMBLE', name: '裏カジノ', description: 'コインを賭ける(100G)。勝てば3倍。', cost: 1, coinCost: 100, tier: 2, value: 300 },
    { type: 'GAMBLE', name: 'くじ引き屋台', description: 'コインを賭ける(50G)。勝てば2倍。', cost: 1, coinCost: 50, tier: 1, value: 100 },
    { type: 'GAMBLE', name: '放課後ポーカー勝負', description: 'コインを賭ける(150G)。勝てば3倍。', cost: 1, coinCost: 150, tier: 3, value: 450 },
];

const PART_TEMPLATES: Omit<ShipPart, 'id'>[] = [
    { type: 'CANNON', name: 'バスター砲', description: '標準的な威力の大砲。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 3, hp: 10 },
    { type: 'MISSILE', name: '誘導ミサイル', description: '青エネルギーで高出力。', slots: [{req:'BLUE', value:null}, {req:'BLUE', value:null}], multiplier: 1.5, basePower: 5, hp: 10 },
    { type: 'SHIELD', name: 'エネルギー盾', description: '高い防御力を発揮。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 5, hp: 15 },
    { type: 'ENGINE', name: '高機動スラスター', description: '回避率と燃料効率が高い。', slots: [{req:'BLUE', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 2, hp: 10 },
    { type: 'CANNON', name: '波動砲', description: 'オレンジ必須。超高火力。', slots: [{req:'ORANGE', value:null}, {req:'ORANGE', value:null}], multiplier: 2.0, basePower: 10, hp: 10 },
    { type: 'ENGINE', name: '増幅炉', description: 'ランク+1のカードを生成する。', slots: [{req:'BLUE', value:null}], multiplier: 0, basePower: 0, hp: 10, specialEffect: 'RANK_UP' },
    { type: 'CANNON', name: 'バルカン砲', description: '白エネルギーで手軽に連射。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.0, basePower: 2, hp: 10 },
    { type: 'CANNON', name: 'レールガン', description: '青エネルギー専用。貫通力重視。', slots: [{req:'BLUE', value:null}], multiplier: 3.0, basePower: 6, hp: 10 },
    { type: 'MISSILE', name: 'ナパーム弾', description: 'オレンジ専用。広範囲高火力。', slots: [{req:'ORANGE', value:null}], multiplier: 2.5, basePower: 5, hp: 10 },
    { type: 'SHIELD', name: 'スパイク装甲', description: '被弾時、防御出力の半分を敵に返す。', slots: [{req:'ANY', value:null}], multiplier: 1.5, basePower: 2, hp: 20, specialEffect: 'THORNS' },
    { type: 'SHIELD', name: 'リペアキット', description: '白エネルギーで効率よく防御。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.5, basePower: 4, hp: 10 },
    { type: 'ENGINE', name: 'ソーラー帆', description: '白エネルギーを効率よく変換。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.5, basePower: 0, hp: 5 },
    { type: 'ENGINE', name: '核融合炉', description: 'オレンジ専用。莫大な出力(シールド・燃料)。', slots: [{req:'ORANGE', value:null}], multiplier: 4.0, basePower: 6, hp: 15 },
    { type: 'CANNON', name: 'スナイパー', description: '2スロットで精密射撃。', slots: [{req:'BLUE', value:null}, {req:'WHITE', value:null}], multiplier: 2.0, basePower: 5, hp: 10 },
    { type: 'MISSILE', name: '拡散ポッド', description: '多数の白スロットを持つ。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 0.8, basePower: 3, hp: 10 },
    { type: 'SHIELD', name: 'ミラーコート', description: '青エネルギーで特殊防御。', slots: [{req:'BLUE', value:null}, {req:'ANY', value:null}], multiplier: 1.3, basePower: 4, hp: 12 },
    { type: 'AMPLIFIER', name: 'エネルギー増幅器', description: '隣接するパーツの出力を強化する(要:白エネ)。', slots: [{req:'WHITE', value:null}], multiplier: 0, basePower: 2, hp: 8 },
    { type: 'AMPLIFIER', name: 'ハイパーブースター', description: '隣接するパーツを大幅強化(要:橙エネ)。', slots: [{req:'ORANGE', value:null}], multiplier: 0, basePower: 5, hp: 8 },
    { type: 'AMPLIFIER', name: 'デュアルアンプ', description: '2スロットで安定した強化。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 0, basePower: 3, hp: 8 },
    { type: 'CANNON', name: 'ホッチキス銃', description: '4連白スロット。数で勝負。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 0.8, basePower: 4, hp: 10 },
    { type: 'CANNON', name: 'カッターナイフ', description: '近距離高火力。1スロット橙。', slots: [{req:'ORANGE', value:null}], multiplier: 4.5, basePower: 2, hp: 5 },
    { type: 'MISSILE', name: 'コンパスドリル', description: '1スロットだが貫通力が高い。', slots: [{req:'BLUE', value:null}], multiplier: 3.5, basePower: 4, hp: 10 },
    { type: 'SHIELD', name: '修正液バリア', description: '白エネルギーで堅牢な守り。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.8, basePower: 6, hp: 15 },
    { type: 'SHIELD', name: '鉄壁の筆箱', description: '3スロットで鉄壁の防御。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.5, basePower: 8, hp: 20 },
    { type: 'CANNON', name: '黒板消しキャノン', description: '粉塵爆発。白と青を使用。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 1.8, basePower: 5, hp: 12 },
    { type: 'MISSILE', name: '三角定規ブーメラン', description: '戻ってくる衝撃波。', slots: [{req:'WHITE', value:null}, {req:'ORANGE', value:null}], multiplier: 2.0, basePower: 6, hp: 10 },
    { type: 'AMPLIFIER', name: '黄金比コンパス', description: '青エネルギーで隣接パーツを強化。', slots: [{req:'BLUE', value:null}], multiplier: 0, basePower: 4, hp: 8 },
    { type: 'AMPLIFIER', name: '下敷き静電気', description: '隣接強化。白エネルギー。', slots: [{req:'WHITE', value:null}], multiplier: 0, basePower: 3, hp: 5 },
    { type: 'CANNON', name: 'シャーペンスナイパー', description: '超遠距離精密射撃。', slots: [{req:'BLUE', value:null}, {req:'BLUE', value:null}], multiplier: 2.5, basePower: 7, hp: 8 },
    { type: 'CANNON', name: '液状のりスプレー', description: '敵の動きを鈍らせる(イメージ)。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.2, basePower: 3, hp: 12 },
    { type: 'CANNON', name: '彫刻刀セット', description: '5本の刃を一斉射出。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.5, basePower: 10, hp: 10 },
    { type: 'CANNON', name: '放送室スピーカー', description: '音波攻撃。白エネで高出力。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 2.0, basePower: 5, hp: 15 },
    { type: 'ENGINE', name: '焼却炉エンジン', description: '橙エネルギー専用。爆発的推進力。', slots: [{req:'ORANGE', value:null}, {req:'ORANGE', value:null}], multiplier: 5.0, basePower: 10, hp: 20 },
    { type: 'SHIELD', name: '理科室の人体模型', description: '不気味なオーラで守る。', slots: [{req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 2.0, basePower: 8, hp: 25 },
    { type: 'MISSILE', name: '消火栓放水', description: '青エネルギー3つで超高圧放水。', slots: [{req:'BLUE', value:null}, {req:'BLUE', value:null}, {req:'BLUE', value:null}], multiplier: 3.0, basePower: 12, hp: 18 },
    { type: 'AMPLIFIER', name: '校長先生の銅像', description: '圧倒的威圧感で隣接パーツを強化。', slots: [{req:'ORANGE', value:null}], multiplier: 0, basePower: 6, hp: 30 },
    { type: 'CANNON', name: 'チャイム音波砲', description: 'キーンコーンカーンコーン(破壊音)。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 1.5, basePower: 6, hp: 10 },
    { type: 'SHIELD', name: '自己修復ナノ', description: '起動時に船体HPを5回復する。', slots: [{req:'ORANGE', value:null}], multiplier: 0, basePower: 0, hp: 10, specialEffect: 'HEAL' },
    { type: 'ENGINE', name: 'エネルギー吸収装置', description: '起動時、燃料を1回復する。', slots: [{req:'BLUE', value:null}], multiplier: 1.0, basePower: 2, hp: 10, specialEffect: 'RECYCLE' },
    { type: 'ENGINE', name: 'あしたのジョーロ', description: '水力エンジン。白のみで高効率。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.8, basePower: 1, hp: 8 },
    { type: 'SHIELD', name: '揚げパンアーマー', description: '砂糖のコーティングで衝撃吸収。', slots: [{req:'WHITE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.5, basePower: 5, hp: 15 },
    { type: 'MISSILE', name: '冷凍ミカン爆弾', description: 'カチカチのミカンを投下。', slots: [{req:'BLUE', value:null}], multiplier: 3.0, basePower: 3, hp: 8 },
    { type: 'CANNON', name: '牛乳瓶キャノン', description: 'カルシウムパワーで攻撃。', slots: [{req:'WHITE', value:null}], multiplier: 1.5, basePower: 2, hp: 10 },
    { type: 'SHIELD', name: '0点のテスト用紙', description: '紙装甲だがHPだけは無駄に高い。', slots: [{req:'WHITE', value:null}], multiplier: 0.1, basePower: 1, hp: 50 },
    { type: 'CANNON', name: 'プリズムレーザー', description: '青と橙の混合エネルギーが必要。', slots: [{req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 2.5, basePower: 8, hp: 10 },
    { type: 'CANNON', name: '伝説のソード', description: '勇者が使っていた剣の切っ先。', slots: [{req:'ORANGE', value:null}, {req:'ORANGE', value:null}, {req:'ORANGE', value:null}], multiplier: 3.0, basePower: 20, hp: 30 },
    { type: 'MISSILE', name: 'ドラゴン花火', description: '龍の形をした花火ミサイル。', slots: [{req:'ORANGE', value:null}, {req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 2.5, basePower: 15, hp: 15 },
    { type: 'ENGINE', name: '無限の心臓', description: '永久機関。ランクアップ効果付き。', slots: [{req:'ORANGE', value:null}, {req:'BLUE', value:null}], multiplier: 2.0, basePower: 5, hp: 40, specialEffect: 'RANK_UP' },
    { type: 'CANNON', name: '白チョーク連射砲', description: '白エネルギーを使うほど黒板粉が舞い、出力が伸びる。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.3, basePower: 3, hp: 10, specialEffect: 'WHITE_BONUS' },
    { type: 'CANNON', name: 'おそろいノート砲', description: '同じ数字をそろえると一斉提出の勢いで火力が増す。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 10, specialEffect: 'MATCH_BONUS' },
    { type: 'MISSILE', name: '補習プリントランチャー', description: '低い数字ほど枚数で押し込む。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'LOW_SCORE_BOOST' },
    { type: 'CANNON', name: '一発勝負えんぴつ', description: 'たった1枚にすべてを賭ける小テスト特化砲。', slots: [{req:'ANY', value:null}], multiplier: 2.0, basePower: 2, hp: 6, specialEffect: 'SOLO_DOUBLE' },
    { type: 'CANNON', name: '虹色時間割レーザー', description: '3色の授業をそろえると時間割共鳴で威力が跳ね上がる。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.5, basePower: 8, hp: 12, specialEffect: 'RAINBOW_BONUS' },
    { type: 'SHIELD', name: '図工パレットシールド', description: '3色がそろうとカラフルな防壁が完成する。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.1, basePower: 6, hp: 14, specialEffect: 'RAINBOW_BONUS' },
    { type: 'SHIELD', name: '保健室の白衣', description: '白エネルギーで守りが厚くなる。', slots: [{req:'WHITE', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 4, hp: 12, specialEffect: 'WHITE_BONUS' },
    { type: 'ENGINE', name: '連絡網コピー機', description: '増幅炉の量産型。連絡事項を次々と複製する。', slots: [{req:'BLUE', value:null}], multiplier: 0, basePower: 0, hp: 10, specialEffect: 'RANK_UP' },
    { type: 'ENGINE', name: '給食ワゴンエンジン', description: '配膳の勢いで燃料を回収する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.4, basePower: 2, hp: 12, specialEffect: 'RECYCLE' },
    { type: 'SHIELD', name: '画用紙トゲバリア', description: '厚紙の反発で被弾を押し返す。', slots: [{req:'ORANGE', value:null}, {req:'ANY', value:null}], multiplier: 1.3, basePower: 5, hp: 18, specialEffect: 'THORNS' },
    { type: 'AMPLIFIER', name: '朝礼マイク', description: '朝礼の声量で隣接パーツを底上げする。', slots: [{req:'WHITE', value:null}], multiplier: 0, basePower: 3, hp: 8 },
    { type: 'AMPLIFIER', name: '応援メガホン', description: '体育祭ばりの声援で隣接出力を引き上げる。', slots: [{req:'ORANGE', value:null}], multiplier: 0, basePower: 4, hp: 8 },
    { type: 'MISSILE', name: '図書室しおりスナイパー', description: '静かな狙撃。青と白を丁寧にそろえる高精度型。', slots: [{req:'BLUE', value:null}, {req:'WHITE', value:null}], multiplier: 2.2, basePower: 5, hp: 9 },
    { type: 'CANNON', name: '掃除当番モップブレード', description: '勢いよく振り抜く近距離切断。', slots: [{req:'WHITE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.6, basePower: 5, hp: 10 },
    { type: 'MISSILE', name: '黒板けしストーム', description: '白エネルギーが多いほど粉塵爆発が強まる。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 1.2, basePower: 6, hp: 12, specialEffect: 'WHITE_BONUS' },
    { type: 'ENGINE', name: '理科準備室コイル', description: '理科室の配線を流用した高効率推進器。', slots: [{req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 2.4, basePower: 3, hp: 10 },
    { type: 'CANNON', name: '学級新聞キャノン', description: '同じ数字がそろうと号外の勢いで一斉発射。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.9, basePower: 6, hp: 12, specialEffect: 'MATCH_BONUS' },
    { type: 'CANNON', name: '居残り反省文シュレッダー', description: '低い数字の束を勢いに変える裁断砲。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'WHITE', value:null}], multiplier: 1.0, basePower: 5, hp: 11, specialEffect: 'LOW_SCORE_BOOST' },
    { type: 'SHIELD', name: '放課後見回りライト', description: '単独起動時だけ強く光る防護ライト。', slots: [{req:'BLUE', value:null}], multiplier: 1.4, basePower: 3, hp: 8, specialEffect: 'SOLO_DOUBLE' },
    { type: 'CANNON', name: '青インク速射砲', description: '青エネルギーの本数だけ追撃火力が伸びる。', slots: [{req:'BLUE', value:null}, {req:'BLUE', value:null}], multiplier: 1.2, basePower: 3, hp: 10, specialEffect: 'BLUE_BONUS' },
    { type: 'CANNON', name: '夕焼け校舎ブラスター', description: 'オレンジの熱量で一気に押し切る。', slots: [{req:'ORANGE', value:null}, {req:'ANY', value:null}], multiplier: 1.4, basePower: 4, hp: 10, specialEffect: 'ORANGE_BONUS' },
    { type: 'CANNON', name: '成績表ジャッジメント', description: '高得点カードほど厳しく評価して威力化する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 11, specialEffect: 'HIGH_SCORE_BOOST' },
    { type: 'CANNON', name: '偶数小テスト砲', description: '偶数で揃うと模範解答の火力を放つ。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 3, hp: 9, specialEffect: 'EVEN_BONUS' },
    { type: 'MISSILE', name: '奇数暗記ミサイル', description: '奇数だけでそろえる変則弾幕。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 4, hp: 9, specialEffect: 'ODD_BONUS' },
    { type: 'CANNON', name: '時間割シーケンス砲', description: '並び順の美しさで威力が跳ね上がる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 5, hp: 11, specialEffect: 'SEQUENCE_BONUS' },
    { type: 'MISSILE', name: '単色クレヨンポッド', description: '同じ色で染めるほどまとまりが出る。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.9, basePower: 5, hp: 10, specialEffect: 'MONO_COLOR_BONUS' },
    { type: 'SHIELD', name: '追い込み補習バリア', description: '過充填した時だけ回復もこなす守り。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 6, hp: 13, specialEffect: 'OVERCHARGE_HEAL' },
    { type: 'ENGINE', name: '早弁エンジン', description: '大きな数字をまとめて食べると燃料を吐き出す。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 2, hp: 10, specialEffect: 'OVERCHARGE_RECYCLE' },
    { type: 'AMPLIFIER', name: '文化祭ライトアップ', description: '3色そろうと舞台照明ばりの増幅を行う。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 0, basePower: 4, hp: 8, specialEffect: 'RAINBOW_BONUS' },
    { type: 'AMPLIFIER', name: '生徒会拡声器', description: '高得点エネルギーほど校内中に響き渡る。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'HIGH_SCORE_BOOST' },
    { type: 'SHIELD', name: '保護者会パーテーション', description: '同色統一で場を完全に仕切る。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 5, hp: 12, specialEffect: 'MONO_COLOR_BONUS' },
    { type: 'MISSILE', name: 'ノート端切れシュート', description: '小さい数字を束ねるほど鋭く飛ぶ。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'WHITE', value:null}], multiplier: 1.0, basePower: 4, hp: 9, specialEffect: 'LOW_SCORE_BOOST' },
    { type: 'CANNON', name: '目覚まし当番砲', description: '朝イチの一発だけに全力を込める。', slots: [{req:'WHITE', value:null}], multiplier: 2.2, basePower: 2, hp: 7, specialEffect: 'SOLO_DOUBLE' },
    { type: 'SHIELD', name: '理科室フラスコ盾', description: '青い試薬を注ぐほど防壁が安定する。', slots: [{req:'BLUE', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 11, specialEffect: 'BLUE_BONUS' },
    { type: 'ENGINE', name: '習字半紙ブースター', description: '白エネルギーに反応して静かに加速する。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.4, basePower: 2, hp: 9, specialEffect: 'WHITE_BONUS' },
    { type: 'AMPLIFIER', name: '絵の具パレット増幅器', description: '色がそろうほど図工室の魔法が強まる。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'RAINBOW_BONUS' },
    { type: 'ENGINE', name: '昼休み鬼ごっこエンジン', description: '偶数の歩調で加速が安定する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.3, basePower: 2, hp: 10, specialEffect: 'EVEN_BONUS' },
    { type: 'AMPLIFIER', name: '机寄せプッシャー', description: '同じ数字をそろえて列全体を押し出す。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 7, specialEffect: 'MATCH_BONUS' },
    { type: 'ENGINE', name: '校門ダッシュジェット', description: '奇数テンポのスタートダッシュに特化。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.3, basePower: 2, hp: 10, specialEffect: 'ODD_BONUS' },
    { type: 'CANNON', name: '連続チャイム砲', description: '順番通りに鳴るほど破壊音が増す。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.0, basePower: 6, hp: 12, specialEffect: 'SEQUENCE_BONUS' },
    { type: 'MISSILE', name: '反省文ミサイルポッド', description: '低評価の束を容赦なく撃ち込む。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.9, basePower: 5, hp: 10, specialEffect: 'LOW_SCORE_BOOST' },
    { type: 'SHIELD', name: '午後の眠気クッション', description: '過充填で眠気が飛ぶと同時に回復する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 5, hp: 13, specialEffect: 'OVERCHARGE_HEAL' },
    { type: 'CANNON', name: '放送原稿キャノン', description: '同じ色の原稿束で火力を安定化する。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 1.2, basePower: 4, hp: 10, specialEffect: 'MONO_COLOR_BONUS' },
    { type: 'MISSILE', name: '掲示板ホチキスランチャー', description: '同じ数字で留めるほど発射が鋭い。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'WHITE', value:null}], multiplier: 1.0, basePower: 5, hp: 10, specialEffect: 'MATCH_BONUS' },
    { type: 'ENGINE', name: '修学旅行エンジン', description: '色とりどりの思い出を燃料に変える。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.5, basePower: 3, hp: 11, specialEffect: 'RAINBOW_BONUS' },
    { type: 'SHIELD', name: '風紀チェックライト', description: '高得点カードほど強く取り締まる防壁。', slots: [{req:'BLUE', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 5, hp: 12, specialEffect: 'HIGH_SCORE_BOOST' },
    { type: 'CANNON', name: '掃除ロッカーラム', description: 'オレンジエネルギーで雑に押し切る衝角。', slots: [{req:'ORANGE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.4, basePower: 4, hp: 11, specialEffect: 'ORANGE_BONUS' },
    { type: 'AMPLIFIER', name: 'クラス旗ブースター', description: '同色で染まるほど応援がまとまる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'MONO_COLOR_BONUS' },
    { type: 'CANNON', name: '係決めじゃんけん砲', description: '偶数でまとまると話が早い。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.9, basePower: 5, hp: 10, specialEffect: 'EVEN_BONUS' },
    { type: 'MISSILE', name: '帰りの会スパイラル', description: '奇数で揃えると締めの一撃が強い。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.9, basePower: 5, hp: 10, specialEffect: 'ODD_BONUS' },
    { type: 'SHIELD', name: '体育館マット壁', description: '同じ数字を重ねるほど防壁が分厚くなる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 14, specialEffect: 'MATCH_BONUS' },
    { type: 'ENGINE', name: '予鈴スタート装置', description: '単独入力で一気に走り出す。', slots: [{req:'BLUE', value:null}], multiplier: 1.8, basePower: 2, hp: 7, specialEffect: 'SOLO_DOUBLE' },
    { type: 'AMPLIFIER', name: '班長メモ増幅器', description: '高得点の指示ほど周囲に伝わる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0, basePower: 2, hp: 8, specialEffect: 'HIGH_SCORE_BOOST' },
    { type: 'CANNON', name: '宿題チェックアーム', description: '高得点カードを見逃さず出力へ変える。', slots: [{req:'ANY', value:null}, {req:'BLUE', value:null}], multiplier: 1.2, basePower: 4, hp: 10, specialEffect: 'HIGH_SCORE_BOOST' },
    { type: 'MISSILE', name: '色紙メッセージ弾', description: '同じ色でまとめると気持ちが乗る。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 9, specialEffect: 'MONO_COLOR_BONUS' },
    { type: 'SHIELD', name: '保冷剤ベスト', description: '青い冷気が多いほど守りが硬い。', slots: [{req:'BLUE', value:null}, {req:'BLUE', value:null}], multiplier: 1.2, basePower: 4, hp: 12, specialEffect: 'BLUE_BONUS' },
    { type: 'ENGINE', name: '夕方寄り道タービン', description: 'オレンジの勢いで燃料を押し戻す。', slots: [{req:'ORANGE', value:null}, {req:'ANY', value:null}], multiplier: 1.3, basePower: 2, hp: 10, specialEffect: 'ORANGE_BONUS' },
    { type: 'CANNON', name: '表彰状フラッシュ', description: '高得点時だけまぶしい一撃になる。', slots: [{req:'WHITE', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 5, hp: 10, specialEffect: 'HIGH_SCORE_BOOST' },
    { type: 'AMPLIFIER', name: '時間割ボード', description: '数字の流れが整うほど強く支援する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'SEQUENCE_BONUS' },
    { type: 'SHIELD', name: '折りたたみ座布団', description: '低い数字でも枚数で守りを作る。', slots: [{req:'WHITE', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.9, basePower: 5, hp: 13, specialEffect: 'LOW_SCORE_BOOST' },
    { type: 'MISSILE', name: '校外学習スタンプ弾', description: '順番通りの記録で破壊力が増す。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.0, basePower: 6, hp: 10, specialEffect: 'SEQUENCE_BONUS' },
    { type: 'ENGINE', name: '購買ダッシュ装置', description: '過充填に成功すると燃料が返ってくる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 2, hp: 10, specialEffect: 'OVERCHARGE_RECYCLE' },
    { type: 'CANNON', name: '教科書積み上げ砲', description: '同じ数字を積み上げるほど厚みで押し潰す。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 5, hp: 12, specialEffect: 'MATCH_BONUS' },
    { type: 'SHIELD', name: 'ホームルーム結界', description: '3色がそろうと一体感で防壁が完成する。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.0, basePower: 5, hp: 12, specialEffect: 'RAINBOW_BONUS' },
    { type: 'AMPLIFIER', name: '点呼ホイッスル', description: '奇数テンポの合図が味方を鼓舞する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'ODD_BONUS' },
    { type: 'CANNON', name: '卒業式フラワーシャワー', description: '3色の祝福がそろうと華やかに炸裂する。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.2, basePower: 7, hp: 11, specialEffect: 'RAINBOW_BONUS' },
    { type: 'MISSILE', name: '先生の赤チョーク弾', description: 'オレンジの勢いで小テストを返却する。', slots: [{req:'ORANGE', value:null}, {req:'ANY', value:null}], multiplier: 1.3, basePower: 4, hp: 10, specialEffect: 'ORANGE_BONUS' },
    { type: 'ENGINE', name: '放課後居残りブースト', description: '高負荷の過充填でさらに燃料が戻る。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 3, hp: 11, specialEffect: 'OVERCHARGE_RECYCLE' },
    { type: 'SHIELD', name: '連絡板ガード', description: '単色でそろえるほど一枚岩の守りになる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.9, basePower: 5, hp: 13, specialEffect: 'MONO_COLOR_BONUS' },
    { type: 'CANNON', name: '素数判定レーザー', description: '素数だけを見抜いて高火力へ変える。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 10, specialEffect: 'PRIME_BONUS' },
    { type: 'SHIELD', name: '平方数プロテクタ', description: '平方数の整った力場で守りを固める。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 12, specialEffect: 'SQUARE_BONUS' },
    { type: 'ENGINE', name: '最大公約エンジン', description: '数字の共通因子を効率へ変換する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 3, hp: 10, specialEffect: 'GCD_BONUS' },
    { type: 'CANNON', name: '最小公倍キャノン', description: '数字を重ねて巨大な一撃を放つ。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.9, basePower: 5, hp: 11, specialEffect: 'LCM_BONUS' },
    { type: 'ENGINE', name: 'フィボナッチ翼', description: '成長する数列に共鳴して加速する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 3, hp: 9, specialEffect: 'FIBONACCI_BONUS' },
    { type: 'CANNON', name: '平均点ブラスター', description: '平均点が高いほど安定して強い。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'MEAN_BONUS' },
    { type: 'SHIELD', name: '中央値シールド', description: '極端な値に左右されない堅実な防壁。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.9, basePower: 5, hp: 13, specialEffect: 'MEDIAN_BONUS' },
    { type: 'AMPLIFIER', name: '同型共鳴器', description: '同じタイプが隣にあるほど共鳴する。', slots: [{req:'WHITE', value:null}], multiplier: 0, basePower: 2, hp: 8, specialEffect: 'SAME_TYPE_LINK' },
    { type: 'AMPLIFIER', name: '整列委員アレイ', description: '同じ列が整うと一斉強化を行う。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'ROW_UNITY' },
    { type: 'AMPLIFIER', name: '中央司令塔', description: '中央で全体を見渡して指揮を執る。', slots: [{req:'BLUE', value:null}], multiplier: 0, basePower: 3, hp: 9, specialEffect: 'CENTER_COMMAND' },
    { type: 'MISSILE', name: '対角線レーザー', description: '斜めの仲間を数えて収束する。', slots: [{req:'BLUE', value:null}, {req:'WHITE', value:null}], multiplier: 1.3, basePower: 4, hp: 9, specialEffect: 'DIAGONAL_LINK' },
    { type: 'MISSILE', name: '左右対称ノズル', description: '対称配置で照準が安定する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 4, hp: 9, specialEffect: 'MIRROR_BONUS' },
    { type: 'ENGINE', name: '学期末ブースター', description: '長期戦になるほど本気を出す。', slots: [{req:'ORANGE', value:null}, {req:'BLUE', value:null}], multiplier: 1.0, basePower: 3, hp: 10, specialEffect: 'TURN_SCALE' },
    { type: 'SHIELD', name: '反省ログ装甲', description: '痛みを記録し、次の守りへ変える。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 1.0, basePower: 5, hp: 14, specialEffect: 'DAMAGE_MEMORY' },
    { type: 'CANNON', name: '努力ノート砲', description: '同じパーツに装填するほど努力が実る。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 10, specialEffect: 'EFFORT_STACK' },
    { type: 'AMPLIFIER', name: '自由研究アーカイブ', description: '戦闘中に見た数字の種類を研究成果に変える。', slots: [{req:'ANY', value:null}], multiplier: 0, basePower: 2, hp: 8, specialEffect: 'UNIQUE_VALUE_RECORD' },
    { type: 'MISSILE', name: 'くじ引きクラッカー', description: '大当たりが出れば一気に爆ぜる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 9, specialEffect: 'RANDOM_SPIKE' },
    { type: 'AMPLIFIER', name: '天気予報アンテナ', description: '日直の予報色に合わせて増幅する。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'FORECAST_COLOR' },
    { type: 'ENGINE', name: 'ラッキー鉛筆', description: '運が良ければカードを使い回せる。', slots: [{req:'WHITE', value:null}], multiplier: 1.4, basePower: 2, hp: 8, specialEffect: 'NO_CONSUME_CHANCE' },
    { type: 'CANNON', name: '微分ドリルバースト', description: '素数と高平均の両立を目指す理系砲。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'BLUE', value:null}], multiplier: 1.0, basePower: 5, hp: 11, specialEffect: 'PRIME_BONUS' },
    { type: 'SHIELD', name: '市松模様ガード', description: '対称と整列の両方を意識した守り。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 5, hp: 12, specialEffect: 'MIRROR_BONUS' },
    { type: 'CANNON', name: '回文読みレーザー', description: '前から読んでも後ろから読んでも強い。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'PALINDROME_BONUS' },
    { type: 'MISSILE', name: '15点満点ミサイル', description: '合計点ぴったりの美しさを威力に変える。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'SUM_FIFTEEN_BONUS' },
    { type: 'CANNON', name: '三の倍数ジョーク砲', description: '3の倍数だけ妙に強い。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 10, specialEffect: 'MULTIPLE_OF_THREE_BONUS' },
    { type: 'AMPLIFIER', name: '手札分析ボード', description: '選択肢が多いほど作戦は冴える。', slots: [{req:'WHITE', value:null}], multiplier: 0, basePower: 2, hp: 8, specialEffect: 'HAND_SIZE_BONUS' },
    { type: 'MISSILE', name: '居残りテンポ弾', description: '一時カードの勢いで飛び出す連続弾。', slots: [{req:'BLUE', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 4, hp: 9, specialEffect: 'TEMP_CARD_BONUS' },
    { type: 'SHIELD', name: '壁ぎわロッカー盾', description: '端に置くと安定する壁役。', slots: [{req:'ANY', value:null}, {req:'WHITE', value:null}], multiplier: 1.0, basePower: 5, hp: 12, specialEffect: 'EDGE_BONUS' },
    { type: 'CANNON', name: '角席スナイパー', description: '教室の角から狙うと強い。', slots: [{req:'BLUE', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 4, hp: 9, specialEffect: 'CORNER_BONUS' },
    { type: 'ENGINE', name: 'ぼっち研究エンジン', description: '周りに誰もいない時ほど集中する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 2, hp: 9, specialEffect: 'ISOLATION_BONUS' },
    { type: 'CANNON', name: '交互色マーカー砲', description: '色が交互だとリズムよく発射する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 5, hp: 10, specialEffect: 'ALT_COLOR_BONUS' },
    { type: 'CANNON', name: '連投演習キャノン', description: '同じ砲に入れ続けるほど鍛えられる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 10, specialEffect: 'LAST_STREAK_BONUS' },
    { type: 'AMPLIFIER', name: '教卓の端ブースター', description: '端配置かつ手札豊富で真価を発揮。', slots: [{req:'BLUE', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'EDGE_BONUS' },
    { type: 'SHIELD', name: '回文座布団', description: '対称の数字で座り心地が増す。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.9, basePower: 5, hp: 13, specialEffect: 'PALINDROME_BONUS' },
    { type: 'MISSILE', name: '予習済みノート弾', description: '手札が多いと撃ち筋も増える。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 1.2, basePower: 4, hp: 9, specialEffect: 'HAND_SIZE_BONUS' },
    { type: 'ENGINE', name: '補習残業タービン', description: '一時カードを燃料計画に変換する。', slots: [{req:'ANY', value:null}, {req:'ORANGE', value:null}], multiplier: 1.2, basePower: 2, hp: 10, specialEffect: 'TEMP_CARD_BONUS' },
    { type: 'CANNON', name: '端数切り上げ砲', description: '端に置くと成績補正が入る。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 10, specialEffect: 'EDGE_BONUS' },
    { type: 'MISSILE', name: '角コーナーシュート', description: '角に置いた時だけ見える射線。', slots: [{req:'ORANGE', value:null}, {req:'BLUE', value:null}], multiplier: 1.2, basePower: 4, hp: 9, specialEffect: 'CORNER_BONUS' },
    { type: 'AMPLIFIER', name: '独習シグナル', description: '周囲が空いているほど信号がよく通る。', slots: [{req:'WHITE', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'ISOLATION_BONUS' },
    { type: 'SHIELD', name: 'しましま防護服', description: '交互色で縫い込むと耐久が増す。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.9, basePower: 5, hp: 12, specialEffect: 'ALT_COLOR_BONUS' },
    { type: 'ENGINE', name: '居残り連続記録計', description: '連続装填の粘りを燃料効率へ変える。', slots: [{req:'ANY', value:null}], multiplier: 1.3, basePower: 2, hp: 8, specialEffect: 'LAST_STREAK_BONUS' },
];

const UNLOCKABLE_PART_TEMPLATES: Omit<ShipPart, 'id'>[] = [
    { type: 'CANNON', name: '約数しらべ砲', description: '約数の多い数字ほど丁寧に分解して火力へ変える。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'DIVISOR_BONUS' },
    { type: 'MISSILE', name: '素因数ノートミサイル', description: '素因数の種類が多いほど、散らばるメモのように弾が増える。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'PRIME_FACTOR_BONUS' },
    { type: 'CANNON', name: '合計12ブラスター', description: '合計12や18ぴったりで会心の一撃。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'SUM_TARGET_BONUS' },
    { type: 'SHIELD', name: '余り3シールド', description: '3で割った余りが揃うと守りが整う。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.9, basePower: 5, hp: 12, specialEffect: 'MOD_MATCH_BONUS' },
    { type: 'AMPLIFIER', name: '比例グラフアンプ', description: '比が揃うとグラフの線がまっすぐ伸びる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'RATIO_BONUS' },
    { type: 'ENGINE', name: '反比例ノズル', description: '積が12になる絶妙な釣り合いで燃料を生む。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 2, hp: 10, specialEffect: 'PRODUCT_SUPPORT_BONUS' },
    { type: 'CANNON', name: '平均点レーザー', description: '平均点そのものを集束光に変える。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'MEAN_DOUBLE_BONUS' },
    { type: 'SHIELD', name: '最頻値バリア', description: 'よく出る数字ほど防壁が厚くなる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 12, specialEffect: 'MODE_BONUS' },
    { type: 'ENGINE', name: '分散スタビライザー', description: '数字のばらつきが小さいほど安定した推力を出す。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 2, hp: 10, specialEffect: 'LOW_SPREAD_BONUS' },
    { type: 'MISSILE', name: '平方数ポッド', description: '平方数を揃えるときれいに弾道がまとまる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'SQUARE_BONUS' },
    { type: 'ENGINE', name: '約分エンジン', description: '最大公約数が高いほど、約分の気持ちよさで燃費が伸びる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 2, hp: 10, specialEffect: 'GCD_FUEL_BONUS' },
    { type: 'CANNON', name: '回文読みキャノン', description: '前後対称の並びを一瞬で見抜いて撃ち抜く。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 5, hp: 10, specialEffect: 'PALINDROME_BONUS' },
    { type: 'MISSILE', name: '15点満点ロケット', description: '合計15に届いた瞬間、満点気分で加速する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'SUM_FIFTEEN_BONUS' },
    { type: 'AMPLIFIER', name: '三の倍数ブースター', description: '3の倍数だけテンポよく増幅する。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0, basePower: 2, hp: 8, specialEffect: 'MULTIPLE_OF_THREE_BONUS' },
    { type: 'ENGINE', name: '等差数列ノズル', description: '等差数列が完成すると理路整然と燃料を吐き出す。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 2, hp: 10, specialEffect: 'ARITHMETIC_BONUS' },

    { type: 'CANNON', name: '窓際スナイパー', description: '端や角に置くと視界が開けて狙撃精度が上がる。', slots: [{req:'BLUE', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 9, specialEffect: 'EDGE_BONUS' },
    { type: 'AMPLIFIER', name: '教卓タワー', description: '中央で周囲を見渡すほど指揮力が増す。', slots: [{req:'WHITE', value:null}, {req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'CENTER_ADJ_BONUS' },
    { type: 'SHIELD', name: 'ロッカー横シールド', description: '壁際に寄せるほど守備が固まる。', slots: [{req:'ANY', value:null}, {req:'WHITE', value:null}], multiplier: 0.9, basePower: 5, hp: 12, specialEffect: 'EDGE_BONUS' },
    { type: 'CANNON', name: '掲示板ライン砲', description: '同じ列の仲間が同タイプだと掲示がつながって強い。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 10, specialEffect: 'ROW_TYPE_LINK' },
    { type: 'ENGINE', name: '出入口ダッシュエンジン', description: '角からの飛び出しで一気に加速する。', slots: [{req:'ORANGE', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 2, hp: 9, specialEffect: 'CORNER_BONUS' },
    { type: 'MISSILE', name: '班行動ミサイル', description: '隣に違う役割が多いほど連携が決まる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 9, specialEffect: 'ADJACENT_DIVERSITY_BONUS' },
    { type: 'AMPLIFIER', name: '黒板前フォーメーション', description: '同じ列を同タイプで埋めると教室全体を押し上げる。', slots: [{req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'ROW_UNITY' },
    { type: 'ENGINE', name: 'すみっこ研究ノズル', description: '孤立しているほど静かに燃料が戻る。', slots: [{req:'ANY', value:null}], multiplier: 1.3, basePower: 2, hp: 8, specialEffect: 'ISOLATION_FUEL_BONUS' },
    { type: 'SHIELD', name: '中央通路バリア', description: '中央列に置き、上下が埋まるほど守りが伸びる。', slots: [{req:'ANY', value:null}, {req:'BLUE', value:null}], multiplier: 1.0, basePower: 5, hp: 12, specialEffect: 'CENTER_COLUMN_BONUS' },
    { type: 'CANNON', name: '左右確認レーザー', description: '左右対称の位置に同タイプがあると一斉照射する。', slots: [{req:'ANY', value:null}, {req:'BLUE', value:null}], multiplier: 1.1, basePower: 4, hp: 10, specialEffect: 'MIRROR_BONUS' },

    { type: 'CANNON', name: 'くじ当てキャノン', description: '当たりなら超火力、外れても少しは頑張る。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'RANDOM_SWING' },
    { type: 'SHIELD', name: '占いシールド', description: '今日のラッキーカラーに合わせると守りが伸びる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 12, specialEffect: 'FORECAST_COLOR' },
    { type: 'ENGINE', name: '席替えエンジン', description: 'うまくハマるとエネルギーを消費しない。', slots: [{req:'ANY', value:null}, {req:'BLUE', value:null}], multiplier: 1.1, basePower: 2, hp: 9, specialEffect: 'NO_CONSUME_CHANCE' },
    { type: 'MISSILE', name: '福引ミサイル', description: '大吉なら大爆発、外れでも最低限は飛ぶ。', slots: [{req:'ANY', value:null}, {req:'ORANGE', value:null}], multiplier: 1.0, basePower: 4, hp: 9, specialEffect: 'RANDOM_SWING' },
    { type: 'AMPLIFIER', name: '山勘アンプ', description: 'その場の勘で増幅値が上下する。', slots: [{req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'RANDOM_SWING' },
    { type: 'ENGINE', name: '忘れ物リサイクラ', description: 'たまにカードを使わずに済ませるちゃっかり者。', slots: [{req:'WHITE', value:null}], multiplier: 1.2, basePower: 2, hp: 8, specialEffect: 'NO_CONSUME_CHANCE' },
    { type: 'CANNON', name: 'ラッキーカラー砲', description: 'そのターンの予報色を当てるとよく伸びる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.1, basePower: 4, hp: 9, specialEffect: 'FORECAST_COLOR' },
    { type: 'SHIELD', name: 'おみくじバリア', description: '守りの強さが毎回変わる博打防壁。', slots: [{req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 11, specialEffect: 'RANDOM_SWING' },

    { type: 'CANNON', name: '努力記録レーザー', description: 'この戦闘での装填回数がそのまま威力になる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'EFFORT_STACK' },
    { type: 'SHIELD', name: '継続観察シールド', description: 'ターン経過ごとに観察力が増して守りが厚くなる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 12, specialEffect: 'TURN_SCALE' },
    { type: 'ENGINE', name: '部活ランエンジン', description: '連続装填の勢いで推進力が伸びる。', slots: [{req:'ANY', value:null}], multiplier: 1.2, basePower: 2, hp: 8, specialEffect: 'LAST_STREAK_BONUS' },
    { type: 'AMPLIFIER', name: '宿題ログアンプ', description: '見た数字の種類が多いほど分析が進む。', slots: [{req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'UNIQUE_VALUE_RECORD' },
    { type: 'MISSILE', name: '学期末ミサイル', description: '終盤になるほど締切の圧で強くなる。', slots: [{req:'ANY', value:null}, {req:'ORANGE', value:null}], multiplier: 1.0, basePower: 4, hp: 9, specialEffect: 'TURN_SCALE' },
    { type: 'CANNON', name: '研究発表キャノン', description: '手札が多いほど選択肢を火力へ変える。', slots: [{req:'ANY', value:null}, {req:'BLUE', value:null}], multiplier: 1.0, basePower: 5, hp: 10, specialEffect: 'HAND_SIZE_BONUS' },
    { type: 'SHIELD', name: '反省ノートバリア', description: '受けた痛みを忘れず、次の守りに変える。', slots: [{req:'ANY', value:null}], multiplier: 1.0, basePower: 5, hp: 12, specialEffect: 'DAMAGE_MEMORY' },
    { type: 'ENGINE', name: '居残りターボ', description: '一時カードの勢いで放課後に加速する。', slots: [{req:'ANY', value:null}, {req:'BLUE', value:null}], multiplier: 1.2, basePower: 2, hp: 9, specialEffect: 'TEMP_CARD_BONUS' },

    { type: 'ENGINE', name: '保健室補給ポッド', description: '過充填に成功すると回復も燃料補給もこなす。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 2, hp: 10, specialEffect: 'OVERCHARGE_SUPPORT' },
    { type: 'CANNON', name: '給食当番キャノン', description: '3色が揃うと配膳の勢いで火力も体力も伸びる。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.1, basePower: 5, hp: 11, specialEffect: 'RAINBOW_HEAL_BONUS' },
    { type: 'AMPLIFIER', name: '学級費アンプ', description: '余っている燃料をぜいたくに増幅へ回す。', slots: [{req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'FUEL_RESERVE_BONUS' },
    { type: 'SHIELD', name: '清掃時間シールド', description: '青い雑巾が多いほど守りと反撃が増す。', slots: [{req:'BLUE', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 5, hp: 12, specialEffect: 'BLUE_THORNS_BONUS' },
    { type: 'CANNON', name: '放送室エコー砲', description: '同じ数字が2枚でも3枚でも響き方が変わる。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'ECHO_MATCH_BONUS' },
    { type: 'MISSILE', name: '図書整理ミサイル', description: '数字が全部違うと整理され、3色ならさらに整う。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.0, basePower: 4, hp: 10, specialEffect: 'ALL_UNIQUE_RAINBOW_BONUS' },
    { type: 'AMPLIFIER', name: '文化祭カウントダウン', description: '終盤になるほど会場の熱気で増幅が強まる。', slots: [{req:'ANY', value:null}], multiplier: 0, basePower: 3, hp: 8, specialEffect: 'TURN_SCALE' },
    { type: 'ENGINE', name: '進路相談コア', description: '中央に据えてフル装填すると安定して燃料が戻る。', slots: [{req:'ANY', value:null}, {req:'WHITE', value:null}], multiplier: 1.1, basePower: 2, hp: 10, specialEffect: 'CENTER_FULL_BONUS' },
    { type: 'CANNON', name: '卒業アルバム砲', description: '見てきた数字の多様さと3色の思い出を火力に変える。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.0, basePower: 5, hp: 11, specialEffect: 'UNIQUE_RAINBOW_BONUS' },
];

const PAPER_PLANE_UNLOCK_TARGET = 50;
const getAvailablePartTemplates = (progress: PaperPlaneProgress) => {
    const unlockedNames = new Set(progress.unlockedPartNames || []);
    return [
        ...PART_TEMPLATES,
        ...UNLOCKABLE_PART_TEMPLATES.filter(template => unlockedNames.has(template.name)),
    ];
};
const getLockedUnlockablePartTemplates = (progress: PaperPlaneProgress) => {
    const unlockedNames = new Set(progress.unlockedPartNames || []);
    return UNLOCKABLE_PART_TEMPLATES.filter(template => !unlockedNames.has(template.name));
};
const createPartFromTemplate = (template: Omit<ShipPart, 'id'>, idPrefix: string, quality = 1.0): ShipPart => ({
    id: `${idPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: template.type,
    name: template.name + (quality > 1 ? '+' : ''),
    description: template.description,
    slots: cloneSlots(template.slots),
    multiplier: template.multiplier * quality,
    basePower: Math.floor(template.basePower * quality),
    hp: 10,
    specialEffect: template.specialEffect,
});
const rollRewardParts = (templates: Omit<ShipPart, 'id'>[], count: number, idPrefix: string) => {
    const opts: ShipPart[] = [];
    const pool = [...templates];
    for (let i = 0; i < count; i++) {
        if (pool.length === 0) break;
        const idx = Math.floor(Math.random() * pool.length);
        const template = pool[idx];
        pool.splice(idx, 1);
        const quality = Math.random() < 0.2 ? 1.5 : 1.0;
        opts.push(createPartFromTemplate(template, `${idPrefix}_${i}`, quality));
    }
    return opts;
};

// --- HELPERS ---

const getColorRank = (color: EnergyColor | 'ANY'): number => {
    switch (color) {
        case 'ORANGE': return 3;
        case 'BLUE': return 2;
        case 'WHITE': return 1;
        case 'ANY': return 0;
        default: return 0;
    }
};

const isColorCompatible = (cardColor: EnergyColor, slotReq: EnergyColor | 'ANY'): boolean => {
    return getColorRank(cardColor) >= getColorRank(slotReq);
};

const cloneSlots = (slots: EnergySlot[]): EnergySlot[] => slots.map(slot => ({
    ...slot,
    value: slot.value ?? null,
    loadedColor: slot.loadedColor ?? null,
}));

interface PartEvalContext {
    row?: number;
    col?: number;
    parts?: ShipPart[];
    hand?: EnergyCard[];
    turn?: number;
    battleStats?: BattleStats;
    fuel?: number;
}

const DEFAULT_BATTLE_STATS: BattleStats = {
    damageTaken: 0,
    seenValues: [],
    partLoadCounts: {},
    lastLoadedPartId: null,
    lastLoadedStreak: 0,
};

const createBattleStats = (): BattleStats => ({
    ...DEFAULT_BATTLE_STATS,
    seenValues: [],
    partLoadCounts: {},
});

const getLoadedSlots = (part: ShipPart) => part.slots.filter(slot => slot.value !== null);

const getLoadedValues = (part: ShipPart) => getLoadedSlots(part).map(slot => slot.value || 0);

const getLoadedColors = (part: ShipPart): EnergyColor[] => (
    getLoadedSlots(part)
        .map(slot => slot.loadedColor)
        .filter((color): color is EnergyColor => color === 'WHITE' || color === 'BLUE' || color === 'ORANGE')
);

const getPartIndex = (row: number, col: number) => (row * SHIP_WIDTH) + col;
const clampBonus = (value: number, max = 12) => Math.max(0, Math.min(max, value));
const uniqueCount = <T,>(arr: T[]) => new Set(arr).size;
const isPrimeNumber = (n: number) => {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) return false;
    }
    return true;
};
const isSquareNumber = (n: number) => Number.isInteger(Math.sqrt(n));
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const gcdArray = (values: number[]) => values.reduce((acc, value) => gcd(acc, value));
const lcm = (a: number, b: number): number => Math.abs(a * b) / gcd(a, b || 1 || a);
const lcmArray = (values: number[]) => values.reduce((acc, value) => lcm(acc, value), 1);
const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? Math.floor((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
};
const mean = (values: number[]) => values.length === 0 ? 0 : (values.reduce((sum, value) => sum + value, 0) / values.length);
const divisorCount = (n: number) => {
    if (n <= 0) return 0;
    let count = 0;
    for (let i = 1; i * i <= n; i++) {
        if (n % i === 0) count += (i * i === n) ? 1 : 2;
    }
    return count;
};
const primeFactorTypeCount = (n: number) => {
    let value = Math.abs(n);
    const factors = new Set<number>();
    for (let i = 2; i * i <= value; i++) {
        while (value % i === 0) {
            factors.add(i);
            value = Math.floor(value / i);
        }
    }
    if (value > 1) factors.add(value);
    return factors.size;
};
const modeFrequency = (values: number[]) => {
    const counts: Record<number, number> = {};
    values.forEach(value => {
        counts[value] = (counts[value] || 0) + 1;
    });
    return Object.values(counts).reduce((best, count) => Math.max(best, count), 0);
};
const product = (values: number[]) => values.reduce((acc, value) => acc * value, 1);
const hasConstantRatio = (values: number[]) => {
    if (values.length < 2 || values.some(value => value === 0)) return false;
    const ratio = values[1] / values[0];
    return values.every((value, idx) => idx === 0 || Math.abs((value / values[idx - 1]) - ratio) < 0.001);
};
const hasConstantDifference = (values: number[]) => {
    if (values.length < 2) return false;
    const diff = values[1] - values[0];
    return values.every((value, idx) => idx === 0 || (value - values[idx - 1]) === diff);
};
const spread = (values: number[]) => values.length === 0 ? 0 : Math.max(...values) - Math.min(...values);
const verticalNeighbors = (context?: PartEvalContext) => {
    if (!context?.parts || context.row === undefined || context.col === undefined) return [] as ShipPart[];
    const neighbors = [
        { row: context.row - 1, col: context.col },
        { row: context.row + 1, col: context.col },
    ];
    return neighbors
        .filter(n => n.row >= 0 && n.row < SHIP_HEIGHT && n.col >= 0 && n.col < SHIP_WIDTH)
        .map(n => context.parts![getPartIndex(n.row, n.col)]);
};
const allUnique = (values: number[]) => new Set(values).size === values.length;
const isFibonacciNumber = (n: number) => {
    const testA = (5 * n * n) + 4;
    const testB = (5 * n * n) - 4;
    return isSquareNumber(testA) || isSquareNumber(testB);
};
const deterministicRoll = (seed: string) => {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        hash ^= seed.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) % 1000) / 1000;
};
const getForecastColor = (turn: number = 1): EnergyColor => {
    const colors: EnergyColor[] = ['WHITE', 'BLUE', 'ORANGE'];
    return colors[Math.max(0, (turn - 1) % colors.length)];
};
const getAdjacentParts = (context?: PartEvalContext) => {
    if (!context?.parts || context.row === undefined || context.col === undefined) return [] as ShipPart[];
    const neighbors = [
        { row: context.row - 1, col: context.col },
        { row: context.row + 1, col: context.col },
        { row: context.row, col: context.col - 1 },
        { row: context.row, col: context.col + 1 },
    ];
    return neighbors
        .filter(n => n.row >= 0 && n.row < SHIP_HEIGHT && n.col >= 0 && n.col < SHIP_WIDTH)
        .map(n => context.parts![getPartIndex(n.row, n.col)]);
};
const getDiagonalParts = (context?: PartEvalContext) => {
    if (!context?.parts || context.row === undefined || context.col === undefined) return [] as ShipPart[];
    const neighbors = [
        { row: context.row - 1, col: context.col - 1 },
        { row: context.row - 1, col: context.col + 1 },
        { row: context.row + 1, col: context.col - 1 },
        { row: context.row + 1, col: context.col + 1 },
    ];
    return neighbors
        .filter(n => n.row >= 0 && n.row < SHIP_HEIGHT && n.col >= 0 && n.col < SHIP_WIDTH)
        .map(n => context.parts![getPartIndex(n.row, n.col)]);
};
const getRowParts = (context?: PartEvalContext) => {
    if (!context?.parts || context.row === undefined) return [] as ShipPart[];
    return context.parts.slice(context.row * SHIP_WIDTH, (context.row * SHIP_WIDTH) + SHIP_WIDTH);
};
const getMirrorPart = (context?: PartEvalContext) => {
    if (!context?.parts || context.row === undefined || context.col === undefined) return null as ShipPart | null;
    const mirrorCol = (SHIP_WIDTH - 1) - context.col;
    if (mirrorCol === context.col) return null;
    return context.parts[getPartIndex(context.row, mirrorCol)] || null;
};
const isEdgePosition = (context?: PartEvalContext) =>
    context?.row !== undefined && context?.col !== undefined &&
    (context.row === 0 || context.row === SHIP_HEIGHT - 1 || context.col === 0 || context.col === SHIP_WIDTH - 1);
const isCornerPosition = (context?: PartEvalContext) =>
    context?.row !== undefined && context?.col !== undefined &&
    ((context.row === 0 || context.row === SHIP_HEIGHT - 1) && (context.col === 0 || context.col === SHIP_WIDTH - 1));

const calculatePartOutput = (part: ShipPart, context?: PartEvalContext) => {
    const loadedSlots = getLoadedSlots(part);
    const loadedValues = getLoadedValues(part);
    const energySum = loadedSlots.reduce((sum, slot) => sum + (slot.value || 0), 0);
    const isFull = part.slots.length > 0 && loadedSlots.length === part.slots.length;

    if (energySum <= 0 && part.slots.length > 0) {
        return { energySum, isFull, output: 0, specialBonus: 0 };
    }

    let output = Math.floor(energySum * part.multiplier);
    if (isFull) output += part.basePower;

    const loadedColors = getLoadedColors(part);
    let specialBonus = 0;

    switch (part.specialEffect) {
        case 'WHITE_BONUS':
            specialBonus = loadedColors.filter(color => color === 'WHITE').length * 2;
            break;
        case 'MATCH_BONUS':
            if (isFull && loadedSlots.length >= 2) {
                const firstValue = loadedSlots[0]?.value;
                if (loadedSlots.every(slot => slot.value === firstValue)) {
                    specialBonus = 4;
                }
            }
            break;
        case 'LOW_SCORE_BOOST':
            specialBonus = loadedSlots.reduce((sum, slot) => sum + (((slot.value || 0) <= 3) ? (slot.value || 0) : 0), 0);
            break;
        case 'RAINBOW_BONUS':
            if (isFull && new Set(loadedColors).size >= 3) {
                specialBonus = 6;
            }
            break;
        case 'SOLO_DOUBLE':
            if (loadedSlots.length === 1 && loadedSlots[0].value !== null) {
                specialBonus = output;
            }
            break;
        case 'BLUE_BONUS':
            specialBonus = loadedColors.filter(color => color === 'BLUE').length * 2;
            break;
        case 'ORANGE_BONUS':
            specialBonus = loadedColors.filter(color => color === 'ORANGE').length * 3;
            break;
        case 'HIGH_SCORE_BOOST':
            specialBonus = loadedSlots.filter(slot => (slot.value || 0) >= 6).length * 3;
            break;
        case 'EVEN_BONUS':
            if (isFull && loadedSlots.length > 0 && loadedSlots.every(slot => ((slot.value || 0) % 2) === 0)) {
                specialBonus = 5;
            }
            break;
        case 'ODD_BONUS':
            if (isFull && loadedSlots.length > 0 && loadedSlots.every(slot => ((slot.value || 0) % 2) === 1)) {
                specialBonus = 5;
            }
            break;
        case 'SEQUENCE_BONUS':
            if (isFull && loadedSlots.length >= 2) {
                const values = loadedSlots.map(slot => slot.value || 0);
                const ascending = values.every((value, idx) => idx === 0 || value > values[idx - 1]);
                const descending = values.every((value, idx) => idx === 0 || value < values[idx - 1]);
                if (ascending || descending) specialBonus = 6;
            }
            break;
        case 'MONO_COLOR_BONUS':
            if (isFull && loadedColors.length > 0 && new Set(loadedColors).size === 1) {
                specialBonus = 6;
            }
            break;
        case 'OVERCHARGE_HEAL':
        case 'OVERCHARGE_RECYCLE':
            if (isFull && energySum >= 12) {
                specialBonus = 4;
            }
            break;
        case 'PRIME_BONUS':
            specialBonus = loadedValues.filter(isPrimeNumber).length * 2;
            if (isFull && loadedValues.length > 0 && loadedValues.every(isPrimeNumber)) specialBonus += 3;
            break;
        case 'DIVISOR_BONUS':
            specialBonus = clampBonus(Math.floor(loadedValues.reduce((sum, value) => sum + divisorCount(value), 0) / 2), 8);
            break;
        case 'PRIME_FACTOR_BONUS':
            specialBonus = clampBonus(loadedValues.reduce((sum, value) => sum + (primeFactorTypeCount(value) * 2), 0), 10);
            break;
        case 'SUM_TARGET_BONUS':
            if (energySum === 18) specialBonus = 10;
            else if (energySum === 12) specialBonus = 7;
            break;
        case 'MOD_MATCH_BONUS':
            if (isFull && loadedValues.length > 0) {
                const mod = loadedValues[0] % 3;
                if (loadedValues.every(value => value % 3 === mod)) specialBonus = 8;
            }
            break;
        case 'RATIO_BONUS':
            if (isFull && hasConstantRatio(loadedValues)) specialBonus = 6;
            break;
        case 'PRODUCT_SUPPORT_BONUS':
            if (isFull && product(loadedValues) === 12) specialBonus = 4;
            break;
        case 'MEAN_DOUBLE_BONUS':
            specialBonus = clampBonus(Math.floor(mean(loadedValues) * 2), 10);
            break;
        case 'MODE_BONUS':
            specialBonus = clampBonus(modeFrequency(loadedValues) * 3, 9);
            break;
        case 'LOW_SPREAD_BONUS':
            if (isFull && spread(loadedValues) <= 2) specialBonus = 5;
            break;
        case 'SQUARE_BONUS':
            specialBonus = loadedValues.filter(isSquareNumber).length * 3;
            if (isFull && loadedValues.length > 0 && loadedValues.every(isSquareNumber)) specialBonus += 4;
            break;
        case 'GCD_BONUS':
            if (loadedValues.length >= 2) specialBonus = clampBonus(gcdArray(loadedValues) * 2);
            break;
        case 'GCD_FUEL_BONUS':
            if (loadedValues.length >= 2) specialBonus = clampBonus(gcdArray(loadedValues), 8);
            break;
        case 'LCM_BONUS':
            if (loadedValues.length >= 2) specialBonus = clampBonus(Math.floor(lcmArray(loadedValues) / 3));
            break;
        case 'FIBONACCI_BONUS':
            specialBonus = loadedValues.filter(isFibonacciNumber).length * 2;
            if (isFull && loadedValues.length > 0 && loadedValues.every(isFibonacciNumber)) specialBonus += 4;
            break;
        case 'MEAN_BONUS':
            specialBonus = clampBonus(Math.floor(mean(loadedValues)));
            break;
        case 'MEDIAN_BONUS':
            specialBonus = clampBonus(median(loadedValues));
            break;
        case 'SAME_TYPE_LINK':
            specialBonus = getAdjacentParts(context).filter(other => other.type === part.type).length * 2;
            break;
        case 'ROW_TYPE_LINK':
            specialBonus = getRowParts(context).filter(other => other.type === part.type).length * 2;
            break;
        case 'ROW_UNITY': {
            const rowParts = getRowParts(context).filter(other => other.type !== 'EMPTY');
            if (rowParts.length === SHIP_WIDTH && rowParts.every(other => other.type === part.type)) specialBonus = 6;
            break;
        }
        case 'CENTER_COMMAND':
            if (context?.row === 1 && context?.col === 1) specialBonus = 4;
            break;
        case 'CENTER_ADJ_BONUS':
            if (context?.row === 1 && context?.col === 1) specialBonus = 4 + getAdjacentParts(context).filter(other => other.type !== 'EMPTY').length;
            break;
        case 'DIAGONAL_LINK':
            specialBonus = getDiagonalParts(context).filter(other => other.type !== 'EMPTY').length * 2;
            break;
        case 'MIRROR_BONUS': {
            const mirror = getMirrorPart(context);
            if (mirror && mirror.type === part.type) specialBonus = 5;
            break;
        }
        case 'TURN_SCALE':
            specialBonus = clampBonus(context?.turn || 0, 10);
            break;
        case 'DAMAGE_MEMORY':
            specialBonus = clampBonus(context?.battleStats?.damageTaken || 0, 10);
            break;
        case 'EFFORT_STACK':
            specialBonus = clampBonus(context?.battleStats?.partLoadCounts?.[part.id] || 0, 10);
            break;
        case 'UNIQUE_VALUE_RECORD':
            specialBonus = clampBonus(uniqueCount(context?.battleStats?.seenValues || []), 9);
            break;
        case 'RANDOM_SPIKE': {
            const roll = deterministicRoll(`${part.id}:${context?.turn || 0}:${loadedValues.join(',')}:${loadedColors.join(',')}`);
            specialBonus = roll < 0.2 ? 10 : roll < 0.5 ? 4 : 0;
            break;
        }
        case 'FORECAST_COLOR': {
            const forecast = getForecastColor(context?.turn || 1);
            specialBonus = loadedColors.filter(color => color === forecast).length * 3;
            break;
        }
        case 'PALINDROME_BONUS': {
            if (isFull && loadedValues.length >= 2) {
                const mirrored = loadedValues.every((value, idx) => value === loadedValues[loadedValues.length - 1 - idx]);
                if (mirrored) specialBonus = 7;
            }
            break;
        }
        case 'SUM_FIFTEEN_BONUS':
            if (energySum === 15) specialBonus = 8;
            else if (energySum === 10) specialBonus = 4;
            break;
        case 'MULTIPLE_OF_THREE_BONUS':
            specialBonus = loadedValues.filter(value => value % 3 === 0).length * 3;
            break;
        case 'HAND_SIZE_BONUS':
            specialBonus = clampBonus(context?.hand?.length || 0, 8);
            break;
        case 'TEMP_CARD_BONUS':
            specialBonus = (context?.hand?.filter(card => card.isTemporary).length || 0) * 3;
            break;
        case 'ARITHMETIC_BONUS':
            if (isFull && hasConstantDifference(loadedValues)) specialBonus = 6;
            break;
        case 'ADJACENT_DIVERSITY_BONUS':
            specialBonus = uniqueCount(getAdjacentParts(context).filter(other => other.type !== 'EMPTY').map(other => other.type)) * 2;
            break;
        case 'EDGE_BONUS':
            if (isEdgePosition(context)) specialBonus = 4;
            break;
        case 'CORNER_BONUS':
            if (isCornerPosition(context)) specialBonus = 6;
            break;
        case 'ISOLATION_BONUS':
            if (getAdjacentParts(context).filter(other => other.type !== 'EMPTY').length === 0) specialBonus = 5;
            break;
        case 'ISOLATION_FUEL_BONUS':
            if (getAdjacentParts(context).filter(other => other.type !== 'EMPTY').length === 0) specialBonus = 5;
            break;
        case 'CENTER_COLUMN_BONUS':
            if (context?.col === 1) specialBonus = 4 + (verticalNeighbors(context).filter(other => other.type !== 'EMPTY').length * 2);
            break;
        case 'ALT_COLOR_BONUS':
            if (isFull && loadedColors.length >= 2 && loadedColors.every((color, idx) => idx === 0 || color !== loadedColors[idx - 1])) specialBonus = 6;
            break;
        case 'LAST_STREAK_BONUS':
            specialBonus = clampBonus(context?.battleStats?.lastLoadedPartId === part.id ? context?.battleStats?.lastLoadedStreak || 0 : 0, 8);
            break;
        case 'RANDOM_SWING': {
            const roll = deterministicRoll(`swing:${part.id}:${context?.turn || 0}:${loadedValues.join(',')}:${loadedColors.join(',')}`);
            specialBonus = roll < 0.2 ? 10 : roll < 0.7 ? 4 : 2;
            break;
        }
        case 'OVERCHARGE_SUPPORT':
            if (isFull && energySum >= 12) specialBonus = 4;
            break;
        case 'RAINBOW_HEAL_BONUS':
            if (isFull && new Set(loadedColors).size >= 3) specialBonus = 6;
            break;
        case 'FUEL_RESERVE_BONUS':
            specialBonus = clampBonus(context?.fuel || 0, 6);
            break;
        case 'BLUE_THORNS_BONUS':
            specialBonus = loadedColors.filter(color => color === 'BLUE').length * 2;
            break;
        case 'ECHO_MATCH_BONUS': {
            const modeCount = modeFrequency(loadedValues);
            if (modeCount >= 3) specialBonus = 8;
            else if (modeCount >= 2) specialBonus = 4;
            break;
        }
        case 'ALL_UNIQUE_RAINBOW_BONUS':
            if (isFull && allUnique(loadedValues)) {
                specialBonus = 8;
                if (new Set(loadedColors).size >= 3) specialBonus += 4;
            }
            break;
        case 'CENTER_FULL_BONUS':
            if (context?.row === 1 && context?.col === 1 && isFull) specialBonus = 6;
            break;
        case 'UNIQUE_RAINBOW_BONUS':
            specialBonus = clampBonus(Math.floor(uniqueCount(context?.battleStats?.seenValues || []) / 2), 6);
            if (isFull && new Set(loadedColors).size >= 3) specialBonus += 6;
            break;
        default:
            break;
    }

    return { energySum, isFull, output: output + specialBonus, specialBonus };
};

const calculateBuffGrid = (parts: ShipPart[], context?: Omit<PartEvalContext, 'row' | 'col' | 'parts'>): number[][] => {
    const grid = Array(SHIP_HEIGHT).fill(0).map(() => Array(SHIP_WIDTH).fill(0));
    parts.forEach((part, idx) => {
        if (part.type === 'AMPLIFIER') {
            const r = Math.floor(idx / SHIP_WIDTH);
            const c = idx % SHIP_WIDTH;
            const { energySum, output } = calculatePartOutput(part, { ...context, row: r, col: c, parts });
            
            // Only provide bonus if active (has energy) or no slots required
            if (energySum > 0 || (part.slots.length === 0)) { 
                const power = output;

                // Apply to adjacent
                const neighbors = [{r:r-1,c}, {r:r+1,c}, {r,c:c-1}, {r,c:c+1}];
                neighbors.forEach(n => {
                    if (n.r >= 0 && n.r < SHIP_HEIGHT && n.c >= 0 && n.c < SHIP_WIDTH) {
                        grid[n.r][n.c] += power;
                    }
                });
            }
        }
    });
    return grid;
};

// --- COMPONENTS ---

const PoolView: React.FC<{ pool: PoolState, onClose: () => void }> = ({ pool, onClose }) => {
    const allNumbers = [...pool.genNumbers, ...pool.coolNumbers].sort((a,b) => a - b);
    const allColors = [...pool.genColors, ...pool.coolColors].sort((a,b) => getColorRank(b) - getColorRank(a));

    return (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-8" onClick={onClose}>
            <div className="bg-slate-800 p-6 rounded-lg max-w-lg w-full border border-slate-600 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                <h3 className="text-xl font-bold mb-6 flex items-center text-white"><Layers className="mr-2"/> Energy Inventory</h3>
                
                <div className="mb-6">
                    <div className="text-cyan-400 font-bold mb-3 border-b border-cyan-700 pb-1">所持エネルギー数値</div>
                    <div className="flex flex-wrap gap-1 font-mono text-sm mb-3">
                        {allNumbers.length > 0 ? allNumbers.map((n, i) => <span key={i} className="bg-slate-700 px-1.5 rounded">{n}</span>) : <span className="text-gray-600">Empty</span>}
                    </div>
                </div>
                
                <div>
                    <div className="text-orange-400 font-bold mb-3 border-b border-orange-700 pb-1">所持エネルギー色</div>
                    <div className="flex flex-wrap gap-1">
                        {allColors.length > 0 ? allColors.map((c, i) => (
                            <div key={i} className={`w-6 h-6 rounded border-2 border-black/50 ${c==='ORANGE'?'bg-orange-500':c==='BLUE'?'bg-blue-500':'bg-slate-200'}`} title={c}></div>
                        )) : <span className="text-gray-600 text-xs">Empty</span>}
                    </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-6 text-center">
                    合計: {allNumbers.length} 枚
                </div>

                <button onClick={onClose} className="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors">閉じる</button>
            </div>
        </div>
    );
};

const EnergyCardView: React.FC<{ card: EnergyCard, onClick?: () => void, selected?: boolean, small?: boolean }> = ({ card, onClick, selected, small }) => {
    const bgColor = card.color === 'ORANGE' ? 'bg-orange-500' : card.color === 'BLUE' ? 'bg-blue-500' : 'bg-slate-200 text-black';
    const borderColor = card.color === 'ORANGE' ? 'border-orange-700' : card.color === 'BLUE' ? 'border-blue-700' : 'border-slate-400';
    
    const sizeClasses = small 
        ? "w-12 h-16 md:w-14 md:h-20 rounded-md border-b-[3px] border-r-2 text-sm" 
        : "w-16 h-24 md:w-20 md:h-28 rounded-xl border-b-[5px] border-r-[3px] text-2xl";

    const textSize = small ? "text-xl font-bold md:text-2xl" : "text-3xl md:text-4xl font-black";
    const iconSize = small ? 12 : 16;
    
    return (
        <div 
            onClick={onClick}
            className={`
                ${sizeClasses} ${borderColor} ${bgColor} 
                flex flex-col items-center justify-center cursor-pointer transition-transform relative shadow-sm shrink-0
                ${selected ? '-translate-y-1 ring-2 ring-yellow-400 z-10' : 'hover:-translate-y-0.5'}
                ${card.isTemporary ? 'opacity-90 ring-1 ring-purple-400' : ''}
                select-none touch-none
            `}
            style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
        >
            <div className={`${textSize} ${card.color === 'WHITE' ? 'text-slate-800' : 'text-white'}`}>{card.value}</div>
            <div className="absolute top-0.5 right-0.5">
                {card.color === 'ORANGE' && <Zap size={iconSize} className="text-yellow-200 fill-current"/>}
                {card.color === 'BLUE' && <Wind size={iconSize} className="text-cyan-200 fill-current"/>}
            </div>
            {card.isTemporary && <div className="absolute bottom-0 right-0 text-[6px] bg-purple-600 text-white px-0.5 rounded-tl">TEMP</div>}
        </div>
    );
};

const ShipPartView: React.FC<{ 
    part: ShipPart, 
    onClick?: () => void, 
    onLongPress?: (part: ShipPart) => void,
    isEnemy?: boolean, 
    highlight?: boolean,
    pendingReplace?: boolean,
    showPower?: boolean,
    bonusPower?: number,
    evalContext?: PartEvalContext
}> = ({ part, onClick, onLongPress, isEnemy, highlight, pendingReplace, showPower = true, bonusPower = 0, evalContext }) => {
    
    const longPressTimer = useRef<any>(null);

    const handleTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            if (onLongPress) onLongPress(part);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onLongPress) onLongPress(part);
    }

    let icon = <Box size={14}/>;
    let colorClass = 'bg-slate-800 border-slate-600';
    let textColor = 'text-slate-400';
    
    if (part.type === 'CANNON') { icon = <Crosshair size={14}/>; colorClass = 'bg-red-900/60 border-red-500/50'; textColor='text-red-200'; }
    if (part.type === 'ENGINE') { icon = <Move size={14}/>; colorClass = 'bg-emerald-900/60 border-emerald-500/50'; textColor='text-emerald-200'; }
    if (part.type === 'MISSILE') { icon = <Send size={14}/>; colorClass = 'bg-orange-900/60 border-orange-500/50'; textColor='text-orange-200'; }
    if (part.type === 'SHIELD') { icon = <Shield size={14}/>; colorClass = 'bg-blue-900/60 border-blue-500/50'; textColor='text-blue-200'; }
    if (part.type === 'AMPLIFIER') { icon = <Activity size={14}/>; colorClass = 'bg-purple-900/60 border-purple-500/50'; textColor='text-purple-200'; }
    
    if (part.specialEffect === 'RANK_UP') { colorClass = 'bg-purple-900/60 border-purple-500/50'; textColor='text-purple-200'; icon = <Zap size={14}/>; }
    if (part.specialEffect === 'HEAL') { colorClass = 'bg-green-900/60 border-green-500/50'; textColor='text-green-200'; icon = <Droplets size={14}/>; }
    if (part.specialEffect === 'RECYCLE') { colorClass = 'bg-teal-900/60 border-teal-500/50'; textColor='text-teal-200'; icon = <Recycle size={14}/>; }
    if (part.specialEffect === 'THORNS') { colorClass = 'bg-slate-700 border-red-500'; textColor='text-red-300'; icon = <Radiation size={14}/>; }
    if (part.specialEffect === 'WHITE_BONUS') { colorClass = 'bg-slate-200/20 border-slate-200'; textColor='text-slate-100'; icon = <Palette size={14}/>; }
    if (part.specialEffect === 'MATCH_BONUS') { colorClass = 'bg-amber-900/60 border-amber-500/50'; textColor='text-amber-200'; icon = <Dice5 size={14}/>; }
    if (part.specialEffect === 'LOW_SCORE_BOOST') { colorClass = 'bg-cyan-900/60 border-cyan-500/50'; textColor='text-cyan-200'; icon = <Target size={14}/>; }
    if (part.specialEffect === 'RAINBOW_BONUS') { colorClass = 'bg-fuchsia-900/60 border-fuchsia-500/50'; textColor='text-fuchsia-200'; icon = <Palette size={14}/>; }
    if (part.specialEffect === 'SOLO_DOUBLE') { colorClass = 'bg-yellow-900/60 border-yellow-500/50'; textColor='text-yellow-200'; icon = <Star size={14}/>; }
    if (part.specialEffect === 'BLUE_BONUS') { colorClass = 'bg-blue-900/60 border-blue-400/60'; textColor='text-blue-200'; icon = <Wind size={14}/>; }
    if (part.specialEffect === 'ORANGE_BONUS') { colorClass = 'bg-orange-900/60 border-orange-400/60'; textColor='text-orange-200'; icon = <Zap size={14}/>; }
    if (part.specialEffect === 'HIGH_SCORE_BOOST') { colorClass = 'bg-rose-900/60 border-rose-400/60'; textColor='text-rose-200'; icon = <Gauge size={14}/>; }
    if (part.specialEffect === 'EVEN_BONUS') { colorClass = 'bg-indigo-900/60 border-indigo-400/60'; textColor='text-indigo-200'; icon = <Dice5 size={14}/>; }
    if (part.specialEffect === 'ODD_BONUS') { colorClass = 'bg-pink-900/60 border-pink-400/60'; textColor='text-pink-200'; icon = <Dice5 size={14}/>; }
    if (part.specialEffect === 'SEQUENCE_BONUS') { colorClass = 'bg-lime-900/60 border-lime-400/60'; textColor='text-lime-200'; icon = <Repeat size={14}/>; }
    if (part.specialEffect === 'MONO_COLOR_BONUS') { colorClass = 'bg-violet-900/60 border-violet-400/60'; textColor='text-violet-200'; icon = <Ghost size={14}/>; }
    if (part.specialEffect === 'OVERCHARGE_HEAL') { colorClass = 'bg-green-900/60 border-green-400/60'; textColor='text-green-200'; icon = <Heart size={14}/>; }
    if (part.specialEffect === 'OVERCHARGE_RECYCLE') { colorClass = 'bg-teal-900/60 border-teal-400/60'; textColor='text-teal-200'; icon = <RefreshCw size={14}/>; }
    if (part.specialEffect === 'PRIME_BONUS') { colorClass = 'bg-sky-900/60 border-sky-400/60'; textColor='text-sky-200'; icon = <Star size={14}/>; }
    if (part.specialEffect === 'SQUARE_BONUS') { colorClass = 'bg-emerald-900/60 border-emerald-400/60'; textColor='text-emerald-200'; icon = <Box size={14}/>; }
    if (part.specialEffect === 'GCD_BONUS') { colorClass = 'bg-cyan-900/60 border-cyan-400/60'; textColor='text-cyan-200'; icon = <Gauge size={14}/>; }
    if (part.specialEffect === 'LCM_BONUS') { colorClass = 'bg-red-900/60 border-red-400/60'; textColor='text-red-200'; icon = <Swords size={14}/>; }
    if (part.specialEffect === 'FIBONACCI_BONUS') { colorClass = 'bg-amber-900/60 border-amber-400/60'; textColor='text-amber-200'; icon = <Repeat size={14}/>; }
    if (part.specialEffect === 'MEAN_BONUS') { colorClass = 'bg-blue-900/60 border-blue-300/60'; textColor='text-blue-100'; icon = <Activity size={14}/>; }
    if (part.specialEffect === 'MEDIAN_BONUS') { colorClass = 'bg-indigo-900/60 border-indigo-300/60'; textColor='text-indigo-100'; icon = <Target size={14}/>; }
    if (part.specialEffect === 'SAME_TYPE_LINK') { colorClass = 'bg-violet-900/60 border-violet-300/60'; textColor='text-violet-100'; icon = <Users size={14}/>; }
    if (part.specialEffect === 'ROW_UNITY') { colorClass = 'bg-fuchsia-900/60 border-fuchsia-300/60'; textColor='text-fuchsia-100'; icon = <Layers size={14}/>; }
    if (part.specialEffect === 'CENTER_COMMAND') { colorClass = 'bg-yellow-900/60 border-yellow-300/60'; textColor='text-yellow-100'; icon = <Crosshair size={14}/>; }
    if (part.specialEffect === 'DIAGONAL_LINK') { colorClass = 'bg-rose-900/60 border-rose-300/60'; textColor='text-rose-100'; icon = <ArrowRight size={14}/>; }
    if (part.specialEffect === 'MIRROR_BONUS') { colorClass = 'bg-slate-700 border-slate-300'; textColor='text-slate-100'; icon = <ChevronsLeft size={14}/>; }
    if (part.specialEffect === 'TURN_SCALE') { colorClass = 'bg-orange-900/60 border-orange-300/60'; textColor='text-orange-100'; icon = <Calendar size={14}/>; }
    if (part.specialEffect === 'DAMAGE_MEMORY') { colorClass = 'bg-red-950/80 border-red-300/60'; textColor='text-red-100'; icon = <Shield size={14}/>; }
    if (part.specialEffect === 'EFFORT_STACK') { colorClass = 'bg-green-950/80 border-green-300/60'; textColor='text-green-100'; icon = <Hammer size={14}/>; }
    if (part.specialEffect === 'UNIQUE_VALUE_RECORD') { colorClass = 'bg-teal-950/80 border-teal-300/60'; textColor='text-teal-100'; icon = <Archive size={14}/>; }
    if (part.specialEffect === 'RANDOM_SPIKE') { colorClass = 'bg-pink-950/80 border-pink-300/60'; textColor='text-pink-100'; icon = <Dice5 size={14}/>; }
    if (part.specialEffect === 'FORECAST_COLOR') { colorClass = 'bg-cyan-950/80 border-cyan-300/60'; textColor='text-cyan-100'; icon = <Palette size={14}/>; }
    if (part.specialEffect === 'NO_CONSUME_CHANCE') { colorClass = 'bg-lime-950/80 border-lime-300/60'; textColor='text-lime-100'; icon = <RefreshCw size={14}/>; }
    if (part.specialEffect === 'PALINDROME_BONUS') { colorClass = 'bg-purple-950/80 border-purple-300/60'; textColor='text-purple-100'; icon = <Repeat size={14}/>; }
    if (part.specialEffect === 'SUM_FIFTEEN_BONUS') { colorClass = 'bg-amber-950/80 border-amber-300/60'; textColor='text-amber-100'; icon = <Gauge size={14}/>; }
    if (part.specialEffect === 'MULTIPLE_OF_THREE_BONUS') { colorClass = 'bg-orange-950/80 border-orange-300/60'; textColor='text-orange-100'; icon = <Layers size={14}/>; }
    if (part.specialEffect === 'HAND_SIZE_BONUS') { colorClass = 'bg-blue-950/80 border-blue-300/60'; textColor='text-blue-100'; icon = <Box size={14}/>; }
    if (part.specialEffect === 'TEMP_CARD_BONUS') { colorClass = 'bg-fuchsia-950/80 border-fuchsia-300/60'; textColor='text-fuchsia-100'; icon = <Ghost size={14}/>; }
    if (part.specialEffect === 'EDGE_BONUS') { colorClass = 'bg-slate-950/80 border-slate-300/60'; textColor='text-slate-100'; icon = <ChevronsRight size={14}/>; }
    if (part.specialEffect === 'CORNER_BONUS') { colorClass = 'bg-yellow-950/80 border-yellow-300/60'; textColor='text-yellow-100'; icon = <Target size={14}/>; }
    if (part.specialEffect === 'ISOLATION_BONUS') { colorClass = 'bg-emerald-950/80 border-emerald-300/60'; textColor='text-emerald-100'; icon = <User size={14}/>; }
    if (part.specialEffect === 'ALT_COLOR_BONUS') { colorClass = 'bg-cyan-950/80 border-cyan-300/60'; textColor='text-cyan-100'; icon = <Palette size={14}/>; }
    if (part.specialEffect === 'LAST_STREAK_BONUS') { colorClass = 'bg-red-950/80 border-red-300/60'; textColor='text-red-100'; icon = <Hammer size={14}/>; }

    if (part.type === 'EMPTY') {
        return (
            <div 
                onClick={onClick}
                className={`w-full h-full border border-dashed ${pendingReplace ? 'border-yellow-400 bg-yellow-900/30 animate-pulse' : 'border-slate-700 bg-black/20'} rounded flex items-center justify-center cursor-pointer select-none touch-none`}
                style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
            >
                {pendingReplace ? <div className="text-xs text-yellow-400 font-bold">HERE</div> : <div className="w-1 h-1 bg-slate-700 rounded-full"/>}
            </div>
        );
    }

    const { isFull, output: totalPower, specialBonus } = calculatePartOutput(part, evalContext);
    
    const displayPower = totalPower + bonusPower;

    return (
        <div 
            onClick={onClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onContextMenu={handleContextMenu}
            className={`
                relative w-full h-full border rounded flex flex-col justify-between p-1 transition-all overflow-hidden
                ${colorClass} ${highlight ? 'ring-2 ring-yellow-400 brightness-125' : ''}
                ${isFull ? 'brightness-110 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]' : ''}
                ${pendingReplace ? 'ring-2 ring-green-400 animate-pulse opacity-80' : ''}
                cursor-pointer hover:bg-opacity-80
                select-none touch-none
            `}
            style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
        >
            <div className="flex justify-between items-center">
                <div className={`${textColor}`}>{icon}</div>
                {((totalPower > 0) || (bonusPower > 0)) && showPower && part.type !== 'AMPLIFIER' && (
                    <div className="text-[10px] font-bold text-white shadow-black drop-shadow-md flex items-center">
                        {displayPower}
                        {bonusPower > 0 && <span className="text-[8px] text-green-400 ml-0.5">+{bonusPower}</span>}
                    </div>
                )}
                {part.type === 'AMPLIFIER' && isFull && <div className="text-[8px] font-bold text-yellow-300">UP!</div>}
                {part.specialEffect === 'HEAL' && isFull && <div className="text-[8px] font-bold text-green-300">HEAL</div>}
                {specialBonus > 0 && part.specialEffect !== 'HEAL' && part.specialEffect !== 'RANK_UP' && (
                    <div className="text-[8px] font-bold text-yellow-300">+{specialBonus}</div>
                )}
            </div>

            <div className="flex gap-0.5 justify-center mt-1">
                {part.slots.map((slot, i) => {
                    let slotColor = 'bg-slate-900 border-slate-600';
                    if (slot.value !== null) {
                        if (slot.loadedColor === 'ORANGE') slotColor = 'bg-orange-400 border-orange-200 animate-pulse';
                        else if (slot.loadedColor === 'BLUE') slotColor = 'bg-blue-400 border-blue-200 animate-pulse';
                        else slotColor = 'bg-white border-white animate-pulse';
                    } else if (slot.req === 'ORANGE') {
                        slotColor = 'bg-orange-900 border-orange-600';
                    } else if (slot.req === 'BLUE') {
                        slotColor = 'bg-blue-900 border-blue-600';
                    } else if (slot.req === 'WHITE') {
                        slotColor = 'bg-slate-200 border-slate-400';
                    }
                    
                    return (
                        <div key={i} className={`w-3 h-4 md:w-4 md:h-5 border rounded-sm flex items-center justify-center text-[8px] font-bold ${slotColor} text-black`}>
                            {slot.value}
                        </div>
                    );
                })}
            </div>
            
            <div className="text-[8px] text-center text-gray-400 truncate w-full mt-auto">{part.name}</div>
        </div>
    );
};

// --- CLASH ANIMATION OVERLAY ---
const ClashOverlay: React.FC<{ clashState: ClashState }> = ({ clashState }) => {
    if (!clashState.active) return null;

    return (
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-center py-4">
            {[0, 1, 2, 3, 4].map((rowIdx) => {
                const clash = clashState.data.find(d => d.row === rowIdx);
                if (!clash) return <div key={rowIdx} className="h-20 md:h-24"></div>;

                let pWidth = 50;
                let eWidth = 50;
                let opacity = 1;

                if (clashState.phase === 'INIT') {
                    pWidth = 0; eWidth = 0;
                } else if (clashState.phase === 'CLASH') {
                    pWidth = 50; eWidth = 50; 
                } else if (clashState.phase === 'IMPACT') {
                    if (clash.result === 'ENEMY_HIT') {
                        pWidth = 100; eWidth = 0;
                    } else if (clash.result === 'PLAYER_HIT') {
                        pWidth = 0; eWidth = 100;
                    } else if (clash.result === 'DRAW') {
                        pWidth = 50; eWidth = 50; 
                    } else {
                        if (clash.pPower > 0) {
                            pWidth = 100; eWidth = 0; 
                        } else if (clash.ePower > 0) {
                            pWidth = 0; eWidth = 100; 
                        } else {
                            opacity = 0; 
                        }
                    }
                } else {
                    opacity = 0;
                }

                const pShieldVis = clash.pShield > 0 && (clash.result === 'PLAYER_HIT' || clash.result === 'DRAW');
                const pThornVis = clash.pThorns > 0 && clash.result === 'PLAYER_HIT';

                return (
                    <div key={rowIdx} className="h-20 md:h-24 relative flex items-center transition-all duration-300" style={{ opacity }}>
                        {clash.pPower > 0 && (
                            <div 
                                className="absolute left-0 h-4 md:h-6 bg-gradient-to-r from-cyan-600 via-cyan-400 to-white shadow-[0_0_15px_cyan] rounded-r-full transition-all duration-500 ease-out"
                                style={{ width: `${pWidth}%`, left: 0 }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white rounded-full blur-md opacity-80"></div>
                            </div>
                        )}
                        
                        {clash.ePower > 0 && (
                            <div 
                                className="absolute right-0 h-4 md:h-6 bg-gradient-to-l from-red-600 via-purple-500 to-white shadow-[0_0_15px_red] rounded-l-full transition-all duration-500 ease-out"
                                style={{ width: `${eWidth}%`, right: 0 }}
                            >
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white rounded-full blur-md opacity-80"></div>
                            </div>
                        )}

                        {clashState.phase === 'IMPACT' && (
                            <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-center pointer-events-none">
                                {clash.result === 'DRAW' && (
                                    <div className="absolute left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full animate-ping z-40"></div>
                                )}
                                {clash.result === 'ENEMY_HIT' && (
                                    <div className="absolute right-0 translate-x-1/2 w-24 h-24 bg-orange-400 rounded-full animate-ping z-40 shadow-[0_0_30px_orange]"></div>
                                )}
                                {clash.result === 'PLAYER_HIT' && (
                                    <div className="absolute left-0 -translate-x-1/2 w-24 h-24 bg-red-500 rounded-full animate-ping z-40 shadow-[0_0_30px_red]"></div>
                                )}
                            </div>
                        )}
                        
                        {pShieldVis && (
                            <div className="absolute left-10 md:left-20 top-1/2 -translate-y-1/2 z-40 animate-pulse text-blue-400">
                                <Shield size={48} className="fill-blue-900/50 stroke-2"/>
                            </div>
                        )}

                        {pThornVis && (
                             <div className="absolute left-10 md:left-20 top-1/2 -translate-y-1/2 z-50 text-red-500 font-bold animate-ping flex items-center">
                                 <Radiation size={32} /> THORNS!
                             </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const loadInitialState = () => {
    return storageService.loadPaperPlaneState();
};

const loadProgress = () => {
    return storageService.loadPaperPlaneProgress();
};

const PaperPlaneBattle: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const savedData = loadInitialState();
    const [progress, setProgress] = useState<PaperPlaneProgress>(loadProgress());
    const [newlyUnlockedPart, setNewlyUnlockedPart] = useState<ShipPart | null>(null);

    const [phase, setPhase] = useState<GamePhase>(savedData?.phase || 'SETUP');
    const [stage, setStage] = useState(savedData?.stage || 1); 
    const [turn, setTurn] = useState(savedData?.turn || 1);
    const [isEndless, setIsEndless] = useState(savedData?.isEndless || false);
    
    // --- SETUP PHASE STATES ---
    const [setupStep, setSetupStep] = useState<'SHIP'|'PILOT'|'MISSION'>('SHIP');
    const [selectedShipId, setSelectedShipId] = useState<string>('SHIP_DEFAULT');
    const [pilotOptions, setPilotOptions] = useState<Pilot[]>([]);
    const [selectedPilotIndex, setSelectedPilotIndex] = useState<number>(-1);
    const [pinnedPilotIndex, setPinnedPilotIndex] = useState<number | null>(null);
    const [selectedMissionLevel, setSelectedMissionLevel] = useState<number>(savedData?.selectedMissionLevel || 0);

    const [pool, setPool] = useState<PoolState>(savedData?.pool || {
        genNumbers: [1,2,3,4,5,6,3,4,5], 
        genColors: ['WHITE','WHITE','WHITE','BLUE','BLUE','ORANGE','ORANGE'], 
        coolNumbers: [],
        coolColors: []
    });

    const [hand, setHand] = useState<EnergyCard[]>(savedData?.hand || []);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    const [player, setPlayer] = useState<ShipState>(savedData?.player || {
        yOffset: 1, 
        hp: 40, maxHp: 40, fuel: MAX_FUEL, maxFuel: MAX_FUEL, durability: 0, maxDurability: 0, isStunned: false,
        parts: [], // Set in init
        starCoins: 0,
        vacationDays: 0,
        passivePower: 0,
        partInventory: [],
        talents: []
    });

    const [enemy, setEnemy] = useState<ShipState>(savedData?.enemy || {
        yOffset: 1,
        hp: 20, maxHp: 20, fuel: 3, maxFuel: 3, durability: 3, maxDurability: 3, isStunned: false,
        parts: [], 
        starCoins: 0, vacationDays: 0, passivePower: 0,
        partInventory: [],
        talents: [],
        enemyConfig: { energyPerTurn: 2, colors: ['WHITE'], moveChance: 0.2 }
    });

    const [enemyIntents, setEnemyIntents] = useState<EnemyIntent[]>(savedData?.enemyIntents || []);
    const [logs, setLogs] = useState<string[]>([]);
    const [showPool, setShowPool] = useState(false);
    const [showHandHelp, setShowHandHelp] = useState(false);
    const [showGameHelp, setShowGameHelp] = useState(false); // Added Game Help State
    const [animating, setAnimating] = useState(false);
    const [tooltipPart, setTooltipPart] = useState<ShipPart | null>(null);
    
    const [clashState, setClashState] = useState<ClashState>({ active: false, phase: 'INIT', data: [] });
    
    const [vacationEvents, setVacationEvents] = useState<VacationEvent[]>(savedData?.vacationEvents || []);
    const [vacationLog, setVacationLog] = useState<string>(savedData?.vacationLog || "休暇を楽しんでください。");
    const [pendingPart, setPendingPart] = useState<ShipPart | null>(savedData?.pendingPart || null); 
    const [hangarSelection, setHangarSelection] = useState<{loc: 'SHIP'|'INV', idx: number}|null>(null);

    const [rewardOptions, setRewardOptions] = useState<ShipPart[]>(savedData?.rewardOptions || []);
    const [earnedCoins, setEarnedCoins] = useState(savedData?.earnedCoins || 0);
    const [battleStats, setBattleStats] = useState<BattleStats>(savedData?.battleStats || createBattleStats());

    // --- AUTO SAVE ---
    const saveDebounceRef = useRef<any>(null);

    useEffect(() => {
        if (phase === 'GAME_OVER') {
            storageService.clearPaperPlaneState();
        } else if (phase !== 'TUTORIAL' && phase !== 'SETUP') {
            if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
            saveDebounceRef.current = setTimeout(() => {
                const stateToSave = {
                    phase, stage, turn, pool, hand, player, enemy, enemyIntents, isEndless,
                    vacationEvents, vacationLog, pendingPart, rewardOptions, earnedCoins, selectedMissionLevel, battleStats
                };
                storageService.savePaperPlaneState(stateToSave);
            }, 1000); 
        }
    }, [phase, stage, turn, pool, hand, player, enemy, enemyIntents, vacationEvents, vacationLog, pendingPart, rewardOptions, earnedCoins, isEndless, selectedMissionLevel, battleStats]);

    // --- SCORE SAVING ---
    const scoreSavedRef = useRef(false);
    useEffect(() => {
        if (phase === 'VICTORY' || phase === 'GAME_OVER') {
            if (scoreSavedRef.current) return;
            scoreSavedRef.current = true;
            
            const calculatedScore = (stage * 100) + player.starCoins + (player.hp * 10) + (selectedMissionLevel * 500);
            storageService.savePaperPlaneScore({
                id: `plane-${Date.now()}`,
                date: Date.now(),
                stage: stage,
                rank: selectedMissionLevel,
                score: Math.floor(calculatedScore)
            });
            
            if (phase === 'VICTORY') {
                storageService.clearPaperPlaneState();
            }
        } else {
            scoreSavedRef.current = false;
        }
    }, [phase, stage, player.starCoins, player.hp, selectedMissionLevel]);

    useEffect(() => {
        // Initial BGM check based on loaded phase
        if (phase === 'BATTLE') audioService.playBGM('paper_plane_battle');
        else if (['VACATION', 'SHOP', 'HANGAR', 'REWARD_SELECT', 'REWARD_EQUIP', 'UPGRADE_EVENT'].includes(phase)) audioService.playBGM('paper_plane_vacation');
        else audioService.playBGM('paper_plane_setup');

        if (phase === 'SETUP') {
             initPilotRoll();
        }
    }, []);

    // --- SETUP LOGIC ---
    const initPilotRoll = () => {
        const slots: Pilot[] = [];
        for (let i=0; i<3; i++) {
             const pBase = PILOTS[Math.floor(Math.random() * PILOTS.length)];
             const p: Pilot = { ...pBase, randomTalents: [] };
             
             // Always grant 1 generic talent
             p.randomTalents!.push(GENERIC_TALENTS[Math.floor(Math.random() * GENERIC_TALENTS.length)]);
             
             // Grant a 2nd generic talent at Rank 5+
             if (progress.rank >= 5) {
                  const available = GENERIC_TALENTS.filter(t => !p.randomTalents!.find(pt => pt.id === t.id));
                  if (available.length > 0) p.randomTalents!.push(available[Math.floor(Math.random() * available.length)]);
             }
             slots.push(p);
        }
        setPilotOptions(slots);
        setSelectedPilotIndex(-1); // Reset selection
    };

    const handleRerollPilots = () => {
        if (progress.rerollCount <= 0) {
            audioService.playSound('wrong');
            return;
        }
        
        // Update Progress
        const newProgress = { ...progress, rerollCount: progress.rerollCount - 1 };
        setProgress(newProgress);
        storageService.savePaperPlaneProgress(newProgress);
        
        // Roll Pilots
        const newOpts = [...pilotOptions];
        for (let i=0; i<3; i++) {
            if (pinnedPilotIndex === i) continue;
            const pBase = PILOTS[Math.floor(Math.random() * PILOTS.length)];
            const p: Pilot = { ...pBase, randomTalents: [] };
            
            // Always grant 1 generic talent
            p.randomTalents!.push(GENERIC_TALENTS[Math.floor(Math.random() * GENERIC_TALENTS.length)]);
            
            // Grant a 2nd generic talent at Rank 5+
            if (progress.rank >= 5) {
                 const available = GENERIC_TALENTS.filter(t => !p.randomTalents!.find(pt => pt.id === t.id));
                 if (available.length > 0) p.randomTalents!.push(available[Math.floor(Math.random() * available.length)]);
            }
            newOpts[i] = p;
        }
        setPilotOptions(newOpts);
        setSelectedPilotIndex(-1); // Reset on reroll too? Maybe keep if pinned? No reset is safer.

        audioService.playSound('select');
    };
    
    const confirmSetup = () => {
        if (selectedPilotIndex === -1) {
            audioService.playSound('wrong');
            return;
        }
        
        audioService.playSound('win');
        
        // Init Game Data
        const shipTemplate = SHIPS.find(s => s.id === selectedShipId)!;
        const pilot = pilotOptions[selectedPilotIndex];
        
        // Apply Modifiers
        let pMaxHp = shipTemplate.baseHp;
        let pPassivePower = 0;
        let pMaxFuel = MAX_FUEL;
        let pStartMoney = 0;
        
        // Apply Talents
        const allTalents = [pilot.intrinsicTalent, ...(pilot.randomTalents || [])];
        allTalents.forEach(t => {
            if (t.effectType === 'MAX_HP') pMaxHp += t.value;
            if (t.effectType === 'PASSIVE_POWER') pPassivePower += t.value;
            if (t.effectType === 'FUEL') pMaxFuel += t.value;
        });

        // Apply Ascension Modifiers (simplified)
        // Lvl 1: -
        if (selectedMissionLevel >= 2) pMaxHp -= 5;
        // ... more can be added

        setPlayer({
            yOffset: 1,
            hp: pMaxHp, maxHp: pMaxHp,
            fuel: pMaxFuel, maxFuel: pMaxFuel,
            durability: 0, maxDurability: 0, isStunned: false,
            parts: JSON.parse(JSON.stringify(shipTemplate.layout)),
            starCoins: pStartMoney,
            vacationDays: 0,
            passivePower: pPassivePower,
            partInventory: [],
            talents: allTalents
        });
        
        setStage(1);
        setIsEndless(false);
        initBattle(1, allTalents);
        audioService.playBGM('paper_plane_battle'); // Switch BGM
    };
    
    const returnToSetup = () => {
        setPhase('SETUP');
        setSetupStep('SHIP');
        setStage(1);
        setIsEndless(false);
        setNewlyUnlockedPart(null);
        initPilotRoll(); // Ensure pilots are rerolled/reset
        audioService.playSound('select');
        audioService.playBGM('paper_plane_setup');
    };

    // --- GAME LOGIC ---

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev.slice(0, 4)]);

    const initBattle = (stageNum: number, resolvedTalents?: Talent[]) => {
        let enemyIdx;
        let template;

        if (stageNum <= 4) {
            enemyIdx = Math.min(ENEMY_DATA.length - 1, Math.floor((stageNum - 1) / 1.5));
            enemyIdx = Math.max(0, Math.min(enemyIdx, ENEMY_DATA.length - 1));
            template = ENEMY_DATA[enemyIdx];
        } else {
            enemyIdx = Math.floor(Math.random() * ENEMY_DATA.length);
            template = ENEMY_DATA[enemyIdx];
        }

        // Difficulty Scaling with Ascension
        let hp = template.hp + (stageNum * 8);
        let dur = template.durability + Math.floor(stageNum / 2);
        
        // Ascension Scaling
        if (selectedMissionLevel >= 1) { /* Enemy Dmg Up handled in calculation */ }
        if (selectedMissionLevel >= 3) hp = Math.floor(hp * 1.1);
        if (selectedMissionLevel >= 5) dur += 2;
        if (selectedMissionLevel >= 7) hp = Math.floor(hp * 1.2);

        if (isEndless) {
             const loop = Math.max(1, stageNum - FINAL_STAGE_NORMAL);
             hp += loop * 30;
             dur += loop * 2;
        }

        const eParts: ShipPart[] = template.layout.map((t, i) => {
            const type = t as any;
            let partTemplate = PART_TEMPLATES.find(pt => pt.type === type);
            // Default template if specific not found or generic needed
            if (!partTemplate || type === 'EMPTY') {
                 partTemplate = { 
                     type: type, 
                     name: type==='EMPTY'?'空き':(type==='CANNON'?'敵砲台':'敵パーツ'), 
                    description:'', slots: [], multiplier: 1, basePower: 0, hp: 10 
                 };
            }
            
            // Adjust enemy parts based on type
            let slots: EnergySlot[] = [];
            let basePower = 0;
            let multiplier = 1;

            if (type === 'CANNON') {
                 slots = [{req:'ANY', value:null}]; 
                 basePower = 2 + Math.floor(stageNum/3);
                 multiplier = 1.0;
            } else if (type === 'MISSILE') {
                 slots = [{req:'ANY', value:null}];
                 basePower = 3 + Math.floor(stageNum/2);
                 multiplier = 1.5;
            } else if (type === 'AMPLIFIER') {
                 slots = [{req:'ANY', value:null}];
                 basePower = 2 + Math.floor(stageNum/4);
                 multiplier = 0;
            }

            return {
                id: `ep_${i}`,
                type: type,
                name: partTemplate.name,
                slots: slots,
                multiplier: multiplier,
                basePower: basePower,
                hp: 10
            };
        });

        // Initial Player Setup (Correct position)
        setPlayer(prev => ({
            ...prev,
            yOffset: 1,
            parts: prev.parts.map(p => ({ ...p, slots: p.slots.map(s => ({...s, value: null, loadedColor: null})) })),
            // Ascension 4: Start damaged
            hp: selectedMissionLevel >= 4 ? Math.floor(prev.hp * 0.8) : prev.hp
        }));

        // Determine initial enemy fuel based on stage (more fuel later)
        const initialFuel = 3 + Math.floor(stageNum / 2);

        const initialEnemy = {
            yOffset: 1,
            hp: hp, maxHp: hp,
            durability: dur, maxDurability: dur,
            fuel: initialFuel, maxFuel: initialFuel, isStunned: false,
            parts: eParts,
            starCoins: 0, vacationDays: 0, passivePower: 0,
            partInventory: [],
            talents: [],
            enemyConfig: {
                energyPerTurn: template.energy,
                colors: template.colors,
                moveChance: template.moveChance
            }
        };

        const activeTalents = resolvedTalents || player.talents;

        let bombDmg = 0;
        activeTalents.forEach(t => { if (t.effectType === 'INITIAL_BOMB') bombDmg += t.value; });
        if (bombDmg > 0) {
            initialEnemy.hp = Math.max(1, initialEnemy.hp - bombDmg);
            addLog(`先制攻撃！敵に${bombDmg}ダメージ！`);
        }

        // Important: Pass current player state to AI logic for initial intent generation
        const { nextEnemy, intents } = updateEnemyState(initialEnemy, stageNum, { ...player, yOffset: 1 });
        setEnemy(nextEnemy);
        setEnemyIntents(intents);

        setTurn(1);
        setBattleStats(createBattleStats());
        
        let allNumbers = [...pool.genNumbers, ...pool.coolNumbers, ...hand.map(c => c.value)];
        let allColors = [...pool.genColors, ...pool.coolColors, ...hand.map(c => c.color)];

        if (stageNum === 1) {
            allNumbers = [1,2,3,4,5,6,3,4,5];
            allColors = ['WHITE','WHITE','WHITE','BLUE','BLUE','ORANGE','ORANGE'];
            activeTalents.forEach(t => {
                if (t.effectType === 'EXTRA_POOL_WHITE') { for(let i=0; i<t.value; i++) { allNumbers.push(3); allColors.push('WHITE'); } }
                if (t.effectType === 'EXTRA_POOL_BLUE') { for(let i=0; i<t.value; i++) { allNumbers.push(4); allColors.push('BLUE'); } }
                if (t.effectType === 'EXTRA_POOL_ORANGE') { for(let i=0; i<t.value; i++) { allNumbers.push(5); allColors.push('ORANGE'); } }
            });
        }

        const initialHand: EnergyCard[] = [];
        let drawCount = 5;
        activeTalents.forEach(t => { if (t.effectType === 'DRAW_CARD_FIRST_TURN') drawCount += t.value; });

        allNumbers.sort(() => Math.random() - 0.5);
        allColors.sort(() => Math.random() - 0.5);

        for (let i = 0; i < drawCount; i++) {
            if (allNumbers.length > 0 && allColors.length > 0) {
                const val = allNumbers.pop()!;
                const col = allColors.pop()!;
                initialHand.push({ id: `e_init_${Date.now()}_${i}`, value: val, color: col });
            }
        }
        
        // Talent: Start Energy
        activeTalents.forEach(t => {
             if (t.effectType === 'START_ENERGY') {
                 for(let k=0; k<t.value; k++) {
                     // Add extra white energy
                     initialHand.push({ id: `e_talent_${Date.now()}_${k}`, value: 3, color: 'WHITE' });
                 }
             }
        });

        setPool({
            genNumbers: allNumbers,
            genColors: allColors,
            coolNumbers: [],
            coolColors: []
        });
        setHand(initialHand);

        setPhase('BATTLE');
        addLog(`バトル開始！ 敵: ${template.name}`);
        audioService.playBGM('paper_plane_battle'); // Ensure correct BGM
    };

    // --- ENEMY AI LOGIC ---

    const updateEnemyState = (currentEnemy: ShipState, currentStage: number, currentPlayer: ShipState): { nextEnemy: ShipState, intents: EnemyIntent[] } => {
        let nextEnemy = { ...currentEnemy };
        const intents: EnemyIntent[] = [];
        const config = nextEnemy.enemyConfig || { energyPerTurn: 2, colors: ['WHITE'], moveChance: 0.2 };

        // 1. Charge Energy
        let energyBudget = config.energyPerTurn;
        
        for (let i = 0; i < nextEnemy.parts.length; i++) {
            if (energyBudget <= 0) break;
            const part = nextEnemy.parts[i];
            if (part.type === 'EMPTY') continue;

            const emptySlots = part.slots.map((s, idx) => ({s, idx})).filter(item => item.s.value === null);
            
            for (const slotItem of emptySlots) {
                if (energyBudget > 0) {
                    const val = 3 + Math.floor(currentStage / 3); 
                    const newSlots = [...part.slots];
                    newSlots[slotItem.idx] = { ...slotItem.s, value: val };
                    nextEnemy.parts[i] = { ...part, slots: newSlots };
                    energyBudget--;
                }
            }
        }

        // 2. AI Movement Logic (Aiming)
        // Only move if we have fuel
        if (nextEnemy.fuel > 0) {
            const currentY = nextEnemy.yOffset;
            const playerY = currentPlayer.yOffset;
            const playerBodyRows = [playerY, playerY + 1, playerY + 2]; // Player occupies these rows on grid

            let bestY = currentY;
            let maxScore = -9999;
            let bestMoveDir = 0;

            // Try moves: -1 (Up), 0 (Stay), +1 (Down)
            // Note: In this grid, -1 yOffset means moving visually UP (index decreases)
            const moves = [0, -1, 1];

            moves.forEach(dir => {
                const testY = currentY + dir;
                // Check Bounds (Ship height is 3, Grid is 5, so valid offsets are 0, 1, 2)
                if (testY < 0 || testY > MAX_ROWS - SHIP_HEIGHT) return;

                let score = 0;

                // 1. Offensive Score: Align loaded weapons with player body
                nextEnemy.parts.forEach((p, idx) => {
                    const row = Math.floor(idx / SHIP_WIDTH); // 0, 1, 2 relative to ship
                    const absRow = testY + row; // Absolute grid row

                    // Check if part is loaded weapon
                    const energySum = p.slots.reduce((sum, s) => sum + (s.value || 0), 0);
                    if (energySum > 0 && (p.type === 'CANNON' || p.type === 'MISSILE')) {
                        if (playerBodyRows.includes(absRow)) {
                            score += 10 * p.multiplier; // High priority to hit
                        }
                    }
                });

                // 2. Center Bias (To avoid getting stuck at edges if no clear target)
                if (score === 0) {
                     // 1 is the center for a size 3 ship in a size 5 grid
                     score -= Math.abs(testY - 1);
                }
                
                // Add penalty for moving (cost fuel) to encourage staying put if score is equal
                if (dir !== 0) score -= 0.1;

                if (score > maxScore) {
                    maxScore = score;
                    bestMoveDir = dir;
                    bestY = testY;
                }
            });

            if (bestMoveDir !== 0) {
                // If aggressive move (attacking), commit
                // If defensive/positioning only, use randomness to be unpredictable
                const isAggressive = maxScore >= 5; 
                
                if (isAggressive || Math.random() < config.moveChance) {
                    nextEnemy.yOffset = bestY;
                    nextEnemy.fuel -= 1; // Consume Fuel
                }
            }
        }

        // 3. Generate Intents based on loaded parts
        const buffGrid = calculateBuffGrid(nextEnemy.parts, { turn: currentStage, fuel: nextEnemy.fuel });
        const rowDamageMap: Record<number, number> = {};

        nextEnemy.parts.forEach((p, idx) => {
            const r = Math.floor(idx / SHIP_WIDTH);
            const c = idx % SHIP_WIDTH;
            const energySum = p.slots.reduce((sum, s) => sum + (s.value || 0), 0);
            
            if (energySum > 0 && (p.type === 'CANNON' || p.type === 'MISSILE')) {
                 let output = Math.floor(energySum * p.multiplier);
                 const isFull = p.slots.every(s => s.value !== null) && p.slots.length > 0;
                 if(isFull) output += p.basePower;
                 
                 output += buffGrid[r][c];
                 if (selectedMissionLevel >= 1) output += 1;
                 if (selectedMissionLevel >= 6) output += 1;

                 rowDamageMap[r] = (rowDamageMap[r] || 0) + output;
            } 
        });

        Object.entries(rowDamageMap).forEach(([rStr, val]) => {
            const r = parseInt(rStr, 10);
            if (val > 0) {
                intents.push({ row: r, type: 'ATTACK', value: val });
            }
        });

        return { nextEnemy, intents };
    };

    const drawEnergy = (count: number) => {
        let nextGenNums = [...pool.genNumbers];
        let nextGenCols = [...pool.genColors];
        let nextCoolNums = [...pool.coolNumbers];
        let nextCoolCols = [...pool.coolColors];
        
        const newCards: EnergyCard[] = [];

        for(let i=0; i<count; i++) {
            if (nextGenNums.length === 0) { 
                nextGenNums = [...nextCoolNums].sort(() => Math.random() - 0.5); 
                nextCoolNums = []; 
            }
            if (nextGenCols.length === 0) { 
                nextGenCols = [...nextCoolCols].sort(() => Math.random() - 0.5); 
                nextCoolCols = []; 
            }

            if (nextGenNums.length > 0 && nextGenCols.length > 0) {
                const valIdx = Math.floor(Math.random() * nextGenNums.length);
                const val = nextGenNums[valIdx];
                nextGenNums.splice(valIdx, 1);
                
                const colIdx = Math.floor(Math.random() * nextGenCols.length);
                const col = nextGenCols[colIdx];
                nextGenCols.splice(colIdx, 1);

                newCards.push({ id: `e_${Date.now()}_${i}_${Math.random().toString(36).substring(2,8)}`, value: val, color: col });
            }
        }
        
        setHand(prev => [...prev, ...newCards]);
        setPool({ genNumbers: nextGenNums, genColors: nextGenCols, coolNumbers: nextCoolNums, coolColors: nextCoolCols });
        audioService.playSound('select');
    };

    const recycleCard = (card: EnergyCard) => {
        if (card.isTemporary) return;

        setPool(prev => ({
            ...prev,
            coolNumbers: [...prev.coolNumbers, card.value],
            coolColors: [...prev.coolColors, card.color]
        }));
    };

    const handleCardSelect = (id: string) => {
        if (selectedCardId === id) setSelectedCardId(null);
        else {
            setSelectedCardId(id);
            audioService.playSound('select');
        }
    };

    const handlePartClick = (partIndex: number) => {
        if (phase === 'VACATION' || phase === 'REWARD_EQUIP') {
            handlePartEquip(partIndex);
            return;
        }

        if (!selectedCardId) return;
        const cardIndex = hand.findIndex(c => c.id === selectedCardId);
        if (cardIndex === -1) return;

        const card = hand[cardIndex];
        const part = player.parts[partIndex];

        if (part.type === 'EMPTY') { addLog("そこには何もありません"); return; }
        
        let slotIdx = -1;
        let bestRank = -1;

        part.slots.forEach((s, idx) => {
            if (s.value === null && isColorCompatible(card.color, s.req)) {
                const rank = getColorRank(s.req);
                if (rank > bestRank) {
                    bestRank = rank;
                    slotIdx = idx;
                }
            }
        });
        
        if (slotIdx === -1) {
            if (part.slots.every(s => s.value !== null)) addLog("エネルギー充填完了しています");
            else addLog("色が合いません！");
            return;
        }

        let currentHandList = [...hand];

        if (part.specialEffect === 'RANK_UP') {
            const newValue = card.value + 1;
            const newCard: EnergyCard = {
                id: `e_gen_${Date.now()}`,
                value: newValue,
                color: card.color,
                isTemporary: true 
            };
            currentHandList.push(newCard); 
            addLog(`増幅！ランク${newValue}のカードを生成！(一時的)`);
            audioService.playSound('buff');
        }

        const newParts = [...player.parts];
        const newSlots = [...part.slots];
        
        // NEW LOGIC For DOUBLE_FIRST_TURN_LOAD
        let loadValue = card.value;
        if (turn === 1 && player.talents.some(t => t.effectType === 'DOUBLE_FIRST_TURN_LOAD')) {
            loadValue *= 2;
        }

        newSlots[slotIdx] = { ...newSlots[slotIdx], value: loadValue, loadedColor: card.color };
        newParts[partIndex] = { ...part, slots: newSlots };
        const nextBattleStats: BattleStats = {
            damageTaken: battleStats.damageTaken,
            seenValues: [...battleStats.seenValues, card.value],
            partLoadCounts: {
                ...battleStats.partLoadCounts,
                [part.id]: (battleStats.partLoadCounts[part.id] || 0) + 1,
            },
            lastLoadedPartId: part.id,
            lastLoadedStreak: battleStats.lastLoadedPartId === part.id ? battleStats.lastLoadedStreak + 1 : 1,
        };
        
        // NEW LOGIC For OVERCHARGE_FUEL
        let willHealFuel = false;
        if (card.value >= 6 && player.talents.some(t => t.effectType === 'OVERCHARGE_FUEL')) {
            willHealFuel = true;
            addLog(`ハイテンション！燃料+1`);
            audioService.playSound('buff');
        }

        setPlayer(prev => ({ 
            ...prev, 
            parts: newParts,
            fuel: willHealFuel ? Math.min(prev.maxFuel, prev.fuel + 1) : prev.fuel
        }));
        setBattleStats(nextBattleStats);

        const noConsumeTriggered = part.specialEffect === 'NO_CONSUME_CHANCE' &&
            deterministicRoll(`${part.id}:${card.id}:${turn}:${hand.length}:${card.value}:${card.color}`) < 0.35;

        if (noConsumeTriggered) {
            addLog('ラッキー！カードが手札に残った！');
            audioService.playSound('win');
        } else {
            currentHandList.splice(cardIndex, 1);
            recycleCard(card);
        }

        setHand(currentHandList);
        setSelectedCardId(null);
        if (part.specialEffect !== 'RANK_UP') audioService.playSound('buff');
    };

    const handleMove = (dir: -1 | 1) => {
        if (player.fuel <= 0) { addLog("燃料切れです！"); audioService.playSound('wrong'); return; }
        
        const nextY = player.yOffset + dir;
        if (nextY < 0 || nextY > MAX_ROWS - SHIP_HEIGHT) { addLog("これ以上移動できません"); return; }

        setPlayer(prev => ({ ...prev, yOffset: nextY, fuel: prev.fuel - 1 }));
        audioService.playSound('select');
    };

    const resolveCombat = async () => {
        setAnimating(true);
        setSelectedCardId(null);
        
        const clashData: ClashRowData[] = [];
        let tempEnemyHp = enemy.hp;
        let tempPlayerHp = player.hp;
        let tempFuel = player.fuel;
        let enemyStunDmg = 0;
        let damageTakenThisRound = 0;

        const buffGrid = calculateBuffGrid(player.parts, { hand, turn, battleStats, fuel: player.fuel });
        const enemyBuffGrid = calculateBuffGrid(enemy.parts, { turn, fuel: enemy.fuel }); // Calculate enemy buffs

        // CLASH LOGIC
        for (let r = 0; r < MAX_ROWS; r++) {
            const pRelIdx = r - player.yOffset;
            let pPower = 0;
            let pShield = 0;
            let pEngine = 0;
            let pThorns = 0;

            let isPlayerHitbox = false;
            
            if (pRelIdx >= 0 && pRelIdx < SHIP_HEIGHT) {
                const startIdx = pRelIdx * SHIP_WIDTH;
                const rowParts = player.parts.slice(startIdx, startIdx + SHIP_WIDTH);
                isPlayerHitbox = rowParts.some(p => p.type !== 'EMPTY');

                rowParts.forEach((p, colIdx) => {
                    if (p.type === 'EMPTY' || p.type === 'AMPLIFIER') return;

                    const { energySum, isFull, output: baseOutput } = calculatePartOutput(p, {
                        row: pRelIdx,
                        col: colIdx,
                        parts: player.parts,
                        hand,
                        turn,
                        battleStats,
                        fuel: player.fuel,
                    });
                    if (energySum > 0) {
                        let output = baseOutput;
                        if (isFull) {
                            if (p.specialEffect === 'HEAL') tempPlayerHp = Math.min(player.maxHp, tempPlayerHp + 5);
                            if (p.specialEffect === 'RECYCLE') tempFuel = Math.min(player.maxFuel, tempFuel + 1);
                            if (p.specialEffect === 'OVERCHARGE_HEAL' && energySum >= 12) tempPlayerHp = Math.min(player.maxHp, tempPlayerHp + 3);
                            if (p.specialEffect === 'OVERCHARGE_RECYCLE' && energySum >= 12) tempFuel = Math.min(player.maxFuel, tempFuel + 1);
                            if (p.specialEffect === 'PRODUCT_SUPPORT_BONUS' && product(getLoadedValues(p)) === 12) tempFuel = Math.min(player.maxFuel, tempFuel + 1);
                            if (p.specialEffect === 'GCD_FUEL_BONUS' && getLoadedValues(p).length >= 2 && gcdArray(getLoadedValues(p)) >= 2) tempFuel = Math.min(player.maxFuel, tempFuel + 1);
                            if (p.specialEffect === 'ISOLATION_FUEL_BONUS' && getAdjacentParts({ row: pRelIdx, col: colIdx, parts: player.parts }).filter(other => other.type !== 'EMPTY').length === 0) tempFuel = Math.min(player.maxFuel, tempFuel + 1);
                            if (p.specialEffect === 'OVERCHARGE_SUPPORT' && energySum >= 12) {
                                tempPlayerHp = Math.min(player.maxHp, tempPlayerHp + 3);
                                tempFuel = Math.min(player.maxFuel, tempFuel + 1);
                            }
                            if (p.specialEffect === 'RAINBOW_HEAL_BONUS' && new Set(getLoadedColors(p)).size >= 3) tempPlayerHp = Math.min(player.maxHp, tempPlayerHp + 2);
                            if (p.specialEffect === 'CENTER_FULL_BONUS' && pRelIdx === 1 && colIdx === 1) tempFuel = Math.min(player.maxFuel, tempFuel + 1);
                        }
                        
                        output += buffGrid[pRelIdx][colIdx];
                        output += player.passivePower; 

                        if (p.type === 'CANNON' || p.type === 'MISSILE') pPower += output;
                        if (p.type === 'SHIELD') {
                            pShield += output;
                            if (p.specialEffect === 'THORNS') pThorns += Math.ceil(output / 2);
                            if (p.specialEffect === 'BLUE_THORNS_BONUS') pThorns += Math.max(2, getLoadedColors(p).filter(color => color === 'BLUE').length * 2);
                        }
                        if (p.type === 'ENGINE') pEngine += output;
                    }
                });
            }

            if (pEngine > 0) {
                pShield += pEngine;
                let fuelRecovered = Math.ceil(pEngine / 2); 
                tempFuel = Math.min(player.maxFuel, tempFuel + fuelRecovered);
            }

            // ENEMY CALCULATION (Updated to use actual parts)
            const eRelIdx = r - enemy.yOffset;
            let ePower = 0;
            let eShield = 0; // Enemy shield logic if needed
            let isEnemyHitbox = false;

            if (eRelIdx >= 0 && eRelIdx < SHIP_HEIGHT) {
                 const startIdx = eRelIdx * SHIP_WIDTH;
                 const rowParts = enemy.parts.slice(startIdx, startIdx + SHIP_WIDTH);
                 isEnemyHitbox = rowParts.some(p => p.type !== 'EMPTY');

                 if (!enemy.isStunned) {
                     rowParts.forEach((p, colIdx) => {
                         if (p.type === 'EMPTY' || p.type === 'AMPLIFIER') return;
                         const { energySum, output: baseOutput } = calculatePartOutput(p, {
                             row: eRelIdx,
                             col: colIdx,
                             parts: enemy.parts,
                             turn,
                             fuel: enemy.fuel,
                         });
                         
                         if (energySum > 0 && (p.type === 'CANNON' || p.type === 'MISSILE')) {
                             let output = baseOutput;
                             output += enemyBuffGrid[eRelIdx][colIdx];
                             // Ascension Scaling
                             if (selectedMissionLevel >= 1) output += 1;
                             if (selectedMissionLevel >= 6) output += 1;
                             ePower += output;
                         }
                     });
                 }
            }

            let result: ClashRowData['result'] = 'NONE';
            let damage = 0;

            if (pPower > 0 || ePower > 0) {
                if (pPower > ePower) {
                    if (isEnemyHitbox) {
                        result = 'ENEMY_HIT';
                        damage = pPower - ePower;
                    } else {
                        result = 'NONE'; 
                    }
                } else if (ePower > pPower) {
                    if (isPlayerHitbox) {
                        result = 'PLAYER_HIT';
                        let rawDmg = ePower - pPower;
                        damage = rawDmg; 
                    } else {
                        result = 'NONE'; 
                    }
                } else {
                    result = 'DRAW';
                }
            }

            if (pPower > 0 || ePower > 0 || pShield > 0) {
                clashData.push({ row: r, pPower, ePower, pShield, pThorns, result, damage });
            }
        }

        setClashState({ active: true, phase: 'INIT', data: clashData });
        
        audioService.playSound('buff'); 
        setTimeout(() => setClashState(prev => ({ ...prev, phase: 'CLASH' })), 100);
        
        await new Promise(r => setTimeout(r, 600)); 
        setClashState(prev => ({ ...prev, phase: 'IMPACT' }));
        audioService.playSound('attack'); 
        
        let playerHit = false;
        let enemyHit = false;
        clashData.forEach(c => {
             if (c.result === 'PLAYER_HIT') playerHit = true;
             if (c.result === 'ENEMY_HIT') enemyHit = true;
             if (c.result === 'DRAW') audioService.playSound('block');
        });
        if (playerHit) { audioService.playSound('lose'); }
        if (enemyHit) { audioService.playSound('attack'); }

        await new Promise(r => setTimeout(r, 400)); 
        
        clashData.forEach(c => {
            if (c.result === 'ENEMY_HIT') {
                tempEnemyHp = Math.max(0, tempEnemyHp - c.damage);
                enemyStunDmg++;
            } else if (c.result === 'PLAYER_HIT') {
                const blocked = Math.min(c.damage, c.pShield);
                const finalDmg = c.damage - blocked;
                if (finalDmg > 0) {
                    tempPlayerHp = Math.max(0, tempPlayerHp - finalDmg);
                    damageTakenThisRound += finalDmg;
                }
                
                if (c.pThorns > 0) {
                    tempEnemyHp = Math.max(0, tempEnemyHp - c.pThorns);
                    addLog(`【反撃】スパイク装甲！敵に${c.pThorns}ダメージ！`);
                }
            }
        });

        setClashState({ active: false, phase: 'DONE', data: [] });
        if (damageTakenThisRound > 0) {
            setBattleStats(prev => ({
                ...prev,
                damageTaken: prev.damageTaken + damageTakenThisRound,
            }));
        }

        if (tempPlayerHp > 0 && tempPlayerHp <= player.maxHp / 2 && player.talents.some(t => t.effectType === 'CRISIS_FUEL')) {
            tempFuel = Math.min(player.maxFuel, tempFuel + 1);
            addLog("火事場の馬鹿力！燃料回復");
        }

        setEnemy(prev => ({...prev, hp: tempEnemyHp}));
        setPlayer(prev => ({...prev, hp: tempPlayerHp, fuel: tempFuel}));

        let nextIsStunned = enemy.isStunned;
        let nextDurability = enemy.durability;

        if (tempEnemyHp > 0) {
            if (enemyStunDmg > 0) {
                if (!enemy.isStunned) {
                    nextDurability = Math.max(0, nextDurability - enemyStunDmg);
                    if (nextDurability === 0) {
                        nextIsStunned = true;
                        addLog("敵の防御値を削りきった！スタン！");
                        audioService.playSound('win');
                    } else {
                        addLog(`敵の防御値を${enemyStunDmg}削った！`);
                    }
                } else {
                    addLog("スタン中の敵を追撃！");
                }
            }

            if (enemy.isStunned) {
                nextIsStunned = false;
                nextDurability = enemy.maxDurability;
                addLog("敵システム再起動！防御値全快！");
                audioService.playSound('buff');
            }
            
            // Clear Enemy Energy after Attack
            const clearedParts = enemy.parts.map(p => {
                 // Clear slots if it attacked (had energy)
                 const energySum = p.slots.reduce((sum, s) => sum + (s.value || 0), 0);
                 if (energySum > 0 && (p.type === 'CANNON' || p.type === 'MISSILE')) {
                     return { ...p, slots: p.slots.map(s => ({...s, value: null, loadedColor: null})) };
                 }
                 return p;
            });

            setEnemy(prev => ({
                ...prev,
                hp: tempEnemyHp,
                durability: nextDurability,
                isStunned: nextIsStunned,
                parts: clearedParts
            }));
        }

        setPlayer(prev => ({ 
            ...prev, 
            parts: prev.parts.map(p => ({...p, slots: p.slots.map(s => ({...s, value: null, loadedColor: null})) })) 
        }));
        
        setAnimating(false);

        if (tempPlayerHp <= 0) {
            setPhase('GAME_OVER');
            audioService.playSound('lose');
        } else if (tempEnemyHp <= 0) {
            audioService.playSound('win');
            if (stage === FINAL_STAGE_NORMAL && !isEndless) {
                setPhase('VICTORY');
                handlePhaseComplete(true); 
            } else {
                setupRewardPhase();
            }
        } else {
            setTurn(prev => prev + 1);
            
            // Update Enemy State (Move & Charge & Intent)
            // Pass the current player state so the AI can target intelligently
            // (tempPlayerHp and tempFuel are just scalars, yOffset is inside player.yOffset)
            setEnemy(prev => {
                if (!nextIsStunned) {
                    const { nextEnemy, intents } = updateEnemyState(prev, stage, { ...player, hp: tempPlayerHp });
                    setEnemyIntents(intents);
                    return nextEnemy;
                } else {
                    setEnemyIntents([]);
                    return prev;
                }
            });

            drawEnergy(5);
        }
    };

    const setupRewardPhase = () => {
        let baseCoins = 50 + (stage * 10) + Math.floor(Math.random() * 20);
        let coinBonusPct = 0;
        player.talents.forEach(t => { if (t.effectType === 'EXTRA_COINS') coinBonusPct += t.value; });
        const coins = Math.floor(baseCoins * (1 + coinBonusPct / 100));

        let healAmt = 0;
        player.talents.forEach(t => { if (t.effectType === 'HEAL_AFTER_BATTLE') healAmt += t.value; });
        
        setEarnedCoins(coins);
        setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp + healAmt), starCoins: p.starCoins + coins}));
        
        if (healAmt > 0) addLog(`勝利の余韻！HPを${healAmt}回復`);
        if (coinBonusPct > 0) addLog(`おこづかい！コインボーナス+${coinBonusPct}%`);
        
        const persistentHand = hand.filter(c => !c.isTemporary);

        setPool(current => ({
            ...current,
            coolNumbers: [...current.coolNumbers, ...persistentHand.map(c => c.value)],
            coolColors: [...current.coolColors, ...persistentHand.map(c => c.color)]
        }));
        setHand([]);

        setRewardOptions(rollRewardParts(getAvailablePartTemplates(progress), 2, 'rew_p'));
        setPhase('REWARD_SELECT');
        audioService.playBGM('paper_plane_vacation'); // Switch to vacation theme for reward
        audioService.playSound('win');
    };

    const handleRewardSelect = (part: ShipPart) => {
        setPendingPart(part);
        setPhase('REWARD_EQUIP');
        audioService.playSound('select');
    };

    const handleDiscardReward = () => {
        setPendingPart(null);
        startVacation();
        audioService.playSound('select');
    };
    
    const handleRerollRewards = () => {
        let rerollCost = 50;
        player.talents.forEach(t => { if (t.effectType === 'DISCOUNT_REROLL_REWARD') rerollCost -= t.value; });
        rerollCost = Math.max(0, rerollCost);

        if (player.starCoins < rerollCost) {
            audioService.playSound('wrong');
            return;
        }
        setPlayer(p => ({...p, starCoins: p.starCoins - rerollCost}));
        
        setRewardOptions(rollRewardParts(getAvailablePartTemplates(progress), 2, 'rew_reroll'));
        audioService.playSound('select');
    };

    const handleStorePart = () => {
        if (!pendingPart) return;
        setPlayer(prev => ({
            ...prev,
            partInventory: [...prev.partInventory, pendingPart]
        }));
        setPendingPart(null);
        audioService.playSound('select');
        
        if (phase === 'REWARD_EQUIP') {
             startVacation();
        } else {
             setVacationLog(`パーツを「${pendingPart.name}」を格納庫へ送りました。`);
        }
    };

    const generateVacationEvents = () => {
        const events: VacationEvent[] = [];
        const count = 3 + Math.floor(Math.random() * 2); 
        
        for (let i = 0; i < count; i++) {
            const template = VACATION_EVENTS_DB[Math.floor(Math.random() * VACATION_EVENTS_DB.length)];
            events.push({
                ...template,
                id: `vac_${Date.now()}_${i}`
            });
        }
        setVacationEvents(events);
    };

    const startVacation = () => {
        let days = 4 + Math.floor(Math.random() * 3); 
        player.talents.forEach(t => { if (t.effectType === 'FREE_FIRST_VACATION') days += t.value; });
        setPlayer(prev => ({ ...prev, vacationDays: days }));
        setVacationLog("戦闘お疲れ様！休暇を楽しんでください。");
        generateVacationEvents();
        setPhase('VACATION');
        audioService.playBGM('paper_plane_vacation'); // Already set but good for re-entry
    };

    const executeVacationEvent = (event: VacationEvent) => {
        if (event.coinCost && event.coinCost > 0 && player.starCoins < event.coinCost) {
            setVacationLog(`スターコインが足りません！ (${event.coinCost}必要)`);
            audioService.playSound('wrong');
            return;
        }
        
        if (player.vacationDays < event.cost) {
            setVacationLog("休暇日数が足りません！");
            audioService.playSound('wrong');
            return;
        }

        let discount = 1;
        player.talents.forEach(t => { if(t.effectType==='SHOP_DISCOUNT') discount -= (t.value/100); });
        discount = Math.max(0.1, discount);
        const finalCoinCost = event.coinCost ? Math.floor(event.coinCost * discount) : 0;

        setPlayer(prev => ({ 
            ...prev, 
            vacationDays: prev.vacationDays - event.cost,
            starCoins: prev.starCoins - finalCoinCost
        }));
        
        let resultMsg = "";
        
        switch (event.type) {
            case 'REPAIR': {
                let healAmt = 0;
                let maxHpGain = 0;
                if (event.name === 'ドック入り') { healAmt = 999; maxHpGain = 5; }
                else if (event.name === '特製フレーム交換') { healAmt = 999; maxHpGain = 8; }
                else if (event.name === '放課後メンテ会') healAmt = 20;
                else if (event.name === '工具箱メンテ') healAmt = 15;
                else if (event.name === '応急修理') healAmt = 10;
                else if (event.name === 'ばんそうこう補修') healAmt = 6;
                else healAmt = 10;

                setPlayer(prev => {
                    let newMax = prev.maxHp + maxHpGain;
                    return { ...prev, maxHp: newMax, hp: Math.min(newMax, prev.hp + healAmt) };
                });
                
                const repMsgs: Record<string, string[]> = {
                    '応急修理': ["ガムテープでペタペタ。まあ、落ちなきゃいいんだ。","外装をプラ板で覆った。風の抵抗が減った気がする。","少し叩いたら直った。昭和の家電かよ！"],
                    'ばんそうこう補修': ["穴の空いた箇所にオシャレなシールを貼った。少しマシだ。","絆創膏を貼って「痛いの飛んでけー」。自己暗示は大事だ。","落書きで傷を隠した。芸術的だ！"],
                    '工具箱メンテ': ["ホコリまみれの工具箱が火を吹いた！ネジは余ったがヨシ。","ドライバー片手に奮闘。油まみれの顔で空を見上げる。","「ここはこう、だっけな…」適当な整備だが動いている。"],
                    '放課後メンテ会': ["みんなでワイワイ機体を磨く。温かい記憶が傷を癒やす。","差し入れの肉まんを食べながらの作業。チームワークの勝利だ。","「そこ貸して！」仲間との他愛ない会話が、明日への力になる。"],
                    'ドック入り': ["おやっさんの神業メンテ！見違えるように生まれ変わった。","まるで新品！だが、かつての傷痕が少しだけ恋しい気もする。","プロの設備は違う。自分のポンコツぶりが恥ずかしくなるほどだ。"],
                    '特製フレーム交換': ["禁断の技術で骨組みごと刷新。これはもう別のヒコーキだ！","痛みに耐え、新たな鋼の肉体を繋ぐ。俺はまだ折れない。","輝く新型フレーム。「もう二度と負けない」誓いが胸に宿る。"]
                };
                const rMsgs = repMsgs[event.name] || ["修理完了！"];
                resultMsg = rMsgs[Math.floor(Math.random() * rMsgs.length)] + ` (HP+${healAmt===999?'全回復':healAmt}${maxHpGain>0?`, 上限+${maxHpGain}`:''})`;
                audioService.playSound('buff');
                break;
            }
            case 'FUEL': {
                const fVal = event.value || 0;
                setPlayer(prev => {
                    let newMax = prev.maxFuel + fVal;
                    return { ...prev, maxFuel: newMax, fuel: newMax };
                });
                const fMsgs: Record<string, string[]> = {
                    '燃料補給': ["標準的な燃料を給油。これでまた飛べるぞ。", "タンクのギリギリまでねじ込んだ。","スタンドの兄ちゃんが窓を拭いてくれた。"],
                    '理科室アルコール補給': ["怪しいアルコール燃料。少し焦げ臭いのが不安だ。", "先生の目を盗んでコッソリ補充。背徳の味がする。","蒸留の過程で何かが間違っている気がするが、燃えればヨシ！"],
                    'ガソリン代カンパ': ["貧乏を見かねた誰かがカンパしてくれた！", "カンパ箱にお札が入っていた。涙で前が見えない。","「これでうまい棒でも買いな」…いや、燃料を買います。"],
                    'タンク増設': ["大胆にも外付けタンクを無理やり接着！", "でっかいポリタンクを背負った。ロマンの塊だ。","見栄えは悪いが背に腹は代えられない。"],
                    '予備タンク配備': ["スマートな予備タンクを取り付けた。", "安全第一。これで長旅も安心だ。","まるで純正パーツような美しい仕上がりだ。"],
                    'プレミアム燃料': ["ハイオク給油！エンジンが嬉しそうに唸る！", "青い輝きを放つ超燃料を入れた。","高価な燃料の匂いは甘くて、どこか官能的だ。"],
                    '高濃度ブースト剤': ["ヤバい色の液体を注入。火力が湧き上がる！", "取り扱い注意の劇薬。機体が微かに震えている。","これを入れたら後戻りはできない。覚悟を決めろ。"]
                };
                const selectedFMsgs = fMsgs[event.name] || ["燃料フルチャージ！"];
                resultMsg = selectedFMsgs[Math.floor(Math.random() * selectedFMsgs.length)] + (fVal ? ` (上限+${fVal})` : "");
                audioService.playSound('buff');
                break;
            }
            case 'COIN': {
                const coin = event.name === 'スポンサー契約' ? 220 : event.name === '臨時ボーナス' ? 150 : event.name === '文化祭の売上' ? 120 : event.name === '新聞配達' ? 70 : event.name === 'アルバイト' ? 50 : event.name === '落とし物係' ? 40 : 50;
                setPlayer(p => ({ ...p, starCoins: p.starCoins + coin }));
                const cMsgs: Record<string, string[]> = {
                    'アルバイト': ["汗水流して働いた。小銭の重みが嬉しい。","ファストフード店でひたすらポテトを揚げた。","皿洗いで指がふやけたが、心は満たされている。"],
                    '落とし物係': ["財布を届けたらお礼をもらった。一日一善！","「えらいねぇ」と撫でられ、お小遣いをゲット。","持ち主の笑顔プライスレス。もちろんお小遣いも大事だが。"],
                    '新聞配達': ["朝もやの中、自転車を漕ぐ。青春の味がする。","犬に吠えられながら配りきった！達成感。","雨の日の配達は地獄だが、給料袋の厚みが全てを癒やす。"],
                    '臨時ボーナス': ["臨時収入だ！この金で何を買おうか。","ボスのポケットからこぼれ落ちた札束…いや、貰った。","「よくやった」ポンと渡されたご褒美。粋な計らいだ。"],
                    '文化祭の売上': ["焼きそばが大ヒット。みんなの笑顔が輝いている。","出し物の売上をピンハネ…いや、正当な分配だ！","完売御礼！祭りの終わりの静寂と、金庫の重み。"],
                    'スポンサー契約': ["怪しげな企業がスポンサーに。機体にダサいロゴが入った。","「君の才能に投資しよう」パトロンが現れた！","条件は厳しいが、背に腹は代えられない。大型契約成立！"]
                };
                resultMsg = (cMsgs[event.name] || ["コイン獲得！"])[Math.floor(Math.random() * (cMsgs[event.name]?.length || 1))] + ` (+${coin} Coin)`;
                audioService.playSound('select');
                break;
            }
            case 'ENERGY': {
                setPool(prev => {
                    const newNums = [...prev.genNumbers];
                    const newCols = [...prev.genColors];
                    if (event.name === 'エネルギー採掘') newNums.push(6);
                    else if (event.name === '算数ドリル強化') newNums.push(5);
                    else if (event.name === '朝練集中メニュー') newNums.push(7);
                    else if (event.name === '色鉛筆ブレンド') newCols.push('BLUE');
                    else if (event.name === 'リアクター調整') newCols.push('ORANGE');
                    else if (event.name === '白紙ノート増刷') newCols.push('WHITE');
                    return { ...prev, genNumbers: newNums, genColors: newCols };
                });
                const eMsgs: Record<string, string[]> = {
                    'エネルギー採掘': ["廃鉱山で「6」の輝きを放つ結晶を発掘！","泥臭く地面を掘り返し、「6」を手に入れた。","つるはしが折れたとき、そこに「6」があった。"],
                    '算数ドリル強化': ["頭が痛くなる特訓の末、「5」という数字の美しさを知った。","ドリルを破り捨てたい衝動を抑え、「5」を習得！","計算の果てに宇宙の真理「5」に到達した。"],
                    '朝練集中メニュー': ["吐きそうなほどのダッシュから生み出された奇跡の「7」。","限界のその先で、最強の数字「7」に手を伸ばした。","泥だらけのジャージ。だが俺は「7」を手に入れた。"],
                    '色鉛筆ブレンド': ["青色の芯を砕いて装甲にすり込む。これで「青」が使える！","深海のような静かな「青」を抽出した。","空の「青」を切り取ったかのような純粋なエネルギー。"],
                    'リアクター調整': ["燃え盛る情熱をジェネレータへ。熱き「オレンジ」の炎だ！","コアが軋む音とともに「オレンジ」が解放された。","爆発ギリギリの出力を制御し「オレンジ」へと変換する。"],
                    '白紙ノート増刷': ["雑念を捨て白紙に向き合う。「白」の可能性を拡張した。","何も描かれていない紙を見つめ、心を無にした。","無限の可能性を秘めた「白」のキャンバスが広がった。"]
                };
                resultMsg = (eMsgs[event.name] || ["プール強化！"])[Math.floor(Math.random() * 3)];
                audioService.playSound('buff');
                break;
            }
            case 'TREASURE': {
                setPlayer(p => ({ ...p, passivePower: p.passivePower + 1 }));
                const tMsgs: Record<string, string[]> = {
                    '謎の宝箱': ["宝箱を開けると光が溢れ、機体が不思議な力で強化された！","ホコリまみれの箱の中身は、誰かが隠した最新パーツだった。","ミミックじゃなくて良かった。静かに力を吸収する。"],
                    '卒業生の遺産': ["かつての英雄が残した設計図。想いが機体を強くする。","ロッカーの奥に刻まれた先輩のポエムを読み、勇気が湧いた。","錆びたペンダント。持ち主の加護が宿っているのを感じる。"],
                    '校庭の埋蔵品': ["タイムカプセルを掘り起こしたら、謎の超技術コアが出てきた。","10年前に埋めたおもちゃが、時を経て神具に変貌していた。","誰かの隠した「へそくり権力」を横領。力がみなぎる！"]
                };
                resultMsg = (tMsgs[event.name] || ["お宝発見！"])[Math.floor(Math.random() * 3)] + " (出力+1)";
                audioService.playSound('win');
                break;
            }
            case 'PARTS':
            case 'SHOP': {
                const availableTemplates = getAvailablePartTemplates(progress);
                const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
                let quality = event.tier === 3 ? 1.5 : 1.0;
                if (event.type === 'SHOP') quality = 1.3; 
                const newPart = createPartFromTemplate(template, 'new_p', quality);
                setPendingPart(newPart);
                const pMsgs: Record<string, string[]> = {
                    '闇市': [`怪しい商人がコートを広げ、「${newPart.name}」を渡してきた。`,`「絶対内緒だぜ？」と念押しされ、「${newPart.name}」を買い取った。`,`裏路地の取引。紙袋に入った「${newPart.name}」を受け取る。`],
                    '部室バザー': [`段ボール箱の底から「${newPart.name}」を発見。お宝だ！`,`先輩がガラクタとして投売りしていた「${newPart.name}」をゲット。`,`値切り交渉の末、「${newPart.name}」を手に入れた！`],
                    '購買部の特売': [`争奪戦を制し、特売品の「${newPart.name}」を勝ち取った！`,`昼休みのチャイムと同時に駆け込み「${newPart.name}」を購入。`,`ラスイチの「${newPart.name}」を、スライディングでお買い上げ。`],
                    'パーツ回収': [`スクラップの山から「${newPart.name}」を拾い上げた。`,`落ちていた「${newPart.name}」を懐におさめる。ラッキー。`,`野良犬がくわえていた「${newPart.name}」を、骨と交換で手に入れた。`],
                    '倉庫の掘り出し物': [`ホコリを払うと「${newPart.name}」の文字が見えた。名機だ。`,`カビ臭い倉庫の中で「${newPart.name}」と目が合った。`,`お札が貼られた木箱を開けると、「${newPart.name}」が眠っていた。`],
                    '先輩のおさがり': [`「これ、お前にやるよ」先輩から「${newPart.name}」を譲り受けた。`,`古ぼけた「${newPart.name}」。先輩の汗と涙が染み込んでいる。`,`「俺の屍を越えてゆけ」と託された「${newPart.name}」。重いよ。`],
                    '軍需物資': [`違法流通のコンテナから「${newPart.name}」を密輸。ヤバいぜ。`,`国から横流しされた「${newPart.name}」。圧倒的オーラだ。`,`夜の港で「${newPart.name}」を受け取る。スリル満点だ。`],
                    '文化祭特注パーツ': [`徹夜で作った完全ワンオフの「${newPart.name}」が完成！`,`美術部の協力を得て、ド派手な「${newPart.name}」が組み上がった。`,`「俺の考えた最強のパーツ」がついに具現化！「${newPart.name}」！`]
                };
                resultMsg = (pMsgs[event.name] || [`「${newPart.name}」を入手！`])[Math.floor(Math.random() * 3)] + " (装備枠を選択)";
                audioService.playSound('select');
                break;
            }
            case 'ENHANCE': {
                const maxHpGainE = event.name === '特別改造' ? 20 : event.name === '溶接ブース強化' ? 12 : 8;
                setPlayer(prev => ({ ...prev, maxHp: prev.maxHp + maxHpGainE })); 
                const enhMsgs: Record<string, string[]> = {
                    '特別改造': ["装甲の裏にあの日の写真を貼った。死ねない理由ができた。","規格外の装甲板をムリヤリ溶接。無敵艦隊の誕生だ。","「男のロマン」を具現化したら、とんでもなく頑丈になった。"],
                    '溶接ブース強化': ["火花を散らして鉄板を貼り付けた！無骨でカッコいい。","専門設備で耐久力アップ。手触りが違うぜ。","熱い漢達の汗と涙が、機体に新たな装甲を産み出した。"],
                    'フレーム補強': ["ボンドでペタペタ。意外とこれが一番頑丈だ。","骨組みにテープをぐるぐる巻きに。努力の結晶だ。","余った割り箸を挟み込んで補強。エコで丈夫！"]
                };
                resultMsg = (enhMsgs[event.name] || ["強化完了！"])[Math.floor(Math.random() * 3)] + ` (HP上限+${maxHpGainE})`;
                audioService.playSound('buff');
                break;
            }
            case 'TRAINING': {
                const pwrGain = event.name === '筋トレ合宿' ? 2 : 1;
                setPlayer(prev => ({ ...prev, passivePower: prev.passivePower + pwrGain }));
                const trnMsgs: Record<string, string[]> = {
                    '極秘訓練': ["地下施設での地獄のシミュレーター。生死の境を越えた。","目隠しして機体を操る特訓。心の目で敵が見える！","謎の組織の訓練プログラムを踏破。俺は機械になった。"],
                    '朝練メニュー': ["だれもいないグラウンドをひたすら走る。心が澄み渡る。","冷たい朝の空気が肺を焼き、闘志を呼び覚ました。","校長先生と一緒にラジオ体操。精神力が鍛えられた。"],
                    '筋トレ合宿': ["マッスル！マッスル！筋肉は全てを解決する！！","プロテインをガブ飲みし、物理的に機体を押し出す力を得た。","大胸筋が歩いてる！圧倒的パワーで機体をねじ伏せる！"]
                };
                resultMsg = (trnMsgs[event.name] || ["特訓完了！"])[Math.floor(Math.random() * 3)] + ` (出力+${pwrGain})`;
                audioService.playSound('buff');
                break;
            }
            case 'SACRIFICE': {
                if (player.maxFuel <= 1) {
                     setVacationLog("これ以上燃料を減らせません！");
                     audioService.playSound('wrong');
                     return;
                }
                const sacGain = event.name === '課題の先食い' ? 1 : 2;
                setPlayer(prev => ({
                    ...prev, maxFuel: prev.maxFuel - 1, fuel: Math.min(prev.maxFuel - 1, prev.fuel), passivePower: prev.passivePower + sacGain
                }));
                const sacMsgs: Record<string, string[]> = {
                    '悪魔の契約': ["燃料タンクを削り落とし、空いたスペースに大砲を積んだ。狂気の沙汰だ。","悪魔の囁きに応じ、機体の寿命と引き換えに破壊力を手に入れた...","契約の烙印が刻まれた。後悔はしていない。"],
                    '徹夜の代償': ["己の体を削って改造。もう引き返せない、前へ進むだけだ。","血を吐きながら出力コアを調整。後戻りはできない。","睡眠時間を燃料に変換。目を開けたまま意識が飛んでいる。"],
                    '課題の先食い': ["宿題のプリントを燃料にして火格子に突っ込んだ。来週の俺、頼んだぞ。","未来の自分を生贄に捧げ、今の力を得た。","テストの点数を犠牲に、いまを生き抜く。母さんごめん。"]
                };
                resultMsg = (sacMsgs[event.name] || ["代償を払った..."])[Math.floor(Math.random() * 3)] + ` (出力+${sacGain}, 燃料上限-1)`;
                audioService.playSound('debuff');
                break;
            }
            case 'GAMBLE': {
                if (Math.random() < 0.5) {
                     const reward = event.name === '裏カジノ' ? 300 : event.name === '放課後ポーカー勝負' ? 450 : 100;
                     setPlayer(p => ({ ...p, starCoins: p.starCoins + reward }));
                     const gWinMsgs: Record<string, string[]> = {
                         '裏カジノ': ["スロットで777！コインが滝のように溢れ出した！","ディーラーが青ざめ、後ろの扉が開く前に荒稼ぎして逃げた。","ルーレットの一点賭けが的中！人生チョロいぜ。"],
                         'くじ引き屋台': ["「おおっ、1等じゃねえか！」おっちゃんの悔しそうな顔がたまらない。","たまたま買ったくじが大当たり！運を使い切ってないか心配だ。","子供から巻き上げたとは言わせない。俺の実力だ。"],
                         '放課後ポーカー勝負': ["ロイヤルストレートフラッシュ。俺の勝ちだ。","相手のブラフを見抜き、全掛けでかっさらった。","イカサマだと騒ぐ連中を尻目に、スマートに勝ち逃げした。"]
                     };
                     resultMsg = (gWinMsgs[event.name] || ["大勝利！"])[Math.floor(Math.random() * 3)] + ` (+${reward})`;
                     audioService.playSound('win');
                } else {
                     const gLoseMsgs: Record<string, string[]> = {
                         '裏カジノ': ["俺の幸運の女神は、今日は機嫌が悪かったらしい。何もない。","「これが大人の世界ってやつさ」ため息とともにカジノを後にする。","身ぐるみ剥がされた。この恨みは戦闘で晴らしてやる。"],
                         'くじ引き屋台': ["「参加賞のポケットティッシュだ」...ちくしょう。","ハズレくじの山を見て虚無感に襲われる。","おっちゃんの「また来な坊主！」という言葉が胸をえぐる。"],
                         '放課後ポーカー勝負': ["持ち金を綺麗にハギ取られた。あいつらプロか？","相手のブラフに完全にビビって降りちまった...無様だ。","ツーペアで勝負に出た俺が馬鹿だった。"]
                     };
                     resultMsg = (gLoseMsgs[event.name] || ["負けた..."])[Math.floor(Math.random() * 3)];
                     audioService.playSound('lose');
                }
                break;
            }
            case 'UNKNOWN': {
                if (Math.random() < 0.5) {
                    setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp + 20)}));
                    const uHpMsgs: Record<string, string[]> = {
                        '謎のイベント': ["草むらで寝転がったら気分がリフレッシュした。(HP回復)","謎の宇宙人からリンゴをもらい、食べたら元気になった。(HP回復)","おばあちゃんから謎のせんべいを貰って食べた。謎に元気に。(HP回復)"],
                        '夜の旧校舎': ["開かずの扉の奥で安全な毛布を見つけ、眠りに落ちた。(HP回復)","誰もいないはずの音楽室から癒しのメロディが流れてきた。(HP回復)","二宮金次郎像が、不思議と肩を揉んでくれた気がした。(HP回復)"],
                        'うわさの物置': ["カビ臭いが、なぜか実家のような安心感でぐっすり休めた。(HP回復)","ホコリまみれのソファが意外とふかふかだった。(HP回復)","古い雑誌を読んで有意義な時間を過ごした。(HP回復)"]
                    };
                    resultMsg = (uHpMsgs[event.name] || ["なんか回復した"])[Math.floor(Math.random() * 3)];
                } else {
                    setPlayer(p => ({...p, starCoins: p.starCoins + 100}));
                    const uCoinMsgs: Record<string, string[]> = {
                        '謎のイベント': ["偶然見つけた盗賊の隠し穴から、ごっそり金貨を拝借した！(+100)","歩いていたら空からコインが降ってきた！(+100)","謎のボタンを押したらコインが出てきた。ラッキー！(+100)"],
                        '夜の旧校舎': ["理科室の骨格標本がコインを握りしめていた。拝借するぜ。(+100)","開かないロッカーをこじ開けたら裏金が！(+100)","トイレの三番目の個室に落ちていた金。呪われていないといいが。(+100)"],
                        'うわさの物置': ["ツボを割ったらコインが飛び出した。RPGあるあるだ。(+100)","昔の先輩のへそくり袋を発見。ありがたく使わせてもらう。(+100)","跳び箱の中からコインが！誰かが隠していたのだろう。(+100)"]
                    };
                    resultMsg = (uCoinMsgs[event.name] || ["コインゲット"])[Math.floor(Math.random() * 3)];
                }
                audioService.playSound('select');
                break;
            }
            default:
                resultMsg = "リフレッシュしました。";
                break;
        }

        setVacationLog(resultMsg);
        setVacationEvents(prev => prev.filter(e => e.id !== event.id));
    };

    const handlePartEquip = (slotIdx: number) => {
        if (!pendingPart) return;
        
        const newParts = [...player.parts];
        newParts[slotIdx] = { ...pendingPart, id: `p_${Date.now()}_${slotIdx}` }; 
        
        setPlayer(prev => ({ ...prev, parts: newParts }));
        setPendingPart(null);
        audioService.playSound('buff');

        if (phase === 'REWARD_EQUIP') {
             startVacation();
        } else {
             setVacationLog(`パーツを「${pendingPart.name}」に換装しました！`);
        }
    };

    const handleHangarAction = (loc: 'SHIP' | 'INV', idx: number) => {
        if (!hangarSelection) {
            setHangarSelection({ loc, idx });
            audioService.playSound('select');
            return;
        }

        if (hangarSelection.loc === loc && hangarSelection.idx === idx) {
            setHangarSelection(null);
            return;
        }

        const newPlayer = { ...player };
        const parts = [...newPlayer.parts];
        const inventory = [...newPlayer.partInventory];

        const sourcePart = hangarSelection.loc === 'SHIP' ? parts[hangarSelection.idx] : inventory[hangarSelection.idx];
        const targetPart = loc === 'SHIP' ? parts[idx] : inventory[idx];

        if (hangarSelection.loc === 'SHIP' && loc === 'SHIP') {
            parts[hangarSelection.idx] = targetPart;
            parts[idx] = sourcePart;
        } else if (hangarSelection.loc === 'INV' && loc === 'INV') {
            inventory[hangarSelection.idx] = targetPart;
            inventory[idx] = sourcePart;
        } else if (hangarSelection.loc === 'INV' && loc === 'SHIP') {
            parts[idx] = sourcePart;
            
            if (targetPart.type === 'EMPTY') {
                inventory.splice(hangarSelection.idx, 1);
            } else {
                inventory[hangarSelection.idx] = targetPart;
            }
        } else if (hangarSelection.loc === 'SHIP' && loc === 'INV') {
            if (sourcePart.type === 'EMPTY') {
                setHangarSelection(null);
                return;
            }
            parts[hangarSelection.idx] = targetPart;
            inventory[idx] = sourcePart;
        }
        
        setPlayer({ ...newPlayer, parts, partInventory: inventory });
        setHangarSelection(null);
        audioService.playSound('buff');
    };

    const handleUnequip = () => {
        if (hangarSelection && hangarSelection.loc === 'SHIP') {
            const newPlayer = { ...player };
            const part = newPlayer.parts[hangarSelection.idx];
            if (part.type !== 'EMPTY') {
                newPlayer.parts[hangarSelection.idx] = createEmptyPart(`empty_${Date.now()}`);
                newPlayer.partInventory.push(part);
                setPlayer(newPlayer);
                audioService.playSound('select');
            }
            setHangarSelection(null);
        }
    };

    const endVacation = () => {
        if (pendingPart) {
            setVacationLog("パーツ交換を完了するかキャンセルしてください！");
            return;
        }
        setStage(s => s + 1);
        initBattle(stage + 1);
    };

    const handlePhaseComplete = (isVictory: boolean = false) => {
        if (isVictory) {
            const persistentHand = hand.filter(c => !c.isTemporary);
            setPool(current => ({
                ...current,
                coolNumbers: [...current.coolNumbers, ...persistentHand.map(c => c.value)],
                coolColors: [...current.coolColors, ...persistentHand.map(c => c.color)]
            }));
            setHand([]);
            
            // Re-load progress to ensure consistency
            const currentProgress = loadProgress();
            const newProgress = { ...currentProgress };
            newProgress.rank = (newProgress.rank || 1) + 1;
            
            // Record Max Level
            const shipId = selectedShipId;
            const currentMax = newProgress.maxClearedLevel[shipId] ?? -1; 
            
            if (selectedMissionLevel > currentMax) {
                newProgress.maxClearedLevel[shipId] = selectedMissionLevel;
                // Award Rerolls for high level clear
                if (selectedMissionLevel >= 1) newProgress.rerollCount += 1;
                if (selectedMissionLevel >= 5) newProgress.rerollCount += 2;
            }

            const lockedTemplates = getLockedUnlockablePartTemplates(newProgress);
            if (lockedTemplates.length > 0) {
                const unlockedTemplate = lockedTemplates[Math.floor(Math.random() * lockedTemplates.length)];
                newProgress.unlockedPartNames = Array.from(new Set([...(newProgress.unlockedPartNames || []), unlockedTemplate.name]));
                setNewlyUnlockedPart(createPartFromTemplate(unlockedTemplate, 'unlock_preview'));
            } else {
                setNewlyUnlockedPart(null);
            }
            
            setProgress(newProgress);
            storageService.savePaperPlaneProgress(newProgress);
        }
    };

    const activateEndlessMode = () => {
        setIsEndless(true);
        setPhase('REWARD_SELECT');
        setupRewardPhase();
    };

    // --- RENDER HELPERS ---

    const RenderTooltip = () => {
        if (!tooltipPart) return null;
        
        const getTypeDescription = (part: ShipPart) => {
            if (part.specialEffect === 'RANK_UP') {
                 return 'エネルギーを消費して「カード」を生成します。\nシールドや攻撃力は発生しません。';
            }
            if (part.specialEffect === 'HEAL') {
                return '出力は「シールド」になります。\nさらに、スロットが埋まると船体のHPを回復します。';
            }
            if (part.specialEffect === 'WHITE_BONUS') {
                return '白エネルギーを装填したスロット1つごとに、追加で出力が上昇します。';
            }
            if (part.specialEffect === 'MATCH_BONUS') {
                return 'すべてのスロットに同じ数字をそろえると、追加出力を得ます。';
            }
            if (part.specialEffect === 'LOW_SCORE_BOOST') {
                return '3以下の低い数字を装填するほど、追加で出力が伸びます。';
            }
            if (part.specialEffect === 'RAINBOW_BONUS') {
                return '白・青・橙の3色がそろうと、虹色ボーナスで出力が上昇します。';
            }
            if (part.specialEffect === 'SOLO_DOUBLE') {
                return '1スロットに全力集中するパーツです。単独装填時、出力がさらに倍化します。';
            }
            if (part.specialEffect === 'BLUE_BONUS') {
                return '青エネルギーを装填した数だけ、追加で出力が上昇します。';
            }
            if (part.specialEffect === 'ORANGE_BONUS') {
                return 'オレンジエネルギーを装填した数だけ、大きく出力が上昇します。';
            }
            if (part.specialEffect === 'HIGH_SCORE_BOOST') {
                return '6以上の高い数字を装填するほど、追加で出力が上昇します。';
            }
            if (part.specialEffect === 'EVEN_BONUS') {
                return 'すべてのスロットが偶数で埋まると、追加出力を得ます。';
            }
            if (part.specialEffect === 'ODD_BONUS') {
                return 'すべてのスロットが奇数で埋まると、追加出力を得ます。';
            }
            if (part.specialEffect === 'SEQUENCE_BONUS') {
                return '数字が昇順または降順に並ぶと、追加出力を得ます。';
            }
            if (part.specialEffect === 'MONO_COLOR_BONUS') {
                return 'すべて同じ色のエネルギーで埋まると、追加出力を得ます。';
            }
            if (part.specialEffect === 'OVERCHARGE_HEAL') {
                return 'フル装填かつ合計値が12以上なら、追加出力と回復効果が発生します。';
            }
            if (part.specialEffect === 'OVERCHARGE_RECYCLE') {
                return 'フル装填かつ合計値が12以上なら、追加出力と燃料回復が発生します。';
            }
            if (part.specialEffect === 'PRIME_BONUS') {
                return '素数の数字を装填するほど追加出力を得ます。すべて素数ならさらに強化されます。';
            }
            if (part.specialEffect === 'SQUARE_BONUS') {
                return '平方数の数字を装填するたびに追加出力を得ます。';
            }
            if (part.specialEffect === 'GCD_BONUS') {
                return '装填した数字の最大公約数が高いほど出力が増加します。';
            }
            if (part.specialEffect === 'LCM_BONUS') {
                return '装填した数字の最小公倍数をもとに高出力へ変換します。';
            }
            if (part.specialEffect === 'FIBONACCI_BONUS') {
                return 'フィボナッチ数を装填するほど追加出力を得ます。全スロットがそうならさらに強化されます。';
            }
            if (part.specialEffect === 'MEAN_BONUS') {
                return '装填した数字の平均値をそのまま追加出力へ変換します。';
            }
            if (part.specialEffect === 'MEDIAN_BONUS') {
                return '装填した数字の中央値ぶん、安定した追加出力を得ます。';
            }
            if (part.specialEffect === 'SAME_TYPE_LINK') {
                return '上下左右の同じタイプのパーツ数だけ追加出力を得ます。';
            }
            if (part.specialEffect === 'ROW_UNITY') {
                return '同じ列の3マスが同タイプでそろうと大きな追加出力を得ます。';
            }
            if (part.specialEffect === 'CENTER_COMMAND') {
                return '中央マスに置くと常に指揮ボーナスを得ます。';
            }
            if (part.specialEffect === 'DIAGONAL_LINK') {
                return '斜め方向のパーツ数に応じて追加出力を得ます。';
            }
            if (part.specialEffect === 'MIRROR_BONUS') {
                return '左右対称の位置に同タイプのパーツがあると追加出力を得ます。';
            }
            if (part.specialEffect === 'TURN_SCALE') {
                return 'ターンが進むほど追加出力が増えていきます。';
            }
            if (part.specialEffect === 'DAMAGE_MEMORY') {
                return 'この戦闘で受けたダメージ量を記憶し、怒りの出力へ変えます。';
            }
            if (part.specialEffect === 'EFFORT_STACK') {
                return 'この戦闘でこのパーツに装填した回数だけ追加出力を得ます。';
            }
            if (part.specialEffect === 'UNIQUE_VALUE_RECORD') {
                return 'この戦闘で見た数字の種類数に応じて追加出力を得ます。';
            }
            if (part.specialEffect === 'RANDOM_SPIKE') {
                return 'ランダムで大当たりや小当たりの追加出力が発生します。';
            }
            if (part.specialEffect === 'FORECAST_COLOR') {
                return 'ターンごとの予報色と一致する装填色に追加出力を与えます。';
            }
            if (part.specialEffect === 'NO_CONSUME_CHANCE') {
                return '装填時、一定確率でカードを消費せず手札に残します。';
            }
            if (part.specialEffect === 'PALINDROME_BONUS') {
                return '左右対称の数字並びで装填すると大きな追加出力を得ます。';
            }
            if (part.specialEffect === 'SUM_FIFTEEN_BONUS') {
                return '装填した数字の合計が10や15ちょうどだと追加出力を得ます。';
            }
            if (part.specialEffect === 'MULTIPLE_OF_THREE_BONUS') {
                return '3の倍数の数字を装填するほど追加出力を得ます。';
            }
            if (part.specialEffect === 'HAND_SIZE_BONUS') {
                return '手札が多いほど追加出力を得ます。';
            }
            if (part.specialEffect === 'TEMP_CARD_BONUS') {
                return '一時カードを多く持つほど追加出力を得ます。';
            }
            if (part.specialEffect === 'EDGE_BONUS') {
                return '盤面の端に配置されていると追加出力を得ます。';
            }
            if (part.specialEffect === 'CORNER_BONUS') {
                return '盤面の角に置くと強力な追加出力を得ます。';
            }
            if (part.specialEffect === 'ISOLATION_BONUS') {
                return '隣接するパーツがない孤立状態だと追加出力を得ます。';
            }
            if (part.specialEffect === 'ALT_COLOR_BONUS') {
                return '装填した色が交互に並ぶと追加出力を得ます。';
            }
            if (part.specialEffect === 'LAST_STREAK_BONUS') {
                return 'このパーツへの連続装填回数に応じて追加出力を得ます。';
            }

            switch(part.type) {
                case 'CANNON': return '出力は「攻撃力」になります。\n敵の耐久値を削り、HPにダメージを与えます。';
                case 'MISSILE': return '出力は「攻撃力」になります。\nキャノンと同様ですが、青/橙エネルギーを使う高火力なものが多いです。';
                case 'SHIELD': return '出力は「シールド」になります。\n敵の攻撃ダメージを軽減します。';
                case 'ENGINE': return '出力は「シールド」に変換され、さらに出力の50%分「燃料」を回復します。\n回避と防御を両立する重要パーツです。';
                case 'AMPLIFIER': return '隣接するパーツ(上下左右)の出力を強化します。\nこれ自体は攻撃や防御を行いません。';
                default: return '';
            }
        };

        return (
            <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setTooltipPart(null)}>
                <div className="bg-slate-800 border-2 border-white p-6 rounded-lg max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setTooltipPart(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X size={24}/></button>
                    
                    <div className="mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            tooltipPart.type === 'CANNON' ? 'bg-red-900 text-red-200' :
                            tooltipPart.type === 'MISSILE' ? 'bg-orange-900 text-orange-200' :
                            tooltipPart.type === 'SHIELD' ? 'bg-blue-900 text-blue-200' :
                            tooltipPart.type === 'ENGINE' ? 'bg-emerald-900 text-emerald-200' :
                            'bg-purple-900 text-purple-200'
                        }`}>
                            {tooltipPart.type} TYPE
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-2">{tooltipPart.name}</h3>
                    
                    <div className="text-sm text-gray-300 mb-4 min-h-[3em]">{tooltipPart.description || "詳細なし"}</div>
                    
                    <div className="bg-slate-700/50 p-2 rounded mb-4 text-xs text-white whitespace-pre-wrap border-l-2 border-yellow-500">
                        {getTypeDescription(tooltipPart)}
                    </div>

                    <div className="bg-black/40 p-2 rounded text-xs text-cyan-300 font-mono">
                        {tooltipPart.specialEffect === 'RANK_UP' ? (
                             <>
                                <div>生成ランク補正: +{tooltipPart.basePower}</div>
                                <div className="mt-2 text-gray-500">
                                    投入したカードを消費せず、<br/>ランクを上げて手札に加えます(一時的)。
                                </div>
                             </>
                        ) : tooltipPart.type !== 'AMPLIFIER' ? (
                            <>
                                <div>倍率: x{tooltipPart.multiplier}</div>
                                <div>起動ボーナス: +{tooltipPart.basePower}</div>
                                <div className="mt-2 text-gray-500">
                                    Output = (Energy * {tooltipPart.multiplier}) + {tooltipPart.basePower}(if full)
                                    {player.passivePower > 0 && <div className="text-purple-400">+ {player.passivePower} (Passive)</div>}
                                </div>
                            </>
                        ) : (
                            <>
                                <div>強化ボーナス: +{tooltipPart.basePower}</div>
                                <div className="mt-2 text-gray-500">
                                    隣接するパーツ(上下左右)の出力を加算します。<br/>
                                    ※エネルギー充填時のみ有効
                                </div>
                            </>
                        )}
                        {tooltipPart.specialEffect === 'HEAL' && <div className="text-green-400 mt-2 font-bold">HP自動回復機能付き</div>}
                        {tooltipPart.specialEffect === 'RECYCLE' && <div className="text-teal-400 mt-2 font-bold">エネルギー回収機能付き</div>}
                        {tooltipPart.specialEffect === 'THORNS' && <div className="text-red-400 mt-2 font-bold">反撃ダメージ (被弾時、防御出力の半分を敵に返す)</div>}
                        {tooltipPart.specialEffect === 'WHITE_BONUS' && <div className="text-slate-200 mt-2 font-bold">白エネルギー1個ごとに出力+2</div>}
                        {tooltipPart.specialEffect === 'MATCH_BONUS' && <div className="text-amber-300 mt-2 font-bold">同じ数字で全スロットを埋めると出力+4</div>}
                        {tooltipPart.specialEffect === 'LOW_SCORE_BOOST' && <div className="text-cyan-300 mt-2 font-bold">3以下の数字は、その値ぶん追加出力</div>}
                        {tooltipPart.specialEffect === 'RAINBOW_BONUS' && <div className="text-fuchsia-300 mt-2 font-bold">3色そろうと出力+6</div>}
                        {tooltipPart.specialEffect === 'SOLO_DOUBLE' && <div className="text-yellow-300 mt-2 font-bold">単独装填時、出力をもう一度加算</div>}
                        {tooltipPart.specialEffect === 'BLUE_BONUS' && <div className="text-blue-300 mt-2 font-bold">青エネルギー1個ごとに出力+2</div>}
                        {tooltipPart.specialEffect === 'ORANGE_BONUS' && <div className="text-orange-300 mt-2 font-bold">オレンジエネルギー1個ごとに出力+3</div>}
                        {tooltipPart.specialEffect === 'HIGH_SCORE_BOOST' && <div className="text-rose-300 mt-2 font-bold">6以上の数字1枚ごとに出力+3</div>}
                        {tooltipPart.specialEffect === 'EVEN_BONUS' && <div className="text-indigo-300 mt-2 font-bold">偶数で全埋めすると出力+5</div>}
                        {tooltipPart.specialEffect === 'ODD_BONUS' && <div className="text-pink-300 mt-2 font-bold">奇数で全埋めすると出力+5</div>}
                        {tooltipPart.specialEffect === 'SEQUENCE_BONUS' && <div className="text-lime-300 mt-2 font-bold">昇順/降順で全埋めすると出力+6</div>}
                        {tooltipPart.specialEffect === 'MONO_COLOR_BONUS' && <div className="text-violet-300 mt-2 font-bold">同色で全埋めすると出力+6</div>}
                        {tooltipPart.specialEffect === 'OVERCHARGE_HEAL' && <div className="text-green-300 mt-2 font-bold">合計12以上で出力+4、HP+3</div>}
                        {tooltipPart.specialEffect === 'OVERCHARGE_RECYCLE' && <div className="text-teal-300 mt-2 font-bold">合計12以上で出力+4、燃料+1</div>}
                        {tooltipPart.specialEffect === 'PRIME_BONUS' && <div className="text-sky-300 mt-2 font-bold">素数1つごとに出力+2、全素数でさらに+3</div>}
                        {tooltipPart.specialEffect === 'SQUARE_BONUS' && <div className="text-emerald-300 mt-2 font-bold">平方数1つごとに出力+3</div>}
                        {tooltipPart.specialEffect === 'GCD_BONUS' && <div className="text-cyan-300 mt-2 font-bold">最大公約数×2を追加出力</div>}
                        {tooltipPart.specialEffect === 'LCM_BONUS' && <div className="text-red-300 mt-2 font-bold">最小公倍数÷3を追加出力</div>}
                        {tooltipPart.specialEffect === 'FIBONACCI_BONUS' && <div className="text-amber-300 mt-2 font-bold">フィボナッチ数1つごとに出力+2、全一致でさらに+4</div>}
                        {tooltipPart.specialEffect === 'MEAN_BONUS' && <div className="text-blue-300 mt-2 font-bold">平均値ぶん追加出力</div>}
                        {tooltipPart.specialEffect === 'MEDIAN_BONUS' && <div className="text-indigo-300 mt-2 font-bold">中央値ぶん追加出力</div>}
                        {tooltipPart.specialEffect === 'SAME_TYPE_LINK' && <div className="text-violet-300 mt-2 font-bold">隣接する同タイプ1つごとに出力+2</div>}
                        {tooltipPart.specialEffect === 'ROW_UNITY' && <div className="text-fuchsia-300 mt-2 font-bold">同列3マス同タイプで出力+6</div>}
                        {tooltipPart.specialEffect === 'CENTER_COMMAND' && <div className="text-yellow-300 mt-2 font-bold">中央配置で常時出力+4</div>}
                        {tooltipPart.specialEffect === 'DIAGONAL_LINK' && <div className="text-rose-300 mt-2 font-bold">斜めのパーツ1つごとに出力+2</div>}
                        {tooltipPart.specialEffect === 'MIRROR_BONUS' && <div className="text-slate-200 mt-2 font-bold">左右対称に同タイプがあると出力+5</div>}
                        {tooltipPart.specialEffect === 'TURN_SCALE' && <div className="text-orange-300 mt-2 font-bold">現在ターン数ぶん追加出力（最大+10）</div>}
                        {tooltipPart.specialEffect === 'DAMAGE_MEMORY' && <div className="text-red-300 mt-2 font-bold">この戦闘で受けたダメージ量を追加出力化（最大+10）</div>}
                        {tooltipPart.specialEffect === 'EFFORT_STACK' && <div className="text-green-300 mt-2 font-bold">この戦闘での装填回数ぶん追加出力（最大+10）</div>}
                        {tooltipPart.specialEffect === 'UNIQUE_VALUE_RECORD' && <div className="text-teal-300 mt-2 font-bold">見た数字の種類数ぶん追加出力（最大+9）</div>}
                        {tooltipPart.specialEffect === 'RANDOM_SPIKE' && <div className="text-pink-300 mt-2 font-bold">ランダムで出力+4 か +10</div>}
                        {tooltipPart.specialEffect === 'FORECAST_COLOR' && <div className="text-cyan-300 mt-2 font-bold">予報色1つごとに出力+3</div>}
                        {tooltipPart.specialEffect === 'NO_CONSUME_CHANCE' && <div className="text-lime-300 mt-2 font-bold">約35%でカードを消費しない</div>}
                        {tooltipPart.specialEffect === 'PALINDROME_BONUS' && <div className="text-purple-300 mt-2 font-bold">左右対称の数字並びで出力+7</div>}
                        {tooltipPart.specialEffect === 'SUM_FIFTEEN_BONUS' && <div className="text-amber-300 mt-2 font-bold">合計15で出力+8、合計10で出力+4</div>}
                        {tooltipPart.specialEffect === 'MULTIPLE_OF_THREE_BONUS' && <div className="text-orange-300 mt-2 font-bold">3の倍数1つごとに出力+3</div>}
                        {tooltipPart.specialEffect === 'HAND_SIZE_BONUS' && <div className="text-blue-300 mt-2 font-bold">手札枚数ぶん追加出力（最大+8）</div>}
                        {tooltipPart.specialEffect === 'TEMP_CARD_BONUS' && <div className="text-fuchsia-300 mt-2 font-bold">一時カード1枚ごとに出力+3</div>}
                        {tooltipPart.specialEffect === 'EDGE_BONUS' && <div className="text-slate-200 mt-2 font-bold">端配置で出力+4</div>}
                        {tooltipPart.specialEffect === 'CORNER_BONUS' && <div className="text-yellow-300 mt-2 font-bold">角配置で出力+6</div>}
                        {tooltipPart.specialEffect === 'ISOLATION_BONUS' && <div className="text-emerald-300 mt-2 font-bold">孤立配置で出力+5</div>}
                        {tooltipPart.specialEffect === 'ALT_COLOR_BONUS' && <div className="text-cyan-300 mt-2 font-bold">色が交互に並ぶと出力+6</div>}
                        {tooltipPart.specialEffect === 'LAST_STREAK_BONUS' && <div className="text-red-300 mt-2 font-bold">連続装填回数ぶん追加出力（最大+8）</div>}
                    </div>
                </div>
            </div>
        );
    };

    const renderGridRow = (rowIndex: number) => {
        const pRelIdx = rowIndex - player.yOffset;
        const inShip = pRelIdx >= 0 && pRelIdx < SHIP_HEIGHT;
        const partsToRender = inShip ? player.parts.slice(pRelIdx * 3, pRelIdx * 3 + 3) : [];
        const eRelIdx = rowIndex - enemy.yOffset;
        
        // Enemy is also 3x3 now
        const eInShip = eRelIdx >= 0 && eRelIdx < SHIP_HEIGHT;
        const ePartsToRender = eInShip ? enemy.parts.slice(eRelIdx * 3, eRelIdx * 3 + 3) : [];

        const intent = enemyIntents.find(i => (i.row + enemy.yOffset) === rowIndex);
        
        let prediction = null;
        let pPower = 0;
        
        const buffGrid = calculateBuffGrid(player.parts, { hand, turn, battleStats, fuel: player.fuel });
        const enemyBuffGrid = calculateBuffGrid(enemy.parts, { turn, fuel: enemy.fuel }); // Calculate enemy buffs

        partsToRender.forEach((p, colIdx) => {
             const { energySum, output: baseOutput } = calculatePartOutput(p, {
                 row: pRelIdx,
                 col: colIdx,
                 parts: player.parts,
                 hand,
                 turn,
                 battleStats,
                 fuel: player.fuel,
             });
             if (energySum > 0 && (p.type === 'CANNON' || p.type === 'MISSILE')) {
                 let output = baseOutput;
                 output += player.passivePower; 
                 output += buffGrid[pRelIdx][colIdx];
                 pPower += output;
             }
        });

        let ePower = 0;
        if (intent && intent.type === 'ATTACK' && !enemy.isStunned) ePower = intent.value;
        
        if (pPower > 0 || ePower > 0) {
            if (pPower > ePower) {
                prediction = <div className="text-cyan-400 font-bold flex items-center animate-pulse"><span className="text-xl">{pPower - ePower}</span> <ChevronsRight size={24}/></div>;
            } else if (ePower > pPower) {
                prediction = <div className="text-red-500 font-bold flex items-center animate-pulse"><ChevronsLeft size={24}/> <span className="text-xl">{ePower - pPower}</span></div>;
            } else {
                prediction = <div className="text-gray-400 font-bold text-xl">X</div>;
            }
        }

        // Calculate Ascension Bonus
        let ascensionBonus = 0;
        if (selectedMissionLevel >= 1) ascensionBonus += 1;
        if (selectedMissionLevel >= 6) ascensionBonus += 1;

        return (
            <div key={rowIndex} className="flex items-center h-20 md:h-24 border-b border-white/10 relative">
                <div className="w-1/2 flex justify-end pr-2 border-r border-dashed border-white/20 relative">
                    {inShip ? (
                        <div className="flex gap-1 w-full justify-end">
                            {partsToRender.map((part, i) => (
                                <div key={part.id} className="w-1/3 max-w-[80px]">
                                    <ShipPartView 
                                        part={part} 
                                        onClick={() => handlePartClick((pRelIdx * 3) + i)} 
                                        onLongPress={(p) => setTooltipPart(p)}
                                        highlight={!!selectedCardId}
                                        pendingReplace={!!pendingPart}
                                        evalContext={{ row: pRelIdx, col: i, parts: player.parts, hand, turn, battleStats, fuel: player.fuel }}
                                        bonusPower={buffGrid[pRelIdx][i] + player.passivePower} // Include passive power for player too
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full h-full opacity-10 bg-grid-pattern"></div>
                    )}
                </div>
                <div className="w-16 md:w-24 relative flex items-center justify-center shrink-0">
                    {prediction ? prediction : (enemy.isStunned && eInShip ? <div className="text-yellow-500 font-bold text-xs">STUNNED</div> : null)}
                </div>
                <div className="w-1/2 pl-2 border-l border-dashed border-white/20">
                    {eInShip ? (
                        <div className="flex gap-1 w-full justify-start">
                            {ePartsToRender.map((part, i) => {
                                // Only apply ascension bonus to offensive parts
                                const isOffensive = part.type === 'CANNON' || part.type === 'MISSILE';
                                const totalBonus = enemyBuffGrid[eRelIdx][i] + (isOffensive ? ascensionBonus : 0);
                                
                                return (
                                    <div key={part.id} className="w-1/3 max-w-[80px] opacity-90">
                                        <ShipPartView 
                                            part={part} 
                                            isEnemy={true}
                                            showPower={true} 
                                            evalContext={{ row: eRelIdx, col: i, parts: enemy.parts, turn, fuel: enemy.fuel }}
                                            bonusPower={totalBonus}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="w-full h-full opacity-10 bg-grid-pattern"></div>
                    )}
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---
    
    if (phase === 'SETUP') {
        const unlockedShips = SHIPS.filter(s => progress.rank >= s.unlockRank);

        return (
            <div className="w-full h-full bg-slate-900 text-white p-4 flex flex-col font-mono overflow-y-auto">
                <div className="flex items-center mb-6">
                     <button onClick={onBack} className="text-gray-400 hover:text-white mr-4"><ArrowLeft/></button>
                     <h2 className="text-2xl font-bold text-cyan-400">MISSION BRIEFING</h2>
                     <div className="ml-auto text-sm bg-indigo-900 px-3 py-1 rounded-full border border-indigo-500 flex items-center">
                         <Star size={14} className="mr-1 text-yellow-400"/> ランク: {progress.rank}
                     </div>
                </div>

                <div className="flex justify-center mb-8 gap-4 border-b border-gray-700 pb-2">
                     <button onClick={() => setSetupStep('SHIP')} className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${setupStep==='SHIP'?'bg-cyan-700 text-white':'bg-slate-800 text-gray-500'}`}>機体</button>
                     <button onClick={() => setSetupStep('PILOT')} className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${setupStep==='PILOT'?'bg-cyan-700 text-white':'bg-slate-800 text-gray-500'}`}>パイロット</button>
                     <button onClick={() => setSetupStep('MISSION')} className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${setupStep==='MISSION'?'bg-cyan-700 text-white':'bg-slate-800 text-gray-500'}`}>任務</button>
                </div>

                <div className="flex-1 max-w-4xl mx-auto w-full">
                    {setupStep === 'SHIP' && (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {SHIPS.map(ship => {
                                 const isUnlocked = progress.rank >= ship.unlockRank;
                                 return (
                                     <div 
                                        key={ship.id} 
                                        onClick={() => isUnlocked && setSelectedShipId(ship.id)}
                                        className={`border-2 p-6 rounded-xl flex flex-col items-center cursor-pointer transition-all relative overflow-hidden ${selectedShipId === ship.id ? 'border-cyan-400 bg-slate-800 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-slate-600 bg-slate-900 hover:bg-slate-800'} ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}
                                     >
                                         <div className={`w-full h-32 ${ship.color} mb-4 rounded-lg flex items-center justify-center relative`}>
                                             <Send size={48} className="text-white"/>
                                             {!isUnlocked && <Lock size={32} className="absolute text-gray-300"/>}
                                         </div>
                                         <h3 className="text-xl font-bold mb-2">{ship.name}</h3>
                                         <p className="text-sm text-gray-400 text-center mb-4 min-h-[3em]">{ship.description}</p>
                                         {!isUnlocked ? (
                                             <div className="text-red-400 text-xs font-bold">ランク {ship.unlockRank} で解放</div>
                                         ) : (
                                             <div className="text-green-400 text-xs font-bold">選択可能</div>
                                         )}
                                     </div>
                                 )
                             })}
                             <div className="col-span-full text-center mt-4">
                                <button onClick={() => setSetupStep('PILOT')} className="bg-cyan-600 hover:bg-cyan-500 px-12 py-3 rounded-full font-bold text-lg shadow-lg animate-pulse">次へ</button>
                             </div>
                         </div>
                    )}

                    {setupStep === 'PILOT' && (
                        <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
                            <div className="flex justify-between w-full mb-4 px-4 bg-slate-800 p-2 rounded">
                                <span className="text-sm text-gray-400">現在のリロール回数</span>
                                <span className="font-bold text-yellow-400 flex items-center"><RefreshCw size={14} className="mr-1"/> {progress.rerollCount}</span>
                            </div>



                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-6">
                                {pilotOptions.map((pilot, i) => (
                                    <div 
                                        key={i}
                                        className={`relative border-2 p-4 rounded-xl cursor-pointer transition-all flex flex-col h-full ${selectedPilotIndex === i ? 'border-yellow-400 bg-slate-800 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-105' : 'border-slate-600 bg-slate-900 hover:border-slate-400'}`}
                                        onClick={() => setSelectedPilotIndex(i)}
                                    >
                                        <div className="absolute top-2 right-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setPinnedPilotIndex(pinnedPilotIndex === i ? null : i); }}
                                                className={`p-1.5 rounded-full ${pinnedPilotIndex === i ? 'bg-yellow-500 text-black shadow-lg' : 'bg-slate-700 text-gray-400 hover:text-white hover:bg-slate-600'}`}
                                                title="固定する"
                                            >
                                                <User size={14}/>
                                            </button>
                                        </div>

                                        <div className="flex flex-col items-center mb-4">
                                            <div className="w-16 h-16 mb-2">
                                                 <PixelSprite seed={pilot.id} name={pilot.spriteName} className="w-full h-full"/>
                                            </div>
                                            <div className="font-bold text-lg">{pilot.name}</div>
                                        </div>
                                        
                                        <div className="text-sm bg-slate-800 border border-yellow-500/30 p-3 rounded mt-auto w-full">
                                            <div className="font-bold text-yellow-400 mb-1 flex items-center"><Zap size={14} className="mr-1"/> {pilot.intrinsicTalent.name}</div>
                                            <div className="text-gray-300 leading-relaxed font-bold">{pilot.intrinsicTalent.description}</div>
                                        </div>
                                        
                                        {pilot.randomTalents && pilot.randomTalents.length > 0 && (
                                            <div className="text-xs bg-indigo-900/40 p-2 rounded mt-2 w-full">
                                                <div className="font-bold text-indigo-300 mb-1 flex items-center"><Star size={12} className="mr-1"/> ランダム特性</div>
                                                {pilot.randomTalents.map((t, idx) => (
                                                    <div key={idx} className="mb-1 last:mb-0">
                                                        <span className="text-white font-bold">{t.name}</span>: <span className="text-gray-400">{t.description}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Stat Preview */}
                            <div className="w-full bg-slate-800/80 border border-cyan-500/30 p-4 rounded-xl mb-6">
                                <div className="text-cyan-400 font-bold mb-2 flex items-center justify-center"><Activity size={16} className="mr-2"/> 機体スペック予想 ({SHIPS.find(s => s.id === selectedShipId)?.name || '未選択'})</div>
                                <div className="flex justify-center gap-8">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">最大HP</div>
                                        <div className="text-xl font-bold text-green-400">
                                            {(SHIPS.find(s => s.id === selectedShipId)?.baseHp || 0) + 
                                             (selectedPilotIndex !== -1 ? [pilotOptions[selectedPilotIndex].intrinsicTalent, ...(pilotOptions[selectedPilotIndex].randomTalents || [])].filter(t => t.effectType === 'MAX_HP').reduce((a, b) => a + (b.value || 0), 0) : 0)}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">最大燃料</div>
                                        <div className="text-xl font-bold text-orange-400">
                                            {MAX_FUEL + 
                                             (selectedPilotIndex !== -1 ? [pilotOptions[selectedPilotIndex].intrinsicTalent, ...(pilotOptions[selectedPilotIndex].randomTalents || [])].filter(t => t.effectType === 'FUEL').reduce((a, b) => a + (b.value || 0), 0) : 0)}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">パッシブ出力</div>
                                        <div className="text-xl font-bold text-yellow-400">
                                            +{(selectedPilotIndex !== -1 ? [pilotOptions[selectedPilotIndex].intrinsicTalent, ...(pilotOptions[selectedPilotIndex].randomTalents || [])].filter(t => t.effectType === 'PASSIVE_POWER').reduce((a, b) => a + (b.value || 0), 0) : 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={handleRerollPilots} 
                                    disabled={progress.rerollCount <= 0}
                                    className={`bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold flex items-center ${progress.rerollCount <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <RefreshCw className="mr-2"/> 呼び直す
                                </button>
                                <button 
                                    onClick={() => setSetupStep('MISSION')} 
                                    disabled={selectedPilotIndex === -1}
                                    className={`bg-cyan-600 hover:bg-cyan-500 px-12 py-3 rounded-lg font-bold text-lg shadow-lg ${selectedPilotIndex === -1 ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'}`}
                                >
                                    次へ
                                </button>
                            </div>
                        </div>
                    )}

                    {setupStep === 'MISSION' && (
                        <div className="flex flex-col items-center max-w-lg mx-auto">
                            <div className="w-full bg-slate-800 p-6 rounded-xl border border-slate-600 text-center mb-8">
                                <h3 className="text-xl font-bold text-red-400 mb-2">難易度設定</h3>
                                <div className="flex items-center justify-center gap-6 my-6">
                                    <button 
                                        onClick={() => setSelectedMissionLevel(l => Math.max(0, l - 1))}
                                        className="bg-slate-700 p-3 rounded-full hover:bg-slate-600"
                                    >
                                        <ChevronsLeft/>
                                    </button>
                                    <div className="text-6xl font-black text-white w-20">{selectedMissionLevel}</div>
                                    <button 
                                        onClick={() => {
                                            const shipMax = progress.maxClearedLevel[selectedShipId] ?? -1;
                                            // Can select up to Max Cleared + 1
                                            if (selectedMissionLevel <= shipMax) {
                                                setSelectedMissionLevel(l => Math.min(9, l + 1));
                                            } else {
                                                audioService.playSound('wrong');
                                            }
                                        }}
                                        className={`bg-slate-700 p-3 rounded-full hover:bg-slate-600 ${(selectedMissionLevel > (progress.maxClearedLevel[selectedShipId] ?? -1)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <ChevronsRight/>
                                    </button>
                                </div>
                                <div className="text-sm text-gray-400 mb-4">
                                    {(progress.maxClearedLevel[selectedShipId] ?? -1) < selectedMissionLevel ? (
                                        <div className="flex flex-col items-center">
                                            <span className="text-red-500 font-bold mb-1">未クリア (挑戦中)</span>
                                            {selectedMissionLevel === (progress.maxClearedLevel[selectedShipId] ?? -1) + 1 && (
                                                <span className="text-xs text-yellow-400 animate-pulse">
                                                    このランクをクリアすると Lv{selectedMissionLevel + 1} が解放されます！
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-green-500 font-bold">クリア済み</span>
                                    )}
                                </div>
                                
                                <div className="bg-black/40 p-4 rounded text-left text-sm space-y-2">
                                    <div className="flex justify-between"><span className="text-gray-400">敵攻撃力:</span> <span className="text-red-400">+{selectedMissionLevel >= 1 ? (selectedMissionLevel >= 6 ? '2' : '1') : '0'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400">開始HP:</span> <span className="text-red-400">{selectedMissionLevel >= 2 ? (selectedMissionLevel >= 4 ? '-20%' : '-5') : '通常'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400">敵耐久:</span> <span className="text-red-400">+{selectedMissionLevel >= 5 ? '強化' : '通常'}</span></div>
                                    <div className="border-t border-gray-600 pt-2 flex justify-between font-bold"><span className="text-yellow-400">クリア報酬:</span> <span className="text-white">リロール +{selectedMissionLevel >= 5 ? '2' : (selectedMissionLevel >= 1 ? '1' : '0')}</span></div>
                                </div>
                            </div>
                            
                            <button onClick={confirmSetup} className="bg-red-600 hover:bg-red-500 text-white w-full py-4 rounded-xl font-bold text-2xl shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse flex items-center justify-center">
                                <Target className="mr-2"/> 出撃開始
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (phase === 'TUTORIAL') {
        return (
            <div className="w-full h-full bg-slate-900 text-white p-8 flex flex-col items-center justify-center font-mono">
                <Send size={64} className="text-cyan-400 mb-4 animate-bounce"/>
                <h1 className="text-4xl font-bold mb-4">紙飛行機バトル v3.0</h1>
                <div className="max-w-md text-sm text-gray-300 space-y-2 mb-8 bg-slate-800 p-4 rounded border border-slate-600">
                    <p>・機体は3x3のモジュールで構成されています。</p>
                    <p>・エネルギーの色には相性があります。</p>
                    <p className="text-yellow-400 font-bold">・オレンジ &gt; 青 &gt; 白 (白スロットには何色でもOK！)</p>
                    <p>・エネルギーを入れるだけで出力が出ます。</p>
                    <p>・全スロットを埋めると起動ボーナスが加算されます！</p>
                    <p className="text-purple-400 font-bold">・パイロットの才能で戦略が変わる！</p>
                    <p>・モジュール長押しで詳細を確認できます。</p>
                    <p className="text-green-400 font-bold">・戦闘後は「休暇」で機体を強化しよう！</p>
                    <p className="text-blue-400 font-bold mt-2">※オートセーブ機能搭載！</p>
                </div>
                <button onClick={() => { setPhase('SETUP'); initPilotRoll(); }} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded shadow-lg animate-pulse flex items-center">
                    <Play className="mr-2"/> 出撃準備
                </button>
                <button onClick={onBack} className="mt-4 text-gray-500 hover:text-white underline text-xs">戻る</button>
            </div>
        );
    }

    if (phase === 'REWARD_SELECT') {
         const rerollCost = Math.max(0, 50 - player.talents.filter(t => t.effectType === 'DISCOUNT_REROLL_REWARD').reduce((a,b)=>a+b.value, 0));
         return (
             <div className="w-full h-full bg-black/90 text-white p-4 flex flex-col items-center justify-start md:justify-center font-mono z-50 relative overflow-y-auto py-8">
                 <RenderTooltip />
                 <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce"/>
                 <h2 className="text-4xl font-bold mb-4 text-white">VICTORY!</h2>
                 <div className="text-yellow-300 text-2xl font-bold mb-4 flex items-center bg-black/50 px-6 py-2 rounded-full border border-yellow-500">
                     <Star size={24} className="mr-2 fill-current"/> +{earnedCoins}
                 </div>
                 
                 <div className="flex gap-4 mb-8">
                     <button 
                        onClick={handleRerollRewards} 
                        disabled={player.starCoins < rerollCost} 
                        className={`bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold flex items-center transition-colors border border-indigo-400 ${player.starCoins < rerollCost ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                         <RefreshCw className="mr-2" size={16}/> リロール ({rerollCost} Coin)
                     </button>
                 </div>
                 
                 <p className="text-gray-300 mb-4">戦利品を選択してください (長押しで詳細)</p>
                 
                 <div className="flex flex-wrap gap-4 md:gap-8 justify-center mb-8 shrink-0">
                     {rewardOptions.map((part, i) => (
                         <div 
                            key={i} 
                            onClick={() => handleRewardSelect(part)}
                            className="bg-slate-800 border-2 border-cyan-500 p-4 rounded-xl w-32 md:w-48 flex flex-col items-center cursor-pointer hover:scale-105 hover:bg-slate-700 transition-all shadow-lg group"
                         >
                             <div className="w-16 h-16 mb-2">
                                 <ShipPartView part={part} onLongPress={(p) => setTooltipPart(p)} />
                             </div>
                             <div className="font-bold text-cyan-300 mb-1 text-sm md:text-base">{part.name}</div>
                             <div className="text-[10px] text-gray-400 text-center h-10 overflow-hidden leading-tight">{part.description}</div>
                             <button className="mt-2 bg-cyan-600 px-4 py-1 rounded text-xs font-bold group-hover:bg-cyan-500">獲得</button>
                         </div>
                     ))}
                 </div>
             </div>
         );
    }

    if (phase === 'REWARD_EQUIP') {
         const buffGrid = calculateBuffGrid(player.parts);

         return (
             <div className="w-full h-full bg-slate-900 text-white p-4 font-mono flex flex-col items-center relative overflow-y-auto">
                 <RenderTooltip />
                 <div className="text-center mb-6 mt-4">
                     <h2 className="text-2xl font-bold text-green-400 mb-2">パーツ換装</h2>
                     <p className="text-sm text-gray-300">新しいパーツをセットする場所を選んでください (長押しで詳細)</p>
                 </div>

                 {pendingPart && (
                     <div className="flex items-center gap-4 mb-8 bg-slate-800 p-3 rounded-lg border border-slate-600">
                         <div className="text-xs text-gray-400">NEW:</div>
                         <div className="w-16 h-16 md:w-20 md:h-20">
                             <ShipPartView part={pendingPart} onLongPress={(p) => setTooltipPart(p)} />
                         </div>
                         <div className="text-left">
                             <div className="font-bold text-white">{pendingPart.name}</div>
                             <div className="text-xs text-gray-400">{pendingPart.description}</div>
                         </div>
                     </div>
                 )}

                 <div className="bg-black/40 p-4 rounded-xl border-2 border-slate-700 mb-8 shrink-0">
                     <div className="grid grid-cols-3 gap-2">
                         {player.parts.map((p, i) => {
                             const r = Math.floor(i / SHIP_WIDTH);
                             const c = i % SHIP_WIDTH;
                             return (
                                 <div key={i} className="w-16 h-16 md:w-20 md:h-20" onClick={() => handlePartEquip(i)}>
                                     <ShipPartView 
                                         part={p} 
                                         pendingReplace={true} 
                                         onLongPress={(p) => setTooltipPart(p)} 
                                         bonusPower={buffGrid[r][c] + player.passivePower} 
                                     />
                                 </div>
                             );
                         })}
                     </div>
                 </div>

                 <div className="flex gap-4 shrink-0 pb-8">
                     <button onClick={handleStorePart} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center">
                         <Archive size={20} className="mr-2"/> 格納庫に保管
                     </button>
                     <button onClick={handleDiscardReward} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center">
                         <Trash2 size={20} className="mr-2"/> 破棄して進む
                     </button>
                 </div>
             </div>
         );
    }

    if (phase === 'HANGAR') {
        const buffGrid = calculateBuffGrid(player.parts);

        return (
            <div className="w-full h-full bg-slate-900 text-white p-4 font-mono flex flex-col items-center relative overflow-hidden">
                <RenderTooltip />
                <div className="text-center mb-4 mt-2 shrink-0">
                    <h2 className="text-2xl font-bold text-orange-400 mb-2 flex items-center justify-center"><Settings className="mr-2"/> 機体改造 (Hangar)</h2>
                    <p className="text-sm text-gray-300">船と格納庫のパーツを入れ替えます</p>
                </div>

                <div className="flex-grow flex flex-col md:flex-row gap-4 md:gap-8 w-full max-w-5xl overflow-hidden min-h-0">
                    {/* Ship Grid */}
                    <div className="flex-shrink-0 md:flex-1 flex flex-col items-center bg-black/40 p-2 md:p-4 rounded-xl border-2 border-slate-700 overflow-y-auto md:overflow-visible">
                        <div className="text-cyan-300 font-bold mb-4 flex items-center"><Send className="mr-2"/> SHIP</div>
                        <div className="grid grid-cols-3 gap-2 md:gap-3">
                            {player.parts.map((p, i) => {
                                const r = Math.floor(i / SHIP_WIDTH);
                                const c = i % SHIP_WIDTH;
                                return (
                                    <div key={i} className="w-16 h-16 md:w-24 md:h-24 relative">
                                        <ShipPartView 
                                            part={p} 
                                            onClick={() => handleHangarAction('SHIP', i)} 
                                            onLongPress={(p) => setTooltipPart(p)}
                                            highlight={hangarSelection?.loc === 'SHIP' && hangarSelection.idx === i}
                                            bonusPower={buffGrid[r][c] + player.passivePower}
                                        />
                                        {hangarSelection?.loc === 'SHIP' && hangarSelection.idx === i && (
                                            <div className="absolute inset-0 border-4 border-yellow-400 animate-pulse pointer-events-none rounded"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {hangarSelection?.loc === 'SHIP' && player.parts[hangarSelection.idx].type !== 'EMPTY' && (
                             <button onClick={handleUnequip} className="mt-6 bg-red-800 hover:bg-red-700 text-white px-6 py-2 rounded font-bold text-sm border border-red-500 flex items-center">
                                 <Download className="mr-2" size={16}/> 外す (Unequip)
                             </button>
                        )}
                    </div>

                    {/* Inventory */}
                    <div className="flex-1 flex flex-col items-center bg-black/40 p-2 md:p-4 rounded-xl border-2 border-slate-700 overflow-y-auto custom-scrollbar min-h-0">
                        <div className="text-orange-300 font-bold mb-4 flex items-center"><Archive className="mr-2"/> INVENTORY</div>
                        {player.partInventory.length === 0 ? (
                            <div className="text-gray-500 italic mt-8">Empty</div>
                        ) : (
                            <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                                {player.partInventory.map((p, i) => (
                                    <div key={i} className="w-16 h-16 md:w-24 md:h-24 relative">
                                        <ShipPartView 
                                            part={p} 
                                            onClick={() => handleHangarAction('INV', i)} 
                                            onLongPress={(p) => setTooltipPart(p)}
                                            highlight={hangarSelection?.loc === 'INV' && hangarSelection.idx === i}
                                        />
                                        {hangarSelection?.loc === 'INV' && hangarSelection.idx === i && (
                                            <div className="absolute inset-0 border-4 border-yellow-400 animate-pulse pointer-events-none rounded"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button onClick={() => { setPhase('VACATION'); setHangarSelection(null); }} className="bg-gray-600 hover:bg-gray-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center mt-4 shrink-0">
                    <ArrowLeft size={20} className="mr-2"/> 休暇に戻る
                </button>
            </div>
        );
    }

    if (phase === 'VACATION') {
        const buffGrid = calculateBuffGrid(player.parts);

        return (
            <div className="w-full h-full bg-slate-900 text-white p-2 md:p-4 font-mono relative overflow-hidden flex flex-col">
                <RenderTooltip />
                {/* Pool Overlay */}
                {showPool && <PoolView pool={pool} onClose={() => setShowPool(false)} />}
                
                <div className="flex justify-between items-center mb-2 bg-slate-800 p-3 rounded-lg shadow-lg shrink-0">
                    <h2 className="text-lg md:text-2xl font-bold flex items-center text-cyan-300"><Calendar className="mr-2" size={20}/> <span className="hidden md:inline">休暇モード</span><span className="md:hidden">休暇</span></h2>
                    <div className="flex gap-2 md:gap-4 text-sm">
                        <button onClick={() => setShowPool(true)} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-xs border border-indigo-400 transition-colors shadow-sm font-bold">
                            <Layers size={14} /> <span className="hidden md:inline">POOL</span>
                        </button>
                        <div className="flex items-center text-yellow-400 font-bold"><Star className="mr-1" size={16}/> {player.starCoins}</div>
                        <div className="flex items-center text-orange-400 font-bold bg-black/40 px-2 py-0.5 rounded border border-orange-500/50">残{player.vacationDays}日</div>
                    </div>
                </div>

                {/* Status Strip */}
                <div className="bg-black/40 p-2 rounded-lg border border-slate-700 text-xs md:text-sm flex justify-around mb-2 shrink-0 shadow-inner">
                    <div className="flex items-center gap-1"><span>HP:</span> <span className="text-green-400 font-bold">{player.hp}/{player.maxHp}</span></div>
                    <div className="flex items-center gap-1"><span>燃料:</span> <span className="text-orange-400 font-bold">{player.fuel}/{player.maxFuel}</span></div>
                    <div className="flex items-center gap-1"><span>Pwr:</span> <span className="text-purple-400 font-bold">+{player.passivePower}</span></div>
                </div>

                <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
                    {/* Event Selection Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-black/20 rounded-lg p-2 border border-slate-800/50">
                        {pendingPart ? (
                            <div className="bg-slate-800 border-2 border-green-500 p-4 rounded-lg animate-in zoom-in flex flex-col items-center justify-center min-h-full">
                                <div className="text-center font-bold text-green-400 mb-2 text-lg">NEW PARTS!</div>
                                <div className="w-24 h-24 mb-4">
                                    <ShipPartView part={pendingPart} onLongPress={(p) => setTooltipPart(p)} />
                                </div>
                                <div className="text-sm text-center mb-4">入れ替えるスロットを選択してください</div>
                                
                                <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-black/50 rounded border border-slate-600">
                                    {player.parts.map((p, i) => {
                                        const r = Math.floor(i / SHIP_WIDTH);
                                        const c = i % SHIP_WIDTH;
                                        return (
                                            <div key={i} className="w-16 h-16 md:w-20 md:h-20" onClick={() => handlePartEquip(i)}>
                                                <ShipPartView part={p} pendingReplace={true} onLongPress={(p) => setTooltipPart(p)} bonusPower={buffGrid[r][c] + player.passivePower}/>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="flex gap-4">
                                    <button onClick={handleStorePart} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center">
                                        <Archive size={20} className="mr-2"/> 保管
                                    </button>
                                    <button onClick={() => setPendingPart(null)} className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-500 font-bold flex items-center justify-center shadow-lg">
                                        <Trash2 size={20} className="mr-2"/> 破棄
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-20">
                                {vacationEvents.map(event => (
                                    <button 
                                        key={event.id}
                                        onClick={() => executeVacationEvent(event)}
                                        disabled={player.vacationDays < event.cost || (event.coinCost ? player.starCoins < event.coinCost : false)}
                                        className={`
                                            bg-slate-800 border-2 rounded-xl p-3 flex flex-col items-center text-center relative group transition-all min-h-[120px] justify-between
                                            ${(player.vacationDays < event.cost || (event.coinCost ? player.starCoins < event.coinCost : false)) ? 'border-gray-700 opacity-50 cursor-not-allowed' : 'border-slate-600 hover:border-cyan-400 hover:bg-slate-700 hover:-translate-y-1 shadow-lg'}
                                        `}
                                    >
                                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                            {event.cost > 0 && (
                                                <div className="text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded text-orange-300 border border-orange-500/30">
                                                    {event.cost}日
                                                </div>
                                            )}
                                            {event.coinCost && event.coinCost > 0 && (
                                                <div className="text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                                                    <Star size={8} fill="currentColor"/> {event.coinCost}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 mb-2 p-2 bg-black/30 rounded-full border border-slate-600">
                                            {event.type === 'REPAIR' && <Hammer size={20} className="text-green-400"/>}
                                            {event.type === 'FUEL' && <Fuel size={20} className="text-orange-400"/>}
                                            {event.type === 'ENERGY' && <Zap size={20} className="text-yellow-400"/>}
                                            {event.type === 'PARTS' && <Box size={20} className="text-cyan-400"/>}
                                            {event.type === 'COIN' && <Star size={20} className="text-yellow-200"/>}
                                            {event.type === 'TREASURE' && <Gift size={20} className="text-purple-400"/>}
                                            {event.type === 'UNKNOWN' && <HelpCircle size={20} className="text-gray-400"/>}
                                            {event.type === 'ENHANCE' && <RefreshCw size={20} className="text-pink-400"/>}
                                            {event.type === 'SHOP' && <ShoppingBag size={20} className="text-blue-400"/>}
                                            {event.type === 'MODIFY' && <Palette size={20} className="text-indigo-400"/>}
                                            {event.type === 'TRAINING' && <Activity size={20} className="text-red-400"/>}
                                            {event.type === 'SACRIFICE' && <Skull size={20} className="text-red-600"/>}
                                            {event.type === 'GAMBLE' && <Dice5 size={20} className="text-violet-400"/>}
                                        </div>
                                        <div className="w-full">
                                            <div className="font-bold text-sm mb-1 truncate text-cyan-100">{event.name}</div>
                                            <div className="text-[10px] text-gray-400 leading-tight line-clamp-2 min-h-[2.5em]">{event.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom Controls */}
                    <div className="md:w-80 flex flex-col gap-2 shrink-0">
                        <button 
                            onClick={() => { setPhase('HANGAR'); setHangarSelection(null); }} 
                            disabled={!!pendingPart}
                            className={`w-full py-3 rounded-lg font-bold text-md shadow-lg flex items-center justify-center border-2 border-orange-700/50 ${!!pendingPart ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-orange-300'}`}
                        >
                            <Settings className="mr-2" size={18}/> 機体改造 (Hangar)
                        </button>

                        <div className="bg-slate-900 border border-slate-700 p-2 rounded h-20 md:h-24 overflow-y-auto text-xs text-cyan-200 font-mono custom-scrollbar shadow-inner">
                            {vacationLog}
                        </div>

                        <button onClick={endVacation} disabled={!!pendingPart} className={`w-full py-3 md:py-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center border-b-4 border-black/20 active:border-0 active:translate-y-1 transition-all ${!!pendingPart ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white animate-pulse'}`}>
                            出発する <ArrowRight className="ml-2"/>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-[#101018] text-white flex flex-col font-mono relative overflow-hidden">
            <RenderTooltip />
            {/* Pool Overlay */}
            {showPool && <PoolView pool={pool} onClose={() => setShowPool(false)} />}
            
            {/* Game Help Modal */}
            {showGameHelp && (
                 <div className="absolute inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setShowGameHelp(false)}>
                    <div className="bg-slate-800 border-2 border-yellow-500 p-6 rounded-lg max-w-lg w-full shadow-2xl relative text-sm max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowGameHelp(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                        <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center"><HelpCircle className="mr-2"/> ゲームマニュアル</h2>
                        
                        <div className="space-y-6 text-gray-300">
                            <section>
                                <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-600 pb-1 flex items-center"><Settings className="mr-2 text-cyan-400"/> 機体構築</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>機体は<strong>3x3</strong>のグリッドで構成されます。</li>
                                    <li>パーツには<strong>スロット</strong>があり、手札のエネルギーカードをはめることで起動します。</li>
                                    <li><strong>色相性:</strong> <span className="text-orange-400 font-bold">橙</span> &gt; <span className="text-blue-400 font-bold">青</span> &gt; <span className="text-slate-200 font-bold">白</span>。上位の色は下位のスロットにも使えます。</li>
                                    <li>スロットを全て埋めると<strong>起動ボーナス</strong>が発生します。</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-600 pb-1 flex items-center"><Swords className="mr-2 text-red-400"/> 戦闘システム</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>クラッシュバトル:</strong> 自機と敵機の同じ行(Row)同士がぶつかり合います。</li>
                                    <li>出力の高い方が、差分をダメージとして相手に与えます。</li>
                                    <li><strong>FIREボタン:</strong> 攻撃を実行し、ターンを進めます。</li>
                                    <li><strong>移動:</strong> 上下に移動して敵の攻撃を避けたり、有利な位置を取りましょう（燃料消費）。</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-600 pb-1 flex items-center"><ShoppingBag className="mr-2 text-green-400"/> 休暇パート</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>ステージクリア後は休暇パートに入ります。</li>
                                    <li><strong>日数</strong>を消費して修理や強化を行います。</li>
                                    <li><strong>ショップ:</strong> スターコインを使って強力なパーツを購入できます。</li>
                                    <li><strong>格納庫:</strong> パーツの配置換えや保管ができます。</li>
                                </ul>
                            </section>
                        </div>
                        
                        <button onClick={() => setShowGameHelp(false)} className="mt-8 w-full bg-cyan-700 hover:bg-cyan-600 py-3 rounded text-white font-bold">閉じる</button>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <div className="h-12 bg-black border-b border-cyan-900 flex justify-between items-center px-4 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center text-green-400 font-bold"><Heart size={16} className="mr-1"/> {player.hp}/{player.maxHp}</div>
                    <div className="flex items-center text-orange-400 font-bold"><Wind size={16} className="mr-1"/> {player.fuel}/{player.maxFuel}</div>
                </div>
                <div className="text-cyan-200 font-bold tracking-widest text-sm flex items-center">
                    STAGE {stage}
                    {isEndless && <span className="ml-2 text-purple-400 text-xs border border-purple-500 px-1 rounded">ENDLESS</span>}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowGameHelp(true)} className="bg-slate-800 border border-slate-600 px-2 py-1 rounded text-xs hover:bg-slate-700 flex items-center"><HelpCircle size={14} className="mr-1"/> HELP</button>
                    <button onClick={() => setShowPool(!showPool)} className="bg-slate-800 border border-slate-600 px-2 py-1 rounded text-xs hover:bg-slate-700">POOL</button>
                </div>
            </div>

            {/* Battle Grid */}
            <div className="flex-1 relative bg-[#1a1a24] overflow-y-auto custom-scrollbar overflow-hidden">
                <div className="absolute inset-0 flex pointer-events-none overflow-hidden mix-blend-screen z-0 opacity-40">
                    <div 
                        className="absolute w-1/2 left-0 h-full flex items-center justify-center transition-transform duration-500 ease-out animate-pulse"
                        style={{ transform: `translateY(${(player.yOffset - 1) * 20}%)`, animationDuration: '3s' }}
                    >
                         <div className="relative w-[80%] max-w-[350px] aspect-square flex items-center justify-center -translate-x-4 md:-translate-x-8">
                             <Send 
                                 strokeWidth={0.2} 
                                 className="w-full h-full text-cyan-400 rotate-45 drop-shadow-[0_0_8px_rgba(34,211,238,1)] absolute" 
                             />
                         </div>
                    </div>
                    <div 
                        className="absolute w-1/2 right-0 h-full flex items-center justify-center transition-transform duration-500 ease-out animate-pulse"
                        style={{ transform: `translateY(${(enemy.yOffset - 1) * 20}%)`, animationDuration: '3.5s', animationDelay: '1s' }}
                    >
                         <div className="relative w-[80%] max-w-[350px] aspect-square flex items-center justify-center translate-x-4 md:translate-x-8">
                             <Send 
                                 strokeWidth={0.2} 
                                 className="w-full h-full text-red-500 rotate-[225deg] drop-shadow-[0_0_8px_rgba(239,68,68,1)] absolute" 
                             />
                         </div>
                    </div>
                </div>

                {/* Clash Overlay */}
                <ClashOverlay clashState={clashState} />

                <div className="absolute inset-0 flex flex-col justify-center py-4 min-h-[400px]">
                    {[0,1,2,3,4].map(row => renderGridRow(row))}
                </div>

                {/* Enemy Status Float */}
                <div className="absolute top-2 right-2 bg-red-900/50 p-2 rounded border border-red-500/50 text-right z-20">
                    <div className="text-xs text-red-200">{enemy.isStunned ? "STUNNED" : "ENEMY"}</div>
                    <div className="text-lg font-bold">{enemy.hp} HP</div>
                    <div className="text-xs flex justify-end items-center gap-1 text-blue-300">
                        <Shield size={12}/> Def: {enemy.durability}/{enemy.maxDurability}
                    </div>
                    {/* Fuel Display */}
                    <div className="text-xs flex justify-end items-center gap-1 text-orange-300 mt-1">
                        <Fuel size={12}/> Fuel: {enemy.fuel}
                    </div>
                </div>

                {/* Logs */}
                <div className="absolute bottom-2 right-2 w-48 pointer-events-none opacity-70 z-20">
                    {logs.map((l, i) => <div key={i} className="text-[10px] text-right bg-black/50 mb-0.5 px-1 rounded">{l}</div>)}
                </div>
            </div>
            
            {/* Hand Help Tooltip */}
            {showHandHelp && (
                 <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowHandHelp(false)}>
                    <div className="bg-slate-800 border-2 border-cyan-500 p-6 rounded-lg max-w-sm w-full shadow-2xl relative text-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center"><Info className="mr-2"/> エネルギーカードの仕組み</h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-300">
                            <li><span className="text-white font-bold">数値</span>: スロットに入れた時の出力パワーになります。</li>
                            <li><span className="text-white font-bold">色</span>: スロットの要求色に合わせる必要があります。</li>
                            <li><span className="text-orange-400 font-bold">オレンジ</span> &gt; <span className="text-blue-400 font-bold">青</span> &gt; <span className="text-slate-200 font-bold">白</span> の順でランクが高く、上位色は下位のスロットにも使用可能です。</li>
                        </ul>
                        <button onClick={() => setShowHandHelp(false)} className="mt-6 w-full bg-cyan-700 py-2 rounded text-white font-bold">閉じる</button>
                    </div>
                </div>
            )}

            {/* Bottom Controls */}
            <div className="h-44 md:h-52 bg-[#0a0a10] border-t border-cyan-900 p-2 flex gap-2 shrink-0 z-20">
                {/* Movement Controls */}
                <div className="flex flex-col gap-2 justify-center w-14 md:w-16 shrink-0">
                    <button onClick={() => handleMove(-1)} className="flex-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 active:bg-cyan-900 flex items-center justify-center text-cyan-400 shadow-inner">
                        ▲
                    </button>
                    <button onClick={() => handleMove(1)} className="flex-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 active:bg-cyan-900 flex items-center justify-center text-cyan-400 shadow-inner">
                        ▼
                    </button>
                </div>

                {/* Hand */}
                <div className="flex-1 relative flex flex-col bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                    <div className="absolute top-1 right-1 z-20">
                         <button onClick={() => setShowHandHelp(true)} className="text-gray-500 hover:text-white"><HelpCircle size={14}/></button>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-1 content-start overflow-y-auto px-2 py-1 custom-scrollbar">
                        {hand.map(card => (
                            <EnergyCardView 
                                key={card.id} 
                                card={card} 
                                onClick={() => handleCardSelect(card.id)} 
                                selected={selectedCardId === card.id}
                                small={true}
                            />
                        ))}
                        {hand.length === 0 && <div className="text-gray-600 text-xs w-full text-center mt-8">NO ENERGY</div>}
                    </div>
                </div>

                {/* End Turn */}
                <button 
                    onClick={resolveCombat} 
                    disabled={animating}
                    className="w-16 md:w-20 bg-red-900 hover:bg-red-800 border-2 border-red-600 rounded-lg flex flex-col items-center justify-center text-red-100 font-bold shadow-lg active:translate-y-1 transition-all"
                >
                    <RefreshCw size={24} className={animating ? "animate-spin" : ""}/>
                    <span className="text-[10px] mt-1">FIRE</span>
                </button>
            </div>

            {(phase === 'VICTORY' || phase === 'GAME_OVER') && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-slate-800 p-8 rounded-xl border-4 border-slate-600 text-center shadow-2xl">
                        {phase === 'VICTORY' && (
                            <>
                                <Trophy size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce"/>
                                <h2 className="text-4xl font-bold text-white mb-2">MISSION COMPLETE</h2>
                                <p className="text-gray-400 mb-6">全ステージクリアおめでとう！</p>
                                <div className="mb-6 rounded-xl border border-cyan-500/50 bg-slate-900/80 p-4">
                                    <div className="text-cyan-300 font-bold mb-2">
                                        アンロック済みパーツ: {(progress.unlockedPartNames?.length || 0)} / {PAPER_PLANE_UNLOCK_TARGET}
                                    </div>
                                    {newlyUnlockedPart ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="text-yellow-300 font-bold">NEW PART UNLOCKED</div>
                                            <div className="w-24">
                                                <ShipPartView part={newlyUnlockedPart} onLongPress={(p) => setTooltipPart(p)} />
                                            </div>
                                            <div className="text-white font-bold">{newlyUnlockedPart.name}</div>
                                            <div className="text-xs text-slate-300 max-w-sm">{newlyUnlockedPart.description}</div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-400">今回新規解放できるパーツはありません。</div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-4">
                                    <button onClick={activateEndlessMode} className="bg-purple-600 px-8 py-3 rounded text-xl font-bold hover:bg-purple-500 border-2 border-purple-400 flex items-center justify-center animate-pulse">
                                        <Repeat className="mr-2" /> エンドレスモードへ
                                    </button>
                                    <button 
                                        onClick={returnToSetup} 
                                        className="bg-green-600 px-8 py-3 rounded text-xl font-bold hover:bg-green-500 border-2 border-green-400 flex items-center justify-center"
                                    >
                                        <Settings className="mr-2"/> 機体選択へ
                                    </button>
                                    <button onClick={onBack} className="bg-cyan-600 px-8 py-3 rounded text-xl font-bold border-2 border-cyan-400">タイトルへ戻る</button>
                                </div>
                            </>
                        )}
                        {phase === 'GAME_OVER' && (
                            <>
                                <Skull size={64} className="text-red-500 mx-auto mb-4"/>
                                <h2 className="text-4xl font-bold text-red-500 mb-2">DESTROYED</h2>
                                <p className="text-gray-400 mb-6">Stage {stage}</p>
                                <div className="flex flex-col gap-4">
                                    <button 
                                        onClick={returnToSetup}
                                        className="bg-green-600 px-8 py-3 rounded text-xl font-bold hover:bg-green-500 border-2 border-green-400 flex items-center justify-center"
                                    >
                                        <Settings className="mr-2"/> 機体選択へ
                                    </button>
                                    <button onClick={onBack} className="mt-2 bg-gray-600 px-8 py-3 rounded text-xl font-bold">タイトルへ戻る</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaperPlaneBattle;
