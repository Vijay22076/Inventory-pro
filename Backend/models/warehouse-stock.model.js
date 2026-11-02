import mongoose from "mongoose";

const warehouseStockSchema = new mongoose.Schema(
    {
        warehouse_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
            min: [0, "Stock quantity cannot be negative"],
        },
        reserved_quantity: {
            type: Number,
            default: 0,
            min: [0, "Reserved quantity cannot be negative"],
        },
        bin_location: {
            type: String,
            default: "A-01-01",
            trim: true,
        },
        min_reorder_level: {
            type: Number,
            default: 10,
            min: 0,
        },
        max_capacity: {
            type: Number,
            default: 1000,
            min: 0,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

warehouseStockSchema.index(
    { warehouse_id: 1, product_id: 1 },
    { unique: true }
);

// Atomic addition to warehouse stock (e.g. on purchase, transfer in, adjustment)
warehouseStockSchema.statics.addStock = async function (
    warehouseId,
    productId,
    quantity,
    userId,
    session = null
) {
    return this.findOneAndUpdate(
        { warehouse_id: warehouseId, product_id: productId },
        {
            $inc: { quantity: quantity },
            $setOnInsert: {
                created_by: userId,
                reserved_quantity: 0,
                bin_location: "A-01-01",
            },
        },
        { upsert: true, new: true, session: session || null }
    );
};

// Atomic deduction from warehouse stock with guard against insufficient stock
warehouseStockSchema.statics.deductStock = async function (
    warehouseId,
    productId,
    quantity,
    session = null
) {
    return this.findOneAndUpdate(
        {
            warehouse_id: warehouseId,
            product_id: productId,
            quantity: { $gte: quantity },
        },
        { $inc: { quantity: -quantity } },
        { new: true, session: session || null }
    );
};

export const WarehouseStock = mongoose.model(
    "WarehouseStock",
    warehouseStockSchema
);
