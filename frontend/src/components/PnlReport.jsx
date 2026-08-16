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
    ToggleButtonGroup,
    ToggleButton,
    Tooltip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
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

const StatBox = ({ label, value, extra }) => (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, flex: 1, minWidth: 140 }}>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.5 }}>{label}</Typography>
        <Typography variant="h6" fontFamily="monospace" fontWeight={700}>{value}</Typography>
        {extra}
    </Box>
);

// Only "All Time" reflects real data — /analytics/pnl has no date-range param,
// so the other periods are shown for layout parity but intentionally disabled
// rather than silently pretending to filter.
const PERIODS = ['All Time', 'This Week', 'This Month', 'Custom'];

export default function PnlReport() {
    const { data, isLoading } = useGetPnlQuery();

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <AssessmentOutlinedIcon fontSize="small" color="primary" />
                        <Typography variant="h6">P&L Report</Typography>
                    </Box>
                    <ToggleButtonGroup exclusive value="All Time" size="small">
                        {PERIODS.map((p) => (
                            <Tooltip key={p} title={p === 'All Time' ? '' : 'Date-range filtering coming soon'}>
                                <span>
                                    <ToggleButton value={p} disabled={p !== 'All Time'} sx={{ px: 2, textTransform: 'none' }}>
                                        {p}
                                    </ToggleButton>
                                </span>
                            </Tooltip>
                        ))}
                    </ToggleButtonGroup>
                </Box>

                {isLoading ? (
                    <Typography color="text.secondary">Loading P&L...</Typography>
                ) : !data ? null : (
                    <>
                        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                            <StatBox label="TOTAL BOUGHT" value={`$${Number(data.totalBuyAmount).toFixed(2)}`} />
                            <StatBox label="TOTAL SOLD" value={`$${Number(data.totalSellAmount).toFixed(2)}`} />
                            <StatBox
                                label="OVERALL P&L"
                                value={`$${Number(data.pnl).toFixed(2)}`}
                                extra={<Box mt={0.5}><PnlChip value={data.pnl} /></Box>}
                            />
                        </Box>

                        {data.pnlBySymbol && Object.keys(data.pnlBySymbol).length > 0 ? (
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
                                        {Object.entries(data.pnlBySymbol).map(([symbol, value]) => (
                                            <TableRow key={symbol}>
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{symbol}</TableCell>
                                                <TableCell><PnlChip value={value} /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </>
                        ) : (
                            <Box textAlign="center" py={3}>
                                <Typography variant="body2" fontWeight={600}>No completed trades yet</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Your profit and loss summary will appear here once you start trading.
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
