
import React, { useState, useEffect } from 'react';
import { Archive, Key, Check } from 'lucide-react';
import { RewardItem, LanguageMode, CoopTreasurePool } from '../types';
import { audioService } from '../services/audioService';
import { trans } from '../utils/textUtils';

interface TreasureScreenProps {
  onOpen?: () => void;
  onLeave: () => void;
  rewards: RewardItem[];
  hasCursedKey: boolean;
  languageMode: LanguageMode;
  typingMode?: boolean;
  opened?: boolean;
  pools?: CoopTreasurePool[];
  onClaimPool?: (poolId: string) => void;
  resolved?: boolean;
  waitingForOthers?: boolean;
}

const TreasureScreen: React.FC<TreasureScreenProps> = ({
  onOpen,
  onLeave,
  rewards,
  hasCursedKey,
  languageMode,
  typingMode = false,
  opened,
  pools = [],
  onClaimPool,
  resolved = false,
  waitingForOthers = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isPoolMode = pools.length > 0;
  const displayOpen = opened ?? isOpen;

  useEffect(() => {
    // Play suspenseful "event" music when chest is discovered
    audioService.playBGM('event');
  }, []);

  useEffect(() => {
    if (opened === undefined) return;
    setIsOpen(opened);
  }, [opened]);

  useEffect(() => {
    if (!typingMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPoolMode) {
        if (e.key === '1' || e.key === 'Enter') {
          e.preventDefault();
          if (!resolved) {
            const firstUnclaimed = pools.find(pool => !pool.claimedByPeerId);
            if (firstUnclaimed && onClaimPool) {
              onClaimPool(firstUnclaimed.id);
              return;
            }
          }
          onLeave();
        }
        return;
      }
      if (!displayOpen && (e.key === '1' || e.key === 'Enter')) {
        e.preventDefault();
        handleOpen();
      } else if (displayOpen && (e.key === '1' || e.key === 'Enter')) {
        e.preventDefault();
        onLeave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingMode, displayOpen, rewards, isPoolMode, pools, resolved, onClaimPool, onLeave]);

  const handleOpen = () => {
      if (!onOpen) return;
      if (displayOpen) return;
      setIsOpen(true);
      audioService.playSound('select'); // Chest open sound
      audioService.playBGM('reward'); // Switch to uplifting "reward" music
      onOpen();
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-gray-900 text-white relative items-center justify-start sm:justify-center p-4 sm:p-8">
      <div className="z-10 flex w-full max-w-5xl flex-col items-center text-center py-4 sm:py-0">

          {isPoolMode ? (
              <>
                <h2 className="text-4xl text-yellow-400 font-bold mb-6">{trans("宝を発見！", languageMode)}</h2>
                <p className="text-gray-300 mb-6">{trans("人数分の宝があります。誰でも先に取った宝を獲得できます。", languageMode)}</p>
                {hasCursedKey && (
                  <div className="mb-4 rounded-full border border-purple-500 bg-purple-950/70 px-4 py-2 text-sm text-purple-200">
                    <Key className="inline-block mr-2" size={16} />
                    {trans("あなたが宝を取ると呪いが入ります", languageMode)}
                  </div>
                )}
                {resolved && (
                  <div className="mb-4 rounded-lg border border-cyan-500/50 bg-cyan-950/30 px-4 py-3 text-sm font-bold text-cyan-100">
                    {waitingForOthers ? trans("他のプレイヤーが宝を確認するのを待っています", languageMode) : trans("宝の確認を終えました", languageMode)}
                  </div>
                )}
                <div className="mb-8 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {pools.map(pool => {
                    const claimed = !!pool.claimedByPeerId;
                    return (
                      <div key={pool.id} className={`rounded-xl border-2 p-5 ${claimed ? 'border-yellow-500 bg-black/60' : 'border-slate-600 bg-slate-900/80'}`}>
                        <div className="mb-4 flex items-center justify-center">
                          <Archive size={72} className={claimed ? 'text-yellow-400' : 'text-yellow-700 fill-yellow-900'} />
                        </div>
                        <div className="mb-4 text-sm text-slate-300">
                          {claimed
                            ? trans(`取得者: ${pool.claimedByName || 'Unknown'}`, languageMode)
                            : trans('未取得', languageMode)}
                        </div>
                        <div className="mb-4 flex flex-col gap-2 text-left">
                          {pool.rewards.map((reward, idx) => (
                            <div key={`${pool.id}-${idx}`} className="rounded border border-slate-700 bg-black/40 px-3 py-2 text-sm">
                              <div className="font-bold text-yellow-100">
                                {reward.type === 'GOLD' ? `${reward.value} G` : trans(reward.value.name, languageMode)}
                              </div>
                              <div className="text-xs text-slate-400">
                                {reward.type === 'RELIC'
                                  ? trans(reward.value.description, languageMode)
                                  : reward.type === 'GOLD'
                                    ? trans('ゴールド', languageMode)
                                    : trans('報酬', languageMode)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={!claimed && !resolved ? () => onClaimPool?.(pool.id) : undefined}
                          disabled={claimed || resolved}
                          className="w-full rounded border-2 border-yellow-300 bg-yellow-600 px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {claimed ? trans('取得済み', languageMode) : trans('この宝を取る', languageMode)}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={onLeave}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded font-bold text-xl border-2 border-white flex items-center"
                >
                  <Check className="mr-2" /> {resolved ? trans("待機", languageMode) : trans("確認完了", languageMode)}{typingMode && ' [1/Enter]'}
                </button>
              </>
          ) : !displayOpen ? (
              <>
                <h2 className="text-4xl text-yellow-400 font-bold mb-8 animate-pulse">{trans("宝箱を発見！", languageMode)}</h2>
                <div 
                    onClick={handleOpen}
                    className="cursor-pointer transition-transform hover:scale-110 mb-8 relative"
                >
                    <Archive size={128} className="text-yellow-600 fill-yellow-900" />
                    {hasCursedKey && (
                        <div className="absolute -top-4 -right-4 bg-purple-900 border border-purple-500 rounded-full p-2 animate-bounce" title="呪いの鍵: 呪いが入っています">
                            <Key size={32} className="text-purple-400" />
                        </div>
                    )}
                </div>
                <p className="text-gray-400 mb-8">{trans("中には何が入っているだろうか？", languageMode)}</p>
                <button 
                    onClick={handleOpen}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded font-bold text-xl border-2 border-yellow-300"
                >
                    {trans("開ける", languageMode)}{typingMode && ' [1/Enter]'}
                </button>
              </>
          ) : (
              <>
                <h2 className="text-4xl text-yellow-400 font-bold mb-8">{trans("獲得！", languageMode)}</h2>
                <div className="mb-12 flex flex-col gap-4 animate-in fade-in zoom-in duration-500">
                    <Archive size={128} className="text-yellow-400 mb-4 mx-auto opacity-50" />
                    
                    <div className="flex flex-wrap justify-center gap-4">
                        {rewards.map((r, idx) => (
                            <div key={idx} className="bg-black/60 border-2 border-yellow-500 p-4 rounded-lg flex items-center gap-4 min-w-[200px]">
                                {r.type === 'RELIC' && <span className="text-2xl">💎</span>}
                                {r.type === 'GOLD' && <span className="text-2xl">💰</span>}
                                {r.type === 'CARD' && <span className="text-2xl">🃏</span>} 
                                <div className="text-left">
                                    <div className="font-bold text-yellow-100">
                                        {r.type === 'GOLD' ? `${r.value} G` : trans(r.value.name, languageMode)}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {r.type === 'RELIC' ? trans(r.value.description, languageMode) : (r.type === 'CARD' ? trans('呪い', languageMode) : trans('ゴールド', languageMode))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <button 
                    onClick={onLeave}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded font-bold text-xl border-2 border-white flex items-center"
                >
                    <Check className="mr-2" /> {trans("進む", languageMode)}{typingMode && ' [1/Enter]'}
                </button>
              </>
          )}

      </div>
    </div>
  );
};

export default TreasureScreen;
