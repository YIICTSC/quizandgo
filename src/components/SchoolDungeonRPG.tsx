
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, Circle, Menu, X, Check, Search, LogOut, Shield, Sword, Target, Trash2, Hammer, FlaskConical, Info, Zap, Skull, Ghost, Award, RotateCcw, Send, Edit3, HelpCircle, Umbrella, Crosshair, FastForward, Coins, ShoppingBag, DollarSign, Map as MapIcon, User, Watch } from 'lucide-react';
import { audioService } from '../services/audioService';
import { createPixelSpriteCanvas } from './PixelSprite';
import { storageService } from '../services/storageService';
import MathChallengeScreen from './MathChallengeScreen';
import { GameMode } from '../types';
import { EXTRA_SCHOOL_DUNGEON_ITEMS } from '../data/schoolDungeonExtraItems';

// --- セッション内アイテム引き継ぎ用変数 ---
let inheritedItemTemplate: Item | null = null;

interface SchoolDungeonRPGProps {
  onBack: () => void;
}

// --- GBC PALETTE (Dynamic based on Floor) ---
// Default: Green
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
const MAP_W = 26; 
const MAP_H = 26; 
const VIEW_W = 11; 
const VIEW_H = 9;
const TILE_SIZE = 16; 
const SCALE = 3; 
const MAX_INVENTORY = 20;

const HUNGER_INTERVAL = 10;
const REGEN_INTERVAL = 5;
const ENEMY_SPAWN_RATE = 25;

// Unidentified names for STAFF items (Umbrellas)
const UNIDENTIFIED_NAMES = [
    "赤い傘", "青い傘", "黄色い傘", "ビニール傘", "黒い傘", "壊れた傘", 
    "高級な傘", "水玉の傘", "花柄の傘", "透明な傘", "和傘", "レースの傘"
];

// --- TYPES ---
type TileType = 'WALL' | 'FLOOR' | 'STAIRS' | 'HALLWAY';
type Direction = { x: 0 | 1 | -1, y: 0 | 1 | -1 };
type ItemCategory = 'WEAPON' | 'ARMOR' | 'RANGED' | 'CONSUMABLE' | 'SYNTH' | 'STAFF' | 'ACCESSORY';
type EnemyType = 'SLIME' | 'GHOST' | 'DRAIN' | 'DRAGON' | 'METAL' | 'FLOATING' | 'THIEF' | 'BAT' | 'BOSS' | 'MANDRAKE' | 'GOLEM' | 'NINJA' | 'MAGE' | 'SHOPKEEPER';
type VisualEffectType = 'SLASH' | 'THUNDER' | 'EXPLOSION' | 'TEXT' | 'FLASH' | 'PROJECTILE' | 'WARP' | 'BEAM' | 'MAGIC_PROJ';
type TrapType = 'BOMB' | 'SLEEP' | 'POISON' | 'WARP' | 'RUST' | 'SUMMON';

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
}

interface Item {
  id: string;
  category: ItemCategory;
  type: string; 
  name: string;
  desc: string;
  value?: number; // Base price / effect value
  power?: number; 
  range?: number;
  count?: number; 
  plus?: number;
  charges?: number; 
  maxCharges?: number;
  price?: number; // Calculated price for shop
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
  gold?: number; // For GOLD entities or Player gold
  dir: Direction;
  
  status: {
      sleep: number;
      confused: number;
      frozen: number;
      blind: number;
      speed: number;
      trapSight?: number; // Added
      poison?: number; // Added
  };
  
  dead?: boolean;
  offset?: { x: number, y: number }; 
  itemData?: Item; 
  equipment?: EquipmentSlots;
  enemyType?: EnemyType;
  shopItems?: Item[]; // For Shopkeeper
  
  // Trap specific
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
    // WEAPONS
    'PENCIL_SWORD': { category: 'WEAPON', type: 'PENCIL_SWORD', name: 'えんぴつソード', desc: '削りたて。攻撃+4', power: 4, value: 200 },
    'METAL_BAT': { category: 'WEAPON', type: 'METAL_BAT', name: '金属バット', desc: 'どうたぬき級。攻撃+8', power: 8, value: 500 },
    'PROTRACTOR_EDGE': { category: 'WEAPON', type: 'PROTRACTOR_EDGE', name: '分度器エッジ', desc: '前方3方向を攻撃できる。攻撃+3', power: 3, value: 400 },
    'OFUDA_RULER': { category: 'WEAPON', type: 'OFUDA_RULER', name: 'お札定規', desc: 'ゴースト系に大ダメージ。攻撃+4', power: 4, value: 350 },
    'VITAMIN_INJECT': { category: 'WEAPON', type: 'VITAMIN_INJECT', name: 'ビタミン注射', desc: 'ドレイン系に大ダメージ。攻撃+5', power: 5, value: 350 },
    'LADLE': { category: 'WEAPON', type: 'LADLE', name: '給食のおたま', desc: '敵を肉(回復)に変えることがある。攻撃+2', power: 2, value: 600 },
    'STAINLESS_PEN': { category: 'WEAPON', type: 'STAINLESS_PEN', name: 'ステンレスペン', desc: 'サビの罠にかからない。攻撃+6', power: 6, value: 450 },
    'RICH_WATCH': { category: 'WEAPON', type: 'RICH_WATCH', name: '金持ちの時計', desc: 'お金を消費して大ダメージ。攻撃+10', power: 10, value: 800 },

    // ARMOR
    'GYM_CLOTHES': { category: 'ARMOR', type: 'GYM_CLOTHES', name: '体操服', desc: '動きやすい。回避率UP。防御+3', power: 3, value: 200 },
    'RANDO_SERU': { category: 'ARMOR', type: 'RANDO_SERU', name: 'ランドセル', desc: '硬いが重い。腹減りが早まる。防御+12', power: 12, value: 500 },
    'PRINCIPAL_SHIELD': { category: 'ARMOR', type: 'PRINCIPAL_SHIELD', name: '校長の盾', desc: '最強の盾。防御+15', power: 15, value: 1000 },
    'VINYL_APRON': { category: 'ARMOR', type: 'VINYL_APRON', name: 'ビニールエプロン', desc: 'サビや汚れを防ぐ。防御+4', power: 4, value: 300 },
    'NAME_TAG': { category: 'ARMOR', type: 'NAME_TAG', name: '名札', desc: '盗難を防ぐ。防御+5', power: 5, value: 250 },
    'DISASTER_HOOD': { category: 'ARMOR', type: 'DISASTER_HOOD', name: '防災頭巾', desc: '爆発ダメージ減少。防御+6', power: 6, value: 350 },
    'FIREFIGHTER': { category: 'ARMOR', type: 'FIREFIGHTER', name: '防火ヘルメット', desc: '炎ダメージ減少。防御+7', power: 7, value: 400 },
    'GOLD_BADGE': { category: 'ARMOR', type: 'GOLD_BADGE', name: '純金の校章', desc: 'サビない。防御+8', power: 8, value: 600 },

    // ACCESSORIES (BRACELETS)
    'RING_POWER': { category: 'ACCESSORY', type: 'RING_POWER', name: 'ちからの腕輪', desc: '攻撃力が上がる。攻撃+3', power: 3, value: 500 },
    'RING_GUARD': { category: 'ACCESSORY', type: 'RING_GUARD', name: 'まもりの腕輪', desc: '防御力が上がる。防御+3', power: 3, value: 500 },
    'RING_HUNGER': { category: 'ACCESSORY', type: 'RING_HUNGER', name: 'ハラヘラズの腕輪', desc: 'お腹が減りにくくなる。', value: 800 },
    'RING_HEAL': { category: 'ACCESSORY', type: 'RING_HEAL', name: '回復の腕輪', desc: 'HPの回復が早くなるが、お腹も減る。', value: 800 },
    'RING_SIGHT': { category: 'ACCESSORY', type: 'RING_SIGHT', name: '透視の腕輪', desc: '敵とアイテムの位置がわかる。', value: 1000 },
    'RING_TRAP': { category: 'ACCESSORY', type: 'RING_TRAP', name: 'ワナ師の腕輪', desc: '罠が見えるようになる。', value: 800 },

    // RANGED
    'CHALK': { category: 'RANGED', type: 'CHALK', name: 'チョーク', desc: '普通の飛び道具。', power: 3, range: 5, count: 8, value: 100 },
    'STONES': { category: 'RANGED', type: 'STONES', name: '石ころ', desc: '必中。範囲攻撃。', power: 2, range: 4, count: 5, value: 80 },
    'SHADOW_PIN': { category: 'RANGED', type: 'SHADOW_PIN', name: '影縫いの画鋲', desc: '当たると移動不可にする。', power: 1, range: 5, count: 3, value: 150 },

    // STAFF (UMBRELLAS) - Requires ID
    'UMB_FIRE': { category: 'STAFF', type: 'UMB_FIRE', name: '火炎放射傘', desc: '振ると前方に炎を放つ。', maxCharges: 5, value: 400 },
    'UMB_THUNDER': { category: 'STAFF', type: 'UMB_THUNDER', name: '避雷針の傘', desc: '振ると前方の敵に雷ダメージ。', maxCharges: 5, value: 400 },
    'UMB_SLEEP': { category: 'STAFF', type: 'UMB_SLEEP', name: '子守唄の傘', desc: '振ると前方の敵を眠らせる。', maxCharges: 5, value: 400 },
    'UMB_BLOW': { category: 'STAFF', type: 'UMB_BLOW', name: '突風の傘', desc: '振ると敵を吹き飛ばす。', maxCharges: 6, value: 350 },
    'UMB_WARP': { category: 'STAFF', type: 'UMB_WARP', name: '早退の傘', desc: '振ると敵をどこかへワープさせる。', maxCharges: 5, value: 350 },
    'UMB_CHANGE': { category: 'STAFF', type: 'UMB_CHANGE', name: '席替えの傘', desc: '振ると敵と場所を入れ替わる。', maxCharges: 6, value: 350 },
    'UMB_BIND': { category: 'STAFF', type: 'UMB_BIND', name: '金縛りの傘', desc: '振ると敵を動けなくする。', maxCharges: 5, value: 400 },
    'UMB_HEAL': { category: 'STAFF', type: 'UMB_HEAL', name: '回復の傘', desc: '振るとHPを回復する(敵に当てると敵が回復)。', maxCharges: 5, value: 500 },

    // CONSUMABLE (Notebooks)
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

    // FOOD/OTHERS
    'FOOD_ONIGIRI': { category: 'CONSUMABLE', type: 'FOOD_ONIGIRI', name: 'おにぎり', desc: 'お腹が50回復。', value: 50 },
    'FOOD_MEAT': { category: 'CONSUMABLE', type: 'FOOD_MEAT', name: '謎の肉', desc: 'お腹100、HP50回復。', value: 100 },
    'GRASS_HEAL': { category: 'CONSUMABLE', type: 'GRASS_HEAL', name: '給食の残り', desc: 'HP100回復。', value: 100 },
    'GRASS_LIFE': { category: 'CONSUMABLE', type: 'GRASS_LIFE', name: '命の野菜', desc: '最大HP+5。HP5回復。', value: 500 },
    'GRASS_SPEED': { category: 'CONSUMABLE', type: 'GRASS_SPEED', name: 'エナドリ', desc: '20ターンの間、倍速になる。', value: 200 },
    'GRASS_EYE': { category: 'CONSUMABLE', type: 'GRASS_EYE', name: '目薬', desc: '50ターンの間、罠が見える。', value: 200 },
    'GRASS_POISON': { category: 'CONSUMABLE', type: 'GRASS_POISON', name: '腐ったパン', desc: '毒を受ける(継続ダメ)＆腹痛。', value: 50 },
    'POT_GLUE': { category: 'SYNTH', type: 'POT_GLUE', name: '工作のり', desc: '装備を合成する。', value: 500 },
    'POT_CHANGE': { category: 'CONSUMABLE', type: 'POT_CHANGE', name: 'びっくり箱', desc: '中身を別のアイテムに変化させる。', value: 400 },
    'BOMB': { category: 'CONSUMABLE', type: 'BOMB', name: '爆弾', desc: '周囲を爆破する。', value: 200 },
    ...EXTRA_SCHOOL_DUNGEON_ITEMS,
};

