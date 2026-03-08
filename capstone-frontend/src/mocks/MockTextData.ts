import TextMessage from "@/types/TextMessage";

export const MockAiResponse: TextMessage = {
    id: "msg_01",
    role: "assistant",
    type: "text",
    status: "done",
    content:
        "Hello how have you been to today Hello how have you been to today  Hello how have you been to todayHello how have you been to today  Hello how have you been to todayHello how have you been to today Hello how have you been to today",
};
export const MockUserResponse: TextMessage = {
    id: "msg_02",
    role: "user",
    type: "text",
    status: "done",
    content: "Hi...I'm not really sure what to say at this point",
};
