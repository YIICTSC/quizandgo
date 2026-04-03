export type AvatarEyeType = 'dot' | 'smile' | 'wide' | 'wink' | 'sleepy' | 'angry' | 'sparkle' | 'heart';
export type AvatarMouthType = 'smile' | 'open' | 'flat' | 'tooth' | 'grin' | 'pout' | 'tongue' | 'surprised';
export type AvatarHairType =
  | 'none'
  | 'short'
  | 'bangs'
  | 'spike'
  | 'bob'
  | 'curl'
  | 'ponytail'
  | 'princess'
  | 'centerpart'
  | 'upbang'
  | 'mash'
  | 'slick'
  | 'wolf'
  | 'twoblock';
export type AvatarAccessoryType = 'none' | 'glasses' | 'star' | 'headband' | 'ribbon' | 'crown' | 'flower' | 'cap';
export type AvatarSpeciesType = 'human' | 'cat' | 'bear' | 'rabbit' | 'dog' | 'fox' | 'panda' | 'chick';

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
export const AVATAR_EYES: AvatarEyeType[] = ['dot', 'smile', 'wide', 'wink', 'sleepy', 'angry', 'sparkle', 'heart'];
export const AVATAR_MOUTHS: AvatarMouthType[] = ['smile', 'open', 'flat', 'tooth', 'grin', 'pout', 'tongue', 'surprised'];
export const AVATAR_HAIRS: AvatarHairType[] = ['none', 'short', 'bangs', 'spike', 'bob', 'curl', 'ponytail', 'princess', 'centerpart', 'upbang', 'mash', 'slick', 'wolf', 'twoblock'];
export const AVATAR_ACCESSORIES: AvatarAccessoryType[] = ['none', 'glasses', 'star', 'headband', 'ribbon', 'crown', 'flower', 'cap'];
export const AVATAR_SPECIES: AvatarSpeciesType[] = ['human', 'cat', 'bear', 'rabbit', 'dog', 'fox', 'panda', 'chick'];
export const AVATAR_BODY_COLOR_LABELS: Record<string, string> = {
  '#38bdf8': 'そらいろ',
  '#fb7185': 'さくら',
  '#34d399': 'みどり',
  '#fbbf24': 'ひまわり',
  '#c084fc': 'すみれ',
  '#f97316': 'だいだい',
  '#60a5fa': 'あお',
  '#f472b6': 'もも',
};
export const AVATAR_ACCENT_COLOR_LABELS: Record<string, string> = {
  '#0f172a': 'くろ',
  '#ffffff': 'しろ',
  '#14532d': 'ふかみどり',
  '#1d4ed8': 'こいあお',
  '#7c2d12': 'こげちゃ',
  '#581c87': 'むらさき',
  '#7f1d1d': 'えんじ',
  '#164e63': 'あおみどり',
};
export const AVATAR_SKIN_COLOR_LABELS: Record<string, string> = {
  '#fff7ed': 'ミルク',
  '#fde7d3': 'アイボリー',
  '#f7d2b6': 'ピーチ',
  '#dba57d': 'キャラメル',
  '#b97952': 'シナモン',
  '#8d5a3c': 'ココア',
};

export const AVATAR_LABELS = {
  eyeType: {
    dot: 'まる目',
    smile: 'にこ目',
    wide: 'ぱっちり目',
    wink: 'ウィンク',
    sleepy: 'ねむねむ',
    angry: 'きりっと',
    sparkle: 'キラキラ',
    heart: 'ハート',
  },
  mouthType: {
    smile: 'えがお',
    open: 'あき口',
    flat: 'まっすぐ',
    tooth: 'はみがき',
    grin: 'にやり',
    pout: 'ぷくー',
    tongue: 'べー',
    surprised: 'びっくり',
  },
  hairType: {
    none: 'なし',
    short: 'シースルー',
    bangs: 'ぱっつん',
    spike: 'ふわバング',
    bob: 'ひめボブ',
    curl: 'くるふわ',
    ponytail: 'ながし前髪ポニー',
    princess: 'おひめロング',
    centerpart: 'センターパート',
    upbang: 'アップバング',
    mash: 'マッシュ',
    slick: 'オールバック',
    wolf: 'ショートウルフ',
    twoblock: 'ツーブロック',
  },
  accessoryType: {
    none: 'なし',
    glasses: 'メガネ',
    star: 'スター',
    headband: 'ヘッドバンド',
    ribbon: 'リボン',
    crown: 'クラウン',
    flower: 'おはな',
    cap: 'ぼうし',
  },
  speciesType: {
    human: 'ひと',
    cat: 'ねこ',
    bear: 'くま',
    rabbit: 'うさぎ',
    dog: 'いぬ',
    fox: 'きつね',
    panda: 'パンダ',
    chick: 'ひよこ',
  },
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
