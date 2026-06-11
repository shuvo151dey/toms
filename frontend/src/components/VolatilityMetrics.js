import React from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import {
    ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import { useSelector } from 'react-redux';
import { useGetVolatilityQuery } from '../redux/ApiSlice';

const StatBox = ({ label, value, color }) => (
    <Box textAlign="center" minWidth={80}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontFamily="monospace" fontWeight={600} color={color || 'text.primary'}>
            ${Number(value || 0).toFixed(2)}
        </Typography>
    </Box>
);

export default function VolatilityMetrics() {
    const selectedSymbol = useSelector((state) => state.app.selectedSymbol);
    const { data, isLoading } = useGetVolatilityQuery(selectedSymbol, {
        skip: !selectedSymbol,
        pollingInterval: 30000,
    });

    const chartData = data ? [
        { name: 'Open', value: data.open },
        { name: 'High', value: data.high },
        { name: 'Low', value: data.low },
        { name: 'Close', value: data.close },
    ] : [];

    const barColors = ['#1976d2', '#2e7d32', '#d32f2f', '#9c27b0'];

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Intraday Metrics {selectedSymbol ? `— ${selectedSymbol}` : ''}
                </Typography>

                {isLoading && <Typography color="text.secondary">Loading...</Typography>}

                {!isLoading && data && data.high === 0 && (
                    <Typography color="text.secondary" variant="body2">No trades today yet.</Typography>
                )}

                {!isLoading && data && data.high > 0 && (
                    <>
                        <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                            <StatBox label="Open" value={data.open} color="text.primary" />
                            <StatBox label="High" value={data.high} color="success.main" />
                            <StatBox label="Low" value={data.low} color="error.main" />
                            <StatBox label="Close" value={data.close} color="primary.main" />
                            <Divider orientation="vertical" flexItem />
                            <StatBox label="Spread" value={data.spread} />
                            <Box textAlign="center" minWidth={80}>
                                <Typography variant="caption" color="text.secondary">Volatility (σ)</Typography>
                                <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                                    ${Number(data.volatility || 0).toFixed(4)}
                                </Typography>
                            </Box>
                        </Box>

                        <ResponsiveContainer width="100%" height={160}>
                            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis
                                    domain={['auto', 'auto']}
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                                />
                                <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
                                <Bar dataKey="value" name="Price">
                                    {chartData.map((_, index) => (
                                        <Cell key={index} fill={barColors[index]} />
                                    ))}
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
