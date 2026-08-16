import { createSlice } from '@reduxjs/toolkit';

const priceSlice = createSlice({
    name: 'price',
    initialState: { prices: {} },
    reducers: {
        setPrice: (state, action) => {
            const { ticker, price } = action.payload;
            const existing = state.prices[ticker];
            state.prices[ticker] = {
                price,
                prevPrice: existing ? existing.price : price,
            };
        },
    },
});

export const { setPrice } = priceSlice.actions;
export default priceSlice.reducer;
