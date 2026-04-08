import { VertexAI } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID,
  location: "us-central1", // or your chosen region
});

const model = vertexAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0,
    responseMimeType: "application/json"
  }
});

export async function extractOption(
  questionText: string,
  userInput: string
) {
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
        parts: [{ text: prompt }]
      }
    ]
  });

  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Vertex");
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Invalid JSON from Vertex:", text);
    return {
      selected_option: null,
      confidence: 0
    };
  }
}
