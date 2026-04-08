import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

export async function detectEmotionalDepth(message: string) {
  const prompt = `
Rate the emotional depth of this message from 0 to 3.

0 = casual / greeting
1 = mild emotional content
2 = clear distress / emotional sharing
3 = strong distress

Message:
"${message}"

Return only a number (0-3).
`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0 }
  });

  const text = result.response.text().trim();

  const value = parseInt(text.replace(/[^0-9]/g, ""));
  return isNaN(value) ? 0 : value;
}
