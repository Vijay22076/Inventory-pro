import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/error.middleware.js";
import { ApiError } from "./utils/ApiError.js";

const app = express();

const allowedOrigins = [
    "https://inventorypro-ims.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow non-browser requests (Postman, mobile apps, healthchecks)
            if (!origin) return callback(null, true);

            const isAllowed =
                allowedOrigins.includes(origin) ||
                origin.endsWith(".vercel.app") ||
                (process.env.NODE_ENV !== "production" &&
                    (origin.includes("localhost") || origin.includes("127.0.0.1")));

            if (isAllowed) {
                callback(null, true);
            } else {
                console.log("Blocked by CORS:", origin);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(
    express.json({
        limit: "16kb",
        verify: (req, res, buf) => {
            req.rawBody = buf;
        },
    })
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import categoryRouter from "./routes/category.routes.js";
import customerRouter from "./routes/customer.routes.js";
import supplierRouter from "./routes/supplier.routes.js";
import unitRouter from "./routes/unit.routes.js";
import productRouter from "./routes/product.routes.js";
import purchaseRouter from "./routes/purchase.routes.js";
import orderRouter from "./routes/order.routes.js";
import reportRouter from "./routes/report.routes.js";
import schedulerRouter from "./routes/scheduler.routes.js";
import warehouseRouter from "./routes/warehouse.routes.js";
import transferRouter from "./routes/transfer.routes.js";
import adjustmentRouter from "./routes/adjustment.routes.js";
import ledgerRouter from "./routes/ledger.routes.js";
import returnRouter from "./routes/return.routes.js";
import paymentRouter from "./routes/payment.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/suppliers", supplierRouter);
app.use("/api/v1/units", unitRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/purchases", purchaseRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/scheduler", schedulerRouter);
app.use("/api/v1/warehouses", warehouseRouter);
app.use("/api/v1/transfers", transferRouter);
app.use("/api/v1/adjustments", adjustmentRouter);
app.use("/api/v1/stock-ledger", ledgerRouter);
app.use("/api/v1/returns", returnRouter);
app.use("/api/v1/payments", paymentRouter);

/**
   ___________________________ :: API Documentation :: ___________________________

 * users
    API : http://localhost:3001/api/v1/users/register - POST
    API : http://localhost:3001/api/v1/users/login - POST
    API : http://localhost:3001/api/v1/users/logout - POST
    API : http://localhost:3001/api/v1/users/refresh-token - POST
    API : http://localhost:3001/api/v1/users/change-password - POST
    API : http://localhost:3001/api/v1/users/update-account - PATCH
    API : http://localhost:3001/api/v1/users/avatar - PATCH
    API : http://localhost:3001/api/v1/users/current-user - GET
    API : http://localhost:3001/api/v1/users/send-verify-otp - POST
    API : http://localhost:3001/api/v1/users/verify-email - POST
    API : http://localhost:3001/api/v1/users/is-auth - POST
    API : http://localhost:3001/api/v1/users/send-reset-otp - POST
    API : http://localhost:3001/api/v1/users/reset-password - POST
    API : http://localhost:3001/api/v1/users/send-change-password-otp - POST
    API : http://localhost:3001/api/v1/users/verify-change-password-otp - POST
 
 * categories
    API : http://localhost:3001/api/v1/categories - POST
    API : http://localhost:3001/api/v1/categories/user - GET
    API : http://localhost:3001/api/v1/categories/user/:id - PATCH, DELETE
    API : http://localhost:3001/api/v1/categories/all - GET (Admin only)
    API : http://localhost:3001/api/v1/categories/:id - PATCH, DELETE (Admin only)
 
 * customers
    API : http://localhost:3001/api/v1/customers - GET, POST
    API : http://localhost:3001/api/v1/customers/:id - PATCH, DELETE

 * suppliers
    API : http://localhost:3001/api/v1/suppliers - GET, POST
    API : http://localhost:3001/api/v1/suppliers/:id - PATCH, DELETE
 
 * units 
    API : http://localhost:3001/api/v1/units - GET, POST
    API : http://localhost:3001/api/v1/units/:id - PATCH, DELETE
 
 * products
    API : http://localhost:3001/api/v1/products - GET, POST
    API : http://localhost:3001/api/v1/products/:id - PATCH, DELETE
 
 * purchases
    API : http://localhost:3001/api/v1/purchases - GET, POST
    API : http://localhost:3001/api/v1/purchases/:id - GET, PATCH
 
 * orders
    API : http://localhost:3001/api/v1/orders - GET, POST
    API : http://localhost:3001/api/v1/orders/:id/details - GET
    API : http://localhost:3001/api/v1/orders/:id/status - PATCH
    API : http://localhost:3001/api/v1/orders/:id/invoice - GET
 
 * reports
    API : http://localhost:3001/api/v1/reports/dashboard - GET
    API : http://localhost:3001/api/v1/reports/stock - GET
    API : http://localhost:3001/api/v1/reports/sales - GET
    API : http://localhost:3001/api/v1/reports/purchases - GET
    API : http://localhost:3001/api/v1/reports/top-products - GET
    API : http://localhost:3001/api/v1/reports/low-stock-alerts - GET
 */

// 404 Not Found Handler for undefined routes
app.use((req, res, next) => {
    next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl} - Route not found on this server`));
});

app.use(errorHandler);
export { app };
