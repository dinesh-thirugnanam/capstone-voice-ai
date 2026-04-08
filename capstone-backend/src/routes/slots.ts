import { Router } from "express";
import { v4 as uuid } from "uuid";
import { SlotsController } from "../controllers/SlotsController.ts";
import { SlotService } from "../services/SlotService.ts";

const service = new SlotService();
const controller = new SlotsController(service);

const router = Router();

router.get("/", controller.getAllSlots);
router.post("/", async (req, res, next) => {
    const id = uuid();
    req.body.id = id;
    return controller.createSlot(req, res, next);
});
router.delete("/:id", controller.deleteSlot);
router.get("/user/:id", controller.getSlotsByUser);

export default router;
