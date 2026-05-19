import { describe, it, expect } from 'vitest';
import { formatTime, formatDuration, calculateProductivityScore } from './helpers';

describe('helpers', () => {
  it('formats time as MM:SS', () => {
    expect(formatTime(125)).toBe('02:05');
    expect(formatTime(3661)).toBe('1:01:01');
  });

  it('formats duration', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('calculates productivity score', () => {
    const score = calculateProductivityScore(100, true, 5);
    expect(score).toBeGreaterThanOrEqual(80);
  });
});
