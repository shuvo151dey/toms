import { test, expect } from '@playwright/test';

const username = 'smd';
const password = 'shuvo@4530';

test.describe.serial('order flow', () => {

    test('user can create an order', async ({ page }) => {
        // Login (form uses Username, not Email; button says "Login"; redirects to "/")
        await page.goto('/login');
        await page.getByLabel('Username').fill(username);
        await page.getByLabel('Password').fill(password);
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL('/');

        // Open the order modal
        await page.getByRole('button', { name: 'Place Order' }).click();
        // Scope to the modal — the Home page has its own "Symbol" selector (OrderBookDepth)
        const modal = page.locator('[role="presentation"]').filter({ hasText: 'Order Details' });
        await expect(modal.getByText('Order Details')).toBeVisible();

        // MUI selects are not native <select> — click to open, then click the option
        // (options render in their own portal, so they are queried at page level)
        await modal.getByLabel('Symbol').click();
        await page.getByRole('option', { name: 'AAPL' }).click();

        await modal.getByLabel('Action').click();
        await page.getByRole('option', { name: 'BUY' }).click();

        await modal.getByLabel('Method').click();
        await page.getByRole('option', { name: 'MARKET' }).click();

        await modal.getByLabel('Price').fill('150');
        await modal.getByLabel('Quantity').fill('1');

        await modal.getByRole('button', { name: 'Submit' }).click();

        // ASSERT 1: success alert appears (no navigation happens after submit)
        await expect(page.getByText('Order created successfully')).toBeVisible();

        // ASSERT 2: modal closed
        await expect(page.getByText('Order Details')).not.toBeVisible();

        // ASSERT 3: the order shows up in the Order Book table
        const orderRow = page.getByRole('row').filter({ hasText: 'AAPL' }).filter({ hasText: 'BUY' });
        await expect(orderRow.first()).toBeVisible();
    });
});
