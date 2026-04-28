import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card as CardType, CardType as EnumCardType, LanguageMode } from '../types';
import PixelSprite from './PixelSprite';
import EnemyIllustration from './EnemyIllustration';
import { trans } from '../utils/textUtils';
import { getCardIllustrationPaths } from '../utils/cardIllustration';
import { getStatusCategoryLabel, getStatusCategoryClass } from '../utils/cardUtils';

interface CardProps {
  card: CardType;
  onClick: () => void;
  disabled: boolean;
  onInspect?: (card: CardType) => void;
  languageMode?: LanguageMode;
}

export const KEYWORD_DEFINITIONS: Record<string, { title: string; desc: string }> = {
  EXHAUST: { title: '廃棄', desc: '使用後、この戦闘中はデッキから除外される。' },
  STRENGTH: { title: 'ムキムキ', desc: '攻撃ダメージがその数値分アップ！' },
  VULNERABLE: { title: 'びくびく', desc: '攻撃から受けるダメージが50%増えちゃう！' },
  WEAK: { title: 'へろへろ', desc: '攻撃で与えるダメージが25%減っちゃう...' },
  BLOCK: { title: 'ブロック', desc: '次のターンまで、敵からのダメージを防ぐ。' },
  DRAW: { title: 'ドロー', desc: '山札からカードを引く。' },
};

const MAX_ILLUSTRATION_REFS = 8;

const extractCompositeIllustrationRefs = (card: CardType): string[] => {
  if (card.illustrationRefs && card.illustrationRefs.length > 0) {
    return card.illustrationRefs.filter(Boolean).slice(0, MAX_ILLUSTRATION_REFS);
  }

  const enemyNames = [
    ...(card.enemyIllustrationNames || []),
    ...(card.enemyIllustrationName ? [card.enemyIllustrationName] : []),
  ].filter(Boolean) as string[];
  if (enemyNames.length > 0) return [`enemy:${enemyNames[0]}`];

  if (card.capture && card.textureRef && !card.textureRef.includes('|')) {
    return [`enemy:${card.textureRef}`];
  }

  if (card.name) return [`card:${card.name}`];
  if (card.textureRef) return [`pixel:${card.textureRef}`];
  return [];
};

const CompositeArtPiece: React.FC<{ refToken: string; seed: string; languageMode: LanguageMode }> = ({ refToken, seed, languageMode }) => {
  const [failed, setFailed] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setFailed(false);
    setImageIndex(0);
  }, [refToken]);

  if (refToken.startsWith('enemy:')) {
    const name = refToken.substring('enemy:'.length);
    return <EnemyIllustration name={name} seed={seed} className="w-full h-full" size={16} />;
  }

  if (refToken.startsWith('pixel:')) {
    const spriteName = refToken.substring('pixel:'.length);
    return <PixelSprite seed={seed} name={spriteName} className="w-full h-full opacity-90" size={16} />;
  }

  const cardName = refToken.startsWith('card:') ? refToken.substring('card:'.length) : refToken;
  const candidates = getCardIllustrationPaths(seed, trans(cardName, languageMode), [cardName]);
  if (!failed && imageIndex < candidates.length) {
    return (
      <img
        src={candidates[imageIndex]}
        alt={cardName}
        className="w-full h-full object-cover opacity-95"
        onError={() => {
          const next = imageIndex + 1;
          if (next < candidates.length) setImageIndex(next);
          else setFailed(true);
        }}
      />
    );
  }

  return <div className="w-full h-full bg-black/20" />;
};

