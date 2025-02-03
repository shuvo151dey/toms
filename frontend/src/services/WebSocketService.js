import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

const SOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || "http://localhost:8080/ws";

let stompClient = null;
let subscriptions = [];

export const connect = (onMessage, tenantId) => {
    if (stompClient && stompClient.connected) {
        console.log("WebSocket is already connected.");
        return;
    }

    const socket = new SockJS(SOCKET_URL);
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        console.log("Connected to WebSocket");

        // Subscribe to multiple topics
        subscriptions = [
            stompClient.subscribe(`/topic/orders/${tenantId}`, (message) => {
                onMessage(JSON.parse(message.body), "orders");
            }),
            stompClient.subscribe(`/topic/trades/${tenantId}`, (message) => {
                onMessage(JSON.parse(message.body), "trades");
            }),
        ];
    });
};

export const disconnect = () => {
    if (stompClient) {
        subscriptions.forEach((sub) => sub.unsubscribe());
        stompClient.disconnect();
        console.log("Disconnected from WebSocket");
    }
};
