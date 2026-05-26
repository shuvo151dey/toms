import { Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
    const navigate = useNavigate();
    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2}>
            <Typography variant="h4">403 — Unauthorized</Typography>
            <Typography variant="body1">You don't have permission to access this page.</Typography>
            <Button variant="contained" onClick={() => navigate('/')}>Go Home</Button>
        </Box>
    );
}