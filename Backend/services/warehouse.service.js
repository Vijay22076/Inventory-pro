import mongoose from "mongoose";
import { Warehouse, WarehouseStock, Product } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";

class WarehouseService {
    // Ensures every user has at least one default warehouse for backward compatibility
    async getOrCreateDefaultWarehouse(userId) {
        let defaultWh = await Warehouse.findOne({
            is_default: true,
        });

        if (!defaultWh) {
            defaultWh = await Warehouse.findOne({ type: "central" });
        }

        if (!defaultWh && userId) {
            defaultWh = await Warehouse.findOne({ created_by: userId });
        }

        if (!defaultWh) {
            defaultWh = await Warehouse.findOne();
        }

        if (!defaultWh) {
            defaultWh = await Warehouse.create({
                warehouse_name: "Main Central Warehouse",
                warehouse_code: "WH-CENTRAL-01",
                type: "central",
                address: {
                    city: "Primary Facility",
                    state: "",
                    country: "India",
                    pincode: "500001",
                },
                contact_person: {
                    name: "Operations Manager",
                },
                total_capacity_sqft: 10000,
                is_active: true,
                is_default: true,
                created_by: userId,
            });

            // Populate warehouse stock from existing products if any
            const existingProducts = await Product.find({ created_by: userId });
            if (existingProducts.length > 0) {
                const stockDocs = existingProducts.map((p) => ({
                    warehouse_id: defaultWh._id,
                    product_id: p._id,
                    quantity: p.stock || 0,
                    reserved_quantity: 0,
                    bin_location: "A-01-01",
                    created_by: userId,
                }));
                await WarehouseStock.insertMany(stockDocs, { ordered: false }).catch(
                    () => {}
                );
            }
        }

        return defaultWh;
    }

    async listWarehouses(userId, userRole = "admin", assignedWarehouses = []) {
        let filter = { created_by: userId };

        if (userRole === "manager") {
            const assignedIds = (assignedWarehouses || []).map((id) =>
                id?._id ? id._id : id
            );
            filter = {
                $or: [
                    { _id: { $in: assignedIds } },
                    { managers: userId },
                ],
            };
        } else if (userRole === "admin") {
            filter = {};
        }

        const warehouses = await Warehouse.find(filter)
            .populate("managers", "username email")
            .sort({ is_default: -1, createdAt: -1 })
            .lean();

        // Calculate statistics per warehouse
        const stats = await WarehouseStock.aggregate([
            {
                $match: {
                    warehouse_id: { $in: warehouses.map((w) => w._id) },
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product",
                },
            },
            { $unwind: "$product" },
            {
                $group: {
                    _id: "$warehouse_id",
                    totalProducts: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" },
                    totalValuation: {
                        $sum: { $multiply: ["$quantity", "$product.buying_price"] },
                    },
                },
            },
        ]);

        const statsMap = new Map(
            stats.map((s) => [s._id.toString(), s])
        );

        return warehouses.map((w) => {
            const st = statsMap.get(w._id.toString()) || {
                totalProducts: 0,
                totalQuantity: 0,
                totalValuation: 0,
            };
            return {
                ...w,
                totalProducts: st.totalProducts,
                totalQuantity: st.totalQuantity,
                totalValuation: Math.round(st.totalValuation * 100) / 100,
            };
        });
    }

    async createWarehouse(data, userId) {
        const { warehouse_name, warehouse_code, type, address, contact_person, total_capacity_sqft, is_default, managers } = data;

        if (!warehouse_name || !warehouse_code || !address?.city) {
            throw new ApiError(400, "Warehouse name, code, and city are required");
        }

        if (address?.pincode && !/^\d{6}$/.test(String(address.pincode).trim())) {
            throw new ApiError(400, "Postal / PIN code must be exactly 6 digits (0-9)");
        }

        const existing = await Warehouse.findOne({
            warehouse_code: warehouse_code.toUpperCase().trim(),
            created_by: userId,
        });

        if (existing) {
            throw new ApiError(409, `Warehouse code "${warehouse_code}" already exists`);
        }

        if (is_default) {
            await Warehouse.updateMany(
                { created_by: userId },
                { $set: { is_default: false } }
            );
        }

        const warehouse = await Warehouse.create({
            warehouse_name,
            warehouse_code: warehouse_code.toUpperCase().trim(),
            type: type || "regional_hub",
            address,
            contact_person,
            total_capacity_sqft: total_capacity_sqft || 5000,
            is_default: !!is_default,
            managers: managers || [],
            created_by: userId,
        });

        return warehouse;
    }

