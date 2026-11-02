import mongoose from "mongoose";

const stockTransferItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    requested_quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"],
    },
    shipped_quantity: {
        type: Number,
        default: 0,
        min: 0,
    },
    received_quantity: {
        type: Number,
        default: 0,
        min: 0,
    },
});

const stockTransferSchema = new mongoose.Schema(
    {
        transfer_no: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        source_warehouse_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: true,
        },
        destination_warehouse_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: true,
        },
        status: {
            type: String,
            enum: ["draft", "pending", "in_transit", "completed", "cancelled"],
            default: "pending",
        },
        items: [stockTransferItemSchema],
        carrier_details: {
            carrier_name: { type: String, default: "" },
            tracking_number: { type: String, default: "" },
            vehicle_no: { type: String, default: "" },
        },
        transfer_date: {
            type: Date,
            default: Date.now,
        },
        shipped_date: {
            type: Date,
        },
        received_date: {
            type: Date,
        },
        notes: {
            type: String,
            default: "",
            trim: true,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

stockTransferSchema.index({ transfer_no: 1, created_by: 1 });
stockTransferSchema.index({ source_warehouse_id: 1, status: 1 });
stockTransferSchema.index({ destination_warehouse_id: 1, status: 1 });

export const StockTransfer = mongoose.model("StockTransfer", stockTransferSchema);
