import { LLMProvider } from "./LLMProvider.ts";
import { GroqProvider } from "./GroqProvider.ts";

export function getLLM(): LLMProvider {
    const provider = process.env.LLM_PROVIDER || "groq";

    switch (provider) {
        case "groq":
            return new GroqProvider();
        default:
            return new GroqProvider();
    }
}
