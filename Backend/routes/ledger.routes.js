import { Router } from "express";
import { getLedgerEntries } from "../controllers/ledger.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";

const router = Router();

router.use(verifyJWT);
router.use(requireRole("admin", "manager"));

router.route("/").get(getLedgerEntries);

export default router;
