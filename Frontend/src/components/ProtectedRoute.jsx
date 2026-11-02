import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { Spin } from "antd";

const ProtectedRoute = ({
    children,
    requireVerified = false,
    allowedRoles = [],
}) => {
    const { authenticated, loading, user } = useContext(AuthContext);
    const location = useLocation();

    // If still loading, show a spinner
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-3">
                <Spin size="large" />
                <span className="text-sm text-slate-500 font-medium">Loading...</span>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!authenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If verification is required but user is not verified, redirect to verification page
    if (requireVerified && user && !user.isVerified) {
        return <Navigate to="/verify-email" replace />;
    }

    // Role-based access control check
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        if (user.role === "customer") {
            return <Navigate to="/customer/catalog" replace />;
        }
        return <Navigate to="/" replace />;
    }

    // If authenticated (and verified if required), render the children
    return children;
};

export default ProtectedRoute;
