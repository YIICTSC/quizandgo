import { AvatarConfig, AvatarHairType, normalizeAvatar } from '../avatar';
import { TOPDOWN_HAIR_RUNTIME, getHairSpriteFrame } from '../data/topdownHairCatalog';

type AvatarFaceDirection = 'front' | 'up' | 'down' | 'left' | 'right';
type AvatarExpression = 'normal' | 'happy' | 'sad';
type AvatarViewMode = 'portrait' | 'topdown';

type TopdownDirection = 'DOWN' | 'UP' | 'RIGHT' | 'LEFT';

const LEGACY_HAIR_STYLE_BY_TYPE: Record<string, string> = {
  short: 'korean_mash_soft',
  bangs: 'see_through_bang_midi',
  spike: 'short_spiky_active',
  bob: 'inner_curl_bob',
  curl: 'loose_perm_short',
  ponytail: 'ponytail_high_sporty',
  princess: 'hime_cut_modern',
  centerpart: 'comma_centerpart_clean',
  upbang: 'slick_back_modern',
  mash: 'korean_mash_heavy',
  slick: 'slick_back_modern',
  wolf: 'wolf_medium_shaggy',
  twoblock: 'two_block_fade_low',
};

const toTopdownDirection = (faceDirection: AvatarFaceDirection): TopdownDirection => {
  if (faceDirection === 'up') return 'UP';
  if (faceDirection === 'left') return 'LEFT';
  if (faceDirection === 'right') return 'RIGHT';
  return 'DOWN';
};

