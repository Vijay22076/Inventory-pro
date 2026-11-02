import {
    DatabaseOutlined,
    TeamOutlined,
    BarChartOutlined,
    DashboardOutlined,
    AppstoreOutlined,
    ShoppingCartOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    UndoOutlined,
    ShopOutlined,
    UsergroupAddOutlined,
    RollbackOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

export const navLinks = [
    { name: "Features", path: "features" },
    { name: "Process", path: "process" },
    { name: "Testimonials", path: "testimonials" },
];

export const features = [
    {
        icon: <DatabaseOutlined />,
        title: "Inventory Tracking",
        description:
            "Real-time tracking of your inventory with automated updates and alerts.",
    },
    {
        icon: <BarChartOutlined />,
        title: "Advanced Analytics",
        description:
            "Gain insights with powerful reporting and visualization tools.",
    },
    {
        icon: <TeamOutlined />,
        title: "Team Collaboration",
        description:
            "Multiple user access with customizable permissions and roles.",
    },
];

export const testimonials = [
    {
        name: "Sarah Johnson",
        company: "Retail Solutions Inc.",
        content: `This inventory system has transformed how we track our products. We've reduced stockouts by 45% and improved order accuracy significantly.`,
        rating: 5,
    },
    {
        name: "Michael Chen",
        company: "Tech Distributors",
        content: `The analytics features have given us insights we never had before. We can now forecast inventory needs with impressive accuracy.`,
        rating: 5,
    },
    {
        name: "Jessica Martinez",
        company: "Global Logistics",
        content: `Implementation was smoother than expected, and the support team was there every step of the way. Highly recommend!`,
        rating: 4,
    },
];

export const steps = [
    {
        number: "1",
        title: "Sign Up for an Account",
        description:
            "Create your account in minutes and set up your inventory profiles.",
    },
    {
        number: "2",
        title: "Import Your Inventory",
        description:
            "Easily import your existing inventory data or start fresh.",
    },
    {
        number: "3",
        title: "Start Managing Efficiently",
        description:
            "Track, analyze, and optimize your inventory in real-time.",
    },
];

export const getMenuItemsByRole = (role) => {
    if (role === "customer") {
        return [
            {
                key: "customer-catalog",
                icon: <AppstoreOutlined />,
                label: <Link to="/customer/catalog">Product Catalog</Link>,
            },
            {
                key: "customer-orders",
                icon: <ShoppingCartOutlined />,
                label: <Link to="/customer/orders">My Orders</Link>,
            },
            {
                key: "customer-returns",
                icon: <RollbackOutlined />,
                label: <Link to="/customer/returns">Return Requests</Link>,
            },
            {
                key: "customer-profile",
                icon: <UserOutlined />,
                label: <Link to="/customer/profile">My Profile & Addresses</Link>,
            },
        ];
    }

    if (role === "manager") {
        return [
            {
                key: "dashboard",
                icon: <DashboardOutlined />,
                label: <Link to="/dashboard">Dashboard</Link>,
            },
            {
                key: "warehouses",
                icon: <ShopOutlined />,
                label: <Link to="/warehouses">Assigned Warehouses</Link>,
            },
            {
                key: "products",
                icon: <AppstoreOutlined />,
                label: <Link to="/products">Inventory & Products</Link>,
            },
            {
                key: "orders",
                icon: <ShoppingCartOutlined />,
                label: <Link to="/orders">Order Fulfillment</Link>,
            },
            {
                key: "returns",
                icon: <RollbackOutlined />,
                label: <Link to="/returns">Customer Returns</Link>,
            },
            {
                key: "reports",
                icon: <BarChartOutlined />,
                label: <Link to="/reports">Warehouse Reports</Link>,
            },
        ];
    }

    // Default: Admin (Full organization oversight)
    return [
        {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: <Link to="/dashboard">Dashboard</Link>,
        },
        {
            key: "admin-users",
            icon: <UsergroupAddOutlined />,
            label: <Link to="/admin/users">Users & Roles</Link>,
        },
        {
            key: "warehouses",
            icon: <ShopOutlined />,
            label: <Link to="/warehouses">All Warehouses (WMS)</Link>,
        },
        {
            key: "products",
            icon: <AppstoreOutlined />,
            label: <Link to="/products">Products</Link>,
        },
        {
            key: "orders",
            icon: <ShoppingCartOutlined />,
            label: <Link to="/orders">Orders</Link>,
        },
        {
            key: "returns",
            icon: <RollbackOutlined />,
            label: <Link to="/returns">Returns Management</Link>,
        },
        {
            key: "customers",
            icon: <TeamOutlined />,
            label: <Link to="/customers">Customers</Link>,
        },
        {
            key: "categories",
            icon: <AppstoreOutlined />,
            label: <Link to="/categories">Categories & Units</Link>,
        },
        {
            key: "reports",
            icon: <BarChartOutlined />,
            label: <Link to="/reports">Reports & Audit</Link>,
        },
        {
            key: "customer-store-preview",
            icon: <ShopOutlined />,
            label: <Link to="/customer/catalog">Customer Storefront</Link>,
        },
    ];
};

export const menuItems = getMenuItemsByRole("admin");

export const getStatusIcon = (status) => {
    const icons = {
        pending: <ClockCircleOutlined />,
        processing: <ClockCircleOutlined />,
        completed: <CheckCircleOutlined />,
        cancelled: <ClockCircleOutlined />,
    };
    return icons[status];
};

export const getStatusIconPurchase = (status) => {
    switch (status) {
        case "pending":
            return <ClockCircleOutlined />;
        case "completed":
            return <CheckCircleOutlined />;
        case "returned":
            return <UndoOutlined />;
        default:
            return null;
    }
};
