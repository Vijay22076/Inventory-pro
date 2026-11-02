import express from "express";
import {
    createOrder,
    generateInvoice,
    getAllOrders,
    getAllOrdersAdmin,
    getOrderDetails,
    updateOrderStatus,
    customerCheckout,
} from "../controllers/order.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";

const router = express.Router();

router.use(verifyJWT); // Apply auth middleware to all routes

// Customer self-service checkout
router.post("/checkout", customerCheckout);

// Internal order creation - restricted to Admin and Manager
router.post("/", requireRole("admin", "manager"), createOrder);

// Order lists and details (Scoped internally: Customer sees own, Manager sees assigned scope, Admin sees all)
router.get("/", getAllOrders);
router.get("/:id", getOrderDetails);
router.get("/:id/details", getOrderDetails);
router.route("/:id/invoice").get(generateInvoice);

// Order status updates - only Admin and Manager can process orders
router.patch("/:id/status", requireRole("admin", "manager"), updateOrderStatus);

// Admin-only global view
router.get("/all", requireRole("admin"), getAllOrdersAdmin);

export default router;
