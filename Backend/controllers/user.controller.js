import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { Warehouse } from "../models/warehouse.model.js";
import { Customer } from "../models/customer.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import transporter from "../utils/nodemailer.js";
import {
    getWelcomeEmailTemplate,
    getOtpEmailTemplate,
    getPasswordResetEmailTemplate,
    getGeneralNotificationEmailTemplate,
} from "../utils/emailTemplates.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating referesh and access token"
        );
    }
};

// Password Requirements Validator (minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
const validatePasswordRequirements = (password) => {
    if (!password || password.length < 8) {
        return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter (A-Z)";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter (a-z)";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number (0-9)";
    }
    if (!/[@$!%*?&#^()_+=\-[\]{}|;:'",.<>\/`~]/.test(password)) {
        return "Password must contain at least one special character (@$!%*?&# etc.)";
    }
    return null;
};

const registerUser = asyncHandler(async (req, res, next) => {
    const { email, username, password } = req.body;

    if ([email, username, password].some((field) => field?.trim() === "")) {
        return next(new ApiError(400, "All fields are required"));
    }

    const passwordError = validatePasswordRequirements(password);
    if (passwordError) {
        return next(new ApiError(400, passwordError));
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        return next(
            new ApiError(409, "User with email or username already exists")
        );
    }

    // Handle avatar upload - check both req.files and req.file
    let avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`;
    let avatarFile = null;
    if (req.files?.avatar?.[0]) {
        avatarFile = req.files.avatar[0];
    } else if (req.file) {
        avatarFile = req.file;
    }

    if (avatarFile) {
        try {
            const avatar = await uploadToCloudinary(avatarFile);
            if (avatar?.url) {
                avatarUrl = avatar.url;
            }
        } catch (uploadErr) {
            console.warn("Avatar upload fallback to default:", uploadErr.message);
        }
    }

    const totalUsersCount = await User.countDocuments();
    const isFirstUser = totalUsersCount === 0;
    const isOwnerEmail = ["thejaklu@gmail.com", "rayapatiravitheja@gmail.com"].includes(email.toLowerCase());
    const assignedRole = (isFirstUser || isOwnerEmail) ? "admin" : "customer";

    const user = await User.create({
        avatar: avatarUrl,
        email,
        password,
        username: username.toLowerCase(),
        role: assignedRole,
        isVerified: true,
    });

    // Automatically create a linked customer profile for customer users
    try {
        if (assignedRole === "customer") {
            await Customer.create({
                name: username,
                email: email,
                phone: req.body.phone || "0000000000",
                address: req.body.address || "N/A",
                user_id: user._id,
                created_by: user._id,
            });
        }
    } catch (e) {
        console.log("Auto-customer create note:", e.message);
    }

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        return next(
            new ApiError(500, "Something went wrong while registering the user")
        );
    }

    // Sending Welcome Email
    const template = getWelcomeEmailTemplate({
        username: createdUser.username,
        loginUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`,
    });
    const mailOptions = {
        from: `"InventoryPro" <${process.env.SENDER_EMAIL}>`,
        to: createdUser.email,
        ...template,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (mailError) {
        console.warn("⚠️ Welcome email could not be sent (SMTP not configured):", mailError.message);
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered Successfully")
        );
});

const loginUser = asyncHandler(async (req, res, next) => {
    const { email, username, password } = req.body;

    if ((!username && !email) || !password) {
        return next(new ApiError(400, "Username or email and password are required"));
    }

    const inputIdentifier = (email || username || "").trim();
    const lowerIdentifier = inputIdentifier.toLowerCase();

    const user = await User.findOne({
        $or: [
            { email: lowerIdentifier },
            { username: lowerIdentifier },
            { email: inputIdentifier },
            { username: inputIdentifier },
        ],
    });

    if (!user) {
        return next(new ApiError(404, "User does not exist with this email or username"));
    }

    const isPasswordValid = await user.matchPassword(password.trim ? password.trim() : password);

    if (!isPasswordValid) {
        return next(new ApiError(401, "Invalid user credentials. Please check your password."));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // Updated cookie options for deployment
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Changed for cross-origin
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged In Successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1, // this removes the field from document
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const incomingRefreshToken =
        req.cookies.refreshToken ||
        req.body.refreshToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    console.log("Refresh token sources:", {
        cookies: !!req.cookies?.refreshToken,
        body: !!req.body?.refreshToken,
        header: !!req.header("Authorization"),
    });

    if (!incomingRefreshToken) {
        return next(
            new ApiError(401, "Unauthorized request - No refresh token")
        );
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            return next(
                new ApiError(401, "Invalid refresh token - User not found")
            );
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            return next(new ApiError(401, "Refresh token is expired or used"));
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
            path: "/",
        };

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, {
                ...options,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours for access token
            })
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        console.error("Refresh token error:", error);
        return next(
            new ApiError(401, error?.message || "Invalid refresh token")
        );
    }
});

const changeCurrentPassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    const passwordError = validatePasswordRequirements(newPassword);
    if (passwordError) {
        return next(new ApiError(400, passwordError));
    }

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.matchPassword(oldPassword);

    if (!isPasswordCorrect) {
        return next(new ApiError(400, "Invalid old password"));
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res, next) => {
    const { username } = req.body;

    if (!username) {
        return next(new ApiError(400, "All fields are required"));
    }

    // username must be unique
    const existed = await User.findOne({ username: username.toLowerCase() });

    if (existed) {
        return next(new ApiError(409, "Username already exists"));
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                username: username.toLowerCase(),
            },
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );
});

const updateUserAvatar = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ApiError(400, "Avatar file is missing"));
    }

    const avatar = await uploadToCloudinary(req.file);

    if (!avatar?.url) {
        return next(new ApiError(400, "Error while uploading avatar"));
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res, next) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

// Send verification otp to users email
const sendVerifyOtp = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user._id; // userId is coming from verifyJWT middleware
        const user = await User.findById(userId);

        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        if (user.isVerified) {
            return next(new ApiError(400, "User is already verified"));
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        user.verifyOtp = otp;
        user.verifyOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save({ validateBeforeSave: false });

        const template = getOtpEmailTemplate({
            username: user.username,
            otp,
            title: "Account Verification",
            purpose: "verify your email address",
            expiryMinutes: 10,
        });
        const mailOptions = {
            from: `"InventoryPro" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
            to: user.email,
            ...template,
        };
        console.log(`🔑 Verification OTP for ${user.email}: ${otp}`);
        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.warn("⚠️ Verification email could not be sent (OTP logged above):", mailError.message);
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        email: user.email,
                        devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
                    },
                    "Verification OTP sent to your email successfully"
                )
            );
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

// Send verification otp to users email for changing password
const sendChangePasswordOtp = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user._id; // userId is coming from verifyJWT middleware
        const user = await User.findById(userId);

        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        user.verifyOtp = otp;
        user.verifyOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save({ validateBeforeSave: false });

        const template = getOtpEmailTemplate({
            username: user.username,
            otp,
            title: "Change Password Verification",
            purpose: "change your account password",
            expiryMinutes: 10,
        });
        const mailOptions = {
            from: `"InventoryPro" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
            to: user.email,
            ...template,
        };
        console.log(`🔑 Change Password OTP for ${user.email}: ${otp}`);
        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.warn("⚠️ Change password email could not be sent (OTP logged above):", mailError.message);
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        email: user.email,
                        devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
                    },
                    "Verification OTP sent to your email successfully"
                )
            );
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

// Verify user email for changing password
const verifyChangePasswordOtp = asyncHandler(async (req, res, next) => {
    const { otp } = req.body;
    const userId = req.user._id; // userId is coming from verifyJWT middleware

    if (!userId || !otp) {
        return next(new ApiError(400, "UserId and OTP are required"));
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        if (user.verifyOtp !== otp || user.verifyOtp === "") {
            return next(new ApiError(400, "Invalid OTP"));
        }

        if (!user.verifyOtpExpiry || user.verifyOtpExpiry < Date.now()) {
            return next(new ApiError(400, "OTP expired"));
        }

        user.verifyOtp = "";
        user.verifyOtpExpiry = 0;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json(new ApiResponse(200, {}, "OTP verified"));
    } catch (error) {
        return next(new ApiError(400, "Invalid OTP or User"));
    }
});

