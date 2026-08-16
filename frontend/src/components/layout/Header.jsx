import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NotificationBell from '../NotificationBell';
import { gradientPrimary } from '../../theme';

const PAGE_META = {
    '/': { title: 'Dashboard', subtitle: 'Overview of your trading activity' },
    '/analytics': { title: 'Analytics', subtitle: 'Trade and order analytics across your tenant' },
    '/tenants': { title: 'Tenants', subtitle: 'Manage tenants and their risk limits' },
    '/profile': { title: 'Profile', subtitle: 'Your account details' },
};

export default function Header({ onPlaceOrder, showMatchOrders, onMatchOrders, username, roleLabel, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [now, setNow] = useState(new Date());
    const [anchor, setAnchor] = useState(null);

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const meta = PAGE_META[location.pathname] || { title: 'TOMS', subtitle: '' };
    const initials = (username || '?').slice(0, 2).toUpperCase();

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                px: 4,
                py: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Box>
                <Typography variant="h5" fontWeight={700}>{meta.title}</Typography>
                {meta.subtitle && (
                    <Typography variant="body2" color="text.secondary">{meta.subtitle}</Typography>
                )}
            </Box>

            <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onPlaceOrder}
                        sx={{ background: gradientPrimary, color: '#fff', px: 2.5 }}
                    >
                        Place Order
                    </Button>
                    {showMatchOrders && (
                        <Button variant="outlined" size="small" startIcon={<SyncIcon fontSize="small" />} onClick={onMatchOrders}>
                            Match Orders
                        </Button>
                    )}
                    <NotificationBell />
                    <IconButton onClick={() => navigate('/profile')}>
                        <SettingsIcon fontSize="small" />
                    </IconButton>
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        sx={{ cursor: 'pointer' }}
                        onClick={(e) => setAnchor(e.currentTarget)}
                    >
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>{initials}</Avatar>
                        <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </Box>
                    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                        <MenuItem onClick={() => { setAnchor(null); navigate('/profile'); }}>
                            <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
                            Profile
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => { setAnchor(null); onLogout(); }}>
                            <ListItemIcon><ExitToAppIcon fontSize="small" /></ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>
                <Box display="flex" alignItems="center" gap={0.75}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                    <Typography variant="caption" color="text.secondary">Market: Open</Typography>
                    <Typography variant="caption" color="text.secondary">·</Typography>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                        {now.toLocaleTimeString()}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
