import { useState } from 'react';
import {
    Container,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    Box,
} from '@mui/material';
import TenantModal from '../components/TenantModal';
import SymbolManagerModal from '../components/SymbolManagerModal';
import { useGetTenantsQuery, useDeleteTenantMutation } from '../redux/ApiSlice';
import logger from '../utils/logger';

const TenantAdmin = () => {
    const { data: tenants = [], refetch } = useGetTenantsQuery();
    const [deleteTenant] = useDeleteTenantMutation();
    const [open, setOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [symbolsOpen, setSymbolsOpen] = useState(false);
    const [symbolsTenant, setSymbolsTenant] = useState(null);

    const handleAdd = () => {
        setSelectedTenant(null);
        setOpen(true);
    };

    const handleEdit = (tenant) => {
        setSelectedTenant(tenant);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedTenant(null);
        refetch();
    };

    const handleManageSymbols = (tenant) => {
        setSymbolsTenant(tenant);
        setSymbolsOpen(true);
    };

    const handleSymbolsClose = () => {
        setSymbolsOpen(false);
        setSymbolsTenant(null);
    };

    const handleDelete = async (tenant) => {
        if (!window.confirm(`Delete tenant "${tenant.name}" (${tenant.tenantId})?`)) return;
        try {
            await deleteTenant(tenant.id).unwrap();
            refetch();
        } catch (error) {
            logger.error('Error deleting tenant', error);
        }
    };

    return (
        <Container sx={{ marginTop: 4 }}>
            <TenantModal open={open} handleClose={handleClose} tenant={selectedTenant} />
            <SymbolManagerModal open={symbolsOpen} handleClose={handleSymbolsClose} tenant={symbolsTenant} />
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">Tenant Administration</Typography>
                        <Button variant="contained" color="primary" onClick={handleAdd}>
                            Add Tenant
                        </Button>
                    </Box>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Tenant ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Max Position</TableCell>
                                <TableCell>Max Notional</TableCell>
                                <TableCell>Daily Loss Limit</TableCell>
                                <TableCell>Max Order Qty</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tenants.map((tenant) => (
                                <TableRow key={tenant.id}>
                                    <TableCell>{tenant.tenantId}</TableCell>
                                    <TableCell>{tenant.name}</TableCell>
                                    <TableCell>{tenant.maxPosition ?? '—'}</TableCell>
                                    <TableCell>{tenant.maxNotional ?? '—'}</TableCell>
                                    <TableCell>{tenant.dailyLossLimit ?? '—'}</TableCell>
                                    <TableCell>{tenant.maxOrderQuantity ?? '—'}</TableCell>
                                    <TableCell>
                                        <Button size="small" variant="contained" color="primary" sx={{ marginRight: '4px' }} onClick={() => handleEdit(tenant)}>
                                            Edit
                                        </Button>
                                        <Button size="small" variant="contained" color="secondary" sx={{ marginRight: '4px' }} onClick={() => handleManageSymbols(tenant)}>
                                            Symbols
                                        </Button>
                                        <Button size="small" variant="contained" color="error" onClick={() => handleDelete(tenant)}>
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </Container>
    );
};

export default TenantAdmin;
