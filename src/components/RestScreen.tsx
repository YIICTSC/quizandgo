
import React, { useEffect, useState } from 'react';
import { Player, Card as ICard, LanguageMode } from '../types';
import Card from './Card';
import { BedDouble, Hammer, ArrowRight, FlaskConical, Plus, Shuffle, Check, DoorOpen } from 'lucide-react';
import { getUpgradedCard } from '../utils/cardUtils';
import { trans } from '../utils/textUtils';

const REST_SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];

interface RestScreenProps {
  player: Player;
  onRest: () => void;
  onUpgrade: (card: ICard) => void;
  onSynthesize: (cards: ICard[]) => ICard;
  onLeave: () => void;
  languageMode: LanguageMode;
  typingMode?: boolean;
  interactionDisabled?: boolean;
  interactionDisabledMessage?: string;
}

const RestScreen: React.FC<RestScreenProps> = ({ player, onRest, onUpgrade, onSynthesize, onLeave, languageMode, typingMode = false, interactionDisabled = false, interactionDisabledMessage }) => {
  const [mode, setMode] = useState<'CHOICE' | 'UPGRADE' | 'SYNTHESIS' | 'PREVIEW_UPGRADE' | 'PREVIEW_SYNTHESIS' | 'RESULT' | 'DONE'>('CHOICE');
  const [message, setMessage] = useState("放課後の校舎だ。どこへ行こう？");
  const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
  const [synthCards, setSynthCards] = useState<ICard[]>([]);
  const [resultCard, setResultCard] = useState<ICard | null>(null);
  
  // 50% chance for Science Room to be open normally
  const [isScienceRoomOpen] = useState(() => Math.random() < 0.5);

  const isMage = player.id === 'MAGE';
  // Science Club Kid (MAGE) always has the key to the Science Room
  const scienceRoomAvailable = isMage || isScienceRoomOpen;
  
  const healAmount = Math.floor(player.maxHp * 0.3);
  const requiredCards = isMage ? 3 : 2;
  const selectableCards = mode === 'UPGRADE'
    ? player.deck.filter(c => !c.upgraded)
    : player.deck;

  useEffect(() => {
      if (!typingMode || interactionDisabled) return;
      const handleKeyDown = (e: KeyboardEvent) => {
          if (mode === 'CHOICE') {
              if (e.key === '1') { e.preventDefault(); handleRest(); }
              else if (e.key === '2') { e.preventDefault(); handleSmithChoice(); }
              else if (e.key === '3') { e.preventDefault(); handleSynthesizeChoice(); }
              else if (e.key === '0' || e.key === 'Enter') { e.preventDefault(); onLeave(); }
              return;
          }
          if (mode === 'UPGRADE' || mode === 'SYNTHESIS') {
              const shortcutIndex = REST_SHORTCUT_KEYS.indexOf(e.key.toLowerCase());
              if (shortcutIndex >= 0) {
                  const card = selectableCards[shortcutIndex];
                  if (card) {
                      e.preventDefault();
                      handleCardClick(card);
                  }
              } else if (mode === 'SYNTHESIS' && e.key.toLowerCase() === 'r') {
                  e.preventDefault();
                  handleRandomSynthesis();
              } else if (e.key === '0' || e.key === 'Escape') {
                  e.preventDefault();
                  setMode('CHOICE');
                  setSynthCards([]);
                  setMessage("放課後の校舎だ。どこへ行こう？");
              }
              return;
          }
          if (mode === 'PREVIEW_UPGRADE') {
              if (e.key === '1' || e.key === 'Enter') { e.preventDefault(); confirmUpgrade(); }
              else if (e.key === '0' || e.key === 'Escape') { e.preventDefault(); cancelPreview(); }
              return;
          }
          if (mode === 'PREVIEW_SYNTHESIS') {
              if (e.key === '1' || e.key === 'Enter') { e.preventDefault(); confirmSynthesize(); }
              else if (e.key === '0' || e.key === 'Escape') { e.preventDefault(); cancelPreview(); }
              return;
          }
          if (mode === 'RESULT') {
              if (e.key === 'Enter' || e.key === '1') {
                  e.preventDefault();
                  setMode('DONE');
                  setResultCard(null);
              }
              return;
          }
          if (mode === 'DONE' && (e.key === 'Enter' || e.key === '1')) {
              e.preventDefault();
              onLeave();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingMode, mode, selectableCards, synthCards, selectedCard, requiredCards, interactionDisabled]);

  const handleRest = () => {
      if (interactionDisabled) return;
      onRest();
      setMode('DONE');
      setMessage(`保健室のベッドで仮眠をとった。HPが ${healAmount} 回復した！`);
  };

  const handleSmithChoice = () => {
      if (interactionDisabled) return;
      setMode('UPGRADE');
      setMessage("図工室だ。どの道具（カード）を改良する？");
  };

  const handleSynthesizeChoice = () => {
      if (interactionDisabled) return;
      if (!scienceRoomAvailable) return;
      if (player.deck.length < requiredCards) {
          setMessage(trans(`実験材料（カード）が${requiredCards}枚足りない...`, languageMode));
          return;
      }
      setMode('SYNTHESIS');
      setSynthCards([]);
      setMessage(isMage 
          ? `理科室だ。混ぜ合わせたいカードを3枚選んでね。\n(理科クラブ部長特典：3枚合成！)` 
          : "理科室だ。混ぜ合わせたいカードを2枚選んでね。");
  };

  const handleCardClick = (card: ICard) => {
      if (interactionDisabled) return;
      if (mode === 'UPGRADE') {
          if (card.upgraded) return;
          setSelectedCard(card);
          setMode('PREVIEW_UPGRADE');
          setMessage("このカードを改良しますか？");
      } else if (mode === 'SYNTHESIS') {
          if (synthCards.find(c => c.id === card.id)) {
              // Deselect
              setSynthCards(synthCards.filter(c => c.id !== card.id));
          } else {
              // Select Logic
              if (synthCards.length < requiredCards) {
                  const newSelection = [...synthCards, card];
                  setSynthCards(newSelection);
                  
                  if (newSelection.length === requiredCards) {
                      setMode('PREVIEW_SYNTHESIS');
                      setMessage(trans(`この${requiredCards}枚を実験（合成）しますか？（元のカードは消えます）`, languageMode));
                  }
              }
          }
      }
  };

  const handleRandomSynthesis = () => {
      if (interactionDisabled) return;
      if (player.deck.length < requiredCards) return;
      const shuffled = [...player.deck].sort(() => Math.random() - 0.5);
      const selection = shuffled.slice(0, requiredCards);
      setSynthCards(selection);
      setMode('PREVIEW_SYNTHESIS');
      setMessage(trans(`ランダムな${requiredCards}枚で実験しますか？`, languageMode));
  };

  const confirmUpgrade = () => {
      if (interactionDisabled) return;
      if (selectedCard) {
          onUpgrade(selectedCard);
          setMode('DONE');
          setMessage(`${trans(selectedCard.name, languageMode)} が強化された！切れ味が増したようだ。`);
          setSelectedCard(null);
      }
  };

  const confirmSynthesize = () => {
      if (interactionDisabled) return;
      if (synthCards.length === requiredCards) {
          const result = onSynthesize(synthCards);
          setResultCard(result);
          setMode('RESULT');
          setMessage("実験成功！新たな力が生まれた！");
          setSynthCards([]);
      }
  };

  const cancelPreview = () => {
      if (interactionDisabled) return;
      if (mode === 'PREVIEW_UPGRADE') {
          setMode('UPGRADE');
          setSelectedCard(null);
          setMessage("どのカードを改良する？");
      } else if (mode === 'PREVIEW_SYNTHESIS') {
          setMode('SYNTHESIS');
          setSynthCards([]); 
          setMessage(isMage 
              ? `混ぜ合わせたいカードを3枚選んでね。` 
              : "混ぜ合わせたいカードを2枚選んでね。");
      }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative items-center justify-center p-4 md:p-8">
        
        <div className="z-10 bg-black p-6 md:p-8 border-4 border-orange-800 rounded-lg max-w-4xl w-full text-center shadow-2xl flex flex-col max-h-[90vh]">
            {interactionDisabled && (
                <div className="mb-4 rounded-lg border border-cyan-500/50 bg-cyan-950/30 px-4 py-3 text-center text-sm font-bold text-cyan-100">
                    {interactionDisabledMessage ?? '他のプレイヤーの選択を待っています'}
                </div>
            )}
            <h2 className="text-3xl md:text-4xl text-orange-500 font-bold mb-4 flex items-center justify-center shrink-0">
                <DoorOpen className="mr-3" /> {trans("放課後の探索", languageMode)}
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-6 min-h-[3rem] shrink-0 whitespace-pre-wrap">{trans(message, languageMode)}</p>

            {mode === 'CHOICE' && (
                <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                    {/* Health Room (Rest) */}
                    <button 
                        onClick={handleRest}
                        className="group relative flex flex-col items-center gap-2 p-4 border-2 border-gray-600 hover:border-green-500 rounded-lg hover:bg-gray-800 transition-all w-32 md:w-40"
                    >
                        {typingMode && <div className="absolute right-2 top-2 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">1</div>}
                        <BedDouble size={40} className="text-green-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg">{trans("保健室", languageMode)}</span>
                        <span className="text-xs text-gray-400">HP {healAmount} {trans("回復", languageMode)}</span>
                    </button>

                    {/* Art Room (Upgrade) */}
                    <button 
                        onClick={handleSmithChoice}
                        className="group relative flex flex-col items-center gap-2 p-4 border-2 border-gray-600 hover:border-yellow-500 rounded-lg hover:bg-gray-800 transition-all w-32 md:w-40"
                    >
                        {typingMode && <div className="absolute right-2 top-2 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">2</div>}
                        <Hammer size={40} className="text-yellow-500 group-hover:rotate-12 transition-transform" />
                        <span className="font-bold text-lg">{trans("図工室", languageMode)}</span>
                        <span className="text-xs text-gray-400">{trans("カード強化", languageMode)}</span>
                    </button>

                    {/* Science Room (Synthesis) */}
                    <button 
                        onClick={handleSynthesizeChoice}
                        disabled={!scienceRoomAvailable}
                        className={`group relative flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all w-32 md:w-40
                            ${scienceRoomAvailable 
                                ? 'border-gray-600 hover:border-purple-500 hover:bg-gray-800 cursor-pointer' 
                                : 'border-gray-800 bg-black/50 opacity-50 cursor-not-allowed grayscale'}
                        `}
                    >
                        {typingMode && <div className="absolute right-2 top-2 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">3</div>}
                        <FlaskConical size={40} className={`text-purple-500 ${scienceRoomAvailable ? 'group-hover:shake' : ''} transition-transform`} />
                        <span className="font-bold text-lg">{trans("理科室", languageMode)}</span>
                        <span className="text-xs text-gray-400">
                            {scienceRoomAvailable 
                                ? (isMage ? trans("3枚合成", languageMode) : trans("カード合成", languageMode)) 
                                : trans("鍵がかかってる", languageMode)}
                        </span>
                    </button>
                </div>
            )}

            {(mode === 'UPGRADE' || mode === 'SYNTHESIS') && (
                <div className="flex flex-col items-center flex-grow overflow-hidden">
                     {mode === 'SYNTHESIS' && (
                         <button 
                            onClick={handleRandomSynthesis}
                            className="mb-4 flex items-center bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 px-4 py-2 rounded-full border border-purple-500 transition-colors text-sm"
                         >
                             <Shuffle size={14} className="mr-2" /> {trans(`ランダムな${requiredCards}枚を選ぶ`, languageMode)}
                         </button>
                     )}
                     <div className="flex flex-wrap justify-center gap-4 overflow-y-auto w-full p-4 border-inner bg-gray-900/50 rounded custom-scrollbar">
                        {selectableCards.map((card, index) => {
                            const isSelected = synthCards.some(s => s.id === card.id);
                            const shortcutKey = REST_SHORTCUT_KEYS[index];
                            return (
                                <div 
                                    key={card.id} 
                                    className={`scale-75 md:scale-90 transition-transform cursor-pointer relative ${isSelected ? 'ring-4 ring-purple-500 rounded-lg scale-95' : 'hover:scale-100'}`} 
                                    onClick={() => handleCardClick(card)}
                                >
                                    {typingMode && shortcutKey && <div className="absolute right-1 top-1 z-30 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black uppercase text-cyan-200">{shortcutKey}</div>}
                                    <Card card={card} onClick={() => handleCardClick(card)} disabled={false} languageMode={languageMode}/>
                                    {isSelected && <div className="absolute top-0 right-0 bg-purple-600 text-white rounded-full p-1"><FlaskConical size={16}/></div>}
                                </div>
                            );
                        })}
                        {mode === 'UPGRADE' && player.deck.every(c => c.upgraded) && <p className="text-gray-500">{trans("強化できるカードがない...", languageMode)}</p>}
                     </div>
                     {typingMode && (
                        <div className="mt-3 text-xs text-cyan-200/90">
                            {trans("カード選択:", languageMode)} 1-9 / QWERTY... ・ {trans("戻る:", languageMode)} 0 / Esc
                            {mode === 'SYNTHESIS' ? ` ・ ${trans("ランダム合成:", languageMode)} R` : ''}
                        </div>
                     )}
                     <button onClick={() => { setMode('CHOICE'); setSynthCards([]); setMessage("放課後の校舎だ。どこへ行こう？"); }} className="mt-4 text-gray-400 underline hover:text-white shrink-0">{trans("戻る", languageMode)}{typingMode && ' [0]'}</button>
                </div>
            )}

            {mode === 'PREVIEW_UPGRADE' && selectedCard && (
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
                        <div className="scale-90 md:scale-100">
                             <Card card={selectedCard} onClick={() => {}} disabled={false} languageMode={languageMode}/>
                             <div className="text-center mt-2 text-gray-400">{trans("強化前", languageMode)}</div>
                        </div>
                        <ArrowRight size={32} className="text-yellow-500 animate-pulse" />
                        <div className="scale-100 md:scale-110">
                             <Card card={getUpgradedCard(selectedCard)} onClick={() => {}} disabled={false} languageMode={languageMode}/>
                             <div className="text-center mt-2 text-green-400 font-bold">{trans("強化後", languageMode)}</div>
                        </div>
                    </div>
                    {typingMode && (
                        <div className="mb-4 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-4 py-2 text-sm text-cyan-100">
                            {trans("確認:", languageMode)} 1 / Enter ・ {trans("キャンセル:", languageMode)} 0 / Esc
                        </div>
                    )}
                    <div className="flex gap-4">
                        <button onClick={confirmUpgrade} className="bg-green-600 hover:bg-green-500 text-white px-8 py-2 rounded font-bold border border-white">
                            {trans("改良する", languageMode)}{typingMode && ' [1]'}
                        </button>
                        <button onClick={cancelPreview} className="bg-gray-600 hover:bg-gray-500 text-white px-8 py-2 rounded border border-gray-400">
                            {trans("やめる", languageMode)}{typingMode && ' [0]'}
                        </button>
                    </div>
                </div>
            )}

            {mode === 'PREVIEW_SYNTHESIS' && synthCards.length === requiredCards && (
                <div className="flex flex-col items-center flex-grow overflow-y-auto custom-scrollbar w-full">
                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-4 flex-grow content-center">
                        {synthCards.map((card, idx) => (
                            <React.Fragment key={card.id}>
                                <div className="scale-[0.65] md:scale-90 origin-center">
                                     <Card card={card} onClick={() => {}} disabled={false} languageMode={languageMode}/>
                                </div>
                                {idx < synthCards.length - 1 && <Plus size={20} className="text-gray-500" />}
                            </React.Fragment>
                        ))}
                        
                        <ArrowRight size={24} className="text-purple-500 animate-pulse mx-1 md:mx-2" />
                        
                        <div className="w-24 h-36 md:w-32 md:h-48 border-4 border-purple-500 bg-black rounded-lg flex flex-col items-center justify-center animate-bounce shadow-[0_0_20px_rgba(168,85,247,0.6)] shrink-0">
                            <FlaskConical size={32} className="text-purple-400 mb-2" />
                            <div className="text-purple-200 font-bold text-sm">???</div>
                            <div className="text-[10px] text-purple-400 mt-1">{trans("実験中...", languageMode)}</div>
                        </div>
                    </div>
                    {typingMode && (
                        <div className="mb-4 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-4 py-2 text-sm text-cyan-100">
                            {trans("確認:", languageMode)} 1 / Enter ・ {trans("キャンセル:", languageMode)} 0 / Esc
                        </div>
                    )}
                    <div className="flex gap-4 pb-4 shrink-0 justify-center">
                        <button onClick={confirmSynthesize} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold border border-white shadow-lg whitespace-nowrap">
                            {trans("実験開始！", languageMode)}{typingMode && ' [1]'}
                        </button>
                        <button onClick={cancelPreview} className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg border border-gray-400 whitespace-nowrap">
                            {trans("戻る", languageMode)}{typingMode && ' [0]'}
                        </button>
                    </div>
                </div>
            )}

            {mode === 'RESULT' && resultCard && (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="scale-110 mb-8">
                        <Card card={resultCard} onClick={() => {}} disabled={false} languageMode={languageMode}/>
                    </div>
                    <button 
                        onClick={() => { setMode('DONE'); setResultCard(null); }}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded text-xl font-bold border-2 border-white shadow-lg flex items-center"
                    >
                        <Check className="mr-2" /> OK{typingMode && ' [Enter]'}
                    </button>
                </div>
            )}

            {mode === 'DONE' && (
                <button 
                    onClick={onLeave}
                    className="bg-orange-700 hover:bg-orange-600 text-white px-8 py-3 rounded text-xl font-bold border-2 border-white shadow-lg animate-bounce mt-8 mx-auto"
                >
                    {trans("出発する", languageMode)}{typingMode && ' [Enter]'}
                </button>
            )}
        </div>
    </div>
  );
};

export default RestScreen;
