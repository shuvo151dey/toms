import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { vi } from 'vitest';
import TradeFeed from './TradeFeed';
import { useGetTradesPaginatedQuery } from '../redux/ApiSlice';

// TradeFeed calls useGetTradesPaginatedQuery directly. redux-mock-store
// provides no reducers/middleware, so that hook would throw "Middleware for
// RTK-Query API... has not been added to the store." Mocking the hook itself
// keeps this a focused component test without needing a live API layer.
vi.mock('../redux/ApiSlice', () => ({
  useGetTradesPaginatedQuery: vi.fn(),
}));

const mockStore = configureMockStore();
const store = mockStore({ auth: { isAuthenticated: true } });

const renderTradeFeed = () =>
  render(
    <Provider store={store}>
      <TradeFeed />
    </Provider>
  );

// The pagination IconButtons wrap an aria-hidden MUI icon and have no
// aria-label of their own, so they have no accessible name to query by —
// find them via their icon's data-testid instead.
const getPrevButton = () => screen.getByTestId('ChevronLeftIcon').closest('button');
const getNextButton = () => screen.getByTestId('ChevronRightIcon').closest('button');

describe('TradeFeed - Pagination Tests', () => {
  test('should render trades in table', () => {
    useGetTradesPaginatedQuery.mockReturnValue({
      data: {
        content: [
          { id: 1, symbol: 'AAPL', price: 150.0, quantity: 10, buyOrder: { id: 101 }, sellOrder: { id: 201 } },
          { id: 2, symbol: 'GOOGL', price: 2800.0, quantity: 5, buyOrder: { id: 102 }, sellOrder: { id: 202 } },
        ],
        totalPages: 1,
        totalElements: 2,
      },
      isLoading: false,
    });

    renderTradeFeed();

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('GOOGL')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('2800')).toBeInTheDocument();
  });

  test('should show pagination buttons when totalPages > 1', () => {
    useGetTradesPaginatedQuery.mockReturnValue({
      data: { content: [], totalPages: 5, totalElements: 50 },
      isLoading: false,
    });

    renderTradeFeed();

    expect(getNextButton()).toBeInTheDocument();
    expect(getPrevButton()).toBeInTheDocument();
  });

  test('should display current page and total pages', () => {
    useGetTradesPaginatedQuery.mockReturnValue({
      data: { content: [], totalPages: 5, totalElements: 50 },
      isLoading: false,
    });

    renderTradeFeed();

    expect(screen.getByText(/1 \/ 5/)).toBeInTheDocument();
  });

  test('should disable prev button on first page', () => {
    useGetTradesPaginatedQuery.mockReturnValue({
      data: { content: [], totalPages: 3, totalElements: 30 },
      isLoading: false,
    });

    renderTradeFeed();

    expect(getPrevButton()).toBeDisabled();
  });

  test('should disable next button when on the last page', () => {
    useGetTradesPaginatedQuery.mockReturnValue({
      data: { content: [], totalPages: 3, totalElements: 30 },
      isLoading: false,
    });

    renderTradeFeed();

    // Advance to the last page (index 2 of 3) via the next button.
    const nextButton = getNextButton();
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(nextButton).toBeDisabled();
  });

  test('should show skeleton loaders while fetching', () => {
    useGetTradesPaginatedQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = renderTradeFeed();

    const skeletonRows = container.querySelectorAll('tbody tr');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });

  test('should request page 1 when next button clicked', async () => {
    useGetTradesPaginatedQuery.mockReturnValue({
      data: { content: [], totalPages: 3, totalElements: 30 },
      isLoading: false,
    });

    renderTradeFeed();

    fireEvent.click(getNextButton());

    await waitFor(() => {
      expect(useGetTradesPaginatedQuery).toHaveBeenCalledWith({ page: 1, size: 10 });
    });
  });
});
