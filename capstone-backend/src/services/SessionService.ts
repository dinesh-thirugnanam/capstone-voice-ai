import { v4 as uuid } from "uuid";
import { supabase } from "../lib/supabase.ts";

export class SessionService {
    startSession = async () => {
        const sessionId = uuid();

        const { error } = await supabase.from("conversation_session").insert({
            id: sessionId,
            current_state: "GENERAL_MODE",
            mode: "GENERAL",
            risk_level: "LOW",
            screening_state: null,
            started_at: new Date().toISOString(),
        });

        if (error) {
            console.error("SESSION INSERT ERROR:", error);
            throw error;
        }

        return { sessionId };
    };
}
