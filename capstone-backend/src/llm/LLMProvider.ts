export interface LLMProvider {
    generate(prompt: string): AsyncGenerator<string>;
}
