export const nowMs = () => Date.now();

export const seconds = (value: number) => value * 1000;

export const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const secondsLeft = totalSeconds % 60;
  return `${minutes}m ${secondsLeft}s`;
};
