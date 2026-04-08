import type { Request, Response, NextFunction } from "express";
import { SlotService } from "../services/SlotService.ts";

export class SlotsController {
    constructor(private service: SlotService) {}

    getAllSlots = async (
        _: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const slots = await this.service.getAllSlots();
            res.json(slots);
        } catch (err) {
            next(err);
        }
    };

    createSlot = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const slot = await this.service.createSlot(req.body);
            res.json(slot);
        } catch (err) {
            next(err);
        }
    };

    deleteSlot = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const result = await this.service.deleteSlot(id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    getSlotsByUser = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const slots = await this.service.getSlotsByUser(id);
            res.json(slots);
        } catch (err) {
            next(err);
        }
    };
}
