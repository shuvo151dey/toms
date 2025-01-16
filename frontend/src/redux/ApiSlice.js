import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { connect, disconnect } from "../services/WebSocketService";

export const apiSlice = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:8080/api/v1/" }),
    endpoints: (builder) => ({
        getOrders: builder.query({
            query: (params) => ({
                url: "orders",
                params,
            }),
            
        }),
        getTrades: builder.query({
            query: () => "trades/recent",
            
        }),
        fetchOrderAnalytics: builder.query({
            query: (symbol) => ({ url: `analytics/orders`, params: { symbol } }),
        }),
        fetchTradeAnalytics: builder.query({
            query: (symbol) => ({ url: "analytics/trades", params: { symbol } }),
        }),
        matchOrders: builder.mutation({
            query: (symbol) => ({ url: `matching/${symbol}`, method: "POST" }),
        }),
    }),
});

export const { useGetOrdersQuery, useGetTradesQuery, useFetchOrderAnalyticsQuery, useFetchTradeAnalyticsQuery, useMatchOrdersMutation } = apiSlice;
