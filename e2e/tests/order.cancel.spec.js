import { test, expect } from '@playwright/test';

const username = 'smd';
const password = 'shuvo@4530';

test('user can cancel an order', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/');

    // Place a LIMIT order with a limit price far below market so it never
    // matches — a MARKET order could fill instantly and become uncancellable
    await page.getByRole('button', { name: 'Place Order' }).click();
    // Scope to the modal — the Home page has its own "Symbol" selector (OrderBookDepth)
    const modal = page.locator('[role="presentation"]').filter({ hasText: 'Order Details' });
    await expect(modal.getByText('Order Details')).toBeVisible();

    await modal.getByLabel('Symbol').click();
    await page.getByRole('option', { name: 'AAPL' }).click();

    await modal.getByLabel('Action').click();
    await page.getByRole('option', { name: 'BUY' }).click();

    await modal.getByLabel('Method').click();
    await page.getByRole('option', { name: 'LIMIT' }).click();

    await modal.getByLabel('Price', { exact: true }).fill('150');
    await modal.getByLabel('Quantity').fill('1');
    await modal.getByLabel('Limit Price').fill('1');

    await modal.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Order created successfully')).toBeVisible();

    // The cancel confirmation is a native window.confirm — Playwright
    // dismisses dialogs by default, so accept it explicitly
    page.on('dialog', (dialog) => dialog.accept());

    // Cancel the first PENDING order in the Order Book
    const pendingRow = page.getByRole('row').filter({ hasText: 'PENDING' }).first();
    await pendingRow.getByRole('button', { name: 'Cancel' }).click();

    // ApiSlice dispatches "Order cancelled" on success
    await expect(page.getByText('Order cancelled')).toBeVisible();
});
