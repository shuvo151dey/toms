import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

const SOCKET_URL = "http://localhost:8080/ws";

let stompClient = null;
let subscriptions = [];

export const connect = (onMessage) => {
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
            stompClient.subscribe("/topic/orders", (message) => {
                onMessage(JSON.parse(message.body), "orders");
            }),
            stompClient.subscribe("/topic/trades", (message) => {
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
