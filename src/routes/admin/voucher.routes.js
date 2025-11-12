import { Router } from "express";
import { voucherController } from "../../modules/admin/voucher/voucher.controller.js";
import { validateQuery, paginationSchema } from "../../validators/queryValidator.js";

const router = Router();
const controller = new voucherController();

router.post("/create", controller.create.bind(controller));
router.patch("/update/:id", controller.update.bind(controller));
router.delete("/delete/:id", controller.delete.bind(controller));
router.get("/all", validateQuery(paginationSchema), controller.getAll.bind(controller));
router.get("/stats/:id", controller.getVoucherStats.bind(controller));

export default router;

