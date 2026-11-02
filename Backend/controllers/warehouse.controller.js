import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { warehouseService } from "../services/warehouse.service.js";

const getWarehouses = asyncHandler(async (req, res) => {
    const warehouses = await warehouseService.listWarehouses(
        req.user._id,
        req.user.role,
        req.user.assigned_warehouses
    );
    return res
        .status(200)
        .json(
            new ApiResponse(200, warehouses, "Warehouses fetched successfully")
        );
});

const getWarehouse = asyncHandler(async (req, res) => {
    const warehouse = await warehouseService.getWarehouseById(
        req.params.id,
        req.user._id,
        req.user.role,
        req.user.assigned_warehouses
    );
    return res
        .status(200)
        .json(new ApiResponse(200, warehouse, "Warehouse fetched successfully"));
});

const createWarehouse = asyncHandler(async (req, res) => {
    const warehouse = await warehouseService.createWarehouse(
        req.body,
        req.user._id
    );
    return res
        .status(201)
        .json(new ApiResponse(201, warehouse, "Warehouse created successfully"));
});

const updateWarehouse = asyncHandler(async (req, res) => {
    const warehouse = await warehouseService.updateWarehouse(
        req.params.id,
        req.body,
        req.user._id
    );
    return res
        .status(200)
        .json(new ApiResponse(200, warehouse, "Warehouse updated successfully"));
});

const deleteWarehouse = asyncHandler(async (req, res) => {
    const result = await warehouseService.deleteWarehouse(
        req.params.id,
        req.user._id
    );
    return res
        .status(200)
        .json(new ApiResponse(200, result, "Warehouse deleted successfully"));
});

const getWarehouseStock = asyncHandler(async (req, res) => {
    const stock = await warehouseService.getWarehouseStock(
        req.params.id,
        req.user._id,
        req.query
    );
    return res
        .status(200)
        .json(new ApiResponse(200, stock, "Warehouse stock fetched successfully"));
});

export {
    getWarehouses,
    getWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseStock,
};
