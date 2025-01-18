import React, { use, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { AppBar, Toolbar, Typography, Button, Drawer, MenuList, MenuItem } from '@mui/material';

import store from './redux/store';
import { useMatchOrdersMutation, useLazyGetOrdersQuery, useLazyGetTradesQuery } from './redux/ApiSlice';
import { setOrders } from './redux/OrderSlice';
import { setTrades } from './redux/TradeSlice';


import Home from './pages/Home';
import Analytics from './pages/Analytics';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import OrderModal from './components/OrderModal';
import BarChartIcon from '@mui/icons-material/BarChart';

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
    const [triggerGetOrders] = useLazyGetOrdersQuery({
        page: 0,
        size: 10,
        sortBy: 'symbol',
        direction: 'asc',
    });
    const [triggerGetTrades] = useLazyGetTradesQuery();

    useEffect(() => {
        triggerGetOrders();
        triggerGetTrades();
    }, [triggerGetOrders, triggerGetTrades, dispatch]);

    useEffect(() => {
        
        connect((message, topic) => {
            if (topic === 'orders') {
                const newOrder = message;
                const existingOrder = orders.find((order) => order.id === newOrder.id);
                let updatedOrders = orders;

                if (existingOrder) {
                    updatedOrders = orders.map((order) => (order.id === newOrder.id ? newOrder : order));
                } else {
                    updatedOrders = [newOrder, ...orders];
                }
                dispatch(setOrders(updatedOrders));
            } else if (topic === 'trades') {
                const newTrade = message;

                dispatch(setTrades([newTrade, ...trades]));
            }
        });

        

    }, [orders, trades, dispatch]);


    const handleMatchOrders = async (symbol) => {
        try {
            await matchOrders(symbol).unwrap();
            alert("Matching completed successfully!");
        } catch(error) {
            console.error(error);
        }
    };
    const AppLayout = ({ children }) => {
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

                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/" element={<Home />} />
                </Route>
            </Routes>
        </Router>
    );
}