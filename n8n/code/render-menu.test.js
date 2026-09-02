const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderMenu, S } = require('./render-menu.js');

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

test('an opening /start introduces the store, a menu reached from inside the conversation does not', () => {
  assert.equal(renderMenu('home', products).text, 'היי, כאן איי.איי אלקטרוניקה. אפשר לעיין בקטלוג או לשאול כל שאלה.');
  const again = renderMenu('home', products, true);
  assert.equal(again.text, 'במה נעזור?');
  assert.ok(again.text.length < renderMenu('home', products).text.length);
  assert.deepEqual(buttons(again.keyboard), buttons(renderMenu('home', products).keyboard));
});

test('category lists products with price, marks out of stock, and offers the way back', () => {
  const m = renderMenu('cat:כבלים', products);
  assert.deepEqual(buttons(m.keyboard), [[['כבל HDMI 2.1 · 59 ₪ (אזל)', 'p:TY-CB-HD21']], [['תפריט ראשי', 'home']]]);
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

test('lead action says what was done and what happens next, and carries the product', () => {
  const m = renderMenu('lead:TY-CB-HD21', products);
  assert.equal(m.action, 'lead');
  assert.equal(m.text, 'רשמנו. נחזור אליכם עם פרטים על כבל HDMI 2.1.');
  assert.deepEqual(m.product, { name: 'כבל HDMI 2.1', sku: 'TY-CB-HD21' });
});

test('unknown sku or category falls back to home with a note', () => {
  assert.equal(renderMenu('p:NOPE', products).text, 'המוצר כבר לא זמין.');
  assert.equal(renderMenu('cat:אין', products).text, 'הקטגוריה כבר לא זמינה.');
  assert.equal(renderMenu('ask', products).text, 'כתבו כאן מה מחפשים ונענה.');
});

test('no screen is a dead end: the same way back sits last on every screen below home', () => {
  for (const d of ['ask', 'cat:כבלים', 'p:TY-MN-27Q', 'lead:TY-CB-HD21']) {
    const rows = buttons(renderMenu(d, products, true).keyboard);
    const last = rows[rows.length - 1];
    assert.deepEqual(last[last.length - 1], ['תפריט ראשי', 'home'], d);
  }
  // מסכי הנפילה מחזירים לתפריט עצמו, ולכן הם נושאים את כפתורי הבית
  const homeKeys = buttons(renderMenu('home', products).keyboard).flat().map((b) => b[1]);
  for (const d of ['p:NOPE', 'cat:אין', 'לא קיים']) assert.deepEqual(buttons(renderMenu(d, products).keyboard).flat().map((b) => b[1]), homeKeys, d);
});

// אין כאן בדיקה של "צורה דקדוקית אחידה" — אי אפשר לקבוע צורה בעברית מתוך מחרוזת בלי לזייף את הבדיקה.
// מה שכן נבדק: הצורה החיצונית של תוויות הכפתורים, שממנה נגזרת האחידות בעין.
test('button labels stay short and carry no final punctuation', () => {
  for (const key of ['askBtn', 'leadBtn', 'backBtn', 'homeBtn']) {
    assert.ok(S[key].split(' ').length <= 3, key);
    assert.ok(!/[.?!:,]$/.test(S[key]), key);
  }
});

test('callback_data stays within 64 bytes for long category names', () => {
  const long = { Name: 'x', Sku: 'X-1', Category: 'קטגוריה עם שם ארוך מאוד שחורג ממגבלת הבתים של טלגרם', Price: 1, Stock: 1 };
  const m = renderMenu('home', [long]);
  const data = m.keyboard.rows[0].row.buttons[0].additionalFields.callback_data;
  assert.ok(Buffer.byteLength(data, 'utf8') <= 64);
  assert.equal(renderMenu(data, [long]).keyboard.rows[0].row.buttons[0].additionalFields.callback_data, 'p:X-1');
});

test('empty catalog (or Airtable error item) shows the error screen with a way forward', () => {
  for (const products of [[], [{ error: 'boom' }]]) {
    const m = renderMenu('home', products);
    assert.equal(m.text, 'משהו השתבש אצלנו. אפשר לנסות שוב.');
    assert.deepEqual(buttons(m.keyboard), [[['תפריט ראשי', 'home']]]);
  }
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
