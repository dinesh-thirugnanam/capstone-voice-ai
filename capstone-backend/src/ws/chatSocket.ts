import { WebSocketServer } from "ws";
import { ChatService } from "../chat/ChatService.ts";
import { getLLM } from "../llm/LLMFactory.ts";
import { v4 as uuid } from "uuid";

export function initChatSocket(server: any) {
    const wss = new WebSocketServer({ server });

    const chatService = new ChatService();
    const llm = getLLM();

    wss.on("connection", (ws) => {
        ws.on("message", async (data) => {
            try {
                const { sessionId, message } = JSON.parse(data.toString());

                const result = await chatService.handleMessage(
                    sessionId,
                    message,
                );

                // ───────────── STREAMING RESPONSE ─────────────

                const id = uuid();

                send(ws, {
                    event: "message.start",
                    id,
                });

                // 1. LLM STREAM
                if (result.type === "stream") {
                    for await (const chunk of llm.generate(result.prompt)) {
                        send(ws, {
                            event: "message.chunk",
                            id,
                            content: chunk,
                        });
                    }
                }

                // 2. TEXT RESPONSE
                else if (result.type === "text") {
                    send(ws, {
                        event: "message.chunk",
                        id,
                        content: result.content,
                    });
                }

                // 3. QUESTION
                else if (result.type === "question") {
                    send(ws, {
                        event: "message.chunk",
                        id,
                        content: result.text,
                    });

                    // 👉 send options as metadata (frontend handles buttons)
                    send(ws, {
                        event: "message.chunk",
                        id,
                        content: "\n\n[0,1,2,3]",
                    });
                }

                // 4. CRISIS
                else if (result.type === "crisis") {
                    send(ws, {
                        event: "message.chunk",
                        id,
                        content: result.content,
                    });
                }

                // 5. RESULT
                else if (result.type === "result") {
                    send(ws, {
                        event: "message.chunk",
                        id,
                        content: formatResult(result.data),
                    });
                }

                send(ws, {
                    event: "message.end",
                    id,
                });
            } catch (err) {
                send(ws, {
                    event: "error",
                    message: "Something went wrong",
                });
            }
        });
    });
}

// helper
function send(ws: any, payload: any) {
    ws.send(JSON.stringify(payload));
}

// simple formatter
function formatResult(result: any): string {
    return `
Result: ${result.indicationLevel}
Score: ${result.normalizedScore.toFixed(1)}

${result.recommendation}
`;
}
