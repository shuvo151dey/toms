import { Card, CardContent, Typography } from "@mui/material";
import { useSelector } from "react-redux";

const TradeAnalytics = () => {
    const selectedSymbol = useSelector((state) => state.app.selectedSymbol)
    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    Trade Analytics: {selectedSymbol}
                </Typography>
                {/* <TradeCompletionChart /> */}
            </CardContent>
        </Card>

    );
}

export default TradeAnalytics;