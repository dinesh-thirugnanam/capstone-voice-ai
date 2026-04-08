import type { Request, Response, NextFunction } from "express";
import { MockService } from "../services/MockService.ts";
import { v4 as uuid } from "uuid";

export class MockController {
    constructor(private service: MockService) {}

    events = async (
        _: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const rows = await this.service.getEventTable();

            const message = {
                id: uuid(),
                role: "assistant",
                type: "table",
                columns: ["Event", "Date", "Location", "Organizer"],
                rows: (rows || []).map((e: any) => [
                    e.title,
                    new Date(e.event_date).toLocaleString(),
                    e.location ?? "-",
                    e.organizer ?? "-",
                ]),
            };

            res.json(message);
        } catch (err) {
            next(err);
        }
    };

    appointments = async (
        _: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const rows = await this.service.getAvailableAppointments();

            res.json({
                id: "mock_appt",
                role: "assistant",
                type: "appointments",
                slots: (rows || []).map((r: any) => ({
                    id: r.id,
                    counsellor: r.users?.name ?? r.name ?? r.counsellor_id,
                    time: r.start_time,
                })),
            });
        } catch (err) {
            next(err);
        }
    };
}
