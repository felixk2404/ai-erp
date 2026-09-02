import { describe, it, expect } from 'vitest';
import { parseLeadForm } from './parse';

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe('parseLeadForm', () => {
  it('accepts name + email, trims, and drops an empty company', () => {
    expect(parseLeadForm(fd({ Name: ' דנה ', Email: 'dana@example.com', Company: '' }))).toEqual({
      ok: true,
      data: { Name: 'דנה', Email: 'dana@example.com', Company: undefined },
    });
  });

  it('keeps a company when given', () => {
    const r = parseLeadForm(fd({ Name: 'דנה', Email: 'dana@example.com', Company: 'דנה בע"מ' }));
    expect(r.ok && r.data.Company).toBe('דנה בע"מ');
  });

  it('rejects an empty name and an invalid email with hebrew messages', () => {
    const r = parseLeadForm(fd({ Name: '', Email: 'not-an-email' }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.Name).toBe('יש להזין שם');
      expect(r.errors.Email).toBe('אימייל לא תקין');
    }
  });
});
