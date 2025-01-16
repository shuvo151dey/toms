import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardContent, Skeleton, Typography } from '@mui/material';
import { useFetchOrderAnalyticsQuery } from '../redux/ApiSlice';

const OrderCompletionChart = ({ symbol = 'AAPL' }) => {
    let { data, error, isLoading } = useFetchOrderAnalyticsQuery(symbol);
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
    if (data) {
        const { canceledOrders, completedOrders, totalOrders } = data;
        const pendingOrders = totalOrders - canceledOrders - completedOrders;
        data = [
            { name: 'Canceled', value: canceledOrders || 0 },
            { name: 'Completed', value: completedOrders || 0 },
            { name: 'Pending', value: pendingOrders || 0 }
        ];
    }
    return (
        <Card>
            <CardContent>
                {isLoading && <Skeleton variant="rectangular" width={400} height={400} />}
                <PieChart width={400} height={400}>
                    <Pie dataKey="value" data={data} cx="50%" cy="50%" outerRadius={150} label>
                        {data?.map((entry, index) => (
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