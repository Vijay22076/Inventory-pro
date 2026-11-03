import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    sendVerifyOtp,
    verifyEmail,
    isAuthenticated,
    sendResetOtp,
    resetPassword,
    updateAccountDetails,
    updateUserAvatar,
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
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
    ]),
    registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router
    .route("/avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/send-verify-otp").post(verifyJWT, sendVerifyOtp);
router.route("/verify-email").post(verifyJWT, verifyEmail);

router.route("/is-auth").post(verifyJWT, isAuthenticated);

router.route("/send-reset-otp").post(sendResetOtp);
router.route("/reset-password").post(resetPassword);

router
    .route("/send-change-password-otp")
    .post(verifyJWT, sendChangePasswordOtp);
router
    .route("/verify-change-password-otp")
    .post(verifyJWT, verifyChangePasswordOtp);

// ==================== RBAC: ADMIN USER MANAGEMENT ====================
router
    .route("/admin/all")
    .get(verifyJWT, requireRole("admin"), getAllUsersAdmin);
router
    .route("/admin/:id/role")
    .patch(verifyJWT, requireRole("admin"), updateUserRoleAdmin)
    .put(verifyJWT, requireRole("admin"), updateUserRoleAdmin);
router
    .route("/admin/:id/warehouses")
    .patch(verifyJWT, requireRole("admin"), assignUserWarehousesAdmin)
    .put(verifyJWT, requireRole("admin"), assignUserWarehousesAdmin);
router
    .route("/admin/managers")
    .get(verifyJWT, requireRole("admin"), getManagersAdmin);

// ==================== RBAC: CUSTOMER PROFILE & ADDRESSES ====================
router
    .route("/customer/profile")
    .patch(verifyJWT, updateCustomerProfile)
    .put(verifyJWT, updateCustomerProfile);

router
    .route("/customer/addresses")
    .post(verifyJWT, addShippingAddress);
router
    .route("/customer/shipping-addresses")
    .post(verifyJWT, addShippingAddress);

router
    .route("/customer/addresses/:addressId")
    .delete(verifyJWT, deleteShippingAddress);
router
    .route("/customer/shipping-addresses/:addressId")
    .delete(verifyJWT, deleteShippingAddress);

router
    .route("/customer/addresses/:addressId/default")
    .patch(verifyJWT, setDefaultShippingAddress)
    .put(verifyJWT, setDefaultShippingAddress);
router
    .route("/customer/shipping-addresses/:addressId/default")
    .patch(verifyJWT, setDefaultShippingAddress)
    .put(verifyJWT, setDefaultShippingAddress);

export default router;
