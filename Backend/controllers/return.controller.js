import { ReturnRequest } from "../models/return-request.model.js";
import { Order } from "../models/order.model.js";
import { OrderDetail } from "../models/order-detail.model.js";
import { WarehouseStock } from "../models/warehouse-stock.model.js";
import { StockLedger } from "../models/stock-ledger.model.js";
import { warehouseService } from "../services/warehouse.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import transporter from "../utils/nodemailer.js";
import { getReturnStatusUpdateEmailTemplate } from "../utils/emailTemplates.js";
import { getRazorpayInstance } from "./payment.controller.js";

// Customer submits a return request for their own order
const submitReturnRequest = asyncHandler(async (req, res, next) => {
    try {
        const { order_id, reason, notes } = req.body;
        let itemsList = req.body.items;
        if (!itemsList && req.body.product_id) {
            itemsList = [
                {
                    product_id: req.body.product_id,
                    quantity: req.body.quantity || 1,
                    reason: reason || "Return request",
                },
            ];
        }

        if (!order_id || !Array.isArray(itemsList) || itemsList.length === 0 || !reason) {
            return next(new ApiError(400, "Order ID, items, and reason are required"));
        }

        const order = await Order.findById(order_id);
        if (!order) {
            return next(new ApiError(404, "Order not found"));
        }

        // Verify customer ownership if requester is a customer
        if (req.user.role === "customer") {
            const isOwner =
                (order.customer_user_id &&
                    order.customer_user_id.toString() === req.user._id.toString()) ||
                order.created_by.toString() === req.user._id.toString();

            if (!isOwner) {
                return next(
                    new ApiError(403, "You can only request returns for your own orders")
                );
            }
        }

        const return_no = `RET-${Date.now().toString().slice(-6)}`;

        const returnReq = await ReturnRequest.create({
            return_no,
            order_id: order._id,
            customer_id: req.user._id,
            warehouse_id: order.warehouse_id,
            items: itemsList,
            reason,
            admin_notes: notes || req.body.admin_notes || "",
            status: "pending",
            created_by: req.user._id,
        });

        return res
            .status(201)
            .json(new ApiResponse(201, returnReq, "Return request submitted successfully"));
    } catch (err) {
        return next(new ApiError(500, err.message));
    }
});

// Customer views their own return requests
const getMyReturns = asyncHandler(async (req, res, next) => {
    try {
        const returns = await ReturnRequest.find({ customer_id: req.user._id })
            .populate("order_id", "invoice_no order_date total")
            .populate("customer_id", "username email phone name")
            .populate("items.product_id", "product_name product_code product_image selling_price")
            .sort({ createdAt: -1 });

        return res
            .status(200)
            .json(new ApiResponse(200, returns, "My returns fetched successfully"));
    } catch (err) {
        return next(new ApiError(500, err.message));
    }
});

// Admin & Manager view all return requests
const getAllReturns = asyncHandler(async (req, res, next) => {
    try {
        const query = {};
        if (req.user.role === "manager") {
            const assigned = (req.user.assigned_warehouses || []).map((w) =>
                w?._id ? w._id : w
            );
            query.warehouse_id = { $in: assigned };
        }

        const returns = await ReturnRequest.find(query)
            .populate({
                path: "order_id",
                select: "invoice_no order_date total warehouse_id customer_id customer_user_id",
                populate: {
                    path: "customer_id",
                    select: "name email phone",
                },
            })
            .populate("customer_id", "username email phone name")
            .populate("created_by", "username email phone name")
            .populate("items.product_id", "product_name product_code product_image selling_price")
            .populate("warehouse_id", "warehouse_name warehouse_code")
            .sort({ createdAt: -1 });

        return res
            .status(200)
            .json(new ApiResponse(200, returns, "All returns fetched successfully"));
    } catch (err) {
        return next(new ApiError(500, err.message));
    }
});