function TopDownHairLayer({ hairType, hairColor, skinColor, faceDirection }: {
  hairType: AvatarHairType;
  hairColor: string;
  skinColor: string;
  faceDirection: AvatarFaceDirection;
}) {
  const hairId = hairType === 'none'
    ? 'see_through_bang_short'
    : (TOPDOWN_HAIR_RUNTIME[hairType] ? hairType : LEGACY_HAIR_STYLE_BY_TYPE[hairType]) || 'korean_mash_soft';
  const runtime = TOPDOWN_HAIR_RUNTIME[hairId] || TOPDOWN_HAIR_RUNTIME.korean_mash_soft;
  const direction = toTopdownDirection(faceDirection);
  const frame = getHairSpriteFrame(runtime.id, direction);
  const swing = runtime.animation.frontSwayPx;
  const lag = runtime.animation.backLagPx;
  const styleSeed = runtime.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const topLift = 17 + (styleSeed % 7);
  const widthSpread = 28 + (styleSeed % 10);
  const templeDepth = 4 + (styleSeed % 6);
  const isCenterPart = runtime.id.includes('centerpart') || runtime.id.includes('comma');
  const hasBangs = runtime.id.includes('bang') || runtime.id.includes('mash');
  const hasCurl = runtime.id.includes('curl') || runtime.id.includes('perm');
  const hasTail = runtime.id.includes('tail') || runtime.id.includes('ponytail');
  const hasBraid = runtime.id.includes('braid');

  const baseY = direction === 'UP' ? 54 : 56;
  const rx = direction === 'LEFT' || direction === 'RIGHT' ? 26 + (styleSeed % 7) : widthSpread;
  const ry = direction === 'UP' ? 18 + (styleSeed % 7) : 18 + (styleSeed % 5);
  const sideSign = direction === 'RIGHT' ? 1 : direction === 'LEFT' ? -1 : 0;
  const crownY = baseY - ry - 2;
  const hairlineY = baseY + 2;
  const centerDip = hasBangs ? 7 : isCenterPart ? 10 : 5;

  return (
    <g data-hair-id={runtime.id} data-frame={`${frame.x},${frame.y},${frame.w},${frame.h}`}>
      <path
        d={[
          `M${64 - rx + 2} ${hairlineY}`,
          `C${64 - rx + 6} ${baseY - ry + 4} ${64 - Math.floor(rx * 0.72)} ${crownY} ${64} ${crownY - 1}`,
          `C${64 + Math.floor(rx * 0.72)} ${crownY} ${64 + rx - 6} ${baseY - ry + 4} ${64 + rx - 2} ${hairlineY}`,
          `C${64 + Math.floor(rx * 0.52)} ${baseY + centerDip} ${64 - Math.floor(rx * 0.52)} ${baseY + centerDip} ${64 - rx + 2} ${hairlineY}`,
          'Z',
        ].join(' ')}
        fill={hairColor}
      />
      <path
        d={`M${64 - widthSpread} ${58 + templeDepth} C${64 - widthSpread + 12} ${50 - topLift} ${64 + widthSpread - 12} ${50 - topLift} ${64 + widthSpread} ${58 + templeDepth}`}
        stroke={hairColor}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      {isCenterPart ? (
        <path d={`M64 ${46 - Math.floor(topLift / 3)} L64 58`} stroke={skinColor} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      ) : null}
      {hasBangs ? (
        <path d={`M${64 - widthSpread + 10} 58 C54 66 74 66 ${64 + widthSpread - 10} 58`} stroke={skinColor} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.68" />
      ) : null}
      {direction === 'DOWN' ? (
        <path d={`M34 58 C44 48 54 47 64 52 C74 47 84 48 94 58`} stroke={skinColor} strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.72" />
      ) : null}
      {direction === 'UP' ? (
        <path d={`M37 60 C46 70 82 70 91 60`} stroke={skinColor} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.45" />
      ) : null}
      {(direction === 'LEFT' || direction === 'RIGHT') ? (
        <path d={`M${64 + sideSign * 22} 52 C${64 + sideSign * 28} 64 ${64 + sideSign * 24} 73 ${64 + sideSign * 16} 80`} stroke={hairColor} strokeWidth={5} strokeLinecap="round" fill="none" opacity="0.92" />
      ) : null}
      {hasCurl ? (
        <>
          <circle cx={46} cy={54} r={4 + (styleSeed % 3)} fill={hairColor} opacity="0.88" />
          <circle cx={82} cy={56} r={4 + ((styleSeed + 1) % 3)} fill={hairColor} opacity="0.88" />
        </>
      ) : null}
      {hasBraid ? (
        <path d="M88 60 C95 66 95 82 86 94" stroke={hairColor} strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.92" />
      ) : null}
      {hairType === 'ponytail' || hairType === 'princess' ? (
        <path d={`M90 ${58 + swing} C108 ${60 + lag} 108 ${84 + lag} 92 94`} fill={hairColor} opacity="0.96" />
      ) : null}
      {hasTail && hairType !== 'ponytail' && hairType !== 'princess' ? (
        <path d={`M88 ${62 + swing} C103 ${66 + lag} 101 ${86 + lag} 90 94`} fill={hairColor} opacity="0.9" />
      ) : null}
      {hairType === 'wolf' ? (
        <path d="M40 74 L48 67 L56 77 L64 68 L72 77 L80 67 L88 74" stroke={hairColor} strokeWidth="4" strokeLinecap="round" fill="none" />
      ) : null}
      {hairType === 'twoblock' ? (
        <>
          <path d="M34 56 C35 46 37 39 40 34" stroke={skinColor} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
          <path d="M94 56 C93 46 91 39 88 34" stroke={skinColor} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        </>
      ) : null}
    </g>
  );
}

function getPortraitHairVariant(hairType: AvatarHairType) {
  const id = hairType === 'none' ? '' : hairType;
  return {
    id,
    isLong: id.includes('long') || id.includes('hime') || id.includes('low') || id.includes('medium'),
    hasAsymmetry: id.includes('asymmetry') || id.includes('side_swept'),
    hasTwin: id.includes('twin_tail'),
    hasBraid: id.includes('braid'),
    hasOuterFlip: id.includes('outer_flip'),
    isStraightLong: id.includes('long_straight'),
  };
}


