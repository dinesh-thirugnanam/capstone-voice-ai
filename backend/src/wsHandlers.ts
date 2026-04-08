import { pool } from "./db.ts";
import { v4 as uuidv4 } from "uuid";
import { detectEmotionalDepth } from "./llm/depthClassifier.ts";
import { generateExploratoryResponseWithMemory } from "./llm/generator.ts";
import { classifyIntent } from "./llm/classifier.ts";
import { updateState } from "./utils/sessionUtils.ts"; // helper to update DB state
import { simpleYesNo } from "./utils/textUtils.ts"; // same as frontend
import ChatMessage from "../../shared/types/ChatMessage.ts";
import TextMessage from "../../shared/types/TextMessage.ts";
import { classify } from "./core/classifier.js";

type Session = any;
type SendFunc = (chunk: ChatMessage) => void;

/* ========================= */
/* General Utility Functions */
/* ========================= */

function sendText(
    sessionId: string,
    send: SendFunc,
    content: string,
    role: "user" | "assistant" = "assistant",
) {
    const msg: TextMessage = {
        id: uuidv4(),
        role,
        type: "text",
        status: "done",
        content,
        audioUrl: undefined,
    };
    send(msg);
}

/* ========================= */
/* Handlers for All States   */
/* ========================= */

export async function handleGeneral(
    session: Session,
    userMessage: string,
    send: SendFunc,
) {
    if (!userMessage) {
        return sendText(session.id, send, "Hi. How can I help you today?");
    }

    const intent = await classifyIntent(userMessage);

    if (intent === "MENTAL_HEALTH") {
        await updateState(session.id, "CONSENT_REQUESTED", "MENTAL");
        return sendText(
            session.id,
            send,
            "It sounds like you're going through something. Would you like to talk about it?",
        );
    }

    if (intent === "COLLEGE_QUERY") {
        return sendText(
            session.id,
            send,
            "I can help with college information. What would you like to know?",
        );
    }

    if (intent === "OTHER") {
        return sendText(
            session.id,
            send,
            "I'm here to listen. Are you thinking about something that's been on your mind?",
        );
    }

    return sendText(session.id, send, "Could you tell me a bit more?");
}

export async function handleConsent(
    session: Session,
    userMessage: string,
    send: SendFunc,
) {
    const intent = simpleYesNo(userMessage);

    if (intent === "YES") {
        await updateState(session.id, "MENTAL_WARMUP");
        return sendText(
            session.id,
            send,
            "Thank you for trusting me. Tell me what's been happening.",
        );
    }

    await updateState(session.id, "GENERAL_MODE", "GENERAL");
    return sendText(
        session.id,
        send,
        "That's completely fine. How else can I help?",
    );
}

export async function handleWarmup(
    session: Session,
    userMessage: string,
    send: SendFunc,
) {
    await updateState(session.id, "EXPLORATORY");
    return sendText(session.id, send, "I'm listening. Take your time.");
}

export async function handleExploratory(
    session: Session,
    userMessage: string,
    send: SendFunc,
) {
    const memory = session.exploratory_memory || [];
    const updatedMemory = [
        ...memory,
        { role: "user", content: userMessage },
    ].slice(-6);

    const depth = await detectEmotionalDepth(userMessage);

    await pool.query(
        `UPDATE conversation_session
     SET exploratory_turns = exploratory_turns + 1,
         emotional_score = emotional_score + $1,
         exploratory_memory = $2
     WHERE id = $3`,
        [depth, JSON.stringify(updatedMemory), session.id],
    );

    const refreshed = await pool.query(
        "SELECT * FROM conversation_session WHERE id = $1",
        [session.id],
    );
    const pivot =
        refreshed.rows[0].exploratory_turns >= 3 &&
        refreshed.rows[0].emotional_score >= 3;

    const response = await generateExploratoryResponseWithMemory(
        updatedMemory,
        pivot,
    );

    const finalMemory = [
        ...updatedMemory,
        { role: "assistant", content: response },
    ].slice(-6);
    await pool.query(
        `UPDATE conversation_session SET exploratory_memory = $1 WHERE id = $2`,
        [JSON.stringify(finalMemory), session.id],
    );

    sendText(session.id, send, response);

    if (pivot) {
        await pool.query(
            `UPDATE conversation_session SET exploratory_memory = '[]' WHERE id = $1`,
            [session.id],
        );
        await updateState(session.id, "READINESS_CHECK");
    }
}

