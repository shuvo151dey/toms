import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useSelector } from 'react-redux';
import { useGetSnapshotsQuery } from '../redux/ApiSlice';

export default function AnalyticsChart() {
    const selectedSymbol = useSelector((state) => state.app.selectedSymbol);
    const { data: snapshots, isLoading } = useGetSnapshotsQuery(selectedSymbol, {
        skip: !selectedSymbol,
    });

    const chartData = (snapshots || []).map((s) => ({
        time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        vwap: s.vwap ? Number(s.vwap.toFixed(2)) : null,
        volume: s.totalVolume,
        trades: s.tradeCount,
    }));

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    VWAP & Volume History {selectedSymbol ? `— ${selectedSymbol}` : ''}
                </Typography>

                {isLoading && <Typography color="text.secondary">Loading...</Typography>}

                {!isLoading && chartData.length === 0 && (
                    <Typography color="text.secondary" variant="body2">
                        No snapshots yet — data accumulates hourly once trades occur.
                    </Typography>
                )}

                {chartData.length > 0 && (
                    <Box>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="price" orientation="left" tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="vol" orientation="right" tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    yAxisId="price"
                                    type="monotone"
                                    dataKey="vwap"
                                    name="VWAP ($)"
                                    stroke="#1976d2"
                                    dot={false}
                                    strokeWidth={2}
                                />
                                <Line
                                    yAxisId="vol"
                                    type="monotone"
                                    dataKey="volume"
                                    name="Volume"
                                    stroke="#2e7d32"
                                    dot={false}
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}