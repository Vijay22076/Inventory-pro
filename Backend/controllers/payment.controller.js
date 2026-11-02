import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { OrderDetail } from "../models/order-detail.model.js";
import { Customer } from "../models/customer.model.js";
import { Warehouse, WarehouseStock, StockLedger } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { runWithOptionalTransaction } from "../utils/transaction.js";
import {
    sendOrderConfirmationNotification,
    checkAndTriggerLowStockAlert,
} from "./order.controller.js";

/**
 * Initialize Razorpay Client instance lazily or use test fallback
 */
export const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID || "";
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "";

    const isMock =
        !key_id ||
        !key_secret ||
        key_id.includes("mock") ||
        key_secret.includes("mock");

    if (isMock) {
        return { isMock: true, key_id };
    }

    try {
        const instance = new Razorpay({ key_id, key_secret });
        return { instance, isMock: false, key_id };
    } catch (err) {
        console.warn("⚠️ Failed to initialize Razorpay SDK:", err.message);
        return { isMock: true, key_id };
    }
};

/**
 * 1. Get Payment Configuration (Public Key only - Never secrets!)
 * GET /api/v1/payments/config
 */
export const getPaymentConfig = asyncHandler(async (req, res) => {
    const { key_id, isMock } = getRazorpayInstance();
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                key_id: key_id || "rzp_test_mockkey123456",
                currency: "INR",
                is_mock: isMock,
                company_name: "InventoryPro",
            },
            "Payment configuration fetched successfully"
        )
    );
});

/**
 * 2. Create Razorpay Payment Order
 * POST /api/v1/payments/create-order
 *
 * CRITICAL SECURITY RULE:
 * Calculate prices on the backend. Never trust the cart total submitted by React.
 * Retrieve product prices from MongoDB and calculate subtotal, GST, and final amount.
 */
export const createPaymentOrder = asyncHandler(async (req, res, next) => {
    const { items, shipping_address } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return next(new ApiError(400, "Order must contain at least one product"));
    }

    try {
        let subTotal = 0;
        const verifiedItems = [];

        // Fetch each product directly from MongoDB to verify pricing and available inventory
        for (const it of items) {
            const product = await Product.findById(it.product_id);
            if (!product) {
                return next(new ApiError(404, `Product not found: ${it.product_id}`));
            }

            const requestedQty = parseInt(it.quantity, 10);
            if (isNaN(requestedQty) || requestedQty <= 0) {
                return next(new ApiError(400, `Invalid quantity for product: ${product.product_name}`));
            }

            if (product.stock < requestedQty) {
                return next(
                    new ApiError(
                        400,
                        `Insufficient stock for "${product.product_name}". Available: ${product.stock}, Requested: ${requestedQty}`
                    )
                );
            }

            const itemLineTotal = product.selling_price * requestedQty;
            subTotal += itemLineTotal;

            verifiedItems.push({
                product_id: product._id,
                product_name: product.product_name,
                product_code: product.product_code,
                product_image: product.product_image,
                quantity: requestedQty,
                unit_price: product.selling_price,
                total: itemLineTotal,
            });
        }

        // Standard 18% GST calculation
        const gst = Math.round(subTotal * 0.18 * 100) / 100;
        const total = Math.round((subTotal + gst) * 100) / 100;
        const amountInPaise = Math.round(total * 100);

        const receiptNo = `RCP-${Date.now().toString().slice(-8)}`;
        const rzp = getRazorpayInstance();

        let razorpayOrder;

        if (!rzp.isMock && rzp.instance) {
            // Real Razorpay API Order Creation
            razorpayOrder = await rzp.instance.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: receiptNo,
                notes: {
                    user_id: req.user._id.toString(),
                    customer_email: req.user.email,
                    items_count: String(items.length),
                },
            });
        } else {
            // Fallback / Sandbox Mock Order for Local Testing
            razorpayOrder = {
                id: `order_mock_${Date.now().toString().slice(-8)}`,
                amount: amountInPaise,
                currency: "INR",
                receipt: receiptNo,
                status: "created",
                is_mock: true,
            };
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    razorpay_order_id: razorpayOrder.id,
                    amount: amountInPaise,
                    currency: "INR",
                    key_id: rzp.key_id,
                    is_mock: rzp.isMock,
                    summary: {
                        sub_total: subTotal,
                        gst,
                        total,
                        items_count: verifiedItems.length,
                        items: verifiedItems,
                        shipping_address: shipping_address || null,
                    },
                },
                "Payment order initialized successfully"
            )
        );
    } catch (err) {
        console.error("Payment order creation error:", err);
        return next(new ApiError(500, err.message || "Failed to initialize payment order"));
    }
});

