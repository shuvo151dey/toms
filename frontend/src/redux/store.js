import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { apiSlice } from './ApiSlice';
import appReducer from './AppSlice';
import orderReducer from './OrderSlice';
import tradeReducer from './TradeSlice';
import authReducer from './AuthSlice';
import priceReducer from './PriceSlice';

const authPersistConfig = {
    key: 'auth',
    storage,
};

const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        app: appReducer,
        order: orderReducer,
        trade: tradeReducer,
        auth: persistReducer(authPersistConfig, authReducer),
        price: priceReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }).concat(apiSlice.middleware),
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);
export default store;
