import { Router } from "express";
import {
    getTransfers,
    getTransfer,
    createTransfer,
    dispatchTransfer,
    receiveTransfer,
    cancelTransfer,
} from "../controllers/transfer.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireRole, requireWarehouseAccess } from "../middleware/rbac.middleware.js";

const router = Router();

router.use(verifyJWT);

// Only Admin and Manager can access Transfers (Customers forbidden)
router.use(requireRole("admin", "manager"));

router.route("/")
    .get(getTransfers)
    .post(requireWarehouseAccess, createTransfer);

router.route("/:id").get(getTransfer);
router.route("/:id/dispatch").patch(dispatchTransfer);
router.route("/:id/receive").patch(receiveTransfer);
router.route("/:id/cancel").patch(cancelTransfer);

export default router;
