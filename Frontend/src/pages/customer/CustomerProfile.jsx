import React, { useState } from "react";
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
} from "antd";
import {
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    PlusOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import { api } from "../../api/api";

const CustomerProfile = () => {
    const { user, refreshUser } = useAuth();
    const [phone, setPhone] = useState(user?.phone || "");
    const [updatingPhone, setUpdatingPhone] = useState(false);

    // Add Address Modal
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressForm] = Form.useForm();
    const [savingAddress, setSavingAddress] = useState(false);

    const handleUpdateProfile = async () => {
        try {
            setUpdatingPhone(true);
            const response = await api.put("/users/customer/profile", { phone });
            if (response.data.success) {
                toast.success("Profile updated successfully");
                if (refreshUser) await refreshUser();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setUpdatingPhone(false);
        }
    };

    const handleAddAddress = async (values) => {
        try {
            setSavingAddress(true);
            const response = await api.post("/users/customer/shipping-addresses", values);
            if (response.data.success) {
                toast.success("Shipping address added successfully");
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

    const handleDeleteAddress = async (addressId) => {
        try {
            const response = await api.delete(`/users/customer/shipping-addresses/${addressId}`);
            if (response.data.success) {
                toast.success("Address removed");
                if (refreshUser) await refreshUser();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove address");
        }
    };

    const addresses = user?.shipping_addresses || [];

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 m-0 flex items-center gap-2">
                    <UserOutlined className="text-indigo-600" />
                    Customer Profile & Shipping Addresses
                </h1>
                <p className="text-slate-500 text-sm m-0">
                    Manage your buyer account details, contact phone, and saved delivery addresses for streamlined ordering.
                </p>
            </div>

            {/* Profile Overview Card */}
            <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-2xl">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Avatar
                        size={80}
                        src={user?.avatar}
                        icon={<UserOutlined />}
                        className="bg-indigo-600 border-2 border-indigo-200 shadow-md"
                    />
                    <div className="flex-1 text-center sm:text-left space-y-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h2 className="text-xl font-bold text-slate-900 m-0">{user?.username}</h2>
                            <Tag color="green" className="font-bold uppercase tracking-wider text-xs">
                                {user?.role || "CUSTOMER"}
                            </Tag>
                        </div>
                        <div className="text-slate-500 text-sm flex items-center justify-center sm:justify-start gap-2">
                            <MailOutlined />
                            <span>{user?.email}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 max-w-md">
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                        Contact Phone Number:
                    </label>
                    <div className="flex gap-2">
                        <Input
                            prefix={<PhoneOutlined className="text-slate-400" />}
                            placeholder="Enter contact phone (e.g. +91 9876543210)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <Button
                            type="primary"
                            loading={updatingPhone}
                            onClick={handleUpdateProfile}
                            className="bg-indigo-600 hover:bg-indigo-500"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Shipping Addresses Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
                            <EnvironmentOutlined className="text-indigo-600" />
                            Saved Shipping Destinations
                        </h3>
                        <p className="text-xs text-slate-500 m-0">
                            Addresses used for order delivery and return dispatches.
                        </p>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsAddressModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-500"
                    >
                        Add New Address
                    </Button>
                </div>

                {addresses.length === 0 ? (
                    <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl py-12 text-center">
                        <Empty description="No shipping addresses saved yet. Add your primary delivery address above." />
                    </Card>
                ) : (
                    <Row gutter={[16, 16]}>
                        {addresses.map((addr) => (
                            <Col key={addr._id} xs={24} md={12}>
                                <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm relative space-y-2 hover:border-indigo-300 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 text-sm">
                                                {addr.city}, {addr.state}
                                            </span>
                                            {addr.is_default && (
                                                <Tag color="blue" icon={<CheckCircleOutlined />}>
                                                    Default
                                                </Tag>
                                            )}
                                        </div>
                                        <Popconfirm
                                            title="Delete Address"
                                            description="Are you sure you want to delete this address?"
                                            onConfirm={() => handleDeleteAddress(addr._id)}
                                            okText="Delete"
                                            okButtonProps={{ danger: true }}
                                        >
                                            <Button
                                                type="text"
                                                danger
                                                size="small"
                                                icon={<DeleteOutlined />}
                                            />
                                        </Popconfirm>
                                    </div>
                                    <div className="text-sm text-slate-600 leading-relaxed">
                                        {addr.address_line}
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono">
                                        PIN: {addr.postal_code} • {addr.country || "India"}
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* Modal: Add Address */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <EnvironmentOutlined className="text-indigo-600 text-lg" />
                        <span>Add Shipping Address</span>
                    </div>
                }
                open={isAddressModalOpen}
                onOk={() => addressForm.submit()}
                confirmLoading={savingAddress}
                onCancel={() => setIsAddressModalOpen(false)}
                okText="Save Address"
            >
                <Form
                    form={addressForm}
                    layout="vertical"
                    onFinish={handleAddAddress}
                    initialValues={{ country: "India", is_default: addresses.length === 0 }}
                >
                    <Form.Item
                        name="address_line"
                        label="Street Address / House No / Apartment"
                        rules={[{ required: true, message: "Please enter street address" }]}
                    >
                        <Input placeholder="e.g. Flat 402, Sunshine Towers, MG Road" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="city"
                            label="City"
                            rules={[{ required: true, message: "Please enter city" }]}
                        >
                            <Input placeholder="e.g. Bangalore" />
                        </Form.Item>
                        <Form.Item
                            name="state"
                            label="State"
                            rules={[{ required: true, message: "Please enter state" }]}
                        >
                            <Input placeholder="e.g. Karnataka" />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="postal_code"
                            label="Postal Code / PIN"
                            rules={[{ required: true, message: "Please enter PIN" }]}
                        >
                            <Input placeholder="e.g. 560001" />
                        </Form.Item>
                        <Form.Item
                            name="country"
                            label="Country"
                            rules={[{ required: true, message: "Please enter country" }]}
                        >
                            <Input placeholder="e.g. India" />
                        </Form.Item>
                    </div>

                    <Form.Item name="is_default" valuePropName="checked">
                        <Checkbox>Set as default shipping address</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CustomerProfile;
