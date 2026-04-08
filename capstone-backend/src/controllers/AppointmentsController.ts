import type { Request, Response, NextFunction } from "express";
import { AppointmentService } from "../services/AppointmentService.ts";

export class AppointmentController {
    constructor(private service: AppointmentService) {}

    getAllAppointments = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const appointments = await this.service.getAllAppointments();
            console.log(appointments);
            res.json(appointments);
        } catch (err) {
            next(err);
        }
    };
}
