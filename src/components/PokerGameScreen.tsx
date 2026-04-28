
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft, X, Club, Diamond, Heart, Spade, ShoppingBag, BarChart3, ArrowDownWideNarrow, ArrowUpNarrowWide, LayoutList, Layers, HelpCircle, BookOpen, Flag, Calculator, ArrowRight, Sparkles, Package, Ghost, Trophy, RotateCcw, Play, DollarSign, Info, Coins, Check, AlertTriangle } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';
import { 
    PokerCard, PokerRunState, PokerBlind, PokerSupporter, PokerConsumable, PokerSuit, PokerRank, PokerScoringContext, PokerPack, PokerVoucher, GameMode
} from '../types';
import { POKER_HAND_LEVELS, SUPPORTERS_LIBRARY, CONSUMABLES_LIBRARY, PACK_LIBRARY, POKER_ENHANCEMENTS, VOUCHERS_LIBRARY, EXPANDED_SUPPORTER_IDS } from '../constants';
import { storageService } from '../services/storageService';
import MathChallengeScreen from './MathChallengeScreen';

// --- Constants & Helpers ---
const SUITS: PokerSuit[] = ['SPADE', 'HEART', 'DIAMOND', 'CLUB'];
const RANKS: PokerRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// --- HAND EXAMPLES FOR RULES ---
const HAND_EXAMPLES: Record<string, { desc: string, cards: {r: string, s: PokerSuit}[] }> = {
    'HIGH_CARD': {
        desc: '役が何もない状態。一番強いカードで勝負。',
        cards: [{r:'A',s:'SPADE'}, {r:'10',s:'HEART'}, {r:'7',s:'CLUB'}, {r:'4',s:'DIAMOND'}, {r:'2',s:'SPADE'}]
    },
    'PAIR': {
        desc: '同じ数字のカードが2枚ある状態。',
        cards: [{r:'8',s:'SPADE'}, {r:'8',s:'HEART'}, {r:'K',s:'CLUB'}, {r:'9',s:'DIAMOND'}, {r:'3',s:'SPADE'}]
    },
    'TWO_PAIR': {
        desc: 'ワンペアが2組ある状態。',
        cards: [{r:'J',s:'SPADE'}, {r:'J',s:'HEART'}, {r:'5',s:'CLUB'}, {r:'5',s:'DIAMOND'}, {r:'A',s:'SPADE'}]
    },
    'THREE_OF_A_KIND': {
        desc: '同じ数字のカードが3枚ある状態。',
        cards: [{r:'7',s:'SPADE'}, {r:'7',s:'HEART'}, {r:'7',s:'CLUB'}, {r:'K',s:'DIAMOND'}, {r:'2',s:'SPADE'}]
    },
    'STRAIGHT': {
        desc: 'マークに関係なく、数字が5枚連続している状態。(Aは2ともKとも繋がります)',
        cards: [{r:'5',s:'SPADE'}, {r:'6',s:'HEART'}, {r:'7',s:'CLUB'}, {r:'8',s:'DIAMOND'}, {r:'9',s:'SPADE'}]
    },
    'FLUSH': {
        desc: '数字に関係なく、同じマークが5枚揃った状態。',
        cards: [{r:'2',s:'HEART'}, {r:'5',s:'HEART'}, {r:'9',s:'HEART'}, {r:'J',s:'HEART'}, {r:'A',s:'HEART'}]
    },
    'FULL_HOUSE': {
        desc: 'スリーカードとワンペアの組み合わせ。',
        cards: [{r:'Q',s:'SPADE'}, {r:'Q',s:'HEART'}, {r:'Q',s:'CLUB'}, {r:'9',s:'DIAMOND'}, {r:'9',s:'SPADE'}]
    },
    'FLUSH_HOUSE': {
        desc: 'フルハウスで、かつ全て同じマークの状態。',
        cards: [{r:'Q',s:'HEART'}, {r:'Q',s:'HEART'}, {r:'Q',s:'HEART'}, {r:'9',s:'HEART'}, {r:'9',s:'HEART'}]
    },
    'FOUR_OF_A_KIND': {
        desc: '同じ数字のカードが4枚ある状態。',
        cards: [{r:'3',s:'SPADE'}, {r:'3',s:'HEART'}, {r:'3',s:'CLUB'}, {r:'3',s:'DIAMOND'}, {r:'K',s:'SPADE'}]
    },
    'STRAIGHT_FLUSH': {
        desc: '同じマークで、かつ数字が連続している状態。',
        cards: [{r:'8',s:'CLUB'}, {r:'9',s:'CLUB'}, {r:'10',s:'CLUB'}, {r:'J',s:'CLUB'}, {r:'Q',s:'CLUB'}]
    },
    'ROYAL_FLUSH': {
        desc: '同じマークの 10, J, Q, K, A の組み合わせ。最強。',
        cards: [{r:'10',s:'SPADE'}, {r:'J',s:'SPADE'}, {r:'Q',s:'SPADE'}, {r:'K',s:'SPADE'}, {r:'A',s:'SPADE'}]
    },
    'FIVE_OF_A_KIND': {
        desc: '同じ数字のカードが5枚ある状態。デッキ操作が必要。',
        cards: [{r:'A',s:'SPADE'}, {r:'A',s:'HEART'}, {r:'A',s:'CLUB'}, {r:'A',s:'DIAMOND'}, {r:'A',s:'HEART'}]
    },
    'FLUSH_FIVE': {
        desc: '同じマークで、かつ同じ数字のカードが5枚ある状態。伝説の役。',
        cards: [{r:'A',s:'SPADE'}, {r:'A',s:'SPADE'}, {r:'A',s:'SPADE'}, {r:'A',s:'SPADE'}, {r:'A',s:'SPADE'}]
    }
};

const getBlindConfig = (ante: number, index: number): PokerBlind => {
    // Scaling Logic
    let goal: number;
    if (ante <= 8) {
        // Standard Scaling: 300 * 1.6^(ante-1)
        const base = 300 * Math.pow(1.6, ante - 1);
        goal = base;
    } else {
        // Endless Scaling: Very steep exponential
        const baseEndless = 300 * Math.pow(1.6, 7); // Ante 8 base
        goal = baseEndless * Math.pow(2.5, ante - 8);
    }

    let name = "Pop Quiz";
    let reward = 3 + ante;
    
    if (index === 0) {
        name = "Pop Quiz (小テスト)";
        goal = Math.floor(goal * 1.0);
    } else if (index === 1) {
        name = "Midterm (中間テスト)";
        goal = Math.floor(goal * 1.5);
        reward += 1;
    } else {
        name = "Final Exam (期末テスト)";
        goal = Math.floor(goal * 2.5); // Boss is hard
        reward += 2;
    }

    let bossAbility = undefined;
    let desc = undefined;
    if (index === 2) {
        const abilities = [
            { id: 'THE_WALL', name: 'PTA会長', desc: 'スコア目標が超高い' },
            { id: 'THE_NEEDLE', name: '一発勝負', desc: '手札を1回しか出せない' },
            { id: 'THE_HOOK', name: '没収', desc: '手札を出すたびランダムに2枚捨てられる' },
            { id: 'THE_EYE', name: '厳しい監視', desc: '同じ役を繰り返せない' },
            { id: 'THE_MANACLE', name: '校則違反', desc: '手札枚数制限 -1' }
        ];
        // Cycle boss abilities
        const ability = abilities[(ante - 1) % abilities.length];
        bossAbility = ability.id;
        name = `${ability.name} (期末テスト)`;
        desc = ability.desc;
        if (ability.id === 'THE_WALL') goal *= 2;
    }

    // Round nicely
    if (goal > 10000) {
        goal = Math.floor(goal / 100) * 100;
    } else if (goal > 1000) {
        goal = Math.floor(goal / 10) * 10;
    }

    return { name, scoreGoal: Math.floor(goal), rewardMoney: reward, bossAbility, description: desc };
};

const createDeck = (): PokerCard[] => {
    const deck: PokerCard[] = [];
    SUITS.forEach(suit => {
        RANKS.forEach(rank => {
            deck.push({
                id: `${suit}-${rank}-${Math.random()}`,
                suit,
                rank,
                isSelected: false,
                bonusChips: 0,
                multMultiplier: 1
            });
        });
    });
    return deck.sort(() => Math.random() - 0.5);
};

const generateRandomPlayingCard = (enhancementChance: number = 0.1): PokerCard => {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    const card: PokerCard = {
        id: `pack-${suit}-${rank}-${Date.now()}-${Math.random()}`,
        suit,
        rank,
        isSelected: false,
        bonusChips: 0,
        multMultiplier: 1
    };
    if (Math.random() < enhancementChance) {
        const r = Math.random();
        if (r < 0.2) { card.enhancement = 'BONUS'; card.bonusChips += 30; }
        else if (r < 0.4) { card.enhancement = 'MULT'; card.multMultiplier += 0.5; }
        else if (r < 0.6) { card.enhancement = 'GOLD'; } 
        else if (r < 0.8) { card.enhancement = 'STEEL'; }
        else if (r < 0.9) { card.enhancement = 'GLASS'; card.multMultiplier *= 2; }
        else { card.enhancement = 'WILD'; }
    }
    return card;
};

// --- CORE LOGIC: HAND EVALUATION ---
const getHandResult = (cards: PokerCard[], supporters: PokerSupporter[] = []): { type: string, cards: PokerCard[] } => {
    if (cards.length === 0) return { type: 'HIGH_CARD', cards: [] };
    
    // Check for rule-bending supporters
    const hasFourFingers = supporters.some(s => s.id === 'SUP_CLOVER'); 
    const hasShortcut = supporters.some(s => s.id === 'SUP_SHORTCUT'); 

    const reqCount = hasFourFingers ? 4 : 5;

    const sorted = [...cards].sort((a, b) => a.rank - b.rank);
    const ranks = sorted.map(c => c.rank);
    
    // Flush Check
    let isFlush = false;
    if (cards.length >= reqCount) {
        for (const suit of SUITS) {
            const suitCount = cards.filter(c => c.suit === suit || c.enhancement === 'WILD').length;
            if (suitCount >= reqCount) {
                isFlush = true;
                break;
            }
        }
    }

    // Straight Check
    let isStraight = false;
    if (cards.length >= reqCount) {
        const uniqueRanks = Array.from(new Set(ranks)).sort((a,b)=>a-b);
        
        for (let i = 0; i <= uniqueRanks.length - reqCount; i++) {
            const window = uniqueRanks.slice(i, i + reqCount);
            let valid = true;
            for (let j = 0; j < window.length - 1; j++) {
                const diff = window[j+1] - window[j];
                if (hasShortcut) {
                    if (diff !== 1 && diff !== 2) { valid = false; break; }
                } else {
                    if (diff !== 1) { valid = false; break; }
                }
            }
            if (valid) { isStraight = true; break; }
        }

        // Ace Low Check (A, 2, 3, 4...)
        if (!isStraight && uniqueRanks.includes(14)) {
            const lowAceRanks = [1, ...uniqueRanks.filter(r => r !== 14)].sort((a,b)=>a-b);
            for (let i = 0; i <= lowAceRanks.length - reqCount; i++) {
                const window = lowAceRanks.slice(i, i + reqCount);
                let valid = true;
                for (let j = 0; j < window.length - 1; j++) {
                    const diff = window[j+1] - window[j];
                    if (hasShortcut) {
                        if (diff !== 1 && diff !== 2) { valid = false; break; }
                    } else {
                        if (diff !== 1) { valid = false; break; }
                    }
                }
                if (valid) { isStraight = true; break; }
            }
        }
    }

    const counts: Record<number, number> = {};
    ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
    const countsValues = Object.values(counts).sort((a, b) => b - a);

    if (isFlush && countsValues[0] >= 5) {
        return { type: 'FLUSH_FIVE', cards: sorted };
    }

    if (countsValues[0] >= 5) {
        const rank = Object.keys(counts).find(key => counts[Number(key)] >= 5);
        return { type: 'FIVE_OF_A_KIND', cards: sorted.filter(c => c.rank === Number(rank)) };
    }

    if (isFlush && isStraight) {
        if (ranks.includes(14) && ranks.includes(13) && ranks.includes(12)) return { type: 'ROYAL_FLUSH', cards: sorted };
        return { type: 'STRAIGHT_FLUSH', cards: sorted };
    }
    
    if (countsValues[0] === 4) {
        const rank = Object.keys(counts).find(key => counts[Number(key)] === 4);
        return { type: 'FOUR_OF_A_KIND', cards: sorted.filter(c => c.rank === Number(rank)) };
    }
    
    if (countsValues[0] === 3 && countsValues[1] >= 2) {
        if (isFlush) return { type: 'FLUSH_HOUSE', cards: sorted };
        return { type: 'FULL_HOUSE', cards: sorted };
    }
    
    if (isFlush) return { type: 'FLUSH', cards: sorted };
    
    if (isStraight) return { type: 'STRAIGHT', cards: sorted };
    
    if (countsValues[0] === 3) {
        const rank = Object.keys(counts).find(key => counts[Number(key)] === 3);
        return { type: 'THREE_OF_A_KIND', cards: sorted.filter(c => c.rank === Number(rank)) };
    }
    
    if (countsValues[0] === 2 && countsValues[1] === 2) {
        const pairRanks = Object.keys(counts).filter(key => counts[Number(key)] === 2).map(Number);
        return { type: 'TWO_PAIR', cards: sorted.filter(c => pairRanks.includes(c.rank)) };
    }
    
    if (countsValues[0] === 2) {
        const rank = Object.keys(counts).find(key => counts[Number(key)] === 2);
        return { type: 'PAIR', cards: sorted.filter(c => c.rank === Number(rank)) };
    }
    
    return { type: 'HIGH_CARD', cards: [sorted[sorted.length - 1]] }; 
};

const getRankDisplay = (rank: PokerRank) => {
    if (rank === 14) return 'A';
    if (rank === 13) return 'K';
    if (rank === 12) return 'Q';
    if (rank === 11) return 'J';
    return rank.toString();
};

