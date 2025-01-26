import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setOrders } from "./OrderSlice";
import { setTrades } from "./TradeSlice";

export const apiSlice = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.REACT_APP_BACKEND_URL || "http://localhost:8080/api/v1/",
        prepareHeaders: (headers, { getState }) => {
        const token = getState().auth.token;
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        headers.set("Content-Type", "application/json");
            
        return headers;
    },
     }),
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: "auth/login",
                method: "POST",
                body: credentials,
            }),
        }),
        signup: builder.mutation({
            query: (user) => ({
                url: "auth/register",
                method: "POST",
                body: user,
            }),
        }),
        getOrders: builder.query({
            query: (params) => {
                return {
                    url: "orders",
                    params,
                }
            },
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setOrders(data.content));
                } catch (error) {
                    console.error("Failed to fetch orders", error);
                }

            },

        }),
        createOrder: builder.mutation({
            query: (order) => ({
                url: "orders",
                method: "POST",
                body: order,
            })
        }),
        getTrades: builder.query({
            query: () => "trades/recent",
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setTrades(data));
                } catch (error) {
                    console.error("Failed to fetch trades", error);
                }
            },

        }),
        cancelOrder: builder.mutation({
            query: (id) => ({ url: `orders/${id}`, method: "DELETE" }),

        }),
        updateOrder: builder.mutation({
            query: ({ id, ...patch }) => ({ url: `orders/${id}`, method: "PUT", body: patch }),
        }),
        fetchOrderAnalytics: builder.query({
            query: (symbol) => ({ url: `analytics/orders`, params: { symbol } }),
        }),
        fetchTradeAnalytics: builder.query({
            query: (params) => ({ url: "analytics/trades", params }),
        }),
        matchOrders: builder.mutation({
            query: (symbol) => ({ url: `matching/${symbol}`, method: "POST" }),
        }),
    }),
});

export const {
    useGetOrdersQuery,
    useGetTradesQuery,
    useFetchOrderAnalyticsQuery,
    useFetchTradeAnalyticsQuery,
    useMatchOrdersMutation,
    useCancelOrderMutation,
    useCreateOrderMutation,
    useUpdateOrderMutation,
    useLazyGetOrdersQuery,
    useLazyGetTradesQuery,
    useLoginMutation,
    useSignupMutation,
} = apiSlice;


