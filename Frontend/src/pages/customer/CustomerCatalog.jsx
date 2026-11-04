import React, { useState, useEffect, useCallback } from "react";
import {
    Card,
    Row,
    Col,
    Input,
    Select,
    Button,
    Tag,
    Modal,
    InputNumber,
    Radio,
    Spin,
    Empty,
} from "antd";
import {
    SearchOutlined,
    ShoppingCartOutlined,
    CheckCircleOutlined,
    ShopOutlined,
    EnvironmentOutlined,
    CreditCardOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../api/api";
import useAuth from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import { launchRazorpayCheckout } from "../../utils/razorpay";

const { Option } = Select;

const CustomerCatalog = () => {
    const { user } = useAuth();
    const { addToCart, openCart, totalItems } = useCart();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Checkout modal state
    const [orderModalVisible, setOrderModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
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
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [placedOrder, setPlacedOrder] = useState(null);

    const savedAddresses = user?.shipping_addresses || [];

    const fetchCatalog = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchText) params.search = searchText;
            if (selectedCategory !== "all") params.category = selectedCategory;

            const response = await api.get("/products/catalog", { params });
            if (response.data.success) {
                setProducts(response.data.data.products || []);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load product catalog");
        } finally {
            setLoading(false);
        }
    }, [searchText, selectedCategory]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.get("/categories/available");
            if (response.data.success) {
                setCategories(response.data.data || []);
            }
        } catch (err) {
            console.error("Failed to load categories:", err);
        }
    }, []);

    useEffect(() => {
        fetchCatalog();
        fetchCategories();
    }, [fetchCatalog, fetchCategories]);

    useEffect(() => {
        if (savedAddresses.length > 0) {
            const defaultAddr = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
            setSelectedSavedAddress(defaultAddr);
            setAddressChoice("saved");
        } else {
            setAddressChoice("custom");
        }
    }, [user]);

    const handleOpenOrderModal = (product) => {
        setSelectedProduct(product);
        setQuantity(1);
        setPlacedOrder(null);
        setOrderModalVisible(true);
    };

    const handlePlaceOrder = async () => {
        if (!selectedProduct) return;

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

        // Route through Razorpay workflow for secure online payment
        if (paymentMethod === "razorpay") {
            try {
                setSubmittingOrder(true);
                // Step 1: Server-side price calculation directly from MongoDB
                const orderInitRes = await api.post("/payments/create-order", {
                    items: [
                        {
                            product_id: selectedProduct._id,
                            quantity: quantity,
                        },
                    ],
                    shipping_address,
                });

                if (!orderInitRes.data.success) {
                    toast.error("Failed to initialize payment");
                    setSubmittingOrder(false);
                    return;
                }

                const orderData = orderInitRes.data.data;

                // Step 2: Open Razorpay checkout modal (UPI, Cards, NetBanking)
                await launchRazorpayCheckout({
                    orderData,
                    user,
                    productName: selectedProduct.product_name,
                    onSuccess: async (payResponse) => {
                        try {
                            setSubmittingOrder(true);
                            // Step 3: Server-side cryptographic HMAC-SHA256 signature verification & idempotent order creation
                            const verifyRes = await api.post("/payments/verify", {
                                razorpay_order_id: payResponse.razorpay_order_id,
                                razorpay_payment_id: payResponse.razorpay_payment_id,
                                razorpay_signature: payResponse.razorpay_signature,
                                items: [
                                    {
                                        product_id: selectedProduct._id,
                                        quantity: quantity,
                                    },
                                ],
                                shipping_address,
                            });

                            if (verifyRes.data.success) {
                                toast.success("Payment verified! Order placed successfully.");
                                setPlacedOrder(verifyRes.data.data);
                                fetchCatalog();
                            }
                        } catch (verErr) {
                            toast.error(verErr.response?.data?.message || "Payment verification failed");
                        } finally {
                            setSubmittingOrder(false);
                        }
                    },
                    onDismiss: (err) => {
                        setSubmittingOrder(false);
                        if (err) toast.error("Payment was cancelled or failed");
                    },
                });
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to initiate payment");
                setSubmittingOrder(false);
            }
            return;
        }

        // Cash on delivery fallback flow
        try {
            setSubmittingOrder(true);
            const response = await api.post("/orders/checkout", {
                items: [
                    {
                        product_id: selectedProduct._id,
                        quantity: quantity,
                    },
                ],
                shipping_address,
                payment_method: paymentMethod,
            });

            if (response.data.success) {
                toast.success("Order placed successfully!");
                setPlacedOrder(response.data.data);
                fetchCatalog(); // Refresh available inventory
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to place order");
        } finally {
            setSubmittingOrder(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <span className="text-xs uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                        Customer Buyer Portal
                    </span>
                    <h1 className="text-3xl font-extrabold text-white mt-3 mb-2 tracking-tight">
                        Product Catalog & Order Center
                    </h1>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Browse active inventory across our regional fulfillment centers. Check live stock, place instant orders, and track deliveries.
                    </p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-md">
                        <Input
                            placeholder="Search products by title or SKU..."
                            prefix={<SearchOutlined className="text-slate-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            size="large"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Category:</span>
                        <Select
                            value={selectedCategory}
                            onChange={(val) => setSelectedCategory(val)}
                            style={{ minWidth: 180 }}
                            size="large"
                        >
                            <Option value="all">All Categories</Option>
                            {categories.map((c) => (
                                <Option key={c._id} value={c._id}>
                                    {c.category_name}
                                </Option>
                            ))}
                        </Select>
                        <Button
                            type="primary"
                            icon={<ShoppingCartOutlined />}
                            onClick={openCart}
                            size="large"
                            className="bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold shadow-sm flex items-center"
                        >
                            Cart ({totalItems})
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Product Grid */}
            {loading ? (
                <div className="py-24 text-center">
                    <Spin size="large" />
                    <p className="text-slate-400 mt-4 text-sm">Loading available products...</p>
                </div>
            ) : products.length === 0 ? (
                <Card variant="borderless" className="shadow-sm border border-slate-100 rounded-xl py-16 text-center">
                    <Empty description="No products available matching your search criteria." />
                </Card>
            ) : (
                <Row gutter={[20, 20]}>
                    {products.map((p) => {
                        const stockCount = p.available_stock ?? p.stock ?? 0;
                        const inStock = stockCount > 0;
                        return (
                            <Col key={p._id} xs={24} sm={12} md={8} lg={6}>
                                <div className="h-full bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                                    <div className="relative bg-slate-50 aspect-video flex items-center justify-center p-4 border-b border-slate-100 overflow-hidden">
                                        {p.product_image ? (
                                            <img
                                                src={p.product_image}
                                                alt={p.product_name}
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                    if (e.currentTarget.nextSibling) {
                                                        e.currentTarget.nextSibling.style.display = "flex";
                                                    }
                                                }}
                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : null}
                                        <div
                                            className="w-full h-full flex items-center justify-center"
                                            style={{ display: p.product_image ? "none" : "flex" }}
                                        >
                                            <ShopOutlined className="text-5xl text-slate-300" />
                                        </div>
                                        {p.product_images && p.product_images.length > 1 && (
                                            <div className="absolute top-3 left-3 bg-slate-900/70 text-white text-[11px] px-2 py-0.5 rounded-full backdrop-blur-sm font-medium flex items-center gap-1 shadow">
                                                <span>📷</span> {p.product_images.length} photos
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            {inStock ? (
                                                <Tag color="success" className="font-semibold shadow-sm">
                                                    In Stock ({stockCount})
                                                </Tag>
                                            ) : (
                                                <Tag color="error" className="font-semibold shadow-sm">
                                                    Out of Stock
                                                </Tag>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                                <span className="font-mono">{p.product_code}</span>
                                                <span className="font-medium text-slate-500">{p.category_name || p.category?.category_name || "General"}</span>
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                                                {p.product_name}
                                            </h3>
                                            {p.description && (
                                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                                    {p.description}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                                                <div className="flex items-baseline justify-between">
                                                    <div>
                                                        <span className="text-xs text-slate-400 block">Retail Price</span>
                                                        <span className="text-xl font-extrabold text-slate-900">
                                                            ₹{(p.selling_price || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {inStock && stockCount <= 5 && (
                                                        <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                            Only {stockCount} left!
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        disabled={!inStock}
                                                        icon={<PlusOutlined />}
                                                        onClick={() => addToCart(p, 1)}
                                                        className="border-slate-300 text-slate-700 hover:text-indigo-600 hover:border-indigo-600 rounded-xl font-medium"
                                                    >
                                                        Add to Cart
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        disabled={!inStock}
                                                        icon={<ShoppingCartOutlined />}
                                                        onClick={() => handleOpenOrderModal(p)}
                                                        className="bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold shadow-sm"
                                                    >
                                                        Buy Now
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Modal: Order Placement */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <ShoppingCartOutlined className="text-indigo-600 text-lg" />
                        <span>Place Order</span>
                    </div>
                }
                open={orderModalVisible}
                footer={null}
                onCancel={() => setOrderModalVisible(false)}
                width={560}
            >
                {placedOrder ? (
                    <div className="py-8 text-center space-y-4">
                        <CheckCircleOutlined className="text-6xl text-emerald-500" />
                        <h2 className="text-2xl font-bold text-slate-900">Order Placed Successfully!</h2>
                        <p className="text-slate-600 text-sm">
                            Your order <strong>#{placedOrder.invoice_no || placedOrder.order_no}</strong> has been received and assigned for warehouse fulfillment.
                        </p>
                        <div className="p-4 bg-slate-50 rounded-xl text-left text-sm max-w-md mx-auto space-y-2 border border-slate-200">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Invoice / Order #:</span>
                                <span className="font-mono font-bold">{placedOrder.invoice_no || placedOrder.order_no}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Amount:</span>
                                <span className="font-bold text-indigo-600">₹{(placedOrder.total || placedOrder.total_amount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Status:</span>
                                <Tag color="gold">Pending Fulfillment</Tag>
                            </div>
                        </div>
                        <div className="flex justify-center gap-3 pt-4">
                            <Button onClick={() => setOrderModalVisible(false)}>
                                Continue Browsing
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => {
                                    setOrderModalVisible(false);
                                    navigate("/customer/orders");
                                }}
                                className="bg-indigo-600"
                            >
                                View My Orders
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 space-y-5">
                        {/* Product Summary */}
                        <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-4 border border-slate-200">
                            <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {selectedProduct?.product_image ? (
                                    <img
                                        src={selectedProduct.product_image}
                                        alt={selectedProduct.product_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <ShopOutlined className="text-xl text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 m-0 truncate">{selectedProduct?.product_name}</h4>
                                <span className="text-xs text-slate-500 font-mono">{selectedProduct?.product_code}</span>
                                {selectedProduct?.product_images?.length > 1 && (
                                    <div className="flex gap-1.5 mt-1.5">
                                        {selectedProduct.product_images.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt=""
                                                className="w-6 h-6 rounded-md object-cover border border-slate-200 shadow-xs"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="text-right flex-shrink-0">
                                <span className="text-xs text-slate-500 block">Unit Price</span>
                                <div className="text-lg font-extrabold text-slate-900">
                                    ₹{(selectedProduct?.selling_price || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Quantity to Purchase (Available: {selectedProduct?.available_stock || 0}):
                            </label>
                            <InputNumber
                                min={1}
                                max={selectedProduct?.available_stock || 1}
                                value={quantity}
                                onChange={(val) => setQuantity(val || 1)}
                                className="w-full"
                                size="large"
                            />
                        </div>

                        {/* Shipping Address Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <EnvironmentOutlined className="text-indigo-600" />
                                Shipping Address:
                            </label>
                            {savedAddresses.length > 0 && (
                                <Radio.Group
                                    value={addressChoice}
                                    onChange={(e) => setAddressChoice(e.target.value)}
                                    className="mb-3 block space-y-2"
                                >
                                    <Radio value="saved">Use Saved Address</Radio>
                                    <Radio value="custom">Enter New Delivery Address</Radio>
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
                                    size="large"
                                >
                                    {savedAddresses.map((addr) => (
                                        <Option key={addr._id} value={addr._id}>
                                            {addr.address_line}, {addr.city}, {addr.state} - {addr.postal_code}
                                        </Option>
                                    ))}
                                </Select>
                            ) : (
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <Input
                                        placeholder="Street Address / House No / Apartment"
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
                                        <Input
                                            placeholder="Country"
                                            value={customAddress.country}
                                            onChange={(e) =>
                                                setCustomAddress({ ...customAddress, country: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <CreditCardOutlined className="text-indigo-600" />
                                Payment Method:
                            </label>
                            <Select
                                value={paymentMethod}
                                onChange={(val) => setPaymentMethod(val)}
                                className="w-full"
                                size="large"
                            >
                                <Option value="razorpay">⚡ Pay Online via Razorpay (UPI, GPay, PhonePe, Cards, NetBanking)</Option>
                                <Option value="cash_on_delivery">💵 Cash On Delivery (COD)</Option>
                            </Select>
                        </div>

                        {/* Total Calculation */}
                        <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-semibold">Total Price</span>
                                <div className="text-2xl font-black text-indigo-600">
                                    ₹{((selectedProduct?.selling_price || 0) * quantity).toLocaleString()}
                                </div>
                            </div>
                            <Button
                                type="primary"
                                size="large"
                                loading={submittingOrder}
                                onClick={handlePlaceOrder}
                                className="bg-indigo-600 hover:bg-indigo-500 font-semibold px-8 h-12 rounded-xl"
                            >
                                Confirm & Place Order
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CustomerCatalog;
