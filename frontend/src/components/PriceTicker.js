import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function PriceTicker() {
    const prices = useSelector(state => state.price.prices);

    const entries = Object.entries(prices);

    if (entries.length === 0) {
        return (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                    Live Prices — waiting for market data...
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" color="text.secondary">Live Prices</Typography>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
                {entries.map(([ticker, price]) => (
                    <Chip
                        key={ticker}
                        label={`${ticker}  $${Number(price).toFixed(2)}`}
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                    />
                ))}
            </Box>
        </Paper>
    );
}
