import { classifyIntent } from "../llm/classifier";
import { detectEmotionalDepth } from "../llm/depthClassifier";
import { generateExploratoryResponseWithMemory } from "../llm/generator";

import { transition } from "../state/stateMachine";

import { getSession, updateSession } from "../session/sessionStore";
import TableMessage from "../../../shared/types/TableMessage";
import { routeTool } from "../tools/toolRouter";

export async function processMessage(sessionId: string, userMessage: string) {
    const session = getSession(sessionId);

    session.memory.push({
        role: "user",
        content: userMessage,
    });

    const intent = await classifyIntent(userMessage);

    // const depth = await detectEmotionalDepth(userMessage);

    let event = "";

    if (intent === "MENTAL_HEALTH" && session.state === "GENERAL_MODE") {
        event = "REQUEST_SUPPORT";
    }

    if (session.state === "MENTAL_WARMUP") {
        event = "RAPPORT_DONE";
    }

    if (session.state === "EXPLORATORY" && session.exploratoryTurns > 3) {
        event = "ASK_READINESS";
    }

    const { newState, newRisk } = transition(
        session.state,
        event,
        session.risk,
    );

    session.state = newState;
    session.risk = newRisk;

    if (session.state === "EXPLORATORY") {
        session.exploratoryTurns++;
    }

    let pivot = false;

    if (session.state === "READINESS_CHECK") {
        pivot = true;
    }

    const toolResult = await routeTool(userMessage);

    if (toolResult) {
        return toolResult;
    }

    const response = await generateExploratoryResponseWithMemory(
        session.memory,
        pivot,
    );

    session.memory.push({
        role: "assistant",
        content: response,
    });

    updateSession(sessionId, session);

    return response;
}

function eventsToTableMessage(events: any[]): TableMessage {
    return {
        id: crypto.randomUUID(),
        role: "assistant",
        type: "table",
        columns: ["Title", "Date", "Location", "Organizer"],
        rows: events.map((e) => [
            e.title,
            new Date(e.event_date).toLocaleString(),
            e.location ?? "-",
            e.organizer ?? "-",
        ]),
    };
}
