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

    socket = new WebSocket(`ws://localhost:4000/ws/chat/${sessionId}`);

    socket.onopen = () => console.log(`WS connected for session ${sessionId}`);
    socket.onclose = () =>
        console.log(`WS disconnected for session ${sessionId}`);

    socket.onmessage = (msg) => {
        try {
            const event = JSON.parse(msg.data);
            // console.log(`[Frontend Socket] Received event:`, event.event);
            // console.log(`[Frontend Socket] Full data:`, event);

            // STREAM START
            if (event.event === "message.start") {
                handleChunk({
                    id: event.id,
                    role: "assistant",
                    type: "text",
                    status: "loading",
                    content: "",
                });
                return;
            }

            // STREAM CHUNK
            if (event.event === "message.chunk") {
                handleChunk({
                    id: event.id,
                    role: "assistant",
                    type: "text",
                    status: "streaming",
                    content: event.content ?? "",
                });
                return;
            }

            // STREAM END
            if (event.event === "message.end") {
                handleChunk({
                    id: event.id,
                    role: "assistant",
                    type: "text",
                    status: "done",
                    content: "",
                });
                return;
            }

            // QUESTION (Preserve as a UI component, not converted to text)
            if (event.event === "message.question") {
                console.log(
                    `[Socket-QUESTION] 📥 Received question: content="${event.content}", text="${event.text}"`,
                );
                const finalContent = event.content || event.text || "";
                console.log(
                    `[Socket-QUESTION] ✅ Using content: "${finalContent}"`,
                );
                handleChunk({
                    id: event.id,
                    role: "assistant",
                    type: "question",
                    status: "done",
                    content: finalContent,
                });
                return;
            }

            // APPOINTMENTS
            if (event.event === "message.appointments") {
                // console.log(`[Frontend Socket] 🔴 Received APPOINTMENTS:`, event);
                handleChunk({
                    id: event.id,
                    role: event.role,
                    type: "appointments",
                    slots: event.slots,
                });
                return;
            }

            // TABLE
            if (event.event === "message.table") {
                // console.log(`[Frontend Socket] 🔴 Received TABLE:`, event);
                handleChunk({
                    id: event.id,
                    role: event.role,
                    type: "table",
                    columns: event.columns,
                    rows: event.rows,
                });
                return;
            }

            // FALLBACK (in case backend sends full ChatMessage already)
            handleChunk(event);
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
