import { LLMProvider } from "./LLMProvider.ts";
import Groq from "groq-sdk";

export class GroqProvider implements LLMProvider {
    private groq: Groq;

    constructor() {
        // Automatically picks up GROQ_API_KEY from the environment
        this.groq = new Groq();
    }

    async *generate(prompt: string) {
        let messagesPayload: any[];

        try {
            // Try to parse as a structured message array
            messagesPayload = JSON.parse(prompt);
            if (!Array.isArray(messagesPayload)) {
                throw new Error("Parsed prompt is not an array");
            }
        } catch {
            // Fallback for standard string prompts
            messagesPayload = [{ role: "user", content: prompt }];
        }

        try {
            const stream = await this.groq.chat.completions.create({
                messages: messagesPayload,
                model: "llama-3.1-8b-instant",
                temperature: 0.3,
                max_tokens: 512,
                top_p: 1,
                stream: true,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                    yield content;
                }
            }
        } catch (error) {
            console.error("Groq API Streaming Error:", error);
            // Yield a graceful fallback so the frontend doesn't crash on an API failure
            yield "I'm having a little trouble connecting right now, but I'm still here. Could you try sending that again?";
        }
    }
}
