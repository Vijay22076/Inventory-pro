import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { Warehouse, WarehouseStock, StockLedger } from "../models/index.js";
import { warehouseService } from "../services/warehouse.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const createProduct = asyncHandler(async (req, res, next) => {
    const {
        product_name,
        product_code,
        category_id,
        unit_id,
        buying_price,
        selling_price,
        stock,
        warehouse_id,
        bin_location,
    } = req.body;

    if (
        !product_name ||
        !product_code ||
        !category_id ||
        !unit_id ||
        !buying_price ||
        !selling_price
    ) {
        return next(new ApiError(400, "All product details are required"));
    }

    try {
        let productImageUrl = "default-product.png";
        if (req.file) {
            const image = await uploadToCloudinary(req.file);
            if (image) {
                productImageUrl = image.url;
            }
        }

        const initialStock = parseInt(stock || 0, 10);
        const minThreshold = req.body.min_threshold ? parseInt(req.body.min_threshold, 10) : 10;

        const productData = {
            product_name,
            product_code,
            category_id,
            unit_id,
            buying_price,
            selling_price,
            product_image: productImageUrl,
            stock: initialStock,
            min_threshold: isNaN(minThreshold) ? 10 : minThreshold,
            created_by: req.user._id,
        };

        const product = await Product.createProduct(productData);

        if (!product) {
            return next(new ApiError(500, "Failed to create product"));
        }

        // Seamlessly allocate stock to target or default warehouse
        const targetWh = (warehouse_id && mongoose.Types.ObjectId.isValid(warehouse_id))
            ? await Warehouse.findById(warehouse_id)
            : await warehouseService.getOrCreateDefaultWarehouse(req.user._id);

        if (targetWh) {
            await WarehouseStock.findOneAndUpdate(
                { warehouse_id: targetWh._id, product_id: product._id },
                {
                    $set: {
                        quantity: initialStock,
                        bin_location: bin_location || "A-01-01",
                    },
                    $setOnInsert: {
                        created_by: req.user._id,
                        reserved_quantity: 0,
                    },
                },
                { upsert: true }
            );

            if (initialStock > 0) {
                await StockLedger.create({
                    warehouse_id: targetWh._id,
                    product_id: product._id,
                    transaction_type: "adjustment_add",
                    reference_id: product._id,
                    reference_no: `INIT-${product.product_code}`,
                    quantity_before: 0,
                    quantity_change: initialStock,
                    quantity_after: initialStock,
                    created_by: req.user._id,
                });
            }
        }

        return res
            .status(201)
            .json(
                new ApiResponse(201, product, "Product created successfully")
            );
    } catch (error) {
        if (error.code === 11000) {
            return next(
                new ApiError(409, "Product with this code already exists")
            );
        }
        return next(new ApiError(500, error.message));
    }
});

