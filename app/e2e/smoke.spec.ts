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
  await expect(page.getByText('הכנסות החודש')).toBeVisible();
  await expect(page.getByText(/₪/).first()).toBeVisible();
});

test('all pages render with their heading', async ({ page }) => {
  for (const name of ['חשבוניות', 'לידים', 'לקוחות', 'מוצרים', 'משימות']) {
    await page.getByRole('navigation', { name: 'ראשי' }).getByRole('link', { name: new RegExp(`^${name}`) }).click();
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
  }
});

test('creates a task and toggles it done', async ({ page }) => {
  await page.goto('/tasks');
  const title = `בדיקה אוטומטית ${Date.now()}`;
  await page.getByPlaceholder('משימה חדשה').fill(title);
  await page.getByRole('button', { name: 'הוסף' }).click();
  const row = page.getByRole('checkbox', { name: title });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.check();
  await expect(page.getByText(title)).toHaveCSS('text-decoration-line', 'line-through', { timeout: 20_000 });
});

test('manager chat answers in hebrew with a shekel amount', async ({ page }) => {
  await page.getByRole('button', { name: 'שאל את המנהל' }).click();
  await page.getByRole('button', { name: 'מה ההכנסות החודש?' }).click();
  await expect(page.getByLabel('שיחה').getByText(/₪/).last()).toBeVisible({ timeout: 45_000 });
});
