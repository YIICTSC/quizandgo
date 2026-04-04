export const DODGE_WIDTH = 960;
export const DODGE_HEIGHT = 540;
export const DODGE_PLAYER_RADIUS = 22;
export const DODGE_BALL_RADIUS = 11;

// Keep these values in one place so debug mode and main game feel the same.
export const DODGE_MOVE_SPEED = 340;
export const DODGE_BALL_SPEED = 560;
export const DODGE_THROW_COOLDOWN_MS = 360;
export const DODGE_BALL_LIFETIME_MS = 1700;
export const DODGE_RESPAWN_MS = 2200;
export const DODGE_THROW_SPAWN_OFFSET = 4;

export const getDodgeCourtSize = (playerCount: number) => {
  if (playerCount >= 12) return { width: 1320, height: 742 };
  if (playerCount >= 8) return { width: 1160, height: 653 };
  return { width: DODGE_WIDTH, height: DODGE_HEIGHT };
};
