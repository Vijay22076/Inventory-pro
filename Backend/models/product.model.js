import mongoose from "mongoose";

const productSchema = mongoose.Schema(
    {
        product_name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        product_code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            maxlength: 8,
            match: [
                /^[A-Z0-9]{8}$/,
                "Product code must be exactly 8 characters consisting of uppercase letters and numbers",
            ],
        },
        category_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        unit_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Unit",
            required: true,
        },
        buying_price: {
            type: Number,
            required: true,
        },
        selling_price: {
            type: Number,
            required: true,
        },
        stock: {
            type: Number,
            default: 0,
            min: 0,
        },
        min_threshold: {
            type: Number,
            default: 10,
            min: 1,
        },
        product_image: {
            type: String,
            required: true,
            default: "default-product.png",
        },
        product_images: {
            type: [String],
            default: [],
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        updated_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

productSchema.index({ product_code: 1, created_by: 1 }, { unique: true });

productSchema.pre("save", function (next) {
    if (this.product_images && this.product_images.length > 0) {
        if (!this.product_image || this.product_image === "default-product.png") {
            this.product_image = this.product_images[0];
        }
    } else if (this.product_image && this.product_image !== "default-product.png") {
        this.product_images = [this.product_image];
    }
    next();
});

productSchema.statics.createProduct = async function (productData, session) {
    const [product] = await this.create(
        [productData],
        session ? { session } : {}
    );
    return product;
};

productSchema.statics.getAllProducts = async function () {
    return this.find({})
        .populate("category_id", "category_name")
        .populate("unit_id", "unit_name");
};

productSchema.statics.getProductsByUser = async function (userId) {
    return this.find({ created_by: userId })
        .populate("category_id", "category_name")
        .populate("unit_id", "unit_name");
};

productSchema.statics.deductStock = async function (
    productId,
    quantity,
    session
) {
    return this.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true, session: session || null }
    );
};

productSchema.statics.restoreStock = async function (
    productId,
    quantity,
    session
) {
    return this.findOneAndUpdate(
        { _id: productId },
        { $inc: { stock: quantity } },
        { new: true, session: session || null }
    );
};

productSchema.statics.findInsufficientStock = async function (items) {
    const productIds = items.map((i) => i.product_id);
    const products = await this.find({ _id: { $in: productIds } })
        .select("_id product_name product_code stock")
        .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    const insufficient = [];

    for (const item of items) {
        const product = productMap.get(item.product_id.toString());

        if (!product) {
            insufficient.push({
                product_id: item.product_id,
                product_name: "Unknown",
                requested: item.quantity,
                available: 0,
                reason: "not_found",
            });
            continue;
        }

        if (product.stock < item.quantity) {
            insufficient.push({
                product_id: product._id,
                product_name: product.product_name,
                product_code: product.product_code,
                requested: item.quantity,
                available: product.stock,
                reason:
                    product.stock === 0 ? "out_of_stock" : "insufficient_stock",
            });
        }
    }

    return insufficient;
};

productSchema.statics.getProductsWithDetails = async function () {
    return this.aggregate([
        {
            $lookup: {
                from: "categories",
                localField: "category_id",
                foreignField: "_id",
                as: "category",
            },
        },
        {
            $lookup: {
                from: "units",
                localField: "unit_id",
                foreignField: "_id",
                as: "unit",
            },
        },
        { $unwind: "$category" },
        { $unwind: "$unit" },
        {
            $project: {
                _id: 1,
                product_name: 1,
                product_code: 1,
                buying_price: 1,
                selling_price: 1,
                stock: 1,
                product_image: 1,
                product_images: 1,
                category_name: "$category.category_name",
                unit_name: "$unit.unit_name",
                created_by: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
    ]);
};

productSchema.statics.getProductsWithDetailsByUser = async function (userId) {
    return this.aggregate([
        { $match: { created_by: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "categories",
                localField: "category_id",
                foreignField: "_id",
                as: "category",
            },
        },
        {
            $lookup: {
                from: "units",
                localField: "unit_id",
                foreignField: "_id",
                as: "unit",
            },
        },
        { $unwind: "$category" },
        { $unwind: "$unit" },
        {
            $project: {
                _id: 1,
                product_name: 1,
                product_code: 1,
                buying_price: 1,
                selling_price: 1,
                stock: 1,
                product_image: 1,
                product_images: 1,
                category_name: "$category.category_name",
                unit_name: "$unit.unit_name",
                created_by: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
    ]);
};

export const Product = mongoose.model("Product", productSchema);
