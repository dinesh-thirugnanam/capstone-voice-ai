"use client";
import React, { useRef, useState } from "react";
import SmoothScroll from "./SmoothScroll";
import MockTableData from "@/mocks/MockTableData";
import { MockAiResponse, MockUserResponse } from "@/mocks/MockTextData";
import ChatMessageComp from "@/components/ChatMessageComp";
import mockAppointment from "@/mocks/MockAppointmentData";
import ChatMessage from "@/types/ChatMessage";
import TextMessage from "@/types/TextMessage";
import ChatInput from "./ChatInput";

const ChatWindow = () => {
    const [messageOrder, setMessageOrder] = useState<string[]>([
        MockUserResponse.id,
        MockAiResponse.id,
        MockTableData.id,
        mockAppointment.id,
    ]);
    const [messages, setMessages] = useState<Record<string, ChatMessage>>({
        [MockUserResponse.id]: MockUserResponse,
        [MockAiResponse.id]: MockAiResponse,
        [mockAppointment.id]: mockAppointment,
        [MockTableData.id]: MockTableData,
    });

    const handleMessageChunk = (chunk: ChatMessage) => {
        if (!messageOrder.includes(chunk.id)) {
            setMessageOrder((prev) => [...prev, chunk.id]);
        }

        setMessages((prev) => {
            const existing = prev[chunk.id];

            if (chunk.type !== "text") {
                return { ...prev, [chunk.id]: chunk };
            }

            if (!existing) {
                return { ...prev, [chunk.id]: chunk };
            }

            return {
                ...prev,
                [chunk.id]: {
                    ...existing,
                    status: chunk.status,
                    content: (existing as TextMessage).content + chunk.content,
                },
            };
        });
    };

    const scrollRef = useRef<HTMLDivElement>(null);
    return (
        <div className="z-0 relative w-[80vw] sm:w-[60vw] md:w-[30vw] min-h-[70vh] max-h-[90vh] h-fit animate-background rounded-xl overflow-hidden">
            <div
                ref={scrollRef}
                className="flex flex-col items-center justify-start w-full gap-3 overflow-y-auto shadow h-full z-5 rounded-2xl shadow-white backdrop-blur-3xl"
            >
                <h1
                    className="font-poiret sticky top-0 left-0 z-10 w-full h-20 py-4 text-3xl text-center text-black pointer-events-none drop-shadow-lg
                    backdrop-blur-3xl rounded-b-2xl
                    bg-linear-to-b from-[#B3C1CE] to-[#DBE0DD]/90 border border-[#DBE0DD]/40"
                >
                    Assistant
                </h1>

                <SmoothScroll containerRef={scrollRef} />

                {messageOrder.map((msgKey) => (
                    <ChatMessageComp message={messages[msgKey]} key={msgKey} />
                ))}
                <ChatInput onSend={() => console.log("Msg Sent")} />
            </div>
        </div>
    );
};

export default ChatWindow;
