import React, { useState, useCallback, useRef } from "react";
import { Layout, Card, Button, Form, message } from "antd";
import { PlusOutlined, ProductOutlined } from "@ant-design/icons";

import ProductSearchBar from "../components/products/ProductSearchBar";
import ProductsTable from "../components/products/ProductsTable";
import ProductModal from "../components/products/ProductModal";
import ProductFilters from "../components/products/ProductFilters";
import ProductDetailsDrawer from "../components/products/ProductDetailsDrawer";
import BulkUploadModal from "../components/products/BulkUploadModal";
import { ProductLabelModal } from "../components/common/ProductBarcode";

import { useProducts } from "../hooks/products/useProducts";
import { useCategories } from "../hooks/products/useCategories";
import { useUnits } from "../hooks/products/useUnits";
import { useWarehouses } from "../hooks/warehouse/useWarehouses";

import {
    prepareProductFormData,
    validateProductData,
} from "../utils/productUtils";

const { Content } = Layout;

const Products = () => {
    const {
        products,
        loading,
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
    } = useProducts();
    const { categories } = useCategories();
    const { units } = useUnits();
    const { warehouses, fetchWarehouses } = useWarehouses();

    const [form] = Form.useForm();

    React.useEffect(() => {
        fetchWarehouses();
    }, [fetchWarehouses]);

    const [searchText, setSearchText] = useState("");
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [stockFilter, setStockFilter] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [isBulkUploadVisible, setIsBulkUploadVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [labelModalVisible, setLabelModalVisible] = useState(false);
    const [selectedProductForLabel, setSelectedProductForLabel] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState("");
    const [productImages, setProductImages] = useState([]);

    const isSubmittingRef = useRef(false);

    const handleSearch = useCallback(() => {
        fetchProducts({
            search: searchText,
            category: categoryFilter,
            stockFilter,
        });
    }, [searchText, categoryFilter, stockFilter, fetchProducts]);

    const handleReset = useCallback(() => {
        setSearchText("");
        setCategoryFilter(null);
        setStockFilter(null);
        fetchProducts();
    }, [fetchProducts]);

    const handleAddProduct = () => {
        setEditingProduct(null);
        setImageFile(null);
        setImageUrl("");
        setProductImages([]);
        form.resetFields();
        const defaultWh =
            warehouses.find((w) => w.is_default) || warehouses[0];
        form.setFieldsValue({
            stock: 0,
            min_threshold: 10,
            warehouse_id: defaultWh?._id,
            bin_location: "A-01-01",
        });
        setIsModalVisible(true);
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        const existingList = (product.product_images && product.product_images.length > 0)
            ? product.product_images
            : (product.product_image && product.product_image !== "default-product.png" ? [product.product_image] : []);

        setProductImages(
            existingList.map((url, idx) => ({
                id: `existing-${idx}-${url.slice(-8)}`,
                url,
                isExisting: true,
            }))
        );
        setImageUrl(product.product_image || "");
        setImageFile(null);
        const currentWh =
            product.warehouse_distribution?.[0]?.warehouse_id ||
            warehouses.find((w) => w.is_default)?._id ||
            warehouses[0]?._id;
        const currentBin =
            product.warehouse_distribution?.[0]?.bin_location || "A-01-01";
        form.setFieldsValue({
            product_name: product.product_name,
            product_code: product.product_code,
            category_id: product.category_id?._id || product.category_id,
            unit_id: product.unit_id?._id || product.unit_id,
            buying_price: product.buying_price,
            selling_price: product.selling_price,
            stock: product.stock ?? 0,
            min_threshold: product.min_threshold ?? 10,
            warehouse_id: currentWh,
            bin_location: currentBin,
        });
        setIsModalVisible(true);
    };

    const handleAddFiles = (files) => {
        const newItems = files.map((file, idx) => ({
            id: `file-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
            url: URL.createObjectURL(file),
            file,
            isExisting: false,
        }));
        setProductImages((prev) => [...prev, ...newItems].slice(0, 8));
    };

    const handleRemoveImage = (index) => {
        setProductImages((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleSetCover = (index) => {
        setProductImages((prev) => {
            if (index === 0) return prev;
            const copy = [...prev];
            const [target] = copy.splice(index, 1);
            return [target, ...copy];
        });
    };

    const handlePrintBarcode = (product) => {
        setSelectedProductForLabel(product);
        setLabelModalVisible(true);
    };

    const handleViewDetails = (product) => {
        setSelectedProduct(product);
        setIsDetailsVisible(true);
    };

    const handleImageChange = (info) => {
        const { fileList } = info;
        if (fileList.length > 0) {
            const rawFiles = fileList.map((f) => f.originFileObj).filter(Boolean);
            if (rawFiles.length > 0) {
                handleAddFiles(rawFiles);
            }
        }
    };

    const handleSaveProduct = async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        try {
            const values = await form.validateFields();

            const validation = validateProductData(values);
            if (!validation.isValid) {
                Object.keys(validation.errors).forEach((key) => {
                    message.error(validation.errors[key]);
                });
                return;
            }

            setModalLoading(true);

            // Separate uploaded File objects from retained existing URLs
            const newFiles = productImages
                .filter((img) => !img.isExisting && img.file)
                .map((img) => img.file);
            const retainedUrls = productImages
                .filter((img) => img.isExisting)
                .map((img) => img.url);

            const formData = prepareProductFormData(values, newFiles, retainedUrls);

            // If primary cover photo is an existing image, specify it
            if (productImages.length > 0 && productImages[0].isExisting) {
                formData.append("primary_image_url", productImages[0].url);
            }

            const result = editingProduct
                ? await updateProduct(editingProduct._id, formData)
                : await createProduct(formData);

            if (result.success) {
                setIsModalVisible(false);
                form.resetFields();
                setImageFile(null);
                setImageUrl("");
                setProductImages([]);
                setEditingProduct(null);
            }
        } catch (error) {
            console.error("Form validation error:", error);
            message.error("Please check all required fields");
        } finally {
            setModalLoading(false);
            // FIX 4: Always release the lock, even on error.
            isSubmittingRef.current = false;
        }
    };

    const handleDeleteProduct = async (productId) => {
        const result = await deleteProduct(productId);
        if (!result.success) {
            message.error("Failed to delete product");
        }
    };

    const handleApplyFilters = () => {
        setIsFiltersVisible(false);
        handleSearch();
    };

    const handleResetFilters = () => {
        setCategoryFilter(null);
        setStockFilter(null);
        setIsFiltersVisible(false);
        handleReset();
    };

    const handleBulkUploadComplete = () => {
        setIsBulkUploadVisible(false);
        fetchProducts();
    };

    return (
        <Layout>
            <Content className="p-2 sm:p-4 lg:p-6 bg-white">
                <div className="max-w-full lg:max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="truncate mb-1 text-4xl font-bold flex items-center gap-2">
                                Products
                                <ProductOutlined className="text-blue-600 inline-block ml-2" />
                            </h1>
                            <p className="text-gray-500 text-base md:text-sm hidden sm:block">
                                Manage your product inventory
                            </p>
                        </div>
                        <div className="flex-shrink-0 flex gap-2">
                            <Button
                                onClick={() => setIsBulkUploadVisible(true)}
                                size="large"
                                className="w-full sm:w-auto"
                            >
                                Bulk Upload
                            </Button>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAddProduct}
                                size="large"
                                className="w-full sm:w-auto"
                                block={window.innerWidth < 640}
                            >
                                <span className="hidden xs:inline">
                                    Add Product
                                </span>
                                <span className="inline xs:hidden">Add</span>
                            </Button>
                        </div>
                    </div>

                    <div className="mb-4 sm:mb-6">
                        <ProductSearchBar
                            searchText={searchText}
                            onSearchChange={setSearchText}
                            onSearch={handleSearch}
                            onShowFilters={() => setIsFiltersVisible(true)}
                            onReset={handleReset}
                        />
                    </div>

                    <Card
                        className="overflow-hidden"
                        styles={{
                            body: {
                                padding: window.innerWidth < 768 ? "12px" : "24px",
                                overflowX: "auto",
                            },
                        }}
                    >
                        <div className="min-w-full">
                            <ProductsTable
                                products={products}
                                loading={loading}
                                categories={categories}
                                onEdit={handleEditProduct}
                                onDelete={handleDeleteProduct}
                                onViewDetails={handleViewDetails}
                                onPrintBarcode={handlePrintBarcode}
                            />
                        </div>
                    </Card>

                    <ProductModal
                        visible={isModalVisible}
                        title={
                            editingProduct ? "Edit Product" : "Add New Product"
                        }
                        form={form}
                        loading={modalLoading}
                        categories={categories}
                        units={units}
                        warehouses={warehouses}
                        editingProduct={editingProduct}
                        images={productImages}
                        imageUrl={productImages[0]?.url || imageUrl}
                        onAddFiles={handleAddFiles}
                        onRemoveImage={handleRemoveImage}
                        onSetCover={handleSetCover}
                        onSave={handleSaveProduct}
                        onCancel={() => {
                            if (isSubmittingRef.current) return;
                            setIsModalVisible(false);
                            setEditingProduct(null);
                            setImageFile(null);
                            setImageUrl("");
                            setProductImages([]);
                            form.resetFields();
                        }}
                        onImageChange={handleImageChange}
                        width={window.innerWidth < 768 ? "95%" : "800px"}
                        centered={window.innerWidth < 768}
                    />

                    <ProductFilters
                        visible={isFiltersVisible}
                        categories={categories}
                        categoryFilter={categoryFilter}
                        stockFilter={stockFilter}
                        onCategoryChange={setCategoryFilter}
                        onStockChange={setStockFilter}
                        onApply={handleApplyFilters}
                        onReset={handleResetFilters}
                        onClose={() => setIsFiltersVisible(false)}
                        placement={window.innerWidth < 768 ? "bottom" : "right"}
                        height={window.innerWidth < 768 ? "70vh" : undefined}
                        width={window.innerWidth < 768 ? "100%" : "400px"}
                    />

                    <ProductDetailsDrawer
                        visible={isDetailsVisible}
                        product={selectedProduct}
                        onClose={() => {
                            setIsDetailsVisible(false);
                            setSelectedProduct(null);
                        }}
                        placement={window.innerWidth < 768 ? "bottom" : "right"}
                        height={window.innerWidth < 768 ? "80vh" : undefined}
                        width={window.innerWidth < 768 ? "100%" : "500px"}
                    />

                    <BulkUploadModal
                        visible={isBulkUploadVisible}
                        categories={categories}
                        units={units}
                        onClose={() => setIsBulkUploadVisible(false)}
                        onComplete={handleBulkUploadComplete}
                    />

                    <ProductLabelModal
                        visible={labelModalVisible}
                        product={selectedProductForLabel}
                        onCancel={() => {
                            setLabelModalVisible(false);
                            setSelectedProductForLabel(null);
                        }}
                    />
                </div>
            </Content>
        </Layout>
    );
};

export default Products;
