import { useContext } from "react";
import AuthContext from "../context/AuthContext";

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    const role = context.user?.role || "customer";
    const isAdmin = role === "admin";
    const isManager = role === "manager";
    const isCustomer = role === "customer";
    const assignedWarehouses = context.user?.assigned_warehouses || [];

    return {
        ...context,
        role,
        isAdmin,
        isManager,
        isCustomer,
        assignedWarehouses,
    };
};

export default useAuth;

