import mongoose from "mongoose";

const stockAdjustmentItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    system_quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    physical_quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    variance: {
        type: Number,
        required: true, // physical_quantity - system_quantity
    },
    unit_cost: {
        type: Number,
        default: 0,
    },
});

const stockAdjustmentSchema = new mongoose.Schema(
    {
        adjustment_no: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        warehouse_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: true,
        },
        reason: {
            type: String,
            enum: [
                "cycle_count",
                "damage",
                "expired",
                "theft_shrinkage",
                "audit_variance",
                "found_stock",
            ],
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "approved",
        },
        items: [stockAdjustmentItemSchema],
        notes: {
            type: String,
            default: "",
            trim: true,
        },
        approved_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        rejection_notes: {
            type: String,
            default: "",
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

stockAdjustmentSchema.index({ adjustment_no: 1, created_by: 1 });
stockAdjustmentSchema.index({ warehouse_id: 1, createdAt: -1 });

export const StockAdjustment = mongoose.model(
    "StockAdjustment",
    stockAdjustmentSchema
);
