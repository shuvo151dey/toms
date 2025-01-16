import { Card, CardContent, Typography } from "@mui/material"
import OrderCompletionChart from "./OrderCompletionChart"
import { useSelector } from "react-redux"


const OrderAnalytics = () => {
    const selectedSymbol = useSelector((state) => state.app.selectedSymbol)
    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    Order Analytics: {selectedSymbol}
                </Typography>
                <OrderCompletionChart symbol={selectedSymbol} />
            </CardContent>
        </Card>
    )
}

export default OrderAnalytics

