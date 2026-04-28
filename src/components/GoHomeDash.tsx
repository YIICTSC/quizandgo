import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Heart, Star, Skull, Brain, Book, Flame, Wind, Target, RotateCcw, ArrowLeft, Play, Sparkles, ChevronRight, AlertTriangle, Zap, Crosshair, Shield, Move, FastForward, Repeat, Search, Ghost, Music, Activity, Rocket, FlaskConical, Globe, MapPin, CheckCircle2, ChevronDown, Check, Languages, Home } from 'lucide-react';
import { audioService } from '../services/audioService';
import { SPRITE_TEMPLATES } from './PixelSprite';
import { storageService } from '../services/storageService';
import MathChallengeScreen from './MathChallengeScreen';
import { GameMode, LanguageMode } from '../types';

// --- CONSTANTS ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_Y = 340;
const GRAVITY = 0.6; 
const JUMP_FORCE = -14.0; 
const BASE_SPEED = 4.5; 
const PLAYER_DEFAULT_X = 120;
const MAX_PARTICLES = 60; 
const MIN_OBSTACLE_GAP = 500; 
const PLAYER_DASH_FRAME_COUNT = 8;
const PLAYER_DASH_SPRITE_BASELINE_Y = 225;
const PLAYER_DASH_DRAW_HEIGHT = 84;
const PLAYER_DASH_SPRITE_SRC = `${(import.meta as any).env.BASE_URL || '/'}sprites/go-home-dash-8-loop-grid.png`;
const PLAYER_DASH_FRAME_ORDER = [
    0, // contact
    1, // down
    2, // push
    3, // air
    4, // contact
    5, // down
    6, // push
    7, // air
] as const;
const PLAYER_JUMP_FRAME_COUNT = 3;
const PLAYER_JUMP_SPRITE_BASELINE_Y = 594;
const PLAYER_JUMP_DRAW_HEIGHT = 108;
const PLAYER_JUMP_SPRITE_SRC = `${(import.meta as any).env.BASE_URL || '/'}sprites/go-home-dash-jump-3.png`;
const PLAYER_JUMP_FRAME_X_OFFSETS = [36, 40, -10];

interface Obstacle {
    id: string;
    x: number;
    y: number;
    vy: number; // 垂直速度（ジャンプ用）
    width: number;
    height: number;
    type: 'BACKPACK' | 'VAULTING' | 'CHALKBOARD' | 'BIRD' | 'IRON_BARRIER' | 'HOLE' | 'STEPS' | 'HIGH_STEPS' | 'MOUNTAIN_STEPS' | 'JUMPING_SLIME' | 'DRONE' | 'TEACHER_RUNNER';
    speedMult: number;
    isHard?: boolean;
    shootCooldown?: number;
}

interface Projectile {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    isHoming?: boolean;
    isLarge?: boolean;
    isPierce?: boolean;
    isEnemy?: boolean; // 敵の弾かどうか
}

interface Particle {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

interface DashCardEffect {
    id: string;
    name: string;
    description: string;
    iconType: 'MATH' | 'SCIENCE' | 'JAPANESE' | 'PE' | 'SOCIAL';
    isWeaponBase?: boolean; 
    requiresWeapon?: boolean; 
    apply: (p: any, setHp: any, setMaxHp: any) => void;
}

type DashGameState = 'START' | 'PLAYING' | 'CHALLENGE' | 'LEVEL_UP' | 'GAME_OVER';

const GoHomeDash: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerSpriteRef = useRef<HTMLImageElement | null>(null);
    const playerJumpSpriteRef = useRef<HTMLImageElement | null>(null);
    const [gameState, setGameState] = useState<DashGameState>('START');
    const gameStateRef = useRef<DashGameState>('START');
    
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        const image = new Image();
        image.onload = () => {
            playerSpriteRef.current = image;
        };
        image.onerror = () => {
            playerSpriteRef.current = null;
        };
        image.src = PLAYER_DASH_SPRITE_SRC;