// Admin & Manager process return status (approve, reject, receive into warehouse)
const updateReturnStatus = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const notes = req.body.admin_notes || req.body.resolution_notes || "";

        if (!status || !["approved", "rejected", "received"].includes(status)) {
            return next(new ApiError(400, "Valid status ('approved', 'rejected', 'received') required"));
        }

        const returnReq = await ReturnRequest.findById(id);
        if (!returnReq) {
            return next(new ApiError(404, "Return request not found"));
        }

        const targetWhId = req.body.warehouse_id || req.body.target_warehouse_id || returnReq.warehouse_id;

        // If received, restock returned items into target warehouse
        if (status === "received" && returnReq.status !== "received") {
            if (!targetWhId) {
                return next(new ApiError(400, "Warehouse is required to receive returned items"));
            }

            let session = null;
            try {
                if (mongoose.connection.client?.topology?.description?.type === "ReplicaSetWithPrimary") {
                    session = await mongoose.startSession();
                    session.startTransaction();
                }
            } catch {
                session = null;
            }

            try {
                for (const item of returnReq.items) {
                    const findQuery = { warehouse_id: targetWhId, product_id: item.product_id };
                    const currentWhStock = session
                        ? await WarehouseStock.findOne(findQuery).session(session)
                        : await WarehouseStock.findOne(findQuery);

                    const qtyBefore = currentWhStock ? currentWhStock.quantity : 0;
                    const qtyAfter = qtyBefore + item.quantity;

                    const updateOptions = { upsert: true };
                    if (session) updateOptions.session = session;

                    await WarehouseStock.findOneAndUpdate(
                        { warehouse_id: targetWhId, product_id: item.product_id },
                        {
                            $set: { quantity: qtyAfter },
                            $setOnInsert: {
                                created_by: req.user._id,
                                reserved_quantity: 0,
                                bin_location: "A-01-01",
                            },
                        },
                        updateOptions
                    );

                    await warehouseService.syncProductStock(item.product_id, session);

                    const ledgerData = [
                        {
                            warehouse_id: targetWhId,
                            product_id: item.product_id,
                            transaction_type: "adjustment_add",
                            reference_id: returnReq._id,
                            reference_no: returnReq.return_no,
                            quantity_before: qtyBefore,
                            quantity_change: item.quantity,
                            quantity_after: qtyAfter,
                            created_by: req.user._id,
                        },
                    ];

                    if (session) {
                        await StockLedger.create(ledgerData, { session });
                    } else {
                        await StockLedger.create(ledgerData);
                    }
                }

                returnReq.status = "received";
                returnReq.warehouse_id = targetWhId;
                if (notes) returnReq.admin_notes = notes;

                if (session) {
                    await returnReq.save({ session });
                    await session.commitTransaction();
                } else {
                    await returnReq.save();
                }

                // Asynchronously send status update email to customer
                sendReturnNotificationEmail(returnReq._id);

                return res
                    .status(200)
                    .json(new ApiResponse(200, returnReq, "Return received and inventory restocked"));
            } catch (err) {
                if (session) await session.abortTransaction();
                throw err;
            } finally {
                if (session) session.endSession();
            }
        } else if (status === "approved" && returnReq.status !== "approved") {
            returnReq.status = "approved";
            if (notes) returnReq.admin_notes = notes;
            if (targetWhId) returnReq.warehouse_id = targetWhId;

            // Automated Razorpay Refund Execution
            try {
                const order = await Order.findById(returnReq.order_id);
                const paymentInfo = order?.payment_info;
                const isOnline = paymentInfo?.payment_method === "razorpay" || order?.payment_type === "online";
                const razorpayPaymentId = paymentInfo?.razorpay_payment_id;

                if (isOnline && razorpayPaymentId) {
                    let refundTotal = 0;
                    if (returnReq.items && returnReq.items.length > 0) {
                        const orderDetails = await OrderDetail.find({ order_id: order._id });
                        for (const retItem of returnReq.items) {
                            const od = orderDetails.find(
                                (d) => d.product_id.toString() === retItem.product_id.toString()
                            );
                            const unitPrice = od ? (od.unitcost || od.unit_price || 0) : 0;
                            refundTotal += unitPrice * retItem.quantity;
                        }
                    }
                    if (refundTotal <= 0 || refundTotal > order.total) {
                        refundTotal = order.total;
                    }

                    const rzp = getRazorpayInstance();
                    const amountInPaise = Math.round(refundTotal * 100);
                    let refundData = null;

                    if (!rzp.isMock && rzp.instance) {
                        try {
                            refundData = await rzp.instance.payments.refund(razorpayPaymentId, {
                                amount: amountInPaise,
                                notes: {
                                    return_no: returnReq.return_no,
                                    return_id: returnReq._id.toString(),
                                    order_id: order._id.toString(),
                                    reason: returnReq.reason || "Return Approved",
                                },
                            });
                            console.log(`✅ Automated Razorpay Refund issued: ${refundData.id} for ₹${refundTotal}`);
                        } catch (refundErr) {
                            console.error("⚠️ Razorpay Refund API Error:", refundErr.message);
                            returnReq.admin_notes = (returnReq.admin_notes ? returnReq.admin_notes + " | " : "") +
                                `[Refund Error: ${refundErr.message}]`;
                        }
                    } else {
                        refundData = {
                            id: `rfnd_mock_${Date.now()}`,
                            amount: amountInPaise,
                            status: "processed",
                        };
                        console.log(`💳 Mock Razorpay Refund created: ${refundData.id} (₹${refundTotal})`);
                    }

                    if (refundData) {
                        returnReq.refund_info = {
                            refund_id: refundData.id,
                            refund_amount: refundTotal,
                            refund_status: refundData.status || "processed",
                            refunded_at: new Date(),
                        };
                        returnReq.admin_notes = (returnReq.admin_notes ? returnReq.admin_notes + " | " : "") +
                            `[Razorpay Refund: ${refundData.id} - ₹${refundTotal}]`;
                    }
                }
            } catch (err) {
                console.warn("⚠️ Failed to process automated return refund:", err.message);
            }

            await returnReq.save();
            sendReturnNotificationEmail(returnReq._id);

            return res
                .status(200)
                .json(new ApiResponse(200, returnReq, "Return approved and automated Razorpay refund initiated"));
        } else {
            returnReq.status = status;
            if (notes) returnReq.admin_notes = notes;
            if (targetWhId) returnReq.warehouse_id = targetWhId;
            await returnReq.save();

            // Asynchronously send status update email to customer
            sendReturnNotificationEmail(returnReq._id);

            return res
                .status(200)
                .json(new ApiResponse(200, returnReq, `Return status updated to ${status}`));
        }
    } catch (err) {
        return next(new ApiError(500, err.message));
    }
});

