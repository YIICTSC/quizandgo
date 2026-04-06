import { AvatarConfig, normalizeAvatar } from '../avatar';

type AvatarFaceDirection = 'front' | 'up' | 'down' | 'left' | 'right';
type AvatarExpression = 'normal' | 'happy' | 'sad';

export default function AvatarPreview({
  avatar,
  size = 96,
  className = '',
  faceDirection = 'front',
  expression = 'normal',
}: {
  avatar: AvatarConfig | null | undefined;
  size?: number;
  className?: string;
  faceDirection?: AvatarFaceDirection;
  expression?: AvatarExpression;
}) {
  const config = normalizeAvatar(avatar);
  const center = 64;
  const faceFill = config.skinColor;
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

      {config.hairType === 'short' ? (
        <>
          <path d="M34 54 C38 26 90 24 96 54 L96 44 C86 19 42 21 34 44 Z" fill={config.accentColor} />
          <path d="M41 54 C47 46 54 44 60 52 C66 42 76 42 85 53" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
        </>
      ) : null}
      {config.hairType === 'bangs' ? (
        <>
          <path d="M30 52 C36 18 92 18 98 52 C91 51 84 52 78 55 C74 48 68 46 64 56 C58 47 50 47 44 55 C39 51 35 50 30 52 Z" fill={config.accentColor} />
          <path d="M48 54 L55 64 L62 53 L69 64 L78 54" stroke={config.accentColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {config.hairType === 'spike' ? (
        <>
          <path d="M31 54 C37 24 91 22 97 54 C88 49 80 47 73 53 C69 43 60 43 55 53 C48 47 40 49 31 54 Z" fill={config.accentColor} />
          <path d="M44 56 C50 47 57 45 63 54 C69 44 78 46 84 56" stroke={config.accentColor} strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {config.hairType === 'bob' ? (
        <>
          <path d="M28 54 C31 24 97 24 100 54 L93 86 C84 80 45 80 35 86 Z" fill={config.accentColor} />
          <path d="M40 54 C45 45 54 43 61 51 C67 42 76 42 87 54" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.92" />
        </>
      ) : null}
      {config.hairType === 'curl' ? (
        <>
          <circle cx="40" cy="46" r="11" fill={config.accentColor} />
          <circle cx="52" cy="36" r="11" fill={config.accentColor} />
          <circle cx="64" cy="34" r="11" fill={config.accentColor} />
          <circle cx="76" cy="36" r="11" fill={config.accentColor} />
          <circle cx="88" cy="46" r="11" fill={config.accentColor} />
          <path d="M42 53 C49 45 56 44 63 52 C69 43 78 44 86 54" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.86" />
        </>
      ) : null}
      {config.hairType === 'ponytail' ? (
        <>
          <path d="M34 54 C39 24 89 22 96 54 L92 48 C83 26 50 21 38 47 Z" fill={config.accentColor} />
          <path d="M43 55 C49 46 56 44 63 53 C70 44 78 45 86 55" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.88" />
          <path d="M92 58 C110 58 109 91 88 95 C96 83 97 71 92 58 Z" fill={config.accentColor} />
        </>
      ) : null}
      {config.hairType === 'princess' ? (
        <>
          <path d="M30 52 C36 18 92 18 98 52 L94 95 C86 90 80 86 74 86 L74 60 C69 48 59 48 54 60 L54 86 C47 86 41 90 34 95 Z" fill={config.accentColor} />
          <path d="M41 54 C47 44 55 42 62 51 C69 42 78 43 87 54" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
        </>
      ) : null}
      {config.hairType === 'centerpart' ? (
        <>
          <path d="M32 54 C36 20 92 20 96 54 C88 49 82 48 74 50 C70 39 66 36 64 36 C62 36 58 39 54 50 C46 48 40 49 32 54 Z" fill={config.accentColor} />
          <path d="M64 36 L64 56" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" opacity="0.92" />
        </>
      ) : null}
      {config.hairType === 'upbang' ? (
        <>
          <path d="M34 58 C40 23 88 22 95 56 C86 45 75 39 64 40 C53 39 42 44 34 58 Z" fill={config.accentColor} />
          <path d="M44 50 L55 36 L60 50" stroke={config.accentColor} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M68 50 L76 34 L83 49" stroke={config.accentColor} strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {config.hairType === 'mash' ? (
        <>
          <path d="M29 55 C34 22 94 22 99 55 C92 52 85 53 79 55 C73 46 55 46 49 55 C42 53 35 52 29 55 Z" fill={config.accentColor} />
          <path d="M40 56 C49 47 58 45 64 54 C69 45 79 46 88 56" stroke={config.accentColor} strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {config.hairType === 'slick' ? (
        <>
          <path d="M35 57 C38 27 88 22 96 48 C87 44 79 42 70 42 C58 42 47 46 35 57 Z" fill={config.accentColor} />
          <path d="M44 45 C56 34 71 33 87 39" stroke={config.skinColor} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.75" />
        </>
      ) : null}
      {config.hairType === 'wolf' ? (
        <>
          <path d="M31 54 C36 20 92 20 97 54 L89 74 L80 66 L72 76 L64 66 L56 76 L47 66 L39 74 Z" fill={config.accentColor} />
          <path d="M41 54 C49 46 57 44 63 53 C69 44 78 45 87 54" stroke={config.skinColor} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.86" />
        </>
      ) : null}
      {config.hairType === 'twoblock' ? (
        <>
          <path d="M39 56 C43 24 91 23 94 54 C84 47 76 45 68 46 C60 46 51 49 39 56 Z" fill={config.accentColor} />
          <path d="M33 56 C34 45 36 39 39 35" stroke={config.skinColor} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
          <path d="M95 55 C94 45 92 39 89 35" stroke={config.skinColor} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        </>
      ) : null}

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

      {config.accessoryType === 'glasses' ? (
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
