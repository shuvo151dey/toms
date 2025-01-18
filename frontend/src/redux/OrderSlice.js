import { createSlice } from "@reduxjs/toolkit";

export const orderSlice = createSlice({
    name: "order",
    initialState: {
        orders: [],
        order: null,
        error: null,
    },
    reducers: {
        setOrders: (state, action) => {
            state.orders = action.payload;
        },
        setOrder: (state, action) => {
            state.order = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const { setOrders, setOrder, setError, clearError } = orderSlice.actions;

export default orderSlice.reducer;