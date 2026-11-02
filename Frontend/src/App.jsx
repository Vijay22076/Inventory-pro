import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import EmailVerify from "./pages/auth/EmailVerify";
import ResetPassword from "./pages/auth/ResetPassword";
import Signup from "./pages/auth/Signup";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorPage from "./components/error/ErrorPage";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./components/ProfilePage";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/layout/DashboardLayout";
import CustomerLayout from "./components/layout/CustomerLayout";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Category from "./pages/Category";
import Reports from "./pages/Reports";
import Warehouses from "./pages/Warehouses";

// Upgraded unified role pages
import UserManagement from "./pages/admin/UserManagement";
import Returns from "./pages/Returns";
import CustomerCatalog from "./pages/customer/CustomerCatalog";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerReturns from "./pages/customer/CustomerReturns";
import CustomerProfile from "./pages/customer/CustomerProfile";

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <Toaster />
                    <div>
                        <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route
                            path="/reset-password"
                            element={<ResetPassword />}
                        />

                        {/* Email verification route */}
                        <Route
                            path="/email-verify"
                            element={
                                <ProtectedRoute requireVerified={false}>
                                    <EmailVerify />
                                </ProtectedRoute>
                            }
                        />
                        {/* Profile page (protected) */}
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin & Manager ERP Operations */}
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute allowedRoles={["admin", "manager"]}>
                                    <DashboardLayout />
                                </ProtectedRoute>
                            }
                        >
                            {/* Admin & Manager Dashboard */}
                            <Route
                                path="dashboard"
                                element={
                                    <ProtectedRoute allowedRoles={["admin", "manager"]}>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Admin-only User & Role Management */}
                            <Route
                                path="admin/users"
                                element={
                                    <ProtectedRoute allowedRoles={["admin"]}>
                                        <UserManagement />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Warehouse Management (Admin: All / Manager: Assigned) */}
                            <Route
                                path="warehouses"
                                element={
                                    <ProtectedRoute allowedRoles={["admin", "manager"]}>
                                        <Warehouses />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Inventory & Products */}
                            <Route
                                path="products"
                                element={
                                    <ProtectedRoute allowedRoles={["admin", "manager"]}>
                                        <Products />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Orders & Fulfillment */}
                            <Route
                                path="orders"
                                element={
                                    <ProtectedRoute allowedRoles={["admin", "manager"]}>
                                        <Orders />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="purchases"
                                element={<Navigate to="/products" replace />}
                            />

                            {/* Customer Returns Management */}
                            <Route
                                path="returns"
                                element={
                                    <ProtectedRoute allowedRoles={["admin", "manager"]}>
                                        <Returns />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Admin-only Modules */}
                            <Route
                                path="customers"
                                element={
                                    <ProtectedRoute allowedRoles={["admin"]}>
                                        <Customers />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="suppliers"
                                element={<Navigate to="/products" replace />}
                            />
                            <Route
                                path="categories"
                                element={
                                    <ProtectedRoute allowedRoles={["admin"]}>
                                        <Category />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="reports/*"
                                element={
                                    <ProtectedRoute allowedRoles={["admin", "manager"]}>
                                        <Reports />
                                    </ProtectedRoute>
                                }
                            />
                        </Route>

                        {/* Dedicated Customer Storefront Portal */}
                        <Route
                            path="/customer"
                            element={
                                <ProtectedRoute allowedRoles={["customer", "admin", "manager"]}>
                                    <CustomerLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route
                                index
                                element={<Navigate to="/customer/catalog" replace />}
                            />
                            <Route
                                path="catalog"
                                element={<CustomerCatalog />}
                            />
                            <Route
                                path="orders"
                                element={<CustomerOrders />}
                            />
                            <Route
                                path="returns"
                                element={<CustomerReturns />}
                            />
                            <Route
                                path="profile"
                                element={<CustomerProfile />}
                            />
                        </Route>

                        {/* Backward-compatible Portal Route Aliases & Direct Redirects */}
                        <Route
                            path="/portal/orders"
                            element={<Navigate to="/customer/orders" replace />}
                        />
                        <Route
                            path="/portal/returns"
                            element={<Navigate to="/customer/returns" replace />}
                        />
                        <Route
                            path="/portal/catalog"
                            element={<Navigate to="/customer/catalog" replace />}
                        />
                        <Route
                            path="/portal"
                            element={<Navigate to="/customer/catalog" replace />}
                        />

                        {/* catch all */}
                        <Route path="/*" element={<ErrorPage />} />
                    </Routes>
                </div>
            </BrowserRouter>
        </CartProvider>
    </AuthProvider>
    );
}

export default App;

