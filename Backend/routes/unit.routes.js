import { Router } from "express";
import {
    createUnit,
    getAllUnits,
    updateUnit,
    deleteUnit,
} from "../controllers/unit.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// Master data units management
router.route("/").post(requireRole("admin", "manager"), createUnit).get(getAllUnits);

router.route("/:id").patch(requireRole("admin", "manager"), updateUnit).delete(requireRole("admin", "manager"), deleteUnit);

// Admin only routes
router.route("/admin/all").get(isAdmin, getAllUnits); // This will get all units for admin

export default router;
