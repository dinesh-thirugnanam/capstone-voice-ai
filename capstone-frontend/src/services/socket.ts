import ChatMessage from "../../../shared/types/ChatMessage";

let socket: WebSocket | null = null;

/**
 * Connect to the backend WebSocket for a specific session
 * @param sessionId The session ID
 * @param handleChunk Function to handle incoming ChatMessage chunks
 */
export function connectSocket(
    sessionId: string,
    handleChunk: (chunk: ChatMessage) => void,
) {
    if (!sessionId) throw new Error("Session ID is required");

    socket = new WebSocket(`ws://localhost:4000/${sessionId}`);

    socket.onopen = () => console.log(`WS connected for session ${sessionId}`);
    socket.onclose = () =>
        console.log(`WS disconnected for session ${sessionId}`);

    socket.onmessage = (msg) => {
        try {
            const chunk: ChatMessage = JSON.parse(msg.data);
            handleChunk(chunk);
        } catch (err) {
            console.error("Failed to parse WS message:", err);
        }
    };

    socket.onerror = (err) => console.error("WebSocket error:", err);
}

/**
 * Send a user message to the backend over WS
 * @param content Message content
 */
export function sendMessage(content: string) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn("Socket not open yet");
        return;
    }

    socket.send(JSON.stringify({ event: "user.message", content }));
}
