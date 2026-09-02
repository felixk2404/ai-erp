import { describe, it, expect } from 'vitest';
import { parseCustomerForm, nextCustomerId } from './parse';

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe('parseCustomerForm', () => {
  it('accepts a name with optional email/phone', () => {
    expect(parseCustomerForm(fd({ Name: 'דוד לוי', Email: '', Phone: '050-1234567' }))).toEqual({
      ok: true,
      data: { Name: 'דוד לוי', Email: undefined, Phone: '050-1234567' },
    });
  });

  it('rejects an empty name and a malformed email', () => {
    const r = parseCustomerForm(fd({ Name: '', Email: 'x' }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.Name).toBe('יש להזין שם');
      expect(r.errors.Email).toBe('אימייל לא תקין');
    }
  });
});

describe('nextCustomerId', () => {
  it('continues from the highest existing number, zero-padded to 4', () => {
    expect(nextCustomerId(['CUST-0001', 'CUST-0007', 'CUST-0003'])).toBe('CUST-0008');
    expect(nextCustomerId([])).toBe('CUST-0001');
    expect(nextCustomerId(['garbage', 'CUST-12'])).toBe('CUST-0013');
  });
});
