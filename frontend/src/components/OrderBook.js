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
} from "@mui/material";
import OrderModal from "./OrderModal";
import instance from '../services/AxiosInstanceService';

const OrderBook = ({ orders = [] }) => {
    const [open, setOpen] = React.useState(false);
    const [selectedOrder, setSelectedOrder] = React.useState({});

    const handleOpen = (order) => {
        setSelectedOrder(order)
        setOpen(true);
    }    
    const handleClose = () =>{ 
        setSelectedOrder({})
        setOpen(false);

    }
    const handleCancel = async (order) => {
        try {
            await instance.delete(`/orders/${order.id}`);
            alert('Order Cancelled');
        } catch (error) {
            alert('Error in cancelling order');
        }
    }
    return (<>
    <OrderModal open={open} handleOpen={handleOpen} handleClose={handleClose} order={selectedOrder}/>
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    Order Book
                </Typography>
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
                        {orders.length > 0 && orders.map((order, index) => (
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
                                    <Button size="small" variant="contained" color="error" onClick={() => handleCancel(order)}>Cancel</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </>
    );
};

export default OrderBook;
