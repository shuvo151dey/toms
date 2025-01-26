import React, { use, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { AppBar, Toolbar, Typography, Button, Drawer, MenuList, MenuItem } from '@mui/material';

import store from './redux/store';
import { useMatchOrdersMutation, useLazyGetOrdersQuery, useLazyGetTradesQuery } from './redux/ApiSlice';
import { setOrders } from './redux/OrderSlice';
import { setTrades } from './redux/TradeSlice';

import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';

import Home from './pages/Home';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Signup from './pages/Signup';

import OrderModal from './components/OrderModal';
import PrivateRoute from './components/PrivateRouter';
import { connect, disconnect } from './services/WebSocketService';

export default function App() {
    const [open, setOpen] = React.useState(false);
    const [drawer, toggleDrawer] = React.useState(false);
    const dispatch = useDispatch();
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [matchOrders, { isLoading, error }] = useMatchOrdersMutation();
    const orders = useSelector((state) => state.order.orders);
    const trades = useSelector((state) => state.trade.trades);
    const [triggerGetOrders] = useLazyGetOrdersQuery();
    const [triggerGetTrades] = useLazyGetTradesQuery();

    useEffect(() => {
        triggerGetOrders({
            page: 0,
            size: 100,
            sortBy: 'symbol',
            direction: 'asc',
        });
        triggerGetTrades();
    }, [triggerGetOrders, triggerGetTrades]);

    useEffect(() => {
        
        connect((message, topic) => {
            if (topic === 'orders') {
                const newOrder = message;
                const currentOrders = store.getState().order.orders; // Fetch the latest orders state
    
                const existingOrder = currentOrders.find((order) => order.id === newOrder.id);
                let updatedOrders = currentOrders;
    
                if (existingOrder) {
                    updatedOrders = currentOrders.map((order) => (order.id === newOrder.id ? newOrder : order));
                } else {
                    updatedOrders = [newOrder, ...currentOrders];
                }
                dispatch(setOrders(updatedOrders));
            } else if (topic === 'trades') {
                const newTrade = message;
                const currentTrades = store.getState().trade.trades; // Fetch the latest trades state
                dispatch(setTrades([newTrade, ...currentTrades]));
            }
        });
    

        

    }, [dispatch]);


    const handleMatchOrders = async (symbol) => {
        try {
            await matchOrders(symbol).unwrap();
            alert("Matching completed successfully!");
        } catch(error) {
            console.error(error);
        }
    };
    const AppLayout = () => {
        return (
            <div>
                <AppBar position="static" mb={4}>
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            TOMS Dashboard
                        </Typography>
                        <Button variant="contained" color="secondary" onClick={handleOpen}>
                            Place Order
                        </Button>
                        <Button variant="contained" color="success" sx={{ marginLeft: '4px' }} disabled={isLoading} onClick={() => handleMatchOrders("AAPL")}>
                            Match Orders
                        </Button>
                        <Button color='white' onClick={() => toggleDrawer(true)}>
                            <MenuIcon color='white' />
                        </Button>
                    </Toolbar>
                </AppBar>
                <OrderModal open={open} handleOpen={handleOpen} handleClose={handleClose} />
                <Drawer anchor="left" open={drawer} onClose={() => toggleDrawer(false)}>
                    <MenuList>
                        <MenuItem >

                            <Link variant='button' style={{ color: 'black', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} underline="none" to="/"><HomeIcon /> Home</Link>
                        </MenuItem>
                        <MenuItem >
                            <Link variant='button' style={{ color: 'black', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} underline="none" to="/analytics"><BarChartIcon /> Analytics</Link>
                        </MenuItem>
                    </MenuList>
                </Drawer>
                {<Outlet />}
            </div>
        );
    };
    return (
        <Router>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route element={<PrivateRoute />}>
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/" element={<Home />} />
                    </Route>
                </Route>
            </Routes>
        </Router>
    );
}