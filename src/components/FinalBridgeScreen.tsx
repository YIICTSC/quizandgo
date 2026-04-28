
import React, { useState, useEffect } from 'react';
import { Player, LanguageMode } from '../types';
import { trans } from '../utils/textUtils';
import { audioService } from '../services/audioService';
import { ChevronRight, Sparkles, BookOpen, Heart } from 'lucide-react';

interface FinalBridgeScreenProps {
  player: Player;
  onComplete: (upgradeType: 'HEAL' | 'APOTHEOSIS' | 'STRENGTH') => void;
  languageMode: LanguageMode;
}

const FinalBridgeScreen: React.FC<FinalBridgeScreenProps> = ({ player, onComplete, languageMode }) => {
  const [step, setStep] = useState(0);
  const [showChoices, setShowChoices] = useState(false);

  const storyTexts = [
    "ついに、校舎の最上階へと続く『最後の渡り廊下』にたどり着いた...",
    "背後には、これまでに乗り越えてきた数々のテストや宿題の記憶が遠ざかっていく。",
    "前方にそびえ立つ重厚な扉の向こうには、この学校の全てを統べる『校長先生』が待っている。",
    "「君はよく頑張った。だが、本当の試験はこれからだ...」",
    "心の中に、かつてない勇気が湧き上がってくる。最後の準備を整えよう。"
  ];

  useEffect(() => {
    audioService.playBGM('event');
  }, []);

  const nextStep = () => {
    if (step < storyTexts.length - 1) {
      setStep(step + 1);
      audioService.playSound('select');
    } else {
      setShowChoices(true);
      audioService.playSound('buff');
    }
  };

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden font-mono">
      {/* Background Parallax Stars Effect */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's'
            }}
          />
        ))}
      </div>

      <div className="z-10 max-w-2xl w-full flex flex-col items-center">
        {!showChoices ? (
          <div className="bg-gray-900/80 border-4 border-white p-8 rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-in fade-in zoom-in duration-500">
            <div className="text-xl md:text-2xl text-white leading-relaxed mb-12 min-h-[6rem] flex items-center justify-center text-center">
              {trans(storyTexts[step], languageMode)}
            </div>
            
            <button 
              onClick={nextStep}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 font-bold hover:bg-gray-200 transition-colors"
            >
              {trans("次へ", languageMode)} <ChevronRight />
            </button>
          </div>
        ) : (
          <div className="text-center animate-in slide-in-from-bottom-10 duration-700">
            <h2 className="text-3xl font-bold text-yellow-400 mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
              <span style={{ color: "white" }}>{trans("最後の覚醒", languageMode)}</span>
            </h2>
            <p className="text-gray-300 mb-12 text-sm">決戦に持ち込む『最後の力』を一つだけ選んでください。</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <button 
                onClick={() => onComplete('HEAL')}
                className="bg-green-900/40 border-2 border-green-500 p-6 rounded-xl hover:bg-green-800/60 transition-all group flex flex-col items-center gap-4 shadow-lg hover:shadow-green-500/20"
              >
                <Heart size={40} className="text-green-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-lg mb-1 text-white">{trans("友情の絆", languageMode)}</div>
                  <div className="text-[10px] text-gray-400">{trans("HPを全回復し、最大HP+10", languageMode)}</div>
                </div>
              </button>

              <button 
                onClick={() => onComplete('APOTHEOSIS')}
                className="bg-purple-900/40 border-2 border-purple-500 p-6 rounded-xl hover:bg-purple-800/60 transition-all group flex flex-col items-center gap-4 shadow-lg hover:shadow-purple-500/20"
              >
                <BookOpen size={40} className="text-purple-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-lg mb-1 text-white">{trans("猛勉強の成果", languageMode)}</div>
                  <div className="text-[10px] text-gray-400">{trans("デッキの全カードをアップグレード", languageMode)}</div>
                </div>
              </button>

              <button 
                onClick={() => onComplete('STRENGTH')}
                className="bg-red-900/40 border-2 border-red-500 p-6 rounded-xl hover:bg-red-800/60 transition-all group flex flex-col items-center gap-4 shadow-lg hover:shadow-red-500/20"
              >
                <Sparkles size={40} className="text-red-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-lg mb-1 text-white">{trans("わんぱくの極み", languageMode)}</div>
                  <div className="text-[10px] text-gray-400">{trans("戦闘開始時にムキムキ+3を得る", languageMode)}</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hero Silhouette at the bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none scale-150">
        <img src={player.imageData} className="pixel-art grayscale brightness-0" style={{ imageRendering: 'pixelated' }} />
      </div>
    </div>
  );
};

export default FinalBridgeScreen;
