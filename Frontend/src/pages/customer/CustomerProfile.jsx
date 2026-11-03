import React, { useState, useEffect } from "react";
import {
    Card,
    Row,
    Col,
    Input,
    Button,
    Form,
    Tag,
    Modal,
    Checkbox,
    Avatar,
    Popconfirm,
    Empty,
    Tabs,
    Divider,
    Alert,
} from "antd";
import {
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    PlusOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    LockOutlined,
    KeyOutlined,
    SafetyCertificateOutlined,
    StarOutlined,
    StarFilled,
    SaveOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import { api } from "../../api/api";

const CustomerProfile = () => {
    const { user, refreshUser } = useAuth();

    // Tab state
    const [activeTab, setActiveTab] = useState("profile");

    // Profile Form state
    const [profileForm] = Form.useForm();
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // Password Form state
    const [passwordForm] = Form.useForm();
    const [updatingPassword, setUpdatingPassword] = useState(false);

    // Add Address Modal state
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressForm] = Form.useForm();
    const [savingAddress, setSavingAddress] = useState(false);
    const [settingDefaultId, setSettingDefaultId] = useState(null);

    // Sync form values when user changes
    useEffect(() => {
        if (user) {
            profileForm.setFieldsValue({
                username: user.username || "",
                email: user.email || "",
                phone: user.phone || "",
            });
        }
    }, [user, profileForm]);

    // Handle Profile Update (Username & Phone)
    const handleUpdateProfile = async (values) => {
        try {
            setUpdatingProfile(true);
            const response = await api.put("/users/customer/profile", {
                username: values.username,
                phone: values.phone,
            });

            if (response.data.success) {
                toast.success("Profile details updated successfully");
                if (refreshUser) await refreshUser();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setUpdatingProfile(false);
        }
    };

    // Handle Password Change
    const handleChangePassword = async (values) => {
        try {
            setUpdatingPassword(true);
            const response = await api.post("/users/change-password", {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
            });

            if (response.data.success) {
                toast.success("Password updated successfully! Please use your new password next time you sign in.");
                passwordForm.resetFields();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to change password. Please check your current password.");
        } finally {
            setUpdatingPassword(false);
        }
    };

    // Handle Add New Address
    const handleAddAddress = async (values) => {
        try {
            setSavingAddress(true);
            const response = await api.post("/users/customer/shipping-addresses", values);
            if (response.data.success) {
                toast.success("New shipping address added successfully");
                setIsAddressModalOpen(false);
                addressForm.resetFields();
                if (refreshUser) await refreshUser();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add address");
        } finally {
            setSavingAddress(false);
        }
    };

    // Handle Set Default Address
    const handleSetDefaultAddress = async (addressId) => {
        try {
            setSettingDefaultId(addressId);
            const response = await api.patch(`/users/customer/shipping-addresses/${addressId}/default`);
            if (response.data.success) {
                toast.success("Default delivery destination updated");
                if (refreshUser) await refreshUser();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to set default address");
        } finally {
            setSettingDefaultId(null);
        }
    };

    // Handle Delete Address
    const handleDeleteAddress = async (addressId) => {
        try {
            const response = await api.delete(`/users/customer/shipping-addresses/${addressId}`);
            if (response.data.success) {
                toast.success("Shipping address removed");
                if (refreshUser) await refreshUser();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove address");
        }
    };

    const addresses = user?.shipping_addresses || [];

    // Tab items
    const tabItems = [
        {
            key: "profile",
            label: (
                <span className="flex items-center gap-2 font-semibold">
                    <UserOutlined /> Personal Details
                </span>
            ),
            children: (
                <div className="space-y-6">
                    <Card variant="borderless" className="shadow-xs border border-slate-200/80 rounded-2xl p-2 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                            <Avatar
                                size={84}
                                src={user?.avatar}
                                icon={<UserOutlined />}
                                className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold ring-4 ring-indigo-50 shadow-md"
                            />
                            <div className="flex-1 text-center sm:text-left space-y-1.5">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <h2 className="text-xl font-bold text-slate-900 m-0">{user?.username}</h2>
                                    <Tag color="purple" className="font-bold uppercase tracking-wider text-xs px-2.5 py-0.5 rounded-full">
                                        {user?.role || "CUSTOMER"}
                                    </Tag>
                                    <Tag color={user?.isVerified ? "green" : "blue"} icon={<CheckCircleOutlined />} className="text-xs px-2.5 py-0.5 rounded-full">
                                        {user?.isVerified ? "Email Verified" : "Active Buyer"}
                                    </Tag>
                                </div>
                                <div className="text-slate-500 text-sm flex items-center justify-center sm:justify-start gap-2">
                                    <MailOutlined className="text-indigo-500" />
                                    <span>{user?.email}</span>
                                </div>
                                <div className="text-xs text-slate-400">
                                    Account ID: <span className="font-mono text-slate-600">{user?._id || "—"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Editable Form */}
                        <div className="pt-6 max-w-2xl">
                            <h3 className="text-base font-bold text-slate-800 mb-1">
                                Update Account & Contact Details
                            </h3>
                            <p className="text-xs text-slate-500 mb-6">
                                Keep your username and primary telephone current to receive shipping updates and delivery notifications.
                            </p>

                            <Form
                                form={profileForm}
                                layout="vertical"
                                onFinish={handleUpdateProfile}
                                className="space-y-4"
                            >
                                <Form.Item
                                    name="username"
                                    label={<span className="font-semibold text-slate-700">Display Name / Username</span>}
                                    rules={[
                                        { required: true, message: "Please enter your username" },
                                        { min: 3, message: "Username must be at least 3 characters" },
                                    ]}
                                >
                                    <Input
                                        prefix={<UserOutlined className="text-slate-400 mr-1" />}
                                        placeholder="e.g. johndoe"
                                        size="large"
                                        className="rounded-xl"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="email"
                                    label={<span className="font-semibold text-slate-700">Email Address (Primary Login)</span>}
                                    extra={
                                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                            <InfoCircleOutlined className="text-indigo-500" />
                                            Email is linked to order invoices and GST tax receipts. Contact support to modify.
                                        </span>
                                    }
                                >
                                    <Input
                                        prefix={<MailOutlined className="text-slate-400 mr-1" />}
                                        size="large"
                                        disabled
                                        className="rounded-xl bg-slate-50 text-slate-600 cursor-not-allowed"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="phone"
                                    label={<span className="font-semibold text-slate-700">Contact Phone Number</span>}
                                    rules={[
                                        {
                                            pattern: /^[+]?[0-9\s-]{7,15}$/,
                                            message: "Please enter a valid phone number (7-15 digits)",
                                        },
                                    ]}
                                    extra="Used by logistics partners for parcel delivery updates."
                                >
                                    <Input
                                        prefix={<PhoneOutlined className="text-slate-400 mr-1" />}
                                        placeholder="e.g. +91 9876543210"
                                        size="large"
                                        className="rounded-xl"
                                    />
                                </Form.Item>

                                <div className="pt-2">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={updatingProfile}
                                        icon={<SaveOutlined />}
                                        size="large"
                                        className="bg-indigo-600 hover:bg-indigo-500 font-semibold px-6 rounded-xl shadow-xs"
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </Card>
                </div>
            ),
        },
        {
            key: "addresses",
            label: (
                <span className="flex items-center gap-2 font-semibold">
                    <EnvironmentOutlined /> Delivery Addresses ({addresses.length})
                </span>
            ),
            children: (
                <div className="space-y-6">
                    <Card variant="borderless" className="shadow-xs border border-slate-200/80 rounded-2xl p-2 sm:p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-800 m-0 flex items-center gap-2">
                                    <EnvironmentOutlined className="text-indigo-600" />
                                    Saved Shipping Destinations
                                </h3>
                                <p className="text-xs text-slate-500 m-0 mt-0.5">
                                    Addresses available during single-click checkout and return pickup dispatches.
                                </p>
                            </div>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setIsAddressModalOpen(true)}
                                size="middle"
                                className="bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl"
                            >
                                Add New Address
                            </Button>
                        </div>

                        <div className="pt-6">
                            {addresses.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Empty
                                        description={
                                            <div className="space-y-2">
                                                <p className="text-slate-500 text-sm font-medium m-0">
                                                    No delivery destinations saved yet.
                                                </p>
                                                <p className="text-slate-400 text-xs m-0">
                                                    Add your primary house or office address to speed up order checkout.
                                                </p>
                                            </div>
                                        }
                                    />
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setIsAddressModalOpen(true)}
                                        className="mt-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold"
                                    >
                                        Add Delivery Address
                                    </Button>
                                </div>
                            ) : (
                                <Row gutter={[16, 16]}>
                                    {addresses.map((addr) => {
                                        const isDefault = addr.is_default;
                                        return (
                                            <Col key={addr._id} xs={24} md={12}>
                                                <div
                                                    className={`p-5 rounded-2xl border transition-all h-full flex flex-col justify-between ${
                                                        isDefault
                                                            ? "bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-100 shadow-sm"
                                                            : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-900 text-sm">
                                                                    {addr.city}, {addr.state}
                                                                </span>
                                                                {isDefault ? (
                                                                    <Tag
                                                                        color="indigo"
                                                                        icon={<StarFilled className="text-amber-400" />}
                                                                        className="font-bold text-[11px] px-2 py-0.5 rounded-full border-0 bg-indigo-100 text-indigo-700"
                                                                    >
                                                                        Default Address
                                                                    </Tag>
                                                                ) : (
                                                                    <Tag color="default" className="text-[11px] text-slate-500">
                                                                        Secondary
                                                                    </Tag>
                                                                )}
                                                            </div>

                                                            <Popconfirm
                                                                title="Delete Address"
                                                                description="Are you sure you want to delete this shipping address?"
                                                                onConfirm={() => handleDeleteAddress(addr._id)}
                                                                okText="Delete"
                                                                okButtonProps={{ danger: true }}
                                                            >
                                                                <Button
                                                                    type="text"
                                                                    danger
                                                                    size="small"
                                                                    icon={<DeleteOutlined />}
                                                                    className="hover:bg-rose-50"
                                                                />
                                                            </Popconfirm>
                                                        </div>

                                                        <p className="text-sm text-slate-600 leading-relaxed m-0 mb-2">
                                                            {addr.address_line || addr.street}
                                                        </p>
                                                        <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                                                            <span>PIN: {addr.postal_code || addr.pincode}</span>
                                                            <span>•</span>
                                                            <span>{addr.country || "India"}</span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 mt-3 border-t border-slate-100/80 flex items-center justify-between">
                                                        {isDefault ? (
                                                            <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                                                                <CheckCircleOutlined /> Primary for checkouts
                                                            </span>
                                                        ) : (
                                                            <Button
                                                                size="small"
                                                                type="dashed"
                                                                icon={<StarOutlined />}
                                                                loading={settingDefaultId === addr._id}
                                                                onClick={() => handleSetDefaultAddress(addr._id)}
                                                                className="text-xs font-semibold rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-300"
                                                            >
                                                                Set as Default
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            )}
                        </div>
                    </Card>
                </div>
            ),
        },
        {
            key: "security",
            label: (
                <span className="flex items-center gap-2 font-semibold">
                    <LockOutlined /> Password & Security
                </span>
            ),
            children: (
                <div className="space-y-6">
                    <Card variant="borderless" className="shadow-xs border border-slate-200/80 rounded-2xl p-2 sm:p-4">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
                                    <SafetyCertificateOutlined />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 m-0">
                                        Change Account Password
                                    </h3>
                                    <p className="text-xs text-slate-500 m-0">
                                        Update your login credentials to protect your purchase history and saved payment sessions.
                                    </p>
                                </div>
                            </div>

                            <Alert
                                message="Security Recommendation"
                                description="Choose a strong password containing at least 6 characters, combining letters, numbers, and symbols. Never share your password with anyone."
                                type="info"
                                showIcon
                                className="mb-6 rounded-xl border-indigo-100 bg-indigo-50/50 text-indigo-900"
                            />

                            <Form
                                form={passwordForm}
                                layout="vertical"
                                onFinish={handleChangePassword}
                                className="space-y-4"
                            >
                                <Form.Item
                                    name="oldPassword"
                                    label={<span className="font-semibold text-slate-700">Current Password</span>}
                                    rules={[{ required: true, message: "Please enter your current password" }]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined className="text-slate-400 mr-1" />}
                                        placeholder="Enter your current password"
                                        size="large"
                                        className="rounded-xl"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="newPassword"
                                    label={<span className="font-semibold text-slate-700">New Password</span>}
                                    rules={[
                                        { required: true, message: "Please enter your new password" },
                                        { min: 6, message: "New password must be at least 6 characters long" },
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<KeyOutlined className="text-slate-400 mr-1" />}
                                        placeholder="Enter a new strong password (min 6 characters)"
                                        size="large"
                                        className="rounded-xl"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="confirmPassword"
                                    label={<span className="font-semibold text-slate-700">Confirm New Password</span>}
                                    dependencies={["newPassword"]}
                                    rules={[
                                        { required: true, message: "Please re-enter your new password" },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue("newPassword") === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error("Passwords do not match!"));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<CheckCircleOutlined className="text-slate-400 mr-1" />}
                                        placeholder="Re-enter your new password"
                                        size="large"
                                        className="rounded-xl"
                                    />
                                </Form.Item>

                                <div className="pt-3 flex gap-3">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={updatingPassword}
                                        icon={<LockOutlined />}
                                        size="large"
                                        className="bg-indigo-600 hover:bg-indigo-500 font-semibold px-6 rounded-xl shadow-xs"
                                    >
                                        Update Password
                                    </Button>
                                    <Button
                                        size="large"
                                        onClick={() => passwordForm.resetFields()}
                                        className="rounded-xl font-medium"
                                    >
                                        Reset Form
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </Card>
                </div>
            ),
        },
    ];

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 m-0 flex items-center gap-2">
                        <UserOutlined className="text-indigo-600" />
                        My Account & Profile
                    </h1>
                    <p className="text-slate-500 text-sm m-0 mt-1">
                        Manage your buyer credentials, contact telephone, default delivery address, and security settings.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                size="large"
                className="customer-profile-tabs"
            />

            {/* Modal: Add Address */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <EnvironmentOutlined className="text-indigo-600 text-lg" />
                        <span className="font-bold text-slate-900">Add New Delivery Address</span>
                    </div>
                }
                open={isAddressModalOpen}
                onOk={() => addressForm.submit()}
                confirmLoading={savingAddress}
                onCancel={() => setIsAddressModalOpen(false)}
                okText="Save Address"
                okButtonProps={{ className: "bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg" }}
                cancelButtonProps={{ className: "rounded-lg" }}
            >
                <Divider className="my-3" />
                <Form
                    form={addressForm}
                    layout="vertical"
                    onFinish={handleAddAddress}
                    initialValues={{ country: "India", is_default: addresses.length === 0 }}
                >
                    <Form.Item
                        name="address_line"
                        label={<span className="font-semibold text-slate-700">Street Address / House No / Apartment</span>}
                        rules={[{ required: true, message: "Please enter street address" }]}
                    >
                        <Input placeholder="e.g. Flat 402, Sunshine Towers, MG Road" className="rounded-lg" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="city"
                            label={<span className="font-semibold text-slate-700">City</span>}
                            rules={[{ required: true, message: "Please enter city" }]}
                        >
                            <Input placeholder="e.g. Bangalore" className="rounded-lg" />
                        </Form.Item>
                        <Form.Item
                            name="state"
                            label={<span className="font-semibold text-slate-700">State</span>}
                            rules={[{ required: true, message: "Please enter state" }]}
                        >
                            <Input placeholder="e.g. Karnataka" className="rounded-lg" />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="postal_code"
                            label={<span className="font-semibold text-slate-700">Postal Code / PIN</span>}
                            rules={[{ required: true, message: "Please enter PIN" }]}
                        >
                            <Input placeholder="e.g. 560001" className="rounded-lg" />
                        </Form.Item>
                        <Form.Item
                            name="country"
                            label={<span className="font-semibold text-slate-700">Country</span>}
                            rules={[{ required: true, message: "Please enter country" }]}
                        >
                            <Input placeholder="e.g. India" className="rounded-lg" />
                        </Form.Item>
                    </div>

                    <Form.Item name="is_default" valuePropName="checked" className="m-0 pt-2">
                        <Checkbox className="font-medium text-slate-700">
                            Set as primary default shipping address for checkouts
                        </Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CustomerProfile;
