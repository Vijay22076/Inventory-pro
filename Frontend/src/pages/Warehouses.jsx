import { useState, useEffect } from "react";
import {
    Tabs,
    Card,
    Table,
    Button,
    Tag,
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    Row,
    Col,
    Statistic,
    Space,
    Tooltip,
    Popconfirm,
} from "antd";
import {
    ShopOutlined,
    SwapOutlined,
    AuditOutlined,
    HistoryOutlined,
    PlusOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CarOutlined,
    CloseCircleOutlined,
    AppstoreOutlined,
} from "@ant-design/icons";
import { useWarehouses } from "../hooks/warehouse/useWarehouses";
import { useProducts } from "../hooks/products/useProducts";
import useAuth from "../hooks/useAuth";
import dayjs from "dayjs";

const { Option } = Select;

const Warehouses = () => {
    const { isAdmin } = useAuth();
    const {
        warehouses,
        transfers,
        adjustments,
        ledgerEntries,
        loading,
        fetchWarehouses,
        createWarehouse,
        updateWarehouse,
        deleteWarehouse,
        fetchWarehouseStock,
        fetchTransfers,
        createTransfer,
        dispatchTransfer,
        receiveTransfer,
        cancelTransfer,
        fetchAdjustments,
        createAdjustment,
        approveAdjustment,
        rejectAdjustment,
        fetchLedger,
    } = useWarehouses();

    const { products } = useProducts();

    const [activeTab, setActiveTab] = useState("warehouses");

    // Modals
    const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [warehouseForm] = Form.useForm();

    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [selectedWarehouseStock, setSelectedWarehouseStock] = useState([]);
    const [selectedWarehouseName, setSelectedWarehouseName] = useState("");
    const [stockLoading, setStockLoading] = useState(false);

    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [transferForm] = Form.useForm();
    const [selectedSourceWh, setSelectedSourceWh] = useState(null);

    const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
    const [adjustmentForm] = Form.useForm();

    useEffect(() => {
        fetchWarehouses();
    }, [fetchWarehouses]);

    useEffect(() => {
        if (activeTab === "transfers") fetchTransfers();
        if (activeTab === "adjustments") fetchAdjustments();
        if (activeTab === "ledger") fetchLedger();
    }, [activeTab, fetchTransfers, fetchAdjustments, fetchLedger]);

    // KPI Aggregations
    const totalFacilities = warehouses.length;
    const totalUnits = warehouses.reduce((sum, w) => sum + (w.totalQuantity || 0), 0);
    const totalValuation = warehouses.reduce((sum, w) => sum + (w.totalValuation || 0), 0);
    const inTransitCount = transfers.filter((t) => t.status === "in_transit").length;

    // Handlers
    const handleOpenWarehouseModal = (wh = null) => {
        setEditingWarehouse(wh);
        if (wh) {
            warehouseForm.setFieldsValue({
                warehouse_name: wh.warehouse_name,
                warehouse_code: wh.warehouse_code,
                type: wh.type,
                city: wh.address?.city,
                state: wh.address?.state,
                pincode: wh.address?.pincode,
                street: wh.address?.street,
                contact_name: wh.contact_person?.name,
                contact_email: wh.contact_person?.email,
                contact_phone: wh.contact_person?.phone,
                total_capacity_sqft: wh.total_capacity_sqft,
                is_default: wh.is_default,
            });
        } else {
            warehouseForm.resetFields();
            warehouseForm.setFieldsValue({
                type: "regional_hub",
                total_capacity_sqft: 5000,
            });
        }
        setWarehouseModalOpen(true);
    };

    const handleSaveWarehouse = async (values) => {
        const payload = {
            warehouse_name: values.warehouse_name,
            warehouse_code: values.warehouse_code,
            type: values.type,
            address: {
                city: values.city,
                state: values.state || "",
                pincode: values.pincode || "",
                street: values.street || "",
            },
            contact_person: {
                name: values.contact_name || "",
                email: values.contact_email || "",
                phone: values.contact_phone || "",
            },
            total_capacity_sqft: values.total_capacity_sqft || 5000,
            is_default: values.is_default || false,
        };

        if (editingWarehouse) {
            await updateWarehouse(editingWarehouse._id, payload);
        } else {
            await createWarehouse(payload);
        }
        setWarehouseModalOpen(false);
    };

    const handleViewStock = async (warehouse) => {
        setSelectedWarehouseName(warehouse.warehouse_name);
        setStockLoading(true);
        setStockModalOpen(true);
        const stockData = await fetchWarehouseStock(warehouse._id);
        setSelectedWarehouseStock(stockData);
        setStockLoading(false);
    };

    const handleCreateTransferSubmit = async (values) => {
        const payload = {
            source_warehouse_id: values.source_warehouse_id,
            destination_warehouse_id: values.destination_warehouse_id,
            items: values.items.map((i) => ({
                product_id: i.product_id,
                requested_quantity: i.quantity,
            })),
            carrier_details: {
                carrier_name: values.carrier_name || "",
                tracking_number: values.tracking_number || "",
                vehicle_no: values.vehicle_no || "",
            },
            notes: values.notes || "",
        };

        await createTransfer(payload);
        setTransferModalOpen(false);
        transferForm.resetFields();
    };

    const handleCreateAdjustmentSubmit = async (values) => {
        const payload = {
            warehouse_id: values.warehouse_id,
            reason: values.reason,
            items: values.items.map((i) => ({
                product_id: i.product_id,
                physical_quantity: i.physical_quantity,
            })),
            notes: values.notes || "",
        };

        await createAdjustment(payload);
        setAdjustmentModalOpen(false);
        adjustmentForm.resetFields();
    };

    // Columns
    const warehouseColumns = [
        {
            title: "Facility Name",
            dataIndex: "warehouse_name",
            key: "warehouse_name",
            render: (text, record) => (
                <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                        {text}
                        {record.is_default && (
                            <Tag color="blue" className="text-xs">Default Hub</Tag>
                        )}
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                        {record.warehouse_code}
                    </span>
                </div>
            ),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (type) => {
                const colors = {
                    central: "purple",
                    regional_hub: "blue",
                    fulfillment_center: "cyan",
                    retail_store: "geekblue",
                };
                return (
                    <Tag color={colors[type] || "default"}>
                        {type?.replace("_", " ").toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: "Location",
            key: "location",
            render: (_, r) => (
                <span className="text-sm text-slate-600">
                    {r.address?.city}{r.address?.state ? `, ${r.address.state}` : ""}
                </span>
            ),
        },
        {
            title: "SKUs Stored",
            dataIndex: "totalProducts",
            key: "totalProducts",
            render: (val) => <span className="font-semibold text-slate-700">{val || 0}</span>,
        },
        {
            title: "Total Units",
            dataIndex: "totalQuantity",
            key: "totalQuantity",
            render: (val) => (
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    {val?.toLocaleString() || 0}
                </span>
            ),
        },
        {
            title: "Inventory Value",
            dataIndex: "totalValuation",
            key: "totalValuation",
            render: (val) => (
                <span className="font-semibold text-slate-800">
                    ₹{val?.toLocaleString() || 0}
                </span>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Tooltip title="Inspect Warehouse Stock">
                        <Button
                            type="text"
                            icon={<EyeOutlined className="text-blue-500" />}
                            onClick={() => handleViewStock(record)}
                        />
                    </Tooltip>
                    {isAdmin && (
                        <>
                            <Tooltip title="Edit Facility">
                                <Button
                                    type="text"
                                    icon={<EditOutlined className="text-amber-500" />}
                                    onClick={() => handleOpenWarehouseModal(record)}
                                />
                            </Tooltip>
                            {!record.is_default && (
                                <Popconfirm
                                    title="Delete Warehouse"
                                    description="Are you sure? Only warehouses with 0 stock can be deleted."
                                    onConfirm={() => deleteWarehouse(record._id)}
                                    okText="Delete"
                                    cancelText="Cancel"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                    />
                                </Popconfirm>
                            )}
                        </>
                    )}
                </Space>
            ),
        },
    ];

    const transferColumns = [
        {
            title: "Transfer Order",
            dataIndex: "transfer_no",
            key: "transfer_no",
            render: (text) => <span className="font-mono font-bold text-slate-800">{text}</span>,
        },
        {
            title: "Origin & Destination",
            key: "route",
            render: (_, r) => (
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-700">
                        {r.source_warehouse_id?.warehouse_name || "Origin"}
                    </span>
                    <SwapOutlined className="text-slate-400" />
                    <span className="font-semibold text-emerald-700">
                        {r.destination_warehouse_id?.warehouse_name || "Destination"}
                    </span>
                </div>
            ),
        },
        {
            title: "Items",
            key: "items_count",
            render: (_, r) => (
                <span className="text-sm text-slate-600">
                    {r.items?.length || 0} item(s) • Total {r.items?.reduce((s, i) => s + (i.requested_quantity || 0), 0)} units
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (st) => {
                const map = {
                    pending: { color: "gold", icon: <ClockCircleOutlined />, label: "Pending Dispatch" },
                    in_transit: { color: "blue", icon: <CarOutlined />, label: "In Transit" },
                    completed: { color: "green", icon: <CheckCircleOutlined />, label: "Completed" },
                    cancelled: { color: "red", icon: <CloseCircleOutlined />, label: "Cancelled" },
                };
                const conf = map[st] || { color: "default", label: st };
                return (
                    <Tag color={conf.color} icon={conf.icon}>
                        {conf.label}
                    </Tag>
                );
            },
        },
        {
            title: "Date",
            dataIndex: "transfer_date",
            key: "transfer_date",
            render: (d) => dayjs(d).format("DD MMM YYYY, HH:mm"),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    {record.status === "pending" && (
                        <Popconfirm
                            title="Dispatch Shipment"
                            description="This will deduct items from source warehouse and put them in transit."
                            onConfirm={() => dispatchTransfer(record._id)}
                            okText="Dispatch"
                        >
                            <Button size="small" type="primary">
                                Dispatch
                            </Button>
                        </Popconfirm>
                    )}
                    {record.status === "in_transit" && (
                        <Popconfirm
                            title="Receive Shipment"
                            description="This will credit the transferred items into destination warehouse stock."
                            onConfirm={() => receiveTransfer(record._id)}
                            okText="Confirm Receipt"
                        >
                            <Button size="small" style={{ backgroundColor: "#10b981", color: "#fff" }}>
                                Mark Received
                            </Button>
                        </Popconfirm>
                    )}
                    {["pending", "in_transit"].includes(record.status) && (
                        <Popconfirm
                            title="Cancel Transfer"
                            description="Cancelled in-transit transfers automatically restore stock back to origin."
                            onConfirm={() => cancelTransfer(record._id)}
                            okButtonProps={{ danger: true }}
                            okText="Cancel Transfer"
                        >
                            <Button size="small" danger>
                                Cancel
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    const adjustmentColumns = [
        {
            title: "Adjustment #",
            dataIndex: "adjustment_no",
            key: "adjustment_no",
            render: (text) => <span className="font-mono font-bold text-slate-800">{text}</span>,
        },
        {
            title: "Warehouse",
            dataIndex: "warehouse_id",
            key: "warehouse",
            render: (wh) => <span className="font-semibold text-slate-700">{wh?.warehouse_name || "N/A"}</span>,
        },
        {
            title: "Reason",
            dataIndex: "reason",
            key: "reason",
            render: (r) => {
                const map = {
                    cycle_count: { color: "blue", label: "Cycle Count" },
                    damage: { color: "volcano", label: "Damaged Goods" },
                    expired: { color: "orange", label: "Expired Stock" },
                    theft_shrinkage: { color: "red", label: "Theft / Shrinkage" },
                    audit_variance: { color: "purple", label: "Audit Variance" },
                    found_stock: { color: "green", label: "Found Stock" },
                };
                const conf = map[r] || { color: "default", label: r };
                return <Tag color={conf.color}>{conf.label}</Tag>;
            },
        },
        {
            title: "Variances",
            key: "variances",
            render: (_, record) => {
                const netVariance = record.items?.reduce((s, i) => s + (i.variance || 0), 0);
                return (
                    <span className={`font-bold ${netVariance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {netVariance > 0 ? `+${netVariance}` : netVariance} units ({record.items?.length || 0} SKUs)
                    </span>
                );
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (st) => {
                const map = {
                    pending: { color: "gold", icon: <ClockCircleOutlined />, label: "Pending Approval" },
                    approved: { color: "green", icon: <CheckCircleOutlined />, label: "Approved" },
                    rejected: { color: "red", icon: <CloseCircleOutlined />, label: "Rejected" },
                };
                const conf = map[st] || { color: "gold", icon: <ClockCircleOutlined />, label: "Pending Approval" };
                return (
                    <Tag color={conf.color} icon={conf.icon}>
                        {conf.label}
                    </Tag>
                );
            },
        },
        {
            title: "Date",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (d) => dayjs(d).format("DD MMM YYYY, HH:mm"),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => {
                if (record.status === "pending") {
                    if (isAdmin) {
                        return (
                            <Space>
                                <Popconfirm
                                    title="Approve Adjustment"
                                    description="This will apply stock changes to inventory and record in the stock ledger."
                                    onConfirm={() => approveAdjustment(record._id)}
                                    okText="Approve"
                                >
                                    <Button size="small" type="primary" className="bg-emerald-600 hover:bg-emerald-500">
                                        Approve
                                    </Button>
                                </Popconfirm>
                                <Popconfirm
                                    title="Reject Adjustment"
                                    description="This will reject the adjustment without modifying inventory."
                                    onConfirm={() => rejectAdjustment(record._id, "Rejected by Admin")}
                                    okText="Reject"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button size="small" danger>
                                        Reject
                                    </Button>
                                </Popconfirm>
                            </Space>
                        );
                    }
                    return <Tag color="orange">Awaiting Admin Approval</Tag>;
                }
                return (
                    <span className="text-xs text-slate-400">
                        {record.approved_by?.username ? `By ${record.approved_by.username}` : "Processed"}
                    </span>
                );
            },
        },
    ];

    const ledgerColumns = [
        {
            title: "Timestamp",
            dataIndex: "timestamp",
            key: "timestamp",
            render: (d) => dayjs(d).format("DD MMM YYYY, HH:mm:ss"),
        },
        {
            title: "Facility",
            dataIndex: "warehouse_id",
            key: "warehouse",
            render: (w) => <span className="font-semibold text-slate-700">{w?.warehouse_name || "N/A"}</span>,
        },
        {
            title: "Product",
            dataIndex: "product_id",
            key: "product",
            render: (p) => (
                <div>
                    <span className="font-medium text-slate-800">{p?.product_name || "N/A"}</span>
                    <span className="text-xs text-slate-400 font-mono ml-2">{p?.product_code}</span>
                </div>
            ),
        },
        {
            title: "Movement Type",
            dataIndex: "transaction_type",
            key: "transaction_type",
            render: (type) => {
                const map = {
                    purchase_receipt: { color: "green", label: "Purchase Receipt (GRN)" },
                    order_dispatch: { color: "orange", label: "Order Dispatch" },
                    transfer_in: { color: "blue", label: "Transfer Inbound" },
                    transfer_out: { color: "geekblue", label: "Transfer Outbound" },
                    adjustment_add: { color: "cyan", label: "Adjustment (+)" },
                    adjustment_deduct: { color: "volcano", label: "Adjustment (-)" },
                    purchase_return: { color: "magenta", label: "Purchase Return" },
                };
                const conf = map[type] || { color: "default", label: type };
                return <Tag color={conf.color}>{conf.label}</Tag>;
            },
        },
        {
            title: "Reference",
            dataIndex: "reference_no",
            key: "reference_no",
            render: (ref) => <span className="font-mono text-xs text-slate-600">{ref}</span>,
        },
        {
            title: "Before",
            dataIndex: "quantity_before",
            key: "quantity_before",
        },
        {
            title: "Delta",
            dataIndex: "quantity_change",
            key: "quantity_change",
            render: (delta) => (
                <span className={`font-bold ${delta > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {delta > 0 ? `+${delta}` : delta}
                </span>
            ),
        },
        {
            title: "After",
            dataIndex: "quantity_after",
            key: "quantity_after",
            render: (after) => <span className="font-semibold text-slate-800">{after}</span>,
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 m-0">
                        Warehouse Management System (WMS)
                    </h1>
                    <p className="text-slate-500 text-sm m-0">
                        Multi-facility inventory tracking, inter-warehouse transfers, and stock ledgers.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleOpenWarehouseModal()}
                            className="bg-indigo-600 hover:bg-indigo-500"
                        >
                            New Warehouse
                        </Button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-indigo-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Total Warehouses</span>}
                            value={totalFacilities}
                            prefix={<ShopOutlined className="mr-2 text-indigo-500" />}
                            valueStyle={{ fontWeight: "700", color: "#1e1b4b" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-emerald-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Inventory Units</span>}
                            value={totalUnits}
                            prefix={<AppstoreOutlined className="mr-2 text-emerald-500" />}
                            valueStyle={{ fontWeight: "700", color: "#064e3b" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-amber-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Total Stock Value</span>}
                            value={totalValuation}
                            prefix="₹"
                            valueStyle={{ fontWeight: "700", color: "#78350f" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-blue-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">In-Transit Shipments</span>}
                            value={inTransitCount}
                            prefix={<CarOutlined className="mr-2 text-blue-500" />}
                            valueStyle={{ fontWeight: "700", color: "#1e3a8a" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Navigation Tabs */}
            <Card className="shadow-sm rounded-xl border border-slate-200">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: "warehouses",
                            label: (
                                <span className="flex items-center gap-2">
                                    <ShopOutlined /> Facilities ({warehouses.length})
                                </span>
                            ),
                            children: (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-slate-800 m-0">
                                            Active Facilities & Distribution Hubs
                                        </h3>
                                        <Button
                                            icon={<PlusOutlined />}
                                            onClick={() => handleOpenWarehouseModal()}
                                        >
                                            Add Facility
                                        </Button>
                                    </div>
                                    <Table
                                        columns={warehouseColumns}
                                        dataSource={warehouses}
                                        rowKey="_id"
                                        loading={loading}
                                        pagination={{ pageSize: 10 }}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: "transfers",
                            label: (
                                <span className="flex items-center gap-2">
                                    <SwapOutlined /> Stock Transfers ({transfers.length})
                                </span>
                            ),
                            children: (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-800 m-0">
                                                Inter-Warehouse Stock Shipments
                                            </h3>
                                            <p className="text-xs text-slate-500 m-0">
                                                Move inventory securely between physical nodes with in-transit validation.
                                            </p>
                                        </div>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={() => {
                                                transferForm.resetFields();
                                                setTransferModalOpen(true);
                                            }}
                                            className="bg-indigo-600"
                                        >
                                            Initiate Transfer
                                        </Button>
                                    </div>
                                    <Table
                                        columns={transferColumns}
                                        dataSource={transfers}
                                        rowKey="_id"
                                        loading={loading}
                                        pagination={{ pageSize: 10 }}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: "adjustments",
                            label: (
                                <span className="flex items-center gap-2">
                                    <AuditOutlined /> Cycle Counts & Adjustments
                                </span>
                            ),
                            children: (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-800 m-0">
                                                Inventory Reconciliations & Write-offs
                                            </h3>
                                            <p className="text-xs text-slate-500 m-0">
                                                Record physical audit counts, damage, shrinkage, and write-offs.
                                            </p>
                                        </div>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={() => {
                                                adjustmentForm.resetFields();
                                                setAdjustmentModalOpen(true);
                                            }}
                                            className="bg-indigo-600"
                                        >
                                            New Stock Adjustment
                                        </Button>
                                    </div>
                                    <Table
                                        columns={adjustmentColumns}
                                        dataSource={adjustments}
                                        rowKey="_id"
                                        loading={loading}
                                        pagination={{ pageSize: 10 }}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: "ledger",
                            label: (
                                <span className="flex items-center gap-2">
                                    <HistoryOutlined /> Movement Ledger
                                </span>
                            ),
                            children: (
                                <div>
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-slate-800 m-0">
                                            Double-Entry Stock Audit Trail
                                        </h3>
                                        <p className="text-xs text-slate-500 m-0">
                                            Immutable history of every unit added, deducted, transferred, or adjusted.
                                        </p>
                                    </div>
                                    <Table
                                        columns={ledgerColumns}
                                        dataSource={ledgerEntries}
                                        rowKey="_id"
                                        loading={loading}
                                        pagination={{ pageSize: 15 }}
                                    />
                                </div>
                            ),
                        },
                    ]}
                />
            </Card>

            {/* Warehouse Create / Edit Modal */}
            <Modal
                title={editingWarehouse ? "Edit Warehouse Facility" : "Add Warehouse Facility"}
                open={warehouseModalOpen}
                onCancel={() => setWarehouseModalOpen(false)}
                footer={null}
                width={650}
            >
                <Form
                    form={warehouseForm}
                    layout="vertical"
                    onFinish={handleSaveWarehouse}
                >
                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item
                                name="warehouse_name"
                                label="Facility Name"
                                rules={[{ required: true, message: "Warehouse name is required" }]}
                            >
                                <Input placeholder="e.g. Bangalore North Central Hub" />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item
                                name="warehouse_code"
                                label="Facility Code"
                                rules={[{ required: true, message: "Code is required" }]}
                            >
                                <Input placeholder="e.g. WH-BLR-01" className="uppercase" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="type" label="Facility Type">
                                <Select>
                                    <Option value="central">Central Distribution Center</Option>
                                    <Option value="regional_hub">Regional Hub</Option>
                                    <Option value="fulfillment_center">Fulfillment Center</Option>
                                    <Option value="retail_store">Retail Outlet Backroom</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="total_capacity_sqft" label="Total Capacity (sq. ft.)">
                                <InputNumber min={100} className="w-full" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <h4 className="text-sm font-semibold text-slate-700 mt-2 mb-3">Location & Address</h4>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="city"
                                label="City"
                                rules={[{ required: true, message: "City is required" }]}
                            >
                                <Input placeholder="e.g. Bangalore" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="state" label="State">
                                <Input placeholder="e.g. Karnataka" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="pincode" label="Postal / PIN Code">
                                <Input placeholder="e.g. 560001" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="street" label="Street / Landmark">
                                <Input placeholder="e.g. Industrial Area Phase 2" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <h4 className="text-sm font-semibold text-slate-700 mt-2 mb-3">Facility Contact</h4>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="contact_name" label="Manager Name">
                                <Input placeholder="John Doe" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="contact_email" label="Contact Email">
                                <Input placeholder="ops@company.com" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="contact_phone" label="Contact Phone">
                                <Input placeholder="+91 9876543210" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button onClick={() => setWarehouseModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading} className="bg-indigo-600">
                            {editingWarehouse ? "Update Facility" : "Create Facility"}
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Warehouse Stock Inspection Modal */}
            <Modal
                title={`Facility Stock: ${selectedWarehouseName}`}
                open={stockModalOpen}
                onCancel={() => setStockModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setStockModalOpen(false)}>
                        Close
                    </Button>,
                ]}
                width={800}
            >
                <Table
                    dataSource={selectedWarehouseStock}
                    rowKey="_id"
                    loading={stockLoading}
                    pagination={{ pageSize: 8 }}
                    columns={[
                        {
                            title: "Product",
                            key: "product",
                            render: (_, r) => (
                                <div>
                                    <div className="font-semibold text-slate-800">{r.product?.product_name}</div>
                                    <span className="text-xs text-slate-400 font-mono">{r.product?.product_code}</span>
                                </div>
                            ),
                        },
                        {
                            title: "Bin Location",
                            dataIndex: "bin_location",
                            key: "bin_location",
                            render: (b) => <Tag color="geekblue">{b || "A-01-01"}</Tag>,
                        },
                        {
                            title: "Category",
                            key: "category",
                            render: (_, r) => r.category?.category_name || "N/A",
                        },
                        {
                            title: "On Hand Stock",
                            dataIndex: "quantity",
                            key: "quantity",
                            render: (qty) => (
                                <span className={`font-bold ${qty <= 5 ? "text-rose-600" : "text-emerald-600"}`}>
                                    {qty} units
                                </span>
                            ),
                        },
                        {
                            title: "Unit Price",
                            key: "price",
                            render: (_, r) => `₹${r.product?.selling_price || 0}`,
                        },
                    ]}
                />
            </Modal>

            {/* Create Stock Transfer Modal */}
            <Modal
                title="Initiate Inter-Warehouse Transfer"
                open={transferModalOpen}
                onCancel={() => setTransferModalOpen(false)}
                footer={null}
                width={700}
            >
                <Form
                    form={transferForm}
                    layout="vertical"
                    onFinish={handleCreateTransferSubmit}
                    initialValues={{ items: [{ product_id: undefined, quantity: 1 }] }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="source_warehouse_id"
                                label="Source Facility (Origin)"
                                rules={[{ required: true, message: "Please select source facility" }]}
                            >
                                <Select
                                    placeholder="Select Origin"
                                    onChange={(val) => setSelectedSourceWh(val)}
                                >
                                    {warehouses.map((w) => (
                                        <Option key={w._id} value={w._id}>
                                            {w.warehouse_name} ({w.warehouse_code})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="destination_warehouse_id"
                                label="Destination Facility"
                                rules={[{ required: true, message: "Please select destination facility" }]}
                            >
                                <Select placeholder="Select Destination">
                                    {warehouses
                                        .filter((w) => w._id !== selectedSourceWh)
                                        .map((w) => (
                                            <Option key={w._id} value={w._id}>
                                                {w.warehouse_name} ({w.warehouse_code})
                                            </Option>
                                        ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <h4 className="text-sm font-semibold text-slate-700 mt-2 mb-2">Transfer Items</h4>
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <div className="space-y-3">
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={12} align="middle">
                                        <Col span={14}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "product_id"]}
                                                rules={[{ required: true, message: "Select product" }]}
                                                className="mb-0"
                                            >
                                                <Select placeholder="Select Product to Transfer">
                                                    {products.map((p) => (
                                                        <Option key={p._id} value={p._id}>
                                                            {p.product_name} ({p.product_code}) - Avail: {p.stock}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={7}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "quantity"]}
                                                rules={[{ required: true, message: "Qty" }]}
                                                className="mb-0"
                                            >
                                                <InputNumber min={1} placeholder="Qty" className="w-full" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={3}>
                                            {fields.length > 1 && (
                                                <Button type="text" danger onClick={() => remove(name)}>
                                                    ✕
                                                </Button>
                                            )}
                                        </Col>
                                    </Row>
                                ))}
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                >
                                    Add Another Item
                                </Button>
                            </div>
                        )}
                    </Form.List>

                    <h4 className="text-sm font-semibold text-slate-700 mt-4 mb-2">Carrier & Notes (Optional)</h4>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="carrier_name" label="Carrier Name" className="mb-2">
                                <Input placeholder="e.g. BlueDart" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="tracking_number" label="Tracking #" className="mb-2">
                                <Input placeholder="TRK123456" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="vehicle_no" label="Vehicle #" className="mb-2">
                                <Input placeholder="KA-01-AB-1234" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="notes" label="Dispatch Notes">
                        <Input.TextArea rows={2} placeholder="Optional instructions or transfer reason" />
                    </Form.Item>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button onClick={() => setTransferModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading} className="bg-indigo-600">
                            Create Transfer
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Create Stock Adjustment Modal */}
            <Modal
                title="Perform Physical Stock Count / Adjustment"
                open={adjustmentModalOpen}
                onCancel={() => setAdjustmentModalOpen(false)}
                footer={null}
                width={700}
            >
                <Form
                    form={adjustmentForm}
                    layout="vertical"
                    onFinish={handleCreateAdjustmentSubmit}
                    initialValues={{ items: [{ product_id: undefined, physical_quantity: 0 }] }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="warehouse_id"
                                label="Facility Where Count Occurred"
                                rules={[{ required: true, message: "Select warehouse" }]}
                            >
                                <Select placeholder="Select Facility">
                                    {warehouses.map((w) => (
                                        <Option key={w._id} value={w._id}>
                                            {w.warehouse_name} ({w.warehouse_code})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="reason"
                                label="Reason for Reconciliation"
                                rules={[{ required: true, message: "Select reason" }]}
                            >
                                <Select placeholder="Select Reason">
                                    <Option value="cycle_count">Regular Cycle Count</Option>
                                    <Option value="damage">Damaged Goods Write-off</Option>
                                    <Option value="expired">Expired Goods</Option>
                                    <Option value="theft_shrinkage">Shrinkage / Unaccounted Loss</Option>
                                    <Option value="found_stock">Found / Recovered Stock</Option>
                                    <Option value="audit_variance">Annual Audit Discrepancy</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <h4 className="text-sm font-semibold text-slate-700 mt-2 mb-2">Reconciled Items</h4>
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <div className="space-y-3">
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={12} align="middle">
                                        <Col span={14}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "product_id"]}
                                                rules={[{ required: true, message: "Select product" }]}
                                                className="mb-0"
                                            >
                                                <Select placeholder="Select Product">
                                                    {products.map((p) => (
                                                        <Option key={p._id} value={p._id}>
                                                            {p.product_name} ({p.product_code}) - Current: {p.stock}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={7}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "physical_quantity"]}
                                                rules={[{ required: true, message: "Count" }]}
                                                className="mb-0"
                                            >
                                                <InputNumber min={0} placeholder="Physical Count" className="w-full" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={3}>
                                            {fields.length > 1 && (
                                                <Button type="text" danger onClick={() => remove(name)}>
                                                    ✕
                                                </Button>
                                            )}
                                        </Col>
                                    </Row>
                                ))}
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                >
                                    Add Another Item
                                </Button>
                            </div>
                        )}
                    </Form.List>

                    <Form.Item name="notes" label="Audit Notes" className="mt-4">
                        <Input.TextArea rows={2} placeholder="Inspector name, audit context, or explanation" />
                    </Form.Item>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button onClick={() => setAdjustmentModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading} className="bg-indigo-600">
                            Apply Reconciliation
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default Warehouses;