const getSuitIcon = (suit: PokerSuit, isWild?: boolean) => {
    if (isWild) return <Sparkles className="text-purple-400 fill-current animate-pulse" />;
    switch(suit) {
        case 'SPADE': return <Spade className="text-blue-400 fill-current" />;
        case 'HEART': return <Heart className="text-red-500 fill-current" />;
        case 'DIAMOND': return <Diamond className="text-yellow-400 fill-current" />;
        case 'CLUB': return <Club className="text-green-500 fill-current" />;
    }
};

const getSuitColorClass = (suit: PokerSuit) => {
    switch(suit) {
        case 'SPADE': return 'text-blue-900';
        case 'HEART': return 'text-red-600';
        case 'DIAMOND': return 'text-orange-500';
        case 'CLUB': return 'text-green-800';
    }
}

const PLANET_TARGETS: Record<string, { hand: string; levels?: number }> = {
    TXT_MATH: { hand: 'HIGH_CARD' },
    TXT_JPN: { hand: 'PAIR' },
    TXT_SCI: { hand: 'TWO_PAIR' },
    TXT_SOC: { hand: 'THREE_OF_A_KIND' },
    TXT_ENG: { hand: 'STRAIGHT' },
    TXT_ART: { hand: 'FLUSH' },
    TXT_PE: { hand: 'FULL_HOUSE' },
    TXT_MUS: { hand: 'FOUR_OF_A_KIND' },
    TXT_GEO: { hand: 'STRAIGHT_FLUSH' },
    TXT_AST: { hand: 'FIVE_OF_A_KIND' },
    TXT_MYTH: { hand: 'FLUSH_FIVE' },
    TXT_HIS: { hand: 'ROYAL_FLUSH' },
    TXT_PAIR_PLUS: { hand: 'PAIR', levels: 2 },
    TXT_STRAIGHT_PLUS: { hand: 'STRAIGHT', levels: 2 },
    TXT_FLUSH_PLUS: { hand: 'FLUSH', levels: 2 },
    TXT_FULLHOUSE_PLUS: { hand: 'FULL_HOUSE', levels: 2 },
    TXT_ROYAL_PLUS: { hand: 'ROYAL_FLUSH', levels: 2 }
};

interface PokerGameScreenProps {
  onBack: () => void;
}

type ScoreAnimationState = {
  handName: string;
  chips: number;
  mult: number;
  total: number;
  displayChips: number;
  displayMult: number;
  displayTotal: number;
  phase: 'hand' | 'chips' | 'mult' | 'total';
  isDisallowed: boolean;
};

type ScoreBreakdownEntry = {
  id: string;
  label: string;
  chipsDelta?: number;
  multDelta?: number;
  multFactor?: number;
  accent?: 'chips' | 'mult' | 'special';
};

