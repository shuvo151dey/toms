import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null, // Store user data here
    token: null, // JWT token
    roles: [], // User roles
    tenantId: null,
    isAuthenticated: false,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.roles = action.payload.roles;
            state.tenantId = action.payload.tenantId;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.roles = [];
            state.tenantId = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
