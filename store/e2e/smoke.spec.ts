import { test, expect, type Page } from '@playwright/test';
import { POLICIES } from '../src/content/policies';

/**
 * מסלול הלקוח מקצה לקצה. רץ מול dev (3200) או מול production
 * (`PLAYWRIGHT_BASE_URL=https://…`), ולכן אין כאן שום סוד ושום קריאה ישירה
 * ל-Airtable — רק מה שדפדפן של לקוח רואה.
 *
 * בדיקת הקופה יוצרת **הזמנה אמיתית** ב-Airtable ושולחת מייל. לכן היא היחידה
 * ב-`describe.serial`, והיא מדולגת כש-`E2E_NO_ORDER` מוגדר (כך רצים מול
 * production בלי להוסיף עוד הזמנה — מספיקה אחת לכל סביבה).
 */

const CART_KEY = 'aie-cart-v1';

/** מק"ט פיזי, במלאי, זול — הפריט של בדיקות העגלה והקופה. */
const ITEM = { sku: 'TY-CB-UC100', name: 'כבל USB-C 100W באורך 2 מטר', price: 45, qty: 1, service: false };

/** מק"ט שאזל מהמלאי בקטלוג (מסך אולטרה-רחב). */
const OUT_OF_STOCK_SKU = 'TY-MN-34U';

/** זורע עגלה לפני ההידרציה — ה-provider קורא את המפתח הזה ב-mount. */
async function seedCart(page: Page) {
  await page.addInitScript(
    ([key, cart]) => localStorage.setItem(key as string, cart as string),
    [CART_KEY, JSON.stringify({ lines: [ITEM] })] as const,
  );
}

const cardLinks = (page: Page) => page.locator('h3 a[href^="/products/"]');

/** תוכן העמוד בלבד — בלי הכותרת, הפוטר ומכריז-המסלול של Next (שגם הוא role=alert). */
const main = (page: Page) => page.getByRole('main');

