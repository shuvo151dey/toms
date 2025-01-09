import React, { useEffect } from "react";
import {
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
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
                            <TableCell>Type</TableCell>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Quantity</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.length > 0 && orders.map((order, index) => (
                            <TableRow key={index}>
                                <TableCell>{order.type}</TableCell>
                                <TableCell>{order.symbol}</TableCell>
                                <TableCell>{order.price}</TableCell>
                                <TableCell>{order.quantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default OrderBook;
