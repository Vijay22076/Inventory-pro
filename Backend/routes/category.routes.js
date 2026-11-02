import { Router } from "express";
import {
    createCategory,
    getAllCategories,
    getUserCategories,
    getAvailableCategories,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/available").get(getAvailableCategories);

router.route("/").post(requireRole("admin", "manager"), createCategory);
router.route("/user").get(requireRole("admin", "manager"), getUserCategories);
router.route("/user/:id").patch(requireRole("admin", "manager"), updateCategory).delete(requireRole("admin", "manager"), deleteCategory);

// Admin-only routes
router.use(isAdmin);
router.route("/admin/all").get(getAllCategories);
router.route("/admin/:id").patch(updateCategory).delete(deleteCategory);

export default router;
