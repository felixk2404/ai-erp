import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('./env', () => ({ env: () => ({ AIRTABLE_PAT: 'pat', AIRTABLE_BASE_ID: 'appX' }) }));

import { searchFormula } from './search-formula';

describe('searchFormula', () => {
  it('builds a case-insensitive OR over the given fields', () => {
    expect(searchFormula(['Name', 'Email'], ' Dav ')).toBe("OR(FIND('dav', LOWER({Name})), FIND('dav', LOWER({Email})))");
  });
  it('returns undefined for a blank query so the caller sends no filter at all', () => {
    expect(searchFormula(['Name'], '')).toBeUndefined();
    expect(searchFormula(['Name'], '   ')).toBeUndefined();
  });
  it('escapes quotes and backslashes so a user cannot break out of the formula', () => {
    expect(searchFormula(['Name'], "o'neil\\")).toBe("OR(FIND('o\\'neil\\\\', LOWER({Name})))");
  });
});
