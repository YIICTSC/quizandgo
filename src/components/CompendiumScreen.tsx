
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY, ENEMY_LIBRARY } from '../constants';
import { Card as ICard, LanguageMode } from '../types';
import Card from './Card';
import { BookOpen, Lock, ArrowLeft, Swords, Gem, FlaskConical, Skull, X, Music, StepBack, StepForward, Pause, Play, Square, Repeat } from 'lucide-react';
import EnemyIllustration from './EnemyIllustration';
import PixelSprite from './PixelSprite';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { trans } from '../utils/textUtils';
import { getCardIllustrationPaths } from '../utils/cardIllustration';
import { ENEMY_ILLUSTRATION_SIZE_CLASS } from '../constants/uiSizing';

interface CompendiumScreenProps {
    unlockedCardNames: string[];
    onBack: () => void;
    languageMode: LanguageMode;
    isDebug?: boolean;
}

const shuffleList = <T,>(items: T[]) => {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
};

const CompendiumScreen: React.FC<CompendiumScreenProps> = ({ unlockedCardNames, onBack, languageMode, isDebug = false }) => {
    const [activeTab, setActiveTab] = useState<'CARDS' | 'RELICS' | 'POTIONS' | 'ENEMIES'>('CARDS');
    const [unlockedRelics, setUnlockedRelics] = useState<string[]>([]);
    const [unlockedPotions, setUnlockedPotions] = useState<string[]>([]);
    const [defeatedEnemies, setDefeatedEnemies] = useState<string[]>([]);

    const [selectedItem, setSelectedItem] = useState<{
        type: 'CARD' | 'RELIC' | 'POTION' | 'ENEMY';
        data: any;
        unlocked: boolean;
    } | null>(null);
    const [fullscreenArtCard, setFullscreenArtCard] = useState<ICard | null>(null);
    const [showBgmMode, setShowBgmMode] = useState(false);

    const longPressTimer = useRef<any>(null);
    const startPos = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent, type: 'CARD' | 'RELIC' | 'POTION' | 'ENEMY', data: any, unlocked: boolean) => {
        startPos.current = { x: e.clientX, y: e.clientY };
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        longPressTimer.current = setTimeout(() => {
            handleItemClick(type, data, unlocked);
        }, 700);
    };

    const handlePointerUp = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
        if (dist > 10) {
            handlePointerUp();
        }
    };

    useEffect(() => {
        setUnlockedRelics(storageService.getUnlockedRelics());
        setUnlockedPotions(storageService.getUnlockedPotions());
        setDefeatedEnemies(storageService.getDefeatedEnemies());
    }, []);

    const allCards = useMemo(() => {
        return Object.values(CARDS_LIBRARY).sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            if (a.cost !== b.cost) return a.cost - b.cost;
            return a.name.localeCompare(b.name);
        });
    }, []);

    const allRelics = useMemo(() => Object.values(RELIC_LIBRARY), []);
    const allPotions = useMemo(() => Object.values(POTION_LIBRARY), []);
    const allEnemies = useMemo(() => Object.values(ENEMY_LIBRARY).sort((a, b) => a.tier - b.tier), []);
    const unlockedCardsForShowcase = useMemo(() => {
        const visibleNames = isDebug ? allCards.map(card => card.name) : unlockedCardNames;
        const uniqueNames = Array.from(new Set(visibleNames));
        return uniqueNames
            .map(name => Object.values(CARDS_LIBRARY).find(card => card.name === name))
            .filter((card): card is typeof allCards[number] => Boolean(card))
            .filter(card => !card.isSeed)
            .map((card, index) => ({ ...card, id: `compendium-showcase-${index}` }));
    }, [allCards, isDebug, unlockedCardNames]);
    const defeatedEnemySet = useMemo(() => {
        if (isDebug) {
            return new Set(allEnemies.map(enemy => enemy.name));
        }
        const knownNames = new Set(allEnemies.map(enemy => enemy.name));
        return new Set(defeatedEnemies.filter(name => knownNames.has(name)));
    }, [allEnemies, defeatedEnemies, isDebug]);

    const totalCards = allCards.length;
    const currentLibraryUnlockedCount = isDebug
        ? totalCards
        : allCards.filter(c => unlockedCardNames.includes(c.name)).length;
    const percentage = Math.floor((currentLibraryUnlockedCount / totalCards) * 100);

    const totalRelics = allRelics.length;
    const unlockedRelicsCount = isDebug ? totalRelics : unlockedRelics.length;
    const relicsPercentage = Math.floor((unlockedRelicsCount / totalRelics) * 100);

    const totalPotions = allPotions.length;
    const unlockedPotionsCount = isDebug ? totalPotions : unlockedPotions.length;
    const potionsPercentage = Math.floor((unlockedPotionsCount / totalPotions) * 100);

    const totalEnemies = allEnemies.length;
    const defeatedEnemiesCount = defeatedEnemySet.size;
    const enemiesPercentage = Math.floor((defeatedEnemiesCount / totalEnemies) * 100);

    const handleItemClick = (type: 'CARD' | 'RELIC' | 'POTION' | 'ENEMY', data: any, unlocked: boolean) => {
        setSelectedItem({ type, data, unlocked });
    };

    const openBgmMode = () => {
        if (unlockedCardsForShowcase.length === 0) {
            audioService.playSound('wrong');
            return;
        }
        audioService.playSound('select');
        setShowBgmMode(true);
        audioService.playBGM('random', false);
    };

    const closeBgmMode = () => {
        setShowBgmMode(false);
        audioService.playBGM('menu');
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">

            {/* Header */}
            <div className="z-10 bg-black/80 border-b-4 border-amber-600 p-4 flex flex-col md:flex-row justify-between items-center shadow-xl gap-4 shrink-0">
                <div className="flex items-center">
                    <BookOpen size={32} className="text-amber-500 mr-3" />
                    <div>
                        <h2 className="text-2xl font-bold text-amber-100">{trans("図鑑", languageMode)}</h2>
                        {activeTab === 'CARDS' && <p className="text-xs text-gray-400">{trans("収集率", languageMode)}: {currentLibraryUnlockedCount}/{totalCards} ({percentage}%) {isDebug && "(DEBUG ON)"}</p>}
                        {activeTab === 'RELICS' && <p className="text-xs text-gray-400">{trans("収集率", languageMode)}: {unlockedRelicsCount}/{totalRelics} ({relicsPercentage}%) {isDebug && "(DEBUG ON)"}</p>}
                        {activeTab === 'POTIONS' && <p className="text-xs text-gray-400">{trans("収集率", languageMode)}: {unlockedPotionsCount}/{totalPotions} ({potionsPercentage}%) {isDebug && "(DEBUG ON)"}</p>}
                        {activeTab === 'ENEMIES' && <p className="text-xs text-gray-400">{trans("収集率", languageMode)}: {defeatedEnemiesCount}/{totalEnemies} ({enemiesPercentage}%) {isDebug && "(DEBUG ON)"}</p>}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('CARDS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab === 'CARDS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        <Swords size={14} className="mr-1" /> {trans("カード", languageMode)}
                    </button>
                    <button onClick={() => setActiveTab('RELICS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab === 'RELICS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        <Gem size={14} className="mr-1" /> {trans("レリック", languageMode)}
                    </button>
                    <button onClick={() => setActiveTab('POTIONS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab === 'POTIONS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        <FlaskConical size={14} className="mr-1" /> {trans("薬", languageMode)}
                    </button>
                    <button onClick={() => setActiveTab('ENEMIES')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab === 'ENEMIES' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        <Skull size={14} className="mr-1" /> {trans("魔物", languageMode)}
                    </button>
                    <button
                        onClick={openBgmMode}
                        disabled={unlockedCardsForShowcase.length === 0}
                        className={`px-3 py-1 rounded text-sm font-bold flex items-center ${unlockedCardsForShowcase.length === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-cyan-700 text-white hover:bg-cyan-600'}`}
                    >
                        <Music size={14} className="mr-1" /> BGMモード
                    </button>
                </div>

                <button
                    onClick={onBack}
                    className="flex items-center bg-gray-700 hover:bg-gray-600 border border-gray-400 px-4 py-2 rounded text-white transition-colors"
                >
                    <ArrowLeft size={16} className="mr-2" /> {trans("戻る", languageMode)}
                </button>
            </div>

            {/* Content Area */}
            <div className="z-10 flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar texture-leather bg-amber-900/20">

                {activeTab === 'CARDS' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 justify-items-center">
                        {allCards.map((template, idx) => {
                            const isUnlocked = isDebug || unlockedCardNames.includes(template.name);
                            const cardInstance: ICard = { id: `compendium-${idx}`, ...template };

                            return (
                                <div key={idx} className="relative group cursor-pointer" onClick={() => handleItemClick('CARD', cardInstance, isUnlocked)}>
                                    {isUnlocked ? (
                                        <div className="transform hover:scale-105 transition-transform duration-200 scale-75 origin-top-left w-24 h-36">
                                            <Card card={cardInstance} onClick={() => handleItemClick('CARD', cardInstance, isUnlocked)} disabled={false} languageMode={languageMode} />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-36 border-[3px] border-gray-700 bg-gray-800 rounded-lg flex flex-col items-center justify-center p-2 opacity-50 select-none grayscale">
                                            <Lock size={24} className="text-gray-500 mb-2" />
                                            <div className="text-xl text-gray-600 font-bold">?</div>
                                            <div className="text-[8px] text-gray-500 mt-2 text-center">{template.rarity}</div>
                                            <div className="text-[6px] text-gray-600 text-center">{template.type}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'RELICS' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {allRelics.map((relic, idx) => {
                            const isUnlocked = isDebug || unlockedRelics.includes(relic.id);
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleItemClick('RELIC', relic, isUnlocked)}
                                    onPointerDown={(e) => handlePointerDown(e, 'RELIC', relic, isUnlocked)}
                                    onPointerUp={handlePointerUp}
                                    onPointerMove={handlePointerMove}
                                    className={`bg-black/60 border ${isUnlocked ? 'border-gray-600 hover:border-yellow-500' : 'border-gray-800'} p-4 rounded flex flex-col items-center text-center cursor-pointer transition-colors aspect-square justify-center`}
                                >
                                    <div className={`w-12 h-12 bg-gray-800 rounded-full border border-yellow-600 flex items-center justify-center mb-2 ${!isUnlocked ? 'grayscale opacity-30' : ''}`}>
                                        <Gem size={24} className="text-yellow-400" />
                                    </div>
                                    <div className={`font-bold text-xs mb-1 truncate w-full ${isUnlocked ? 'text-yellow-200' : 'text-gray-600'}`}>{isUnlocked ? trans(relic.name, languageMode) : '???'}</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'POTIONS' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {allPotions.map((potion, idx) => {
                            const isUnlocked = isDebug || unlockedPotions.includes(potion.templateId);
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleItemClick('POTION', potion, isUnlocked)}
                                    onPointerDown={(e) => handlePointerDown(e, 'POTION', potion, isUnlocked)}
                                    onPointerUp={handlePointerUp}
                                    onPointerMove={handlePointerMove}
                                    className={`bg-black/60 border ${isUnlocked ? 'border-gray-600 hover:border-white' : 'border-gray-800'} p-4 rounded flex flex-col items-center text-center cursor-pointer transition-colors aspect-square justify-center`}
                                >
                                    <div className={`w-12 h-12 bg-gray-800 rounded flex items-center justify-center mb-2 border border-white/30 ${!isUnlocked ? 'grayscale opacity-30' : ''}`}>
                                        <FlaskConical size={24} style={{ color: potion.color }} />
                                    </div>
                                    <div className={`font-bold text-xs mb-1 truncate w-full ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>{isUnlocked ? trans(potion.name, languageMode) : '???'}</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'ENEMIES' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {allEnemies.map((enemy, idx) => {
                            const isUnlocked = defeatedEnemySet.has(enemy.name);
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleItemClick('ENEMY', enemy, isUnlocked)}
                                    onPointerDown={(e) => handlePointerDown(e, 'ENEMY', enemy, isUnlocked)}
                                    onPointerUp={handlePointerUp}
                                    onPointerMove={handlePointerMove}
                                    className={`bg-black/60 border ${isUnlocked ? 'border-red-900 hover:border-red-500' : 'border-gray-800'} p-2 rounded flex flex-col items-center text-center cursor-pointer transition-colors aspect-square justify-center relative overflow-hidden`}
                                >
                                    <div className={`${ENEMY_ILLUSTRATION_SIZE_CLASS.compendiumGrid} mb-2 bg-gray-900 rounded relative ${!isUnlocked ? 'brightness-0 opacity-20' : ''}`}>
                                        <EnemyIllustration name={enemy.name} seed={enemy.name} className="w-full h-full" size={16} />
                                    </div>
                                    <div className={`font-bold text-[10px] truncate w-full ${isUnlocked ? 'text-red-200' : 'text-gray-600'}`}>{isUnlocked ? trans(enemy.name, languageMode) : '???'}</div>
                                    {!isUnlocked && <Lock size={16} className="absolute top-2 right-2 text-gray-600" />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                    <div className="bg-gray-800 border-4 border-amber-600 w-full max-w-md p-6 rounded-lg shadow-2xl relative animate-in zoom-in duration-200 flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedItem(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white p-2">
                            <X size={24} />
                        </button>

                        <h3 className={`text-2xl font-bold mb-4 ${selectedItem.unlocked ? 'text-amber-200' : 'text-gray-500'}`}>
                            {selectedItem.unlocked ? trans(selectedItem.data.name, languageMode) : trans('未発見', languageMode)}
                        </h3>

                        <div
                            className={`flex items-center justify-center ${
                                selectedItem.type === 'CARD'
                                    ? 'mb-8 min-h-[260px] md:min-h-[360px]'
                                    : 'mb-6 min-h-[100px]'
                            }`}
                        >
                            {selectedItem.type === 'CARD' && (
                                selectedItem.unlocked ? (
                                    <div
                                        className="scale-125 md:scale-[1.7] cursor-zoom-in"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFullscreenArtCard(selectedItem.data as ICard);
                                        }}
                                        title={trans("タッチでイラスト拡大", languageMode)}
                                    >
                                        <Card card={selectedItem.data} onClick={() => { }} disabled={false} languageMode={languageMode} />
                                    </div>
                                ) : <Lock size={64} className="text-gray-600" />
                            )}
                            {selectedItem.type === 'RELIC' && (
                                selectedItem.unlocked ? <Gem size={80} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" /> : <Gem size={80} className="text-gray-700" />
                            )}
                            {selectedItem.type === 'POTION' && (
                                selectedItem.unlocked ? <FlaskConical size={80} style={{ color: selectedItem.data.color }} className="drop-shadow-[0_0_10px_currentColor]" /> : <FlaskConical size={80} className="text-gray-700" />
                            )}
                            {selectedItem.type === 'ENEMY' && (
                                <div className={`${ENEMY_ILLUSTRATION_SIZE_CLASS.compendiumDetail} bg-black rounded border border-gray-600 relative`}>
                                    {selectedItem.unlocked ?
                                        <EnemyIllustration name={selectedItem.data.name} seed={selectedItem.data.name} className="w-full h-full" size={16} />
                                        : <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl">?</div>
                                    }
                                </div>
                            )}
                        </div>

                        <div className="bg-black/40 p-4 rounded border border-gray-600 w-full text-left">
                            {selectedItem.unlocked ? (
                                <>
                                    <p className="text-gray-300 text-sm leading-relaxed mb-2">{trans(selectedItem.data.description, languageMode)}</p>
                                    {selectedItem.type === 'ENEMY' && <p className="text-red-400 text-xs mt-2 font-mono">{trans("危険度", languageMode)}: Tier {selectedItem.data.tier}</p>}
                                    {selectedItem.type === 'RELIC' && <p className="text-yellow-600 text-xs mt-2 font-mono">{trans("レアリティ", languageMode)}: {selectedItem.data.rarity}</p>}
                                </>
                            ) : (
                                <p className="text-gray-500 text-sm italic">{trans("このアイテムはまだ発見されていません。", languageMode)}<br />{trans("冒険を進めて解禁しましょう。", languageMode)}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {fullscreenArtCard && (
                <FullscreenCardArtModal
                    card={fullscreenArtCard}
                    languageMode={languageMode}
                    onClose={() => setFullscreenArtCard(null)}
                />
            )}
            {showBgmMode && (
                <CompendiumBgmModeModal
                    cards={unlockedCardsForShowcase}
                    languageMode={languageMode}
                    onClose={closeBgmMode}
                />
            )}
        </div>
    );
};

const FullscreenCardArtModal: React.FC<{ card: ICard; languageMode: LanguageMode; onClose: () => void }> = ({ card, languageMode, onClose }) => {
    const translated = trans(card.name, languageMode);
    const imageCandidates = useMemo(
        () => getCardIllustrationPaths(card.id, translated, [card.name]),
        [card.id, card.name, translated]
    );
    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
        setImageIndex(0);
    }, [card.id, card.name, translated]);

    return (
        <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-3 right-3 text-white/80 hover:text-white p-2"
            >
                <X size={28} />
            </button>

            <div className="w-full h-full max-w-[96vw] max-h-[96vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {imageIndex < imageCandidates.length ? (
                    <img
                        src={imageCandidates[imageIndex]}
                        alt={translated}
                        className="max-w-full max-h-full object-contain rounded"
                        onError={() => setImageIndex((prev) => prev + 1)}
                    />
                ) : card.textureRef ? (
                    <div className="w-[70vmin] h-[70vmin] max-w-[90vw] max-h-[90vh]">
                        <PixelSprite seed={card.id} name={card.textureRef} className="w-full h-full" size={32} />
                    </div>
                ) : (
                    <div className="text-gray-400">{trans("イラストがありません", languageMode)}</div>
                )}
            </div>
        </div>
    );
};

const CompendiumBgmModeModal: React.FC<{ cards: ICard[]; languageMode: LanguageMode; onClose: () => void }> = ({ cards, languageMode, onClose }) => {
    const defaultTracks = useMemo(() => [...audioService.getBgmTrackList()], []);
    const transitionVariants = useMemo(() => ([
        'animate-in fade-in duration-700',
        'animate-in fade-in zoom-in-95 duration-700',
        'animate-in slide-in-from-right-12 fade-in duration-700',
        'animate-in slide-in-from-left-12 fade-in duration-700',
        'animate-in slide-in-from-bottom-12 fade-in duration-700',
        'animate-in slide-in-from-top-12 fade-in duration-700',
    ]), []);
    const [playOrder, setPlayOrder] = useState<'sorted' | 'random'>(() => audioService.getBgmAdvanceMode());
    const [randomTrackOrder, setRandomTrackOrder] = useState<string[]>(() => shuffleList(defaultTracks));
    const bgmTracks = useMemo(() => {
        if (playOrder === 'sorted') {
            return [...defaultTracks].sort((a, b) => a.localeCompare(b));
        }
        return randomTrackOrder;
    }, [defaultTracks, playOrder, randomTrackOrder]);
    const [cardIndex, setCardIndex] = useState(() => Math.floor(Math.random() * cards.length));
    const [trackIndex, setTrackIndex] = useState(() => {
        const current = audioService.getCurrentBgmType();
        const found = current ? bgmTracks.findIndex(track => track === current) : -1;
        return found >= 0 ? found : 0;
    });
    const [isPlaying, setIsPlaying] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);
    const [transitionClass, setTransitionClass] = useState(transitionVariants[0]);
    const [transitionKey, setTransitionKey] = useState(0);
    const activeCard = cards[cardIndex] || cards[0];
    const activeTrack = bgmTracks[trackIndex] || bgmTracks[0];
    const translated = trans(activeCard.name, languageMode);
    const imageCandidates = useMemo(
        () => getCardIllustrationPaths(activeCard.id, translated, [activeCard.name]),
        [activeCard.id, activeCard.name, translated]
    );
    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
        setImageIndex(0);
        setTransitionClass(transitionVariants[Math.floor(Math.random() * transitionVariants.length)]);
        setTransitionKey(prev => prev + 1);
    }, [activeCard.id, transitionVariants]);

    useEffect(() => {
        audioService.setBgmAdvanceMode(playOrder, bgmTracks);
        audioService.playBGM(activeTrack as any, isRepeat);
        setIsPlaying(true);
        setIsPaused(false);
    }, []);

    useEffect(() => {
        if (cards.length <= 1 || !isPlaying) return;
        const interval = window.setInterval(() => {
            setCardIndex(prev => {
                if (cards.length <= 1) return prev;
                let next = prev;
                while (next === prev) {
                    next = Math.floor(Math.random() * cards.length);
                }
                return next;
            });
        }, 7000);
        return () => window.clearInterval(interval);
    }, [cards, isPlaying]);

    useEffect(() => {
        audioService.setBgmAdvanceMode(playOrder, bgmTracks);
        if (!isPlaying) {
            audioService.stopBGM();
            return;
        }
        audioService.playBGM(activeTrack as any, isRepeat);
        setIsPaused(false);
    }, [activeTrack, bgmTracks, isPlaying, isRepeat, playOrder]);

    useEffect(() => {
        const syncTrackLabel = () => {
            const current = audioService.getCurrentBgmType();
            if (!current) return;
            const currentIndex = bgmTracks.findIndex(track => track === current);
            if (currentIndex >= 0) {
                setTrackIndex(prev => (prev === currentIndex ? prev : currentIndex));
            }
        };

        syncTrackLabel();
        const interval = window.setInterval(syncTrackLabel, 300);
        return () => window.clearInterval(interval);
    }, [bgmTracks]);

    useEffect(() => {
        const current = audioService.getCurrentBgmType();
        if (!current) return;
        const currentIndex = bgmTracks.findIndex(track => track === current);
        if (currentIndex >= 0) {
            setTrackIndex(currentIndex);
        }
    }, [bgmTracks]);

    const handleClose = () => {
        audioService.setBgmAdvanceMode('random');
        audioService.playBGM('menu');
        onClose();
    };

    const handlePrevTrack = () => {
        setTrackIndex(prev => (prev - 1 + bgmTracks.length) % bgmTracks.length);
        setIsPlaying(true);
    };

    const handleNextTrack = () => {
        setTrackIndex(prev => (prev + 1) % bgmTracks.length);
        setIsPlaying(true);
    };

    const handlePlayPause = () => {
        if (!isPlaying) {
            setIsPlaying(true);
            audioService.playBGM(activeTrack as any, isRepeat);
            setIsPaused(false);
            return;
        }
        if (isPaused) {
            audioService.resumeBGM();
            setIsPaused(false);
        } else {
            audioService.pauseBGM();
            setIsPaused(true);
        }
    };

    const handleStop = () => {
        audioService.stopBGM();
        setIsPlaying(false);
        setIsPaused(false);
    };

    const handleToggleRepeat = () => {
        const next = !isRepeat;
        setIsRepeat(next);
        if (isPlaying) {
            audioService.playBGM(activeTrack as any, next);
        }
    };

    const handleTogglePlayOrder = () => {
        const currentTrack = audioService.getCurrentBgmType() || activeTrack;
        setPlayOrder(prev => {
            const nextMode = prev === 'sorted' ? 'random' : 'sorted';
            if (nextMode === 'random') {
                const shuffled = shuffleList(defaultTracks.filter(track => track !== currentTrack));
                setRandomTrackOrder([currentTrack, ...shuffled]);
            }
            return nextMode;
        });
    };

    const handleNextCard = () => {
        if (cards.length <= 1) return;
        setCardIndex(prev => (prev + 1) % cards.length);
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black flex flex-col">
            <div className="absolute inset-0 overflow-hidden">
                <div key={transitionKey} className={`${transitionClass} flex h-full w-full items-center justify-center`}>
                    {imageIndex < imageCandidates.length ? (
                        <img
                            src={imageCandidates[imageIndex]}
                            alt={translated}
                            className="h-full w-full object-contain"
                            onError={() => setImageIndex(prev => prev + 1)}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_rgba(2,6,23,0.95)_60%)]">
                            <div className="h-[70vmin] w-[70vmin] max-h-[86vh] max-w-[86vw] opacity-90">
                                <PixelSprite seed={activeCard.id} name={activeCard.textureRef || 'SWORD'} className="w-full h-full" size={32} />
                            </div>
                        </div>
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/85" />
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                }}
                className="absolute right-3 top-3 z-20 rounded-full border border-white/15 bg-black/70 p-2.5 text-white/90 hover:text-white sm:right-4 sm:top-4 sm:p-3"
            >
                <X size={22} className="sm:w-[26px] sm:h-[26px]" />
            </button>

            <div className="relative z-10 flex flex-1 flex-col justify-between p-3 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-black tracking-[0.24em] text-cyan-200 sm:px-4 sm:text-xs sm:tracking-[0.3em]">
                            BGM MODE
                        </div>
                        <div className="rounded-full border border-white/15 bg-slate-950/30 px-3 py-1.5 text-[11px] font-bold text-white/85 backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm">
                            {'\u266B'} {activeTrack}
                        </div>
                        <button
                            onClick={handleTogglePlayOrder}
                            className="rounded-full border border-white/15 bg-slate-950/30 px-3 py-1.5 text-[11px] font-bold text-white/85 backdrop-blur-sm hover:bg-white/10 sm:px-4 sm:py-2 sm:text-sm"
                        >
                            {playOrder === 'sorted' ? '曲順: 名前順' : '曲順: シャッフル'}
                        </button>
                    </div>
                </div>

                <div className="flex-1" />

                <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-[22px] border border-white/15 bg-slate-950/30 p-3 backdrop-blur-md sm:gap-4 sm:rounded-[28px] sm:p-6">
                    <div className="flex flex-col gap-1.5 text-center sm:gap-2 sm:text-left">
                        <div className="text-lg font-black leading-tight text-white sm:text-3xl">{translated}</div>
                        <div className="line-clamp-2 text-xs leading-relaxed text-slate-300 sm:line-clamp-none sm:text-sm">
                            {trans(activeCard.description, languageMode)}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                        <div className="text-[11px] text-slate-300 sm:text-sm">
                            {cardIndex + 1} / {cards.length} ・ スライドショー
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                            <button onClick={handlePrevTrack} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:p-3">
                                <StepBack size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                            <button onClick={handlePlayPause} className="rounded-full bg-cyan-500/80 p-2 text-white hover:bg-cyan-400 sm:p-3">
                                {isPlaying && !isPaused ? <Pause size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Play size={16} className="sm:w-[18px] sm:h-[18px]" />}
                            </button>
                            <button onClick={handleStop} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:p-3">
                                <Square size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                            <button onClick={handleNextTrack} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:p-3">
                                <StepForward size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                            <button
                                onClick={handleToggleRepeat}
                                className={`rounded-full p-2 text-white sm:p-3 ${isRepeat ? 'bg-amber-500/80 hover:bg-amber-400' : 'bg-white/10 hover:bg-white/20'}`}
                            >
                                <Repeat size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                            <button onClick={handleNextCard} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:p-3" title="次のカード">
                                <ArrowLeft className="rotate-180 sm:w-[18px] sm:h-[18px]" size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompendiumScreen;
