import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedSymbol: "AAPL", // Default symbol
    theme: "light",         // App theme (light/dark)
    error: null,            // Global error handling
};

const appSlice = createSlice({
    name: "app",
    initialState,
    reducers: {
        setSelectedSymbol: (state, action) => {
            state.selectedSymbol = action.payload;
        },
        toggleTheme: (state) => {
            state.theme = state.theme === "light" ? "dark" : "light";
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const { setSelectedSymbol, toggleTheme, setError, clearError } = appSlice.actions;

export default appSlice.reducer;
