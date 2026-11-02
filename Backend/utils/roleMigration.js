import { User } from "../models/user.model.js";
import { Warehouse } from "../models/warehouse.model.js";

/**
 * Automatically migrate legacy roles ("user") to 3-role system:
 * "admin", "manager", "customer"
 */
export const runRoleMigration = async () => {
    try {
        console.log("🔄 Checking for role migration...");
        
        // Find users with legacy role 'user' or undefined role
        const legacyUsers = await User.find({
            $or: [{ role: "user" }, { role: { $exists: false } }, { role: null }],
        });

        if (legacyUsers.length === 0) {
            console.log("✅ Role migration check complete: All users have valid roles (admin/manager/customer).");
            return;
        }

        console.log(`Found ${legacyUsers.length} legacy user(s) to migrate.`);

        for (const user of legacyUsers) {
            // If user is primary admin account or has created warehouses
            const hasWarehouses = await Warehouse.countDocuments({ created_by: user._id });
            
            if (user.email === "thejaklu@gmail.com" || hasWarehouses > 0) {
                user.role = "admin";
                console.log(`Migrated user ${user.username} (${user.email}) to role: admin`);
            } else {
                user.role = "customer";
                console.log(`Migrated user ${user.username} (${user.email}) to role: customer`);
            }
            await user.save({ validateBeforeSave: false });
        }

        console.log("✅ Role migration completed successfully.");
    } catch (error) {
        console.error("❌ Role migration error:", error.message);
    }
};
