// components/layout/MobileMenu.jsx
import React, { useContext } from "react";
import { Menu, Avatar } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import AuthContext from "../../context/AuthContext";
import { getMenuItemsByRole } from "../../data";

const MobileMenu = ({ collapsed, currentPage }) => {
    const { user, logout } = useContext(AuthContext);
    const role = user?.role || "customer";
    const roleMenuItems = getMenuItemsByRole(role);

    return (
        <div
            className="md:hidden fixed top-16 left-0 right-0 transition-all duration-300 ease-in-out"
            style={{
                maxHeight: !collapsed ? "calc(100vh - 4rem)" : "0",
                opacity: !collapsed ? 1 : 0,
                pointerEvents: !collapsed ? "auto" : "none",
                zIndex: 999,
            }}
        >
            <div className="h-full bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 shadow-2xl border-b border-indigo-900/20">
                <div className="px-4 py-3 h-full flex flex-col">
                    <div className="flex-1 bg-gray-800/40 backdrop-blur-md rounded-xl overflow-hidden border border-gray-700/40 shadow-inner">
                        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-600/80 scrollbar-track-gray-800/20 hover:scrollbar-thumb-indigo-500">
                            <Menu
                                theme="dark"
                                selectedKeys={[currentPage]}
                                mode="inline"
                                items={roleMenuItems}
                                className="border-r-0"
                                style={{
                                    background: "transparent",
                                    padding: "0.5rem",
                                }}
                            />
                        </div>
                    </div>

                    {user && (
                        <div className="mt-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar size={32} icon={<UserOutlined />} src={user?.avatar} />
                                <div>
                                    <div className="text-xs font-semibold text-white">{user?.username}</div>
                                    <span
                                        className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
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
                            <button
                                onClick={logout}
                                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
                            >
                                <LogoutOutlined /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;

