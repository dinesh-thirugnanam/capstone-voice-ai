export function dispatchEvent(event: any) {
    switch (event.event) {
        case "message.start":
            handleStart(event);
            break;

        case "message.chunk":
            handleChunk(event);
            break;

        case "message.end":
            handleEnd(event);
            break;

        case "message.question":
            handleQuestion(event);
            break;

        case "error":
            console.error("WS Error:", event.message);
            break;

        default:
            console.warn("Unknown event:", event);
    }
}

function handleStart(event: any) {
    addMessage({
        id: event.id,
        role: "assistant",
        type: "text",
        status: "loading",
        content: "",
    });
}
