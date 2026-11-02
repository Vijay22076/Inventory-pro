import mongoose from "mongoose";
import dotenv from "dotenv";
import { DB_NAME } from "../constants.js";

dotenv.config({ path: "./.env" });

const BASE_URL = `http://localhost:${process.env.PORT || 3001}/api/v1`;

async function request(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };
    const config = {
        method: options.method || "GET",
        headers,
    };
    if (options.body) {
        config.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, config);
    let data = null;
    try {
        data = await res.json();
    } catch {
        // empty or non-json
    }
    return {
        status: res.status,
        data,
    };
}

async function runE2EVerification() {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("==========================================================");
    console.log("🚀 Running End-to-End Unified RBAC & WMS Integration Tests");
    console.log("==========================================================\n");

    let passed = 0;
    let failed = 0;

    const assert = (condition, msg) => {
        if (condition) {
            console.log(`  ✅ PASS: ${msg}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${msg}`);
            failed++;
        }
    };

    // 1. Admin Login
    const adminLoginRes = await request("/users/login", {
        method: "POST",
        body: {
            email: "admin@inventorypro.com",
            password: "Password123!",
        },
    });
    assert(adminLoginRes.status === 200, "Admin login successful (200)");
    const adminToken = adminLoginRes.data?.data?.accessToken;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    assert(adminLoginRes.data?.data?.user?.role === "admin", "Admin role confirmed in login payload");

    // 2. Admin User Management
    const usersRes = await request("/users/admin/all", { headers: adminHeaders });
    assert(usersRes.status === 200, "Admin can list all organization users (/users/admin/all)");
    const usersList = usersRes.data?.data?.users || usersRes.data?.data;
    assert(Array.isArray(usersList) && usersList.length >= 3, "All seeded users returned with roles");

    // 3. Admin Warehouses Overview
    const adminWhRes = await request("/warehouses", { headers: adminHeaders });
    assert(adminWhRes.status === 200, "Admin can view all warehouses");

    // 4. Manager Login
    const mgrLoginRes = await request("/users/login", {
        method: "POST",
        body: {
            email: "manager@inventorypro.com",
            password: "Password123!",
        },
    });
    assert(mgrLoginRes.status === 200, "Manager login successful (200)");
    const mgrToken = mgrLoginRes.data?.data?.accessToken;
    const mgrHeaders = { Authorization: `Bearer ${mgrToken}` };
    assert(mgrLoginRes.data?.data?.user?.role === "manager", "Manager role confirmed in login payload");

    // 5. Manager RBAC Security checks
    const mgrAdminAttempt = await request("/users/admin/all", { headers: mgrHeaders });
    assert(mgrAdminAttempt.status === 403, "Manager blocked from Admin user management (403)");

    const mgrWhRes = await request("/warehouses", { headers: mgrHeaders });
    assert(mgrWhRes.status === 200, "Manager can access assigned warehouses (/warehouses)");

    // 6. Customer Login
    const custLoginRes = await request("/users/login", {
        method: "POST",
        body: {
            email: "customer@inventorypro.com",
            password: "Password123!",
        },
    });
    assert(custLoginRes.status === 200, "Customer login successful (200)");
    const custToken = custLoginRes.data?.data?.accessToken;
    const custHeaders = { Authorization: `Bearer ${custToken}` };
    assert(custLoginRes.data?.data?.user?.role === "customer", "Customer role confirmed in login payload");

    // 7. Customer Portal Security Boundaries
    const custWhAttempt = await request("/warehouses", { headers: custHeaders });
    assert(custWhAttempt.status === 403, "Customer blocked from internal warehouses module (403)");

    const custSupplierAttempt = await request("/suppliers", { headers: custHeaders });
    assert(custSupplierAttempt.status === 403, "Customer blocked from internal suppliers module (403)");

    // 8. Customer Product Catalog Browsing
    const catalogRes = await request("/products/catalog", { headers: custHeaders });
    assert(catalogRes.status === 200, "Customer can browse catalog (/products/catalog)");
    if (catalogRes.data?.data?.products && catalogRes.data.data.products.length > 0) {
        const sample = catalogRes.data.data.products[0];
        assert(sample.buying_price === undefined, "Catalog strictly excludes internal buying_price");
        assert(sample.warehouse_bins === undefined, "Catalog strictly excludes warehouse storage bin locations");
        assert(typeof sample.selling_price === "number", "Catalog exposes clean retail selling price");
    }

    // 9. Customer Profile & Shipping Address CRUD
    const profileUpdateRes = await request("/users/customer/profile", {
        method: "PUT",
        headers: custHeaders,
        body: { phone: "+91 9998887776" },
    });
    assert(profileUpdateRes.status === 200, "Customer can update own profile phone number");

    const addAddressRes = await request("/users/customer/shipping-addresses", {
        method: "POST",
        headers: custHeaders,
        body: {
            address_line: "123 Tech Park Residency",
            city: "Bangalore",
            state: "Karnataka",
            postal_code: "560100",
            country: "India",
            is_default: true,
        },
    });
    assert(addAddressRes.status === 201, "Customer can add saved delivery destination");

    // 10. Customer Order Placement & Workflow
    const productsRes = await request("/products", { headers: adminHeaders });
    let product =
        productsRes.data?.data?.products?.[0] ||
        productsRes.data?.data?.[0] ||
        catalogRes.data?.data?.products?.[0];

    if (!product) {
        const { Product, Unit, Category } = await import("../models/index.js");
        const adminId = adminLoginRes.data.data.user._id;
        let unit = await Unit.findOne();
        if (!unit) unit = await Unit.create({ unit_name: "Piece", short_name: "pc", created_by: adminId });
        let cat = await Category.findOne();
        if (!cat) cat = await Category.create({ category_name: "Electronics", created_by: adminId });
        const code = "P" + Math.floor(1000 + Math.random() * 9000);
        product = await Product.create({
            product_name: "Pro Gaming Mouse",
            product_code: code,
            category_id: cat._id,
            unit_id: unit._id,
            buying_price: 500,
            selling_price: 1200,
            stock: 50,
            available_stock: 50,
            product_image: "https://api.dicebear.com/7.x/shapes/svg?seed=mouse",
            created_by: adminId,
        });
    }

    if (product) {
        const checkoutRes = await request("/orders/checkout", {
            method: "POST",
            headers: custHeaders,
            body: {
                items: [{ product_id: product._id, quantity: 1 }],
                shipping_address: {
                    address_line: "123 Tech Park Residency",
                    city: "Bangalore",
                    state: "Karnataka",
                    postal_code: "560100",
                    country: "India",
                },
                payment_method: "cash_on_delivery",
            },
        });
        if (checkoutRes.status !== 201) {
            console.log("CHECKOUT ERROR:", checkoutRes.status, checkoutRes.data);
        }
        assert(checkoutRes.status === 201, "Customer checkout places new order successfully (201)");

        const placedOrder = checkoutRes.data?.data;
        assert(placedOrder && placedOrder.invoice_no, "Order generated invoice_no and assigned for fulfillment");

        // 11. Customer can only access their own order
        const ownOrderRes = await request(`/orders/${placedOrder._id}`, { headers: custHeaders });
        assert(ownOrderRes.status === 200, "Customer can view own order details");

        // 12. Returns submission and processing
        // Mark order as completed so return can be requested
        await request(`/orders/${placedOrder._id}/status`, {
            method: "PATCH",
            headers: adminHeaders,
            body: { order_status: "completed" },
        });

        const returnReqRes = await request("/returns/request", {
            method: "POST",
            headers: custHeaders,
            body: {
                order_id: placedOrder._id,
                product_id: product._id,
                quantity: 1,
                reason: "defective",
                notes: "Item malfunctioned upon arrival",
            },
        });
        assert(returnReqRes.status === 201, "Customer can submit return request for delivered order (201)");

        const returnDoc = returnReqRes.data?.data;

        // Customer view returns
        const myReturnsRes = await request("/returns/my-returns", { headers: custHeaders });
        assert(myReturnsRes.status === 200, "Customer can view own return requests (/returns/my-returns)");

        // 13. Admin/Manager processes return and replenishes stock
        const targetWhId = adminWhRes.data?.data?.[0]?._id;
        const processReturnRes = await request(`/returns/${returnDoc._id}/process`, {
            method: "PUT",
            headers: mgrHeaders,
            body: {
                status: "received",
                resolution_notes: "Inspected at warehouse dock, approved and restocked",
                target_warehouse_id: targetWhId,
            },
        });
        if (processReturnRes.status !== 200) {
            console.log("PROCESS RETURN ERROR:", processReturnRes.status, processReturnRes.data);
        }
        assert(processReturnRes.status === 200, "Manager can receive and restock return into facility stock (200)");
        assert(processReturnRes.data?.data?.status === "received", "Return status transitioned to 'received'");
    }

    console.log("\n==========================================================");
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("==========================================================");

    process.exit(failed > 0 ? 1 : 0);
}

runE2EVerification();
