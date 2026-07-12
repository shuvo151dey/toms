import { render, screen, fireEvent, waitFor } from '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from 'redux-mock-store';
import OrderModal from './OrderModal';

describe('OrderModal', () => {
  let store;

  beforeEach(() => {
    store = configureStore();
  });

  test('should show error when quantity is 0', () => {
    const store = mockStore({
      auth: {
        isAuthenticated: true
      }
    });
    render(
      <Provider store={store}>
        <OrderModal open={true} handleClose={() => {}} />
      </Provider>
    );

    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: 0 } });
    fireEvent.blur(quantityInput);

    const errorMessage = screen.getByText(/quantity must be greater than 0/i);
    expect(errorMessage).toBeInTheDocument();
  });

  test('should submit order when all fields valid', async () => {
    const mockSubmit = jest.fn();
    const store = mockStore({
      auth: {
        isAuthenticated: true
      }
    });

    render(
      <Provider store={store}>
        <OrderModal open={true} handleClose={() => {}} onSubmit={mockSubmit} />
      </Provider>
    );

    fireEvent.change(screen.getByLabelText('Symbol'), { target: { value: 'AAPL' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '100' } });
    fireEvent.click(screen.getByText('Place Order'));
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith();
    });
  });

  test('should show error when symbol is invalid', async () => {
    const mockSubmit = jest.fn();
    const store = mockStore({
      auth: {
        isAuthenticated: true
      }
    });

    render(
      <Provider store={store}>
        <OrderModal open={true} handleClose={() => {}} onSubmit={mockSubmit} />
      </Provider>
    );

    fireEvent.change(screen.getByLabelText('Symbol'), { target: { value: 'INVALID' } });
    fireEvent.blur(screen.getByLabelText('Symbol'));

    const errorMessage = screen.getByText(/invalid symbol/i);
    expect(errorMessage).toBeInTheDocument();
  });
});