export type ScorePlayerLike = {
  holesCompleted?: number;
  totalStrokes?: number;
  correctAnswers?: number;
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

export const calculateGameScore = (gameType: string | undefined, player: ScorePlayerLike) => {
  if (gameType === 'quiz') {
    return calculateQuizScore(player);
  }
  return calculateGolfScore(player);
};
