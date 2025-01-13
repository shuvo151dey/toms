import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardContent, Typography } from '@mui/material';

const OrderCompletionChart = ({ data = [], symbol = 'AAPL' }) => {
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom>Order Completion: {symbol}</Typography>
                <PieChart width={400} height={400}>
                    <Pie dataKey="value" data={data} cx="50%" cy="50%" outerRadius={150} label>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </CardContent>
        </Card>
    );

}

export default OrderCompletionChart;