import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './theme';

import store from './redux/store';
import { useMatchOrdersMutation, useLazyGetOrdersQuery, useLazyGetTradesQuery, useLogoutMutation, useGetSymbolsQuery } from './redux/ApiSlice';
import { setOrders } from './redux/OrderSlice';
import { setTrades } from './redux/TradeSlice';
import { clearAlert, setAlert } from './redux/AppSlice';
import { setPrice } from './redux/PriceSlice';
import { logout as logoutAction } from './redux/AuthSlice';

import Home from './pages/Home';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Unauthorized from './pages/Unauthorized';
import Profile from './pages/Profile';
import TenantAdmin from './pages/TenantAdmin';

import OrderModal from './components/OrderModal';
import PrivateRoute from './components/PrivateRouter';
import ProtectedRoute from './components/ProtectedRoute';
import CustomAlert from './components/CustomAlert';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { connect, disconnect } from './services/WebSocketService';

import logger from './utils/logger';

export default function App() {
    const [open, setOpen] = React.useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const dispatch = useDispatch();
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [matchOrders] = useMatchOrdersMutation();
    const [logout] = useLogoutMutation();
    const [triggerGetOrders] = useLazyGetOrdersQuery();
    const [triggerGetTrades] = useLazyGetTradesQuery();
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const userRoles = useSelector(state => state.auth.roles);
    const username = useSelector(state => state.auth.user);
    const tenantId = useSelector(state => state.auth.tenantId);
    const accessToken = useSelector(state => state.auth.accessToken);
    const refreshToken = useSelector(state => state.auth.refreshToken);
    const expiryTime = useSelector(state => state.auth.expiryTime);
    const alert = useSelector(state => state.app.alert);
    const alertType = useSelector(state => state.app.alertType);
    const { data: symbols = [] } = useGetSymbolsQuery(undefined, { skip: !isAuthenticated });
    const theme = useSelector(state => state.app.theme);

    useEffect(() => {
        if (isAuthenticated) {
            triggerGetOrders({
                page: 0,
                size: 100,
                sortBy: 'symbol',
                direction: 'asc',
            });
            triggerGetTrades();
        }
    }, [triggerGetOrders, triggerGetTrades, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            connect((message, topic) => {
                if (topic === 'orders') {
                    const newOrder = message;
                    const currentOrders = store.getState().order.orders;
                    const existingOrder = currentOrders.find((order) => order.id === newOrder.id);
                    let updatedOrders = currentOrders;
                    if (existingOrder) {
                        updatedOrders = currentOrders.map((order) => (order.id === newOrder.id ? newOrder : order));
                    } else {
                        updatedOrders = [newOrder, ...currentOrders];
                    }
                    dispatch(setOrders(updatedOrders));
                } else if (topic === 'trades') {
                    const currentTrades = store.getState().trade.trades;
                    dispatch(setTrades([message, ...currentTrades]));
                } else if (topic === 'prices') {
                    dispatch(setPrice({ ticker: message.ticker, price: message.price }));
                } else if (topic === 'notifications') {
                    // real-time push — NotificationBell polls independently, this triggers a refetch
                }
            }, tenantId, symbols.map(s => s.ticker), accessToken);
        }

    // symbols in deps: the symbol list loads after the initial connect, and
    // connect() adds the missing price subscriptions on the follow-up call
    }, [dispatch, isAuthenticated, symbols, tenantId, accessToken]);

    useEffect(() => {
        if (!expiryTime) return;
        const now = Date.now();
        const timeout = expiryTime - now;

        if (timeout <= 0) {
            dispatch(logoutAction());
            dispatch(setAlert({ alert: "Session expired", type: "error"}));
            return;
        }

        const logoutTimer = setTimeout(() => {
            dispatch(logoutAction());
            dispatch(setAlert({ alert: "Session expired", type: "error"}));
        }, timeout)

        if (timeout > 600000) {
            const warnTimer = setTimeout(() => {
                dispatch(setAlert({ alert: "Session will expire in 10 minutes", type: "warning" }));
            }, timeout - 600000)

            return () => {clearTimeout(warnTimer); clearTimeout(logoutTimer)};
        }
        return () => clearTimeout(logoutTimer);
    }, [dispatch, expiryTime]);

    const handleMatchOrders = async (symbol) => {
        try {
            await matchOrders(symbol).unwrap();
        } catch (error) {
            logger.error(error);
        }
    };
    const logoutHandler = async () => {
        try {
            await logout(refreshToken).unwrap();
        } catch (error) {
            logger.log(error)
        }
    }
    const roleLabel = userRoles.includes('ADMIN') ? 'Admin' : 'Trader';

    // Plain JSX element, NOT a nested component: defining a component inside App
    // gives it a new identity every render, which makes React unmount and remount
    // the entire tree (wiping all form/modal state) on any App re-render.
    const appLayout = (
            <ThemeProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
                <CssBaseline />
                <CustomAlert message={alert} type={alertType} onClose={() => dispatch(clearAlert())} />
                {isAuthenticated ? (
                    <Box display="flex">
                        <Sidebar
                            collapsed={sidebarCollapsed}
                            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
                            userRoles={userRoles}
                            username={username}
                            roleLabel={roleLabel}
                        />
                        <Box
                            component="main"
                            sx={{
                                flexGrow: 1,
                                minWidth: 0,
                                minHeight: '100vh',
                            }}
                        >
                            <Header
                                onPlaceOrder={handleOpen}
                                showMatchOrders={userRoles.includes('ADMIN')}
                                onMatchOrders={() => handleMatchOrders('AAPL')}
                                username={username}
                                roleLabel={roleLabel}
                                onLogout={logoutHandler}
                            />
                            <OrderModal open={open} handleOpen={handleOpen} handleClose={handleClose} />
                            <Outlet />
                        </Box>
                    </Box>
                ) : (
                    <Outlet />
                )}
            </ThemeProvider>
    );
    return (
        <Router>
            <Routes>
                <Route element={appLayout}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route element={<PrivateRoute />}>
                        <Route path="/analytics" element={<ProtectedRoute roles={['ADMIN']}><Analytics /></ProtectedRoute>} />
                        <Route path="/tenants" element={<ProtectedRoute roles={['ADMIN']}><TenantAdmin /></ProtectedRoute>} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/" element={<Home />} />
                    </Route>
                    <Route path="/unauthorized" element={<Unauthorized />} />
                </Route>
            </Routes>
        </Router>
    );
}