export async function handleReadiness(
    session: Session,
    userMessage: string,
    send: SendFunc,
) {
    const intent = simpleYesNo(userMessage);

    if (intent === "YES") {
        await updateState(session.id, "SCREENING");
        const firstQuestion = await pool.query(
            `SELECT * FROM screening_question WHERE tool_name = 'PHQ2'
       AND id NOT IN (
         SELECT question_id FROM screening_response WHERE session_id = $1
       ) ORDER BY order_index LIMIT 1`,
            [session.id],
        );
        return sendText(
            session.id,
            send,
            firstQuestion.rows[0]?.question_text || "No question found",
        );
    }

    await updateState(session.id, "POST_SCREENING");
    return sendText(
        session.id,
        send,
        "That's okay. If you'd like support later, I'm here.",
    );
}

export async function handleScreening(
    session: Session,
    userMessage: string,
    send: SendFunc,
) {
    const nextQuestion = await pool.query(
        `SELECT sq.* FROM screening_question sq
     WHERE sq.tool_name = 'PHQ2' 
     AND sq.id NOT IN (SELECT question_id FROM screening_response WHERE session_id = $1)
     ORDER BY sq.order_index
     LIMIT 1`,
        [session.id],
    );

    if (!nextQuestion.rows[0]) {
        await updateState(session.id, "POST_SCREENING");
        return sendText(
            session.id,
            send,
            "Thank you for answering. If you'd like to talk to someone, I can help.",
        );
    }

    // const extracted = await extractOption(
    //     nextQuestion.rows[0].question_text,
    //     userMessage,
    // );

    const extracted = classify(userMessage);

    // if (extracted.selected_option === null || extracted.confidence < 0.6) {
    if (extracted === null) {
        return sendText(
            session.id,
            send,
            "I just need to match that to one of these options: Not at all, Several days, More than half the days, or Nearly every day. Which fits best?",
        );
    }

    await pool.query(
        `INSERT INTO screening_response (session_id, question_id, response_value)
     VALUES ($1, $2, $3)`,
        [session.id, nextQuestion.rows[0].id, extracted],
    );

    const totalScoreResult = await pool.query(
        `SELECT sum(sr.response_value) as total
     FROM screening_response sr
     JOIN screening_question sq ON sr.question_id = sq.id
     WHERE sr.session_id = $1 AND sq.tool_name = 'PHQ2'`,
        [session.id],
    );

    const totalScore = parseInt(totalScoreResult.rows[0].total) || 0;

    if (totalScore >= 3) {
        await updateState(session.id, "ESCALATION_OFFERED");
        return sendText(
            session.id,
            send,
            "Based on your responses, it may help to speak with a counsellor. Would you like to book an appointment?",
        );
    }

    return sendText(session.id, send, nextQuestion.rows[0].question_text);
}

export async function handleEscalation(
    session: Session,
    userMessage: string,
    send: SendFunc,
) {
    const intent = simpleYesNo(userMessage);

    if (intent === "YES") {
        await updateState(session.id, "BOOKING");
        return sendText(
            session.id,
            send,
            "Please provide your name and email to book an appointment.",
        );
    }

    await updateState(session.id, "POST_SCREENING");
    return sendText(
        session.id,
        send,
        "That's okay. If you change your mind, I'm here.",
    );
}

export async function handlePostScreening(
    session: Session,
    userMessage: string,
    send: SendFunc,
) {
    const intent = simpleYesNo(userMessage);

    if (intent === "YES") {
        await updateState(session.id, "BOOKING");
        return sendText(
            session.id,
            send,
            "Sure. Please provide your name and email.",
        );
    }

    if (intent === "NO") {
        await updateState(session.id, "SESSION_CLOSED");
        return sendText(
            session.id,
            send,
            "Thank you for sharing today. Take care.",
        );
    }

    return sendText(
        session.id,
        send,
        "If you'd like to talk to someone, I can help you book a session.",
    );
}

export async function handleBooking(
    session: Session,
    userMessage: string,
    send: SendFunc,
) {
    return sendText(session.id, send, "Booking flow not implemented yet.");
}