const getAllProducts = asyncHandler(async (req, res, next) => {
    const { search, category, min_stock, max_stock, sort_by, sort_order } =
        req.query;

    let filter = {};

    if (req.user.role !== "admin") {
        filter.created_by = req.user._id;
    }

    if (search) {
        filter.$or = [
            { product_name: { $regex: search, $options: "i" } },
            { product_code: { $regex: search, $options: "i" } },
        ];
    }

    if (category) {
        filter.category_id = category;
    }

    if (min_stock || max_stock) {
        filter.stock = {};
        if (min_stock) filter.stock.$gte = parseInt(min_stock);
        if (max_stock) filter.stock.$lte = parseInt(max_stock);
    }

    let sortOptions = {};
    if (sort_by) {
        sortOptions[sort_by] = sort_order === "desc" ? -1 : 1;
    } else {
        sortOptions = { createdAt: -1 };
    }

    try {
        const products = await Product.find(filter)
            .populate("category_id", "category_name")
            .populate("unit_id", "unit_name")
            .populate("created_by", "username")
            .sort(sortOptions)
            .lean();

        // Attach per-warehouse stock distribution
        const productIds = products.map((p) => p._id);
        const whStocks = await WarehouseStock.find({
            product_id: { $in: productIds },
        })
            .populate("warehouse_id", "warehouse_name warehouse_code type")
            .lean();

        const whMap = new Map();
        for (const ws of whStocks) {
            const pId = ws.product_id.toString();
            if (!whMap.has(pId)) whMap.set(pId, []);
            whMap.get(pId).push({
                warehouse_id: ws.warehouse_id?._id,
                warehouse_name: ws.warehouse_id?.warehouse_name || "Central Warehouse",
                warehouse_code: ws.warehouse_id?.warehouse_code || "",
                warehouse_type: ws.warehouse_id?.type || "regional_hub",
                quantity: ws.quantity,
                bin_location: ws.bin_location,
            });
        }

        const unifiedProducts = products.map((p) => ({
            ...p,
            warehouse_distribution: whMap.get(p._id.toString()) || [],
        }));

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    unifiedProducts,
                    "Products fetched successfully"
                )
            );
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

const updateProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        const existingProduct = await Product.findById(id);

        if (!existingProduct) {
            return next(new ApiError(404, "Product not found"));
        }

        if (
            req.user.role !== "admin" &&
            existingProduct.created_by.toString() !== req.user._id.toString()
        ) {
            return next(
                new ApiError(
                    403,
                    "You don't have permission to update this product"
                )
            );
        }

        if (req.file) {
            const image = await uploadToCloudinary(req.file);
            if (image) {
                updateData.product_image = image.url;
            }
        }

        if (
            updateData.min_threshold !== undefined &&
            updateData.min_threshold !== null &&
            updateData.min_threshold !== ""
        ) {
            const parsedThreshold = parseInt(updateData.min_threshold, 10);
            updateData.min_threshold =
                !isNaN(parsedThreshold) && parsedThreshold >= 1
                    ? parsedThreshold
                    : 10;
        }

        updateData.updated_by = req.user._id;

        // Synchronize warehouse stock and ledger if stock is explicitly updated
        if (
            updateData.stock !== undefined &&
            updateData.stock !== null &&
            updateData.stock !== ""
        ) {
            const newStock = parseInt(updateData.stock, 10);
            if (!isNaN(newStock) && newStock >= 0) {
                let targetWh = null;
                if (
                    updateData.warehouse_id &&
                    mongoose.Types.ObjectId.isValid(updateData.warehouse_id)
                ) {
                    targetWh = await Warehouse.findById(updateData.warehouse_id);
                }
                if (!targetWh) {
                    const existingWs = await WarehouseStock.findOne({
                        product_id: id,
                    });
                    if (existingWs) {
                        targetWh = await Warehouse.findById(
                            existingWs.warehouse_id
                        );
                    }
                }
                if (!targetWh) {
                    targetWh =
                        await warehouseService.getOrCreateDefaultWarehouse(
                            req.user._id
                        );
                }

                if (targetWh) {
                    const currentWs = await WarehouseStock.findOne({
                        warehouse_id: targetWh._id,
                        product_id: id,
                    });
                    const qtyBefore = currentWs ? currentWs.quantity : 0;
                    const diff = newStock - qtyBefore;

                    if (diff !== 0) {
                        await WarehouseStock.findOneAndUpdate(
                            { warehouse_id: targetWh._id, product_id: id },
                            {
                                $set: {
                                    quantity: newStock,
                                    ...(updateData.bin_location
                                        ? { bin_location: updateData.bin_location }
                                        : {}),
                                },
                                $setOnInsert: {
                                    created_by: req.user._id,
                                    reserved_quantity: 0,
                                },
                            },
                            { upsert: true }
                        );

                        await StockLedger.create({
                            warehouse_id: targetWh._id,
                            product_id: id,
                            transaction_type:
                                diff > 0 ? "adjustment_add" : "adjustment_sub",
                            reference_id: id,
                            reference_no: `EDIT-${existingProduct.product_code}`,
                            quantity_before: qtyBefore,
                            quantity_change: diff,
                            quantity_after: newStock,
                            created_by: req.user._id,
                        });

                        // Keep overall Product.stock aligned to total across facilities
                        updateData.stock = await warehouseService.syncProductStock(id);
                    }
                }
            }
        }

        const product = await Product.findByIdAndUpdate(id, updateData, {
            new: true,
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, product, "Product updated successfully")
            );
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

const deleteProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    try {
        const existingProduct = await Product.findById(id);

        if (!existingProduct) {
            return next(new ApiError(404, "Product not found"));
        }

        if (
            req.user.role !== "admin" &&
            existingProduct.created_by.toString() !== req.user._id.toString()
        ) {
            return next(
                new ApiError(
                    403,
                    "You don't have permission to delete this product"
                )
            );
        }

        await Product.findByIdAndDelete(id);

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Product deleted successfully"));
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

const getAllProductsAdmin = asyncHandler(async (req, res, next) => {
    try {
        const products = await Product.getProductsWithDetails();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    products,
                    "All products fetched successfully"
                )
            );
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

const getCustomerCatalog = asyncHandler(async (req, res, next) => {
    try {
        const { search = "", category = "", page = 1, limit = 24 } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { product_name: { $regex: search, $options: "i" } },
                { product_code: { $regex: search, $options: "i" } },
            ];
        }

        if (category) {
            query.category_id = category;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            Product.find(query)
                .select("product_name product_code category_id unit_id product_image selling_price stock")
                .populate("category_id", "category_name")
                .populate("unit_id", "unit_name short_code")
                .sort({ product_name: 1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Product.countDocuments(query),
        ]);

        const catalog = products.map((p) => ({
            _id: p._id,
            product_name: p.product_name,
            product_code: p.product_code,
            category_name: p.category_id?.category_name || "General",
            unit_name: p.unit_id?.unit_name || "Unit",
            product_image: p.product_image,
            selling_price: p.selling_price,
            stock: p.stock || 0,
            available_stock: p.stock || 0,
            is_in_stock: (p.stock || 0) > 0,
        }));

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    products: catalog,
                    pagination: {
                        current: parseInt(page),
                        pageSize: parseInt(limit),
                        total,
                        pages: Math.ceil(total / parseInt(limit)),
                    },
                },
                "Catalog fetched successfully"
            )
        );
    } catch (error) {
        return next(new ApiError(500, error.message));
    }
});

export {
    createProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    getAllProductsAdmin,
    getCustomerCatalog,
};
