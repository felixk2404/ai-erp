// render-menu.js — גוף צומת Code ב-WF5 (מוזרק כ-__CODE_RENDER_MENU__). קלט: callback_data + כל המוצרים.
// פלט: { action: 'menu' | 'lead', text (HTML), keyboard (צורת inlineKeyboard של צומת הטלגרם), product? }.
const SERVICE = 'שירותים';
const MAX_CAT = 30; // callback_data ≤ 64 בתים; עברית = 2 בתים לתו, 'cat:' = 4
const MAX_LIST = 10;
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const price = (n) => Number(n || 0).toLocaleString('he-IL') + ' ₪';
const btn = (text, data) => ({ text, additionalFields: { callback_data: data } });
const keyboard = (...lines) => ({ rows: lines.map((buttons) => ({ row: { buttons } })) });
const catKey = (c) => 'cat:' + String(c).slice(0, MAX_CAT);

function renderMenu(data, products) {
  const items = products
    .filter((p) => p && p.Sku)
    .map((p) => ({
      name: p.Name, sku: p.Sku, category: p.Category || 'אחר', price: p.Price,
      stock: Number(p.Stock) || 0, service: p.Category === SERVICE,
      highlights: String(p.Highlights || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 3),
    }));
  const cats = [...new Set(items.map((i) => i.category))].sort((a, b) => a.localeCompare(b, 'he'));
  const home = (text) => ({ action: 'menu', text: text || 'במה תרצו להתעניין?', keyboard: keyboard(...cats.map((c) => [btn(c, catKey(c))]), [btn('שאלה חופשית', 'ask')]) });
  const d = String(data || 'home');
  if (d === 'home') return home();
  if (d === 'ask') return { action: 'menu', text: 'כתבו כאן כל שאלה ונענה מיד.', keyboard: keyboard([btn('תפריט ראשי', 'home')]) };
  if (d.startsWith('cat:')) {
    const cat = cats.find((c) => catKey(c) === d);
    if (!cat) return home('הקטגוריה כבר לא זמינה.');
    const list = items.filter((i) => i.category === cat).slice(0, MAX_LIST);
    const label = (i) => `${i.name} · ${price(i.price)}${!i.service && i.stock <= 0 ? ' (אזל)' : ''}`;
    return { action: 'menu', text: `<b>${esc(cat)}</b>`, keyboard: keyboard(...list.map((i) => [btn(label(i), 'p:' + i.sku)]), [btn('חזרה', 'home')]) };
  }
  const sku = d.startsWith('p:') ? d.slice(2) : d.startsWith('lead:') ? d.slice(5) : null;
  const item = sku ? items.find((i) => i.sku === sku) : null;
  if (!item) return home('המוצר כבר לא זמין.');
  const product = { name: item.name, sku: item.sku };
  if (d.startsWith('lead:')) return { action: 'lead', text: `מעולה, רשמנו שאתם מתעניינים ב${esc(item.name)}.`, keyboard: keyboard([btn('תפריט ראשי', 'home')]), product };
  const stock = item.service ? 'שירות — זמין תמיד' : item.stock > 0 ? 'במלאי' : 'אזל מהמלאי';
  const text = [`<b>${esc(item.name)}</b>`, `${esc(item.sku)} · ${price(item.price)}`, ...item.highlights.map((h) => `• ${esc(h)}`), stock].join('\n');
  return { action: 'menu', text, keyboard: keyboard([btn('מעוניין', 'lead:' + item.sku)], [btn('חזרה לקטגוריה', catKey(item.category)), btn('תפריט ראשי', 'home')]), product };
}
if (typeof $input !== 'undefined') return [{ json: renderMenu($('Classify').first().json.data, $input.all().map((i) => (i.json && i.json.fields) || i.json)) }];
module.exports = { renderMenu };
