import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    MenuItem,
    TextField,
    Box,
    Grid2 as Grid,
} from '@mui/material';
import { useGetOrderBookQuery, useGetSymbolsQuery } from '../redux/ApiSlice';

const PriceLevel = ({ row, side }) => (
    <TableRow>
        <TableCell sx={{ color: side === 'bid' ? 'success.main' : 'error.main', fontFamily: 'monospace' }}>
            ${Number(row.price).toFixed(2)}
        </TableCell>
        <TableCell sx={{ fontFamily: 'monospace' }}>{row.quantity}</TableCell>
    </TableRow>
);

const DepthTable = ({ title, rows, side }) => (
    <Card variant="outlined">
        <CardContent>
            <Typography variant="subtitle1" fontWeight={600} color={side === 'bid' ? 'success.main' : 'error.main'} gutterBottom>
                {title}
            </Typography>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Price</TableCell>
                        <TableCell>Quantity</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={2} align="center" sx={{ color: 'text.secondary' }}>
                                No {side === 'bid' ? 'buy' : 'sell'} orders
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row, i) => <PriceLevel key={i} row={row} side={side} />)
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

export default function OrderBookDepth() {
    const { data: symbols = [] } = useGetSymbolsQuery();
    const [selectedSymbol, setSelectedSymbol] = useState('');

    const { data, isFetching } = useGetOrderBookQuery(selectedSymbol, {
        skip: !selectedSymbol,
        pollingInterval: 10000,
    });

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6">Market Depth</Typography>
                    <TextField
                        select
                        size="small"
                        label="Symbol"
                        value={selectedSymbol}
                        onChange={(e) => setSelectedSymbol(e.target.value)}
                        sx={{ minWidth: 120 }}
                    >
                        {symbols.map(s => (
                            <MenuItem key={s.ticker} value={s.ticker}>{s.ticker}</MenuItem>
                        ))}
                    </TextField>
                </Box>

                {!selectedSymbol ? (
                    <Typography color="text.secondary" variant="body2">Select a symbol to view market depth.</Typography>
                ) : isFetching ? (
                    <Typography color="text.secondary" variant="body2">Loading...</Typography>
                ) : (
                    <Grid container spacing={2}>
                        <Grid size={6}>
                            <DepthTable title="Bids (Buy)" rows={data?.bids ?? []} side="bid" />
                        </Grid>
                        <Grid size={6}>
                            <DepthTable title="Asks (Sell)" rows={data?.asks ?? []} side="ask" />
                        </Grid>
                    </Grid>
                )}
            </CardContent>
        </Card>
    );
}
