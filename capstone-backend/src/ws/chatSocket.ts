import { WebSocketServer } from "ws";
import { ChatService } from "../chat/ChatService.ts";
import { getLLM } from "../llm/LLMFactory.ts";
import { v4 as uuid } from "uuid";

export function initChatSocket(wss: WebSocketServer) {
    const chatService = new ChatService();
    const llm = getLLM();

    wss.on("connection", (ws) => {
        const sessionId = (ws as any).sessionId;
        console.log("WS session: ", sessionId);
        ws.on("message", async (data) => {
            try {
                // const { sessionId, message } = JSON.parse(data.toString());

                const msg = JSON.parse(data.toString());

                if (msg.event === "user.message") {
                    const result = await chatService.handleMessage(
                        sessionId,
                        msg.content,
                    );

                    console.log(`[WS] Result type: ${result.type}`);
                    console.log(
                        `[WS] Full result:`,
                        JSON.stringify(result, null, 2),
                    );

                    // ===== NON-STREAMING RESPONSES (immediate, no start/end events) =====

                    // 1. QUESTION
                    if (result.type === "question") {
                        console.log(
                            `[WS-QUESTION] 📤 Sending question with content="${result.content}" (result.text="${result.text}")`,
                        );
                        send(ws, {
                            event: "message.question",
                            id: uuid(),
                            content: result.content,
                            text: result.text,
                        });
                        return;
                    }

                    // 2. APPOINTMENTS
                    if (result.type === "appointments") {
                        // console.log(`[WS] 🔴 Sending APPOINTMENTS:`, result);
                        send(ws, {
                            event: "message.appointments",
                            id: result.id || uuid(),
                            ...result,
                        });
                        return;
                    }

                    // 3. TABLE
                    if (result.type === "table") {
                        // console.log(`[WS] 🔴 Sending TABLE:`, result);
                        send(ws, {
                            event: "message.table",
                            id: result.id || uuid(),
                            ...result,
                        });
                        return;
                    }

                    // 4. CRISIS
                    if (result.type === "crisis") {
                        send(ws, {
                            event: "message.chunk",
                            id: uuid(),
                            content: result.content,
                        });
                        return;
                    }

                    // 5. RESULT
                    if (result.type === "result") {
                        send(ws, {
                            event: "message.chunk",
                            id: uuid(),
                            content: formatResult(result.data),
                        });
                        return;
                    }

                    // ===== STREAMING RESPONSES (with start/end events) =====

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

                    send(ws, {
                        event: "message.end",
                        id,
                    });
                }
            } catch (err) {
                console.error("CHAT ERROR:", err);

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
