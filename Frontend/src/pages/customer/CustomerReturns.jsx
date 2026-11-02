import React, { useState, useEffect, useCallback } from "react";
import {
    Card,
    Table,
    Tag,
    Row,
    Col,
    Statistic,
    Button,
} from "antd";
import {
    RollbackOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ShoppingCartOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { api } from "../../api/api";

const CustomerReturns = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchMyReturns = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/returns/my-returns");
            if (response.data.success) {
                setReturns(response.data.data || []);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load returns");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyReturns();
    }, [fetchMyReturns]);

    const totalReturns = returns.length;
    const pendingReturns = returns.filter((r) => r.status === "pending").length;
    const approvedReturns = returns.filter((r) => r.status === "approved").length;
    const receivedReturns = returns.filter((r) => r.status === "received").length;

    const columns = [
        {
            title: "Return #",
            dataIndex: "return_no",
            key: "return_no",
            render: (text) => <span className="font-mono font-bold text-slate-800">{text}</span>,
        },
        {
            title: "Order Reference",
            key: "order",
            render: (_, r) => (
                <span className="font-mono text-indigo-600 font-semibold">
                    #{r.order_id?.invoice_no || "N/A"}
                </span>
            ),
        },
        {
            title: "Item Returned",
            key: "product",
            render: (_, r) => {
                const firstItem = r.items?.[0];
                const product = firstItem?.product_id || r.product_id;
                const productName = product?.product_name || product?.name || "Product";
                const productCode = product?.product_code || product?.code || "";
                const extraItems = (r.items?.length || 0) > 1 ? r.items.length - 1 : 0;

                return (
                    <div>
                        <span className="font-semibold text-slate-800">
                            {productName}
                        </span>
                        {productCode && (
                            <span className="text-xs text-slate-400 font-mono ml-2">
                                {productCode}
                            </span>
                        )}
                        {extraItems > 0 && (
                            <span className="text-xs text-indigo-600 font-medium ml-2">
                                (+{extraItems} more)
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Qty",
            key: "quantity",
            render: (_, r) => {
                const qty = r.items?.[0]?.quantity !== undefined ? r.items[0].quantity : r.quantity !== undefined ? r.quantity : 1;
                return <span className="font-bold text-slate-700">{qty} unit(s)</span>;
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
                    size_fit_issue: { color: "cyan", label: "Size/Fit Discrepancy" },
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
            render: (st, r) => {
                const map = {
                    pending: { color: "gold", icon: <ClockCircleOutlined />, label: "Under Review" },
                    approved: { color: "blue", icon: <SyncOutlined spin />, label: "Return Authorized" },
                    received: { color: "green", icon: <CheckCircleOutlined />, label: "Received & Restocked" },
                    rejected: { color: "red", icon: <CloseCircleOutlined />, label: "Request Rejected" },
                };
                const conf = map[st] || { color: "default", label: st };
                return (
                    <div>
                        <Tag color={conf.color} icon={conf.icon}>
                            {conf.label}
                        </Tag>
                        {r.refund_info?.refund_id && (
                            <div className="mt-1">
                                <Tag color="cyan" className="font-mono text-xs">
                                    💳 Refund: {r.refund_info.refund_id.slice(-8)} (₹{(r.refund_info.refund_amount || 0).toLocaleString()})
                                </Tag>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Resolution / Feedback",
            dataIndex: "resolution_notes",
            key: "resolution_notes",
            render: (notes) => (
                <span className="text-xs text-slate-600 italic">
                    {notes || "Awaiting review from warehouse operations"}
                </span>
            ),
        },
        {
            title: "Date",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (d) => dayjs(d).format("DD MMM YYYY, HH:mm"),
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 m-0 flex items-center gap-2">
                        <RollbackOutlined className="text-amber-600" />
                        My Return Requests
                    </h1>
                    <p className="text-slate-500 text-sm m-0">
                        Check the real-time status of product returns, warehouse receipt, and replacement updates.
                    </p>
                </div>
                <Link to="/customer/orders">
                    <Button
                        type="primary"
                        icon={<ShoppingCartOutlined />}
                        className="bg-indigo-600 hover:bg-indigo-500"
                    >
                        View Orders to Return
                    </Button>
                </Link>
            </div>

            {/* KPI Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-amber-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Total Requests</span>}
                            value={totalReturns}
                            prefix={<RollbackOutlined className="mr-2 text-amber-500" />}
                            valueStyle={{ fontWeight: "700", color: "#78350f" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-yellow-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Under Review</span>}
                            value={pendingReturns}
                            prefix={<ClockCircleOutlined className="mr-2 text-yellow-500" />}
                            valueStyle={{ fontWeight: "700", color: "#854d0e" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-blue-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Return Authorized</span>}
                            value={approvedReturns}
                            prefix={<SyncOutlined className="mr-2 text-blue-500" />}
                            valueStyle={{ fontWeight: "700", color: "#1e3a8a" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-emerald-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Processed & Restocked</span>}
                            value={receivedReturns}
                            prefix={<CheckCircleOutlined className="mr-2 text-emerald-500" />}
                            valueStyle={{ fontWeight: "700", color: "#064e3b" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table */}
            <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={returns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default CustomerReturns;
