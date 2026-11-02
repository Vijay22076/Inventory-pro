import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/api";

export const useWarehouses = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [ledgerTotal, setLedgerTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchWarehouses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get("/warehouses");
            if (response.data.success) {
                setWarehouses(response.data.data);
            }
        } catch (err) {
            console.error("Fetch warehouses error:", err);
            const msg = err.response?.data?.message || "Failed to load warehouses";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const createWarehouse = async (data) => {
        try {
            setLoading(true);
            const response = await api.post("/warehouses", data);
            if (response.data.success) {
                toast.success("Warehouse created successfully");
                await fetchWarehouses();
                return response.data.data;
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to create warehouse";
            toast.error(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateWarehouse = async (id, data) => {
        try {
            setLoading(true);
            const response = await api.put(`/warehouses/${id}`, data);
            if (response.data.success) {
                toast.success("Warehouse updated successfully");
                await fetchWarehouses();
                return response.data.data;
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update warehouse";
            toast.error(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteWarehouse = async (id) => {
        try {
            setLoading(true);
            const response = await api.delete(`/warehouses/${id}`);
            if (response.data.success) {
                toast.success("Warehouse deleted successfully");
                await fetchWarehouses();
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to delete warehouse";
            toast.error(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const fetchWarehouseStock = async (id, query = {}) => {
        try {
            const params = new URLSearchParams(query);
            const response = await api.get(`/warehouses/${id}/stock?${params.toString()}`);
            if (response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to fetch warehouse stock");
            return [];
        }
    };

    // Transfers
    const fetchTransfers = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const params = new URLSearchParams(filters);
            const response = await api.get(`/transfers?${params.toString()}`);
            if (response.data.success) {
                setTransfers(response.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load stock transfers");
        } finally {
            setLoading(false);
        }
    }, []);

    const createTransfer = async (data) => {
        try {
            setLoading(true);
            const response = await api.post("/transfers", data);
            if (response.data.success) {
                toast.success("Stock transfer requested successfully");
                await fetchTransfers();
                return response.data.data;
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to create stock transfer";
            toast.error(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const dispatchTransfer = async (id, carrierDetails) => {
        try {
            setLoading(true);
            const response = await api.patch(`/transfers/${id}/dispatch`, { carrier_details: carrierDetails });
            if (response.data.success) {
                toast.success("Transfer marked In-Transit (Stock deducted from source)");
                await fetchTransfers();
                return response.data.data;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to dispatch transfer");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const receiveTransfer = async (id) => {
        try {
            setLoading(true);
            const response = await api.patch(`/transfers/${id}/receive`);
            if (response.data.success) {
                toast.success("Transfer completed (Stock added to destination)");
                await fetchTransfers();
                return response.data.data;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to receive transfer");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const cancelTransfer = async (id) => {
        try {
            setLoading(true);
            const response = await api.patch(`/transfers/${id}/cancel`);
            if (response.data.success) {
                toast.success("Stock transfer cancelled");
                await fetchTransfers();
                return response.data.data;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to cancel transfer");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Adjustments
    const fetchAdjustments = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const params = new URLSearchParams(filters);
            const response = await api.get(`/adjustments?${params.toString()}`);
            if (response.data.success) {
                setAdjustments(response.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load stock adjustments");
        } finally {
            setLoading(false);
        }
    }, []);

    const createAdjustment = async (data) => {
        try {
            setLoading(true);
            const response = await api.post("/adjustments", data);
            if (response.data.success) {
                toast.success("Stock adjustment reconciled and logged successfully");
                await fetchAdjustments();
                return response.data.data;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to apply adjustment");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const approveAdjustment = async (id) => {
        try {
            setLoading(true);
            const response = await api.put(`/adjustments/${id}/approve`);
            if (response.data.success) {
                toast.success("Adjustment approved and inventory updated");
                await fetchAdjustments();
                return response.data.data;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to approve adjustment");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const rejectAdjustment = async (id, notes = "") => {
        try {
            setLoading(true);
            const response = await api.put(`/adjustments/${id}/reject`, { notes });
            if (response.data.success) {
                toast.success("Adjustment rejected");
                await fetchAdjustments();
                return response.data.data;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reject adjustment");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Stock Ledger
    const fetchLedger = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const params = new URLSearchParams(filters);
            const response = await api.get(`/stock-ledger?${params.toString()}`);
            if (response.data.success) {
                setLedgerEntries(response.data.data.entries);
                setLedgerTotal(response.data.data.total);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load stock ledger");
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        warehouses,
        transfers,
        adjustments,
        ledgerEntries,
        ledgerTotal,
        loading,
        error,
        fetchWarehouses,
        createWarehouse,
        updateWarehouse,
        deleteWarehouse,
        fetchWarehouseStock,
        fetchTransfers,
        createTransfer,
        dispatchTransfer,
        receiveTransfer,
        cancelTransfer,
        fetchAdjustments,
        createAdjustment,
        approveAdjustment,
        rejectAdjustment,
        fetchLedger,
    };
};
