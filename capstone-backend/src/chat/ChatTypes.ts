export type ChatResponse =
    | { type: "text"; content: string }
    | { type: "stream"; prompt: string }
    | { type: "question"; code: string; text: string }
    | { type: "appointments"; data: any[] }
    | { type: "table"; columns: string[]; rows: string[][] }
    | { type: "crisis"; content: string }
    | { type: "result"; data: any };
