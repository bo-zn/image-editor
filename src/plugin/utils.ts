export function clamp(value: number, minValue: number, maxValue: number): number {
  if (minValue > maxValue) {
    [minValue, maxValue] = [maxValue, minValue];
  }

  return Math.max(minValue, Math.min(value, maxValue));
}