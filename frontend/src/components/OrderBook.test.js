import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import OrderBook from './OrderBook';

const mockStore = configureMockStore();

describe('OrderBook - Cancel Button Tests', () => {

  // Test 2.1: Cancel button visible for PENDING orders
  test('should show cancel button for PENDING orders', () => {
    const mockOrders = [
      {
        id: 1,
        symbol: 'AAPL',
        quantity: 10,
        price: 100.0,
        status: 'PENDING',
        orderAction: 'BUY',
        orderMethod: 'MARKET',
        limitPrice: null,
        stopPrice: null
      }
    ];

    const store = mockStore({
      order: { orders: mockOrders },
      auth: { isAuthenticated: true }
    });

    render(
      <Provider store={store}>
        <OrderBook />
      </Provider>
    );

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    expect(cancelButtons.length).toBeGreaterThan(0);
    expect(cancelButtons[0]).not.toBeDisabled();
  });

  // Test 2.2: Cancel button disabled for COMPLETED orders
  test('should disable cancel button for COMPLETED orders', () => {
    const mockOrders = [
      {
        id: 1,
        symbol: 'AAPL',
        quantity: 10,
        price: 100.0,
        status: 'COMPLETED',
        orderAction: 'BUY',
        orderMethod: 'MARKET',
        limitPrice: null,
        stopPrice: null
      }
    ];

    const store = mockStore({
      order: { orders: mockOrders },
      auth: { isAuthenticated: true }
    });

    render(
      <Provider store={store}>
        <OrderBook />
      </Provider>
    );

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    expect(cancelButtons[0]).toBeDisabled();
  });

  // Test 2.3: Cancel button disabled for CANCELED orders
  test('should disable cancel button for CANCELED orders', () => {
    const mockOrders = [
      {
        id: 1,
        symbol: 'AAPL',
        quantity: 10,
        price: 100.0,
        status: 'CANCELED',
        orderAction: 'BUY',
        orderMethod: 'MARKET',
        limitPrice: null,
        stopPrice: null
      }
    ];

    const store = mockStore({
      order: { orders: mockOrders },
      auth: { isAuthenticated: true }
    });

    render(
      <Provider store={store}>
        <OrderBook />
      </Provider>
    );

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    expect(cancelButtons[0]).toBeDisabled();
  });

  // Test 2.4: Confirmation dialog on cancel click
  test('should show confirmation dialog when cancel button clicked', () => {
    const mockOrders = [
      {
        id: 1,
        symbol: 'AAPL',
        quantity: 10,
        price: 100.0,
        status: 'PENDING',
        orderAction: 'BUY',
        orderMethod: 'MARKET',
        limitPrice: null,
        stopPrice: null
      }
    ];

    const store = mockStore({
      order: { orders: mockOrders },
      auth: { isAuthenticated: true }
    });

    render(
      <Provider store={store}>
        <OrderBook />
      </Provider>
    );

    const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[0];
    fireEvent.click(cancelButton);

    // Should show confirmation dialog with order details
    expect(screen.getByText(/cancel order/i)).toBeInTheDocument();
    expect(screen.getByText(/BUY/)).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/AAPL/)).toBeInTheDocument();
  });

  // Test 2.5: Calls API on confirmation
  test('should call cancelOrder API when confirmation accepted', async () => {
    const mockOrders = [
      {
        id: 1,
        symbol: 'AAPL',
        quantity: 10,
        price: 100.0,
        status: 'PENDING',
        orderAction: 'BUY',
        orderMethod: 'MARKET',
        limitPrice: null,
        stopPrice: null
      }
    ];

    const store = mockStore({
      order: { orders: mockOrders },
      auth: { isAuthenticated: true }
    });

    // Mock the API call (you'd inject this via props or context)
    global.fetch = jest.fn();

    render(
      <Provider store={store}>
        <OrderBook />
      </Provider>
    );

    const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[0];
    fireEvent.click(cancelButton);

    // Simulate clicking "OK" on confirmation dialog
    const confirmButton = screen.getByRole('button', { name: /ok|confirm|yes/i });
    fireEvent.click(confirmButton);

    // Verify API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // Test 2.6: Edit button opens OrderModal
  test('should open OrderModal when edit button clicked', () => {
    const mockOrders = [
      {
        id: 1,
        symbol: 'AAPL',
        quantity: 10,
        price: 100.0,
        status: 'PENDING',
        orderAction: 'BUY',
        orderMethod: 'MARKET',
        limitPrice: null,
        stopPrice: null
      }
    ];

    const store = mockStore({
      order: { orders: mockOrders },
      auth: { isAuthenticated: true }
    });

    render(
      <Provider store={store}>
        <OrderBook />
      </Provider>
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Should render OrderModal (check for modal-specific elements)
    expect(screen.getByText(/edit order|update order/i)).toBeInTheDocument();
  });
});