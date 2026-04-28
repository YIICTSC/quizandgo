
import React, { useState, useRef, useEffect } from 'react';
import { Character, LanguageMode } from '../types';
import { Lock, Heart, Coins, Gem, ArrowRight, Swords, Shield, Zap, Sparkles, Brain, GraduationCap, Camera, X, RefreshCw, AlertCircle, Keyboard } from 'lucide-react';
import { RELIC_LIBRARY, CARDS_LIBRARY, CHARACTER_ACCESSORIES } from '../constants';
import { trans } from '../utils/textUtils';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';

interface CharacterSelectionScreenProps {
  characters: Character[];
  unlockedCount: number;
  onSelect: (character: Character) => void;
  challengeMode?: string;
  languageMode: LanguageMode;
  coopParticipants?: Array<{
    peerId: string;
    name: string;
    imageData?: string;
    selectedCharacterId?: string;
  }>;
  coopSelfPeerId?: string;
  coopDecisionOwnerPeerId?: string;
}

const CharacterSelectionScreen: React.FC<CharacterSelectionScreenProps> = ({ characters, unlockedCount, onSelect, challengeMode, languageMode, coopParticipants = [], coopSelfPeerId, coopDecisionOwnerPeerId }) => {
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 初回マウント時に保存されている画像を読み込む
  useEffect(() => {
    const savedImages = storageService.getCustomImages();
    setCustomImages(savedImages);
  }, []);

  useEffect(() => {
    if (challengeMode !== 'TYPING' || showCamera) return;
    const unlockedCharacters = characters.filter((_, index) => index < unlockedCount);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        const char = unlockedCharacters[Number(e.key) - 1];
        if (char) {
          e.preventDefault();
          handleCharSelect(char);
        }
      } else if (e.key === 'Enter' && unlockedCharacters[0]) {
        e.preventDefault();
        handleCharSelect(unlockedCharacters[0]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [challengeMode, showCamera, characters, unlockedCount, customImages]);

  // カメラを停止する
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // カメラを開始する
  const startCamera = async (charId: string) => {
    setActiveCharId(charId);
    setCameraError(null);
    setShowCamera(true);
    audioService.playSound('select');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 400 }, height: { ideal: 400 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("カメラにアクセスできませんでした");
    }
  };

  // 写真を撮影する
  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current && activeCharId) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // スクエアにクロップしてキャプチャ
        const size = Math.min(video.videoWidth, video.videoHeight);
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;
        
        canvas.width = 128;
        canvas.height = 128;
        
        // 1. カメラ映像を描画（左右反転対応）
        context.save();
        context.translate(128, 0);
        context.scale(-1, 1);
        context.drawImage(video, startX, startY, size, size, 0, 0, 128, 128);
        context.restore();

        // 2. キャラクターアクセサリーを合成
        const accessoryUrl = CHARACTER_ACCESSORIES[activeCharId];
        if (accessoryUrl) {
            const accessoryImg = new Image();
            accessoryImg.src = accessoryUrl;
            await new Promise((resolve) => {
                accessoryImg.onload = resolve;
            });
            // アクセサリーを適切な位置（頭のあたり）に描画
            context.drawImage(accessoryImg, 0, 0, 128, 128);
        }
        
        // フラッシュ音
        audioService.playSound('attack');
        
        const dataUrl = canvas.toDataURL('image/png');
        
        // 保存処理
        setCustomImages(prev => ({ ...prev, [activeCharId]: dataUrl }));
        storageService.saveCustomImage(activeCharId, dataUrl);
        
        handleCloseCamera();
      }
    }
  };

  const handleCloseCamera = () => {
    stopCamera();
    setShowCamera(false);
    setActiveCharId(null);
  };

  const handleCharSelect = (char: Character) => {
    // カスタム画像があれば上書きして選択
    const finalChar = {
      ...char,
      imageData: customImages[char.id] || char.imageData
    };
    onSelect(finalChar);
  };

  const handleResetImage = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation();
    setCustomImages(prev => {
        const next = {...prev};
        delete next[charId];
        return next;
    });
    storageService.clearCustomImage(charId);
    audioService.playSound('select');
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative overflow-hidden">
      
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-800 border-4 border-white p-6 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(255,255,255,0.3)] relative flex flex-col items-center">
            <button onClick={handleCloseCamera} className="absolute -top-4 -right-4 bg-red-600 border-2 border-white p-2 rounded-full hover:bg-red-500 transition-colors">
              <X size={24} />
            </button>
            
            <h3 className="text-xl font-bold mb-4 text-yellow-400 tracking-widest uppercase flex items-center gap-2">
              <Camera size={20} /> 写真で作成
            </h3>

            <div className="relative w-full aspect-square bg-black border-4 border-gray-600 rounded-2xl overflow-hidden mb-6">
              {cameraError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle size={48} className="text-red-500 mb-2" />
                  <p className="text-sm font-bold text-red-200">{cameraError}</p>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {/* Accessory Overlay - Live Preview */}
                  {activeCharId && CHARACTER_ACCESSORIES[activeCharId] && (
                    <img 
                        src={CHARACTER_ACCESSORIES[activeCharId]} 
                        className="absolute inset-0 w-full h-full pointer-events-none opacity-80 z-20 animate-pulse"
                        style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                  {/* Viewfinder overlay */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-white/20 m-4 flex items-center justify-center">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-white/50 absolute top-0 left-0"></div>
                    <div className="w-8 h-8 border-t-2 border-r-2 border-white/50 absolute top-0 right-0"></div>
                    <div className="w-8 h-8 border-b-2 border-l-2 border-white/50 absolute bottom-0 left-0"></div>
                    <div className="w-8 h-8 border-b-2 border-r-2 border-white/50 absolute bottom-0 right-0"></div>
                    <div className="w-1 h-8 bg-red-500/10 absolute"></div>
                    <div className="h-1 w-8 bg-red-500/10 absolute"></div>
                  </div>
                </>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex flex-col gap-3 w-full">
                <p className="text-[10px] text-gray-400 text-center px-4 font-bold">アイテムの位置に合わせて顔を写してね！</p>
                <button 
                    onClick={capturePhoto}
                    disabled={!!cameraError}
                    className="w-full bg-white text-black py-4 rounded-xl font-black text-xl hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_0_#ccc] flex items-center justify-center gap-2"
                >
                    <Camera size={24} /> 撮影する
                </button>
            </div>
            
            <p className="text-[10px] text-gray-500 mt-4 font-bold italic tracking-tighter">CHARACTER PHOTO CAPTURE SYSTEM v2.1</p>
          </div>
        </div>
      )}

      <div className="z-10 flex flex-col items-center justify-start h-full p-4 pt-8 overflow-y-auto custom-scrollbar">
        <div className="text-center mb-8 shrink-0">
            <h2 className="text-3xl md:text-4xl text-yellow-400 font-bold mb-2 flex items-center justify-center animate-pulse">
             {trans("主人公選択", languageMode)}
            </h2>
            {challengeMode === '1A1D' ? (
                <div className="bg-red-900/50 border border-red-500 p-2 rounded inline-block animate-in fade-in zoom-in duration-300">
                    <p className="text-sm text-red-200 font-bold mb-1">【{trans("1A1Dモード", languageMode)}】</p>
                    <p className="text-xs text-red-100">{trans("初期レリックのみ所持。デッキはランダムなアタック1枚・スキル1枚でスタート。", languageMode)}</p>
                </div>
            ) : challengeMode === 'TYPING' ? (
                <div className="bg-amber-900/50 border border-amber-500 p-2 rounded inline-block animate-in fade-in zoom-in duration-300">
                    <p className="text-sm text-amber-200 font-bold mb-1 flex items-center justify-center gap-1">
                      <Keyboard size={14} /> {trans("タイピングモード", languageMode)}
                    </p>
                    <p className="text-xs text-amber-100">{trans("戦闘ではカードを選ばず、タイピング成功ごとに開いているカードを自動で使います。", languageMode)}</p>
                </div>
            ) : (
                <p className="text-sm text-gray-400">{trans("冒険に挑むキャラクターを選んでください", languageMode)}</p>
            )}
        </div>

        {challengeMode === 'COOP' && coopParticipants.length > 0 && (
          <div className="w-full max-w-6xl mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 px-4 py-3">
            <div className="text-xs font-black tracking-[0.25em] text-emerald-200 uppercase mb-3">Coop Party</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {coopParticipants.map((participant) => {
                const selectedChar = participant.selectedCharacterId
                  ? characters.find((char) => char.id === participant.selectedCharacterId)
                  : null;
                const isSelf = participant.peerId === coopSelfPeerId;
                const isDecisionOwner = participant.peerId === coopDecisionOwnerPeerId;
                return (
                  <div
                    key={participant.peerId}
                    className={`rounded-xl border px-3 py-2 text-left ${isSelf ? 'border-emerald-300 bg-emerald-900/35' : 'border-white/10 bg-black/20'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/30 border border-white/10 shrink-0">
                        {participant.imageData ? (
                          <img
                            src={participant.imageData}
                            alt={participant.name}
                            className="w-full h-full object-cover"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-500">?</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-white">{participant.name}</div>
                        <div className="text-[10px] text-emerald-200">{isSelf ? 'あなた' : '同行プレイヤー'}{isDecisionOwner ? ' / 決定役' : ''}</div>
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-gray-300">
                      {selectedChar ? `選択済み: ${trans(selectedChar.name, languageMode)}` : 'キャラ選択待ち'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl pb-20">
            {characters.map((char, index) => {
                const isUnlocked = index < unlockedCount;
                const relic = RELIC_LIBRARY[char.startingRelicId];
                const charImage = customImages[char.id] || char.imageData;
                const isCustom = !!customImages[char.id];
                
                const colorMap: Record<string, string> = {
                    'red': 'border-red-600 bg-red-950/40 hover:bg-red-900/60 shadow-red-900/20',
                    'green': 'border-green-600 bg-green-950/40 hover:bg-green-900/60 shadow-green-900/20',
                    'blue': 'border-blue-600 bg-blue-950/40 hover:bg-blue-900/60 shadow-blue-900/20',
                    'purple': 'border-purple-600 bg-purple-950/40 hover:bg-purple-900/60 shadow-purple-900/20',
                    'gray': 'border-gray-600 bg-gray-900/40 hover:bg-gray-800/60 shadow-gray-900/20',
                    'yellow': 'border-yellow-600 bg-yellow-950/40 hover:bg-yellow-900/60 shadow-yellow-900/20',
                    'orange': 'border-orange-600 bg-orange-950/40 hover:bg-orange-900/60 shadow-orange-900/20',
                    'cyan': 'border-cyan-600 bg-cyan-950/40 hover:bg-cyan-900/60 shadow-cyan-900/20',
                    'pink': 'border-pink-600 bg-pink-950/40 hover:bg-pink-900/60 shadow-pink-900/20',
                    'lime': 'border-lime-600 bg-lime-950/40 hover:bg-lime-900/60 shadow-lime-900/20',
                    'amber': 'border-amber-600 bg-amber-950/40 hover:bg-amber-900/60 shadow-amber-900/20',
                };
                
                const baseClass = `relative border-4 rounded-2xl p-5 transition-all duration-300 flex flex-col items-center ${isUnlocked ? 'cursor-pointer hover:-translate-y-2 shadow-2xl scale-100 active:scale-95' : 'opacity-60 cursor-not-allowed grayscale'}`;
                const colorClass = isUnlocked ? (colorMap[char.color] || 'border-gray-600') : 'border-gray-700 bg-gray-900';

                return (
                    <div 
                        key={char.id} 
                        className={`${baseClass} ${colorClass}`}
                        onClick={() => isUnlocked && handleCharSelect(char)}
                    >
                        {challengeMode === 'TYPING' && isUnlocked && index < 9 && (
                            <div className="absolute right-3 top-3 z-30 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">
                                {index + 1}
                            </div>
                        )}
                        {!isUnlocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 rounded-xl">
                                <Lock size={48} className="text-gray-500 mb-3" />
                                <span className="text-gray-400 font-black text-xl tracking-widest">{trans("LOCKED", languageMode)}</span>
                                <span className="text-sm text-gray-500 mt-2">{trans("クリア回数", languageMode)}: {index}{trans("回で解放", languageMode)}</span>
                            </div>
                        )}

                        <div className="w-24 h-24 mb-4 relative drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                             <img 
                                src={charImage} 
                                alt={char.name} 
                                className={`w-full h-full ${isCustom ? 'rounded-xl' : 'pixel-art'}`} 
                                style={{ imageRendering: isCustom ? 'auto' : 'pixelated' }}
                             />
                             {isUnlocked && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); startCamera(char.id); }}
                                  className="absolute -bottom-2 -right-2 bg-indigo-600 p-1.5 rounded-full border-2 border-white shadow-lg hover:bg-indigo-500 transition-colors"
                                  title="写真を撮る"
                                >
                                  <Camera size={14} />
                                </button>
                             )}
                             {isCustom && (
                                <button 
                                  onClick={(e) => handleResetImage(e, char.id)}
                                  className="absolute -top-2 -left-2 bg-red-600 p-1 rounded-full border-2 border-white shadow-lg hover:bg-red-500 transition-colors"
                                  title="リセット"
                                >
                                  <RefreshCw size={12} />
                                </button>
                             )}
                        </div>

                        <div className="w-full flex justify-between items-center mb-3 border-b-2 border-white/10 pb-2">
                            <h3 className="text-xl font-black text-white truncate">{trans(char.name, languageMode)}</h3>
                            <div className="flex gap-2 text-xs font-bold">
                                <span className="flex items-center text-red-400"><Heart size={14} className="mr-1 fill-current"/> {char.maxHp}</span>
                                <span className="flex items-center text-yellow-400"><Coins size={14} className="mr-1"/> {char.gold}</span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-100 font-bold mb-5 text-center leading-relaxed bg-black/30 p-2 rounded-lg w-full">
                            {trans(char.description, languageMode)}
                        </p>

                        {/* Character Details Grid */}
                        <div className="w-full grid grid-cols-1 gap-3 mb-6">
                            {/* Special Mechanic */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-start">
                                <div className="bg-indigo-500/20 p-1.5 rounded-lg mr-3 mt-0.5">
                                    <Sparkles size={16} className="text-indigo-400" />
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] text-indigo-300 font-black uppercase tracking-tighter mb-0.5">{trans("固有ギミック", languageMode)}</div>
                                    <div className="text-[11px] text-gray-300 font-bold leading-snug">
                                        {char.id === 'WARRIOR' && trans('戦闘後の体力回復による高い生存能力。', languageMode)}
                                        {char.id === 'CARETAKER' && trans('倒した敵を仲間の攻撃カードとして「捕獲」。', languageMode)}
                                        {char.id === 'ASSASSIN' && trans('毒による固定ダメージ。初期相棒との共闘。', languageMode)}
                                        {char.id === 'MAGE' && trans('理科室での「3枚合成」。3つの効果を併せ持つ最強のキメラを作成可能。', languageMode)}
                                        {char.id === 'DODGEBALL' && trans('ドロー＆ディスカード。ミニゲームでの敵撃破。', languageMode)}
                                        {char.id === 'BARD' && trans('デバフ管理と、敵の攻撃を反射する「応答」。', languageMode)}
                                        {char.id === 'LIBRARIAN' && trans('手札の「保留」と、強力な物語カードの活用。', languageMode)}
                                        {char.id === 'CHEF' && trans('献立（初期デッキ）の自由にカスタマイズ。', languageMode)}
                                        {char.id === 'GARDENER' && trans('菜園での種まきと強力な植物カードへの進化。', languageMode)}
                                    </div>
                                </div>
                            </div>

                            {/* Starting Relic Detail */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-start">
                                <div className="bg-yellow-500/20 p-1.5 rounded-lg mr-3 mt-0.5">
                                    <Gem size={16} className="text-yellow-400" />
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] text-yellow-300 font-black uppercase tracking-tighter mb-0.5">{trans("初期装備", languageMode)}</div>
                                    <div className="text-xs text-white font-black truncate">{relic ? trans(relic.name, languageMode) : '???'}</div>
                                    <div className="text-[10px] text-gray-400 font-bold leading-tight mt-0.5">
                                        {relic ? trans(relic.description, languageMode) : ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isUnlocked && (
                            <div className="mt-auto w-full bg-white/10 group-hover:bg-white/20 text-center py-3 rounded-xl font-black text-white flex items-center justify-center transition-all border border-white/20">
                                {trans("選択", languageMode)} <ArrowRight size={18} className="ml-2 animate-bounce-x" />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
      <style>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default CharacterSelectionScreen;
