import React, { useState } from "react";
import OrderBook from "../components/OrderBook";
import TradeFeed from "../components/TradeFeed";
import { Container, Grid2 as Grid } from "@mui/material";
import OrderModal from "../components/OrderModal";

const App = () => {
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);



    return (
        <>
            <Container sx={{ marginTop: 4 }}>

                    <Grid item="true" xs={12} md={6}>
                        <OrderBook />
                    </Grid>
                    <Grid item="true" xs={12} md={6}>
                        <TradeFeed />
                    </Grid>

            </Container>
            <OrderModal open={open} handleOpen={handleOpen} handleClose={handleClose} />
        </>
    );
};

export default App;
