import { useSelector } from "react-redux";
import OrderBook from "../components/OrderBook";
import TradeFeed from "../components/TradeFeed";
import PriceTicker from "../components/PriceTicker";
import OrderBookDepth from "../components/OrderBookDepth";
import PnlReport from "../components/PnlReport";
import { Card, CardContent, Container, Grid2 as Grid, Typography } from "@mui/material";
import { useGetPnlQuery } from "../redux/ApiSlice";

function MetricCard({title, value, color = "text.primary"}) {
    return (
        <Card sx={{ height: "100%" }}>
            <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
                <Typography variant="h5" color={color} fontWeight="bold">{value}</Typography>
            </CardContent>
        </Card>
    );
}

const App = () => {
    const orders = useSelector((state) => state.order.orders);
    const trades = useSelector((state) => state.trade.trades);
    const { data: pnl } = useGetPnlQuery();

    const openOrders = orders.filter((order) => order.status === "PENDING" || order.status === "PARTIALLY_COMPLETED").length;
    const today = new Date().toDateString();
    const todayTrades = trades.filter((trade) => new Date(trade.createdAt).toDateString() === today).length;
    const totalPnl = pnl?.pnl ?? 0;
    
    return (
        <>
            <Container sx={{ marginTop: 4 }}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <MetricCard title="Open Orders" value={openOrders} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <MetricCard title="Today's Trades" value={todayTrades} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <MetricCard
                            title="Realised P&L"
                            value={`$${totalPnl.toFixed(2)}`}
                            color={totalPnl >= 0 ? "success.main" : "error.main"}
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <PriceTicker />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <OrderBookDepth />
                    </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <OrderBook />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TradeFeed />
                    </Grid>
                </Grid>

                <PnlReport />
            </Container>
</>
    );
};

export default App;
