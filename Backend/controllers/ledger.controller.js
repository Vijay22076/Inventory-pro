import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { StockLedger } from "../models/index.js";

const getLedgerEntries = asyncHandler(async (req, res) => {
    const { warehouse_id, product_id, transaction_type, page = 1, limit = 50 } = req.query;

    const query = { created_by: req.user._id };
    if (warehouse_id) query.warehouse_id = warehouse_id;
    if (product_id) query.product_id = product_id;
    if (transaction_type) query.transaction_type = transaction_type;

    const [entries, total] = await Promise.all([
        StockLedger.find(query)
            .populate("warehouse_id", "warehouse_name warehouse_code")
            .populate("product_id", "product_name product_code buying_price")
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean(),
        StockLedger.countDocuments(query),
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { entries, total, page: parseInt(page), limit: parseInt(limit) },
                "Stock ledger entries fetched successfully"
            )
        );
});

export { getLedgerEntries };
