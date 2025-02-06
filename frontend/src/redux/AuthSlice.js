import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null, 
    accessToken: null,
    refreshToken: null, 
    roles: [], 
    tenantId: null,
    isAuthenticated: false,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuth: (state, action) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.roles = action.payload.roles;
            state.tenantId = action.payload.tenantId;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.roles = [];
            state.tenantId = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;
