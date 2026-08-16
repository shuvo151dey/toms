import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Switch,
    Avatar,
    Chip,
    Tooltip,
    Divider,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../redux/AppSlice';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TimelineIcon from '@mui/icons-material/Timeline';
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SettingsIcon from '@mui/icons-material/Settings';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { gradientPrimary } from '../../theme';

export const EXPANDED_WIDTH = 260;
export const COLLAPSED_WIDTH = 76;

const NAV_ITEMS = [
    { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, to: '/' },
    { label: 'Order Book', icon: <MenuBookIcon fontSize="small" />, to: '/#order-book' },
    { label: 'Trade Feed', icon: <TimelineIcon fontSize="small" />, to: '/#trade-feed' },
    { label: 'Positions', icon: <PieChartOutlineIcon fontSize="small" />, disabled: true },
    { label: 'Orders', icon: <ReceiptLongIcon fontSize="small" />, disabled: true },
    { label: 'Holdings', icon: <AccountBalanceWalletIcon fontSize="small" />, disabled: true },
    { label: 'P&L Report', icon: <AssessmentIcon fontSize="small" />, to: '/#pnl-report' },
    { label: 'Market Depth', icon: <StackedLineChartIcon fontSize="small" />, to: '/#market-depth' },
    { label: 'Watchlist', icon: <StarBorderIcon fontSize="small" />, disabled: true },
    { label: 'Alerts', icon: <NotificationsNoneIcon fontSize="small" />, disabled: true },
    { label: 'Settings', icon: <SettingsIcon fontSize="small" />, disabled: true },
];

function NavRow({ item, active, collapsed }) {
    const content = (
        <ListItemButton
            component={item.disabled ? 'div' : RouterLink}
            to={item.disabled ? undefined : item.to}
            disabled={item.disabled}
            selected={active}
            sx={{
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                justifyContent: collapsed ? 'center' : 'flex-start',
                '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                },
            }}
        >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: active ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
            </ListItemIcon>
            {!collapsed && (
                <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { fontSize: 14, fontWeight: active ? 600 : 500 } }}
                />
            )}
            {!collapsed && item.disabled && (
                <Chip label="Soon" size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
            )}
        </ListItemButton>
    );
    return collapsed ? (
        <Tooltip title={item.label} placement="right">
            <Box>{content}</Box>
        </Tooltip>
    ) : content;
}

export default function Sidebar({ collapsed, onToggleCollapse, userRoles = [], username, roleLabel }) {
    const dispatch = useDispatch();
    const location = useLocation();
    const theme = useSelector((state) => state.app.theme);

    const isActive = (item) => {
        if (item.disabled) return false;
        if (item.to === '/') return location.pathname === '/' && !location.hash;
        if (item.to?.startsWith('/#')) return location.pathname === '/' && location.hash === item.to.slice(1);
        return location.pathname === item.to;
    };

    const initials = (username || '?').slice(0, 2).toUpperCase();

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                '& .MuiDrawer-paper': {
                    width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
                    boxSizing: 'border-box',
                    overflowX: 'hidden',
                    transition: 'width 0.2s ease',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    backgroundImage: 'none',
                },
            }}
        >
            <Box display="flex" alignItems="center" gap={1.5} px={2} py={2.5}>
                <Box
                    sx={{
                        width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: gradientPrimary, color: '#fff',
                    }}
                >
                    <BarChartIcon fontSize="small" />
                </Box>
                {!collapsed && (
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.1}>TOMS</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3, fontSize: 11 }}>
                            Trading Order Management System
                        </Typography>
                    </Box>
                )}
                <IconButton size="small" onClick={onToggleCollapse}>
                    {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                </IconButton>
            </Box>

            <Divider />

            <List sx={{ flexGrow: 1, overflowY: 'auto', pt: 1 }}>
                {NAV_ITEMS.map((item) => (
                    <NavRow key={item.label} item={item} active={isActive(item)} collapsed={collapsed} />
                ))}

                {userRoles.includes('ADMIN') && (
                    <>
                        <Divider sx={{ my: 1 }} />
                        {!collapsed && (
                            <Typography variant="caption" color="text.secondary" sx={{ px: 2.5, letterSpacing: 1 }}>
                                ADMIN
                            </Typography>
                        )}
                        <NavRow
                            item={{ label: 'Analytics', icon: <ShowChartIcon fontSize="small" />, to: '/analytics' }}
                            active={location.pathname === '/analytics'}
                            collapsed={collapsed}
                        />
                        <NavRow
                            item={{ label: 'Tenants', icon: <ApartmentIcon fontSize="small" />, to: '/tenants' }}
                            active={location.pathname === '/tenants'}
                            collapsed={collapsed}
                        />
                    </>
                )}
            </List>

            <Divider />

            <Box px={2} py={1.5} display="flex" alignItems="center" justifyContent={collapsed ? 'center' : 'space-between'}>
                {!collapsed && (
                    <Typography variant="body2" color="text.secondary">Dark Mode</Typography>
                )}
                <Switch
                    size="small"
                    checked={theme === 'dark'}
                    onChange={() => dispatch(toggleTheme())}
                />
            </Box>

            <Divider />

            <Box px={2} py={2} display="flex" alignItems="center" gap={1.5}>
                <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>{initials}</Avatar>
                {!collapsed && (
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{username}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{roleLabel}</Typography>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
}
