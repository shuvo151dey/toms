import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Box,
    Chip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useGetPnlQuery } from '../redux/ApiSlice';

const PnlChip = ({ value }) => {
    const isPositive = value >= 0;
    return (
        <Chip
            icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label={`${isPositive ? '+' : ''}$${Number(value).toFixed(2)}`}
            color={isPositive ? 'success' : 'error'}
            variant="outlined"
            size="small"
            sx={{ fontFamily: 'monospace', fontWeight: 600 }}
        />
    );
};

export default function PnlReport() {
    const { data, isLoading } = useGetPnlQuery();

    if (isLoading) {
        return (
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography color="text.secondary">Loading P&L...</Typography>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    const { totalBuyAmount, totalSellAmount, pnl, pnlBySymbol } = data;
    const symbolEntries = pnlBySymbol ? Object.entries(pnlBySymbol) : [];

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>P&L Report</Typography>

                <Box display="flex" gap={3} mb={2} flexWrap="wrap">
                    <Box>
                        <Typography variant="caption" color="text.secondary">Total Bought</Typography>
                        <Typography variant="body1" fontFamily="monospace">${Number(totalBuyAmount).toFixed(2)}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Total Sold</Typography>
                        <Typography variant="body1" fontFamily="monospace">${Number(totalSellAmount).toFixed(2)}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Overall P&L</Typography>
                        <Box mt={0.5}><PnlChip value={pnl} /></Box>
                    </Box>
                </Box>

                {symbolEntries.length > 0 && (
                    <>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>By Symbol</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Symbol</TableCell>
                                    <TableCell>P&L</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {symbolEntries.map(([symbol, value]) => (
                                    <TableRow key={symbol}>
                                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{symbol}</TableCell>
                                        <TableCell><PnlChip value={value} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </>
                )}

                {symbolEntries.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No completed trades yet.</Typography>
                )}
            </CardContent>
        </Card>
    );
}