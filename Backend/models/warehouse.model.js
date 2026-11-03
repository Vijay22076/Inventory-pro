import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema(
    {
        warehouse_name: {
            type: String,
            required: [true, "Warehouse name is required"],
            trim: true,
            maxlength: 100,
        },
        warehouse_code: {
            type: String,
            required: [true, "Warehouse code is required"],
            uppercase: true,
            trim: true,
            maxlength: 20,
        },
        type: {
            type: String,
            enum: ["central", "regional_hub", "fulfillment_center", "retail_store"],
            default: "regional_hub",
        },
        address: {
            street: { type: String, default: "" },
            city: { type: String, required: [true, "City is required"], trim: true },
            state: { type: String, default: "", trim: true },
            country: { type: String, default: "India", trim: true },
            pincode: {
                type: String,
                default: "",
                trim: true,
                validate: {
                    validator: function (v) {
                        return !v || /^\d{6}$/.test(v);
                    },
                    message: "Postal / PIN code must be exactly 6 digits (0-9)",
                },
            },
        },
        contact_person: {
            name: { type: String, default: "", trim: true },
            email: { type: String, default: "", trim: true },
            phone: { type: String, default: "", trim: true },
        },
        total_capacity_sqft: {
            type: Number,
            default: 5000,
            min: 0,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        is_default: {
            type: Boolean,
            default: false,
        },
        managers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

warehouseSchema.index({ warehouse_code: 1, created_by: 1 }, { unique: true });

export const Warehouse = mongoose.model("Warehouse", warehouseSchema);
