import { Card, CardContent, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import {useFetchTradeAnalyticsQuery} from "../redux/ApiSlice";

const TradeAnalytics = () => {
    const selectedSymbol = useSelector((state) => state.app.selectedSymbol)
    const { data, error, isLoading } = useFetchTradeAnalyticsQuery({
        symbol: selectedSymbol,
        from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
        to: new Date().toISOString(),
    });
    console.log(data, error, isLoading)
    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    Trade Analytics for last 7 days
                </Typography>
                <Typography variant="body1">
                    Total Volume: {data?.totalVolume}
                </Typography>
                <Typography variant="body1">
                    Total Trades: {data?.totalTrades}
                </Typography>
                <Typography variant="body1">
                    VWAP: {data?.vwap}
                </Typography>
            </CardContent>
        </Card>

    );
}

export default TradeAnalytics;