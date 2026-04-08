import { LLMProvider } from "./LLMProvider.ts";

export class GroqProvider implements LLMProvider {
    async *generate(prompt: string) {
        // placeholder chunked generator — replace with real Groq SDK calls later
        const fakeChunks = [
            "I understand how you're feeling. ",
            "That sounds difficult. ",
            "Do you want to talk more about it?",
        ];

        for (const chunk of fakeChunks) {
            // simulate small delay for streaming semantics (consumer can await)
            yield chunk;
        }
    }
}
