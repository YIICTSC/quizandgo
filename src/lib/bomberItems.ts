export type BomberItemId = 'fire_up' | 'kick_bomb' | 'shield' | 'remote_bomb' | 'pierce_fire' | 'speed_up';

export const BOMBER_ITEM_META: Record<
  BomberItemId,
  {
    label: string;
    color: string;
    iconAsset: string;
  }
> = {
  fire_up: { label: '火力', color: '#f97316', iconAsset: '/bomber-item-icons/fire_up.svg' },
  kick_bomb: { label: 'キック', color: '#f59e0b', iconAsset: '/bomber-item-icons/kick_bomb.svg' },
  shield: { label: 'シールド', color: '#38bdf8', iconAsset: '/bomber-item-icons/shield.svg' },
  remote_bomb: { label: 'リモコン', color: '#22d3ee', iconAsset: '/bomber-item-icons/remote_bomb.svg' },
  pierce_fire: { label: '貫通', color: '#f43f5e', iconAsset: '/bomber-item-icons/pierce_fire.svg' },
  speed_up: { label: 'スピード', color: '#a3e635', iconAsset: '/bomber-item-icons/speed_up.svg' },
};
