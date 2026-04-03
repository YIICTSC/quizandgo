export type AvatarEyeType = 'dot' | 'smile' | 'wide' | 'wink';
export type AvatarMouthType = 'smile' | 'open' | 'flat' | 'tooth';
export type AvatarHairType = 'none' | 'short' | 'bangs' | 'spike';
export type AvatarAccessoryType = 'none' | 'glasses' | 'star' | 'headband';
export type AvatarSpeciesType = 'human' | 'cat' | 'bear' | 'rabbit' | 'dog';

export type AvatarConfig = {
  bodyColor: string;
  accentColor: string;
  skinColor: string;
  eyeType: AvatarEyeType;
  mouthType: AvatarMouthType;
  hairType: AvatarHairType;
  accessoryType: AvatarAccessoryType;
  speciesType: AvatarSpeciesType;
};

export const AVATAR_STORAGE_KEY = 'quizandgo_avatar_v1';

export const AVATAR_BODY_COLORS = ['#38bdf8', '#fb7185', '#34d399', '#fbbf24', '#c084fc', '#f97316', '#60a5fa', '#f472b6'];
export const AVATAR_ACCENT_COLORS = ['#0f172a', '#ffffff', '#14532d', '#1d4ed8', '#7c2d12', '#581c87', '#7f1d1d', '#164e63'];
export const AVATAR_SKIN_COLORS = ['#fff7ed', '#fde7d3', '#f7d2b6', '#dba57d', '#b97952', '#8d5a3c'];
export const AVATAR_EYES: AvatarEyeType[] = ['dot', 'smile', 'wide', 'wink'];
export const AVATAR_MOUTHS: AvatarMouthType[] = ['smile', 'open', 'flat', 'tooth'];
export const AVATAR_HAIRS: AvatarHairType[] = ['none', 'short', 'bangs', 'spike'];
export const AVATAR_ACCESSORIES: AvatarAccessoryType[] = ['none', 'glasses', 'star', 'headband'];
export const AVATAR_SPECIES: AvatarSpeciesType[] = ['human', 'cat', 'bear', 'rabbit', 'dog'];

export const AVATAR_LABELS = {
  eyeType: { dot: 'まる目', smile: 'にこ目', wide: 'ぱっちり目', wink: 'ウィンク' },
  mouthType: { smile: 'えがお', open: 'あき口', flat: 'まっすぐ', tooth: 'はみがき' },
  hairType: { none: 'なし', short: 'ショート', bangs: 'ぱっつん', spike: 'ツンツン' },
  accessoryType: { none: 'なし', glasses: 'メガネ', star: 'スター', headband: 'ヘッドバンド' },
  speciesType: { human: 'ひと', cat: 'ねこ', bear: 'くま', rabbit: 'うさぎ', dog: 'いぬ' },
} as const;

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export const createRandomAvatar = (): AvatarConfig => ({
  bodyColor: pick(AVATAR_BODY_COLORS),
  accentColor: pick(AVATAR_ACCENT_COLORS),
  skinColor: pick(AVATAR_SKIN_COLORS),
  eyeType: pick(AVATAR_EYES),
  mouthType: pick(AVATAR_MOUTHS),
  hairType: pick(AVATAR_HAIRS),
  accessoryType: pick(AVATAR_ACCESSORIES),
  speciesType: pick(AVATAR_SPECIES),
});

export const normalizeAvatar = (value: any): AvatarConfig => {
  const fallback = createRandomAvatar();
  if (!value || typeof value !== 'object') return fallback;

  return {
    bodyColor: AVATAR_BODY_COLORS.includes(value.bodyColor) ? value.bodyColor : fallback.bodyColor,
    accentColor: AVATAR_ACCENT_COLORS.includes(value.accentColor) ? value.accentColor : fallback.accentColor,
    skinColor: AVATAR_SKIN_COLORS.includes(value.skinColor) ? value.skinColor : fallback.skinColor,
    eyeType: AVATAR_EYES.includes(value.eyeType) ? value.eyeType : fallback.eyeType,
    mouthType: AVATAR_MOUTHS.includes(value.mouthType) ? value.mouthType : fallback.mouthType,
    hairType: AVATAR_HAIRS.includes(value.hairType) ? value.hairType : fallback.hairType,
    accessoryType: AVATAR_ACCESSORIES.includes(value.accessoryType) ? value.accessoryType : fallback.accessoryType,
    speciesType: AVATAR_SPECIES.includes(value.speciesType) ? value.speciesType : fallback.speciesType,
  };
};
