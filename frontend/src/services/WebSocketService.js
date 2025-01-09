import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

const SOCKET_URL = "http://localhost:8080/ws";

let stompClient = null;

export const connect = (onMessage) => {
    const socket = new SockJS(SOCKET_URL);
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        console.log("Connected to WebSocket");

        // Subscribe to topics
        stompClient.subscribe("/topic/orders", (message) => {
            onMessage(JSON.parse(message.body), "orders");
        });

        stompClient.subscribe("/topic/trades", (message) => {
            onMessage(JSON.parse(message.body), "trades");
        });
    });
};

export const disconnect = () => {
    if (stompClient) {
        stompClient.disconnect();
        console.log("Disconnected from WebSocket");
    }
};