// Verify user email
const verifyEmail = asyncHandler(async (req, res, next) => {
    const { otp } = req.body;
    const userId = req.user._id; // userId is coming from verifyJWT middleware

    if (!userId || !otp) {
        return next(new ApiError(400, "UserId and OTP are required"));
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        if (user.isVerified) {
            return next(new ApiError(400, "User is already verified"));
        }

        if (user.verifyOtp !== otp || user.verifyOtp === "") {
            return next(new ApiError(400, "Invalid OTP"));
        }

        if (!user.verifyOtpExpiry || user.verifyOtpExpiry < Date.now()) {
            return next(new ApiError(400, "OTP expired"));
        }

        user.isVerified = true;
        user.verifyOtp = "";
        user.verifyOtpExpiry = 0;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "User verified successfully"));
    } catch (error) {
        return next(new ApiError(400, "Invalid OTP or User"));
    }
});

// Check if user is authenticated
const isAuthenticated = asyncHandler(async (req, res, next) => {
    try {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "User is authenticated"));
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
});

// Send reset otp to users email
const sendResetOtp = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new ApiError(400, "Email is required"));
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        user.resetOtp = otp;
        user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save({ validateBeforeSave: false });

        const template = getPasswordResetEmailTemplate({
            username: user.username,
            otp,
            expiryMinutes: 10,
        });
        const mailOptions = {
            from: `"InventoryPro" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
            to: email,
            ...template,
        };

        console.log(`🔑 Reset Password OTP for ${user.email}: ${otp}`);
        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.warn("⚠️ Reset password email could not be sent (OTP logged above):", mailError.message);
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Password reset OTP sent to your email successfully"
                )
            );
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

// Reset user password
const resetPassword = asyncHandler(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return next(
            new ApiError(400, "Email, OTP and New Password are required")
        );
    }

    const passwordError = validatePasswordRequirements(newPassword);
    if (passwordError) {
        return next(new ApiError(400, passwordError));
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        if (user.resetOtp !== otp || user.resetOtp === "") {
            return next(new ApiError(400, "Invalid OTP"));
        }

        if (!user.resetOtpExpiry || user.resetOtpExpiry < Date.now()) {
            return next(new ApiError(400, "OTP expired"));
        }

        user.password = newPassword;
        user.resetOtp = "";
        user.resetOtpExpiry = 0;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password reset successfully"));
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

// ==================== RBAC & ADMIN USER MANAGEMENT ====================

// Admin: Get all users with filters and pagination
const getAllUsersAdmin = asyncHandler(async (req, res, next) => {
    try {
        const { search = "", role = "", page = 1, limit = 20 } = req.query;
        const query = {};

        if (role && ["admin", "manager", "customer"].includes(role)) {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [users, total] = await Promise.all([
            User.find(query)
                .select("-password -refreshToken -verifyOtp -resetOtp")
                .populate("assigned_warehouses", "warehouse_name warehouse_code")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query),
        ]);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    users,
                    pagination: {
                        current: parseInt(page),
                        pageSize: parseInt(limit),
                        total,
                        pages: Math.ceil(total / parseInt(limit)),
                    },
                },
                "Users fetched successfully"
            )
        );
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

// Admin: Update user role (Only authorized Admin can assign Manager or Admin roles; cannot change own role)
const updateUserRoleAdmin = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !["admin", "manager", "customer"].includes(role)) {
            return next(new ApiError(400, "Valid role ('admin', 'manager', 'customer') is required"));
        }

        // Prevent self-role modification
        if (req.user._id.toString() === id.toString()) {
            return next(new ApiError(403, "Admins cannot change their own role"));
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return next(new ApiError(404, "User not found"));
        }

        targetUser.role = role;
        // If demoted from manager, clear warehouse assignments
        if (role !== "manager") {
            targetUser.assigned_warehouses = [];
            await Warehouse.updateMany(
                { managers: targetUser._id },
                { $pull: { managers: targetUser._id } }
            );
        }

        await targetUser.save({ validateBeforeSave: false });

        const updatedUser = await User.findById(id)
            .select("-password -refreshToken")
            .populate("assigned_warehouses", "warehouse_name warehouse_code");

        return res
            .status(200)
            .json(new ApiResponse(200, updatedUser, `User role updated to ${role} successfully`));
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

// Admin: Assign warehouses to a Manager
const assignUserWarehousesAdmin = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { warehouseIds = [] } = req.body;

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return next(new ApiError(404, "User not found"));
        }

        if (targetUser.role !== "manager" && targetUser.role !== "admin") {
            return next(new ApiError(400, "Warehouses can only be assigned to Managers or Admins"));
        }

        // Update user's assigned_warehouses
        targetUser.assigned_warehouses = warehouseIds;
        await targetUser.save({ validateBeforeSave: false });

        // Synchronize Warehouse.managers
        await Warehouse.updateMany(
            { _id: { $in: warehouseIds } },
            { $addToSet: { managers: targetUser._id } }
        );
        await Warehouse.updateMany(
            { _id: { $nin: warehouseIds }, managers: targetUser._id },
            { $pull: { managers: targetUser._id } }
        );

        const updatedUser = await User.findById(id)
            .select("-password -refreshToken")
            .populate("assigned_warehouses", "warehouse_name warehouse_code");

        return res
            .status(200)
            .json(new ApiResponse(200, updatedUser, "Assigned warehouses updated successfully"));
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

// Admin: Get list of all managers for assignment dropdowns
const getManagersAdmin = asyncHandler(async (req, res, next) => {
    try {
        const managers = await User.find({ role: "manager" })
            .select("_id username email assigned_warehouses")
            .populate("assigned_warehouses", "warehouse_name warehouse_code");

        return res
            .status(200)
            .json(new ApiResponse(200, managers, "Managers fetched successfully"));
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

// Customer: Update contact profile & phone / username
const updateCustomerProfile = asyncHandler(async (req, res, next) => {
    try {
        const { phone, username } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        if (username && username.trim().toLowerCase() !== user.username) {
            const existed = await User.findOne({ username: username.trim().toLowerCase() });
            if (existed && existed._id.toString() !== user._id.toString()) {
                return next(new ApiError(409, "Username is already taken by another account"));
            }
            user.username = username.trim().toLowerCase();
        }

        if (phone !== undefined) user.phone = phone.trim();
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Profile updated successfully"));
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

// Customer: Add shipping address
const addShippingAddress = asyncHandler(async (req, res, next) => {
    try {
        const streetVal = req.body.street || req.body.address_line;
        const pincodeVal = req.body.pincode || req.body.postal_code;
        const cityVal = req.body.city;
        const stateVal = req.body.state || "";
        const countryVal = req.body.country || "India";
        const isDefaultVal = req.body.is_default || false;

        if (!streetVal || !cityVal || !pincodeVal) {
            return next(new ApiError(400, "Street/address_line, city, and pincode/postal_code are required"));
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        if (isDefaultVal) {
            user.shipping_addresses.forEach((addr) => {
                addr.is_default = false;
            });
        }

        user.shipping_addresses.push({
            street: streetVal,
            address_line: streetVal,
            city: cityVal,
            state: stateVal,
            pincode: pincodeVal,
            postal_code: pincodeVal,
            country: countryVal,
            is_default: isDefaultVal || user.shipping_addresses.length === 0,
        });

        await user.save({ validateBeforeSave: false });

        return res
            .status(201)
            .json(new ApiResponse(201, user.shipping_addresses, "Shipping address added"));
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

// Customer: Set default shipping address
const setDefaultShippingAddress = asyncHandler(async (req, res, next) => {
    try {
        const { addressId } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        let found = false;
        user.shipping_addresses.forEach((addr) => {
            if (addr._id.toString() === addressId.toString()) {
                addr.is_default = true;
                found = true;
            } else {
                addr.is_default = false;
            }
        });

        if (!found) {
            return next(new ApiError(404, "Shipping address not found"));
        }

        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, user.shipping_addresses, "Default address set successfully"));
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

// Customer: Delete shipping address
const deleteShippingAddress = asyncHandler(async (req, res, next) => {
    try {
        const { addressId } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        const wasDefault = user.shipping_addresses.some(
            (addr) => addr._id.toString() === addressId.toString() && addr.is_default
        );

        user.shipping_addresses = user.shipping_addresses.filter(
            (addr) => addr._id.toString() !== addressId.toString()
        );

        // If the deleted address was default and there are remaining addresses, set the first as default
        if (wasDefault && user.shipping_addresses.length > 0) {
            user.shipping_addresses[0].is_default = true;
        }

        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, user.shipping_addresses, "Address deleted"));
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    getCurrentUser,
    sendVerifyOtp,
    verifyEmail,
    isAuthenticated,
    sendResetOtp,
    resetPassword,
    sendChangePasswordOtp,
    verifyChangePasswordOtp,
    getAllUsersAdmin,
    updateUserRoleAdmin,
    assignUserWarehousesAdmin,
    getManagersAdmin,
    updateCustomerProfile,
    addShippingAddress,
    setDefaultShippingAddress,
    deleteShippingAddress,
};

