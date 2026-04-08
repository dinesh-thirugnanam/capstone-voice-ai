import { Router } from "express";
import { v4 as uuid } from "uuid";
import { EventsController } from "../controllers/EventsController.ts";
import { EventService } from "../services/EventService.ts";

const service = new EventService();
const controller = new EventsController(service);

const router = Router();

router.get("/", controller.getAllEvents);
router.post("/", async (req, res, next) => {
    const id = uuid();
    req.body.id = id;
    return controller.createEvent(req, res, next);
});
router.delete("/:id", controller.deleteEvent);

export default router;
