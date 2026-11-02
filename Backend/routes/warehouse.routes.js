import { Router } from "express";
import {
    getWarehouses,
    getWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseStock,
} from "../controllers/warehouse.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireRole, requireWarehouseAccess } from "../middleware/rbac.middleware.js";

const router = Router();

// Authentication required for all warehouse operations
router.use(verifyJWT);

// Only Admin and Managers can view/list warehouses (Customers forbidden)
router
    .route("/")
    .get(requireRole("admin", "manager"), getWarehouses)
    .post(requireRole("admin"), createWarehouse);

router
    .route("/:id")
    .get(requireRole("admin", "manager"), requireWarehouseAccess, getWarehouse)
    .put(requireRole("admin"), updateWarehouse)
    .delete(requireRole("admin"), deleteWarehouse);

router
    .route("/:id/stock")
    .get(requireRole("admin", "manager"), requireWarehouseAccess, getWarehouseStock);

export default router;
