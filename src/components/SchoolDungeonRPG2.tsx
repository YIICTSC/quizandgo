
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, Circle, Menu, X, Check, Search, LogOut, Shield, Sword, Target, Trash2, Hammer, FlaskConical, Info, Zap, Skull, Ghost, Award, RotateCcw, Send, Edit3, HelpCircle, Umbrella, Crosshair, FastForward, Coins, ShoppingBag, DollarSign, Map as MapIcon, User, Watch, Sparkles, BookOpen, Layers, Move, Minimize2, Maximize2, Volume2, ShieldAlert, ArrowUpCircle, Plus, Magnet, Moon, Snowflake, Activity, Eye, Dna, Dice5, CloudLightning, Wind } from 'lucide-react';
import { audioService } from '../services/audioService';
import { createPixelSpriteCanvas } from './PixelSprite';
import { storageService } from '../services/storageService';
import MathChallengeScreen from './MathChallengeScreen';
import { GameMode } from '../types';
import { EXTRA_SCHOOL_DUNGEON_ITEMS } from '../data/schoolDungeonExtraItems';

// --- セッション内アイテム引き継ぎ用変数 ---
let inheritedItemTemplate2: Item | null = null;

interface SchoolDungeonRPG2Props {
  onBack: () => void;
}

// --- GBC PALETTE (Dynamic based on Floor) ---
const PALETTE_DEFAULT = { C0: '#0f380f', C1: '#306230', C2: '#8bac0f', C3: '#9bbc0f' };
const PALETTE_GYM = { C0: '#2d1b0e', C1: '#56341a', C2: '#af7846', C3: '#dfb783' }; // Brown/Wood
const PALETTE_SCIENCE = { C0: '#0b1e2d', C1: '#1b4a6e', C2: '#4a90b8', C3: '#9cd1e8' }; // Cyan/Blue
const PALETTE_MUSIC = { C0: '#2d0b26', C1: '#6e1b5c', C2: '#b84a9e', C3: '#e89ccf' }; // Purple/Pink
const PALETTE_LIBRARY = { C0: '#3e2723', C1: '#5d4037', C2: '#a1887f', C3: '#d7ccc8' }; // Sepia
const PALETTE_ROOF = { C0: '#050a14', C1: '#122442', C2: '#3b5a8c', C3: '#7aa3cc' }; // Dark Blue/Night
const PALETTE_BOSS = { C0: '#290000', C1: '#630000', C2: '#b57b00', C3: '#ffdb4d' }; // Red/Gold

interface ThemeConfig {
    name: string;
    colors: { C0: string, C1: string, C2: string, C3: string };
    bgm: 'school_psyche' | 'dungeon_gym' | 'dungeon_science' | 'dungeon_music' | 'dungeon_library' | 'dungeon_roof' | 'dungeon_boss';
}

const getTheme = (floor: number): ThemeConfig => {
    if (floor >= 20) return { name: "校長室", colors: PALETTE_BOSS, bgm: 'dungeon_boss' };
    if (floor >= 16) return { name: "屋上", colors: PALETTE_ROOF, bgm: 'dungeon_roof' };
    if (floor >= 13) return { name: "図書室", colors: PALETTE_LIBRARY, bgm: 'dungeon_library' };
    if (floor >= 10) return { name: "音楽室", colors: PALETTE_MUSIC, bgm: 'dungeon_music' };
    if (floor >= 7) return { name: "理科室", colors: PALETTE_SCIENCE, bgm: 'dungeon_science' };
    if (floor >= 4) return { name: "体育館", colors: PALETTE_GYM, bgm: 'dungeon_gym' };
    return { name: "一般教室", colors: PALETTE_DEFAULT, bgm: 'school_psyche' };
};

// --- CONSTANTS ---
const MAP_W = 40; 
const MAP_H = 40; 
const VIEW_W = 11; 
const VIEW_H = 9;
const TILE_SIZE = 16; 
const SCALE = 3; 
const MAX_INVENTORY = 20;

const HUNGER_INTERVAL = 10;
const REGEN_INTERVAL = 5;
const ENEMY_SPAWN_RATE = 25;

const UNIDENTIFIED_NAMES = [
    "赤い傘", "青い傘", "黄色い傘", "ビニール傘", "黒い傘", "壊れた傘", 
    "高級な傘", "水玉の傘", "花柄の傘", "透明な傘", "和傘", "レースの傘"
];

// --- TYPES ---
type TileType = 'WALL' | 'FLOOR' | 'STAIRS' | 'HALLWAY';
type Direction = { x: 0 | 1 | -1, y: 0 | 1 | -1 };
type ItemCategory = 'WEAPON' | 'ARMOR' | 'RANGED' | 'CONSUMABLE' | 'SYNTH' | 'STAFF' | 'ACCESSORY' | 'DECK_CARD';
type EnemyType = 'SLIME' | 'GHOST' | 'DRAIN' | 'DRAGON' | 'METAL' | 'FLOATING' | 'THIEF' | 'BAT' | 'BOSS' | 'MANDRAKE' | 'GOLEM' | 'NINJA' | 'MAGE' | 'SHOPKEEPER';
type VisualEffectType = 'SLASH' | 'THUNDER' | 'EXPLOSION' | 'TEXT' | 'FLASH' | 'PROJECTILE' | 'WARP' | 'BEAM' | 'MAGIC_PROJ' | 'WIND';
type TrapType = 'BOMB' | 'SLEEP' | 'POISON' | 'WARP' | 'RUST' | 'SUMMON';

// --- DUNGEON CARD TYPES ---
type DungeonCardType = 'ATTACK' | 'DEFENSE' | 'BUFF' | 'SPECIAL';
interface DungeonCard {
    id: string; 
    templateId: string;
    name: string;
    type: DungeonCardType;
    description: string;
    power: number;
    icon: React.ReactNode;
}

interface VisualEffect {
  id: number;
  type: VisualEffectType;
  x: number; 
  y: number; 
  duration: number;
  maxDuration: number;
  value?: string;
  color?: string;
  dir?: Direction;
  scale?: number;
  startX?: number;
  startY?: number;
  targetX?: number;
  targetY?: number;
  itemSpriteKey?: string; 
  segments?: {x1: number, y1: number, x2: number, y2: number}[]; 
}

interface Item {
  id: string;
  category: ItemCategory;
  type: string; 
  name: string;
  desc: string;
  value?: number; 
  power?: number; 
  range?: number;
  count?: number; 
  plus?: number;
  charges?: number; 
  maxCharges?: number;
  price?: number; 
}

interface EquipmentSlots {
  weapon: Item | null;
  armor: Item | null;
  ranged: Item | null;
  accessory: Item | null;
}

interface Entity {
  id: number;
  type: 'PLAYER' | 'ENEMY' | 'ITEM' | 'GOLD' | 'TRAP';
  x: number;
  y: number;
  char: string;
  name: string;
  
  hp: number;
  maxHp: number;
  baseAttack: number; 
  baseDefense: number;
  attack: number;     
  defense: number;
  
  xp: number;
  gold?: number; 
  dir: Direction;
  
  status: {
      sleep: number;
      confused: number;
      frozen: number;
      blind: number;
      speed: number;
      defenseBuff?: number; 
      attackBuff?: number; 
      poison?: number; 
      trapSight?: number; 
  };
  
  dead?: boolean;
  offset?: { x: number, y: number }; 
  itemData?: Item; 
  equipment?: EquipmentSlots;
  enemyType?: EnemyType;
  shopItems?: Item[]; 
  
  trapType?: TrapType;
  visible?: boolean;
}

interface Log {
  message: string;
  color?: string;
  id: number;
}

interface RoomRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

// --- ITEM DATABASE ---
const ITEM_DB: Record<string, Omit<Item, 'id'>> = {
    'PENCIL_SWORD': { category: 'WEAPON', type: 'PENCIL_SWORD', name: 'えんぴつソード', desc: '削りたて。攻撃+4', power: 4, value: 200 },
    'METAL_BAT': { category: 'WEAPON', type: 'METAL_BAT', name: '金属バット', desc: 'どうたぬき級。攻撃+8', power: 8, value: 500 },
    'PROTRACTOR_EDGE': { category: 'WEAPON', type: 'PROTRACTOR_EDGE', name: '分度器エッジ', desc: '前方3方向を攻撃できる。攻撃+3', power: 3, value: 400 },
    'OFUDA_RULER': { category: 'WEAPON', type: 'OFUDA_RULER', name: 'お札定規', desc: 'ゴースト系に大ダメージ。攻撃+4', power: 4, value: 350 },
    'VITAMIN_INJECT': { category: 'WEAPON', type: 'VITAMIN_INJECT', name: 'ビタミン注射', desc: 'ドレイン系に大ダメージ。攻撃+5', power: 5, value: 350 },
    'LADLE': { category: 'WEAPON', type: 'LADLE', name: '給食のおたま', desc: '敵を肉(回復)に変えることがある。攻撃+2', power: 2, value: 600 },
    'STAINLESS_PEN': { category: 'WEAPON', type: 'STAINLESS_PEN', name: 'ステンレスペン', desc: 'サビの罠にかからない。攻撃+6', power: 6, value: 450 },
    'RICH_WATCH': { category: 'WEAPON', type: 'RICH_WATCH', name: '金持ちの時計', desc: 'お金を消費して大ダメージ。攻撃+10', power: 10, value: 800 },
    'GYM_CLOTHES': { category: 'ARMOR', type: 'GYM_CLOTHES', name: '体操服', desc: '動きやすい。回避率UP。防御+3', power: 3, value: 200 },
    'RANDO_SERU': { category: 'ARMOR', type: 'RANDO_SERU', name: 'ランドセル', desc: '硬いが重い。腹減りが早まる。防御+12', power: 12, value: 500 },
    'PRINCIPAL_SHIELD': { category: 'ARMOR', type: 'PRINCIPAL_SHIELD', name: '校長の盾', desc: '最強の盾。防御+15', power: 15, value: 1000 },
    'VINYL_APRON': { category: 'ARMOR', type: 'VINYL_APRON', name: 'ビニールエプロン', desc: 'サビや汚れを防ぐ。防御+4', power: 4, value: 300 },
    'NAME_TAG': { category: 'ARMOR', type: 'NAME_TAG', name: '名札', desc: '盗難を防ぐ。防御+5', power: 5, value: 250 },
    'DISASTER_HOOD': { category: 'ARMOR', type: 'DISASTER_HOOD', name: '防災頭巾', desc: '爆発ダメージ減少。防御+6', power: 6, value: 350 },
    'FIREFIGHTER': { category: 'ARMOR', type: 'FIREFIGHTER', name: '防火ヘルメット', desc: '炎ダメージ減少。防御+7', power: 7, value: 400 },
    'GOLD_BADGE': { category: 'ARMOR', type: 'GOLD_BADGE', name: '純金の校章', desc: 'サビない。防御+8', power: 8, value: 600 },
    'RING_POWER': { category: 'ACCESSORY', type: 'RING_POWER', name: 'ちからの腕輪', desc: '攻撃力が上がる。攻撃+3', power: 3, value: 500 },
    'RING_GUARD': { category: 'ACCESSORY', type: 'RING_GUARD', name: 'まもりの腕輪', desc: '防御力が上がる。防御+3', power: 3, value: 500 },
    'RING_HUNGER': { category: 'ACCESSORY', type: 'RING_HUNGER', name: 'ハラヘラズの腕輪', desc: 'お腹が減りにくくなる。', value: 800 },
    'RING_HEAL': { category: 'ACCESSORY', type: 'RING_HEAL', name: '回復の腕輪', desc: 'HPの回復が早くなるが、お腹も減る。', value: 800 },
    'RING_SIGHT': { category: 'ACCESSORY', type: 'RING_SIGHT', name: '透視の腕輪', desc: '敵とアイテムの位置がわかる。', value: 1000 },
    'RING_TRAP': { category: 'ACCESSORY', type: 'RING_TRAP', name: 'ワナ師の腕輪', desc: '罠が見えるようになる。', value: 800 },
    'CHALK': { category: 'RANGED', type: 'CHALK', name: 'チョーク', desc: '普通の飛び道具。', power: 3, range: 5, count: 8, value: 100 },
    'STONES': { category: 'RANGED', type: 'STONES', name: '石ころ', desc: '必中。範囲攻撃。', power: 2, range: 4, count: 5, value: 80 },
    'SHADOW_PIN': { category: 'RANGED', type: 'SHADOW_PIN', name: '影縫いの画鋲', desc: '当たると移動不可にする。', power: 1, range: 5, count: 3, value: 150 },
    'UMB_FIRE': { category: 'STAFF', type: 'UMB_FIRE', name: '火炎放射傘', desc: '振ると前方に炎を放つ。', maxCharges: 5, value: 400 },
    'UMB_THUNDER': { category: 'STAFF', type: 'UMB_THUNDER', name: '避雷針の傘', desc: '振ると前方の敵に雷ダメージ。', maxCharges: 5, value: 400 },
    'UMB_SLEEP': { category: 'STAFF', type: 'UMB_SLEEP', name: '子守唄の傘', desc: '振ると前方の敵を眠らせる。', maxCharges: 5, value: 400 },
    'UMB_BLOW': { category: 'STAFF', type: 'UMB_BLOW', name: '突風の傘', desc: '振ると敵を吹き飛ばす。', maxCharges: 6, value: 350 },
    'UMB_WARP': { category: 'STAFF', type: 'UMB_WARP', name: '早退の傘', desc: '振ると敵をどこかへワープさせる。', maxCharges: 5, value: 350 },
    'UMB_CHANGE': { category: 'STAFF', type: 'UMB_CHANGE', name: '席替えの傘', desc: '振ると敵と場所を入れ替わる。', maxCharges: 6, value: 350 },
    'UMB_BIND': { category: 'STAFF', type: 'UMB_BIND', name: '金縛りの傘', desc: '振ると敵を動けなくする。', maxCharges: 5, value: 400 },
    'UMB_HEAL': { category: 'STAFF', type: 'UMB_HEAL', name: '回復の傘', desc: '振るとHPを回復する(敵に当てると敵が回復)。', maxCharges: 5, value: 500 },
    'SCROLL_SLEEP': { category: 'CONSUMABLE', type: 'SCROLL_SLEEP', name: '居眠りノート', desc: '部屋の敵が眠る。', value: 300 },
    'SCROLL_THUNDER': { category: 'CONSUMABLE', type: 'SCROLL_THUNDER', name: '理科の実験ノート', desc: 'フロア全体の敵に雷ダメージ。', value: 400 },
    'SCROLL_CRISIS': { category: 'CONSUMABLE', type: 'SCROLL_CRISIS', name: '先生への反省文', desc: '困った時の神頼み(全回復等)。', value: 500 },
    'SCROLL_BERSERK': { category: 'CONSUMABLE', type: 'SCROLL_BERSERK', name: '学級崩壊ノート', desc: '敵が暴走する。', value: 200 },
    'SCROLL_MAP': { category: 'CONSUMABLE', type: 'SCROLL_MAP', name: '学校の案内図', desc: 'フロア構造がわかる。', value: 300 },
    'SCROLL_UP_W': { category: 'CONSUMABLE', type: 'SCROLL_UP_W', name: '表彰状(武)', desc: '武器を強化する(+1)。', value: 400 },
    'SCROLL_UP_A': { category: 'CONSUMABLE', type: 'SCROLL_UP_A', name: '表彰状(防)', desc: '防具を強化する(+1)。', value: 400 },
    'SCROLL_BLANK': { category: 'CONSUMABLE', type: 'SCROLL_BLANK', name: '白紙のノート', desc: '一度読んだノートの効果を書き込める。', value: 800 },
    'SCROLL_WARP': { category: 'CONSUMABLE', type: 'SCROLL_WARP', name: '早退届', desc: 'フロアのどこかへワープする。', value: 100 },
    'SCROLL_CONFUSE': { category: 'CONSUMABLE', type: 'SCROLL_CONFUSE', name: '学級閉鎖ノート', desc: '部屋の敵が混乱する。', value: 300 },
    'SCROLL_IDENTIFY': { category: 'CONSUMABLE', type: 'SCROLL_IDENTIFY', name: '解法のノート', desc: '所持しているアイテムを全て識別する。', value: 300 },
    'FOOD_ONIGIRI': { category: 'CONSUMABLE', type: 'FOOD_ONIGIRI', name: 'おにぎり', desc: 'お腹が50回復。', value: 50 },
    'FOOD_MEAT': { category: 'CONSUMABLE', type: 'FOOD_MEAT', name: '謎の肉', desc: 'お腹100、HP50回復。', value: 100 },
    'GRASS_HEAL': { category: 'CONSUMABLE', type: 'GRASS_HEAL', name: '給食の残り', desc: 'HP100回復。', value: 100 },
    'GRASS_LIFE': { category: 'CONSUMABLE', type: 'GRASS_LIFE', name: '命の野菜', desc: '最大HP+5。HP5回復。', value: 500 },
    'GRASS_SPEED': { category: 'CONSUMABLE', type: 'GRASS_SPEED', name: 'エナドリ', desc: '20ターンの間、倍速になる。', value: 200 },
    'GRASS_EYE': { category: 'CONSUMABLE', type: 'GRASS_EYE', name: '目薬', desc: '罠が見えるようになる。', value: 200 },
    'GRASS_POISON': { category: 'CONSUMABLE', type: 'GRASS_POISON', name: '腐ったパン', desc: '毒を受ける/敵に投げると毒。', value: 50 },
    'POT_GLUE': { category: 'SYNTH', type: 'POT_GLUE', name: '工作のり', desc: '装備を合成する。', value: 500 },
    'POT_CHANGE': { category: 'CONSUMABLE', type: 'POT_CHANGE', name: 'びっくり箱', desc: '中身を別のアイテムに変化させる。', value: 400 },
    'BOMB': { category: 'CONSUMABLE', type: 'BOMB', name: '爆弾', desc: '周囲を爆破する。', value: 200 },
    ...EXTRA_SCHOOL_DUNGEON_ITEMS,
};

// --- DUNGEON CARD DATABASE ---
const DUNGEON_CARD_DB: Omit<DungeonCard, 'id'>[] = [
    { templateId: 'THRUST', name: 'えんぴつ突き', type: 'ATTACK', power: 3, description: '前方2マスの敵を貫通攻撃', icon: <Sword size={16}/> },
    { templateId: 'SPIN', name: 'コンパス回転', type: 'ATTACK', power: 2, description: '周囲8マスの敵にダメージ', icon: <RotateCcw size={16}/> },
    { templateId: 'HEAL', name: '給食休憩', type: 'BUFF', power: 30, description: 'HPを回復する', icon: <FlaskConical size={16}/> },
    { templateId: 'GUARD', name: 'ノート盾', type: 'DEFENSE', power: 10, description: '防御力を一時的に上げる', icon: <Shield size={16}/> },
    { templateId: 'JUMP', name: '幅跳び', type: 'SPECIAL', power: 0, description: '前方2マス先へジャンプ移動', icon: <Move size={16}/> },
    { templateId: 'SWAP', name: '場所替え', type: 'SPECIAL', power: 0, description: '目の前の敵と入れ替わる', icon: <RotateCcw size={16}/> },
    { templateId: 'PULL', name: '引き寄せ', type: 'SPECIAL', power: 0, description: '遠くの敵を目の前に引き寄せる', icon: <Minimize2 size={16}/> },
    { templateId: 'PUSH', name: '吹き飛ばし', type: 'ATTACK', power: 2, description: '敵を5マス吹き飛ばす', icon: <Maximize2 size={16}/> },
    { templateId: 'DIG', name: '穴掘り', type: 'SPECIAL', power: 0, description: '目の前の壁を掘って進む', icon: <Hammer size={16}/> },
    { templateId: 'TELEPORT', name: '早退', type: 'SPECIAL', power: 0, description: 'フロアのどこかへワープ', icon: <Ghost size={16}/> },
    { templateId: 'FIRE', name: '理科実験', type: 'SPECIAL', power: 15, description: '遠距離の敵に炎ダメージ', icon: <Zap size={16}/> },
    { templateId: 'EXPLOSION', name: '化学爆発', type: 'ATTACK', power: 20, description: '周囲8マスの敵に大ダメージ', icon: <Sparkles size={16}/> },
    { templateId: 'ROOM_ATK', name: '全校放送', type: 'ATTACK', power: 8, description: '部屋全体の敵にダメージ', icon: <Volume2 size={16}/> },
    { templateId: 'WAVE', name: '定規なぎ払い', type: 'ATTACK', power: 4, description: '前方3方向にダメージ', icon: <Move size={16}/> },
    { templateId: 'SNIPE', name: '狙い撃ち', type: 'ATTACK', power: 10, description: '遠くの敵1体に大ダメージ', icon: <Crosshair size={16}/> },
    { templateId: 'PIERCE', name: '貫通弾', type: 'ATTACK', power: 6, description: '直線上の敵すべてにダメージ', icon: <ArrowUpCircle size={16}/> },
    { templateId: 'DASH', name: '廊下ダッシュ', type: 'BUFF', power: 0, description: '倍速状態になる', icon: <FastForward size={16}/> },
    { templateId: 'RAGE', name: '逆ギレ', type: 'BUFF', power: 5, description: '攻撃力を一時的に上げる', icon: <Sword size={16}/> },
    { templateId: 'INVINCIBLE', name: '無敵スター', type: 'BUFF', power: 99, description: '一時的に防御力極大アップ', icon: <ShieldAlert size={16}/> },
    { templateId: 'DISARM', name: '武器奪取', type: 'SPECIAL', power: 0, description: '周囲の敵の攻撃力を下げる', icon: <X size={16}/> },
    { templateId: 'CROSS', name: '十字定規', type: 'ATTACK', power: 5, description: '前後左右4マスの敵を攻撃', icon: <Plus size={16}/> },
    { templateId: 'X_ATK', name: 'バッテン', type: 'ATTACK', power: 5, description: '斜め4方向の敵を攻撃', icon: <X size={16}/> },
    { templateId: 'DRAIN', name: '給食当番', type: 'ATTACK', power: 4, description: '敵にダメージを与え、半分回復', icon: <Dna size={16}/> },
    { templateId: 'POISON', name: '毒舌', type: 'SPECIAL', power: 0, description: '目の前の敵を猛毒にする(継続ダメ)', icon: <Skull size={16}/> },
    { templateId: 'SLEEP', name: '校長の話', type: 'SPECIAL', power: 0, description: '部屋全体の敵を眠らせる', icon: <Moon size={16}/> },
    { templateId: 'FREEZE', name: '寒いギャグ', type: 'ATTACK', power: 2, description: '目の前の敵を凍らせる', icon: <Snowflake size={16}/> },
    { templateId: 'MAGNET', name: '落とし物', type: 'SPECIAL', power: 0, description: 'フロア中のアイテムを引き寄せる', icon: <Magnet size={16}/> },
    { templateId: 'MAP', name: 'カンニング', type: 'SPECIAL', power: 0, description: 'フロアのマップ構造をあばく', icon: <Eye size={16}/> },
    { templateId: 'EARTHQUAKE', name: '貧乏ゆすり', type: 'ATTACK', power: 5, description: '部屋全体の敵にダメージ', icon: <Activity size={16}/> },
    { templateId: 'GAMBLE', name: '運試し', type: 'SPECIAL', power: 0, description: '所持金増加か、ダメージか', icon: <Dice5 size={16}/> },
];

