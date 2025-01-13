import React, { useState, useEffect } from "react";
import { connect, disconnect } from "./services/WebSocketService";
import OrderBook from "./components/OrderBook";
import TradeFeed from "./components/TradeFeed";
import ErrorWindow from "./components/ErrorWindow";
import { Container, Grid2 as Grid, Typography, AppBar, Toolbar, Button } from "@mui/material";
import instance from './services/AxiosInstanceService'
import OrderModal from "./components/OrderModal";
import OrderCompletionChart from "./components/OrderCompletionChart";
const App = () => {
    const [orders, setOrders] = useState([]);
    const [tradeList, setTradeList] = useState([]);
    const [error, setError] = useState("");
    const [open, setOpen] = useState(false);
    const [orderAnlayticsData, setOrderAnlayticsData] = useState([]);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const fetchOrders = async (page = 0, size = 10, sortBy = "symbol", direction = "asc") => {
        try {
            const orderResponse = await instance.get("/orders", null, {
                page,
                size,
                sortBy,
                direction,
                // status: "AAPL"
            })
            setOrders(orderResponse.data.content)
        } catch (error) {
            setError("Error in fetching orders")
        }
    }
    const fetchTrades = async () => {
        try {
            const tradeResponse = await instance.get("/trades/recent")
            console.log(tradeResponse)
            setTradeList(tradeResponse.data)
        } catch (error) {
            setError("Error in fetching trades")
        }
    }
    const fetchOrderAnalytics = async () => {
        try {
            const orderAnalyticsResponse = await instance.get("/analytics/orders", {
                params: { symbol: "AAPL" }
            })
            const orderAnalytics = orderAnalyticsResponse.data
            const { canceledOrders, completedOrders, totalOrders } = orderAnalytics
            const pendingOrders = totalOrders - canceledOrders - completedOrders
            setOrderAnlayticsData([
                { name: "Completed", value: completedOrders },
                { name: "Cancelled", value: canceledOrders },
                { name: "Pending", value: pendingOrders }
            ])
        } catch (error) {
            setError("Error in fetching order analytics")
        }
    }
    const fetchTradeAnalytics = async () => {
        try {
            const tradeAnalyticsResponse = await instance.get("/analytics/trades")
            const tradeAnalytics = tradeAnalyticsResponse.data

            console.log(tradeAnalyticsResponse)
        } catch (error) {
            setError("Error in fetching trade analytics")
        }
    }
    const matchOrders = async () => {
        try {
            await instance.post("/matching/AAPL")
        } catch (error) {
            setError("Error in matching orders")
        }
    }

    useEffect(() => {
        fetchOrders();
        fetchTrades();
        fetchOrderAnalytics();
        fetchTradeAnalytics();
        connect((message, topic) => {
            console.log(message)
            if (topic === "orders") {
                setOrders((prevOrders) => {
                    const existingOrderIndex = prevOrders.findIndex((order) => order.id === message.id);

                    if (existingOrderIndex !== -1) {
                        // Update existing order
                        const updatedOrders = [...prevOrders];
                        updatedOrders[existingOrderIndex] = { ...prevOrders[existingOrderIndex], ...message };
                        return updatedOrders;
                    } else {
                        // Add new order
                        return [...prevOrders, message];
                    }
                });
            } else if (topic === "trades") {
                setTradeList((prevTrades) => [...prevTrades, message])
            }
        });

        return () => disconnect();
    }, []);

    const onCloseHandler = () => setError("")
    return (
        <div>
            <ErrorWindow error={error} onClose={onCloseHandler} />

            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        TOMS Dashboard
                    </Typography>
                    <Button variant="contained" color="secondary" onClick={handleOpen}>
                        Place Order
                    </Button>
                    <Button variant="contained" color="success" sx={{ marginLeft: '4px' }} onClick={matchOrders}>
                        Match Orders
                    </Button>
                </Toolbar>
            </AppBar>
            <Container sx={{ marginTop: 4 }}>
                <Grid container spacing={4}>
                    <Grid item="true" xs={12} md={6}>
                        <OrderBook orders={orders} />
                    </Grid>
                    <Grid item="true" xs={12} md={6}>
                        <TradeFeed trades={tradeList} />
                    </Grid>
                    <Grid item="true" xs={12} md={6}>
                        <OrderCompletionChart data={orderAnlayticsData} />
                    </Grid>
                </Grid>
            </Container>
            <OrderModal open={open} handleOpen={handleOpen} handleClose={handleClose} />
        </div>
    );
};

export default App;
