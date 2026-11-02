import React, { useState, useEffect, useCallback } from "react";
import {
    Card,
    Table,
    Button,
    Tag,
    Modal,
    Drawer,
    Avatar,
    Input,
    Select,
    Row,
    Col,
    Statistic,
    Space,
    Progress,
} from "antd";
import {
    RollbackOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    InboxOutlined,
    EyeOutlined,
    PrinterOutlined,
    PieChartOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
} from "@ant-design/icons";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { api } from "../api/api";

const { Option } = Select;
const { TextArea } = Input;

const Returns = () => {
    const [returns, setReturns] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");

    // Process Modal (for Receive or Reject)
    const [processModalVisible, setProcessModalVisible] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [actionType, setActionType] = useState("received"); // "approved" | "rejected" | "received"
    const [selectedWhId, setSelectedWhId] = useState("");
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [processing, setProcessing] = useState(false);

    // Return Details Drawer & Printable Slip state
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [detailReturn, setDetailReturn] = useState(null);
    const [printModalVisible, setPrintModalVisible] = useState(false);

    const handleOpenDetails = (record) => {
        setDetailReturn(record);
        setDrawerVisible(true);
    };

    const handleOpenPrint = (record) => {
        setDetailReturn(record);
        setPrintModalVisible(true);
    };

    const fetchReturns = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/returns");
            if (response.data.success) {
                setReturns(response.data.data || []);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load returns");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchWarehouses = useCallback(async () => {
        try {
            const response = await api.get("/warehouses");
            if (response.data.success) {
                setWarehouses(response.data.data || []);
            }
        } catch (err) {
            console.error("Failed to load warehouses:", err);
        }
    }, []);

    useEffect(() => {
        fetchReturns();
        fetchWarehouses();
    }, [fetchReturns, fetchWarehouses]);

    const handleOpenProcess = (record, action) => {
        setSelectedReturn(record);
        setActionType(action);
        setResolutionNotes("");

        const defaultWh =
            record.target_warehouse_id?._id ||
            record.order_id?.warehouse_id?._id ||
            record.order_id?.warehouse_id ||
            (warehouses.length > 0 ? warehouses[0]._id : "");
        setSelectedWhId(defaultWh);

        setProcessModalVisible(true);
    };

    const handleExecuteProcess = async () => {
        if (!selectedReturn) return;
        if (actionType === "received" && !selectedWhId) {
            toast.error("Please select a target warehouse to restock items");
            return;
        }

        try {
            setProcessing(true);
            const response = await api.put(`/returns/${selectedReturn._id}/process`, {
                status: actionType,
                resolution_notes: resolutionNotes,
                target_warehouse_id: selectedWhId || undefined,
            });

            if (response.data.success) {
                toast.success(
                    actionType === "received"
                        ? "Return processed and stock replenished in warehouse ledger"
                        : actionType === "approved"
                        ? "Return request authorized"
                        : "Return request rejected"
                );
                setProcessModalVisible(false);
                fetchReturns();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to process return");
        } finally {
            setProcessing(false);
        }
    };

    const filteredReturns = returns.filter((r) => {
        if (statusFilter === "all") return true;
        return r.status === statusFilter;
    });

    const totalReturns = returns.length;
    const pendingCount = returns.filter((r) => r.status === "pending").length;
    const approvedCount = returns.filter((r) => r.status === "approved").length;
    const receivedCount = returns.filter((r) => r.status === "received").length;
    const rejectedCount = returns.filter((r) => r.status === "rejected").length;
    const restockRate = totalReturns > 0 ? Math.round((receivedCount / totalReturns) * 100) : 0;
    const rejectRate = totalReturns > 0 ? Math.round((rejectedCount / totalReturns) * 100) : 0;

    const reasonCounts = React.useMemo(() => {
        const counts = {
            defective: 0,
            damaged: 0,
            wrong_item: 0,
            size_fit_issue: 0,
            not_as_described: 0,
            other: 0,
        };

        returns.forEach((r) => {
            const raw = (r.reason || "").toLowerCase();
            if (raw.includes("defect")) counts.defective++;
            else if (raw.includes("damage")) counts.damaged++;
            else if (raw.includes("wrong")) counts.wrong_item++;
            else if (raw.includes("size") || raw.includes("fit")) counts.size_fit_issue++;
            else if (raw.includes("describ")) counts.not_as_described++;
            else if (counts[raw] !== undefined) counts[raw]++;
            else counts.other++;
        });

        return counts;
    }, [returns]);

    const columns = [
        {
            title: "Return #",
            dataIndex: "return_no",
            key: "return_no",
            render: (text, record) => (
                <button
                    onClick={() => handleOpenDetails(record)}
                    className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
                >
                    {text}
                </button>
            ),
        },
        {
            title: "Order #",
            key: "order",
            render: (_, r) => (
                <span className="font-mono text-indigo-600 font-semibold">
                    #{r.order_id?.invoice_no || "N/A"}
                </span>
            ),
        },
        {
            title: "Customer",
            key: "customer",
            render: (_, r) => {
                const customer = r.customer_id || r.customer_user_id || r.created_by;
                const orderCustomer = r.order_id?.customer_id;
                const customerName =
                    customer?.username ||
                    customer?.name ||
                    orderCustomer?.name ||
                    "Customer";
                const customerEmail =
                    customer?.email ||
                    orderCustomer?.email ||
                    "";
                const customerPhone =
                    customer?.phone ||
                    orderCustomer?.phone ||
                    "";

                return (
                    <div>
                        <div className="font-semibold text-slate-800 capitalize">
                            {customerName}
                        </div>
                        {customerEmail && (
                            <div className="text-xs text-slate-400">{customerEmail}</div>
                        )}
                        {!customerEmail && customerPhone && (
                            <div className="text-xs text-slate-400">{customerPhone}</div>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Product & Qty",
            key: "product",
            render: (_, r) => {
                const firstItem = r.items?.[0];
                const product = firstItem?.product_id || r.product_id;
                const productName =
                    product?.product_name || product?.name || "Product";
                const productCode =
                    product?.product_code || product?.code || "";
                const quantity =
                    firstItem?.quantity !== undefined
                        ? firstItem.quantity
                        : r.quantity !== undefined
                        ? r.quantity
                        : 1;
                const extraItems = (r.items?.length || 0) > 1 ? r.items.length - 1 : 0;

                return (
                    <div>
                        <div className="font-medium text-slate-800">
                            {productName}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                            {productCode && `${productCode} • `}
                            <strong>{quantity} unit(s)</strong>
                            {extraItems > 0 && (
                                <span className="text-indigo-600 font-sans font-medium ml-1">
                                    (+{extraItems} more)
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Reason",
            dataIndex: "reason",
            key: "reason",
            render: (r) => {
                const map = {
                    defective: { color: "volcano", label: "Defective" },
                    damaged: { color: "red", label: "Damaged in Transit" },
                    wrong_item: { color: "orange", label: "Wrong Item" },
                    not_as_described: { color: "purple", label: "Not as Described" },
                    size_fit_issue: { color: "cyan", label: "Size/Fit" },
                    other: { color: "default", label: "Other" },
                };
                const conf = map[r] || { color: "default", label: r };
                return <Tag color={conf.color}>{conf.label}</Tag>;
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (st, record) => {
                const map = {
                    pending: { color: "gold", icon: <ClockCircleOutlined />, label: "Pending Review" },
                    approved: { color: "blue", icon: <SyncOutlined spin />, label: "Return Authorized" },
                    received: { color: "green", icon: <CheckCircleOutlined />, label: "Received & Restocked" },
                    rejected: { color: "red", icon: <CloseCircleOutlined />, label: "Rejected" },
                };
                const conf = map[st] || { color: "default", label: st };
                return (
                    <div>
                        <Tag color={conf.color} icon={conf.icon}>
                            {conf.label}
                        </Tag>
                        {record?.refund_info?.refund_id && (
                            <div className="mt-1">
                                <Tag color="cyan" className="font-mono text-xs">
                                    💳 Refund: {record.refund_info.refund_id.slice(-8)} (₹{(record.refund_info.refund_amount || 0).toLocaleString()})
                                </Tag>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Date",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (d) => dayjs(d).format("DD MMM YYYY"),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleOpenDetails(record)}
                        className="text-slate-600 hover:text-indigo-600"
                    >
                        View
                    </Button>
                    <Button
                        size="small"
                        icon={<PrinterOutlined />}
                        onClick={() => handleOpenPrint(record)}
                        className="text-slate-600 hover:text-slate-900"
                    >
                        Slip
                    </Button>
                    {record.status === "pending" && (
                        <>
                            <Button
                                size="small"
                                type="primary"
                                className="bg-indigo-600 hover:bg-indigo-500"
                                onClick={() => handleOpenProcess(record, "approved")}
                            >
                                Authorize
                            </Button>
                            <Button
                                size="small"
                                danger
                                onClick={() => handleOpenProcess(record, "rejected")}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                    {record.status === "approved" && (
                        <Button
                            size="small"
                            type="primary"
                            icon={<InboxOutlined />}
                            className="bg-emerald-600 hover:bg-emerald-500"
                            onClick={() => handleOpenProcess(record, "received")}
                        >
                            Receive & Restock
                        </Button>
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
                    <RollbackOutlined className="text-indigo-600" />
                    Customer Returns Management
                </h1>
                <p className="text-slate-500 text-sm m-0">
                    Review incoming customer return requests, authorize returns, and receive goods back into warehouse inventory with automated Stock Ledger reconciliation.
                </p>
            </div>

            {/* KPI Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-indigo-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Total Returns</span>}
                            value={totalReturns}
                            prefix={<RollbackOutlined className="mr-2 text-indigo-500" />}
                            valueStyle={{ fontWeight: "700", color: "#1e1b4b" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-amber-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Awaiting Review</span>}
                            value={pendingCount}
                            prefix={<ClockCircleOutlined className="mr-2 text-amber-500" />}
                            valueStyle={{ fontWeight: "700", color: "#78350f" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-blue-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Authorized (Inbound)</span>}
                            value={approvedCount}
                            prefix={<SyncOutlined className="mr-2 text-blue-500" />}
                            valueStyle={{ fontWeight: "700", color: "#1e3a8a" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-emerald-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Restocked in WMS</span>}
                            value={receivedCount}
                            prefix={<CheckCircleOutlined className="mr-2 text-emerald-500" />}
                            valueStyle={{ fontWeight: "700", color: "#064e3b" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Return Reason & Quality Defect Analytics */}
            <Card
                variant="borderless"
                className="shadow-sm border border-slate-200/80 rounded-xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/20"
                styles={{ body: { padding: "20px 24px" } }}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <PieChartOutlined className="text-base" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm m-0">
                                Return Reason & Quality Defect Analytics
                            </h3>
                            <p className="text-xs text-slate-500 m-0">
                                Root-cause distribution and warehouse restocking efficiency
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
                            <CheckCircleFilled className="text-emerald-500" />
                            <span>Restock Acceptance: <strong>{restockRate}%</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-100">
                            <CloseCircleFilled className="text-rose-500" />
                            <span>Rejection Rate: <strong>{rejectRate}%</strong></span>
                        </div>
                    </div>
                </div>

                <Row gutter={[24, 16]}>
                    <Col xs={24} md={14} className="space-y-3">
                        <div className="space-y-2.5">
                            {/* Defective */}
                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-700 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                                        Defective / Quality Failure
                                    </span>
                                    <span className="text-slate-500">
                                        {reasonCounts.defective} ({totalReturns > 0 ? Math.round((reasonCounts.defective / totalReturns) * 100) : 0}%)
                                    </span>
                                </div>
                                <Progress
                                    percent={totalReturns > 0 ? Math.round((reasonCounts.defective / totalReturns) * 100) : 0}
                                    strokeColor="#f43f5e"
                                    trailColor="#f1f5f9"
                                    showInfo={false}
                                    size="small"
                                />
                            </div>

                            {/* Damaged in Transit */}
                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-700 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                                        Damaged in Transit
                                    </span>
                                    <span className="text-slate-500">
                                        {reasonCounts.damaged} ({totalReturns > 0 ? Math.round((reasonCounts.damaged / totalReturns) * 100) : 0}%)
                                    </span>
                                </div>
                                <Progress
                                    percent={totalReturns > 0 ? Math.round((reasonCounts.damaged / totalReturns) * 100) : 0}
                                    strokeColor="#f59e0b"
                                    trailColor="#f1f5f9"
                                    showInfo={false}
                                    size="small"
                                />
                            </div>

                            {/* Wrong Item Dispatched */}
                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-700 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                                        Wrong Item Dispatched
                                    </span>
                                    <span className="text-slate-500">
                                        {reasonCounts.wrong_item} ({totalReturns > 0 ? Math.round((reasonCounts.wrong_item / totalReturns) * 100) : 0}%)
                                    </span>
                                </div>
                                <Progress
                                    percent={totalReturns > 0 ? Math.round((reasonCounts.wrong_item / totalReturns) * 100) : 0}
                                    strokeColor="#3b82f6"
                                    trailColor="#f1f5f9"
                                    showInfo={false}
                                    size="small"
                                />
                            </div>

                            {/* Size / Fit Preference */}
                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-700 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span>
                                        Size / Fit Issue
                                    </span>
                                    <span className="text-slate-500">
                                        {reasonCounts.size_fit_issue} ({totalReturns > 0 ? Math.round((reasonCounts.size_fit_issue / totalReturns) * 100) : 0}%)
                                    </span>
                                </div>
                                <Progress
                                    percent={totalReturns > 0 ? Math.round((reasonCounts.size_fit_issue / totalReturns) * 100) : 0}
                                    strokeColor="#14b8a6"
                                    trailColor="#f1f5f9"
                                    showInfo={false}
                                    size="small"
                                />
                            </div>

                            {/* Other / Discretionary */}
                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-700 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                                        Other / Discretionary
                                    </span>
                                    <span className="text-slate-500">
                                        {reasonCounts.other + reasonCounts.not_as_described} ({totalReturns > 0 ? Math.round(((reasonCounts.other + reasonCounts.not_as_described) / totalReturns) * 100) : 0}%)
                                    </span>
                                </div>
                                <Progress
                                    percent={totalReturns > 0 ? Math.round(((reasonCounts.other + reasonCounts.not_as_described) / totalReturns) * 100) : 0}
                                    strokeColor="#94a3b8"
                                    trailColor="#f1f5f9"
                                    showInfo={false}
                                    size="small"
                                />
                            </div>
                        </div>
                    </Col>

                    <Col xs={24} md={10}>
                        <div className="bg-white/90 border border-slate-200/80 rounded-xl p-4 h-full flex flex-col justify-between">
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                RMA Inventory Impact
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-[11px] text-slate-400">Total RMA Requests</div>
                                    <div className="text-xl font-bold text-slate-800">{totalReturns}</div>
                                </div>
                                <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100">
                                    <div className="text-[11px] text-emerald-600">Restocked Units</div>
                                    <div className="text-xl font-bold text-emerald-800">{receivedCount}</div>
                                </div>
                            </div>
                            <div className="text-[11px] text-slate-500 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100">
                                💡 <strong>Pro Tip:</strong> Restocking items automatically logs an Inward ledger adjustment and restores bin quantities.
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Filter Bar */}
            <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Status Filter:</span>
                    <Select
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v)}
                        style={{ width: 180 }}
                    >
                        <Option value="all">All Statuses ({totalReturns})</Option>
                        <Option value="pending">Pending ({pendingCount})</Option>
                        <Option value="approved">Authorized ({approvedCount})</Option>
                        <Option value="received">Restocked ({receivedCount})</Option>
                        <Option value="rejected">Rejected</Option>
                    </Select>
                </div>
            </Card>

            {/* Table */}
            <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={filteredReturns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Modal: Process Return */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        {actionType === "received" ? (
                            <InboxOutlined className="text-emerald-600 text-lg" />
                        ) : actionType === "approved" ? (
                            <CheckCircleOutlined className="text-indigo-600 text-lg" />
                        ) : (
                            <CloseCircleOutlined className="text-rose-600 text-lg" />
                        )}
                        <span>
                            {actionType === "received"
                                ? `Receive & Restock Return #${selectedReturn?.return_no}`
                                : actionType === "approved"
                                ? `Authorize Return #${selectedReturn?.return_no}`
                                : `Reject Return #${selectedReturn?.return_no}`}
                        </span>
                    </div>
                }
                open={processModalVisible}
                onOk={handleExecuteProcess}
                confirmLoading={processing}
                onCancel={() => setProcessModalVisible(false)}
                okText={
                    actionType === "received"
                        ? "Receive & Credit Stock"
                        : actionType === "approved"
                        ? "Confirm Authorization"
                        : "Confirm Rejection"
                }
                okButtonProps={{
                    className:
                        actionType === "received"
                            ? "bg-emerald-600 hover:bg-emerald-500"
                            : actionType === "rejected"
                            ? "bg-rose-600 hover:bg-rose-500"
                            : "bg-indigo-600 hover:bg-indigo-500",
                }}
            >
                <div className="py-4 space-y-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-1">
                        <div>
                            <strong>Customer:</strong>{" "}
                            <span className="capitalize">
                                {selectedReturn?.customer_id?.username ||
                                    selectedReturn?.customer_user_id?.username ||
                                    selectedReturn?.order_id?.customer_id?.name ||
                                    "Customer"}
                            </span>
                            {(selectedReturn?.customer_id?.email || selectedReturn?.customer_user_id?.email) && (
                                <span className="text-slate-500 text-xs ml-2">
                                    ({selectedReturn?.customer_id?.email || selectedReturn?.customer_user_id?.email})
                                </span>
                            )}
                        </div>
                        <div>
                            <strong>Item:</strong>{" "}
                            {selectedReturn?.items?.[0]?.product_id?.product_name ||
                                selectedReturn?.product_id?.product_name ||
                                "Product"}{" "}
                            ({selectedReturn?.items?.[0]?.quantity || selectedReturn?.quantity || 1} units)
                        </div>
                        <div>
                            <strong>Reason:</strong> {selectedReturn?.reason}
                        </div>
                        {(selectedReturn?.admin_notes || selectedReturn?.notes) && (
                            <div>
                                <strong>Customer Notes:</strong> {selectedReturn?.admin_notes || selectedReturn?.notes}
                            </div>
                        )}
                    </div>

                    {actionType === "received" && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Restock into Warehouse Facility:
                            </label>
                            <Select
                                value={selectedWhId}
                                onChange={(id) => setSelectedWhId(id)}
                                className="w-full"
                                size="large"
                            >
                                {warehouses.map((w) => (
                                    <Option key={w._id} value={w._id}>
                                        {w.warehouse_name} ({w.warehouse_code}) - {w.city || "Facility"}
                                    </Option>
                                ))}
                            </Select>
                            <p className="text-xs text-emerald-600 mt-1">
                                Note: Confirming receipt will increase stock in this warehouse and create a verified Stock Ledger entry.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Resolution Notes / Customer Feedback:
                        </label>
                        <TextArea
                            rows={3}
                            placeholder="Enter notes for this return resolution..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>

            {/* Drawer: Detailed Return View */}
            <Drawer
                title={
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <RollbackOutlined className="text-indigo-600 text-lg" />
                            <span className="font-bold text-slate-800">
                                Return #{detailReturn?.return_no}
                            </span>
                        </div>
                        {detailReturn && (
                            <Tag
                                color={
                                    detailReturn.status === "received"
                                        ? "green"
                                        : detailReturn.status === "approved"
                                        ? "blue"
                                        : detailReturn.status === "rejected"
                                        ? "red"
                                        : "gold"
                                }
                            >
                                {detailReturn.status?.toUpperCase()}
                            </Tag>
                        )}
                    </div>
                }
                placement="right"
                width={560}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                extra={
                    <Button
                        icon={<PrinterOutlined />}
                        onClick={() => {
                            setPrintModalVisible(true);
                        }}
                    >
                        Print Slip
                    </Button>
                }
            >
                {detailReturn && (
                    <div className="space-y-6">
                        {/* Customer Information Card */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar
                                    size={42}
                                    className="bg-indigo-600 text-white font-bold"
                                >
                                    {(detailReturn.customer_id?.username ||
                                        detailReturn.customer_user_id?.username ||
                                        detailReturn.order_id?.customer_id?.name ||
                                        "C")[0]?.toUpperCase()}
                                </Avatar>
                                <div>
                                    <div className="font-bold text-slate-900 text-base capitalize">
                                        {detailReturn.customer_id?.username ||
                                            detailReturn.customer_user_id?.username ||
                                            detailReturn.order_id?.customer_id?.name ||
                                            "Customer"}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {detailReturn.customer_id?.email ||
                                            detailReturn.customer_user_id?.email ||
                                            detailReturn.order_id?.customer_id?.email ||
                                            "No email provided"}
                                    </div>
                                    {(detailReturn.customer_id?.phone || detailReturn.order_id?.customer_id?.phone) && (
                                        <div className="text-xs text-slate-500 font-mono">
                                            📞 {detailReturn.customer_id?.phone || detailReturn.order_id?.customer_id?.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-xs text-slate-600 border-t border-slate-200 pt-2 flex justify-between">
                                <span>Order Invoice: <strong>#{detailReturn.order_id?.invoice_no || "N/A"}</strong></span>
                                <span>Requested On: <strong>{dayjs(detailReturn.createdAt).format("DD MMM YYYY, hh:mm A")}</strong></span>
                            </div>
                        </div>

                        {/* Returned Items Section */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                                Returned Items
                            </h3>
                            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                                {(detailReturn.items || []).map((item, idx) => {
                                    const prod = item.product_id;
                                    return (
                                        <div key={idx} className="p-3 bg-white flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {prod?.product_image ? (
                                                    <img
                                                        src={prod.product_image}
                                                        alt={prod.product_name}
                                                        className="w-12 h-12 object-cover rounded-lg border border-slate-100"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xl font-bold">
                                                        📦
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-slate-800 text-sm">
                                                        {prod?.product_name || "Product"}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-mono">
                                                        SKU: {prod?.product_code || "—"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="bg-red-50 text-red-600 font-bold px-2.5 py-1 rounded-full text-xs border border-red-200">
                                                    {item.quantity} unit(s)
                                                </span>
                                                {prod?.selling_price && (
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        ₹{prod.selling_price} each
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Reason & Notes Card */}
                        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">
                                    Return Reason
                                </span>
                                <Tag color="orange" className="font-medium text-xs px-2.5 py-0.5">
                                    {detailReturn.reason}
                                </Tag>
                            </div>
                            {detailReturn.refund_info?.refund_id && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                                        💳 Automated Razorpay Refund Processed
                                    </span>
                                    <div className="flex justify-between text-xs text-emerald-950 pt-1">
                                        <span>Refund ID: <strong className="font-mono">{detailReturn.refund_info.refund_id}</strong></span>
                                        <span>Amount: <strong className="font-bold text-emerald-700">₹{(detailReturn.refund_info.refund_amount || 0).toLocaleString()}</strong></span>
                                    </div>
                                    <div className="text-[11px] text-emerald-700 pt-0.5">
                                        Status: {detailReturn.refund_info.refund_status?.toUpperCase() || "PROCESSED"} • {dayjs(detailReturn.refund_info.refunded_at).format("DD MMM YYYY, hh:mm A")}
                                    </div>
                                </div>
                            )}
                            {detailReturn.admin_notes && (
                                <div>
                                    <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">
                                        Resolution / Customer Notes
                                    </span>
                                    <p className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 m-0">
                                        {detailReturn.admin_notes}
                                    </p>
                                </div>
                            )}
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">
                                    Warehouse Facility
                                </span>
                                <div className="text-sm text-slate-800 font-medium">
                                    {detailReturn.warehouse_id?.warehouse_name
                                        ? `${detailReturn.warehouse_id.warehouse_name} (${detailReturn.warehouse_id.warehouse_code})`
                                        : "Standard Fulfillment Warehouse"}
                                </div>
                            </div>
                        </div>

                        {/* Action buttons in Drawer */}
                        {detailReturn.status === "pending" && (
                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <Button
                                    type="primary"
                                    block
                                    className="bg-indigo-600 hover:bg-indigo-500"
                                    onClick={() => {
                                        setDrawerVisible(false);
                                        handleOpenProcess(detailReturn, "approved");
                                    }}
                                >
                                    Authorize Return
                                </Button>
                                <Button
                                    danger
                                    block
                                    onClick={() => {
                                        setDrawerVisible(false);
                                        handleOpenProcess(detailReturn, "rejected");
                                    }}
                                >
                                    Reject Return
                                </Button>
                            </div>
                        )}
                        {detailReturn.status === "approved" && (
                            <div className="pt-4 border-t border-slate-200">
                                <Button
                                    type="primary"
                                    block
                                    icon={<InboxOutlined />}
                                    className="bg-emerald-600 hover:bg-emerald-500"
                                    onClick={() => {
                                        setDrawerVisible(false);
                                        handleOpenProcess(detailReturn, "received");
                                    }}
                                >
                                    Receive & Restock into Warehouse
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Drawer>

            {/* Modal: Printable Return Slip (RMA) */}
            <Modal
                title={
                    <div className="flex items-center justify-between pr-6">
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                            <PrinterOutlined className="text-indigo-600" />
                            Return Merchandise Authorization (RMA) Slip
                        </span>
                        <Button
                            type="primary"
                            icon={<PrinterOutlined />}
                            className="bg-indigo-600"
                            onClick={() => window.print()}
                        >
                            Print Now
                        </Button>
                    </div>
                }
                open={printModalVisible}
                onCancel={() => setPrintModalVisible(false)}
                footer={null}
                width={680}
            >
                <div id="printable-rma-slip" className="p-4 bg-white text-slate-800">
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 m-0 tracking-tight">
                                INVENTORYPRO WMS
                            </h2>
                            <p className="text-xs text-slate-500 m-0">
                                Official Warehouse Return & Restock Slip
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="font-mono text-base font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded border border-indigo-200">
                                #{detailReturn?.return_no}
                            </span>
                            <div className="text-xs text-slate-400 mt-1">
                                Date: {dayjs(detailReturn?.createdAt).format("DD/MM/YYYY")}
                            </div>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-4">
                        <div>
                            <span className="text-slate-400 block font-semibold uppercase">Customer</span>
                            <span className="font-bold text-slate-800 text-sm capitalize">
                                {detailReturn?.customer_id?.username ||
                                    detailReturn?.customer_user_id?.username ||
                                    detailReturn?.order_id?.customer_id?.name ||
                                    "Customer"}
                            </span>
                            <div className="text-slate-500">{detailReturn?.customer_id?.email || detailReturn?.order_id?.customer_id?.email}</div>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-semibold uppercase">Order Invoice Reference</span>
                            <span className="font-bold text-indigo-600 text-sm font-mono">
                                #{detailReturn?.order_id?.invoice_no || "N/A"}
                            </span>
                            <div className="text-slate-500">
                                Status: <strong className="uppercase">{detailReturn?.status}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Return Items Table */}
                    <table className="w-full border-collapse border border-slate-300 text-xs mb-4">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700">
                                <th className="border border-slate-300 p-2 text-left">SKU</th>
                                <th className="border border-slate-300 p-2 text-left">Item Description</th>
                                <th className="border border-slate-300 p-2 text-center">Returned Qty</th>
                                <th className="border border-slate-300 p-2 text-left">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(detailReturn?.items || []).map((it, idx) => (
                                <tr key={idx}>
                                    <td className="border border-slate-300 p-2 font-mono font-bold">
                                        {it.product_id?.product_code || "—"}
                                    </td>
                                    <td className="border border-slate-300 p-2 font-semibold">
                                        {it.product_id?.product_name || "Product"}
                                    </td>
                                    <td className="border border-slate-300 p-2 text-center font-bold">
                                        {it.quantity}
                                    </td>
                                    <td className="border border-slate-300 p-2 capitalize">
                                        {detailReturn?.reason}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Warehouse Inspection Checklist */}
                    <div className="border border-slate-200 p-3 rounded-lg text-xs mb-6">
                        <span className="font-bold text-slate-800 uppercase block mb-2">
                            Warehouse Receiving & Inspection Checklist:
                        </span>
                        <div className="grid grid-cols-3 gap-2 text-slate-600">
                            <div>[ ] Package Unopened / Intact</div>
                            <div>[ ] Item Condition Verified</div>
                            <div>[ ] Restocked into Bin Location</div>
                        </div>
                    </div>

                    {/* Signature Block */}
                    <div className="grid grid-cols-2 gap-8 pt-4 border-t border-dashed border-slate-300 text-xs text-slate-500">
                        <div>
                            <div className="h-10 border-b border-slate-400 mb-1"></div>
                            <span>Inspected & Received By (Associate Name)</span>
                        </div>
                        <div>
                            <div className="h-10 border-b border-slate-400 mb-1"></div>
                            <span>Authorized Sign-off / Date</span>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Returns;
