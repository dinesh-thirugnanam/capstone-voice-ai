import { Router } from "express";
import { v4 as uuid } from "uuid";
import { pool } from "../db";

const router = Router();

/* EVENTS TABLE MESSAGE */

router.get("/events", async (_, res) => {
    const { rows } = await pool.query(`
    SELECT title, event_date, location, organizer
    FROM college_event
    ORDER BY event_date
    LIMIT 10
  `);

    const message = {
        id: uuid(),
        role: "assistant",
        type: "table",
        columns: ["Event", "Date", "Location", "Organizer"],
        rows: rows.map((e) => [
            e.title,
            new Date(e.event_date).toLocaleString(),
            e.location ?? "-",
            e.organizer ?? "-",
        ]),
    };

    res.json(message);
});

router.get("/appointments", async (_, res) => {
    const { rows } = await pool.query(`
    SELECT
      availability_slot.id,
      availability_slot.start_time,
      users.name
    FROM availability_slot
    JOIN users
      ON users.id = availability_slot.counsellor_id
    WHERE availability_slot.is_booked = false
    ORDER BY availability_slot.start_time
  `);

    res.json({
        id: "mock_appt",
        role: "assistant",
        type: "appointments",
        slots: rows.map((r) => ({
            id: r.id,
            counsellor: r.name,
            time: r.start_time,
        })),
    });
});

export default router;
