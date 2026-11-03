import mongoose from "mongoose";

async function cleanData() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/IMS");
        console.log("Connected to MongoDB IMS");
        const db = mongoose.connection.db;

        const admin = await db.collection("users").findOne({ email: "rayapatiravitheja@gmail.com" });
        console.log("Preserved Admin user:", admin ? `${admin.email} (${admin._id})` : "None found!");

        const delProducts = await db.collection("products").deleteMany({});
        const delWarehouses = await db.collection("warehouses").deleteMany({});
        const delStocks = await db.collection("warehousestocks").deleteMany({});
        const delLedgers = await db.collection("stockledgers").deleteMany({});
        const delOrders = await db.collection("orders").deleteMany({});
        const delOrderDetails = await db.collection("orderdetails").deleteMany({});
        const delPurchases = await db.collection("purchases").deleteMany({});
        const delPurchaseDetails = await db.collection("purchasedetails").deleteMany({});
        const delAdjustments = await db.collection("stockadjustments").deleteMany({});
        const delTransfers = await db.collection("stocktransfers").deleteMany({});
        const delReturns = await db.collection("returnrequests").deleteMany({});
        const delSuppliers = await db.collection("suppliers").deleteMany({});
        const delCustomers = await db.collection("customers").deleteMany({});

        if (admin) {
            await db.collection("users").updateOne(
                { _id: admin._id },
                { $set: { assigned_warehouses: [] } }
            );
            await db.collection("categories").updateMany({}, { $set: { created_by: admin._id } });
            await db.collection("units").updateMany({}, { $set: { created_by: admin._id } });
        }

        console.log("Summary of deletion:");
        console.log(`- Products deleted: ${delProducts.deletedCount}`);
        console.log(`- Warehouses deleted: ${delWarehouses.deletedCount}`);
        console.log(`- WarehouseStocks deleted: ${delStocks.deletedCount}`);
        console.log(`- StockLedgers deleted: ${delLedgers.deletedCount}`);
        console.log(`- Orders deleted: ${delOrders.deletedCount}`);
        console.log(`- OrderDetails deleted: ${delOrderDetails.deletedCount}`);
        console.log(`- Purchases deleted: ${delPurchases.deletedCount}`);
        console.log(`- PurchaseDetails deleted: ${delPurchaseDetails.deletedCount}`);
        console.log(`- StockAdjustments deleted: ${delAdjustments.deletedCount}`);
        console.log(`- StockTransfers deleted: ${delTransfers.deletedCount}`);
        console.log(`- ReturnRequests deleted: ${delReturns.deletedCount}`);
        console.log(`- Suppliers deleted: ${delSuppliers.deletedCount}`);
        console.log(`- Customers deleted: ${delCustomers.deletedCount}`);

        console.log("\nCurrent Collection Counts in IMS:");
        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`  ${col.name}: ${count}`);
        }

        await mongoose.disconnect();
        console.log("Database cleanup finished successfully.");
    } catch (err) {
        console.error("Error during cleanup:", err);
        process.exit(1);
    }
}

cleanData();
