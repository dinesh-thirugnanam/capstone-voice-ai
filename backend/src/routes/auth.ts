import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const { rows } = await pool.query(
        `
    SELECT id,name,email,role
    FROM users
    WHERE email=$1 AND password=$2
    `,
        [email, password],
    );

    if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json(rows[0]);
});

export default router;
