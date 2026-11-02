import {
    Table,
    Button,
    Space,
    Badge,
    Tooltip,
    Popconfirm,
    Image,
    Typography,
    Card,
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    ExclamationCircleOutlined,
    ShopOutlined,
    BarcodeOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const ProductsTable = ({
    products,
    loading,
    categories,
    onEdit,
    onDelete,
    onViewDetails,
    onPrintBarcode,
}) => {
    // Mobile Card View Component
    const MobileProductCard = ({ product }) => (
        <Card className="mb-3" size="small">
            <div className="flex gap-3">
                {/* Product Image */}
                <div className="flex-shrink-0">
                    <Image
                        src={product.product_image}
                        alt="Product"
                        width={60}
                        height={60}
                        style={{ objectFit: "cover" }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6U"
                    />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                            <Text strong className="text-sm block truncate">
                                {product.product_name}
                            </Text>
                            <Text type="secondary" className="text-xs">
                                Code: {product.product_code}
                            </Text>
                        </div>
                        <div className="flex gap-1 ml-2">
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => onViewDetails(product)}
                                type="text"
                                size="small"
                            />
                            <Button
                                icon={<BarcodeOutlined />}
                                onClick={() => onPrintBarcode && onPrintBarcode(product)}
                                type="text"
                                size="small"
                                title="Barcode & Label"
                            />
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => onEdit(product)}
                                type="text"
                                size="small"
                            />
                            <Popconfirm
                                title="Delete this product?"
                                description="This action cannot be undone. Are you sure?"
                                onConfirm={() => onDelete(product._id)}
                                okText="Yes"
                                cancelText="No"
                                icon={
                                    <ExclamationCircleOutlined
                                        style={{ color: "red" }}
                                    />
                                }
                            >
                                <Button
                                    icon={<DeleteOutlined />}
                                    danger
                                    type="text"
                                    size="small"
                                />
                            </Popconfirm>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <Text type="secondary">Category:</Text>
                            <br />
                            <Text>{product.category_id?.category_name}</Text>
                        </div>
                        <div>
                            <Text type="secondary">Stock:</Text>
                            <br />
                            <Badge
                                status={
                                    product.stock === 0
                                        ? "error"
                                        : product.stock <= (product.min_threshold || 10)
                                          ? "warning"
                                          : "success"
                                }
                                text={`${product.stock} ${product.stock <= (product.min_threshold || 10) ? "(Low)" : ""}`}
                            />
                        </div>
                        <div>
                            <Text type="secondary">Selling Price:</Text>
                            <br />
                            <Text strong>
                                ₹{product.selling_price.toFixed(2)}
                            </Text>
                        </div>
                        <div>
                            <Text type="secondary">Unit:</Text>
                            <br />
                            <Text>{product.unit_id?.unit_name}</Text>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );

    const columns = [
        {
            title: "Image",
            dataIndex: "product_image",
            key: "product_image",
            width: 80,
            responsive: ["md"],
            render: (image) => (
                <Image
                    src={image}
                    alt="Product"
                    width={50}
                    height={50}
                    style={{ objectFit: "cover" }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6U"
                />
            ),
        },
        {
            title: "Product Name",
            dataIndex: "product_name",
            key: "product_name",
            sorter: (a, b) => a.product_name.localeCompare(b.product_name),
            render: (text, record) => (
                <div className="flex flex-col">
                    <Text strong className="text-sm">
                        {text}
                    </Text>
                    <Text type="secondary" className="text-xs">
                        Code: {record.product_code}
                    </Text>
                </div>
            ),
        },
        {
            title: "Category",
            dataIndex: ["category_id", "category_name"],
            key: "category",
            responsive: ["lg"],
            filters: categories.map((cat) => ({
                text: cat.category_name,
                value: cat._id,
            })),
            onFilter: (value, record) => record.category_id._id === value,
        },
        {
            title: "Stock",
            dataIndex: "stock",
            key: "stock",
            width: 100,
            sorter: (a, b) => a.stock - b.stock,
            render: (stock, record) => {
                const threshold = record.min_threshold || 10;
                let color = "success";
                let status = "In Stock";

                if (stock === 0) {
                    color = "error";
                    status = "Out of Stock";
                } else if (stock <= threshold) {
                    color = "warning";
                    status = `Low (≤${threshold})`;
                }

                return (
                    <div className="flex flex-col items-center">
                        <Badge status={color} />
                        <Text className="text-sm font-semibold">{stock}</Text>
                        <Text
                            type="secondary"
                            className="text-[11px] hidden sm:block"
                        >
                            {status}
                        </Text>
                    </div>
                );
            },
        },
        {
            title: "Price",
            key: "price",
            render: (_, record) => (
                <div className="flex flex-col">
                    <Text strong className="text-sm">
                        ₹ {record.selling_price.toFixed(2)}
                    </Text>
                    <Text type="secondary" className="text-xs">
                        Buy: ₹{record.buying_price.toFixed(2)}
                    </Text>
                </div>
            ),
            sorter: (a, b) => a.selling_price - b.selling_price,
        },
        {
            title: "Unit",
            dataIndex: ["unit_id", "unit_name"],
            key: "unit",
            responsive: ["xl"],
        },
        {
            title: "Actions",
            key: "actions",
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => onViewDetails(record)}
                            type="text"
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Barcode & Label">
                        <Button
                            icon={<BarcodeOutlined />}
                            onClick={() => onPrintBarcode && onPrintBarcode(record)}
                            type="text"
                            size="small"
                            className="text-slate-600 hover:text-indigo-600"
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record)}
                            type="text"
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Popconfirm
                            title="Delete this product?"
                            description="This action cannot be undone. Are you sure?"
                            onConfirm={() => onDelete(record._id)}
                            okText="Yes"
                            cancelText="No"
                            icon={
                                <ExclamationCircleOutlined
                                    style={{ color: "red" }}
                                />
                            }
                        >
                            <Button
                                icon={<DeleteOutlined />}
                                danger
                                type="text"
                                size="small"
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // Check if screen is mobile (you can adjust breakpoint as needed)
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        return (
            <div>
                {loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : products.length === 0 ? (
                    <div className="text-center py-8">
                        <Text type="secondary">No products found</Text>
                    </div>
                ) : (
                    products.map((product) => (
                        <MobileProductCard
                            key={product._id}
                            product={product}
                        />
                    ))
                )}
            </div>
        );
    }

    return (
        <Table
            dataSource={products}
            columns={columns}
            rowKey="_id"
            loading={loading}
            scroll={{ x: 800 }}
            pagination={{
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} products`,
                responsive: true,
                showQuickJumper: false,
                size: "small",
            }}
            size="small"
            expandable={{
                expandedRowRender: (record) => {
                    const dist = record.warehouse_distribution || [];
                    if (dist.length === 0) {
                        return (
                            <div className="py-2 px-4 bg-slate-50 text-slate-500 text-xs italic">
                                Stock is not yet allocated to specific warehouse bins.
                            </div>
                        );
                    }
                    return (
                        <div className="py-3 px-4 bg-slate-50/80 rounded-lg border border-slate-200/80 my-1">
                            <div className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-2">
                                <ShopOutlined className="text-indigo-600" />
                                Facility & Bin Inventory Allocation:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {dist.map((w, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white p-2.5 rounded-md border border-slate-200 shadow-xs flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-semibold text-xs text-slate-800">
                                                {w.warehouse_name}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-mono">
                                                Bin: {w.bin_location || "A-01-01"}
                                            </div>
                                        </div>
                                        <Badge
                                            count={`${w.quantity} units`}
                                            style={{
                                                backgroundColor:
                                                    w.quantity > 5 ? "#10b981" : "#f59e0b",
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                },
                rowExpandable: () => true,
            }}
        />
    );
};

export default ProductsTable;
