import { createSlice } from '@reduxjs/toolkit';

const priceSlice = createSlice({
    name: 'price',
    initialState: { prices: {} },
    reducers: {
        setPrice: (state, action) => {
            const { ticker, price } = action.payload;
            state.prices[ticker] = price;
        },
    },
});

export const { setPrice } = priceSlice.actions;
export default priceSlice.reducer;
