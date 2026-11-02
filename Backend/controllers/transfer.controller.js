import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { transferService } from "../services/transfer.service.js";

const getTransfers = asyncHandler(async (req, res) => {
    const transfers = await transferService.listTransfers(
        req.user._id,
        req.query
    );
    return res
        .status(200)
        .json(
            new ApiResponse(200, transfers, "Stock transfers fetched successfully")
        );
});

const getTransfer = asyncHandler(async (req, res) => {
    const transfer = await transferService.getTransferById(
        req.params.id,
        req.user._id
    );
    return res
        .status(200)
        .json(
            new ApiResponse(200, transfer, "Stock transfer fetched successfully")
        );
});

const createTransfer = asyncHandler(async (req, res) => {
    const transfer = await transferService.createTransfer(
        req.body,
        req.user._id
    );
    return res
        .status(201)
        .json(
            new ApiResponse(201, transfer, "Stock transfer created successfully")
        );
});

const dispatchTransfer = asyncHandler(async (req, res) => {
    const transfer = await transferService.dispatchTransfer(
        req.params.id,
        req.body.carrier_details,
        req.user._id
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                transfer,
                "Stock transfer dispatched (In Transit)"
            )
        );
});

const receiveTransfer = asyncHandler(async (req, res) => {
    const transfer = await transferService.receiveTransfer(
        req.params.id,
        req.user._id
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                transfer,
                "Stock transfer received and completed"
            )
        );
});

const cancelTransfer = asyncHandler(async (req, res) => {
    const transfer = await transferService.cancelTransfer(
        req.params.id,
        req.user._id
    );
    return res
        .status(200)
        .json(
            new ApiResponse(200, transfer, "Stock transfer cancelled successfully")
        );
});

export {
    getTransfers,
    getTransfer,
    createTransfer,
    dispatchTransfer,
    receiveTransfer,
    cancelTransfer,
};
