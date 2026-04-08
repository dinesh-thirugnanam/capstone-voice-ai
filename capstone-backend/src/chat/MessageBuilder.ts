import { v4 as uuid } from "uuid";

export function buildTextMessage(content: string) {
    return {
        id: uuid(),
        role: "assistant",
        type: "text",
        status: "done",
        content,
    };
}

export function buildQuestionMessage(text: string) {
    return {
        id: uuid(),
        role: "assistant",
        type: "text",
        status: "done",
        content: text,
        options: [0, 1, 2, 3],
    };
}
