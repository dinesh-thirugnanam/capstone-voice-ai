import { pool } from "../db";

export async function routeTool(message: string) {
    const text = message.toLowerCase();

    if (
        text.includes("event") ||
        text.includes("workshop") ||
        text.includes("hackathon")
    ) {
        return getEvents();
    }

    return null;
}

async function getEvents() {
    const { rows } = await pool.query(`
    SELECT
      title,
      event_date,
      location,
      organizer
    FROM college_event
    ORDER BY event_date
    LIMIT 10
  `);

    return {
        type: "table",
        columns: ["Title", "Date", "Location", "Organizer"],
        rows: rows.map((e) => [
            e.title,
            new Date(e.event_date).toLocaleString(),
            e.location ?? "-",
            e.organizer ?? "-",
        ]),
    };
}
