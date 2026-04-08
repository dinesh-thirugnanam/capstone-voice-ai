import { Router } from "express";
import { v4 as uuid } from "uuid";
import { pool } from "../db";

const router = Router();

/* GET slots */

router.get("/", async (_, res) => {
    const { rows } = await pool.query(`
    SELECT
      availability_slot.*,
      users.name
    FROM availability_slot
    JOIN users
    ON users.id = availability_slot.counsellor_id
    ORDER BY start_time
  `);

    res.json(rows);
});

/* CREATE slot */

router.post("/", async (req, res) => {
    const { counsellor_id, start_time, end_time } = req.body;

    if (!counsellor_id) {
        return res.status(400).json({
            error: "counsellor_id is required",
        });
    }

    const id = uuid();

    const { rows } = await pool.query(
        `
    INSERT INTO availability_slot
    (id, counsellor_id, start_time, end_time)
    VALUES ($1,$2,$3,$4)
    RETURNING *
    `,
        [id, counsellor_id, start_time, end_time],
    );

    res.json(rows[0]);
});

/* DELETE slot */

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    await pool.query("DELETE FROM availability_slot WHERE id=$1", [id]);

    res.json({ success: true });
});

router.get("/user/:id", async (req, res) => {
    const { id } = req.params;

    const { rows } = await pool.query(
        `
    SELECT *
    FROM availability_slot
    WHERE counsellor_id = $1
    ORDER BY start_time
  `,
        [id],
    );

    res.json(rows);
});

export default router;
