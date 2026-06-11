import React, { useState } from 'react';
import {
    Badge, IconButton, Popover, Box, Typography, Divider, Button, Chip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllReadMutation } from '../redux/ApiSlice';

const typeColor = {
    ORDER_FILLED: 'success',
    ORDER_REJECTED: 'error',
    STOP_TRIGGERED: 'warning',
};

export default function NotificationBell() {
    const [anchor, setAnchor] = useState(null);
    const { data: notifications = [], refetch } = useGetNotificationsQuery(undefined, { pollingInterval: 30000 });
    const [markRead] = useMarkNotificationReadMutation();
    const [markAllRead] = useMarkAllReadMutation();

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleOpen = (e) => setAnchor(e.currentTarget);
    const handleClose = () => setAnchor(null);

    const handleMarkRead = async (id) => {
        await markRead(id);
        refetch();
    };

    const handleMarkAll = async () => {
        await markAllRead();
        refetch();
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleOpen}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Box sx={{ width: 340, maxHeight: 420, display: 'flex', flexDirection: 'column' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" px={2} pt={1.5} pb={1}>
                        <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
                        {unreadCount > 0 && (
                            <Button size="small" onClick={handleMarkAll}>Mark all read</Button>
                        )}
                    </Box>
                    <Divider />
                    <Box sx={{ overflowY: 'auto', flex: 1 }}>
                        {notifications.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                No notifications yet.
                            </Typography>
                        )}
                        {notifications.map((n) => (
                            <Box
                                key={n.id}
                                sx={{
                                    px: 2, py: 1.5,
                                    backgroundColor: n.read ? 'transparent' : 'action.hover',
                                    cursor: n.read ? 'default' : 'pointer',
                                    '&:hover': { backgroundColor: 'action.selected' },
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                }}
                                onClick={() => !n.read && handleMarkRead(n.id)}
                            >
                                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                    <Chip
                                        label={n.type?.replace('_', ' ')}
                                        color={typeColor[n.type] || 'default'}
                                        size="small"
                                        variant="outlined"
                                    />
                                    {!n.read && (
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                    )}
                                </Box>
                                <Typography variant="body2">{n.message}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(n.createdAt).toLocaleString()}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Popover>
        </>
    );
}
