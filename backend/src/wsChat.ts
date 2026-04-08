import WebSocket, { WebSocketServer } from "ws";
import { pool } from "./db.ts";
import { v4 as uuidv4 } from "uuid";
import ChatMessage from "../../shared/types/ChatMessage.ts";
import {
    handleGeneral,
    handleConsent,
    handleWarmup,
    handleExploratory,
    handleReadiness,
    handleScreening,
    handleEscalation,
    handlePostScreening,
    handleBooking,
} from "./wsHandlers.ts";

import { SessionState } from "./orchestrator/stateMachine.ts";

const wss = new WebSocketServer({ noServer: true });

// Map sessionId → WebSocket
const sessions = new Map<string, WebSocket>();

/**
 * Attach the WS server to an existing HTTP server
 */
export function attachWSS(server: any) {
    server.on("upgrade", (request: any, socket: any, head: any) => {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const match = url.pathname.match(/^\/ws\/chat\/(.+)$/);

        if (!match) {
            socket.destroy();
            return;
        }

        const sessionId = match[1];

        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, sessionId);
        });
    });
}

/**
 * Send a chunk to the frontend
 */
function sendChunk(ws: WebSocket, chunk: ChatMessage) {
    ws.send(JSON.stringify(chunk));
}

/**
 * Main connection handler
 */
wss.on("connection", async (ws, sessionId: string) => {
    sessions.set(sessionId, ws);
    console.log(`WS connected for session ${sessionId}`);

    // Fetch session from DB
    const result = await pool.query(
        "SELECT * FROM conversation_session WHERE id = $1",
        [sessionId],
    );
    if (result.rowCount === 0) {
        ws.send(
            JSON.stringify({ type: "error", message: "Session not found" }),
        );
        ws.close();
        return;
    }
    const session = result.rows[0];

    ws.on("message", async (data) => {
        try {
            const msg = JSON.parse(data.toString());

            // Expecting: { event: "user.message", content: "..." }
            if (msg.event === "user.message" && msg.content) {
                // Wrap user message as ChatMessage
                const userMessage: ChatMessage = {
                    id: uuidv4(),
                    role: "user",
                    type: "text",
                    status: "done",
                    content: msg.content,
                };

                sendChunk(ws, userMessage);

                // Dispatch according to current state
                const state: SessionState = session.current_state;

                switch (state) {
                    case "GENERAL_MODE":
                        await handleGeneral(session, msg.content, (chunk) =>
                            sendChunk(ws, chunk),
                        );
                        break;

                    case "CONSENT_REQUESTED":
                        await handleConsent(session, msg.content, (chunk) =>
                            sendChunk(ws, chunk),
                        );
                        break;

                    case "MENTAL_WARMUP":
                        await handleWarmup(session, msg.content, (chunk) =>
                            sendChunk(ws, chunk),
                        );
                        break;

                    case "EXPLORATORY":
                        await handleExploratory(session, msg.content, (chunk) =>
                            sendChunk(ws, chunk),
                        );
                        break;

                    case "READINESS_CHECK":
                        await handleReadiness(session, msg.content, (chunk) =>
                            sendChunk(ws, chunk),
                        );
                        break;

                    case "SCREENING":
                        await handleScreening(session, msg.content, (chunk) =>
                            sendChunk(ws, chunk),
                        );
                        break;

                    case "ESCALATION_OFFERED":
                        await handleEscalation(session, msg.content, (chunk) =>
                            sendChunk(ws, chunk),
                        );
                        break;

                    case "POST_SCREENING":
                        await handlePostScreening(
                            session,
                            msg.content,
                            (chunk) => sendChunk(ws, chunk),
                        );
                        break;

                    case "BOOKING":
                        await handleBooking(session, msg.content, (chunk) =>
                            sendChunk(ws, chunk),
                        );
                        break;

                    case "SESSION_CLOSED":
                        sendChunk(ws, {
                            id: uuidv4(),
                            role: "assistant",
                            type: "text",
                            status: "done",
                            content: "This session has ended.",
                        });
                        break;

                    default:
                        sendChunk(ws, {
                            id: uuidv4(),
                            role: "assistant",
                            type: "text",
                            status: "done",
                            content: "Unknown state",
                        });
                }
            }
        } catch (err) {
            console.error("WS message error:", err);
            ws.send(
                JSON.stringify({ type: "error", message: "Invalid message" }),
            );
        }
    });

    ws.on("close", () => {
        sessions.delete(sessionId);
        console.log(`WS disconnected for session ${sessionId}`);
    });
});

export default wss;
