import { useState } from 'react';
import { Modal, Box, Typography, Button, TextField, Chip, Stack } from '@mui/material';
import {
    useGetTenantSymbolsQuery,
    useAddTenantSymbolMutation,
    useRemoveTenantSymbolMutation,
} from '../redux/ApiSlice';
import logger from '../utils/logger';

const SymbolManagerModal = ({ open, handleClose, tenant }) => {
    const tenantId = tenant?.tenantId;
    const { data: symbols = [], refetch } = useGetTenantSymbolsQuery(tenantId, { skip: !tenantId || !open });
    const [addTenantSymbol] = useAddTenantSymbolMutation();
    const [removeTenantSymbol] = useRemoveTenantSymbolMutation();
    const [ticker, setTicker] = useState('');

    const handleAdd = async () => {
        if (!ticker.trim()) return;
        try {
            await addTenantSymbol({ tenantId, ticker: ticker.trim().toUpperCase() }).unwrap();
            setTicker('');
            refetch();
        } catch (error) {
            logger.error('Error adding symbol', error);
        }
    };

    const handleRemove = async (symbolTicker) => {
        try {
            await removeTenantSymbol({ tenantId, ticker: symbolTicker }).unwrap();
            refetch();
        } catch (error) {
            logger.error('Error removing symbol', error);
        }
    };

    return (
        <Modal open={open} onClose={handleClose} aria-labelledby="symbol-manager-title">
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 420,
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                }}
            >
                <Typography id="symbol-manager-title" variant="h6" component="h2" gutterBottom>
                    Symbols — {tenant?.name}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, minHeight: 40 }}>
                    {symbols.length === 0 && (
                        <Typography variant="body2" color="text.secondary">No symbols yet</Typography>
                    )}
                    {symbols.map((s) => (
                        <Chip key={s.id} label={s.ticker} onDelete={() => handleRemove(s.ticker)} sx={{ mb: 1 }} />
                    ))}
                </Stack>

                <Box display="flex" gap={1}>
                    <TextField
                        label="Ticker"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                        fullWidth
                        size="small"
                    />
                    <Button variant="contained" onClick={handleAdd}>Add</Button>
                </Box>

                <Button variant="contained" color="secondary" onClick={handleClose} sx={{ mt: 3 }}>
                    Close
                </Button>
            </Box>
        </Modal>
    );
};

export default SymbolManagerModal;
