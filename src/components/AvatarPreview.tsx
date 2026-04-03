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
      <circle cx="64" cy="70" r="34" fill={faceFill} />

      {config.hairType === 'short' ? (
        <path d="M34 58 C38 26 91 22 97 58 L97 46 C87 18 42 20 34 46 Z" fill={config.accentColor} />
      ) : null}
      {config.hairType === 'bangs' ? (
        <path d="M30 52 C36 18 92 18 98 52 C84 50 76 46 64 54 C51 46 43 49 30 52 Z" fill={config.accentColor} />
      ) : null}
      {config.hairType === 'spike' ? (
        <path d="M30 56 L40 24 L56 42 L66 18 L78 42 L92 24 L98 56 C82 46 46 46 30 56 Z" fill={config.accentColor} />
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

      <circle cx={center} cy={64} r="56" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4" />
    </svg>
  );
}
