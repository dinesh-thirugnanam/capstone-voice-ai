import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function classifyIntent(message: string) {
    const prompt = `
Classify the user message into exactly ONE of these labels:

COLLEGE_QUERY
MENTAL_HEALTH
BOOKING_INTENT
OTHER

Guidelines:
- If the message expresses feelings, uncertainty, personal thoughts, or emotional states → MENTAL_HEALTH
- If it is about events, schedules, departments, clubs → COLLEGE_QUERY
- If it mentions booking or meeting a counselor → BOOKING_INTENT
- If completely unclear or meaningless → OTHER

Message:
"${message}"

Return ONLY the label.
`;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0 },
    });

    const text = result.response.text().trim();

    return text.replace(/```/g, "").trim();
}
