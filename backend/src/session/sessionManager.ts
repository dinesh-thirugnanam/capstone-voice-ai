import { WebSocket } from "ws";
import { processMessage } from "../orchestrator/conversationOrchestrator";
import { v4 as uuid } from "uuid";
import ChatMessage from "../../../shared/types/ChatMessage";

export async function handleUserMessage(
    socket: WebSocket,
    sessionId: string,
    message: string,
) {
    const messageId = uuid();

    const response = (await processMessage(sessionId, message)) as ChatMessage;

    if (response.type === "table") {
        socket.send(
            JSON.stringify({
                id: messageId,
                role: "assistant",
                type: "table",
                columns: response.columns,
                rows: response.rows,
            }),
        );

        return;
    }
    if (response.type === "appointments") {
        socket.send(
            JSON.stringify({
                id: messageId,
                role: "assistant",
                type: "appointments",
                slots: response.slots,
            }),
        );

        return;
    }

    streamText(socket, messageId, response.content);
}

async function streamText(socket: WebSocket, id: string, text: string) {
    const chunkSize = 12;

    socket.send(
        JSON.stringify({
            id,
            role: "assistant",
            type: "text",
            status: "loading",
            content: "",
        }),
    );

    for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);

        socket.send(
            JSON.stringify({
                id,
                role: "assistant",
                type: "text",
                status: "streaming",
                content: chunk,
            }),
        );

        await new Promise((r) => setTimeout(r, 50));
    }

    socket.send(
        JSON.stringify({
            id,
            role: "assistant",
            type: "text",
            status: "done",
        }),
    );
}
