import React, { useState } from 'react';
import { useLoginMutation, useGetPublicTenantsQuery } from '../redux/ApiSlice';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Link,
    MenuItem,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import InsightsIcon from '@mui/icons-material/Insights';
import { gradientPrimary } from '../theme';

const FEATURES = [
    { icon: <ShowChartIcon fontSize="small" />, title: 'Real-time Market Data', subtitle: 'Live prices, depth & market insights.' },
    { icon: <ShieldOutlinedIcon fontSize="small" />, title: 'Secure & Reliable', subtitle: 'Enterprise-grade security for your data.' },
    { icon: <InsightsIcon fontSize="small" />, title: 'Powerful Analytics', subtitle: 'Track performance and maximize returns.' },
];

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '', tenantId: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [login, { isLoading }] = useLoginMutation();
    const { data: tenants = [] } = useGetPublicTenantsQuery();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(formData).unwrap();

            navigate('/');
        } catch (err) {
            setError('Invalid username or password');
        }
    };

    return (
        <Box display="flex" minHeight="100vh">
            <Box
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'center',
                    width: '42%',
                    px: 8,
                    py: 6,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    background: (theme) => theme.palette.mode === 'dark'
                        ? 'linear-gradient(160deg, #0F1626 0%, #1B2438 100%)'
                        : 'linear-gradient(160deg, #EEF3FF 0%, #F8FAFF 100%)',
                }}
            >
                <Box display="flex" alignItems="center" gap={1.5} mb={6}>
                    <Box
                        sx={{
                            width: 40, height: 40, borderRadius: 2,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: gradientPrimary, color: '#fff',
                        }}
                    >
                        <BarChartIcon />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.1}>TOMS</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Trading Order Management System
                        </Typography>
                    </Box>
                </Box>

                <Typography variant="h3" fontWeight={800} lineHeight={1.15} color="text.primary">
                    Trade Smarter.
                </Typography>
                <Typography variant="h3" fontWeight={800} lineHeight={1.15} color="text.primary" mb={2}>
                    Manage Better.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 380, mb: 5 }}>
                    TOMS helps you manage orders, track trades and analyze performance in real time.
                </Typography>

                <Box display="flex" flexDirection="column" gap={3}>
                    {FEATURES.map((f) => (
                        <Box key={f.title} display="flex" alignItems="flex-start" gap={2}>
                            <Box
                                sx={{
                                    width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: 'primary.main', opacity: 0.9, color: '#fff',
                                }}
                            >
                                {f.icon}
                            </Box>
                            <Box>
                                <Typography variant="body1" fontWeight={600}>{f.title}</Typography>
                                <Typography variant="body2" color="text.secondary">{f.subtitle}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Box flex={1} display="flex" alignItems="center" justifyContent="center" p={4}>
                <Paper variant="outlined" sx={{ p: 5, width: '100%', maxWidth: 440 }}>
                    <Typography variant="h5" fontWeight={700} textAlign="center" mb={0.5}>
                        Welcome Back
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
                        Sign in to continue to your TOMS dashboard
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            required
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonOutlineIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <TextField
                            label="Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            required
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockOutlinedIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setShowPassword((s) => !s)} edge="end">
                                                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <TextField
                            select
                            label="Tenant"
                            name="tenantId"
                            value={formData.tenantId}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            required
                        >
                            {tenants.map((tenant) => (
                                <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                            ))}
                        </TextField>
                        {error && (
                            <Typography color="error" variant="body2" mt={1}>
                                {error}
                            </Typography>
                        )}
                        <Box mt={3}>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={isLoading}
                                sx={{ background: gradientPrimary, color: '#fff', py: 1.25 }}
                            >
                                {isLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
                            </Button>
                        </Box>
                        <Box mt={2.5} textAlign="center">
                            <Typography variant="body2">
                                Don't have an account?{' '}
                                <Link href="/signup" to="/signup" underline="hover">
                                    Sign Up
                                </Link>
                            </Typography>
                        </Box>
                    </form>
                </Paper>
            </Box>
        </Box>
    );
};

export default Login;
