// model for user for inventory management system
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        role: {
            type: String,
            enum: ["admin", "manager", "customer"],
            default: "customer",
        },
        assigned_warehouses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Warehouse",
            },
        ],
        phone: {
            type: String,
            default: "",
            trim: true,
        },
        shipping_addresses: [
            {
                street: { type: String, default: "" },
                address_line: { type: String, default: "" },
                city: { type: String, default: "" },
                state: { type: String, default: "" },
                pincode: { type: String, default: "" },
                postal_code: { type: String, default: "" },
                country: { type: String, default: "India" },
                is_default: { type: Boolean, default: false },
            },
        ],
        verifyOtp: {
            type: String,
            default: "",
        },
        verifyOtpExpiry: {
            type: Number,
            default: 0,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        resetOtp: {
            type: String,
            default: "",
        },
        resetOtpExpiry: {
            type: Number,
            default: 0,
        },
        avatar: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!enteredPassword || !this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const User = mongoose.model("User", userSchema);
