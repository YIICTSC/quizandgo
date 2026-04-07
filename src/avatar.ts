import { TOPDOWN_HAIR_IDS } from './data/topdownHairCatalog';

export type AvatarEyeType = 'dot' | 'smile' | 'wide' | 'wink' | 'sleepy' | 'angry' | 'sparkle' | 'heart';
export type AvatarMouthType = 'smile' | 'open' | 'flat' | 'tooth' | 'grin' | 'pout' | 'tongue' | 'surprised';
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
const LEGACY_HAIR_TO_TOPDOWN: Record<string, string> = {
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
const isTopdownHairId = (value: string): value is (typeof TOPDOWN_HAIR_IDS)[number] => TOPDOWN_HAIR_IDS.includes(value);
const TOPDOWN_HAIR_JA_LABELS: Record<string, string> = {
  korean_mash_soft: '韓国風マッシュ（ソフト）',
  korean_mash_heavy: '韓国風マッシュ（重め）',
  comma_centerpart_clean: 'コンマセンターパート（クリーン）',
  comma_centerpart_wet: 'コンマセンターパート（ウェット）',
  wolf_short_layer: 'ショートウルフ（レイヤー）',
  wolf_medium_shaggy: 'ミディアムウルフ（シャギー）',
  two_block_basic: 'ツーブロック（ベーシック）',
  two_block_fade_high: 'ツーブロック（ハイフェード）',
  two_block_fade_low: 'ツーブロック（ローフェード）',
  outer_flip_midi_light: '外ハネミディ（ライト）',
  outer_flip_midi_bold: '外ハネミディ（くっきり）',
  inner_curl_bob: '内巻きボブ',
  loose_perm_short: 'ゆるふわパーマ（ショート）',
  loose_perm_medium: 'ゆるふわパーマ（ミディアム）',
  twin_tail_high_sharp: '高めツインテール（シャープ）',
  twin_tail_high_fluffy: '高めツインテール（ふんわり）',
  twin_tail_low_classic: '低めツインテール（クラシック）',
  twin_tail_low_braid_mix: '低めツインテール（編み込みミックス）',
  ponytail_high_sporty: '高めポニーテール（スポーティ）',
  ponytail_low_elegant: '低めポニーテール（エレガント）',
  ponytail_side_swept: 'サイドポニーテール',
  braid_single_side: '片側三つ編み',
  braid_double_crown: 'クラウン編み（ダブル）',
  braid_twin_rope: 'ツインロープ編み',
  asymmetry_long_bang: 'アシメ前髪（ロング）',
  asymmetry_short_sidecut: 'アシメ（サイドカット）',
  see_through_bang_short: 'シースルーバング（ショート）',
  see_through_bang_midi: 'シースルーバング（ミディ）',
  shaggy_layer_unbalanced: 'アンバランスシャギー',
  hime_cut_modern: '姫カット（モダン）',
  slick_back_modern: 'オールバック（モダン）',
  short_spiky_active: 'ショートスパイキー',
  medium_layer_airy: 'ミディアムレイヤー（エアリー）',
  long_straight_clean: 'ロングストレート（クリーン）',
};

export const AVATAR_HAIRS = ['none', ...TOPDOWN_HAIR_IDS] as const;
export type AvatarHairType = (typeof AVATAR_HAIRS)[number];
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

const buildHairLabel = (hairId: AvatarHairType): string => {
  if (hairId === 'none') return 'なし';
  return TOPDOWN_HAIR_JA_LABELS[hairId] ?? hairId;
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
  hairType: Object.fromEntries(AVATAR_HAIRS.map((hairId) => [hairId, buildHairLabel(hairId)])) as Record<AvatarHairType, string>,
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

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

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
  const normalizedHairType = (() => {
    if (AVATAR_HAIRS.includes(value.hairType)) return value.hairType as AvatarHairType;
    if (typeof value.hairType === 'string') {
      const mapped = LEGACY_HAIR_TO_TOPDOWN[value.hairType];
      if (mapped && isTopdownHairId(mapped)) return mapped;
    }
    return fallback.hairType;
  })();

  return {
    bodyColor: AVATAR_BODY_COLORS.includes(value.bodyColor) ? value.bodyColor : fallback.bodyColor,
    accentColor: AVATAR_ACCENT_COLORS.includes(value.accentColor) ? value.accentColor : fallback.accentColor,
    skinColor: AVATAR_SKIN_COLORS.includes(value.skinColor) ? value.skinColor : fallback.skinColor,
    eyeType: AVATAR_EYES.includes(value.eyeType) ? value.eyeType : fallback.eyeType,
    mouthType: AVATAR_MOUTHS.includes(value.mouthType) ? value.mouthType : fallback.mouthType,
    hairType: normalizedHairType,
    accessoryType: AVATAR_ACCESSORIES.includes(value.accessoryType) ? value.accessoryType : fallback.accessoryType,
    speciesType: AVATAR_SPECIES.includes(value.speciesType) ? value.speciesType : fallback.speciesType,
  };
};
