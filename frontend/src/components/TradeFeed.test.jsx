import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import TradeFeed from './TradeFeed';

const mockStore = configureMockStore();

describe('TradeFeed - Pagination Tests', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: { isAuthenticated: true }
    });
  });

  // Test 3.1: Renders trades from API response
  test('should render trades in table', async () => {
    const mockTrades = {
      content: [
        { id: 1, symbol: 'AAPL', price: 150.0, quantity: 10, buyOrder: { id: 101 }, sellOrder: { id: 201 } },
        { id: 2, symbol: 'GOOGL', price: 2800.0, quantity: 5, buyOrder: { id: 102 }, sellOrder: { id: 202 } }
      ],
      totalPages: 1,
      totalElements: 2
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTrades)
      })
    );

    render(
      <Provider store={store}>
        <TradeFeed />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('2800')).toBeInTheDocument();
    });
  });

  // Test 3.2: Shows pagination controls when multiple pages
  test('should show pagination buttons when totalPages > 1', async () => {
    const mockTrades = {
      content: Array(10).fill({
        id: 1,
        symbol: 'AAPL',
        price: 150.0,
        quantity: 10,
        buyOrder: { id: 101 },
        sellOrder: { id: 201 }
      }),
      totalPages: 5,
      totalElements: 50
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTrades)
      })
    );

    render(
      <Provider store={store}>
        <TradeFeed />
      </Provider>
    );

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /chevronright/i });
      const prevButton = screen.getByRole('button', { name: /chevronleft/i });
      expect(nextButton).toBeInTheDocument();
      expect(prevButton).toBeInTheDocument();
    });
  });

  // Test 3.3: Shows page indicator
  test('should display current page and total pages', async () => {
    const mockTrades = {
      content: [{ id: 1, symbol: 'AAPL', price: 150.0, quantity: 10, buyOrder: { id: 101 }, sellOrder: { id: 201 } }],
      totalPages: 5,
      totalElements: 50
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTrades)
      })
    );

    render(
      <Provider store={store}>
        <TradeFeed />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/1 \/ 5/)).toBeInTheDocument();
    });
  });

  // Test 3.4: Disables prev button on first page
  test('should disable prev button on first page', async () => {
    const mockTrades = {
      content: [{ id: 1, symbol: 'AAPL', price: 150.0, quantity: 10, buyOrder: { id: 101 }, sellOrder: { id: 201 } }],
      totalPages: 3,
      totalElements: 30
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTrades)
      })
    );

    render(
      <Provider store={store}>
        <TradeFeed />
      </Provider>
    );

    await waitFor(() => {
      const prevButton = screen.getByRole('button', { name: /chevronleft/i });
      expect(prevButton).toBeDisabled();
    });
  });

  // Test 3.5: Disables next button on last page
  test('should disable next button on last page', async () => {
    const mockTrades = {
      content: [{ id: 1, symbol: 'AAPL', price: 150.0, quantity: 10, buyOrder: { id: 101 }, sellOrder: { id: 201 } }],
      totalPages: 3,
      totalElements: 30,
      number: 2 // Page 2 (0-indexed, so this is the 3rd page)
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTrades)
      })
    );

    render(
      <Provider store={store}>
        <TradeFeed />
      </Provider>
    );

    // Simulate navigating to last page
    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /chevronright/i });
      expect(nextButton).toBeDisabled();
    });
  });

  // Test 3.6: Shows skeleton loaders while loading
  test('should show skeleton loaders while fetching', () => {
    global.fetch = jest.fn(() =>
      new Promise(() => {}) // Never resolves, so stays in loading state
    );

    const { container } = render(
      <Provider store={store}>
        <TradeFeed />
      </Provider>
    );

    // Check for Skeleton components (they render as empty divs while loading)
    const skeletons = container.querySelectorAll('tr');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // Test 3.7: Fetches correct page on pagination
  test('should fetch page 1 when next button clicked', async () => {
    const mockTrades = {
      content: [{ id: 1, symbol: 'AAPL', price: 150.0, quantity: 10, buyOrder: { id: 101 }, sellOrder: { id: 201 } }],
      totalPages: 3,
      totalElements: 30
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTrades)
      })
    );

    render(
      <Provider store={store}>
        <TradeFeed />
      </Provider>
    );

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /chevronright/i });
      fireEvent.click(nextButton);
    });

    // Verify fetch was called with page=1
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
        expect.any(Object)
      );
    });
  });
});