const Card: React.FC<CardProps> = ({ card, onClick, disabled, onInspect, languageMode = 'JAPANESE' }) => {
  const longPressTimer = useRef<any>(null);
  const isLongPressActive = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const translatedCardName = trans(card.name, languageMode);
  const imageCandidates = useMemo(
    () => getCardIllustrationPaths(card.id, translatedCardName, [card.name]),
    [card.id, card.name, translatedCardName]
  );

  const enemyIllustrationNames = useMemo(() => {
    const explicit = [
      ...(card.enemyIllustrationNames || []),
      ...(card.enemyIllustrationName ? [card.enemyIllustrationName] : []),
    ].filter(Boolean) as string[];
    if (explicit.length > 0) return Array.from(new Set(explicit));

    // Backward compatibility: old captured cards stored enemy name in textureRef.
    if (card.capture && card.textureRef && !card.textureRef.includes('|')) {
      return [card.textureRef];
    }

    return [];
  }, [card.capture, card.textureRef, card.enemyIllustrationName, card.enemyIllustrationNames]);

  const [imageIndex, setImageIndex] = useState(0);
  const compositeIllustrationRefs = useMemo(
    () => extractCompositeIllustrationRefs(card),
    [card]
  );

  useEffect(() => {
    setImageIndex(0);
  }, [card.id, card.name, translatedCardName]);

  const startLongPress = (e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    isLongPressActive.current = false;

    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    longPressTimer.current = setTimeout(() => {
      isLongPressActive.current = true;
      if (onInspect) onInspect(card);
    }, 700);
  };

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
    if (dist > 10) endLongPress();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleCardClick = () => {
    if (!isLongPressActive.current && !disabled) onClick();
  };

  const getTypeColor = (type: EnumCardType) => {
    switch (type) {
      case EnumCardType.ATTACK:
        return 'border-red-500 bg-red-900/95';
      case EnumCardType.SKILL:
        return 'border-blue-500 bg-blue-900/95';
      case EnumCardType.POWER:
        return 'border-yellow-500 bg-yellow-900/95';
      default:
        return 'border-gray-500 bg-gray-800';
    }
  };

  const getTypeText = (type: EnumCardType) => {
    switch (type) {
      case EnumCardType.ATTACK:
        return trans('攻撃', languageMode);
      case EnumCardType.SKILL:
        return trans('スキル', languageMode);
      case EnumCardType.POWER:
        return trans('パワー', languageMode);
      default:
        return trans('その他', languageMode);
    }
  };

  const renderCardArt = () => {
    if (compositeIllustrationRefs.length > 1) {
      const sliceWidth = `${100 / compositeIllustrationRefs.length}%`;
      return (
        <div className="w-full h-full flex overflow-hidden">
          {compositeIllustrationRefs.map((token, idx) => (
            <div key={`${token}-${idx}`} className="h-full border-r border-white/20 last:border-r-0" style={{ width: sliceWidth }}>
              <CompositeArtPiece refToken={token} seed={`${card.id}-mix-${idx}`} languageMode={languageMode} />
            </div>
          ))}
        </div>
      );
    }

    if (enemyIllustrationNames.length > 0) {
      return (
        <EnemyIllustration
          name={enemyIllustrationNames[0]}
          seed={`${card.id}-enemy`}
          aliases={enemyIllustrationNames.slice(1)}
          className="w-full h-full"
          size={16}
        />
      );
    }

    if (imageIndex < imageCandidates.length) {
      return (
        <img
          src={imageCandidates[imageIndex]}
          alt={translatedCardName}
          className="w-full h-full object-cover opacity-95 drop-shadow-md"
          onError={() => setImageIndex((prev) => prev + 1)}
        />
      );
    }

    if (card.textureRef) {
      return <PixelSprite seed={card.id} name={card.textureRef} className="w-full h-full opacity-90 drop-shadow-md" size={16} />;
    }

    return <div className="w-full h-full bg-black/20" />;
  };

  const renderDescription = () => {
    const desc = trans(card.description, languageMode);
    return <span className={card.upgraded ? 'text-green-300 font-bold' : ''}>{desc}</span>;
  };

  const displayName = translatedCardName + (card.upgraded ? '+' : '');
  const needsScroll = displayName.length > 6;
  const statusCategoryLabel = getStatusCategoryLabel(card);
  const statusCategoryClass = getStatusCategoryClass(card);

  return (
    <div
      onClick={handleCardClick}
      onPointerDown={startLongPress}
      onPointerUp={endLongPress}
      onPointerLeave={endLongPress}
      onPointerMove={handlePointerMove}
      onContextMenu={handleContextMenu}
      className={`
        relative w-32 h-48 border-[3px] rounded-lg p-2 flex flex-col overflow-visible
        transition-all duration-200 select-none group touch-manipulation
        ${getTypeColor(card.type)}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer hover:-translate-y-4 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:z-50'}
      `}
    >
      {/* Header: fixed */}
      <div className="flex items-center relative z-30 mb-1 h-6 overflow-hidden shrink-0">
        <div className={`w-6 h-6 flex items-center justify-center rounded text-[11px] border border-white font-bold shrink-0 shadow-sm mr-1 ${card.upgraded && card.cost < 99 ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
          {card.cost}
        </div>

        {needsScroll ? (
          <div className="flex-1 overflow-hidden relative text-[13px] font-bold drop-shadow-md min-w-0">
            <div className={`flex w-max animate-marquee-scroll ${card.upgraded ? 'text-green-400' : 'text-white'}`}>
              <span className="pr-4">{displayName}</span>
              <span className="pr-4">{displayName}</span>
            </div>
          </div>
        ) : (
          <span className={`text-[13px] font-bold truncate flex-1 drop-shadow-md ${card.upgraded ? 'text-green-400' : 'text-white'}`}>
            {displayName}
          </span>
        )}
      </div>

      {(card.type === EnumCardType.STATUS || card.type === EnumCardType.CURSE) && statusCategoryLabel && (
        <div className={`mb-1 text-[10px] text-center rounded px-1 py-[1px] shrink-0 ${statusCategoryClass}`}>
          {statusCategoryLabel}
        </div>
      )}

      {/* Description: layer, bottom position */}
      <div className="absolute bottom-5 left-2 right-2 z-20 pointer-events-none">
        <div className="bg-black/75 p-1 rounded border border-white/10 backdrop-blur-[1px] w-full min-h-[42px] overflow-visible">
          <div className="text-[9px] text-white leading-tight text-left whitespace-pre-wrap break-words w-full font-bold">
            {renderDescription()}
          </div>
        </div>
      </div>

      {/* Art: position unchanged */}
      <div className="relative z-10 mb-1.5">
        <div className="w-[calc(100%+10px)] -ml-[5px] h-[68px] rounded-md border border-white/20 bg-black/35 overflow-hidden flex items-center justify-center">
          {renderCardArt()}
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <div className="text-[9px] text-center mt-0.5 text-white/60 font-mono tracking-tighter">{getTypeText(card.type)}</div>
      </div>
    </div>
  );
};

export default Card;
