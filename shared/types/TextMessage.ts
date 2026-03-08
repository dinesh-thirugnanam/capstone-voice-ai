type TextMessage = {
    id: string;
    role: "user" | "assistant";
    type: "text";
    status: "loading" | "streaming" | "done";
    content: string;
};

export default TextMessage;
