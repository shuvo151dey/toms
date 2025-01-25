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
    Skeleton,
} from "@mui/material";
import OrderModal from "./OrderModal";
import { useSelector, useDispatch } from "react-redux";
import { setOrder } from "../redux/OrderSlice";
import { useCancelOrderMutation } from "../redux/ApiSlice";

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
        try {
            await cancelOrder(order.id).unwrap();
            console.log('Order Cancelled');
        } catch (error) {
            console.log('Error in cancelling order');
        }
    }
    return (<>
    <OrderModal open={open} handleOpen={handleOpen} handleClose={handleClose}/>
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