// --- DIJKSTRA PATHFINDING HELPER ---
const computeDijkstraMap = (map: TileType[][], targetX: number, targetY: number): number[][] => {
    const dMap = Array(MAP_H).fill(0).map(() => Array(MAP_W).fill(9999));
    const queue: {x: number, y: number}[] = [{x: targetX, y: targetY}];
    dMap[targetY][targetX] = 0;
    while(queue.length > 0) {
        const {x, y} = queue.shift()!;
        const dist = dMap[y][x];
        const neighbors = [
            {x:x, y:y-1}, {x:x, y:y+1}, {x:x-1, y:y}, {x:x+1, y:y},
            {x:x-1, y:y-1}, {x:x+1, y:y-1}, {x:x-1, y:y+1}, {x:x+1, y:y+1}
        ];
        for(const n of neighbors) {
            if(n.x >= 0 && n.x < MAP_W && n.y >= 0 && n.y < MAP_H) {
                if (map[n.y][n.x] !== 'WALL') {
                    const dx = n.x - x;
                    const dy = n.y - y;
                    if (dx !== 0 && dy !== 0) {
                        if (map[y][x + dx] === 'WALL' || map[y + dy][x] === 'WALL') continue; 
                    }
                    if (dMap[n.y][n.x] > dist + 1) {
                        dMap[n.y][n.x] = dist + 1;
                        queue.push(n);
                    }
                }
            }
        }
    }
    return dMap;
};

