import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User, Warehouse, Product, Order, StockAdjustment, Customer } from "../models/index.js";

dotenv.config({ path: "./.env" });

const BASE_URL = `http://localhost:${process.env.PORT || 3001}/api/v1`;
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;

const generateTestToken = (user) => {
    return jwt.sign(
        {
            _id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
        },
        ACCESS_SECRET,
        { expiresIn: "1h" }
    );
};

test("RBAC & Multi-Facility Access Control Test Suite", async (t) => {
    await mongoose.connect(process.env.MONGODB_URI);

    // 1. Setup Clean Test Fixtures
    const uniqueSuffix = Date.now();

    const adminUser = await User.create({
        username: `admin_test_${uniqueSuffix}`,
        email: `admin_${uniqueSuffix}@example.com`,
        password: "Password123!",
        avatar: "avatar.png",
        role: "admin",
    });

    const managerUser = await User.create({
        username: `manager_test_${uniqueSuffix}`,
        email: `mgr_${uniqueSuffix}@example.com`,
        password: "Password123!",
        avatar: "avatar.png",
        role: "manager",
        assigned_warehouses: [],
    });

    const customerUser1 = await User.create({
        username: `cust1_test_${uniqueSuffix}`,
        email: `cust1_${uniqueSuffix}@example.com`,
        password: "Password123!",
        avatar: "avatar.png",
        role: "customer",
    });

    const customerUser2 = await User.create({
        username: `cust2_test_${uniqueSuffix}`,
        email: `cust2_${uniqueSuffix}@example.com`,
        password: "Password123!",
        avatar: "avatar.png",
        role: "customer",
    });

    // Create 2 Warehouses: WH-A assigned to Manager, WH-B unassigned
    const warehouseA = await Warehouse.create({
        warehouse_name: `Assigned Facility ${uniqueSuffix}`,
        warehouse_code: `WHA${uniqueSuffix.toString().slice(-4)}`,
        address: { city: "Bangalore", street: "1st Main" },
        created_by: adminUser._id,
        managers: [managerUser._id],
    });

    const warehouseB = await Warehouse.create({
        warehouse_name: `Unassigned Facility ${uniqueSuffix}`,
        warehouse_code: `WHB${uniqueSuffix.toString().slice(-4)}`,
        address: { city: "Hyderabad", street: "2nd Cross" },
        created_by: adminUser._id,
        managers: [], // Manager is NOT assigned here
    });

    // Update manager's assigned_warehouses array
    managerUser.assigned_warehouses = [warehouseA._id];
    await managerUser.save({ validateBeforeSave: false });

    // Create a product
    const product = await Product.create({
        product_name: `RBAC Test Product ${uniqueSuffix}`,
        product_code: `PR${uniqueSuffix.toString().slice(-6)}`,
        category_id: new mongoose.Types.ObjectId(),
        unit_id: new mongoose.Types.ObjectId(),
        buying_price: 100,
        selling_price: 150,
        stock: 50,
        created_by: adminUser._id,
    });

    // Create Customer profile and an order for Customer 2
    const customerProfile2 = await Customer.create({
        name: customerUser2.username,
        email: customerUser2.email,
        phone: "9876543210",
        address: "Hyderabad",
        user_id: customerUser2._id,
        created_by: customerUser2._id,
    });

    const order2 = await Order.create({
        customer_id: customerProfile2._id,
        customer_user_id: customerUser2._id,
        warehouse_id: warehouseA._id,
        total_products: 1,
        sub_total: 150,
        gst: 27,
        total: 177,
        invoice_no: `INV-${uniqueSuffix.toString().slice(-6)}`,
        created_by: customerUser2._id,
    });

    const adminToken = generateTestToken(adminUser);
    const managerToken = generateTestToken(managerUser);
    const customerToken1 = generateTestToken(customerUser1);
    const customerToken2 = generateTestToken(customerUser2);

    // Test 1: Customer blocked from Admin User Management
    await t.test("Customer cannot access Admin User Management (403)", async () => {
        const res = await fetch(`${BASE_URL}/users/admin/all`, {
            headers: { Authorization: `Bearer ${customerToken1}` },
        });
        assert.equal(res.status, 403, "Customer must receive 403 on admin user routes");
    });

    // Test 2: Customer blocked from Warehouses
    await t.test("Customer cannot access Warehouses (403)", async () => {
        const res = await fetch(`${BASE_URL}/warehouses`, {
            headers: { Authorization: `Bearer ${customerToken1}` },
        });
        assert.equal(res.status, 403, "Customer must receive 403 on warehouse routes");
    });

    // Test 3: Customer blocked from Suppliers & Purchase Costs
    await t.test("Customer cannot access Suppliers (403)", async () => {
        const res = await fetch(`${BASE_URL}/suppliers`, {
            headers: { Authorization: `Bearer ${customerToken1}` },
        });
        assert.equal(res.status, 403, "Customer must receive 403 on supplier routes");
    });

    // Test 4: Customer cannot view another Customer's order
    await t.test("Customer cannot access another customer's order (403)", async () => {
        const res = await fetch(`${BASE_URL}/orders/${order2._id}/details`, {
            headers: { Authorization: `Bearer ${customerToken1}` },
        });
        assert.equal(res.status, 403, "Customer 1 must not access Customer 2 order details");
    });

    // Test 5: Customer CAN view their own order
    await t.test("Customer CAN view their own order details (200)", async () => {
        const res = await fetch(`${BASE_URL}/orders/${order2._id}/details`, {
            headers: { Authorization: `Bearer ${customerToken2}` },
        });
        assert.equal(res.status, 200, "Customer 2 should access their own order details");
    });

    // Test 6: Manager blocked from unassigned Warehouse B
    await t.test("Manager cannot access unassigned warehouse (403)", async () => {
        const res = await fetch(`${BASE_URL}/warehouses/${warehouseB._id}`, {
            headers: { Authorization: `Bearer ${managerToken}` },
        });
        assert.equal(res.status, 403, "Manager must be rejected with 403 for unassigned facility");
    });

    // Test 7: Manager CAN access assigned Warehouse A
    await t.test("Manager CAN access assigned warehouse A (200)", async () => {
        const res = await fetch(`${BASE_URL}/warehouses/${warehouseA._id}`, {
            headers: { Authorization: `Bearer ${managerToken}` },
        });
        assert.equal(res.status, 200, "Manager should access assigned facility");
    });

    // Test 8: Manager stock adjustment is created as 'pending' (requires Admin approval)
    let createdAdjId = null;
    await t.test("Manager stock adjustment defaults to 'pending' without mutating stock", async () => {
        const res = await fetch(`${BASE_URL}/adjustments`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${managerToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                warehouse_id: warehouseA._id,
                reason: "cycle_count",
                items: [
                    {
                        product_id: product._id,
                        physical_quantity: 45,
                    },
                ],
                notes: "Manager cycle count finding",
            }),
        });

        assert.equal(res.status, 201, "Adjustment creation should succeed");
        const body = await res.json();
        assert.equal(body.data.status, "pending", "Manager adjustment must be pending Admin approval");
        createdAdjId = body.data._id;
    });

    // Test 9: Manager cannot approve their own adjustment (403)
    await t.test("Manager cannot approve stock adjustments (403)", async () => {
        const res = await fetch(`${BASE_URL}/adjustments/${createdAdjId}/approve`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${managerToken}` },
        });
        assert.equal(res.status, 403, "Manager must not be allowed to approve adjustments");
    });

    // Test 10: Admin approves pending adjustment (200)
    await t.test("Admin can approve pending stock adjustments (200)", async () => {
        const res = await fetch(`${BASE_URL}/adjustments/${createdAdjId}/approve`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert.equal(res.status, 200, "Admin approval must succeed");
        const body = await res.json();
        assert.equal(body.data.status, "approved", "Adjustment must be marked approved");
    });

    // Test 11: Admin blocked from changing own role (403)
    await t.test("Admin cannot change their own role (403)", async () => {
        const res = await fetch(`${BASE_URL}/users/admin/${adminUser._id}/role`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: "customer" }),
        });
        assert.equal(res.status, 403, "Admin must be blocked from self-demotion");
    });

    // Teardown test fixtures
    await User.deleteMany({
        _id: { $in: [adminUser._id, managerUser._id, customerUser1._id, customerUser2._id] },
    });
    await Warehouse.deleteMany({ _id: { $in: [warehouseA._id, warehouseB._id] } });
    await Product.deleteOne({ _id: product._id });
    await Customer.deleteOne({ _id: customerProfile2._id });
    await Order.deleteOne({ _id: order2._id });
    if (createdAdjId) await StockAdjustment.deleteOne({ _id: createdAdjId });

    await mongoose.disconnect();
});
