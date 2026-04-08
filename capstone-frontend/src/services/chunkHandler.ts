import ChatMessage from "../../../shared/types/ChatMessage";

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
