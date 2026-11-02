import mongoose from "mongoose";
import { Purchase } from "../models/purchase.model.js";
import { PurchaseDetail } from "../models/purchase-detail.model.js";
import { Product } from "../models/product.model.js";
import { Supplier } from "../models/supplier.model.js";
import { Warehouse, WarehouseStock, StockLedger } from "../models/index.js";
import { warehouseService } from "./warehouse.service.js";
import { ApiError } from "../utils/ApiError.js";
import { runWithOptionalTransaction } from "../utils/transaction.js";

class PurchaseService {
    async createPurchase(purchaseData, userId) {
        const { supplier_id, purchase_no, purchase_status, details } =
            purchaseData;

        if (
            !supplier_id ||
            !purchase_no ||
            !Array.isArray(details) ||
            details.length === 0
        ) {
            throw new ApiError(400, "Invalid purchase data");
        }

        const supplier = await Supplier.findById(supplier_id).lean();
        if (!supplier) {
            throw new ApiError(404, "Supplier not found");
        }

        const productIds = details.map((d) => d.product_id?.toString());
        const uniqueProductIds = [...new Set(productIds)];
        if (uniqueProductIds.length !== productIds.length) {
            throw new ApiError(400, "Duplicate products in purchase details");
        }

        const products = await Product.find({
            _id: { $in: uniqueProductIds },
        })
            .select("_id")
            .lean();

        if (products.length !== uniqueProductIds.length) {
            throw new ApiError(400, "One or more products not found");
        }

        for (const d of details) {
            if (!d.quantity || d.quantity < 1) {
                throw new ApiError(
                    400,
                    "Quantity must be at least 1 for all items"
                );
            }
            if (d.unitcost === undefined || d.unitcost < 0) {
                throw new ApiError(
                    400,
                    "Unit cost must be non-negative for all items"
                );
            }
        }

        const existing = await Purchase.findOne({ purchase_no }).lean();
        if (existing) {
            throw new ApiError(409, "Purchase number already exists");
        }

        const initialStatus = purchase_status || "pending";
        if (!["pending", "completed"].includes(initialStatus)) {
            throw new ApiError(
                400,
                `Invalid purchase status: ${initialStatus}`
            );
        }

        const shouldAddStock = initialStatus === "completed";

        const targetWh = purchaseData.warehouse_id
            ? await Warehouse.findById(purchaseData.warehouse_id)
            : await warehouseService.getOrCreateDefaultWarehouse(userId);
        const whId = targetWh ? targetWh._id : (await warehouseService.getOrCreateDefaultWarehouse(userId))._id;

        return await runWithOptionalTransaction(async (session) => {
            const [purchase] = await Purchase.create(
                [
                    {
                        supplier_id,
                        purchase_no,
                        purchase_status: initialStatus,
                        warehouse_id: whId,
                        created_by: userId,
                    },
                ],
                session ? { session } : {}
            );

            await PurchaseDetail.bulkCreateDetails(
                details.map((d) => ({
                    purchase_id: purchase._id,
                    product_id: d.product_id,
                    quantity: d.quantity,
                    unitcost: d.unitcost,
                })),
                session
            );

            if (shouldAddStock) {
                for (const detail of details) {
                    await Product.restoreStock(
                        detail.product_id,
                        detail.quantity,
                        session
                    );

                    await WarehouseStock.addStock(
                        whId,
                        detail.product_id,
                        detail.quantity,
                        userId,
                        session
                    );

                    const currentWhStock = await WarehouseStock.findOne({
                        warehouse_id: whId,
                        product_id: detail.product_id,
                    }).session(session || null);
                    const qtyAfter = currentWhStock ? currentWhStock.quantity : detail.quantity;

                    await StockLedger.create(
                        [
                            {
                                warehouse_id: whId,
                                product_id: detail.product_id,
                                transaction_type: "purchase_receipt",
                                reference_id: purchase._id,
                                reference_no: purchase.purchase_no,
                                quantity_before: qtyAfter - detail.quantity,
                                quantity_change: detail.quantity,
                                quantity_after: qtyAfter,
                                created_by: userId,
                            },
                        ],
                        session ? { session } : {}
                    );
                }
            }

            return purchase;
        });
    }

    async updatePurchaseStatus(purchaseId, newStatus, userId, userRole) {
        const purchase = await Purchase.findById(purchaseId);

        if (!purchase) {
            throw new ApiError(404, "Purchase not found");
        }

        if (userRole !== "admin" && !purchase.created_by.equals(userId)) {
            throw new ApiError(
                403,
                "You don't have permission to update this purchase"
            );
        }

        const validTransitions = {
            pending: ["completed"],
            completed: ["returned"],
            returned: [],
        };

        if (purchase.purchase_status === newStatus) {
            return { purchase };
        }

        if (!validTransitions[purchase.purchase_status]?.includes(newStatus)) {
            throw new ApiError(
                400,
                `Cannot transition purchase from "${purchase.purchase_status}" to "${newStatus}"`
            );
        }

        const whId = purchase.warehouse_id || (await warehouseService.getOrCreateDefaultWarehouse(userId))._id;

        return await runWithOptionalTransaction(async (session) => {
            let returnInfo = null;
            if (newStatus === "returned") {
                returnInfo = await PurchaseDetail.processAllReturns(
                    purchaseId,
                    session
                );
            } else if (newStatus === "completed") {
                const purchaseDetails = await PurchaseDetail.find({
                    purchase_id: purchaseId,
                }).lean();

                for (const detail of purchaseDetails) {
                    await Product.restoreStock(
                        detail.product_id,
                        detail.quantity,
                        session
                    );

                    await WarehouseStock.addStock(
                        whId,
                        detail.product_id,
                        detail.quantity,
                        userId,
                        session
                    );

                    const currentWhStock = await WarehouseStock.findOne({
                        warehouse_id: whId,
                        product_id: detail.product_id,
                    }).session(session || null);
                    const qtyAfter = currentWhStock ? currentWhStock.quantity : detail.quantity;

                    await StockLedger.create(
                        [
                            {
                                warehouse_id: whId,
                                product_id: detail.product_id,
                                transaction_type: "purchase_receipt",
                                reference_id: purchase._id,
                                reference_no: purchase.purchase_no,
                                quantity_before: qtyAfter - detail.quantity,
                                quantity_change: detail.quantity,
                                quantity_after: qtyAfter,
                                created_by: userId,
                            },
                        ],
                        session ? { session } : {}
                    );
                }
            }

            const updated = await Purchase.findByIdAndUpdate(
                purchaseId,
                { purchase_status: newStatus, warehouse_id: whId, updated_by: userId },
                { new: true, ...(session ? { session } : {}) }
            );

            return { purchase: updated, ...(returnInfo && { returnInfo }) };
        });
    }
}

export default new PurchaseService();
