import React, { useState, useEffect, useCallback } from "react";
import {
    Card,
    Table,
    Button,
    Tag,
    Modal,
    Input,
    Select,
    InputNumber,
    Row,
    Col,
    Statistic,
    Space,
    Tooltip,
    Spin,
    Steps,
} from "antd";
import {
    ShoppingCartOutlined,
    FilePdfOutlined,
    RollbackOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CarOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { api } from "../../api/api";
import { useOrderOperations } from "../../hooks/orders/useOrderOperations";

const { Option } = Select;
const { TextArea } = Input;

const CustomerOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    // Order Details Modal
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetailsItems, setOrderDetailsItems] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Return Request Modal
    const [returnModalVisible, setReturnModalVisible] = useState(false);
    const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
    const [returnItems, setReturnItems] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [returnQuantity, setReturnQuantity] = useState(1);
    const [returnReason, setReturnReason] = useState("defective");
    const [returnNotes, setReturnNotes] = useState("");
    const [submittingReturn, setSubmittingReturn] = useState(false);

    const { generateInvoice } = useOrderOperations();

    const fetchCustomerOrders = useCallback(async (page = 1, limit = 10) => {
        try {
            setLoading(true);
            const response = await api.get(`/orders?page=${page}&limit=${limit}`);
            if (response.data.success) {
                setOrders(response.data.data.orders || []);
                setPagination({
                    current: page,
                    pageSize: limit,
                    total: response.data.data.pagination?.total || 0,
                });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomerOrders(1, 10);
    }, [fetchCustomerOrders]);

    const getTrackingStepInfo = (order) => {
        if (!order) return { current: 0, status: "process" };
        if (order.order_status === "cancelled") {
            return { current: 1, status: "error" };
        }
        if (order.order_status === "completed") {
            return { current: 3, status: "finish" };
        }
        if (order.order_status === "processing") {
            return { current: 2, status: "process" };
        }
        // pending
        if (order.payment_info?.payment_status === "paid") {
            return { current: 1, status: "process" };
        }
        return { current: 0, status: "process" };
    };

    const handleViewDetails = async (order) => {
        setSelectedOrder(order);
        setDetailsModalVisible(true);
        try {
            setLoadingDetails(true);
            const response = await api.get(`/orders/${order._id}/details`);
            if (response.data.success) {
                setOrderDetailsItems(response.data.data || []);
            }
        } catch {
            toast.error("Failed to fetch order details");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleOpenReturnModal = async (order) => {
        setSelectedReturnOrder(order);
        setReturnReason("defective");
        setReturnNotes("");
        setSubmittingReturn(false);
        setReturnModalVisible(true);

        try {
            const response = await api.get(`/orders/${order._id}/details`);
            if (response.data.success) {
                const items = response.data.data || [];
                setReturnItems(items);
                if (items.length > 0) {
                    const firstProdId = items[0].product_id?._id || items[0].product_id;
                    setSelectedProductId(firstProdId);
                    setReturnQuantity(1);
                }
            }
        } catch {
            toast.error("Failed to load order items for return");
        }
    };

    const handleSubmitReturn = async () => {
        if (!selectedReturnOrder || !selectedProductId) {
            toast.error("Please select an item to return");
            return;
        }

        try {
            setSubmittingReturn(true);
            const response = await api.post("/returns/request", {
                order_id: selectedReturnOrder._id,
                product_id: selectedProductId,
                quantity: returnQuantity,
                reason: returnReason,
                notes: returnNotes,
            });

            if (response.data.success) {
                toast.success("Return request submitted successfully!");
                setReturnModalVisible(false);
                navigate("/customer/returns");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit return request");
        } finally {
            setSubmittingReturn(false);
        }
    };

    // Metrics
    const totalOrders = pagination.total || orders.length;
    const completedOrders = orders.filter((o) => o.order_status === "completed").length;
    const pendingOrders = orders.filter((o) => ["pending", "processing"].includes(o.order_status)).length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const columns = [
        {
            title: "Invoice / Order #",
            dataIndex: "invoice_no",
            key: "invoice_no",
            render: (text) => <span className="font-mono font-bold text-slate-800">{text}</span>,
        },
        {
            title: "Date",
            dataIndex: "order_date",
            key: "order_date",
            render: (d) => dayjs(d).format("DD MMM YYYY, HH:mm"),
        },
        {
            title: "Items",
            dataIndex: "total_products",
            key: "total_products",
            render: (cnt) => <span className="text-slate-600 font-semibold">{cnt} items</span>,
        },
        {
            title: "Total Amount",
            dataIndex: "total",
            key: "total",
            render: (tot) => (
                <span className="font-extrabold text-slate-900">
                    ₹{(tot || 0).toLocaleString()}
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "order_status",
            key: "order_status",
            render: (status) => {
                const map = {
                    pending: { color: "gold", icon: <ClockCircleOutlined />, label: "Pending Processing" },
                    processing: { color: "blue", icon: <CarOutlined />, label: "Dispatched / Processing" },
                    completed: { color: "green", icon: <CheckCircleOutlined />, label: "Delivered & Completed" },
                    cancelled: { color: "red", icon: <CloseCircleOutlined />, label: "Cancelled" },
                };
                const conf = map[status] || { color: "default", label: status };
                return (
                    <Tag color={conf.color} icon={conf.icon}>
                        {conf.label}
                    </Tag>
                );
            },
        },
        {
            title: "Payment",
            key: "payment",
            render: (_, record) => {
                const info = record.payment_info;
                if (info && info.payment_status === "paid") {
                    return (
                        <Tooltip title={info.razorpay_payment_id ? `ID: ${info.razorpay_payment_id}` : "Online Payment Verified"}>
                            <Tag color="cyan">
                                💳 Paid (Razorpay)
                            </Tag>
                        </Tooltip>
                    );
                }
                return <Tag color="default">💵 COD</Tag>;
            },
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Tooltip title="View Order Details">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                        >
                            Details
                        </Button>
                    </Tooltip>
                    <Tooltip title="Download PDF Tax Invoice">
                        <Button
                            size="small"
                            icon={<FilePdfOutlined />}
                            onClick={() => generateInvoice(record._id, record.invoice_no)}
                            className="text-indigo-600 border-indigo-200 hover:text-indigo-700"
                        >
                            Invoice
                        </Button>
                    </Tooltip>
                    {record.order_status === "completed" && (
                        <Tooltip title="Request Return / Replacement">
                            <Button
                                size="small"
                                icon={<RollbackOutlined />}
                                onClick={() => handleOpenReturnModal(record)}
                                className="text-amber-600 border-amber-200 hover:text-amber-700"
                            >
                                Return
                            </Button>
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 m-0 flex items-center gap-2">
                    <ShoppingCartOutlined className="text-indigo-600" />
                    My Orders & Invoices
                </h1>
                <p className="text-slate-500 text-sm m-0">
                    Track current and past orders, download official tax invoices, and request returns.
                </p>
            </div>

            {/* KPI Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-indigo-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Total Orders</span>}
                            value={totalOrders}
                            prefix={<ShoppingCartOutlined className="mr-2 text-indigo-500" />}
                            valueStyle={{ fontWeight: "700", color: "#1e1b4b" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-amber-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">In Fulfillment</span>}
                            value={pendingOrders}
                            prefix={<ClockCircleOutlined className="mr-2 text-amber-500" />}
                            valueStyle={{ fontWeight: "700", color: "#78350f" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-emerald-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed / Delivered</span>}
                            value={completedOrders}
                            prefix={<CheckCircleOutlined className="mr-2 text-emerald-500" />}
                            valueStyle={{ fontWeight: "700", color: "#064e3b" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-slate-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Purchases</span>}
                            value={totalSpent}
                            precision={2}
                            prefix="₹"
                            valueStyle={{ fontWeight: "700", color: "#0f172a" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table */}
            <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={orders}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page, pageSize) => fetchCustomerOrders(page, pageSize),
                    }}
                />
            </Card>

            {/* Modal: Order Details */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <ShoppingCartOutlined className="text-indigo-600 text-lg" />
                        <span>Order #{selectedOrder?.invoice_no}</span>
                    </div>
                }
                open={detailsModalVisible}
                footer={null}
                onCancel={() => setDetailsModalVisible(false)}
                width={650}
            >
                <div className="py-4 space-y-4">
                    {/* Live Order Tracking Stepper */}
                    {(() => {
                        const tracking = getTrackingStepInfo(selectedOrder);
                        const isPaid = selectedOrder?.payment_info?.payment_status === "paid";
                        const razorpayId = selectedOrder?.payment_info?.razorpay_payment_id;
                        return (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Live Delivery Progress
                                    </span>
                                    {isPaid && (
                                        <Tag color="cyan" className="font-semibold text-xs">
                                            Razorpay Verified #{razorpayId ? razorpayId.slice(-8) : "PAID"}
                                        </Tag>
                                    )}
                                </div>
                                <Steps
                                    size="small"
                                    current={tracking.current}
                                    status={tracking.status}
                                    items={[
                                        {
                                            title: "Placed",
                                            description: selectedOrder?.order_date
                                                ? dayjs(selectedOrder.order_date).format("DD MMM, HH:mm")
                                                : "Order Logged",
                                        },
                                        {
                                            title: isPaid ? "Payment Verified" : (selectedOrder?.payment_type === "cash" ? "COD Confirmed" : "Verification"),
                                            description: isPaid ? "Razorpay Gateway" : "Warehouse Queue",
                                        },
                                        {
                                            title: "Dispatched",
                                            description: selectedOrder?.order_status === "cancelled" ? "Cancelled" : "In Transit",
                                        },
                                        {
                                            title: "Delivered",
                                            description: selectedOrder?.order_status === "completed" ? "Completed" : "Expected in 2-3 days",
                                        },
                                    ]}
                                />
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                        <div>
                            <span className="text-slate-400 block text-xs">Order Date</span>
                            <span className="font-semibold text-slate-800">
                                {dayjs(selectedOrder?.order_date).format("DD MMMM YYYY, HH:mm")}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-xs">Status</span>
                            <Tag color="green">{selectedOrder?.order_status?.toUpperCase()}</Tag>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-xs">Total Amount</span>
                            <span className="font-bold text-slate-900 text-base">
                                ₹{(selectedOrder?.total || 0).toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-xs">Payment Method</span>
                            <span className="font-semibold text-slate-800 uppercase">
                                {selectedOrder?.payment_type || "Standard"}
                            </span>
                        </div>
                    </div>

                    {selectedOrder?.shipping_address && (
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-700">
                            <span className="font-bold block text-blue-900 mb-1">Shipping Destination:</span>
                            {selectedOrder.shipping_address.address_line}, {selectedOrder.shipping_address.city},{" "}
                            {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.postal_code},{" "}
                            {selectedOrder.shipping_address.country}
                        </div>
                    )}

                    <h4 className="font-bold text-slate-800 mt-4 mb-2">Order Line Items</h4>
                    {loadingDetails ? (
                        <div className="py-8 text-center"><Spin /></div>
                    ) : (
                        <div className="space-y-2">
                            {orderDetailsItems.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200"
                                >
                                    <div>
                                        <div className="font-semibold text-slate-800">
                                            {item.product_id?.product_name || "Product"}
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono">
                                            SKU: {item.product_id?.product_code || "N/A"}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500">
                                            Qty: <strong>{item.quantity}</strong> × ₹{(item.unitcost || 0).toLocaleString()}
                                        </div>
                                        <div className="font-bold text-slate-900">
                                            ₹{(item.total || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <Button
                            type="primary"
                            icon={<FilePdfOutlined />}
                            onClick={() => generateInvoice(selectedOrder._id, selectedOrder.invoice_no)}
                            className="bg-indigo-600"
                        >
                            Download Invoice PDF
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Request Return */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <RollbackOutlined className="text-amber-600 text-lg" />
                        <span>Submit Return Request for Order #{selectedReturnOrder?.invoice_no}</span>
                    </div>
                }
                open={returnModalVisible}
                onOk={handleSubmitReturn}
                confirmLoading={submittingReturn}
                onCancel={() => setReturnModalVisible(false)}
                okText="Submit Return Request"
                okButtonProps={{ className: "bg-amber-600 hover:bg-amber-500" }}
            >
                <div className="py-4 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Select Item to Return:
                        </label>
                        <Select
                            value={selectedProductId}
                            onChange={(id) => {
                                setSelectedProductId(id);
                                const found = returnItems.find((i) => (i.product_id?._id || i.product_id) === id);
                                if (found) setReturnQuantity(1);
                            }}
                            className="w-full"
                            size="large"
                        >
                            {returnItems.map((item) => {
                                const prodId = item.product_id?._id || item.product_id;
                                const prodName = item.product_id?.product_name || "Item";
                                return (
                                    <Option key={prodId} value={prodId}>
                                        {prodName} (Ordered: {item.quantity})
                                    </Option>
                                );
                            })}
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Quantity to Return:
                        </label>
                        <InputNumber
                            min={1}
                            max={
                                returnItems.find(
                                    (i) => (i.product_id?._id || i.product_id) === selectedProductId
                                )?.quantity || 1
                            }
                            value={returnQuantity}
                            onChange={(val) => setReturnQuantity(val || 1)}
                            className="w-full"
                            size="large"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Reason for Return:
                        </label>
                        <Select
                            value={returnReason}
                            onChange={(r) => setReturnReason(r)}
                            className="w-full"
                            size="large"
                        >
                            <Option value="defective">Defective / Malfunctioning Product</Option>
                            <Option value="damaged">Damaged in Transit / Packaging Broken</Option>
                            <Option value="wrong_item">Received Wrong Item</Option>
                            <Option value="not_as_described">Not as Described on Site</Option>
                            <Option value="size_fit_issue">Size / Fit Discrepancy</Option>
                            <Option value="other">Other</Option>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Additional Notes / Details:
                        </label>
                        <TextArea
                            rows={3}
                            placeholder="Please provide details about the issue with the product..."
                            value={returnNotes}
                            onChange={(e) => setReturnNotes(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CustomerOrders;
