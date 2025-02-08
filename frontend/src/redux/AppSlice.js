import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedSymbol: "AAPL", 
    theme: "light",         
    alert: null,
    alertType: null            
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
        setAlert: (state, action) => {
            state.alert = action.payload.alert;
            state.alertType = action.payload.type;
        },
        clearAlert: (state) => {
            state.alert = null;
            state.alertType = null;
        },
    },
});

export const { setSelectedSymbol, toggleTheme, setAlert, clearAlert } = appSlice.actions;

export default appSlice.reducer;
