import { v4 as uuid } from "uuid";

export class SessionService {
    startSession = async () => {
        const sessionId = uuid();
        // not persisting to DB for now (keeps behavior safe)
        return { sessionId };
    };
}
