import { Router } from "express";
import {
    getAdjustments,
    getAdjustment,
    createAdjustment,
    approveAdjustment,
    rejectAdjustment,
} from "../controllers/adjustment.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireRole, requireWarehouseAccess } from "../middleware/rbac.middleware.js";

const router = Router();

router.use(verifyJWT);

// Only Admin and Manager can access adjustments (Customers forbidden)
router
    .route("/")
    .get(requireRole("admin", "manager"), getAdjustments)
    .post(requireRole("admin", "manager"), requireWarehouseAccess, createAdjustment);

router
    .route("/:id")
    .get(requireRole("admin", "manager"), getAdjustment);

// Admin-only approval and rejection endpoints
router
    .route("/:id/approve")
    .patch(requireRole("admin"), approveAdjustment);

router
    .route("/:id/reject")
    .patch(requireRole("admin"), rejectAdjustment);

export default router;
