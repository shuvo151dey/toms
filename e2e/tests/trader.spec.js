import { test, expect } from '@playwright/test';

const password = 'password123';

// Sign up a fresh user (auto-enabled locally since MAIL_ENABLED=false), then log in
const signupAndLogin = async (page, username) => {
    await page.goto('/signup');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Email').fill(`${username}@example.com`);
    await page.getByLabel(/^Password/).fill(password);
    await page.getByLabel('Confirm Password').fill(password);
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL('/login');

    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/');
};

const placeOrder = async (page, { action, symbol, qty, price }) => {
    await page.getByRole('button', { name: 'Place Order' }).click();
    // Scope to the modal — the Home page has its own "Symbol" selector (OrderBookDepth)
    const modal = page.locator('[role="presentation"]').filter({ hasText: 'Order Details' });
    await expect(modal.getByText('Order Details')).toBeVisible();

    await modal.getByLabel('Symbol').click();
    await page.getByRole('option', { name: symbol }).click();

    await modal.getByLabel('Action').click();
    await page.getByRole('option', { name: action }).click();

    await modal.getByLabel('Method').click();
    await page.getByRole('option', { name: 'MARKET' }).click();

    await modal.getByLabel('Price').fill(price.toString());
    await modal.getByLabel('Quantity').fill(qty.toString());

    await modal.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Order created successfully')).toBeVisible();
};

test('buy and sell orders match into a trade', async ({ browser }) => {
    const run = Date.now();
    const sellerCtx = await browser.newContext();
    const buyerCtx = await browser.newContext();
    const seller = await sellerCtx.newPage();
    const buyer = await buyerCtx.newPage();

    await signupAndLogin(seller, `seller_${run}`);
    await signupAndLogin(buyer, `buyer_${run}`);

    await placeOrder(seller, { action: 'SELL', symbol: 'AAPL', qty: 5, price: 100 });
    await placeOrder(buyer, { action: 'BUY', symbol: 'AAPL', qty: 5, price: 100 });

    // Matching runs async on the backend; the status update arrives via WebSocket
    await expect(
        buyer.getByRole('row').filter({ hasText: 'COMPLETED' }).first()
    ).toBeVisible({ timeout: 15000 });

    await sellerCtx.close();
    await buyerCtx.close();
});
