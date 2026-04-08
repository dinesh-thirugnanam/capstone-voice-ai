import { Router } from "express";
import { v4 as uuid } from "uuid";
import { pool } from "../db";

const router = Router();

/* GET all users */

router.get("/", async (_, res) => {
    const { rows } = await pool.query(
        "SELECT * FROM users ORDER BY created_at DESC",
    );

    res.json(rows);
});

/* CREATE user */

router.post("/", async (req, res) => {
    const { name, email, role } = req.body;

    const id = uuid();

    const { rows } = await pool.query(
        `
    INSERT INTO users (id, name, email, role)
    VALUES ($1,$2,$3,$4)
    RETURNING *
    `,
        [id, name, email, role],
    );

    res.json(rows[0]);
});

/* UPDATE user */

router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, role, is_active } = req.body;

    const { rows } = await pool.query(
        `
    UPDATE users
    SET name=$1,
        email=$2,
        role=$3,
        is_active=$4
    WHERE id=$5
    RETURNING *
    `,
        [name, email, role, is_active, id],
    );

    res.json(rows[0]);
});

/* DELETE user */

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    await pool.query("DELETE FROM users WHERE id=$1", [id]);

    res.json({ success: true });
});

export default router;
