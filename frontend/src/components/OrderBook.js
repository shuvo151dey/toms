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

const OrderBook = ({ orders = [] }) => {

    return (
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
                                <TableCell><Button variant="outlined" color="primary">Edit</Button><Button variant="outlined" color="error">Cancel</Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default OrderBook;
