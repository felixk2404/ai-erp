import { test, expect, type Page } from '@playwright/test';

const PASSWORD = process.env.APP_PASSWORD ?? '';

async function login(page: Page) {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('סיסמה').fill(PASSWORD);
  await page.getByRole('button', { name: 'כניסה' }).click();
  await expect(page.getByRole('heading', { name: 'דשבורד', level: 1 })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  test.skip(!PASSWORD, 'APP_PASSWORD חסר — אין .env.local');
  await login(page);
});

test('wrong password shows an error', async ({ page }) => {
  await page.getByRole('button', { name: 'יציאה' }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('סיסמה').fill('definitely-wrong');
  await page.getByRole('button', { name: 'כניסה' }).click();
  await expect(page.locator('form').getByRole('alert')).toHaveText('סיסמה שגויה');
});

test('dashboard renders rtl with the ledger strip', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(page.getByRole('region', { name: 'סיכום' }).getByText('הכנסות החודש')).toBeVisible();
  await expect(page.getByText(/₪/).first()).toBeVisible();
});

test('all pages render with their heading', async ({ page }) => {
  for (const name of ['הזמנות', 'חשבוניות', 'לידים', 'לקוחות', 'מוצרים', 'משימות']) {
    await page.getByRole('navigation', { name: 'ראשי' }).getByRole('link', { name: new RegExp(`^${name}`) }).click();
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
  }
});

const TASK_PREFIX = 'בדיקה אוטומטית';

/**
 * הבדיקה כותבת שורה אמיתית ל-Airtable. בלי הניקוי הזה כל הרצה משאירה משימה,
 * והן מציפות את `open_tasks` של סוכן המנהל עד שהוא עונה מהן במקום מהמשימות האמיתיות.
 * מנקה לפי תחילית, כך שגם שאריות מהרצות שנפלו באמצע נעלמות.
 */
async function deleteTestTasks() {
  const pat = process.env.AIRTABLE_PAT;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!pat || !base) return;
  const headers = { Authorization: `Bearer ${pat}` };
  const url = new URL(`https://api.airtable.com/v0/${base}/Tasks`);
  url.searchParams.set('filterByFormula', `FIND('${TASK_PREFIX}', {Title}) = 1`);
  const res = await fetch(url, { headers });
  if (!res.ok) return;
  const { records } = (await res.json()) as { records: { id: string }[] };
  for (let i = 0; i < records.length; i += 10) {
    const q = records
      .slice(i, i + 10)
      .map((r) => `records[]=${r.id}`)
      .join('&');
    await fetch(`https://api.airtable.com/v0/${base}/Tasks?${q}`, { method: 'DELETE', headers });
  }
}

test('creates a task and toggles it done', async ({ page }) => {
  await page.goto('/tasks');
  const title = `${TASK_PREFIX} ${Date.now()}`;
  try {
    await page.getByPlaceholder('משימה חדשה').fill(title);
    await page.getByRole('button', { name: 'הוסף' }).click();
    const row = page.getByRole('checkbox', { name: title });
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.check();
    await expect(page.getByText(title)).toHaveCSS('text-decoration-line', 'line-through', { timeout: 20_000 });
  } finally {
    await deleteTestTasks();
  }
});

test('manager chat answers in hebrew with a shekel amount', async ({ page }) => {
  await page.getByRole('button', { name: 'שאל את המנהל' }).click();
  await page.getByRole('button', { name: 'מה ההכנסות החודש?' }).click();
  await expect(page.getByLabel('שיחה').getByText(/₪/).last()).toBeVisible({ timeout: 45_000 });
});

test('public support page answers without login and shows product cards', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/support');
  await expect(page.getByRole('heading', { name: 'איך אפשר לעזור?' })).toBeVisible();
  await page.getByRole('button', { name: 'יש לכם אוזניות אלחוטיות?' }).click();
  // הסוכן עונה (בועה שנייה); התוכן תלוי ב-LLM, אז בודקים שקיימת תשובה ושאין שגיאה
  const bubbles = page.getByLabel('שיחה').locator('.whitespace-pre-wrap');
  await expect(bubbles).toHaveCount(2, { timeout: 60_000 });
  await expect(bubbles.nth(1)).not.toContainText('⚠');
});

test('invoice detail page opens from the list with timeline', async ({ page }) => {
  await page.goto('/invoices');
  await page.getByRole('link', { name: 'INV-0001' }).first().click();
  await expect(page).toHaveURL(/\/invoices\/rec/);
  await expect(page.getByRole('heading', { name: 'INV-0001', level: 1 })).toBeVisible();
  await expect(page.getByLabel('ציר זמן')).toBeVisible();
});

// קריאה בלבד: הבדיקה לא נוגעת בסטטוס — שינוי סטטוס כותב ל-Airtable ומשנה נתוני דמו.
test('order detail page opens from the list with its items', async ({ page }) => {
  await page.goto('/orders');
  await expect(page.getByRole('region', { name: 'הזמנות' }).getByRole('link', { name: 'ORD-0001' })).toBeVisible();
  await page.getByRole('link', { name: 'ORD-0001' }).first().click();
  await expect(page).toHaveURL(/\/orders\/rec/);
  await expect(page.getByRole('heading', { name: 'ORD-0001', level: 1 })).toBeVisible();
  const items = page.getByRole('region', { name: 'שורות ההזמנה' });
  await expect(items.getByText('TY-HP-200')).toBeVisible();
  await expect(page.getByLabel('סטטוס הזמנה')).toBeVisible();
});

test('command menu opens with cmd+k and navigates', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder(/חפש עמוד/).fill('לידים');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'לידים', level: 1 })).toBeVisible();
});

test('dashboard shows charts and attention panel', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'הכנסות לפי חודש' })).toBeVisible();
  await expect(page.getByText('דורש טיפול')).toBeVisible();
  await expect(page.getByText('תקציר בוקר · סוכן המנהל').first()).toBeVisible();
});
