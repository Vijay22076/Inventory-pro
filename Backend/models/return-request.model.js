import mongoose from "mongoose";

const returnRequestItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    reason: {
        type: String,
        default: "",
    },
});

const returnRequestSchema = new mongoose.Schema(
    {
        return_no: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [returnRequestItemSchema],
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "received"],
            default: "pending",
        },
        warehouse_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
        },
        admin_notes: {
            type: String,
            default: "",
        },
        refund_info: {
            refund_id: { type: String, default: "" },
            refund_amount: { type: Number, default: 0 },
            refund_status: { type: String, default: "" },
            refunded_at: { type: Date },
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);
