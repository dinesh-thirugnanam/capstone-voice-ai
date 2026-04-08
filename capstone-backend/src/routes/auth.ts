import { Router } from "express";
import { AuthController } from "../controllers/AuthController.ts";
import { AuthService } from "../services/AuthService.ts";

const service = new AuthService();
const controller = new AuthController(service);

const router = Router();

router.post("/login", controller.login);

export default router;
