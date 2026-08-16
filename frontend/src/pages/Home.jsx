import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import OrderBook from "../components/OrderBook";
import TradeFeed from "../components/TradeFeed";
import PriceTicker from "../components/PriceTicker";
import OrderBookDepth from "../components/OrderBookDepth";
import PnlReport from "../components/PnlReport";
import MetricCard from "../components/MetricCard";
import { Box, Grid2 as Grid } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useGetPnlQuery } from "../redux/ApiSlice";

const Home = () => {
    const location = useLocation();
    const orders = useSelector((state) => state.order.orders);
    const trades = useSelector((state) => state.trade.trades);
    const { data: pnl } = useGetPnlQuery();

    useEffect(() => {
        if (!location.hash) return;
        const el = document.querySelector(location.hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [location.hash]);

    const openOrders = orders.filter((order) => order.status === "PENDING" || order.status === "PARTIALLY_COMPLETED").length;
    const today = new Date().toDateString();
    const todayTrades = trades.filter((trade) => new Date(trade.createdAt).toDateString() === today).length;
    const totalPnl = pnl?.pnl ?? 0;

    return (
        <Box sx={{ p: 4 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <MetricCard
                        title="Open Orders"
                        value={openOrders}
                        subtitle={openOrders === 0 ? "No pending orders" : `${openOrders} pending`}
                        icon={<DescriptionOutlinedIcon fontSize="small" />}
                        color="primary.main"
                        sparkSeed={0}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <MetricCard
                        title="Today's Trades"
                        value={todayTrades}
                        subtitle={todayTrades === 0 ? "No trades executed" : `${todayTrades} executed today`}
                        icon={<ShowChartIcon fontSize="small" />}
                        color="secondary.main"
                        sparkSeed={1}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <MetricCard
                        title="Realised P&L"
                        value={`$${totalPnl.toFixed(2)}`}
                        subtitle={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)} all time`}
                        icon={<AccountBalanceWalletIcon fontSize="small" />}
                        color="success.main"
                        sparkSeed={2}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <PriceTicker />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box id="market-depth">
                        <OrderBookDepth />
                    </Box>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box id="order-book">
                        <OrderBook />
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box id="trade-feed">
                        <TradeFeed />
                    </Box>
                </Grid>
            </Grid>

            <Box id="pnl-report">
                <PnlReport />
            </Box>
        </Box>
    );
};

export default Home;
