import React from "react";
import { Row, Col } from "antd";
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    UndoOutlined,
    ShoppingOutlined,
} from "@ant-design/icons";
import StatCard from "../dashboard/StatCard";

const PurchaseStats = ({ stats }) => {
    return (
        <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
                <StatCard
                    title="Purchases"
                    value={stats.total}
                    icon={
                        <ShoppingOutlined className="text-xl sm:text-2xl text-blue" />
                    }
                    valueStyle={{ color: "#1890ff" }}
                    className="dashboard-stat-card"
                />
            </Col>
            <Col xs={24} sm={12} md={6}>
                <StatCard
                    title="Pending"
                    value={stats.pending}
                    icon={
                        <ClockCircleOutlined className="text-xl sm:text-2xl text-yellow" />
                    }
                    valueStyle={{ color: "#faad14" }}
                    className="dashboard-stat-card"
                />
            </Col>
            <Col xs={24} sm={12} md={6}>
                <StatCard
                    title="Completed"
                    value={stats.completed}
                    icon={
                        <CheckCircleOutlined className="text-xl sm:text-2xl text-green" />
                    }
                    valueStyle={{ color: "#52c41a" }}
                    className="dashboard-stat-card"
                />
            </Col>
            <Col xs={24} sm={12} md={6}>
                <StatCard
                    title="Returned"
                    value={stats.returned}
                    icon={
                        <UndoOutlined className="text-xl sm:text-2xl text-red" />
                    }
                    valueStyle={{ color: "#ff4d4f" }}
                    className="dashboard-stat-card"
                />
            </Col>
        </Row>
    );
};

export default PurchaseStats;
