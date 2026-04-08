import { Router } from "express";
import { pool } from "../db";
import { v4 as uuid } from "uuid";

const router = Router();

/* GET appointments */

router.get("/", async (_, res) => {
    const { rows } = await pool.query(`
    SELECT
      appointment.*,
      availability_slot.start_time,
      availability_slot.end_time,
      users.name as counsellor
    FROM appointment
    JOIN availability_slot
      ON availability_slot.id = appointment.slot_id
    JOIN users
      ON users.id = availability_slot.counsellor_id
    ORDER BY start_time
  `);

    res.json(rows);
});

/* UPDATE appointment status */

router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const { rows } = await pool.query(
        `
    UPDATE appointment
    SET status=$1
    WHERE id=$2
    RETURNING *
    `,
        [status, id],
    );

    res.json(rows[0]);
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

router.post("/book", async (req, res) => {
    const { slot_id, student_name, student_email } = req.body;

    if (!slot_id) {
        return res.status(400).json({ error: "slot_id required" });
    }

    const id = uuid();

    await pool.query(
        `
    INSERT INTO appointment
    (id, slot_id, student_name, student_email)
    VALUES ($1,$2,$3,$4)
    `,
        [id, slot_id, student_name, student_email],
    );

    await pool.query(
        `
    UPDATE availability_slot
    SET is_booked = true
    WHERE id = $1
    `,
        [slot_id],
    );

    res.json({ success: true });
});

router.get("/user/:id", async (req, res) => {
    const { id } = req.params;

    const { rows } = await pool.query(
        `
    SELECT
      appointment.id,
      appointment.student_name,
      appointment.student_email,
      availability_slot.start_time,
      availability_slot.end_time
    FROM appointment
    JOIN availability_slot
      ON availability_slot.id = appointment.slot_id
    WHERE availability_slot.counsellor_id = $1
    ORDER BY availability_slot.start_time
    `,
        [id],
    );

    res.json(rows);
});

export default router;
