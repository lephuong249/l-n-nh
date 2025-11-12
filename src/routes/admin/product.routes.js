import { Router } from "express";
import {productController} from "../../modules/admin/product/product.controller.js";
import { upload } from "../../middlewares/upload.middleware.js";
import { validateQuery, paginationSchema } from "../../validators/queryValidator.js";

const router = Router();
const controller = new productController();

router.post("/create/:id",upload.single("file") ,controller.create.bind(controller));
router.patch("/update/:id",upload.single("file") ,controller.update.bind(controller));
router.delete("/delete/:id", controller.delete.bind(controller));
router.get("/categories-subcategories", controller.getAllCategoryAndSubcategory.bind(controller));
router.get("/all",validateQuery(paginationSchema), controller.getAll.bind(controller));

export default router;