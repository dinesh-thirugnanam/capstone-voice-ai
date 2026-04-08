import type { Request, Response, NextFunction } from "express";
import { EventService } from "../services/EventService.ts";

export class EventsController {
    constructor(private service: EventService) {}

    getAllEvents = async (
        _: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const events = await this.service.getAllEvents();
            res.json(events);
        } catch (err) {
            next(err);
        }
    };

    createEvent = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const event = await this.service.createEvent(req.body);
            res.json(event);
        } catch (err) {
            next(err);
        }
    };

    deleteEvent = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const result = await this.service.deleteEvent(id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };
}
