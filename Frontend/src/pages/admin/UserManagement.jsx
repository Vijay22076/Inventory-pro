import React, { useState, useEffect, useCallback } from "react";
import {
    Card,
    Table,
    Button,
    Tag,
    Modal,
    Select,
    Input,
    Row,
    Col,
    Statistic,
    Space,
    Avatar,
    Tooltip,
} from "antd";
import {
    UsergroupAddOutlined,
    SafetyCertificateOutlined,
    ShopOutlined,
    UserOutlined,
    SearchOutlined,
    EditOutlined,
} from "@ant-design/icons";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { api } from "../../api/api";
import useAuth from "../../hooks/useAuth";

const { Option } = Select;

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    // Role modal
    const [roleModalVisible, setRoleModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState("customer");
    const [updatingRole, setUpdatingRole] = useState(false);

    // Warehouse assignment modal
    const [whModalVisible, setWhModalVisible] = useState(false);
    const [selectedWhUser, setSelectedWhUser] = useState(null);
    const [assignedWhIds, setAssignedWhIds] = useState([]);
    const [assigningWh, setAssigningWh] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/users/admin/all");
            if (response.data.success) {
                const list = response.data.data?.users || response.data.data || [];
                setUsers(Array.isArray(list) ? list : []);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load users");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchWarehouses = useCallback(async () => {
        try {
            const response = await api.get("/warehouses");
            if (response.data.success) {
                setWarehouses(response.data.data);
            }
        } catch (err) {
            console.error("Failed to load warehouses list", err);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchWarehouses();
    }, [fetchUsers, fetchWarehouses]);

    const handleOpenRoleModal = (u) => {
        setSelectedUser(u);
        setNewRole(u.role || "customer");
        setRoleModalVisible(true);
    };

    const handleSaveRole = async () => {
        if (!selectedUser) return;
        try {
            setUpdatingRole(true);
            const response = await api.put(`/users/admin/${selectedUser._id}/role`, {
                role: newRole,
            });
            if (response.data.success) {
                toast.success(`Role updated to ${newRole.toUpperCase()} for ${selectedUser.username}`);
                setRoleModalVisible(false);
                fetchUsers();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update user role");
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleOpenWhModal = (u) => {
        setSelectedWhUser(u);
        const currentWhIds = (u.assigned_warehouses || []).map((w) =>
            typeof w === "object" ? w._id : w
        );
        setAssignedWhIds(currentWhIds);
        setWhModalVisible(true);
    };

    const handleSaveWhAssignment = async () => {
        if (!selectedWhUser) return;
        try {
            setAssigningWh(true);
            const response = await api.put(`/users/admin/${selectedWhUser._id}/warehouses`, {
                warehouse_ids: assignedWhIds,
            });
            if (response.data.success) {
                toast.success(`Assigned ${assignedWhIds.length} warehouse(s) to ${selectedWhUser.username}`);
                setWhModalVisible(false);
                fetchUsers();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to assign warehouses");
        } finally {
            setAssigningWh(false);
        }
    };

    // Filtered users
    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            (u.username || "").toLowerCase().includes(searchText.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(searchText.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const totalAdmins = users.filter((u) => u.role === "admin").length;
    const totalManagers = users.filter((u) => u.role === "manager").length;
    const totalCustomers = users.filter((u) => u.role === "customer").length;

    const columns = [
        {
            title: "User",
            key: "user",
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        size={40}
                        src={record.avatar}
                        icon={<UserOutlined />}
                        className="bg-indigo-600 text-white flex-shrink-0"
                    />
                    <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                            <span>{record.username}</span>
                            {record._id === currentUser?._id && (
                                <Tag color="cyan" className="text-[10px] m-0">You</Tag>
                            )}
                        </div>
                        <div className="text-xs text-slate-500">{record.email}</div>
                        {record.phone && (
                            <div className="text-[11px] text-slate-400">Phone: {record.phone}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (role) => {
                const map = {
                    admin: { color: "rose", bg: "bg-rose-50 text-rose-700 border-rose-200", label: "ADMIN" },
                    manager: { color: "blue", bg: "bg-blue-50 text-blue-700 border-blue-200", label: "MANAGER" },
                    customer: { color: "emerald", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "CUSTOMER" },
                };
                const conf = map[role] || { color: "gray", bg: "bg-slate-50 text-slate-700 border-slate-200", label: (role || "").toUpperCase() };
                return (
                    <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${conf.bg}`}>
                        {conf.label}
                    </span>
                );
            },
        },
        {
            title: "Assigned Facilities",
            key: "assigned_warehouses",
            render: (_, record) => {
                if (record.role === "admin") {
                    return <Tag color="purple">All Organization Warehouses (Global)</Tag>;
                }
                if (record.role === "customer") {
                    return <span className="text-xs text-slate-400">N/A (Customer Buyer)</span>;
                }
                const assigned = record.assigned_warehouses || [];
                if (assigned.length === 0) {
                    return <Tag color="warning">No Warehouses Assigned</Tag>;
                }
                return (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                        {assigned.map((wh) => (
                            <Tag key={wh._id || wh} color="geekblue" className="text-xs">
                                {wh.warehouse_name || "Facility"}
                            </Tag>
                        ))}
                    </div>
                );
            },
        },
        {
            title: "Joined",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (d) => dayjs(d).format("DD MMM YYYY"),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => {
                const isSelf = record._id === currentUser?._id;
                return (
                    <Space size="middle">
                        <Tooltip title={isSelf ? "Admins cannot change their own role" : "Modify user role"}>
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                                disabled={isSelf}
                                onClick={() => handleOpenRoleModal(record)}
                                className="border-indigo-200 text-indigo-700 hover:text-indigo-800 hover:border-indigo-400"
                            >
                                Role
                            </Button>
                        </Tooltip>
                        {record.role === "manager" && (
                            <Button
                                size="small"
                                icon={<ShopOutlined />}
                                onClick={() => handleOpenWhModal(record)}
                                className="border-blue-200 text-blue-700 hover:text-blue-800 hover:border-blue-400"
                            >
                                Assign Facilities
                            </Button>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 m-0 flex items-center gap-2">
                        <UsergroupAddOutlined className="text-indigo-600" />
                        Users & Roles Management
                    </h1>
                    <p className="text-slate-500 text-sm m-0">
                        Administer organization users, assign roles (Admin, Manager, Customer), and manage warehouse facility assignments.
                    </p>
                </div>
            </div>

            {/* KPI Metrics */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-indigo-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Total Users</span>}
                            value={users.length}
                            prefix={<UserOutlined className="mr-2 text-indigo-500" />}
                            valueStyle={{ fontWeight: "700", color: "#1e1b4b" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-rose-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Admins</span>}
                            value={totalAdmins}
                            prefix={<SafetyCertificateOutlined className="mr-2 text-rose-500" />}
                            valueStyle={{ fontWeight: "700", color: "#881337" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-blue-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Warehouse Managers</span>}
                            value={totalManagers}
                            prefix={<ShopOutlined className="mr-2 text-blue-500" />}
                            valueStyle={{ fontWeight: "700", color: "#1e3a8a" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl bg-gradient-to-br from-emerald-50 to-white">
                        <Statistic
                            title={<span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Customers</span>}
                            value={totalCustomers}
                            prefix={<UsergroupAddOutlined className="mr-2 text-emerald-500" />}
                            valueStyle={{ fontWeight: "700", color: "#064e3b" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters Bar */}
            <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-md">
                        <Input
                            placeholder="Search by username or email..."
                            prefix={<SearchOutlined className="text-slate-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Role Filter:</span>
                        <Select
                            value={roleFilter}
                            onChange={(v) => setRoleFilter(v)}
                            style={{ width: 160 }}
                        >
                            <Option value="all">All Roles ({users.length})</Option>
                            <Option value="admin">Admin ({totalAdmins})</Option>
                            <Option value="manager">Manager ({totalManagers})</Option>
                            <Option value="customer">Customer ({totalCustomers})</Option>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                />
            </Card>

            {/* Modal: Change Role */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <SafetyCertificateOutlined className="text-indigo-600 text-lg" />
                        <span>Change Role for {selectedUser?.username}</span>
                    </div>
                }
                open={roleModalVisible}
                onOk={handleSaveRole}
                confirmLoading={updatingRole}
                onCancel={() => setRoleModalVisible(false)}
                okText="Save Role"
            >
                <div className="py-4 space-y-4">
                    <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                        <div><strong>User:</strong> {selectedUser?.username} ({selectedUser?.email})</div>
                        <div className="mt-1">
                            <strong>Current Role:</strong>{" "}
                            <span className="font-semibold uppercase text-indigo-600">
                                {selectedUser?.role}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Select New Role:
                        </label>
                        <Select
                            value={newRole}
                            onChange={(val) => setNewRole(val)}
                            className="w-full"
                            size="large"
                        >
                            <Option value="admin">
                                <span className="font-semibold text-rose-600">Admin</span> - Full system control, reports, approvals, user administration
                            </Option>
                            <Option value="manager">
                                <span className="font-semibold text-blue-600">Manager</span> - Assigned warehouse fulfillment, transfers, stock counts
                            </Option>
                            <Option value="customer">
                                <span className="font-semibold text-emerald-600">Customer</span> - External buyer portal, place orders, view invoices & returns
                            </Option>
                        </Select>
                    </div>

                    {newRole === "manager" && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                            <strong>Note:</strong> After saving this user as Manager, assign them one or more warehouses using the "Assign Facilities" button.
                        </div>
                    )}
                </div>
            </Modal>

            {/* Modal: Assign Warehouses */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <ShopOutlined className="text-blue-600 text-lg" />
                        <span>Assign Warehouses for Manager: {selectedWhUser?.username}</span>
                    </div>
                }
                open={whModalVisible}
                onOk={handleSaveWhAssignment}
                confirmLoading={assigningWh}
                onCancel={() => setWhModalVisible(false)}
                okText="Save Assignments"
            >
                <div className="py-4 space-y-4">
                    <p className="text-sm text-slate-600 m-0">
                        Select which warehouse facilities this manager can view and operate (receiving, dispatch, stock counts, transfers).
                    </p>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Assigned Warehouses:
                        </label>
                        <Select
                            mode="multiple"
                            value={assignedWhIds}
                            onChange={(ids) => setAssignedWhIds(ids)}
                            placeholder="Select warehouses..."
                            className="w-full"
                            size="large"
                            optionFilterProp="children"
                        >
                            {warehouses.map((wh) => (
                                <Option key={wh._id} value={wh._id}>
                                    {wh.warehouse_name} ({wh.warehouse_code}) - {wh.city || wh.state || "Facility"}
                                </Option>
                            ))}
                        </Select>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        Managers are strictly isolated to their assigned warehouses and cannot see or transfer goods into unassigned facilities.
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UserManagement;
