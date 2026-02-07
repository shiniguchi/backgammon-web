export const rollDie = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

export const rollDice = (): [number, number] => {
  return [rollDie(), rollDie()];
};

export const getDiceRemaining = (values: [number, number]): number[] => {
  // If doubles, 4 moves available
  if (values[0] === values[1]) {
    return [values[0], values[0], values[0], values[0]];
  }
  return [values[0], values[1]];
};

export const removeDieFromRemaining = (remaining: number[], dieValue: number): number[] => {
  const index = remaining.indexOf(dieValue);
  if (index === -1) return remaining;
  return [...remaining.slice(0, index), ...remaining.slice(index + 1)];
};

export const getUniqueDice = (remaining: number[]): number[] => {
  return [...new Set(remaining)];
};
