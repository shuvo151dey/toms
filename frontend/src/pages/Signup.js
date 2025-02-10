import React, { useState } from 'react';
import { useSignupMutation } from '../redux/ApiSlice';
import { Box, TextField, Button, Typography, Paper, CircularProgress, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { setAlert } from '../redux/AppSlice';
import { useDispatch } from 'react-redux';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [signup, { isLoading }] = useSignupMutation();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const dispatch = useDispatch();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { password, confirmPassword, ...userData } = formData;

        if (password !== confirmPassword) {
            dispatch(setAlert({ message: 'Passwords do not match', type: 'error' }));
            return;
        }

        try {
            await signup({ ...userData, password });
            dispatch(setAlert({ message: 'Signup successful. Please login.', type: 'success' }));
            navigate('/login');
        } catch (err) {
            console.error(err);
            dispatch(setAlert({ message: 'Signup failed. Please try again.', type: 'error' }));
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
                    Sign Up
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
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
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
                    <TextField
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
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
                            {isLoading ? <CircularProgress size={24} /> : 'Sign Up'}
                        </Button>
                    </Box>
                    <Box mt={2} textAlign="center">
                        <Typography variant="body2">
                            Already have an account?{' '}
                            <Link href="/login" to="/login" underline="hover">
                                Login
                            </Link>
                        </Typography>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default Signup;
