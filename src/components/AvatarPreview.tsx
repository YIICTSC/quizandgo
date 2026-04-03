import { AvatarConfig, normalizeAvatar } from '../avatar';

export default function AvatarPreview({
  avatar,
  size = 96,
  className = '',
}: {
  avatar: AvatarConfig | null | undefined;
  size?: number;
  className?: string;
}) {
  const config = normalizeAvatar(avatar);
  const center = 64;
  const faceFill = config.skinColor;

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
        <path d="M34 58 C38 26 91 22 97 58 L97 46 C87 18 42 20 34 46 Z" fill={config.accentColor} />
      ) : null}
      {config.hairType === 'bangs' ? (
        <path d="M30 52 C36 18 92 18 98 52 C84 50 76 46 64 54 C51 46 43 49 30 52 Z" fill={config.accentColor} />
      ) : null}
      {config.hairType === 'spike' ? (
        <path d="M30 56 L40 24 L56 42 L66 18 L78 42 L92 24 L98 56 C82 46 46 46 30 56 Z" fill={config.accentColor} />
      ) : null}
      {config.hairType === 'bob' ? (
        <path d="M28 54 C31 24 97 24 100 54 L92 84 C82 77 46 77 36 84 Z" fill={config.accentColor} />
      ) : null}
      {config.hairType === 'curl' ? (
        <>
          <circle cx="40" cy="46" r="12" fill={config.accentColor} />
          <circle cx="52" cy="36" r="12" fill={config.accentColor} />
          <circle cx="64" cy="34" r="12" fill={config.accentColor} />
          <circle cx="76" cy="36" r="12" fill={config.accentColor} />
          <circle cx="88" cy="46" r="12" fill={config.accentColor} />
        </>
      ) : null}
      {config.hairType === 'ponytail' ? (
        <>
          <path d="M34 54 C39 24 89 22 96 54 L92 48 C82 22 46 22 36 48 Z" fill={config.accentColor} />
          <path d="M93 58 C108 58 108 88 89 92 C94 82 94 70 93 58 Z" fill={config.accentColor} />
        </>
      ) : null}
      {config.hairType === 'afro' ? (
        <>
          <circle cx="64" cy="40" r="24" fill={config.accentColor} />
          <circle cx="44" cy="44" r="16" fill={config.accentColor} />
          <circle cx="84" cy="44" r="16" fill={config.accentColor} />
        </>
      ) : null}

      {config.eyeType === 'dot' ? (
        <>
          <circle cx="51" cy="66" r="4.5" fill={config.accentColor} />
          <circle cx="77" cy="66" r="4.5" fill={config.accentColor} />
        </>
      ) : null}
      {config.eyeType === 'smile' ? (
        <>
          <path d="M44 67 C47 61 54 61 57 67" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M71 67 C74 61 81 61 84 67" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {config.eyeType === 'wide' ? (
        <>
          <circle cx="51" cy="66" r="7" fill="#ffffff" />
          <circle cx="77" cy="66" r="7" fill="#ffffff" />
          <circle cx="51" cy="66" r="3.5" fill={config.accentColor} />
          <circle cx="77" cy="66" r="3.5" fill={config.accentColor} />
        </>
      ) : null}
      {config.eyeType === 'wink' ? (
        <>
          <circle cx="51" cy="66" r="4.5" fill={config.accentColor} />
          <path d="M71 66 L83 66" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" />
        </>
      ) : null}
      {config.eyeType === 'sleepy' ? (
        <>
          <path d="M44 64 L58 64" stroke={config.accentColor} strokeWidth="4" strokeLinecap="round" />
          <path d="M70 64 L84 64" stroke={config.accentColor} strokeWidth="4" strokeLinecap="round" />
          <path d="M47 59 L54 62" stroke={config.accentColor} strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : null}
      {config.eyeType === 'angry' ? (
        <>
          <path d="M45 69 L57 64" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M71 64 L83 69" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="51" cy="68" r="3.5" fill={config.accentColor} />
          <circle cx="77" cy="68" r="3.5" fill={config.accentColor} />
        </>
      ) : null}
      {config.eyeType === 'sparkle' ? (
        <>
          <path d="M51 58 L53 63 L58 65 L53 67 L51 72 L49 67 L44 65 L49 63 Z" fill={config.accentColor} />
          <path d="M77 58 L79 63 L84 65 L79 67 L77 72 L75 67 L70 65 L75 63 Z" fill={config.accentColor} />
        </>
      ) : null}
      {config.eyeType === 'heart' ? (
        <>
          <path d="M51 71 C43 66 45 58 51 60 C57 58 59 66 51 71 Z" fill="#ef4444" />
          <path d="M77 71 C69 66 71 58 77 60 C83 58 85 66 77 71 Z" fill="#ef4444" />
        </>
      ) : null}

      {config.mouthType === 'smile' ? (
        <path d="M50 86 C58 94 70 94 78 86" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      ) : null}
      {config.mouthType === 'open' ? (
        <ellipse cx="64" cy="88" rx="9" ry="6" fill={config.accentColor} />
      ) : null}
      {config.mouthType === 'flat' ? (
        <path d="M55 88 L73 88" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" />
      ) : null}
      {config.mouthType === 'tooth' ? (
        <>
          <rect x="54" y="82" width="20" height="10" rx="4" fill="#ffffff" stroke={config.accentColor} strokeWidth="3" />
          <path d="M64 82 L64 92" stroke={config.accentColor} strokeWidth="2.5" />
        </>
      ) : null}
      {config.mouthType === 'grin' ? (
        <>
          <path d="M51 84 Q64 96 77 84" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M53 86 H75" stroke={config.accentColor} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : null}
      {config.mouthType === 'pout' ? (
        <path d="M54 90 C58 84 70 84 74 90" stroke={config.accentColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      ) : null}
      {config.mouthType === 'tongue' ? (
        <>
          <path d="M54 86 Q64 94 74 86" stroke={config.accentColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M60 87 Q64 98 68 87" fill="#f472b6" />
        </>
      ) : null}
      {config.mouthType === 'surprised' ? (
        <circle cx="64" cy="88" r="6.5" fill="none" stroke={config.accentColor} strokeWidth="4" />
      ) : null}

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
