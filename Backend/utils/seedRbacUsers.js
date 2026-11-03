import mongoose from "mongoose";
import dotenv from "dotenv";
import { User, Warehouse, Customer } from "../models/index.js";
import { Category } from "../models/category.model.js";
import { Unit } from "../models/unit.model.js";
import { Product } from "../models/product.model.js";
import { DB_NAME } from "../constants.js";

dotenv.config({ path: "./.env" });

async function seed() {
    try {
        const mongoUri = process.env.MONGODB_URI?.includes("mongodb")
            ? (process.env.MONGODB_URI.endsWith("/") ? `${process.env.MONGODB_URI}${DB_NAME}` : `${process.env.MONGODB_URI}/${DB_NAME}`)
            : "mongodb://127.0.0.1:27017/IMS";

        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for seeding RBAC users & catalog...");

        // Ensure at least one warehouse exists
        let warehouse = await Warehouse.findOne();
        if (!warehouse) {
            warehouse = await Warehouse.create({
                warehouse_name: "Central Distribution Hub",
                warehouse_code: "WH-CENTRAL",
                address_line1: "100 Industrial Corridor",
                city: "Bangalore",
                state: "Karnataka",
                pincode: "560001",
                capacity: 50000,
                is_active: true,
                is_default: true,
            });
            console.log("Created default warehouse:", warehouse.warehouse_name);
        }

        // Helper to upsert a user with compliant password
        const upsertUser = async ({ email, username, password, role, phone, shipping_addresses = [], assigned_warehouses = [] }) => {
            let u = await User.findOne({ email });
            if (!u) {
                u = new User({
                    username,
                    email,
                    password,
                    role,
                    isVerified: true,
                    phone,
                    shipping_addresses,
                    assigned_warehouses,
                    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
                });
                await u.save();
                console.log(`Created ${role.toUpperCase()}: ${email} / ${password}`);
            } else {
                u.role = role;
                u.isVerified = true;
                u.password = password; // Trigger pre-save bcrypt hash
                if (phone) u.phone = phone;
                if (assigned_warehouses.length) u.assigned_warehouses = assigned_warehouses;
                await u.save();
                console.log(`Updated ${role.toUpperCase()}: ${email} / ${password}`);
            }
            return u;
        };

        // 1. Admins
        const primaryAdmin = await upsertUser({
            email: "rayapatiravitheja@gmail.com",
            username: "thejaklu",
            password: "Admin@123",
            role: "admin",
            phone: "9876543210",
        });

        await upsertUser({
            email: "admin@inventorypro.com",
            username: "admin_master",
            password: "Admin@123",
            role: "admin",
            phone: "9876543210",
        });

        // 2. Manager
        const manager = await upsertUser({
            email: "manager@inventorypro.com",
            username: "manager_facility",
            password: "Manager@123",
            role: "manager",
            phone: "9876543210",
            assigned_warehouses: [warehouse._id],
        });

        if (!warehouse.managers.includes(manager._id)) {
            warehouse.managers.push(manager._id);
            await warehouse.save();
        }

        // 3. Customers
        const customer = await upsertUser({
            email: "99230040998@klu.ac.in",
            username: "tejuu",
            password: "Customer@123",
            role: "customer",
            phone: "9876543210",
            shipping_addresses: [
                {
                    street: "Flat 304, Palm Grove Towers",
                    city: "Bangalore",
                    state: "Karnataka",
                    pincode: "560034",
                    is_default: true,
                },
            ],
        });

        await upsertUser({
            email: "customer@inventorypro.com",
            username: "customer_buyer",
            password: "Customer@123",
            role: "customer",
            phone: "9876543210",
        });

        // Link Customer documents
        const existingCustDoc = await Customer.findOne({ user_id: customer._id });
        if (!existingCustDoc) {
            await Customer.create({
                name: customer.username,
                email: customer.email,
                phone: "9876543210",
                address: "Flat 304, Palm Grove Towers, Bangalore",
                user_id: customer._id,
                created_by: primaryAdmin._id,
            });
        }

        // 4. Ensure Categories & Units exist
        let category = await Category.findOne();
        if (!category) {
            category = await Category.create({
                category_name: "Electronics",
                description: "Consumer Electronics & Gadgets",
                created_by: primaryAdmin._id,
            });
        }

        let unit = await Unit.findOne();
        if (!unit) {
            unit = await Unit.create({
                unit_name: "Piece",
                short_name: "pc",
                created_by: primaryAdmin._id,
            });
        }

        // 5. Ensure sample Products with 8-character codes exist
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            await Product.createProduct({
                product_name: "Dell XPS 13",
                product_code: "DELL9370",
                category_id: category._id,
                unit_id: unit._id,
                buying_price: 45000,
                selling_price: 52000,
                stock: 40,
                min_threshold: 10,
                created_by: primaryAdmin._id,
            });
            console.log("Seeded sample product: DELL9370");
        }

        console.log("\n=======================================================");
        console.log("✅ Seeding complete. All accounts and catalog ready!");
        console.log("=======================================================");
        console.log("Admin Login:    rayapatiravitheja@gmail.com / Admin@123");
        console.log("Admin Fallback: admin@inventorypro.com      / Admin@123");
        console.log("Manager Login:  manager@inventorypro.com    / Manager@123");
        console.log("Customer Login: 99230040998@klu.ac.in       / Customer@123");
        console.log("Customer Alt:   customer@inventorypro.com   / Customer@123");
        console.log("=======================================================\n");

        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
}

seed();
