import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User, Warehouse, Product, Order, StockAdjustment, Customer } from "../models/index.js";

import { DB_NAME } from "../constants.js";

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

async function runTests() {
    console.log("🚀 Starting RBAC Multi-Facility Test Suite...");
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    const uniqueSuffix = Date.now();

    const adminUser = await User.create({
        username: `admin_${uniqueSuffix}`,
        email: `admin_${uniqueSuffix}@example.com`,
        password: "Password123!",
        avatar: "avatar.png",
        role: "admin",
    });

    const managerUser = await User.create({
        username: `manager_${uniqueSuffix}`,
        email: `mgr_${uniqueSuffix}@example.com`,
        password: "Password123!",
        avatar: "avatar.png",
        role: "manager",
        assigned_warehouses: [],
    });

    const customerUser1 = await User.create({
        username: `cust1_${uniqueSuffix}`,
        email: `cust1_${uniqueSuffix}@example.com`,
        password: "Password123!",
        avatar: "avatar.png",
        role: "customer",
    });

    const customerUser2 = await User.create({
        username: `cust2_${uniqueSuffix}`,
        email: `cust2_${uniqueSuffix}@example.com`,
        password: "Password123!",
        avatar: "avatar.png",
        role: "customer",
    });

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
        managers: [],
    });

    managerUser.assigned_warehouses = [warehouseA._id];
    await managerUser.save({ validateBeforeSave: false });

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

    let passed = 0;
    let failed = 0;

    const assertCheck = (desc, condition) => {
        if (condition) {
            console.log(`  ✅ PASS: ${desc}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${desc}`);
            failed++;
        }
    };

    try {
        // Test 1: Customer blocked from Admin User Management
        const res1 = await fetch(`${BASE_URL}/users/admin/all`, {
            headers: { Authorization: `Bearer ${customerToken1}` },
        });
        console.log("DEBUG res1 status:", res1.status, await res1.text());
        assertCheck("Customer blocked from Admin User Management (403)", res1.status === 403);

        // Test 2: Customer blocked from Warehouses
        const res2 = await fetch(`${BASE_URL}/warehouses`, {
            headers: { Authorization: `Bearer ${customerToken1}` },
        });
        assertCheck("Customer blocked from Warehouses (403)", res2.status === 403);

        // Test 3: Customer blocked from Suppliers
        const res3 = await fetch(`${BASE_URL}/suppliers`, {
            headers: { Authorization: `Bearer ${customerToken1}` },
        });
        assertCheck("Customer blocked from Suppliers (403)", res3.status === 403);

        // Test 4: Customer cannot view another Customer's order
        const res4 = await fetch(`${BASE_URL}/orders/${order2._id}/details`, {
            headers: { Authorization: `Bearer ${customerToken1}` },
        });
        assertCheck("Customer blocked from another customer's order (403)", res4.status === 403);

        // Test 5: Customer CAN view their own order
        const res5 = await fetch(`${BASE_URL}/orders/${order2._id}/details`, {
            headers: { Authorization: `Bearer ${customerToken2}` },
        });
        assertCheck("Customer CAN view their own order (200)", res5.status === 200);

        // Test 6: Manager blocked from unassigned Warehouse B
        const res6 = await fetch(`${BASE_URL}/warehouses/${warehouseB._id}`, {
            headers: { Authorization: `Bearer ${managerToken}` },
        });
        assertCheck("Manager blocked from unassigned Warehouse B (403)", res6.status === 403);

        // Test 7: Manager CAN access assigned Warehouse A
        const res7 = await fetch(`${BASE_URL}/warehouses/${warehouseA._id}`, {
            headers: { Authorization: `Bearer ${managerToken}` },
        });
        assertCheck("Manager CAN access assigned Warehouse A (200)", res7.status === 200);

        // Test 8: Manager stock adjustment is created as 'pending'
        const res8 = await fetch(`${BASE_URL}/adjustments`, {
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
        const body8 = await res8.json();
        assertCheck(
            "Manager stock adjustment defaults to 'pending'",
            res8.status === 201 && body8.data.status === "pending"
        );
        const adjId = body8.data._id;

        // Test 9: Manager cannot approve their own adjustment (403)
        const res9 = await fetch(`${BASE_URL}/adjustments/${adjId}/approve`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${managerToken}` },
        });
        assertCheck("Manager cannot approve adjustments (403)", res9.status === 403);

        // Test 10: Admin approves pending adjustment (200)
        const res10 = await fetch(`${BASE_URL}/adjustments/${adjId}/approve`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        const body10 = await res10.json();
        console.log("DEBUG res10:", res10.status, body10);
        assertCheck(
            "Admin can approve pending stock adjustments (200)",
            res10.status === 200 && body10.data?.status === "approved"
        );

        // Test 11: Admin blocked from changing own role (403)
        const res11 = await fetch(`${BASE_URL}/users/admin/${adminUser._id}/role`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: "customer" }),
        });
        assertCheck("Admin cannot demote own role (403)", res11.status === 403);

        // Test 12: Customer catalog strips purchase cost
        const res12 = await fetch(`${BASE_URL}/products/catalog`, {
            headers: { Authorization: `Bearer ${customerToken1}` },
        });
        const body12 = await res12.json();
        const catalogItem = (body12.data.products || []).find(
            (p) => p._id.toString() === product._id.toString()
        );
        assertCheck(
            "Customer catalog excludes internal buying_price",
            res12.status === 200 && catalogItem && catalogItem.buying_price === undefined
        );

        // Clean up
        await StockAdjustment.deleteOne({ _id: adjId });
    } catch (e) {
        console.error("Test execution error:", e);
    } finally {
        await User.deleteMany({
            _id: { $in: [adminUser._id, managerUser._id, customerUser1._id, customerUser2._id] },
        });
        await Warehouse.deleteMany({ _id: { $in: [warehouseA._id, warehouseB._id] } });
        await Product.deleteOne({ _id: product._id });
        await Customer.deleteOne({ _id: customerProfile2._id });
        await Order.deleteOne({ _id: order2._id });
        await mongoose.disconnect();
    }

    console.log(`\n================================`);
    console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log(`================================\n`);

    if (failed > 0) process.exit(1);
    process.exit(0);
}

runTests();
