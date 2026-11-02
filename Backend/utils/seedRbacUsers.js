import mongoose from "mongoose";
import dotenv from "dotenv";
import { User, Warehouse, Customer } from "../models/index.js";
import { DB_NAME } from "../constants.js";

dotenv.config({ path: "./.env" });

async function seed() {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("Connected to MongoDB for seeding RBAC users...");

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

        // 1. Admin
        let admin = await User.findOne({ email: "admin@inventorypro.com" });
        if (!admin) {
            admin = new User({
                username: "admin_master",
                email: "admin@inventorypro.com",
                password: "Password123!",
                role: "admin",
                isVerified: true,
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
            });
            await admin.save();
            console.log("Created Admin: admin@inventorypro.com / Password123!");
        } else {
            admin.role = "admin";
            admin.isVerified = true;
            admin.password = "Password123!";
            await admin.save();
            console.log("Updated Admin credentials: admin@inventorypro.com");
        }

        // 2. Manager
        let manager = await User.findOne({ email: "manager@inventorypro.com" });
        if (!manager) {
            manager = new User({
                username: "manager_facility",
                email: "manager@inventorypro.com",
                password: "Password123!",
                role: "manager",
                isVerified: true,
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=manager",
                assigned_warehouses: [warehouse._id],
            });
            await manager.save();
            console.log("Created Manager: manager@inventorypro.com / Password123!");
        } else {
            manager.role = "manager";
            manager.isVerified = true;
            manager.password = "Password123!";
            manager.assigned_warehouses = [warehouse._id];
            await manager.save();
            console.log("Updated Manager credentials: manager@inventorypro.com");
        }

        // Also add manager to warehouse managers list
        if (!warehouse.managers.includes(manager._id)) {
            warehouse.managers.push(manager._id);
            await warehouse.save();
        }

        // 3. Customer
        let customer = await User.findOne({ email: "customer@inventorypro.com" });
        if (!customer) {
            customer = new User({
                username: "customer_buyer",
                email: "customer@inventorypro.com",
                password: "Password123!",
                role: "customer",
                isVerified: true,
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=customer",
                phone: "+91 9876543210",
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
            await customer.save();
            console.log("Created Customer: customer@inventorypro.com / Password123!");
        } else {
            customer.role = "customer";
            customer.isVerified = true;
            customer.password = "Password123!";
            await customer.save();
            console.log("Updated Customer credentials: customer@inventorypro.com");
        }

        // Link Customer document
        const existingCustDoc = await Customer.findOne({ user_id: customer._id });
        if (!existingCustDoc) {
            await Customer.create({
                name: customer.username,
                email: customer.email,
                phone: customer.phone || "9876543210",
                address: "Flat 304, Palm Grove Towers, Bangalore",
                user_id: customer._id,
                created_by: admin._id,
            });
        }

        console.log("✅ Seeding complete. All 3 roles ready for login testing!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
}

seed();