// Helper: send customer return status notification email
const sendReturnNotificationEmail = async (returnId) => {
    try {
        const populated = await ReturnRequest.findById(returnId)
            .populate("customer_id", "username email name")
            .populate("order_id", "invoice_no")
            .populate("warehouse_id", "warehouse_name")
            .populate("items.product_id", "product_name product_code");

        if (populated?.customer_id?.email) {
            const emailTemplate = getReturnStatusUpdateEmailTemplate({
                username: populated.customer_id.username || populated.customer_id.name,
                return_no: populated.return_no,
                invoice_no: populated.order_id?.invoice_no,
                status: populated.status,
                items: populated.items?.map((it) => ({
                    product_name: it.product_id?.product_name,
                    product_code: it.product_id?.product_code,
                    quantity: it.quantity,
                })),
                warehouse_name: populated.warehouse_id?.warehouse_name,
                resolution_notes: populated.admin_notes,
                portalUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/customer/returns`,
            });

            await transporter.sendMail({
                from: `"InventoryPro" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
                to: populated.customer_id.email,
                ...emailTemplate,
            });
            console.log(
                `📧 Return status update email sent to ${populated.customer_id.email} (Status: ${populated.status})`
            );
        }
    } catch (emailErr) {
        console.warn("⚠️ Return status email could not be sent:", emailErr.message);
    }
};

export {
    submitReturnRequest,
    getMyReturns,
    getAllReturns,
    updateReturnStatus,
};
