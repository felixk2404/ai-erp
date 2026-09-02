import { describe, it, expect } from 'vitest';
import { leadSourceLabel } from './lead-source';

describe('leadSourceLabel', () => {
  it('maps sources to hebrew, defaults to manual', () => {
    expect(leadSourceLabel('telegram')).toBe('טלגרם');
    expect(leadSourceLabel('manual')).toBe('ידני');
    expect(leadSourceLabel(undefined)).toBe('ידני');
    expect(leadSourceLabel('weird')).toBe('weird');
  });
});
