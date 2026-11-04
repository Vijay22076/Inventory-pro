import mongoose from "file:///C:/Users/theja/Desktop/InventoryPro-MERN-Inventory-Management-System/Backend/node_modules/mongoose/index.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/IMS";

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
    const db = mongoose.connection.db;

    const updates = [
        { code: "ACGM0101", newStock: 3 }, // Accu-Chek (low stock)
        { code: "OMBP7101", newStock: 2 }, // Omron BP Monitor (low stock)
        { code: "NVBW0501", newStock: 0 }, // Nivea Body Wash (out of stock)
    ];

    const wh = await db.collection("warehouses").findOne({ is_default: true });
    const user = await db.collection("users").findOne({ email: "rayapatiravitheja@gmail.com" });

    for (const item of updates) {
        const prod = await db.collection("products").findOne({ product_code: item.code });
        if (!prod) {
            console.log(`Product ${item.code} not found`);
            continue;
        }

        const oldStock = prod.stock;
        await db.collection("products").updateOne(
            { _id: prod._id },
            { $set: { stock: item.newStock } }
        );

        if (wh) {
            await db.collection("warehousestocks").updateOne(
                { warehouse_id: wh._id, product_id: prod._id },
                { $set: { quantity: item.newStock } }
            );

            await db.collection("stockledgers").insertOne({
                warehouse_id: wh._id,
                product_id: prod._id,
                transaction_type: "adjustment_deduct",
                reference_id: prod._id,
                reference_no: `TEST-ALERT-ADJ-${item.code}`,
                quantity_before: oldStock,
                quantity_change: item.newStock - oldStock,
                quantity_after: item.newStock,
                created_by: user._id,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        console.log(`Updated ${prod.product_name} (${item.code}): stock changed from ${oldStock} to ${item.newStock}`);
    }

    console.log("Low stock products configured successfully!");
    await mongoose.disconnect();
}

run().catch(console.error);

