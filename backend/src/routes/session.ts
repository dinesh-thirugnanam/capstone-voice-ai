// import express from "express";
// import { v4 as uuidv4 } from "uuid";
// import { pool } from "../db";
// import { transition } from "../orchestrator/stateMachine";
// import { extractOption } from "../llm/gemini";

// const router = express.Router();
// router.post("/start", async (req, res) => {
//     const id = uuidv4();

//     try{
//         await pool.query(`
//             INSERT INTO conversation_session (id, mode, current_state, risk_level)
//             VALUES ($1, $2, $3, $4)
//             `,
//             [id, "GENERAL", "GENERAL_MODE", "LOW"]
//         );

//         const result = await pool.query(`
//             SELECT * FROM conversation_session WHERE id = $1
//             `, [id]);

//         res.json(result.rows[0]);
//     } catch(err) {
//         console.error(err);
//         res.status(500).json({error: "Failed to create session"});
//     }
// });

// router.post("/:id/event", async (req, res) => {
//   const { id } = req.params;
//   const { event } = req.body;

//   try {
//     const result = await pool.query(
//       "SELECT * FROM conversation_session WHERE id = $1",
//       [id]
//     );

//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: "Session not found" });
//     }

//     const session = result.rows[0];

//     const { newState, newRisk } = transition(
//       session.current_state,
//       event,
//       session.risk_level
//     );

//     const updated = await pool.query(
//       `
//       UPDATE conversation_session
//       SET current_state = $1,
//           risk_level = $2
//       WHERE id = $3
//       RETURNING *
//       `,
//       [newState, newRisk, id]
//     );

//     res.json(updated.rows[0]);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Transition failed" });
//   }
// });

// router.get("/:id/screening/next", async (req, res) => {
//   const { id } = req.params;

//   try {
//     // Count already answered PHQ2 questions
//     const answered = await pool.query(
//       `
//       SELECT count(*)
//       FROM screening_response sr
//       JOIN screening_question sq ON sr.question_id = sq.id
//       WHERE sr.session_id = $1 AND sq.tool_name = 'PHQ2'
//       `,
//       [id]
//     );

//     const count = parseInt(answered.rows[0].count);

//     if (count >= 2) {
//       return res.json({ message: "SCREENING_COMPLETE" });
//     }

//     const next = await pool.query(
//       `
//       SELECT * FROM screening_question
//       WHERE tool_name = 'PHQ2'
//       AND order_index = $1
//       `,
//       [count + 1]
//     );

//     res.json(next.rows[0]);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch question" });
//   }
// });

// router.post("/:id/screening/answer", async (req, res) => {
//   const { id } = req.params;
//   const { questionId, responseValue } = req.body;

//   try {
//     await pool.query(
//       `
//       INSERT INTO screening_response
//       (session_id, question_id, response_value)
//       VALUES ($1, $2, $3)
//       `,
//       [id, questionId, responseValue]
//     );

//     // Check if PHQ2 complete
//     const result = await pool.query(
//       `
//       SELECT sum(sr.response_value) as total
//       FROM screening_response sr
//       JOIN screening_question sq ON sr.question_id = sq.id
//       WHERE sr.session_id = $1
//       AND sq.tool_name = 'PHQ2'
//       `,
//       [id]
//     );

//     const totalScore = parseInt(result.rows[0].total) || 0;

//     if (totalScore >= 3) {
//       await pool.query(
//         `
//         UPDATE conversation_session
//         SET risk_level = 'HIGH',
//             current_state = 'ESCALATION_OFFERED'
//         WHERE id = $1
//         `,
//         [id]
//       );
//     }

//     if (totalScore <= 2) {
//       await pool.query(
//         `
//         UPDATE conversation_session
//         SET current_state = 'POST_SCREENING'
//         WHERE id = $1
//         `,
//         [id]
//       );
//     }

//     // Upsert tool score
//     await pool.query(
//       `
//       INSERT INTO tool_score (session_id, tool_name, total_score, severity_level)
//       VALUES ($1, 'PHQ2', $2,
//         CASE
//           WHEN $2 >= 3 THEN 'HIGH'
//           ELSE 'LOW'
//         END
//       )
//       ON CONFLICT DO NOTHING
//       `,
//       [id, totalScore]
//     );

//     res.json({ totalScore });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to save response" });
//   }
// });

// router.post("/:id/screening/extract", async (req, res) => {
//   const { id } = req.params;
//   const { userMessage } = req.body;

//   try {
//     // 1. Get next PHQ2 question
//     const question = await pool.query(`
//       SELECT sq.*
//       FROM screening_question sq
//       WHERE sq.tool_name = 'PHQ2'
//       AND sq.id NOT IN (
//         SELECT question_id FROM screening_response
//         WHERE session_id = $1
//       )
//       ORDER BY sq.order_index
//       LIMIT 1
//     `, [id]);

//     if (question.rowCount === 0) {
//       return res.json({ message: "SCREENING_COMPLETE" });
//     }

//     const q = question.rows[0];

//     // 2. Extract
//     const extracted = await extractOption(q.question_text, userMessage);

//     if (extracted.selected_option === null || extracted.confidence < 0.6) {
//       return res.json({
//         clarification: true,
//         message: "Could you choose one of: Not at all, Several days, More than half the days, Nearly every day?"
//       });
//     }

//     // 3. Store response
//     await pool.query(`
//       INSERT INTO screening_response
//       (session_id, question_id, response_value)
//       VALUES ($1, $2, $3)
//     `, [id, q.id, extracted.selected_option]);

//     // 4. Recalculate score
//     const result = await pool.query(`
//       SELECT sum(sr.response_value) as total
//       FROM screening_response sr
//       JOIN screening_question sq ON sr.question_id = sq.id
//       WHERE sr.session_id = $1
//       AND sq.tool_name = 'PHQ2'
//     `, [id]);

//     const totalScore = parseInt(result.rows[0].total) || 0;

//     // 5. Transition logic
//     if (totalScore >= 3) {
//       await pool.query(`
//         UPDATE conversation_session
//         SET risk_level = 'HIGH',
//             current_state = 'ESCALATION_OFFERED'
//         WHERE id = $1
//       `, [id]);
//     }

//     res.json({
//       stored: true,
//       totalScore
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Extraction failed" });
//   }
// });

// export default router;

import { Router } from "express";
import { v4 as uuid } from "uuid";

const router = Router();

router.post("/", async (req, res) => {
    const sessionId = uuid();

    // TODO: store session in DB later

    return res.json({
        sessionId,
    });
});

export default router;
