import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { adjustmentService } from "../services/adjustment.service.js";

const getAdjustments = asyncHandler(async (req, res) => {
    const adjustments = await adjustmentService.listAdjustments(
        req.user._id,
        req.user.role,
        req.user.assigned_warehouses,
        req.query
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                adjustments,
                "Stock adjustments fetched successfully"
            )
        );
});

const getAdjustment = asyncHandler(async (req, res) => {
    const adjustment = await adjustmentService.getAdjustmentById(req.params.id);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                adjustment,
                "Stock adjustment fetched successfully"
            )
        );
});

const createAdjustment = asyncHandler(async (req, res) => {
    const adjustment = await adjustmentService.createAdjustment(
        req.body,
        req.user._id,
        req.user.role
    );
    const msg =
        req.user.role === "manager"
            ? "Stock adjustment submitted successfully and pending Admin approval"
            : "Stock adjustment created and applied successfully";
    return res.status(201).json(new ApiResponse(201, adjustment, msg));
});

const approveAdjustment = asyncHandler(async (req, res) => {
    const adjustment = await adjustmentService.approveAdjustment(
        req.params.id,
        req.user._id
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                adjustment,
                "Stock adjustment approved and inventory updated successfully"
            )
        );
});

const rejectAdjustment = asyncHandler(async (req, res) => {
    const adjustment = await adjustmentService.rejectAdjustment(
        req.params.id,
        req.user._id,
        req.body.notes || ""
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                adjustment,
                "Stock adjustment rejected"
            )
        );
});

export {
    getAdjustments,
    getAdjustment,
    createAdjustment,
    approveAdjustment,
    rejectAdjustment,
};
