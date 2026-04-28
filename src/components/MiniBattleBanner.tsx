import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Sword } from 'lucide-react';
import { CARDS_LIBRARY, CHARACTERS, ENEMY_LIBRARY } from '../constants';
import { Card as BattleCard, CardType, Character } from '../types';
import EnemyIllustration from './EnemyIllustration';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { getCardIllustrationPaths } from '../utils/cardIllustration';
import { synthesizeCards } from '../utils/cardUtils';

interface MiniBattleBannerProps {
  streak: number;
}

interface FinisherCardView {
  id: string;
  name: string;
  damageLabel: string;
}

interface CutInSourceCard {
  id: string;
  name: string;
  card: BattleCard;
}

interface CutInDisplayCard {
  id: string;
  name: string;
  artTokens: string[];
}

type CutInLayout = 'stack_left' | 'stack_right' | 'strips' | 'grid' | 'tiles' | 'bars';

const MAX_CUTIN_CARDS = 8;
const ENEMY_POOL = Object.values(ENEMY_LIBRARY);
const FINISHER_CARDS: FinisherCardView[] = Object.entries(CARDS_LIBRARY)
  .filter(([, card]) => card.type === CardType.ATTACK)
  .map(([id, card]) => ({
    id,
    name: card.name,
    damageLabel: card.damage ? `${card.damage} DMG` : 'FINISH',
  }));

const CUTIN_LAYOUTS: CutInLayout[] = ['stack_left', 'stack_right', 'strips', 'grid', 'tiles', 'bars'];

const buildPanelDelays = (count: number) => {
  const delayStepMs = 90 + Math.floor(Math.random() * 70);
  const delays: number[] = [];
  let current = 0;
  for (let i = 0; i < count; i++) {
    current += delayStepMs + Math.floor(Math.random() * 50);
    delays.push(current);
  }
  return delays;
};

const buildCutInDisplayCards = (sources: CutInSourceCard[]): CutInDisplayCard[] => {
  const displays: CutInDisplayCard[] = [];
  let cumulative: BattleCard | null = null;

  sources.forEach((source, index) => {
    cumulative = cumulative ? synthesizeCards(cumulative, source.card) : source.card;
    displays.push({
      id: `${cumulative.id}-${index}`,
      name: cumulative.name,
      artTokens: toIllustrationTokens(cumulative),
    });
  });

  return displays;
};

const pickRandom = <T,>(items: T[], exclude?: T): T => {
  if (items.length === 0) throw new Error('pickRandom requires at least one item');
  if (items.length === 1) return items[0];
  let candidate = items[Math.floor(Math.random() * items.length)];
  while (exclude !== undefined && candidate === exclude) {
    candidate = items[Math.floor(Math.random() * items.length)];
  }
  return candidate;
};

const toIllustrationTokens = (card: BattleCard): string[] => {
  if (card.illustrationRefs && card.illustrationRefs.length > 0) {
    return card.illustrationRefs.filter(Boolean).slice(0, MAX_CUTIN_CARDS);
  }
  const enemyNames = [
    ...(card.enemyIllustrationNames || []),
    ...(card.enemyIllustrationName ? [card.enemyIllustrationName] : []),
  ].filter(Boolean) as string[];
  if (enemyNames.length > 0) return [`enemy:${enemyNames[0]}`];
  if (card.capture && card.textureRef && !card.textureRef.includes('|')) return [`enemy:${card.textureRef}`];
  if (card.textureRef) return [`pixel:${card.textureRef}`];
  return [`card:${card.name}`];
};

const CutInArtToken: React.FC<{ token: string; fallbackName: string }> = ({ token, fallbackName }) => {
  const [pathIndex, setPathIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const mode = token.startsWith('enemy:') ? 'enemy' : token.startsWith('pixel:') ? 'pixel' : 'card';
  const tokenValue = token.includes(':') ? token.split(':').slice(1).join(':') : token;
  const imagePaths = useMemo(
    () => getCardIllustrationPaths(tokenValue, tokenValue, [fallbackName]),
    [fallbackName, tokenValue]
  );

  useEffect(() => {
    setPathIndex(0);
    setFailed(false);
  }, [token, fallbackName]);

  if (mode === 'enemy') {
    return <EnemyIllustration name={tokenValue} seed={`${fallbackName}-${tokenValue}`} className="h-full w-full" size={16} />;
  }

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400/25 via-rose-500/25 to-cyan-400/20 px-2 text-center text-[10px] font-black text-white">
        {mode === 'pixel' ? tokenValue.split('|')[0] : fallbackName}
      </div>
    );
  }

  return (
    <img
      src={imagePaths[pathIndex]}
      alt={fallbackName}
      className="h-full w-full object-cover"
      draggable={false}
      onError={() => {
        const nextIndex = pathIndex + 1;
        if (nextIndex < imagePaths.length) {
          setPathIndex(nextIndex);
          return;
        }
        setFailed(true);
      }}
    />
  );
};

