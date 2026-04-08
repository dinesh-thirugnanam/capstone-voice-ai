import { Router } from "express";
import { v4 as uuid } from "uuid";
import { pool } from "../db";

const router = Router();

/* GET events */

router.get("/", async (_, res) => {
    const { rows } = await pool.query(`
    SELECT
      id,
      title,
      description,
      event_date,
      location,
      organizer
    FROM college_event
    ORDER BY event_date
  `);

    res.json(rows);
});

/* CREATE event */

router.post("/", async (req, res) => {
    const { title, description, event_date, location, organizer } = req.body;

    const id = uuid();

    const { rows } = await pool.query(
        `
    INSERT INTO college_event
    (id, title, description, event_date, location, organizer)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
    `,
        [id, title, description, event_date, location, organizer],
    );

    res.json(rows[0]);
});

/* DELETE event */

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    await pool.query("DELETE FROM college_event WHERE id=$1", [id]);

    res.json({ success: true });
});

export default router;
