// components/layout/DashboardSidebar.jsx
import React, { useContext } from "react";
import { Layout, Menu, Avatar } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { getMenuItemsByRole } from "../../data";

const { Sider } = Layout;

const DashboardSidebar = ({ collapsed, setCollapsed, currentPage }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const role = user?.role || "customer";
    const roleMenuItems = getMenuItemsByRole(role);

    const handleLogoClick = () => {
        if (role === "customer") {
            navigate("/customer/catalog");
        } else {
            navigate("/dashboard");
        }
    };

    return (
        <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            trigger={null}
            theme="dark"
            width={260}
            className="hidden md:block"
            style={{
                overflowY: "auto",
                height: "100vh",
                position: "sticky",
                top: 0,
                left: 0,
                zIndex: 1000,
                background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
            }}
        >
            <SidebarLogo collapsed={collapsed} onClick={handleLogoClick} />
            <div className="mx-4 mb-4 h-px bg-slate-700/50"></div>

            <div className="px-3">
                <Menu
                    theme="dark"
                    defaultSelectedKeys={[currentPage]}
                    mode="inline"
                    items={roleMenuItems.map((item) => ({
                        ...item,
                    }))}
                    className="border-r-0"
                    style={{
                        background: "transparent",
                    }}
                />
            </div>

            {!collapsed && <SidebarUserProfile user={user} logout={logout} />}
        </Sider>
    );
};

const SidebarLogo = ({ collapsed, onClick }) => (
    <div
        className="flex items-center justify-center px-4 py-6 cursor-pointer group transition-all duration-200"
        onClick={onClick}
    >
        {collapsed ? (
            <img
                src="/IconOnly_Transparent_NoBuffer.png"
                alt="InventoryPro Logo"
                className="h-10 w-auto transition-transform duration-200 group-hover:scale-105 drop-shadow-lg"
            />
        ) : (
            <img
                src="/FullLogo_Transparent_NoBuffer.png"
                alt="InventoryPro Logo"
                className="h-20 w-auto transition-transform duration-200 group-hover:scale-105 drop-shadow-lg"
            />
        )}
    </div>
);

const SidebarUserProfile = ({ user, logout }) => (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900/80 to-transparent">
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
                <Avatar
                    src={user?.avatar}
                    style={{
                        background:
                            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        border: "2px solid rgba(148, 163, 184, 0.3)",
                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                    }}
                    icon={<UserOutlined />}
                    size={40}
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate m-0">
                        {user?.username || "User"}
                    </p>
                    <div className="mt-1">
                        <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                user?.role === "admin"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                    : user?.role === "manager"
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            }`}
                        >
                            {user?.role || "customer"}
                        </span>
                    </div>
                </div>
            </div>
            <button
                onClick={logout}
                className="w-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-100 font-medium py-2 px-3 rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-2 border border-slate-600/50 hover:border-slate-500/50 backdrop-blur-sm"
            >
                <LogoutOutlined className="text-base" />
                <span>Logout</span>
            </button>
        </div>
    </div>
);

export default DashboardSidebar;
