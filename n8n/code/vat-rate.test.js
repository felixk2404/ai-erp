const { test } = require('node:test');
const assert = require('node:assert/strict');
const { vatRate, VAT_CHANGE_DATE } = require('./vat-rate.js');

test('18% מ-1.1.2025, 17% לפני — הכלל במסמך הקורס §10', () => {
  assert.equal(vatRate('2024-12-31T23:59:59.000Z'), 0.17);
  assert.equal(vatRate('2025-01-01T00:00:00.000Z'), 0.18);
  assert.equal(vatRate('2026-09-15T10:00:00.000Z'), 0.18);
  assert.equal(VAT_CHANGE_DATE, '2025-01-01');
});

test('תאריך חסר או שבור מקבל את השיעור הנוכחי, לעולם לא 0', () => {
  assert.equal(vatRate(undefined), 0.18);
  assert.equal(vatRate(''), 0.18);
  assert.equal(vatRate('not a date'), 0.18);
});
