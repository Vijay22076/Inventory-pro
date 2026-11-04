export const formatPrice = (price, currency = "₹") => {
    if (typeof price !== "number") return `${currency}0.00`;
    return `${currency}${price.toFixed(2)}`;
};

export const calculateProfitMargin = (sellingPrice, buyingPrice) => {
    if (typeof sellingPrice !== "number" || typeof buyingPrice !== "number") {
        return 0;
    }
    return sellingPrice - buyingPrice;
};

export const calculateProfitPercentage = (sellingPrice, buyingPrice) => {
    if (
        typeof sellingPrice !== "number" ||
        typeof buyingPrice !== "number" ||
        sellingPrice === 0
    ) {
        return 0;
    }
    return ((sellingPrice - buyingPrice) / sellingPrice) * 100;
};

export const getStockStatus = (stock, lowStockThreshold = 10) => {
    if (stock === 0) {
        return { status: "error", text: "Out of Stock", color: "red" };
    } else if (stock <= lowStockThreshold) {
        return { status: "warning", text: "Low Stock", color: "orange" };
    }
    return { status: "success", text: "In Stock", color: "green" };
};

export const validateProductData = (productData) => {
    const errors = {};
    let isValid = true;

    if (!productData.product_name?.trim()) {
        errors.product_name = "Product name is required";
        isValid = false;
    }

    const cleanCode = (productData.product_code || "").trim().toUpperCase();
    if (!cleanCode) {
        errors.product_code = "Product code is required";
        isValid = false;
    } else if (!/^[A-Z0-9]{8}$/.test(cleanCode)) {
        errors.product_code =
            "Product code must be exactly 8 characters consisting of UPPERCASE letters and numbers (e.g. PROD1001)";
        isValid = false;
    }

    if (!productData.category_id) {
        errors.category_id = "Category is required";
        isValid = false;
    }

    if (!productData.unit_id) {
        errors.unit_id = "Unit is required";
        isValid = false;
    }

    if (!productData.buying_price || productData.buying_price <= 0) {
        errors.buying_price = "Buying price must be greater than 0";
        isValid = false;
    }

    if (!productData.selling_price || productData.selling_price <= 0) {
        errors.selling_price = "Selling price must be greater than 0";
        isValid = false;
    }

    if (
        productData.selling_price &&
        productData.buying_price &&
        productData.selling_price < productData.buying_price
    ) {
        errors.selling_price =
            "Selling price should be greater than buying price";
        isValid = false;
    }

    if (
        productData.stock !== undefined &&
        productData.stock !== null &&
        productData.stock !== "" &&
        (isNaN(Number(productData.stock)) || Number(productData.stock) < 0)
    ) {
        errors.stock = "Stock quantity cannot be negative";
        isValid = false;
    }

    return { isValid, errors };
};

export const prepareProductFormData = (
    formValues,
    imageFiles = null,
    existingImages = []
) => {
    const formData = new FormData();

    Object.keys(formValues).forEach((key) => {
        if (
            key !== "product_image" &&
            key !== "product_images" &&
            key !== "existing_images" &&
            formValues[key] !== undefined &&
            formValues[key] !== null
        ) {
            formData.append(key, formValues[key]);
        }
    });

    // Handle uploaded file(s)
    if (imageFiles) {
        if (Array.isArray(imageFiles)) {
            imageFiles.forEach((file) => {
                if (file) {
                    formData.append("product_images", file);
                }
            });
            // If single file or first file, also append product_image for backwards compatibility
            if (imageFiles[0]) {
                formData.append("product_image", imageFiles[0]);
            }
        } else {
            formData.append("product_images", imageFiles);
            formData.append("product_image", imageFiles);
        }
    }

    // Pass retained existing image URLs (as JSON string)
    if (Array.isArray(existingImages) && existingImages.length > 0) {
        formData.append("existing_images", JSON.stringify(existingImages));
    }

    return formData;
};

export const filterProducts = (products, filters) => {
    let filteredProducts = [...products];

    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(
            (product) =>
                product.product_name.toLowerCase().includes(searchTerm) ||
                product.product_code.toLowerCase().includes(searchTerm)
        );
    }

    if (filters.category) {
        filteredProducts = filteredProducts.filter(
            (product) => product.category_id._id === filters.category
        );
    }

    if (filters.stockFilter) {
        filteredProducts = filteredProducts.filter((product) => {
            const threshold = product.min_threshold || 10;
            if (filters.stockFilter === "out") return product.stock === 0;
            if (filters.stockFilter === "low")
                return product.stock > 0 && product.stock <= threshold;
            if (filters.stockFilter === "in") return product.stock > threshold;
            return true;
        });
    }

    return filteredProducts;
};

export const sortProducts = (products, sortBy, sortOrder = "asc") => {
    const sortedProducts = [...products];

    sortedProducts.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
            case "name":
                aValue = a.product_name.toLowerCase();
                bValue = b.product_name.toLowerCase();
                break;
            case "price":
                aValue = a.selling_price;
                bValue = b.selling_price;
                break;
            case "stock":
                aValue = a.stock;
                bValue = b.stock;
                break;
            case "category":
                aValue = a.category_id.category_name.toLowerCase();
                bValue = b.category_id.category_name.toLowerCase();
                break;
            default:
                return 0;
        }

        if (typeof aValue === "string") {
            return sortOrder === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

    return sortedProducts;
};

export const generateProductCode = (categoryName, sequence) => {
    const prefix = categoryName.substring(0, 2).toUpperCase();
    const paddedSequence = sequence.toString().padStart(3, "0");
    return `${prefix}${paddedSequence}`;
};

export const calculateInventoryStats = (products) => {
    const stats = {
        totalProducts: products.length,
        totalStockValue: 0,
        totalSellingValue: 0,
        outOfStockCount: 0,
        lowStockCount: 0,
        inStockCount: 0,
    };

    products.forEach((product) => {
        stats.totalStockValue += product.buying_price * product.stock;
        stats.totalSellingValue += product.selling_price * product.stock;

        if (product.stock === 0) stats.outOfStockCount++;
        else if (product.stock <= 10) stats.lowStockCount++;
        else stats.inStockCount++;
    });

    return stats;
};