// --- DIJKSTRA PATHFINDING HELPER ---
const computeDijkstraMap = (map: TileType[][], targetX: number, targetY: number): number[][] => {
    const dMap = Array(MAP_H).fill(0).map(() => Array(MAP_W).fill(9999));
    const queue: {x: number, y: number}[] = [{x: targetX, y: targetY}];
    dMap[targetY][targetX] = 0;

    while(queue.length > 0) {
        const {x, y} = queue.shift()!;
        const dist = dMap[y][x];

        // 8 Neighbors (Cardinal + Diagonal)
        const neighbors = [
            {x:x, y:y-1}, {x:x, y:y+1}, {x:x-1, y:y}, {x:x+1, y:y},
            {x:x-1, y:y-1}, {x:x+1, y:y-1}, {x:x-1, y:y+1}, {x:x+1, y:y+1}
        ];

        for(const n of neighbors) {
            if(n.x >= 0 && n.x < MAP_W && n.y >= 0 && n.y < MAP_H) {
                // Treat Walls as impassable
                if (map[n.y][n.x] !== 'WALL') {
                    // --- CORNER CUTTING CHECK (DIJKSTRA) ---
                    const dx = n.x - x;
                    const dy = n.y - y;
                    if (dx !== 0 && dy !== 0) {
                        if (map[y][x + dx] === 'WALL' || map[y + dy][x] === 'WALL') {
                            continue; // Blocked by corner
                        }
                    }
                    // ---------------------------------------

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

const SchoolDungeonRPG: React.FC<SchoolDungeonRPGProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- STATE ---
  const [map, setMap] = useState<TileType[][]>([]);
  const [visitedMap, setVisitedMap] = useState<boolean[][]>([]); // Fog of War state
  const [floorMapRevealed, setFloorMapRevealed] = useState(false); // Map Scroll effect
  const roomsRef = useRef<RoomRect[]>([]); // Keep track of rooms for logic
  const spriteCache = useRef<Record<string, HTMLCanvasElement>>({});
  
  const [player, setPlayer] = useState<Entity>({
    id: 0, type: 'PLAYER', x: 1, y: 1, char: '@', name: 'わんぱく小学生', 
    hp: 50, maxHp: 50, baseAttack: 3, baseDefense: 0, attack: 3, defense: 0, xp: 0, gold: 0, dir: {x:0, y:1},
    equipment: { weapon: null, armor: null, ranged: null, accessory: null },
    status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0 },
    offset: { x: 0, y: 0 }
  });

  const [enemies, setEnemies] = useState<Entity[]>([]);
  const [floorItems, setFloorItems] = useState<Entity[]>([]);
  const [traps, setTraps] = useState<Entity[]>([]);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  
  // Game Status
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
  const turnCounter = useRef(0);
  const [isEndless, setIsEndless] = useState(false);
  const saveDebounceRef = useRef<any>(null);
  
  const currentTheme = getTheme(floor);

  // Shop State
  const [shopState, setShopState] = useState<{ active: boolean, merchantId: number | null, mode: 'BUY' | 'SELL' }>({ active: false, merchantId: null, mode: 'BUY' });

  // VFX State
  const visualEffects = useRef<VisualEffect[]>([]);
  const shake = useRef<{x: number, y: number, duration: number}>({x: 0, y: 0, duration: 0});
  
  // Synthesis/Change/Blank State
  const [synthState, setSynthState] = useState<{ 
      active: boolean, 
      mode: 'SYNTH' | 'CHANGE' | 'BLANK',
      step: 'SELECT_BASE' | 'SELECT_MAT' | 'SELECT_TARGET' | 'SELECT_EFFECT', 
      baseIndex: number | null 
  }>({ active: false, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null });

  // Identification State
  const [idMap, setIdMap] = useState<Record<string, string>>({}); // RealType -> RandomName
  const [identifiedTypes, setIdentifiedTypes] = useState<Set<string>>(new Set());

  // Menu Navigation
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [blankScrollSelectionIndex, setBlankScrollSelectionIndex] = useState(0);
  const menuListRef = useRef<HTMLDivElement>(null);
  const lastInputType = useRef<'KEY' | 'MOUSE'>('KEY');

  // Inspection
  const [inspectedItem, setInspectedItem] = useState<Item | null>(null);
  const longPressTimer = useRef<any>(null);
  
  // Fast Forward State
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const fastForwardInterval = useRef<any>(null);

  // Math Challenge State
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

  // Init
  useEffect(() => {
    // Generate Sprites
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
    
    // New Sprites
    spriteCache.current['COIN'] = createPixelSpriteCanvas('COIN', 'GEM|#FFD700');
    spriteCache.current['SHOPKEEPER'] = createPixelSpriteCanvas('SHOPKEEPER', 'HUMANOID|#33691e'); 
    spriteCache.current['GOLD_BAG'] = createPixelSpriteCanvas('GOLD_BAG', 'GOLD_BAG|#FFD700');
    spriteCache.current['MAGIC_BULLET'] = createPixelSpriteCanvas('MAGIC_BULLET', 'MAGIC_BULLET|#00BCD4');
    spriteCache.current['TRAP'] = createPixelSpriteCanvas('TRAP', 'CROSS|#0f380f'); // Black cross trap
    spriteCache.current['ACCESSORY'] = createPixelSpriteCanvas('ACCESSORY', 'SHIELD|#FFD700'); // Bracelet/Ring

    // Load Game State
    const savedState = storageService.loadDungeonState();
    if (savedState) {
        restoreState(savedState);
    } else {
        startNewGame();
    }
    
    return () => {
        audioService.stopBGM();
    };
  }, []);

  // Update BGM when theme changes
  useEffect(() => {
      audioService.playBGM(currentTheme.bgm);
  }, [currentTheme.bgm]);

  const restoreState = (save: any) => {
      setMap(save.map);
      setVisitedMap(save.visitedMap || Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(false))); // Fallback for old saves
      setFloorMapRevealed(save.floorMapRevealed || false);
      roomsRef.current = save.rooms || []; // Restore rooms meta
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
      setIdentifiedTypes(new Set(save.identifiedTypes));
      setIsEndless(save.isEndless);
      turnCounter.current = save.turnCounter;
      addLog("冒険を再開した。", currentTheme.colors.C2);
  };

  const saveData = useCallback(() => {
      if (gameOver) return;
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      
      saveDebounceRef.current = setTimeout(() => {
          const state = {
              map, visitedMap, floorMapRevealed, 
              rooms: roomsRef.current, // Save rooms
              player, enemies, floorItems, traps, inventory,
              floor, level, belly, maxBelly,
              idMap, identifiedTypes: Array.from(identifiedTypes),
              isEndless, turnCounter: turnCounter.current
          };
          storageService.saveDungeonState(state);
      }, 500); // 500ms debounce
  }, [map, visitedMap, floorMapRevealed, player, enemies, floorItems, traps, inventory, floor, level, belly, maxBelly, idMap, identifiedTypes, isEndless, gameOver]);

  // Update Visited Map when player moves
  useEffect(() => {
      setVisitedMap(prev => {
          const next = prev.map(row => [...row]);
          let changed = false;
          
          const startX = player.x - Math.floor(VIEW_W/2);
          const startY = player.y - Math.floor(VIEW_H/2);
          
          for (let y = 0; y < VIEW_H; y++) {
              for (let x = 0; x < VIEW_W; x++) {
                  const mx = startX + x;
                  const my = startY + y;
                  if (mx >= 0 && mx < MAP_W && my >= 0 && my < MAP_H) {
                      if (!next[my][mx]) {
                          next[my][mx] = true;
                          changed = true;
                      }
                  }
              }
          }
          return changed ? next : prev;
      });
  }, [player.x, player.y]);

  // Auto-save effect on key state changes
  useEffect(() => {
      if (!gameOver && !gameClear) {
          saveData();
      }
  }, [player, inventory, floor, level, belly, enemies, floorItems, traps, gameOver, gameClear, saveData]);

  // Auto-scroll menu
  useEffect(() => {
      if (lastInputType.current === 'KEY' && menuListRef.current) {
          let activeIndex = selectedItemIndex;
          if (menuOpen && synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT') {
              activeIndex = blankScrollSelectionIndex;
          }
          const items = menuListRef.current.children;
          if (items && items[activeIndex]) {
              (items[activeIndex] as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'instant' }); 
          }
      }
  }, [selectedItemIndex, blankScrollSelectionIndex, menuOpen, shopState.active, shopState.mode, synthState.step, inventory, enemies]);

  // Update Stats
  useEffect(() => {
      setPlayer(p => {
          const wItem = p.equipment?.weapon;
          const aItem = p.equipment?.armor;
          const accItem = p.equipment?.accessory;
          const wPow = (wItem?.power || 0) + (wItem?.plus || 0);
          const aPow = (aItem?.power || 0) + (aItem?.plus || 0);
          const accPow = (accItem?.type === 'RING_POWER' ? (accItem.power || 0) : 0);
          const accDef = (accItem?.type === 'RING_GUARD' ? (accItem.power || 0) : 0);
          
          return {
              ...p,
              attack: p.baseAttack + wPow + accPow,
              defense: p.baseDefense + aPow + accDef
          };
      });
  }, [player.equipment]);

  const addVisualEffect = (type: VisualEffectType, x: number, y: number, options: Partial<VisualEffect> = {}) => {
      visualEffects.current.push({
          id: Date.now() + Math.random(),
          type, x, y,
          duration: type === 'TEXT' ? 30 : 15,
          maxDuration: type === 'TEXT' ? 30 : 15,
          ...options
      });
  };

  const triggerShake = (duration: number) => {
      shake.current.duration = duration;
  };

  const addLog = (msg: string, color?: string) => {
    setLogs(prev => {
        const nextLogs = [...prev, { message: msg, color, id: Date.now() + Math.random() }];
        if (nextLogs.length > 20) return nextLogs.slice(nextLogs.length - 20);
        return nextLogs;
    });
  };

  const saveDungeonScore = (reason: string) => {
      const score = floor * 100 + level * 50 + (inventory.length * 10) + (player.gold || 0);
      storageService.saveDungeonScore({
          id: `dungeon-${Date.now()}`,
          date: Date.now(),
          floor: floor,
          level: level,
          score: score,
          reason: reason
      });
  };

  const startNewGame = () => {
    setFloor(1);
    setLevel(1);
    setBelly(100);
    setMaxBelly(100);
    setGameOver(false);
    setGameClear(false);
    setMenuOpen(false);
    setShopState({ active: false, merchantId: null, mode: 'BUY' });
    setIsEndless(false);
    turnCounter.current = 0;
    visualEffects.current = [];
    setIsFastForwarding(false);
    roomsRef.current = []; // Reset rooms
    
    const shuffledNames = [...UNIDENTIFIED_NAMES].sort(() => Math.random() - 0.5);
    const staffTypes = Object.keys(ITEM_DB).filter(k => ITEM_DB[k].category === 'STAFF');
    const newIdMap: Record<string, string> = {};
    staffTypes.forEach((t, i) => {
        newIdMap[t] = shuffledNames[i] || "謎の傘";
    });
    setIdMap(newIdMap);
    setIdentifiedTypes(new Set());

    const initInventory: Item[] = [];
    
    // 引き継ぎアイテムがある場合はそれを追加
    if (inheritedItemTemplate) {
        initInventory.push({ ...inheritedItemTemplate, id: `inherited-${Date.now()}` });
        inheritedItemTemplate = null; // 使い切り
    }

    initInventory.push({ ...ITEM_DB['FOOD_ONIGIRI'], id: `start-${Date.now()}` });
    initInventory.push({ ...ITEM_DB['PENCIL_SWORD'], id: `start-w-${Date.now()}` });
    setInventory(initInventory);
    
    setPlayer({
        id: 0, type: 'PLAYER', x: 1, y: 1, char: '@', name: 'わんぱく小学生', 
        hp: 50, maxHp: 50, baseAttack: 3, baseDefense: 0, attack: 3, defense: 0, xp: 0, gold: 0, dir: {x:0, y:1},
        equipment: { weapon: null, armor: null, ranged: null, accessory: null },
        status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0 },
        offset: { x: 0, y: 0 }
    });
    setLogs([]);
    generateFloor(1);
    addLog("風来の旅が始まった！");
  };

  const handleRestart = () => {
    if (gameOver && inheritItemIdx !== null) {
        // 引き継ぎアイテムを全所持品（装備含む）から取得
        const selected = allPossessions[inheritItemIdx];
        if (selected) {
            inheritedItemTemplate = { ...selected };
            // IDを新調して装備状態などはリセットされるようにする
            inheritedItemTemplate.id = `inherited-template-${Date.now()}`;
        }
    }
    
    storageService.clearDungeonState();
    startNewGame();
    setInheritItemIdx(null);
  };

  const handleQuit = () => {
      saveData();
      onBack();
  };

  const isPointInRoom = (x: number, y: number) => {
      return (roomsRef.current || []).some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  };

  const spawnEnemy = (x: number, y: number, floorLevel: number): Entity => {
      const r = Math.random();
      let t: EnemyType = 'SLIME';
      let name="敵", hp=10, atk=2, xp=5, def=0;
      const scaling = Math.floor((floorLevel - 1) * 2); 
      const hpScale = Math.floor(floorLevel * 3);
      const xpScale = Math.floor(floorLevel * 1.5);

      if (floorLevel === 1) {
          if (r < 0.6) { t = 'SLIME'; name="スライム"; hp=10; atk=3; xp=5; }
          else { t = 'BAT'; name="コウモリ"; hp=8; atk=4; xp=6; }
      } else {
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

      return {
          id: Date.now() + Math.random(), type: 'ENEMY', x, y, char: t[0], 
          name, hp, maxHp: hp, baseAttack: Math.floor(atk), baseDefense: Math.floor(def), attack: Math.floor(atk), defense: Math.floor(def), xp: Math.floor(xp), dir: {x:0, y:0}, enemyType: t,
          status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0 },
          offset: { x: 0, y: 0 }
      };
  };

  // Helper to create a shopkeeper entity
  const createShopkeeper = (x: number, y: number): Entity => {
      const shopItems: Item[] = [];
      for(let i=0; i<5; i++) {
          const keys = Object.keys(ITEM_DB);
          const key = keys[Math.floor(Math.random() * keys.length)];
          const template = ITEM_DB[key];
          const price = (template.value || 100) * (Math.random() * 0.5 + 0.8);
          shopItems.push({ 
              ...template, 
              id: `shop-${Date.now()}-${i}`, 
              price: Math.floor(price),
              plus: 0, charges: template.maxCharges
          });
      }

      return {
          id: Date.now() + Math.random(), type: 'ENEMY', x, y, char: 'S', 
          name: "購買部員", hp: 1000, maxHp: 1000, baseAttack: 50, baseDefense: 20, attack: 50, defense: 20, xp: 0, dir: {x:0, y:0}, enemyType: 'SHOPKEEPER',
          status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0 },
          offset: { x: 0, y: 0 },
          shopItems
      };
  };

  const generateFloor = (f: number) => {
    const newMap: TileType[][] = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill('WALL'));
    const rooms: {x:number, y:number, w:number, h:number}[] = [];
    
    let attempts = 0;
    while(rooms.length < 8 && attempts < 200) {
        attempts++;
        const w = Math.floor(Math.random() * 4) + 4;
        const h = Math.floor(Math.random() * 4) + 4;
        const x = Math.floor(Math.random() * (MAP_W - w - 2)) + 1;
        const y = Math.floor(Math.random() * (MAP_H - h - 2)) + 1;
        const overlap = rooms.some(r => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y);
        if(!overlap) {
            rooms.push({x, y, w, h});
            for(let ry=y; ry<y+h; ry++) { for(let rx=x; rx<x+w; rx++) newMap[ry][rx] = 'FLOOR'; }
        }
    }
    rooms.sort((a,b) => (a.x + a.y) - (b.x + b.y));
    roomsRef.current = rooms; // Save room metadata

    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i]; const r2 = rooms[i+1];
        let cx = Math.floor(r1.x + r1.w/2); let cy = Math.floor(r1.y + r1.h/2);
        const tx = Math.floor(r2.x + r2.w/2); const ty = Math.floor(r2.y + r2.h/2);
        while(cx !== tx) { newMap[cy][cx] = 'FLOOR'; cx += (tx > cx) ? 1 : -1; }
        while(cy !== ty) { newMap[cy][cx] = 'FLOOR'; cy += (ty > cy) ? 1 : -1; }
    }

    const startRoom = rooms[0];
    const px = Math.floor(startRoom.x + startRoom.w/2);
    const py = Math.floor(startRoom.y + startRoom.h/2);
    setPlayer(prev => ({ ...prev, x: px, y: py }));

    const newEnemies: Entity[] = [];
    const newItems: Entity[] = [];
    const newTraps: Entity[] = [];
    const lastRoom = rooms[rooms.length - 1];
    const sx = Math.floor(lastRoom.x + lastRoom.w/2);
    const sy = Math.floor(lastRoom.y + lastRoom.h/2);

    if (f === 20 && !isEndless) {
        addLog("強烈な殺気を感じる...", "red");
        triggerShake(20);
        newEnemies.push({
            id: Date.now(), type: 'ENEMY', x: sx, y: sy, char: 'B',
            name: "校長先生(真)", hp: 500, maxHp: 500, baseAttack: 30, baseDefense: 10, attack: 30, defense: 10, xp: 5000, 
            dir: {x:0, y:0}, enemyType: 'BOSS',
            status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0 },
            offset: { x: 0, y: 0 }
        });
    } else {
        newMap[sy][sx] = 'STAIRS';
    }
    
    // Collect valid floor tiles for entity placement
    const candidates: {x: number, y: number}[] = [];
    for(let y=0; y<MAP_H; y++) {
        for(let x=0; x<MAP_W; x++) {
            if (newMap[y][x] === 'FLOOR' && (x !== px || y !== py) && (x !== sx || y !== sy)) {
                candidates.push({x, y});
            }
        }
    }
    // Shuffle candidates
    candidates.sort(() => Math.random() - 0.5);

    // --- Dedicated Shop Spawning Process ---
    // 25% chance of a shop appearing on 2F+
    if (f >= 2 && !isEndless && Math.random() < 0.25) {
        // Find a room that isn't the start room or the stairs room
        const shopRoomOptions = rooms.filter(r => 
            !(px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) &&
            !(sx >= r.x && sx < r.x + r.w && sy >= r.y && sy < r.y + r.h)
        );

        if (shopRoomOptions.length > 0) {
            const shopRoom = shopRoomOptions[Math.floor(Math.random() * shopRoomOptions.length)];
            // Look for a safe center spot (not against a wall)
            let shopX = -1, shopY = -1;
            for(let ry = shopRoom.y + 1; ry < shopRoom.y + shopRoom.h - 1; ry++) {
                for(let rx = shopRoom.x + 1; rx < shopRoom.x + shopRoom.w - 1; rx++) {
                    const neighbors = [
                        {x:rx, y:ry-1}, {x:rx, y:ry+1}, {x:rx-1, y:ry}, {x:rx+1, y:ry},
                        {x:rx-1, y:ry-1}, {x:rx+1, y:ry-1}, {x:rx-1, y:ry+1}, {x:rx+1, y:ry+1}
                    ];
                    if (neighbors.every(n => newMap[n.y][n.x] === 'FLOOR')) {
                        shopX = rx; shopY = ry;
                        break;
                    }
                }
                if (shopX !== -1) break;
            }
            
            if (shopX !== -1) {
                newEnemies.push(createShopkeeper(shopX, shopY));
                // Remove this tile from candidates so other things don't spawn on top
                const cIdx = candidates.findIndex(c => c.x === shopX && c.y === shopY);
                if (cIdx !== -1) candidates.splice(cIdx, 1);
            }
        }
    }

    // 1. Spawn Enemies (~5% of floor tiles)
    const enemyCount = Math.floor(candidates.length * 0.05);
    for (let i = 0; i < enemyCount; i++) {
        const t = candidates.pop();
        if (t) {
            newEnemies.push(spawnEnemy(t.x, t.y, f));
        }
    }

    // 2. Spawn Items (Max 10, usually 5-8)
    const itemCount = Math.floor(Math.random() * 4) + 5; 
    for (let i = 0; i < itemCount; i++) {
        const t = candidates.pop();
        if (t) {
            const r = Math.random();
            if (r < 0.2) {
                newItems.push({
                    id: Date.now() + Math.random(), type: 'GOLD', x: t.x, y: t.y, char: '$', name: 'お金',
                    hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0},
                    status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0 },
                    gold: Math.floor(Math.random() * 50 + 10 * f)
                });
            } else {
                const keys = Object.keys(ITEM_DB);
                const key = keys[Math.floor(Math.random() * keys.length)];
                const template = ITEM_DB[key];
                let plus = 0;
                let charges = template.maxCharges || 0;
                if ((template.category === 'WEAPON' || template.category === 'ARMOR') && Math.random() < 0.2) {
                    plus = Math.floor(Math.random() * 2) + 1;
                }
                if (template.category === 'STAFF') {
                    charges = Math.floor(Math.random() * 4) + 2; 
                }
                newItems.push({
                    id: Date.now() + Math.random(), type: 'ITEM', x: t.x, y: t.y, char: '!', 
                    name: template.name, hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0},
                    status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0 },
                    itemData: { 
                        ...template, 
                        id: `item-${Date.now()}-${Math.random()}`, 
                        plus,
                        charges,
                        name: plus > 0 ? `${template.name}+${plus}` : template.name,
                        price: Math.floor((template.value || 100) * 0.5)
                    }
                });
            }
        }
    }

    // 3. Spawn Traps (Fixed range: 2-4 per floor)
    const roomCandidates = candidates.filter(c => isPointInRoom(c.x, c.y));
    const trapCount = Math.floor(Math.random() * 3) + 2; // Reduced trap count
    for (let i = 0; i < trapCount; i++) {
        const t = roomCandidates.pop();
        if (t) {
            const trapTypes: TrapType[] = ['BOMB', 'SLEEP', 'POISON', 'WARP', 'RUST', 'SUMMON'];
            const tType = trapTypes[Math.floor(Math.random() * trapTypes.length)];
            newTraps.push({
                id: Date.now() + Math.random(), type: 'TRAP', x: t.x, y: t.y, char: 'X', name: '罠',
                hp: 0, maxHp: 0, baseAttack: 0, baseDefense: 0, attack: 0, defense: 0, xp: 0, dir: {x:0, y:0},
                status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0 },
                trapType: tType, visible: false
            });
        }
    }

    setMap(newMap);
    setVisitedMap(Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(false)));
    setFloorMapRevealed(false);
    
    setVisitedMap(prev => {
        const next = prev.map(row => [...row]);
        const startX = px - Math.floor(VIEW_W/2);
        const startY = py - Math.floor(VIEW_H/2);
        for(let y=0; y<VIEW_H; y++){
            for(let x=0; x<VIEW_W; x++){
                const mx = startX + x; const my = startY + y;
                if(mx>=0 && mx<MAP_W && my>=0 && my<MAP_H) next[my][mx] = true;
            }
        }
        return next;
    });

    setEnemies(newEnemies);
    setFloorItems(newItems);
    setTraps(newTraps);
    setShowMap(false);
    addVisualEffect('FLASH', 0, 0, {duration: 10, maxDuration: 10});
};

  const gainXp = (amount: number) => {
      let nextXp = player.xp + amount;
      let nextLv = level;
      let nextMaxHp = player.maxHp;
      let nextAtk = player.baseAttack;
      const needed = nextLv * 10;
      if (nextXp >= needed) {
          nextXp -= needed; nextLv++; nextMaxHp += 5; nextAtk += 1;
          setPlayer(p => ({ ...p, hp: nextMaxHp, baseAttack: nextAtk, maxHp: nextMaxHp })); 
          addLog(`レベルが${nextLv}に上がった！`);
          audioService.playSound('buff');
          addVisualEffect('FLASH', 0, 0);
          addVisualEffect('TEXT', player.x, player.y, { value: 'LEVEL UP!', color: currentTheme.colors.C3 });
      }
      setPlayer(p => ({ ...p, xp: nextXp }));
      setLevel(nextLv);
  };

  const processTurn = (px: number, py: number, overrides?: { belly?: number, hp?: number }) => {
      turnCounter.current += 1;
      
      const aType = player.equipment?.armor?.type;
      const heavy = aType === 'RANDO_SERU';
      const accType = player.equipment?.accessory?.type;
      const isHungerResist = accType === 'RING_HUNGER';
      const isHealRing = accType === 'RING_HEAL';

      let hungerRate = heavy ? 0.5 : 1; 
      if (isHungerResist) hungerRate *= 0.5; 
      if (isHealRing) hungerRate *= 2; 

      const interval = Math.floor(HUNGER_INTERVAL / hungerRate);
      const isHungerTurn = turnCounter.current % Math.max(1, interval) === 0;
      
      const regenSpeed = isHealRing ? Math.floor(REGEN_INTERVAL / 2) : REGEN_INTERVAL;
      const isRegenTurn = turnCounter.current % regenSpeed === 0;

      let currentBelly = overrides?.belly !== undefined ? overrides.belly : belly;
      
      if (isHungerTurn) {
          currentBelly -= 1;
      }
      
      let starveDamage = 0;
      if (currentBelly <= 0) {
          currentBelly = 0;
          starveDamage = 1;
      }
      
      setBelly(currentBelly);

      setPlayer(prevPlayer => {
          let currentHp = overrides?.hp !== undefined ? overrides.hp : prevPlayer.hp;
          let nextStatus = { ...prevPlayer.status };
          
          if (nextStatus.trapSight && nextStatus.trapSight > 0) {
              nextStatus.trapSight--;
              if (nextStatus.trapSight === 0) addLog("目が元に戻った。", currentTheme.colors.C2);
          }

          if (nextStatus.poison && nextStatus.poison > 0) {
              const poisonDmg = 5;
              currentHp -= poisonDmg;
              nextStatus.poison--;
              addVisualEffect('TEXT', px, py, { value: `${poisonDmg}`, color: 'purple' });
              addLog("毒のダメージを受けた！", "purple");
              if (nextStatus.poison === 0) addLog("毒が消えた。", currentTheme.colors.C2);
          }
          
          if (starveDamage > 0) {
              currentHp -= 1;
              if (currentHp <= 0) {
                  setGameOver(true); 
                  saveDungeonScore("Starved"); 
                  addLog("空腹で倒れた...", "red"); 
                  storageService.clearDungeonState(); // Clear save on death
              } else {
                  if (turnCounter.current % 5 === 0) addLog("お腹が空いて倒れそうだ...", "red");
              }
          } else if (isRegenTurn && currentHp < prevPlayer.maxHp && currentHp > 0) {
              currentHp += 1;
          }
          
          if (nextStatus.sleep > 0) { nextStatus.sleep--; if (nextStatus.sleep<=0) addLog("目が覚めた！"); }
          if (nextStatus.confused > 0) nextStatus.confused--;
          if (nextStatus.blind > 0) nextStatus.blind--;
          if (nextStatus.frozen > 0) nextStatus.frozen--;

          currentHp = Math.min(prevPlayer.maxHp, currentHp);
          
          return { ...prevPlayer, hp: currentHp, status: nextStatus };
      });

      if (turnCounter.current % ENEMY_SPAWN_RATE === 0) {
          let attempts = 0;
          while (attempts < 5) {
              attempts++;
              const rx = Math.floor(Math.random() * MAP_W);
              const ry = Math.floor(Math.random() * MAP_H);
              if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry) && (rx !== px || ry !== py)) {
                  setEnemies(prev => [...prev, spawnEnemy(rx, ry, floor)]);
                  break;
              }
          }
      }

      // Compute Dijkstra Map for enemy pathfinding
      const dMap = computeDijkstraMap(map, px, py);

      setEnemies(prevEnemies => {
          const nextEnemies: Entity[] = [];
          const occupied = new Set<string>();
          occupied.add(`${px},${py}`);
          const attackingEnemyIds: number[] = [];

          for (const e of prevEnemies) {
              if (e.enemyType === 'SHOPKEEPER') { occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); continue; }

              if (e.status.sleep > 0) { e.status.sleep--; nextEnemies.push(e); occupied.add(`${e.x},${e.y}`); addVisualEffect('TEXT', e.x, e.y, {value:'Zzz', color:currentTheme.colors.C3}); continue; }
              if (e.status.frozen > 0) { e.status.frozen--; nextEnemies.push(e); occupied.add(`${e.x},${e.y}`); continue; }
              
              const dx = px - e.x; const dy = py - e.y;
              const dist = Math.abs(dx) + Math.abs(dy);
              
              // Special Attacks
              if (e.enemyType === 'DRAGON' && dist <= 2 && dist > 0 && Math.random() < 0.3) {
                  addLog(`${e.name}の炎！`, "red");
                  let dmg = 15;
                  if (player.equipment?.armor?.type === 'FIREFIGHTER') dmg = Math.floor(dmg / 2);
                  setPlayer(p => { const nhp = p.hp - dmg; if(nhp<=0) { setGameOver(true); saveDungeonScore(`Killed by ${e.name}`); storageService.clearDungeonState(); } return {...p, hp:nhp}; });
                  occupied.add(`${e.x},${e.y}`); nextEnemies.push(e);
                  addVisualEffect('EXPLOSION', px, py); addVisualEffect('TEXT', px, py, { value: `${dmg}`, color: 'red' });
                  continue;
              }

              if (e.enemyType === 'MAGE' && dist <= 4 && dist > 0 && Math.random() < 0.2) {
                  addLog(`${e.name}の魔法！混乱した！`, "yellow");
                  setPlayer(p => ({ ...p, status: { ...p.status, confused: 5 } }));
                  occupied.add(`${e.x},${e.y}`); nextEnemies.push(e);
                  addVisualEffect('FLASH', px, py);
                  continue;
              }

              let tx = e.x;
              let ty = e.y;
              let moved = false;

              // Confused Movement
              if (e.status.confused > 0) {
                  e.status.confused--;
                  const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
                  const r = dirs[Math.floor(Math.random()*4)];
                  tx = e.x + r[0]; ty = e.y + r[1];
                  moved = true; 
              } 
              // Standard Pathfinding (Dijkstra) if "awake"
              else if (dist <= 15) {
                  const neighbors = [
                      {x:e.x, y:e.y-1}, {x:e.x, y:e.y+1}, {x:e.x-1, y:e.y}, {x:e.x+1, y:e.y},
                      {x:e.x-1, y:e.y-1}, {x:e.x+1, y:e.y-1}, {x:e.x-1, y:e.y+1}, {x:e.x+1, y:e.y+1}
                  ];
                  
                  let bestDist = dMap[e.y][e.x];
                  let bestMove = null;

                  for (const n of neighbors) {
                      if (n.x >= 0 && n.x < MAP_W && n.y >= 0 && n.y < MAP_H && map[n.y][n.x] !== 'WALL') {
                          // CORNER CHECK FOR ENEMY
                          const dx = n.x - e.x;
                          const dy = n.y - e.y;
                          if (dx !== 0 && dy !== 0) {
                              if (map[e.y][e.x + dx] === 'WALL' || map[e.y + dy][e.x] === 'WALL') {
                                  continue; 
                              }
                          }
                          // ----------------------

                          if (!occupied.has(`${n.x},${n.y}`) || (n.x === px && n.y === py)) {
                              if (dMap[n.y][n.x] < bestDist) {
                                  bestDist = dMap[n.y][n.x];
                                  bestMove = n;
                              }
                          }
                      }
                  }

                  if (bestMove) {
                      tx = bestMove.x;
                      ty = bestMove.y;
                      moved = true;
                  }
              }

              if (tx === px && ty === py) {
                  let dmg = Math.max(1, e.attack - player.defense);
                  if (player.equipment?.armor?.type === 'GYM_CLOTHES' && Math.random() < 0.3) { addLog("ひらりと身をかわした！", currentTheme.colors.C2); dmg = 0; addVisualEffect('TEXT', px, py, { value: 'MISS', color: currentTheme.colors.C3 }); }
                  if (player.equipment?.armor?.type === 'NAME_TAG' && e.enemyType === 'THIEF') addLog("名札が盗みを防いだ！");
                  else if (e.enemyType === 'THIEF' && dmg > 0 && Math.random() < 0.3 && inventory.length > 0) { addLog("アイテムを盗まれた！", "red"); const idx = Math.floor(Math.random() * inventory.length); setInventory(inv => inv.filter((_, i) => i !== idx)); }

                  if (dmg > 0) {
                      addLog(`${e.name}の攻撃！${dmg}ダメージ！`, "red");
                      setPlayer(p => { const newHp = p.hp - dmg; if (newHp <= 0) { setGameOver(true); saveDungeonScore(`Killed by ${e.name}`); storageService.clearDungeonState(); } return { ...p, hp: newHp }; });
                      nextEnemies.push({ ...e, offset: { x: (tx - e.x) * 6, y: (ty - e.y) * 6 } });
                      attackingEnemyIds.push(e.id);
                      triggerShake(5);
                      addVisualEffect('TEXT', px, py, { value: `${dmg}`, color: 'red' });
                  } else { nextEnemies.push(e); }
                  occupied.add(`${e.x},${e.y}`);
              } else if (moved) {
                  if (!map[ty][tx] || map[ty][tx] === 'WALL' || occupied.has(`${tx},${ty}`) || prevEnemies.some(o => o.id !== e.id && o.x === tx && o.y === ty)) {
                      occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); 
                  } else {
                      occupied.add(`${tx},${ty}`); nextEnemies.push({ ...e, x: tx, y: ty });
                  }
              } else {
                  occupied.add(`${e.x},${e.y}`); nextEnemies.push(e);
              }
          }
          if (attackingEnemyIds.length > 0) setTimeout(() => setEnemies(curr => curr.map(en => attackingEnemyIds.includes(en.id) ? { ...en, offset: { x: 0, y: 0 } } : en)), 150);
          return nextEnemies;
      });
  };

  const handleMathComplete = (correctCount: number) => {
      setShowMathChallenge(false);
      
      const nextFloor = floor + 1;

      // 全問正解ボーナス (3問)
      if (correctCount >= 3) {
          const recovery = 10; // 10回復
          setBelly(prev => Math.min(maxBelly, prev + recovery));
          addLog(`計算全問正解！満腹度が${recovery}回復した！`, "green");
          audioService.playSound('buff');
      } else {
           // 何もしない、またはログ出力
           if (correctCount > 0) addLog(`${correctCount}問正解。`);
      }
      
      setFloor(nextFloor);
      generateFloor(nextFloor);
      
      // BGM復帰
      const nextTheme = getTheme(nextFloor);
      audioService.playBGM(nextTheme.bgm);
  };

  const movePlayer = (dx: 0|1|-1, dy: 0|1|-1) => {
      if(gameOver || gameClear) return;

      if (shopState.active) {
          if (dy !== 0) {
              const shopkeeper = enemies.find(e => e.id === shopState.merchantId);
              const listLength = shopState.mode === 'BUY' ? (shopkeeper?.shopItems?.length || 0) : inventory.length;
              setSelectedItemIndex(prev => Math.max(0, Math.min(listLength - 1, prev + dy)));
              audioService.playSound('select');
          }
          return;
      }

      if (menuOpen) {
          if (synthState.active) {
              if (synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT') {
                  const knownCount = Array.from(identifiedTypes).filter((t: any) => (t as string).startsWith('SCROLL')).length;
                  if (knownCount > 0) setBlankScrollSelectionIndex(prev => Math.max(0, Math.min(knownCount - 1, prev + dy)));
              } else if (inventory.length > 0) {
                  setSelectedItemIndex(prev => Math.max(0, Math.min(inventory.length - 1, prev + dy)));
              }
              audioService.playSound('select');
          } else {
              if (dy !== 0) {
                  setSelectedItemIndex(prev => Math.max(0, Math.min(inventory.length - 1, prev + dy)));
                  audioService.playSound('select');
              }
          }
          return;
      }

      if(dx === 0 && dy === 0) {
          addLog("足踏みした。");
          processTurn(player.x, player.y);
          return;
      }

      setPlayer(p => ({ ...p, dir: {x: dx, y: dy} }));

      let tx = player.x + dx;
      let ty = player.y + dy;

      if (player.status.confused > 0) {
          if (Math.random() < 0.5) {
              const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
              const r = dirs[Math.floor(Math.random()*4)];
              tx = player.x + r[0]; ty = player.y + r[1];
              addLog("混乱してふらついた！", "yellow");
          }
      }

      // Calculate actual movement delta
      const rdx = tx - player.x;
      const rdy = ty - player.y;

      if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H || map[ty][tx] === 'WALL') return;

      // Corner Check
      if (rdx !== 0 && rdy !== 0) {
          if (map[player.y][player.x + rdx] === 'WALL' || map[player.y + rdy][player.x] === 'WALL') {
              return;
          }
      }

      const target = enemies.find(e => e.x === tx && e.y === ty);
      if (target) {
          if (target.enemyType === 'SHOPKEEPER') {
              addLog("「へいらっしゃい！何にする？」", currentTheme.colors.C2);
              setShopState({ active: true, merchantId: target.id, mode: 'BUY' });
              setSelectedItemIndex(0);
              audioService.playSound('select');
          } else {
              attackEnemy(target);
              processTurn(player.x, player.y); 
          }
          return;
      }

      let finalX = tx; let finalY = ty;
      setPlayer(p => ({ ...p, x: finalX, y: finalY }));
      
      setVisitedMap(prev => {
          const next = prev.map(row => [...row]);
          let changed = false;
          const startX = finalX - Math.floor(VIEW_W/2);
          const startY = finalY - Math.floor(VIEW_H/2);
          for (let y = 0; y < VIEW_H; y++) {
              for (let x = 0; x < VIEW_W; x++) {
                  const mx = startX + x;
                  const my = startY + y;
                  if (mx >= 0 && mx < MAP_W && my >= 0 && my < MAP_H) {
                      if (!next[my][mx]) {
                          next[my][mx] = true;
                          changed = true;
                      }
                  }
              }
          }
          return changed ? next : prev;
      });

      const trap = traps.find(t => t.x === finalX && t.y === finalY);
      if (trap) {
          if (trap.visible) {
              addLog(`${trap.name}を踏んでしまった！`, "red");
              activateTrap(trap);
          } else {
              addLog("罠だ！", "red");
              trap.visible = true; 
              activateTrap(trap);
          }
      }

      const itemIdx = floorItems.findIndex(i => i.x === finalX && i.y === finalY);
      if (itemIdx !== -1) {
          const itemEntity = floorItems[itemIdx];
          if (itemEntity.type === 'GOLD') {
              const amount = itemEntity.gold || 0;
              setPlayer(p => ({ ...p, gold: (p.gold || 0) + amount }));
              addLog(`${amount}円を拾った！`, "yellow");
              setFloorItems(prev => prev.filter((_, i) => i !== itemIdx));
              audioService.playSound('select');
          } else if (itemEntity.itemData) {
              const item = itemEntity.itemData;
              if (inventory.length < MAX_INVENTORY) {
                  setInventory(prev => [...prev, item]);
                  addLog(`${getItemName(item)}を拾った！`);
                  setFloorItems(prev => prev.filter((_, i) => i !== itemIdx));
                  audioService.playSound('select');
              } else {
                  addLog("持ち物がいっぱいで拾えない！", "red");
              }
          }
      }
      
      if (map[ty][tx] === 'STAIRS') addLog("階段がある。", currentTheme.colors.C2);
      processTurn(finalX, finalY);
  };

  const handleActionBtn = () => {
      if (gameOver) { handleRestart(); return; }
      if (gameClear) return;
      if (shopState.active) { handleShopAction(); return; }
      if (menuOpen) {
          if (synthState.active) handleSynthesisStep();
          else if (inventory.length > 0) handleItemAction(selectedItemIndex);
          return;
      }
      
      // 階段処理
      if (map[player.y][player.x] === 'STAIRS') {
           addLog("階段を降りる...");
           audioService.playSound('select');
           setShowMathChallenge(true); // 計算モードへ
           return;
      }

      const tx = player.x + player.dir.x;
      const ty = player.y + player.dir.y;
      const target = enemies.find(e => e.x === tx && e.y === ty);
      if (target) { 
          if (target.enemyType === 'SHOPKEEPER') {
              addLog("「へいらっしゃい！何にする？」", currentTheme.colors.C2);
              setShopState({ active: true, merchantId: target.id, mode: 'BUY' });
              setSelectedItemIndex(0);
              audioService.playSound('select');
          } else {
              attackEnemy(target);
              processTurn(player.x, player.y);
          }
          return;
      }
      
      triggerPlayerAttackAnim(player.dir);
      addVisualEffect('SLASH', tx, ty, { dir: player.dir });
      addLog("素振りをした。");
      audioService.playSound('select');
      processTurn(player.x, player.y);
  };

  const activateTrap = (trap: Entity) => {
      audioService.playSound('wrong');
      const t = trap.trapType;
      
      if (t === 'BOMB') {
          addLog("爆発した！", "red");
          addVisualEffect('EXPLOSION', player.x, player.y);
          let dmg = 20;
          if (player.equipment?.armor?.type === 'DISASTER_HOOD') dmg = Math.floor(dmg / 2);
          setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - dmg) }));
          if (player.hp - dmg <= 0) { setGameOver(true); saveDungeonScore("Killed by Bomb Trap"); }
      } else if (t === 'SLEEP') {
          addLog("眠ってしまった...", "blue");
          setPlayer(p => ({ ...p, status: { ...p.status, sleep: 5 } }));
          addVisualEffect('TEXT', player.x, player.y, { value: 'Zzz', color: 'blue' });
      } else if (t === 'POISON') {
          addLog("毒を受けた！", "purple");
          setBelly(prev => Math.max(0, prev - 20));
          setPlayer(p => ({ ...p, status: { ...p.status, poison: (p.status.poison || 0) + 10 } }));
      } else if (t === 'WARP') {
          addLog("ワープした！", "yellow");
          addVisualEffect('WARP', player.x, player.y);
          let attempts = 0;
          while (attempts < 20) {
              attempts++;
              const rx = Math.floor(Math.random() * MAP_W); const ry = Math.floor(Math.random() * MAP_H);
              if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry)) {
                  setPlayer(p => ({ ...p, x: rx, y: ry }));
                  break;
              }
          }
      } else if (t === 'RUST') {
          addLog("装備がサビてしまった！", "red");
          setPlayer(p => {
              const eq = { ...p.equipment };
              let msg = "";
              if (eq.weapon && eq.weapon.type !== 'STAINLESS_PEN' && eq.weapon.type !== 'GOLD_BADGE') {
                  const newPlus = Math.max(-3, (eq.weapon.plus || 0) - 1);
                  eq.weapon = { ...eq.weapon, plus: newPlus, name: eq.weapon.name.split('+')[0] + (newPlus!==0 ? (newPlus>0 ? `+${newPlus}` : `${newPlus}`) : '') };
                  msg += "武器";
              }
              if (eq.armor && eq.armor.type !== 'GOLD_BADGE' && eq.armor.type !== 'VINYL_APRON') {
                  const newPlus = Math.max(-3, (eq.armor.plus || 0) - 1);
                  eq.armor = { ...eq.armor, plus: newPlus, name: eq.armor.name.split('+')[0] + (newPlus!==0 ? (newPlus>0 ? `+${newPlus}` : `${newPlus}`) : '') };
                  msg += msg ? "と防具" : "防具";
              }
              if (msg) addLog(`${msg}の強さが下がった...`);
              return { ...p, equipment: eq };
          });
      } else if (t === 'SUMMON') {
          addLog("モンスターハウスだ！", "red");
          addVisualEffect('FLASH', 0, 0, { color: 'red', duration: 10 });
          const newEnemies = [];
          for (let i=0; i<3; i++) {
              let attempts = 0;
              while (attempts < 10) {
                  attempts++;
                  const rx = player.x + Math.floor(Math.random()*5 - 2);
                  const ry = player.y + Math.floor(Math.random()*5 - 2);
                  if (rx>=0 && rx<MAP_W && ry>=0 && ry<MAP_H && map[ry][rx] === 'FLOOR' && !enemies.find(e=>e.x===rx&&e.y===ry)) {
                      newEnemies.push(spawnEnemy(rx, ry, floor));
                      break;
                  }
              }
          }
          setEnemies(prev => [...prev, ...newEnemies]);
      }
  };

  const getItemName = (item: Item) => {
      if (item.category === 'WEAPON' || item.category === 'ARMOR' || item.category === 'RANGED' || item.category === 'SYNTH' || item.category === 'CONSUMABLE' || item.category === 'ACCESSORY') return item.name;
      if (item.type.includes('MEAT')) return item.name;
      if (identifiedTypes.has(item.type)) return item.name;
      return idMap[item.type] || item.name;
  };

  const fireRangedWeapon = () => {
      if (menuOpen || shopState.active) return;
      const rangedItem = player.equipment?.ranged;
      if (!rangedItem) {
          addLog("飛び道具を装備していない！");
          return;
      }
      if ((rangedItem.count || 0) <= 0) {
          addLog(`${rangedItem.name}が無くなった！`);
          setPlayer(p => ({ ...p, equipment: { ...p.equipment!, ranged: null } }));
          return;
      }

      const newRanged = { ...rangedItem, count: (rangedItem.count || 0) - 1 };
      setPlayer(p => ({ ...p, equipment: { ...p.equipment!, ranged: newRanged } }));
      
      const { x: dx, y: dy } = player.dir;
      let lx = player.x, ly = player.y;
      let hitEntity: Entity | null = null;

      for (let i=1; i<=8; i++) {
          const tx = player.x + dx * i;
          const ty = player.y + dy * i;
          lx = tx; ly = ty;
          if (map[ty][tx] === 'WALL') { addLog("壁に当たった。"); break; }
          const target = enemies.find(e => e.x === tx && e.y === ty);
          if (target) { hitEntity = target; break; }
      }

      addVisualEffect('PROJECTILE', lx, ly, { dir: player.dir, duration: 10 });
      triggerPlayerAttackAnim(player.dir);

      if (hitEntity) {
          let dmg = 5 + (newRanged.power || 0);
          if (newRanged.type === 'SHADOW_PIN') { hitEntity.status.frozen = 5; addLog("影を縫いつけた！"); }
          
          const newEnemies = enemies.map(e => {
              if (e.id === hitEntity!.id) {
                  const nhp = e.hp - dmg;
                  return { ...e, hp: nhp };
              }
              return e;
          });
          const dead = newEnemies.find(e => e.id === hitEntity!.id && e.hp <= 0);
          if(dead) { gainXp(dead.xp); addLog(`${dead.name}を倒した！`); }
          else { addLog(`${hitEntity.name}に${dmg}ダメージ！`); addVisualEffect('TEXT', hitEntity.x, hitEntity.y, {value:`${dmg}`}); }
          setEnemies(newEnemies.filter(e => e.hp > 0));
          audioService.playSound('attack');
      } else {
          addLog("外した！");
      }
      processTurn(player.x, player.y);
  };

  const handleShopAction = (indexOverride?: number) => {
      const shopkeeper = enemies.find(e => e.id === shopState.merchantId);
      if (!shopkeeper) { setShopState(prev => ({ ...prev, active: false })); return; }

      const idx = indexOverride !== undefined ? indexOverride : selectedItemIndex;

      if (shopState.mode === 'BUY') {
          if (!shopkeeper.shopItems || shopkeeper.shopItems.length === 0) return;
          const item = shopkeeper.shopItems[idx];
          if (!item) return;
          
          if ((player.gold || 0) >= (item.price || 0)) {
              if (inventory.length < MAX_INVENTORY) {
                  setPlayer(p => ({ ...p, gold: (p.gold || 0) - (item.price || 0) }));
                  setInventory(prev => [...prev, item]);
                  
                  // Identify staff if bought from shop
                  if (item.category === 'STAFF' && !identifiedTypes.has(item.type)) {
                      setIdentifiedTypes(prev => new Set(prev).add(item.type));
                      addLog(`${idMap[item.type]}は${item.name}だった！`, "yellow");
                  }

                  const newShopItems = shopkeeper.shopItems.filter((_, i) => i !== idx);
                  setEnemies(prev => prev.map(e => e.id === shopkeeper.id ? { ...e, shopItems: newShopItems } : e));
                  
                  addLog(`${getItemName(item)}を買った！`, currentTheme.colors.C2);
                  audioService.playSound('buff');
                  if (newShopItems.length === 0) setShopState(prev => ({ ...prev, active: false }));
                  else setSelectedItemIndex(prev => Math.min(prev, newShopItems.length - 1));
              } else {
                  addLog("持ち物がいっぱいで拾えない！", "red");
                  audioService.playSound('wrong');
              }
          } else {
              addLog("お金が足りない！", "red");
              audioService.playSound('wrong');
          }
      } else {
          if (inventory.length === 0) return;
          const item = inventory[idx];
          if (!item) return;
          
          if (player.equipment?.weapon === item || player.equipment?.armor === item || player.equipment?.ranged === item || player.equipment?.accessory === item) {
              addLog("装備中のアイテムは売れません。", "red");
              audioService.playSound('wrong');
              return;
          }

          const sellPrice = Math.max(1, Math.floor((item.value || 100) / 2));
          setPlayer(p => ({ ...p, gold: (p.gold || 0) + sellPrice }));
          setInventory(prev => prev.filter((_, i) => i !== idx));
          addLog(`${getItemName(item)}を${sellPrice}円で売った。`, currentTheme.colors.C2);
          audioService.playSound('select');
          setSelectedItemIndex(prev => Math.max(0, Math.min(prev, inventory.length - 2)));
      }
  };

  const triggerPlayerAttackAnim = (dir: Direction) => {
      const shift = 6; 
      setPlayer(p => ({ ...p, offset: { x: dir.x * shift, y: dir.y * shift } }));
      setTimeout(() => setPlayer(p => ({ ...p, offset: { x: 0, y: 0 } })), 100);
  };

  const attackEnemy = (target: Entity) => {
      triggerPlayerAttackAnim(player.dir);
      const targets = [target];
      addVisualEffect('SLASH', target.x, target.y, { dir: player.dir });

      if (player.equipment?.weapon?.type === 'PROTRACTOR_EDGE') {
          const {x: dx, y: dy} = player.dir;
          const others = [];
          if (dx === 0 && dy === -1) { others.push({x: -1, y: -1}, {x: 1, y: -1}); } 
          else if (dx === 0 && dy === 1) { others.push({x: 1, y: 1}, {x: -1, y: 1}); } 
          else if (dx === -1 && dy === 0) { others.push({x: -1, y: 1}, {x: -1, y: -1}); } 
          else if (dx === 1 && dy === 0) { others.push({x: 1, y: -1}, {x: 1, y: 1}); } 
          else if (dx === -1 && dy === -1) { others.push({x: 0, y: -1}, {x: -1, y: 0}); } 
          else if (dx === 1 && dy === -1) { others.push({x: 0, y: -1}, {x: 1, y: 0}); } 
          else if (dx === -1 && dy === 1) { others.push({x: -1, y: 0}, {x: 0, y: 1}); } 
          else if (dx === 1 && dy === 1) { others.push({x: 1, y: 0}, {x: 0, y: 1}); } 

          others.forEach(offset => {
              const tx = player.x + offset.x;
              const ty = player.y + offset.y;
              addVisualEffect('SLASH', tx, ty, { dir: offset as Direction }); 
              addVisualEffect('EXPLOSION', tx, ty, { duration: 10, maxDuration: 10, scale: 0.5 });
              const t = enemies.find(e => e.x === tx && e.y === ty);
              if (t) targets.push(t);
          });
      }

      let newEnemies = [...enemies];
      targets.forEach(t => {
          let dmg = Math.max(1, player.attack - t.defense);
          
          const wType = player.equipment?.weapon?.type;
          if (wType === 'OFUDA_RULER' && t.enemyType === 'GHOST') { dmg = Math.floor(dmg * 1.5); addLog("成仏！", "yellow"); }
          if (wType === 'VITAMIN_INJECT' && t.enemyType === 'DRAIN') { dmg = Math.floor(dmg * 1.5); addLog("特効！", "yellow"); }
          if (wType === 'STAINLESS_PEN' && t.enemyType === 'METAL') { dmg = 1; }
          if (wType === 'RICH_WATCH' && player.gold && player.gold >= 10) { dmg += 10; setPlayer(p => ({...p, gold: (p.gold||0) - 10})); } 
          
          if (Math.random() < 0.1) { dmg *= 2; addLog("会心の一撃！", "red"); triggerShake(5); }

          newEnemies = newEnemies.map(e => {
              if (e.id === t.id) {
                  const nhp = e.hp - dmg;
                  addLog(`${e.name}に${dmg}ダメージ！`);
                  addVisualEffect('TEXT', e.x, e.y, { value: `${dmg}`, color: 'white' });
                  if (nhp <= 0 && wType === 'LADLE' && Math.random() < 0.3) {
                      const meat = { ...ITEM_DB['FOOD_MEAT'], name: `${e.name}の肉`, value: 100, id: `meat-${Date.now()}` };
                      setFloorItems(prev => [...prev, { id: Date.now()+Math.random(), type:'ITEM', x: e.x, y: e.y, char: '!', name: meat.name, hp:0,maxHp:0,baseAttack:0,baseDefense:0,attack:0,defense:0,xp:0,dir:{x:0,y:0}, status:e.status, itemData: meat }]);
                      addLog(`${e.name}を肉に変えた！`, currentTheme.colors.C2);
                  }
                  return { ...e, hp: nhp };
              }
              return e;
          });
      });

      const deads = newEnemies.filter(e => e.hp <= 0);
      deads.forEach(d => {
          if (d.enemyType === 'BOSS') {
              setGameClear(true);
              audioService.playSound('win');
              saveDungeonScore("Cleared");
              storageService.clearDungeonState();
              addVisualEffect('FLASH', 0, 0, { duration: 30, maxDuration: 30 });
          } else {
              addLog(`${d.name}を倒した！ (${d.xp} XP)`);
              gainXp(d.xp);
          }
      });
      setEnemies(newEnemies.filter(e => e.hp > 0));
      audioService.playSound('attack');
  };

  // ... LONG PRESS LOGIC ...
  const handlePressStart = () => {
      if (menuOpen || shopState.active || gameOver || gameClear) return;
      fastForwardInterval.current = setTimeout(() => {
          setIsFastForwarding(true);
      }, 400); 
  };

  const handlePressEnd = (e?: React.TouchEvent | React.MouseEvent) => {
      if (e) e.preventDefault(); 
      if (fastForwardInterval.current) {
          clearTimeout(fastForwardInterval.current);
          fastForwardInterval.current = null;
      }
      
      if (!isFastForwarding) {
          handleActionBtn();
      } else {
          setIsFastForwarding(false);
      }
  };

  // Fast Forward Loop
  useEffect(() => {
      let interval: any = null;
      if (isFastForwarding && !gameOver && !gameClear && !menuOpen && !shopState.active) {
          interval = setInterval(() => {
              const nearby = enemies.some(e => Math.abs(e.x - player.x) <= 2 && Math.abs(e.y - player.y) <= 2);
              if (nearby) {
                  setIsFastForwarding(false);
                  addLog("敵が近くにいる！", "red");
                  return;
              }
              if (player.hp >= player.maxHp && belly > 20) {
                  if (player.hp === player.maxHp) {
                      setIsFastForwarding(false);
                      addLog("HPが回復した。", currentTheme.colors.C2);
                      return;
                  }
              }
              if (belly <= 0) {
                  setIsFastForwarding(false);
                  return;
              }

              processTurn(player.x, player.y);
          }, 50); 
      }
      return () => {
          if (interval) clearInterval(interval);
      };
  }, [isFastForwarding, enemies, player.hp, belly, gameOver, gameClear]);


  const toggleMenu = () => {
      if (shopState.active) {
          setShopState(prev => ({ ...prev, active: false }));
          return;
      }
      if (menuOpen) {
          setMenuOpen(false);
          setSynthState({ active: false, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null });
      } else {
          setMenuOpen(true);
          setSelectedItemIndex(0);
      }
      audioService.playSound('select');
  };

  const startEndlessMode = () => { setIsEndless(true); setGameClear(false); setFloor(f => f + 1); generateFloor(floor + 1); addLog("中学生編(エンドレス)開始！"); };

  const handleSynthesisStep = () => {
      const idx = synthState.mode === 'BLANK' ? blankScrollSelectionIndex : selectedItemIndex;
      const item = inventory[idx];
      
      if (synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT') {
          const knownTypes = Array.from(identifiedTypes).filter((t: any) => (t as string).startsWith('SCROLL')) as string[];
          const targetType = knownTypes[idx];
          const template = ITEM_DB[targetType];
          
          if (template) {
              const blankIdx = synthState.baseIndex!;
              const newItem = { ...template, id: `scribed-${Date.now()}` };
              const newInv = [...inventory];
              newInv[blankIdx] = newItem;
              setInventory(newInv);
              addLog("名前を書き込んだ！");
              setSynthState({ ...synthState, active: false });
              setMenuOpen(false);
              processTurn(player.x, player.y);
          }
          return;
      }

      if (synthState.step === 'SELECT_BASE') {
          if (synthState.mode === 'SYNTH') {
              if (['WEAPON', 'ARMOR'].includes(item.category)) {
                  setSynthState({ ...synthState, step: 'SELECT_MAT', baseIndex: idx });
                  addLog("合成する素材を選んでください");
                  audioService.playSound('select');
              } else { addLog("それはベースにできません", "red"); audioService.playSound('wrong'); }
          } else if (synthState.mode === 'CHANGE') {
              setSynthState({ ...synthState, step: 'SELECT_TARGET', baseIndex: idx });
              addLog("変化させるアイテムを選んでください");
          }
      } else if (synthState.step === 'SELECT_MAT') {
          if (idx === synthState.baseIndex) { addLog("同じアイテムは選べません", "red"); audioService.playSound('wrong'); return; }
          if (['WEAPON', 'ARMOR'].includes(item.category)) {
              const baseIdx = synthState.baseIndex!;
              const baseItem = inventory[baseIdx];
              const matItem = item;
              if (baseItem.category !== matItem.category) { addLog("種類が違うと合成できません", "red"); audioService.playSound('wrong'); return; }
              
              const newPlus = (baseItem.plus || 0) + (matItem.plus || 0) + 1;
              const newItem: Item = { ...baseItem, plus: newPlus, name: `${baseItem.name.split('+')[0]}+${newPlus}` };
              
              const glueIdx = inventory.findIndex(i => i.type === 'POT_GLUE');
              if (glueIdx === -1) { setSynthState({ ...synthState, active: false }); return; }
              let newInv = inventory.map((it, i) => i === baseIdx ? newItem : it).filter((_, i) => i !== idx && i !== glueIdx);
              setInventory(newInv);
              addLog(`合成成功！${newItem.name}になった！`, "yellow");
              addVisualEffect('FLASH', 0, 0);
              audioService.playSound('buff');
              setSynthState({ ...synthState, active: false });
              setMenuOpen(false);
              processTurn(player.x, player.y);
          } else { addLog("それは素材にできません", "red"); audioService.playSound('wrong'); }
      } else if (synthState.step === 'SELECT_TARGET') {
          const potIdx = synthState.baseIndex!;
          if (idx === potIdx) { addLog("壺自身は選べません", "red"); return; }
          const keys = Object.keys(ITEM_DB);
          const key = keys[Math.floor(Math.random() * keys.length)];
          const template = ITEM_DB[key];
          const newItem: Item = { ...template, id: `changed-${Date.now()}`, plus: 0 };
          let newInv = inventory.map((it, i) => i === idx ? newItem : it).filter((_, i) => i !== potIdx);
          setInventory(newInv);
          addLog(`アイテムが${newItem.name}に変化した！`, "yellow");
          addVisualEffect('FLASH', 0, 0);
          audioService.playSound('buff');
          setSynthState({ ...synthState, active: false });
          setMenuOpen(false);
          processTurn(player.x, player.y);
      }
  };

  const executeStaffEffect = (item: Item, target: Entity | null, x: number, y: number): { hit: boolean, msg?: string } => {
      let hit = false;
      let msg = "";

      addVisualEffect('MAGIC_PROJ', 0, 0, {
          startX: player.x,
          startY: player.y,
          targetX: target ? target.x : x, 
          targetY: target ? target.y : y,
          duration: 5,
          maxDuration: 5
      });

      if (item.type === 'UMB_FIRE') {
          addVisualEffect('BEAM', x, y, { color: 'red' });
          if (target) {
              const dmg = 20;
              const nhp = target.hp - dmg;
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: nhp } : e).filter(e => e.hp > 0));
              if (nhp <= 0) { gainXp(target.xp); msg = `${target.name}を燃やした！`; }
              else { msg = `${target.name}に${dmg}ダメージ！`; }
              hit = true;
          }
      } else if (item.type === 'UMB_THUNDER') {
          addVisualEffect('THUNDER', x, y);
          if (target) {
              const dmg = 25;
              const nhp = target.hp - dmg;
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: nhp } : e).filter(e => e.hp > 0));
              if (nhp <= 0) { gainXp(target.xp); msg = `${target.name}に落雷！`; }
              else { msg = `${target.name}に${dmg}ダメージ！`; }
              hit = true;
          }
      } else if (item.type === 'UMB_SLEEP') {
          addVisualEffect('TEXT', x, y, {value: 'Zzz', color: 'blue'});
          if (target) {
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, status: { ...e.status, sleep: 10 } } : e));
              msg = `${target.name}は眠ってしまった。`;
              hit = true;
          }
      } else if (item.type === 'UMB_BLOW') {
          if (target) {
              let tx = target.x; let ty = target.y;
              const dx = target.x - player.x; const dy = target.y - player.y; 
              const ndx = Math.sign(dx); const ndy = Math.sign(dy);
              
              for (let i=0; i<5; i++) {
                  if (map[ty+ndy][tx+ndx] !== 'WALL' && !enemies.some(e=>e.x===tx+ndx && e.y===ty+ndy)) {
                      tx += ndx; ty += ndy;
                  } else { break; }
              }
              if (tx !== target.x || ty !== target.y) {
                  setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, x: tx, y: ty } : e));
                  msg = `${target.name}を吹き飛ばした！`;
                  hit = true;
              } else { msg = "吹き飛ばなかった。"; hit = true; }
          }
      } else if (item.type === 'UMB_WARP') {
          if (target) {
              let attempts = 0;
              while (attempts < 20) {
                  attempts++;
                  const rx = Math.floor(Math.random() * MAP_W); const ry = Math.floor(Math.random() * MAP_H);
                  if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry) && (rx !== player.x || ry !== player.y)) {
                      setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, x: rx, y: ry } : e));
                      msg = `${target.name}はどこかへ消えた。`; hit = true; break;
                  }
              }
          }
      } else if (item.type === 'UMB_CHANGE') {
          if (target) {
              const px = player.x; const py = player.y;
              setPlayer(p => ({...p, x: target.x, y: target.y }));
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, x: px, y: py } : e));
              msg = `${target.name}と入れ替わった！`; hit = true;
          }
      } else if (item.type === 'UMB_BIND') {
          if (target) {
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, status: { ...e.status, frozen: 10 } } : e));
              msg = `${target.name}は金縛りにあった！`; hit = true;
          }
      } else if (item.type === 'UMB_HEAL') {
          if (target) {
              setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: e.maxHp } : e));
              msg = `${target.name}が回復してしまった！`; hit = true;
          }
      }

      return { hit, msg };
  };

  const handleThrowItem = (index: number) => {
      const item = inventory[index];
      if (!item) return;
      
      const { x: dx, y: dy } = player.dir;
      let lx = player.x, ly = player.y;
      let hitEntity: Entity | null = null;

      for (let i=1; i<=8; i++) {
          const tx = player.x + dx * i;
          const ty = player.y + dy * i;
          lx = tx; ly = ty;
          if (map[ty][tx] === 'WALL') { addLog("壁に当たった。"); break; }
          const target = enemies.find(e => e.x === tx && e.y === ty);
          if (target) { hitEntity = target; break; }
      }

      addVisualEffect('PROJECTILE', lx, ly, { dir: player.dir, duration: 10 });
      setInventory(prev => prev.filter((_, i) => i !== index));

      if (hitEntity) {
          let dmg = 2; 
          
          if (item.category === 'WEAPON' || item.category === 'RANGED') dmg = 5 + (item.power || 0);
          if (item.category === 'ARMOR') dmg = 3 + (item.power || 0);
          if (item.type === 'POT_GLUE') { hitEntity.status.frozen = 10; addLog(`${hitEntity.name}はのりで固まった！`); }
          if (item.type.includes('POISON')) { addLog(`${hitEntity.name}に毒を与えた！`); dmg += 10; }
          if (item.type === 'SCROLL_SLEEP') { hitEntity.status.sleep = 10; addLog(`${hitEntity.name}は眠ってしまった！`); }
          
          if (item.category === 'STAFF') {
              const res = executeStaffEffect(item, hitEntity, hitEntity.x, hitEntity.y);
              if (res.msg) addLog(res.msg);
              if (!identifiedTypes.has(item.type)) {
                  setIdentifiedTypes(prev => new Set(prev).add(item.type));
                  addLog(`${idMap[item.type]}は${item.name}だった！`, "yellow");
              }
          } else {
              const newEnemies = enemies.map(e => {
                  if (e.id === hitEntity!.id) {
                      const nhp = e.hp - dmg;
                      return { ...e, hp: nhp };
                  }
                  return e;
              });
              const dead = newEnemies.find(e => e.id === hitEntity!.id && e.hp <= 0);
              if(dead) { gainXp(dead.xp); addLog(`${dead.name}を倒した！`); }
              else { addLog(`${hitEntity.name}に${dmg}ダメージ！`); addVisualEffect('TEXT', hitEntity.x, hitEntity.y, {value:`${dmg}`}); }
              setEnemies(newEnemies.filter(e => e.hp > 0));
          }
          
          audioService.playSound('attack');
      } else {
          if (map[ly][lx] !== 'WALL' && !floorItems.find(i=>i.x===lx && i.y===ly)) {
              setFloorItems(prev => [...prev, {
                  id: Date.now() + Math.random(), type: 'ITEM', x: lx, y: ly, char: '!', name: item.name, 
                  hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0},
                  status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0 },
                  itemData: item
              }]);
              addLog("飛んでいった。");
          } else {
              addLog("彼方へ消え去った。");
          }
      }
      setMenuOpen(false);
      processTurn(player.x, player.y);
  };

  const handleItemAction = (index: number) => {
      const item = inventory[index];
      if (!item) return;

      if (item.category === 'STAFF') {
          const { x: dx, y: dy } = player.dir;
          let target: Entity | null = null;
          let tx = player.x, ty = player.y;
          for(let i=1; i<=10; i++) {
              tx += dx; ty += dy;
              if (map[ty][tx] === 'WALL') break;
              const e = enemies.find(en => en.x === tx && en.y === ty);
              if (e) { target = e; break; }
          }

          if ((item.charges || 0) > 0) {
              const res = executeStaffEffect(item, target, player.x + dx, player.y + dy); 
              if (res.msg) addLog(res.msg);
              else addLog("しかし何も起こらなかった。"); 

              const newCharges = (item.charges || 0) - 1;
              const newItem = { ...item, charges: newCharges };
              setInventory(prev => prev.map((it, i) => i === index ? newItem : it));
              
              if (!identifiedTypes.has(item.type)) {
                  setIdentifiedTypes(prev => new Set(prev).add(item.type));
                  addLog(`${idMap[item.type]}は${item.name}だった！`, "yellow");
              }
              
              audioService.playSound('buff');
              setMenuOpen(false);
              processTurn(player.x, player.y);
          } else {
              addLog("魔力が尽きている！"); 
          }
          return;
      }

      if (item.type === 'POT_GLUE') {
          setSynthState({ active: true, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null });
          addLog("合成のベースとなる装備を選んでください");
          audioService.playSound('select');
          return; 
      }
      if (item.type === 'POT_CHANGE') {
          setSynthState({ active: true, mode: 'CHANGE', step: 'SELECT_BASE', baseIndex: index }); 
          setSynthState(prev => ({...prev, step: 'SELECT_TARGET'}));
          addLog("変化させるアイテムを選んでください");
          audioService.playSound('select');
          return;
      }
      if (item.type === 'SCROLL_BLANK') {
          if (identifiedTypes.size === 0) {
              addLog("書き込める内容を知らない...", "red");
              return;
          }
          setSynthState({ active: true, mode: 'BLANK', step: 'SELECT_EFFECT', baseIndex: index });
          addLog("何を書き込みますか？");
          audioService.playSound('select');
          return;
      }

      let actionDone = false;

      if (item.category === 'WEAPON' || item.category === 'ARMOR' || item.category === 'ACCESSORY') {
          setPlayer(p => {
              let slot: keyof EquipmentSlots = 'weapon';
              if (item.category === 'ARMOR') slot = 'armor';
              if (item.category === 'ACCESSORY') slot = 'accessory';
              
              const currentEquip = p.equipment ? p.equipment[slot] : null;
              const newEquipment = { ...p.equipment!, [slot]: item };
              const newInv = [...inventory];
              newInv.splice(index, 1); 
              if (currentEquip) newInv.push(currentEquip); 
              setInventory(newInv);
              addLog(`${getItemName(item)}を装備した。`);
              return { ...p, equipment: newEquipment };
          });
          actionDone = true;
      } else if (item.category === 'CONSUMABLE') {
          if (item.type.includes('ONIGIRI') || item.type.includes('MEAT')) { 
              const val = item.value || 50;
              let nextBelly = Math.min(maxBelly, belly + val);
              let nextHp = player.hp;
              
              if (item.type.includes('MEAT')) {
                  nextHp = Math.min(player.maxHp, player.hp + 50);
                  addLog(`${item.name}を食べた。元気が出た！`); 
              } else {
                  addLog(`${item.name}を食べた。満腹！`); 
              }
              
              setInventory(prev => prev.filter((_, i) => i !== index));
              setSelectedItemIndex(prev => Math.min(prev, inventory.length - 2));
              setMenuOpen(false);
              processTurn(player.x, player.y, { belly: nextBelly, hp: nextHp });
              audioService.playSound('select');
              return; 
          }
          else if (item.type.includes('HEAL') || item.type === 'GRASS_LIFE') { 
              let healVal = item.value || 30;
              if (item.type === 'GRASS_LIFE') {
                  // Max HP +5, Heal +5
                  setPlayer(p => ({ ...p, maxHp: p.maxHp + 5 }));
                  healVal = 5;
                  addLog("最大HPが上がった！", "yellow");
              }
              
              let nextHp = Math.min(player.maxHp, player.hp + healVal);
              addLog(`HPが${healVal}回復した！`);
              addVisualEffect('TEXT', player.x, player.y, { value: `+${healVal}`, color: 'green' });
              
              setInventory(prev => prev.filter((_, i) => i !== index));
              setSelectedItemIndex(prev => Math.min(prev, inventory.length - 2));
              setMenuOpen(false);
              processTurn(player.x, player.y, { hp: nextHp });
              audioService.playSound('select');
              return;
          }
          else if (item.type === 'GRASS_SPEED') {
              setPlayer(p => ({ ...p, status: { ...p.status, speed: 20 } }));
              addLog("動きが素早くなった！", "yellow");
              addVisualEffect('FLASH', 0, 0, { color: 'blue', duration: 5 });
              actionDone = true;
          }
          else if (item.type === 'GRASS_EYE') {
              setPlayer(p => ({ ...p, status: { ...p.status, trapSight: 50, blind: 0 } }));
              addLog("目が良くなった！", "yellow");
              addVisualEffect('FLASH', 0, 0, { color: 'yellow', duration: 5 });
              actionDone = true;
          }
          else if (item.type === 'GRASS_POISON') {
              setPlayer(p => ({ ...p, status: { ...p.status, poison: (p.status.poison||0) + 10 } }));
              setBelly(prev => Math.max(0, prev - 10)); // Belly reduce
              addLog("ぐはっ！毒だ！", "purple");
              actionDone = true;
          }
          else if (item.type === 'SCROLL_MAP') { setFloorMapRevealed(true); setShowMap(true); addLog("校内図が頭に入った！"); actionDone = true; addVisualEffect('FLASH', 0, 0); }
          else if (item.type === 'SCROLL_THUNDER' || item.type === 'BOMB') {
              const isBomb = item.type === 'BOMB';
              if (isBomb) { addVisualEffect('EXPLOSION', player.x, player.y); } else { addVisualEffect('THUNDER', 0, 0); triggerShake(10); }
              setEnemies(prev => prev.map(e => {
                  const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                  if (item.type === 'BOMB' && dist > 2) return e;
                  const nhp = e.hp - (item.value || 20);
                  addVisualEffect('TEXT', e.x, e.y, {value: `${item.value||20}`, color:'yellow'});
                  if (nhp <= 0) { gainXp(e.xp); return { ...e, hp: 0, dead: true }; }
                  return { ...e, hp: nhp };
              }).filter(e => !e.dead));
              addLog(item.type === 'BOMB' ? "爆発した！" : "雷が落ちた！");
              actionDone = true;
          } else if (item.type === 'SCROLL_SLEEP') {
              setEnemies(prev => prev.map(e => { addVisualEffect('TEXT', e.x, e.y, {value: 'Zzz', color:'blue'}); return { ...e, status: { ...e.status, sleep: 10 } }; }));
              addLog("魔物が眠りについた。"); addVisualEffect('FLASH', 0, 0); actionDone = true;
          } else if (item.type === 'SCROLL_WARP') {
              let attempts = 0;
              while (attempts < 20) {
                  attempts++;
                  const rx = Math.floor(Math.random() * MAP_W); const ry = Math.floor(Math.random() * MAP_H);
                  if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry)) {
                      setPlayer(p => ({ ...p, x: rx, y: ry }));
                      addLog("ワープした！"); addVisualEffect('FLASH', 0, 0); break;
                  }
              }
              actionDone = true;
          } else if (item.type === 'SCROLL_CONFUSE') {
              setEnemies(prev => prev.map(e => ({ ...e, status: { ...e.status, confused: 10 } })));
              addLog("魔物が混乱した！"); addVisualEffect('FLASH', 0, 0); actionDone = true;
          } else if (item.type === 'SCROLL_IDENTIFY') {
              setIdentifiedTypes(prev => {
                  const next = new Set(prev);
                  inventory.forEach(i => next.add(i.type));
                  return next;
              });
              addLog("持ち物が識別された！"); addVisualEffect('FLASH', 0, 0); actionDone = true;
          } else if (item.type === 'SCROLL_UP_W') {
              if (player.equipment?.weapon) {
                  const w = player.equipment.weapon;
                  const newW = { ...w, plus: (w.plus || 0) + 1, name: w.name.split('+')[0] + '+' + ((w.plus || 0) + 1) };
                  setPlayer(p => ({ ...p, equipment: { ...p.equipment!, weapon: newW } }));
                  addLog("武器が強化された！"); actionDone = true;
              } else { addLog("武器を装備していない。"); }
          } else if (item.type === 'SCROLL_UP_A') {
              if (player.equipment?.armor) {
                  const a = player.equipment.armor;
                  const newA = { ...a, plus: (a.plus || 0) + 1, name: a.name.split('+')[0] + '+' + ((a.plus || 0) + 1) };
                  setPlayer(p => ({ ...p, equipment: { ...p.equipment!, armor: newA } }));
                  addLog("防具が強化された！"); actionDone = true;
              } else { addLog("防具を装備していない。"); }
          }
          
          if (actionDone) {
              setInventory(prev => prev.filter((_, i) => i !== index));
              setSelectedItemIndex(prev => Math.min(prev, inventory.length - 2)); 
          }
      } else if (item.category === 'RANGED') {
          setPlayer(p => {
              const currentEquip = p.equipment ? p.equipment.ranged : null;
              const newEquipment = { ...p.equipment!, ranged: item };
              const newInv = [...inventory];
              newInv.splice(index, 1); 
              if (currentEquip) newInv.push(currentEquip); 
              setInventory(newInv);
              addLog(`${item.name}を装備した。`);
              return { ...p, equipment: newEquipment };
          });
          actionDone = true;
      }

      if (actionDone) {
          setMenuOpen(false);
          processTurn(player.x, player.y);
          audioService.playSound('select');
      }
  };

  const handleDropItem = (index: number) => {
      const item = inventory[index];
      if (!item || synthState.active) return;
      let newEquip = player.equipment;
      let changed = false;
      if (player.equipment?.weapon === item) { newEquip = { ...newEquip!, weapon: null }; changed = true; }
      else if (player.equipment?.armor === item) { newEquip = { ...newEquip!, armor: null }; changed = true; }
      else if (player.equipment?.ranged === item) { newEquip = { ...newEquip!, ranged: null }; changed = true; }
      else if (player.equipment?.accessory === item) { newEquip = { ...newEquip!, accessory: null }; changed = true; }
      if (changed) setPlayer(p => ({ ...p, equipment: newEquip }));
      const newInv = inventory.filter((_, i) => i !== index);
      setInventory(newInv);
      const droppedEntity: Entity = {
          id: Date.now() + Math.random(), type: 'ITEM', x: player.x, y: player.y, char: '!', name: item.name,
          hp: 0, maxHp: 0, baseAttack: 0, baseDefense: 0, attack: 0, defense: 0, xp: 0, dir: { x: 0, y: 0 },
          status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0 },
          itemData: item
      };
      setFloorItems(prev => [...prev, droppedEntity]);
      addLog(`${getItemName(item)}を足元に置いた。`);
      audioService.playSound('select');
      setSelectedItemIndex(prev => Math.min(prev, newInv.length - 1));
      if (newInv.length === 0) setMenuOpen(false);
  };

  const handleUnequip = (slot: 'weapon'|'armor'|'ranged'|'accessory') => {
      const item = player.equipment?.[slot];
      if (item) {
          if (inventory.length < MAX_INVENTORY) {
              setPlayer(p => ({ ...p, equipment: { ...p.equipment!, [slot]: null } }));
              setInventory(prev => [...prev, item]);
              addLog(`${getItemName(item)}を外した。`);
              processTurn(player.x, player.y);
          } else { addLog("持ち物がいっぱいで外せない！"); }
      }
  };

  const handleTouchStart = (item: Item) => { longPressTimer.current = setTimeout(() => { setInspectedItem(item); }, 500); };
  const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  const handleMoveInput = (dx: 0|1|-1, dy: 0|1|-1) => {
      movePlayer(dx, dy);
  };

  // --- KEYBOARD ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        lastInputType.current = 'KEY';
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) { e.preventDefault(); }
        if (gameOver) { 
            // ゲームオーバー時は選択モード
            return; 
        }
        if (gameClear) { if (['z', 'Enter', ' '].includes(e.key)) startEndlessMode(); return; }
        if (['x', 'c', 'Escape'].includes(e.key)) { toggleMenu(); return; }
        if ((menuOpen || shopState.active) && (e.key === 'Backspace' || e.key === 'x')) {
            if (shopState.active) { setShopState(prev => ({...prev, active: false})); return; }
            if (synthState.active) { setSynthState({ active: false, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null }); } else { setMenuOpen(false); }
            return;
        }
        if (menuOpen || shopState.active) {
            const listLength = shopState.active && shopState.mode === 'BUY' 
                ? (enemies.find(e=>e.id===shopState.merchantId)?.shopItems?.length||0) 
                : inventory.length;
            
            if (e.key === 'ArrowUp') setSelectedItemIndex(prev => Math.max(0, prev - 1));
            if (e.key === 'ArrowDown') setSelectedItemIndex(prev => Math.min(listLength - 1, prev + 1));
            
            if (shopState.active) {
                if (e.key === 'ArrowLeft' && shopState.mode === 'SELL') {
                    setShopState(prev => ({ ...prev, mode: 'BUY' }));
                    setSelectedItemIndex(0);
                    audioService.playSound('select');
                }
                if (e.key === 'ArrowRight' && shopState.mode === 'BUY') {
                    setShopState(prev => ({ ...prev, mode: 'SELL' }));
                    setSelectedItemIndex(0);
                    audioService.playSound('select');
                }
            }

            if (e.key === 'z' || e.key === 'Enter' || e.key === ' ') handleActionBtn();
            return;
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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, map, enemies, floorItems, menuOpen, gameOver, gameClear, inventory, selectedItemIndex, synthState, shopState]);

  // --- RENDER LOOP ---
  const frameCountRef = useRef(0);
  useEffect(() => {
      const loop = setInterval(() => {
          frameCountRef.current++;
          renderGame();
      }, 50); 
      return () => clearInterval(loop);
  }, [map, player, enemies, floorItems, traps, menuOpen, visitedMap, floorMapRevealed, currentTheme]);

  const renderGame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (!map || map.length === 0) return;

      const w = canvas.width;
      const h = canvas.height;
      const ts = TILE_SIZE * SCALE;

      // Use Theme Colors
      const { C0, C1, C2, C3 } = currentTheme.colors;

      ctx.fillStyle = C0;
      ctx.fillRect(0, 0, w, h);

      ctx.save();

      if (shake.current.duration > 0) {
          const mag = 4;
          const sx = (Math.random() - 0.5) * mag;
          const sy = (Math.random() - 0.5) * mag;
          ctx.translate(sx, sy);
          shake.current.duration--;
      }

      const startX = player.x - Math.floor(VIEW_W/2);
      const startY = player.y - Math.floor(VIEW_H/2);

      const hasSight = player.equipment?.accessory?.type === 'RING_SIGHT';
      const hasTrapSight = (player.equipment?.accessory?.type === 'RING_TRAP') || (player.status.trapSight && player.status.trapSight > 0);

      for (let y = 0; y < VIEW_H; y++) {
          for (let x = 0; x < VIEW_W; x++) {
              const mx = startX + x;
              const my = startY + y;
              const sx = x * ts;
              const sy = y * ts;

              if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) {
                  ctx.fillStyle = C0;
                  ctx.fillRect(sx, sy, ts, ts);
                  continue;
              }

              const isRevealed = floorMapRevealed || (visitedMap[my] && visitedMap[my][mx]);
              const tile = map[my][mx];
              
              if (isRevealed) {
                  if (tile === 'WALL') {
                      ctx.fillStyle = C1;
                      ctx.fillRect(sx, sy, ts, ts);
                      ctx.fillStyle = C0;
                      ctx.fillRect(sx+ts/4, sy+ts/4, ts/2, ts/2);
                  } else {
                      ctx.fillStyle = C3;
                      ctx.fillRect(sx, sy, ts, ts);
                      if (tile === 'STAIRS') {
                          ctx.fillStyle = C1;
                          for(let i=0; i<3; i++) ctx.fillRect(sx, sy + i*(ts/3), ts, 2);
                      }
                  }
                  
                  const trap = traps.find(t => t.x === mx && t.y === my);
                  if (trap && (trap.visible || hasTrapSight)) {
                      const sprite = spriteCache.current['TRAP'];
                      if (sprite) ctx.drawImage(sprite, sx, sy, ts, ts);
                  }
              } else {
                  ctx.fillStyle = C0;
                  ctx.fillRect(sx, sy, ts, ts);
              }

              const canSeeEntities = isRevealed || hasSight;

              if (canSeeEntities) {
                  const item = floorItems.find(i => i.x === mx && i.y === my);
                  if (item) {
                      let spriteKey = 'CONSUMABLE';
                      if (item.type === 'GOLD') {
                          spriteKey = 'GOLD_BAG';
                      } else if (item.itemData) {
                          const cat = item.itemData.category;
                          if (cat === 'WEAPON') spriteKey = 'WEAPON';
                          if (cat === 'ARMOR') spriteKey = 'ARMOR';
                          if (cat === 'RANGED') spriteKey = 'RANGED';
                          if (cat === 'STAFF') spriteKey = 'STAFF';
                          if (cat === 'ACCESSORY') spriteKey = 'ACCESSORY';
                          if (item.itemData.type === 'POT_GLUE') spriteKey = 'SYNTH';
                      }
                      
                      const sprite = spriteCache.current[spriteKey];
                      if (sprite) {
                          ctx.drawImage(sprite, sx, sy, ts, ts);
                      } else {
                          ctx.fillStyle = C1;
                          ctx.fillRect(sx + 4*SCALE, sy + 4*SCALE, 8*SCALE, 8*SCALE);
                      }
                  }

                  const enemy = enemies.find(e => e.x === mx && e.y === my);
                  if (enemy) {
                      const spriteKey = enemy.enemyType || 'SLIME';
                      const sprite = spriteCache.current[spriteKey];
                      const offX = (enemy.offset?.x || 0) * SCALE;
                      const offY = (enemy.offset?.y || 0) * SCALE;

                      if (sprite) {
                          if (enemy.status.sleep > 0) ctx.globalAlpha = 0.5;
                          ctx.drawImage(sprite, sx + offX, sy + offY, ts, ts);
                          ctx.globalAlpha = 1.0;
                          if (enemy.status.sleep > 0) { ctx.fillStyle='white'; ctx.font='10px monospace'; ctx.fillText('Zzz', sx, sy); }
                      } else {
                          ctx.fillStyle = C1;
                          ctx.fillRect(sx + 2*SCALE + offX, sy + 2*SCALE + offY, 12*SCALE, 12*SCALE);
                      }
                  }
              }

              if (mx === player.x && my === player.y) {
                  let spriteKey = 'PLAYER_FRONT';
                  let flip = false;
                  if (player.dir.y === -1) spriteKey = 'PLAYER_BACK';
                  else if (player.dir.x !== 0) {
                      spriteKey = 'PLAYER_SIDE';
                      if (player.dir.x === -1) flip = true;
                  }
                  const sprite = spriteCache.current[spriteKey];
                  const offX = (player.offset?.x || 0) * SCALE;
                  const offY = (player.offset?.y || 0) * SCALE;

                  if (sprite) {
                      if (flip) {
                          ctx.save();
                          ctx.translate(sx + ts + offX, sy + offY);
                          ctx.scale(-1, 1);
                          ctx.drawImage(sprite, 0, 0, ts, ts);
                          ctx.restore();
                      } else {
                          ctx.drawImage(sprite, sx + offX, sy + offY, ts, ts);
                      }
                  } else {
                      ctx.fillStyle = C0;
                      ctx.fillRect(sx + 3*SCALE + offX, sy + 3*SCALE + offY, 10*SCALE, 10*SCALE);
                  }
              }
          }
      }

      visualEffects.current.forEach((fx, i) => {
          fx.duration--;
          
          let currentX = fx.x;
          let currentY = fx.y;

          if (fx.type === 'MAGIC_PROJ' && fx.startX !== undefined && fx.targetX !== undefined && fx.startY !== undefined && fx.targetY !== undefined) {
              const progress = 1 - (fx.duration / fx.maxDuration);
              currentX = fx.startX + (fx.targetX - fx.startX) * progress;
              currentY = fx.startY + (fx.targetY - fx.startY) * progress;
              
              const sprite = spriteCache.current['MAGIC_BULLET'];
              const sx = (currentX - startX) * ts;
              const sy = (currentY - startY) * ts;
              
              if (sprite) {
                   if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                       ctx.drawImage(sprite, sx, sy, ts, ts);
                   }
              }
              return; 
          }

          const sx = (fx.x - startX) * ts;
          const sy = (fx.y - startY) * ts;
          
          if (fx.type === 'FLASH' || fx.type === 'THUNDER') {
              ctx.fillStyle = fx.type === 'THUNDER' ? 'yellow' : 'white';
              ctx.globalAlpha = fx.duration / (fx.maxDuration || 20);
              ctx.fillRect(0, 0, w, h);
              ctx.globalAlpha = 1.0;
          }
          else if (fx.type === 'SLASH') {
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  ctx.strokeStyle = 'white';
                  ctx.lineWidth = 4;
                  ctx.beginPath();
                  const d = fx.dir || {x:1, y:0};
                  const cx = sx + ts/2;
                  const cy = sy + ts/2;
                  ctx.moveTo(cx - d.y*10 - d.x*10, cy - d.x*10 + d.y*10);
                  ctx.lineTo(cx + d.y*10 + d.x*10, cy + d.x*10 - d.y*10);
                  ctx.stroke();
              }
          }
          else if (fx.type === 'EXPLOSION') {
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  ctx.fillStyle = ['white', 'orange', 'red'][Math.floor(Math.random()*3)];
                  const rad = (1 - fx.duration / fx.maxDuration) * ts * (fx.scale || 2);
                  ctx.beginPath();
                  ctx.arc(sx + ts/2, sy + ts/2, rad, 0, Math.PI*2);
                  ctx.fill();
              }
          }
          else if (fx.type === 'BEAM') {
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  ctx.strokeStyle = fx.color || 'red';
                  ctx.lineWidth = 5;
                  ctx.beginPath();
                  const d = fx.dir || {x:1, y:0};
                  const cx = sx + ts/2;
                  const cy = sy + ts/2;
                  ctx.moveTo(cx, cy);
                  ctx.lineTo(cx + d.x * 100, cy + d.y * 100);
                  ctx.stroke();
              }
          }
          else if (fx.type === 'PROJECTILE') {
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  ctx.fillStyle = currentTheme.colors.C3;
                  ctx.beginPath();
                  ctx.arc(sx + ts/2, sy + ts/2, 4 * SCALE, 0, Math.PI*2);
                  ctx.fill();
              }
          }
          else if (fx.type === 'WARP') {
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  ctx.fillStyle = 'cyan';
                  const alpha = fx.duration / (fx.maxDuration || 10);
                  ctx.globalAlpha = alpha;
                  ctx.beginPath();
                  ctx.arc(sx + ts/2, sy + ts/2, 10 * SCALE, 0, Math.PI*2);
                  ctx.fill();
                  ctx.globalAlpha = 1.0;
              }
          }
          else if (fx.type === 'TEXT') {
              if (sx >= -ts && sx < w && sy >= -ts && sy < h) {
                  ctx.fillStyle = fx.color || 'white';
                  ctx.font = 'bold 16px monospace';
                  ctx.strokeStyle = 'black';
                  ctx.lineWidth = 2;
                  const lift = (1 - fx.duration / fx.maxDuration) * 20;
                  ctx.strokeText(fx.value || '', sx + ts/2, sy - lift + ts);
                  ctx.fillText(fx.value || '', sx + ts/2, sy - lift + ts);
              }
          }
      });
      visualEffects.current = visualEffects.current.filter(fx => fx.duration > 0);

      ctx.restore();
  };

  const getInspectedDescription = (item: Item) => {
      if (item.category === 'STAFF' && !identifiedTypes.has(item.type)) {
          return "振ってみるまで分からない。";
      }
      return item.desc;
  };

  // --- STYLE VARIABLES FOR THEME ---
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
                        {inspectedItem.power && (
                            <div>
                                {inspectedItem.category === 'ARMOR' ? '防御' : '威力'}: {inspectedItem.power + (inspectedItem.plus || 0)}
                                {inspectedItem.plus ? <span className="text-[9px] font-normal ml-1">({inspectedItem.power}+{inspectedItem.plus})</span> : ''}
                            </div>
                        )}
                        {inspectedItem.value && <div>効果: {inspectedItem.value}</div>}
                    </div>
                </div>
            </div>
        )}
        
        {/* Math Challenge Overlay (Full Screen) */}
        {showMathChallenge && (
             <div className="fixed inset-0 z-[100] w-full h-full pointer-events-auto">
                 <MathChallengeScreen mode={GameMode.MIXED} onComplete={handleMathComplete} />
             </div>
        )}

        {/* Status Screen */}
        {showStatus && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: `${C0}F2` }} onClick={() => setShowStatus(false)}>
                <div className="w-full max-w-md border-4 p-6 shadow-xl overflow-y-auto max-h-[80vh] custom-scrollbar" style={{ backgroundColor: C3, borderColor: C1, color: C0 }} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 border-b-2 pb-2" style={{ borderColor: C1 }}>
                        <h2 className="font-bold text-xl flex items-center"><User className="mr-2"/> ステータス</h2>
                        <button onClick={() => setShowStatus(false)}><X size={24}/></button>
                    </div>
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
                                <div>
                                    <span className="font-bold mr-2">[武]</span> 
                                    {player.equipment?.weapon ? (
                                        <span>
                                            {getItemName(player.equipment.weapon)} 
                                            {player.equipment.weapon.plus ? `+${player.equipment.weapon.plus}` : ''}
                                            <span className="text-[10px] ml-1 opacity-70">
                                                ({(player.equipment.weapon.power||0) + (player.equipment.weapon.plus||0)})
                                            </span>
                                        </span>
                                    ) : 'なし'}
                                </div>
                                <div>
                                    <span className="font-bold mr-2">[防]</span> 
                                    {player.equipment?.armor ? (
                                        <span>
                                            {getItemName(player.equipment.armor)} 
                                            {player.equipment.armor.plus ? `+${player.equipment.armor.plus}` : ''}
                                            <span className="text-[10px] ml-1 opacity-70">
                                                ({(player.equipment.armor.power||0) + (player.equipment.armor.plus||0)})
                                            </span>
                                        </span>
                                    ) : 'なし'}
                                </div>
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
                                {player.status.poison && player.status.poison > 0 && <span className="px-2 rounded" style={{ backgroundColor: C1, color: C3 }}>毒</span>}
                                {Object.values(player.status).every((v: number) => v <= 0) && <span>健康</span>}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setShowStatus(false)} className="mt-6 w-full py-2 font-bold rounded" style={{ backgroundColor: C1, color: C3 }}>閉じる</button>
                </div>
            </div>
        )}

        {/* Help Screen */}
        {showHelp && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: `${C0}F2` }} onClick={() => setShowHelp(false)}>
                <div className="w-full max-w-md border-4 p-6 shadow-xl overflow-y-auto max-h-[80vh] custom-scrollbar" style={{ backgroundColor: C3, borderColor: C1, color: C0 }} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 border-b-2 pb-2" style={{ borderColor: C1 }}>
                        <h2 className="font-bold text-xl flex items-center"><HelpCircle className="mr-2"/> 遊び方</h2>
                        <button onClick={() => setShowHelp(false)}><X size={24}/></button>
                    </div>
                    <div className="space-y-4 text-sm">
                        <section>
                            <h3 className="font-bold border-b mb-1" style={{ borderColor: C1 }}>目的</h3>
                            <p>地下20階を目指し、校長先生を説得(撃破)してください。<br/>道中で落ちている武器や道具を駆使して生き残りましょう。</p>
                        </section>
                        <section>
                            <h3 className="font-bold border-b mb-1" style={{ borderColor: C1 }}>操作方法</h3>
                            <ul className="list-disc pl-5">
                                <li><strong>移動:</strong> 十字キー または 画面パッド</li>
                                <li><strong>攻撃:</strong> Aボタン または Zキー</li>
                                <li><strong>メニュー:</strong> Bボタン または Xキー</li>
                                <li><strong>飛び道具:</strong> <Crosshair size={12} className="inline"/>ボタン または Rキー</li>
                                <li><strong>早送り:</strong> Aボタン長押し (敵がいない時)</li>
                            </ul>
                        </section>
                        <section>
                            <h3 className="font-bold border-b mb-1" style={{ borderColor: C1 }}>ヒント</h3>
                            <ul className="list-disc pl-5">
                                <li>お腹が減るとHPが減ります。おにぎりやパンを食べましょう。</li>
                                <li><strong className="text-red-700">傘</strong>は振ると魔法が出ますが、回数制限があります。使い切ったら投げましょう。</li>
                                <li><strong className="text-blue-700">腕輪</strong>は装備するだけで効果があります。</li>
                                <li>「工作のり」を使うと、装備を合成して強くできます。</li>
                                <li>敵に囲まれたら通路に逃げ込みましょう。</li>
                                <li>まれに購買部員(店)が現れます。アイテム売買が可能です。</li>
                            </ul>
                        </section>
                    </div>
                    <button onClick={() => setShowHelp(false)} className="mt-6 w-full py-2 font-bold rounded" style={{ backgroundColor: C1, color: C3 }}>閉じる</button>
                </div>
            </div>
        )}

        {/* --- LEFT: D-PAD (PC/Tablet Landscape & Desktop) --- */}
        <div className="hidden landscape:flex md:flex order-1 w-48 md:w-64 flex-col items-center justify-center p-4 bg-[#1a1a2a] border-2 border-[#333] rounded-xl shadow-2xl relative shrink-0">
            <div className="w-40 h-40 relative flex items-center justify-center">
                <div className="w-12 h-12 bg-[#333] z-10 rounded-sm"></div>
                {/* D-PAD Buttons */}
                <div className="absolute top-0 w-12 h-16 bg-[#333] rounded-t-md border-t border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center pt-2 z-0" onClick={() => handleMoveInput(0, -1)}><ArrowUp className="text-[#666]" size={24}/></div>
                <div className="absolute bottom-0 w-12 h-16 bg-[#333] rounded-b-md border-b border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center items-end pb-2 z-0" onClick={() => handleMoveInput(0, 1)}><ArrowDown className="text-[#666]" size={24}/></div>
                <div className="absolute left-0 w-16 h-12 bg-[#333] rounded-l-md border-l border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center pl-2 z-0" onClick={() => handleMoveInput(-1, 0)}><ArrowLeft className="text-[#666]" size={24}/></div>
                <div className="absolute right-0 w-16 h-12 bg-[#333] rounded-r-md border-r border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-end pr-2 z-0" onClick={() => handleMoveInput(1, 0)}><ArrowRight className="text-[#666]" size={24}/></div>
                
                {/* Diagonals */}
                <div className="absolute top-2 left-2 w-10 h-10 bg-[#2a2a2a] rounded-tl-xl border-t border-l border-[#333] active:bg-[#111] cursor-pointer z-0" onClick={() => handleMoveInput(-1, -1)}></div>
                <div className="absolute top-2 right-2 w-10 h-10 bg-[#2a2a2a] rounded-tr-xl border-t border-r border-[#333] active:bg-[#111] cursor-pointer z-0" onClick={() => handleMoveInput(1, -1)}></div>
                <div className="absolute bottom-2 left-2 w-10 h-10 bg-[#2a2a2a] rounded-bl-xl border-b border-l border-[#333] active:bg-[#111] cursor-pointer z-0" onClick={() => handleMoveInput(-1, 1)}></div>
                <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#2a2a2a] rounded-br-xl border-b border-r border-[#333] active:bg-[#111] cursor-pointer z-0" onClick={() => handleMoveInput(1, 1)}></div>
                
                <div className="absolute w-10 h-10 bg-[#2a2a2a] rounded-full z-20 shadow-inner"></div>
            </div>
            <div className="mt-8 text-[#444] font-black tracking-widest text-xs italic">DIRECTION</div>
        </div>

        {/* --- CENTER: GAME SCREEN & LOGS --- */}
        <div className="w-full max-w-md md:max-w-full md:flex-1 flex flex-col gap-2 min-h-0 order-2">
            <div className="w-full aspect-[4/3] md:aspect-auto md:flex-1 relative shrink-0 shadow-lg border-2 max-h-[45vh] md:max-h-full flex flex-col overflow-hidden" style={{ backgroundColor: C3, borderColor: C0 }}>
                <div className="w-full h-full relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-8 flex justify-between items-center px-2 text-[10px] z-10 border-b" style={{ backgroundColor: C0, color: C3, borderColor: C1 }}>
                        <span className="font-bold tracking-widest">{currentTheme.name}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setShowMap(!showMap)} className="flex items-center gap-1 hover:text-white border px-1 rounded" style={{ borderColor: C3 }}><MapIcon size={10}/> Map</button>
                            <button onClick={() => setShowStatus(true)} className="flex items-center gap-1 hover:text-white border px-1 rounded" style={{ borderColor: C3 }}><User size={10}/> Sts</button>
                            <button onClick={() => setShowHelp(true)} className="flex items-center gap-1 hover:text-white border px-1 rounded" style={{ borderColor: C3 }}><HelpCircle size={10}/> Help</button>
                        </div>
                    </div>

                    <div className="absolute top-8 left-0 w-full h-5 flex justify-between items-center px-2 text-xs font-bold z-10" style={{ backgroundColor: C1, color: C3 }}>
                        <span>{floor}F</span>
                        <span>Lv{level}</span>
                        <span>HP{player.hp}/{player.maxHp}</span>
                        <span>A{player.attack}D{player.defense}</span>
                        <span className="flex items-center"><Coins size={10} className="mr-0.5"/>{player.gold}</span>
                        <span>🍙{belly}%</span>
                    </div>

                    <canvas ref={canvasRef} width={VIEW_W * TILE_SIZE * SCALE} height={VIEW_H * TILE_SIZE * SCALE} className="w-full h-full object-contain pixel-art mt-6" style={{ imageRendering: 'pixelated' }} />

                    {/* Fast Forward Indicator */}
                    {isFastForwarding && (
                        <div className="absolute top-16 right-2 animate-pulse flex items-center rounded px-2" style={{ backgroundColor: `${C0}80`, color: C3 }}>
                            <FastForward size={16} className="mr-1"/> 早送り中
                        </div>
                    )}

                    {/* Map Overlay */}
                    {showMap && map.length > 0 && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center p-8 mt-12" style={{ backgroundColor: `${C0}E6` }}>
                            <div className="w-full h-full border grid" style={{ borderColor: C3, gridTemplateColumns: `repeat(${MAP_W}, 1fr)` }}>
                                {map.map((row, y) => row.map((tile, x) => {
                                    const isRevealed = floorMapRevealed || (visitedMap[y] && visitedMap[y][x]);
                                    const isPlayer = x === player.x && y === player.y;
                                    const hasSight = player.equipment?.accessory?.type === 'RING_SIGHT';
                                    const hasTrapSight = (player.equipment?.accessory?.type === 'RING_TRAP') || (player.status.trapSight && player.status.trapSight > 0);
                                    const hasItem = floorItems.some(i => i.x===x && i.y===y);
                                    const hasEnemy = enemies.some(e => e.x===x && e.y===y);
                                    
                                    let bgStyle = { backgroundColor: 'transparent' };
                                    let content = null;

                                    if (isPlayer) {
                                        content = <div className="w-full h-full bg-white rounded-full animate-pulse"></div>;
                                    } else if (isRevealed) {
                                        if (tile === 'STAIRS') bgStyle = { backgroundColor: C3 };
                                        else if (tile !== 'WALL') bgStyle = { backgroundColor: C1 };
                                        
                                        if (tile !== 'WALL') {
                                            if (traps.some(t => t.x===x && t.y===y && (t.visible || hasTrapSight))) {
                                                content = <div className="w-full h-full flex items-center justify-center text-[4px] text-red-500 font-bold">X</div>;
                                            } else if (hasEnemy && hasSight) {
                                                content = <div className="w-full h-full bg-red-500 rounded-full"></div>;
                                            } else if (hasItem && hasSight) {
                                                content = <div className="w-full h-full bg-blue-400 rounded-sm"></div>;
                                            }
                                        }
                                    } else {
                                        if (hasEnemy && hasSight) {
                                            content = <div className="w-full h-full bg-red-500 rounded-full"></div>;
                                        } else if (hasItem && hasSight) {
                                            content = <div className="w-full h-full bg-blue-400 rounded-sm"></div>;
                                        }
                                    }
                                    return <div key={`${x}-${y}`} style={bgStyle}>{content}</div>;
                                }))}
                            </div>
                            <button onClick={() => setShowMap(false)} className="absolute bottom-4 border px-2 rounded hover:opacity-80" style={{ color: C3, borderColor: C3 }}>Close</button>
                        </div>
                    )}

                    {/* Shop Menu */}
                    {shopState.active && (
                        <div className="absolute right-0 top-0 bottom-0 w-3/4 border-l-2 z-30 p-2 text-xs flex flex-col" style={{ backgroundColor: C0, borderColor: C3, color: C3 }}>
                            <div className="flex justify-between items-center border-b mb-2 pb-1" style={{ borderColor: C3 }}>
                                <h3 className="font-bold flex items-center"><ShoppingBag size={12} className="mr-1"/> 購買部</h3>
                                <button onClick={() => setShopState(prev => ({...prev, active: false}))}><X size={12}/></button>
                            </div>
                            
                            <div className="flex gap-2 mb-2">
                                <button 
                                    className={`flex-1 py-1 text-center border`}
                                    style={{ 
                                        borderColor: C3, 
                                        backgroundColor: shopState.mode === 'BUY' ? C3 : 'transparent',
                                        color: shopState.mode === 'BUY' ? C0 : C3
                                    }}
                                    onClick={() => { setShopState(prev => ({ ...prev, mode: 'BUY' })); setSelectedItemIndex(0); }}
                                >
                                    買う
                                </button>
                                <button 
                                    className={`flex-1 py-1 text-center border`}
                                    style={{ 
                                        borderColor: C3, 
                                        backgroundColor: shopState.mode === 'SELL' ? C3 : 'transparent',
                                        color: shopState.mode === 'SELL' ? C0 : C3
                                    }}
                                    onClick={() => { setShopState(prev => ({ ...prev, mode: 'SELL' })); setSelectedItemIndex(0); }}
                                >
                                    売る
                                </button>
                            </div>

                            <div className="flex justify-end mb-2 border-b pb-1" style={{ borderColor: C1 }}>
                                <span className="flex items-center"><Coins size={10} className="mr-1"/> {player.gold} G</span>
                            </div>

                            <div ref={menuListRef} className="flex flex-col gap-1 overflow-y-auto flex-grow custom-scrollbar relative">
                                {shopState.mode === 'BUY' ? (
                                    enemies.find(e => e.id === shopState.merchantId)?.shopItems?.map((item, i) => (
                                        <div 
                                            key={i} 
                                            className="flex items-center border"
                                            style={{ 
                                                borderColor: selectedItemIndex === i ? C3 : 'transparent',
                                                backgroundColor: selectedItemIndex === i ? C2 : 'transparent',
                                                color: selectedItemIndex === i ? C0 : C3
                                            }}
                                            onMouseEnter={() => { lastInputType.current = 'MOUSE'; setSelectedItemIndex(i); }}
                                        >
                                            <button 
                                                className="flex-grow text-left px-2 py-1 cursor-pointer flex justify-between items-center"
                                                onClick={() => handleShopAction(i)}
                                            >
                                                <span>{getItemName(item)}</span>
                                                <span className="flex items-center gap-1">
                                                    {item.price} G
                                                </span>
                                            </button>
                                            <button 
                                                className="px-2 py-1 border-l flex items-center justify-center hover:opacity-80"
                                                style={{ borderColor: C1 }}
                                                onClick={(e) => { e.stopPropagation(); setInspectedItem(item); }}
                                            >
                                                <Info size={10} />
                                            </button>
                                        </div>
                                    )) || <div className="text-center">売り切れ</div>
                                ) : (
                                    inventory.map((item, i) => (
                                        <div 
                                            key={i} 
                                            className="flex items-center border"
                                            style={{ 
                                                borderColor: selectedItemIndex === i ? C3 : 'transparent',
                                                backgroundColor: selectedItemIndex === i ? C2 : 'transparent',
                                                color: selectedItemIndex === i ? C0 : C3
                                            }}
                                            onMouseEnter={() => { lastInputType.current = 'MOUSE'; setSelectedItemIndex(i); }}
                                        >
                                            <button 
                                                className="flex-grow text-left px-2 py-1 cursor-pointer flex justify-between items-center"
                                                onClick={() => handleShopAction(i)}
                                            >
                                                <span>{getItemName(item)}</span>
                                                <span className="flex items-center gap-1">
                                                    {Math.floor((item.price || (item.value || 100)) / 2)} G
                                                </span>
                                            </button>
                                            <button 
                                                className="px-2 py-1 border-l flex items-center justify-center hover:opacity-80"
                                                style={{ borderColor: C1 }}
                                                onClick={(e) => { e.stopPropagation(); setInspectedItem(item); }}
                                            >
                                                <Info size={10} />
                                            </button>
                                        </div>
                                    ))
                                )}
                                {shopState.mode === 'SELL' && inventory.length === 0 && <div className="text-center">持ち物なし</div>}
                            </div>
                        </div>
                    )}

                    {menuOpen && (
                        <div className="absolute right-0 top-0 bottom-0 w-3/4 border-l-2 z-30 p-2 text-xs flex flex-col" style={{ backgroundColor: C0, borderColor: C3, color: C3 }}>
                            <div className="flex justify-between items-center border-b mb-2 pb-1" style={{ borderColor: C3 }}>
                                <h3 className="font-bold">
                                    {synthState.active 
                                        ? (synthState.mode === 'BLANK' ? '書き込む内容を選択' : (synthState.step === 'SELECT_BASE' ? (synthState.mode==='CHANGE'?'変化させる物':'ベースを選択') : (synthState.mode==='CHANGE'?'変化':'素材を選択')))
                                        : `MOCHIMONO (${inventory.length}/${MAX_INVENTORY})`
                                    }
                                </h3>
                                <button onClick={toggleMenu}><X size={12}/></button>
                            </div>
                            
                            {synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT' ? (
                                <div ref={menuListRef} className="flex flex-col gap-1 overflow-y-auto flex-grow custom-scrollbar relative">
                                    {Array.from(identifiedTypes).filter((t: any) => (t as string).startsWith('SCROLL')).map((type, i) => (
                                        <div key={i} className="flex items-center border" style={{ borderColor: blankScrollSelectionIndex === i ? C3 : 'transparent', backgroundColor: blankScrollSelectionIndex === i ? C2 : 'transparent', color: blankScrollSelectionIndex === i ? C0 : C3 }}>
                                            <button 
                                                className="flex-grow text-left px-2 py-1 cursor-pointer" 
                                                onClick={() => handleSynthesisStep()} 
                                                onMouseEnter={() => { lastInputType.current = 'MOUSE'; setBlankScrollSelectionIndex(i); }}
                                            >
                                                {ITEM_DB[type as string].name}
                                            </button>
                                        </div>
                                    ))}
                                    {Array.from(identifiedTypes).filter((t: any) => (t as string).startsWith('SCROLL')).length === 0 && <div className="text-red-500">識別済みのノートがありません</div>}
                                </div>
                            ) : (
                                <>
                                    {!synthState.active && (
                                        <div className="mb-2 border-b pb-2" style={{ borderColor: C1 }}>
                                            <div className="mb-1" style={{ color: C2 }}>装備中:</div>
                                            {player.equipment?.weapon && <div onClick={()=>handleUnequip('weapon')} className="cursor-pointer hover:text-white">[武] {getItemName(player.equipment.weapon)}</div>}
                                            {player.equipment?.armor && <div onClick={()=>handleUnequip('armor')} className="cursor-pointer hover:text-white">[防] {getItemName(player.equipment.armor)}</div>}
                                            {player.equipment?.ranged && <div onClick={()=>handleUnequip('ranged')} className="cursor-pointer hover:text-white">[投] {getItemName(player.equipment.ranged)}</div>}
                                            {player.equipment?.accessory && <div onClick={()=>handleUnequip('accessory')} className="cursor-pointer hover:text-white">[腕] {getItemName(player.equipment.accessory)}</div>}
                                        </div>
                                    )}

                                    <div ref={menuListRef} className="flex flex-col gap-1 overflow-y-auto flex-grow custom-scrollbar relative">
                                        {inventory.map((item, i) => {
                                            const isSynthTarget = synthState.active && (
                                                (synthState.step === 'SELECT_BASE' && synthState.mode === 'SYNTH' && !['WEAPON','ARMOR'].includes(item.category)) ||
                                                (synthState.step === 'SELECT_MAT' && synthState.baseIndex === i)
                                            );
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`flex items-center border ${isSynthTarget ? 'opacity-30' : ''}`}
                                                    style={{ 
                                                        borderColor: selectedItemIndex === i ? C3 : 'transparent',
                                                        backgroundColor: selectedItemIndex === i ? C2 : 'transparent',
                                                        color: selectedItemIndex === i ? C0 : C3
                                                    }}
                                                    onMouseEnter={() => { lastInputType.current = 'MOUSE'; setSelectedItemIndex(i); }}
                                                >
                                                    <button 
                                                        className="flex-grow text-left px-2 py-1 cursor-pointer flex justify-between items-center"
                                                        onClick={() => !isSynthTarget && (synthState.active ? handleSynthesisStep() : handleItemAction(i))}
                                                        onMouseEnter={() => { lastInputType.current = 'MOUSE'; setSelectedItemIndex(i); }}
                                                    >
                                                        <span>
                                                            {getItemName(item)} 
                                                            {item.plus ? `+${item.plus}` : ''} 
                                                            {item.count ? `(${item.count})` : ''}
                                                            {item.category === 'STAFF' ? `[${item.charges}]` : ''}
                                                        </span>
                                                        <span className="text-[9px]" style={{ color: selectedItemIndex === i ? C0 : C2 }}>
                                                            {synthState.active 
                                                                ? '選択' 
                                                                : (['WEAPON','ARMOR','RANGED','ACCESSORY'].includes(item.category) ? '装備' : (item.category==='STAFF' ? '振る' : '使う'))
                                                            }
                                                        </span>
                                                    </button>
                                                    {!synthState.active && (
                                                        <button 
                                                            className="px-2 py-1 border-l flex items-center justify-center hover:opacity-80"
                                                            style={{ borderColor: C1 }}
                                                            onClick={(e) => { e.stopPropagation(); handleThrowItem(i); }}
                                                            title="投げる"
                                                        >
                                                            <Send size={10} />
                                                        </button>
                                                    )}
                                                    {!synthState.active && (
                                                        <button 
                                                            className="px-2 py-1 border-l flex items-center justify-center hover:opacity-80"
                                                            style={{ borderColor: C1 }}
                                                            onClick={(e) => { e.stopPropagation(); handleDropItem(i); }}
                                                            title="足元に置く"
                                                        >
                                                            <ArrowDown size={10} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="px-2 py-1 border-l flex items-center justify-center hover:opacity-80"
                                                        style={{ borderColor: C1 }}
                                                        onClick={(e) => { e.stopPropagation(); setInspectedItem(item); }}
                                                        title="詳細"
                                                    >
                                                        <Info size={10} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {inventory.length === 0 && <span className="text-center" style={{ color: C1 }}>Empty</span>}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {gameClear && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-40 p-4 text-center" style={{ backgroundColor: `${C0}F2`, color: C3 }}>
                            <Award size={48} className="mb-4" style={{ color: C2 }}/>
                            <h2 className="text-2xl font-bold mb-4">GRADUATION!</h2>
                            <p className="mb-2">ついに校長を説得した！</p>
                            <p className="mb-8">君は伝説の小学生となった。</p>
                            <div className="flex flex-col gap-4 w-full">
                                <button onClick={startEndlessMode} className="border-2 px-4 py-3 animate-pulse font-bold" style={{ borderColor: C3, color: C3, backgroundColor: 'transparent' }}>
                                    中学生編へ (エンドレス)
                                </button>
                                <button onClick={handleQuit} className="border-2 px-4 py-2 text-sm" style={{ borderColor: C1, color: C3 }}>
                                    タイトルへ戻る
                                </button>
                            </div>
                        </div>
                    )}

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
                            <button onClick={handleQuit} className="mt-4 text-xs hover:underline opacity-50">
                                EXIT
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full h-16 p-1 text-[9px] mb-1 rounded border-2 font-mono leading-tight flex flex-col justify-end shrink-0 shadow-inner overflow-hidden" style={{ backgroundColor: C0, color: C3, borderColor: C1 }}>
                {logs.slice(-4).map((l) => (
                    <div key={l.id} style={{ color: l.color || C3 }} className="truncate">{l.message}</div>
                ))}
            </div>
        </div>

        {/* --- RIGHT: BUTTONS (PC/Tablet Landscape & Desktop) --- */}
        <div className="hidden landscape:flex md:flex order-3 w-48 md:w-64 flex-col items-center justify-between p-4 bg-[#1a1a1a] border-2 border-[#333] rounded-xl shadow-2xl relative shrink-0">
            {/* Action Buttons Container */}
            <div className="flex flex-col items-center gap-8 w-full mt-4">
                 {/* SHOOT (R-Trigger style) */}
                 <div className="flex flex-col items-center group">
                    <button 
                        className="w-14 h-14 bg-[#333] rounded-full shadow-[0_4px_0_#111] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-white border border-[#555]" 
                        onClick={fireRangedWeapon}
                    >
                        <Crosshair size={28}/>
                    </button>
                    <span className="text-[#666] text-xs font-bold mt-1">R-SHOOT</span>
                </div>

                <div className="flex flex-col items-center group">
                    <button className="w-20 h-20 bg-[#8b0000] rounded-full shadow-[0_6px_0_#500000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#a00000] text-2xl" onClick={toggleMenu}>B</button>
                    <span className="text-[#666] text-sm font-bold mt-1">MENU</span>
                </div>
                
                <div className="flex flex-col items-center group">
                    <button 
                        className="w-20 h-20 bg-[#ff0000] rounded-full shadow-[0_6px_0_#8b0000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#cc0000] text-2xl" 
                        onMouseDown={() => handlePressStart()} 
                        onMouseUp={(e) => handlePressEnd(e)} 
                        onMouseLeave={(e) => handlePressEnd(e)}
                        onTouchStart={(e) => { e.preventDefault(); handlePressStart(); }}
                        onTouchEnd={(e) => { e.preventDefault(); handlePressEnd(e); }}
                    >
                        A
                    </button>
                    <span className="text-[#666] text-sm font-bold mt-1">ACT / FF</span>
                </div>
            </div>

            {/* Quit Button */}
            <button onClick={handleQuit} className="w-full text-[#555] hover:text-white hover:border-gray-500 border border-[#333] py-2 rounded bg-[#222] text-xs font-bold transition-all flex items-center justify-center gap-2 mb-2">
                <LogOut size={14}/> QUIT GAME
            </button>
        </div>

        {/* --- BOTTOM: MOBILE ONLY CONTROLLER --- */}
        <div className="portrait:flex landscape:hidden md:hidden order-4 w-full max-w-md h-[220px] relative rounded-t-xl border-t-2 border-[#333] bg-[#1a1a2a] shrink-0">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-32 h-32 flex items-center justify-center">
                <div className="w-10 h-10 bg-[#333] z-10"></div>
                <div className="absolute top-0 w-10 h-16 bg-[#333] rounded-t-md border-t border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center pt-2 z-0" onClick={() => handleMoveInput(0, -1)}><ArrowUp className="text-[#666]" size={20}/></div>
                <div className="absolute bottom-0 w-10 h-16 bg-[#333] rounded-b-md border-b border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center items-end pb-2 z-0" onClick={() => handleMoveInput(0, 1)}><ArrowDown className="text-[#666]" size={20}/></div>
                <div className="absolute left-0 w-16 h-10 bg-[#333] rounded-l-md border-l border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center pl-2 z-0" onClick={() => handleMoveInput(-1, 0)}><ArrowLeft className="text-[#666]" size={20}/></div>
                <div className="absolute right-0 w-16 h-10 bg-[#333] rounded-r-md border-r border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-end pr-2 z-0" onClick={() => handleMoveInput(1, 0)}><ArrowRight className="text-[#666]" size={20}/></div>
                <div className="absolute top-0 left-0 w-10 h-10 bg-[#333] rounded-tl-xl border-t border-l border-[#444] active:bg-[#222] cursor-pointer z-0" onClick={() => handleMoveInput(-1, -1)}></div>
                <div className="absolute top-0 right-0 w-10 h-10 bg-[#333] rounded-tr-xl border-t border-r border-[#444] active:bg-[#222] cursor-pointer z-0" onClick={() => handleMoveInput(1, -1)}></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 bg-[#333] rounded-bl-xl border-b border-l border-[#444] active:bg-[#222] cursor-pointer z-0" onClick={() => handleMoveInput(-1, 1)}></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#333] rounded-br-xl border-b border-r border-[#444] active:bg-[#222] cursor-pointer z-0" onClick={() => handleMoveInput(1, 1)}></div>
                <div className="absolute w-8 h-8 bg-[#2a2a2a] rounded-full z-20 shadow-inner"></div>
            </div>

            {/* Mobile Shoot Button */}
            <div className="absolute right-6 top-1/2 -translate-y-[100px] flex flex-col items-center z-10 group">
                <button className="w-10 h-10 bg-[#333] rounded-full shadow-[0_2px_0_#111] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-white border border-[#555]" onClick={fireRangedWeapon}><Crosshair size={16}/></button>
            </div>

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-4 transform -rotate-12">
                <div className="flex flex-col items-center group"><button className="w-14 h-14 bg-[#8b0000] rounded-full shadow-[0_4px_0_#500000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#a00000]" onClick={toggleMenu}>B</button><span className="text-[#666] text-xs font-bold mt-1">MENU</span></div>
                <div className="flex flex-col items-center group">
                    <button 
                        className="w-14 h-14 bg-[#ff0000] rounded-full shadow-[0_4px_0_#8b0000] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#cc0000]" 
                        onMouseDown={() => handlePressStart()} 
                        onMouseUp={(e) => handlePressEnd(e)} 
                        onMouseLeave={(e) => handlePressEnd(e)}
                        onTouchStart={(e) => { e.preventDefault(); handlePressStart(); }}
                        onTouchEnd={(e) => { e.preventDefault(); handlePressEnd(e); }}
                    >
                        A
                    </button>
                    <span className="text-[#666] text-xs font-bold mt-1">ACT</span>
                </div>
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                 <button onClick={handleQuit} className="text-[#555] text-[10px] font-bold border border-[#333] px-3 py-1 rounded bg-[#222] flex items-center gap-1"><LogOut size={10}/> QUIT</button>
            </div>
        </div>
    </div>
  );
};

export default SchoolDungeonRPG;
