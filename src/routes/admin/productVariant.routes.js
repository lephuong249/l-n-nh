import { Router } from "express";
import {productVariantController} from "../../modules/admin/productVariant/productVariant.controller.js";
import { upload } from "../../middlewares/upload.middleware.js";
import { validateQuery, paginationSchema } from "../../validators/queryValidator.js";

const router = Router();
const controller = new productVariantController();

router.post("/create/:id",upload.single("variantImageUrl") ,controller.create.bind(controller));
router.patch("/update/:id",upload.single("variantImageUrl") ,controller.update.bind(controller));
router.delete("/delete/:id", controller.delete.bind(controller));
router.get("/all/:productId",validateQuery(paginationSchema), controller.getAll.bind(controller));

export default router;