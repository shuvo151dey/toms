import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import logger from "../utils/logger";

const SOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || "http://localhost:8080/ws";

let stompClient = null;
let subscriptions = [];
let retryCounts = 0;

export const connect = (onMessage, tenantId, symbols = [], token = null) => {
    if (stompClient && stompClient.connected) {
        logger.log("WebSocket is already connected.");
        return;
    }

    const socket = new SockJS(SOCKET_URL);
    stompClient = Stomp.over(socket);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const connectWithRetry = () => {
        stompClient.connect(headers, () => {
            logger.log("Connected to WebSocket");

            subscriptions = [
                stompClient.subscribe(`/user/queue/orders`, (message) => {
                    onMessage(JSON.parse(message.body), "orders");
                }),
                stompClient.subscribe(`/user/queue/trades`, (message) => {
                    onMessage(JSON.parse(message.body), "trades");
                }),
                stompClient.subscribe(`/user/queue/notifications`, (message) => {
                    onMessage(JSON.parse(message.body), "notifications");
                }),
            ];

            symbols.forEach(ticker => {
                subscriptions.push(
                    stompClient.subscribe(`/topic/prices/${tenantId}/${ticker}`, (message) => {
                        onMessage(JSON.parse(message.body), "prices", ticker);
                    })
                );
            });

            retryCounts = 0;
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
        subscriptions.forEach((sub) => sub.unsubscribe());
        stompClient.disconnect();
        logger.log("Disconnected from WebSocket");
    }
};
