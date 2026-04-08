import type { Request, Response, NextFunction } from "express";
import { SessionService } from "../services/SessionService.ts";

export class SessionController {
    constructor(private service: SessionService) {}

    start = async (
        _: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const result = await this.service.startSession();
            res.json(result);
        } catch (err) {
            next(err);
        }
    };
}
