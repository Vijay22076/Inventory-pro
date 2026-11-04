import { Router } from "express";
import {
    createProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    getAllProductsAdmin,
    getCustomerCatalog,
} from "../controllers/product.controller.js";
import { bulkUploadProducts } from "../controllers/product.bulk.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { upload, csvUpload } from "../middleware/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

// Customer-safe Catalog endpoint (No purchase costs or internal warehouse locations)
router.route("/catalog").get(getCustomerCatalog);

// Bulk upload - Admin & Manager
router
    .route("/bulk-upload")
    .post(requireRole("admin", "manager"), csvUpload.single("file"), bulkUploadProducts);

// Internal Product Management (Contains cost & warehouse distribution) - Admin & Manager only
router
    .route("/")
    .post(requireRole("admin", "manager"), upload.any(), createProduct)
    .get(requireRole("admin", "manager"), getAllProducts);

router
    .route("/:id")
    .patch(requireRole("admin", "manager"), upload.any(), updateProduct)
    .put(requireRole("admin", "manager"), upload.any(), updateProduct)
    .delete(requireRole("admin", "manager"), deleteProduct);

// Admin-only global products
router.route("/all").get(requireRole("admin"), getAllProductsAdmin);

export default router;
