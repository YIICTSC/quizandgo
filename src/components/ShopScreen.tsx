
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Player, Card as ICard, Relic, Potion, LanguageMode } from '../types';
import Card, { KEYWORD_DEFINITIONS } from './Card';
import { ShoppingBag, Trash2, Coins, Gem, FlaskConical, X } from 'lucide-react';
import { trans } from '../utils/textUtils';

interface ShopScreenProps {
  player: Player;
  shopCards: ICard[];
  shopRelics?: Relic[];
  shopPotions?: Potion[]; // New
  onBuyCard: (card: ICard) => void;
  onBuyRelic: (relic: Relic) => void;
  onBuyPotion: (potion: Potion, replacePotionId?: string) => void; // Update signature
  onRemoveCard: (cardId: string, cost: number) => void;
  onLeave: () => void;
  languageMode: LanguageMode;
  potionCapacity?: number;
  typingMode?: boolean;
  priceMultiplier?: number;
  interactionDisabled?: boolean;
  interactionDisabledMessage?: string;
}

const REMOVE_COST = 75;
const SHOP_SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];

const ShopScreen: React.FC<ShopScreenProps> = ({ player, shopCards, shopRelics = [], shopPotions = [], onBuyCard, onBuyRelic, onBuyPotion, onRemoveCard, onLeave, languageMode, potionCapacity = 3, typingMode = false, priceMultiplier = 1, interactionDisabled = false, interactionDisabledMessage }) => {
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [removed, setRemoved] = useState(false);
  const [viewMode, setViewMode] = useState<'BUY' | 'REMOVE'>('BUY');
  const [potionToBuy, setPotionToBuy] = useState<Potion | null>(null); // For replacement modal
  
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

  const handleBuyCard = (card: ICard) => {
    if (interactionDisabled) return;
    if (purchasedIds.includes(card.id)) return;
    let price = card.price || 50;
    if (player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
    price = Math.floor(price * priceMultiplier);

    if (player.gold >= price) {
        setInspectedItem(null); // 詳細を閉じる
        onBuyCard(card);
        setPurchasedIds([...purchasedIds, card.id]);
    }
  };

  const handleBuyRelic = (relic: Relic) => {
    if (interactionDisabled) return;
    if (purchasedIds.includes(relic.id)) return;
    let price = relic.price || 150;
    if (player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
    price = Math.floor(price * priceMultiplier);

    if (player.gold >= price) {
        setInspectedItem(null); // 詳細を閉じる
        onBuyRelic(relic);
        setPurchasedIds([...purchasedIds, relic.id]);
    }
  };

  const handleBuyPotionClick = (potion: Potion) => {
      if (interactionDisabled) return;
      if (purchasedIds.includes(potion.id)) return;
      
      let price = potion.price || 50;
      if (player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);
      price = Math.floor(price * priceMultiplier);

      if (player.gold >= price) {
          setInspectedItem(null); // 詳細を閉じる
          if (player.potions.length >= potionCapacity) {
              setPotionToBuy(potion);
          } else {
              onBuyPotion(potion);
              setPurchasedIds([...purchasedIds, potion.id]);
          }
      }
  };

  const confirmPotionReplace = (replaceId: string) => {
      if (interactionDisabled) return;
      if (!potionToBuy) return;
      onBuyPotion(potionToBuy, replaceId);
      setPurchasedIds([...purchasedIds, potionToBuy.id]);
      setPotionToBuy(null);
  };

  const handleRemove = (cardId: string) => {
      if (interactionDisabled) return;
      let cost = player.relics.find(r => r.id === 'SMILING_MASK') ? 50 : REMOVE_COST;
      if (player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) cost = Math.floor(cost * 0.5);
      cost = Math.floor(cost * priceMultiplier);

      if (player.gold >= cost && !removed) {
          setInspectedItem(null); // 詳細を閉じる
          onRemoveCard(cardId, cost);
          setRemoved(true);
          setViewMode('BUY');
      }
  };

  const getPrice = (base: number) => {
      const discounted = player.relics.find(r => r.id === 'MEMBERSHIP_CARD') ? Math.floor(base * 0.5) : base;
      return Math.floor(discounted * priceMultiplier);
  };

  const buyShortcutItems = useMemo(() => {
      const relicItems = shopRelics.filter(relic => !purchasedIds.includes(relic.id)).map(relic => ({ kind: 'RELIC' as const, id: relic.id, data: relic }));
      const potionItems = shopPotions.filter(potion => !purchasedIds.includes(potion.id)).map(potion => ({ kind: 'POTION' as const, id: potion.id, data: potion }));
      const cardItems = shopCards.filter(card => !purchasedIds.includes(card.id)).map(card => ({ kind: 'CARD' as const, id: card.id, data: card }));
      return [...relicItems, ...potionItems, ...cardItems].slice(0, SHOP_SHORTCUT_KEYS.length);
  }, [shopRelics, shopPotions, shopCards, purchasedIds]);

  const removeShortcutItems = useMemo(() => player.deck.slice(0, SHOP_SHORTCUT_KEYS.length), [player.deck]);

  useEffect(() => {
      if (!typingMode || interactionDisabled) return;
      const handleKeyDown = (e: KeyboardEvent) => {
          if (inspectedItem) {
              if (e.key === 'Escape' || e.key === '0' || e.key === 'Enter') {
                  e.preventDefault();
                  setInspectedItem(null);
              }
              return;
          }
          if (potionToBuy) {
              if (e.key >= '1' && e.key <= '9') {
                  const potion = player.potions[Number(e.key) - 1];
                  if (potion) {
                      e.preventDefault();
                      confirmPotionReplace(potion.id);
                  }
              } else if (e.key === '0' || e.key === 'Escape' || e.key === 'Enter') {
                  e.preventDefault();
                  setPotionToBuy(null);
              }
              return;
          }
          if (e.key === 'Enter') {
              e.preventDefault();
              onLeave();
              return;
          }
          if (e.key === '0') {
              e.preventDefault();
              setViewMode(prev => prev === 'BUY' ? 'REMOVE' : 'BUY');
              return;
          }
          const index = SHOP_SHORTCUT_KEYS.indexOf(e.key.toLowerCase());
          if (index === -1) return;
          e.preventDefault();

          if (viewMode === 'BUY') {
              const item = buyShortcutItems[index];
              if (!item) return;
              if (item.kind === 'CARD') handleBuyCard(item.data);
              if (item.kind === 'RELIC') handleBuyRelic(item.data);
              if (item.kind === 'POTION') handleBuyPotionClick(item.data);
              return;
          }

          const card = removeShortcutItems[index];
          if (card) handleRemove(card.id);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingMode, inspectedItem, potionToBuy, player.potions, viewMode, buyShortcutItems, removeShortcutItems, onLeave, purchasedIds, player.gold, removed, interactionDisabled]);

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
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
       
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

       {/* Header */}
       <div className="z-20 flex justify-between items-center bg-black/90 p-3 border-b-4 border-yellow-600 shadow-xl shrink-0">
           <div className="flex items-center">
               <ShoppingBag size={24} className="text-yellow-500 mr-2" />
               <div>
                   <h2 className="text-xl font-bold text-yellow-100">{trans("購買部", languageMode)}</h2>
                   <p className="text-xs text-gray-400">「{trans("いいもの揃ってるよ...", languageMode)}」</p>
               </div>
           </div>
           
           <div className="flex items-center gap-2">
                <div className="flex items-center bg-yellow-900 px-3 py-1 rounded-full border border-yellow-500">
                    <Coins className="text-yellow-400 mr-1" size={16}/>
                    <span className="text-sm font-bold">{player.gold}円</span>
                </div>
                <button onClick={interactionDisabled ? undefined : onLeave} disabled={interactionDisabled} className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded font-bold border-2 border-white cursor-pointer text-xs disabled:cursor-not-allowed disabled:opacity-50">
                    {trans("出る", languageMode)}{typingMode && ' [Enter]'}
                </button>
           </div>
       </div>

       {/* Potion Replacement Modal */}
       {potionToBuy && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPotionToBuy(null)}>
               <div className="bg-gray-900 border-2 border-white p-6 rounded shadow-2xl max-sm w-full text-center animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                   <div className="absolute top-2 right-2 cursor-pointer" onClick={() => setPotionToBuy(null)}>
                       <X size={24} className="text-gray-400 hover:text-white" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-4">{trans("ポーションがいっぱいです", languageMode)}</h3>
                   <p className="text-sm text-gray-300 mb-6">{trans("どれを捨てて入れ替えますか？", languageMode)}</p>
                   
                   <div className="flex justify-center gap-4 mb-4">
                        {player.potions.map((p, index) => (
                            <div 
                                key={p.id} 
                                className="relative flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => confirmPotionReplace(p.id)}
                            >
                                {typingMode && <div className="absolute -right-1 -top-1 z-10 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">{index + 1}</div>}
                                <div className="w-12 h-12 bg-gray-800 border-2 border-white rounded-full flex items-center justify-center mb-1">
                                    <FlaskConical size={24} style={{ color: p.color }} />
                                </div>
                                <div className="text-xs text-gray-400 w-16 truncate text-center">{trans(p.name, languageMode)}</div>
                            </div>
                        ))}
                   </div>
                   
                   <button onClick={() => setPotionToBuy(null)} className="mt-4 text-sm text-gray-500 hover:text-white underline">
                       {trans("やっぱりやめる", languageMode)}
                   </button>
               </div>
           </div>
       )}

       {/* Content */}
       <div className="z-10 flex-grow flex flex-col items-center overflow-hidden relative">
           {interactionDisabled && (
                <div className="mx-4 mt-4 w-[calc(100%-2rem)] rounded-lg border border-cyan-500/50 bg-cyan-950/30 px-4 py-3 text-center text-sm font-bold text-cyan-100">
                    {interactionDisabledMessage ?? '他のプレイヤーの選択を待っています'}
                </div>
           )}
           
           {/* Actions Toggle */}
           <div className="flex gap-2 my-4 shrink-0 z-30 w-full justify-center px-4">
                <button 
                    onClick={() => setViewMode('BUY')}
                    className={`flex-1 py-2 rounded border-2 cursor-pointer text-sm ${viewMode === 'BUY' ? 'bg-yellow-600 border-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                >
                    {trans("購入", languageMode)}
                </button>
                <button 
                    onClick={() => setViewMode('REMOVE')}
                    disabled={removed || player.gold < getPrice(player.relics.find(r => r.id === 'SMILING_MASK') ? 50 : REMOVE_COST)}
                    className={`flex-1 py-2 rounded border-2 flex items-center justify-center gap-1 cursor-pointer text-sm ${viewMode === 'REMOVE' ? 'bg-red-600 border-white' : 'bg-gray-800 border-gray-600 text-gray-400'} ${removed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Trash2 size={14}/> {trans("カード削除", languageMode)} ({getPrice(player.relics.find(r => r.id === 'SMILING_MASK') ? 50 : REMOVE_COST)} 円){typingMode && ' [0]'}
                </button>
           </div>
           {typingMode && (
                <div className="mb-3 text-center text-[10px] font-bold text-cyan-300">
                    1-9, QWERTY...: 選択 / 0: 購入・削除切替 / Enter: 店を出る
                </div>
           )}

           {viewMode === 'BUY' && (
                <div className="flex-grow w-full overflow-y-auto custom-scrollbar pb-20">
                    
                    {/* Relics & Potions Section */}
                    {(shopRelics.length > 0 || shopPotions.length > 0) && (
                        <div className="flex justify-center flex-wrap gap-4 mb-6 border-b border-gray-700 pb-6 px-4">
                            {/* Relics */}
                            {shopRelics.map(relic => {
                                const isSold = purchasedIds.includes(relic.id);
                                const price = getPrice(relic.price || 150);
                                const canAfford = player.gold >= price;
                                return (
                                    <div 
                                        key={relic.id} 
                                        className={`group relative w-28 flex flex-col items-center ${isSold ? 'opacity-20 grayscale' : ''}`}
                                        onContextMenu={(e) => { e.preventDefault(); setInspectedItem({ type: 'RELIC', data: relic }); }}
                                        onPointerDown={(e) => handlePointerDown(e, 'RELIC', relic)}
                                        onPointerUp={handlePointerUp}
                                        onPointerMove={handlePointerMove}
                                    >
                                        {typingMode && !isSold && buyShortcutItems.findIndex(item => item.id === relic.id) !== -1 && (
                                            <div className="absolute -right-1 -top-1 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">
                                                {SHOP_SHORTCUT_KEYS[buyShortcutItems.findIndex(item => item.id === relic.id)]}
                                            </div>
                                        )}
                                        <div className="w-16 h-16 bg-gray-800 border-4 border-yellow-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
                                            <Gem className="text-yellow-400" size={24}/>
                                        </div>
                                        <div className="text-xs font-bold text-center truncate w-full">{trans(relic.name, languageMode)}</div>
                                        <div className="text-[9px] text-gray-400 text-center mb-2 h-8 overflow-hidden leading-tight">{trans(relic.description, languageMode)}</div>
                                        
                                        {!isSold && (
                                            <button 
                                                onClick={() => handleBuyRelic(relic)}
                                                disabled={!canAfford}
                                                className={`px-2 py-0.5 rounded-full font-bold text-xs shadow-lg border border-white ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                {price} 円
                                            </button>
                                        )}
                                        {isSold && <div className="text-red-500 font-bold rotate-12 text-xs">{trans("売切れ", languageMode)}</div>}
                                    </div>
                                )
                            })}

                            {/* Potions */}
                            {shopPotions.map(potion => {
                                const isSold = purchasedIds.includes(potion.id);
                                const price = getPrice(potion.price || 50);
                                const canAfford = player.gold >= price;
                                const isFull = player.potions.length >= potionCapacity;

                                return (
                                    <div 
                                        key={potion.id} 
                                        className={`group relative w-28 flex flex-col items-center ${isSold ? 'opacity-20 grayscale' : ''}`}
                                        onContextMenu={(e) => { e.preventDefault(); setInspectedItem({ type: 'POTION', data: potion }); }}
                                        onPointerDown={(e) => handlePointerDown(e, 'POTION', potion)}
                                        onPointerUp={handlePointerUp}
                                        onPointerMove={handlePointerMove}
                                    >
                                        {typingMode && !isSold && buyShortcutItems.findIndex(item => item.id === potion.id) !== -1 && (
                                            <div className="absolute -right-1 -top-1 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">
                                                {SHOP_SHORTCUT_KEYS[buyShortcutItems.findIndex(item => item.id === potion.id)]}
                                            </div>
                                        )}
                                        <div className="w-12 h-12 bg-gray-800 border-2 border-white/50 rounded flex items-center justify-center mb-2 shadow-lg">
                                            <FlaskConical size={24} style={{ color: potion.color }}/>
                                        </div>
                                        <div className="text-xs font-bold text-center truncate w-full">{trans(potion.name, languageMode)}</div>
                                        <div className="text-[9px] text-gray-400 text-center mb-2 h-8 overflow-hidden leading-tight">{trans(potion.description, languageMode)}</div>
                                        
                                        {!isSold && (
                                            <button 
                                                onClick={() => handleBuyPotionClick(potion)}
                                                disabled={!canAfford}
                                                className={`px-2 py-0.5 rounded-full font-bold text-xs shadow-lg border border-white ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                {isFull ? `${price} 円 (${trans("入替", languageMode)})` : `${price} 円`}
                                            </button>
                                        )}
                                        {isSold && <div className="text-red-500 font-bold rotate-12 text-xs">{trans("売切れ", languageMode)}</div>}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Cards Section */}
                    <div className="flex flex-wrap justify-center gap-4 p-2">
                        {shopCards.map(card => {
                            const isSold = purchasedIds.includes(card.id);
                            const price = getPrice(card.price || 50);
                            const canAfford = player.gold >= price;

                            return (
                                <div key={card.id} className={`relative group transition-all scale-90 ${isSold ? 'opacity-20 grayscale' : ''}`}>
                                    {typingMode && !isSold && buyShortcutItems.findIndex(item => item.id === card.id) !== -1 && (
                                        <div className="absolute right-0 top-0 z-30 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">
                                            {SHOP_SHORTCUT_KEYS[buyShortcutItems.findIndex(item => item.id === card.id)]}
                                        </div>
                                    )}
                                    <Card 
                                        card={card} 
                                        onClick={() => handleBuyCard(card)} 
                                        disabled={isSold}
                                        onInspect={(c) => setInspectedItem({ type: 'CARD', data: c })}
                                        languageMode={languageMode}
                                    />
                                    {!isSold && (
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full text-center z-20">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleBuyCard(card); }}
                                                disabled={!canAfford}
                                                className={`
                                                    px-2 py-0.5 rounded-full font-bold text-xs shadow-lg border border-white
                                                    ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
                                                `}
                                            >
                                                {price} 円
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
           )}

           {viewMode === 'REMOVE' && (
               <div className="w-full h-full overflow-y-auto p-4 bg-black/40 rounded custom-scrollbar mb-4">
                   <div className="grid grid-cols-3 gap-2 pt-4">
                      {player.deck.map(card => (
                           <div key={card.id} className="scale-75 origin-top-left w-24 h-36 cursor-pointer relative group">
                                {typingMode && removeShortcutItems.findIndex(deckCard => deckCard.id === card.id) !== -1 && (
                                    <div className="absolute right-1 top-1 z-30 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200 scale-125">
                                        {SHOP_SHORTCUT_KEYS[removeShortcutItems.findIndex(deckCard => deckCard.id === card.id)]}
                                    </div>
                                )}
                                <Card 
                                    card={card} 
                                    onClick={() => handleRemove(card.id)} 
                                    disabled={false}
                                    onInspect={(c) => setInspectedItem({ type: 'CARD', data: c })}
                                    languageMode={languageMode}
                                />
                                <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/20 transition-colors flex items-center justify-center rounded-lg z-20 pointer-events-none">
                                    <Trash2 className="opacity-0 group-hover:opacity-100 text-red-500 bg-black p-2 rounded-full border border-red-500" size={32} />
                                </div>
                           </div>
                       ))}
                   </div>
               </div>
           )}

       </div>
    </div>
  );
};

export default ShopScreen;
