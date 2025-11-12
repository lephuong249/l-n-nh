import { Router } from "express";
import {ProfileController} from "../../../modules/user/manager_profile/profile/profile.controller.js";

const router= Router();
const controller = new ProfileController();

router.get("/profile", controller.getProfile.bind(controller));
router.patch("/profile", controller.updateProfile.bind(controller));
router.post("/profile", controller.sendMailResetPassword.bind(controller));

export default router;