test('דף הבית נטען RTL עם הכותרת הראשית וסל ריק', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(page.getByRole('heading', { level: 1, name: 'טכנולוגיה שרואים.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'פתיחת הסל. הסל ריק' })).toBeVisible();
});

test('קטלוג: סינון לפי קטגוריה, חיפוש HDMI ותצוגת טבלה', async ({ page }) => {
  await page.goto('/products');
  const cards = cardLinks(page);
  await expect(cards.first()).toBeVisible();
  const all = await cards.count();

  await page.getByRole('group', { name: 'קטגוריות' }).getByRole('button', { name: 'אוזניות' }).click();
  await expect(async () => expect(await cards.count()).toBeLessThan(all)).toPass();

  await page.getByRole('group', { name: 'קטגוריות' }).getByRole('button', { name: 'הכל' }).click();
  await page.getByRole('searchbox', { name: 'חיפוש מוצרים' }).fill('HDMI');
  await expect(page.getByRole('link', { name: /כבל HDMI 2\.1/ })).toBeVisible();

  await page.getByRole('button', { name: 'תצוגת טבלה' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('columnheader').first()).toBeVisible();
});

test('עמוד מוצר: מחיר, מלאי, הוספה לסל ופתיחת המגירה', async ({ page }) => {
  await page.goto(`/products/${ITEM.sku}`);
  await expect(page.getByRole('heading', { level: 1, name: ITEM.name })).toBeVisible();
  const buyBox = page.locator('aside').first();
  await expect(buyBox.getByText('₪').first()).toBeVisible();
  await expect(buyBox.getByText('במלאי')).toBeVisible();

  await buyBox.getByRole('button', { name: /הוסף לסל/ }).click();

  await expect(page.getByRole('button', { name: 'פתיחת הסל. בסל מוצר אחד' })).toBeVisible();
  const drawer = page.getByRole('dialog', { name: 'הסל שלך' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText(ITEM.name)).toBeVisible();
  await expect(drawer.getByRole('link', { name: /לקופה/ })).toBeVisible();
});

test('קופה: שם ריק מחזיר שגיאה בעברית מתחת לשדה', async ({ page }) => {
  await seedCart(page);
  await page.goto('/checkout');
  const name = page.getByLabel('שם מלא');
  await expect(name).toBeVisible();
  await page.getByRole('button', { name: /אישור הזמנה/ }).click();
  await expect(page.getByText('צריך שם מלא')).toBeVisible();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
});

test('מעקב: אימייל שגוי מחזיר "לא נמצאה"', async ({ page }) => {
  await page.goto('/track');
  await page.getByLabel('מספר הזמנה').fill('ORD-0001');
  await page.getByLabel('אימייל').fill('not-the-buyer@example.com');
  await page.getByRole('button', { name: 'בדיקת סטטוס' }).click();
  await expect(page).toHaveURL(/\/orders\/ORD-0001/);
  await expect(main(page).getByRole('alert')).toContainText('לא נמצאה', { timeout: 45_000 });
});

test('וידג׳ט השירות נפתח ומחזיר תשובה מהסוכן', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'שירות לקוחות' }).click();
  const chat = page.getByRole('log', { name: 'שיחה' });
  await expect(chat).toBeVisible();
  await page.getByRole('textbox', { name: 'הודעה' }).fill('יש במלאי TY-HP-200?');
  await page.getByRole('button', { name: 'שליחה' }).click();
  // התשובה מגיעה מ-LLM — בודקים שהיא הגיעה ושאינה שגיאה, לא את תוכנה.
  await expect(chat.locator('p.bg-panel-3')).toHaveCount(1, { timeout: 45_000 });
});

test('מוצר שאזל: תג "אזל" והפניה לבוט במקום הבטחת התראה', async ({ page }) => {
  await page.goto(`/products/${OUT_OF_STOCK_SKU}`);
  const buyBox = page.locator('aside').first();
  await expect(buyBox.getByText('אזל')).toBeVisible();
  await expect(buyBox.getByRole('button', { name: /התראות חזרה למלאי/ })).toBeVisible();
  await expect(buyBox.getByRole('button', { name: /הוסף לסל/ })).toHaveCount(0);
});

test('עמוד המדיניות מציג את כל הסעיפים', async ({ page }) => {
  await page.goto('/policies');
  await expect(page.getByRole('heading', { level: 1, name: 'מדיניות החנות' })).toBeVisible();
  // מספר הסעיפים גדל עם `content/policies.ts` — נספר משם ולא ממספר קסם שמתיישן.
  await expect(main(page).getByRole('heading', { level: 2 })).toHaveCount(POLICIES.length);
  for (const title of ['משלוחים', 'החזרות והחלפות', 'אחריות', 'תשלומים']) {
    await expect(main(page).getByRole('heading', { level: 2, name: title })).toBeVisible();
  }
});

// ————————————————————————————————————————————————————————————————
// כותב לעולם האמיתי: הזמנה אחת, בסביבה אחת. `E2E_NO_ORDER=1` מדלג.
test.describe.serial('קופה מקצה לקצה', () => {
  test.skip(!!process.env.E2E_NO_ORDER, 'E2E_NO_ORDER — לא יוצרים הזמנה אמיתית');

  test('הזמנה אמיתית מגיעה לעמוד ORD עם "התקבלה"', async ({ page }) => {
    await seedCart(page);
    await page.goto('/checkout');
    await page.getByLabel('שם מלא').fill('בדיקת E2E');
    await page.getByLabel('אימייל').fill('felixk2404@gmail.com');
    await page.getByLabel('טלפון').fill('050-0000000');
    await page.getByLabel('כתובת').fill('הרצל 1');
    await page.getByLabel('עיר').fill('תל אביב');
    await page.getByRole('button', { name: /אישור הזמנה/ }).click();

    // WF10: מלאי → הזמנה → חשבונית → מייל. עד 90 שניות (runbook §7.1).
    await page.waitForURL(/\/orders\/ORD-\d+/, { timeout: 120_000 });
    await expect(page.getByText('מספר הזמנה')).toBeVisible({ timeout: 60_000 });
    console.log('order created:', new URL(page.url()).pathname);
  });
});
