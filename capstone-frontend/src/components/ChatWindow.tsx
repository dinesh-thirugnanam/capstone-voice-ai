"use client";
import React, { useEffect, useRef, useState } from "react";
import SmoothScroll from "./SmoothScroll";
import MockTableData from "@/mocks/MockTableData";
import {
    MockAiResponse,
    MockUserResponse,
    transcriptMessages,
} from "@/mocks/MockTextData";
import ChatMessageComp from "@/components/ChatMessageComp";
import mockAppointment from "@/mocks/MockAppointmentData";
import ChatInput from "./ChatInput";
import { sendMessage } from "../services/socket";
import ChatMessage from "../../../shared/types/ChatMessage";
import TextMessage from "../../../shared/types/TextMessage";

const ChatWindow = () => {
    const initialMessages: Record<string, ChatMessage> = {};
    const initialOrder: string[] = [];

    transcriptMessages.forEach((m) => {
        initialMessages[m.id] = m;
        initialOrder.push(m.id);
    });
    const [messages, setMessages] =
        useState<Record<string, ChatMessage>>(initialMessages);

    const [messageOrder, setMessageOrder] = useState<string[]>(initialOrder);

    useEffect(() => {
        setMessageOrder((order) => order.filter((id) => !!id));
    }, []);
    const handleMessageChunk = (chunk: ChatMessage) => {
        // console.log(`[ChatWindow] Received chunk:`, chunk);
        // console.log(`[ChatWindow] Chunk type: ${chunk.type}`);
        if (!chunk || !chunk.id) {
            console.warn("Dropped invalid message:", chunk);
            return;
        }
        setMessages((prev) => {
            const existing = prev[chunk.id];

            if (!existing) {
                // console.log(`[ChatWindow] New message, adding to order and state`);
                setMessageOrder((order) => {
                    if (!chunk.id) return order;
                    if (order.includes(chunk.id)) return order;
                    return [...order, chunk.id];
                });

                // For text messages, ensure content is initialized. For other types, preserve the chunk as-is.
                if (chunk.type === "text") {
                    return {
                        ...prev,
                        [chunk.id]: {
                            ...chunk,
                            content: chunk.content ?? "",
                        },
                    };
                } else {
                    // Preserve non-text chunks exactly as they come
                    return {
                        ...prev,
                        [chunk.id]: chunk,
                    };
                }
            }

            if (chunk.type !== "text") {
                // console.log(`[ChatWindow] Non-text message (${chunk.type}), preserving as-is`);
                return { ...prev, [chunk.id]: chunk };
            }

            const existingText = existing as TextMessage;

            return {
                ...prev,
                [chunk.id]: {
                    ...existingText,
                    status: chunk.status,
                    content: existingText.content + (chunk.content ?? ""),
                },
            };
        });
    };

    useEffect(() => {
        async function loadData() {
            const events = await fetch(
                "http://localhost:4000/mock/events",
            ).then((r) => r.json());

            const appointments = await fetch(
                "http://localhost:4000/mock/appointments",
            ).then((r) => r.json());

            setMessages((prev) => ({
                ...prev,
                [events.id]: events,
                [appointments.id]: appointments,
            }));

            setMessageOrder((prev) => [...prev, events.id, appointments.id]);
        }

        loadData();
    }, []);

    useEffect(() => {
        async function startSession() {
            const res = await fetch("http://localhost:4000/session", {
                method: "POST",
            });

            console.log(res);
            const data = await res.json();

            const sessionId = data.sessionId;

            const { connectSocket } = await import("../services/socket");

            connectSocket(sessionId, handleMessageChunk);
        }

        startSession();
    }, []);

    const scrollRef = useRef<HTMLDivElement | null>(null);

    const lastMsgId = messageOrder[messageOrder.length - 1];
    const lastMsg = messages[lastMsgId];
    const isAssistantReplying =
        lastMsg?.role === "assistant" &&
        (lastMsg?.status === "loading" || lastMsg?.status === "streaming");

    return (
        <div className="z-0 relative w-[80vw] sm:w-[60vw] md:w-[30vw] min-h-[70vh] max-h-[90vh] h-fit animate-background rounded-xl overflow-hidden">
            <div
                ref={scrollRef}
                className="flex flex-col items-center justify-start w-full h-full gap-3 overflow-y-auto shadow z-5 rounded-2xl shadow-white backdrop-blur-3xl"
            >
                <h1
                    className="font-poiret sticky top-0 left-0 z-10 w-full h-20 py-4 text-3xl text-center text-black pointer-events-none drop-shadow-lg
                    backdrop-blur-3xl rounded-b-2xl
                    bg-linear-to-b from-[#B3C1CE] to-[#DBE0DD]/90 border border-[#DBE0DD]/40"
                >
                    Assistant
                </h1>

                {/* <SmoothScroll containerRef={scrollRef} /> */}

                {messageOrder.map((msgKey, i) => {
                    // console.log("KEY:", msgKey, "INDEX:", i);

                    const msg = messages[msgKey];

                    if (!msg) return null;

                    return <ChatMessageComp message={msg} key={msgKey} />;
                })}
                <ChatInput
                    isAssistantReplying={isAssistantReplying}
                    onSend={(message) => {
                        const id = crypto.randomUUID();
                        console.log("RENDERING:", message);

                        // 1. Add user message locally
                        setMessages((prev) => ({
                            ...prev,
                            [id]: {
                                id: id,
                                role: "user",
                                type: "text",
                                status: "done",
                                content: message,
                            },
                        }));

                        setMessageOrder((prev) => [...prev, id]);

                        // 2. Send to backend
                        sendMessage(message);
                    }}
                />
            </div>
        </div>
    );
};

export default ChatWindow;
