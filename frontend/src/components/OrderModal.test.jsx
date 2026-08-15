import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { vi } from 'vitest';
import OrderModal from './OrderModal';
import { useCreateOrderMutation, useUpdateOrderMutation, useGetSymbolsQuery } from '../redux/ApiSlice';

// OrderModal calls RTK Query hooks directly (useCreateOrderMutation,
// useUpdateOrderMutation, useGetSymbolsQuery). redux-mock-store provides no
// reducers/middleware, so those hooks would throw "Middleware for RTK-Query
// API... has not been added to the store." Mocking the hooks themselves
// keeps this a focused component test without needing a live API layer.
vi.mock('../redux/ApiSlice', () => ({
  useCreateOrderMutation: vi.fn(),
  useUpdateOrderMutation: vi.fn(),
  useGetSymbolsQuery: vi.fn(),
  extractErrorMessage: (error, fallback) => fallback,
}));

const mockStore = configureMockStore();

const selectMuiOption = async (user, label, optionName) => {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole('option', { name: optionName }));
};

describe('OrderModal', () => {
  let createOrderTrigger;
  let updateOrderTrigger;
  let handleClose;

  beforeEach(() => {
    createOrderTrigger = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));
    updateOrderTrigger = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));
    handleClose = vi.fn();
    useCreateOrderMutation.mockReturnValue([createOrderTrigger]);
    useUpdateOrderMutation.mockReturnValue([updateOrderTrigger]);
    useGetSymbolsQuery.mockReturnValue({ data: [{ ticker: 'AAPL' }, { ticker: 'TATAMOTORS' }] });
  });

  const renderModal = () => {
    const store = mockStore({ order: { order: null } });
    render(
      <Provider store={store}>
        <OrderModal open={true} handleClose={handleClose} />
      </Provider>
    );
  };

  test('should show error when quantity is 0', () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText('Quantity is required')).toBeInTheDocument();
    expect(createOrderTrigger).not.toHaveBeenCalled();
  });

  test('should submit order when all fields valid', async () => {
    const user = userEvent.setup();
    renderModal();

    await selectMuiOption(user, 'Symbol', 'AAPL');
    await selectMuiOption(user, 'Action', 'BUY');
    await selectMuiOption(user, 'Method', 'MARKET');
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(createOrderTrigger).toHaveBeenCalledWith(
        expect.objectContaining({ symbol: 'AAPL', orderAction: 'BUY', orderMethod: 'MARKET', price: '100', quantity: '10' })
      );
    });
    await waitFor(() => expect(handleClose).toHaveBeenCalled());
  });

  test('should show limit price error when method is LIMIT and limit price is empty', async () => {
    const user = userEvent.setup();
    renderModal();

    await selectMuiOption(user, 'Method', 'LIMIT');
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText('Limit price is required')).toBeInTheDocument();
    expect(createOrderTrigger).not.toHaveBeenCalled();
  });
});
