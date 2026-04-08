import type { Request, Response, NextFunction } from "express";
import { UserService } from "../services/UserService.ts";

export class UsersController {
    constructor(private service: UserService) {}

    getAllUsers = async (
        _: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const users = await this.service.getAllUsers();
            res.json(users);
        } catch (err) {
            next(err);
        }
    };

    createUser = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const user = await this.service.createUser(req.body);
            res.json(user);
        } catch (err) {
            next(err);
        }
    };

    updateUser = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const user = await this.service.updateUser(id, req.body);
            res.json(user);
        } catch (err) {
            next(err);
        }
    };

    deleteUser = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const result = await this.service.deleteUser(id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };
}
