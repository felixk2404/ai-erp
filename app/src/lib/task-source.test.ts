import { describe, it, expect } from 'vitest';
import { taskSourceMeta } from './task-source';

describe('taskSourceMeta', () => {
  it('maps every automated source to a hebrew label and a target page', () => {
    expect(taskSourceMeta('order')).toEqual({ label: 'משלוח', href: '/customers' });
    expect(taskSourceMeta('stock')).toEqual({ label: 'מלאי', href: '/products' });
    expect(taskSourceMeta('lead')).toEqual({ label: 'ליד', href: '/leads' });
    expect(taskSourceMeta('invoice')).toEqual({ label: 'חשבונית', href: '/invoices' });
  });

  it('manual and missing sources have no link', () => {
    expect(taskSourceMeta('manual')).toEqual({ label: 'ידני', href: null });
    expect(taskSourceMeta(undefined)).toEqual({ label: 'ידני', href: null });
  });

  it('falls back to the raw value for unknown sources', () => {
    expect(taskSourceMeta('weird')).toEqual({ label: 'weird', href: null });
  });
});
