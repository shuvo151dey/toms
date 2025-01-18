import { createSlice } from "@reduxjs/toolkit";

export const tradeSlice = createSlice({
    name: "trade",
    initialState: {
        trades: [],
        error: null,
    },
    reducers: {
        setTrades: (state, action) => {
            state.trades = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const { setTrades, setError, clearError } = tradeSlice.actions;

export default tradeSlice.reducer;