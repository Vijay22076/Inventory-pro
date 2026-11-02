import mongoose from "mongoose";
import {
    StockTransfer,
    Warehouse,
    WarehouseStock,
    StockLedger,
    Product,
} from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { warehouseService } from "./warehouse.service.js";
import { runWithOptionalTransaction } from "../utils/transaction.js";

class TransferService {
    async createTransfer(data, userId) {
        const {
            source_warehouse_id,
            destination_warehouse_id,
            items,
            carrier_details,
            notes,
        } = data;

        if (!source_warehouse_id || !destination_warehouse_id) {
            throw new ApiError(
                400,
                "Both source and destination warehouses are required"
            );
        }

        if (source_warehouse_id.toString() === destination_warehouse_id.toString()) {
            throw new ApiError(
                400,
                "Source and destination warehouses cannot be the same"
            );
        }

        if (!Array.isArray(items) || items.length === 0) {
            throw new ApiError(400, "At least one item must be transferred");
        }

        // Verify warehouses exist
        const [sourceWh, destWh] = await Promise.all([
            Warehouse.findById(source_warehouse_id),
            Warehouse.findById(destination_warehouse_id),
        ]);

        if (!sourceWh || !destWh) {
            throw new ApiError(404, "One or both warehouses not found");
        }

        // Validate stock availability at source warehouse
        for (const item of items) {
            if (!item.product_id || !item.requested_quantity || item.requested_quantity < 1) {
                throw new ApiError(400, "Valid product and positive quantity required for each item");
            }

            const stock = await WarehouseStock.findOne({
                warehouse_id: source_warehouse_id,
                product_id: item.product_id,
            });

            const available = stock ? stock.quantity - (stock.reserved_quantity || 0) : 0;
            if (available < item.requested_quantity) {
                const product = await Product.findById(item.product_id).select("product_name product_code");
                throw new ApiError(
                    422,
                    `Insufficient stock for "${product?.product_name || item.product_id}" at ${sourceWh.warehouse_name}. Requested: ${item.requested_quantity}, Available: ${available}`
                );
            }
        }

        const transfer_no = `TR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        const transfer = await StockTransfer.create({
            transfer_no,
            source_warehouse_id,
            destination_warehouse_id,
            status: "pending",
            items: items.map((i) => ({
                product_id: i.product_id,
                requested_quantity: i.requested_quantity,
                shipped_quantity: i.requested_quantity,
                received_quantity: 0,
            })),
            carrier_details: carrier_details || {},
            notes: notes || "",
            created_by: userId,
        });

        return transfer;
    }

    async dispatchTransfer(transferId, carrierDetails, userId) {
        const transfer = await StockTransfer.findOne({
            _id: transferId,
            created_by: userId,
        });

        if (!transfer) {
            throw new ApiError(404, "Stock transfer not found");
        }

        if (transfer.status !== "pending") {
            throw new ApiError(
                400,
                `Cannot dispatch transfer with status "${transfer.status}". Must be "pending".`
            );
        }

        return await runWithOptionalTransaction(async (session) => {
            // Deduct stock from source warehouse
            for (const item of transfer.items) {
                const stockBefore = await WarehouseStock.findOne({
                    warehouse_id: transfer.source_warehouse_id,
                    product_id: item.product_id,
                }).session(session || null);

                const currentQty = stockBefore ? stockBefore.quantity : 0;
                if (currentQty < item.shipped_quantity) {
                    throw new ApiError(
                        422,
                        `Insufficient stock at source warehouse for product ${item.product_id}`
                    );
                }

                await WarehouseStock.updateOne(
                    { warehouse_id: transfer.source_warehouse_id, product_id: item.product_id },
                    { $inc: { quantity: -item.shipped_quantity } },
                    session ? { session } : {}
                );

                // Write to StockLedger
                await StockLedger.create(
                    [
                        {
                            warehouse_id: transfer.source_warehouse_id,
                            product_id: item.product_id,
                            transaction_type: "transfer_out",
                            reference_id: transfer._id,
                            reference_no: transfer.transfer_no,
                            quantity_before: currentQty,
                            quantity_change: -item.shipped_quantity,
                            quantity_after: currentQty - item.shipped_quantity,
                            created_by: userId,
                        },
                    ],
                    session ? { session } : {}
                );
            }

            transfer.status = "in_transit";
            transfer.shipped_date = new Date();
            if (carrierDetails) {
                transfer.carrier_details = carrierDetails;
            }
            await transfer.save(session ? { session } : {});

            return transfer;
        });
    }

    async receiveTransfer(transferId, userId) {
        const transfer = await StockTransfer.findOne({
            _id: transferId,
            created_by: userId,
        });

        if (!transfer) {
            throw new ApiError(404, "Stock transfer not found");
        }

        if (transfer.status !== "in_transit") {
            throw new ApiError(
                400,
                `Cannot receive transfer with status "${transfer.status}". Must be "in_transit".`
            );
        }

        return await runWithOptionalTransaction(async (session) => {
            // Add stock to destination warehouse
            for (const item of transfer.items) {
                const stockBefore = await WarehouseStock.findOne({
                    warehouse_id: transfer.destination_warehouse_id,
                    product_id: item.product_id,
                }).session(session || null);

                const currentQty = stockBefore ? stockBefore.quantity : 0;
                const qtyToAdd = item.shipped_quantity;

                await WarehouseStock.findOneAndUpdate(
                    {
                        warehouse_id: transfer.destination_warehouse_id,
                        product_id: item.product_id,
                    },
                    {
                        $inc: { quantity: qtyToAdd },
                        $setOnInsert: {
                            created_by: userId,
                            reserved_quantity: 0,
                            bin_location: "A-01-01",
                        },
                    },
                    { upsert: true, session: session || null }
                );

                item.received_quantity = qtyToAdd;

                // Write to StockLedger
                await StockLedger.create(
                    [
                        {
                            warehouse_id: transfer.destination_warehouse_id,
                            product_id: item.product_id,
                            transaction_type: "transfer_in",
                            reference_id: transfer._id,
                            reference_no: transfer.transfer_no,
                            quantity_before: currentQty,
                            quantity_change: qtyToAdd,
                            quantity_after: currentQty + qtyToAdd,
                            created_by: userId,
                        },
                    ],
                    session ? { session } : {}
                );

                // Global Product.stock remains balanced, but sync to be certain
                await warehouseService.syncProductStock(item.product_id, session);
            }

            transfer.status = "completed";
            transfer.received_date = new Date();
            await transfer.save(session ? { session } : {});

            return transfer;
        });
    }

    async cancelTransfer(transferId, userId) {
        const transfer = await StockTransfer.findOne({
            _id: transferId,
            created_by: userId,
        });

        if (!transfer) {
            throw new ApiError(404, "Stock transfer not found");
        }

        if (["completed", "cancelled"].includes(transfer.status)) {
            throw new ApiError(
                400,
                `Cannot cancel transfer already in status "${transfer.status}"`
            );
        }

        return await runWithOptionalTransaction(async (session) => {
            // If it was already dispatched (in_transit), refund deducted items back to source warehouse
            if (transfer.status === "in_transit") {
                for (const item of transfer.items) {
                    const stockBefore = await WarehouseStock.findOne({
                        warehouse_id: transfer.source_warehouse_id,
                        product_id: item.product_id,
                    }).session(session || null);

                    const currentQty = stockBefore ? stockBefore.quantity : 0;

                    await WarehouseStock.updateOne(
                        {
                            warehouse_id: transfer.source_warehouse_id,
                            product_id: item.product_id,
                        },
                        { $inc: { quantity: item.shipped_quantity } },
                        session ? { session } : {}
                    );

                    await StockLedger.create(
                        [
                            {
                                warehouse_id: transfer.source_warehouse_id,
                                product_id: item.product_id,
                                transaction_type: "transfer_in",
                                reference_id: transfer._id,
                                reference_no: `${transfer.transfer_no}-CANCELLED`,
                                quantity_before: currentQty,
                                quantity_change: item.shipped_quantity,
                                quantity_after: currentQty + item.shipped_quantity,
                                created_by: userId,
                            },
                        ],
                        session ? { session } : {}
                    );
                }
            }

            transfer.status = "cancelled";
            await transfer.save(session ? { session } : {});

            return transfer;
        });
    }

    async listTransfers(userId, filters = {}) {
        const query = { created_by: userId };
        if (filters.status) query.status = filters.status;
        if (filters.warehouse_id) {
            query.$or = [
                { source_warehouse_id: filters.warehouse_id },
                { destination_warehouse_id: filters.warehouse_id },
            ];
        }

        return StockTransfer.find(query)
            .populate("source_warehouse_id", "warehouse_name warehouse_code")
            .populate("destination_warehouse_id", "warehouse_name warehouse_code")
            .populate("items.product_id", "product_name product_code buying_price product_image")
            .sort({ createdAt: -1 })
            .lean();
    }

    async getTransferById(id, userId) {
        const transfer = await StockTransfer.findOne({
            _id: id,
            created_by: userId,
        })
            .populate("source_warehouse_id")
            .populate("destination_warehouse_id")
            .populate("items.product_id")
            .lean();

        if (!transfer) {
            throw new ApiError(404, "Stock transfer not found");
        }

        return transfer;
    }
}

export const transferService = new TransferService();
