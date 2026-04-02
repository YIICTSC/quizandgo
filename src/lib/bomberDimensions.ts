export const BOMBER_BASE_WIDTH = 21;
export const BOMBER_BASE_HEIGHT = 15;

const toOddSize = (value: number) => {
  const rounded = Math.max(5, Math.ceil(value));
  return rounded % 2 === 1 ? rounded : rounded + 1;
};

export const getBomberDimensions = (playerCount: number) => {
  const normalizedCount = Math.max(4, playerCount);
  const targetArea = normalizedCount * 79;
  const aspect = BOMBER_BASE_WIDTH / BOMBER_BASE_HEIGHT;
  const width = Math.max(BOMBER_BASE_WIDTH, toOddSize(Math.sqrt(targetArea * aspect)));
  const height = Math.max(BOMBER_BASE_HEIGHT, toOddSize(targetArea / width));
  return { width, height };
};
