import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { OrderDetail } from "../models/order-detail.model.js";
import { Product } from "../models/product.model.js";
import { Warehouse, WarehouseStock, StockLedger } from "../models/index.js";
import { warehouseService } from "./warehouse.service.js";
import { ApiError } from "../utils/ApiError.js";
import { runWithOptionalTransaction } from "../utils/transaction.js";

const generateInvoiceNo = () => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${ts}${rand}`.substring(0, 10);
};

class OrderService {
    async createOrder(orderData, userId) {
        const { customer_id, sub_total, gst, total, order_status, orderItems, warehouse_id } =
            orderData;

        if (
            !customer_id ||
            !Array.isArray(orderItems) ||
            orderItems.length === 0
        ) {
            throw new ApiError(400, "Invalid order data");
        }

        const targetWh = warehouse_id
            ? await Warehouse.findById(warehouse_id)
            : await warehouseService.getOrCreateDefaultWarehouse(userId);
        const whId = targetWh ? targetWh._id : (await warehouseService.getOrCreateDefaultWarehouse(userId))._id;

        let invoice_no;
        let attempts = 0;
        do {
            invoice_no = generateInvoiceNo();
            const existing = await Order.findOne({ invoice_no }).lean();
            if (!existing) break;
            attempts++;
        } while (attempts < 5);

        if (attempts >= 5) {
            throw new ApiError(
                500,
                "Failed to generate a unique invoice number. Please try again."
            );
        }

        const initialStatus = order_status || "pending";
        const shouldDeductStock = initialStatus === "completed";

        if (shouldDeductStock) {
            const insufficientItems =
                await Product.findInsufficientStock(orderItems);
            if (insufficientItems.length > 0) {
                throw new ApiError(
                    422,
                    "Insufficient stock for one or more products",
                    insufficientItems
                );
            }
        }

        return await runWithOptionalTransaction(async (session) => {
            const [order] = await Order.create(
                [
                    {
                        customer_id,
                        order_date: new Date(),
                        order_status: initialStatus,
                        warehouse_id: whId,
                        total_products: orderItems.length,
                        sub_total,
                        gst,
                        total,
                        invoice_no,
                        created_by: userId,
                        updated_by: userId,
                    },
                ],
                session ? { session } : {}
            );

            await OrderDetail.bulkCreateDetails(
                orderItems.map((item) => ({
                    order_id: order._id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unitcost: item.unitcost,
                    total: item.quantity * item.unitcost,
                })),
                session
            );

            if (shouldDeductStock) {
                for (const item of orderItems) {
                    const updated = await Product.deductStock(
                        item.product_id,
                        item.quantity,
                        session
                    );
                    if (!updated) {
                        throw new ApiError(
                            422,
                            `Insufficient stock for product ID: ${item.product_id}. Please refresh and try again.`
                        );
                    }

                    // Deduct from WarehouseStock
                    const stockBefore = await WarehouseStock.findOne({
                        warehouse_id: whId,
                        product_id: item.product_id,
                    }).session(session || null);
                    const qtyBefore = stockBefore ? stockBefore.quantity : item.quantity;

                    await WarehouseStock.updateOne(
                        { warehouse_id: whId, product_id: item.product_id },
                        { $inc: { quantity: -item.quantity } },
                        session ? { session } : {}
                    );

                    // Log to StockLedger
                    await StockLedger.create(
                        [
                            {
                                warehouse_id: whId,
                                product_id: item.product_id,
                                transaction_type: "order_dispatch",
                                reference_id: order._id,
                                reference_no: order.invoice_no,
                                quantity_before: qtyBefore,
                                quantity_change: -item.quantity,
                                quantity_after: qtyBefore - item.quantity,
                                created_by: userId,
                            },
                        ],
                        session ? { session } : {}
                    );
                }
            }

            return order;
        });
    }

    async updateOrderStatus(
        orderId,
        newStatus,
        userId,
        userRole,
        assignedWarehouses = []
    ) {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        if (userRole === "manager") {
            const assignedIds = (assignedWarehouses || []).map((id) =>
                id?._id ? id._id.toString() : id.toString()
            );
            const isAssigned =
                order.warehouse_id &&
                assignedIds.includes(order.warehouse_id.toString());
            const isCreator = order.created_by.toString() === userId.toString();
            if (!isAssigned && !isCreator) {
                throw new ApiError(
                    403,
                    "You are not authorized to update orders outside your assigned warehouses"
                );
            }
        } else if (
            userRole !== "admin" &&
            order.created_by.toString() !== userId.toString()
        ) {
            throw new ApiError(
                403,
                "You are not authorized to update this order"
            );
        }

        const validTransitions = {
            pending: ["processing", "completed", "cancelled"],
            processing: ["pending", "completed", "cancelled"],
            completed: [],
            cancelled: [],
        };

        if (!validTransitions[order.order_status]?.includes(newStatus)) {
            throw new ApiError(
                400,
                `Cannot transition order from "${order.order_status}" to "${newStatus}"`
            );
        }

        if (newStatus === "completed") {
            const details = await OrderDetail.find({
                order_id: orderId,
            }).lean();

            const items = details.map((d) => ({
                product_id: d.product_id,
                quantity: d.quantity,
            }));

            const insufficientItems =
                await Product.findInsufficientStock(items);
            if (insufficientItems.length > 0) {
                throw new ApiError(
                    422,
                    "Insufficient stock for one or more products",
                    insufficientItems
                );
            }

            const whId = order.warehouse_id || (await warehouseService.getOrCreateDefaultWarehouse(userId))._id;
            return await runWithOptionalTransaction(async (session) => {
                for (const detail of details) {
                    const updated = await Product.deductStock(
                        detail.product_id,
                        detail.quantity,
                        session
                    );
                    if (!updated) {
                        throw new ApiError(
                            422,
                            `Insufficient stock for product ID: ${detail.product_id}. Please refresh and try again.`
                        );
                    }

                    // Deduct from WarehouseStock
                    const stockBefore = await WarehouseStock.findOne({
                        warehouse_id: whId,
                        product_id: detail.product_id,
                    }).session(session || null);
                    const qtyBefore = stockBefore ? stockBefore.quantity : detail.quantity;

                    await WarehouseStock.updateOne(
                        { warehouse_id: whId, product_id: detail.product_id },
                        { $inc: { quantity: -detail.quantity } },
                        session ? { session } : {}
                    );

                    // Log to StockLedger
                    await StockLedger.create(
                        [
                            {
                                warehouse_id: whId,
                                product_id: detail.product_id,
                                transaction_type: "order_dispatch",
                                reference_id: order._id,
                                reference_no: order.invoice_no,
                                quantity_before: qtyBefore,
                                quantity_change: -detail.quantity,
                                quantity_after: qtyBefore - detail.quantity,
                                created_by: userId,
                            },
                        ],
                        session ? { session } : {}
                    );
                }

                const updated = await Order.findByIdAndUpdate(
                    orderId,
                    { order_status: newStatus, warehouse_id: whId, updated_by: userId },
                    { new: true, ...(session ? { session } : {}) }
                );

                return updated;
            });
        }

        return Order.findByIdAndUpdate(
            orderId,
            { order_status: newStatus, updated_by: userId },
            { new: true }
        );
    }
}

export default new OrderService();
