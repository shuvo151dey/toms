import React from "react";
import {
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
} from "@mui/material";
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import OrderModal from "./OrderModal";
import EmptyState from "./EmptyState";
import { useSelector, useDispatch } from "react-redux";
import { setOrder } from "../redux/OrderSlice";
import { useCancelOrderMutation } from "../redux/ApiSlice";
import logger from "../utils/logger";
const OrderBook = () => {
    const [open, setOpen] = React.useState(false);
    const dispatch = useDispatch();
    const orders = useSelector((state) => state.order.orders);
    const [cancelOrder] = useCancelOrderMutation();

    const handleOpen = (order) => {
        dispatch(setOrder(order));
        setOpen(true);
    }
    const handleClose = () =>{
        dispatch(setOrder({}));
        setOpen(false);

    }
    const handleCancel = async (order) => {
        if (!window.confirm(`Cancel order#${order.id} (${order.orderAction} ${order.quantity} ${order.symbol})`)) return;
        try {
            await cancelOrder(order.id).unwrap();
        } catch (error) {
            logger.error('Error in cancelling order', error);
        }
    }

    const isCancellable = (status) => status === 'PENDING' || status === 'PARTIALLY_COMPLETED';

    return (<>
    <OrderModal open={open} handleOpen={handleOpen} handleClose={handleClose}/>
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <MenuBookOutlinedIcon fontSize="small" color="primary" />
                    <Typography variant="h6">Order Book</Typography>
                </Box>
                {orders.length === 0 ? (
                    <EmptyState
                        icon={<MenuBookOutlinedIcon />}
                        title="No orders to display"
                        subtitle="Your active orders will appear here"
                    />
                ) : (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Id</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Limit Price</TableCell>
                            <TableCell>Stop Price</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Lifecycle Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map((order, index) => (
                            <TableRow key={index}>
                                <TableCell>{order.id}</TableCell>
                                <TableCell>{order.orderAction}</TableCell>
                                <TableCell>{order.orderMethod}</TableCell>
                                <TableCell>{order.symbol}</TableCell>
                                <TableCell>{order.price}</TableCell>
                                <TableCell>{order.quantity}</TableCell>
                                <TableCell>{order.limitPrice}</TableCell>
                                <TableCell>{order.stopPrice}</TableCell>
                                <TableCell>{order.status}</TableCell>
                                <TableCell>
                                    <Button size="small" variant="contained" color="primary" sx={{ marginRight: '4px' }} onClick={() => handleOpen(order)}>Edit</Button>
                                    <Button size="small" variant="contained" color="error" disabled={!isCancellable(order.status)} onClick={() => handleCancel(order)}>Cancel</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                )}
            </CardContent>
        </Card>
    </>
    );
};

export default OrderBook;
