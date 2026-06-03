import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from './ApiSlice';
import appReducer from './AppSlice';
import orderReducer from './OrderSlice';
import tradeReducer from './TradeSlice';
import authReducer from './AuthSlice';
import priceReducer from './PriceSlice';


const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        app: appReducer,
        order: orderReducer,
        trade: tradeReducer,
        auth: authReducer,
        price: priceReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware),

});

setupListeners(store.dispatch);

export default store;
