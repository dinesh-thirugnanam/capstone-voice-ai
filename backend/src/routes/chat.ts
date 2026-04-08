import express from "express";
import { pool } from "../db";
import { classifyIntent } from "../llm/classifier";
import { extractOption } from "../llm/gemini";
import { generateExploratoryResponse, generateExploratoryResponseWithMemory } from "../llm/generator";
import { detectEmotionalDepth } from "../llm/depthClassifier";

const router = express.Router();

/* ============================= */
/* ===== Utility Functions ===== */
/* ============================= */

async function getSession(id: string) {
  const result = await pool.query(
    "SELECT * FROM conversation_session WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

async function updateState(
  id: string,
  newState: string,
  newMode?: string
) {
  if (newMode) {
    await pool.query(
      `
      UPDATE conversation_session
      SET current_state = $1,
          mode = $2
      WHERE id = $3
      `,
      [newState, newMode, id]
    );
  } else {
    await pool.query(
      `
      UPDATE conversation_session
      SET current_state = $1
      WHERE id = $2
      `,
      [newState, id]
    );
  }
}

async function getNextPHQ2Question(sessionId: string) {
  const result = await pool.query(
    `
    SELECT sq.*
    FROM screening_question sq
    WHERE sq.tool_name = 'PHQ2'
    AND sq.id NOT IN (
      SELECT question_id
      FROM screening_response
      WHERE session_id = $1
    )
    ORDER BY sq.order_index
    LIMIT 1
    `,
    [sessionId]
  );

  return result.rows[0];
}

async function calculatePHQ2Score(sessionId: string) {
  const result = await pool.query(
    `
    SELECT sum(sr.response_value) as total
    FROM screening_response sr
    JOIN screening_question sq ON sr.question_id = sq.id
    WHERE sr.session_id = $1
    AND sq.tool_name = 'PHQ2'
    `,
    [sessionId]
  );

  return parseInt(result.rows[0].total) || 0;
}

function simpleYesNo(text: string) {
  const msg = text.toLowerCase();

  if (
    msg.includes("yes") ||
    msg.includes("sure") ||
    msg.includes("okay") ||
    msg.includes("ok")
  ) return "YES";

  if (
    msg.includes("no") ||
    msg.includes("not now")
  ) return "NO";

  return "UNKNOWN";
}

/* ============================= */
/* ===== Main Chat Route ======= */
/* ============================= */

router.post("/:id", async (req, res) => {
  const { id } = req.params;
  const { userMessage } = req.body;

  try {
    const session = await getSession(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    switch (session.current_state) {

      case "GENERAL_MODE":
        return handleGeneral(session, userMessage, res);

      case "CONSENT_REQUESTED":
        return handleConsent(session, userMessage, res);

      case "MENTAL_WARMUP":
        return handleWarmup(session, userMessage, res);

      case "EXPLORATORY":
        return handleExploratory(session, userMessage, res);

      case "READINESS_CHECK":
        return handleReadiness(session, userMessage, res);

      case "SCREENING":
        return handleScreening(session, userMessage, res);

      case "ESCALATION_OFFERED":
        return handleEscalation(session, userMessage, res);

      case "POST_SCREENING":
        return handlePostScreening(session, userMessage, res);

      case "BOOKING":
        return handleBooking(session, userMessage, res);
      
      case "SESSION_CLOSED":
        return res.json({
          assistantMessage:
            "This session has ended. You can start a new one anytime.",
          state: "SESSION_CLOSED"
  });


      default:
        return res.json({
          assistantMessage: "Session closed.",
          state: session.current_state
        });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chat failed" });
  }
});

/* ============================= */
/* ===== State Handlers ======== */
/* ============================= */

async function handleGeneral(session: any, userMessage: string, res: any) {

  if (!userMessage) {
    return res.json({
      assistantMessage: "Hi. How can I help you today?",
      state: session.current_state
    });
  }

  const intent = await classifyIntent(userMessage);

  if (intent === "MENTAL_HEALTH") {
    await updateState(session.id, "CONSENT_REQUESTED", "MENTAL");

    return res.json({
      assistantMessage:
        "It sounds like you're going through something. Would you like to talk about it?",
      state: "CONSENT_REQUESTED"
    });
  }

if (intent === "COLLEGE_QUERY") {
  return res.json({
    assistantMessage:
      "I can help with college information. What would you like to know?",
    state: "GENERAL_MODE"
  });
}

if (intent === "OTHER") {
  return res.json({
    assistantMessage:
      "I'm here to listen. Are you thinking about something that's been on your mind?",
    state: "GENERAL_MODE"
  });
}

return res.json({
  assistantMessage:
    "Could you tell me a bit more?",
  state: session.current_state
});

}

async function handleConsent(session: any, userMessage: string, res: any) {

  const intent = simpleYesNo(userMessage);

  if (intent === "YES") {
    await updateState(session.id, "MENTAL_WARMUP");

    return res.json({
      assistantMessage:
        "Thank you for trusting me. Tell me what's been happening.",
      state: "MENTAL_WARMUP"
    });
  }

  await updateState(session.id, "GENERAL_MODE", "GENERAL");

  return res.json({
    assistantMessage:
      "That's completely fine. How else can I help?",
    state: "GENERAL_MODE"
  });
}

async function handleWarmup(session: any, userMessage: string, res: any) {

  await updateState(session.id, "EXPLORATORY");

  return res.json({
    assistantMessage: "I'm listening. Take your time.",
    state: "EXPLORATORY"
  });
}


async function handleExploratory(session: any, userMessage: string, res: any) {

  // 1️⃣ Get existing memory
  const memory = session.exploratory_memory || [];

  // 2️⃣ Append user message
  const updatedMemory = [
    ...memory,
    { role: "user", content: userMessage }
  ].slice(-6); // keep last 6 turns max

  // 3️⃣ Detect emotional depth
  const depth = await detectEmotionalDepth(userMessage);

  await pool.query(
    `
    UPDATE conversation_session
    SET exploratory_turns = exploratory_turns + 1,
        emotional_score = emotional_score + $1,
        exploratory_memory = $2
    WHERE id = $3
    `,
    [depth, JSON.stringify(updatedMemory), session.id]
  );

  const refreshed = await getSession(session.id);

  const pivot =
    refreshed.exploratory_turns >= 3 &&
    refreshed.emotional_score >= 3;

  const response = await generateExploratoryResponseWithMemory(
    updatedMemory,
    pivot
  );



  // 4️⃣ Append assistant reply to memory
  const finalMemory = [
    ...updatedMemory,
    { role: "assistant", content: response }
  ].slice(-6);

  await pool.query(
    `
    UPDATE conversation_session
    SET exploratory_memory = $1
    WHERE id = $2
    `,
    [JSON.stringify(finalMemory), session.id]
  );

  if (pivot) {
    await pool.query(
    `UPDATE conversation_session SET exploratory_memory = '[]' WHERE id = $1`,
    [session.id]);

    await updateState(session.id, "READINESS_CHECK");
    return res.json({
      assistantMessage: response,
      state: "READINESS_CHECK"
    });
  }

  return res.json({
    assistantMessage: response,
    state: "EXPLORATORY"
  });
}





async function handleReadiness(session: any, userMessage: string, res: any) {

  const intent = simpleYesNo(userMessage);

  if (intent === "YES") {
    await updateState(session.id, "SCREENING");

    const firstQuestion = await getNextPHQ2Question(session.id);

    return res.json({
      assistantMessage: firstQuestion.question_text,
      state: "SCREENING"
    });
  }

  await updateState(session.id, "POST_SCREENING");

  return res.json({
    assistantMessage:
      "That's okay. If you'd like support later, I'm here.",
    state: "POST_SCREENING"
  });
}

async function handleScreening(session: any, userMessage: string, res: any) {

  const question = await getNextPHQ2Question(session.id);

  if (!question) {
    await updateState(session.id, "POST_SCREENING");

    return res.json({
      assistantMessage:
        "Thank you for answering. If you'd like to talk to someone, I can help.",
      state: "POST_SCREENING"
    });
  }

  const extracted = await extractOption(
    question.question_text,
    userMessage
  );

  if (
    extracted.selected_option === null ||
    extracted.confidence < 0.6
  ) {
    return res.json({
    assistantMessage:
    "I just need to match that to one of these options: Not at all, Several days, More than half the days, or Nearly every day. Which fits best?",
    clarification: true
});

  }

  await pool.query(
    `
    INSERT INTO screening_response
    (session_id, question_id, response_value)
    VALUES ($1, $2, $3)
    `,
    [session.id, question.id, extracted.selected_option]
  );

  const totalScore = await calculatePHQ2Score(session.id);

  if (totalScore >= 3) {
    await updateState(session.id, "ESCALATION_OFFERED");

    return res.json({
      assistantMessage:
        "Based on your responses, it may help to speak with a counsellor. Would you like to book an appointment?",
      state: "ESCALATION_OFFERED",
      totalScore
    });
  }

  const next = await getNextPHQ2Question(session.id);

  if (next) {
    return res.json({
      assistantMessage: next.question_text,
      state: "SCREENING"
    });
  }

  await updateState(session.id, "POST_SCREENING");

  return res.json({
    assistantMessage:
      "Thank you for answering. If you'd like to talk to someone, I can help.",
    state: "POST_SCREENING",
    totalScore
  });
}

async function handleEscalation(session: any, userMessage: string, res: any) {

  const intent = simpleYesNo(userMessage);

  if (intent === "YES") {
    await updateState(session.id, "BOOKING");

    return res.json({
      assistantMessage:
        "Please provide your name and email to book an appointment.",
      state: "BOOKING"
    });
  }

  await updateState(session.id, "POST_SCREENING");

  return res.json({
    assistantMessage:
      "That's okay. If you change your mind, I'm here.",
    state: "POST_SCREENING"
  });
}

async function handlePostScreening(session: any, userMessage: string, res: any) {

  const intent = simpleYesNo(userMessage);

  if (intent === "YES") {
    await updateState(session.id, "BOOKING");

    return res.json({
      assistantMessage:
        "Sure. Please provide your name and email.",
      state: "BOOKING"
    });
  }

  if (intent === "NO") {
    await updateState(session.id, "SESSION_CLOSED");

    return res.json({
      assistantMessage:
        "Thank you for sharing today. Take care.",
      state: "SESSION_CLOSED"
    });
  }

  return res.json({
    assistantMessage:
      "If you'd like to talk to someone, I can help you book a session.",
    state: "POST_SCREENING"
  });
}


async function handleBooking(session: any, userMessage: string, res: any) {

  return res.json({
    assistantMessage:
      "Booking flow not implemented yet.",
    state: "BOOKING"
  });
}

export default router;
