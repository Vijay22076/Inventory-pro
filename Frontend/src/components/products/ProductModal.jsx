import React from "react";
import { Modal, Form, Input, Select, InputNumber, Row, Col } from "antd";
import ProductImageUpload from "./ProductImageUpload";

const { Option } = Select;

const ProductModal = ({
    visible,
    title,
    form,
    loading,
    categories,
    units,
    warehouses = [],
    editingProduct,
    imageUrl,
    onSave,
    onCancel,
    onImageChange,
}) => {
    return (
        <Modal
            title={
                <div className="text-xl text-center font-bold text-gray-800">
                    {title}
                </div>
            }
            open={visible}
            onCancel={onCancel}
            confirmLoading={loading}
            onOk={onSave}
            width="90%"
            style={{
                maxWidth: "920px",
                top: 32,
            }}
            styles={{
                body: {
                    padding: "20px 24px",
                },
            }}
            okText="Save Product"
            cancelText="Cancel"
            okButtonProps={{
                size: "large",
                className: "min-w-[140px] h-10",
            }}
            cancelButtonProps={{
                size: "large",
                className: "h-10",
            }}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ stock: 0, min_threshold: 10 }}
                className="product-modal-form"
            >
                <Row gutter={20} className="space-y-4 lg:space-y-0">
                    <Col xs={24} lg={14}>
                        <div className="space-y-4">
                            <div className="bg-white rounded-lg border-2 border-gray-200 p-4 ">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                        Product Details
                                    </h3>
                                </div>
                                <Row gutter={12}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            name="product_name"
                                            label={
                                                <span className="text-xs font-medium text-gray-600">
                                                    Product Name
                                                </span>
                                            }
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please enter product name",
                                                },
                                                {
                                                    max: 50,
                                                    message:
                                                        "Maximum 50 characters allowed",
                                                },
                                            ]}
                                            className="mb-3"
                                        >
                                            <Input
                                                placeholder="Enter product name"
                                                size="large"
                                                className="rounded-md"
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            name="product_code"
                                            label={
                                                <span className="text-xs font-medium text-gray-600">
                                                    Product Code (8 Characters: A-Z, 0-9)
                                                </span>
                                            }
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please enter product code",
                                                },
                                                {
                                                    pattern: /^[A-Z0-9]{8}$/,
                                                    message:
                                                        "Product code must be exactly 8 characters (UPPERCASE letters and numbers only, e.g. PROD1001)",
                                                },
                                            ]}
                                            normalize={(value) =>
                                                value
                                                    ? value
                                                          .toUpperCase()
                                                          .replace(/[^A-Z0-9]/g, "")
                                                          .slice(0, 8)
                                                    : ""
                                            }
                                            className="mb-3"
                                        >
                                            <Input
                                                placeholder="e.g. PROD1001"
                                                disabled={!!editingProduct}
                                                maxLength={8}
                                                size="large"
                                                className="rounded-md font-mono tracking-wider"
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            name="category_id"
                                            label={
                                                <span className="text-xs font-medium text-gray-600">
                                                    Category
                                                </span>
                                            }
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please select a category",
                                                },
                                            ]}
                                            className="mb-0"
                                        >
                                            <Select
                                                placeholder="Select category"
                                                size="large"
                                                className="rounded-md"
                                            >
                                                {categories.map((category) => (
                                                    <Option
                                                        key={category._id}
                                                        value={category._id}
                                                    >
                                                        {category.category_name}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            name="unit_id"
                                            label={
                                                <span className="text-xs font-medium text-gray-600">
                                                    Unit
                                                </span>
                                            }
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please select a unit",
                                                },
                                            ]}
                                            className="mb-0"
                                        >
                                            <Select
                                                placeholder="Select unit"
                                                size="large"
                                                className="rounded-md"
                                            >
                                                {units.map((unit) => (
                                                    <Option
                                                        key={unit._id}
                                                        value={unit._id}
                                                    >
                                                        {unit.unit_name}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-200 p-4 ">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-100">
                                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                        Pricing
                                    </h3>
                                </div>
                                <Row gutter={12}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            name="buying_price"
                                            label={
                                                <span className="text-xs font-medium text-gray-600">
                                                    Buying Price
                                                </span>
                                            }
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please enter buying price",
                                                },
                                                {
                                                    type: "number",
                                                    min: 0,
                                                    message:
                                                        "Price must be positive",
                                                },
                                            ]}
                                            className="mb-0"
                                        >
                                            <InputNumber
                                                placeholder="0.00"
                                                prefix="₹"
                                                style={{ width: "100%" }}
                                                precision={2}
                                                size="large"
                                                className="rounded-md"
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            name="selling_price"
                                            label={
                                                <span className="text-xs font-medium text-gray-600">
                                                    Selling Price
                                                </span>
                                            }
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please enter selling price",
                                                },
                                                {
                                                    type: "number",
                                                    min: 0,
                                                    message:
                                                        "Price must be positive",
                                                },
                                            ]}
                                            className="mb-0"
                                        >
                                            <InputNumber
                                                placeholder="0.00"
                                                prefix="₹"
                                                style={{ width: "100%" }}
                                                precision={2}
                                                size="large"
                                                className="rounded-md"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-4">
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                            {editingProduct
                                                ? "Inventory & Stock Level"
                                                : "Initial Stock Allocation"}
                                        </h3>
                                    </div>
                                    <span className="text-xs text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full font-medium">
                                        Direct Inward (No PO needed)
                                    </span>
                                </div>
                                <Row gutter={12}>
                                    <Col xs={24} sm={8}>
                                        <Form.Item
                                            name="stock"
                                            label={
                                                <span className="text-xs font-medium text-gray-600">
                                                    {editingProduct
                                                        ? "Stock Quantity"
                                                        : "Initial Stock Qty"}
                                                </span>
                                            }
                                            rules={[
                                                {
                                                    type: "number",
                                                    min: 0,
                                                    message:
                                                        "Stock cannot be negative",
                                                },
                                            ]}
                                            className="mb-3 sm:mb-0"
                                        >
                                            <InputNumber
                                                placeholder="0"
                                                min={0}
                                                style={{ width: "100%" }}
                                                size="large"
                                                className="rounded-md font-semibold text-blue-700"
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={8}>
                                        <Form.Item
                                            name="min_threshold"
                                            label={
                                                <span className="text-xs font-medium text-gray-600">
                                                    Min Alert Threshold
                                                </span>
                                            }
                                            rules={[
                                                {
                                                    type: "number",
                                                    min: 1,
                                                    message: "Min threshold must be at least 1",
                                                },
                                            ]}
                                            tooltip="Trigger automated alerts when stock falls below this quantity"
                                            className="mb-3 sm:mb-0"
                                        >
                                            <InputNumber
                                                placeholder="10"
                                                min={1}
                                                style={{ width: "100%" }}
                                                size="large"
                                                className="rounded-md font-medium text-amber-700"
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} sm={8}>
                                        <Form.Item
                                            name="warehouse_id"
                                            label={
                                                <span className="text-xs font-medium text-gray-600">
                                                    Facility / Warehouse
                                                </span>
                                            }
                                            className="mb-0"
                                        >
                                            <Select
                                                placeholder="Select warehouse"
                                                size="large"
                                                className="rounded-md"
                                                allowClear
                                            >
                                                {warehouses.map((wh) => (
                                                    <Option
                                                        key={wh._id}
                                                        value={wh._id}
                                                    >
                                                        🏢 {wh.warehouse_name}{" "}
                                                        {wh.is_default
                                                            ? "(Default)"
                                                            : `(${wh.warehouse_code})`}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </Col>

                    <Col xs={24} lg={10}>
                        <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg border-2 border-gray-200 p-4 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                    <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                        Product Image
                                    </h3>
                                </div>
                                <ProductImageUpload
                                    imageUrl={imageUrl}
                                    onChange={onImageChange}
                                />
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-200">
                                <Form.Item
                                    name="bin_location"
                                    label={
                                        <span className="text-xs font-medium text-gray-600">
                                            Rack / Bin Location (Optional)
                                        </span>
                                    }
                                    className="mb-0"
                                >
                                    <Input
                                        placeholder="e.g. A-01-01 / Shelf-2"
                                        size="large"
                                        className="rounded-md"
                                    />
                                </Form.Item>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default ProductModal;
