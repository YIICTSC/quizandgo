
import React, { useState } from 'react';
import { Player, GardenSlot, Card as ICard, LanguageMode } from '../types';
import Card from './Card';
import PixelSprite from './PixelSprite';
import { trans } from '../utils/textUtils';
import { audioService } from '../services/audioService';
import { Sprout, Trash2, ArrowRight, Home, Leaf, Sun, CheckCircle2 } from 'lucide-react';

interface GardenScreenProps {
  player: Player;
  onPlant: (slotIndex: number, card: ICard) => void;
  onHarvest: (slotIndex: number) => void;
  onLeave: () => void;
  languageMode: LanguageMode;
}

const GardenScreen: React.FC<GardenScreenProps> = ({ player, onPlant, onHarvest, onLeave, languageMode }) => {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const handleSlotClick = (idx: number) => {
    const slot = player.garden![idx];
    if (slot.plantedCard) {
      if (slot.growth >= slot.maxGrowth) {
        onHarvest(idx);
        audioService.playSound('win');
        if (selectedSlot === idx) setSelectedSlot(null);
      } else {
        // まだ成長中
        setSelectedSlot(idx);
        audioService.playSound('select');
      }
    } else {
      setSelectedSlot(idx);
      audioService.playSound('select');
    }
  };

  const handlePlantSeed = (seed: ICard) => {
    if (selectedSlot !== null) {
      onPlant(selectedSlot, seed);
      audioService.playSound('buff');
      setSelectedSlot(null);
    }
  };

  const seedsInDeck = player.deck.filter(c => c.isSeed);

  return (
    <div className="flex flex-col h-full w-full bg-[#2d1b0e] text-white font-mono relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 texture-dark-matter opacity-20 pointer-events-none"></div>

      {/* Header - More compact on mobile */}
      <div className="z-10 flex justify-between items-center bg-black/60 p-2 md:p-4 border-b-4 border-[#5d4037] shrink-0 shadow-xl">
        <div className="flex items-center">
          <div className="bg-green-900 p-1.5 md:p-2 rounded-full mr-2 md:mr-3 border border-green-500">
            <Leaf className="text-green-400 w-4 h-4 md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-sm md:text-2xl font-bold text-green-100">{trans("学級菜園", languageMode)}</h2>
            <p className="text-[8px] md:text-xs text-gray-400 hidden xs:block">{trans("種を植えて、強力な植物を育てよう", languageMode)}</p>
          </div>
        </div>
        <button 
          onClick={onLeave}
          className="bg-green-700 hover:bg-green-600 px-3 py-1.5 md:px-6 md:py-2 rounded font-bold border-2 border-white transition-all shadow-lg flex items-center gap-1 md:gap-2 text-xs md:text-base"
        >
          <Home size={14} className="md:size-[18px]"/> {trans("出発", languageMode)}
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-grow overflow-hidden p-2 md:p-4 gap-2 md:gap-8">
        
        {/* Garden Grid Area */}
        <div className="flex-[3] md:flex-1 flex flex-col items-center justify-center min-h-0">
          <div className="mb-2 text-[10px] md:text-sm text-yellow-400 font-bold bg-black/40 px-3 py-0.5 rounded-full border border-yellow-600/30">
            {selectedSlot !== null 
              ? trans(`スロット ${selectedSlot + 1} を選択中... 種を選んでください`, languageMode) 
              : trans("スロットを選んでください", languageMode)}
          </div>
          
          <div className="grid grid-cols-3 gap-1.5 md:gap-3 p-2 md:p-4 bg-[#3e2723] border-4 md:border-8 border-[#5d4037] rounded-xl shadow-2xl relative w-fit h-fit">
            {player.garden?.map((slot, i) => (
              <div 
                key={i}
                onClick={() => handleSlotClick(i)}
                className={`
                  w-20 h-20 xs:w-24 xs:h-24 md:w-32 md:h-32 border-2 md:border-4 rounded-lg flex flex-col items-center justify-center relative cursor-pointer transition-all
                  ${slot.plantedCard ? 'bg-[#4e342e] border-green-800' : 'bg-[#2d1b0e] border-[#5d4037] hover:border-yellow-600'}
                  ${selectedSlot === i ? 'ring-4 ring-yellow-400 border-yellow-500 scale-105 z-10' : ''}
                `}
              >
                {!slot.plantedCard ? (
                  <div className="opacity-20 flex flex-col items-center">
                    <Sprout className="w-8 h-8 md:w-12 md:h-12" />
                    <span className="text-[8px] md:text-[10px] mt-1">{trans("空き", languageMode)}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full h-full p-1 md:p-2">
                    <div className={`flex-grow flex items-center justify-center ${slot.growth >= slot.maxGrowth ? 'animate-bounce' : ''}`}>
                      <PixelSprite 
                        seed={slot.plantedCard.id} 
                        name={slot.plantedCard.textureRef} 
                        className={`w-10 h-10 md:w-20 md:h-20 ${slot.growth < slot.maxGrowth ? 'grayscale brightness-50' : ''}`} 
                      />
                    </div>
                    
                    <div className="w-full bg-black/50 h-1.5 md:h-2 rounded-full overflow-hidden border border-white/20 mt-1">
                      <div 
                        className={`h-full transition-all duration-1000 ${slot.growth >= slot.maxGrowth ? 'bg-yellow-400' : 'bg-green-500'}`}
                        style={{ width: `${(slot.growth / slot.maxGrowth) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[7px] md:text-[10px] mt-0.5 md:mt-1 font-bold truncate w-full text-center">
                      {slot.growth >= slot.maxGrowth ? trans("収穫！", languageMode) : `${trans("成長中", languageMode)} ${slot.growth}/${slot.maxGrowth}`}
                    </span>
                  </div>
                )}
                {selectedSlot === i && !slot.plantedCard && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full p-0.5 shadow-lg animate-pulse">
                    <CheckCircle2 size={16}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Seed Selection Area - Scrollable List */}
        <div className="flex-[2] md:w-80 bg-black/40 border-2 border-[#5d4037] rounded-xl p-2 md:p-4 flex flex-col overflow-hidden shadow-inner min-h-[160px] md:min-h-0">
          <h3 className="text-xs md:text-xl font-bold text-yellow-400 mb-2 md:mb-4 flex items-center border-b border-[#5d4037] pb-1 md:pb-2 shrink-0">
             <Sun className="mr-2 w-4 h-4 md:w-5 md:h-5" /> {trans("持っている種", languageMode)}
          </h3>
          
          <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1">
            {seedsInDeck.length === 0 ? (
              <div className="text-gray-500 italic text-center py-6 md:py-10 text-[10px] md:text-sm">
                {trans("デッキに「種」がありません", languageMode)}
              </div>
            ) : (
              seedsInDeck.map((seed) => (
                <div 
                  key={seed.id}
                  onClick={() => handlePlantSeed(seed)}
                  className={`
                    p-2 md:p-3 bg-[#4e342e] border-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 md:gap-3 group
                    ${selectedSlot !== null ? 'hover:border-green-400 hover:bg-[#5d4037]' : 'opacity-50 grayscale cursor-not-allowed'}
                    ${selectedSlot === null ? 'border-[#3e2723]' : 'border-[#5d4037]'}
                  `}
                >
                  <div className="w-8 h-8 md:w-12 md:h-12 shrink-0 bg-black/40 rounded flex items-center justify-center">
                    <PixelSprite seed={seed.id} name={seed.textureRef} className="w-6 h-6 md:w-10 md:h-10" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-bold text-[10px] md:text-sm text-green-100 truncate">{trans(seed.name, languageMode)}</div>
                    <div className="text-[8px] md:text-[10px] text-gray-400 leading-tight">
                      {trans("必要成長数", languageMode)}: {seed.growthRequired}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-green-500 opacity-0 group-hover:opacity-100 hidden md:block" />
                  {selectedSlot !== null && (
                    <div className="text-[8px] font-bold text-green-400 border border-green-500/50 px-1 rounded md:hidden">植える</div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-2 p-1.5 md:p-3 bg-yellow-900/20 border border-yellow-600/30 rounded text-[7px] md:text-[10px] text-yellow-200 leading-tight shrink-0">
            {trans("※種を植えると、収穫するまでデッキから一時的に除外されます。", languageMode)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GardenScreen;
