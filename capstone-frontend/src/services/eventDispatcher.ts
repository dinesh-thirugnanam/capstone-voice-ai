import ChatMessage from "../../../shared/types/ChatMessage";
import { ServerEvent } from "@/types/ServerEvents";
import TableMessage from "../../../shared/types/TableMessage";

export function handleServerEvent(
    event: ServerEvent,
    handleChunk: (chunk: ChatMessage) => void,
) {
    switch (event.event) {
        case "message.chunk":
            handleChunk({
                id: event.id,
                type: "text",
                status: "streaming",
                content: event.content,
            });
            break;

        case "table.data":
            // Convert TableData into TableMessage
            const tableMsg: TableMessage = {
                id: event.id,
                role: "assistant",
                type: "table",
                columns: event.rows[0] || [],
                rows: event.rows.slice(1).map((row: string) => [row]),
            };
            handleChunk(tableMsg);
            break;
    }
}
