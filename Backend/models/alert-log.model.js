import mongoose from "mongoose";

const alertLogSchema = new mongoose.Schema(
    {
        trigger_type: {
            type: String,
            enum: ["manual_test", "scheduled_cron", "order_event"],
            default: "manual_test",
        },
        triggered_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        recipient_email: {
            type: String,
            required: true,
        },
        recipient_name: {
            type: String,
        },
        products: [
            {
                product_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                },
                product_name: String,
                product_code: String,
                stock: Number,
                min_threshold: Number,
                category_name: String,
            },
        ],
        product_count: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["sent", "failed", "no_low_stock"],
            default: "sent",
        },
        message_id: String,
        error: String,
    },
    { timestamps: true }
);

export const AlertLog = mongoose.model("AlertLog", alertLogSchema);

