import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});

export async function generateExploratoryResponse(
    userMessage: string,
    pivotToScreening: boolean,
) {
    const basePrompt = `
You are a supportive, calm mental health assistant.

Your role:
- Reflect the user's feelings
- Avoid diagnosis
- Avoid giving medical advice
- Be brief and empathetic
- Do not escalate
- Do not mention screening yet unless instructed
- Ask an open ended question to encourage them sharing more on their topic
- Slowly guide the conversation towards "Would you be comfortable answering a couple of brief check-in questions?"

User said:
"${userMessage}"
`;

    const pivotInstruction = `
After responding empathetically, gently ask:
"Would you be comfortable answering a couple of brief check-in questions?"

Do not make it sound clinical.
`;

    const prompt = pivotToScreening
        ? basePrompt + "\n\n" + pivotInstruction
        : basePrompt;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.6,
        },
    });

    return result.response.text();
}

export async function generateExploratoryResponseWithMemory(
    memory: any[],
    pivotToScreening: boolean,
) {
    const conversationText = memory
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");

    const pivotInstruction = pivotToScreening
        ? `
Gently transition toward asking:
"Would you be comfortable answering a couple of brief check-in questions?"
Make it feel natural based on the conversation.
`
        : "";

    const prompt = `
You are a supportive, calm mental health assistant.

Conversation so far:
${conversationText}

Respond empathetically.
Avoid repeating the same phrasing.
Reflect patterns or themes if possible.
Be natural and brief.
${pivotInstruction}
`;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
        },
    });

    return result.response.text();
}
