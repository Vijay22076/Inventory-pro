import React from "react";
import { Layout, Row, Col, Divider } from "antd";
import {
    ShoppingCartOutlined,
    DashboardOutlined,
    MailOutlined,
    SafetyCertificateOutlined,
    ShopOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Footer: AntFooter } = Layout;

const Footer = () => {
    return (
        <AntFooter className="bg-slate-950 text-slate-400 pt-16 pb-8 border-t border-slate-800">
            <div className="container mx-auto px-6 max-w-6xl">
                <Row gutter={[48, 32]} justify="space-between">
                    <Col xs={24} md={10}>
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl font-black text-white tracking-tight">
                                    InventoryPro
                                </span>
                                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-900 text-indigo-300 border border-indigo-700">
                                    Enterprise
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
                                Complete enterprise supply chain, multi-warehouse fulfillment, and consumer buyer storefront with automated Razorpay UPI payments.
                            </p>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <SafetyCertificateOutlined className="text-emerald-400" />
                                    100% ACID Protection
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <ShopOutlined className="text-amber-400" />
                                    Regional Hubs
                                </span>
                            </div>
                        </div>
                    </Col>

                    <Col xs={12} sm={8} md={5}>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                            Portals
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <Link to="/customer/catalog" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                                    <ShoppingCartOutlined className="text-xs text-amber-500" />
                                    Buyer Storefront
                                </Link>
                            </li>
                            <li>
                                <Link to="/customer/orders" className="text-slate-400 hover:text-white transition-colors">
                                    Live Order Tracking
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                                    <DashboardOutlined className="text-xs text-indigo-400" />
                                    Operations ERP
                                </Link>
                            </li>
                            <li>
                                <Link to="/signup" className="text-slate-400 hover:text-white transition-colors">
                                    Register Account
                                </Link>
                            </li>
                        </ul>
                    </Col>

                    <Col xs={12} sm={8} md={5}>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                            Platform
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <a href="#features" className="text-slate-400 hover:text-white transition-colors">
                                    Core Features
                                </a>
                            </li>
                            <li>
                                <a href="#ecosystem" className="text-slate-400 hover:text-white transition-colors">
                                    Dual Architecture
                                </a>
                            </li>
                            <li>
                                <a href="#process" className="text-slate-400 hover:text-white transition-colors">
                                    Fulfillment Process
                                </a>
                            </li>
                        </ul>
                    </Col>

                    <Col xs={24} sm={8} md={4}>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                            Contact & Support
                        </h4>
                        <div className="space-y-3 text-sm">
                            <a
                                href="mailto:rayapatiravitheja@gmail.com"
                                className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <MailOutlined className="text-slate-400" />
                                Support Desk
                            </a>
                            <div className="text-xs text-slate-500">
                                Response window: 24/7 Operations
                            </div>
                        </div>
                    </Col>
                </Row>

                <Divider className="border-slate-800 my-8" />

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p className="m-0">
                        © {new Date().getFullYear()} InventoryPro Enterprise IMS. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <span>MongoDB & Express Backend</span>
                        <span>•</span>
                        <span>React 18 & Vite Frontend</span>
                        <span>•</span>
                        <span>Razorpay Secured</span>
                    </div>
                </div>
            </div>
        </AntFooter>
    );
};

export default Footer;
