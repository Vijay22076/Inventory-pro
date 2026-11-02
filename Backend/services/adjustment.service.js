import mongoose from "mongoose";
import {
    StockAdjustment,
    Warehouse,
    WarehouseStock,
    StockLedger,
    Product,
} from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { warehouseService } from "./warehouse.service.js";
import { runWithOptionalTransaction } from "../utils/transaction.js";

class AdjustmentService {
    async createAdjustment(data, userId, userRole = "admin") {
        const { warehouse_id, reason, items, notes } = data;

        if (!warehouse_id || !reason) {
            throw new ApiError(400, "Warehouse and reason are required");
        }

        if (!Array.isArray(items) || items.length === 0) {
            throw new ApiError(400, "At least one item must be adjusted");
        }

        const warehouse = await Warehouse.findById(warehouse_id);
        if (!warehouse) {
            throw new ApiError(404, "Warehouse not found");
        }

        const adjustment_no = `ADJ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        // If manager submits, status is 'pending' for Admin approval
        const isManager = userRole === "manager";
        const initialStatus = isManager ? "pending" : "approved";

        const processedItems = [];
        for (const item of items) {
            if (!item.product_id || item.physical_quantity === undefined) {
                throw new ApiError(400, "Product ID and physical quantity required");
            }

            const product = await Product.findById(item.product_id);
            if (!product) {
                throw new ApiError(404, `Product not found: ${item.product_id}`);
            }

            const currentWhStock = await WarehouseStock.findOne({
                warehouse_id,
                product_id: item.product_id,
            });

            const systemQty = currentWhStock ? currentWhStock.quantity : 0;
            const physicalQty = Math.max(0, parseInt(item.physical_quantity, 10));
            const variance = physicalQty - systemQty;

            processedItems.push({
                product_id: item.product_id,
                system_quantity: systemQty,
                physical_quantity: physicalQty,
                variance,
                unit_cost: product.buying_price || 0,
            });
        }

        // If admin, apply stock mutations immediately
        if (!isManager) {
            return await runWithOptionalTransaction(async (session) => {
                for (const item of processedItems) {
                    if (item.variance !== 0) {
                        await WarehouseStock.findOneAndUpdate(
                            { warehouse_id, product_id: item.product_id },
                            {
                                $set: { quantity: item.physical_quantity },
                                $setOnInsert: {
                                    created_by: userId,
                                    reserved_quantity: 0,
                                    bin_location: "A-01-01",
                                },
                            },
                            { upsert: true, session: session || null }
                        );

                        await warehouseService.syncProductStock(item.product_id, session);

                        await StockLedger.create(
                            [
                                {
                                    warehouse_id,
                                    product_id: item.product_id,
                                    transaction_type:
                                        item.variance > 0 ? "adjustment_add" : "adjustment_deduct",
                                    reference_id: new mongoose.Types.ObjectId(),
                                    reference_no: adjustment_no,
                                    quantity_before: item.system_quantity,
                                    quantity_change: item.variance,
                                    quantity_after: item.physical_quantity,
                                    created_by: userId,
                                },
                            ],
                            session ? { session } : {}
                        );
                    }
                }

                const [adjustment] = await StockAdjustment.create(
                    [
                        {
                            adjustment_no,
                            warehouse_id,
                            reason,
                            status: "approved",
                            items: processedItems,
                            notes: notes || "",
                            approved_by: userId,
                            created_by: userId,
                        },
                    ],
                    session ? { session } : {}
                );

                await StockLedger.updateMany(
                    { reference_no: adjustment_no },
                    { $set: { reference_id: adjustment._id } },
                    session ? { session } : {}
                );

                return adjustment;
            });
        } else {
            // Manager: Save adjustment as 'pending' for Admin approval without mutating stock
            const adjustment = await StockAdjustment.create({
                adjustment_no,
                warehouse_id,
                reason,
                status: "pending",
                items: processedItems,
                notes: notes || "",
                created_by: userId,
            });

            return adjustment;
        }
    }

    // Admin approves pending adjustment
    async approveAdjustment(adjustmentId, adminUserId) {
        const adjustment = await StockAdjustment.findById(adjustmentId);
        if (!adjustment) {
            throw new ApiError(404, "Adjustment not found");
        }

        if (adjustment.status !== "pending") {
            throw new ApiError(400, `Adjustment is already ${adjustment.status}`);
        }

        return await runWithOptionalTransaction(async (session) => {
            for (const item of adjustment.items) {
                const currentStock = await WarehouseStock.findOne({
                    warehouse_id: adjustment.warehouse_id,
                    product_id: item.product_id,
                }).session(session || null);

                const currentQty = currentStock ? currentStock.quantity : 0;
                const newQty = item.physical_quantity;
                const variance = newQty - currentQty;

                if (variance !== 0) {
                    await WarehouseStock.findOneAndUpdate(
                        { warehouse_id: adjustment.warehouse_id, product_id: item.product_id },
                        {
                            $set: { quantity: newQty },
                            $setOnInsert: {
                                created_by: adminUserId,
                                reserved_quantity: 0,
                                bin_location: "A-01-01",
                            },
                        },
                        { upsert: true, session: session || null }
                    );

                    await warehouseService.syncProductStock(item.product_id, session);

                    await StockLedger.create(
                        [
                            {
                                warehouse_id: adjustment.warehouse_id,
                                product_id: item.product_id,
                                transaction_type: variance > 0 ? "adjustment_add" : "adjustment_deduct",
                                reference_id: adjustment._id,
                                reference_no: adjustment.adjustment_no,
                                quantity_before: currentQty,
                                quantity_change: variance,
                                quantity_after: newQty,
                                created_by: adminUserId,
                            },
                        ],
                        session ? { session } : {}
                    );
                }
            }

            adjustment.status = "approved";
            adjustment.approved_by = adminUserId;
            await adjustment.save(session ? { session } : {});

            return adjustment;
        });
    }

    // Admin rejects pending adjustment
    async rejectAdjustment(adjustmentId, adminUserId, notes = "") {
        const adjustment = await StockAdjustment.findById(adjustmentId);
        if (!adjustment) {
            throw new ApiError(404, "Adjustment not found");
        }

        if (adjustment.status !== "pending") {
            throw new ApiError(400, `Adjustment is already ${adjustment.status}`);
        }

        adjustment.status = "rejected";
        adjustment.approved_by = adminUserId;
        adjustment.rejection_notes = notes;
        await adjustment.save();

        return adjustment;
    }

    async listAdjustments(userId, userRole = "admin", assignedWarehouses = [], filters = {}) {
        const query = {};

        if (userRole === "manager") {
            const assignedIds = (assignedWarehouses || []).map((id) =>
                id?._id ? id._id : id
            );
            query.warehouse_id = { $in: assignedIds };
        } else if (userRole === "admin") {
            // Admin sees all or warehouse filter
            if (filters.warehouse_id) query.warehouse_id = filters.warehouse_id;
        }

        if (filters.reason) query.reason = filters.reason;
        if (filters.status) query.status = filters.status;

        return StockAdjustment.find(query)
            .populate("warehouse_id", "warehouse_name warehouse_code")
            .populate("items.product_id", "product_name product_code buying_price product_image")
            .populate("approved_by", "username email")
            .populate("created_by", "username email role")
            .sort({ createdAt: -1 })
            .lean();
    }

    async getAdjustmentById(id) {
        const adjustment = await StockAdjustment.findById(id)
            .populate("warehouse_id")
            .populate("items.product_id")
            .populate("approved_by", "username email")
            .populate("created_by", "username email role")
            .lean();

        if (!adjustment) {
            throw new ApiError(404, "Stock adjustment not found");
        }

        return adjustment;
    }
}

export const adjustmentService = new AdjustmentService();
