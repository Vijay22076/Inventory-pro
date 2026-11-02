import { Router } from "express";
import {
    getPaymentConfig,
    createPaymentOrder,
    verifyPayment,
    handleWebhook,
} from "../controllers/payment.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Configuration (Public Key only - Never secrets!)
router.get("/config", verifyJWT, getPaymentConfig);

// Customer checkout payment flow
router.post("/create-order", verifyJWT, createPaymentOrder);
router.post("/verify", verifyJWT, verifyPayment);

// Razorpay Webhook endpoint (validated by cryptographic HMAC header)
router.post("/webhook", handleWebhook);

export default router;

