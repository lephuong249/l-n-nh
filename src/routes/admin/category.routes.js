import { Router } from "express";
import {categoryController} from "../../modules/admin/category/category.controller.js";
import { validateQuery, paginationSchema } from "../../validators/queryValidator.js";

const router = Router();
const controller = new categoryController();

router.post("/create", controller.create.bind(controller));
router.patch("/update/:id", controller.update.bind(controller));
router.delete("/delete/:id", controller.delete.bind(controller));
router.get("/all",validateQuery(paginationSchema), controller.getAll.bind(controller));
export default router;
