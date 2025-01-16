import { BrowserRouter as Router, Routes, Route, Outlet, Link } from 'react-router-dom';
import Home from './pages/Home';
import Analytics from './pages/Analytics';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';
import { AppBar, Toolbar, Typography, Button, Drawer, Menu, MenuList, MenuItem } from '@mui/material';
import { useMatchOrdersMutation } from './redux/ApiSlice';
import OrderModal from './components/OrderModal';
import React from 'react';

export default function App() {
    const [open, setOpen] = React.useState(false);
    const [drawer, toggleDrawer] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [matchOrders, { isLoading, error }] = useMatchOrdersMutation();

    const handleMatchOrders = async (symbol) => {
        try {
            await matchOrders(symbol).unwrap();
            alert("Matching completed successfully!");
        } catch {
            alert("Error in matching orders");
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

                            <Link variant='button' style={{color: 'black', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}} underline="none" to="/"><HomeIcon /> Home</Link>
                        </MenuItem>
                        <MenuItem >
                            <Link variant='button' style={{color: 'black', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}} underline="none" to="/analytics"><BarChartIcon /> Analytics</Link>
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