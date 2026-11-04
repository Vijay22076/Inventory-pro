import mongoose from "mongoose";

const stockLedgerSchema = new mongoose.Schema(
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
        transaction_type: {
            type: String,
            enum: [
                "purchase_receipt",
                "order_dispatch",
                "transfer_out",
                "transfer_in",
                "adjustment_add",
                "adjustment_deduct",
                "adjustment_sub",
                "purchase_return",
            ],
            required: true,
        },
        reference_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        reference_no: {
            type: String,
            required: true,
            trim: true,
        },
        quantity_before: {
            type: Number,
            required: true,
        },
        quantity_change: {
            type: Number,
            required: true, // +ve for incoming, -ve for outgoing
        },
        quantity_after: {
            type: Number,
            required: true,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

stockLedgerSchema.index({ warehouse_id: 1, product_id: 1, timestamp: -1 });
stockLedgerSchema.index({ reference_no: 1 });
stockLedgerSchema.index({ created_by: 1, timestamp: -1 });

export const StockLedger = mongoose.model("StockLedger", stockLedgerSchema);
