import { Router } from "express";
import {
    createCustomer,
    getAllCustomers,
    getUserCustomers,
    updateCustomer,
    deleteCustomer,
} from "../controllers/customer.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.use(verifyJWT);
// Restrict customer directory access to Admin & Manager (Customer portal accounts cannot view other customers)
router.use(requireRole("admin", "manager"));

// Regular user routes - only for their own customers
router
    .route("/")
    .post(upload.single("photo"), createCustomer)
    .get(getUserCustomers);

router
    .route("/:id")
    .patch(upload.single("photo"), updateCustomer)
    .delete(deleteCustomer);

// Admin and manager route - can access all customers
router.route("/all").get(getAllCustomers);

export default router;
