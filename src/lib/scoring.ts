export type ScorePlayerLike = {
  holesCompleted?: number;
  totalStrokes?: number;
  correctAnswers?: number;
  kills?: number;
  blocksDestroyed?: number;
  deaths?: number;
  timeAliveMs?: number;
  territoryCells?: number;
};

export const calculateGolfScore = (player: ScorePlayerLike) => {
  const holesCompleted = player.holesCompleted || 0;
  const totalStrokes = player.totalStrokes || 0;
  const correctAnswers = player.correctAnswers || 0;

  return (holesCompleted * 1000) + (correctAnswers * 50) - (totalStrokes * 25);
};

export const calculateQuizScore = (player: ScorePlayerLike) => {
  const correctAnswers = player.correctAnswers || 0;
  return correctAnswers * 100;
};

export const calculateBomberScore = (player: ScorePlayerLike) => {
  const kills = player.kills || 0;
  const blocksDestroyed = player.blocksDestroyed || 0;
  const correctAnswers = player.correctAnswers || 0;
  const deaths = player.deaths || 0;
  const timeAliveMs = player.timeAliveMs || 0;

  return (kills * 500) + (blocksDestroyed * 40) + (correctAnswers * 100) + Math.floor(timeAliveMs / 1000) * 2 - (deaths * 120);
};

export const calculateColorBomberScore = (player: ScorePlayerLike) => {
  const baseScore = calculateBomberScore(player);
  const territoryCells = player.territoryCells || 0;
  return baseScore + (territoryCells * 30);
};

export const calculateGameScore = (gameType: string | undefined, player: ScorePlayerLike) => {
  if (gameType === 'quiz') {
    return calculateQuizScore(player);
  }
  if (gameType === 'color_bomber') {
    return calculateColorBomberScore(player);
  }
  if (gameType === 'bomber' || gameType === 'team_bomber') {
    return calculateBomberScore(player);
  }
  return calculateGolfScore(player);
};