/**
 * 3. Verify Payment & Idempotently Place Order
 * POST /api/v1/payments/verify
 *
 * CRITICAL SECURITY RULES:
 * - Cryptographic HMAC-SHA256 signature verification.
 * - Idempotent order processing (prevent duplicate stock deduction).
 * - Atomic MongoDB transaction for order, details, stock, and ledger.
 */
export const verifyPayment = asyncHandler(async (req, res, next) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        items,
        shipping_address,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
        return next(new ApiError(400, "Missing required payment parameters"));
    }

    try {
        const rzp = getRazorpayInstance();

        // 1. Cryptographic HMAC-SHA256 Signature Verification
        if (!rzp.isMock) {
            if (!razorpay_signature) {
                return next(new ApiError(400, "Payment signature missing"));
            }

            const secret = process.env.RAZORPAY_KEY_SECRET || "";
            const expectedSignature = crypto
                .createHmac("sha256", secret)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                return next(
                    new ApiError(
                        400,
                        "Cryptographic payment verification failed! Untrusted transaction."
                    )
                );
            }
        }

        // 2. Idempotency Check (Prevent duplicate orders and stock deductions)
        const existingOrder = await Order.findOne({
            "payment_info.razorpay_payment_id": razorpay_payment_id,
        })
            .populate("customer_id", "name email phone")
            .populate("warehouse_id", "warehouse_name");

        if (existingOrder) {
            console.log(`ℹ️ Payment ${razorpay_payment_id} was already processed. Returning existing order #${existingOrder.invoice_no}.`);
            return res.status(200).json(
                new ApiResponse(
                    200,
                    existingOrder,
                    "Payment was already verified. Order retrieved successfully."
                )
            );
        }

        // 3. Re-calculate prices on backend and verify inventory
        if (!Array.isArray(items) || items.length === 0) {
            return next(new ApiError(400, "Invalid order items payload"));
        }

        let subTotal = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product_id);
            if (!product) {
                return next(new ApiError(404, `Product not found: ${item.product_id}`));
            }

            const qty = parseInt(item.quantity, 10);
            if (product.stock < qty) {
                return next(
                    new ApiError(
                        400,
                        `Insufficient stock for "${product.product_name}" during payment finalization`
                    )
                );
            }

            const lineTotal = product.selling_price * qty;
            subTotal += lineTotal;

            processedItems.push({
                product_id: product._id,
                quantity: qty,
                unit_price: product.selling_price,
                total: lineTotal,
            });
        }

        const gst = Math.round(subTotal * 0.18 * 100) / 100;
        const total = Math.round((subTotal + gst) * 100) / 100;
        const invoice_no = `INV-${Date.now().toString().slice(-6)}`;

        // 4. Resolve Customer Profile & Fulfillment Warehouse
        let customer = await Customer.findOne({ user_id: req.user._id });
        if (!customer) {
            customer = await Customer.create({
                name: req.user.username || "Customer",
                email: req.user.email,
                phone: req.user.phone || "",
                address: shipping_address
                    ? `${shipping_address.street || ""}, ${shipping_address.city || ""}`
                    : "Standard Customer Address",
                user_id: req.user._id,
                created_by: req.user._id,
            });
        }

        const defaultWh =
            (await Warehouse.findOne({ is_default: true })) ||
            (await Warehouse.findOne());

        if (!defaultWh) {
            return next(new ApiError(500, "No fulfillment warehouse available"));
        }

        // 5. Atomic Transaction: Order, Details, Inventory Deduction, and Stock Ledger
        const finalOrder = await runWithOptionalTransaction(async (session) => {
            const [createdOrder] = await Order.create(
                [
                    {
                        customer_id: customer._id,
                        customer_user_id: req.user._id,
                        warehouse_id: defaultWh._id,
                        order_date: new Date(),
                        order_status: "processing", // Payment is verified and completed!
                        total_products: processedItems.reduce((acc, cur) => acc + cur.quantity, 0),
                        sub_total: subTotal,
                        gst,
                        total,
                        invoice_no,
                        shipping_address: shipping_address || null,
                        payment_info: {
                            payment_method: "razorpay",
                            payment_status: "paid",
                            razorpay_order_id,
                            razorpay_payment_id,
                            razorpay_signature: razorpay_signature || "verified_mock",
                            paid_at: new Date(),
                        },
                        created_by: req.user._id,
                        updated_by: req.user._id,
                    },
                ],
                session ? { session } : {}
            );

            // Create OrderDetails
            const orderDetailsData = processedItems.map((p) => ({
                order_id: createdOrder._id,
                product_id: p.product_id,
                quantity: p.quantity,
                unitcost: p.unit_price,
                unit_price: p.unit_price,
                total: p.total,
                created_by: req.user._id,
            }));

            await OrderDetail.insertMany(
                orderDetailsData,
                session ? { session } : {}
            );

            // Deduct stock from Product, WarehouseStock, and record StockLedger
            for (const item of processedItems) {
                const updatedProd = await Product.findByIdAndUpdate(
                    item.product_id,
                    { $inc: { stock: -item.quantity } },
                    { new: true, session }
                );

                const currentWs = await WarehouseStock.findOne({
                    warehouse_id: defaultWh._id,
                    product_id: item.product_id,
                });
                const qtyBefore = currentWs ? currentWs.quantity : 0;
                const qtyAfter = Math.max(0, qtyBefore - item.quantity);

                await WarehouseStock.findOneAndUpdate(
                    { warehouse_id: defaultWh._id, product_id: item.product_id },
                    { $set: { quantity: qtyAfter } },
                    { session }
                );

                await StockLedger.create(
                    [
                        {
                            warehouse_id: defaultWh._id,
                            product_id: item.product_id,
                            transaction_type: "order_dispatch",
                            reference_id: createdOrder._id,
                            reference_no: invoice_no,
                            quantity_before: qtyBefore,
                            quantity_change: -item.quantity,
                            quantity_after: qtyAfter,
                            created_by: req.user._id,
                        },
                    ],
                    session ? { session } : {}
                );
            }

            return createdOrder;
        });

        // 6. Asynchronously trigger automated notifications to Customer and Admin
        sendOrderConfirmationNotification(finalOrder._id);
        checkAndTriggerLowStockAlert(processedItems.map((p) => p.product_id));

        const populatedOrder = await Order.findById(finalOrder._id)
            .populate("customer_id", "name email phone")
            .populate("warehouse_id", "warehouse_name");

        return res
            .status(201)
            .json(new ApiResponse(201, populatedOrder, "Payment verified and order placed successfully"));
    } catch (err) {
        console.error("Payment verification error:", err);
        return next(new ApiError(500, err.message || "Failed to verify payment"));
    }
});