    async getWarehouseById(id, userId, userRole = "admin", assignedWarehouses = []) {
        let filter = { _id: id };
        if (userRole === "admin") {
            filter.created_by = userId;
        } else if (userRole === "manager") {
            const assignedIds = (assignedWarehouses || []).map((wId) =>
                wId?._id ? wId._id.toString() : wId.toString()
            );
            if (!assignedIds.includes(id.toString())) {
                filter.managers = userId;
            }
        }

        const warehouse = await Warehouse.findOne(filter)
            .populate("managers", "username email")
            .lean();

        if (!warehouse) {
            throw new ApiError(404, "Warehouse not found or access unauthorized");
        }

        return warehouse;
    }

    async updateWarehouse(id, data, userId) {
        const warehouse = await Warehouse.findOne({ _id: id, created_by: userId });
        if (!warehouse) {
            throw new ApiError(404, "Warehouse not found");
        }

        if (data.address?.pincode && !/^\d{6}$/.test(String(data.address.pincode).trim())) {
            throw new ApiError(400, "Postal / PIN code must be exactly 6 digits (0-9)");
        }

        if (data.is_default && !warehouse.is_default) {
            await Warehouse.updateMany(
                { created_by: userId },
                { $set: { is_default: false } }
            );
        }

        Object.assign(warehouse, data);
        await warehouse.save();
        return warehouse;
    }

    async deleteWarehouse(id, userId) {
        const warehouse = await Warehouse.findOne({ _id: id, created_by: userId });
        if (!warehouse) {
            throw new ApiError(404, "Warehouse not found");
        }

        // Check if warehouse has active stock
        const totalStock = await WarehouseStock.aggregate([
            { $match: { warehouse_id: new mongoose.Types.ObjectId(id) } },
            { $group: { _id: null, total: { $sum: "$quantity" } } },
        ]);

        if (totalStock.length > 0 && totalStock[0].total > 0) {
            throw new ApiError(
                400,
                `Cannot delete warehouse containing ${totalStock[0].total} units of stock. Transfer or adjust stock first.`
            );
        }

        await Warehouse.deleteOne({ _id: id });
        await WarehouseStock.deleteMany({ warehouse_id: id });
        return { message: "Warehouse deleted successfully" };
    }

    async getWarehouseStock(warehouseId, userId, query = {}) {
        const { search, page = 1, limit = 50 } = query;

        const match = {
            warehouse_id: new mongoose.Types.ObjectId(warehouseId),
            created_by: new mongoose.Types.ObjectId(userId),
        };

        const pipeline = [
            { $match: match },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product",
                },
            },
            { $unwind: "$product" },
            {
                $lookup: {
                    from: "categories",
                    localField: "product.category_id",
                    foreignField: "_id",
                    as: "category",
                },
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true,
                },
            },
        ];

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { "product.product_name": { $regex: search, $options: "i" } },
                        { "product.product_code": { $regex: search, $options: "i" } },
                        { bin_location: { $regex: search, $options: "i" } },
                    ],
                },
            });
        }

        pipeline.push(
            { $sort: { "product.product_name": 1 } },
            { $skip: (page - 1) * limit },
            { $limit: parseInt(limit) }
        );

        const stockItems = await WarehouseStock.aggregate(pipeline);
        return stockItems;
    }

    // Helper to keep Product.stock = sum(WarehouseStock.quantity)
    async syncProductStock(productId, session = null) {
        const agg = await WarehouseStock.aggregate([
            { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
            { $group: { _id: null, total: { $sum: "$quantity" } } },
        ]);

        const totalStock = agg.length > 0 ? agg[0].total : 0;
        await Product.findByIdAndUpdate(
            productId,
            { stock: totalStock },
            session ? { session } : {}
        );
        return totalStock;
    }
}

export const warehouseService = new WarehouseService();
