import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Card, CardContent, Link } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

function PriceCard({ ticker, price, prevPrice }) {
    const change = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0;
    const isUp = change >= 0;
    return (
        <Box
            sx={{
                flex: '1 1 120px',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 1.5,
            }}
        >
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{ticker}</Typography>
            <Typography variant="h6" fontFamily="monospace" fontWeight={700}>
                ${Number(price).toFixed(2)}
            </Typography>
            <Typography variant="caption" color={isUp ? 'success.main' : 'error.main'} fontWeight={600}>
                {isUp ? '+' : ''}{change.toFixed(2)}%
            </Typography>
        </Box>
    );
}

export default function PriceTicker() {
    const prices = useSelector(state => state.price.prices);
    const entries = Object.entries(prices);

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <FiberManualRecordIcon sx={{ fontSize: 10, color: 'primary.main' }} />
                        <Typography variant="h6">Live Prices</Typography>
                    </Box>
                    <Link component="button" variant="body2" underline="hover" sx={{ color: 'primary.main' }}>
                        View Watchlist
                    </Link>
                </Box>

                {entries.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        Waiting for market data...
                    </Typography>
                ) : (
                    <Box display="flex" flexWrap="wrap" gap={1.5}>
                        {entries.map(([ticker, { price, prevPrice }]) => (
                            <PriceCard key={ticker} ticker={ticker} price={price} prevPrice={prevPrice} />
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