const PokerGameScreen: React.FC<PokerGameScreenProps> = ({ onBack }) => {
  const expandedSupporterUnlockCount = Math.min(
      storageService.getPokerExpandedSupporterUnlockCount(),
      EXPANDED_SUPPORTER_IDS.length
  );
  const unlockedExpandedSupporterIds = useMemo(
      () => new Set(EXPANDED_SUPPORTER_IDS.slice(0, expandedSupporterUnlockCount)),
      [expandedSupporterUnlockCount]
  );
  const availableSupporters = useMemo(
      () => SUPPORTERS_LIBRARY.filter(s => !EXPANDED_SUPPORTER_IDS.includes(s.id) || unlockedExpandedSupporterIds.has(s.id)),
      [unlockedExpandedSupporterIds]
  );
  const nextUnlockSupporterId = EXPANDED_SUPPORTER_IDS[expandedSupporterUnlockCount] ?? null;
  const nextUnlockSupporter = nextUnlockSupporterId
      ? SUPPORTERS_LIBRARY.find(s => s.id === nextUnlockSupporterId) ?? null
      : null;
  const willUnlockExpandedSupporters = nextUnlockSupporter !== null;
  
  const hydrateState = (state: PokerRunState): PokerRunState => {
      const hydrateSupporters = (list: PokerSupporter[]) => list.map(item => {
          const libItem = SUPPORTERS_LIBRARY.find(lib => lib.id === item.id) || item;
          // Preserve edition if it exists in the saved item
          return { ...libItem, edition: item.edition }; 
      });
      const hydrateConsumables = (list: PokerConsumable[]) => list.map(item => CONSUMABLES_LIBRARY.find(lib => lib.id === item.id) || item);
      
      const hydrateShop = (list: (PokerSupporter | PokerConsumable | PokerPack)[]) => {
          return list.map(item => {
              if ('rarity' in item) return availableSupporters.find(lib => lib.id === item.id) || SUPPORTERS_LIBRARY.find(lib => lib.id === item.id) || item;
              if ('size' in item) return PACK_LIBRARY.find(lib => lib.id === item.id) || item;
              return CONSUMABLES_LIBRARY.find(lib => lib.id === item.id) || item;
          }) as (PokerSupporter | PokerConsumable | PokerPack)[];
      };

      const hydrateVoucher = (voucher: PokerVoucher | null) => {
          if (!voucher) return null;
          return VOUCHERS_LIBRARY.find(v => v.id === voucher.id) || voucher;
      };

      return {
          ...state,
          supporters: hydrateSupporters(state.supporters),
          consumables: hydrateConsumables(state.consumables),
          shopInventory: hydrateShop(state.shopInventory),
          shopVoucher: hydrateVoucher(state.shopVoucher),
          voucherRestockedAnte: state.voucherRestockedAnte ?? 0,
          persistentCounters: state.persistentCounters || {},
          handSizeModifier: state.handSizeModifier || 0,
          lastHandTypePlayed: state.lastHandTypePlayed || undefined
      };
  };

  // --- Game State ---
  const [phase, setPhase] = useState<'BLIND_SELECT' | 'PLAY' | 'SHOP' | 'PACK_OPEN' | 'GAME_OVER' | 'VICTORY_WAIT' | 'VICTORY' | 'MATH'>('BLIND_SELECT');
  const [highScore, setHighScore] = useState(0); 
  const saveDebounceRef = useRef<any>(null);

  // Results State
  const [roundResult, setRoundResult] = useState<{blind: number, interest: number, hands: number, math: number} | null>(null);
  const [showRoundResult, setShowRoundResult] = useState(false);

  const [runState, setRunState] = useState<PokerRunState>(() => {
      const saved = storageService.loadPokerState();
      if (saved) {
          return hydrateState(saved);
      }
      return {
          deck: [],
          money: 4,
          ante: 1,
          blindIndex: 0,
          currentBlind: getBlindConfig(1, 0),
          supporters: [],
          consumables: [],
          handLevels: { ...Object.keys(POKER_HAND_LEVELS).reduce((acc, key) => ({ ...acc, [key]: 1 }), {}) },
          vouchers: [],
          currentScore: 0,
          handsRemaining: 4,
          discardsRemaining: 3,
          hand: [],
          discardPile: [],
          shopInventory: [],
          shopVoucher: null,
          isEndless: false,
          voucherRestockedAnte: 0,
          persistentCounters: {},
          handSizeModifier: 0,
          lastHandTypePlayed: undefined
      };
  });

  // Pack Logic
  const [currentPack, setCurrentPack] = useState<PokerPack | null>(null);
  const [packContent, setPackContent] = useState<(PokerCard | PokerSupporter | PokerConsumable)[]>([]);
  const [isPackOpened, setIsPackOpened] = useState(false);

  // Play Animation State
  const [lastHandScore, setLastHandScore] = useState<{chips: number, mult: number, total: number, name: string} | null>(null);
  const [animating, setAnimating] = useState(false);
  const [scoreAnimation, setScoreAnimation] = useState<ScoreAnimationState | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdownEntry[]>([]);
  const [revealedBreakdownCount, setRevealedBreakdownCount] = useState(0);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [showHandList, setShowHandList] = useState(false);
  const [showDeckList, setShowDeckList] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  
  // Consumable Usage
  const [selectedConsumable, setSelectedConsumable] = useState<PokerConsumable | null>(null);

  // Inspection Modal State (Updated to handle Selling)
  const [inspectedItem, setInspectedItem] = useState<{ item: PokerSupporter | PokerConsumable | PokerCard | PokerPack | PokerVoucher, type: 'CARD'|'SUPPORTER'|'CONSUMABLE'|'PACK'|'VOUCHER', index?: number, isOwned?: boolean } | null>(null);
  const longPressTimer = useRef<any>(null);

  // Sorting
  const [sortRankAsc, setSortRankAsc] = useState(false);

  // Drag/Swipe Select
  const isDraggingRef = useRef(false);
  const lastProcessedCardIdRef = useRef<string | null>(null);
  const scoreAnimationFrameRef = useRef<number | null>(null);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const formatPokerCardLabel = (card: PokerCard) => `${getRankDisplay(card.rank)}${card.suit === 'SPADE' ? '♠' : card.suit === 'HEART' ? '♥' : card.suit === 'DIAMOND' ? '♦' : '♣'}`;
  const animateScoreValue = useCallback((from: number, to: number, duration: number, onUpdate: (value: number) => void) => {
      if (scoreAnimationFrameRef.current) cancelAnimationFrame(scoreAnimationFrameRef.current);
      if (duration <= 0 || from === to) {
          onUpdate(to);
          return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
          const start = performance.now();
          const tick = (now: number) => {
              const progress = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - progress, 3);
              const value = Math.round(from + (to - from) * eased);
              onUpdate(value);
              if (progress < 1) {
                  scoreAnimationFrameRef.current = requestAnimationFrame(tick);
              } else {
                  scoreAnimationFrameRef.current = null;
                  resolve();
              }
          };
          scoreAnimationFrameRef.current = requestAnimationFrame(tick);
      });
  }, []);

  useEffect(() => {
      return () => {
          if (scoreAnimationFrameRef.current) cancelAnimationFrame(scoreAnimationFrameRef.current);
      };
  }, []);

  const currentHandInfo = useMemo(() => {
      if (selectedCards.length === 0) return null;
      
      const playedCards = runState.hand.filter(c => selectedCards.includes(c.id));
      const { type } = getHandResult(playedCards, runState.supporters);
      
      const level = runState.handLevels[type] || 1;
      const isDisallowed = runState.currentBlind.bossAbility === 'THE_EYE' && type === runState.lastHandTypePlayed;

      return {
          name: POKER_HAND_LEVELS[type].name,
          level: level,
          type: type,
          isDisallowed
      };
  }, [selectedCards, runState.hand, runState.handLevels, runState.supporters, runState.currentBlind.bossAbility, runState.lastHandTypePlayed]);

  // --- Initialization & Auto Save ---
  useEffect(() => {
      const saved = storageService.loadPokerState();
      if (!saved) {
          initRun();
      } else {
          setRunState(hydrateState(saved));
          if (saved.hand.length > 0) setPhase('PLAY');
          else if (saved.shopInventory.length > 0) setPhase('SHOP');
          else setPhase('BLIND_SELECT');
          
          audioService.playBGM('poker_shop');
      }
  }, []);

  const saveData = useCallback(() => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = setTimeout(() => {
          storageService.savePokerState(runState);
      }, 500); 
  }, [runState]);

  useEffect(() => {
      if (phase !== 'GAME_OVER' && phase !== 'VICTORY') {
          saveData();
      }
  }, [runState, phase, saveData]);

  const initRun = () => {
      const deck = createDeck();
      setRunState({
          deck,
          money: 4,
          ante: 1,
          blindIndex: 0,
          currentBlind: getBlindConfig(1, 0),
          supporters: [],
          consumables: [],
          handLevels: { ...Object.keys(POKER_HAND_LEVELS).reduce((acc, key) => ({ ...acc, [key]: 1 }), {}) },
          vouchers: [],
          currentScore: 0,
          handsRemaining: 4,
          discardsRemaining: 3,
          hand: [],
          discardPile: [],
          shopInventory: [],
          shopVoucher: null,
          isEndless: false,
          voucherRestockedAnte: 0,
          persistentCounters: {},
          handSizeModifier: 0,
          lastHandTypePlayed: undefined
      });
      setHighScore(0);
      setPhase('BLIND_SELECT');
      audioService.playBGM('poker_shop');
  };

  const handleQuit = () => {
      saveData();
      onBack();
  };

  const startBlind = () => {
      const deck = [...runState.deck].sort(() => Math.random() - 0.5);
      
      let initialHandSize = 8 + (runState.handSizeModifier || 0); // Apply modifier
      if (runState.vouchers.includes('V_PAINT_BRUSH')) initialHandSize += 1;

      const hand = deck.splice(0, initialHandSize);
      hand.sort((a, b) => b.rank - a.rank);
      
      let baseHands = 4;
      if (runState.vouchers.includes('V_GRABBER')) baseHands += 1;
      
      let baseDiscards = 3;
      if (runState.vouchers.includes('V_WASTE')) baseDiscards += 1;

      // Boss Logic Override
      if (runState.currentBlind.bossAbility === 'THE_NEEDLE') baseHands = 1;
      if (runState.currentBlind.bossAbility === 'THE_MANACLE') {
          // Manacle reduces hand size by 1 for this fight
          if (hand.length > 0) {
              const removed = hand.pop();
              if (removed) deck.push(removed); // Return to deck
          }
      } 
      
      setRunState(prev => ({
          ...prev,
          deck,
          hand,
          discardPile: [],
          currentScore: 0,
          handsRemaining: baseHands,
          discardsRemaining: baseDiscards,
          lastHandTypePlayed: undefined // Reset for "The Eye"
      }));
      setPhase('PLAY');
      audioService.playBGM('poker_play');
  };

  const handleTouchStart = (item: any, type: 'CARD'|'SUPPORTER'|'CONSUMABLE'|'PACK'|'VOUCHER', isOwned: boolean, index?: number) => {
      if (type === 'CARD' && selectedCards.length > 1) {
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          return;
      }
      longPressTimer.current = setTimeout(() => {
          setInspectedItem({ item, type, isOwned, index });
      }, 500);
  };
  const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
  const handleContextMenu = (e: React.MouseEvent, item: any, type: 'CARD'|'SUPPORTER'|'CONSUMABLE'|'PACK'|'VOUCHER', isOwned: boolean, index?: number) => { 
      e.preventDefault(); 
      if (type === 'CARD' && selectedCards.length > 1) return;
      setInspectedItem({ item, type, isOwned, index }); 
  };

  const toggleSelect = (id: string) => {
      if (animating) return;
      if (selectedCards.includes(id)) {
          setSelectedCards(prev => prev.filter(c => c !== id));
          return;
      }
      if (selectedCards.length >= 5) return;
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      setSelectedCards(prev => [...prev, id]);
      audioService.playSound('select');
  };
  const handlePointerDown = (e: React.PointerEvent, id: string) => { e.preventDefault(); isDraggingRef.current = true; lastProcessedCardIdRef.current = id; toggleSelect(id); };
  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const element = document.elementFromPoint(e.clientX, e.clientY);
      const cardContainer = element?.closest('[data-card-id]');
      if (cardContainer) {
          const id = cardContainer.getAttribute('data-card-id');
          if (id && id !== lastProcessedCardIdRef.current) { lastProcessedCardIdRef.current = id; toggleSelect(id); }
      }
  };
  const handlePointerUp = () => { isDraggingRef.current = false; lastProcessedCardIdRef.current = null; };
  const sortHandRank = () => {
      const newAsc = !sortRankAsc;
      setSortRankAsc(newAsc);
      const newHand = [...runState.hand].sort((a, b) => newAsc ? a.rank - b.rank : b.rank - a.rank);
      setRunState(prev => ({ ...prev, hand: newHand }));
      audioService.playSound('select');
  };
  const sortHandSuit = () => {
      const newHand = [...runState.hand].sort((a, b) => { if (a.suit !== b.suit) return a.suit.localeCompare(b.suit); return b.rank - a.rank; });
      setRunState(prev => ({ ...prev, hand: newHand }));
      audioService.playSound('select');
  };

  const playHand = async () => {
      if (animating || selectedCards.length === 0 || runState.handsRemaining <= 0) return;
      
      const playedCards = runState.hand.filter(c => selectedCards.includes(c.id));
      const heldCards = runState.hand.filter(c => !selectedCards.includes(c.id));
      const { type, cards: scoringCards } = getHandResult(playedCards, runState.supporters);
      const breakdown: ScoreBreakdownEntry[] = [];
      
      const level = runState.handLevels[type] || 1;
      const baseStats = POKER_HAND_LEVELS[type];
      
      // Boss Constraint: THE_EYE (Cannot repeat hand types)
      const isDisallowed = runState.currentBlind.bossAbility === 'THE_EYE' && type === runState.lastHandTypePlayed;

      let chips = isDisallowed ? 0 : (baseStats.baseChips + (level - 1) * 10);
      let mult = isDisallowed ? 0 : (baseStats.baseMult + (level - 1) * 1);

      if (!isDisallowed) {
          breakdown.push({
              id: `base-${Date.now()}`,
              label: `${baseStats.name} Lv.${level}`,
              chipsDelta: baseStats.baseChips + (level - 1) * 10,
              multDelta: baseStats.baseMult + (level - 1) * 1,
              accent: 'special'
          });
      }

      let bonusMoney = 0;
      const cardsToDestroy: string[] = [];
      const scoringCardAdjustmentEntries: ScoreBreakdownEntry[] = [];
      let totalScoringCardChipGain = 0;
      let totalScoringCardMultGain = 0;

      scoringCards.forEach(c => {
          let val = c.rank;
          if (val > 10 && val < 14) val = 10;
          if (val === 14) val = 11;
          const cardChipGain = val + c.bonusChips;
          const cardMultGain = c.multMultiplier - 1;
          chips += cardChipGain;
          mult += cardMultGain;
          totalScoringCardChipGain += cardChipGain;
          totalScoringCardMultGain += cardMultGain;
          
          if (c.enhancement === 'GLASS') {
              mult *= 2;
              scoringCardAdjustmentEntries.push({
                  id: `glass-${c.id}`,
                  label: `${formatPokerCardLabel(c)} ガラス補正`,
                  multFactor: 2,
                  accent: 'mult'
              });
              if (Math.random() < 0.25) cardsToDestroy.push(c.id);
          }
          if (c.enhancement === 'GOLD') {
              bonusMoney += 3;
              scoringCardAdjustmentEntries.push({
                  id: `gold-${c.id}`,
                  label: `${formatPokerCardLabel(c)} ゴールド収入 +$3`,
                  accent: 'special'
              });
          }
      });

      if (scoringCards.length > 0) {
          breakdown.push({
              id: `cards-total-${Date.now()}`,
              label: `得点カード合計 (${scoringCards.length}枚)`,
              chipsDelta: totalScoringCardChipGain !== 0 ? totalScoringCardChipGain : undefined,
              multDelta: totalScoringCardMultGain !== 0 ? totalScoringCardMultGain : undefined,
              accent: totalScoringCardMultGain > 0 ? 'mult' : 'chips'
          });
      }
      breakdown.push(...scoringCardAdjustmentEntries);

      heldCards.forEach(c => {
          if (c.enhancement === 'STEEL') {
              mult *= 1.5;
              breakdown.push({
                  id: `steel-${c.id}`,
                  label: `${formatPokerCardLabel(c)} スチール保持`,
                  multFactor: 1.5,
                  accent: 'mult'
              });
          }
      });

      const ctx: PokerScoringContext = {
          chips, mult, handType: type, cards: scoringCards,
          handsPlayed: (4 - runState.handsRemaining) + 1,
          discardsUsed: (3 - runState.discardsRemaining),
          discardsRemaining: runState.discardsRemaining,
          deckState: runState.deck,
          money: runState.money,
          persistentCounters: runState.persistentCounters
      };
      
      runState.supporters.forEach(s => {
          if (s.triggerOn !== 'HAND_PLAYED' && s.triggerOn) return;
          const beforeChips = ctx.chips;
          const beforeMult = ctx.mult;
          s.effect(ctx);
          const chipDelta = Math.floor(ctx.chips - beforeChips);
          const multDelta = Math.floor(ctx.mult - beforeMult);
          const multFactor = beforeMult !== 0 && ctx.mult !== beforeMult && Math.abs(multDelta) === 0
              ? Number((ctx.mult / beforeMult).toFixed(2))
              : undefined;
          if (chipDelta !== 0 || multDelta !== 0 || (multFactor !== undefined && multFactor !== 1)) {
              breakdown.push({
                  id: `supporter-${s.id}-${breakdown.length}`,
                  label: s.name,
                  chipsDelta: chipDelta !== 0 ? chipDelta : undefined,
                  multDelta: multDelta !== 0 ? multDelta : undefined,
                  multFactor: multFactor !== undefined && multFactor !== 1 ? multFactor : undefined,
                  accent: multDelta !== 0 || multFactor ? 'mult' : 'chips'
              });
          }
      });

      // Apply Supporter Edition Bonuses
      runState.supporters.forEach(s => {
          if (s.edition === 'FOIL') {
              ctx.chips += 50;
              breakdown.push({
                  id: `edition-${s.id}-foil`,
                  label: `${s.name} FOIL`,
                  chipsDelta: 50,
                  accent: 'chips'
              });
          }
          if (s.edition === 'HOLOGRAPHIC') {
              ctx.mult += 10;
              breakdown.push({
                  id: `edition-${s.id}-holo`,
                  label: `${s.name} HOLOGRAPHIC`,
                  multDelta: 10,
                  accent: 'mult'
              });
          }
          if (s.edition === 'POLYCHROME') {
              ctx.mult *= 1.5;
              breakdown.push({
                  id: `edition-${s.id}-poly`,
                  label: `${s.name} POLYCHROME`,
                  multFactor: 1.5,
                  accent: 'mult'
              });
          }
      });

      chips = Math.floor(ctx.chips);
      mult = Math.floor(ctx.mult);
      const score = chips * mult;
      const handName = isDisallowed ? "制約により無効" : baseStats.name;

      setLastHandScore({ chips, mult, total: score, name: handName });
      if (score > highScore) setHighScore(score);
      setAnimating(true);
      setScoreBreakdown(isDisallowed ? [] : breakdown);
      setRevealedBreakdownCount(0);
      setScoreAnimation({
          handName,
          chips,
          mult,
          total: score,
          displayChips: 0,
          displayMult: isDisallowed ? 0 : 1,
          displayTotal: 0,
          phase: 'hand',
          isDisallowed
      });
      audioService.playSound(isDisallowed ? 'wrong' : 'attack');

      if (isDisallowed) {
          await sleep(1100);
      } else {
          await sleep(280);
          for (let i = 0; i < breakdown.length; i++) {
              setRevealedBreakdownCount(i + 1);
              audioService.playSound(breakdown[i].accent === 'mult' ? 'buff' : breakdown[i].accent === 'chips' ? 'select' : 'correct');
              await sleep(120);
          }
          await sleep(100);
          setScoreAnimation(prev => prev ? { ...prev, phase: 'chips' } : prev);
          audioService.playSound('select');
          await animateScoreValue(0, chips, 420, (value) => {
              setScoreAnimation(prev => prev ? { ...prev, displayChips: value } : prev);
          });

          await sleep(120);
          setScoreAnimation(prev => prev ? { ...prev, phase: 'mult' } : prev);
          audioService.playSound('buff');
          await animateScoreValue(1, mult, 360, (value) => {
              setScoreAnimation(prev => prev ? { ...prev, displayMult: value } : prev);
          });

          await sleep(140);
          setScoreAnimation(prev => prev ? { ...prev, phase: 'total' } : prev);
          audioService.playSound('correct');
          await animateScoreValue(0, score, 520, (value) => {
              setScoreAnimation(prev => prev ? { ...prev, displayTotal: value } : prev);
          });

          await sleep(520);
      }

      const newScore = runState.currentScore + score;
      const remainingPlayedCards = playedCards.filter(c => !cardsToDestroy.includes(c.id));
      
      let newHand = heldCards;
      let currentDeck = [...runState.deck];
      let newDiscardPile = [...runState.discardPile, ...remainingPlayedCards];
      
      if (runState.currentBlind.bossAbility === 'THE_HOOK') {
          if (newHand.length > 0) {
              newHand.sort(() => Math.random() - 0.5);
              const hookDiscarded = newHand.splice(0, 2);
              newDiscardPile.push(...hookDiscarded);
          }
      }

      let handSize = 8 + (runState.handSizeModifier || 0);
      if (runState.vouchers.includes('V_PAINT_BRUSH')) handSize += 1;
      if (runState.currentBlind.bossAbility === 'THE_MANACLE') handSize -= 1;

      const drawCount = Math.max(0, handSize - newHand.length);
      if (drawCount > 0 && currentDeck.length > 0) {
          const drawn = currentDeck.splice(0, drawCount);
          newHand = [...newHand, ...drawn];
      }
      newHand.sort((a, b) => b.rank - a.rank);

      setRunState(prev => {
          const newCounters = { ...prev.persistentCounters };
          newCounters['HANDS_PLAYED'] = (newCounters['HANDS_PLAYED'] || 0) + 1;
          if (type === 'STRAIGHT' || type === 'STRAIGHT_FLUSH' || type === 'ROYAL_FLUSH') {
              newCounters['STRAIGHTS_PLAYED'] = (newCounters['STRAIGHTS_PLAYED'] || 0) + 1;
          }

          return {
            ...prev,
            currentScore: newScore,
            hand: newHand,
            deck: currentDeck,
            discardPile: newDiscardPile,
            handsRemaining: prev.handsRemaining - 1,
            money: prev.money + bonusMoney,
            persistentCounters: newCounters,
            lastHandTypePlayed: type // Record last hand for "The Eye"
          }
      });
      setSelectedCards([]);
      setScoreAnimation(null);
      setScoreBreakdown([]);
      setRevealedBreakdownCount(0);
      setAnimating(false);

      if (newScore >= runState.currentBlind.scoreGoal) {
          audioService.playSound('win');
          await new Promise(r => setTimeout(r, 1000));
          winBlind();
      } else if (runState.handsRemaining - 1 <= 0) {
          audioService.playSound('lose');
          saveRecord();
          setPhase('GAME_OVER');
          storageService.clearPokerState();
      }
  };

  const discardHand = () => {
      if (animating || selectedCards.length === 0 || runState.discardsRemaining <= 0) return;
      
      const discardedCards = runState.hand.filter(c => selectedCards.includes(c.id));
      let newHand = runState.hand.filter(c => !selectedCards.includes(c.id));
      let currentDeck = [...runState.deck];
      let newDiscardPile = [...runState.discardPile, ...discardedCards];
      
      let handSize = 8 + (runState.handSizeModifier || 0);
      if (runState.vouchers.includes('V_PAINT_BRUSH')) handSize += 1;
      if (runState.currentBlind.bossAbility === 'THE_MANACLE') handSize -= 1;

      const drawCount = Math.max(0, handSize - newHand.length);
      if (drawCount > 0 && currentDeck.length > 0) {
          const drawn = currentDeck.splice(0, drawCount);
          newHand = [...newHand, ...drawn];
      }
      newHand.sort((a, b) => b.rank - a.rank);

      setRunState(prev => ({
          ...prev,
          hand: newHand,
          deck: currentDeck,
          discardPile: newDiscardPile,
          discardsRemaining: prev.discardsRemaining - 1
      }));
      setSelectedCards([]);
      audioService.playSound('select');
  };

  const winBlind = () => {
      const interestCap = runState.vouchers.includes('V_SEED_MONEY') ? 10 : 5;
      const interest = Math.min(interestCap, Math.floor(runState.money / 5));
      const handBonus = runState.handsRemaining;
      const blindReward = runState.currentBlind.rewardMoney;
      
      // Add round earnings before Math phase
      const roundTotal = blindReward + interest + handBonus;
      setRunState(prev => ({
          ...prev,
          money: prev.money + roundTotal,
          deck: [...prev.deck, ...prev.hand, ...prev.discardPile],
          hand: [],
          discardPile: [],
          lastHandTypePlayed: undefined
      }));

      // Set partial result (Math bonus will be added later)
      setRoundResult({
          blind: blindReward,
          interest: interest,
          hands: handBonus,
          math: 0
      });

      if (runState.ante === 8 && runState.blindIndex === 2 && !runState.isEndless) {
          setPhase('VICTORY_WAIT');
      } else {
          setPhase('MATH');
      }
  };

  const handleMathComplete = (correctCount: number) => {
      const bonus = correctCount * 1; // $1 per correct answer
      setRunState(prev => ({ ...prev, money: prev.money + bonus }));
      
      setRoundResult(prev => prev ? ({ ...prev, math: bonus }) : null);
      
      generateShop();
      setShowRoundResult(true);
      // Phase set to SHOP, but modal is shown on top
      setPhase('SHOP');
  };

  const closeResultModal = () => {
      setShowRoundResult(false);
      // Play BGM only after closing the modal to start the Shop phase music
      audioService.playBGM('poker_shop');
  };

  const proceedToEndless = () => {
      setRunState(prev => ({ ...prev, isEndless: true }));
      generateShop();
      setPhase('SHOP');
      audioService.playBGM('poker_shop');
  };

  const finishRunVictory = () => {
      storageService.unlockPokerExpandedSupporters(EXPANDED_SUPPORTER_IDS.length);
      saveRecord();
      storageService.clearPokerState();
      onBack();
  };

  const saveRecord = () => {
      storageService.savePokerScore({
          id: `poker-${Date.now()}`,
          date: Date.now(),
          ante: runState.ante,
          money: runState.money,
          bestHandScore: highScore > runState.currentScore ? highScore : runState.currentScore 
      });
  };

  const generateShop = () => {
      const items: (PokerSupporter | PokerConsumable | PokerPack)[] = [];
      const supporters = [...availableSupporters].sort(() => Math.random() - 0.5);
      items.push(supporters[0]);
      items.push(supporters[1]);
      const consumables = [...CONSUMABLES_LIBRARY].sort(() => Math.random() - 0.5);
      items.push(consumables[0]);
      items.push(consumables[1]);
      const packs = [...PACK_LIBRARY].sort(() => Math.random() - 0.5);
      items.push(packs[0]);
      items.push(packs[1]);

      // V_OVERSTOCK Logic: +1 Shop Slot
      if (runState.vouchers.includes('V_OVERSTOCK')) {
          if (Math.random() < 0.5) {
              items.push(supporters[2]);
          } else {
              items.push(consumables[2]);
          }
      }

      // Voucher Logic (Fixed per Ante)
      let voucher = runState.shopVoucher;
      let restockedAnte = runState.voucherRestockedAnte;

      if (runState.ante > restockedAnte) {
          const availableVouchers = VOUCHERS_LIBRARY.filter(v => !runState.vouchers.includes(v.id));
          if (availableVouchers.length > 0) {
              voucher = availableVouchers[Math.floor(Math.random() * availableVouchers.length)];
          } else {
              voucher = null;
          }
          restockedAnte = runState.ante;
      }

      setRunState(prev => ({ 
          ...prev, 
          shopInventory: items, 
          shopVoucher: voucher,
          voucherRestockedAnte: restockedAnte 
      }));
  };

  const getPrice = (basePrice: number) => {
      if (runState.vouchers.includes('V_CLEARANCE')) {
          return Math.floor(basePrice * 0.75);
      }
      return basePrice;
  };

  const buyItem = (item: PokerSupporter | PokerConsumable | PokerPack | PokerVoucher, index: number, type: 'NORMAL' | 'VOUCHER') => {
      const finalPrice = getPrice(item.price);
      
      if (runState.money < finalPrice) return;
      
      if (type === 'VOUCHER') {
          setRunState(prev => ({
              ...prev,
              money: prev.money - finalPrice,
              vouchers: [...prev.vouchers, item.id],
              shopVoucher: null
          }));
      } else if ('size' in item) { 
          setRunState(prev => ({ ...prev, money: prev.money - finalPrice, shopInventory: prev.shopInventory.filter((_, i) => i !== index) }));
          openPack(item as PokerPack);
      } else if ('rarity' in item) { 
          if (runState.supporters.length >= 5) return; 
          setRunState(prev => ({ ...prev, money: prev.money - finalPrice, supporters: [...prev.supporters, item as PokerSupporter], shopInventory: prev.shopInventory.filter((_, i) => i !== index) }));
      } else { 
          if (runState.consumables.length >= 2) return; 
          setRunState(prev => ({ ...prev, money: prev.money - finalPrice, consumables: [...prev.consumables, item as PokerConsumable], shopInventory: prev.shopInventory.filter((_, i) => i !== index) }));
      }
      audioService.playSound('select');
  };

  const openPack = (pack: PokerPack) => { setCurrentPack(pack); setIsPackOpened(false); setPhase('PACK_OPEN'); setPackContent([]); };
  
  const revealPack = () => {
      if (!currentPack) return;
      audioService.playSound('attack'); 
      setIsPackOpened(true);
      const content: (PokerCard | PokerSupporter | PokerConsumable)[] = [];
      
      if (currentPack.type === 'STANDARD') {
          const ENHANCEMENT_RATE = 0.4;
          for (let i = 0; i < currentPack.size; i++) {
             let card = generateRandomPlayingCard(ENHANCEMENT_RATE);
             let retries = 0;
             while (content.some(c => 'suit' in c && c.suit === card.suit && c.rank === card.rank) && retries < 10) {
                 card = generateRandomPlayingCard(ENHANCEMENT_RATE);
                 retries++;
             }
             content.push(card);
          }
      } else {
          let pool: (PokerSupporter | PokerConsumable)[] = [];
          if (currentPack.type === 'BUFF') {
              pool = [...CONSUMABLES_LIBRARY.filter(c => c.type === 'PLANET' || c.type === 'TAROT')];
          } else if (currentPack.type === 'SUPPORTER') {
              pool = [...availableSupporters];
          } else if (currentPack.type === 'SPECTRAL') {
              pool = [...CONSUMABLES_LIBRARY.filter(c => c.type === 'SPECTRAL')];
          }
          pool = pool.sort(() => Math.random() - 0.5);
          for (let i = 0; i < Math.min(currentPack.size, pool.length); i++) {
              content.push(pool[i]);
          }
      }
      
      setPackContent(content);
  };

  const selectPackItem = (item: PokerCard | PokerSupporter | PokerConsumable) => {
      if ('suit' in item) { setRunState(prev => ({ ...prev, deck: [...prev.deck, item as PokerCard] })); } 
      else if ('rarity' in item) { if (runState.supporters.length >= 5) return; setRunState(prev => ({ ...prev, supporters: [...prev.supporters, item as PokerSupporter] })); } 
      else { if (runState.consumables.length >= 2) return; setRunState(prev => ({ ...prev, consumables: [...prev.consumables, item as PokerConsumable] })); }
      audioService.playSound('select'); setPhase('SHOP'); setCurrentPack(null);
  };

  const nextBlind = () => {
      let nextIndex = runState.blindIndex + 1;
      let nextAnte = runState.ante;
      if (nextIndex > 2) { nextIndex = 0; nextAnte++; }
      setRunState(prev => ({ ...prev, ante: nextAnte, blindIndex: nextIndex, currentBlind: getBlindConfig(nextAnte, nextIndex) }));
      setPhase('BLIND_SELECT');
  };

  const useConsumable = (consumable: PokerConsumable, index: number) => {
      if (consumable.type === 'PLANET') {
          const currentHand = getHandResult(runState.hand, runState.supporters).type;
          const basicPool = ['HIGH_CARD', 'PAIR', 'TWO_PAIR', 'THREE_OF_A_KIND', 'STRAIGHT', 'FLUSH'];
          const advancedPool = ['FULL_HOUSE', 'FOUR_OF_A_KIND', 'STRAIGHT_FLUSH', 'ROYAL_FLUSH', 'FIVE_OF_A_KIND', 'FLUSH_FIVE'];
          const mapped = PLANET_TARGETS[consumable.id];
          const targetHand = consumable.id === 'TXT_RANDOM_BASIC'
              ? basicPool[Math.floor(Math.random() * basicPool.length)]
              : consumable.id === 'TXT_RANDOM_ADV'
                ? advancedPool[Math.floor(Math.random() * advancedPool.length)]
                : consumable.id === 'TXT_BLACK_HANDBOOK'
                  ? currentHand
                  : mapped?.hand || 'HIGH_CARD';
          const levelGain = mapped?.levels || (consumable.id === 'TXT_BLACK_HANDBOOK' ? 1 : 1);
          setRunState(prev => ({ ...prev, handLevels: { ...prev.handLevels, [targetHand]: prev.handLevels[targetHand] + levelGain }, consumables: prev.consumables.filter((_, i) => i !== index) }));
          audioService.playSound('win');
      } else if (consumable.type === 'TAROT') { setSelectedConsumable(consumable); } else if (consumable.type === 'SPECTRAL') { handleSpectral(consumable, index); }
  };
  
  const handleSpectral = (consumable: PokerConsumable, index: number) => {
      let newState = { ...runState };
      const requiresSupporter = ['SPC_ANKH', 'SPC_HEX', 'SPC_PHANTOM_BELL', 'SPC_CURSE_BOX', 'SPC_AURA'].includes(consumable.id);
      const requiresHand = ['SPC_IMMOLATE', 'SPC_OUIJA', 'SPC_METEOR', 'SPC_MIRROR', 'SPC_VOID_NOTE', 'SPC_GHOST_WRITER'].includes(consumable.id);
      if (requiresSupporter && newState.supporters.length === 0) {
          audioService.playSound('wrong');
          return;
      }
      if (requiresHand && newState.hand.length === 0) {
          audioService.playSound('wrong');
          return;
      }
      
      if (consumable.id === 'SPC_BLACKHOLE') { 
          Object.keys(newState.handLevels).forEach(k => newState.handLevels[k] += 1); 
          audioService.playSound('win'); 
      } 
      else if (consumable.id === 'SPC_IMMOLATE') { 
          if (newState.hand.length > 0) { 
              const shuffled = [...newState.hand].sort(() => Math.random() - 0.5); 
              const destroyed = shuffled.slice(0, 5).map(c => c.id); 
              newState.hand = newState.hand.filter(c => !destroyed.includes(c.id)); 
              newState.money += 20; 
              audioService.playSound('attack'); 
          } 
      } 
      else if (consumable.id === 'SPC_ANKH') { 
          if (newState.supporters.length > 0) { 
              const target = newState.supporters[Math.floor(Math.random() * newState.supporters.length)]; 
              newState.supporters = [target, { ...target, id: `copy-${Date.now()}` }]; 
              audioService.playSound('win'); 
          } 
      } 
      else if (consumable.id === 'SPC_HEX') { 
          if (newState.supporters.length > 0) {
              const target = newState.supporters[Math.floor(Math.random() * newState.supporters.length)];
              const polychromeSupporter: PokerSupporter = { ...target, edition: 'POLYCHROME' };
              newState.supporters = [polychromeSupporter];
              audioService.playSound('win');
          }
      } 
      else if (consumable.id === 'SPC_OUIJA') { 
          if (newState.hand.length > 0) { 
              const ranks = newState.hand.map(c => c.rank); 
              const targetRank = ranks[Math.floor(Math.random() * ranks.length)]; 
              newState.hand = newState.hand.map(c => ({ ...c, rank: targetRank })); 
              newState.handSizeModifier = (newState.handSizeModifier || 0) - 1;
              if (newState.hand.length > 0) {
                  newState.hand.pop(); // Remove one card immediately from hand to respect new size
              }
              audioService.playSound('win'); 
          } 
      }
      else if (consumable.id === 'SPC_METEOR') {
          const ids = [...newState.hand].sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.id);
          newState.hand = newState.hand.map(c => ids.includes(c.id) ? { ...c, bonusChips: c.bonusChips + 50, enhancement: c.enhancement === 'STONE' ? c.enhancement : 'BONUS' } : c);
          audioService.playSound('win');
      }
      else if (consumable.id === 'SPC_PHANTOM_BELL') {
          if (newState.supporters.length > 0) {
              const targetIndex = Math.floor(Math.random() * newState.supporters.length);
              newState.supporters = newState.supporters.map((s, i) => i === targetIndex ? { ...s, edition: 'HOLOGRAPHIC' } : s);
              audioService.playSound('win');
          }
      }
      else if (consumable.id === 'SPC_MIRROR') {
          if (newState.hand.length > 0) {
              const target = newState.hand[Math.floor(Math.random() * newState.hand.length)];
              const copyA = { ...target, id: `mirror-a-${Date.now()}-${Math.random()}` };
              const copyB = { ...target, id: `mirror-b-${Date.now()}-${Math.random()}` };
              newState.deck = [...newState.deck, copyA, copyB];
              audioService.playSound('win');
          }
      }
      else if (consumable.id === 'SPC_VOID_NOTE') {
          const ids = [...newState.hand].sort(() => Math.random() - 0.5).slice(0, 2).map(c => c.id);
          newState.hand = newState.hand.map(c => ids.includes(c.id) ? { ...c, enhancement: 'WILD' } : c);
          audioService.playSound('win');
      }
      else if (consumable.id === 'SPC_CURSE_BOX') {
          if (newState.supporters.length > 0) {
              const removeIndex = Math.floor(Math.random() * newState.supporters.length);
              newState.supporters = newState.supporters.filter((_, i) => i !== removeIndex);
              newState.money += 30;
              audioService.playSound('attack');
          }
      }
      else if (consumable.id === 'SPC_AURA') {
          if (newState.supporters.length > 0) {
              const targetIndex = Math.floor(Math.random() * newState.supporters.length);
              newState.supporters = newState.supporters.map((s, i) => i === targetIndex ? { ...s, edition: 'FOIL' } : s);
              audioService.playSound('win');
          }
      }
      else if (consumable.id === 'SPC_TIME_SKIP') {
          newState.handsRemaining += 1;
          newState.discardsRemaining += 1;
          audioService.playSound('win');
      }
      else if (consumable.id === 'SPC_GHOST_WRITER') {
          const currentHand = getHandResult(newState.hand, newState.supporters).type;
          newState.handLevels = { ...newState.handLevels, [currentHand]: newState.handLevels[currentHand] + 2 };
          audioService.playSound('win');
      }
      
      newState.consumables = newState.consumables.filter((_, i) => i !== index); 
      setRunState(newState);
  };

  const applyTarot = () => {
      if (!selectedConsumable || selectedCards.length === 0) return;
      const requiredSelectionCount: Record<string, number> = {
          STA_RULER: 2,
          STA_ERASER: 2,
          STA_DEATH: 2,
          STA_NOTE_SWAP: 2,
          STA_COPY_SHEET: 1,
          STA_GOLD_SPRAY: 1,
          STA_GLASS_WORK: 1,
          STA_STEEL_RULER: 1,
          STA_RAINBOW_PEN: 1,
          STA_BLUE_MARKER: 1,
          STA_GREEN_MARKER: 1,
          STA_CHALK_WHITE: 1,
          STA_HOLOGRAM: 1,
          STA_LUNCH_PASS: 1,
          STA_CLUB_STAMP: 3,
          STA_DIAMOND_DUST: 3,
          STA_PAINT: 3,
          STA_INK: 3
      };
      const requiredCount = requiredSelectionCount[selectedConsumable.id];
      if (requiredCount !== undefined && selectedCards.length !== requiredCount) {
          audioService.playSound('wrong');
          return;
      }
      const modifiedHand = runState.hand.map(c => {
          if (!selectedCards.includes(c.id)) return c;
          let mod = { ...c };
          if (selectedConsumable.id === 'STA_RULER') mod.rank = Math.min(14, mod.rank + 1) as PokerRank; 
          if (selectedConsumable.id === 'STA_STICKER') { mod.bonusChips += 50; mod.enhancement = 'BONUS'; } 
          if (selectedConsumable.id === 'STA_MARKER') { mod.multMultiplier = 1.5; mod.enhancement = 'MULT'; } 
          if (selectedConsumable.id === 'STA_PAINT') { mod.suit = 'HEART'; } 
          if (selectedConsumable.id === 'STA_INK') { mod.suit = 'SPADE'; } 
          if (selectedConsumable.id === 'STA_GOLD_SPRAY') { mod.enhancement = 'GOLD'; } 
          if (selectedConsumable.id === 'STA_GLASS_WORK') { mod.enhancement = 'GLASS'; mod.multMultiplier = 2; } 
          if (selectedConsumable.id === 'STA_STEEL_RULER') { mod.enhancement = 'STEEL'; } 
          if (selectedConsumable.id === 'STA_RAINBOW_PEN') { mod.enhancement = 'WILD'; }
          if (selectedConsumable.id === 'STA_BLUE_MARKER') { mod.bonusChips += 80; mod.enhancement = 'BONUS'; }
          if (selectedConsumable.id === 'STA_GREEN_MARKER') { mod.multMultiplier = Math.max(mod.multMultiplier, 2); mod.enhancement = 'MULT'; }
          if (selectedConsumable.id === 'STA_CHALK_WHITE') { mod.enhancement = 'STONE'; mod.bonusChips = 50; mod.multMultiplier = 1; }
          if (selectedConsumable.id === 'STA_CLUB_STAMP') { mod.suit = 'CLUB'; }
          if (selectedConsumable.id === 'STA_DIAMOND_DUST') { mod.suit = 'DIAMOND'; }
          if (selectedConsumable.id === 'STA_SHARPENER') { mod.rank = Math.max(2, mod.rank - 1) as PokerRank; }
          if (selectedConsumable.id === 'STA_HOLOGRAM') { mod.bonusChips += 40; mod.multMultiplier = Math.max(mod.multMultiplier, 1.5); mod.enhancement = 'MULT'; }
          if (selectedConsumable.id === 'STA_LUNCH_PASS') { mod.enhancement = 'GOLD'; mod.bonusChips += 30; }
          if (selectedConsumable.id === 'STA_DEATH') { if (selectedCards.length === 2 && selectedCards[0] === c.id) { const targetCard = runState.hand.find(h => h.id === selectedCards[1]); if (targetCard) { mod.rank = targetCard.rank; mod.suit = targetCard.suit; mod.enhancement = targetCard.enhancement; } } }
          if (selectedConsumable.id === 'STA_NOTE_SWAP' && selectedCards.length === 2) {
              const first = runState.hand.find(h => h.id === selectedCards[0]);
              const second = runState.hand.find(h => h.id === selectedCards[1]);
              if (first && second) {
                  if (c.id === first.id) mod.rank = second.rank;
                  if (c.id === second.id) mod.rank = first.rank;
              }
          }
          return mod;
      });
      if (selectedConsumable.id === 'STA_ERASER') {
          setRunState(prev => ({ ...prev, hand: prev.hand.filter(c => !selectedCards.includes(c.id)), deck: prev.deck, consumables: prev.consumables.filter(c => c !== selectedConsumable) }));
      } else if (selectedConsumable.id === 'STA_COPY_SHEET') {
          const target = runState.hand.find(c => c.id === selectedCards[0]);
          setRunState(prev => ({
              ...prev,
              deck: target ? [...prev.deck, { ...target, id: `copy-sheet-${Date.now()}-${Math.random()}` }] : prev.deck,
              consumables: prev.consumables.filter(c => c !== selectedConsumable)
          }));
      } else {
          setRunState(prev => ({ ...prev, hand: modifiedHand, consumables: prev.consumables.filter(c => c !== selectedConsumable) }));
      }
      setSelectedConsumable(null); setSelectedCards([]); audioService.playSound('win');
  };

  const sellItem = () => {
      if (!inspectedItem || !inspectedItem.isOwned || inspectedItem.index === undefined) return;
      
      const { item, type, index } = inspectedItem;
      if (type === 'CARD') return;

      const sellValue = Math.max(1, Math.floor((item as any).price / 2));
      
      setRunState(prev => {
          const newCounters = { ...prev.persistentCounters };
          newCounters['CARDS_SOLD'] = (newCounters['CARDS_SOLD'] || 0) + 1;

          const newState = { ...prev, money: prev.money + sellValue, persistentCounters: newCounters };
          if (type === 'SUPPORTER') {
              newState.supporters = prev.supporters.filter((_, i) => i !== index);
          } else if (type === 'CONSUMABLE') {
              if (selectedConsumable === item) {
                   setSelectedConsumable(null);
                   setSelectedCards([]);
              }
              newState.consumables = prev.consumables.filter((_, i) => i !== index);
          }
          return newState;
      });
      
      audioService.playSound('select');
      setInspectedItem(null);
  };

  const renderInspectionModal = () => {
      if (!inspectedItem) return null;
      const { item, type, isOwned, index } = inspectedItem;
      const isCard = type === 'CARD';
      const isPack = type === 'PACK';
      const isSupporter = type === 'SUPPORTER';
      const isConsumable = type === 'CONSUMABLE';
      const isVoucher = type === 'VOUCHER';
      const cardItem = item as PokerCard;
      const supporterItem = item as PokerSupporter;
      const consumableItem = item as PokerConsumable;
      
      const cardEnhancement = isCard && cardItem.enhancement ? POKER_ENHANCEMENTS[cardItem.enhancement] : null;

      // Edition Logic
      const edition = isSupporter ? supporterItem.edition : undefined;
      const editionName = edition === 'FOIL' ? 'Foil' : edition === 'HOLOGRAPHIC' ? 'Holographic' : edition === 'POLYCHROME' ? 'Polychrome' : '';
      const editionColor = edition === 'FOIL' ? 'text-blue-300 border-blue-400' : edition === 'HOLOGRAPHIC' ? 'text-red-300 border-red-400' : edition === 'POLYCHROME' ? 'text-yellow-300 border-yellow-400 animate-pulse' : 'text-gray-400 border-gray-600';
      const editionEffect = edition === 'FOIL' ? '+50 Chips' : edition === 'HOLOGRAPHIC' ? '+10 Mult' : edition === 'POLYCHROME' ? 'x1.5 Mult' : '';

      return (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setInspectedItem(null)}>
              <div className="bg-slate-800 border-2 border-white p-6 rounded-lg max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setInspectedItem(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X size={24}/></button>
                  {isCard ? (
                      <div className="flex flex-col items-center mb-4">
                          <div className="w-32 h-48 bg-white text-black rounded-lg border-4 border-slate-300 shadow-xl flex flex-col items-center justify-between p-2 mb-4">
                              <div className={`text-2xl font-bold w-full text-left ${['HEART', 'DIAMOND'].includes(cardItem.suit) ? 'text-red-600' : 'text-black'}`}>{getRankDisplay(cardItem.rank)}</div>
                              <div className="scale-150">{getSuitIcon(cardItem.suit, cardItem.enhancement === 'WILD')}</div>
                              <div className="text-xs text-center font-bold text-gray-500">{cardItem.enhancement || ''}</div>
                              <div className={`text-2xl font-bold w-full text-right rotate-180 ${['HEART', 'DIAMOND'].includes(cardItem.suit) ? 'text-red-600' : 'text-black'}`}>{getRankDisplay(cardItem.rank)}</div>
                          </div>
                          <h3 className="text-2xl font-bold text-yellow-400 mb-2">{getRankDisplay(cardItem.rank)} of {cardItem.suit}</h3>
                          
                          {cardEnhancement && (
                              <div className="bg-black/50 p-2 rounded w-full text-center mt-2 border border-yellow-500/30">
                                  <div className="text-yellow-400 font-bold">{cardEnhancement.name}</div>
                                  <div className="text-gray-300 text-xs">{cardEnhancement.desc}</div>
                              </div>
                          )}
                      </div>
                  ) : isPack ? (
                      <>
                        <div className="flex flex-col items-center mb-4">
                            <div className="w-24 h-24 mb-4"><PixelSprite seed={(item as PokerPack).icon} name={(item as PokerPack).icon} className="w-full h-full"/></div>
                            <h3 className="text-2xl font-bold text-yellow-400 mb-2">{(item as PokerPack).name}</h3>
                            <div className="text-sm font-bold text-white bg-orange-700 px-3 py-1 rounded-full">PACK</div>
                        </div>
                        <p className="text-lg text-gray-300 text-center leading-relaxed">{(item as PokerPack).description}</p>
                        <div className="mt-6 text-center text-yellow-500 font-bold text-xl">${getPrice((item as PokerPack).price)}</div> 
                      </>
                  ) : (
                      <> 
                        <div className="flex flex-col items-center mb-4">
                            <div className={`w-24 h-24 mb-4 rounded-lg overflow-hidden border-4 ${edition ? editionColor : 'border-transparent'}`}>
                                <PixelSprite seed={(item as any).icon} name={(item as any).icon} className="w-full h-full"/>
                            </div>
                            <h3 className="text-2xl font-bold text-yellow-400 mb-1">{(item as any).name}</h3>
                            
                            {edition && (
                                <div className={`text-xs font-bold mb-2 border px-2 py-0.5 rounded ${editionColor} bg-black/50`}>
                                    {editionName} ({editionEffect})
                                </div>
                            )}

                            {isVoucher && <div className="text-sm font-bold text-white bg-slate-700 px-3 py-1 rounded-full">VOUCHER</div>}
                            {!isVoucher && <div className="text-sm font-bold text-white bg-slate-700 px-3 py-1 rounded-full">{'rarity' in item ? (item as PokerSupporter).rarity : (item as PokerConsumable).type}</div>}
                        </div>
                        <p className="text-lg text-gray-300 text-center leading-relaxed mb-4">{(item as any).description}</p>
                        
                        {/* Dynamic Bonus Display for Supporters */}
                        {isSupporter && supporterItem.getDynamicDescription && (
                            <div className="bg-slate-900/80 p-2 rounded text-center border border-cyan-500/50 mb-4 animate-pulse">
                                <div className="text-cyan-400 font-bold text-sm">
                                    {supporterItem.getDynamicDescription(runState)}
                                </div>
                            </div>
                        )}

                        {!isOwned && <div className="mt-2 text-center text-yellow-500 font-bold text-xl">${getPrice((item as any).price)}</div>} 
                      </>
                  )}
                  
                  {/* Owned Item Actions */}
                  {isOwned && isConsumable && index !== undefined && (
                      <div className="flex gap-2 mt-6">
                          <button 
                              onClick={() => { useConsumable(consumableItem, index); setInspectedItem(null); }}
                              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded border-2 border-blue-400 shadow-lg flex items-center justify-center animate-pulse"
                          >
                              <Sparkles size={16} className="mr-1" /> USE
                          </button>
                          <button 
                              onClick={sellItem}
                              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded border-2 border-red-400 shadow-lg flex items-center justify-center"
                          >
                              <DollarSign size={16} className="mr-1" /> SELL (${Math.max(1, Math.floor((item as any).price / 2))})
                          </button>
                      </div>
                  )}
                  
                  {isOwned && isSupporter && index !== undefined && (
                      <button 
                        onClick={sellItem}
                        className="mt-6 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded border-2 border-red-400 shadow-lg flex items-center justify-center"
                      >
                          <DollarSign size={16} className="mr-1" /> SELL (${Math.max(1, Math.floor((item as any).price / 2))})
                      </button>
                  )}
              </div>
          </div>
      );
  };

  if (phase === 'MATH') {
      return (
          <MathChallengeScreen 
              mode={GameMode.MIXED} 
              onComplete={handleMathComplete} 
          />
      );
  }

  if (phase === 'VICTORY_WAIT') {
      return (
          <div className="flex flex-col h-full w-full bg-slate-900 text-white p-8 items-center justify-center relative font-mono text-center">
              <Trophy size={80} className="text-yellow-400 mb-6 animate-bounce" />
              <h1 className="text-5xl font-black text-white mb-4">GRADUATION!</h1>
              <p className="text-xl text-gray-300 mb-12">You have conquered the 8th Grade (Ante 8).</p>
              {willUnlockExpandedSupporters && (
                  <div className="w-full max-w-2xl mb-10 rounded-2xl border-2 border-yellow-300 bg-yellow-500/10 px-6 py-5 shadow-[0_0_30px_rgba(250,204,21,0.15)]">
                      <div className="text-sm font-bold tracking-[0.2em] text-yellow-300 mb-2">NEXT RUN UNLOCK</div>
                      <div className="text-2xl font-black text-white mb-2">追加サポーター 1種 解禁</div>
                      {nextUnlockSupporter && (
                          <div className="text-xl font-bold text-yellow-100 mb-2">{nextUnlockSupporter.name}</div>
                      )}
                      <div className="text-sm text-yellow-100/90 leading-relaxed">
                          次のランから、上のサポーターがショップと「部員勧誘」パックに出現します。
                      </div>
                  </div>
              )}
              
              <div className="flex flex-col gap-4 w-full max-w-md">
                  <button 
                    onClick={proceedToEndless}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xl font-bold py-4 px-8 rounded-lg shadow-lg border-2 border-purple-300 flex items-center justify-center"
                  >
                      <RotateCcw className="mr-3" /> Endless Mode
                  </button>
                  <button 
                    onClick={finishRunVictory}
                    className="bg-slate-700 hover:bg-slate-600 text-gray-200 text-lg font-bold py-4 px-8 rounded-lg flex items-center justify-center"
                  >
                      <ArrowLeft className="mr-3" /> Return to Menu
                  </button>
              </div>
          </div>
      );
  }

  if (phase === 'BLIND_SELECT') {
      const config = runState.currentBlind;
      return (
          <div className="flex flex-col h-full w-full bg-slate-900 text-white p-8 items-center justify-center relative font-mono">
              <div className="absolute top-4 left-4">
                  <button onClick={handleQuit} className="text-gray-400 hover:text-white flex items-center"><ArrowLeft className="mr-2"/> Quit</button>
              </div>
              <div className="text-center animate-in zoom-in duration-300">
                  <div className="text-2xl text-yellow-500 mb-2 font-bold">ANTE {runState.ante} / 8</div>
                  {runState.isEndless && <div className="text-purple-400 text-sm font-bold animate-pulse mb-2">ENDLESS MODE</div>}
                  <div className="text-6xl font-black mb-4 text-white tracking-tighter">{config.name}</div>
                  <div className="bg-slate-800 p-6 rounded-xl border-4 border-slate-600 mb-8 min-w-[300px]">
                      <div className="text-gray-400 mb-2 text-sm uppercase tracking-widest">Score Goal</div>
                      <div className="text-5xl font-bold text-red-500 mb-4">{config.scoreGoal.toLocaleString()}</div>
                      <div className="text-gray-400 mb-2 text-sm uppercase tracking-widest">Reward</div>
                      <div className="text-3xl font-bold text-yellow-400 mb-2">${config.rewardMoney}</div>
                      {config.description && <div className="text-purple-300 text-sm mt-4 border-t border-slate-600 pt-2">{config.description}</div>}
                  </div>
                  <button onClick={startBlind} className="bg-red-600 hover:bg-red-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse flex items-center justify-center mx-auto">
                      <Play className="mr-2 fill-current"/> START
                  </button>
              </div>
          </div>
      );
  }

  if (phase === 'SHOP' || phase === 'PACK_OPEN') {
      
      if (phase === 'PACK_OPEN' && currentPack) {
          return (
              <div className="flex flex-col h-full w-full bg-slate-900 text-white p-4 items-center justify-center relative font-mono overflow-hidden">
                  <div className="absolute inset-0 bg-black/80 z-0"></div>
                  {renderInspectionModal()}
                  
                  <div className="z-10 flex flex-col items-center w-full max-w-4xl">
                      <h2 className="text-3xl font-bold mb-8 text-yellow-400 animate-pulse">{isPackOpened ? "Choose One!" : "Open Pack!"}</h2>
                      
                      {!isPackOpened ? (
                          <div className="cursor-pointer hover:scale-110 transition-transform animate-bounce relative" onClick={revealPack}>
                              <div className="w-48 h-64 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg border-4 border-yellow-300 shadow-[0_0_50px_rgba(253,224,71,0.5)] flex flex-col items-center justify-center p-4 text-center">
                                  <div className="text-6xl mb-4"><PixelSprite seed={currentPack.icon} name={currentPack.icon} className="w-24 h-24"/></div>
                                  <div className="text-2xl font-black text-white drop-shadow-md">{currentPack.name}</div>
                                  <div className="text-sm text-yellow-200 mt-2">{currentPack.description}</div>
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-wrap justify-center gap-6 animate-in zoom-in duration-500">
                              {packContent.map((item, idx) => {
                                  const isCard = 'suit' in item;
                                  const isSupporter = 'rarity' in item;
                                  const isConsumable = !isCard && !isSupporter;
                                  let disabled = false;
                                  if (isSupporter && runState.supporters.length >= 5) disabled = true;
                                  if (isConsumable && runState.consumables.length >= 2) disabled = true;
                                  const type = isCard ? 'CARD' : isSupporter ? 'SUPPORTER' : 'CONSUMABLE';
                                  return (
                                      <div key={idx} className={`relative cursor-pointer transition-transform hover:-translate-y-4 duration-300 ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`} onClick={() => !disabled && selectPackItem(item)} onContextMenu={(e) => handleContextMenu(e, item, type, false)} onTouchStart={() => handleTouchStart(item, type, false)} onTouchEnd={handleTouchEnd}>
                                          {isCard && <div className="w-32 h-48 bg-white text-black rounded-lg border-4 border-slate-300 shadow-xl flex flex-col items-center justify-between p-2"><div className={`text-2xl font-bold w-full text-left ${['HEART', 'DIAMOND'].includes((item as PokerCard).suit) ? 'text-red-600' : 'text-black'}`}>{getRankDisplay((item as PokerCard).rank)}</div><div className="scale-150">{getSuitIcon((item as PokerCard).suit, (item as PokerCard).enhancement === 'WILD')}</div><div className="text-xs text-center font-bold text-gray-500">{(item as PokerCard).enhancement || ''}</div><div className={`text-2xl font-bold w-full text-right rotate-180 ${['HEART', 'DIAMOND'].includes((item as PokerCard).suit) ? 'text-red-600' : 'text-black'}`}>{getRankDisplay((item as PokerCard).rank)}</div></div>}
                                          {!isCard && <div className="w-32 h-48 bg-slate-800 text-white rounded-lg border-4 border-blue-400 shadow-xl flex flex-col items-center justify-center p-2 text-center"><PixelSprite seed={(item as any).icon} name={(item as any).icon} className="w-16 h-16 mb-2"/><div className="font-bold text-sm">{(item as any).name}</div><div className="text-[10px] text-gray-400 mt-2 leading-tight">{(item as any).description}</div></div>}
                                          <button className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold shadow-lg ${disabled ? 'bg-gray-600 text-gray-300' : 'bg-blue-600 text-white animate-pulse'}`}>{disabled ? 'FULL' : 'SELECT'}</button>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                      <button onClick={() => { setPhase('SHOP'); setCurrentPack(null); }} className="mt-12 text-gray-400 hover:text-white border-b border-transparent hover:border-white transition-colors">Skip</button>
                  </div>
              </div>
          );
      }

      const shopSupporters = runState.shopInventory.filter(i => 'rarity' in i) as PokerSupporter[];
      const shopConsumables = runState.shopInventory.filter(i => !('rarity' in i) && !('size' in i)) as PokerConsumable[];
      const shopPacks = runState.shopInventory.filter(i => 'size' in i) as PokerPack[];
      const voucher = runState.shopVoucher;

      return (
          <div className="flex flex-col h-full w-full bg-slate-900 text-white p-4 font-mono relative overflow-hidden">
              {renderInspectionModal()}
              
              {showRoundResult && roundResult && (
                  <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={closeResultModal}>
                      <div className="bg-slate-800 border-4 border-yellow-500 rounded-lg p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                          <h2 className="text-3xl font-black text-white text-center mb-6 border-b border-slate-600 pb-2">ROUND CLEAR</h2>
                          
                          <div className="space-y-3 font-mono text-sm mb-6">
                              <div className="flex justify-between items-center text-gray-300">
                                  <span>Blind Reward</span>
                                  <span className="font-bold text-yellow-400">${roundResult.blind}</span>
                              </div>
                              <div className="flex justify-between items-center text-gray-300">
                                  <span>Interest</span>
                                  <span className="font-bold text-yellow-400">${roundResult.interest}</span>
                              </div>
                              <div className="flex justify-between items-center text-gray-300">
                                  <span>Hands Left</span>
                                  <span className="font-bold text-yellow-400">${roundResult.hands}</span>
                              </div>
                              <div className="flex justify-between items-center text-cyan-300 border-t border-slate-600 pt-2">
                                  <span className="flex items-center"><Calculator className="mr-2" size={14}/> Math Bonus</span>
                                  <span className="font-bold">+${roundResult.math}</span>
                              </div>
                              <div className="flex justify-between items-center text-xl font-black text-white bg-slate-700 p-2 rounded mt-2">
                                  <span>TOTAL</span>
                                  <span className="text-yellow-400">${roundResult.blind + roundResult.interest + roundResult.hands + roundResult.math}</span>
                              </div>
                          </div>
                          
                          <button onClick={closeResultModal} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center shadow-lg transition-colors">
                              <Check className="mr-2"/> Go to Shop
                          </button>
                      </div>
                  </div>
              )}

              <div className="flex justify-between items-center mb-4 bg-slate-800 p-4 rounded-lg shadow-lg shrink-0">
                  <h2 className="text-2xl font-bold flex items-center"><ShoppingBag className="mr-2 text-yellow-500"/> School Store</h2>
                  <div className="text-2xl font-bold text-yellow-400">${runState.money}</div>
                  <button onClick={nextBlind} className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-bold flex items-center shadow-lg transform transition active:translate-y-1">Next Round <ArrowLeft className="rotate-180 inline ml-1"/></button>
              </div>
              
              <div className="flex-grow flex flex-col gap-4 overflow-hidden">
                  
                  <div className="w-full bg-slate-800/90 p-2 rounded-lg border border-slate-600 shrink-0 shadow-sm">
                      <div className="flex gap-2 h-16 md:h-20 items-stretch">
                          <div className="flex-1 bg-black/20 rounded border border-slate-700 flex flex-col px-2 py-1 min-w-0">
                              <div className="text-[9px] text-blue-300 font-bold mb-0.5 flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-1 inline-block"></span>SUPPORTERS ({runState.supporters.length}/5)</div>
                              <div className="flex-1 flex items-center gap-1 overflow-x-auto custom-scrollbar">
                                  {runState.supporters.map((s, i) => (
                                      <div key={i} className={`bg-slate-800 p-0.5 rounded flex-shrink-0 border cursor-pointer hover:bg-slate-700 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center relative group ${s.edition === 'POLYCHROME' ? 'border-yellow-400 animate-pulse' : s.edition === 'HOLOGRAPHIC' ? 'border-red-400' : s.edition === 'FOIL' ? 'border-blue-400' : 'border-slate-600'}`} onClick={() => setInspectedItem({ item: s, type: 'SUPPORTER', isOwned: true, index: i })} onContextMenu={(e) => handleContextMenu(e, s, 'SUPPORTER', true, i)} onTouchStart={() => handleTouchStart(s, 'SUPPORTER', true, i)} onTouchEnd={handleTouchEnd}>
                                          <PixelSprite seed={s.icon} name={s.icon} className="w-full h-full"/>
                                      </div>
                                  ))}
                                  {[...Array(5 - runState.supporters.length)].map((_, i) => (
                                      <div key={`empty-${i}`} className="w-8 h-8 md:w-10 md:h-10 rounded border border-slate-700/50 bg-slate-900/30 flex-shrink-0"></div>
                                  ))}
                              </div>
                          </div>
                          
                          <div className="w-24 md:w-32 bg-black/20 rounded border border-slate-700 flex flex-col px-2 py-1 shrink-0">
                              <div className="text-[9px] text-purple-300 font-bold mb-0.5 flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-1 inline-block"></span>CARDS ({runState.consumables.length}/2)</div>
                              <div className="flex-1 flex items-center gap-1 justify-center">
                                  {runState.consumables.map((c, i) => (
                                      <div key={i} className="bg-slate-800 p-0.5 rounded flex-shrink-0 border border-slate-600 cursor-pointer hover:bg-slate-700 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center relative group" onClick={() => setInspectedItem({ item: c, type: 'CONSUMABLE', isOwned: true, index: i })} onContextMenu={(e) => handleContextMenu(e, c, 'CONSUMABLE', true, i)} onTouchStart={() => handleTouchStart(c, 'CONSUMABLE', true, i)} onTouchEnd={handleTouchEnd}>
                                          <PixelSprite seed={c.icon} name={c.icon} className="w-full h-full"/>
                                      </div>
                                  ))}
                                  {[...Array(2 - runState.consumables.length)].map((_, i) => (
                                      <div key={`empty-c-${i}`} className="w-8 h-8 md:w-10 md:h-10 rounded border border-slate-700/50 bg-slate-900/30 flex-shrink-0"></div>
                                  ))}
                              </div>
                          </div>
                      </div>
                      
                      {runState.vouchers.length > 0 && (
                          <div className="flex gap-1 mt-1 overflow-x-auto h-5 items-center px-1">
                              {runState.vouchers.map((vid, i) => {
                                  const v = VOUCHERS_LIBRARY.find(lib => lib.id === vid);
                                  if (!v) return null;
                                  return (
                                      <div key={i} className="h-4 w-4 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center flex-shrink-0 cursor-help" title={v.name} onClick={() => setInspectedItem({ item: v, type: 'VOUCHER', isOwned: true })}>
                                          <PixelSprite seed={v.icon} name={v.icon} className="w-3 h-3"/>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>

                  <div className="flex-grow bg-slate-800/30 p-2 md:p-4 rounded-lg border-2 border-slate-700 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          
                          <div className="col-span-2 md:col-span-1 row-span-1">
                              {voucher ? (
                                  <div 
                                    className="bg-slate-900 border-2 border-slate-600 p-2 rounded-lg flex flex-col items-center text-center h-full relative group cursor-pointer hover:border-white transition-colors justify-between min-h-[160px]"
                                    onClick={() => buyItem(voucher, -1, 'VOUCHER')}
                                    onContextMenu={(e) => handleContextMenu(e, voucher, 'VOUCHER', false)}
                                    onTouchStart={() => handleTouchStart(voucher, 'VOUCHER', false)}
                                    onTouchEnd={handleTouchEnd}
                                  >
                                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-full border-b border-gray-700 pb-1">Voucher</div>
                                      <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700 mt-2">
                                          <PixelSprite seed={voucher.icon} name={voucher.icon} className="w-8 h-8"/>
                                      </div>
                                      <div className="font-bold text-xs">{voucher.name}</div>
                                      <div className="text-[9px] text-gray-400 leading-tight h-8 overflow-hidden">{voucher.description}</div>
                                      <button disabled={runState.money < getPrice(voucher.price)} className={`w-full py-1 rounded font-bold text-xs ${runState.money >= getPrice(voucher.price) ? 'bg-slate-100 text-black hover:bg-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>${getPrice(voucher.price)}</button>
                                  </div>
                              ) : (
                                  <div className="bg-slate-900/50 border-2 border-slate-700 border-dashed p-4 rounded-lg flex flex-col items-center justify-center h-full text-gray-600 text-xs italic min-h-[160px]">
                                      Sold Out
                                  </div>
                              )}
                          </div>

                          {shopPacks.map((item) => (
                              <div key={item.id} className="bg-slate-700 p-2 rounded flex flex-col items-center text-center relative group cursor-pointer hover:bg-slate-600 transition-colors shadow-lg justify-between min-h-[160px]" onClick={() => buyItem(item, runState.shopInventory.indexOf(item), 'NORMAL')} onContextMenu={(e) => handleContextMenu(e, item, 'PACK', false)} onTouchStart={() => handleTouchStart(item, 'PACK', false)} onTouchEnd={handleTouchEnd}>
                                  <div className="absolute top-1 left-1 text-[8px] font-bold text-orange-300 bg-orange-900/50 px-1.5 py-0.5 rounded">PACK</div>
                                  <div className="w-12 h-12 mt-4"><PixelSprite seed={item.icon} name={item.icon} className="w-full h-full"/></div>
                                  <div className="font-bold text-xs">{item.name}</div>
                                  <div className="text-[9px] text-gray-400 h-8 overflow-hidden leading-tight">{item.description}</div>
                                  <button disabled={runState.money < getPrice(item.price)} className={`w-full py-1 rounded font-bold text-xs ${runState.money >= getPrice(item.price) ? 'bg-orange-600 hover:bg-orange-500 shadow-md' : 'bg-gray-600 cursor-not-allowed'}`}>${getPrice(item.price)}</button>
                              </div>
                          ))}
                          
                          {shopSupporters.map((item) => (
                              <div key={item.id} className="bg-slate-700 p-2 rounded flex flex-col items-center text-center relative group cursor-pointer hover:bg-slate-600 transition-colors shadow-lg justify-between min-h-[160px]" onClick={() => buyItem(item, runState.shopInventory.indexOf(item), 'NORMAL')} onContextMenu={(e) => handleContextMenu(e, item, 'SUPPORTER', false)} onTouchStart={() => handleTouchStart(item, 'SUPPORTER', false)} onTouchEnd={handleTouchEnd}>
                                  <div className="absolute top-1 left-1 text-[8px] font-bold text-blue-300 bg-blue-900/50 px-1.5 py-0.5 rounded">SUPPORTER</div>
                                  <div className="w-12 h-12 mt-4"><PixelSprite seed={item.icon} name={item.icon} className="w-full h-full"/></div>
                                  <div className="font-bold text-xs">{item.name}</div>
                                  <div className="text-[9px] text-gray-400 h-8 overflow-hidden leading-tight">{item.description}</div>
                                  <button disabled={runState.money < getPrice(item.price)} className={`w-full py-1 rounded font-bold text-xs ${runState.money >= getPrice(item.price) ? 'bg-blue-600 hover:bg-blue-500 shadow-md' : 'bg-gray-600 cursor-not-allowed'}`}>${getPrice(item.price)}</button>
                              </div>
                          ))}
                          
                          {shopConsumables.map((item) => (
                              <div key={item.id} className="bg-slate-700 p-2 rounded flex flex-col items-center text-center relative group cursor-pointer hover:bg-slate-600 transition-colors shadow-lg justify-between min-h-[160px]" onClick={() => buyItem(item, runState.shopInventory.indexOf(item), 'NORMAL')} onContextMenu={(e) => handleContextMenu(e, item, 'CONSUMABLE', false)} onTouchStart={() => handleTouchStart(item, 'CONSUMABLE', false)} onTouchEnd={handleTouchEnd}>
                                  <div className="absolute top-1 left-1 text-[8px] font-bold text-purple-300 bg-purple-900/50 px-1.5 py-0.5 rounded">CARD</div>
                                  <div className="w-12 h-12 mt-4"><PixelSprite seed={item.icon} name={item.icon} className="w-full h-full"/></div>
                                  <div className="font-bold text-xs">{item.name}</div>
                                  <div className="text-[9px] text-gray-400 h-8 overflow-hidden leading-tight">{item.description}</div>
                                  <button disabled={runState.money < getPrice(item.price)} className={`w-full py-1 rounded font-bold text-xs ${runState.money >= getPrice(item.price) ? 'bg-purple-600 hover:bg-purple-500 shadow-md' : 'bg-gray-600 cursor-not-allowed'}`}>${getPrice(item.price)}</button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (phase === 'GAME_OVER' || phase === 'VICTORY') {
      return (
          <div className="flex flex-col h-full w-full bg-black text-white items-center justify-center p-8 font-mono text-center">
              <div className={`text-6xl font-bold mb-4 ${phase === 'VICTORY' ? 'text-yellow-400' : 'text-red-500'}`}>{phase === 'VICTORY' ? 'GRADUATED!' : 'EXPELLED'}</div>
              <p className="text-xl text-gray-400 mb-8">Reached Ante {runState.ante}</p>
              <button onClick={() => { storageService.clearPokerState(); onBack(); }} className="bg-white text-black px-8 py-3 font-bold rounded hover:bg-gray-200">Return to Menu</button>
          </div>
      );
  }

  const scoreDisplayPanel = animating && scoreAnimation ? (
      <div className={`w-full max-w-none sm:max-w-[520px] rounded-2xl border-2 px-3 py-2 text-center shadow-xl backdrop-blur-md transition-all duration-300 ${scoreAnimation.isDisallowed ? 'border-red-500 bg-red-950/85' : scoreAnimation.phase === 'total' ? 'border-yellow-400 bg-slate-900/90 shadow-[0_0_30px_rgba(250,204,21,0.22)]' : 'border-yellow-500/70 bg-slate-900/85'}`}>
          <div className="mb-1 text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">After School Poker</div>
          <div className={`mb-2 text-lg md:text-xl font-black tracking-wide break-words leading-tight ${scoreAnimation.isDisallowed ? 'text-red-200' : 'text-white'} ${scoreAnimation.phase === 'hand' ? 'animate-pulse' : ''}`}>
              {scoreAnimation.handName}
          </div>
          {!scoreAnimation.isDisallowed && scoreBreakdown.length > 0 && (
              <div className="mb-2 max-h-28 overflow-y-auto rounded-xl border border-slate-700 bg-black/25 px-2 py-1.5 text-left custom-scrollbar">
                  <div className="mb-1 text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Breakdown</div>
                  <div className="space-y-1">
                      {scoreBreakdown.slice(0, revealedBreakdownCount).map((entry) => (
                          <div key={entry.id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-1 text-[10px] animate-in fade-in slide-in-from-bottom-1">
                              <div className="min-w-0 flex-1 whitespace-normal break-words font-bold text-slate-100 leading-tight">{entry.label}</div>
                              <div className="flex shrink-0 items-center gap-1.5 font-black text-right">
                                  {entry.chipsDelta !== undefined && <span className="text-cyan-300">+{entry.chipsDelta}</span>}
                                  {entry.multDelta !== undefined && <span className="text-rose-300">+{entry.multDelta}M</span>}
                                  {entry.multFactor !== undefined && <span className="text-yellow-300">x{entry.multFactor}</span>}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
          <div className="flex items-center justify-center gap-2 md:gap-3">
              <div className={`min-w-[96px] rounded-xl border px-3 py-2 transition-all duration-200 ${scoreAnimation.phase === 'chips' ? 'border-cyan-300 bg-cyan-500/15 scale-105' : 'border-slate-700 bg-black/25'}`}>
                  <div className="text-[9px] font-black uppercase tracking-[0.25em] text-cyan-300">Chips</div>
                  <div className="text-xl md:text-2xl font-black text-cyan-300">{scoreAnimation.displayChips.toLocaleString()}</div>
              </div>
              <div className={`text-lg md:text-2xl font-black ${scoreAnimation.phase === 'mult' ? 'scale-125 text-white transition-transform duration-150' : 'text-slate-500'}`}>×</div>
              <div className={`min-w-[96px] rounded-xl border px-3 py-2 transition-all duration-200 ${scoreAnimation.phase === 'mult' ? 'border-rose-300 bg-rose-500/15 scale-105' : 'border-slate-700 bg-black/25'}`}>
                  <div className="text-[9px] font-black uppercase tracking-[0.25em] text-rose-300">Mult</div>
                  <div className="text-xl md:text-2xl font-black text-rose-300">{scoreAnimation.displayMult.toLocaleString()}</div>
              </div>
              <div className="min-w-[112px]">
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Score</div>
                  <div className={`text-2xl md:text-3xl font-black transition-all duration-200 ${scoreAnimation.phase === 'total' ? 'scale-110 text-yellow-300 drop-shadow-[0_0_16px_rgba(250,204,21,0.5)]' : 'text-yellow-500'}`}>
                      {scoreAnimation.displayTotal.toLocaleString()}
                  </div>
              </div>
          </div>
      </div>
  ) : (
      null
  );

  const handPreviewPanel = !animating && currentHandInfo ? (
      <div className={`w-[min(92vw,420px)] rounded-2xl border px-4 py-2 shadow-[0_0_15px_rgba(59,130,246,0.22)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 pointer-events-none ${currentHandInfo.isDisallowed ? 'border-red-500 bg-red-950/85' : 'border-blue-500/50 bg-slate-900/85'}`}>
          {currentHandInfo.isDisallowed && (
              <div className="mb-2 flex items-center justify-center gap-2 rounded-lg border border-red-500/60 bg-red-900/60 px-3 py-1 text-[10px] font-bold text-red-100">
                  <AlertTriangle size={12}/> 厳しい監視: 同じ役は無効です
              </div>
          )}
          <div className={`text-sm md:text-base font-bold tracking-wider flex items-center justify-center gap-2 ${currentHandInfo.isDisallowed ? 'text-red-300 line-through opacity-80' : 'text-white'}`}>
              {currentHandInfo.name}
              <span className={`${currentHandInfo.isDisallowed ? 'bg-gray-600' : 'bg-blue-600'} text-white text-[10px] px-1.5 py-0.5 rounded font-mono`}>Lv.{currentHandInfo.level}</span>
          </div>
      </div>
  ) : null;

  return (
    <div className="flex flex-col h-full w-full bg-green-900 text-white font-mono relative overflow-hidden">
        {renderInspectionModal()}
        {showRulesModal && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowRulesModal(false)}>
                <div className="bg-slate-800 border-4 border-yellow-500 rounded-lg p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto relative shadow-2xl custom-scrollbar" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowRulesModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                    <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center"><BookOpen className="mr-2"/> 遊び方 (How to Play)</h2>
                    <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-600 mb-6 text-sm space-y-4">
                        <div><h3 className="font-bold text-white mb-2 flex items-center"><Flag className="mr-2 text-red-400"/> ゲームの目的</h3><p className="text-gray-300">ポーカーの役を作ってスコアを稼げ！<span className="text-red-400 font-bold">目標スコア(Score Goal)</span>を達成しましょう。<br/>全8ステージ(Ante)をクリアすると卒業(ゲームクリア)です。</p></div>
                        <div><h3 className="font-bold text-white mb-2 flex items-center"><Calculator className="mr-2 text-blue-400"/> スコア計算</h3><div className="flex items-center gap-2 bg-black/40 p-2 rounded justify-center"><span className="text-blue-400 font-bold text-lg">チップ (Chips)</span><X size={16} className="text-gray-500"/><span className="text-red-500 font-bold text-lg">倍率 (Mult)</span><ArrowRight size={16} className="text-gray-500"/><span className="text-yellow-400 font-bold text-lg">スコア</span></div></div>
                        <div><h3 className="font-bold text-white mb-2 flex items-center"><ShoppingBag className="mr-2 text-yellow-400"/> 買い物</h3><p className="text-gray-300">ラウンド勝利後に獲得したお金でアイテムを購入できます。</p></div>
                    </div>
                    <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center border-t border-slate-600 pt-6"><HelpCircle className="mr-2"/> 役一覧 (Hand Types)</h2>
                    <div className="space-y-4 text-sm"><div className="grid grid-cols-1 gap-3">{['FLUSH_FIVE', 'FLUSH_HOUSE', 'FIVE_OF_A_KIND', 'ROYAL_FLUSH', 'STRAIGHT_FLUSH', 'FOUR_OF_A_KIND', 'FULL_HOUSE', 'FLUSH', 'STRAIGHT', 'THREE_OF_A_KIND', 'TWO_PAIR', 'PAIR', 'HIGH_CARD'].map((key) => { const def = POKER_HAND_LEVELS[key]; const example = HAND_EXAMPLES[key]; return (<div key={key} className="bg-slate-900 p-3 rounded-lg border border-slate-700"><div className="flex justify-between items-center mb-1"><span className="font-bold text-lg text-white">{def.name}</span><span className="text-blue-300 font-mono text-xs">{def.baseChips} <span className="text-gray-500">x</span> <span className="text-red-400">{def.baseMult}</span></span></div><div className="text-xs text-gray-400 mb-2">{example.desc}</div><div className="flex gap-1">{example.cards.map((c, i) => (<div key={i} className="bg-white text-black w-8 h-10 rounded-sm border border-gray-400 flex flex-col items-center justify-center shadow-sm"><div className={`text-[10px] font-bold leading-none ${getSuitColorClass(c.s)}`}>{c.r}</div><div className="scale-75">{getSuitIcon(c.s)}</div></div>))}</div></div>); })}</div></div>
                </div>
            </div>
        )}
        
        {showHandList && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowHandList(false)}>
                <div className="bg-slate-800 border-4 border-slate-600 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative shadow-2xl" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowHandList(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center"><BarChart3 className="mr-2"/> Hand Levels (役のレベル)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.entries(POKER_HAND_LEVELS).map(([key, def]) => { const level = runState.handLevels[key] || 1; const currentChips = def.baseChips + (level - 1) * 10; const currentMult = def.baseMult + (level - 1) * 1; return (<div key={key} className={`p-3 rounded border flex justify-between items-center ${key === lastHandScore?.name ? 'bg-yellow-900/50 border-yellow-500' : 'bg-slate-900 border-slate-700'}`}><div><div className="font-bold text-white">{def.name}</div><div className="text-xs text-blue-300">Lvl {level}</div></div><div className="text-right"><span className="text-blue-400 font-bold">{currentChips}</span><span className="text-gray-500 mx-1">X</span><span className="text-red-500 font-bold">{currentMult}</span></div></div>) })}</div>
                </div>
            </div>
        )}

        {showDeckList && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowDeckList(false)}>
                <div className="bg-slate-800 border-4 border-slate-600 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative shadow-2xl" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowDeckList(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center"><Layers className="mr-2"/> Deck List ({runState.deck.length} remaining)</h2>
                    <div className="space-y-4">{SUITS.map(suit => (<div key={suit} className="flex items-center bg-slate-900/50 p-2 rounded"><div className="w-10 flex-shrink-0 flex justify-center scale-150">{getSuitIcon(suit)}</div><div className="flex flex-wrap gap-1 flex-1 ml-4">{[...runState.deck, ...runState.hand, ...runState.discardPile].filter(c => c.suit === suit || c.enhancement === 'WILD').sort((a, b) => b.rank - a.rank).map((card) => { const isInDeck = runState.deck.some(c => c.id === card.id); return (<div key={card.id} className={`rounded p-1 flex flex-col items-center justify-center h-14 w-10 text-xs border-2 transition-all relative overflow-hidden cursor-pointer ${isInDeck ? 'bg-gray-100 border-gray-300 text-black shadow-md hover:scale-110' : 'bg-black border-gray-700 text-gray-600 opacity-60 grayscale'}`} onContextMenu={(e) => handleContextMenu(e, card, 'CARD', true)} onTouchStart={() => handleTouchStart(card, 'CARD', true)} onTouchEnd={handleTouchEnd}><div className={`font-bold text-sm ${!isInDeck ? 'text-gray-600' : (['HEART', 'DIAMOND'].includes(card.suit) ? 'text-red-600' : 'text-black')}`}>{getRankDisplay(card.rank)}</div><div className="scale-75 opacity-50">{getSuitIcon(card.suit, card.enhancement === 'WILD')}</div>{card.bonusChips > 0 && <div className="absolute top-0 right-0 text-[8px] bg-blue-500 text-white leading-none px-0.5 rounded-bl">+</div>}{card.multMultiplier > 1 && <div className="absolute top-0 left-0 text-[8px] bg-red-500 text-white leading-none px-0.5 rounded-br">x</div>}</div>); })}</div></div>))}</div>
                </div>
            </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-start p-2 md:p-4 bg-black/60 z-20 shadow-md shrink-0 gap-2">
            <div className="flex gap-2 w-full md:w-auto">
                <div className="flex flex-col items-start bg-slate-800 p-2 rounded border border-slate-600 flex-grow md:w-48 shadow-lg justify-center">
                    <div className="flex justify-between w-full md:block"><div className="text-[10px] text-red-400 font-bold uppercase">Score Goal</div><div className="text-[10px] text-gray-400 md:mt-1 block md:hidden">Curr: {runState.currentScore.toLocaleString()}</div></div>
                    <div className="text-xl md:text-3xl font-black text-white leading-tight">{runState.currentBlind.scoreGoal.toLocaleString()}</div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden"><div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${Math.min(100, (runState.currentScore / runState.currentBlind.scoreGoal) * 100)}%` }}></div></div>
                    <div className="text-xs text-gray-400 mt-1 hidden md:block">Current: {runState.currentScore.toLocaleString()}</div>
                </div>
                <div className="bg-slate-800 p-2 rounded border border-yellow-500 flex flex-col items-center justify-center w-20 md:hidden shrink-0"><div className="text-[10px] text-yellow-400 uppercase">Money</div><div className="text-lg font-bold text-yellow-400">${runState.money}</div></div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
                <div className="flex gap-2">
                    <button onClick={() => { setShowRulesModal(true); audioService.playSound('select'); }} className="bg-slate-700 hover:bg-slate-600 p-1 md:p-2 rounded border border-slate-500 text-white flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14"><HelpCircle size={18} className="md:w-5 md:h-5 text-yellow-400"/><span className="text-[9px] md:text-[10px] leading-none mt-1">Rules</span></button>
                    <button onClick={() => { setShowDeckList(true); audioService.playSound('select'); }} className="bg-slate-700 hover:bg-slate-600 p-1 md:p-2 rounded border border-slate-500 text-white flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14"><Layers size={18} className="md:w-5 md:h-5"/><span className="text-[9px] md:text-[10px] leading-none mt-1">Deck</span></button>
                    <button onClick={() => { setShowHandList(true); audioService.playSound('select'); }} className="bg-slate-700 hover:bg-slate-600 p-1 md:p-2 rounded border border-slate-500 text-white flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14"><BarChart3 size={18} className="md:w-5 md:h-5"/><span className="text-[9px] md:text-[10px] leading-none mt-1">Levels</span></button>
                </div>
                <div className="flex gap-2">
                    <div className="bg-slate-800 p-1 md:p-2 rounded border border-blue-600 flex flex-col items-center w-14 md:w-20 justify-center"><div className="text-[9px] md:text-[10px] text-blue-400 uppercase">Hands</div><div className="text-base md:text-lg font-bold text-blue-100">{runState.handsRemaining}</div></div>
                    <div className="bg-slate-800 p-1 md:p-2 rounded border border-red-900 flex flex-col items-center w-14 md:w-20 justify-center"><div className="text-[9px] md:text-[10px] text-red-400 uppercase">Disc</div><div className="text-base md:text-lg font-bold text-red-100">{runState.discardsRemaining}</div></div>
                    <div className="bg-slate-800 p-2 rounded border border-yellow-500 hidden md:flex flex-col items-center w-20 justify-center"><div className="text-[10px] text-yellow-400 uppercase">Money</div><div className="text-lg font-bold text-yellow-400">${runState.money}</div></div>
                </div>
            </div>
        </div>

        <div className="w-full bg-black/40 border-b border-black/50 p-2 flex justify-between items-center z-10 shrink-0 min-h-[64px]">
            <div className="flex gap-2 items-center flex-1 justify-center">
                {runState.supporters.map((s, i) => (
                    <div 
                        key={i} 
                        className={`w-10 h-10 md:w-12 md:h-12 bg-slate-800 border-2 rounded flex items-center justify-center relative group cursor-pointer hover:bg-slate-700 transition-colors ${s.edition === 'POLYCHROME' ? 'border-yellow-400 animate-pulse' : s.edition === 'HOLOGRAPHIC' ? 'border-red-400' : s.edition === 'FOIL' ? 'border-blue-400' : 'border-slate-600'}`} 
                        onClick={() => setInspectedItem({ item: s, type: 'SUPPORTER', isOwned: true, index: i })} 
                        onContextMenu={(e) => handleContextMenu(e, s, 'SUPPORTER', true, i)} 
                        onTouchStart={() => handleTouchStart(s, 'SUPPORTER', true, i)} 
                        onTouchEnd={handleTouchEnd}
                    >
                        <PixelSprite seed={s.icon} name={s.icon} className="w-8 h-8"/>
                    </div>
                ))}
                {[...Array(Math.max(0, 5 - runState.supporters.length))].map((_, i) => (
                    <div key={`supporter-empty-${i}`} className="w-10 h-10 md:w-12 md:h-12 rounded border border-dashed border-slate-700/70 bg-slate-900/20" />
                ))}
            </div>
            <div className="flex gap-2 items-center border-l border-white/20 pl-2">
                {runState.consumables.map((c, i) => (<div key={i} className="w-10 h-10 md:w-12 md:h-12 bg-slate-800 border-2 border-purple-500 rounded flex items-center justify-center relative group cursor-pointer hover:scale-110 transition-transform" onClick={() => setInspectedItem({ item: c, type: 'CONSUMABLE', isOwned: true, index: i })} onContextMenu={(e) => handleContextMenu(e, c, 'CONSUMABLE', true, i)} onTouchStart={() => handleTouchStart(c, 'CONSUMABLE', true, i)} onTouchEnd={handleTouchEnd}><PixelSprite seed={c.icon} name={c.icon} className="w-8 h-8"/>{selectedConsumable === c && <div className="absolute inset-0 bg-white/30 rounded animate-pulse"></div>}</div>))}
                {[...Array(Math.max(0, 2 - runState.consumables.length))].map((_, i) => (
                    <div key={`consumable-empty-${i}`} className="w-10 h-10 md:w-12 md:h-12 rounded border border-dashed border-slate-700/70 bg-slate-900/20" />
                ))}
            </div>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center relative">
            {scoreDisplayPanel && (
                <div className="fixed inset-x-0 top-20 md:top-24 z-[90] flex justify-center px-3 pointer-events-none">
                    <div className="w-full max-w-[min(96vw,560px)]">
                        {scoreDisplayPanel}
                    </div>
                </div>
            )}
            {handPreviewPanel && (
                <div className="absolute bottom-5 md:bottom-8 z-40 flex justify-center w-full px-4">
                    {handPreviewPanel}
                </div>
            )}
            {selectedConsumable && (
                <div className="absolute top-4 bg-purple-900/80 p-2 rounded text-center border border-purple-400 z-40">
                    <div className="text-sm font-bold text-purple-200">Using: {selectedConsumable.name}</div>
                    <div className="text-xs mb-2">Select cards then click USE</div>
                    <div className="flex gap-2 justify-center"><button onClick={applyTarot} className="bg-purple-600 px-3 py-1 rounded text-xs font-bold hover:bg-purple-500">USE</button><button onClick={() => { setSelectedConsumable(null); setSelectedCards([]); }} className="bg-gray-600 px-3 py-1 rounded text-xs hover:bg-gray-500">CANCEL</button></div>
                </div>
            )}
        </div>

        <div className="h-40 md:h-56 w-full flex justify-center items-end pb-4 gap-[-20px] touch-none select-none shrink-0" onPointerLeave={handlePointerUp} onPointerUp={handlePointerUp} onPointerMove={handlePointerMove}>
            {runState.hand.map((card, idx) => {
                const isSelected = selectedCards.includes(card.id);
                return (
                    <div 
                        key={card.id} data-card-id={card.id} onPointerDown={(e) => handlePointerDown(e, card.id)} onContextMenu={(e) => handleContextMenu(e, card, 'CARD', true)} onTouchStart={() => handleTouchStart(card, 'CARD', true)} onTouchEnd={handleTouchEnd}
                        className={`w-20 h-32 md:w-28 md:h-40 rounded-lg border-2 shadow-xl flex flex-col items-center justify-between p-2 cursor-pointer transition-transform duration-200 -ml-4 first:ml-0 relative ${isSelected ? '-translate-y-6 z-20 border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-400 hover:-translate-y-2 z-10'} ${selectedConsumable ? 'hover:ring-2 hover:ring-purple-400' : ''} ${card.enhancement === 'GOLD' ? 'bg-amber-100 border-amber-500' : ''} ${card.enhancement === 'STEEL' ? 'bg-slate-300 border-slate-500' : ''} ${card.enhancement === 'GLASS' ? 'bg-cyan-100/80 border-cyan-300 backdrop-blur-sm' : ''} ${!card.enhancement ? 'bg-gray-100' : ''}`}
                    >
                        {card.bonusChips > 0 && <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-30 border border-white">+{card.bonusChips}</div>}
                        {card.multMultiplier > 1 && <div className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-30 border border-white">x{card.multMultiplier}</div>}
                        <div className="flex justify-between w-full"><div className={`text-xl md:text-2xl font-bold ${['HEART', 'DIAMOND'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>{getRankDisplay(card.rank)}</div></div>
                        <div className="scale-150">{getSuitIcon(card.suit, card.enhancement === 'WILD')}</div>
                        <div className="self-end rotate-180 text-xl md:text-2xl font-bold opacity-30">{getRankDisplay(card.rank)}</div>
                        {card.enhancement && card.enhancement !== 'BONUS' && card.enhancement !== 'MULT' && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-wide bg-black/10 px-1 rounded">{card.enhancement}</div>}
                    </div>
                );
            })}
        </div>

        <div className="flex justify-center gap-4 my-2 z-30 shrink-0">
            <button onClick={sortHandRank} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center shadow-lg border-2 border-orange-800">{sortRankAsc ? <ArrowUpNarrowWide size={16} className="mr-1"/> : <ArrowDownWideNarrow size={16} className="mr-1"/>} Rank</button>
            <button onClick={sortHandSuit} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center shadow-lg border-2 border-blue-800"><LayoutList size={16} className="mr-1"/> Suit</button>
        </div>

        <div className="bg-slate-800 p-2 md:p-4 flex justify-center gap-4 z-20 shadow-up shrink-0">
            <button onClick={playHand} disabled={animating || selectedCards.length === 0} className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-bold py-2 px-8 rounded-lg text-lg md:text-xl shadow-lg border-b-4 border-orange-800 active:border-0 active:translate-y-1 transition-all">PLAY HAND</button>
            <button onClick={discardHand} disabled={animating || selectedCards.length === 0 || runState.discardsRemaining <= 0} className="bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg text-sm md:text-base shadow-lg border-b-4 border-red-900 active:border-0 active:translate-y-1 transition-all">DISCARD</button>
        </div>
    </div>
  );
};

export default PokerGameScreen;
