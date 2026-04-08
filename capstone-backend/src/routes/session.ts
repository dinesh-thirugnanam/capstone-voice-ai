import { Router } from "express";
import { SessionController } from "../controllers/SessionController.ts";
import { SessionService } from "../services/SessionService.ts";

const service = new SessionService();
const controller = new SessionController(service);

const router = Router();

router.post("/", controller.start);

export default router;
