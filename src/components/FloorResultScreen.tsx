
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ActStats, LanguageMode, Card as ICard } from '../types';
import { GAME_STORIES } from '../data/stories';
import { ADDITIONAL_CARDS } from '../constants1';
import { trans } from '../utils/textUtils';
import { Skull, Coins, Brain, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { audioService } from '../services/audioService';
import Card from './Card';

interface FloorResultScreenProps {
  act: number;
  stats: ActStats;
  storyIndex: number;
  onNext: () => void;
  languageMode: LanguageMode;
  newlyUnlockedCardName?: string; // 追加
  typingMode?: boolean;
}

const FloorResultScreen: React.FC<FloorResultScreenProps> = ({ act, stats, storyIndex, onNext, languageMode, newlyUnlockedCardName, typingMode = false }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  
  const storySet = GAME_STORIES[storyIndex] || GAME_STORIES[0];
  const currentPart = storySet.parts[(act - 1) % 3]; 

  // 解放されたカード情報の取得
  const unlockedCard = useMemo(() => {
    if (!newlyUnlockedCardName) return null;
    const cardTemplate = Object.values(ADDITIONAL_CARDS).find(c => c.name === newlyUnlockedCardName);
    if (!cardTemplate) return null;
    return { ...cardTemplate, id: `unlock-display-${Date.now()}` } as ICard;
  }, [newlyUnlockedCardName]);

  // 音声読み上げ関数
  const speakStory = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85; 
    utterance.pitch = 1.0; 
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    let index = 0;
    const rawContent = currentPart.content;
    const translatedContent = trans(rawContent, languageMode);
    
    setDisplayedText("");
    setIsTyping(true);

    speakStory(translatedContent);
    
    const interval = setInterval(() => {
      if (index < translatedContent.length) {
        setDisplayedText(translatedContent.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 40);

    return () => {
      clearInterval(interval);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentPart, languageMode, speakStory]);

  const handleNext = () => {
    if (isTyping) {
      setDisplayedText(trans(currentPart.content, languageMode));
      setIsTyping(false);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      onNext();
      audioService.playSound('select');
    }
  };

  useEffect(() => {
    if (!typingMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === '1') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingMode, isTyping, currentPart, languageMode]);

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 lg:p-10 relative overflow-hidden font-mono">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
        <BookOpen className="text-gray-500 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px]" />
      </div>

      <div className="z-10 w-full max-w-2xl md:max-w-5xl bg-black/90 border-2 sm:border-4 border-gray-700 p-4 sm:p-8 md:p-6 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-500 max-h-[95vh] flex flex-col overflow-y-auto md:overflow-hidden custom-scrollbar">
        <div className="text-center mb-4 sm:mb-6 md:mb-4 shrink-0">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-100 mb-2 tracking-tighter italic">
            ACT {act} <span className="text-gray-500 not-italic text-2xl sm:text-4xl">CLEARED</span>
          </h2>
          <div className="h-1 w-24 sm:w-32 bg-gray-500 mx-auto rounded-full"></div>
        </div>

        {/* Responsive Body Grid: Only grid on md: when unlockedCard exists */}
        <div className={`flex flex-col flex-grow min-h-0 ${unlockedCard ? 'md:grid md:grid-cols-12 md:gap-6' : ''}`}>
            
            {/* Left Side: Unlocked Card (Column 1-5 on PC) */}
            {unlockedCard && (
                <div className="md:col-span-5 flex flex-col justify-center mb-6 md:mb-0">
                    <div className="p-4 bg-yellow-600/10 border-2 border-yellow-500/50 rounded-xl animate-in zoom-in duration-700 delay-300 h-full flex flex-col">
                        <div className="flex items-center justify-center gap-2 text-yellow-400 font-black text-xs sm:text-sm mb-3 italic tracking-widest shrink-0">
                            <Sparkles size={16}/> NEW CARD UNLOCKED! <Sparkles size={16}/>
                        </div>
                        <div className="flex flex-row md:flex-col items-center justify-center gap-4 flex-grow">
                            <div className="scale-75 sm:scale-90 md:scale-100 origin-center shrink-0">
                                <Card card={unlockedCard} onClick={()=>{}} disabled={false} languageMode={languageMode}/>
                            </div>
                            <div className="text-left md:text-center flex-1 md:flex-initial">
                                <h4 className="text-white font-bold text-lg mb-1">{trans(unlockedCard.name, languageMode)}</h4>
                                <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{trans(unlockedCard.description, languageMode)}</p>
                                <p className="text-yellow-500/70 text-[9px] mt-2 font-bold uppercase tracking-tighter hidden md:block">Next reward pool expanded</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Right Side: Stats + Story (Column 6-12 on PC) */}
            <div className={`${unlockedCard ? 'md:col-span-7' : 'w-full max-w-2xl mx-auto'} flex flex-col flex-grow min-h-0`}>
                {/* Stats Section */}
                <div className="grid grid-cols-3 gap-2 sm:gap-6 md:gap-3 mb-4 shrink-0">
                    <div className="bg-gray-900/50 p-2 sm:p-3 rounded-lg border border-gray-800 flex flex-col items-center justify-center">
                        <Skull className="text-red-500 mb-1" size={16} />
                        <div className="text-[7px] sm:text-[9px] text-gray-500 uppercase font-bold tracking-widest text-center">Enemies</div>
                        <div className="text-lg sm:text-xl font-black text-white">{stats.enemiesDefeated}</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 sm:p-3 rounded-lg border border-gray-800 flex flex-col items-center justify-center">
                        <Coins className="text-yellow-500 mb-1" size={16} />
                        <div className="text-[7px] sm:text-[9px] text-gray-500 uppercase font-bold tracking-widest text-center">Gold</div>
                        <div className="text-lg sm:text-xl font-black text-white">{stats.goldGained}G</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 sm:p-3 rounded-lg border border-gray-800 flex flex-col items-center justify-center">
                        <Brain className="text-emerald-500 mb-1" size={16} />
                        <div className="text-[7px] sm:text-[9px] text-gray-500 uppercase font-bold tracking-widest text-center">Correct</div>
                        <div className="text-lg sm:text-xl font-black text-white">{stats.mathCorrect}</div>
                    </div>
                </div>

                {/* Story Section */}
                <div className="bg-gray-800/30 border-2 border-gray-700 p-4 sm:p-6 md:p-4 rounded-lg mb-4 min-h-[8rem] md:min-h-0 relative flex-grow flex flex-col justify-center overflow-hidden">
                    <div className="absolute -top-3 left-4 sm:left-6 bg-gray-700 px-2 sm:px-3 py-0.5 rounded text-[8px] sm:text-[9px] font-bold text-gray-300 uppercase tracking-widest z-10">
                        {trans(currentPart.title, languageMode)}
                    </div>
                    <div className="overflow-y-auto custom-scrollbar h-full max-h-[150px] md:max-h-none pr-1">
                        <p className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-200">
                            {displayedText}
                            {isTyping && <span className="inline-block w-1.5 sm:w-2 h-4 sm:h-5 bg-emerald-500 ml-1 animate-pulse align-middle"></span>}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Area */}
        <div className="mt-2 shrink-0">
            <button 
                onClick={handleNext}
                className={`w-full py-3 sm:py-4 md:py-3 rounded-lg font-black text-lg sm:text-xl flex items-center justify-center gap-2 sm:gap-3 transition-all transform active:scale-95 shadow-xl border-b-4 ${isTyping ? 'bg-gray-700 border-gray-900 text-gray-400' : 'bg-white text-black border-gray-300 hover:bg-gray-200'}`}
            >
                {isTyping ? trans("スキップ", languageMode) : trans("次へ進む", languageMode)} <ArrowRight size={20} className="sm:size-6" />{typingMode && ' [Enter]'}
            </button>
        </div>
      </div>

      <div className="absolute bottom-2 sm:bottom-4 right-4 sm:right-6 text-gray-700 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] hidden xs:block">
        Act Completion Record v1.3
      </div>
    </div>
  );
};

export default FloorResultScreen;
