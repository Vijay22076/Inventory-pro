import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Row,
    Col,
    Tag,
    Divider,
    Typography,
    Button,
    Badge,
    Tooltip,
    theme,
    Progress,
} from "antd";
import {
    DollarOutlined,
    InboxOutlined,
    ShoppingCartOutlined,
    ShoppingOutlined,
    WarningOutlined,
    InfoCircleOutlined,
    BankOutlined,
    SwapOutlined,
    UsergroupAddOutlined,
    ShopOutlined,
    RollbackOutlined,
} from "@ant-design/icons";
import toast from "react-hot-toast";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import StatCard from "../components/dashboard/StatCard";
import ProductDistribution from "../components/dashboard/ProductDistribution";
import DataTable from "../components/dashboard/DataTable";
import LoadingSpinner from "../components/dashboard/LoadingSpinner";
import ErrorDisplay from "../components/dashboard/ErrorDisplay";
import { api } from "../api/api";
import SalesChart from "../components/dashboard/SalesChart";
import useAuth from "../hooks/useAuth";

const { useToken } = theme;
const { Text } = Typography;

const Dashboard = () => {
    const { token } = useToken();
    const { user, isAdmin, isManager, isCustomer } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isCustomer) {
            navigate("/customer/catalog", { replace: true });
        }
    }, [isCustomer, navigate]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        totalSales: 0,
        totalPurchase: 0,
        inventoryValue: 0,
        totalProducts: 0,
        totalStock: 0,
        outOfStockCount: 0,
        lowStockProducts: [],
        recentOrders: [],
        salesData: [],
        topProducts: [],
        warehouses: [],
    });
    const timeframe = "30days";

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);

            const [
                dashboardResponse,
                topProductsResponse,
                salesReportResponse,
                warehousesResponse,
            ] = await Promise.all([
                api.get("/reports/dashboard", { params: { timeframe } }),
                api.get("/reports/top-products", { params: { timeframe } }),
                api.get("/reports/sales", { params: { timeframe } }),
                api.get("/warehouses"),
            ]);

            if (dashboardResponse.data.success) {
                const metricsData = dashboardResponse.data.data;
                const topProductsData = topProductsResponse.data.data || [];
                const salesReportData = salesReportResponse.data.data || {};
                const warehousesData = warehousesResponse.data?.data || [];

                setDashboardData({
                    ...metricsData,
                    topProducts: topProductsData,
                    salesData: salesReportData,
                    warehouses: warehousesData,
                });

                toast.success("Data loaded successfully");
            } else {
                setError("Failed to fetch dashboard data");
                toast.error("Failed to load data");
            }
        } catch (err) {
            console.error("Dashboard data fetch error:", err);
            const errorMessage =
                err.response?.data?.message ||
                "Something went wrong while fetching dashboard data";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [timeframe]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const topProductsColumns = [
        {
            title: "Product",
            dataIndex: "product_name",
            key: "product_name",
            ellipsis: {
                showTitle: false,
            },
            render: (text) => (
                <Tooltip placement="topLeft" title={text}>
                    <span className="text-sm font-medium text-gray-800 block max-w-[150px] sm:max-w-[200px] truncate">
                        {text}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: "Units",
            dataIndex: "quantity_sold",
            key: "quantity_sold",
            width: 80,
            align: "center",
            sorter: (a, b) => a.quantity_sold - b.quantity_sold,
            render: (value) => (
                <Badge
                    count={value}
                    className="font-medium"
                    style={{
                        backgroundColor: "#1890ff",
                        fontSize: "11px",
                    }}
                />
            ),
        },
        {
            title: "Sales",
            dataIndex: "total_sales",
            key: "total_sales",
            width: 100,
            align: "right",
            render: (value) => (
                <span className="font-semibold text-green-600">
                    ${value.toLocaleString()}
                </span>
            ),
            sorter: (a, b) => a.total_sales - b.total_sales,
        },
    ];

    const lowStockColumns = [
        {
            title: "Product",
            dataIndex: "product_name",
            key: "product_name",
            ellipsis: {
                showTitle: false,
            },
            render: (text) => (
                <Tooltip placement="topLeft" title={text}>
                    <span className="text-sm font-medium text-gray-800 block max-w-[150px] sm:max-w-[200px] truncate">
                        {text}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: "Stock",
            dataIndex: "stock",
            key: "stock",
            width: 70,
            align: "center",
            render: (value) => (
                <span
                    className={`font-bold ${value === 0 ? "text-red-600" : "text-orange-600"}`}
                >
                    {value}
                </span>
            ),
        },
        {
            title: "Status",
            key: "status",
            width: 90,
            align: "center",
            render: (_, record) => (
                <Tag
                    color={record.stock === 0 ? "error" : "warning"}
                    className="text-xs font-medium"
                >
                    {record.stock === 0 ? "Out" : "Low"}
                </Tag>
            ),
        },
    ];

    const recentOrdersColumns = [
        {
            title: "Order ID",
            dataIndex: "invoice_no",
            key: "invoice_no",
            width: 100,
            render: (value) => (
                <span className="font-mono text-blue-600 font-medium">
                    #{value}
                </span>
            ),
        },
        {
            title: "Customer",
            key: "customer",
            ellipsis: {
                showTitle: false,
            },
            render: (_, record) => {
                const customerName =
                    record.customer_id?.name || "Unknown Customer";
                return (
                    <Tooltip placement="topLeft" title={customerName}>
                        <span className="text-sm font-medium text-gray-800 block max-w-[150px] sm:max-w-[200px] truncate">
                            {customerName}
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            title: "Date",
            key: "date",
            width: 100,
            responsive: ["md"],
            render: (_, record) => (
                <span className="text-sm text-gray-600">
                    {new Date(record.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            title: "Total",
            dataIndex: "total",
            key: "total",
            width: 100,
            align: "right",
            render: (value) => (
                <span className="font-semibold text-green-600">
                    ${value.toLocaleString()}
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "order_status",
            key: "order_status",
            width: 100,
            align: "center",
            render: (status) => {
                let color = "default";
                if (status === "completed") color = "success";
                if (status === "processing") color = "processing";
                if (status === "pending") color = "warning";
                if (status === "cancelled") color = "error";

                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            },
        },
    ];

    if (loading) {
        return <LoadingSpinner tip="Loading dashboard data..." />;
    }

    if (error) {
        return <ErrorDisplay error={error} onRetry={fetchDashboardData} />;
    }

    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {isAdmin && (
                    <div className="mb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-indigo-900/40">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                    Administrator Oversight
                                </span>
                                <span className="text-xs text-slate-400">All Organization Facilities</span>
                            </div>
                            <h2 className="text-xl font-extrabold mt-1 m-0 text-white">Admin Command Center</h2>
                            <p className="text-xs text-slate-300 m-0">Full permissions: Manage users, approve adjustments, oversee all warehouse stock & finances.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link to="/admin/users">
                                <Button size="middle" type="primary" icon={<UsergroupAddOutlined />} className="bg-indigo-600 hover:bg-indigo-500">
                                    Users & Roles
                                </Button>
                            </Link>
                            <Link to="/warehouses">
                                <Button size="middle" icon={<ShopOutlined />}>
                                    WMS & Approvals
                                </Button>
                            </Link>
                            <Link to="/returns">
                                <Button size="middle" icon={<RollbackOutlined />}>
                                    Returns
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {isManager && (
                    <div className="mb-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-blue-900/40">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                    Warehouse Manager
                                </span>
                                <span className="text-xs text-slate-400">{user?.assigned_warehouses?.length || 0} Assigned Facility(s)</span>
                            </div>
                            <h2 className="text-xl font-extrabold mt-1 m-0 text-white">Warehouse Operations Center</h2>
                            <p className="text-xs text-slate-300 m-0">Facility operations: Inbound receiving, dispatch, stock counts, transfers & returns.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link to="/warehouses">
                                <Button size="middle" type="primary" icon={<ShopOutlined />} className="bg-blue-600 hover:bg-blue-500">
                                    My Warehouses & Transfers
                                </Button>
                            </Link>
                            <Link to="/orders">
                                <Button size="middle" icon={<ShoppingCartOutlined />}>
                                    Fulfillment Orders
                                </Button>
                            </Link>
                            <Link to="/returns">
                                <Button size="middle" icon={<RollbackOutlined />}>
                                    Customer Returns
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                <DashboardHeader onRefresh={fetchDashboardData} />

                <section className="mt-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} lg={8}>
                                <StatCard
                                    title="Total Sales"
                                    value={dashboardData.totalSales}
                                    prefix={<ShoppingCartOutlined />}
                                    valueStyle={{ color: token.colorSuccess }}
                                    icon={
                                        <ShoppingCartOutlined className="text-2xl text-success" />
                                    }
                                    formatter={(value) =>
                                        `₹${value.toLocaleString()}`
                                    }
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <StatCard
                                    title="Total Purchases"
                                    value={dashboardData.totalPurchase}
                                    prefix={<ShoppingOutlined />}
                                    valueStyle={{ color: token.colorPrimary }}
                                    icon={
                                        <ShoppingOutlined className="text-2xl text-primary" />
                                    }
                                    formatter={(value) =>
                                        `₹${value.toLocaleString()}`
                                    }
                                />
                            </Col>
                            <Col xs={24} sm={24} lg={8}>
                                <StatCard
                                    title="Inventory Value"
                                    value={dashboardData.inventoryValue}
                                    prefix={<DollarOutlined />}
                                    valueStyle={{ color: token.colorPurple }}
                                    icon={
                                        <DollarOutlined className="text-2xl text-purple" />
                                    }
                                    formatter={(value) =>
                                        `₹${value.toLocaleString()}`
                                    }
                                    precision={2}
                                />
                            </Col>
                            <Col xs={24} sm={8}>
                                <StatCard
                                    title="Total Products"
                                    value={dashboardData.totalProducts}
                                    icon={
                                        <InboxOutlined className="text-2xl text-blue" />
                                    }
                                />
                            </Col>
                            <Col xs={24} sm={8}>
                                <StatCard
                                    title="Total Stock"
                                    value={dashboardData.totalStock}
                                    icon={
                                        <ShoppingOutlined className="text-2xl text-cyan" />
                                    }
                                />
                            </Col>
                            <Col xs={24} sm={8}>
                                <StatCard
                                    title="Out of Stock"
                                    value={dashboardData.outOfStockCount}
                                    icon={
                                        <WarningOutlined className="text-2xl" />
                                    }
                                    valueStyle={{
                                        color:
                                            dashboardData.outOfStockCount > 0
                                                ? token.colorError
                                                : token.colorSuccess,
                                    }}
                                />
                            </Col>
                        </Row>
                    </div>
                </section>

                {/* Warehouse & Facility Network */}
                <section className="mt-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 m-0 leading-tight flex items-center gap-2">
                                <BankOutlined className="text-blue-600" />
                                Warehouse & Facility Network
                            </h2>
                            <p className="text-sm text-slate-500 m-0">
                                Real-time facility storage utilization and distributed stock valuation
                            </p>
                        </div>
                        <Link to="/warehouses">
                            <Button
                                type="primary"
                                ghost
                                icon={<SwapOutlined />}
                                className="font-semibold"
                            >
                                Manage Facilities & Transfers
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {dashboardData.warehouses && dashboardData.warehouses.length > 0 ? (
                            dashboardData.warehouses.map((wh) => {
                                const capPercent =
                                    wh.capacity > 0
                                        ? Math.min(
                                              100,
                                              Math.round(
                                                  ((wh.used_capacity || 0) /
                                                      wh.capacity) *
                                                      100
                                              )
                                          )
                                        : 0;
                                return (
                                    <div
                                        key={wh._id}
                                        className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden"
                                    >
                                        {wh.is_primary && (
                                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
                                                Primary Hub
                                            </div>
                                        )}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                                                🏢
                                            </div>
                                            <div className="flex-1 pr-14">
                                                <h4 className="text-base font-bold text-slate-800 m-0 truncate">
                                                    {wh.warehouse_name}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                                        {wh.warehouse_code}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{wh.city || "Central"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 my-3">
                                            <div>
                                                <span className="text-xs text-slate-400 block font-medium">
                                                    Total SKUs
                                                </span>
                                                <span className="text-base font-bold text-slate-800">
                                                    {wh.total_skus || 0}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 block font-medium">
                                                    Stock Valuation
                                                </span>
                                                <span className="text-base font-bold text-emerald-600">
                                                    ₹{Number(wh.stock_valuation || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <div className="flex justify-between items-center text-xs mb-1">
                                                <span className="text-slate-500 font-medium">
                                                    Capacity Utilization
                                                </span>
                                                <span className="font-bold text-slate-700">
                                                    {capPercent}%
                                                </span>
                                            </div>
                                            <Progress
                                                percent={capPercent}
                                                showInfo={false}
                                                strokeColor={
                                                    capPercent > 85
                                                        ? "#ef4444"
                                                        : capPercent > 60
                                                        ? "#f59e0b"
                                                        : "#3b82f6"
                                                }
                                                size="small"
                                            />
                                            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                                                <span>
                                                    Used: {(wh.used_capacity || 0).toLocaleString()} units
                                                </span>
                                                <span>
                                                    Max: {(wh.capacity || 0).toLocaleString()} units
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-3 bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500">
                                No active facilities found.
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-8">
                    <Divider className="flex items-center gap-3 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 m-0 leading-tight">
                                Analytics & Insights
                            </h2>
                            <p className="text-sm text-slate-500 m-0">
                                Performance metrics and trends
                            </p>
                        </div>
                    </Divider>

                    <div className="space-y-6">
                        <SalesChart salesData={dashboardData.salesData} />

                        <ProductDistribution
                            topProducts={dashboardData.topProducts}
                        />

                        {dashboardData.topProducts &&
                            dashboardData.topProducts.length > 0 && (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <InfoCircleOutlined className="text-lg text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 m-0 leading-tight">
                                                Quick Insights
                                            </h3>
                                            <p className="text-sm text-slate-500 m-0">
                                                Key product highlights
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200">
                                            <div className="flex items-start justify-between mb-3">
                                                <Text className="text-emerald-700 text-xs font-bold uppercase tracking-wider block">
                                                    Top Performer
                                                </Text>
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                    🏆
                                                </div>
                                            </div>
                                            <Text className="text-base font-bold text-slate-900 block mb-2">
                                                {
                                                    dashboardData.topProducts[0]
                                                        ?.product_name
                                                }
                                            </Text>
                                            <Badge
                                                count={`${dashboardData.topProducts[0]?.quantity_sold} units sold`}
                                                style={{
                                                    backgroundColor: "#10b981",
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </div>

                                        <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                                            <div className="flex items-start justify-between mb-3">
                                                <Text className="text-blue-700 text-xs font-bold uppercase tracking-wider block">
                                                    Most Profitable
                                                </Text>
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                    💰
                                                </div>
                                            </div>
                                            <Text className="text-base font-bold text-slate-900 block mb-2">
                                                {
                                                    dashboardData.topProducts.sort(
                                                        (a, b) =>
                                                            b.total_sales -
                                                            a.total_sales
                                                    )[0]?.product_name
                                                }
                                            </Text>
                                            <Badge
                                                count={`$${dashboardData.topProducts.sort((a, b) => b.total_sales - a.total_sales)[0]?.total_sales.toLocaleString()} revenue`}
                                                style={{
                                                    backgroundColor: "#3b82f6",
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                    </div>
                </section>

                <section className="mt-8 pb-8">
                    <Divider className="flex items-center gap-3 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 m-0 leading-tight">
                                Reports & Activity
                            </h2>
                            <p className="text-sm text-slate-500 m-0">
                                Recent transactions and alerts
                            </p>
                        </div>
                    </Divider>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                                <DataTable
                                    title="Top Selling Products"
                                    columns={topProductsColumns}
                                    dataSource={dashboardData.topProducts.slice(
                                        0,
                                        5
                                    )}
                                    viewAllLink="/reports/top-products"
                                    pagination={{ pageSize: 5, size: "small" }}
                                />
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                                <DataTable
                                    title="Low Stock Alerts"
                                    columns={lowStockColumns}
                                    dataSource={dashboardData.lowStockProducts.slice(
                                        0,
                                        5
                                    )}
                                    viewAllLink="/reports/low-stock-alerts"
                                    pagination={{ pageSize: 5, size: "small" }}
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                            <DataTable
                                title="Recent Orders"
                                columns={recentOrdersColumns}
                                dataSource={dashboardData.recentOrders.slice(
                                    0,
                                    8
                                )}
                                viewAllLink="/orders"
                                pagination={{ pageSize: 8, size: "small" }}
                            />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Dashboard;