const SchoolDungeonRPG2: React.FC<SchoolDungeonRPG2Props> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [map, setMap] = useState<TileType[][]>([]);
  const [visitedMap, setVisitedMap] = useState<boolean[][]>([]);
  const [floorMapRevealed, setFloorMapRevealed] = useState(false);
  const roomsRef = useRef<RoomRect[]>([]);
  const spriteCache = useRef<Record<string, HTMLCanvasElement>>({});
  const [player, setPlayer] = useState<Entity>({
    id: 0, type: 'PLAYER', x: 1, y: 1, char: '@', name: 'わんぱく小学生', 
    hp: 50, maxHp: 50, baseAttack: 3, baseDefense: 0, attack: 3, defense: 0, xp: 0, gold: 0, dir: {x:0, y:1},
    equipment: { weapon: null, armor: null, ranged: null, accessory: null },
    status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 },
    offset: { x: 0, y: 0 }
  });
  const [dungeonDeck, setDungeonDeck] = useState<DungeonCard[]>([]);
  const [dungeonHand, setDungeonHand] = useState<DungeonCard[]>([]);
  const [dungeonDiscard, setDungeonDiscard] = useState<DungeonCard[]>([]);
  const [enemies, setEnemies] = useState<Entity[]>([]);
  const [floorItems, setFloorItems] = useState<Entity[]>([]);
  const [traps, setTraps] = useState<Entity[]>([]);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [floor, setFloor] = useState(1);
  const [level, setLevel] = useState(1);
  const [belly, setBelly] = useState(100);
  const [maxBelly, setMaxBelly] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameClear, setGameClear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMap, setShowMap] = useState(false); 
  const [showHelp, setShowHelp] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showDeck, setShowDeck] = useState(false); 
  const turnCounter = useRef(0);
  const [isEndless, setIsEndless] = useState(false);
  const saveDebounceRef = useRef<any>(null);
  const [shopRemovedThisFloor, setShopRemovedThisFloor] = useState(false);
  const currentTheme = useMemo(() => getTheme(floor), [floor]);
  const [shopState, setShopState] = useState<{ active: boolean, merchantId: number | null, mode: 'BUY' | 'SELL' }>({ active: false, merchantId: null, mode: 'BUY' });
  const [deckViewMode, setDeckViewMode] = useState<'VIEW' | 'REMOVE'>('VIEW');
  const visualEffects = useRef<VisualEffect[]>([]);
  const shake = useRef<{x: number, y: number, duration: number}>({x: 0, y: 0, duration: 0});
  const [synthState, setSynthState] = useState<{ active: boolean, mode: 'SYNTH' | 'CHANGE' | 'BLANK', step: 'SELECT_BASE' | 'SELECT_MAT' | 'SELECT_TARGET' | 'SELECT_EFFECT', baseIndex: number | null }>({ active: false, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null });
  const [idMap, setIdMap] = useState<Record<string, string>>({}); 
  const [identifiedTypes, setIdentifiedTypes] = useState<Set<string>>(new Set());
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [blankScrollSelectionIndex, setBlankScrollSelectionIndex] = useState(0);
  const menuListRef = useRef<HTMLDivElement>(null);
  const lastInputType = useRef<'KEY' | 'MOUSE'>('KEY');
  const [inspectedItem, setInspectedItem] = useState<Item | null>(null);
  const longPressTimer = useRef<any>(null);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const fastForwardInterval = useRef<any>(null);
  const [showMathChallenge, setShowMathChallenge] = useState(false);

  // --- 引き継ぎ機能用状態 ---
  const [inheritItemIdx, setInheritItemIdx] = useState<number | null>(null);

  // 引き継ぎ対象アイテム一覧（装備中を含む全所持品）
  const allPossessions = useMemo(() => {
    if (!gameOver) return [];
    const items = [...inventory];
    if (player.equipment?.weapon) items.push(player.equipment.weapon);
    if (player.equipment?.armor) items.push(player.equipment.armor);
    if (player.equipment?.ranged) items.push(player.equipment.ranged);
    if (player.equipment?.accessory) items.push(player.equipment.accessory);
    return items;
  }, [inventory, player.equipment, gameOver]);

  useEffect(() => {
    spriteCache.current['PLAYER_FRONT'] = createPixelSpriteCanvas('P_FRONT', 'HERO_FRONT|赤'); 
    spriteCache.current['PLAYER_SIDE'] = createPixelSpriteCanvas('P_SIDE', 'HERO_SIDE|赤'); 
    spriteCache.current['PLAYER_BACK'] = createPixelSpriteCanvas('P_BACK', 'HERO_BACK|赤');
    spriteCache.current['SLIME'] = createPixelSpriteCanvas('SLIME', 'SLIME|#1565C0'); 
    spriteCache.current['GHOST'] = createPixelSpriteCanvas('GHOST', 'GHOST|#a5f3fc'); 
    spriteCache.current['BAT'] = createPixelSpriteCanvas('BAT', 'BAT|#212121'); 
    spriteCache.current['DRAIN'] = createPixelSpriteCanvas('DRAIN', 'GHOST|#6A1B9A'); 
    spriteCache.current['DRAGON'] = createPixelSpriteCanvas('DRAGON', 'BEAST|#ef4444'); 
    spriteCache.current['METAL'] = createPixelSpriteCanvas('METAL', 'SLIME|#FFD700'); 
    spriteCache.current['THIEF'] = createPixelSpriteCanvas('THIEF', 'FLIER|#5D4037'); 
    spriteCache.current['BOSS'] = createPixelSpriteCanvas('BOSS', 'BOSS|#FFD700'); 
    spriteCache.current['WEAPON'] = createPixelSpriteCanvas('WPN', 'SWORD');
    spriteCache.current['ARMOR'] = createPixelSpriteCanvas('ARM', 'SHIELD');
    spriteCache.current['RANGED'] = createPixelSpriteCanvas('RNG', 'POTION'); 
    spriteCache.current['CONSUMABLE'] = createPixelSpriteCanvas('CON', 'NOTEBOOK');
    spriteCache.current['SYNTH'] = createPixelSpriteCanvas('SYNTH', 'POTION|#FFFFFF'); 
    spriteCache.current['STAFF'] = createPixelSpriteCanvas('STAFF', 'UMBRELLA|#00BCD4'); 
    spriteCache.current['MANDRAKE'] = createPixelSpriteCanvas('MANDRAKE', 'PLANT|#33691e');
    spriteCache.current['GOLEM'] = createPixelSpriteCanvas('GOLEM', 'SKELETON|#b0bec5');
    spriteCache.current['NINJA'] = createPixelSpriteCanvas('NINJA', 'FLIER|#1a237e');
    spriteCache.current['MAGE'] = createPixelSpriteCanvas('MAGE', 'WIZARD|#7b1fa2');
    spriteCache.current['COIN'] = createPixelSpriteCanvas('COIN', 'GEM|#FFD700');
    spriteCache.current['SHOPKEEPER'] = createPixelSpriteCanvas('SHOPKEEPER', 'HUMANOID|#33691e'); 
    spriteCache.current['GOLD_BAG'] = createPixelSpriteCanvas('GOLD_BAG', 'GOLD_BAG|#FFD700');
    spriteCache.current['MAGIC_BULLET'] = createPixelSpriteCanvas('MAGIC_BULLET', 'MAGIC_BULLET|#00BCD4');
    spriteCache.current['TRAP'] = createPixelSpriteCanvas('TRAP', 'CROSS|#0f380f'); 
    spriteCache.current['ACCESSORY'] = createPixelSpriteCanvas('ACCESSORY', 'SHIELD|#FFD700'); 
    spriteCache.current['DECK_CARD'] = createPixelSpriteCanvas('DECK_CARD', 'NOTEBOOK|#FFFFFF|SKILL'); 
    const savedState = storageService.loadDungeonState2();
    if (savedState) restoreState(savedState); else startNewGame();
    return () => audioService.stopBGM();
  }, []);

  useEffect(() => { audioService.playBGM(currentTheme.bgm); }, [currentTheme.bgm]);

  const restoreState = (save: any) => {
      setMap(save.map);
      setVisitedMap(save.visitedMap || Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(false))); 
      setFloorMapRevealed(save.floorMapRevealed || false);
      roomsRef.current = save.rooms || []; 
      setPlayer(save.player);
      setEnemies(save.enemies);
      setFloorItems(save.floorItems);
      setTraps(save.traps || []);
      setInventory(save.inventory);
      setFloor(save.floor);
      setLevel(save.level);
      setBelly(save.belly);
      setMaxBelly(save.maxBelly);
      setIdMap(save.idMap);
      setIdentifiedTypes(new Set(save.identifiedTypes || [])); 
      setIsEndless(save.isEndless);
      turnCounter.current = save.turnCounter;
      if (save.dungeonDeck) {
          const hydrateCards = (cards: any[]) => cards.map(c => {
              const template = DUNGEON_CARD_DB.find(t => t.templateId === c.templateId);
              return { ...c, icon: template ? template.icon : <HelpCircle size={16}/> };
          });
          setDungeonDeck(hydrateCards(save.dungeonDeck));
          setDungeonHand(hydrateCards(save.dungeonHand));
          setDungeonDiscard(hydrateCards(save.dungeonDiscard));
      } else initDeck();
      addLog("冒険を再開した。", currentTheme.colors.C2);
  };

  const saveData = useCallback(() => {
      if (gameOver) return;
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = setTimeout(() => {
          const state = {
              map, visitedMap, floorMapRevealed, rooms: roomsRef.current, 
              player, enemies, floorItems, traps, inventory,
              floor, level, belly, maxBelly, idMap, identifiedTypes: Array.from(identifiedTypes),
              isEndless, turnCounter: turnCounter.current,
              dungeonDeck, dungeonHand, dungeonDiscard 
          };
          storageService.saveDungeonState2(state);
      }, 500); 
  }, [map, visitedMap, floorMapRevealed, player, enemies, floorItems, traps, inventory, floor, level, belly, maxBelly, idMap, identifiedTypes, isEndless, gameOver, dungeonDeck, dungeonHand, dungeonDiscard]);

  useEffect(() => {
      setVisitedMap(prev => {
          const next = prev.map(row => [...row]);
          let changed = false;
          const startX = player.x - Math.floor(VIEW_W/2);
          const startY = player.y - Math.floor(VIEW_H/2);
          for (let y = 0; y < VIEW_H; y++) {
              for (let x = 0; x < VIEW_W; x++) {
                  const mx = startX + x; const my = startY + y;
                  if (mx >= 0 && mx < MAP_W && my >= 0 && my < MAP_H) {
                      if (!next[my][mx]) { next[my][mx] = true; changed = true; }
                  }
              }
          }
          return changed ? next : prev;
      });
  }, [player.x, player.y]);

  useEffect(() => { if (!gameOver && !gameClear) saveData(); }, [player, inventory, floor, level, belly, enemies, floorItems, traps, gameOver, gameClear, saveData]);

  useEffect(() => {
      if (menuListRef.current) {
          let activeIndex = selectedItemIndex;
          if (menuOpen && synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT') activeIndex = blankScrollSelectionIndex;
          const items = menuListRef.current.children;
          if (items && items[activeIndex]) {
              (items[activeIndex] as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' }); 
          }
      }
  }, [selectedItemIndex, blankScrollSelectionIndex, menuOpen, shopState.active, shopState.mode, synthState.step]);

  useEffect(() => {
      setPlayer(p => {
          const wItem = p.equipment?.weapon; const aItem = p.equipment?.armor; const accItem = p.equipment?.accessory;
          const wPow = (wItem?.power || 0) + (wItem?.plus || 0);
          const aPow = (aItem?.power || 0) + (aItem?.plus || 0);
          const accPow = (accItem?.type === 'RING_POWER' ? (accItem.power || 0) : 0);
          const accDef = (accItem?.type === 'RING_GUARD' ? (accItem.power || 0) : 0);
          const buffDef = p.status.defenseBuff || 0;
          const buffAtk = p.status.attackBuff || 0;
          return { ...p, attack: p.baseAttack + wPow + accPow + buffAtk, defense: p.baseDefense + aPow + accDef + buffDef };
      });
  }, [player.equipment, player.status.defenseBuff, player.status.attackBuff]);

  const addVisualEffect = (type: VisualEffectType, x: number, y: number, options: Partial<VisualEffect> = {}) => {
      visualEffects.current.push({ id: Date.now() + Math.random(), type, x, y, duration: type === 'TEXT' ? 30 : 15, maxDuration: type === 'TEXT' ? 30 : 15, ...options });
  };
  const triggerShake = (duration: number) => { shake.current.duration = duration; };
  const addLog = (msg: string, color?: string) => {
    setLogs(prev => {
        const nextLogs = [...prev, { message: msg, color, id: Date.now() + Math.random() }];
        if (nextLogs.length > 20) return nextLogs.slice(nextLogs.length - 20);
        return nextLogs;
    });
  };
  const saveDungeonScore = (reason: string) => {
      const score = floor * 100 + level * 50 + (inventory.length * 10) + (player.gold || 0);
      storageService.saveDungeonScore2({ id: `dungeon-${Date.now()}`, date: Date.now(), floor: floor, level: level, score: score, reason: reason });
  };
  const initDeck = () => {
      const newDeck: DungeonCard[] = [];
      const thrustTemplate = DUNGEON_CARD_DB.find(t => t.templateId === 'THRUST')!;
      for(let i=0; i<6; i++) newDeck.push({ ...thrustTemplate, id: `card-init-thrust-${Date.now()}-${i}-${Math.random()}` });
      const spinTemplate = DUNGEON_CARD_DB.find(t => t.templateId === 'SPIN')!;
      newDeck.push({ ...spinTemplate, id: `card-init-spin-${Date.now()}-${Math.random()}` });
      const guardTemplate = DUNGEON_CARD_DB.find(t => t.templateId === 'GUARD')!;
      newDeck.push({ ...guardTemplate, id: `card-init-guard-${Date.now()}-${Math.random()}` });
      newDeck.sort(() => Math.random() - 0.5);
      const hand = newDeck.splice(0, 3);
      setDungeonHand(hand); setDungeonDeck(newDeck); setDungeonDiscard([]);
  };

  const handleCardUse = (index: number) => {
      if (gameOver || gameClear || menuOpen || shopState.active) return;
      if (index >= dungeonHand.length) return;
      const card = dungeonHand[index];
      let msg = ""; let used = false;
      const baseDmg = player.attack + card.power;
      if (card.templateId === 'JUMP') {
          const { x: dx, y: dy } = player.dir; const tx = player.x + dx * 2; const ty = player.y + dy * 2;
          if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H && map[ty][tx] !== 'WALL' && !enemies.some(e => e.x === tx && e.y === ty)) {
              addVisualEffect('WARP', player.x, player.y, { duration: 10 }); setPlayer(prev => ({...prev, x: tx, y: ty}));
              addVisualEffect('WARP', tx, ty, { duration: 10 }); msg = "大きくジャンプ！"; audioService.playSound('select'); used = true;
          } else { msg = "そこには飛べない。"; audioService.playSound('wrong'); }
      } else if (card.templateId === 'DIG') {
          const { x: dx, y: dy } = player.dir; let cx = player.x + dx; let cy = player.y + dy; let dugCount = 0; const newMap = map.map(row => [...row]); const dugPath = [];
          while (cx > 0 && cx < MAP_W-1 && cy > 0 && cy < MAP_H-1 && dugCount < 20) {
              if (newMap[cy][cx] === 'FLOOR') break;
              newMap[cy][cx] = 'FLOOR'; dugPath.push({x: cx, y: cy}); cx += dx; cy += dy; dugCount++;
          }
          if (dugCount > 0) { setMap(newMap); dugPath.forEach(p => addVisualEffect('EXPLOSION', p.x, p.y, { scale: 0.5 })); msg = "通路を掘り進んだ！"; audioService.playSound('attack'); used = true; }
          else { msg = "そこは掘れない。"; audioService.playSound('wrong'); }
      } else if (card.templateId === 'SWAP') {
          const { x: dx, y: dy } = player.dir; const tx = player.x + dx; const ty = player.y + dy; const target = enemies.find(e => e.x === tx && e.y === ty);
          if (target) {
              const px = player.x; const py = player.y; setPlayer(prev => ({...prev, x: tx, y: ty})); setEnemies(prev => prev.map(e => e.id === target.id ? {...e, x: px, y: py} : e));
              addVisualEffect('WARP', px, py); addVisualEffect('WARP', tx, ty); msg = `${target.name}と入れ替わった！`; audioService.playSound('select'); used = true;
          } else { msg = "誰もいない。"; audioService.playSound('wrong'); }
      } else if (card.templateId === 'PULL') {
          const { x: dx, y: dy } = player.dir; let target = null; let lx = player.x, ly = player.y;
          for(let i=1; i<=10; i++) {
              const tx = player.x + dx * i; const ty = player.y + dy * i;
              if (map[ty][tx] === 'WALL') break; lx = tx; ly = ty;
              const e = enemies.find(en => en.x === tx && en.y === ty);
              if (e) { target = e; break; }
          }
          if (target) {
              const destX = player.x + dx; const destY = player.y + dy;
              if (!enemies.some(e => e.x === destX && e.y === destY) && map[destY][destX] !== 'WALL') {
                  setEnemies(prev => prev.map(e => e.id === target.id ? {...e, x: destX, y: destY} : e));
                  addVisualEffect('PROJECTILE', lx, ly, { startX: player.x, startY: player.y, targetX: destX, targetY: destY, duration: 15, maxDuration: 15, itemSpriteKey: 'MAGIC_BULLET' }); msg = `${target.name}を引き寄せた！`; used = true;
              } else msg = "引き寄せられない！";
          } else msg = "誰もいない。";
      } else if (card.templateId === 'PUSH') {
          const { x: dx, y: dy } = player.dir; const tx = player.x + dx; const ty = player.y + dy; const target = enemies.find(e => e.x === tx && e.y === ty);
          if (target) {
              let ex = target.x; let ey = target.y;
              for(let i=0; i<5; i++) {
                  const nex = ex + dx; const ney = ey + dy;
                  if (map[ney][nex] !== 'WALL' && !enemies.some(e => e.x === nex && e.y === ney)) { ex = nex; ey = ney; } else break;
              }
              if (ex !== target.x || ey !== target.y) { setEnemies(prev => prev.map(e => e.id === target.id ? {...e, x: ex, y: ey} : e)); addVisualEffect('SLASH', tx, ty, { dir: player.dir }); msg = `${target.name}を吹き飛ばした！`; } else msg = "吹き飛ばなかった。";
              const dmg = Math.max(1, baseDmg - target.defense); const nhp = target.hp - dmg;
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: nhp } : e).filter(e => e.hp > 0));
              if (nhp <= 0) gainXp(target.xp); used = true;
          } else msg = "空振り。";
      } else if (card.templateId === 'EXPLOSION') {
          addVisualEffect('EXPLOSION', player.x, player.y, { scale: 3 });
          setEnemies(prev => prev.map(e => {
              if (Math.abs(e.x - player.x) <= 1 && Math.abs(e.y - player.y) <= 1) {
                  const dmg = card.power; const nhp = e.hp - dmg;
                  addVisualEffect('TEXT', e.x, e.y, { value: `${dmg}`, color: 'red' });
                  if (nhp <= 0) { gainXp(e.xp); return { ...e, hp: 0, dead: true }; }
                  return { ...e, hp: nhp };
              }
              return e;
          }).filter(e => !e.dead));
          msg = "大爆発！"; triggerShake(10); audioService.playSound('attack'); used = true;
      } else if (card.templateId === 'ROOM_ATK') {
          if (isPointInRoom(player.x, player.y)) {
              const currentRoom = roomsRef.current.find(r => player.x >= r.x && player.x < r.x + r.w && player.y >= r.y && player.y < r.y + r.h);
              if (currentRoom) {
                  addVisualEffect('FLASH', 0, 0, { color: 'white', duration: 10 });
                  setEnemies(prev => prev.map(e => {
                      if (e.x >= currentRoom.x && e.x < currentRoom.x + currentRoom.w && e.y >= currentRoom.y && e.y < currentRoom.y + currentRoom.h) {
                          const dmg = card.power; const nhp = e.hp - dmg;
                          addVisualEffect('THUNDER', e.x, e.y, { targetX: e.x, targetY: e.y });
                          if (nhp <= 0) { gainXp(e.xp); return { ...e, hp: 0, dead: true }; }
                          return { ...e, hp: nhp };
                      }
                      return e;
                  }).filter(e => !e.dead));
                  msg = "全校放送：下校時刻です！"; audioService.playSound('attack'); used = true;
              } else { msg = "部屋の外では使えない。"; audioService.playSound('wrong'); }
          } else { msg = "通路では使えない。"; audioService.playSound('wrong'); }
      } else if (card.templateId === 'THRUST') {
          const { x: dx, y: dy } = player.dir; const targets: Entity[] = [];
          for (let i=1; i<=2; i++) {
              const tx = player.x + dx * i; const ty = player.y + dy * i;
              if (map[ty][tx] === 'WALL') break; addVisualEffect('SLASH', tx, ty, { dir: player.dir });
              const target = enemies.find(e => e.x === tx && e.y === ty);
              if (target) targets.push(target);
          }
          triggerPlayerAttackAnim(player.dir);
          if (targets.length > 0) {
              setEnemies(prev => prev.map(e => {
                  if (targets.some(t => t.id === e.id)) {
                      let dmg = Math.max(1, baseDmg - e.defense); const nhp = e.hp - dmg;
                      addVisualEffect('TEXT', e.x, e.y, { value: `${dmg}`, color: 'yellow' });
                      if (nhp <= 0) { gainXp(e.xp); return { ...e, hp: 0, dead: true }; }
                      return { ...e, hp: nhp };
                  }
                  return e;
              }).filter(e => !e.dead));
              msg = targets.length > 1 ? "2枚抜き！" : `${targets[0].name}に攻撃！`; audioService.playSound('attack');
          } else { msg = "空を突いた。"; audioService.playSound('select'); }
          used = true;
      } else if (card.templateId === 'PIERCE') {
          const { x: dx, y: dy } = player.dir; const targets: Entity[] = [];
          for (let i=1; i<=8; i++) {
              const tx = player.x + dx * i; const ty = player.y + dy * i;
              if (map[ty][tx] === 'WALL') break; addVisualEffect('PROJECTILE', tx, ty, { startX: player.x, startY: player.y, targetX: tx, targetY: ty, duration: 10, maxDuration: 10, itemSpriteKey: 'MAGIC_BULLET' });
              const target = enemies.find(e => e.x === tx && e.y === ty);
              if (target) targets.push(target);
          }
          triggerPlayerAttackAnim(player.dir);
          if (targets.length > 0) {
              setEnemies(prev => prev.map(e => {
                  if (targets.some(t => t.id === e.id)) {
                      let dmg = Math.max(1, baseDmg - e.defense); const nhp = e.hp - dmg;
                      addVisualEffect('TEXT', e.x, e.y, { value: `${dmg}`, color: 'yellow' });
                      if (nhp <= 0) { gainXp(e.xp); return { ...e, hp: 0, dead: true }; }
                      return { ...e, hp: nhp };
                  }
                  return e;
              }).filter(e => !e.dead));
              msg = "貫通弾！"; audioService.playSound('attack');
          } else { msg = "空を裂いた。"; audioService.playSound('select'); }
          used = true;
      } else if (card.templateId === 'SPIN') {
          addVisualEffect('SLASH', player.x + 1, player.y, { dir: {x:1, y:0} });
          addVisualEffect('SLASH', player.x - 1, player.y, { dir: {x:-1, y:0} });
          addVisualEffect('SLASH', player.x, player.y + 1, { dir: {x:0, y:1} });
          addVisualEffect('SLASH', player.x, player.y - 1, { dir: {x:0, y:-1} });
          addVisualEffect('EXPLOSION', player.x, player.y, { scale: 1.5 });
          let hits = 0;
          setEnemies(prev => prev.map(e => {
              if (Math.abs(e.x - player.x) <= 1 && Math.abs(e.y - player.y) <= 1) {
                  let dmg = Math.max(1, baseDmg - e.defense); hits++; const nhp = e.hp - dmg;
                  addVisualEffect('TEXT', e.x, e.y, { value: `${dmg}`, color: 'yellow' });
                  if (nhp <= 0) { gainXp(e.xp); return { ...e, hp: 0, dead: true }; }
                  return { ...e, hp: nhp };
              }
              return e;
          }).filter(e => !e.dead));
          msg = hits > 0 ? "回転斬り！" : "周りに誰もいない。"; audioService.playSound('attack'); used = true;
      } else if (card.type === 'ATTACK') {
          const { x: dx, y: dy } = player.dir; let targets: {x:number, y:number}[] = [];
          if (card.templateId === 'WAVE') {
              targets = [{x: player.x+dx, y: player.y+dy}, {x: player.x+dx+dy, y: player.y+dy+dx}, {x: player.x+dx-dy, y: player.y+dy-dx}];
              targets.forEach(t => addVisualEffect('SLASH', t.x, t.y, { dir: player.dir }));
          } else if (card.templateId === 'SNIPE') {
              let hit = false;
              for(let i=1; i<=6; i++) {
                  const tx = player.x + dx*i; const ty = player.y + dy*i;
                  if (map[ty][tx] === 'WALL') break; targets.push({x:tx, y:ty});
                  if (enemies.some(e => e.x === tx && e.y === ty)) { hit = true; break; }
              }
              if (!hit) targets = []; addVisualEffect('PROJECTILE', player.x, player.y, { startX: player.x, startY: player.y, targetX: targets.length > 0 ? targets[targets.length-1].x : player.x+dx*6, targetY: targets.length > 0 ? targets[targets.length-1].y : player.y+dy*6, duration: 15, maxDuration: 15, itemSpriteKey: 'MAGIC_BULLET' });
          } else if (card.templateId === 'CROSS') {
              targets = [{x: player.x, y: player.y-1}, {x: player.x, y: player.y+1}, {x: player.x-1, y: player.y}, {x: player.x+1, y: player.y}];
              targets.forEach(t => addVisualEffect('SLASH', t.x, t.y, { dir: {x: Math.sign(t.x-player.x) as any, y: Math.sign(t.y-player.y) as any} }));
          } else if (card.templateId === 'X_ATK') {
              targets = [{x: player.x-1, y: player.y-1}, {x: player.x+1, y: player.y-1}, {x: player.x-1, y: player.y+1}, {x: player.x+1, y: player.y+1}];
              targets.forEach(t => addVisualEffect('SLASH', t.x, t.y, { dir: {x:0, y:0} }));
          } else if (card.templateId === 'DRAIN') {
              targets = [{x: player.x+dx, y: player.y+dy}]; addVisualEffect('SLASH', targets[0].x, targets[0].y, { dir: player.dir });
          } else if (card.templateId === 'FREEZE') {
              targets = [{x: player.x+dx, y: player.y+dy}]; addVisualEffect('SLASH', targets[0].x, targets[0].y, { dir: player.dir });
          } else if (card.templateId === 'EARTHQUAKE') {
              if (isPointInRoom(player.x, player.y)) {
                  const currentRoom = roomsRef.current.find(r => player.x >= r.x && player.x < r.x + r.w && player.y >= r.y && player.y < r.y + r.h);
                  if (currentRoom) {
                      addVisualEffect('THUNDER', 0, 0); triggerShake(15);
                      enemies.forEach(e => { if (e.x >= currentRoom.x && e.x < currentRoom.x + currentRoom.w && e.y >= currentRoom.y && e.y < currentRoom.y + currentRoom.h) targets.push({x:e.x, y:e.y}); });
                  }
              }
          } else { targets = [{x: player.x+dx, y: player.y+dy}]; addVisualEffect('SLASH', targets[0].x, targets[0].y, { dir: player.dir }); }
          triggerPlayerAttackAnim(player.dir);
          let hits = 0;
          setEnemies(prev => prev.map(e => {
              if (targets.some(t => t.x === e.x && t.y === e.y)) {
                  let dmg = Math.max(1, baseDmg - e.defense); if (card.templateId === 'EARTHQUAKE') dmg = Math.max(1, Math.floor(dmg / 2));
                  hits++; const nhp = e.hp - dmg; addVisualEffect('TEXT', e.x, e.y, { value: `${dmg}`, color: 'yellow' });
                  if (card.templateId === 'DRAIN') { const heal = Math.floor(dmg / 2); if (heal > 0) { setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp + heal)})); addVisualEffect('TEXT', player.x, player.y, { value: `+${heal}`, color: 'green' }); } }
                  if (card.templateId === 'FREEZE') { e.status.frozen = 5; addLog(`${e.name}は凍りついた！`); }
                  if (nhp <= 0) { gainXp(e.xp); return { ...e, hp: 0, dead: true }; }
                  return { ...e, hp: nhp };
              }
              return e;
          }).filter(e => !e.dead));
          msg = hits > 0 ? "攻撃命中！" : "空振り。"; audioService.playSound(hits > 0 ? 'attack' : 'select'); used = true;
      } else if (card.type === 'BUFF' && card.templateId === 'HEAL') {
          const heal = card.power; setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + heal) }));
          addVisualEffect('TEXT', player.x, player.y, { value: 'Heal', color: 'green' }); msg = "HP回復！"; audioService.playSound('buff'); used = true;
      } else if (card.type === 'DEFENSE') {
          setPlayer(p => ({ ...p, status: { ...p.status, defenseBuff: (p.status.defenseBuff || 0) + card.power } }));
          msg = "防御を固めた！"; audioService.playSound('block'); used = true;
      } else if (card.templateId === 'FIRE') {
          const { x: dx, y: dy } = player.dir; let tx = player.x, ty = player.y; let target = null;
          for(let i=1; i<=5; i++) { tx += dx; ty += dy; if (map[ty][tx] === 'WALL') break; const e = enemies.find(en => en.x === tx && en.y === ty); if (e) { target = e; break; } }
          addVisualEffect('BEAM', target ? target.x : player.x + dx*2, target ? target.y : player.y + dy*2, { dir: player.dir, targetX: target ? target.x : player.x+dx*5, targetY: target ? target.y : player.y+dy*5 }); 
          if (target) { const dmg = baseDmg; const nhp = target.hp - dmg; setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: nhp } : e).filter(e => e.hp > 0)); if (nhp <= 0) { gainXp(target.xp); msg = `${target.name}を燃やした！`; } else msg = `${target.name}に${dmg}ダメージ！`; } else msg = "炎を放った！";
          audioService.playSound('attack'); used = true;
      } else if (card.templateId === 'DASH') { setPlayer(p => ({ ...p, status: { ...p.status, speed: 5 } })); msg = "ダッシュ！"; used = true; 
      } else if (card.templateId === 'RAGE') { setPlayer(p => ({ ...p, status: { ...p.status, attackBuff: (p.status.attackBuff || 0) + card.power } })); msg = "攻撃力が上がった！"; audioService.playSound('buff'); used = true;
      } else if (card.templateId === 'INVINCIBLE') { setPlayer(p => ({ ...p, status: { ...p.status, defenseBuff: (p.status.defenseBuff || 0) + 999 } })); msg = "無敵状態になった！"; addVisualEffect('FLASH', 0, 0, { color: 'yellow', duration: 20 }); audioService.playSound('buff'); used = true;
      } else if (card.templateId === 'TELEPORT') {
          let attempts = 0; while (attempts < 20) { attempts++; const rx = Math.floor(Math.random() * MAP_W); const ry = Math.floor(Math.random() * MAP_H); if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry)) { setPlayer(p => ({ ...p, x: rx, y: ry })); addLog("ワープした！"); addVisualEffect('FLASH', 0, 0); break; } }
          used = true;
      } else if (card.templateId === 'DISARM') {
          addVisualEffect('FLASH', 0, 0, { color: 'blue' }); setEnemies(prev => prev.map(e => { if (Math.abs(e.x - player.x) <= 3 && Math.abs(e.y - player.y) <= 3) return { ...e, attack: Math.max(1, Math.floor(e.attack * 0.7)) }; return e; })); msg = "周囲の敵の攻撃力を下げた！"; used = true;
      } else if (card.templateId === 'POISON') {
          const { x: dx, y: dy } = player.dir; const target = enemies.find(e => e.x === player.x + dx && e.y === player.y + dy);
          if (target) { setEnemies(prev => prev.map(e => { if (e.id === target.id) { addVisualEffect('TEXT', e.x, e.y, { value: 'POISON', color: 'purple' }); return { ...e, status: { ...e.status, poison: (e.status.poison || 0) + 5 } }; } return e; })); msg = `${target.name}に毒を吐いた！`; used = true;
          } else { msg = "空振り。"; audioService.playSound('wrong'); }
      } else if (card.templateId === 'SLEEP') {
          if (isPointInRoom(player.x, player.y)) {
              const currentRoom = (roomsRef.current || []).find(r => player.x >= r.x && player.x < r.x + r.w && player.y >= r.y && player.y < r.y + r.h);
              if (currentRoom) { addVisualEffect('FLASH', 0, 0, { color: 'blue', duration: 10 }); setEnemies(prev => prev.map(e => { if (e.x >= currentRoom.x && e.x < currentRoom.x + currentRoom.w && e.y >= currentRoom.y && e.y < currentRoom.y + currentRoom.h) { addVisualEffect('TEXT', e.x, e.y, {value: 'Zzz', color:'blue'}); return { ...e, status: { ...e.status, sleep: 10 } }; } return e; })); msg = "校長の話が始まった...敵は眠った！"; audioService.playSound('buff'); used = true; } else msg = "ここでは使えない。";
          } else msg = "ここでは使えない。";
      } else if (card.templateId === 'MAGNET') {
          addVisualEffect('FLASH', 0, 0, { color: 'yellow', duration: 5 }); const newItems = floorItems.map(i => ({ ...i, x: player.x, y: player.y })); setFloorItems(newItems); msg = "アイテムを引き寄せた！"; audioService.playSound('buff'); used = true;
      } else if (card.templateId === 'MAP') { setFloorMapRevealed(true); setShowMap(true); msg = "地図をカンニングした！"; audioService.playSound('buff'); used = true;
      } else if (card.templateId === 'GAMBLE') {
          if (Math.random() < 0.5) { const gain = 100 * floor; setPlayer(p => ({...p, gold: (p.gold||0) + gain})); msg = `大吉！${gain}G手に入れた！`; audioService.playSound('win'); }
          else { const dmg = Math.floor(player.hp / 2); setPlayer(p => ({...p, hp: p.hp - dmg})); msg = `大凶...${dmg}ダメージ！`; addVisualEffect('EXPLOSION', player.x, player.y); audioService.playSound('lose'); }
          used = true;
      }
      if (used) {
          addLog(msg);
          let nextHand = [...dungeonHand]; nextHand.splice(index, 1);
          let nextDeck = [...dungeonDeck]; let nextDiscard = [...dungeonDiscard, card];
          if (nextDeck.length === 0) { if (nextDiscard.length > 0) { nextDeck = nextDiscard.sort(() => Math.random() - 0.5); nextDiscard = []; addLog("デッキ再構築！", currentTheme.colors.C2); } }
          if (nextDeck.length > 0) { const newCard = nextDeck.pop(); if (newCard) nextHand.push(newCard); }
          setDungeonHand(nextHand); setDungeonDeck(nextDeck); setDungeonDiscard(nextDiscard);
          processTurn(player.x, player.y);
      }
  };
  
  const startNewGame = () => {
    setFloor(1); setLevel(1); setBelly(100); setMaxBelly(100); setGameOver(false); setGameClear(false); setMenuOpen(false); setShopState({ active: false, merchantId: null, mode: 'BUY' }); setIsEndless(false); setShopRemovedThisFloor(false); turnCounter.current = 0; visualEffects.current = []; setIsFastForwarding(false); roomsRef.current = []; 
    const shuffledNames = [...UNIDENTIFIED_NAMES].sort(() => Math.random() - 0.5);
    const staffTypes = Object.keys(ITEM_DB).filter(k => ITEM_DB[k].category === 'STAFF');
    const newIdMap: Record<string, string> = {};
    staffTypes.forEach((t, i) => { newIdMap[t] = shuffledNames[i] || "謎の傘"; });
    setIdMap(newIdMap); setIdentifiedTypes(new Set());
    
    // 引き継ぎアイテムがある場合はそれを追加
    const initInventory: Item[] = [];
    if (inheritedItemTemplate2) {
        initInventory.push({ ...inheritedItemTemplate2, id: `inherited-${Date.now()}` });
        inheritedItemTemplate2 = null; 
    }
    initInventory.push({ ...ITEM_DB['FOOD_ONIGIRI'], id: `start-${Date.now()}` });
    initInventory.push({ ...ITEM_DB['PENCIL_SWORD'], id: `start-w-${Date.now()}` });
    setInventory(initInventory);

    setPlayer({ id: 0, type: 'PLAYER', x: 1, y: 1, char: '@', name: 'わんぱく小学生', hp: 50, maxHp: 50, baseAttack: 3, baseDefense: 0, attack: 3, defense: 0, xp: 0, gold: 0, dir: {x:0, y:1}, equipment: { weapon: null, armor: null, ranged: null, accessory: null }, status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, offset: { x: 0, y: 0 } });
    setLogs([]); initDeck(); generateFloor(1); addLog("風来の旅が始まった！");
  };

  const handleRestart = () => { 
    if (gameOver && inheritItemIdx !== null) {
        const selected = allPossessions[inheritItemIdx];
        if (selected) {
            inheritedItemTemplate2 = { ...selected };
            inheritedItemTemplate2.id = `inherited-template-${Date.now()}`;
        }
    }
    storageService.clearDungeonState2(); 
    startNewGame(); 
    setInheritItemIdx(null);
  };

  const handleQuit = () => { saveData(); onBack(); };
  const isPointInRoom = (x: number, y: number) => (roomsRef.current || []).some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  const createShopkeeper = (x: number, y: number): Entity => {
      const shopItems: Item[] = [];
      for(let i=0; i<5; i++) {
          const keys = Object.keys(ITEM_DB); const key = keys[Math.floor(Math.random() * keys.length)];
          const template = ITEM_DB[key]; const price = (template.value || 100) * (Math.random() * 0.5 + 0.8);
          shopItems.push({ ...template, id: `shop-${Date.now()}-${i}`, price: Math.floor(price), plus: 0, charges: template.maxCharges });
      }
      return { id: Date.now() + Math.random(), type: 'ENEMY', x, y, char: 'S', name: "購買部員", hp: 1000, maxHp: 1000, baseAttack: 50, baseDefense: 20, attack: 50, defense: 20, xp: 0, dir: {x:0, y:0}, enemyType: 'SHOPKEEPER', status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, offset: { x: 0, y: 0 }, shopItems };
  };

  const spawnEnemy = (x: number, y: number, floorLevel: number): Entity => {
      const r = Math.random(); let t: EnemyType = 'SLIME'; let name="敵", hp=10, atk=2, xp=5, def=0;
      const scaling = Math.floor((floorLevel - 1) * 2); const hpScale = Math.floor(floorLevel * 3); const xpScale = Math.floor(floorLevel * 1.5);
      if (floorLevel === 1) { if (r < 0.6) { t = 'SLIME'; name="スライム"; hp=10; atk=3; xp=5; } else { t = 'BAT'; name="コウモリ"; hp=8; atk=4; xp=6; } } 
      else {
          if (r < 0.20) { t = 'SLIME'; name="スライム"; hp=10+hpScale; atk=3+scaling; xp=5+xpScale; }
          else if (r < 0.35) { t = 'BAT'; name="コウモリ"; hp=8+hpScale; atk=5+scaling; xp=7+xpScale; }
          else if (r < 0.45 && floorLevel > 2) { t = 'MANDRAKE'; name="人食い植物"; hp=20+hpScale; atk=5+scaling; xp=12+xpScale; }
          else if (r < 0.60) { t = 'GHOST'; name="浮遊霊"; hp=15+hpScale; atk=4+scaling; xp=10+xpScale; def=2+Math.floor(floorLevel/2); }
          else if (r < 0.70) { t = 'THIEF'; name="トド"; hp=20+hpScale; atk=2+scaling; xp=15+xpScale; }
          else if (r < 0.80) { t = 'DRAIN'; name="くさった死体"; hp=30+hpScale; atk=6+scaling; xp=20+xpScale; }
          else if (r < 0.85 && floorLevel > 5) { t = 'NINJA'; name="忍者ごっこ"; hp=25+hpScale; atk=8+scaling; xp=25+xpScale; }
          else if (r < 0.90 && floorLevel > 7) { t = 'GOLEM'; name="人体模型"; hp=60+hpScale*1.5; atk=12+scaling; xp=40+xpScale; def=5; }
          else if (r < 0.95 && floorLevel > 10) { t = 'MAGE'; name="魔法使い"; hp=30+hpScale; atk=10+scaling; xp=35+xpScale; }
          else if (r < 0.98 && floorLevel > 4) { t = 'DRAGON'; name="ドラゴン"; hp=50+hpScale*2; atk=10+scaling*1.5; xp=50+xpScale*2; }
          else if (floorLevel > 6) { t = 'METAL'; name="メタル生徒"; hp=4+Math.floor(floorLevel/5); atk=1+scaling; xp=100+xpScale*3; def=999; }
      }
      return { id: Date.now() + Math.random(), type: 'ENEMY', x, y, char: t[0], name, hp, maxHp: hp, baseAttack: Math.floor(atk), baseDefense: Math.floor(def), attack: Math.floor(atk), defense: Math.floor(def), xp: Math.floor(xp), dir: {x:0, y:0}, enemyType: t, status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, offset: { x: 0, y: 0 } };
  };

  const generateFloor = (f: number) => {
    setShopRemovedThisFloor(false);
    const newMap: TileType[][] = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill('WALL'));
    const rooms: {x:number, y:number, w:number, h:number}[] = [];
    let attempts = 0;
    while(rooms.length < 8 && attempts < 200) {
        attempts++; const w = Math.floor(Math.random() * 4) + 4; const h = Math.floor(Math.random() * 4) + 4;
        const x = Math.floor(Math.random() * (MAP_W - w - 2)) + 1; const y = Math.floor(Math.random() * (MAP_H - h - 2)) + 1;
        const overlap = rooms.some(r => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y);
        if(!overlap) { rooms.push({x, y, w, h}); for(let ry=y; ry<y+h; ry++) { for(let rx=x; rx<x+w; rx++) newMap[ry][rx] = 'FLOOR'; } }
    }
    rooms.sort((a,b) => (a.x + a.y) - (b.x + b.y)); roomsRef.current = rooms; 
    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i]; const r2 = rooms[i+1];
        let cx = Math.floor(r1.x + r1.w/2); let cy = Math.floor(r1.y + r1.h/2);
        const tx = Math.floor(r2.x + r2.w/2); const ty = Math.floor(r2.y + r2.h/2);
        while(cx !== tx) { newMap[cy][cx] = 'FLOOR'; cx += (tx > cx) ? 1 : -1; }
        while(cy !== ty) { newMap[cy][cx] = 'FLOOR'; cy += (ty > cy) ? 1 : -1; }
    }
    if (rooms.length === 0) { const cx = Math.floor(MAP_W/2); const cy = Math.floor(MAP_H/2); rooms.push({x: cx-2, y: cy-2, w: 5, h: 5}); roomsRef.current = rooms; for(let ry=cy-2; ry<cy+3; ry++) for(let rx=cx-2; rx<cx+3; rx++) newMap[ry][rx] = 'FLOOR'; }
    let hiddenRoomRect: RoomRect | null = null;
    if (Math.random() < 0.3) {
        let hAttempts = 0;
        while(hAttempts < 50) {
            hAttempts++; const w = Math.floor(Math.random() * 3) + 3; const h = Math.floor(Math.random() * 3) + 3;
            const x = Math.floor(Math.random() * (MAP_W - w - 2)) + 1; const y = Math.floor(Math.random() * (MAP_H - h - 2)) + 1;
            const overlap = rooms.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y);
            const onCorridor = newMap[y][x] === 'FLOOR' || newMap[y+h][x+w] === 'FLOOR';
            if (!overlap && !onCorridor) { for(let ry=y; ry<y+h; ry++) { for(let rx=x; rx<x+w; rx++) newMap[ry][rx] = 'FLOOR'; } hiddenRoomRect = {x, y, w, h}; break; }
        }
    }
    const startRoom = rooms[0]; const px = Math.floor(startRoom.x + startRoom.w/2); const py = Math.floor(startRoom.y + startRoom.h/2); setPlayer(prev => ({ ...prev, x: px, y: py }));
    const newEnemies: Entity[] = []; const newItems: Entity[] = []; const newTraps: Entity[] = [];
    if (hiddenRoomRect) {
        const hr = hiddenRoomRect; const itemCount = Math.floor(Math.random() * 3) + 3;
        for(let i=0; i<itemCount; i++) {
            const hx = Math.floor(hr.x + Math.random() * hr.w); const hy = Math.floor(hr.y + Math.random() * hr.h);
            const r = Math.random();
            if (r < 0.3) newItems.push({ id: Date.now() + Math.random(), type: 'GOLD', x: hx, y: hy, char: '$', name: 'お金', hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0}, status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, gold: Math.floor(Math.random() * 200 + 50 * f) });
            else { const keys = Object.keys(ITEM_DB); const key = keys[Math.floor(Math.random() * keys.length)]; const template = ITEM_DB[key]; newItems.push({ id: Date.now() + Math.random(), type: 'ITEM', x: hx, y: hy, char: '!', name: template.name, hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0}, status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, itemData: { ...template, id: `hidden-item-${Date.now()}-${Math.random()}`, plus: template.category === 'WEAPON' || template.category === 'ARMOR' ? Math.floor(Math.random()*3)+1 : 0, charges: template.maxCharges, price: 0 } }); }
        }
    }
    const lastRoom = rooms[rooms.length - 1]; const sx = Math.floor(lastRoom.x + lastRoom.w/2); const sy = Math.floor(lastRoom.y + lastRoom.h/2);
    if (f === 20 && !isEndless) { addLog("強烈な殺気を感じる...", "red"); triggerShake(20); newEnemies.push({ id: Date.now(), type: 'ENEMY', x: sx, y: sy, char: 'B', name: "校長先生(真)", hp: 500, maxHp: 500, baseAttack: 30, baseDefense: 10, attack: 30, defense: 10, xp: 5000, dir: {x:0, y:0}, enemyType: 'BOSS', status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, offset: { x: 0, y: 0 } }); } else newMap[sy][sx] = 'STAIRS';
    const candidates: {x: number, y: number}[] = [];
    for(let y=0; y<MAP_H; y++) { for(let x=0; x<MAP_W; x++) { if (newMap[y][x] === 'FLOOR' && (x !== px || y !== py) && (x !== sx || y !== sy)) candidates.push({x, y}); } }
    candidates.sort(() => Math.random() - 0.5);
    if (f >= 2 && !isEndless && Math.random() < 0.25) {
        const shopRoomOptions = rooms.filter(r => !(px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) && !(sx >= r.x && sx < r.x + r.w && sy >= r.y && sy < r.y + r.h));
        if (shopRoomOptions.length > 0) {
            const shopRoom = shopRoomOptions[Math.floor(Math.random() * shopRoomOptions.length)];
            let shopX = -1, shopY = -1;
            for(let ry = shopRoom.y + 1; ry < shopRoom.y + shopRoom.h - 1; ry++) {
                for(let rx = shopRoom.x + 1; rx < shopRoom.x + shopRoom.w - 1; rx++) {
                    const neighbors = [{x:rx, y:ry-1}, {x:rx, y:ry+1}, {x:rx-1, y:ry}, {x:rx+1, y:ry}, {x:rx-1, y:ry-1}, {x:rx+1, y:ry-1}, {x:rx-1, y:ry+1}, {x:rx+1, y:ry+1}];
                    if (neighbors.every(n => newMap[n.y][n.x] === 'FLOOR')) { shopX = rx; shopY = ry; break; }
                }
                if (shopX !== -1) break;
            }
            if (shopX !== -1) { newEnemies.push(createShopkeeper(shopX, shopY)); const cIdx = candidates.findIndex(c => c.x === shopX && c.y === shopY); if (cIdx !== -1) candidates.splice(cIdx, 1); }
        }
    }
    const enemyCount = Math.floor(candidates.length * 0.05);
    for (let i = 0; i < enemyCount; i++) { const t = candidates.pop(); if (t) newEnemies.push(spawnEnemy(t.x, t.y, f)); }
    const itemCount = Math.floor(Math.random() * 4) + 5; const spawnTypes: ('CARD' | 'GOLD' | 'ITEM')[] = ['CARD'];
    for(let i = 1; i < itemCount; i++) spawnTypes.push(Math.random() < 0.25 ? 'GOLD' : 'ITEM');
    spawnTypes.sort(() => Math.random() - 0.5);
    for (const type of spawnTypes) {
        const t = candidates.pop();
        if (t) {
            if (type === 'GOLD') newItems.push({ id: Date.now() + Math.random(), type: 'GOLD', x: t.x, y: t.y, char: '$', name: 'お金', hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0}, status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, gold: Math.floor(Math.random() * 50 + 10 * f) });
            else if (type === 'CARD') { const cardTemplate = DUNGEON_CARD_DB[Math.floor(Math.random() * DUNGEON_CARD_DB.length)]; newItems.push({ id: Date.now() + Math.random(), type: 'ITEM', x: t.x, y: t.y, char: 'C', name: cardTemplate.name, hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0}, status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, itemData: { id: `card-drop-${Date.now()}-${Math.random()}`, category: 'DECK_CARD', type: cardTemplate.templateId, name: cardTemplate.name, desc: cardTemplate.description, value: 0 } }); }
            else { const keys = Object.keys(ITEM_DB); const key = keys[Math.floor(Math.random() * keys.length)]; const template = ITEM_DB[key]; let plus = 0; let charges = template.maxCharges || 0; if ((template.category === 'WEAPON' || template.category === 'ARMOR' || template.category === 'ACCESSORY') && Math.random() < 0.2) plus = Math.floor(Math.random() * 2) + 1; if (template.category === 'STAFF') charges = Math.floor(Math.random() * 4) + 2; newItems.push({ id: Date.now() + Math.random(), type: 'ITEM', x: t.x, y: t.y, char: '!', name: template.name, hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0}, status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, itemData: { ...template, id: `item-${Date.now()}-${Math.random()}`, plus, charges, name: plus > 0 ? `${template.name}+${plus}` : template.name, price: Math.floor((template.value || 100) * 0.5) } }); }
        }
    }
    const roomCandidates = candidates.filter(c => isPointInRoom(c.x, c.y)); const trapCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < trapCount; i++) { const t = roomCandidates.pop(); if (t) { const trapTypes: TrapType[] = ['BOMB', 'SLEEP', 'POISON', 'WARP', 'RUST', 'SUMMON']; const tType = trapTypes[Math.floor(Math.random() * trapTypes.length)]; newTraps.push({ id: Date.now() + Math.random(), type: 'TRAP', x: t.x, y: t.y, char: 'X', name: '罠', hp: 0, maxHp: 0, baseAttack: 0, baseDefense: 0, attack: 0, defense: 0, xp: 0, dir: {x:0, y:0}, status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, trapType: tType, visible: false }); } }
    setMap(newMap); setVisitedMap(Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(false))); setFloorMapRevealed(false);
    setVisitedMap(prev => { const next = prev.map(row => [...row]); const startX = px - Math.floor(VIEW_W/2); const startY = py - Math.floor(VIEW_H/2); for(let y=0; y<VIEW_H; y++){ for(let x=0; x<VIEW_W; x++){ const mx = startX + x; const my = startY + y; if(mx>=0 && mx<MAP_W && my>=0 && my<MAP_H) next[my][mx] = true; } } return next; });
    setEnemies(newEnemies); setFloorItems(newItems); setTraps(newTraps); setShowMap(false); addVisualEffect('FLASH', 0, 0, {duration: 10, maxDuration: 10});
  };

  const gainXp = (amount: number) => {
      let nextXp = player.xp + amount; let nextLv = level; let nextMaxHp = player.maxHp; let nextAtk = player.baseAttack; const needed = nextLv * 10;
      if (nextXp >= needed) { nextXp -= needed; nextLv++; nextMaxHp += 5; nextAtk += 1; setPlayer(p => ({ ...p, hp: nextMaxHp, baseAttack: nextAtk, maxHp: nextMaxHp })); addLog(`レベルが${nextLv}に上がった！`); audioService.playSound('buff'); addVisualEffect('FLASH', 0, 0); addVisualEffect('TEXT', player.x, player.y, { value: 'LEVEL UP!', color: currentTheme.colors.C3 }); }
      setPlayer(p => ({ ...p, xp: nextXp })); setLevel(nextLv);
  };

  const processTurn = (px: number, py: number, overrides?: { belly?: number, hp?: number }) => {
      turnCounter.current += 1;
      const aType = player.equipment?.armor?.type; const heavy = aType === 'RANDO_SERU'; const accType = player.equipment?.accessory?.type; const isHungerResist = accType === 'RING_HUNGER'; const isHealRing = accType === 'RING_HEAL';
      let hungerRate = heavy ? 0.5 : 1; if (isHungerResist) hungerRate *= 0.5; if (isHealRing) hungerRate *= 2; 
      const interval = Math.floor(HUNGER_INTERVAL / hungerRate); const isHungerTurn = turnCounter.current % Math.max(1, interval) === 0;
      const regenSpeed = isHealRing ? Math.floor(REGEN_INTERVAL / 2) : REGEN_INTERVAL; const isRegenTurn = turnCounter.current % regenSpeed === 0;
      let currentBelly = overrides?.belly !== undefined ? overrides.belly : belly;
      if (isHungerTurn) currentBelly -= 1;
      let starveDamage = 0; if (currentBelly <= 0) { currentBelly = 0; starveDamage = 1; }
      setBelly(currentBelly);
      setPlayer(prevPlayer => {
          let currentHp = overrides?.hp !== undefined ? overrides.hp : prevPlayer.hp; let nextStatus = { ...prevPlayer.status };
          if (nextStatus.defenseBuff && nextStatus.defenseBuff > 0) nextStatus.defenseBuff = Math.max(0, nextStatus.defenseBuff - 2); 
          if (nextStatus.attackBuff && nextStatus.attackBuff > 0) nextStatus.attackBuff = Math.max(0, nextStatus.attackBuff - 2);
          if (nextStatus.trapSight && nextStatus.trapSight > 0) { nextStatus.trapSight--; if (nextStatus.trapSight === 0) addLog("罠が見えなくなった。", currentTheme.colors.C2); }
          if (nextStatus.poison && nextStatus.poison > 0) { const poisonDmg = 5; currentHp -= poisonDmg; nextStatus.poison--; addVisualEffect('TEXT', px, py, { value: `${poisonDmg}`, color: 'purple' }); addLog("毒のダメージを受けた！", "purple"); if (nextStatus.poison === 0) addLog("毒が消えた。", currentTheme.colors.C2); }
          if (starveDamage > 0) { currentHp -= 1; if (currentHp <= 0) { setGameOver(true); saveDungeonScore("Starved"); storageService.clearDungeonState2(); } else { if (turnCounter.current % 5 === 0) addLog("お腹が空いて倒れそうだ...", "red"); } } 
          else if (isRegenTurn && currentHp < prevPlayer.maxHp && currentHp > 0) currentHp += 1;
          if (nextStatus.sleep > 0) { nextStatus.sleep--; if (nextStatus.sleep<=0) addLog("目が覚めた！"); }
          if (nextStatus.confused > 0) nextStatus.confused--;
          if (nextStatus.blind > 0) nextStatus.blind--;
          if (nextStatus.frozen > 0) nextStatus.frozen--;
          if (nextStatus.speed > 0) nextStatus.speed--; 
          currentHp = Math.min(prevPlayer.maxHp, currentHp);
          return { ...prevPlayer, hp: currentHp, status: nextStatus };
      });
      if (turnCounter.current % ENEMY_SPAWN_RATE === 0) {
          let attempts = 0;
          while (attempts < 5) {
              attempts++; const rx = Math.floor(Math.random() * MAP_W); const ry = Math.floor(Math.random() * MAP_H);
              if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry) && (rx !== px || ry !== py)) { setEnemies(prev => [...prev, spawnEnemy(rx, ry, floor)]); break; }
          }
      }
      const dMap = computeDijkstraMap(map, px, py);
      setEnemies(prevEnemies => {
          if (player.status.speed > 0 && turnCounter.current % 2 !== 0) return prevEnemies;
          const nextEnemies: Entity[] = []; const occupied = new Set<string>(); occupied.add(`${px},${py}`); const attackingEnemyIds: number[] = [];
          for (const e of prevEnemies) {
              if (e.status.poison && e.status.poison > 0) { const poisonDmg = 5; const nhp = e.hp - poisonDmg; e.status.poison--; addVisualEffect('TEXT', e.x, e.y, { value: `${poisonDmg}`, color: 'purple' }); if (nhp <= 0) { gainXp(e.xp); continue; } e.hp = nhp; }
              if (e.enemyType === 'SHOPKEEPER') { occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); continue; }
              if (e.status.sleep > 0) { e.status.sleep--; nextEnemies.push(e); occupied.add(`${e.x},${e.y}`); addVisualEffect('TEXT', e.x, e.y, {value:'Zzz', color:currentTheme.colors.C3}); continue; }
              if (e.status.frozen > 0) { e.status.frozen--; nextEnemies.push(e); occupied.add(`${e.x},${e.y}`); continue; }
              const dx = px - e.x; const dy = py - e.y; const dist = Math.abs(dx) + Math.abs(dy);
              if (e.enemyType === 'DRAGON' && dist <= 2 && dist > 0 && Math.random() < 0.3) { addLog(`${e.name}の炎！`, "red"); let dmg = 15; if (player.equipment?.armor?.type === 'FIREFIGHTER') dmg = Math.floor(dmg / 2); setPlayer(p => { const nhp = p.hp - dmg; if(nhp<=0) { setGameOver(true); saveDungeonScore(`Killed by ${e.name}`); storageService.clearDungeonState2(); } return {...p, hp:nhp}; }); occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); addVisualEffect('EXPLOSION', px, py); addVisualEffect('TEXT', px, py, { value: `${dmg}`, color: 'red' }); continue; }
              if (e.enemyType === 'MAGE' && dist <= 4 && dist > 0 && Math.random() < 0.2) { addLog(`${e.name}の魔法！混乱した！`, "yellow"); setPlayer(p => ({ ...p, status: { ...p.status, confused: 5 } })); occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); addVisualEffect('FLASH', px, py); continue; }
              let tx = e.x; let ty = e.y; let moved = false;
              if (e.status.confused > 0) { e.status.confused--; const dirs = [[0,1], [0,-1], [1,0], [-1,0]]; const r = dirs[Math.floor(Math.random()*4)]; tx = e.x + r[0]; ty = e.y + r[1]; moved = true; } 
              else if (dist <= 15) {
                  const neighbors = [{x:e.x, y:e.y-1}, {x:e.x, y:e.y+1}, {x:e.x-1, y:e.y}, {x:e.x+1, y:e.y}, {x:e.x-1, y:e.y-1}, {x:e.x+1, y:e.y-1}, {x:e.x-1, y:e.y+1}, {x:e.x+1, y:e.y+1}];
                  let bestDist = dMap[e.y][e.x]; let bestMove = null;
                  for (const n of neighbors) {
                      if (n.x >= 0 && n.x < MAP_W && n.y >= 0 && n.y < MAP_H && map[n.y][n.x] !== 'WALL') {
                          const dx = n.x - e.x; const dy = n.y - e.y;
                          if (dx !== 0 && dy !== 0) { if (map[e.y][e.x + dx] === 'WALL' || map[e.y + dy][e.x] === 'WALL') continue; }
                          if (!occupied.has(`${n.x},${n.y}`) || (n.x === px && n.y === py)) { if (dMap[n.y][n.x] < bestDist) { bestDist = dMap[n.y][n.x]; bestMove = n; } }
                      }
                  }
                  if (bestMove) { tx = bestMove.x; ty = bestMove.y; moved = true; }
              }
              if (tx === px && ty === py) {
                  let dmg = Math.max(1, e.attack - player.defense); if (player.equipment?.armor?.type === 'GYM_CLOTHES' && Math.random() < 0.3) { addLog("ひらりと身をかわした！", currentTheme.colors.C2); dmg = 0; addVisualEffect('TEXT', px, py, { value: 'MISS', color: currentTheme.colors.C3 }); }
                  if (player.equipment?.armor?.type === 'NAME_TAG' && e.enemyType === 'THIEF') addLog("名札が盗みを防いだ！");
                  else if (e.enemyType === 'THIEF' && dmg > 0 && Math.random() < 0.3 && inventory.length > 0) { addLog("アイテムを盗まれた！", "red"); const idx = Math.floor(Math.random() * inventory.length); setInventory(inv => inv.filter((_, i) => i !== idx)); }
                  if (dmg > 0) { addLog(`${e.name}の攻撃！${dmg}ダメージ！`, "red"); setPlayer(p => { const newHp = p.hp - dmg; if (newHp <= 0) { setGameOver(true); saveDungeonScore(`Killed by ${e.name}`); storageService.clearDungeonState2(); } return { ...p, hp: newHp }; }); nextEnemies.push({ ...e, offset: { x: (tx - e.x) * 6, y: (ty - e.y) * 6 } }); attackingEnemyIds.push(e.id); triggerShake(5); addVisualEffect('TEXT', px, py, { value: `${dmg}`, color: 'red' }); } else nextEnemies.push(e);
                  occupied.add(`${e.x},${e.y}`);
              } else if (moved) { if (!map[ty][tx] || map[ty][tx] === 'WALL' || occupied.has(`${tx},${ty}`) || prevEnemies.some(o => o.id !== e.id && o.x === tx && o.y === ty)) { occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); } else { occupied.add(`${tx},${ty}`); nextEnemies.push({ ...e, x: tx, y: ty }); } } else { occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); }
          }
          if (attackingEnemyIds.length > 0) setTimeout(() => setEnemies(curr => curr.map(en => attackingEnemyIds.includes(en.id) ? { ...en, offset: { x: 0, y: 0 } } : en)), 150);
          return nextEnemies;
      });
  };

  const handleMathComplete = (correctCount: number) => {
      setShowMathChallenge(false); const nextFloor = floor + 1;
      if (correctCount >= 3) { const recovery = 10; setBelly(prev => Math.min(maxBelly, prev + recovery)); addLog(`計算全問正解！満腹度が${recovery}回復した！`, "green"); audioService.playSound('buff'); } 
      else if (correctCount > 0) addLog(`${correctCount}問正解。`);
      setFloor(nextFloor); generateFloor(nextFloor);
      const nextTheme = getTheme(nextFloor); audioService.playBGM(nextTheme.bgm);
  };

  const movePlayer = (dx: 0|1|-1, dy: 0|1|-1) => {
      if(gameOver || gameClear) return;
      if (shopState.active) { if (dy !== 0) { const shopkeeper = enemies.find(e => e.id === shopState.merchantId); const listLength = shopState.mode === 'BUY' ? (shopkeeper?.shopItems?.length || 0) : inventory.length; setSelectedItemIndex(prev => Math.max(0, Math.min(listLength - 1, prev + dy))); audioService.playSound('select'); } return; }
      if (menuOpen) {
          if (dy !== 0) {
              if (synthState.active && synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT') {
                  const knownCount = Array.from(identifiedTypes).filter((t: any) => (t as string).startsWith('SCROLL')).length;
                  if (knownCount > 0) setBlankScrollSelectionIndex(prev => Math.max(0, Math.min(knownCount - 1, prev + dy)));
              } else if (inventory.length > 0) {
                  setSelectedItemIndex(prev => Math.max(0, Math.min(inventory.length - 1, prev + dy)));
              }
              audioService.playSound('select');
          }
          return;
      }
      if (deckViewMode === 'REMOVE' && showDeck) return; 
      if(dx === 0 && dy === 0) { addLog("足踏みした。"); processTurn(player.x, player.y); return; }
      setPlayer(p => ({ ...p, dir: {x: dx, y: dy} }));
      let tx = player.x + dx; let ty = player.y + dy;
      if (player.status.confused > 0) { if (Math.random() < 0.5) { const dirs = [[0,1], [0,-1], [1,0], [-1,0]]; const r = dirs[Math.floor(Math.random()*4)]; tx = player.x + r[0]; ty = player.y + r[1]; addLog("混乱してふらついた！", "yellow"); } }
      const rdx = tx - player.x; const rdy = ty - player.y;
      if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H || map[ty][tx] === 'WALL') return;
      if (rdx !== 0 && rdy !== 0) { if (map[player.y][player.x + rdx] === 'WALL' || map[player.y + rdy][player.x] === 'WALL') return; }
      const target = enemies.find(e => e.x === tx && e.y === ty);
      if (target) { if (target.enemyType === 'SHOPKEEPER') { addLog("「へいらっしゃい！何にする？」", currentTheme.colors.C2); setShopState({ active: true, merchantId: target.id, mode: 'BUY' }); setSelectedItemIndex(0); audioService.playSound('select'); } else { attackEnemy(target); processTurn(player.x, player.y); } return; }
      let finalX = tx; let finalY = ty; setPlayer(p => ({ ...p, x: finalX, y: finalY }));
      setVisitedMap(prev => { const next = prev.map(row => [...row]); let changed = false; const startX = finalX - Math.floor(VIEW_W/2); const startY = finalY - Math.floor(VIEW_H/2); for (let y = 0; y < VIEW_H; y++) { for (let x = 0; x < VIEW_W; x++) { const mx = startX + x; const my = startY + y; if (mx >= 0 && mx < MAP_W && my >= 0 && my < MAP_H) { if (!next[my][mx]) { next[my][mx] = true; changed = true; } } } } return changed ? next : prev; });
      const trap = traps.find(t => t.x === finalX && t.y === finalY);
      if (trap) { if (trap.visible) { addLog(`${trap.name}を踏んでしまった！`, "red"); activateTrap(trap); } else { addLog("罠だ！", "red"); trap.visible = true; activateTrap(trap); } }
      const itemIdx = floorItems.findIndex(i => i.x === finalX && i.y === finalY);
      if (itemIdx !== -1) {
          const itemEntity = floorItems[itemIdx];
          if (itemEntity.type === 'GOLD') { const amount = itemEntity.gold || 0; setPlayer(p => ({ ...p, gold: (p.gold || 0) + amount })); addLog(`${amount}円を拾った！`, "yellow"); setFloorItems(prev => prev.filter((_, i) => i !== itemIdx)); audioService.playSound('select'); } 
          else if (itemEntity.itemData) {
              const item = itemEntity.itemData;
              if (item.category === 'DECK_CARD') { const template = DUNGEON_CARD_DB.find(t => t.templateId === item.type); if (template) { const newCard: DungeonCard = { ...template, id: `card-loot-${Date.now()}` }; setDungeonDeck(prev => [...prev, newCard]); addLog(`${item.name}のカードを拾った！`, "yellow"); setFloorItems(prev => prev.filter((_, i) => i !== itemIdx)); audioService.playSound('buff'); } } 
              else { if (inventory.length < MAX_INVENTORY) { setInventory(prev => [...prev, item]); addLog(`${getItemName(item)}を拾った！`); setFloorItems(prev => prev.filter((_, i) => i !== itemIdx)); audioService.playSound('select'); } else addLog("持ち物がいっぱいで拾えない！", "red"); }
          }
      }
      if (map[ty][tx] === 'STAIRS') addLog("階段がある。", currentTheme.colors.C2);
      processTurn(finalX, finalY);
  };

  const handleActionBtn = () => {
      if (gameOver) { handleRestart(); return; }
      if (gameClear) return;
      if (shopState.active) { handleShopAction(); return; }
      if (menuOpen) { if (synthState.active) handleSynthesisStep(); else if (inventory.length > 0) handleItemAction(selectedItemIndex); return; }
      if (map[player.y][player.x] === 'STAIRS') { addLog("階段を降りる..."); audioService.playSound('select'); setShowMathChallenge(true); return; }
      const tx = player.x + player.dir.x; const ty = player.y + player.dir.y; const target = enemies.find(e => e.x === tx && e.y === ty);
      if (target) { if (target.enemyType === 'SHOPKEEPER') { addLog("「へいらっしゃい！何にする？」", currentTheme.colors.C2); setShopState({ active: true, merchantId: target.id, mode: 'BUY' }); setSelectedItemIndex(0); audioService.playSound('select'); } else { attackEnemy(target); processTurn(player.x, player.y); } return; }
      triggerPlayerAttackAnim(player.dir); addVisualEffect('SLASH', tx, ty, { dir: player.dir }); addLog("素振りをした。"); audioService.playSound('select'); processTurn(player.x, player.y);
  };

  const activateTrap = (trap: Entity) => {
      audioService.playSound('wrong'); const t = trap.trapType;
      if (t === 'BOMB') { addLog("爆発した！", "red"); addVisualEffect('EXPLOSION', player.x, player.y); let dmg = 20; if (player.equipment?.armor?.type === 'DISASTER_HOOD') dmg = Math.floor(dmg / 2); setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - dmg) })); if (player.hp - dmg <= 0) { setGameOver(true); saveDungeonScore("Killed by Bomb Trap"); storageService.clearDungeonState2(); } } 
      else if (t === 'SLEEP') { addLog("眠ってしまった...", "blue"); setPlayer(p => ({ ...p, status: { ...p.status, sleep: 5 } })); addVisualEffect('TEXT', player.x, player.y, { value: 'Zzz', color: 'blue' }); } 
      else if (t === 'POISON') { addLog("毒を受けた！", "purple"); setBelly(prev => Math.max(0, prev - 20)); } 
      else if (t === 'WARP') { addLog("ワープした！", "yellow"); addVisualEffect('WARP', player.x, player.y); let attempts = 0; while (attempts < 20) { attempts++; const rx = Math.floor(Math.random() * MAP_W); const ry = Math.floor(Math.random() * MAP_H); if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry)) { setPlayer(p => ({ ...p, x: rx, y: ry })); break; } } } 
      else if (t === 'RUST') {
          addLog("装備がサビてしまった！", "red");
          setPlayer(p => {
              const eq = { ...p.equipment }; let msg = "";
              if (eq.weapon && eq.weapon.type !== 'STAINLESS_PEN' && eq.weapon.type !== 'GOLD_BADGE') { const newPlus = Math.max(-3, (eq.weapon.plus || 0) - 1); eq.weapon = { ...eq.weapon, plus: newPlus, name: eq.weapon.name.split('+')[0] + (newPlus!==0 ? (newPlus>0 ? `+${newPlus}` : `${newPlus}`) : '') }; msg += "武器"; }
              if (eq.armor && eq.armor.type !== 'GOLD_BADGE' && eq.armor.type !== 'VINYL_APRON') { const newPlus = Math.max(-3, (eq.armor.plus || 0) - 1); eq.armor = { ...eq.armor, plus: newPlus, name: eq.armor.name.split('+')[0] + (newPlus!==0 ? (newPlus>0 ? `+${newPlus}` : `${newPlus}`) : '') }; msg += msg ? "と防具" : "防具"; }
              if (msg) addLog(`${msg}の強さが下がった...`); return { ...p, equipment: eq };
          });
      } else if (t === 'SUMMON') {
          addLog("モンスターハウスだ！", "red"); addVisualEffect('FLASH', 0, 0, { color: 'red', duration: 10 }); const newEnemies = [];
          for (let i=0; i<3; i++) { let attempts = 0; while (attempts < 10) { attempts++; const rx = player.x + Math.floor(Math.random()*5 - 2); const ry = player.y + Math.floor(Math.random()*5 - 2); if (rx>=0 && rx<MAP_W && ry>=0 && ry<MAP_H && map[ry][rx] === 'FLOOR' && !enemies.find(e=>e.x===rx&&e.y===ry)) { newEnemies.push(spawnEnemy(rx, ry, floor)); break; } } }
          setEnemies(prev => [...prev, ...newEnemies]);
      }
  };

  const getItemName = (item: Item) => { if (item.category === 'WEAPON' || item.category === 'ARMOR' || item.category === 'RANGED' || item.category === 'SYNTH' || item.category === 'CONSUMABLE' || item.category === 'ACCESSORY' || item.category === 'DECK_CARD') return item.name; if (item.type.includes('MEAT')) return item.name; if (identifiedTypes.has(item.type)) return item.name; return idMap[item.type] || item.name; };
  const fireRangedWeapon = () => {
      if (menuOpen || shopState.active) return; const rangedItem = player.equipment?.ranged;
      if (!rangedItem) { addLog("飛び道具を装備していない！"); return; }
      if ((rangedItem.count || 0) <= 0) { addLog(`${rangedItem.name}が無くなった！`); setPlayer(p => ({ ...p, equipment: { ...p.equipment!, ranged: null } })); return; }
      const newRanged = { ...rangedItem, count: (rangedItem.count || 0) - 1 }; setPlayer(p => ({ ...p, equipment: { ...p.equipment!, ranged: newRanged } }));
      const { x: dx, y: dy } = player.dir; let lx = player.x, ly = player.y; let hitEntity: Entity | null = null;
      for (let i=1; i<=8; i++) { const tx = player.x + dx * i; const ty = player.y + dy * i; lx = tx; ly = ty; if (map[ty][tx] === 'WALL') { addLog("壁に当たった。"); break; } const target = enemies.find(e => e.x === tx && e.y === ty); if (target) { hitEntity = target; break; } }
      
      const itemSpriteKey = rangedItem.category === 'WEAPON' ? 'WEAPON' : (rangedItem.category === 'ARMOR' ? 'ARMOR' : (rangedItem.category === 'STAFF' ? 'STAFF' : 'RANGED'));
      addVisualEffect('PROJECTILE', lx, ly, { startX: player.x, startY: player.y, targetX: lx, targetY: ly, duration: 15, maxDuration: 15, itemSpriteKey });
      triggerPlayerAttackAnim(player.dir);
      if (hitEntity) {
          let dmg = 5 + (newRanged.power || 0); if (newRanged.type === 'SHADOW_PIN') { hitEntity.status.frozen = 5; addLog("影を縫いつけた！"); }
          const newEnemies = enemies.map(e => { if (e.id === hitEntity!.id) { const nhp = e.hp - dmg; return { ...e, hp: nhp }; } return e; });
          const dead = newEnemies.find(e => e.id === hitEntity!.id && e.hp <= 0); if(dead) { gainXp(dead.xp); addLog(`${dead.name}をたおした！`); } else { addLog(`${hitEntity.name}に${dmg}ダメージ！`); addVisualEffect('TEXT', hitEntity.x, hitEntity.y, {value:`${dmg}`}); } setEnemies(newEnemies.filter(e => e.hp > 0)); audioService.playSound('attack');
      } else addLog("はずした！");
      processTurn(player.x, player.y);
  };

  const handleShopAction = (indexOverride?: number) => {
      const shopkeeper = enemies.find(e => e.id === shopState.merchantId); if (!shopkeeper) { setShopState(prev => ({ ...prev, active: false })); return; }
      const idx = indexOverride !== undefined ? indexOverride : selectedItemIndex;
      if (shopState.mode === 'BUY') {
          if (!shopkeeper.shopItems || shopkeeper.shopItems.length === 0) return; const item = shopkeeper.shopItems[idx]; if (!item) return;
          if ((player.gold || 0) >= (item.price || 0)) {
              if (inventory.length < MAX_INVENTORY) { setPlayer(p => ({ ...p, gold: (p.gold || 0) - (item.price || 0) })); setInventory(prev => [...prev, item]); const newShopItems = shopkeeper.shopItems.filter((_, i) => i !== idx); setEnemies(prev => prev.map(e => e.id === shopkeeper.id ? { ...e, shopItems: newShopItems } : e)); addLog(`${getItemName(item)}を買った！`, currentTheme.colors.C2); audioService.playSound('buff'); if (newShopItems.length === 0) setShopState(prev => ({ ...prev, active: false })); else setSelectedItemIndex(prev => Math.min(prev, newShopItems.length - 1)); } 
              else { addLog("持ち物がいっぱいで拾えない！", "red"); audioService.playSound('wrong'); }
          } else { addLog("お金が足りない！", "red"); audioService.playSound('wrong'); }
      } else {
          if (inventory.length === 0) return; const item = inventory[idx]; if (!item) return;
          if (player.equipment?.weapon === item || player.equipment?.armor === item || player.equipment?.ranged === item || player.equipment?.accessory === item) { addLog("装備中のアイテムは売れません。", "red"); audioService.playSound('wrong'); return; }
          const sellPrice = Math.max(1, Math.floor((item.value || 100) / 2)); setPlayer(p => ({ ...p, gold: (p.gold || 0) + sellPrice })); setInventory(prev => prev.filter((_, i) => i !== idx)); addLog(`${getItemName(item)}を${sellPrice}円で売った。`, currentTheme.colors.C2); audioService.playSound('select'); setSelectedItemIndex(prev => Math.max(0, Math.min(prev, inventory.length - 2)));
      }
  };

  const handleCardRemoval = (cardId: string) => {
      if ((player.gold || 0) >= 100) { setPlayer(p => ({ ...p, gold: (p.gold || 0) - 100 })); setDungeonDeck(prev => prev.filter(c => c.id !== cardId)); setDungeonHand(prev => prev.filter(c => c.id !== cardId)); setDungeonDiscard(prev => prev.filter(c => c.id !== cardId)); setShopRemovedThisFloor(true); setDeckViewMode('VIEW'); setShowDeck(false); addLog("カードを除外した。", currentTheme.colors.C2); audioService.playSound('select'); } 
      else { addLog("お金が足りない！", "red"); audioService.playSound('wrong'); }
  };

  const triggerPlayerAttackAnim = (dir: Direction) => { const shift = 6; setPlayer(p => ({ ...p, offset: { x: dir.x * shift, y: dir.y * shift } })); setTimeout(() => setPlayer(p => ({ ...p, offset: { x: 0, y: 0 } })), 100); };
  const attackEnemy = (target: Entity) => {
      triggerPlayerAttackAnim(player.dir); const targets = [target]; addVisualEffect('SLASH', target.x, target.y, { dir: player.dir });
      if (player.equipment?.weapon?.type === 'PROTRACTOR_EDGE') {
          const {x: dx, y: dy} = player.dir; const others = [];
          if (dx === 0 && dy === -1) others.push({x: -1, y: -1}, {x: 1, y: -1}); else if (dx === 0 && dy === 1) others.push({x: 1, y: 1}, {x: -1, y: 1}); else if (dx === -1 && dy === 0) others.push({x: -1, y: 1}, {x: -1, y: -1}); else if (dx === 1 && dy === 0) others.push({x: 1, y: -1}, {x: 1, y: 1}); else if (dx === -1 && dy === -1) others.push({x: 0, y: -1}, {x: -1, y: 0}); else if (dx === 1 && dy === -1) others.push({x: 0, y: -1}, {x: 1, y: 0}); else if (dx === -1 && dy === 1) others.push({x: -1, y: 0}, {x: 0, y: 1}); else if (dx === 1 && dy === 1) others.push({x: 1, y: 0}, {x: 0, y: 1}); 
          others.forEach(offset => { const tx = player.x + offset.x; const ty = player.y + offset.y; addVisualEffect('SLASH', tx, ty, { dir: offset as Direction }); addVisualEffect('EXPLOSION', tx, ty, { duration: 10, maxDuration: 10, scale: 0.5 }); const t = enemies.find(e => e.x === tx && e.y === ty); if (t) targets.push(t); });
      }
      let newEnemies = [...enemies];
      targets.forEach(t => {
          let dmg = Math.max(1, player.attack - t.defense); const wType = player.equipment?.weapon?.type;
          if (wType === 'OFUDA_RULER' && t.enemyType === 'GHOST') { dmg = Math.floor(dmg * 1.5); addLog("成仏！", "yellow"); } if (wType === 'VITAMIN_INJECT' && t.enemyType === 'DRAIN') { dmg = Math.floor(dmg * 1.5); addLog("特効！", "yellow"); } if (wType === 'STAINLESS_PEN' && t.enemyType === 'METAL') dmg = 1; if (wType === 'RICH_WATCH' && player.gold && player.gold >= 10) { dmg += 10; setPlayer(p => ({...p, gold: (p.gold||0) - 10})); } if (Math.random() < 0.1) { dmg *= 2; addLog("会心の一撃！", "red"); triggerShake(5); }
          newEnemies = newEnemies.map(e => { if (e.id === t.id) { const nhp = e.hp - dmg; addLog(`${e.name}に${dmg}ダメージ！`); addVisualEffect('TEXT', e.x, e.y, { value: `${dmg}`, color: 'white' }); if (nhp <= 0 && wType === 'LADLE' && Math.random() < 0.3) { const meat = { ...ITEM_DB['FOOD_MEAT'], name: `${e.name}の肉`, value: 100, id: `meat-${Date.now()}` }; setFloorItems(prev => [...prev, { id: Date.now()+Math.random(), type:'ITEM', x: e.x, y: e.y, char: '!', name: meat.name, hp:0,maxHp:0,baseAttack:0,baseDefense:0,attack:0,defense:0,xp:0,dir:{x:0,y:0}, status:e.status, itemData: meat }]); addLog(`${e.name}を肉に変えた！`, currentTheme.colors.C2); } return { ...e, hp: nhp }; } return e; });
      });
      const deads = newEnemies.filter(e => e.hp <= 0); deads.forEach(d => { if (d.enemyType === 'BOSS') { setGameClear(true); audioService.playSound('win'); saveDungeonScore("Cleared"); storageService.clearDungeonState2(); addVisualEffect('FLASH', 0, 0, { duration: 30, maxDuration: 30 }); } else { addLog(`${d.name}を倒した！ (${d.xp} XP)`); gainXp(d.xp); } });
      setEnemies(newEnemies.filter(e => e.hp > 0)); audioService.playSound('attack');
  };

  const handlePressStart = () => { if (menuOpen || shopState.active || gameOver || gameClear) return; fastForwardInterval.current = setTimeout(() => setIsFastForwarding(true), 400); };
  const handlePressEnd = (e?: React.TouchEvent | React.MouseEvent) => { if (e) e.preventDefault(); if (fastForwardInterval.current) { clearTimeout(fastForwardInterval.current); fastForwardInterval.current = null; } if (!isFastForwarding) handleActionBtn(); else setIsFastForwarding(false); };

  useEffect(() => {
      let interval: any = null;
      if (isFastForwarding && !gameOver && !gameClear && !menuOpen && !shopState.active) {
          interval = setInterval(() => {
              const nearby = enemies.some(e => Math.abs(e.x - player.x) <= 2 && Math.abs(e.y - player.y) <= 2);
              if (nearby) { setIsFastForwarding(false); addLog("敵が近くにいる！", "red"); return; }
              if (player.hp >= player.maxHp && belly > 20) { if (player.hp === player.maxHp) { setIsFastForwarding(false); addLog("HPが回復した。", currentTheme.colors.C2); return; } }
              if (belly <= 0) { setIsFastForwarding(false); return; }
              processTurn(player.x, player.y);
          }, 50); 
      }
      return () => { if (interval) clearInterval(interval); };
  }, [isFastForwarding, enemies, player.hp, belly, gameOver, gameClear]);

  const toggleMenu = () => { if (shopState.active) { setShopState(prev => ({ ...prev, active: false })); return; } if (menuOpen) { setMenuOpen(false); setSynthState({ active: false, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null }); } else { setMenuOpen(true); setSelectedItemIndex(0); } audioService.playSound('select'); };
  const startEndlessMode = () => { setIsEndless(true); setGameClear(false); setFloor(f => f + 1); generateFloor(floor + 1); addLog("中学生編(エンドレス)開始！"); };
  const handleSynthesisStep = () => {
      const idx = synthState.mode === 'BLANK' ? blankScrollSelectionIndex : selectedItemIndex; const item = inventory[idx];
      if (synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT') {
          const knownTypes = Array.from(identifiedTypes).filter((t: any) => (t as string).startsWith('SCROLL')) as string[]; const targetType = knownTypes[idx]; const template = ITEM_DB[targetType];
          if (template) { const blankIdx = synthState.baseIndex!; const newItem = { ...template, id: `scribed-${Date.now()}` }; const newInv = [...inventory]; newInv[blankIdx] = newItem; setInventory(newInv); addLog("名前を書き込んだ！"); setSynthState({ ...synthState, active: false }); setMenuOpen(false); processTurn(player.x, player.y); }
          return;
      }
      if (synthState.step === 'SELECT_BASE') { if (synthState.mode === 'SYNTH') { if (['WEAPON', 'ARMOR'].includes(item.category)) { setSynthState({ ...synthState, step: 'SELECT_MAT', baseIndex: idx }); addLog("合成する素材を選んでください"); audioService.playSound('select'); } else { addLog("それはベースにできません", "red"); audioService.playSound('wrong'); } } else if (synthState.mode === 'CHANGE') { setSynthState({ ...synthState, step: 'SELECT_TARGET', baseIndex: idx }); addLog("変化させるアイテムを選んでください"); } } 
      else if (synthState.step === 'SELECT_MAT') { if (idx === synthState.baseIndex) { addLog("同じアイテムは選べません", "red"); audioService.playSound('wrong'); return; } if (['WEAPON', 'ARMOR'].includes(item.category)) { const baseIdx = synthState.baseIndex!; const baseItem = inventory[baseIdx]; const matItem = item; if (baseItem.category !== matItem.category) { addLog("種類が違うと合成できません", "red"); audioService.playSound('wrong'); return; } const newPlus = (baseItem.plus || 0) + (matItem.plus || 0) + 1; const newItem: Item = { ...baseItem, plus: newPlus, name: `${baseItem.name.split('+')[0]}+${newPlus}` }; const glueIdx = inventory.findIndex(i => i.type === 'POT_GLUE'); if (glueIdx === -1) { setSynthState({ ...synthState, active: false }); return; } let newInv = inventory.map((it, i) => i === baseIdx ? newItem : it).filter((_, i) => i !== idx && i !== glueIdx); setInventory(newInv); addLog(`合成成功！${newItem.name}になった！`, "yellow"); addVisualEffect('FLASH', 0, 0); audioService.playSound('buff'); setSynthState({ ...synthState, active: false }); setMenuOpen(false); processTurn(player.x, player.y); } else { addLog("それは素材にできません", "red"); audioService.playSound('wrong'); } } 
      else if (synthState.step === 'SELECT_TARGET') { const potIdx = synthState.baseIndex!; if (idx === potIdx) { addLog("壺自身は選べません", "red"); return; } const keys = Object.keys(ITEM_DB); const key = keys[Math.floor(Math.random() * keys.length)]; const template = ITEM_DB[key]; const newItem: Item = { ...template, id: `changed-${Date.now()}`, plus: 0 }; let newInv = inventory.map((it, i) => i === idx ? newItem : it).filter((_, i) => i !== potIdx); setInventory(newInv); addLog(`アイテムが${newItem.name}に変化した！`, "yellow"); addVisualEffect('FLASH', 0, 0); audioService.playSound('buff'); setSynthState({ ...synthState, active: false }); setMenuOpen(false); processTurn(player.x, player.y); }
  };
  const executeStaffEffect = (item: Item, target: Entity | null, x: number, y: number): { hit: boolean, msg?: string } => {
      let hit = false; let msg = ""; addVisualEffect('MAGIC_PROJ', 0, 0, { startX: player.x, startY: player.y, targetX: target ? target.x : x, targetY: target ? target.y : y, duration: 5, maxDuration: 5 });
      if (item.type === 'UMB_FIRE') { 
          addVisualEffect('BEAM', target ? target.x : player.x+(player.dir.x*3), target ? target.y : player.y+(player.dir.y*3), { color: 'orange', targetX: target ? target.x : player.x+(player.dir.x*5), targetY: target ? target.y : player.y+(player.dir.y*5) }); 
          if (target) { const dmg = 20; const nhp = target.hp - dmg; setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: nhp } : e).filter(e => e.hp > 0)); if (nhp <= 0) { gainXp(target.xp); msg = `${target.name}を燃やした！`; } else msg = `${target.name}に${dmg}ダメージ！`; hit = true; } 
      } 
      else if (item.type === 'UMB_THUNDER') { 
          addVisualEffect('THUNDER', target ? target.x : x, target ? target.y : y, { targetX: target ? target.x : x, targetY: target ? target.y : y }); 
          if (target) { const dmg = 25; const nhp = target.hp - dmg; setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: nhp } : e).filter(e => e.hp > 0)); if (nhp <= 0) { gainXp(target.xp); msg = `${target.name}に落雷！`; } else msg = `${target.name}に${dmg}ダメージ！`; hit = true; } 
      } 
      else if (item.type === 'UMB_SLEEP') { addVisualEffect('TEXT', x, y, {value: 'Zzz', color: 'blue'}); if (target) { setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, status: { ...e.status, sleep: 10 } } : e)); msg = `${target.name}は眠ってしまった。`; hit = true; } } 
      else if (item.type === 'UMB_BLOW') { 
          addVisualEffect('WIND', x, y, { dir: player.dir });
          if (target) { let tx = target.x; let ty = target.y; const dx = target.x - player.x; const dy = target.y - player.y; const ndx = Math.sign(dx); const ndy = Math.sign(dy); for (let i=0; i<5; i++) { if (map[ty+ndy][tx+ndx] !== 'WALL' && !enemies.some(e=>e.x===tx+ndx && e.y===ty+ndy)) { tx += ndx; ty += ndy; } else break; } if (tx !== target.x || ty !== target.y) { setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, x: tx, y: ty } : e)); msg = `${target.name}を吹き飛ばした！`; hit = true; } else { msg = "吹き飛ばなかった。"; hit = true; } } 
      } 
      else if (item.type === 'UMB_WARP') { if (target) { let attempts = 0; while (attempts < 20) { attempts++; const rx = Math.floor(Math.random() * MAP_W); const ry = Math.floor(Math.random() * MAP_H); if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry) && (rx !== player.x || ry !== player.y)) { setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, x: rx, y: ry } : e)); msg = `${target.name}はどこかへ消えた。`; hit = true; break; } } } } 
      else if (item.type === 'UMB_CHANGE') { if (target) { const px = player.x; const py = player.y; setPlayer(p => ({...p, x: target.x, y: target.y })); setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, x: px, y: py } : e)); msg = `${target.name}と入れ替わった！`; hit = true; } } 
      else if (item.type === 'UMB_BIND') { if (target) { setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, status: { ...e.status, frozen: 10 } } : e)); msg = `${target.name}は金縛りにあった！`; hit = true; } } 
      else if (item.type === 'UMB_HEAL') { if (target) { setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: e.maxHp } : e)); msg = `${target.name}が回復してしまった！`; hit = true; } }
      return { hit, msg };
  };

  const handleThrowItem = (index: number) => {
      const item = inventory[index]; if (!item) return; const { x: dx, y: dy } = player.dir; let lx = player.x, ly = player.y; let hitEntity: Entity | null = null;
      for (let i=1; i<=10; i++) { const tx = player.x + dx * i; const ty = player.y + dy * i; lx = tx; ly = ty; if (map[ty][tx] === 'WALL') { addLog("壁に当たった。"); break; } const target = enemies.find(e => e.x === tx && e.y === ty); if (target) { hitEntity = target; break; } }
      
      const itemSpriteKey = item.category === 'WEAPON' ? 'WEAPON' : (item.category === 'ARMOR' ? 'ARMOR' : (item.category === 'STAFF' ? 'STAFF' : (item.category === 'DECK_CARD' ? 'DECK_CARD' : 'CONSUMABLE')));
      addVisualEffect('PROJECTILE', lx, ly, { startX: player.x, startY: player.y, targetX: lx, targetY: ly, duration: 15, maxDuration: 15, itemSpriteKey });
      
      setInventory(prev => prev.filter((_, i) => i !== index));
      if (hitEntity) {
          let dmg = 2; if (item.category === 'WEAPON' || item.category === 'RANGED') dmg = 5 + (item.power || 0); if (item.category === 'ARMOR') dmg = 3 + (item.power || 0); if (item.type === 'POT_GLUE') { hitEntity.status.frozen = 10; addLog(`${hitEntity.name}はのりで固まった！`); } if (item.type.includes('POISON')) { addLog(`${hitEntity.name}に毒を与えた！`); dmg += 10; } if (item.type === 'SCROLL_SLEEP') { hitEntity.status.sleep = 10; addLog(`${hitEntity.name}は眠ってしまった！`); }
          if (item.category === 'STAFF') { const res = executeStaffEffect(item, hitEntity, hitEntity.x, hitEntity.y); if (res.msg) addLog(res.msg); if (!identifiedTypes.has(item.type)) { setIdentifiedTypes(prev => new Set(prev).add(item.type)); addLog(`${idMap[item.type]}は${item.name}だった！`, "yellow"); } } 
          else { const newEnemies = enemies.map(e => { if (e.id === hitEntity!.id) { const nhp = e.hp - dmg; return { ...e, hp: nhp }; } return e; }); const dead = newEnemies.find(e => e.id === hitEntity!.id && e.hp <= 0); if(dead) { gainXp(dead.xp); addLog(`${dead.name}を倒した！`); } else { addLog(`${hitEntity.name}に${dmg}ダメージ！`); addVisualEffect('TEXT', hitEntity.x, hitEntity.y, {value:`${dmg}`}); } setEnemies(newEnemies.filter(e => e.hp > 0)); }
          audioService.playSound('attack');
      } else { if (map[ly][lx] !== 'WALL' && !floorItems.find(i=>i.x===lx && i.y===ly)) { setFloorItems(prev => [...prev, { id: Date.now() + Math.random(), type: 'ITEM', x: lx, y: ly, char: '!', name: item.name, hp: 0, maxHp: 0, baseAttack: 0, baseDefense: 0, attack: 0, defense: 0, xp: 0, dir:{x:0,y:0}, status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, itemData: item }]); addLog("飛んでいった。"); } else addLog("彼方へ消え去った。"); }
      setMenuOpen(false); processTurn(player.x, player.y);
  };

  const handleItemAction = (index: number) => {
      const item = inventory[index]; if (!item) return;
      if (item.category === 'STAFF') {
          const { x: dx, y: dy } = player.dir; let target: Entity | null = null; let tx = player.x, ty = player.y;
          for(let i=1; i<=10; i++) { tx += dx; ty += dy; if (map[ty][tx] === 'WALL') break; const e = enemies.find(en => en.x === tx && en.y === ty); if (e) { target = e; break; } }
          if ((item.charges || 0) > 0) {
              const res = executeStaffEffect(item, target, player.x + dx, player.y + dy); if (res.msg) addLog(res.msg); else addLog("しかし何も起こらなかった。"); 
              const newCharges = (item.charges || 0) - 1; const newItem = { ...item, charges: newCharges }; setInventory(prev => prev.map((it, i) => i === index ? newItem : it));
              if (!identifiedTypes.has(item.type)) { setIdentifiedTypes(prev => new Set(prev).add(item.type)); addLog(`${idMap[item.type]}は${item.name}だった！`, "yellow"); }
              audioService.playSound('buff'); setMenuOpen(false); processTurn(player.x, player.y);
          } else addLog("魔力が尽きている！"); 
          return;
      }
      if (item.type === 'POT_GLUE') { setSynthState({ active: true, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null }); addLog("合成のベースとなる装備を選んでください"); audioService.playSound('select'); return; }
      if (item.type === 'POT_CHANGE') { setSynthState({ active: true, mode: 'CHANGE', step: 'SELECT_BASE', baseIndex: index }); setSynthState(prev => ({...prev, step: 'SELECT_TARGET'})); addLog("変化させるアイテムを選んでください"); audioService.playSound('select'); return; }
      if (item.type === 'SCROLL_BLANK') { if (identifiedTypes.size === 0) { addLog("書き込める内容を知らない...", "red"); return; } setSynthState({ active: true, mode: 'BLANK', step: 'SELECT_EFFECT', baseIndex: index }); addLog("何を書き込みますか？"); audioService.playSound('select'); return; }
      let actionDone = false;
      if (item.category === 'WEAPON' || item.category === 'ARMOR' || item.category === 'ACCESSORY') {
          setPlayer(p => { let slot: keyof EquipmentSlots = 'weapon'; if (item.category === 'ARMOR') slot = 'armor'; if (item.category === 'ACCESSORY') slot = 'accessory'; const currentEquip = p.equipment ? p.equipment[slot] : null; const newEquipment = { ...p.equipment!, [slot]: item }; const newInv = [...inventory]; newInv.splice(index, 1); if (currentEquip) newInv.push(currentEquip); setInventory(newInv); addLog(`${getItemName(item)}を装備した。`); return { ...p, equipment: newEquipment }; });
          actionDone = true;
      } else if (item.category === 'CONSUMABLE') {
          if (item.type.includes('ONIGIRI') || item.type.includes('MEAT')) { 
              const val = item.value || 50; let nextBelly = Math.min(maxBelly, belly + val); let nextHp = player.hp;
              if (item.type.includes('MEAT')) { nextHp = Math.min(player.maxHp, player.hp + 50); addLog(`${item.name}を食べた。元気が出た！`); } else addLog(`${item.name}を食べた。満腹！`); 
              setInventory(prev => prev.filter((_, i) => i !== index)); setSelectedItemIndex(prev => Math.min(prev, inventory.length - 2)); setMenuOpen(false); processTurn(player.x, player.y, { belly: nextBelly, hp: nextHp }); audioService.playSound('select'); return; 
          }
          else if (item.type.includes('HEAL') || item.type === 'GRASS_LIFE') { 
              let healVal = item.value || 30; if (item.type === 'GRASS_LIFE') { setPlayer(p => ({ ...p, maxHp: p.maxHp + 5 })); healVal = 5; addLog("最大HPが上がった！", "yellow"); }
              let nextHp = Math.min(player.maxHp, player.hp + healVal); addLog(`HPが${healVal}回復した！`); addVisualEffect('TEXT', player.x, player.y, { value: `+${healVal}`, color: 'green' });
              setInventory(prev => prev.filter((_, i) => i !== index)); setSelectedItemIndex(prev => Math.min(prev, inventory.length - 2)); setMenuOpen(false); processTurn(player.x, player.y, { hp: nextHp }); audioService.playSound('select'); return;
          }
          else if (item.type === 'GRASS_SPEED') { setPlayer(p => ({ ...p, status: { ...p.status, speed: 20 } })); addLog("動きが素早くなった！", "yellow"); addVisualEffect('FLASH', 0, 0, { color: 'blue', duration: 5 }); actionDone = true; }
          else if (item.type === 'GRASS_EYE') { setPlayer(p => ({ ...p, status: { ...p.status, trapSight: 50, blind: 0 } })); addLog("目が良くなった！", "yellow"); addVisualEffect('FLASH', 0, 0, { color: 'yellow', duration: 5 }); actionDone = true; }
          else if (item.type === 'GRASS_POISON') { setPlayer(p => ({ ...p, status: { ...p.status, poison: (p.status.poison||0) + 10 } })); setBelly(prev => Math.max(0, prev - 10)); addLog("ぐはっ！毒だ！", "purple"); actionDone = true; }
          else if (item.type === 'SCROLL_MAP') { setFloorMapRevealed(true); setShowMap(true); addLog("校内図が頭に入った！"); actionDone = true; addVisualEffect('FLASH', 0, 0); }
          else if (item.type === 'SCROLL_THUNDER' || item.type === 'BOMB') {
              const isBomb = item.type === 'BOMB'; if (isBomb) addVisualEffect('EXPLOSION', player.x, player.y); else { addVisualEffect('THUNDER', 0, 0); triggerShake(10); }
              setEnemies(prev => prev.map(e => { const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y); if (item.type === 'BOMB' && dist > 2) return e; const nhp = e.hp - (item.value || 20); addVisualEffect('TEXT', e.x, e.y, {value: `${item.value||20}`, color:'yellow'}); if (nhp <= 0) { gainXp(e.xp); return { ...e, hp: 0, dead: true }; } return { ...e, hp: nhp }; }).filter(e => !e.dead));
              addLog(item.type === 'BOMB' ? "爆発した！" : "雷が落ちた！"); actionDone = true;
          } else if (item.type === 'SCROLL_SLEEP') { setEnemies(prev => prev.map(e => { addVisualEffect('TEXT', e.x, e.y, {value: 'Zzz', color:'blue'}); return { ...e, status: { ...e.status, sleep: 10 } }; })); addLog("魔物が眠りについた。"); addVisualEffect('FLASH', 0, 0); actionDone = true;
          } else if (item.type === 'SCROLL_WARP') { let attempts = 0; while (attempts < 20) { attempts++; const rx = Math.floor(Math.random() * MAP_W); const ry = Math.floor(Math.random() * MAP_H); if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry)) { setPlayer(p => ({ ...p, x: rx, y: ry })); addLog("ワープした！"); addVisualEffect('FLASH', 0, 0); break; } } actionDone = true;
          } else if (item.type === 'SCROLL_CONFUSE') { setEnemies(prev => prev.map(e => ({ ...e, status: { ...e.status, confused: 10 } }))); addLog("魔物が混乱した！"); addVisualEffect('FLASH', 0, 0); actionDone = true;
          } else if (item.type === 'SCROLL_IDENTIFY') { setIdentifiedTypes(prev => { const next = new Set(prev); inventory.forEach(i => next.add(i.type)); return next; }); addLog("持ち物が識別された！"); addVisualEffect('FLASH', 0, 0); actionDone = true;
          } else if (item.type === 'SCROLL_UP_W') { if (player.equipment?.weapon) { const w = player.equipment.weapon; const newW = { ...w, plus: (w.plus || 0) + 1, name: w.name.split('+')[0] + '+' + ((w.plus || 0) + 1) }; setPlayer(p => ({ ...p, equipment: { ...p.equipment!, weapon: newW } })); addLog("武器が強化された！"); actionDone = true; } else addLog("武器を装備していない。"); 
          } else if (item.type === 'SCROLL_UP_A') { if (player.equipment?.armor) { const a = player.equipment.armor; const newA = { ...a, plus: (a.plus || 0) + 1, name: a.name.split('+')[0] + '+' + ((a.plus || 0) + 1) }; setPlayer(p => ({ ...p, equipment: { ...p.equipment!, armor: newA } })); addLog("防具が強化された！"); actionDone = true; } else addLog("防具を装備していない。"); }
          if (actionDone) { setInventory(prev => prev.filter((_, i) => i !== index)); setSelectedItemIndex(prev => Math.min(prev, inventory.length - 2)); }
      } else if (item.category === 'RANGED') { setPlayer(p => { const currentEquip = p.equipment ? p.equipment.ranged : null; const newEquipment = { ...p.equipment!, ranged: item }; const newInv = [...inventory]; newInv.splice(index, 1); if (currentEquip) newInv.push(currentEquip); setInventory(newInv); addLog(`${item.name}を装備した。`); return { ...p, equipment: newEquipment }; }); actionDone = true; }
      if (actionDone) { setMenuOpen(false); processTurn(player.x, player.y); audioService.playSound('select'); }
  };
  const handleDropItem = (index: number) => {
      const item = inventory[index]; if (!item || synthState.active) return; let newEquip = player.equipment; let changed = false;
      if (player.equipment?.weapon === item) { newEquip = { ...newEquip!, weapon: null }; changed = true; } else if (player.equipment?.armor === item) { newEquip = { ...newEquip!, armor: null }; changed = true; } else if (player.equipment?.ranged === item) { newEquip = { ...newEquip!, ranged: null }; changed = true; } else if (player.equipment?.accessory === item) { newEquip = { ...newEquip!, accessory: null }; changed = true; }
      if (changed) setPlayer(p => ({ ...p, equipment: newEquip })); const newInv = inventory.filter((_, i) => i !== index); setInventory(newInv);
      setFloorItems(prev => [...prev, { id: Date.now() + Math.random(), type: 'ITEM', x: player.x, y: player.y, char: '!', name: item.name, hp: 0, maxHp: 0, baseAttack: 0, baseDefense: 0, attack: 0, defense: 0, xp: 0, dir: { x: 0, y: 0 }, status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, itemData: item }]);
      addLog(`${getItemName(item)}を足元に置いた。`); audioService.playSound('select'); setSelectedItemIndex(prev => Math.min(prev, newInv.length - 1)); if (newInv.length === 0) setMenuOpen(false);
  };
  const handleUnequip = (slot: 'weapon'|'armor'|'ranged'|'accessory') => {
      const item = player.equipment?.[slot];
      if (item) { if (inventory.length < MAX_INVENTORY) { setPlayer(p => ({ ...p, equipment: { ...p.equipment!, [slot]: null } })); setInventory(prev => [...prev, item]); addLog(`${getItemName(item)}を外した。`); processTurn(player.x, player.y); } else addLog("持ち物がいっぱいで外せない！"); }
  };
  const handleTouchStart = (item: Item) => { longPressTimer.current = setTimeout(() => setInspectedItem(item), 500); };
  const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
  const handleMoveInput = (dx: 0|1|-1, dy: 0|1|-1) => movePlayer(dx, dy);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        lastInputType.current = 'KEY'; if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
        if (gameOver) return; 
        if (gameClear) { if (['z', 'Enter', ' '].includes(e.key)) startEndlessMode(); return; }
        if (['x', 'c', 'Escape'].includes(e.key)) { toggleMenu(); return; }
        if ((menuOpen || shopState.active) && (e.key === 'Backspace' || e.key === 'x')) { if (shopState.active) { setShopState(prev => ({...prev, active: false})); return; } if (synthState.active) setSynthState({ active: false, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null }); else setMenuOpen(false); return; }
        if (menuOpen || shopState.active) {
            const listLength = shopState.active && shopState.mode === 'BUY' ? (enemies.find(e=>e.id===shopState.merchantId)?.shopItems?.length||0) : inventory.length;
            if (e.key === 'ArrowUp') setSelectedItemIndex(prev => Math.max(0, prev - 1));
            if (e.key === 'ArrowDown') setSelectedItemIndex(prev => Math.min(listLength - 1, prev + 1));
            if (shopState.active) { if (e.key === 'ArrowLeft' && shopState.mode === 'SELL') { setShopState(prev => ({ ...prev, mode: 'BUY' })); setSelectedItemIndex(0); audioService.playSound('select'); } if (e.key === 'ArrowRight' && shopState.mode === 'BUY') { setShopState(prev => ({ ...prev, mode: 'SELL' })); setSelectedItemIndex(0); audioService.playSound('select'); } }
            if (e.key === 'z' || e.key === 'Enter' || e.key === ' ') handleActionBtn(); return;
        }
        switch(e.key) {
            case 'ArrowUp': case 'w': case '8': case 'k': handleMoveInput(0, -1); break;
            case 'ArrowDown': case 's': case '2': case 'j': handleMoveInput(0, 1); break;
            case 'ArrowLeft': case 'a': case '4': case 'h': handleMoveInput(-1, 0); break;
            case 'ArrowRight': case 'd': case '6': case 'l': handleMoveInput(1, 0); break;
            case 'Home': case '7': case 'y': handleMoveInput(-1, -1); break;
            case 'PageUp': case '9': case 'u': handleMoveInput(1, -1); break;
            case 'End': case '1': case 'b': handleMoveInput(-1, 1); break;
            case 'PageDown': case '3': case 'n': handleMoveInput(1, 1); break;
            case 'z': case ' ': case 'Enter': handleActionBtn(); break;
            case 'r': fireRangedWeapon(); break;
        }
    };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, map, enemies, floorItems, menuOpen, gameOver, gameClear, inventory, selectedItemIndex, synthState, shopState]);

  const frameCountRef = useRef(0);
  useEffect(() => { const loop = setInterval(() => { frameCountRef.current++; renderGame(); }, 50); return () => clearInterval(loop); }, [map, player, enemies, floorItems, traps, menuOpen, visitedMap, floorMapRevealed, currentTheme]);

  const renderGame = () => {
      const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return; if (!map || map.length === 0) return;
      const w = canvas.width; const h = canvas.height; const ts = TILE_SIZE * SCALE; const { C0, C1, C2, C3 } = currentTheme.colors;
      ctx.fillStyle = C0; ctx.fillRect(0, 0, w, h); ctx.save();
      if (shake.current.duration > 0) { const mag = 4; ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag); shake.current.duration--; }
      const startX = player.x - Math.floor(VIEW_W/2); const startY = player.y - Math.floor(VIEW_H/2);
      const hasSight = player.equipment?.accessory?.type === 'RING_SIGHT';
      const hasTrapSight = (player.equipment?.accessory?.type === 'RING_TRAP') || (player.status.trapSight && player.status.trapSight > 0);
      for (let y = 0; y < VIEW_H; y++) {
          for (let x = 0; x < VIEW_W; x++) {
              const mx = startX + x; const my = startY + y; const sx = x * ts; const sy = y * ts;
              if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) { ctx.fillStyle = C0; ctx.fillRect(sx, sy, ts, ts); continue; }
              const isRevealed = floorMapRevealed || (visitedMap[my] && visitedMap[my][mx]); const tile = map[my][mx];
              if (isRevealed) {
                  if (tile === 'WALL') { ctx.fillStyle = C1; ctx.fillRect(sx, sy, ts, ts); ctx.fillStyle = C0; ctx.fillRect(sx+ts/4, sy+ts/4, ts/2, ts/2); } 
                  else { ctx.fillStyle = C3; ctx.fillRect(sx, sy, ts, ts); if (tile === 'STAIRS') { ctx.fillStyle = C1; for(let i=0; i<3; i++) ctx.fillRect(sx, sy + i*(ts/3), ts, 2); } }
                  const trap = traps.find(t => t.x === mx && t.y === my); if (trap && (trap.visible || hasTrapSight)) { const sprite = spriteCache.current['TRAP']; if (sprite) ctx.drawImage(sprite, sx, sy, ts, ts); }
              } else { ctx.fillStyle = C0; ctx.fillRect(sx, sy, ts, ts); }
              const canSeeEntities = isRevealed || hasSight;
              if (canSeeEntities) {
                  const item = floorItems.find(i => i.x === mx && i.y === my);
                  if (item) {
                      let spriteKey = 'CONSUMABLE';
                      if (item.type === 'GOLD') spriteKey = 'GOLD_BAG';
                      else if (item.itemData) { const cat = item.itemData.category; if (cat === 'WEAPON') spriteKey = 'WEAPON'; if (cat === 'ARMOR') spriteKey = 'ARMOR'; if (cat === 'RANGED') spriteKey = 'RANGED'; if (cat === 'STAFF') spriteKey = 'STAFF'; if (cat === 'ACCESSORY') spriteKey = 'ACCESSORY'; if (item.itemData.type === 'POT_GLUE') spriteKey = 'SYNTH'; if (cat === 'DECK_CARD') spriteKey = 'DECK_CARD'; }
                      const sprite = spriteCache.current[spriteKey]; if (sprite) ctx.drawImage(sprite, sx, sy, ts, ts); else { ctx.fillStyle = C1; ctx.fillRect(sx + 4*SCALE, sy + 4*SCALE, 8*SCALE, 8*SCALE); }
                  }
                  const enemy = enemies.find(e => e.x === mx && e.y === my);
                  if (enemy) {
                      const spriteKey = enemy.enemyType || 'SLIME'; const sprite = spriteCache.current[spriteKey]; const offX = (enemy.offset?.x || 0) * SCALE; const offY = (enemy.offset?.y || 0) * SCALE;
                      if (sprite) { if (enemy.status.sleep > 0) ctx.globalAlpha = 0.5; ctx.drawImage(sprite, sx + offX, sy + offY, ts, ts); ctx.globalAlpha = 1.0; if (enemy.status.sleep > 0) { ctx.fillStyle='white'; ctx.font='10px monospace'; ctx.fillText('Zzz', sx, sy); } } 
                      else { ctx.fillStyle = C1; ctx.fillRect(sx + 2*SCALE + offX, sy + 2*SCALE + offY, 12*SCALE, 12*SCALE); }
                  }
              }
              if (mx === player.x && my === player.y) {
                  let spriteKey = 'PLAYER_FRONT'; let flip = false; if (player.dir.y === -1) spriteKey = 'PLAYER_BACK'; else if (player.dir.x !== 0) { spriteKey = 'PLAYER_SIDE'; if (player.dir.x === -1) flip = true; }
                  const sprite = spriteCache.current[spriteKey]; const offX = (player.offset?.x || 0) * SCALE; const offY = (player.offset?.y || 0) * SCALE;
                  if (sprite) { if (flip) { ctx.save(); ctx.translate(sx + ts + offX, sy + offY); ctx.scale(-1, 1); ctx.drawImage(sprite, 0, 0, ts, ts); ctx.restore(); } else ctx.drawImage(sprite, sx + offX, sy + offY, ts, ts); } 
                  else { ctx.fillStyle = C0; ctx.fillRect(sx + 3*SCALE + offX, sy + 3*SCALE + offY, 10*SCALE, 10*SCALE); }
              }
          }
      }
      visualEffects.current.forEach((fx, i) => {
          fx.duration--; let currentX = fx.x; let currentY = fx.y;
          const sx = (fx.x - startX) * ts; const sy = (fx.y - startY) * ts;
          
          if (fx.type === 'FLASH' || fx.type === 'THUNDER') { 
              if (fx.type === 'THUNDER') {
                  const tx = (fx.targetX! - startX) * ts + ts/2;
                  const ty = (fx.targetY! - startY) * ts + ts/2;
                  ctx.strokeStyle = 'white';
                  ctx.lineWidth = 3;
                  ctx.shadowBlur = 10;
                  ctx.shadowColor = 'yellow';
                  ctx.beginPath();
                  ctx.moveTo(tx, ty - 100);
                  let curX = tx; let curY = ty - 100;
                  for(let j=0; j<5; j++) {
                      curX += (Math.random()-0.5)*40;
                      curY += 20;
                      ctx.lineTo(curX, curY);
                  }
                  ctx.lineTo(tx, ty);
                  ctx.stroke();
                  ctx.shadowBlur = 0;
              } else {
                  ctx.fillStyle = 'white'; ctx.globalAlpha = fx.duration / (fx.maxDuration || 20); ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1.0; 
              }
          }
          else if (fx.type === 'SLASH') { if (sx >= -ts && sx < w && sy >= -ts && sy < h) { ctx.strokeStyle = 'white'; ctx.lineWidth = 4; ctx.beginPath(); const d = fx.dir || {x:1, y:0}; const cx = sx + ts/2; const cy = sy + ts/2; ctx.moveTo(cx - d.y*10 - d.x*10, cy - d.x*10 + d.y*10); ctx.lineTo(cx + d.y*10 + d.x*10, cy + d.x*10 - d.y*10); ctx.stroke(); } }
          else if (fx.type === 'EXPLOSION') { if (sx >= -ts && sx < w && sy >= -ts && sy < h) { ctx.fillStyle = ['white', 'orange', 'red'][Math.floor(Math.random()*3)]; const rad = (1 - fx.duration / fx.maxDuration) * ts * (fx.scale || 2); ctx.beginPath(); ctx.arc(sx + ts/2, sy + ts/2, rad, 0, Math.PI*2); ctx.fill(); } }
          else if (fx.type === 'BEAM') { 
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  const targetSx = (fx.targetX! - startX) * ts + ts/2;
                  const targetSy = (fx.targetY! - startY) * ts + ts/2;
                  const startSx = (fx.x - startX) * ts + ts/2;
                  const startSy = (fx.y - startY) * ts + ts/2;
                  
                  const grad = ctx.createLinearGradient(startSx, startSy, targetSx, targetSy);
                  grad.addColorStop(0, 'rgba(255,100,0,0.8)');
                  grad.addColorStop(0.5, 'rgba(255,255,200,1)');
                  grad.addColorStop(1, 'rgba(255,50,0,0.8)');
                  
                  ctx.strokeStyle = grad;
                  ctx.lineWidth = 10 * (fx.duration / fx.maxDuration);
                  ctx.lineCap = 'round';
                  ctx.beginPath();
                  ctx.moveTo(startSx, startSy);
                  ctx.lineTo(targetSx, targetSy);
                  ctx.stroke();
                  
                  for(let j=0; j<3; j++) {
                      ctx.fillStyle = 'orange';
                      ctx.fillRect(targetSx+(Math.random()-0.5)*20, targetSy+(Math.random()-0.5)*20, 4, 4);
                  }
              }
          }
          else if (fx.type === 'WIND') {
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                  ctx.lineWidth = 2;
                  const d = fx.dir || {x:1, y:0};
                  const cx = sx + ts/2; const cy = sy + ts/2;
                  for(let j=0; j<3; j++) {
                      ctx.beginPath();
                      const off = j * 10 - 10;
                      const phase = (fx.duration / fx.maxDuration) * Math.PI * 2;
                      ctx.arc(cx + d.x*20 + Math.cos(phase)*5, cy + d.y*20 + Math.sin(phase)*5 + off, 15, 0, Math.PI);
                      ctx.stroke();
                  }
              }
          }
          else if (fx.type === 'PROJECTILE' || fx.type === 'MAGIC_PROJ') { 
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  const progress = 1 - (fx.duration / fx.maxDuration);
                  const curX = fx.startX! + (fx.targetX! - fx.startX!) * progress;
                  const curY = fx.startY! + (fx.targetY! - fx.startY!) * progress;
                  const curSx = (curX - startX) * ts + ts/2;
                  const curSy = (curY - startY) * ts + ts/2;
                  
                  if (fx.type === 'MAGIC_PROJ') {
                      ctx.save();
                      ctx.translate(curSx, curSy);
                      ctx.rotate(progress * Math.PI * 8);
                      ctx.fillStyle = 'cyan';
                      ctx.shadowBlur = 15;
                      ctx.shadowColor = 'white';
                      for(let j=0; j<4; j++) {
                          ctx.rotate(Math.PI/2);
                          ctx.fillRect(-8, -2, 16, 4);
                      }
                      ctx.restore();
                      addVisualEffect('TEXT', curX, curY, { value: '･', color: 'white', duration: 5, maxDuration: 5 });
                  } else {
                      const itemSprite = spriteCache.current[fx.itemSpriteKey || 'WEAPON'];
                      if (itemSprite) {
                          ctx.save();
                          ctx.translate(curSx, curSy);
                          ctx.rotate(progress * Math.PI * 4);
                          ctx.drawImage(itemSprite, -ts/2, -ts/2, ts, ts);
                          ctx.restore();
                      }
                  }
                  if (fx.duration === 1) addVisualEffect('SLASH', fx.targetX!, fx.targetY!, { duration: 8, maxDuration: 8 });
              }
          }
          else if (fx.type === 'WARP') { if (sx >= -ts && sx < w && sy >= -ts && sy < h) { ctx.fillStyle = 'cyan'; const alpha = fx.duration / (fx.maxDuration || 10); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(sx + ts/2, sy + ts/2, 10 * SCALE, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1.0; } }
          else if (fx.type === 'TEXT') { if (sx >= -ts && sx < w && sy >= -ts && sy < h) { ctx.fillStyle = fx.color || 'white'; ctx.font = 'bold 16px monospace'; ctx.strokeStyle = 'black'; ctx.lineWidth = 2; const lift = (1 - fx.duration / fx.maxDuration) * 20; ctx.strokeText(fx.value || '', sx + ts/2, sy - lift + ts); ctx.fillText(fx.value || '', sx + ts/2, sy - lift + ts); } }
      });
      visualEffects.current = visualEffects.current.filter(fx => fx.duration > 0); ctx.restore();
  };

  const getInspectedDescription = (item: Item) => { if (item.category === 'STAFF' && !identifiedTypes.has(item.type)) return "振ってみるまで分からない。"; return item.desc; };
  const { C0, C1, C2, C3 } = currentTheme.colors;

  return (
    <div className="w-full h-full bg-[#101010] flex flex-col landscape:flex-row md:flex-row items-center landscape:items-stretch md:items-stretch justify-center font-mono select-none overflow-hidden touch-none relative p-4 gap-4">
        {inspectedItem && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: `${C0}F2` }} onClick={() => setInspectedItem(null)}>
                <div className="w-full max-w-xs border-4 p-4 shadow-xl" style={{ backgroundColor: C3, borderColor: C1, color: C0 }} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-2 border-b-2 pb-1" style={{ borderColor: C1 }}>
                        <h3 className="font-bold text-lg">{getItemName(inspectedItem)} {inspectedItem.plus ? `+${inspectedItem.plus}` : ''} {inspectedItem.count ? `(${inspectedItem.count})` : ''} {inspectedItem.category === 'STAFF' ? `[${inspectedItem.charges}]` : ''}</h3>
                        <button onClick={() => setInspectedItem(null)}><X size={20}/></button>
                    </div>
                    <div className="text-sm mb-4 min-h-[3rem]">{getInspectedDescription(inspectedItem)}</div>
                    <div className="text-xs font-bold grid grid-cols-2 gap-2">
                        <div>分類: {inspectedItem.category}</div>
                        {inspectedItem.power && (<div>{inspectedItem.category === 'ARMOR' ? '防御' : '威力'}: {inspectedItem.power + (inspectedItem.plus || 0)}{inspectedItem.plus ? <span className="text-[9px] font-normal ml-1">({inspectedItem.power}+{inspectedItem.plus})</span> : ''}</div>)}
                        {inspectedItem.value && <div>効果: {inspectedItem.value}</div>}
                    </div>
                </div>
            </div>
        )}
        
        {showMathChallenge && (<div className="fixed inset-0 z-[100] w-full h-full pointer-events-auto"><MathChallengeScreen mode={GameMode.MIXED} onComplete={handleMathComplete} /></div>)}

        {showDeck && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: `${C0}F2` }} onClick={() => setShowDeck(false)}>
                <div className="w-full max-w-md border-4 p-6 shadow-xl overflow-y-auto max-h-[80vh] custom-scrollbar" style={{ backgroundColor: C3, borderColor: C1, color: C0 }} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 border-b-2 pb-2" style={{ borderColor: C1 }}>
                        <h2 className="font-bold text-xl flex items-center"><Layers className="mr-2"/> デッキ一覧 ({dungeonDeck.length})</h2>
                        <button onClick={() => setShowDeck(false)}><X size={24}/></button>
                    </div>
                    {deckViewMode === 'REMOVE' && (<div className="bg-red-900/50 p-2 mb-4 text-center border-2 border-red-500 rounded text-red-200 font-bold">除外するカードを選択してください</div>)}
                    <div className="space-y-2">
                        {dungeonDeck.length === 0 ? (<div className="text-center text-sm py-4 opacity-50">デッキは空です</div>) : (
                            dungeonDeck.map((card, idx) => (
                                <div key={card.id} className={`border p-2 rounded flex items-center gap-3 ${deckViewMode === 'REMOVE' ? 'cursor-pointer hover:bg-red-500 hover:text-white' : ''}`} style={{ borderColor: C1 }} onClick={() => deckViewMode === 'REMOVE' && handleCardRemoval(card.id)}>
                                    <div className="bg-black/10 p-2 rounded-full border border-current">{card.icon}</div>
                                    <div className="flex-grow"><div className="font-bold flex justify-between"><span>{card.name}</span><span className="text-xs opacity-70 font-normal">{card.type}</span></div><div className="text-xs opacity-80">{card.description} {card.power > 0 && `(Pow:${card.power})`}</div></div>
                                    {deckViewMode === 'REMOVE' && <Trash2 size={16} />}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t-2 text-xs opacity-70" style={{ borderColor: C1 }}><p>手札: {dungeonHand.length}枚 / 捨て札: {dungeonDiscard.length}枚</p></div>
                    <button onClick={() => setShowDeck(false)} className="mt-6 w-full py-2 font-bold rounded" style={{ backgroundColor: C1, color: C3 }}>閉じる</button>
                </div>
            </div>
        )}

        {showStatus && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: `${C0}F2` }} onClick={() => setShowStatus(false)}>
                <div className="w-full max-w-md border-4 p-6 shadow-xl overflow-y-auto max-h-[80vh] custom-scrollbar" style={{ backgroundColor: C3, borderColor: C1, color: C0 }} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 border-b-2 pb-2" style={{ borderColor: C1 }}><h2 className="font-bold text-xl flex items-center"><User className="mr-2"/> ステータス</h2><button onClick={() => setShowStatus(false)}><X size={24}/></button></div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><span style={{ color: C1 }} className="font-bold">名前:</span> {player.name}</div>
                            <div><span style={{ color: C1 }} className="font-bold">称号:</span> {level < 5 ? '新入生' : (level < 10 ? '一般生徒' : '番長')}</div>
                            <div><span style={{ color: C1 }} className="font-bold">Lv:</span> {level}</div>
                            <div><span style={{ color: C1 }} className="font-bold">経験値:</span> {player.xp}</div>
                            <div><span style={{ color: C1 }} className="font-bold">HP:</span> {player.hp}/{player.maxHp}</div>
                            <div><span style={{ color: C1 }} className="font-bold">満腹度:</span> {belly}/{maxBelly}</div>
                            <div><span style={{ color: C1 }} className="font-bold">攻撃力:</span> {player.attack}</div>
                            <div><span style={{ color: C1 }} className="font-bold">防御力:</span> {player.defense}</div>
                            <div><span style={{ color: C1 }} className="font-bold">所持金:</span> {player.gold} G</div>
                        </div>
                        <div className="border-t-2 pt-2" style={{ borderColor: C1 }}>
                            <h3 className="font-bold mb-2">装備</h3>
                            <div className="grid grid-cols-1 gap-1 text-sm">
                                <div><span className="font-bold mr-2">[武]</span> {player.equipment?.weapon ? (<span>{getItemName(player.equipment.weapon)} {player.equipment.weapon.plus ? `+${player.equipment.weapon.plus}` : ''}<span className="text-[10px] ml-1 opacity-70">({(player.equipment.weapon.power||0) + (player.equipment.weapon.plus||0)})</span></span>) : 'なし'}</div>
                                <div><span className="font-bold mr-2">[防]</span> {player.equipment?.armor ? (<span>{getItemName(player.equipment.armor)} {player.equipment.armor.plus ? `+${player.equipment.armor.plus}` : ''}<span className="text-[10px] ml-1 opacity-70">({(player.equipment.armor.power||0) + (player.equipment.armor.plus||0)})</span></span>) : 'なし'}</div>
                                <div><span className="font-bold mr-2">[投]</span> {player.equipment?.ranged ? `${getItemName(player.equipment.ranged)} (${player.equipment.ranged.count})` : 'なし'}</div>
                                <div><span className="font-bold mr-2">[腕]</span> {player.equipment?.accessory ? `${getItemName(player.equipment.accessory)}` : 'なし'}</div>
                            </div>
                        </div>
                        <div className="border-t-2 pt-2" style={{ borderColor: C1 }}>
                            <h3 className="font-bold mb-2">状態</h3>
                            <div className="flex flex-wrap gap-2 text-xs">
                                {player.status.sleep > 0 && <span className="px-2 rounded" style={{ backgroundColor: C1, color: C3 }}>睡眠</span>}
                                {player.status.confused > 0 && <span className="px-2 rounded" style={{ backgroundColor: C1, color: C3 }}>混乱</span>}
                                {player.status.frozen > 0 && <span className="px-2 rounded" style={{ backgroundColor: C1, color: C3 }}>金縛り</span>}
                                {player.status.blind > 0 && <span className="px-2 rounded" style={{ backgroundColor: C1, color: C3 }}>目潰し</span>}
                                {player.status.speed > 0 && <span className="px-2 rounded" style={{ backgroundColor: C1, color: C3 }}>倍速</span>}
                                {player.status.poison && player.status.poison > 0 && <span className="px-2 rounded" style={{ backgroundColor: C1, color: C3 }}>毒</span>}
                                {player.status.defenseBuff && player.status.defenseBuff > 0 && <span className="px-2 rounded" style={{ backgroundColor: C1, color: C3 }}>防御UP</span>}
                                {player.status.attackBuff && player.status.attackBuff > 0 && <span className="px-2 rounded" style={{ backgroundColor: C1, color: C3 }}>攻撃UP</span>}
                                {player.status.trapSight && player.status.trapSight > 0 && <span className="px-2 rounded" style={{ backgroundColor: C1, color: C3 }}>罠見え</span>}
                                {Object.values(player.status).every((v: number) => v <= 0) && <span>健康</span>}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setShowStatus(false)} className="mt-6 w-full py-2 font-bold rounded" style={{ backgroundColor: C1, color: C3 }}>閉じる</button>
                </div>
            </div>
        )}

        {showHelp && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: `${C0}F2` }} onClick={() => setShowHelp(false)}>
                <div className="w-full max-w-md border-4 p-6 shadow-xl overflow-y-auto max-h-[80vh] custom-scrollbar" style={{ backgroundColor: C3, borderColor: C1, color: C0 }} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 border-b-2 pb-2" style={{ borderColor: C1 }}><h2 className="font-bold text-xl flex items-center"><HelpCircle className="mr-2"/> 遊び方</h2><button onClick={() => setShowHelp(false)}><X size={24}/></button></div>
                    <div className="space-y-4 text-sm">
                        <section><h3 className="font-bold border-b mb-1" style={{ borderColor: C1 }}>目的</h3><p>地下20階を目指し、校長先生を説得(撃破)してください。<br/>道中で落ちている武器や道具を駆使して生き残りましょう。</p></section>
                        <section><h3 className="font-bold border-b mb-1" style={{ borderColor: C1 }}>操作方法</h3><ul className="list-disc pl-5"><li><strong>移動:</strong> 十字キー または 画面パッド</li><li><strong>攻撃:</strong> Aボタン または Zキー</li><li><strong>メニュー:</strong> Bボタン または Xキー</li><li><strong>飛び道具:</strong> <Crosshair size={12} className="inline"/>ボタン または Rキー</li><li><strong>早送り:</strong> Aボタン長押し (敵がいない時)</li></ul></section>
                        <section><h3 className="font-bold border-b mb-1" style={{ borderColor: C1 }}>カードシステム</h3><ul className="list-disc pl-5"><li>コントローラー下のカードをタップして発動します。</li><li>使用するとターンを消費し、新たなカードを引きます。</li><li>カードはフロアに落ちていることもあります。</li><li>ダメージは<strong>(攻撃力 + カード威力) - 敵防御力</strong>で計算されます。</li></ul></section>
                    </div>
                    <button onClick={() => setShowHelp(false)} className="mt-6 w-full py-2 font-bold rounded" style={{ backgroundColor: C1, color: C3 }}>閉じる</button>
                </div>
            </div>
        )}

        <div className="hidden landscape:flex md:flex order-1 w-48 md:w-64 flex-col items-center justify-center p-4 bg-[#1a1a2a] border-2 border-[#333] rounded-xl shadow-2xl relative shrink-0">
            <div className="w-40 h-40 relative">
                <div className="absolute top-4 left-4 w-10 h-10 bg-[#333] rounded-tl-lg border-t border-l border-[#444] shadow-lg active:bg-[#222] cursor-pointer z-0 flex items-center justify-center" onClick={() => handleMoveInput(-1, -1)}><ArrowUpLeft size={16} className="text-[#555]" /></div>
                <div className="absolute top-4 right-4 w-10 h-10 bg-[#333] rounded-tr-lg border-t border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer z-0 flex items-center justify-center" onClick={() => handleMoveInput(1, -1)}><ArrowUpRight size={16} className="text-[#555]" /></div>
                <div className="absolute bottom-4 left-4 w-10 h-10 bg-[#333] rounded-bl-lg border-b border-l border-[#444] shadow-lg active:bg-[#222] cursor-pointer z-0 flex items-center justify-center" onClick={() => handleMoveInput(-1, 1)}><ArrowDownLeft size={16} className="text-[#555]" /></div>
                <div className="absolute bottom-4 right-4 w-10 h-10 bg-[#333] rounded-br-lg border-b border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer z-0 flex items-center justify-center" onClick={() => handleMoveInput(1, 1)}><ArrowDownRight size={16} className="text-[#555]" /></div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#333] z-10"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-16 bg-[#333] rounded-t-md border-t border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center pt-2 z-10" onClick={() => handleMoveInput(0, -1)}><ArrowUp className="text-[#666]" size={20}/></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-16 bg-[#333] rounded-b-md border-b border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center items-end pb-2 z-10" onClick={() => handleMoveInput(0, 1)}><ArrowDown className="text-[#666]" size={20}/></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-10 bg-[#333] rounded-l-md border-l border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center pl-2 z-10" onClick={() => handleMoveInput(-1, 0)}><ArrowLeft className="text-[#666]" size={20}/></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-10 bg-[#333] rounded-r-md border-r border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-end pr-2 z-10" onClick={() => handleMoveInput(1, 0)}><ArrowRight className="text-[#666]" size={20}/></div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#2a2a2a] rounded-full z-20 shadow-inner"></div>
            </div>
            <div className="mt-8 text-[#444] font-black tracking-widest text-[10px] italic">D-PAD</div>
        </div>

        <div className="w-full max-w-md md:max-w-full md:flex-1 flex flex-col gap-2 min-h-0 order-2">
            <div className="w-full aspect-[4/3] md:aspect-auto md:flex-1 relative shrink-0 shadow-lg border-2 max-h-[45vh] md:max-h-full flex flex-col overflow-hidden" style={{ backgroundColor: C3, borderColor: C0 }}>
                <div className="w-full h-8 flex justify-between items-center px-2 text-[10px] z-10 border-b shrink-0" style={{ backgroundColor: C0, color: C3, borderColor: C1 }}>
                    <span className="font-bold tracking-widest">{currentTheme.name}</span>
                    <div className="flex gap-2">
                        <button onClick={() => setShowMap(!showMap)} className="flex items-center gap-1 hover:text-white border px-1 rounded" style={{ borderColor: C3 }}><MapIcon size={10}/> Map</button>
                        <button onClick={() => setShowStatus(true)} className="flex items-center gap-1 hover:text-white border px-1 rounded" style={{ borderColor: C3 }}><User size={10}/> Sts</button>
                        <button onClick={() => { setDeckViewMode('VIEW'); setShowDeck(true); }} className="flex items-center gap-1 hover:text-white border px-1 rounded" style={{ borderColor: C3 }}><Layers size={10}/> Deck</button>
                        <button onClick={() => setShowHelp(true)} className="flex items-center gap-1 hover:text-white border px-1 rounded" style={{ borderColor: C3 }}><HelpCircle size={10}/> Help</button>
                    </div>
                </div>
                <div className="w-full h-5 flex justify-between items-center px-2 text-xs font-bold z-10 shrink-0" style={{ backgroundColor: C1, color: C3 }}>
                    <span>{floor}F</span><span>Lv{level}</span><span>HP{player.hp}/{player.maxHp}</span><span>A{player.attack}D{player.defense}</span><span className="flex items-center"><Coins size={10} className="mr-0.5"/>{player.gold}</span><span>🍙{belly}%</span>
                </div>
                <div className="relative flex-1 min-h-0 w-full bg-[#111827]">
                    <canvas ref={canvasRef} width={VIEW_W * TILE_SIZE * SCALE} height={VIEW_H * TILE_SIZE * SCALE} className="w-full h-full object-contain pixel-art" style={{ imageRendering: 'pixelated' }} />
                    {isFastForwarding && (<div className="absolute top-2 right-2 animate-pulse flex items-center rounded px-2" style={{ backgroundColor: `${C0}80`, color: C3 }}><FastForward size={16} className="mr-1"/> 早送り中</div>)}
                    {showMap && map.length > 0 && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center p-4" style={{ backgroundColor: `${C0}E6` }}>
                            <div className="w-full h-full border grid" style={{ borderColor: C3, gridTemplateColumns: `repeat(${MAP_W}, 1fr)` }}>
                                {map.map((row, y) => row.map((tile, x) => {
                                    const isRevealed = floorMapRevealed || (visitedMap[y] && visitedMap[y][x]); const isPlayer = x === player.x && y === player.y; const hasSight = player.equipment?.accessory?.type === 'RING_SIGHT'; const hasTrapSight = (player.equipment?.accessory?.type === 'RING_TRAP') || (player.status.trapSight && player.status.trapSight > 0); const hasItem = floorItems.some(i => i.x===x && i.y===y); const hasEnemy = enemies.some(e => e.x===x && e.y===y);
                                    let bgStyle = { backgroundColor: 'transparent' }; let content = null;
                                    if (isPlayer) content = <div className="w-full h-full bg-white rounded-full animate-pulse"></div>;
                                    else if (isRevealed) { if (tile === 'STAIRS') bgStyle = { backgroundColor: C3 }; else if (tile !== 'WALL') bgStyle = { backgroundColor: C1 }; if (tile !== 'WALL') { if (traps.some(t => t.x===x && t.y===y && (t.visible || hasTrapSight))) content = <div className="w-full h-full flex items-center justify-center text-[4px] text-red-500 font-bold">X</div>; else if (hasEnemy && hasSight) content = <div className="w-full h-full bg-red-500 rounded-full"></div>; else if (hasItem && hasSight) content = <div className="w-full h-full bg-blue-400 rounded-sm"></div>; } } 
                                    else { if (hasEnemy && hasSight) content = <div className="w-full h-full bg-red-500 rounded-full"></div>; else if (hasItem && hasSight) content = <div className="w-full h-full bg-blue-400 rounded-sm"></div>; }
                                    return (<div key={`${x}-${y}`} style={bgStyle}>{content}</div>);
                                }))}
                            </div>
                            <button onClick={() => setShowMap(false)} className="absolute bottom-4 border px-2 rounded hover:opacity-80 bg-black/50" style={{ color: C3, borderColor: C3 }}>Close</button>
                        </div>
                    )}
                </div>
                {shopState.active && (
                    <div className="absolute right-0 top-0 bottom-0 w-3/4 border-l-2 z-30 p-2 text-xs flex flex-col" style={{ backgroundColor: C0, borderColor: C3, color: C3 }}>
                        <div className="flex justify-between items-center border-b mb-2 pb-1" style={{ borderColor: C3 }}><h3 className="font-bold flex items-center"><ShoppingBag size={12} className="mr-1"/> 購買部</h3><button onClick={() => setShopState(prev => ({...prev, active: false}))}><X size={12}/></button></div>
                        <div className="flex gap-2 mb-2"><button className={`flex-1 py-1 text-center border`} style={{ borderColor: C3, backgroundColor: shopState.mode === 'BUY' ? C3 : 'transparent', color: shopState.mode === 'BUY' ? C0 : C3 }} onClick={() => { setShopState(prev => ({ ...prev, mode: 'BUY' })); setSelectedItemIndex(0); }}>買う</button><button className={`flex-1 py-1 text-center border`} style={{ borderColor: C3, backgroundColor: shopState.mode === 'SELL' ? C3 : 'transparent', color: shopState.mode === 'SELL' ? C0 : C3 }} onClick={() => { setShopState(prev => ({ ...prev, mode: 'SELL' })); setSelectedItemIndex(0); }}>売る</button></div>
                        <div className="flex justify-end mb-2 border-b pb-1" style={{ borderColor: C1 }}><span className="flex items-center"><Coins size={10} className="mr-1"/> {player.gold} G</span></div>
                        {!shopRemovedThisFloor && (<button className="w-full border mb-2 py-1 flex items-center justify-center gap-2 hover:opacity-80" style={{ borderColor: C1, color: C3 }} onClick={() => { setDeckViewMode('REMOVE'); setShowDeck(true); }}><Trash2 size={12} /> カード除外 (100 G)</button>)}
                        <div ref={menuListRef} className="flex flex-col gap-1 overflow-y-auto flex-grow custom-scrollbar relative">
                            {shopState.mode === 'BUY' ? (enemies.find(e => e.id === shopState.merchantId)?.shopItems?.map((item, i) => (<div key={i} className="flex items-center border" style={{ borderColor: selectedItemIndex === i ? C3 : 'transparent', backgroundColor: selectedItemIndex === i ? C2 : 'transparent', color: selectedItemIndex === i ? C0 : C3 }} onMouseEnter={() => { lastInputType.current = 'MOUSE'; setSelectedItemIndex(i); }}><button className="flex-grow text-left px-2 py-1 cursor-pointer flex justify-between items-center" onClick={() => handleShopAction(i)}>{selectedItemIndex === i && <span className="mr-1 animate-pulse">▶</span>}<span>{getItemName(item)}</span><span className="flex items-center gap-1">{item.price} G</span></button><button className="px-2 py-1 border-l flex items-center justify-center hover:opacity-80" style={{ borderColor: C1 }} onClick={(e) => { e.stopPropagation(); setInspectedItem(item); }}><Info size={10} /></button></div>)) || <div className="text-center">売り切れ</div>) : (inventory.map((item, i) => (<div key={i} className="flex items-center border" style={{ borderColor: selectedItemIndex === i ? C3 : 'transparent', backgroundColor: selectedItemIndex === i ? C2 : 'transparent', color: selectedItemIndex === i ? C0 : C3 }} onMouseEnter={() => { lastInputType.current = 'MOUSE'; setSelectedItemIndex(i); }}><button className="flex-grow text-left px-2 py-1 cursor-pointer flex justify-between items-center" onClick={() => handleShopAction(i)}>{selectedItemIndex === i && <span className="mr-1 animate-pulse">▶</span>}<span>{getItemName(item)}</span><span className="flex items-center gap-1">{Math.floor((item.price || (item.value || 100)) / 2)} G</span></button><button className="px-2 py-1 border-l flex items-center justify-center hover:opacity-80" style={{ borderColor: C1 }} onClick={(e) => { e.stopPropagation(); setInspectedItem(item); }}><Info size={10} /></button></div>)))}
                            {shopState.mode === 'SELL' && inventory.length === 0 && <div className="text-center">持ち物なし</div>}
                        </div>
                    </div>
                )}
                {menuOpen && (
                    <div className="absolute right-0 top-0 bottom-0 w-3/4 border-l-2 z-30 p-2 text-xs flex flex-col" style={{ backgroundColor: C0, borderColor: C3, color: C3 }}>
                        <div className="flex justify-between items-center border-b mb-2 pb-1" style={{ borderColor: C3 }}><h3 className="font-bold">{synthState.active ? (synthState.mode === 'BLANK' ? '書き込む内容を選択' : (synthState.step === 'SELECT_BASE' ? (synthState.mode==='CHANGE'?'変化させる物':'ベースを選択') : (synthState.mode==='CHANGE'?'変化':'素材を選択'))) : `MOCHIMONO (${inventory.length}/${MAX_INVENTORY})`}</h3><button onClick={toggleMenu}><X size={12}/></button></div>
                        {synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT' ? (
                            <div ref={menuListRef} className="flex flex-col gap-1 overflow-y-auto flex-grow custom-scrollbar relative">
                                {Array.from(identifiedTypes).filter((t: any) => (t as string).startsWith('SCROLL')).map((type, i) => (<div key={i} className="flex items-center border" style={{ borderColor: blankScrollSelectionIndex === i ? C3 : 'transparent', backgroundColor: blankScrollSelectionIndex === i ? C2 : 'transparent', color: blankScrollSelectionIndex === i ? C0 : C3 }}><button className="flex-grow text-left px-2 py-1 cursor-pointer" onClick={() => handleSynthesisStep()} onMouseEnter={() => { lastInputType.current = 'MOUSE'; setBlankScrollSelectionIndex(i); }}>{blankScrollSelectionIndex === i && <span className="mr-1 animate-pulse">▶</span>}{ITEM_DB[type as string].name}</button></div>))}
                                {Array.from(identifiedTypes).filter((t: any) => (t as string).startsWith('SCROLL')).length === 0 && <div className="text-red-500">識別済みのノートがありません</div>}
                            </div>
                        ) : (
                            <>
                                {!synthState.active && (<div className="mb-2 border-b pb-2" style={{ borderColor: C1 }}><div className="mb-1" style={{ color: C2 }}>装備中:</div>{player.equipment?.weapon && <div onClick={()=>handleUnequip('weapon')} className="cursor-pointer hover:text-white">[武] {getItemName(player.equipment.weapon)}</div>}{player.equipment?.armor && <div onClick={()=>handleUnequip('armor')} className="cursor-pointer hover:text-white">[防] {getItemName(player.equipment.armor)}</div>}{player.equipment?.ranged && <div onClick={()=>handleUnequip('ranged')} className="cursor-pointer hover:text-white">[投] {getItemName(player.equipment.ranged)}</div>}{player.equipment?.accessory && <div onClick={()=>handleUnequip('accessory')} className="cursor-pointer hover:text-white">[腕] {getItemName(player.equipment.accessory)}</div>}</div>)}
                                <div ref={menuListRef} className="flex flex-col gap-1 overflow-y-auto flex-grow custom-scrollbar relative">
                                    {inventory.map((item, i) => {
                                        const isSynthTarget = synthState.active && ((synthState.step === 'SELECT_BASE' && synthState.mode === 'SYNTH' && !['WEAPON','ARMOR'].includes(item.category)) || (synthState.step === 'SELECT_MAT' && synthState.baseIndex === i));
                                        return (<div key={i} className={`flex items-center border ${isSynthTarget ? 'opacity-30' : ''}`} style={{ borderColor: selectedItemIndex === i ? C3 : 'transparent', backgroundColor: selectedItemIndex === i ? C2 : 'transparent', color: selectedItemIndex === i ? C0 : C3 }} onContextMenu={(e) => { e.preventDefault(); setInspectedItem(item); }} onTouchStart={() => handleTouchStart(item)} onTouchEnd={handleTouchEnd}><button className="flex-grow text-left px-2 py-1 cursor-pointer flex justify-between items-center" onClick={() => !isSynthTarget && (synthState.active ? handleSynthesisStep() : handleItemAction(i))} onMouseEnter={() => { lastInputType.current = 'MOUSE'; setSelectedItemIndex(i); }}><span>{selectedItemIndex === i && <span className="mr-1 animate-pulse">▶</span>}{getItemName(item)} {item.plus ? `+${item.plus}` : ''} {item.count ? `(${item.count})` : ''}{item.category === 'STAFF' ? `[${item.charges}]` : ''}</span><span className="text-[9px]" style={{ color: selectedItemIndex === i ? C0 : C2 }}>{synthState.active ? '選択' : (['WEAPON','ARMOR','RANGED','ACCESSORY'].includes(item.category) ? '装備' : (item.category==='STAFF' ? '振る' : '使う'))}</span></button>{!synthState.active && (<button className="px-2 py-1 border-l flex items-center justify-center hover:opacity-80" style={{ borderColor: C1 }} onClick={(e) => { e.stopPropagation(); handleThrowItem(i); }} title="投げる"><Send size={10} /></button>)}{!synthState.active && (<button className="px-2 py-1 border-l flex items-center justify-center hover:opacity-80" style={{ borderColor: C1 }} onClick={(e) => { e.stopPropagation(); handleDropItem(i); }} title="足元に置く"><ArrowDown size={10} /></button>)}<button className="px-2 py-1 border-l flex items-center justify-center hover:opacity-80" style={{ borderColor: C1 }} onClick={(e) => { e.stopPropagation(); setInspectedItem(item); }} title="詳細"><Info size={10} /></button></div>);
                                    })}
                                    {inventory.length === 0 && <span className="text-center" style={{ color: C1 }}>Empty</span>}
                                </div>
                            </>
                        )}
                    </div>
                )}
                {gameClear && (<div className="absolute inset-0 flex flex-col items-center justify-center z-40 p-4 text-center" style={{ backgroundColor: `${C0}F2`, color: C3 }}><Award size={48} className="mb-4" style={{ color: C2 }}/><h2 className="text-2xl font-bold mb-4">GRADUATION!</h2><p className="mb-2">ついに校長を説得した！</p><p className="mb-8">君は伝説の小学生となった。</p><div className="flex flex-col gap-4 w-full"><button onClick={startEndlessMode} className="border-2 px-4 py-3 animate-pulse font-bold" style={{ borderColor: C3, color: C3, backgroundColor: 'transparent' }}>中学生編へ (エンドレス)</button><button onClick={handleQuit} className="border-2 px-4 py-2 text-sm" style={{ borderColor: C1, color: C3 }}>タイトルへ戻る</button></div></div>)}
                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-40 p-4 text-center" style={{ backgroundColor: `${C0}E6`, color: C3 }}>
                        <Skull size={48} className="mb-2" style={{ color: C1 }}/>
                        <h2 className="text-xl font-bold mb-1">GAME OVER</h2>
                        <p className="text-[10px] mb-4 opacity-70">Floor: {floor} / Level: {level}</p>
                        
                        <div className="bg-black/60 border-2 border-red-500 rounded p-3 w-full max-w-xs mb-4 flex flex-col">
                            <h3 className="text-red-400 font-bold text-xs mb-2">引き継ぐアイテムを選択</h3>
                            <div className="flex-grow overflow-y-auto max-h-48 custom-scrollbar space-y-1 pr-1">
                                {allPossessions.map((item, idx) => (
                                    <div 
                                        key={idx}
                                        className={`p-2 border rounded flex items-center justify-between cursor-pointer transition-colors text-xs ${inheritItemIdx === idx ? 'bg-red-900 border-white text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-red-400'}`}
                                        onClick={() => setInheritItemIdx(idx)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {item.category === 'WEAPON' && <Sword size={14} />}
                                            {item.category === 'ARMOR' && <Shield size={14} />}
                                            {item.category === 'STAFF' && <Umbrella size={14} />}
                                            {item.category === 'RANGED' && <Target size={14} />}
                                            {item.category === 'ACCESSORY' && <Circle size={14} />}
                                            <span className="truncate max-w-[120px]">{item.name} {item.plus ? `+${item.plus}` : ''}</span>
                                        </div>
                                        {inventory.every(invItem => invItem.id !== item.id) && <span className="text-[8px] bg-blue-900 px-1 rounded">装備中</span>}
                                    </div>
                                ))}
                                {allPossessions.length === 0 && <div className="text-[10px] text-gray-600 py-4 italic">所持品なし</div>}
                            </div>
                        </div>

                        <button onClick={handleRestart} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded border-2 border-white animate-pulse flex items-center justify-center gap-2 w-full max-w-xs">
                            <RotateCcw size={16}/> {inheritItemIdx !== null ? "アイテムを持って再挑戦" : "再挑戦"}
                        </button>
                        <button onClick={handleQuit} className="mt-4 text-xs hover:underline opacity-50">EXIT</button>
                    </div>
                )}
            </div>
            <div className="w-full h-16 p-1 text-[9px] mb-1 rounded border-2 font-mono leading-tight flex flex-col justify-end shrink-0 shadow-inner overflow-hidden" style={{ backgroundColor: C0, color: C3, borderColor: C1 }}>{logs.slice(-4).map((l) => (<div key={l.id} style={{ color: l.color || C3 }} className="truncate">{l.message}</div>))}</div>
        </div>

        <div className="hidden landscape:flex md:flex order-3 w-64 flex-col items-center justify-between p-4 bg-[#161616] border-2 border-[#333] rounded-xl shadow-2xl relative shrink-0">
            <div className="absolute top-4 right-4 flex flex-col items-center">
                <button className="w-12 h-12 bg-[#333] rounded-full shadow-inner active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-white border border-[#555]" onClick={fireRangedWeapon}><Crosshair size={24}/></button>
                <span className="text-[#666] text-xs font-bold mt-1">R-SHOOT</span>
            </div>
            <div className="absolute top-4 left-4"><button onClick={handleQuit} className="text-[#555] text-[10px] font-bold border border-[#333] px-3 py-1 rounded bg-[#222] hover:text-white hover:border-gray-500 flex items-center gap-1"><LogOut size={12}/> QUIT</button></div>
            <div className="mt-20 flex flex-col gap-8 w-full items-center">
                <div className="flex flex-col items-center group"><button className="w-20 h-20 bg-[#ff0000] rounded-full shadow-[0_6px_0_#8b0000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#cc0000] text-2xl" onMouseDown={() => handlePressStart()} onMouseUp={(e) => handlePressEnd(e)} onMouseLeave={(e) => handlePressEnd(e)} onTouchStart={(e) => { e.preventDefault(); handlePressStart(); }} onTouchEnd={(e) => { e.preventDefault(); handlePressEnd(e); }}>A</button><span className="text-[#666] text-sm font-bold mt-1 uppercase tracking-widest">Action</span></div>
                <div className="flex flex-col items-center group"><button className="w-16 h-16 bg-[#8b0000] rounded-full shadow-[0_4px_0_#500000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#a00000] text-xl" onClick={toggleMenu}>B</button><span className="text-[#666] text-sm font-bold mt-1 uppercase tracking-widest">Menu</span></div>
            </div>
            <div className="w-full flex flex-col gap-2 mt-4 max-h-[25vh] overflow-y-auto custom-scrollbar p-1">
                {dungeonHand.length > 0 ? (dungeonHand.map((card, i) => (
                    <button key={card.id} className="w-full bg-[#2a2a2a] border-2 border-[#555] rounded-lg flex items-center gap-2 text-white p-1 hover:bg-[#333] hover:border-white transition-all shadow" onClick={() => handleCardUse(i)}>
                        <div className={`p-1 rounded-full scale-75 ${card.type === 'ATTACK' ? 'bg-red-900' : card.type === 'DEFENSE' ? 'bg-blue-900' : 'bg-green-900'}`}>{card.icon}</div>
                        <div className="flex flex-col items-start"><span className="text-[10px] font-bold leading-tight">{card.name}</span><span className="text-[7px] text-gray-500 uppercase">{card.type}</span></div>
                    </button>
                ))) : (<div className="text-gray-600 text-xs text-center animate-pulse">Wait...</div>)}
            </div>
        </div>

        <div className="portrait:flex landscape:hidden md:hidden order-4 w-full max-w-md h-[220px] relative rounded-t-xl border-t-2 border-[#333] bg-[#1a1a2a] shrink-0 overflow-hidden">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-32 h-32 flex items-center justify-center">
                <div className="w-10 h-10 bg-[#333] z-10"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-16 bg-[#333] rounded-t-md border-t border-l border-r border-[#444] active:bg-[#222] cursor-pointer flex justify-center pt-2 z-10" onClick={() => handleMoveInput(0, -1)}><ArrowUp className="text-[#666]" size={20}/></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-16 bg-[#333] rounded-b-md border-b border-l border-r border-[#444] active:bg-[#222] cursor-pointer flex justify-center items-end pb-2 z-10" onClick={() => handleMoveInput(0, 1)}><ArrowDown className="text-[#666]" size={20}/></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-10 bg-[#333] rounded-l-md border-l border-t border-b border-[#444] active:bg-[#222] cursor-pointer flex items-center pl-2 z-10" onClick={() => handleMoveInput(-1, 0)}><ArrowLeft className="text-[#666]" size={20}/></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-10 bg-[#333] rounded-r-md border-r border-t border-b border-[#444] active:bg-[#222] cursor-pointer flex items-center justify-end pr-2 z-10" onClick={() => handleMoveInput(1, 0)}><ArrowRight className="text-[#666]" size={20}/></div>
                <div className="absolute top-0 left-0 w-10 h-10 bg-[#333] rounded-tl-xl border-t border-l border-[#444] active:bg-[#222] cursor-pointer z-0 flex items-center justify-center" onClick={() => handleMoveInput(-1, -1)}><ArrowUpLeft size={16} className="text-[#444]"/></div>
                <div className="absolute top-0 right-0 w-10 h-10 bg-[#333] rounded-tr-xl border-t border-r border-[#444] active:bg-[#222] cursor-pointer z-0 flex items-center justify-center" onClick={() => handleMoveInput(1, -1)}><ArrowUpRight size={16} className="text-[#444]"/></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 bg-[#333] rounded-bl-xl border-b border-l border-[#444] active:bg-[#222] cursor-pointer z-0 flex items-center justify-center" onClick={() => handleMoveInput(-1, 1)}><ArrowDownLeft size={16} className="text-[#444]"/></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#333] rounded-br-xl border-b border-r border-[#444] active:bg-[#222] cursor-pointer z-0 flex items-center justify-center" onClick={() => handleMoveInput(1, 1)}><ArrowDownRight size={16} className="text-[#444]"/></div>
                <div className="absolute w-8 h-8 bg-[#2a2a2a] rounded-full z-20 shadow-inner"></div>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-[100px] flex flex-col items-center z-10"><button className="w-10 h-10 bg-[#333] rounded-full shadow-[0_2px_0_#111] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-white border border-[#555]" onClick={fireRangedWeapon}><Crosshair size={16}/></button></div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-4 transform -rotate-12">
                <div className="flex flex-col items-center group"><button className="w-14 h-14 bg-[#8b0000] rounded-full shadow-[0_4px_0_#500000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#a00000]" onClick={toggleMenu}>B</button><span className="text-[#666] text-xs font-bold mt-1">MENU</span></div>
                <div className="flex flex-col items-center group"><button className="w-14 h-14 bg-[#ff0000] rounded-full shadow-[0_4px_0_#8b0000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#cc0000]" onMouseDown={() => handlePressStart()} onMouseUp={(e) => handlePressEnd(e)} onMouseLeave={(e) => handlePressEnd(e)} onTouchStart={(e) => { e.preventDefault(); handlePressStart(); }} onTouchEnd={(e) => { e.preventDefault(); handlePressEnd(e); }}>A</button><span className="text-[#666] text-xs font-bold mt-1">ACT</span></div>
            </div>
            <div className="absolute bottom-1 right-1 left-1 h-14 flex items-end justify-end gap-1 pointer-events-none pr-1">
                {dungeonHand.map((card, i) => (<button key={card.id} className="w-10 h-14 bg-[#2a2a2a] border border-[#555] rounded-md flex flex-col items-center justify-start text-white relative shadow p-0.5 pointer-events-auto" onClick={() => handleCardUse(i)}><div className={`w-full text-[4px] font-bold px-0.5 rounded-t mb-0.5 text-center ${card.type === 'ATTACK' ? 'bg-red-900' : card.type === 'DEFENSE' ? 'bg-blue-900' : 'bg-green-900'}`}>{card.type}</div><div className="scale-[0.6]">{card.icon}</div><div className="text-[6px] font-bold text-center leading-none mt-0.5">{card.name}</div></button>))}
            </div>
        </div>
    </div>
  );
};

export default SchoolDungeonRPG2;
