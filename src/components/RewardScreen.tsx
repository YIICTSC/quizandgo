
import React, { useEffect, useState, useRef } from 'react';
import { Card as ICard, RewardItem, Potion, LanguageMode, RaceTrickCard, CoopSupportCard } from '../types';
import Card, { KEYWORD_DEFINITIONS } from './Card';
import { Gift, Gem, Coins, FlaskConical, X, Flag, Sparkles, Users } from 'lucide-react';
import { trans } from '../utils/textUtils';

interface RewardScreenProps {
  rewards: RewardItem[];
  onSelectReward: (item: RewardItem, replacePotionId?: string) => void;
  onSkip: () => void;
  isLoading: boolean;
  currentPotions?: Potion[];
  potionCapacity?: number;
  languageMode: LanguageMode;
  typingMode?: boolean;
  dummyRewards?: number;
  autoSkipWhenEmpty?: boolean;
  skipDisabled?: boolean;
  skipDisabledMessage?: string;
  interactionDisabled?: boolean;
  interactionDisabledMessage?: string;
}

const RewardScreen: React.FC<RewardScreenProps> = ({ rewards, onSelectReward, onSkip, isLoading, currentPotions = [], potionCapacity = 3, languageMode, typingMode = false, dummyRewards = 0, autoSkipWhenEmpty = true, skipDisabled = false, skipDisabledMessage, interactionDisabled = false, interactionDisabledMessage }) => {
  const [replaceReward, setReplaceReward] = useState<RewardItem | null>(null);
  const [inspectedItem, setInspectedItem] = useState<{ type: 'CARD' | 'RELIC' | 'POTION', data: any } | null>(null);
  const longPressTimer = useRef<any>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent, itemType: 'RELIC' | 'POTION', data: any) => {
      startPos.current = { x: e.clientX, y: e.clientY };
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      longPressTimer.current = setTimeout(() => {
          setInspectedItem({ type: itemType, data });
      }, 700);
  };

  const handlePointerUp = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
      if (dist > 10) {
          handlePointerUp();
      }
  };

  useEffect(() => {
    if (autoSkipWhenEmpty && !isLoading && !interactionDisabled && rewards.length === 0) {
      const timer = setTimeout(() => {
        onSkip();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoSkipWhenEmpty, rewards, isLoading, interactionDisabled, onSkip]);

  useEffect(() => {
    if (!typingMode || interactionDisabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (inspectedItem) {
        if (e.key === 'Escape' || e.key === '0' || e.key === 'Enter') {
          e.preventDefault();
          setInspectedItem(null);
        }
        return;
      }
      if (replaceReward) {
        if (e.key >= '1' && e.key <= '9') {
          const index = Number(e.key) - 1;
          const potion = currentPotions[index];
          if (potion) {
            e.preventDefault();
            confirmReplace(potion.id);
          }
        } else if (e.key === '0' || e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          setReplaceReward(null);
        }
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        const index = Number(e.key) - 1;
        const reward = rewards[index];
        if (!reward) return;
        e.preventDefault();
        if (reward.type === 'POTION') {
          handlePotionClick(reward);
        } else {
          onSelectReward(reward);
        }
      } else if ((e.key === '0' || e.key === 'Enter') && !skipDisabled) {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingMode, isLoading, inspectedItem, replaceReward, currentPotions, rewards, onSkip, interactionDisabled, skipDisabled]);

  const handlePotionClick = (reward: RewardItem) => {
      if (interactionDisabled) return;
      if (currentPotions.length >= potionCapacity) {
          setReplaceReward(reward);
      } else {
          onSelectReward(reward);
      }
  };

  const confirmReplace = (replaceId: string) => {
      if (interactionDisabled) return;
      if (!replaceReward) return;
      onSelectReward(replaceReward, replaceId);
      setReplaceReward(null);
  };

  const getCardKeywords = (card: ICard) => {
      const keywords = [];
      if (card.exhaust) keywords.push(KEYWORD_DEFINITIONS.EXHAUST);
      if (card.strength || card.description.includes('ムキムキ')) keywords.push(KEYWORD_DEFINITIONS.STRENGTH);
      if (card.vulnerable || card.description.includes('びくびく')) keywords.push(KEYWORD_DEFINITIONS.VULNERABLE);
      if (card.weak || card.description.includes('へろへろ')) keywords.push(KEYWORD_DEFINITIONS.WEAK);
      if (card.block || card.description.includes('ブロック')) keywords.push(KEYWORD_DEFINITIONS.BLOCK);
      if (card.draw || card.description.includes('引く')) keywords.push(KEYWORD_DEFINITIONS.DRAW);
      return keywords;
  };

  const getProcessedDescription = (card: ICard) => {
      // transをまずかけることで辞書置換を行う
      let desc = trans(card.description, languageMode);
      if (card.damage !== undefined) desc = desc.replace(/(\d+)ダメージ/g, `${card.damage}${trans("ダメージ", languageMode)}`);
      if (card.block !== undefined) desc = desc.replace(/ブロック(\d+)/g, `${trans("ブロック", languageMode)}${card.block}`);
      if (card.poison !== undefined) desc = desc.replace(/ドクドク(\d+)/g, `${trans("ドクドク", languageMode)}${card.poison}`);
      if (card.weak !== undefined) desc = desc.replace(/へろへろ(\d+)/g, `${trans("へろへろ", languageMode)}${card.weak}`);
      if (card.vulnerable !== undefined) desc = desc.replace(/びくびく(\d+)/g, `${trans("びくびく", languageMode)}${card.vulnerable}`);
      if (card.strength !== undefined) desc = desc.replace(/ムキムキ(\d+)/g, `${trans("ムキムキ", languageMode)}${card.strength}`);
      return desc;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white relative p-4">
      
      {/* Inspection Modal */}
       {inspectedItem && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setInspectedItem(null)}>
                <div className="bg-gray-800 border-2 border-white p-6 rounded-lg max-w-sm w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setInspectedItem(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white p-2">
                        <X size={24} />
                    </button>
                    
                    <div className="flex flex-col items-center mb-4">
                        {inspectedItem.type === 'CARD' && (
                            <div className="scale-100 mb-4">
                                <Card card={inspectedItem.data} onClick={() => {}} disabled={false} languageMode={languageMode}/>
                            </div>
                        )}
                        {inspectedItem.type === 'RELIC' && (
                            <div className="w-20 h-20 bg-gray-800 border-4 border-yellow-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                                <Gem className="text-yellow-400" size={40}/>
                            </div>
                        )}
                        {inspectedItem.type === 'POTION' && (
                            <div className="w-20 h-20 bg-gray-800 border-2 border-white/50 rounded flex items-center justify-center mb-4 shadow-lg">
                                <FlaskConical size={40} style={{ color: inspectedItem.data.color }}/>
                            </div>
                        )}
                        
                        <h3 className="text-2xl font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-2 text-center w-full">
                            {trans(inspectedItem.data.name, languageMode)}
                        </h3>
                    </div>

                    <div className="text-lg text-white mb-6 leading-relaxed whitespace-pre-wrap font-bold bg-black/30 p-3 rounded text-center">
                        {inspectedItem.type === 'CARD' ? getProcessedDescription(inspectedItem.data) : trans(inspectedItem.data.description, languageMode)}
                    </div>
                    
                    {/* Keywords List for Cards */}
                    {inspectedItem.type === 'CARD' && (
                        <div className="space-y-2">
                            {getCardKeywords(inspectedItem.data).map((k, idx) => (
                                <div key={idx} className="flex flex-col text-left text-sm bg-gray-700/50 p-2 rounded">
                                    <span className="font-bold text-yellow-300 mb-0.5">{trans(k.title, languageMode)}</span>
                                    <span className="text-gray-300 text-xs">{trans(k.desc, languageMode)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

      {/* Replacement Modal */}
      {replaceReward && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReplaceReward(null)}>
               <div className="bg-gray-900 border-2 border-white p-6 rounded shadow-2xl max-sm w-full text-center animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                   <div className="absolute top-2 right-2 cursor-pointer" onClick={() => setReplaceReward(null)}>
                       <X size={24} className="text-gray-400 hover:text-white" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-4">{trans("ポーションがいっぱいです", languageMode)}</h3>
                   <p className="text-sm text-gray-300 mb-6">{trans("どれを捨てて入れ替えますか？", languageMode)}</p>
                   
                   <div className="flex justify-center gap-4 mb-4">
                        {currentPotions.map(p => (
                            <div 
                                key={p.id} 
                                className="relative flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => confirmReplace(p.id)}
                            >
                                {typingMode && <div className="absolute -right-1 -top-1 z-10 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">{currentPotions.findIndex(cp => cp.id === p.id) + 1}</div>}
                                <div className="w-12 h-12 bg-gray-800 border-2 border-white rounded-full flex items-center justify-center mb-1">
                                    <FlaskConical size={24} style={{ color: p.color }} />
                                </div>
                                <div className="text-xs text-gray-400 w-16 truncate text-center">{trans(p.name, languageMode)}</div>
                            </div>
                        ))}
                   </div>
                   
                   <button onClick={() => setReplaceReward(null)} className="mt-4 text-sm text-gray-500 hover:text-white underline">
                       {trans("やめる", languageMode)}{typingMode && ' [0]'}
                   </button>
               </div>
           </div>
       )}

      <div className="z-10 text-center mb-4 shrink-0 pt-4">
        {interactionDisabled && (
          <div className="mx-auto mb-4 max-w-xl rounded-lg border border-cyan-500/50 bg-cyan-950/30 px-4 py-3 text-center text-sm font-bold text-cyan-100">
            {interactionDisabledMessage ?? '他のプレイヤーの選択を待っています'}
          </div>
        )}
        <h2 className="text-3xl md:text-4xl text-yellow-400 font-bold mb-2 flex items-center justify-center animate-pulse">
          <Gift className="mr-3" size={32} /> {trans("勝利", languageMode)}
        </h2>
        <p className="text-gray-300 text-sm">{trans("欲しい報酬を選択してください", languageMode)}</p>
      </div>

      <div className={`z-10 flex flex-row items-center gap-8 w-full overflow-x-auto md:justify-center landscape:justify-center custom-scrollbar px-4 pt-20 pb-8 min-h-[420px] snap-x ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {rewards.map((reward) => (
          <div key={reward.id} className="snap-center shrink-0 transform hover:scale-105 transition-transform duration-200 flex justify-center">
            
            {reward.type === 'CARD' && (
                <div className="relative flex flex-col items-center w-48"> 
                    {typingMode && <div className="absolute right-0 top-0 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="scale-110 mb-8 mt-6">
                        <Card 
                            card={reward.value as ICard} 
                            onClick={() => !isLoading && !interactionDisabled && onSelectReward(reward)} 
                            disabled={isLoading || interactionDisabled} 
                            onInspect={(c) => setInspectedItem({ type: 'CARD', data: c })}
                            languageMode={languageMode}
                        />
                    </div>
                    <button onClick={() => !interactionDisabled && onSelectReward(reward)} disabled={interactionDisabled} className="mt-4 bg-blue-600 px-6 py-2 text-sm font-bold rounded border hover:bg-blue-500 shadow-lg w-full disabled:cursor-not-allowed disabled:opacity-50">{trans("獲得", languageMode)}</button>
                </div>
            )}
            
            {reward.type === 'RELIC' && (
                <div 
                    className="relative w-48 bg-black/60 border-2 border-yellow-500 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" 
                    onClick={() => !interactionDisabled && onSelectReward(reward)}
                    onContextMenu={(e) => { e.preventDefault(); setInspectedItem({ type: 'RELIC', data: reward.value }); }}
                    onPointerDown={(e) => handlePointerDown(e, 'RELIC', reward.value)}
                    onPointerUp={handlePointerUp}
                    onPointerMove={handlePointerMove}
                >
                    {typingMode && <div className="absolute right-2 top-2 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="bg-gray-800 p-4 rounded-full border-2 border-yellow-600 mb-4 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                        <Gem size={40} className="text-yellow-400" />
                    </div>
                    <div className="text-center mb-auto w-full">
                        <div className="text-yellow-100 font-bold text-lg mb-2 truncate">{trans(reward.value.name, languageMode)}</div>
                        <div className="text-xs text-gray-400 leading-tight h-16 overflow-hidden">{trans(reward.value.description, languageMode)}</div>
                    </div>
                    <button disabled={interactionDisabled} className="bg-yellow-600 px-6 py-2 text-sm font-bold rounded border hover:bg-yellow-500 w-full mt-2 disabled:cursor-not-allowed disabled:opacity-50">{trans("獲得", languageMode)}</button>
                </div>
            )}

            {reward.type === 'GOLD' && (
                <div className="relative w-48 bg-black/60 border-2 border-yellow-500 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" onClick={() => !interactionDisabled && onSelectReward(reward)}>
                    {typingMode && <div className="absolute right-2 top-2 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="bg-gray-800 p-4 rounded-full border-2 border-yellow-600 mb-4 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                        <Coins size={40} className="text-yellow-400" />
                    </div>
                    <div className="text-center mb-auto flex flex-col justify-center h-full">
                        <div className="text-yellow-100 font-bold text-2xl mb-2">{reward.value} G</div>
                        <div className="text-xs text-gray-400">ゴールドを{trans("獲得", languageMode)}</div>
                    </div>
                    <button disabled={interactionDisabled} className="bg-yellow-600 px-6 py-2 text-sm font-bold rounded border hover:bg-yellow-500 w-full mt-2 disabled:cursor-not-allowed disabled:opacity-50">{trans("獲得", languageMode)}</button>
                </div>
            )}

            {reward.type === 'POTION' && (
                <div 
                    className="relative w-48 bg-black/60 border-2 border-white/50 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" 
                    onClick={() => !interactionDisabled && handlePotionClick(reward)}
                    onContextMenu={(e) => { e.preventDefault(); setInspectedItem({ type: 'POTION', data: reward.value }); }}
                    onPointerDown={(e) => handlePointerDown(e, 'POTION', reward.value)}
                    onPointerUp={handlePointerUp}
                    onPointerMove={handlePointerMove}
                >
                    {typingMode && <div className="absolute right-2 top-2 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="bg-gray-800 p-4 rounded-full border-2 border-white/50 mb-4 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <FlaskConical size={40} style={{ color: (reward.value as Potion).color }} />
                    </div>
                    <div className="text-center mb-auto w-full">
                        <div className="text-white font-bold text-lg mb-2 truncate">{trans(reward.value.name, languageMode)}</div>
                        <div className="text-xs text-gray-400 leading-tight h-16 overflow-hidden">{trans(reward.value.description, languageMode)}</div>
                    </div>
                    <button disabled={interactionDisabled} className="bg-gray-600 px-6 py-2 text-sm font-bold rounded border hover:bg-gray-500 w-full mt-2 disabled:cursor-not-allowed disabled:opacity-50">{trans("獲得", languageMode)}</button>
                </div>
            )}

            {reward.type === 'RACE_TRICK' && (
                <div className="relative w-48 bg-gradient-to-b from-fuchsia-950/90 to-slate-950 border-2 border-fuchsia-400 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" onClick={() => !interactionDisabled && onSelectReward(reward)}>
                    {typingMode && <div className="absolute right-2 top-2 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="bg-fuchsia-950/70 p-4 rounded-full border-2 border-fuchsia-300 mb-4 shadow-[0_0_15px_rgba(217,70,239,0.5)]">
                        <Flag size={40} className="text-fuchsia-200" />
                    </div>
                    <div className="text-center mb-auto w-full">
                        <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.2em] text-fuchsia-200 mb-1">
                            <Sparkles size={12} />
                            Race Trick
                        </div>
                        <div className="text-fuchsia-50 font-bold text-lg mb-2">{trans((reward.value as RaceTrickCard).name, languageMode)}</div>
                        <div className="text-xs text-fuchsia-100/80 leading-tight h-16 overflow-hidden">{trans((reward.value as RaceTrickCard).description, languageMode)}</div>
                    </div>
                    <button disabled={interactionDisabled} className="bg-fuchsia-600 px-6 py-2 text-sm font-bold rounded border hover:bg-fuchsia-500 w-full mt-2 disabled:cursor-not-allowed disabled:opacity-50">{trans("獲得", languageMode)}</button>
                </div>
            )}

            {reward.type === 'COOP_SUPPORT' && (
                <div className="relative w-48 bg-gradient-to-b from-emerald-950/90 to-slate-950 border-2 border-emerald-400 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" onClick={() => !interactionDisabled && onSelectReward(reward)}>
                    {typingMode && <div className="absolute right-2 top-2 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="bg-emerald-950/70 p-4 rounded-full border-2 border-emerald-300 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        <Users size={40} className="text-emerald-200" />
                    </div>
                    <div className="text-center mb-auto w-full">
                        <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.2em] text-emerald-200 mb-1">
                            <Sparkles size={12} />
                            Coop Support
                        </div>
                        <div className="text-emerald-50 font-bold text-lg mb-2">{trans((reward.value as CoopSupportCard).name, languageMode)}</div>
                        <div className="text-xs text-emerald-100/80 leading-tight h-16 overflow-hidden">{trans((reward.value as CoopSupportCard).description, languageMode)}</div>
                    </div>
                    <button disabled={interactionDisabled} className="bg-emerald-600 px-6 py-2 text-sm font-bold rounded border hover:bg-emerald-500 w-full mt-2 disabled:cursor-not-allowed disabled:opacity-50">{trans("獲得", languageMode)}</button>
                </div>
            )}
          </div>
        ))}
        {Array.from({ length: dummyRewards }).map((_, index) => (
          <div key={`dummy-${index}`} className="snap-center shrink-0 flex justify-center opacity-80">
            <div className="relative w-48 bg-black/40 border-2 border-dashed border-slate-500 rounded-xl flex flex-col items-center justify-between p-6 shadow-lg h-72 pointer-events-none">
              <div className="bg-slate-800 p-4 rounded-full border-2 border-slate-500 mb-4">
                <X size={40} className="text-slate-400" />
              </div>
              <div className="text-center mb-auto w-full">
                <div className="text-slate-100 font-bold text-lg mb-2">ダミー報酬</div>
                <div className="text-xs text-slate-400 leading-tight h-16 overflow-hidden">プリントが混ざっていて選べません。</div>
              </div>
              <button className="bg-slate-700 px-6 py-2 text-sm font-bold rounded border w-full mt-2">選択不可</button>
            </div>
          </div>
        ))}
      </div>

      {skipDisabled && rewards.length === 0 && (
        <div className="z-10 mb-4 rounded-lg border border-yellow-500/40 bg-yellow-950/20 px-4 py-3 text-center text-sm font-bold text-yellow-100">
          {skipDisabledMessage ?? '他のプレイヤーの報酬完了を待っています'}
        </div>
      )}

      <div className="z-10">
        {skipDisabled && skipDisabledMessage && (
          <div className="mb-2 text-center text-xs font-bold text-yellow-300">{skipDisabledMessage}</div>
        )}
        <button 
          onClick={interactionDisabled || skipDisabled ? undefined : onSkip}
          disabled={isLoading || interactionDisabled || skipDisabled}
          className="text-gray-400 hover:text-white border-b border-transparent hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
        >
          {isLoading ? trans("読み込み中...", languageMode) : `${trans("これ以上受け取らずに進む", languageMode)} >>`}
        </button>
        {typingMode && <div className="mt-2 text-center text-[10px] font-bold text-cyan-300">1-9: 選択 / 0 or Enter: 進む</div>}
      </div>
    </div>
  );
};

export default RewardScreen;