export default function AvatarPreview({
  avatar,
  size = 96,
  className = '',
  faceDirection = 'front',
  expression = 'normal',
  viewMode = 'portrait',
}: {
  avatar: AvatarConfig | null | undefined;
  size?: number;
  className?: string;
  faceDirection?: AvatarFaceDirection;
  expression?: AvatarExpression;
  viewMode?: AvatarViewMode;
}) {
  const config = normalizeAvatar(avatar);
  const center = 64;
  const faceFill = config.skinColor;
  const isTopDownBackView = viewMode === 'topdown' && faceDirection === 'up';
  const portraitHairType = viewMode !== 'topdown' ? toPortraitHairType(config.hairType) : null;
  const portraitHair = getPortraitHairVariant(config.hairType);
  const faceOffset = {
    front: { x: 0, y: 0 },
    up: { x: 0, y: -3 },
    down: { x: 0, y: 3 },
    left: { x: -4, y: 0 },
    right: { x: 4, y: 0 },
  }[faceDirection];

  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
      aria-label="avatar preview"
    >
      <circle cx="64" cy="64" r="56" fill={config.bodyColor} />
      {config.speciesType === 'cat' ? (
        <>
          <path d="M34 42 L48 18 L58 44 Z" fill={config.bodyColor} />
          <path d="M94 42 L80 18 L70 44 Z" fill={config.bodyColor} />
          <path d="M40 39 L48 26 L53 40 Z" fill={config.skinColor} />
          <path d="M88 39 L80 26 L75 40 Z" fill={config.skinColor} />
        </>
      ) : null}
      {config.speciesType === 'bear' ? (
        <>
          <circle cx="36" cy="38" r="13" fill={config.bodyColor} />
          <circle cx="92" cy="38" r="13" fill={config.bodyColor} />
          <circle cx="36" cy="38" r="6" fill={config.skinColor} />
          <circle cx="92" cy="38" r="6" fill={config.skinColor} />
        </>
      ) : null}
      {config.speciesType === 'rabbit' ? (
        <>
          <ellipse cx="44" cy="26" rx="11" ry="24" fill={config.bodyColor} />
          <ellipse cx="84" cy="26" rx="11" ry="24" fill={config.bodyColor} />
          <ellipse cx="44" cy="28" rx="4.5" ry="15" fill={config.skinColor} />
          <ellipse cx="84" cy="28" rx="4.5" ry="15" fill={config.skinColor} />
        </>
      ) : null}
      {config.speciesType === 'dog' ? (
        <>
          <ellipse cx="38" cy="44" rx="10" ry="18" fill={config.accentColor} opacity="0.92" />
          <ellipse cx="90" cy="44" rx="10" ry="18" fill={config.accentColor} opacity="0.92" />
        </>
      ) : null}
      {config.speciesType === 'fox' ? (
        <>
          <path d="M34 42 L49 16 L60 44 Z" fill={config.bodyColor} />
          <path d="M94 42 L79 16 L68 44 Z" fill={config.bodyColor} />
          <path d="M40 39 L49 25 L54 40 Z" fill="#fff7ed" />
          <path d="M88 39 L79 25 L74 40 Z" fill="#fff7ed" />
        </>
      ) : null}
      {config.speciesType === 'panda' ? (
        <>
          <circle cx="36" cy="38" r="13" fill="#111827" />
          <circle cx="92" cy="38" r="13" fill="#111827" />
        </>
      ) : null}
      {config.speciesType === 'chick' ? (
        <>
          <path d="M57 23 L64 12 L71 23" stroke={config.accentColor} strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      <circle cx="64" cy="70" r="34" fill={faceFill} />
      {config.speciesType === 'fox' ? (
        <path d="M58 77 Q64 84 70 77 Q64 74 58 77 Z" fill="#fff7ed" opacity="0.95" />
      ) : null}
      {config.speciesType === 'panda' ? (
        <>
          <ellipse cx="51" cy="66" rx="10" ry="12" fill="#111827" opacity="0.92" />
          <ellipse cx="77" cy="66" rx="10" ry="12" fill="#111827" opacity="0.92" />
        </>
      ) : null}
      {config.speciesType === 'chick' ? (
        <path d="M58 80 L70 80 L64 87 Z" fill="#f59e0b" />
      ) : null}


      {viewMode === 'topdown' ? (
        <TopDownHairLayer
          hairType={config.hairType}
          hairColor={config.accentColor}
          skinColor={config.skinColor}
          faceDirection={faceDirection}
        />
      ) : null}

      {portraitHairType === 'short' ? (
        <>
          <path d="M31 56 C34 25 94 25 97 56 C92 53 87 52 82 54 C78 47 72 45 64 47 C56 45 50 47 46 54 C41 52 36 53 31 56 Z" fill={config.accentColor} />
          <path d="M44 55 C50 48 57 46 64 50 C71 46 78 48 84 55" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
        </>
      ) : null}
      {portraitHairType === 'bangs' ? (
        <>
          <path d="M30 54 C34 20 94 20 98 54 C92 49 86 48 80 52 C75 46 70 45 64 53 C58 45 53 46 48 52 C42 48 36 49 30 54 Z" fill={config.accentColor} />
          <path d="M45 56 C49 63 55 66 60 56 C63 62 66 62 69 56 C74 66 80 63 84 56" stroke={config.skinColor} strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.75" />
        </>
      ) : null}
      {portraitHairType === 'spike' ? (
        <>
          <path d="M31 54 C37 24 91 22 97 54 C88 49 80 47 73 53 C69 43 60 43 55 53 C48 47 40 49 31 54 Z" fill={config.accentColor} />
          <path d="M44 56 C50 47 57 45 63 54 C69 44 78 46 84 56" stroke={config.accentColor} strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {portraitHairType === 'bob' ? (
        <>
          <path d={portraitHair.hasOuterFlip ? 'M27 56 C30 22 98 22 101 56 L95 80 C92 90 86 92 78 90 L86 74 C82 67 76 66 72 69 L72 92 C67 95 61 95 56 92 L56 69 C52 66 46 67 42 74 L50 90 C42 92 36 90 33 80 Z' : 'M27 56 C30 22 98 22 101 56 L95 84 C90 90 82 94 74 92 L80 64 C76 52 52 52 48 64 L54 92 C46 94 38 90 33 84 Z'} fill={config.accentColor} />
          <path d="M38 56 C44 48 50 47 56 53" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.92" />
          <path d="M72 53 C78 47 84 48 90 56" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.92" />
        </>
      ) : null}
      {portraitHairType === 'curl' ? (
        <>
          <circle cx="38" cy="48" r="10" fill={config.accentColor} />
          <circle cx="49" cy="39" r="10" fill={config.accentColor} />
          <circle cx="61" cy="34" r="11" fill={config.accentColor} />
          <circle cx="75" cy="35" r="11" fill={config.accentColor} />
          <circle cx="87" cy="41" r="10" fill={config.accentColor} />
          <circle cx="93" cy="52" r="9" fill={config.accentColor} />
          <path d="M42 55 C49 48 57 46 64 52 C71 46 79 47 86 55" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.86" />
        </>
      ) : null}
      {portraitHairType === 'ponytail' ? (
        <>
          <path d={portraitHair.hasAsymmetry ? 'M31 56 C36 24 92 23 96 56 C90 50 83 49 76 52 C71 45 67 44 61 48 C54 46 49 49 45 55 C40 51 36 52 31 56 Z' : 'M32 56 C36 24 92 23 96 56 C91 52 86 51 81 54 C76 47 70 45 64 49 C58 45 52 47 47 54 C42 51 37 52 32 56 Z'} fill={config.accentColor} />
          <path d={portraitHair.hasAsymmetry ? 'M42 56 C50 47 57 46 65 52 C72 47 80 48 86 55' : 'M44 56 C50 48 57 46 64 51 C71 46 78 48 85 56'} stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.88" />
          {portraitHair.hasTwin ? (
            <>
              <path d="M38 58 C22 62 20 88 36 98 C31 84 30 69 38 58 Z" fill={config.accentColor} />
              <path d="M90 58 C108 62 108 88 92 98 C98 84 99 69 90 58 Z" fill={config.accentColor} />
              <circle cx="39" cy="58" r="3.5" fill={config.skinColor} opacity="0.85" />
              <circle cx="89" cy="58" r="3.5" fill={config.skinColor} opacity="0.85" />
            </>
          ) : (
            <>
              <path d={portraitHair.isLong ? 'M92 56 C110 58 111 92 90 104 C100 88 101 70 92 56 Z' : 'M92 56 C108 57 110 86 92 95 C99 83 100 69 92 56 Z'} fill={config.accentColor} />
              <circle cx="91" cy="57" r="4" fill={config.skinColor} opacity="0.85" />
            </>
          )}
        </>
      ) : null}
      {portraitHairType === 'princess' ? (
        <>
          <path d={portraitHair.isStraightLong ? 'M29 54 C34 19 94 19 99 54 L96 102 C90 106 84 106 78 104 L82 66 C77 52 51 52 46 66 L50 104 C44 106 38 106 32 102 Z' : 'M30 54 C35 19 93 19 98 54 L95 95 C88 92 82 88 76 88 L82 64 C77 52 51 52 46 64 L52 88 C46 88 40 92 33 95 Z'} fill={config.accentColor} />
          <path d={portraitHair.hasAsymmetry ? 'M36 56 C45 46 53 45 58 52' : 'M40 56 C47 47 53 45 58 52'} stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
          <path d={portraitHair.hasAsymmetry ? 'M72 52 C79 44 84 47 90 58' : 'M70 52 C75 45 81 47 88 56'} stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
          <path d={portraitHair.isStraightLong ? 'M50 78 C55 83 60 84 64 84 C68 84 73 83 78 78' : 'M52 74 C56 78 60 79 64 79 C68 79 72 78 76 74'} stroke={config.skinColor} strokeWidth="2.6" strokeLinecap="round" opacity="0.62" />
        </>
      ) : null}
      {portraitHairType === 'centerpart' ? (
        <>
          <path d="M32 54 C36 20 92 20 96 54 C88 49 82 48 74 50 C70 39 66 36 64 36 C62 36 58 39 54 50 C46 48 40 49 32 54 Z" fill={config.accentColor} />
          <path d="M64 36 L64 56" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" opacity="0.92" />
        </>
      ) : null}
      {portraitHairType === 'upbang' ? (
        <>
          <path d="M34 58 C40 23 88 22 95 56 C86 45 75 39 64 40 C53 39 42 44 34 58 Z" fill={config.accentColor} />
          <path d="M44 50 L55 36 L60 50" stroke={config.accentColor} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M68 50 L76 34 L83 49" stroke={config.accentColor} strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {portraitHairType === 'mash' ? (
        <>
          <path d="M29 56 C33 24 95 24 99 56 C94 53 88 52 82 54 C77 47 71 46 64 49 C57 46 51 47 46 54 C40 52 34 53 29 56 Z" fill={config.accentColor} />
          <path d="M40 57 C48 49 57 47 64 52 C71 47 80 49 88 57" stroke={config.skinColor} strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.72" />
        </>
      ) : null}
      {portraitHairType === 'slick' ? (
        <>
          <path d="M35 57 C38 27 88 22 96 48 C87 44 79 42 70 42 C58 42 47 46 35 57 Z" fill={config.accentColor} />
          <path d="M44 45 C56 34 71 33 87 39" stroke={config.skinColor} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.75" />
        </>
      ) : null}
      {portraitHairType === 'wolf' ? (
        <>
          <path d={portraitHair.isLong ? 'M31 54 C36 20 92 20 97 54 L90 80 L81 71 L73 84 L64 72 L55 84 L47 71 L38 80 Z' : 'M31 54 C36 20 92 20 97 54 L89 74 L80 66 L72 76 L64 66 L56 76 L47 66 L39 74 Z'} fill={config.accentColor} />
          <path d="M41 54 C49 46 57 44 63 53 C69 44 78 45 87 54" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.86" />
        </>
      ) : null}
      {portraitHairType === 'twoblock' ? (
        <>
          <path d="M39 56 C43 24 91 23 94 54 C84 47 76 45 68 46 C60 46 51 49 39 56 Z" fill={config.accentColor} />
          <path d="M33 56 C34 45 36 39 39 35" stroke={config.skinColor} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
          <path d="M95 55 C94 45 92 39 89 35" stroke={config.skinColor} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        </>
      ) : null}

      {!isTopDownBackView ? (
      <g transform={`translate(${faceOffset.x} ${faceOffset.y})`}>
      {expression === 'happy' ? (
        <>
          <path d="M45 68 C48 62 55 62 58 68" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M70 68 C73 62 80 62 83 68" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </>
      ) : expression === 'sad' ? (
        <>
          <path d="M44 64 L58 64" stroke={config.accentColor} strokeWidth="4" strokeLinecap="round" />
          <path d="M70 64 L84 64" stroke={config.accentColor} strokeWidth="4" strokeLinecap="round" />
        </>
      ) : config.eyeType === 'dot' ? (
        <>
          <circle cx="51" cy="66" r="4.5" fill={config.accentColor} />
          <circle cx="77" cy="66" r="4.5" fill={config.accentColor} />
        </>
      ) : null}
      {expression === 'normal' && config.eyeType === 'smile' ? (
        <>
          <path d="M44 67 C47 61 54 61 57 67" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M71 67 C74 61 81 61 84 67" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {expression === 'normal' && config.eyeType === 'wide' ? (
        <>
          <circle cx="51" cy="66" r="7" fill="#ffffff" />
          <circle cx="77" cy="66" r="7" fill="#ffffff" />
          <circle cx="51" cy="66" r="3.5" fill={config.accentColor} />
          <circle cx="77" cy="66" r="3.5" fill={config.accentColor} />
        </>
      ) : null}
      {expression === 'normal' && config.eyeType === 'wink' ? (
        <>
          <circle cx="51" cy="66" r="4.5" fill={config.accentColor} />
          <path d="M71 66 L83 66" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" />
        </>
      ) : null}
      {expression === 'normal' && config.eyeType === 'sleepy' ? (
        <>
          <path d="M44 64 L58 64" stroke={config.accentColor} strokeWidth="4" strokeLinecap="round" />
          <path d="M70 64 L84 64" stroke={config.accentColor} strokeWidth="4" strokeLinecap="round" />
          <path d="M47 59 L54 62" stroke={config.accentColor} strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : null}
      {expression === 'normal' && config.eyeType === 'angry' ? (
        <>
          <path d="M45 69 L57 64" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M71 64 L83 69" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="51" cy="68" r="3.5" fill={config.accentColor} />
          <circle cx="77" cy="68" r="3.5" fill={config.accentColor} />
        </>
      ) : null}
      {expression === 'normal' && config.eyeType === 'sparkle' ? (
        <>
          <path d="M51 58 L53 63 L58 65 L53 67 L51 72 L49 67 L44 65 L49 63 Z" fill={config.accentColor} />
          <path d="M77 58 L79 63 L84 65 L79 67 L77 72 L75 67 L70 65 L75 63 Z" fill={config.accentColor} />
        </>
      ) : null}
      {expression === 'normal' && config.eyeType === 'heart' ? (
        <>
          <path d="M51 71 C43 66 45 58 51 60 C57 58 59 66 51 71 Z" fill="#ef4444" />
          <path d="M77 71 C69 66 71 58 77 60 C83 58 85 66 77 71 Z" fill="#ef4444" />
        </>
      ) : null}

      {expression === 'happy' ? (
        <path d="M49 84 C56 96 72 96 79 84" stroke={config.accentColor} strokeWidth="5" strokeLinecap="round" fill="none" />
      ) : expression === 'sad' ? (
        <path d="M52 93 C58 84 70 84 76 93" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      ) : config.mouthType === 'smile' ? (
        <path d="M50 86 C58 94 70 94 78 86" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      ) : null}
      {expression === 'normal' && config.mouthType === 'open' ? (
        <ellipse cx="64" cy="88" rx="9" ry="6" fill={config.accentColor} />
      ) : null}
      {expression === 'normal' && config.mouthType === 'flat' ? (
        <path d="M55 88 L73 88" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" />
      ) : null}
      {expression === 'normal' && config.mouthType === 'tooth' ? (
        <>
          <rect x="54" y="82" width="20" height="10" rx="4" fill="#ffffff" stroke={config.accentColor} strokeWidth="3" />
          <path d="M64 82 L64 92" stroke={config.accentColor} strokeWidth="2.5" />
        </>
      ) : null}
      {expression === 'normal' && config.mouthType === 'grin' ? (
        <>
          <path d="M51 84 Q64 96 77 84" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M53 86 H75" stroke={config.accentColor} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : null}
      {expression === 'normal' && config.mouthType === 'pout' ? (
        <path d="M54 90 C58 84 70 84 74 90" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      ) : null}
      {expression === 'normal' && config.mouthType === 'tongue' ? (
        <>
          <path d="M54 86 Q64 94 74 86" stroke={config.accentColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M60 87 Q64 98 68 87" fill="#f472b6" />
        </>
      ) : null}
      {expression === 'normal' && config.mouthType === 'surprised' ? (
        <circle cx="64" cy="88" r="6.5" fill="none" stroke={config.accentColor} strokeWidth="4" />
      ) : null}
      </g>
      ) : null}

      {!isTopDownBackView && config.accessoryType === 'glasses' ? (
        <>
          <rect x="40" y="58" width="20" height="16" rx="6" fill="none" stroke={config.accentColor} strokeWidth="4" />
          <rect x="68" y="58" width="20" height="16" rx="6" fill="none" stroke={config.accentColor} strokeWidth="4" />
          <path d="M60 66 L68 66" stroke={config.accentColor} strokeWidth="4" strokeLinecap="round" />
        </>
      ) : null}
      {config.accessoryType === 'star' ? (
        <path d="M95 32 L99 40 L108 41 L101 47 L103 56 L95 51 L87 56 L89 47 L82 41 L91 40 Z" fill="#fde047" stroke={config.accentColor} strokeWidth="2.5" />
      ) : null}
      {config.accessoryType === 'headband' ? (
        <path d="M30 52 C42 42 86 42 98 52" stroke={config.accentColor} strokeWidth="8" strokeLinecap="round" fill="none" />
      ) : null}
      {config.accessoryType === 'ribbon' ? (
        <>
          <circle cx="88" cy="42" r="5" fill="#f472b6" />
          <path d="M84 46 L76 56 L86 54 Z" fill="#f472b6" />
          <path d="M92 46 L100 56 L90 54 Z" fill="#f472b6" />
        </>
      ) : null}
      {config.accessoryType === 'crown' ? (
        <path d="M45 31 L55 42 L64 28 L73 42 L83 31 L86 45 H42 Z" fill="#fbbf24" stroke={config.accentColor} strokeWidth="2.5" />
      ) : null}
      {config.accessoryType === 'flower' ? (
        <>
          <circle cx="94" cy="42" r="4" fill="#fde047" />
          <circle cx="88" cy="42" r="4.5" fill="#f472b6" />
          <circle cx="100" cy="42" r="4.5" fill="#f472b6" />
          <circle cx="94" cy="36" r="4.5" fill="#f472b6" />
          <circle cx="94" cy="48" r="4.5" fill="#f472b6" />
        </>
      ) : null}
      {config.accessoryType === 'cap' ? (
        <>
          <path d="M34 50 C42 32 86 32 94 50" fill={config.accentColor} />
          <path d="M64 46 C77 46 88 50 96 56" stroke={config.accentColor} strokeWidth="6" strokeLinecap="round" />
        </>
      ) : null}

      <circle cx={center} cy={64} r="56" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4" />
    </svg>
  );
}

function toPortraitHairType(hairType: AvatarHairType): keyof typeof LEGACY_HAIR_STYLE_BY_TYPE | null {
  if (hairType === 'none') return null;
  if (hairType in LEGACY_HAIR_STYLE_BY_TYPE) return hairType as keyof typeof LEGACY_HAIR_STYLE_BY_TYPE;

  const mapped = LEGACY_HAIR_STYLE_BY_TYPE[hairType];
  if (mapped) {
    const reverseMapped = Object.entries(LEGACY_HAIR_STYLE_BY_TYPE).find(([, value]) => value === mapped)?.[0];
    if (reverseMapped) return reverseMapped as keyof typeof LEGACY_HAIR_STYLE_BY_TYPE;
  }

  if (hairType.includes('long_straight') || hairType.includes('hime')) return 'princess';
  if (hairType.includes('asymmetry_long')) return 'ponytail';
  if (hairType.includes('medium_layer') || hairType.includes('outer_flip')) return 'bob';
  if (hairType.includes('twin_tail')) return 'ponytail';
  if (hairType.includes('braid')) return 'ponytail';
  if (hairType.includes('ponytail') || hairType.includes('tail')) return 'ponytail';
  if (hairType.includes('hime') || hairType.includes('princess')) return 'princess';
  if (hairType.includes('wolf')) return 'wolf';
  if (hairType.includes('two_block') || hairType.includes('block')) return 'twoblock';
  if (hairType.includes('slick') || hairType.includes('upbang') || hairType.includes('all_back')) return 'slick';
  if (hairType.includes('centerpart') || hairType.includes('comma')) return 'centerpart';
  if (hairType.includes('bang') || hairType.includes('mash')) return 'bangs';
  if (hairType.includes('curl') || hairType.includes('perm')) return 'curl';
  if (hairType.includes('bob')) return 'bob';
  if (hairType.includes('spiky') || hairType.includes('spike')) return 'spike';

  return 'short';
}
