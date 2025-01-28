import React, { useState } from 'react';
import { useLoginMutation } from '../redux/ApiSlice';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/AuthSlice';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [login, { isLoading }] = useLoginMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(formData).unwrap();
            const {roles, sub} = jwtDecode(response.token);
            
            dispatch(setCredentials({roles, user: sub, token: response.token})); // Save user and token to Redux
            localStorage.setItem('token', response.token); // Optional: Save token
            navigate('/');
        } catch (err) {
            setError('Invalid username or password');
        }
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            bgcolor="#f5f5f5"
        >
            <Paper elevation={3} sx={{ p: 4, width: 400 }}>
                <Typography variant="h5" textAlign="center" mb={2}>
                    Login
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
                    />
                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    {error && (
                        <Typography color="error" variant="body2" mt={1}>
                            {error}
                        </Typography>
                    )}
                    <Box mt={2}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={isLoading}
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Login'}
                        </Button>
                    </Box>
                    <Box mt={2} textAlign="center">
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
    );
};

export default Login;
