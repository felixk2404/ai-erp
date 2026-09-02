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
      data: { Name: 'דנה', Email: 'dana@example.com', Company: undefined, Phone: undefined },
    });
  });

  it('accepts an israeli phone with or without dash and strips spaces', () => {
    const r = parseLeadForm(fd({ Name: 'דנה', Email: 'dana@example.com', Phone: '050 123 4567' }));
    expect(r.ok && r.data.Phone).toBe('0501234567');
    const r2 = parseLeadForm(fd({ Name: 'דנה', Email: 'dana@example.com', Phone: '03-1234567' }));
    expect(r2.ok && r2.data.Phone).toBe('03-1234567');
  });

  it('drops an empty phone and rejects a bad one', () => {
    const r = parseLeadForm(fd({ Name: 'דנה', Email: 'dana@example.com', Phone: '' }));
    expect(r.ok && r.data.Phone).toBeUndefined();
    const bad = parseLeadForm(fd({ Name: 'דנה', Email: 'dana@example.com', Phone: '12345' }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.Phone).toBe('טלפון לא תקין');
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
