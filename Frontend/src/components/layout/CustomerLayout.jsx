import React, { useState, useContext } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Button, Drawer, Tag, Badge, Tooltip } from "antd";
import {
    ShopOutlined,
    ShoppingCartOutlined,
    RollbackOutlined,
    UserOutlined,
    LogoutOutlined,
    MenuOutlined,
    DashboardOutlined,
    SafetyCertificateOutlined,
    ThunderboltOutlined,
    FileTextOutlined,
    RightOutlined,
} from "@ant-design/icons";
import AuthContext from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import CartDrawer from "../cart/CartDrawer";

const CustomerLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const { totalItems, subTotal, openCart } = useCart();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    const isStaff = user?.role === "admin" || user?.role === "manager";

    const navLinks = [
        {
            to: "/customer/catalog",
            label: "Product Catalog",
            subtitle: "Browse live regional stock",
            icon: <ShopOutlined className="text-lg" />,
            color: "indigo",
            iconBg: "bg-indigo-100 text-indigo-600",
            activeClass: "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs",
        },
        {
            to: "/customer/orders",
            label: "My Orders & Invoices",
            subtitle: "Track shipments & tax bills",
            icon: <ShoppingCartOutlined className="text-lg" />,
            color: "emerald",
            iconBg: "bg-emerald-100 text-emerald-600",
            activeClass: "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs",
        },
        {
            to: "/customer/returns",
            label: "Return Requests",
            subtitle: "Easy 7-day returns & refunds",
            icon: <RollbackOutlined className="text-lg" />,
            color: "amber",
            iconBg: "bg-amber-100 text-amber-600",
            activeClass: "bg-amber-50 border-amber-200 text-amber-700 shadow-xs",
        },
        {
            to: "/customer/profile",
            label: "My Profile & Addresses",
            subtitle: "Saved delivery locations",
            icon: <UserOutlined className="text-lg" />,
            color: "purple",
            iconBg: "bg-purple-100 text-purple-600",
            activeClass: "bg-purple-50 border-purple-200 text-purple-700 shadow-xs",
        },
    ];

    const currentNav = navLinks.find((l) => location.pathname.startsWith(l.to)) || navLinks[0];

    const renderNavItems = (onItemClick) => (
        <div className="space-y-2 py-2">
            {navLinks.map((link) => {
                const isActive = location.pathname.startsWith(link.to);
                return (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={onItemClick}
                        className={`group flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
                            isActive
                                ? link.activeClass
                                : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200/80 text-slate-700"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                                    isActive
                                        ? link.iconBg
                                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-700"
                                }`}
                            >
                                {link.icon}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className={`text-sm font-bold ${isActive ? "text-slate-900" : "text-slate-700"}`}>
                                    {link.label}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                    {link.subtitle}
                                </span>
                            </div>
                        </div>

                        <RightOutlined
                            className={`text-xs transition-transform ${
                                isActive
                                    ? "text-indigo-600 translate-x-0.5"
                                    : "text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                            }`}
                        />
                    </NavLink>
                );
            })}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/80 flex font-sans">
            {/* Desktop Left-Side Customer Navigation Bar (Clean Light Modern Store Theme) */}
            <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200/80 shadow-xs h-screen sticky top-0 z-30 justify-between">
                <div>
                    {/* Storefront Logo & Header */}
                    <div className="p-5 border-b border-slate-100">
                        <Link
                            to="/customer/catalog"
                            className="flex items-center gap-3 group transition-transform active:scale-95"
                        >
                            <img
                                src="/IconOnly_Transparent_NoBuffer.png"
                                alt="InventoryPro Logo"
                                className="h-10 w-auto drop-shadow-sm transition-transform group-hover:scale-105"
                            />
                            <div className="flex flex-col text-left">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xl font-black tracking-tight text-slate-900">
                                        Inventory<span className="text-indigo-600">Pro</span>
                                    </span>
                                </div>
                                <span className="text-[10px] tracking-wider uppercase font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block w-fit mt-0.5 border border-indigo-100">
                                    Customer Storefront
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Regional Stock Badge */}
                    <div className="px-5 pt-4">
                        <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-xl p-2.5 flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-semibold text-emerald-800">
                                Direct Warehouse Fulfillment
                            </span>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="px-4 py-3">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 mb-2">
                            Store Navigation
                        </p>
                        {renderNavItems()}
                    </div>
                </div>

                {/* Left Sidebar Footer: Cart, Trust Box & User Profile */}
                <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
                    {/* Active Cart Quick Launch Button */}
                    <button
                        onClick={openCart}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold flex items-center justify-between px-3.5 shadow-sm transition-all duration-200 cursor-pointer active:scale-98"
                    >
                        <div className="flex items-center gap-2">
                            <ShoppingCartOutlined className="text-lg" />
                            <span className="text-sm">My Cart</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-white/20 text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
                                {totalItems}
                            </span>
                            <span className="text-xs font-semibold text-indigo-100">
                                ₹{subTotal.toLocaleString()}
                            </span>
                        </div>
                    </button>

                    {/* Buyer Trust Strip */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200/60 shadow-2xs space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                            <SafetyCertificateOutlined className="text-emerald-500 text-sm" />
                            <span>100% Razorpay Secured</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <FileTextOutlined className="text-sky-500" />
                            <span>Automated GST Tax Invoicing</span>
                        </div>
                    </div>

                    {/* Admin Switch Mode (if staff account) */}
                    {isStaff && (
                        <Button
                            block
                            type="dashed"
                            onClick={() => navigate("/dashboard")}
                            icon={<DashboardOutlined />}
                            className="h-10 rounded-xl border-indigo-300 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100/70 font-semibold flex items-center justify-center gap-2"
                        >
                            Switch to Admin ERP
                        </Button>
                    )}

                    {/* Customer Profile Card */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                                src={user?.avatar}
                                icon={<UserOutlined />}
                                size={38}
                                className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold ring-2 ring-indigo-100 shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate m-0">
                                    {user?.username || "Customer"}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate m-0">
                                    {user?.email || ""}
                                </p>
                                <Tag color="cyan" className="text-[9px] uppercase font-bold m-0 px-1 py-0 mt-0.5">
                                    {user?.role || "customer"}
                                </Tag>
                            </div>
                        </div>

                        <Tooltip title="Sign Out">
                            <button
                                onClick={logout}
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                aria-label="Logout"
                            >
                                <LogoutOutlined className="text-base" />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </aside>

            {/* Main Area: Top Bar + Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Store Top Bar */}
                <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
                    {/* Mobile Logo & Drawer Toggle */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileDrawerOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            aria-label="Open sidebar menu"
                        >
                            <MenuOutlined className="text-xl" />
                        </button>

                        <div className="flex items-center gap-2 lg:hidden">
                            <img
                                src="/IconOnly_Transparent_NoBuffer.png"
                                alt="Logo"
                                className="h-8 w-auto"
                            />
                            <span className="font-extrabold text-slate-900 text-base">
                                Inventory<span className="text-indigo-600">Pro</span>
                            </span>
                        </div>

                        <div className="hidden lg:flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-500">
                                Active Section:
                            </span>
                            <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                                {currentNav.label}
                            </span>
                        </div>
                    </div>

                    {/* Right-Side Reassurance and Controls */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-600">
                            <span className="flex items-center gap-1.5 text-emerald-600">
                                <ThunderboltOutlined /> Next-Day Fulfillment
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1.5 text-indigo-600">
                                <SafetyCertificateOutlined /> Razorpay Verified
                            </span>
                        </div>

                        {/* Top Header Cart Button */}
                        <Button
                            type="primary"
                            onClick={openCart}
                            className="bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl h-10 px-3.5 flex items-center gap-2 shadow-xs"
                        >
                            <Badge count={totalItems} size="small" offset={[4, -4]}>
                                <ShoppingCartOutlined className="text-white text-base" />
                            </Badge>
                            <span className="hidden sm:inline text-white">Cart</span>
                            {totalItems > 0 && (
                                <span className="text-indigo-200 text-xs hidden md:inline font-mono">
                                    ₹{subTotal.toLocaleString()}
                                </span>
                            )}
                        </Button>

                        {isStaff && (
                            <Link
                                to="/dashboard"
                                className="hidden sm:inline-flex bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-semibold text-xs items-center gap-1.5 transition-all shadow-xs"
                            >
                                <DashboardOutlined /> Admin ERP
                            </Link>
                        )}

                        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                            <Avatar
                                src={user?.avatar}
                                icon={<UserOutlined />}
                                size={34}
                                className="bg-indigo-600 text-white font-semibold ring-2 ring-indigo-50"
                            />
                            <div className="hidden md:flex flex-col text-left">
                                <span className="text-xs font-bold text-slate-800 leading-tight">
                                    {user?.username || "Customer"}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    Buyer Portal
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Mobile Drawer Navigation (Side sheet for mobile screens) */}
                <Drawer
                    title={
                        <div className="flex items-center gap-2">
                            <img
                                src="/IconOnly_Transparent_NoBuffer.png"
                                alt="Logo"
                                className="h-7 w-auto"
                            />
                            <span className="font-bold text-slate-900">Customer Storefront</span>
                        </div>
                    }
                    placement="left"
                    onClose={() => setMobileDrawerOpen(false)}
                    open={mobileDrawerOpen}
                    width={300}
                >
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                                <p className="font-bold text-slate-900 text-sm m-0">
                                    {user?.username}
                                </p>
                                <p className="text-xs text-slate-500 m-0 truncate">
                                    {user?.email}
                                </p>
                                <Tag color="cyan" className="mt-2 text-[10px] font-bold uppercase">
                                    {user?.role || "customer"}
                                </Tag>
                            </div>

                            {renderNavItems(() => setMobileDrawerOpen(false))}

                            {isStaff && (
                                <div className="pt-3 border-t border-slate-100 mt-4">
                                    <Link
                                        to="/dashboard"
                                        onClick={() => setMobileDrawerOpen(false)}
                                        className="flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 transition-colors"
                                    >
                                        <DashboardOutlined />
                                        <span>Switch to Admin ERP</span>
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <Button
                                danger
                                block
                                icon={<LogoutOutlined />}
                                onClick={() => {
                                    setMobileDrawerOpen(false);
                                    logout();
                                }}
                                className="rounded-xl h-10 font-semibold"
                            >
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </Drawer>

                {/* Customer Body Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    <Outlet />
                </main>

                {/* Customer Storefront Footer */}
                <footer className="bg-white border-t border-slate-200 mt-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">InventoryPro Storefront</span>
                            <span>•</span>
                            <span>Direct Regional Fulfillment</span>
                            <span>•</span>
                            <span>Razorpay Secured</span>
                        </div>
                        <p className="m-0 text-slate-400">
                            © {new Date().getFullYear()} InventoryPro. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>

            {/* Global Slide-Out Cart Drawer */}
            <CartDrawer />
        </div>
    );
};

export default CustomerLayout;
