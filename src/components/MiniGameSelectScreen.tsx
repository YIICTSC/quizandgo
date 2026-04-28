
import React, { useState, useRef } from 'react';
import { ArrowLeft, Gamepad2, AlertTriangle, Trash2, Lock } from 'lucide-react';
import { audioService } from '../services/audioService';
import { MINI_GAMES, MiniGameConfig } from '../miniGameConfig';
import { GameScreen } from '../types';

interface MiniGameSelectScreenProps {
  onSelect: (screen: GameScreen) => void;
  onBack: () => void;
  totalMathCorrect: number;
  isDebug: boolean;
}

const MiniGameSelectScreen: React.FC<MiniGameSelectScreenProps> = ({ onSelect, onBack, totalMathCorrect, isDebug }) => {
  const [deleteTarget, setDeleteTarget] = useState<MiniGameConfig | null>(null);
  const longPressTimer = useRef<any>(null);
  const isLongPress = useRef(false);

  const isUnlocked = (game: MiniGameConfig) => {
    if (isDebug) return true;
    return totalMathCorrect >= game.threshold;
  };

  const handlePressStart = (game: MiniGameConfig) => {
    if (!isUnlocked(game)) return;
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setDeleteTarget(game);
      audioService.playSound('wrong');
    }, 800); // 0.8s long press
  };

  const handlePressEnd = (e: React.MouseEvent | React.TouchEvent, game: MiniGameConfig) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (!isUnlocked(game)) {
      audioService.playSound('wrong');
      return;
    }

    if (isLongPress.current) {
      e.preventDefault();
      return;
    }
    
    // Normal click
    onSelect(game.screen);
  };

  const handleCancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    
    deleteTarget.clearAction();
    audioService.playSound('buff');
    setDeleteTarget(null);
  };

  const bindPress = (game: MiniGameConfig) => ({
    onMouseDown: () => handlePressStart(game),
    onMouseUp: (e: React.MouseEvent) => handlePressEnd(e, game),
    onMouseLeave: handleCancelPress,
    onTouchStart: () => handlePressStart(game),
    onTouchEnd: (e: React.TouchEvent) => handlePressEnd(e, game),
    onTouchMove: handleCancelPress
  });

  const LockedOverlay: React.FC<{ threshold: number }> = ({ threshold }) => {
    const remaining = Math.max(0, threshold - totalMathCorrect);
    return (
      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl z-20 pointer-events-none">
        <Lock className="text-gray-500 mb-2" size={32} />
        <div className="text-gray-400 font-bold text-xs">LOCKED</div>
        <div className="text-yellow-500 font-bold text-[10px] mt-1">あと {remaining} 問</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
      <div className="absolute inset-0 texture-dark-matter opacity-30 pointer-events-none"></div>
      
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-800 border-2 border-red-500 p-6 rounded-lg max-w-sm w-full shadow-2xl text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-white mb-2">セーブデータを削除しますか？</h3>
            <p className="text-sm text-gray-300 mb-6">
              「{deleteTarget.name}」の中断データを削除して最初からやり直します。
              <br/><span className="text-red-400 text-xs">(この操作は取り消せません)</span>
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={confirmDelete} 
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded font-bold flex items-center transition-colors shadow-lg"
              >
                <Trash2 size={16} className="mr-2"/> 削除する
              </button>
              <button 
                onClick={() => setDeleteTarget(null)} 
                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded font-bold transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="z-10 w-full h-full flex flex-col items-center p-4 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-5xl flex flex-col items-center min-h-full justify-start md:justify-center py-8 md:py-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse flex items-center shrink-0">
            <Gamepad2 className="mr-2 md:mr-3 text-yellow-400" size={28} /> ミニゲーム選択
          </h2>
          <p className="text-xs text-gray-500 mb-6 animate-pulse text-center">※ボタン長押しでセーブデータを削除できます</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full mb-8 shrink-0 px-1 md:px-2">
            {MINI_GAMES.map((game) => (
              <button
                key={game.id}
                {...bindPress(game)}
                className={`group relative bg-slate-800 border-4 border-slate-600 hover:border-white p-2 md:p-4 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-left transition-all shadow-xl overflow-hidden h-36 md:h-32 ${!isUnlocked(game) ? 'grayscale opacity-60' : 'hover:bg-slate-700'}`}
                style={{ 
                  borderColor: isUnlocked(game) ? undefined : '#475569',
                  boxShadow: isUnlocked(game) ? `0 0 20px ${game.glowColor}` : undefined
                }}
              >
                {!isUnlocked(game) && <LockedOverlay threshold={game.threshold} />}
                <div className={`absolute top-0 right-0 ${game.typeColor} text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-md z-10`}>
                  {game.typeLabel}
                </div>
                
                <div className={`p-2 md:p-3 rounded-full mb-2 md:mb-0 md:mr-3 group-hover:scale-110 transition-transform duration-300 border-2 border-white/10 shrink-0 bg-black/20`}>
                  <game.icon size={24} className="text-white fill-current md:w-7 md:h-7" />
                </div>

                <div className="flex flex-col items-center md:items-start w-full">
                  <span className="text-sm md:text-lg font-bold mb-1 text-white transition-colors block">
                    {game.name}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-gray-400 group-hover:text-gray-200 leading-tight block">
                    {game.description}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button 
            onClick={onBack} 
            className="text-gray-400 hover:text-white flex items-center border-b border-transparent hover:border-white transition-colors text-base py-2 mt-auto shrink-0"
          >
            <ArrowLeft className="mr-2" size={20} /> タイトルへ戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniGameSelectScreen;
