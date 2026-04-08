import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});

export async function extractOption(questionText: string, userInput: string) {
    const prompt = `
You are a strict classification system.

A user answered the following PHQ-2 question:

Question:
"${questionText}"

Valid options:
0 - Not at all
1 - Several days
2 - More than half the days
3 - Nearly every day

User response:
"${userInput}"

Return ONLY valid JSON in this format:

{
  "selected_option": 0 | 1 | 2 | 3 | null,
  "confidence": number between 0 and 1
}

If unclear, return null.
Do not include explanations.
`;

    const result = await model.generateContent({
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }],
            },
        ],
        generationConfig: {
            temperature: 0,
        },
    });

    const text = result.response.text();

    try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.error("Invalid JSON from Gemini:", text);
        return {
            selected_option: null,
            confidence: 0,
        };
    }
}
