import React, { useState, useEffect } from "react";
import {
    Drawer,
    Button,
    Input,
    Select,
    Radio,
    Empty,
    Tag,
    Divider,
    Tooltip,
} from "antd";
import {
    ShoppingCartOutlined,
    DeleteOutlined,
    PlusOutlined,
    MinusOutlined,
    EnvironmentOutlined,
    CreditCardOutlined,
    SafetyCertificateOutlined,
    ShopOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import useAuth from "../../hooks/useAuth";
import { api } from "../../api/api";
import { launchRazorpayCheckout } from "../../utils/razorpay";

const { Option } = Select;

const CartDrawer = () => {
    const {
        cartItems,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subTotal,
        isCartOpen,
        closeCart,
    } = useCart();

    const { user } = useAuth();
    const navigate = useNavigate();

    const [paymentMethod, setPaymentMethod] = useState("razorpay");
    const [addressChoice, setAddressChoice] = useState("saved");
    const [selectedSavedAddress, setSelectedSavedAddress] = useState(null);
    const [customAddress, setCustomAddress] = useState({
        address_line: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
    });
    const [submitting, setSubmitting] = useState(false);

    const savedAddresses = user?.shipping_addresses || [];

    useEffect(() => {
        if (savedAddresses.length > 0) {
            const def = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
            setSelectedSavedAddress(def);
            setAddressChoice("saved");
        } else {
            setAddressChoice("custom");
        }
    }, [user]);

    const gst = Math.round(subTotal * 0.18);
    const estimatedTotal = subTotal + gst;

    const handleCheckout = async () => {
        if (cartItems.length === 0) return;

        let shipping_address = null;
        if (addressChoice === "saved" && selectedSavedAddress) {
            shipping_address = {
                address_line: selectedSavedAddress.address_line,
                city: selectedSavedAddress.city,
                state: selectedSavedAddress.state,
                postal_code: selectedSavedAddress.postal_code,
                country: selectedSavedAddress.country || "India",
            };
        } else {
            if (!customAddress.address_line || !customAddress.city || !customAddress.postal_code) {
                toast.error("Please fill in all required shipping address fields");
                return;
            }
            shipping_address = customAddress;
        }

        const itemsPayload = cartItems.map((item) => ({
            product_id: item.product._id,
            quantity: item.quantity,
        }));

        if (paymentMethod === "razorpay") {
            try {
                setSubmitting(true);
                // 1. Initialize server-side calculated order on MongoDB
                const orderInitRes = await api.post("/payments/create-order", {
                    items: itemsPayload,
                    shipping_address,
                });

                if (!orderInitRes.data.success) {
                    toast.error("Failed to initialize payment order");
                    setSubmitting(false);
                    return;
                }

                const orderData = orderInitRes.data.data;

                // 2. Launch Razorpay Checkout popup
                await launchRazorpayCheckout({
                    orderData,
                    user,
                    productName: `${totalItems} items from InventoryPro Store`,
                    onSuccess: async (payResponse) => {
                        try {
                            setSubmitting(true);
                            // 3. Verify HMAC signature & atomically dispatch stock on backend
                            const verifyRes = await api.post("/payments/verify", {
                                razorpay_order_id: payResponse.razorpay_order_id,
                                razorpay_payment_id: payResponse.razorpay_payment_id,
                                razorpay_signature: payResponse.razorpay_signature,
                                items: itemsPayload,
                                shipping_address,
                            });

                            if (verifyRes.data.success) {
                                toast.success("Payment verified! Order placed successfully.");
                                clearCart();
                                closeCart();
                                navigate("/customer/orders");
                            }
                        } catch (verErr) {
                            toast.error(verErr.response?.data?.message || "Payment verification failed");
                        } finally {
                            setSubmitting(false);
                        }
                    },
                    onDismiss: (err) => {
                        setSubmitting(false);
                        if (err) toast.error("Payment was cancelled or failed");
                    },
                });
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to initiate payment");
                setSubmitting(false);
            }
            return;
        }

        // Cash on Delivery (COD) path
        try {
            setSubmitting(true);
            const res = await api.post("/orders/customer-checkout", {
                items: itemsPayload,
                shipping_address,
                payment_method: "cod",
            });

            if (res.data.success) {
                toast.success("Order placed successfully (Cash on Delivery)!");
                clearCart();
                closeCart();
                navigate("/customer/orders");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to place order");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Drawer
            title={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCartOutlined className="text-indigo-600 text-lg" />
                        <span className="font-bold text-slate-900">Your Shopping Cart</span>
                        {totalItems > 0 && (
                            <Tag color="indigo" className="font-bold text-xs rounded-full">
                                {totalItems} {totalItems === 1 ? "item" : "items"}
                            </Tag>
                        )}
                    </div>
                    {cartItems.length > 0 && (
                        <Button
                            type="text"
                            danger
                            size="small"
                            onClick={clearCart}
                            className="text-xs"
                        >
                            Clear All
                        </Button>
                    )}
                </div>
            }
            placement="right"
            onClose={closeCart}
            open={isCartOpen}
            width={480}
            bodyStyle={{ padding: "16px 20px" }}
        >
            {cartItems.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className="space-y-1 mt-2">
                                <p className="font-semibold text-slate-800 text-base">Your cart is empty</p>
                                <p className="text-xs text-slate-500">
                                    Explore products in the catalog and add them to your cart.
                                </p>
                            </div>
                        }
                    />
                    <Button
                        type="primary"
                        onClick={() => {
                            closeCart();
                            navigate("/customer/catalog");
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 rounded-xl mt-6 px-6 h-10 font-semibold"
                        icon={<ShopOutlined />}
                    >
                        Browse Product Catalog
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col h-full justify-between space-y-6">
                    {/* Cart Items List */}
                    <div className="space-y-3 overflow-y-auto max-h-[42vh] pr-1">
                        {cartItems.map((item) => {
                            const p = item.product;
                            const availableStock = p.available_stock ?? p.stock ?? 0;
                            return (
                                <div
                                    key={p._id}
                                    className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex gap-3 items-center justify-between group hover:border-slate-300 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {p.product_image ? (
                                                <img
                                                    src={p.product_image}
                                                    alt={p.product_name}
                                                    className="w-full h-full object-contain p-1"
                                                />
                                            ) : (
                                                <ShopOutlined className="text-slate-300 text-xl" />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <h4 className="text-xs font-bold text-slate-900 truncate m-0">
                                                {p.product_name}
                                            </h4>
                                            <span className="text-[10px] text-slate-400 font-mono block">
                                                {p.product_code} • {p.category?.category_name || "General"}
                                            </span>
                                            <div className="text-xs font-bold text-indigo-600 mt-1">
                                                ₹{(p.selling_price || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {/* Quantity Stepper */}
                                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                            <button
                                                onClick={() => updateQuantity(p._id, item.quantity - 1)}
                                                className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors text-xs cursor-pointer"
                                                aria-label="Decrease quantity"
                                            >
                                                <MinusOutlined />
                                            </button>
                                            <span className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-white">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(p._id, item.quantity + 1)}
                                                disabled={item.quantity >= availableStock}
                                                className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                aria-label="Increase quantity"
                                            >
                                                <PlusOutlined />
                                            </button>
                                        </div>

                                        {/* Remove Button */}
                                        <Tooltip title="Remove item">
                                            <button
                                                onClick={() => removeFromCart(p._id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                            >
                                                <DeleteOutlined className="text-sm" />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Checkout Configuration & Delivery Address */}
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        {/* Address Selection */}
                        <div>
                            <label className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                <EnvironmentOutlined className="text-indigo-600" />
                                Shipping Destination:
                            </label>

                            {savedAddresses.length > 0 && (
                                <Radio.Group
                                    value={addressChoice}
                                    onChange={(e) => setAddressChoice(e.target.value)}
                                    className="mb-2 block space-x-3 text-xs"
                                >
                                    <Radio value="saved">Use Saved Address</Radio>
                                    <Radio value="custom">Enter New Address</Radio>
                                </Radio.Group>
                            )}

                            {addressChoice === "saved" && savedAddresses.length > 0 ? (
                                <Select
                                    value={selectedSavedAddress?._id}
                                    onChange={(id) => {
                                        const found = savedAddresses.find((a) => a._id === id);
                                        setSelectedSavedAddress(found);
                                    }}
                                    className="w-full"
                                    size="middle"
                                >
                                    {savedAddresses.map((addr) => (
                                        <Option key={addr._id} value={addr._id}>
                                            {addr.address_line}, {addr.city}, {addr.state} - {addr.postal_code}
                                        </Option>
                                    ))}
                                </Select>
                            ) : (
                                <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                                    <Input
                                        placeholder="Street Address / House No"
                                        size="middle"
                                        value={customAddress.address_line}
                                        onChange={(e) =>
                                            setCustomAddress({ ...customAddress, address_line: e.target.value })
                                        }
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="City"
                                            value={customAddress.city}
                                            onChange={(e) =>
                                                setCustomAddress({ ...customAddress, city: e.target.value })
                                            }
                                        />
                                        <Input
                                            placeholder="State"
                                            value={customAddress.state}
                                            onChange={(e) =>
                                                setCustomAddress({ ...customAddress, state: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="Postal Code"
                                            value={customAddress.postal_code}
                                            onChange={(e) =>
                                                setCustomAddress({ ...customAddress, postal_code: e.target.value })
                                            }
                                        />
                                        <Input placeholder="Country" value="India" disabled />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Method Selector */}
                        <div>
                            <label className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                <CreditCardOutlined className="text-indigo-600" />
                                Payment Method:
                            </label>
                            <Select
                                value={paymentMethod}
                                onChange={(val) => setPaymentMethod(val)}
                                className="w-full"
                                size="middle"
                            >
                                <Option value="razorpay">
                                    ⚡ Pay Online via Razorpay (UPI, GPay, PhonePe, Cards, NetBanking)
                                </Option>
                                <Option value="cod">
                                    💵 Cash on Delivery (COD)
                                </Option>
                            </Select>
                        </div>

                        {/* Price Breakdown */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Cart Subtotal ({totalItems} items):</span>
                                <span className="font-semibold text-slate-900">₹{subTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Estimated GST (18%):</span>
                                <span className="font-semibold text-slate-900">₹{gst.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Warehouse Shipping:</span>
                                <span className="font-bold text-emerald-600">FREE</span>
                            </div>
                            <Divider className="my-1.5" />
                            <div className="flex justify-between text-sm font-black text-slate-900">
                                <span>Estimated Total:</span>
                                <span className="text-indigo-600 text-base">₹{estimatedTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Checkout CTA */}
                        <Button
                            type="primary"
                            size="large"
                            loading={submitting}
                            onClick={handleCheckout}
                            block
                            className="bg-indigo-600 hover:bg-indigo-500 font-bold h-12 rounded-xl text-sm shadow-sm"
                            icon={<SafetyCertificateOutlined />}
                        >
                            {paymentMethod === "razorpay"
                                ? `Pay ₹${estimatedTotal.toLocaleString()} via Razorpay`
                                : `Place COD Order (₹${estimatedTotal.toLocaleString()})`}
                        </Button>
                    </div>
                </div>
            )}
        </Drawer>
    );
};

export default CartDrawer;

