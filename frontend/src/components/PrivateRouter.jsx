import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = () => {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const expiryTime = useSelector((state) => state.auth.expiryTime);
    const isTokenValid = expiryTime ? Date.now() < expiryTime : false;
    return isAuthenticated && isTokenValid ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
