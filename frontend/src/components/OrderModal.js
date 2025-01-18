import React, { useEffect, useState } from 'react';
import { Modal, Box, Typography, Button, TextField, MenuItem } from '@mui/material';
import instance from '../services/AxiosInstanceService';
import { useSelector } from 'react-redux';
import { useCreateOrderMutation, useUpdateOrderMutation } from '../redux/ApiSlice';


const OrderModal = ({ open, handleOpen, handleClose }) => {
    const [isEdit, setIsEdit] = useState(false);
    const [symbol, setSymbol] = useState('');
    const [orderAction, setOrderAction] = useState('');
    const [orderMethod, setOrderMethod] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState(0);
    const [limitPrice, setLimitPrice] = useState(null);
    const [stopPrice, setStopPrice] = useState(null);
    const order = useSelector((state) => state.order.order);
    const [createOrder] = useCreateOrderMutation();
    const [updateOrder] = useUpdateOrderMutation();
    useEffect(() => {
        if (order) {
            setIsEdit(true);
            setSymbol(order.symbol);
            setOrderAction(order.orderAction);
            setOrderMethod(order.orderMethod);
            setQuantity(order.quantity);
            setPrice(order.price);
            setLimitPrice(order.limitPrice);
            setStopPrice(order.stopPrice);
        }
    }, [order]);

    const handleSubmit = async () => {
        try {
            if (order) {
                await updateOrder({
                    id: order.id,
                    symbol,
                    orderAction,
                    orderMethod,
                    quantity,
                    price,
                    limitPrice,
                    stopPrice
                }).unwrap();
            } else {
                await createOrder({
                    symbol,
                    orderAction,
                    orderMethod,
                    quantity,
                    price,
                    limitPrice,
                    stopPrice
                }).unwrap();
            }
            console.log('Order Submitted');
        } catch (error) {
            // alert('Error in submitting order');
            console.error(error);
        }
        handleClose();
    };

    return (
        <div>

            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="order-modal-title"
                aria-describedby="order-modal-description"
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        border: '2px solid #000',
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    <Typography id="order-modal-title" variant="h6" component="h2">
                        Order Details
                    </Typography>
                    <TextField
                        select
                        label="Symbol"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        fullWidth
                        margin="normal"
                        disabled={isEdit}
                    >
                        <MenuItem value="AAPL">AAPL</MenuItem>
                        <MenuItem value="GOOGL">GOOGL</MenuItem>
                        <MenuItem value="MSFT">MSFT</MenuItem>
                    </TextField>
                    <TextField
                        select
                        label="Action"
                        value={orderAction}
                        onChange={(e) => setOrderAction(e.target.value)}
                        fullWidth
                        margin="normal"
                        disabled={isEdit}
                    >
                        <MenuItem value="BUY">BUY</MenuItem>
                        <MenuItem value="SELL">SELL</MenuItem>
                    </TextField>
                    <TextField
                        select
                        label="Method"
                        value={orderMethod}
                        onChange={(e) => setOrderMethod(e.target.value)}
                        fullWidth
                        margin="normal"
                        disabled={isEdit}
                    >
                        <MenuItem value="MARKET">MARKET</MenuItem>
                        <MenuItem value="LIMIT">LIMIT</MenuItem>
                        <MenuItem value="STOP">STOP</MenuItem>
                    </TextField>
                    <TextField
                        label="Price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        fullWidth
                        margin="normal"
                        inputProps={{ min: 1 }}
                    />
                    {orderMethod === "LIMIT" && (
                        <TextField
                            label="Limit Price"
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                    )}

                    {orderMethod === "STOP" && (
                        <TextField
                            label="Stop Price"
                            value={stopPrice}
                            onChange={(e) => setStopPrice(e.target.value)}
                        />
                    )}
                    <Button variant="contained" color="secondary" onClick={handleClose} sx={{ mt: 2 }}>
                        Close
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mt: 2, ml: 2 }}>
                        Submit
                    </Button>
                </Box>
            </Modal>
        </div>
    );
};

export default OrderModal;