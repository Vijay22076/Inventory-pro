import { Router } from "express";
import {
    createSupplier,
    getUserSuppliers,
    getAllSuppliers,
    updateSupplier,
    deleteSupplier,
} from "../controllers/supplier.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.use(verifyJWT);
// Restrict all supplier operations to Admin and Manager (Customer blocked)
router.use(requireRole("admin", "manager"));

router.route("/admin/all").get(isAdmin, getAllSuppliers);

// Regular user routes
router
    .route("/")
    .post(upload.single("photo"), createSupplier)
    .get(getUserSuppliers);

router
    .route("/:id")
    .patch(upload.single("photo"), updateSupplier)
    .delete(deleteSupplier);

export default router;
