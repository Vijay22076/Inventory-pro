import React, { useState, useEffect, useCallback } from "react";
import {
    Table,
    Card,
    Row,
    Col,
    Tag,
    Button,
    Input,
    Badge,
    Tooltip,
    Modal,
    Typography,
    Alert,
} from "antd";
import {
    AlertOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    MailOutlined,
    WarningOutlined,
    SearchOutlined,
    SendOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";
import { api } from "../../api/api";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const { Text, Title } = Typography;

const AlertAuditTab = ({ onTriggerAlert, triggering }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [lastTriggerResult, setLastTriggerResult] = useState(null);
    const [resultModalVisible, setResultModalVisible] = useState(false);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/scheduler/logs");
            if (response.data?.success) {
                setLogs(response.data.data || []);
            }
        } catch (error) {
            console.error("Failed to load alert logs:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleTriggerAlert = async (isTestSample = false) => {
        try {
            const result = await onTriggerAlert(isTestSample);
            if (result) {
                setLastTriggerResult(result);
                setResultModalVisible(true);
                fetchLogs();
            }
        } catch (err) {
            console.error("Trigger alert error:", err);
        }
    };

    const filteredLogs = logs.filter((log) => {
        if (!searchText) return true;
        const q = searchText.toLowerCase();
        const emailMatch = log.recipient_email?.toLowerCase().includes(q);
        const nameMatch = log.recipient_name?.toLowerCase().includes(q);
        const prodMatch = log.products?.some(
            (p) =>
                p.product_name?.toLowerCase().includes(q) ||
                p.product_code?.toLowerCase().includes(q)
        );
        return emailMatch || nameMatch || prodMatch;
    });

    const columns = [
        {
            title: "Date & Time",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 170,
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            render: (date) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 text-xs">
                        {dayjs(date).format("MMM DD, YYYY")}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">
                        {dayjs(date).format("hh:mm:ss A")}
                    </span>
                </div>
            ),
        },
        {
            title: "Trigger Event",
            dataIndex: "trigger_type",
            key: "trigger_type",
            width: 140,
            render: (type) => {
                switch (type) {
                    case "manual_test":
                        return (
                            <Tag color="blue" className="font-medium text-xs">
                                🧪 Manual Test
                            </Tag>
                        );
                    case "scheduled_cron":
                        return (
                            <Tag color="purple" className="font-medium text-xs">
                                ⏰ Weekly Cron
                            </Tag>
                        );
                    case "order_event":
                        return (
                            <Tag color="cyan" className="font-medium text-xs">
                                ⚡ Order Event
                            </Tag>
                        );
                    default:
                        return <Tag>{type || "System"}</Tag>;
                }
            },
        },
        {
            title: "Recipient",
            key: "recipient",
            width: 220,
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-800 truncate">
                        {record.recipient_name || "Admin"}
                    </span>
                    <span className="text-xs text-blue-600 font-mono flex items-center gap-1">
                        <MailOutlined className="text-[11px]" />
                        {record.recipient_email}
                    </span>
                </div>
            ),
        },
        {
            title: "Alerted Products",
            dataIndex: "products",
            key: "products",
            render: (products) => {
                if (!products || products.length === 0) {
                    return (
                        <span className="text-xs text-gray-400 italic">
                            No low-stock items detected
                        </span>
                    );
                }
                return (
                    <div className="flex flex-wrap gap-1.5 max-w-lg">
                        {products.map((p, idx) => (
                            <Tag
                                key={idx}
                                color={p.stock === 0 ? "error" : "warning"}
                                className="text-xs py-0.5 px-2 flex items-center gap-1 border"
                            >
                                <span className="font-medium">{p.product_name}</span>
                                <span className="font-mono font-bold bg-white/70 px-1 rounded text-[10px]">
                                    Stock: {p.stock}/{p.min_threshold || 10}
                                </span>
                            </Tag>
                        ))}
                    </div>
                );
            },
        },
        {
            title: "Delivery Status",
            dataIndex: "status",
            key: "status",
            width: 130,
            align: "center",
            render: (status, record) => {
                if (status === "sent") {
                    return (
                        <Tooltip title={`Message ID: ${record.message_id || "OK"}`}>
                            <Tag
                                color="success"
                                icon={<CheckCircleOutlined />}
                                className="font-semibold text-xs px-2.5 py-0.5"
                            >
                                Delivered
                            </Tag>
                        </Tooltip>
                    );
                }
                if (status === "no_low_stock") {
                    return (
                        <Tag color="default" className="text-xs px-2 py-0.5">
                            Stock Normal
                        </Tag>
                    );
                }
                return (
                    <Tooltip title={record.error || "Delivery failed"}>
                        <Tag
                            color="error"
                            icon={<WarningOutlined />}
                            className="font-semibold text-xs px-2 py-0.5"
                        >
                            Failed
                        </Tag>
                    </Tooltip>
                );
            },
        },
    ];

    return (
        <div className="space-y-5">
            {/* Quick KPI Overview */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-xs border border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/40 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                                    Alert Delivery
                                </span>
                                <h3 className="text-2xl font-extrabold text-slate-900 mt-1 mb-0">
                                    {logs.filter((l) => l.status === "sent").length} Sent
                                </h3>
                                <span className="text-[11px] text-slate-500">
                                    Total verified email alerts
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md">
                                <SendOutlined className="text-lg" />
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-xs border border-amber-100 bg-gradient-to-br from-amber-50/50 to-orange-50/40 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                                    Low Stock Trigger
                                </span>
                                <h3 className="text-2xl font-extrabold text-amber-800 mt-1 mb-0">
                                    Threshold ≤ 10
                                </h3>
                                <span className="text-[11px] text-slate-500">
                                    Auto alert when units dip
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                                <WarningOutlined className="text-lg" />
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-xs border border-purple-100 bg-gradient-to-br from-purple-50/50 to-indigo-50/40 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">
                                    Automated Cron
                                </span>
                                <h3 className="text-2xl font-extrabold text-purple-900 mt-1 mb-0">
                                    Every Monday
                                </h3>
                                <span className="text-[11px] text-slate-500">
                                    9:00 AM IST Automated Scan
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                                <ClockCircleOutlined className="text-lg" />
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-xs border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/40 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                                    SMTP Channel
                                </span>
                                <h3 className="text-2xl font-extrabold text-emerald-800 mt-1 mb-0">
                                    Verified
                                </h3>
                                <span className="text-[11px] text-slate-500 truncate block max-w-[150px]">
                                    Gmail SSL: port 465
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                                <SafetyCertificateOutlined className="text-lg" />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Action Bar & Log Filters */}
            <Card className="shadow-sm border border-slate-200/80 rounded-xl">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex-1 max-w-md">
                        <Input
                            placeholder="Search by recipient, SKU, or product..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            size="large"
                            className="rounded-lg"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchLogs}
                            loading={loading}
                            size="large"
                            className="rounded-lg"
                        >
                            Refresh Logs
                        </Button>
                        <Button
                            type="primary"
                            icon={<AlertOutlined />}
                            onClick={() => handleTriggerAlert(false)}
                            loading={triggering}
                            size="large"
                            className="bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold shadow-sm flex items-center"
                        >
                            Trigger Live Alert
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Audit Logs Table */}
            <Card
                className="shadow-sm border border-slate-200/80 rounded-xl overflow-hidden"
                title={
                    <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-4 bg-indigo-600 rounded-full inline-block"></span>
                            <span className="font-bold text-gray-800 text-base">
                                Alert Transmission & Dispatch Audit History
                            </span>
                            <Badge
                                count={filteredLogs.length}
                                style={{ backgroundColor: "#4f46e5" }}
                            />
                        </div>
                        <span className="text-xs text-gray-500 font-normal">
                            Real-time records saved for administrative review
                        </span>
                    </div>
                }
            >
                <Table
                    columns={columns}
                    dataSource={filteredLogs}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        pageSize: 8,
                        showSizeChanger: true,
                        pageSizeOptions: ["8", "15", "30"],
                        showTotal: (total) => `Total ${total} alert records`,
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* Confirmation & Details Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 text-indigo-700">
                        <CheckCircleOutlined className="text-xl text-emerald-500" />
                        <span className="font-bold text-lg">
                            Alert Dispatched Successfully
                        </span>
                    </div>
                }
                open={resultModalVisible}
                onOk={() => setResultModalVisible(false)}
                onCancel={() => setResultModalVisible(false)}
                footer={[
                    <Button
                        key="close"
                        type="primary"
                        onClick={() => setResultModalVisible(false)}
                        className="bg-indigo-600 font-semibold px-6"
                    >
                        OK
                    </Button>,
                ]}
            >
                {lastTriggerResult && (
                    <div className="py-2 space-y-4">
                        <Alert
                            message="Email Alert Sent to Admin"
                            description={`Dispatched to ${
                                lastTriggerResult.details?.[0]?.email || "registered email"
                            } via SMTP`}
                            type="success"
                            showIcon
                        />

                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
                                Products Included in Notification:
                            </span>
                            <div className="space-y-2">
                                {lastTriggerResult.details?.[0]?.products?.map(
                                    (prod, i) => (
                                        <div
                                            key={i}
                                            className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                                        >
                                            <div>
                                                <span className="font-bold text-slate-800 block">
                                                    {prod.product_name}
                                                </span>
                                                <span className="text-slate-500 font-mono">
                                                    {prod.product_code} • {prod.category_name}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <Tag
                                                    color={
                                                        prod.stock === 0 ? "error" : "warning"
                                                    }
                                                    className="font-bold font-mono"
                                                >
                                                    {prod.stock === 0
                                                        ? "OUT OF STOCK"
                                                        : `STOCK: ${prod.stock} / ${prod.min_threshold}`}
                                                </Tag>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {lastTriggerResult.details?.[0]?.messageId && (
                            <div className="p-2.5 bg-slate-100 rounded-md text-[11px] text-slate-600 font-mono truncate">
                                SMTP MessageId: {lastTriggerResult.details[0].messageId}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AlertAuditTab;

