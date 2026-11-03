import React from "react";
import { Row, Col, Tag, Steps, Badge } from "antd";
import {
    ShoppingCartOutlined,
    DashboardOutlined,
    SafetyCertificateOutlined,
    CreditCardOutlined,
    ShopOutlined,
    CarOutlined,
    CheckCircleOutlined,
    ThunderboltOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import GradientBackground from "../common/GradientBackground";

const Hero = () => {
    const navigate = useNavigate();

    return (
        <GradientBackground className="py-20 md:py-32" type="blue">
            <Row gutter={[48, 48]} align="middle">
                {/* Left Column: Headline, Subtitle, Badges & Dual CTAs */}
                <Col xs={24} lg={12}>
                    <div className="text-white space-y-7">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Enterprise Multi-Warehouse & Buyer Storefront</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight max-w-xl">
                            Intelligent Inventory, Warehouses & Consumer Storefront
                        </h1>

                        <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-xl">
                            From supplier procurement and regional warehouse balancing to consumer storefront checkout with instant Razorpay UPI payments and live delivery milestone tracking.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-1">
                            <Button
                                type="secondary"
                                size="large"
                                icon={<ShoppingCartOutlined />}
                                iconPosition="left"
                                onClick={() => navigate("/customer/catalog")}
                                className="shadow-lg hover:shadow-xl font-bold"
                            >
                                Customer Storefront
                            </Button>
                            <Button
                                type="outline"
                                size="large"
                                icon={<DashboardOutlined />}
                                iconPosition="left"
                                onClick={() => navigate("/login")}
                                className="font-semibold"
                            >
                                Admin & Manager ERP
                            </Button>
                        </div>

                        {/* Capability Badges */}
                        <div className="pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-white/80">
                            <div className="flex items-center gap-1.5 font-medium">
                                <SafetyCertificateOutlined className="text-emerald-400 text-sm" />
                                <span>100% ACID Isolation</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <CreditCardOutlined className="text-cyan-400 text-sm" />
                                <span>Razorpay UPI & Cards</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <ShopOutlined className="text-amber-400 text-sm" />
                                <span>Multi-Warehouse Hubs</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <CarOutlined className="text-indigo-300 text-sm" />
                                <span>Live Stepper Tracker</span>
                            </div>
                        </div>
                    </div>
                </Col>

                {/* Right Column: Live Interactive Architecture Showcase Card */}
                <Col xs={24} lg={12}>
                    <div className="relative">
                        {/* Glow effects */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-3xl blur-xl opacity-30"></div>

                        {/* Interactive UI Mock Window */}
                        <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/20 p-5 shadow-2xl space-y-4">
                            {/* Window Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                                    <span className="text-slate-400 font-mono ml-2">inventorypro.app</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tag color="green" className="text-[10px] m-0 border-0 font-semibold">
                                        ● API Online
                                    </Tag>
                                    <Tag color="blue" className="text-[10px] m-0 border-0 font-semibold">
                                        Razorpay Gateway
                                    </Tag>
                                </div>
                            </div>

                            {/* Section 1: Visual Order Tracking Stepper */}
                            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700 text-white space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <CarOutlined className="text-cyan-400" />
                                        Live Delivery Progress (#INV-882693)
                                    </span>
                                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                                        Razorpay Verified #abRJFQ8D
                                    </span>
                                </div>
                                <div className="pt-1">
                                    <Steps
                                        size="small"
                                        current={2}
                                        items={[
                                            { title: <span className="text-white text-xs">Placed</span>, description: <span className="text-[10px] text-slate-400">02 Nov</span> },
                                            { title: <span className="text-white text-xs">Paid</span>, description: <span className="text-[10px] text-cyan-400">UPI Verified</span> },
                                            { title: <span className="text-white text-xs">Dispatched</span>, description: <span className="text-[10px] text-amber-400">In Transit</span> },
                                            { title: <span className="text-slate-500 text-xs">Delivered</span>, description: <span className="text-[10px] text-slate-500">Exp. 2 Days</span> },
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* Section 2: Storefront Cart & Multi-Warehouse Allocation */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                {/* Mini Cart Preview */}
                                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-2 text-white">
                                    <div className="flex items-center justify-between text-slate-300 font-bold">
                                        <span className="flex items-center gap-1">
                                            <ShoppingCartOutlined className="text-indigo-400" />
                                            Cart Drawer
                                        </span>
                                        <Badge count={2} size="small" style={{ backgroundColor: "#4f46e5" }} />
                                    </div>
                                    <div className="space-y-1.5 text-[11px] text-slate-300 divide-y divide-slate-700/50">
                                        <div className="flex justify-between pt-1">
                                            <span className="truncate max-w-[130px]">Dell XPS 13</span>
                                            <span className="font-mono text-emerald-400">₹52,000</span>
                                        </div>
                                        <div className="flex justify-between pt-1">
                                            <span className="truncate max-w-[130px]">Air Conditioner</span>
                                            <span className="font-mono text-emerald-400">₹40,000</span>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-[11px]">
                                        <span className="text-slate-400">Total (incl. GST):</span>
                                        <span className="font-bold text-white text-sm">₹1,08,560</span>
                                    </div>
                                </div>

                                {/* Regional Warehouse Stock Allocation */}
                                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-2 text-white">
                                    <div className="flex items-center justify-between text-slate-300 font-bold">
                                        <span className="flex items-center gap-1">
                                            <ShopOutlined className="text-amber-400" />
                                            Regional Hubs
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">Bin A-01-01</span>
                                    </div>
                                    <div className="space-y-2 text-[11px]">
                                        <div className="bg-slate-900/60 p-1.5 rounded flex justify-between items-center">
                                            <span>Central Hub (Delhi)</span>
                                            <span className="font-bold text-emerald-400">42 in stock</span>
                                        </div>
                                        <div className="bg-slate-900/60 p-1.5 rounded flex justify-between items-center">
                                            <span>Regional Hub (Blr)</span>
                                            <span className="font-bold text-amber-400">18 in stock</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                                        <ThunderboltOutlined className="text-cyan-400" />
                                        <span>Automated stock transfer sync</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Automated Refund Tag & Email Alert Notice */}
                            <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-800/50 flex items-center justify-between text-xs text-emerald-300">
                                <div className="flex items-center gap-2">
                                    <CheckCircleOutlined className="text-emerald-400" />
                                    <span>Return Approved & Razorpay Refund Initiated</span>
                                </div>
                                <span className="font-mono text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded">
                                    💳 Refund: 35620943 (₹22.42)
                                </span>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </GradientBackground>
    );
};

export default Hero;
