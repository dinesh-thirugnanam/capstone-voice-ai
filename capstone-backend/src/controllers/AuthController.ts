import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService.ts";

export class AuthController {
    constructor(private service: AuthService) {}

    login = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { email, password } = req.body;
            const user = await this.service.login(email, password);
            if (!user) {
                res.status(401).json({ error: "Invalid credentials" });
                return;
            }
            res.json(user);
        } catch (err) {
            next(err);
        }
    };
}
