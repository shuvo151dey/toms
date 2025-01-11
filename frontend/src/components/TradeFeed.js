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
} from "@mui/material";

const TradeFeed = ({ trades = [] }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    Trade Feed
                </Typography>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Id</TableCell>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Buy Order Id</TableCell>
                            <TableCell>Sell Order Id</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {trades.map((trade, index) => (
                            <TableRow key={index}>
                                <TableCell>{trade.id}</TableCell>
                                <TableCell>{trade.symbol}</TableCell>
                                <TableCell>{trade.price}</TableCell>
                                <TableCell>{trade.quantity}</TableCell>
                                <TableCell>{trade.buyOrder.id}</TableCell>
                                <TableCell>{trade.sellOrder.id}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default TradeFeed;
