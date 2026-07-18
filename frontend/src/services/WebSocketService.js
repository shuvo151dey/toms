import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import logger from "../utils/logger";

const SOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || "http://localhost:8080/ws";

let stompClient = null;
let baseSubscriptions = [];
let priceSubscriptions = {}; // ticker -> STOMP subscription
let retryCounts = 0;
let connecting = false;
let latest = null; // most recent connect() args — used when the connection completes

const subscribePrices = (onMessage, tenantId, symbols) => {
    symbols.forEach((ticker) => {
        if (priceSubscriptions[ticker]) return; // already subscribed
        priceSubscriptions[ticker] = stompClient.subscribe(`/topic/prices/${tenantId}/${ticker}`, (message) => {
            onMessage(JSON.parse(message.body), "prices", ticker);
        });
    });
};

export const connect = (onMessage, tenantId, symbols = [], token = null) => {
    latest = { onMessage, tenantId, symbols };

    // Already connected — just add subscriptions for any tickers we don't have yet.
    // (Symbols usually arrive after the initial connect, so this path matters.)
    if (stompClient && stompClient.connected) {
        subscribePrices(onMessage, tenantId, symbols);
        return;
    }

    if (connecting) return; // attempt in flight; it will use `latest` when it completes

    connecting = true;
    const socket = new SockJS(SOCKET_URL);
    stompClient = Stomp.over(socket);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const connectWithRetry = () => {
        stompClient.connect(headers, () => {
            logger.log("Connected to WebSocket");
            connecting = false;
            retryCounts = 0;

            baseSubscriptions = [
                stompClient.subscribe(`/user/queue/orders`, (message) => {
                    latest.onMessage(JSON.parse(message.body), "orders");
                }),
                stompClient.subscribe(`/user/queue/trades`, (message) => {
                    latest.onMessage(JSON.parse(message.body), "trades");
                }),
                stompClient.subscribe(`/user/queue/notifications`, (message) => {
                    latest.onMessage(JSON.parse(message.body), "notifications");
                }),
            ];

            subscribePrices(latest.onMessage, latest.tenantId, latest.symbols);
        }, (error) => {
            logger.log("Websocket error:", error);
            retryCounts++;
            const delay = Math.min(retryCounts * 5000, 30000);
            setTimeout(connectWithRetry, delay);
        });
    };

    connectWithRetry();
};

export const disconnect = () => {
    if (stompClient) {
        baseSubscriptions.forEach((sub) => sub.unsubscribe());
        Object.values(priceSubscriptions).forEach((sub) => sub.unsubscribe());
        baseSubscriptions = [];
        priceSubscriptions = {};
        connecting = false;
        stompClient.disconnect();
        logger.log("Disconnected from WebSocket");
    }
};
