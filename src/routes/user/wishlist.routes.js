import { Router } from "express";
import {WishlistController} from "../../modules/user/wishlist/wishlist.controller.js";

const router=Router();
const controller = new WishlistController();

router.post("/:productVariantId", controller.addToWishlist.bind(controller));
router.delete("/:productVariantId", controller.removeFromWishlist.bind(controller));
router.delete("/", controller.deleteAll.bind(controller));
router.get("/", controller.getAll.bind(controller));
export default router;