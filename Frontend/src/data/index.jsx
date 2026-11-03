import {
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
    CreditCardOutlined,
    CarOutlined,
    BellOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

export const navLinks = [
    { name: "Portals", path: "ecosystem" },
    { name: "Features", path: "features" },
    { name: "Multi-Warehouse", path: "warehouses" },
    { name: "How It Works", path: "process" },
];

export const features = [
    {
        icon: <ShopOutlined />,
        title: "Multi-Warehouse Logistics",
        description:
            "Manage central and regional fulfillment hubs, bin locations, and audited inter-warehouse stock transfer state machines.",
    },
    {
        icon: <ShoppingCartOutlined />,
        title: "Customer Storefront & Cart",
        description:
            "Dedicated consumer-facing product catalog with multi-item shopping cart drawer, live stock indicators, and real-time GST computation.",
    },
    {
        icon: <CreditCardOutlined />,
        title: "Razorpay Online Payments",
        description:
            "Instant payments via UPI (GPay, PhonePe, Paytm), dynamic QR codes, and cards with SHA256 cryptographic HMAC verification.",
    },
    {
        icon: <CarOutlined />,
        title: "Visual Order Tracking Stepper",
        description:
            "Transparent 4-step delivery progress timeline (Placed → Verified Payment → Dispatched → Delivered) in the customer order modal.",
    },
    {
        icon: <RollbackOutlined />,
        title: "Automated Razorpay Refund API",
        description:
            "When administrators approve return requests, Razorpay refund API automatically returns funds directly to the customer's UPI/Card.",
    },
    {
        icon: <BellOutlined />,
        title: "Instant Low-Stock Email Alerts",
        description:
            "Automated stock monitoring triggers instant HTML alert emails to warehouse managers the moment an order drops stock below minimum threshold.",
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
        title: "Supplier Procurement & Bin Stocking",
        description:
            "Create purchase orders, receive verified vendor stock, and auto-allocate inventory into designated regional warehouse bins.",
    },
    {
        number: "2",
        title: "Multi-Warehouse Balancing",
        description:
            "Transfer stock seamlessly between central distribution hubs and regional centers with strict dispatch and receipt verification.",
    },
    {
        number: "3",
        title: "Consumer Storefront & Cart Checkout",
        description:
            "Buyers browse live inventory, add multiple products to their cart drawer, and pay instantly via Razorpay UPI / Cards or COD.",
    },
    {
        number: "4",
        title: "Live Stepper Tracking & Automated Refunds",
        description:
            "Stream on-the-fly branded A4 GST invoices, track real-time delivery milestones, and process instant refunds on approved returns.",
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
