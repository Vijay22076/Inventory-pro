import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Middleware to enforce exact role requirements
 * @param  {...string} roles Allowed roles: "admin", "manager", "customer"
 */
export const requireRole = (...roles) => {
    return (req, _, next) => {
        if (!req.user) {
            return next(new ApiError(401, "Authentication required"));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new ApiError(
                    403,
                    `Access denied. Requires one of the following roles: ${roles.join(", ")}`
                )
            );
        }

        next();
    };
};

/**
 * Middleware to restrict warehouse operations to Admin or assigned Managers
 */
export const requireWarehouseAccess = asyncHandler(async (req, _, next) => {
    if (!req.user) {
        return next(new ApiError(401, "Authentication required"));
    }

    if (req.user.role === "admin") {
        return next();
    }

    if (req.user.role === "customer") {
        return next(
            new ApiError(403, "Access denied: Customers cannot access warehouse operations")
        );
    }

    if (req.user.role === "manager") {
        const targetWhId =
            req.params.id ||
            req.params.warehouseId ||
            req.body.warehouse_id ||
            req.query.warehouse_id;

        // For transfers, check source or destination
        const sourceWhId = req.body.source_warehouse_id || req.query.source_warehouse_id;
        const targetWhIdTransfer = req.body.target_warehouse_id || req.query.target_warehouse_id;

        const assigned = (req.user.assigned_warehouses || []).map((id) =>
            id?._id ? id._id.toString() : id.toString()
        );

        if (targetWhId) {
            if (!assigned.includes(targetWhId.toString())) {
                return next(
                    new ApiError(
                        403,
                        "Access denied: You are not assigned to manage this warehouse"
                    )
                );
            }
        } else if (sourceWhId || targetWhIdTransfer) {
            const hasAccess =
                (sourceWhId && assigned.includes(sourceWhId.toString())) ||
                (targetWhIdTransfer && assigned.includes(targetWhIdTransfer.toString()));

            if (!hasAccess) {
                return next(
                    new ApiError(
                        403,
                        "Access denied: You must be assigned to either the origin or destination warehouse"
                    )
                );
            }
        }

        return next();
    }

    return next(new ApiError(403, "Access denied"));
});

/**
 * Middleware ensuring customers only view or modify their own records
 */
export const requireCustomerOwnership = asyncHandler(async (req, _, next) => {
    if (!req.user) {
        return next(new ApiError(401, "Authentication required"));
    }

    // Admins and Managers have organization-level visibility
    if (req.user.role === "admin" || req.user.role === "manager") {
        return next();
    }

    // For customers, attach customer filter flag
    req.isCustomerScoped = true;
    next();
});
