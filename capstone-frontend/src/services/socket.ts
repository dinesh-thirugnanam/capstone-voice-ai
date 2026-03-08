// src/services/socket.ts

import ChatMessage from "@/types/ChatMessage";

let socket: WebSocket | null = null;

/**
 * Connect to the backend WebSocket.
 * @param handleChunk - Your component's handleMessageChunk function
 */
export function connectSocket(handleChunk: (chunk: ChatMessage) => void) {
    socket = new WebSocket("ws://localhost:4000/chat");

    socket.onopen = () => console.log("WebSocket connected");

    socket.onclose = () => console.log("WebSocket disconnected");

    socket.onmessage = (msg) => {
        try {
            const chunk: ChatMessage = JSON.parse(msg.data);
            handleChunk(chunk); // directly call your existing handler
        } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
        }
    };

    socket.onerror = (err) => console.error("WebSocket error:", err);
}

/**
 * Send a user message to the backend
 */
export function sendMessage(content: string) {
    if (!socket) return;
    socket.send(JSON.stringify({ event: "user.message", content }));
}
