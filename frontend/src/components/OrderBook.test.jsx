import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { vi } from 'vitest';
import OrderBook from './OrderBook';
import { useCancelOrderMutation, useCreateOrderMutation, useUpdateOrderMutation, useGetSymbolsQuery } from '../redux/ApiSlice';

// OrderBook (and the OrderModal it always renders, just closed) calls RTK
// Query hooks directly. redux-mock-store provides no reducers/middleware, so
// those hooks would throw "Middleware for RTK-Query API... has not been
// added to the store." Mocking the hooks themselves keeps these as focused
// component tests without needing a live API layer.
vi.mock('../redux/ApiSlice', () => ({
  useCancelOrderMutation: vi.fn(),
  useCreateOrderMutation: vi.fn(),
  useUpdateOrderMutation: vi.fn(),
  useGetSymbolsQuery: vi.fn(),
  extractErrorMessage: (error, fallback) => fallback,
}));

const mockStore = configureMockStore();

const baseOrder = {
  id: 1,
  symbol: 'AAPL',
  quantity: 10,
  price: 100.0,
  orderAction: 'BUY',
  orderMethod: 'MARKET',
  limitPrice: null,
  stopPrice: null,
};

const renderOrderBook = (orders) => {
  const store = mockStore({
    order: { orders, order: null },
  });
  render(
    <Provider store={store}>
      <OrderBook />
    </Provider>
  );
};

describe('OrderBook - Cancel Button Tests', () => {
  let cancelOrderTrigger;

  beforeEach(() => {
    cancelOrderTrigger = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));
    useCancelOrderMutation.mockReturnValue([cancelOrderTrigger]);
    useCreateOrderMutation.mockReturnValue([vi.fn(() => ({ unwrap: () => Promise.resolve({}) }))]);
    useUpdateOrderMutation.mockReturnValue([vi.fn(() => ({ unwrap: () => Promise.resolve({}) }))]);
    useGetSymbolsQuery.mockReturnValue({ data: [{ ticker: 'AAPL' }, { ticker: 'TATAMOTORS' }] });
  });

  test('should show cancel button for PENDING orders', () => {
    renderOrderBook([{ ...baseOrder, status: 'PENDING' }]);

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    expect(cancelButtons.length).toBeGreaterThan(0);
    expect(cancelButtons[0]).not.toBeDisabled();
  });

  test('should disable cancel button for COMPLETED orders', () => {
    renderOrderBook([{ ...baseOrder, status: 'COMPLETED' }]);

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    expect(cancelButtons[0]).toBeDisabled();
  });

  test('should disable cancel button for CANCELED orders', () => {
    renderOrderBook([{ ...baseOrder, status: 'CANCELED' }]);

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    expect(cancelButtons[0]).toBeDisabled();
  });

  test('should show confirmation dialog when cancel button clicked', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderOrderBook([{ ...baseOrder, status: 'PENDING' }]);

    const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[0];
    fireEvent.click(cancelButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cancel order#1 (BUY 10 AAPL)')
    );
    confirmSpy.mockRestore();
  });

  test('should call cancelOrder API when confirmation accepted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderOrderBook([{ ...baseOrder, status: 'PENDING' }]);

    const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[0];
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(cancelOrderTrigger).toHaveBeenCalledWith(1);
    });
  });

  test('should open OrderModal when edit button clicked', () => {
    renderOrderBook([{ ...baseOrder, status: 'PENDING' }]);

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByText('Order Details')).toBeInTheDocument();
  });
});
