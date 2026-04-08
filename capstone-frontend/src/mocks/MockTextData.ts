import TextMessage from "../../../shared/types/TextMessage";

export const MockAiResponse: TextMessage = {
    id: "msg_01",
    role: "assistant",
    type: "text",
    status: "done",
    content: "Hello how have you been to today",
};
export const MockUserResponse: TextMessage = {
    id: "msg_02",
    role: "user",
    type: "text",
    status: "done",
    content: "Hi...I'm not really sure what to say at this point",
};

export const transcriptMessages: TextMessage[] = [
    {
        id: "msg_01",
        role: "assistant",
        type: "text",
        status: "done",
        content:
            "Hi there. I'm here to help. How have things been going for you lately?",
    },

    {
        id: "msg_02",
        role: "user",
        type: "text",
        status: "done",
        content:
            "Honestly I've been feeling a bit overwhelmed with classes and deadlines.",
    },

    {
        id: "msg_03",
        role: "assistant",
        type: "text",
        status: "done",
        content:
            "That sounds really tough. Balancing coursework and everything else can be exhausting. You're definitely not alone in feeling that way.",
    },

    {
        id: "msg_04",
        role: "assistant",
        type: "text",
        status: "done",
        content:
            "Do you feel like it's mostly the workload itself, or are there other things adding to the pressure right now?",
    },

    {
        id: "msg_05",
        role: "user",
        type: "text",
        status: "done",
        content:
            "Mostly the workload. I have multiple assignments due this week and I feel like I'm constantly behind.",
    },

    {
        id: "msg_06",
        role: "assistant",
        type: "text",
        status: "done",
        content:
            "That can feel really draining, especially when deadlines pile up all at once. When you're constantly thinking about what's next, it can be hard to get any breathing room.",
    },

    {
        id: "msg_07",
        role: "assistant",
        type: "text",
        status: "done",
        content:
            "Have you been able to take any breaks lately, even small ones, or has it mostly been work non-stop?",
    },

    {
        id: "msg_08",
        role: "user",
        type: "text",
        status: "done",
        content:
            "Mostly work honestly. Even when I try to relax I end up thinking about assignments.",
    },

    {
        id: "msg_09",
        role: "assistant",
        type: "text",
        status: "done",
        content:
            "That happens to a lot of students. When stress builds up, even downtime doesn't really feel like a break because your mind keeps going back to everything you still need to do.",
    },

    {
        id: "msg_10",
        role: "assistant",
        type: "text",
        status: "done",
        content:
            "Sometimes taking a short mental reset or stepping away from coursework for a bit can actually make it easier to focus afterwards.",
    },

    {
        id: "msg_11",
        role: "assistant",
        type: "text",
        status: "done",
        content:
            "Sometimes taking a break or attending something interesting on campus can help reset your mind. Here are a few upcoming college events you might enjoy.",
    },

    {
        id: "msg_12",
        role: "assistant",
        type: "text",
        status: "done",
        content:
            "And if you'd like to talk to someone about how you're feeling, our counsellors and peer supporters have some available time slots.",
    },
];
