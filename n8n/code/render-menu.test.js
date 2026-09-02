const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderMenu } = require('./render-menu.js');

const products = [
  { Name: 'מסך 27 אינץ\' TY-Vision', Sku: 'TY-MN-27Q', Category: 'מסכים', Price: 1290, Stock: 3, Highlights: 'פאנל IPS\n165Hz\nQHD\nרביעי לא נכנס' },
  { Name: 'כבל HDMI 2.1', Sku: 'TY-CB-HD21', Category: 'כבלים', Price: 59, Stock: 0, Highlights: 'HDMI 2.1' },
  { Name: 'תיקון מעבדה <בחנות>', Sku: 'TY-SRV-04', Category: 'שירותים', Price: 149, Highlights: '' },
];
const buttons = (k) => k.rows.map((r) => r.row.buttons.map((b) => [b.text, b.additionalFields.callback_data]));

test('home lists categories alphabetically plus free question', () => {
  const m = renderMenu('home', products);
  assert.equal(m.action, 'menu');
  assert.deepEqual(buttons(m.keyboard), [[['כבלים', 'cat:כבלים']], [['מסכים', 'cat:מסכים']], [['שירותים', 'cat:שירותים']], [['שאלה חופשית', 'ask']]]);
});

test('category lists products with price, marks out of stock, has back', () => {
  const m = renderMenu('cat:כבלים', products);
  assert.deepEqual(buttons(m.keyboard), [[['כבל HDMI 2.1 · 59 ₪ (אזל)', 'p:TY-CB-HD21']], [['חזרה', 'home']]]);
});

test('product shows sku, price, up to 3 highlights, stock line, and buttons', () => {
  const m = renderMenu('p:TY-MN-27Q', products);
  assert.equal(m.text, '<b>מסך 27 אינץ\' TY-Vision</b>\nTY-MN-27Q · 1,290 ₪\n• פאנל IPS\n• 165Hz\n• QHD\nבמלאי');
  assert.deepEqual(buttons(m.keyboard), [[['מעוניין', 'lead:TY-MN-27Q']], [['חזרה לקטגוריה', 'cat:מסכים'], ['תפריט ראשי', 'home']]]);
  assert.deepEqual(m.product, { name: 'מסך 27 אינץ\' TY-Vision', sku: 'TY-MN-27Q' });
});

test('service is always available and html is escaped', () => {
  const m = renderMenu('p:TY-SRV-04', products);
  assert.ok(m.text.startsWith('<b>תיקון מעבדה &lt;בחנות&gt;</b>'));
  assert.ok(m.text.endsWith('שירות — זמין תמיד'));
});

test('lead action carries the product and a home button', () => {
  const m = renderMenu('lead:TY-CB-HD21', products);
  assert.equal(m.action, 'lead');
  assert.equal(m.text, 'מעולה, רשמנו שאתם מתעניינים בכבל HDMI 2.1.');
  assert.deepEqual(m.product, { name: 'כבל HDMI 2.1', sku: 'TY-CB-HD21' });
});

test('unknown sku or category falls back to home with a note', () => {
  assert.equal(renderMenu('p:NOPE', products).text, 'המוצר כבר לא זמין.');
  assert.equal(renderMenu('cat:אין', products).text, 'הקטגוריה כבר לא זמינה.');
  assert.equal(renderMenu('ask', products).text, 'כתבו כאן כל שאלה ונענה מיד.');
});

test('callback_data stays within 64 bytes for long category names', () => {
  const long = { Name: 'x', Sku: 'X-1', Category: 'קטגוריה עם שם ארוך מאוד שחורג ממגבלת הבתים של טלגרם', Price: 1, Stock: 1 };
  const m = renderMenu('home', [long]);
  const data = m.keyboard.rows[0].row.buttons[0].additionalFields.callback_data;
  assert.ok(Buffer.byteLength(data, 'utf8') <= 64);
  assert.equal(renderMenu(data, [long]).keyboard.rows[0].row.buttons[0].additionalFields.callback_data, 'p:X-1');
});

test('categories sharing a 30-char prefix get distinct, resolvable keys', () => {
  const items = [
    { Name: 'מוצר X', Sku: 'X-1', Category: 'א'.repeat(30) + 'X', Price: 10, Stock: 1 },
    { Name: 'מוצר Y', Sku: 'Y-1', Category: 'א'.repeat(30) + 'Y', Price: 20, Stock: 1 },
  ];
  const m = renderMenu('home', items);
  const keys = buttons(m.keyboard).slice(0, 2).map((row) => row[0][1]);
  assert.notEqual(keys[0], keys[1]);
  for (const k of keys) assert.ok(Buffer.byteLength(k, 'utf8') <= 64);
  const skus = keys.map((k) => buttons(renderMenu(k, items).keyboard)[0][0][1]).sort();
  assert.deepEqual(skus, ['p:X-1', 'p:Y-1']);
});