const CardCutInArt: React.FC<{ card: CutInDisplayCard }> = ({ card }) => {
  const tokens = card.artTokens.length > 0 ? card.artTokens.slice(0, 4) : [`card:${card.name}`];
  if (tokens.length === 1) {
    return <CutInArtToken token={tokens[0]} fallbackName={card.name} />;
  }

  const cols = tokens.length >= 4 ? 2 : tokens.length === 3 ? 2 : 2;
  return (
    <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {tokens.map((token, index) => (
        <div key={`${token}-${index}`} className="overflow-hidden border border-black/10">
          <CutInArtToken token={token} fallbackName={card.name} />
        </div>
      ))}
    </div>
  );
};

const MiniBattleFinisherOverlay: React.FC<{
  cards: CutInDisplayCard[];
  layout: CutInLayout;
  finisherCard: FinisherCardView | null;
  explosionDelayMs: number;
}> = ({ cards, layout, finisherCard, explosionDelayMs }) => {
  const count = Math.max(cards.length, 1);
  const panelDirections = useMemo(() => {
    const dirs: Array<'left' | 'right' | 'up' | 'down'> = [];
    const base: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down'];
    for (let i = 0; i < count; i++) {
      dirs.push(base[i % base.length]);
    }
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    return dirs;
  }, [count, cards]);
  const latestDisplayName = cards[cards.length - 1]?.name || finisherCard?.name || 'Special';

  const panelAnimationClass = (index: number) => {
    const dir = panelDirections[index % panelDirections.length];
    if (dir === 'left') return 'mini-finish-stack-left';
    if (dir === 'right') return 'mini-finish-stack-right';
    if (dir === 'up') return 'mini-finish-stack-up';
    return 'mini-finish-stack-down';
  };

  const renderStack = (align: 'left' | 'right') => (
    <div className="absolute inset-0 flex items-center">
      {cards.map((card, index) => {
        const width = Math.max(18, 38 - index * 2.5);
        const offset = align === 'left' ? 5 + index * 7 : 95 - width - index * 7;
        return (
          <div
            key={`${card.id}-${index}`}
            className={`absolute top-[10%] h-[80%] overflow-hidden rounded-lg border border-amber-200/45 shadow-[0_0_26px_rgba(251,191,36,0.24)] ${panelAnimationClass(index)}`}
            style={{
              left: `${offset}%`,
              width: `${width}%`,
              animationDelay: `${index * 70}ms`,
              zIndex: 10 + index,
            }}
          >
            <CardCutInArt card={card} />
            <div className="absolute inset-x-0 bottom-0 bg-black/72 px-1.5 py-0.5 text-[8px] font-black text-white truncate">
              {card.name}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderStrips = () => {
    const stripWidth = 100 / count;
    return (
      <div className="absolute inset-0">
        {cards.map((card, index) => (
          <div
            key={`${card.id}-${index}`}
            className={`absolute top-0 h-full overflow-hidden border-x border-white/10 ${index % 2 === 0 ? 'mini-finish-multi-up' : 'mini-finish-multi-down'}`}
            style={{
              left: `${stripWidth * index}%`,
              width: `${stripWidth + 0.2}%`,
              animationDelay: `${index * 55}ms`,
            }}
          >
            <CardCutInArt card={card} />
            <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[7px] font-black text-white truncate">
              {card.name}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGrid = () => {
    const cols = Math.min(4, Math.ceil(Math.sqrt(count)));
    const rows = Math.ceil(count / cols);
    return (
      <div className="absolute inset-[10%] grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
        {cards.map((card, index) => (
          <div
            key={`${card.id}-${index}`}
            className={`overflow-hidden rounded-md border border-white/15 shadow-[0_0_18px_rgba(255,255,255,0.08)] ${panelAnimationClass(index)}`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <CardCutInArt card={card} />
            <div className="absolute inset-x-0 bottom-0 bg-black/65 px-1 py-0.5 text-[7px] font-black text-white truncate">
              {card.name}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTiles = () => {
    const cols = Math.max(2, Math.ceil(Math.sqrt(count)));
    const rows = Math.ceil(count / cols);
    const width = 100 / cols;
    const height = 100 / rows;
    return (
      <div className="absolute inset-0">
        {cards.map((card, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          return (
            <div
              key={`${card.id}-${index}`}
              className={`absolute overflow-hidden border border-black/20 ${index % 2 === 0 ? 'mini-finish-multi-left' : 'mini-finish-multi-right'}`}
              style={{
                left: `${col * width}%`,
                top: `${row * height}%`,
                width: `${width + 0.3}%`,
                height: `${height + 0.3}%`,
                animationDelay: `${index * 45}ms`,
              }}
            >
              <CardCutInArt card={card} />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[7px] font-black text-white truncate">
                {card.name}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderBars = () => {
    const barCount = Math.max(3, Math.min(MAX_CUTIN_CARDS, count));
    return (
      <div className="absolute inset-0 flex items-stretch gap-[2px] px-2 py-1">
        {Array.from({ length: barCount }).map((_, index) => {
          const card = cards[index % cards.length];
          return (
            <div
              key={`${card.id}-${index}`}
              className={`relative flex-1 overflow-hidden rounded-sm border border-white/10 ${index % 2 === 0 ? 'mini-finish-stack-up' : 'mini-finish-stack-down'}`}
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <CardCutInArt card={card} />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[7px] font-black text-white truncate">
                {card.name}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLayout = () => {
    switch (layout) {
      case 'stack_left':
        return renderStack('left');
      case 'stack_right':
        return renderStack('right');
      case 'strips':
        return renderStrips();
      case 'grid':
        return renderGrid();
      case 'tiles':
        return renderTiles();
      case 'bars':
      default:
        return renderBars();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/36 to-black/82 mini-finish-dim" />
      <div className="absolute inset-[6%] overflow-hidden rounded-xl border-2 border-orange-300/55 bg-black/25 shadow-[0_0_36px_rgba(251,146,60,0.32)] mini-finish-cutin">
        {renderLayout()}
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.18)_46%,transparent_56%)] opacity-70" />
      </div>
      <div className="absolute left-3 top-2 z-30 mini-finish-title">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-300/80">Finisher</div>
        <div className="max-w-[48vw] truncate text-sm font-black text-white md:text-base">{latestDisplayName}</div>
      </div>
      <div className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
        <div
          className="h-10 w-10 rounded-full bg-orange-500/90 shadow-[0_0_46px_rgba(249,115,22,0.8)] mini-finish-explosion md:h-14 md:w-14"
          style={{ animationDelay: `${explosionDelayMs}ms`, animationFillMode: 'both' }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-200/90 mini-finish-shockwave md:h-24 md:w-24"
          style={{ animationDelay: `${explosionDelayMs}ms`, animationFillMode: 'both' }}
        />
      </div>
      <style>{`
        @keyframes mini-finish-cutin {
          0% { transform: scale(0.88); opacity: 0; }
          16% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes mini-finish-stack-left {
          0% { transform: translateX(-22%) scale(0.92); opacity: 0; }
          18% { transform: translateX(2%) scale(1); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes mini-finish-stack-right {
          0% { transform: translateX(22%) scale(0.92); opacity: 0; }
          18% { transform: translateX(-2%) scale(1); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes mini-finish-stack-up {
          0% { transform: translateY(-20%) scale(0.9); opacity: 0; }
          18% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes mini-finish-stack-down {
          0% { transform: translateY(20%) scale(0.9); opacity: 0; }
          18% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes mini-finish-multi-left {
          0% { transform: translateX(-100%); opacity: 0; }
          22% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes mini-finish-multi-right {
          0% { transform: translateX(100%); opacity: 0; }
          22% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes mini-finish-multi-up {
          0% { transform: translateY(-100%); opacity: 0; }
          22% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes mini-finish-multi-down {
          0% { transform: translateY(100%); opacity: 0; }
          22% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes mini-finish-dim {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes mini-finish-title {
          0% { transform: translateY(-8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes mini-finish-explosion {
          0% { transform: scale(0.2); opacity: 1; }
          52% { transform: scale(1.05); opacity: 0.9; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes mini-finish-shockwave {
          0% { transform: translate(-50%, -50%) scale(0.24); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0; }
        }
        .mini-finish-cutin { animation: mini-finish-cutin 0.48s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-stack-left { animation: mini-finish-stack-left 0.52s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-stack-right { animation: mini-finish-stack-right 0.52s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-stack-up { animation: mini-finish-stack-up 0.52s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-stack-down { animation: mini-finish-stack-down 0.52s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-multi-left { animation: mini-finish-multi-left 0.48s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-multi-right { animation: mini-finish-multi-right 0.48s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-multi-up { animation: mini-finish-multi-up 0.48s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-multi-down { animation: mini-finish-multi-down 0.48s cubic-bezier(.2,.8,.2,1) forwards; }
        .mini-finish-dim { animation: mini-finish-dim 0.18s ease-out forwards; }
        .mini-finish-title { animation: mini-finish-title 0.35s ease-out forwards; }
        .mini-finish-explosion { animation: mini-finish-explosion 0.85s ease-out forwards; }
        .mini-finish-shockwave { animation: mini-finish-shockwave 0.85s ease-out forwards; }
      `}</style>
    </div>
  );
};

const MiniBattleBanner: React.FC<MiniBattleBannerProps> = ({ streak }) => {
  const [hero, setHero] = useState<Character>(() => pickRandom(CHARACTERS));
  const [enemy, setEnemy] = useState(() => pickRandom(ENEMY_POOL));
  const [effectText, setEffectText] = useState('Ready');
  const [enemyHpPct, setEnemyHpPct] = useState(100);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isEnemyHit, setIsEnemyHit] = useState(false);
  const [finisherCard, setFinisherCard] = useState<FinisherCardView | null>(null);
  const [cutInSourceCards, setCutInSourceCards] = useState<CutInSourceCard[]>([]);
  const [cutInDisplayCards, setCutInDisplayCards] = useState<CutInDisplayCard[]>([]);
  const [cutInLayout, setCutInLayout] = useState<CutInLayout>('stack_left');
  const [explosionDelayMs, setExplosionDelayMs] = useState(680);
  const [latestFinisherName, setLatestFinisherName] = useState('');
  const timeoutsRef = useRef<number[]>([]);
  const prevStreakRef = useRef(0);

  const enemySeed = useMemo(() => `${enemy.name}-${streak}`, [enemy.name, streak]);
  const unlockedCutInCards = useMemo(() => {
    const unlockedNames = new Set(storageService.getUnlockedCards().map((name) => name.trim()));
    return Object.entries(CARDS_LIBRARY)
      .filter(([, card]) => unlockedNames.has(card.name))
      .map(([id, card]) => ({ id, name: card.name, card: { ...card, id } as BattleCard }));
  }, []);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (streak <= 0) {
      if (prevStreakRef.current === 0) {
        return;
      }
      prevStreakRef.current = 0;
      setHero(pickRandom(CHARACTERS));
      setEnemy(pickRandom(ENEMY_POOL));
      setEnemyHpPct(100);
      setEffectText('Ready');
      setFinisherCard(null);
      setCutInSourceCards([]);
      setCutInDisplayCards([]);
      setCutInLayout('stack_left');
      setExplosionDelayMs(680);
      setLatestFinisherName('');
      setIsAttacking(false);
      setIsEnemyHit(false);
      return;
    }

    if (streak <= prevStreakRef.current) return;
    prevStreakRef.current = streak;

    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current = [];

    const finisher = streak % 5 === 0;
    setIsAttacking(true);
    setIsEnemyHit(true);

    if (finisher) {
      const nextCard = pickRandom(FINISHER_CARDS);
      setFinisherCard(nextCard);
      let nextDisplayCount = cutInDisplayCards.length;
      let explosionDelay = 680;
      if (unlockedCutInCards.length > 0) {
        const targetCount = Math.min(MAX_CUTIN_CARDS, Math.floor(streak / 5));
        const retained = cutInSourceCards.slice(0, targetCount);
        const candidatePool = unlockedCutInCards.filter((card) => !retained.some((saved) => saved.id === card.id));
        const nextCardForHistory = pickRandom(candidatePool.length > 0 ? candidatePool : unlockedCutInCards);
        const nextSources = targetCount <= 0
          ? []
          : retained.length < targetCount
          ? [...retained, nextCardForHistory]
          : [...retained.slice(1), nextCardForHistory];
        setCutInSourceCards(nextSources);
        const nextDisplays = buildCutInDisplayCards(nextSources);
        setCutInDisplayCards(nextDisplays);
        nextDisplayCount = nextDisplays.length;
        setCutInLayout(pickRandom(CUTIN_LAYOUTS));
        setLatestFinisherName(nextDisplays[nextDisplays.length - 1]?.name || nextCard.name);

        const panelDelays = buildPanelDelays(nextDisplayCount);
        for (let i = 0; i < nextDisplayCount; i++) {
          timeoutsRef.current.push(window.setTimeout(() => {
            audioService.playSound('finisher_slash');
          }, panelDelays[i] ?? 0));
        }
        explosionDelay = Math.max(680, (panelDelays[panelDelays.length - 1] || 0) + 220);
        timeoutsRef.current.push(window.setTimeout(() => {
          audioService.playSound('finisher_explosion');
        }, explosionDelay));
      }
      setExplosionDelayMs(explosionDelay);
      setEnemyHpPct(0);
      setEffectText(`${nextCard.name}!`);

      timeoutsRef.current.push(window.setTimeout(() => {
        setEnemy(pickRandom(ENEMY_POOL, enemy));
        setEnemyHpPct(100);
        setFinisherCard(null);
        setEffectText('Enemy Change');
      }, explosionDelay + 420));
    } else {
      const nextHp = Math.max(10, 100 - ((streak % 5) * 20));
      setEnemyHpPct(nextHp);
      setEffectText('Hit!');
      audioService.playSound('attack');
    }

    timeoutsRef.current.push(window.setTimeout(() => setIsAttacking(false), 260));
    timeoutsRef.current.push(window.setTimeout(() => setIsEnemyHit(false), 360));
    timeoutsRef.current.push(window.setTimeout(() => {
      if (!finisher) setEffectText('Ready');
    }, 700));
  }, [cutInDisplayCards.length, cutInSourceCards, enemy, streak, unlockedCutInCards]);

  return (
    <div className="h-24 md:h-28 border-b border-emerald-900/60 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-3 py-2 overflow-hidden">
      <div className="relative h-full rounded-xl border border-emerald-900/60 bg-black/35 px-3 py-2">
        {finisherCard && cutInDisplayCards.length > 0 && (
          <MiniBattleFinisherOverlay cards={cutInDisplayCards} layout={cutInLayout} finisherCard={finisherCard} explosionDelayMs={explosionDelayMs} />
        )}
        <div className="mb-1 flex items-center justify-between text-[9px] md:text-[10px] font-black tracking-[0.24em] text-emerald-300/80">
          <span className="max-w-[42%] truncate text-sky-200">{hero.name}</span>
          <span className="max-w-[42%] truncate text-right text-rose-200">{enemy.name}</span>
        </div>
        <div className="grid h-[calc(100%-18px)] grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className={`flex items-center gap-2 transition-transform duration-200 ${isAttacking ? 'translate-x-2 scale-105' : ''}`}>
            <div className="h-12 w-12 md:h-14 md:w-14 overflow-hidden rounded-full border-2 border-sky-400/70 bg-sky-950/40 shadow-[0_0_18px_rgba(56,189,248,0.25)]">
              <img src={hero.imageData} alt={hero.name} className="h-full w-full object-cover" draggable={false} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[10px] text-sky-300/75">
                {latestFinisherName || 'FINISHER READY'}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-1 text-[10px] font-black text-amber-300">
              {finisherCard ? <Sparkles size={12} /> : <Sword size={12} />}
              <span>{effectText}</span>
            </div>
            {finisherCard && (
              <div className="rounded-full border border-amber-400/50 bg-amber-300/15 px-2 py-0.5 text-[9px] font-bold text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.18)]">
                {finisherCard.name} / {finisherCard.damageLabel}
              </div>
            )}
          </div>

          <div className={`flex items-center justify-end gap-2 transition-transform duration-200 ${isEnemyHit ? 'translate-x-1 scale-[0.98]' : ''}`}>
            <div className="min-w-0 text-right">
              <div className="mt-1 h-2 w-20 md:w-28 overflow-hidden rounded-full border border-rose-400/30 bg-rose-950/60">
                <div
                  className={`h-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-300 ${enemyHpPct === 0 ? 'opacity-40' : ''}`}
                  style={{ width: `${enemyHpPct}%` }}
                />
              </div>
            </div>
            <div className="h-12 w-12 md:h-14 md:w-14 overflow-hidden rounded-full border-2 border-rose-400/70 bg-rose-950/40 shadow-[0_0_18px_rgba(251,113,133,0.25)]">
              <EnemyIllustration name={enemy.name} seed={enemySeed} className="h-full w-full" size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniBattleBanner;
