import { describe, expect, it } from 'vitest';
import { formatMinor, minorToInput, parseMajorToMinor } from './money';

describe('money input/display helpers', () => {
  it('parses user input into integer minor units without floating point', () => {
    expect(parseMajorToMinor('1500', 2)).toBe(150000);
    expect(parseMajorToMinor('1,500.50', 2)).toBe(150050);
    expect(parseMajorToMinor('0.1', 2)).toBe(10);
    expect(parseMajorToMinor('19.99', 2)).toBe(1999);
    expect(parseMajorToMinor('1000', 0)).toBe(1000);
  });
  it('rejects invalid input', () => {
    for (const bad of ['', 'abc', '-5', '1.234', '1e3', '1.2.3', ' ']) expect(parseMajorToMinor(bad, 2), bad).toBeNull();
    expect(parseMajorToMinor('10.5', 0)).toBeNull();
  });
  it('round-trips for editing', () => {
    expect(minorToInput(150000, 2)).toBe('1500');
    expect(minorToInput(150050, 2)).toBe('1500.5');
    expect(minorToInput(5, 2)).toBe('0.05');
    expect(minorToInput(5, 0)).toBe('5');
  });
  it('formats using the configured currency, not a hard-coded one', () => {
    expect(formatMinor(150000, { code: 'INR', minorUnits: 2 })).toMatch(/1,500\.00/);
    expect(formatMinor(150000, { code: 'USD', minorUnits: 2 })).toMatch(/\$|US\$/);
  });
});