/**
 * 4. Razorpay Webhook Handler (Safety net for background reconciliation)
 * POST /api/v1/payments/webhook
 */
export const handleWebhook = asyncHandler(async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && webhookSecret !== "rzp_test_placeholder_webhook") {
        const signature = req.headers["x-razorpay-signature"];
        const bodyBuffer = req.rawBody || JSON.stringify(req.body);

        const expectedSig = crypto
            .createHmac("sha256", webhookSecret)
            .update(bodyBuffer)
            .digest("hex");

        if (signature !== expectedSig) {
            console.warn("⚠️ Webhook signature mismatch rejected");
            return res.status(400).json({ error: "Invalid webhook signature" });
        }
    }

    const event = req.body?.event;
    console.log(`🔔 Received Razorpay webhook event: ${event}`);

    if (event === "payment.captured" || event === "order.paid") {
        const paymentEntity = req.body?.payload?.payment?.entity;
        if (paymentEntity) {
            const paymentId = paymentEntity.id;
            const existingOrder = await Order.findOne({
                "payment_info.razorpay_payment_id": paymentId,
            });

            if (existingOrder) {
                console.log(`Webhook: Order #${existingOrder.invoice_no} already reconciled for payment ${paymentId}`);
            } else {
                console.log(`Webhook: Reconciling background payment capture for ${paymentId}`);
                // Background order reconciliation can be logged or triggered if payload metadata contains items
            }
        }
    }

    return res.status(200).json({ status: "ok" });
});

