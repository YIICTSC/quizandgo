
import React, { useState, useMemo } from 'react';
import { Card as ICard, CardType, LanguageMode } from '../types';
import { CARDS_LIBRARY } from '../constants';
import Card from './Card';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { trans } from '../utils/textUtils';

interface ChefDeckSelectionScreenProps {
  onComplete: (selectedCards: ICard[]) => void;
  languageMode: LanguageMode;
}

const ChefDeckSelectionScreen: React.FC<ChefDeckSelectionScreenProps> = ({ onComplete, languageMode }) => {
  const unlockedNames = useMemo(() => storageService.getUnlockedCards(), []);
  
  const selectableCards = useMemo(() => {
    return Object.keys(CARDS_LIBRARY)
      .filter(key => {
        const card = CARDS_LIBRARY[key];
        return (
          unlockedNames.includes(card.name) && 
          (card.type === CardType.ATTACK || card.type === CardType.SKILL || card.type === CardType.POWER) &&
          card.rarity !== 'SPECIAL' // Don't allow starting with Boss/Special cards for balance
        );
      })
      .map(key => ({
        ...CARDS_LIBRARY[key],
        id: `chef-select-${key}`
      }));
  }, [unlockedNames]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (card: ICard) => {
    if (selectedIds.includes(card.id)) {
      setSelectedIds(prev => prev.filter(id => id !== card.id));
      audioService.playSound('select');
    } else if (selectedIds.length < 7) {
      setSelectedIds(prev => [...prev, card.id]);
      audioService.playSound('select');
    } else {
      audioService.playSound('wrong');
    }
  };

  const handleStart = () => {
    if (selectedIds.length !== 7) return;
    
    const finalCards = selectedIds.map(id => {
      const card = selectableCards.find(c => c.id === id)!;
      return {
        ...card,
        id: `deck-${card.name}-${Math.random().toString(36).substr(2, 9)}`
      };
    });
    
    onComplete(finalCards);
    audioService.playSound('win');
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white p-4 overflow-hidden relative">
      <div className="absolute inset-0 texture-dark-matter opacity-30 pointer-events-none"></div>

      {/* Header */}
      <div className="z-10 bg-black/80 border-b-4 border-pink-600 p-4 rounded-t-xl shrink-0 flex justify-between items-end">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-pink-200 mb-1 flex items-center gap-2">
            <Info size={24} className="text-pink-500" /> 給食当番の献立作成
          </h2>
          <p className="text-xs text-gray-400">これまでに獲得したカードから <span className="text-pink-400 font-bold">7枚</span> 選んで冒険を開始します。</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black mb-1 ${selectedIds.length === 7 ? 'text-green-400' : 'text-yellow-400'}`}>
            {selectedIds.length} / 7
          </div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Selected</div>
        </div>
      </div>

      {/* Card Grid */}
      <div className="z-10 flex-grow overflow-y-auto custom-scrollbar p-4 bg-black/40">
        {selectableCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-8">
            <p className="mb-2 italic text-lg">選択できるカードがありません...</p>
            <p className="text-sm">他のキャラクターで冒険してカードをアンロックしてください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center pb-20">
            {selectableCards.map((card) => {
              const isSelected = selectedIds.includes(card.id);
              return (
                <div 
                  key={card.id} 
                  className={`relative transition-all duration-200 cursor-pointer ${isSelected ? 'scale-105' : 'hover:scale-102 opacity-80 hover:opacity-100'}`}
                  onClick={() => toggleSelection(card)}
                >
                  <Card card={card} onClick={() => {}} disabled={false} languageMode={languageMode} />
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-lg animate-in zoom-in">
                      <CheckCircle2 size={20} />
                    </div>
                  )}
                  <div className={`absolute inset-0 border-4 rounded-lg pointer-events-none transition-opacity ${isSelected ? 'border-green-400 opacity-100' : 'border-transparent opacity-0'}`}></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="z-10 bg-black/80 border-t-2 border-gray-700 p-4 flex justify-center items-center shrink-0 rounded-b-xl">
        <button
          onClick={handleStart}
          disabled={selectedIds.length !== 7}
          className={`
            px-12 py-3 rounded-full font-bold text-lg flex items-center gap-2 transition-all shadow-xl
            ${selectedIds.length === 7 
              ? 'bg-pink-600 hover:bg-pink-500 text-white border-2 border-pink-400 animate-pulse' 
              : 'bg-gray-800 text-gray-500 border-2 border-gray-700 cursor-not-allowed'}
          `}
        >
          冒険を開始する <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChefDeckSelectionScreen;