        return () => {
            image.onload = null;
            image.onerror = null;
        };
    }, []);

    useEffect(() => {
        const image = new Image();
        image.onload = () => {
            playerJumpSpriteRef.current = image;
        };
        image.onerror = () => {
            playerJumpSpriteRef.current = null;
        };
        image.src = PLAYER_JUMP_SPRITE_SRC;

        return () => {
            image.onload = null;
            image.onerror = null;
        };
    }, []);

    const [languageMode] = useState<LanguageMode>(() => storageService.getLanguageMode() || 'JAPANESE');
    
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [hp, setHp] = useState(3);
    const [maxHp, setMaxHp] = useState(3);
    const [exp, setExp] = useState(0);
    const [nextLevelExp, setNextLevelExp] = useState(200);

    const scoreRef = useRef(0);
    const levelRef = useRef(1);
    const expRef = useRef(0);
    const nextLevelExpRef = useRef(200);
    const frameCount = useRef(0);
    const shakeRef = useRef(0);

    const playerRef = useRef({
        x: PLAYER_DEFAULT_X,
        y: GROUND_Y,
        vy: 0,
        isJumping: false,
        isFalling: false,
        isPressing: false, 
        jumpCount: 0,
        maxJumps: 1,
        invulFrame: 0,
        speedBoost: 1,
        shootingRate: 0,
        shootingTimer: 0,
        barrier: false,
        barrierRegen: false,
        barrierTimer: 0,
        expMult: 1,
        animFrame: 0,
        animTimer: 0,
        jumpActionFrame: 0,
        autoHeal: false,
        autoHealTimer: 0,
        pierceShot: false,
        doubleShot: false,
        tripleShot: false,
        homingShot: false,
        largeShot: false,
        landShockwave: false,
        stompAbility: false,
        airStall: false,
        reflectShield: false,
        lifesteal: false,
        trailFire: false,
        jumpBoom: false,
        scoreBonus: 1,
        cleaningDuty: 0,
        animFrameTimer: 0
    });

    const obstaclesRef = useRef<Obstacle[]>([]);
    const projectilesRef = useRef<Projectile[]>([]);
    const enemyProjectilesRef = useRef<Projectile[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const bgOffsets = useRef({ far: 0, mid: 0, near: 0 });
    const frameIdRef = useRef<number>(null);

    // --- UPGRADE POOL ---
    const UPGRADE_POOL: DashCardEffect[] = useMemo(() => [
        { id: 'STRIKE_1', name: 'えんぴつミサイル', description: '前方にえんぴつを発射！', iconType: 'MATH', isWeaponBase: true, apply: (p) => { p.shootingRate = p.shootingRate === 0 ? 100 : Math.max(30, p.shootingRate - 20); } },
        { id: 'STRIKE_2', name: '2連装えんぴつ', description: '弾を2発同時に発射する。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.doubleShot = true; } },
        { id: 'STRIKE_3', name: '3方向ショット', description: '扇状に3発の弾を発射。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.tripleShot = true; } },
        { id: 'STRIKE_4', name: '貫通えんぴつ', description: '弾が敵を貫通するようになる。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.pierceShot = true; } },
        { id: 'STRIKE_5', name: '巨大えんぴつ', description: '弾のサイズと当たり判定がアップ。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.largeShot = true; } },
        { id: 'STRIKE_6', name: '追尾誘導弾', description: '一番近い敵を自動で追いかける。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.homingShot = true; } },
        { id: 'STRIKE_7', name: '連射力UP', description: 'ミサイルの発射速度が大幅に上昇。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.shootingRate = Math.max(15, (p.shootingRate || 100) - 30); } },
        { id: 'STRIKE_8', name: '着地衝撃波', description: '着地時に周囲の敵をなぎ倒す。', iconType: 'PE', apply: (p) => { p.landShockwave = true; } },
        { id: 'STRIKE_9', name: 'ソニックブーム', description: 'ジャンプ時に前方の敵を攻撃。', iconType: 'PE', apply: (p) => { p.jumpBoom = true; } },
        { id: 'STRIKE_10', name: '火炎の足跡', description: '走りながら背後に炎を置いていく。', iconType: 'SCIENCE', apply: (p) => { p.trailFire = true; } },
        { id: 'STRIKE_11', name: '辞書プレッシャー', description: '定期的に巨大な辞書を投げつける。', iconType: 'JAPANESE', requiresWeapon: true, apply: (p) => { p.largeShot = true; p.shootingRate = Math.max(40, (p.shootingRate || 120) - 10); } },
        { id: 'STRIKE_12', name: '反射バリア', description: 'バリア消失時に敵にダメージ。', iconType: 'SCIENCE', apply: (p) => { p.reflectShield = true; p.barrier = true; } },
        { id: 'STRIKE_13', name: '吸血攻撃', description: '敵を倒すと稀にHPが1回復する。', iconType: 'SCIENCE', apply: (p) => { p.lifesteal = true; } },
        { id: 'STRIKE_14', name: 'コンパス針', description: '弾が回転しながら飛び、多段ヒット。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.pierceShot = true; p.shootingRate = Math.max(30, (p.shootingRate || 100) - 5); } },
        { id: 'STRIKE_15', name: 'フルバースト', description: '弾数が一気に増えるが、少し遅くなる。', iconType: 'MATH', requiresWeapon: true, apply: (p) => { p.doubleShot = true; p.tripleShot = true; p.speedBoost *= 0.95; } },
        { id: 'MOVE_1', name: '上履きブースト', description: '移動速度が常時アップ。', iconType: 'PE', apply: (p) => { p.speedBoost += 0.2; } },
        { id: 'MOVE_2', name: '空中2段ジャンプ', description: '空中でさらにもう一度飛べる。', iconType: 'PE', apply: (p) => { p.maxJumps = Math.max(p.maxJumps, 2); } },
        { id: 'MOVE_3', name: '3段ジャンプ', description: '驚異の3段ジャンプが可能に。', iconType: 'PE', apply: (p) => { p.maxJumps = Math.max(p.maxJumps, 3); } },
        { id: 'MOVE_4', name: 'マ〇オステップ', description: '敵を踏んで倒せるようになる！', iconType: 'PE', apply: (p) => { p.stompAbility = true; } },
        { id: 'MOVE_5', name: 'ホバリング', description: 'ジャンプ中に長押しで滞空できる。', iconType: 'SCIENCE', apply: (p) => { p.airStall = true; } },
        { id: 'MOVE_6', name: 'ロケットスタート', description: '初期位置から少し前に進む。', iconType: 'PE', apply: (p) => { p.x = Math.min(p.x + 50, 300); } },
        { id: 'MOVE_8', name: '瞬足の極意', description: '速度が大幅アップし、無敵時間増加。', iconType: 'PE', apply: (p) => { p.speedBoost += 0.3; } },
        { id: 'DEF_1', name: 'ノートバリア', description: '衝突を防ぐバリアを展開。', iconType: 'JAPANESE', apply: (p) => { p.barrier = true; } },
        { id: 'DEF_2', name: '給食おかわり', description: '最大HPが+1され、全回復。', iconType: 'SOCIAL', apply: (p, setHp, setMaxHp) => { setMaxHp((prev:number)=>prev+1); setHp((prev:number)=>prev+1); } },
        { id: 'DEF_3', name: '自動修復ノート', description: '一定時間ごとにバリアが自動復活。', iconType: 'JAPANESE', apply: (p) => { p.barrierRegen = true; } },
        { id: 'DEF_4', name: '保健室の飴', description: '一定時間ごとにHPが1回復する。', iconType: 'SOCIAL', apply: (p) => { p.autoHeal = true; } },
        { id: 'DEF_7', name: 'カルシウム摂取', description: '最大HP+2。', iconType: 'SOCIAL', apply: (p, setHp, setMaxHp) => { setMaxHp((prev:number)=>prev+2); } },
        { id: 'DEF_10', name: 'ビタミン補給', description: 'HPを2回復し、加速。', iconType: 'SOCIAL', apply: (p, setHp) => { setHp((prev:number)=>Math.min(5, prev+2)); p.speedBoost += 0.1; } },
        { id: 'UTIL_1', name: '進級パワー', description: '獲得EXPが常時1.5倍に。', iconType: 'SCIENCE', apply: (p) => { p.expMult += 0.5; } },
        { id: 'UTIL_2', name: 'お年玉ボーナス', description: 'スコアの増加速度がアップ。', iconType: 'SOCIAL', apply: (p) => { p.scoreBonus += 0.5; } },
        { id: 'UTIL_4', name: '大掃除', description: '画面内の敵をすべて消去する。', iconType: 'SOCIAL', apply: (p) => { p.cleaningDuty = 1; } },
        { id: 'UTIL_7', name: '委員長の号令', description: 'すべてのクールダウンを短縮。', iconType: 'JAPANESE', apply: (p) => { p.shootingRate = Math.max(20, (p.shootingRate || 100) - 20); } },
        { id: 'UTIL_10', name: '卒業証明書', description: 'すべてのステータスを少しずつ強化。', iconType: 'SOCIAL', apply: (p) => { p.maxJumps = 2; p.speedBoost += 0.1; p.shootingRate = 60; p.expMult += 0.2; } },
    ], [setHp, setMaxHp]);

    const [upgradeOptions, setUpgradeOptions] = useState<DashCardEffect[]>([]);

    const addVfxRing = (x: number, y: number, color: string) => {
        for(let i=0; i<8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            particlesRef.current.push({
                id: Math.random().toString(), x, y,
                vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5,
                life: 15, color, size: 4
            });
        }
    };

    const triggerShake = () => {
        shakeRef.current = 10;
    };

    const selectUpgrade = (card: DashCardEffect) => {
        const p = playerRef.current;
        card.apply(p, setHp, setMaxHp);
        // 報酬獲得後2秒間（120フレーム）無敵にする
        p.invulFrame = 120;
        setGameState('PLAYING');
        audioService.playBGM('survivor_metal');
        audioService.playSound('buff');
    };

    const initGame = () => {
        scoreRef.current = 0; levelRef.current = 1; expRef.current = 0; nextLevelExpRef.current = 200;
        setScore(0); setLevel(1); setExp(0); setHp(3); setMaxHp(3); setNextLevelExp(200);
        playerRef.current = {
            x: PLAYER_DEFAULT_X, y: GROUND_Y, vy: 0, isJumping: false, isFalling: false, isPressing: false, jumpCount: 0, maxJumps: 1, invulFrame: 0,
            speedBoost: 1, shootingRate: 0, shootingTimer: 0, barrier: false, barrierRegen: false, barrierTimer: 0, expMult: 1,
            animFrame: 0, animTimer: 0, jumpActionFrame: 0, autoHeal: false, autoHealTimer: 0, 
            pierceShot: false, doubleShot: false, tripleShot: false, homingShot: false, largeShot: false, landShockwave: false, 
            stompAbility: false, airStall: false, reflectShield: false, lifesteal: false, trailFire: false, jumpBoom: false,
            scoreBonus: 1, cleaningDuty: 0, animFrameTimer: 0
        };
        obstaclesRef.current = []; projectilesRef.current = []; enemyProjectilesRef.current = []; particlesRef.current = [];
        bgOffsets.current = { far: 0, mid: 0, near: 0 };
        setGameState('PLAYING');
        audioService.playBGM('survivor_metal');
    };

    const addParticle = (x: number, y: number, color: string) => {
        if (particlesRef.current.length > MAX_PARTICLES) return;
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 2 + 1;
        particlesRef.current.push({
            id: Math.random().toString(),
            x, y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 20,
            color,
            size: Math.random() * 3 + 1
        });
    };

    const triggerJump = () => {
        if (gameStateRef.current !== 'PLAYING') return;
        const p = playerRef.current;
        if (!p.isFalling && p.jumpCount < p.maxJumps) {
            p.vy = JUMP_FORCE; p.isJumping = true; p.jumpCount++; p.jumpActionFrame = 12;
            audioService.playSound('select'); addParticle(p.x, p.y, '#ffffff');
            if (p.jumpBoom) {
                 addVfxRing(p.x, p.y, '#ffffff');
                 obstaclesRef.current = obstaclesRef.current.filter(obs => {
                     const dx = obs.x - p.x;
                     if (dx > 0 && dx < 150 && Math.abs(obs.y - p.y) < 100) {
                         if (['HOLE', 'STEPS', 'HIGH_STEPS', 'MOUNTAIN_STEPS', 'IRON_BARRIER', 'VAULTING', 'CHALKBOARD'].includes(obs.type)) {
                             addParticle(obs.x, obs.y, '#94a3b8');
                             return true;
                         }
                         addParticle(obs.x, obs.y, '#ffeb3b');
                         scoreRef.current += 10;
                         return false;
                     }
                     return true;
                 });
            }
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (gameStateRef.current !== 'PLAYING') return;
        const p = playerRef.current;
        p.isPressing = true;
        triggerJump();
    };

    const handlePointerUp = () => { playerRef.current.isPressing = false; };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code !== 'Space' && e.code !== 'ArrowUp' && e.code !== 'KeyW') return;
            e.preventDefault();
            if (e.repeat) return;
            playerRef.current.isPressing = true;
            triggerJump();
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code !== 'Space' && e.code !== 'ArrowUp' && e.code !== 'KeyW') return;
            e.preventDefault();
            playerRef.current.isPressing = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const isDestroyable = (type: string) => !['HOLE', 'STEPS', 'HIGH_STEPS', 'MOUNTAIN_STEPS', 'IRON_BARRIER', 'VAULTING', 'CHALKBOARD'].includes(type);

    const updateLogic = () => {
        if (gameStateRef.current !== 'PLAYING') return;
        const p = playerRef.current;
        const currentSpeed = (BASE_SPEED + ((levelRef.current - 1) * 0.4)) * p.speedBoost;

        frameCount.current++;
        bgOffsets.current.far += currentSpeed * 0.1;
        bgOffsets.current.mid += currentSpeed * 0.3;
        bgOffsets.current.near += currentSpeed;

        if (p.x < PLAYER_DEFAULT_X) p.x += 0.8;

        p.animFrameTimer = (p.animFrameTimer || 0) + 1;
        const animThreshold = Math.max(2, 6 - Math.floor(currentSpeed * 0.5));
        if (p.animFrameTimer > animThreshold) {
            if (!p.isJumping && !p.isFalling) p.animFrame = (p.animFrame + 1) % PLAYER_DASH_FRAME_COUNT;
            p.animFrameTimer = 0;
            if (!p.isJumping && !p.isFalling) addParticle(p.x - 10, p.y, '#8d6e63');
        }
        if (p.jumpActionFrame > 0) p.jumpActionFrame--;

        if (p.airStall && p.isPressing && p.vy > 0) {
            p.vy *= 0.8; 
            addParticle(p.x, p.y + 10, '#00ffff');
        }

        if (p.isJumping && !p.isPressing && p.vy < -2) p.vy *= 0.85; 
        p.vy += GRAVITY; p.y += p.vy;

        if (p.isFalling && p.y > CANVAS_HEIGHT + 20) { handlePlayerDamage(true); return; }

        let currentGroundLevel = GROUND_Y;
        let isOnObject = false;

        if (p.cleaningDuty > 0) {
            addVfxRing(p.x, p.y, '#ffffff');
            obstaclesRef.current = obstaclesRef.current.filter(obs => !isDestroyable(obs.type));
            p.cleaningDuty = 0;
            audioService.playSound('win');
        }

        const obstacles = obstaclesRef.current;
        for (const obs of obstacles) {
            if (['STEPS', 'HIGH_STEPS', 'MOUNTAIN_STEPS'].includes(obs.type)) {
                const stepsCount = obs.type === 'STEPS' ? 1 : (obs.type === 'HIGH_STEPS' ? 2 : 3);
                const stepH = obs.height / stepsCount;
                const stepW = obs.width / stepsCount;

                // 各段をチェックして接地可能な面を探す
                for (let s = 0; s < stepsCount; s++) {
                    const currentW = obs.width - (s * stepW);
                    const currentH = stepH * (s + 1);
                    const stepTop = GROUND_Y - currentH;
                    const stepLeft = obs.x - currentW / 2;
                    const stepRight = obs.x + currentW / 2;

                    if (p.x + 10 > stepLeft && p.x - 10 < stepRight) {
                        // 上面に接地
                        if (p.y <= stepTop + 20 && p.vy >= 0 && p.x > stepLeft + 5 && p.x < stepRight - 5) {
                            if (stepTop < currentGroundLevel) {
                                currentGroundLevel = stepTop;
                                isOnObject = true;
                            }
                        } 
                        // 前面（左側の壁）に衝突判定
                        else if (p.x + 15 > stepLeft && p.x < stepLeft + 20 && p.y > stepTop + 5) {
                            if (p.invulFrame <= 0) {
                                handlePlayerDamage(false); // 地形なのでiは渡さず、消滅させない
                            }
                            p.x = stepLeft - 15; // 強く押し戻す
                        }
                    }
                }
            }
        }

        const overHole = !isOnObject && obstacles.some(obs => obs.type === 'HOLE' && Math.abs(obs.x - p.x) < obs.width / 2);

        if (p.y >= currentGroundLevel) {
            if (overHole || p.isFalling) p.isFalling = true;
            else {
                if (p.isFalling) p.isFalling = false;
                if (p.isJumping) {
                    for (let i = 0; i < 5; i++) addParticle(p.x - 8 + i * 4, currentGroundLevel, '#cbd5e1');
                    if (p.landShockwave) {
                        addVfxRing(p.x, currentGroundLevel, '#ffeb3b');
                        audioService.playSound('block');
                        obstaclesRef.current = obstaclesRef.current.filter(obs => {
                            if (!isDestroyable(obs.type)) return true;
                            return Math.abs(obs.x - p.x) > 120;
                        });
                    }
                }
                p.y = currentGroundLevel; p.vy = 0; p.isJumping = false; p.jumpCount = 0;
            }
        }

        if (p.x < 20) { setGameOverState(); return; }
        if (p.invulFrame > 0) p.invulFrame--;
        
        if (p.barrierRegen && !p.barrier) {
            p.barrierTimer++;
            if (p.barrierTimer > 600) { p.barrier = true; p.barrierTimer = 0; audioService.playSound('buff'); }
        }

        if (p.autoHeal) {
            p.autoHealTimer++;
            if (p.autoHealTimer > 1200) { setHp(h => Math.min(maxHp, h + 1)); p.autoHealTimer = 0; audioService.playSound('buff'); }
        }

        if (p.trailFire && frameCount.current % 10 === 0) {
            addParticle(p.x - 20, p.y, '#ff4500');
            obstaclesRef.current = obstaclesRef.current.filter(obs => {
                if (!isDestroyable(obs.type)) return true;
                return Math.abs(obs.x - (p.x - 40)) > 40;
            });
        }

        if (p.shootingRate > 0) {
            p.shootingTimer++;
            if (p.shootingTimer >= p.shootingRate) {
                const angles = p.tripleShot ? [-0.2, 0, 0.2] : [0];
                const count = p.doubleShot ? 2 : 1;
                for (const angle of angles) {
                    for (let i = 0; i < count; i++) {
                        projectilesRef.current.push({ 
                            id: Math.random().toString(), x: p.x + 20, y: p.y - 25 - (i * 12), 
                            vx: (currentSpeed + 12) * Math.cos(angle), 
                            vy: (currentSpeed + 12) * Math.sin(angle),
                            isHoming: p.homingShot, isLarge: p.largeShot, isPierce: p.pierceShot
                        });
                    }
                }
                p.shootingTimer = 0; audioService.playSound('attack');
            }
        }

        // プレイヤーの弾更新
        const projs = projectilesRef.current;
        for (let i = projs.length - 1; i >= 0; i--) {
            const pr = projs[i];
            if (pr.isHoming) {
                const target = obstaclesRef.current.find(o => o.x > pr.x && isDestroyable(o.type));
                if (target) {
                    const ang = Math.atan2(target.y - 20 - pr.y, target.x - pr.x);
                    pr.vx += Math.cos(ang) * 0.5; pr.vy += Math.sin(ang) * 0.5;
                }
            }
            pr.x += pr.vx; pr.y += pr.vy;
            if (pr.x > CANVAS_WIDTH + 50 || pr.y < -50 || pr.y > CANVAS_HEIGHT + 50) projs.splice(i, 1);
        }

        // 敵の弾更新
        const enemyProjs = enemyProjectilesRef.current;
        for (let i = enemyProjs.length - 1; i >= 0; i--) {
            const ep = enemyProjs[i];
            ep.x += ep.vx; ep.y += ep.vy;
            
            // プレイヤーとの当たり判定
            const dx = ep.x - p.x;
            const dy = ep.y - (p.y - 20);
            if (Math.sqrt(dx*dx + dy*dy) < 25 && p.invulFrame <= 0) {
                handlePlayerDamage(false);
                enemyProjs.splice(i, 1);
                continue;
            }

            if (ep.x < -50 || ep.y < -50 || ep.y > CANVAS_HEIGHT + 50) enemyProjs.splice(i, 1);
        }

        const parts = particlesRef.current;
        for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i]; part.x += part.vx; part.y += part.vy; part.life--;
            if (part.life <= 0) parts.splice(i, 1);
        }

        const lastObs = obstacles.length > 0 ? obstacles[obstacles.length - 1] : null;
        const spawnX = CANVAS_WIDTH + 150;
        
        const spawnProb = 0.02 + (levelRef.current * 0.005) + (scoreRef.current * 0.00001);
        const dynamicGap = Math.max(160, MIN_OBSTACLE_GAP - (levelRef.current * 20));

        if ((!lastObs || (spawnX - lastObs.x) > dynamicGap) && Math.random() < spawnProb && obstacles.length < 8) {
            const types: Obstacle['type'][] = ['BACKPACK', 'VAULTING', 'CHALKBOARD', 'BIRD', 'IRON_BARRIER', 'HOLE', 'STEPS', 'HIGH_STEPS', 'MOUNTAIN_STEPS', 'JUMPING_SLIME', 'DRONE', 'TEACHER_RUNNER'];
            let type = types[Math.floor(Math.random() * types.length)];
            if (lastObs?.type === 'HOLE' && type === 'HOLE') type = 'BACKPACK';
            
            const isAir = type === 'BIRD' || type === 'DRONE'; 
            const isHard = !isDestroyable(type);
            const speedMult = type === 'TEACHER_RUNNER' ? 1.8 : (isAir ? 1.3 : 1.0);
            
            let width = 40;
            let height = 40;
            if (type === 'STEPS') { width = 200; height = 60; }
            else if (type === 'HIGH_STEPS') { width = 320; height = 110; }
            else if (type === 'MOUNTAIN_STEPS') { width = 480; height = 160; }
            else if (type === 'HOLE') { width = 70; }

            obstaclesRef.current.push({ 
                id: Math.random().toString(), 
                x: spawnX, 
                y: isAir ? GROUND_Y - 100 - Math.random() * 60 : (type === 'HOLE' ? GROUND_Y : GROUND_Y - 20), 
                vy: 0,
                width, 
                height, 
                type, 
                speedMult, 
                isHard,
                shootCooldown: type === 'DRONE' ? 100 : 0
            });
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i]; 
            obs.x -= currentSpeed * obs.speedMult;

            // 特殊挙動: ジャンプ
            if (obs.type === 'JUMPING_SLIME' && obs.y >= GROUND_Y - 20 && obs.x < 500 && Math.random() < 0.05) {
                obs.vy = -12;
            }
            if (obs.type === 'JUMPING_SLIME' || obs.vy !== 0) {
                obs.vy += 0.5; // 敵用重力
                obs.y += obs.vy;
                if (obs.y > GROUND_Y - 20) {
                    obs.y = GROUND_Y - 20;
                    obs.vy = 0;
                    addParticle(obs.x, GROUND_Y, '#8d6e63');
                }
            }

            // 特殊挙動: 射撃
            if (obs.type === 'DRONE') {
                obs.shootCooldown = (obs.shootCooldown || 0) - 1;
                if (obs.shootCooldown <= 0) {
                    enemyProjectilesRef.current.push({
                        id: Math.random().toString(),
                        x: obs.x - 20,
                        y: obs.y,
                        vx: -8,
                        vy: 0,
                        isEnemy: true
                    });
                    obs.shootCooldown = 150 - Math.min(100, levelRef.current * 5);
                    audioService.playSound('attack');
                }
            }
            
            if (p.stompAbility && p.vy > 0 && isDestroyable(obs.type) && obs.type !== 'HOLE') {
                const dx = p.x - obs.x;
                const dy = obs.y - p.y;
                if (Math.abs(dx) < 40 && dy > 0 && dy < 40) {
                    p.vy = JUMP_FORCE * 0.7; 
                    obstacles.splice(i, 1);
                    audioService.playSound('attack');
                    scoreRef.current += 100;
                    addVfxRing(obs.x, obs.y, '#ffffff');
                    continue;
                }
            }

            if (obs.type !== 'HOLE' && !['STEPS', 'HIGH_STEPS', 'MOUNTAIN_STEPS'].includes(obs.type)) {
                const pdx = p.x - obs.x; const pdy = (p.y - 20) - (obs.y - 20);
                if (Math.sqrt(pdx * pdx + pdy * pdy) < 35 && p.invulFrame <= 0) { handlePlayerDamage(false, i); continue; }
            }

            for (let j = projs.length - 1; j >= 0; j--) {
                const proj = projs[j]; const rdx = proj.x - obs.x; const rdy = proj.y - obs.y;
                const hitDist = proj.isLarge ? 50 : 35;
                if (Math.sqrt(rdx * rdx + rdy * rdy) < hitDist) {
                    if (!isDestroyable(obs.type)) {
                        projs.splice(j, 1); 
                        addParticle(proj.x, proj.y, '#94a3b8'); 
                    } 
                    else if (obs.type !== 'HOLE') {
                        if (!proj.isPierce) projs.splice(j, 1);
                        obstacles.splice(i, 1); audioService.playSound('attack');
                        scoreRef.current += 50; addParticle(obs.x, obs.y, '#ffeb3b');
                        if (p.lifesteal && Math.random() < 0.1) setHp(h => Math.min(maxHp, h + 1));
                    }
                    break;
                }
            }
            if (obs.x < -400) obstacles.splice(i, 1);
        }

        const addExp = 0.1 * (currentSpeed / BASE_SPEED) * p.expMult;
        expRef.current += addExp;
        if (expRef.current >= nextLevelExpRef.current) {
            levelRef.current++; expRef.current = 0; nextLevelExpRef.current += 100;
            const hasWeapon = p.shootingRate > 0;
            const availableUpgrades = UPGRADE_POOL.filter(card => {
                if (card.requiresWeapon && !hasWeapon) return false;
                return true;
            });
            const shuffled = [...availableUpgrades].sort(() => Math.random() - 0.5);
            setUpgradeOptions(shuffled.slice(0, 3)); 
            setGameState('CHALLENGE'); 
            audioService.playBGM('math');
        }
        scoreRef.current += (currentSpeed * 0.1 * p.scoreBonus);
        if (frameCount.current % 10 === 0) { setScore(Math.floor(scoreRef.current)); setExp(expRef.current); setLevel(levelRef.current); setNextLevelExp(nextLevelExpRef.current); }
    };

    const setGameOverState = () => {
        setGameState('GAME_OVER');
        audioService.playSound('lose');
        storageService.saveGoHomeScore({
            id: `gohome-${Date.now()}`,
            date: Date.now(),
            score: Math.floor(scoreRef.current),
            level: levelRef.current,
            distance: Math.floor(scoreRef.current)
        });
    };

    const handleChallengeComplete = (correctCount: number) => {
        if (correctCount >= 3) {
            setHp(h => Math.min(maxHp, h + 1));
            audioService.playSound('buff');
        }
        setGameState('LEVEL_UP');
        audioService.playSound('win');
    };

    const handlePlayerDamage = (isFall: boolean, obsIdx?: number) => {
        const p = playerRef.current;
        if (p.barrier) {
            p.barrier = false;
            if (isFall) { p.y = GROUND_Y; p.vy = -10; p.isFalling = false; } 
            else if (obsIdx !== undefined) obstaclesRef.current.splice(obsIdx, 1);
            if (p.reflectShield) {
                addVfxRing(p.x, p.y, '#00ffff');
                obstaclesRef.current = obstaclesRef.current.filter(o => Math.abs(o.x - p.x) > 200);
            }
            audioService.playSound('block'); return;
        }
        setHp(prev => {
            const next = prev - 1;
            if (next <= 0) { setGameOverState(); }
            return next;
        });
        p.invulFrame = 60; audioService.playSound('damage'); triggerShake();
        if (isFall) { p.y = GROUND_Y; p.vy = 0; p.isFalling = false; }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.save();
        if (shakeRef.current > 0) {
            ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
            shakeRef.current *= 0.9;
        }

        const obstacles = obstaclesRef.current;
        const holes = obstacles.filter(o => o.type === 'HOLE');

        const skyBands = [
            '#24163a', '#322052', '#4b2c66', '#6d3b69',
            '#974a5f', '#c45e50', '#e07b45', '#f0a14b'
        ];
        const bandHeight = Math.ceil(GROUND_Y / skyBands.length);
        for (let i = 0; i < skyBands.length; i++) {
            ctx.fillStyle = skyBands[i];
            ctx.fillRect(0, i * bandHeight, CANVAS_WIDTH, bandHeight + 1);
        }

        const farOff = Math.floor(bgOffsets.current.far) % 384;
        ctx.fillStyle = '#2b2448';
        for (let x = -farOff; x < CANVAS_WIDTH + 384; x += 384) {
            ctx.fillRect(x + 10, 236, 116, 84);
            ctx.fillRect(x + 132, 210, 82, 110);
            ctx.fillRect(x + 226, 248, 124, 72);
            ctx.fillStyle = '#40355d';
            for (let c = 0; c < 5; c++) ctx.fillRect(x + 28 + c * 18, 254, 8, 10);
            for (let c = 0; c < 3; c++) ctx.fillRect(x + 150 + c * 18, 230, 8, 10);
            ctx.fillStyle = '#2b2448';
            ctx.fillRect(x + 166, 190, 18, 20);
            ctx.fillRect(x + 170, 176, 10, 14);
        }

        const midOff = Math.floor(bgOffsets.current.mid) % 512;
        for (let x = -midOff; x < CANVAS_WIDTH + 512; x += 512) {
            ctx.fillStyle = '#403151';
            ctx.fillRect(x + 26, 280, 94, 44);
            ctx.fillRect(x + 160, 266, 104, 58);
            ctx.fillRect(x + 306, 274, 126, 50);
            ctx.fillStyle = '#2a2038';
            ctx.beginPath(); ctx.moveTo(x + 14, 280); ctx.lineTo(x + 74, 236); ctx.lineTo(x + 134, 280); ctx.fill();
            ctx.beginPath(); ctx.moveTo(x + 144, 266); ctx.lineTo(x + 212, 220); ctx.lineTo(x + 280, 266); ctx.fill();
            ctx.beginPath(); ctx.moveTo(x + 288, 274); ctx.lineTo(x + 366, 224); ctx.lineTo(x + 448, 274); ctx.fill();
            ctx.fillStyle = '#ffc857';
            for (let c = 0; c < 3; c++) ctx.fillRect(x + 48 + c * 24, 292, 10, 10);
            for (let c = 0; c < 3; c++) ctx.fillRect(x + 184 + c * 26, 284, 10, 10);
            for (let c = 0; c < 4; c++) ctx.fillRect(x + 326 + c * 24, 290, 10, 10);
            ctx.fillStyle = '#2a2038';
            ctx.fillRect(x + 470, 226, 8, 96);
            ctx.fillRect(x + 444, 238, 60, 6);
            ctx.fillStyle = '#f2c14e';
            ctx.fillRect(x + 466, 248, 16, 12);
        }

        const nearOff = Math.floor(bgOffsets.current.near) % 64;
        ctx.fillStyle = '#2b1a23';
        ctx.fillRect(0, GROUND_Y - 22, CANVAS_WIDTH, 22);
        ctx.fillStyle = '#3a211e';
        for (let x = 0; x < CANVAS_WIDTH; x += 8) {
            const isHole = holes.some(h => x >= h.x - h.width / 2 && x <= h.x + h.width / 2);
            if (!isHole) {
                ctx.fillRect(x, GROUND_Y, 8, CANVAS_HEIGHT - GROUND_Y);
                ctx.fillStyle = x % 16 === 0 ? '#4a2a22' : '#2c1918';
                ctx.fillRect(x, GROUND_Y + 10, 8, 4);
                ctx.fillStyle = '#3a211e';
            }
        }

        holes.forEach(hole => {
            if (hole.x > 0 && hole.x < CANVAS_WIDTH) { ctx.fillStyle = "#ef4444"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center"; ctx.fillText("!", hole.x, GROUND_Y + 30); }
        });

        for (let x = -nearOff; x < CANVAS_WIDTH + 64; x += 64) {
            const isHole = holes.some(h => x >= h.x - h.width / 2 && x <= h.x + h.width / 2);
            if (!isHole) {
                ctx.fillStyle = '#1f2937';
                ctx.fillRect(x, GROUND_Y - 46, 5, 46);
                ctx.fillStyle = '#475569';
                ctx.fillRect(x, GROUND_Y - 36, 64, 4);
                ctx.fillRect(x, GROUND_Y - 22, 64, 3);
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(x + 2, GROUND_Y - 44, 2, 12);
            }
        }

        const parts = particlesRef.current;
        for (const p of parts) { ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 30; ctx.fillRect(p.x, p.y, p.size, p.size); }
        ctx.globalAlpha = 1.0;

        const projs = projectilesRef.current;
        for (const proj of projs) { ctx.fillStyle = '#fbbf24'; const sz = proj.isLarge ? 20 : 10; ctx.fillRect(proj.x, proj.y, sz * 1.4, sz * 0.5); }
        
        // 敵の弾の描画
        const enemyProjs = enemyProjectilesRef.current;
        for (const ep of enemyProjs) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(ep.x, ep.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.stroke();
        }

        for (const obs of obstacles) {
            if (obs.type === 'HOLE') continue;
            if (obs.type === 'STEPS' || obs.type === 'HIGH_STEPS' || obs.type === 'MOUNTAIN_STEPS') {
                ctx.fillStyle = '#8d6e63'; ctx.strokeStyle = '#2d1b0e'; ctx.lineWidth = 3;
                const steps = obs.type === 'STEPS' ? 1 : (obs.type === 'HIGH_STEPS' ? 2 : 3);
                const stepH = obs.height / steps;
                const stepW = obs.width / steps;
                for(let s=0; s<steps; s++) {
                    const currentW = obs.width - (s * stepW);
                    const currentH = stepH * (s + 1);
                    ctx.fillRect(obs.x - currentW/2, GROUND_Y - currentH, currentW, currentH);
                    ctx.strokeRect(obs.x - currentW/2, GROUND_Y - currentH, currentW, currentH);
                }
            } else if (obs.type === 'IRON_BARRIER') {
                ctx.shadowBlur = 10; ctx.shadowColor = "#00ffff"; ctx.fillStyle = '#e2e8f0'; 
                ctx.fillRect(obs.x - obs.width/2, GROUND_Y - obs.height, obs.width, obs.height); 
                ctx.shadowBlur = 0;
            } else {
                const spriteMap: any = { 
                    BACKPACK: 'BACKPACK', 
                    VAULTING: 'VAULTING', 
                    CHALKBOARD: 'NOTEBOOK', 
                    BIRD: 'BAT',
                    JUMPING_SLIME: 'SLIME',
                    DRONE: 'ROBOT',
                    TEACHER_RUNNER: 'TEACHER'
                };
                const size = 40; const pixelSize = size / 16;
                const template = SPRITE_TEMPLATES[spriteMap[obs.type] || 'SLIME'] || SPRITE_TEMPLATES.SLIME;
                for (let row = 0; row < 16; row++) { 
                    for (let col = 0; col < 16; col++) { 
                        const char = template[row][col]; if (char === '.') continue; 
                        let color = obs.isHard ? '#cbd5e1' : '#ef4444';
                        if (obs.type === 'JUMPING_SLIME') color = '#22c55e';
                        if (obs.type === 'DRONE') color = '#3b82f6';
                        if (obs.type === 'TEACHER_RUNNER') color = '#dc2626';

                        ctx.fillStyle = char === '%' ? "#ffffff" : (char === '@' ? '#000000' : color); 
                        ctx.fillRect(obs.x - 20 + col * pixelSize, obs.y - 20 + row * pixelSize, pixelSize + 0.5, pixelSize + 0.5); 
                    } 
                }
            }
        }

        const pl = playerRef.current;
        if (pl.invulFrame % 4 < 2) {
            const isAirborne = pl.isJumping || pl.isFalling;
            const isLandingPose = isAirborne && !pl.isFalling && pl.vy > 3 && (GROUND_Y - pl.y) < 58;
            const bounce = !isAirborne ? Math.sin(frameCount.current * 0.2) * 3 : 0;
            ctx.save(); ctx.translate(pl.x, pl.y + bounce);
            ctx.shadowBlur = 4; ctx.shadowColor = "white";
            ctx.save();
            if (isAirborne) {
                if (pl.vy < -5) {
                    ctx.rotate(-0.12);
                    ctx.scale(0.96, 1.04);
                } else if (!isLandingPose) {
                    ctx.rotate(-0.03);
                } else {
                    ctx.rotate(0.1);
                    ctx.scale(1.03, 0.98);
                }
            }
            const jumpSprite = playerJumpSpriteRef.current;
            const canUseJumpSprite = isAirborne && jumpSprite && jumpSprite.complete && jumpSprite.naturalWidth > 0;
            const sprite = canUseJumpSprite ? jumpSprite : playerSpriteRef.current;
            if (sprite && sprite.complete && sprite.naturalWidth > 0) {
                const frameCount = canUseJumpSprite ? PLAYER_JUMP_FRAME_COUNT : PLAYER_DASH_FRAME_COUNT;
                const frameWidth = sprite.naturalWidth / frameCount;
                const frameHeight = sprite.naturalHeight;
                let frame = Math.abs(pl.animFrame || 0) % frameCount;
                let sourceFrame = frame;
                if (canUseJumpSprite) {
                    frame = pl.vy < -5 ? 0 : (isLandingPose ? 2 : 1);
                    if (pl.jumpActionFrame > 6 && pl.vy < 0) frame = 0;
                    sourceFrame = frame;
                } else if (isAirborne) {
                    frame = pl.vy < -5
                        ? 1
                        : (isLandingPose ? 5 : 2);
                    if (pl.jumpActionFrame > 6 && pl.vy < 0) frame = 1;
                    sourceFrame = frame;
                } else {
                    sourceFrame = PLAYER_DASH_FRAME_ORDER[frame] ?? frame;
                }
                const drawHeightTarget = canUseJumpSprite ? PLAYER_JUMP_DRAW_HEIGHT : PLAYER_DASH_DRAW_HEIGHT;
                const baselineY = canUseJumpSprite ? PLAYER_JUMP_SPRITE_BASELINE_Y : PLAYER_DASH_SPRITE_BASELINE_Y;
                const scale = drawHeightTarget / frameHeight;
                const drawWidth = frameWidth * scale;
                const drawHeight = frameHeight * scale;
                const frameXOffset = canUseJumpSprite ? (PLAYER_JUMP_FRAME_X_OFFSETS[frame] || 0) * scale : 0;
                const drawX = -drawWidth / 2 - frameXOffset;
                const drawY = -(baselineY * scale);
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(
                    sprite,
                    sourceFrame * frameWidth,
                    0,
                    frameWidth,
                    frameHeight,
                    drawX,
                    drawY,
                    drawWidth,
                    drawHeight
                );
            } else {
                const template = SPRITE_TEMPLATES['HERO_SIDE'];
                const size = 40; const pixelSize = size / 16;
                for (let row = 0; row < 16; row++) { for (let col = 0; col < 16; col++) { const char = template[row][col]; if (char === '.') continue; ctx.fillStyle = char === '%' ? '#ffccbc' : (char === '@' ? '#000000' : '#dc2626'); ctx.fillRect(-20 + col * pixelSize, -40 + row * pixelSize, pixelSize + 0.5, pixelSize + 0.5); } }
            }
            ctx.restore();
            ctx.shadowBlur = 0;
            if (pl.barrier) { ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -20, 30, 0, Math.PI * 2); ctx.stroke(); }
            ctx.restore();
        }
        ctx.restore();
    };

    useEffect(() => {
        const fixedStep = 1000 / 60; 
        let lastTime = performance.now();
        let accumulator = 0;

        const loop = (currentTime: number) => {
            if (gameStateRef.current === 'PLAYING') {
                const deltaTime = currentTime - lastTime;
                lastTime = currentTime;
                accumulator += Math.min(deltaTime, 100);
                while (accumulator >= fixedStep) {
                    updateLogic();
                    accumulator -= fixedStep;
                }
            } else {
                lastTime = currentTime;
                accumulator = 0;
            }

            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) draw(ctx);
            }
            frameIdRef.current = requestAnimationFrame(loop);
        };
        
        frameIdRef.current = requestAnimationFrame(loop);
        return () => { if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current); };
    }, []);

    const getSubjectIcon = (type: DashCardEffect['iconType']) => {
        switch(type) {
            case 'MATH': return <Brain className="text-emerald-400" />;
            case 'SCIENCE': return <Flame className="text-orange-400" />;
            case 'JAPANESE': return <Book className="text-blue-400" />;
            case 'PE': return <Wind className="text-cyan-400" />;
            case 'SOCIAL': return <Target className="text-yellow-400" />;
        }
    };

    return (
        <div className="w-full h-full bg-slate-950 text-white font-mono flex flex-col items-center p-4 relative overflow-hidden touch-none select-none" 
            onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
            
            <div className="w-full flex justify-between items-start z-10 pointer-events-none mb-2">
                <div className="flex flex-col gap-2">
                    <div className="flex gap-1">{[...Array(maxHp)].map((_, i) => (<Heart key={i} size={24} className={`${i < hp ? "text-red-500 fill-current" : "text-slate-800"} drop-shadow-lg`} />))}</div>
                    <div className="bg-black/60 px-3 py-1.5 rounded-xl border-2 border-indigo-500/50 flex flex-col w-48 backdrop-blur-md">
                        <div className="flex justify-between text-[10px] font-black text-indigo-300"><span>RANK {level}</span><span>{Math.floor(exp)} / {nextLevelExp}</span></div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-600 to-purple-400 transition-all" style={{ width: `${(exp / nextLevelExp) * 100}%` }}></div></div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-white italic tracking-tighter">{score.toLocaleString()}</div>
                    <div className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">Distance</div>
                </div>
            </div>

            <div className="flex-grow w-full flex flex-col items-center justify-center min-h-0 relative">
                <div className="w-full relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative p-1 bg-slate-800 rounded-[2rem] shadow-2xl border-2 border-slate-700 w-full overflow-hidden">
                        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-auto bg-black rounded-[1.8rem] pixel-art aspect-[2/1]" style={{ imageRendering: 'pixelated' }} />
                    </div>
                </div>
            </div>

            <div className="mt-4 flex flex-col items-center gap-2 pointer-events-none opacity-50 text-[10px] uppercase font-black tracking-widest">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1"><Move size={12}/>クリックかタップでジャンプ</div>
                </div>
            </div>

            {gameState === 'START' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 animate-in fade-in backdrop-blur-md">
                    <h2 className="text-6xl md:text-7xl font-black text-orange-500 tracking-tighter italic mb-4 drop-shadow-[4px_4px_0_#000]">帰宅ダッシュ！</h2>
                    <div className="w-16 h-1 bg-orange-500 mb-8 rounded-full"></div>
                    <p className="text-slate-400 mb-10 text-center px-8 text-sm md:text-base leading-relaxed">障害物をよけて帰宅せよ！<br/>ミサイルやスキルを駆使してゴールを目指せ。</p>
                    <button onClick={(e) => { e.stopPropagation(); initGame(); audioService.playSound('select'); }} className="bg-white text-black px-12 py-5 rounded-3xl font-black text-2xl hover:bg-orange-400 hover:text-white transition-all transform hover:scale-110 shadow-[0_8px_0_#ccc] flex items-center gap-4 active:translate-y-1 active:shadow-none"><Play fill="currentColor" size={32} /> START DASH</button>
                    <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="mt-12 text-slate-500 hover:text-white flex items-center gap-2 font-bold transition-colors"><ArrowLeft size={20}/> 職員室に戻る</button>
                </div>
            )}

            {gameState === 'CHALLENGE' && (
                <div className="absolute inset-0 z-[100] w-full h-full pointer-events-auto">
                    <MathChallengeScreen mode={GameMode.MIXED} onComplete={handleChallengeComplete} isChallenge={false} streak={0} />
                </div>
            )}

            {gameState === 'LEVEL_UP' && (
                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-indigo-950/95 p-4 backdrop-blur-md animate-in fade-in" onPointerDown={e => e.stopPropagation()}>
                    <div className="flex items-center gap-4 mb-10 animate-bounce"><Star size={40} className="text-yellow-400 fill-current" /><h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Grade Up!</h2><Star size={40} className="text-yellow-400 fill-current" /></div>
                    <div className="grid grid-cols-1 gap-4 w-full max-sm overflow-y-auto max-h-[60vh] p-2 custom-scrollbar">
                        {upgradeOptions.map(card => (
                            <div key={card.id} onClick={(e) => { e.stopPropagation(); selectUpgrade(card); }} className="bg-slate-800 border-2 border-slate-600 rounded-3xl p-4 flex items-center text-left transition-all transform hover:scale-102 hover:border-yellow-400 shadow-xl group">
                                <div className="p-3 bg-black/40 rounded-2xl mr-4 border border-slate-700 group-hover:border-yellow-500/50">{getSubjectIcon(card.iconType)}</div>
                                <div className="flex-grow"><h3 className="text-lg font-black text-white leading-tight">{card.name}</h3><p className="text-[10px] text-slate-400 font-bold leading-tight mt-1">{card.description}</p></div>
                                <ChevronRight size={20} className="text-slate-600 group-hover:text-yellow-400 transition-colors ml-2"/>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {gameState === 'GAME_OVER' && (
                <div className="absolute inset-0 z-70 flex flex-col items-center justify-center bg-red-950/98 animate-in fade-in backdrop-blur-lg" onPointerDown={e => e.stopPropagation()}>
                    <Skull size={80} className="text-red-600 mb-6 animate-pulse" /><h2 className="text-7xl font-black text-white mb-2 italic tracking-tighter uppercase">Failed</h2><div className="text-2xl text-yellow-400 mb-12 font-black bg-black/60 px-8 py-3 rounded-full border-2 border-yellow-500/50 italic shadow-xl">DISTANCE: {score.toLocaleString()}m</div>
                    <div className="flex flex-col gap-4 w-64">
                        <button onClick={(e) => { e.stopPropagation(); initGame(); audioService.playSound('select'); }} className="w-full bg-white text-black py-4 rounded-2xl font-black text-xl shadow-[0_8px_0_#ccc] hover:bg-slate-200 transition-all active:translate-y-1 active:shadow-none">TRY AGAIN</button>
                        <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-xl border-2 border-white/10 hover:bg-slate-700 transition-colors">EXIT</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoHomeDash;
