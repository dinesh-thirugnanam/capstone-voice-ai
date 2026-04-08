import { Router } from "express";
import { MockController } from "../controllers/MockController.ts";
import { MockService } from "../services/MockService.ts";

const service = new MockService();
const controller = new MockController(service);

const router = Router();

router.get("/events", controller.events);
router.get("/appointments", controller.appointments);

export default router;
