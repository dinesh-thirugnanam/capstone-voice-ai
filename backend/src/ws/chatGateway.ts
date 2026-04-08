import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { handleUserMessage } from "../session/sessionManager";

export function setupChatGateway(server: Server) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (socket: WebSocket, req) => {
        const url = req.url || "";
        const parts = url.split("/");
        const sessionId = parts[parts.length - 1];

        console.log("WS connected:", sessionId);

        socket.on("message", async (data) => {
            try {
                const msg = JSON.parse(data.toString());

                if (msg.event === "user.message") {
                    await handleUserMessage(socket, sessionId, msg.content);
                }
            } catch (err) {
                console.error("WS message error:", err);
            }
        });
    });
}
