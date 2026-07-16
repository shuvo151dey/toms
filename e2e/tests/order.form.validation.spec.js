import { test, expect } from '@playwright/test';

const username = 'smd';
const password = 'shuvo@4530';

test.describe.serial('order form validation', () => {

    test('shows validation errors when submitting empty form', async ({ page }) => {
        // Login (form uses Username, not Email; button says "Login"; redirects to "/")
        await page.goto('/login');
        await page.getByLabel('Username').fill(username);
        await page.getByLabel('Password').fill(password);
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL('/');

        // Open the order modal
        await page.getByRole('button', { name: 'Place Order' }).click();
        await expect(page.getByText('Order Details')).toBeVisible();

        await page.getByRole('button', { name: 'Submit'}).click();

        // ASSERT: each helperText error appears
        await expect(page.getByText('Symbol is required')).toBeVisible();
        await expect(page.getByText('Quantity is required')).toBeVisible();
        await expect(page.getByText('Price is required')).toBeVisible();

        // ASSERT 2: modal stayed open
        await expect(page.getByText('Order Details')).toBeVisible();
    });
});
