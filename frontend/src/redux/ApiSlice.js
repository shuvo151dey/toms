import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setOrders } from "./OrderSlice";
import { setTrades } from "./TradeSlice";
import { setAuth, logout } from "./AuthSlice";
import { jwtDecode } from 'jwt-decode';

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080/api/v1',
    prepareHeaders: (headers, { getState }) => {
        const token = getState().auth.accessToken;
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        console.log("Access token expired. Attempting refresh...");

        const refreshToken = api.getState().auth.refreshToken;
        const refreshResult = await baseQuery(
            {
                url: "/auth/refresh-token",
                method: "POST",
                body: { refreshToken },
            },
            api,
            extraOptions
        );

        if (refreshResult.data) {
            const authState = api.getState().auth;
            api.dispatch(setAuth({ ...authState, accessToken: refreshResult.data.accessToken, refreshToken }));

            result = await baseQuery(args, api, extraOptions);
        } else {
            api.dispatch(logout());
        }
    }
    return result;
};

export const apiSlice = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: "auth/login",
                method: "POST",
                body: credentials,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    const {roles, sub, tenantId} = jwtDecode(data.accessToken);
            
                    dispatch(setAuth({roles, user: sub, accessToken: data.accessToken, refreshToken: data.refreshToken, tenantId})); 
                    localStorage.setItem('refreshToken', data.refreshToken);
                } catch (error) {
                    console.error("Failed to login", error);
                }

            },
        }),
        signup: builder.mutation({
            query: (user) => ({
                url: "auth/register",
                method: "POST",
                body: user,
            }),
            transformResponse: (response) => {
                if (typeof response === 'string') {
                return { message: response };
                }
                return response;
            },
        }),
        logout: builder.mutation({
            query: (refreshToken) => ({
                url: "auth/logout",
                method: "POST",
                body: { refreshToken },
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(logout());
                } catch (error) {
                    console.error("Logout Error", error);
                }

            },
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
    useLogoutMutation
} = apiSlice;


