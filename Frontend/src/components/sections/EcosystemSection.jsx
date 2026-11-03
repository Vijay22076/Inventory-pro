import React from "react";
import { Row, Col, Tag, Button } from "antd";
import {
    ShoppingCartOutlined,
    DashboardOutlined,
    CheckCircleOutlined,
    ArrowRightOutlined,
    ShopOutlined,
    CreditCardOutlined,
    CarOutlined,
    FilePdfOutlined,
    BarcodeOutlined,
    RollbackOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import SectionTitle from "../common/SectionTitle";

const EcosystemSection = () => {
    const navigate = useNavigate();

    return (
        <section id="ecosystem" className="py-24 bg-slate-50 border-y border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionTitle
                    overline="DUAL PORTAL ARCHITECTURE"
                    title="Tailored for Operations & Consumers"
                    description="InventoryPro bridges the gap between back-office warehouse logistics and consumer-facing retail purchasing."
                />

                <Row gutter={[32, 32]} className="mt-16">
                    {/* Portal 1: Customer Buyer Storefront */}
                    <Col xs={24} lg={12}>
                        <div className="h-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 text-2xl">
                                        <ShoppingCartOutlined />
                                    </div>
                                    <Tag color="gold" className="font-bold text-xs uppercase px-3 py-1 rounded-full border-0">
                                        Buyer Experience
                                    </Tag>
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                                    Customer Buyer Storefront
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                    A consumer shopping storefront with left-sidebar navigation, live stock counts, and express checkout.
                                </p>

                                <ul className="space-y-3.5 mb-8 text-sm text-slate-700">
                                    <li className="flex items-start gap-3">
                                        <CheckCircleOutlined className="text-emerald-500 mt-1" />
                                        <span><strong>Multi-Item Shopping Cart:</strong> Slide-out drawer with quantity steppers and auto GST.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CreditCardOutlined className="text-cyan-600 mt-1" />
                                        <span><strong>Razorpay UPI Checkout:</strong> GPay, PhonePe, QR Code scanning, and Cards.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CarOutlined className="text-indigo-600 mt-1" />
                                        <span><strong>Visual Order Stepper:</strong> Live 4-stage tracking timeline in order details.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <RollbackOutlined className="text-amber-600 mt-1" />
                                        <span><strong>Automated Refunds:</strong> Instant Razorpay refunds credited on approved returns.</span>
                                    </li>
                                </ul>
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                icon={<ArrowRightOutlined />}
                                onClick={() => navigate("/customer/catalog")}
                                className="bg-amber-600 hover:bg-amber-500 rounded-xl font-bold h-12 shadow-sm w-full"
                            >
                                Open Customer Storefront
                            </Button>
                        </div>
                    </Col>

                    {/* Portal 2: Enterprise Admin ERP */}
                    <Col xs={24} lg={12}>
                        <div className="h-full bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-white group">
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 text-2xl">
                                        <DashboardOutlined />
                                    </div>
                                    <Tag color="cyan" className="font-bold text-xs uppercase px-3 py-1 rounded-full border-0">
                                        Business & Operations
                                    </Tag>
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-3">
                                    Enterprise Operations ERP
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                    Dark high-contrast ERP command center for warehouse managers, inventory controllers, and administrators.
                                </p>

                                <ul className="space-y-3.5 mb-8 text-sm text-slate-300">
                                    <li className="flex items-start gap-3">
                                        <ShopOutlined className="text-indigo-400 mt-1" />
                                        <span><strong>Multi-Warehouse Network:</strong> Regional hubs, bin locations (A-01-01), and transfer workflows.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <BarcodeOutlined className="text-cyan-400 mt-1" />
                                        <span><strong>Barcodes & QR Scanning:</strong> Automated Code128 generation for physical bin scanning.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <FilePdfOutlined className="text-rose-400 mt-1" />
                                        <span><strong>Streaming Tax Invoices:</strong> On-the-fly branded A4 PDF invoices with full tax breakdowns.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircleOutlined className="text-emerald-400 mt-1" />
                                        <span><strong>ACID Concurrency:</strong> Concurrency `$gte` guards preventing negative stockouts.</span>
                                    </li>
                                </ul>
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                icon={<ArrowRightOutlined />}
                                onClick={() => navigate("/login")}
                                className="bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold h-12 shadow-sm w-full"
                            >
                                Access Operations ERP
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>
        </section>
    );
};

export default EcosystemSection;
