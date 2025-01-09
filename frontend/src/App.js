import React, { useState, useEffect } from "react";
import { connect, disconnect } from "./services/WebSocketService";
import OrderBook from "./components/OrderBook";
import TradeFeed from "./components/TradeFeed";
import { Container, Grid2 as Grid, Typography, AppBar, Toolbar } from "@mui/material";

const App = () => {
    const [orders, setOrders] = useState([]);
    const [trades, setTrades] = useState([]);

    useEffect(() => {
        connect((message, topic) => {
            if (topic === "orders") {
                setOrders((prev) => [...prev, message]);
            } else if (topic === "trades") {
                setTrades((prev) => [...prev, message]);
            }
        });

        return () => disconnect();
    }, []);

    return (
        <div>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        TOMS Dashboard
                    </Typography>
                </Toolbar>
            </AppBar>
            <Container sx={{ marginTop: 4 }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <OrderBook orders={orders} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TradeFeed trades={trades} />
                    </Grid>
                </Grid>
            </Container>
        </div>
    );
};

export default App;
