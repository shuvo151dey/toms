import {
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Box,
    IconButton,
    Skeleton,
} from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useState } from "react";
import { useGetTradesPaginatedQuery } from "../redux/ApiSlice";

const PAGE_SIZE = 10;

const TradeFeed = () => {
    const [page, setPage] = useState(0);
    const { data, isLoading } = useGetTradesPaginatedQuery({ page, size: PAGE_SIZE });

    const trades = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom>Trade Feed</Typography>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Id</TableCell>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Buy Order</TableCell>
                            <TableCell>Sell Order</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading
                            ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 6 }).map((__, j) => (
                                        <TableCell key={j}><Skeleton /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                            : trades.map((trade) => (
                                <TableRow key={trade.id}>
                                    <TableCell>{trade.id}</TableCell>
                                    <TableCell>{trade.symbol}</TableCell>
                                    <TableCell>{trade.price}</TableCell>
                                    <TableCell>{trade.quantity}</TableCell>
                                    <TableCell>{trade.buyOrder?.id}</TableCell>
                                    <TableCell>{trade.sellOrder?.id}</TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
                {totalPages > 1 && (
                    <Box display="flex" alignItems="center" justifyContent="flex-end" mt={1}>
                        <IconButton onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
                            <ChevronLeftIcon />
                        </IconButton>
                        <Typography variant="body2">
                            {page + 1} / {totalPages}
                        </Typography>
                        <IconButton onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default TradeFeed;
