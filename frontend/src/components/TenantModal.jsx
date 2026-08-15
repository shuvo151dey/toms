import { useEffect, useState } from 'react';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';
import { useCreateTenantMutation, useUpdateTenantMutation } from '../redux/ApiSlice';

const emptyForm = {
    tenantId: '',
    name: '',
    maxPosition: '',
    maxNotional: '',
    dailyLossLimit: '',
    maxOrderQuantity: '',
};

const TenantModal = ({ open, handleClose, tenant }) => {
    const isEdit = !!tenant;
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [createTenant] = useCreateTenantMutation();
    const [updateTenant] = useUpdateTenantMutation();

    useEffect(() => {
        if (tenant) {
            setForm({
                tenantId: tenant.tenantId ?? '',
                name: tenant.name ?? '',
                maxPosition: tenant.maxPosition ?? '',
                maxNotional: tenant.maxNotional ?? '',
                dailyLossLimit: tenant.dailyLossLimit ?? '',
                maxOrderQuantity: tenant.maxOrderQuantity ?? '',
            });
        } else {
            setForm(emptyForm);
        }
        setErrors({});
    }, [tenant, open]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validate = () => {
        const newErrors = {};
        if (!isEdit && !form.tenantId.trim()) newErrors.tenantId = 'Tenant ID is required';
        if (!form.name.trim()) newErrors.name = 'Name is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        const payload = {
            name: form.name,
            maxPosition: form.maxPosition === '' ? null : Number(form.maxPosition),
            maxNotional: form.maxNotional === '' ? null : Number(form.maxNotional),
            dailyLossLimit: form.dailyLossLimit === '' ? null : Number(form.dailyLossLimit),
            maxOrderQuantity: form.maxOrderQuantity === '' ? null : Number(form.maxOrderQuantity),
        };

        try {
            if (isEdit) {
                await updateTenant({ id: tenant.id, ...payload }).unwrap();
            } else {
                await createTenant({ tenantId: form.tenantId, ...payload }).unwrap();
            }
            handleClose();
        } catch (error) {
            // ApiSlice's onQueryStarted already dispatches the error alert
        }
    };

    return (
        <Modal open={open} onClose={handleClose} aria-labelledby="tenant-modal-title">
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
                <Typography id="tenant-modal-title" variant="h6" component="h2" gutterBottom>
                    {isEdit ? 'Edit Tenant' : 'New Tenant'}
                </Typography>

                <TextField
                    label="Tenant ID"
                    name="tenantId"
                    value={form.tenantId}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    disabled={isEdit}
                    helperText={isEdit ? 'Tenant ID cannot be changed' : errors.tenantId}
                    error={!!errors.tenantId}
                />
                <TextField
                    label="Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    error={!!errors.name}
                    helperText={errors.name}
                />
                <TextField
                    label="Max Position"
                    name="maxPosition"
                    type="number"
                    value={form.maxPosition}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    helperText="Blank = use global default"
                />
                <TextField
                    label="Max Notional"
                    name="maxNotional"
                    type="number"
                    value={form.maxNotional}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    helperText="Blank = use global default"
                />
                <TextField
                    label="Daily Loss Limit"
                    name="dailyLossLimit"
                    type="number"
                    value={form.dailyLossLimit}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    helperText="Blank = use global default"
                />
                <TextField
                    label="Max Order Quantity"
                    name="maxOrderQuantity"
                    type="number"
                    value={form.maxOrderQuantity}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    helperText="Blank = use global default"
                />

                <Button variant="contained" color="secondary" onClick={handleClose} sx={{ mt: 2 }}>
                    Close
                </Button>
                <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mt: 2, ml: 2 }}>
                    {isEdit ? 'Save' : 'Create'}
                </Button>
            </Box>
        </Modal>
    );
};

export default TenantModal;
