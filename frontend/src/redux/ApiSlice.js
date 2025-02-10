import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setOrders } from "./OrderSlice";
import { setTrades } from "./TradeSlice";
import { setAuth, logout } from "./AuthSlice";
import { jwtDecode } from 'jwt-decode';
import { setAlert } from "./AppSlice";


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
                    const {roles, sub, tenantId, exp} = jwtDecode(data.accessToken);
            
                    dispatch(setAuth({roles, user: sub, accessToken: data.accessToken, refreshToken: data.refreshToken, tenantId, expiryTime: exp*1000})); 
                    localStorage.setItem('refreshToken', data.refreshToken);
                    dispatch(setAlert({alert: "Login Successful!!", type: "success"}));
                } catch (error) {
                    console.error("Failed to login", error);
                    dispatch(setAlert({alert: "Failed to login", type: "error"}));
                }

            },
        }),
        signup: builder.mutation({
            query: (user) => ({
                url: "auth/register",
                method: "POST",
                body: user,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(setAlert({alert: "User Registered!!", type: "success"}));
                } catch (error) {
                    console.error("Failed to register", error);
                    dispatch(setAlert({alert: "Failed to register", type: "error"}));
                }

            },
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
                    dispatch(setAlert({alert: "Logging out"}))
                    dispatch(logout());
                } catch (error) {
                    console.error("Logout Error", error);
                    dispatch(setAlert({alert: "Failed to logout", type: "error"}));
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
                    dispatch(setAlert({alert: "Orders fetched", type: "success"}));
                } catch (error) {
                    console.error("Failed to fetch orders", error);
                    dispatch(setAlert({alert:"Failed to fetch orders", type: "error"}))
                }

            },

        }),
        createOrder: builder.mutation({
            query: (order) => ({
                url: "orders",
                method: "POST",
                body: order,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(setAlert({alert: "Order placed!!", type: "success"}));
                } catch (error) {
                    console.error("Failed to place order", error);
                    dispatch(setAlert({alert: "Failed to place order", type: "error"}));
                }

            },
        }),
        getTrades: builder.query({
            query: () => "trades/recent",
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setTrades(data));
                    dispatch(setAlert({alert: "Trades loaded", type: "success"}))
                } catch (error) {
                    console.error("Failed to fetch trades", error);
                    dispatch(setAlert({alert: "Failed to fetch trades", type: "error"}))
                }
            },

        }),
        cancelOrder: builder.mutation({
            query: (id) => ({ url: `orders/${id}`, method: "DELETE" }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(setAlert({alert: "Order cancelled", type: "info"}))
                } catch (error) {
                    console.error("Failed to cancel order", error);
                    dispatch(setAlert({alert: "Failed to cancel order", type: "error"}))
                }
            },
        }),
        updateOrder: builder.mutation({
            query: ({ id, ...patch }) => ({ url: `orders/${id}`, method: "PUT", body: patch }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(setAlert({alert: "Order updated", type: "success"}))
                } catch (error) {
                    console.error("Failed to update order", error);
                    dispatch(setAlert({alert: "Failed to update order", type: "error"}))
                }
            },
        }),
        fetchOrderAnalytics: builder.query({
            query: (symbol) => ({ url: `analytics/orders`, params: { symbol } }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(setAlert({alert: "Order Analytics loaded", type: "success"}))
                } catch (error) {
                    console.error("Failed to load analytics", error);
                    dispatch(setAlert({alert: "Failed to load analytics", type: "error"}))
                }
            },
        }),
        fetchTradeAnalytics: builder.query({
            query: (params) => ({ url: "analytics/trades", params }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(setAlert({alert: "Trade Analytics loaded", type: "success"}))
                } catch (error) {
                    console.error("Failed to load analytics", error);
                    dispatch(setAlert({alert: "Failed to load analytics", type: "error"}))
                }
            },
        }),
        matchOrders: builder.mutation({
            query: (symbol) => ({ url: `matching/${symbol}`, method: "POST" }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(setAlert({alert: "Order matching done", type: "success"}))
                } catch (error) {
                    console.error("Failed to match orders", error);
                    dispatch(setAlert({alert: "Failed to match orders", type: "error"}))
                }
            },
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


