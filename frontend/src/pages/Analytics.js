import { Container, Grid2 as Grid, MenuItem, Select, Typography } from "@mui/material";
import OrderAnalytics from "../components/OrderAnalytics";
import TradeAnalytics from "../components/TradeAnalytics";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedSymbol } from "../redux/AppSlice";    

const Analytics = () => {
    const dispatch = useDispatch();
    const handleSymbolChange = (event) => {
        dispatch(setSelectedSymbol(event.target.value));
    };
    const selectedSymbol = useSelector((state) => state.app.selectedSymbol);
    return (
        <Container>
            <Grid container>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                Analytics
            </Typography>
            <Select
                labelId="symbol-select-label"
                id="symbol-select"

                value={selectedSymbol}
                onChange={handleSymbolChange}
            >
                <MenuItem value="AAPL">AAPL</MenuItem>
                <MenuItem value="GOOGL">GOOGL</MenuItem>
                <MenuItem value="MSFT">MSFT</MenuItem>
            </Select>
            </Grid>
            <Grid container spacing={4}>
                <Grid item="true" xs={12} md={6}>
                    <OrderAnalytics />
                </Grid>
                <Grid item="true" xs={12} md={6}>
                    <TradeAnalytics />
                </Grid>
            </Grid>
        </Container>
    );
}

export default Analytics;