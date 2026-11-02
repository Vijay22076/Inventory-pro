import { Router } from "express";
import {
    submitReturnRequest,
    getMyReturns,
    getAllReturns,
    updateReturnStatus,
} from "../controllers/return.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";

const router = Router();

router.use(verifyJWT);

// Customer portal returns routes
router.route("/request").post(submitReturnRequest);
router.route("/my-returns").get(getMyReturns);

// Management returns routes - Admin and Manager only
router.route("/").get(requireRole("admin", "manager"), getAllReturns);
router
    .route("/:id/status")
    .patch(requireRole("admin", "manager"), updateReturnStatus)
    .put(requireRole("admin", "manager"), updateReturnStatus);
router
    .route("/:id/process")
    .patch(requireRole("admin", "manager"), updateReturnStatus)
    .put(requireRole("admin", "manager"), updateReturnStatus);

export default router;
