export const DODGE_WIDTH = 960;
export const DODGE_HEIGHT = 540;
export const DODGE_PLAYER_RADIUS = 22;
export const DODGE_BALL_RADIUS = 11;

// Keep these values in one place so debug mode and main game feel the same.
export const DODGE_MOVE_SPEED = 340;
export const DODGE_BALL_SPEED = 560;
export const DODGE_THROW_COOLDOWN_MS = 360;
export const DODGE_SPECIAL_SHOT_MIN_RUNUP_MS = 520;
export const DODGE_BALL_LIFETIME_MS = 1700;
export const DODGE_RESPAWN_MS = 2200;
export const DODGE_THROW_SPAWN_OFFSET = 4;

export const getDodgeCourtSize = (playerCount: number) => {
  // 40人規模では「横だけ拡大」だと表示縮小が強くなるため、
  // 高人数帯ほど縦方向を大きめに伸ばす。
  if (playerCount >= 40) return { width: 1500, height: 1120 };
  if (playerCount >= 32) return { width: 1440, height: 980 };
  if (playerCount >= 24) return { width: 1380, height: 860 };
  if (playerCount >= 16) return { width: 1340, height: 780 };
  if (playerCount >= 12) return { width: 1320, height: 742 };
  if (playerCount >= 8) return { width: 1160, height: 653 };
  return { width: DODGE_WIDTH, height: DODGE_HEIGHT };
};
