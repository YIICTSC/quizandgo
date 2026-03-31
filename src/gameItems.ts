export type GameItemId =
  | 'sticky_ball'
  | 'power_ball'
  | 'control_ball'
  | 'feather_ball'
  | 'heavy_ball'
  | 'ice_ball'
  | 'anchor_ball'
  | 'magnet_ball'
  | 'hopper_ball'
  | 'turbo_ball';

export type GameItemDefinition = {
  id: GameItemId;
  name: string;
  shortName: string;
  description: string;
  color: string;
};

export const GAME_ITEMS: GameItemDefinition[] = [
  {
    id: 'sticky_ball',
    name: 'はりつきボール',
    shortName: 'はりつき',
    description: '次のショット中、最初にぶつかった壁でぴたりと止まります。',
    color: '#f97316',
  },
  {
    id: 'power_ball',
    name: 'パワーボール',
    shortName: 'パワー',
    description: '次のショットの飛ぶ力が大きく上がります。',
    color: '#ef4444',
  },
  {
    id: 'control_ball',
    name: 'コントロールボール',
    shortName: 'コントロール',
    description: '次のショットの力が少し弱くなり、細かく狙いやすくなります。',
    color: '#22c55e',
  },
  {
    id: 'feather_ball',
    name: 'ふわふわボール',
    shortName: 'ふわふわ',
    description: '次のショット中は落ちにくく、やさしく浮くように進みます。',
    color: '#38bdf8',
  },
  {
    id: 'heavy_ball',
    name: 'ヘビーボール',
    shortName: 'ヘビー',
    description: '次のショット中は跳ねにくく、重めの打感になります。',
    color: '#64748b',
  },
  {
    id: 'ice_ball',
    name: 'すべりボール',
    shortName: 'すべり',
    description: '次のショット中はよく滑って、遠くまで伸びやすくなります。',
    color: '#06b6d4',
  },
  {
    id: 'anchor_ball',
    name: 'どっしりボール',
    shortName: 'どっしり',
    description: '次のショット中は勢いが早く落ちて、その場で止まりやすくなります。',
    color: '#a855f7',
  },
  {
    id: 'magnet_ball',
    name: 'じしゃくボール',
    shortName: 'じしゃく',
    description: 'カップの近くを通ると、次のショット中だけ吸い寄せられます。',
    color: '#eab308',
  },
  {
    id: 'hopper_ball',
    name: 'ぴょんぴょんボール',
    shortName: 'ぴょんぴょん',
    description: '次のショット中、最初の壁や床でひときわ高く跳ねます。',
    color: '#84cc16',
  },
  {
    id: 'turbo_ball',
    name: 'ターボボール',
    shortName: 'ターボ',
    description: '次のショット後、少ししてからもうひと伸びします。',
    color: '#ec4899',
  },
];

export const GAME_ITEM_MAP: Record<GameItemId, GameItemDefinition> = Object.fromEntries(
  GAME_ITEMS.map((item) => [item.id, item]),
) as Record<GameItemId, GameItemDefinition>;

export const getRandomItemChoices = (count = 2): GameItemId[] => {
  const pool = [...GAME_ITEMS];
  const picks: GameItemId[] = [];

  while (pool.length > 0 && picks.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    picks.push(pool[index].id);
    pool.splice(index, 1);
  }

  return picks;
};

export const addItemToInventory = (inventory: GameItemId[], itemId: GameItemId, maxSlots = 3) => {
  const nextInventory = [...inventory, itemId];
  return nextInventory.slice(Math.max(0, nextInventory.length - maxSlots));
};
