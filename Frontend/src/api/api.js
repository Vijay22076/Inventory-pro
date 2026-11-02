import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3001/api/v1",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response Interceptor: Handles 401 Token Refresh & Unified Error Propagation
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Friendly error message for offline / disconnected states
        if (!error.response) {
            error.message = "Network Error: Unable to connect to backend server. Please verify your internet connection.";
            return Promise.reject(error);
        }

        // Automatic Token Refresh on 401 Unauthorized (excluding login & refresh-token endpoints)
        if (
            error.response.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/users/login") &&
            !originalRequest.url?.includes("/users/refresh-token") &&
            !originalRequest.url?.includes("/users/current-user")
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshRes = await api.post("/users/refresh-token");
                if (refreshRes.data?.success) {
                    processQueue(null);
                    return api(originalRequest);
                }
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                // Token refresh failed - session has truly expired
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
