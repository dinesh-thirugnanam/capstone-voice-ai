import { ChatService } from "./ChatService.ts";
import { getLLM } from "../llm/LLMFactory.ts";
import { v4 as uuid } from "uuid";

export class ChatController {
    private service = new ChatService();
    private llm = getLLM();

    handle = async (req: any, res: any) => {
        const { sessionId, message } = req.body;

        const result = await this.service.handleMessage(sessionId, message);

        // stream case
        if (result.type === "stream") {
            const id = uuid();
            res.setHeader("Content-Type", "text/event-stream");
            res.write(JSON.stringify({ event: "message.start", id }) + "\n");

            for await (const chunk of this.llm.generate(result.prompt)) {
                res.write(
                    JSON.stringify({
                        event: "message.chunk",
                        id,
                        content: chunk,
                    }) + "\n",
                );
            }

            res.write(JSON.stringify({ event: "message.end", id }) + "\n");
            res.end();
            return;
        }

        // normal response
        res.json(result);
    };
}
