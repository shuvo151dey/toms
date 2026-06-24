import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Box, Typography, Paper, Chip, Divider,
    TextField, Button, Stack
} from '@mui/material';
import { useChangePasswordMutation } from '../redux/ApiSlice';

export default function Profile() {
    const { user, roles, tenantId } = useSelector((state) => state.auth);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changePassword, { isLoading }] = useChangePasswordMutation();

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) return;
        await changePassword({ oldPassword, newPassword });
        setOldPassword('');
        setNewPassword('');
    };

    return (
        <Box sx={{ maxWidth: 480, mx: 'auto', mt: 6, px: 2 }}>
            <Paper sx={{ p: 4, mb: 4 }}>
                <Typography variant="h6" gutterBottom>Profile</Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Username</Typography>
                        <Typography>{user}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Tenant</Typography>
                        <Typography>{tenantId}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Roles</Typography>
                        <Box sx={{ mt: 0.5 }}>
                            {roles.map((r) => (
                                <Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} />
                            ))}
                        </Box>
                    </Box>
                </Stack>
            </Paper>

            <Paper sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom>Change Password</Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                    <TextField
                        label="Current Password"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        fullWidth
                    />
                    <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={isLoading || !oldPassword || !newPassword}
                    >
                        {isLoading ? 'Saving...' : 'Change Password'}
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
