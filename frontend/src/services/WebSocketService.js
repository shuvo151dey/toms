import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

const SOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || "http://localhost:8080/ws";

let stompClient = null;
let subscriptions = [];
let retryCounts = 0;

export const connect = (onMessage, tenantId) => {
    if (stompClient && stompClient.connected) {
        console.log("WebSocket is already connected.");
        return;
    }

    const socket = new SockJS(SOCKET_URL);
    stompClient = Stomp.over(socket);
    
    const connectWithRetry = () => {
        stompClient.connect({}, () => {
            console.log("Connected to WebSocket");
    
            
            subscriptions = [
                stompClient.subscribe(`/topic/orders/${tenantId}`, (message) => {
                    onMessage(JSON.parse(message.body), "orders");
                }),
                stompClient.subscribe(`/topic/trades/${tenantId}`, (message) => {
                    onMessage(JSON.parse(message.body), "trades");
                }),
            ];
            retryCounts = 0;
        }, (error) => {
            console.log("Websocket error:", error);
            retryCounts++;
            const delay = Math.min(retryCounts*5000, 30000);
            setTimeout(connectWithRetry,delay);
        });
    }
    connectWithRetry();
};

export const disconnect = () => {
    if (stompClient) {
        subscriptions.forEach((sub) => sub.unsubscribe());
        stompClient.disconnect();
        console.log("Disconnected from WebSocket");
    }
};
