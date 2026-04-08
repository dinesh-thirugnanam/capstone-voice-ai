import { SessionState, RiskLevel } from "../state/stateMachine";

export type SessionData = {
    state: SessionState;
    risk: RiskLevel;
    exploratoryTurns: number;
    memory: { role: "user" | "assistant"; content: string }[];
};

const sessions = new Map<string, SessionData>();

export function getSession(sessionId: string): SessionData {
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
            state: "GENERAL_MODE",
            risk: "LOW",
            exploratoryTurns: 0,
            memory: [],
        });
    }

    return sessions.get(sessionId)!;
}

export function updateSession(sessionId: string, data: SessionData) {
    sessions.set(sessionId, data);
}
