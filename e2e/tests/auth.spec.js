import { test, expect } from '@playwright/test';

// Unique per run + per browser project so signup never collides
const username = `e2e_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const password = 'password123';

test.describe.serial('auth flow', () => {

    test('user can sign up', async ({ page }) => {
        await page.goto('/signup');

        await page.getByLabel('Username').fill(username);
        await page.getByLabel('Email').fill(`${username}@example.com`);
        // /^Password/ avoids also matching the "Confirm Password" field
        await page.getByLabel(/^Password/).fill(password);
        await page.getByLabel('Confirm Password').fill(password);

        await page.getByRole('button', { name: 'Sign Up' }).click();

        // Signup redirects to the login page
        await expect(page).toHaveURL('/login');
    });

    test('user can login', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel('Username').fill(username);
        await page.getByLabel('Password').fill(password);

        await page.getByRole('button', { name: 'Login' }).click();

        // Login redirects to the home dashboard
        await expect(page).toHaveURL('/');
        await expect(page.getByText('TOMS Dashboard')).toBeVisible();
    });
});
