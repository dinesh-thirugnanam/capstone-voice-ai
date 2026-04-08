import { Router } from "express";
import { AppointmentController } from "../controllers/AppointmentsController.ts";
import { AppointmentService } from "../services/AppointmentService.ts";

const service = new AppointmentService();
const controller = new AppointmentController(service);

const router = Router();

router.get("/", controller.getAllAppointments);

export default router;
