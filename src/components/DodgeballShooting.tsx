
import React, { useState, useEffect, useRef } from 'react';
import { Enemy } from '../types';
import EnemyIllustration from './EnemyIllustration';
import { audioService } from '../services/audioService';
import { ENEMY_ILLUSTRATION_SIZE_CLASS } from '../constants/uiSizing';

interface DodgeballShootingProps {
    enemy: Enemy;
    playerImage: string;
    onComplete: (hit: boolean) => void;
}

const DodgeballShooting: React.FC<DodgeballShootingProps> = ({ enemy, playerImage, onComplete }) => {
    const [ballPos, setBallPos] = useState({ x: 15, y: 50 }); // Percentage
    const [enemyPos, setEnemyPos] = useState({ x: 80, y: 50 }); // Percentage
    const [isThrown, setIsThrown] = useState(false);
    const [result, setResult] = useState<'NONE' | 'HIT' | 'MISS'>('NONE');
    
    const requestRef = useRef<number>(null);
    const ballRef = useRef({ x: 15, y: 50 });
    const enemyRef = useRef({ x: 80, y: 50 });

    // 敵のタイプに応じた移動ロジック
    useEffect(() => {
        const moveEnemy = (time: number) => {
            if (result !== 'NONE') return;

            let newY = 50;
            let newX = 80;

            const type = enemy.enemyType;

            switch (type) {
                case 'TEACHER':
                    // 規則的だが大きくゆったり動く
                    newY = 50 + Math.sin(time / 600) * 35;
                    break;
                case 'GHOST':
                    // ジッター（震え）を伴う不規則な浮遊
                    newY = 50 + Math.sin(time / 300) * 25 + (Math.random() - 0.5) * 5;
                    newX = 80 + Math.cos(time / 1000) * 3;
                    break;
                case 'AGGRESSIVE':
                    // 素早く鋭い動き
                    newY = 50 + Math.sin(time / 200) * 40;
                    break;
                case 'TRICKSTER':
                    // 8の字のような円軌道
                    newY = 50 + Math.sin(time / 400) * 30;
                    newX = 80 + Math.cos(time / 200) * 6;
                    break;
                case 'TANK':
                    // 重々しく、動きが少ない
                    newY = 50 + Math.sin(time / 1200) * 15;
                    break;
                case 'GUARDIAN':
                    // 複雑な複合波
                    newY = 50 + Math.sin(time / 350) * 20 + Math.sin(time / 800) * 20;
                    newX = 80 + Math.sin(time / 500) * 5;
                    break;
                case 'SWARM':
                    // 小刻みなバウンド
                    newY = 70 - Math.abs(Math.sin(time / 200)) * 50;
                    break;
                default:
                    // 標準の動き
                    newY = 50 + Math.sin(time / 400) * 30;
            }

            // 画面端のクランプ（はみ出し防止）
            newY = Math.max(15, Math.min(85, newY));
            newX = Math.max(65, Math.min(95, newX));

            setEnemyPos({ x: newX, y: newY });
            enemyRef.current = { x: newX, y: newY };
            requestRef.current = requestAnimationFrame(moveEnemy);
        };
        requestRef.current = requestAnimationFrame(moveEnemy);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [result, enemy.enemyType]);

    const handleThrow = () => {
        if (isThrown || result !== 'NONE') return;
        setIsThrown(true);
        audioService.playSound('attack');

        const throwSpeed = 1.8; // 少し弾速をアップ
        const animateBall = () => {
            ballRef.current.x += throwSpeed;
            setBallPos({ ...ballRef.current });

            // 敵の現在の座標を取得して衝突判定
            const ex = enemyRef.current.x;
            const ey = enemyRef.current.y;

            // 当たり判定 (敵のX座標を中心とした一定範囲)
            if (ballRef.current.x >= ex - 5 && ballRef.current.x <= ex + 5) {
                const dist = Math.abs(ballRef.current.y - ey);
                if (dist < 12) {
                    setResult('HIT');
                    audioService.playSound('correct');
                    setTimeout(() => onComplete(true), 1200);
                    return;
                }
            }

            if (ballRef.current.x > 110) {
                setResult('MISS');
                audioService.playSound('wrong');
                setTimeout(() => onComplete(false), 1200);
                return;
            }

            requestAnimationFrame(animateBall);
        };
        requestAnimationFrame(animateBall);
    };

    return (
        <div 
            className="w-full h-full bg-slate-800 flex flex-col items-center justify-center relative cursor-crosshair overflow-hidden"
            onClick={handleThrow}
        >
            <div className="absolute inset-0 texture-dark-matter opacity-20 pointer-events-none"></div>
            
            {/* Header */}
            <div className="absolute top-10 text-center animate-pulse z-10 pointer-events-none">
                <h2 className="text-3xl font-bold text-orange-500 drop-shadow-md">DODGEBALL ACE SPECIAL</h2>
                <p className="text-white text-sm mt-2">タイミングよくクリックしてボールを当てろ！</p>
                <div className="mt-2 flex flex-col items-center gap-1">
                    <div className="bg-black/50 px-4 py-1 rounded-full border border-orange-500 text-orange-300 text-xs font-bold">
                        TARGET: {enemy.name}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">TYPE: {enemy.enemyType}</div>
                </div>
            </div>

            {/* Field */}
            <div className="w-full max-w-2xl h-64 relative bg-black/40 border-y-4 border-slate-600">
                {/* Center Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/20"></div>

                {/* Player */}
                <div className="absolute left-[10%] -translate-y-1/2 flex flex-col items-center" style={{ top: '50%' }}>
                    <div className="w-16 h-16 scale-x-1">
                        <img src={playerImage} className="w-full h-full pixel-art" style={{ imageRendering: 'pixelated' }} alt="Player" />
                    </div>
                </div>

                {/* Enemy */}
                <div 
                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                    style={{ left: `${enemyPos.x}%`, top: `${enemyPos.y}%` }}
                >
                    <div className={`${ENEMY_ILLUSTRATION_SIZE_CLASS.miniGameDodgeball} scale-x-[-1] relative`}>
                        <EnemyIllustration name={enemy.name} seed={enemy.id} className="w-full h-full" />
                        {/* Shadow underneath enemy */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/40 rounded-full blur-sm"></div>
                    </div>
                </div>

                {/* Ball */}
                <div 
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 ${isThrown ? '' : 'animate-bounce'}`}
                    style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
                >
                    <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(249,115,22,0.8)] flex items-center justify-center overflow-hidden">
                        <div className="w-full h-1 bg-white/30 rotate-45"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                    </div>
                </div>

                {/* Hit/Miss Text */}
                {result !== 'NONE' && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                        <div className={`text-6xl font-black italic tracking-tighter animate-in zoom-in duration-300 ${result === 'HIT' ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'text-red-500'}`}>
                            {result === 'HIT' ? 'NICE HIT!' : 'MISS...'}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-10 text-gray-400 text-[10px] font-mono uppercase tracking-widest pointer-events-none">
                {isThrown ? 'THE BALL HAS BEEN RELEASED...' : 'TAP ANYWHERE TO THROW!'}
            </div>
        </div>
    );
};

export default DodgeballShooting;
