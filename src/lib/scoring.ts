export type ScorePlayerLike = {
  holesCompleted?: number;
  totalStrokes?: number;
  correctAnswers?: number;
  quizPoints?: number;
  quizCombo?: number;
  maxQuizCombo?: number;
  fastestAnswerMs?: number | null;
  quizLives?: number;
  battleRoyaleWins?: number;
  kills?: number;
  blocksDestroyed?: number;
  deaths?: number;
  timeAliveMs?: number;
  territoryCells?: number;
  dodgeValue?: number;
  dodgeHasBall?: boolean;
};

export const calculateGolfScore = (player: ScorePlayerLike) => {
  const holesCompleted = player.holesCompleted || 0;
  const totalStrokes = player.totalStrokes || 0;
  const correctAnswers = player.correctAnswers || 0;

  return (holesCompleted * 1000) + (correctAnswers * 50) - (totalStrokes * 25);
};

export const calculateQuizScore = (player: ScorePlayerLike) => {
  if (typeof player.quizLives === 'number' && typeof player.quizPoints === 'number') {
    return (player.quizLives * 1000) + player.quizPoints + ((player.battleRoyaleWins || 0) * 120);
  }
  if (typeof player.quizPoints === 'number') {
    return player.quizPoints;
  }
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

export const calculateDodgeScore = (player: ScorePlayerLike) => {
  const kills = player.kills || 0;
  const correctAnswers = player.correctAnswers || 0;
  const deaths = player.deaths || 0;
  const timeAliveMs = player.timeAliveMs || 0;
  const dodgeValue = player.dodgeValue || 0;
  const hasBallBonus = player.dodgeHasBall ? 40 : 0;

  return (kills * 320) + (correctAnswers * 100) + Math.floor(timeAliveMs / 1000) * 3 + (dodgeValue * 30) + hasBallBonus - (deaths * 110);
};

export const calculateGameScore = (gameType: string | undefined, player: ScorePlayerLike) => {
  if (gameType === 'quiz') {
    return calculateQuizScore(player);
  }
  if (gameType === 'dodge') {
    return calculateDodgeScore(player);
  }
  if (gameType === 'color_bomber') {
    return calculateColorBomberScore(player);
  }
  if (gameType === 'bomber' || gameType === 'team_bomber') {
    return calculateBomberScore(player);
  }
  return calculateGolfScore(player);
};
