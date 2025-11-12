import express from "express";
//import accountRoutes from "./routes/account.routes.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/user/manager_profile/profile.routes.js";
import meRoutes from "./routes/me.routes.js";
import categoryRouter from "./routes/admin/category.routes.js";
import subCategoryRouter from "./routes/admin/subCategory.routes.js";
import productRouter from "./routes/admin/product.routes.js";
import productVariantRouter from "./routes/admin/productVariant.routes.js";
// import newArrivalsRouter from "./routes/user/newArrivals.routes.js";
import cartRouter from "./routes/user/manager_profile/cart.routes.js";
import wishlistRouter from "./routes/user/wishlist.routes.js";
import adminVoucherRouter from "./routes/admin/voucher.routes.js";
import userVoucherRouter from "./routes/user/voucher.routes.js";
import adminOrderRouter from "./routes/admin/order.routes.js";
import userOrderRouter from "./routes/user/manager_profile/userorder.routes.js";


import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { responseTimeMiddleware } from "./middlewares/responseTime.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import passport from "passport"; 
import "./config/passport.js";
import {authMiddleware} from "./middlewares/auth.middleware.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.static("public"));

app.use(cookieParser()); 

const allowedOrigins = [
  process.env.FRONTEND_URL_USER,   
  process.env.FRONTEND_URL_ADMIN,  
];

app.use(cors({
  origin: function (origin, callback) {
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Không được phép truy cập bởi CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(loggerMiddleware);
app.use(responseTimeMiddleware);
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/",authMiddleware(["User","Admin"]), meRoutes);
// admin routes
app.use("/category", authMiddleware(["Admin"]), categoryRouter);
app.use("/subcategory", authMiddleware(["Admin"]), subCategoryRouter);
app.use("/product", authMiddleware(["Admin"]), productRouter);
app.use("/product-variant", authMiddleware(["Admin"]), productVariantRouter);
app.use("/voucher", authMiddleware(["Admin"]), adminVoucherRouter);
app.use("/admin/orders", authMiddleware(["Admin"]), adminOrderRouter);

// user routes
app.use("/manager-profile",authMiddleware(["User","Admin"]), profileRoutes);
app.use("/cart",authMiddleware(["User","Admin"]), cartRouter);
app.use("/wishlist",authMiddleware(["User","Admin"]), wishlistRouter);
// app.use("/new-arrivals",authMiddleware(["User","Admin"]), newArrivalsRouter);
app.use("/user-voucher",authMiddleware(["User","Admin"]), userVoucherRouter);
app.use("/uOrder",authMiddleware(["User","Admin"]), userOrderRouter);
app.use(errorMiddleware);

export default app;
