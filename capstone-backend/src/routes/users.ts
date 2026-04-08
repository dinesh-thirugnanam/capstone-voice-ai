import { Router } from "express";
import { v4 as uuid } from "uuid";
import { UsersController } from "../controllers/UsersController.ts";
import { UserService } from "../services/UserService.ts";

const service = new UserService();
const controller = new UsersController(service);

const router = Router();

router.get("/", controller.getAllUsers);
router.post("/", async (req, res, next) => {
    // ensuring id provided like old backend
    const id = uuid();
    req.body.id = id;
    return controller.createUser(req, res, next);
});
router.patch("/:id", controller.updateUser);
router.delete("/:id", controller.deleteUser);

export default router;
