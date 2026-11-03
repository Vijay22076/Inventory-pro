import mongoose from "mongoose";
import dotenv from "dotenv";
import {
    User,
    Warehouse,
    WarehouseStock,
    StockLedger,
    Customer,
} from "../models/index.js";
import { Category } from "../models/category.model.js";
import { Unit } from "../models/unit.model.js";
import { Product } from "../models/product.model.js";
import { DB_NAME } from "../constants.js";

dotenv.config({ path: "./.env" });

async function resetAllData() {
    try {
        const mongoUri = process.env.MONGODB_URI?.includes("mongodb")
            ? (process.env.MONGODB_URI.endsWith("/")
                  ? `${process.env.MONGODB_URI}${DB_NAME}`
                  : `${process.env.MONGODB_URI}/${DB_NAME}`)
            : "mongodb://127.0.0.1:27017/IMS";

        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for Complete Fresh Reset...");

        // 1. Wipe all collections
        const collections = [
            "users",
            "warehouses",
            "warehousestocks",
            "stockledgers",
            "stockadjustments",
            "stocktransfers",
            "products",
            "categories",
            "units",
            "customers",
            "orders",
            "orderdetails",
            "returnrequests",
            "purchases",
            "purchasedetails",
            "suppliers",
        ];

        for (const colName of collections) {
            try {
                await mongoose.connection.collection(colName).deleteMany({});
                console.log(`- Cleared ${colName}`);
            } catch (err) {
                // Ignore collection if does not exist
            }
        }
        console.log("\nAll old collections wiped successfully!\n");

        // Helper to create user (invoking pre-save hook for bcrypt)
        const createUser = async (userData) => {
            const user = new User(userData);
            await user.save();
            return user;
        };

        // 2. Create Users first
        // Primary Admin
        const adminUser = await createUser({
            username: "thejaklu",
            email: "rayapatiravitheja@gmail.com",
            password: "Admin@123",
            role: "admin",
            phone: "9876543210",
            isVerified: true,
            avatar: "https://api.dicebear.com/7.x/initials/svg?seed=thejaklu",
        });

        // Backup Admin
        await createUser({
            username: "admin_master",
            email: "admin@inventorypro.com",
            password: "Admin@123",
            role: "admin",
            phone: "9876543210",
            isVerified: true,
            avatar: "https://api.dicebear.com/7.x/initials/svg?seed=admin_master",
        });

        // Primary Customer
        const customerUser = await createUser({
            username: "tejuu",
            email: "99230040998@klu.ac.in",
            password: "Customer@123",
            role: "customer",
            phone: "9876543210",
            isVerified: true,
            avatar: "https://api.dicebear.com/7.x/initials/svg?seed=tejuu",
            shipping_addresses: [
                {
                    street: "Flat 402, High-Tech Towers",
                    address_line: "Near Silicon Square, Whitefield",
                    city: "Bangalore",
                    state: "Karnataka",
                    pincode: "560066",
                    postal_code: "560066",
                    country: "India",
                    is_default: true,
                },
            ],
        });

        // Backup Customer
        await createUser({
            username: "customer_buyer",
            email: "customer@inventorypro.com",
            password: "Customer@123",
            role: "customer",
            phone: "9876543210",
            isVerified: true,
            avatar: "https://api.dicebear.com/7.x/initials/svg?seed=customer_buyer",
        });

        // Link Customer Document for tejuu
        await Customer.create({
            name: "tejuu",
            email: "99230040998@klu.ac.in",
            phone: "9876543210",
            address: "Flat 402, High-Tech Towers, Whitefield, Bangalore",
            user_id: customerUser._id,
            created_by: adminUser._id,
        });

        // Manager (temporarily without warehouse assignment)
        const managerUser = await createUser({
            username: "manager_facility",
            email: "manager@inventorypro.com",
            password: "Manager@123",
            role: "manager",
            phone: "9876543210",
            isVerified: true,
            avatar: "https://api.dicebear.com/7.x/initials/svg?seed=manager_facility",
        });

        console.log("Created Admin, Customer, and Manager accounts");

        // 3. Create Warehouses (with created_by: adminUser._id)
        const centralWh = await Warehouse.create({
            warehouse_name: "Central Distribution Hub",
            warehouse_code: "WH-CENTRAL",
            type: "central",
            address: {
                street: "100 Industrial Expressway",
                city: "Bangalore",
                state: "Karnataka",
                pincode: "560001",
                country: "India",
            },
            total_capacity_sqft: 50000,
            is_active: true,
            is_default: true,
            managers: [managerUser._id],
            created_by: adminUser._id,
        });

        const southWh = await Warehouse.create({
            warehouse_name: "South Regional Hub",
            warehouse_code: "WH-SOUTH",
            type: "regional_hub",
            address: {
                street: "45 Port Road",
                city: "Chennai",
                state: "Tamil Nadu",
                pincode: "600001",
                country: "India",
            },
            total_capacity_sqft: 30000,
            is_active: true,
            is_default: false,
            managers: [managerUser._id],
            created_by: adminUser._id,
        });

        await Warehouse.create({
            warehouse_name: "North Regional Hub",
            warehouse_code: "WH-NORTH",
            type: "regional_hub",
            address: {
                street: "12 Logistics Park",
                city: "Delhi NCR",
                state: "Delhi",
                pincode: "110001",
                country: "India",
            },
            total_capacity_sqft: 40000,
            is_active: true,
            is_default: false,
            created_by: adminUser._id,
        });

        // Assign warehouses to manager
        managerUser.assigned_warehouses = [centralWh._id, southWh._id];
        await managerUser.save({ validateBeforeSave: false });

        console.log("Created 3 Regional Warehouses with Manager assigned");

        // 4. Create Standard Categories
        const catElectronics = await Category.create({
            category_name: "Electronics",
            description: "Computers, Mobile Devices & Smart Gadgets",
            created_by: adminUser._id,
        });

        const catAppliances = await Category.create({
            category_name: "Home Appliances",
            description: "Air Conditioners, Refrigerators & Smart Home Gear",
            created_by: adminUser._id,
        });

        const catFashion = await Category.create({
            category_name: "Fashion & Apparel",
            description: "Men & Women Designer Clothing",
            created_by: adminUser._id,
        });

        const catPersonalCare = await Category.create({
            category_name: "Personal Care",
            description: "Haircare, Skincare & Health Supplies",
            created_by: adminUser._id,
        });

        console.log("Created 4 Categories");

        // 5. Create Standard Units
        const unitPiece = await Unit.create({
            unit_name: "Piece",
            short_name: "pc",
            created_by: adminUser._id,
        });

        const unitBox = await Unit.create({
            unit_name: "Box",
            short_name: "bx",
            created_by: adminUser._id,
        });

        const unitKg = await Unit.create({
            unit_name: "Kilogram",
            short_name: "kg",
            created_by: adminUser._id,
        });

        const unitSet = await Unit.create({
            unit_name: "Set",
            short_name: "set",
            created_by: adminUser._id,
        });

        console.log("Created 4 Units");

        // 6. Create Fresh Catalog Products (All with strict 8-character uppercase alphanumeric codes)
        const productsData = [
            {
                product_name: "Dell XPS 13",
                product_code: "DELL9370",
                category_id: catElectronics._id,
                unit_id: unitPiece._id,
                buying_price: 45000,
                selling_price: 52000,
                stock: 40,
                min_threshold: 10,
                product_image:
                    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80",
                bin_location: "A-01-01",
            },
            {
                product_name: "HP 15S Laptop",
                product_code: "HP15UC27",
                category_id: catElectronics._id,
                unit_id: unitPiece._id,
                buying_price: 32000,
                selling_price: 38500,
                stock: 35,
                min_threshold: 10,
                product_image:
                    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80",
                bin_location: "A-01-02",
            },
            {
                product_name: "Air Conditioner 1.5 Ton",
                product_code: "HVAC123C",
                category_id: catAppliances._id,
                unit_id: unitPiece._id,
                buying_price: 30000,
                selling_price: 40000,
                stock: 25,
                min_threshold: 8,
                product_image:
                    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80",
                bin_location: "B-02-01",
            },
            {
                product_name: "Formal Shirt & Trouser Set",
                product_code: "SHRT618E",
                category_id: catFashion._id,
                unit_id: unitSet._id,
                buying_price: 1100,
                selling_price: 1899,
                stock: 60,
                min_threshold: 15,
                product_image:
                    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
                bin_location: "C-01-01",
            },
            {
                product_name: "Bare Anatomy Rosemary Shampoo",
                product_code: "ROSE476T",
                category_id: catPersonalCare._id,
                unit_id: unitPiece._id,
                buying_price: 350,
                selling_price: 599,
                stock: 80,
                min_threshold: 20,
                product_image:
                    "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80",
                bin_location: "D-03-01",
            },
            {
                product_name: "Fire-Boltt Smart Watch",
                product_code: "WCH123WS",
                category_id: catElectronics._id,
                unit_id: unitPiece._id,
                buying_price: 1800,
                selling_price: 2999,
                stock: 50,
                min_threshold: 15,
                product_image:
                    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
                bin_location: "A-02-03",
            },
        ];

        for (const item of productsData) {
            const product = await Product.create({
                product_name: item.product_name,
                product_code: item.product_code,
                category_id: item.category_id,
                unit_id: item.unit_id,
                buying_price: item.buying_price,
                selling_price: item.selling_price,
                stock: item.stock,
                min_threshold: item.min_threshold,
                product_image: item.product_image,
                created_by: adminUser._id,
            });

            // Allocate warehouse stock to Central Hub
            await WarehouseStock.create({
                warehouse_id: centralWh._id,
                product_id: product._id,
                quantity: item.stock,
                reserved_quantity: 0,
                bin_location: item.bin_location,
                created_by: adminUser._id,
            });

            // Initial ledger entry
            await StockLedger.create({
                warehouse_id: centralWh._id,
                product_id: product._id,
                transaction_type: "adjustment_add",
                reference_id: product._id,
                reference_no: `INIT-${product.product_code}`,
                quantity_before: 0,
                quantity_change: item.stock,
                quantity_after: item.stock,
                created_by: adminUser._id,
            });
        }

        console.log("Created 6 Products with 8-character codes and warehouse allocations");

        console.log("\n=======================================================");
        console.log("🎉 DATABASE RESET COMPLETE - READY FOR FRESH USE!");
        console.log("=======================================================");
        console.log("ADMIN ACCOUNT:    rayapatiravitheja@gmail.com / Admin@123");
        console.log("ADMIN FALLBACK:   admin@inventorypro.com      / Admin@123");
        console.log("MANAGER ACCOUNT:  manager@inventorypro.com    / Manager@123");
        console.log("CUSTOMER ACCOUNT: 99230040998@klu.ac.in       / Customer@123");
        console.log("CUSTOMER ALT:     customer@inventorypro.com   / Customer@123");
        console.log("=======================================================\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Reset error:", error);
        process.exit(1);
    }
}

resetAllData();
