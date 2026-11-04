import cron from "node-cron";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { AlertLog } from "../models/alert-log.model.js";
import transporter from "./nodemailer.js";
import { ApiError } from "./ApiError.js";
import { getLowStockAlertEmailTemplate } from "./emailTemplates.js";

class LowStockScheduler {
    constructor() {
        this.threshold = 10;
        this.isRunning = false;
    }

    // Method to send low stock alerts for a specific user
    async sendUserLowStockAlert(userId, userEmail, username, isTest = false, triggeredBy = null) {
        try {
            let lowStockProducts = await Product.find({
                created_by: userId,
                $expr: {
                    $lt: ["$stock", { $ifNull: ["$min_threshold", this.threshold] }],
                },
            })
                .select(
                    "product_name product_code stock min_threshold buying_price selling_price category_id"
                )
                .populate("category_id", "category_name")
                .sort({ stock: 1 });

            // If it's a test alert and there are no actual low stock products,
            // construct sample low stock products so the test email is dispatched!
            let isSample = false;
            if (lowStockProducts.length === 0 && isTest) {
                const sampleProds = await Product.find({ created_by: userId })
                    .select("product_name product_code stock min_threshold buying_price selling_price category_id")
                    .populate("category_id", "category_name")
                    .limit(3);

                if (sampleProds.length > 0) {
                    lowStockProducts = sampleProds.map((p) => ({
                        _id: p._id,
                        product_name: p.product_name,
                        product_code: p.product_code,
                        stock: Math.min(p.stock, 3), // simulate low stock
                        min_threshold: p.min_threshold || 10,
                        buying_price: p.buying_price,
                        selling_price: p.selling_price,
                        category_id: p.category_id,
                    }));
                    isSample = true;
                }
            }

            if (lowStockProducts.length === 0) {
                console.log(`No low stock products found for user: ${username}`);
                await AlertLog.create({
                    trigger_type: isTest ? "manual_test" : "scheduled_cron",
                    triggered_by: triggeredBy || userId,
                    recipient_email: userEmail,
                    recipient_name: username,
                    products: [],
                    product_count: 0,
                    status: "no_low_stock",
                });
                return { sent: false, reason: "no_low_stock", count: 0 };
            }

            const template = getLowStockAlertEmailTemplate({
                username: username || "Administrator",
                lowStockProducts,
                threshold: this.threshold,
            });

            const subject = isTest
                ? `[TEST ALERT] ⚠️ Low Stock Notice - ${lowStockProducts.length} Items Require Restocking`
                : template.subject;

            const mailOptions = {
                from: `"InventoryPro Alert" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
                to: userEmail,
                ...template,
                subject,
            };

            const mailRes = await transporter.sendMail(mailOptions);
            console.log(
                `Low stock alert sent to ${username} (${userEmail}) - ${lowStockProducts.length} products (MessageId: ${mailRes?.messageId})`
            );

            // Log to database
            const mappedProducts = lowStockProducts.map((p) => ({
                product_id: p._id,
                product_name: p.product_name,
                product_code: p.product_code,
                stock: p.stock,
                min_threshold: p.min_threshold || 10,
                category_name: p.category_id?.category_name || "General",
            }));

            await AlertLog.create({
                trigger_type: isTest ? "manual_test" : "scheduled_cron",
                triggered_by: triggeredBy || userId,
                recipient_email: userEmail,
                recipient_name: username,
                products: mappedProducts,
                product_count: mappedProducts.length,
                status: "sent",
                message_id: mailRes?.messageId || "sent",
            });

            return {
                sent: true,
                count: lowStockProducts.length,
                email: userEmail,
                username: username,
                messageId: mailRes?.messageId,
                products: mappedProducts,
                isSample,
            };
        } catch (error) {
            console.error(
                `Error sending low stock alert to ${username}:`,
                error
            );

            await AlertLog.create({
                trigger_type: isTest ? "manual_test" : "scheduled_cron",
                triggered_by: triggeredBy || userId,
                recipient_email: userEmail,
                recipient_name: username,
                products: [],
                product_count: 0,
                status: "failed",
                error: error.message,
            });

            return {
                sent: false,
                reason: "email_error",
                error: error.message,
                email: userEmail,
                username: username,
            };
        }
    }

    // Method to send alerts to all users
    async sendAllUsersLowStockAlerts(isTest = false, triggeredBy = null) {
        try {
            console.log("🔄 Starting low stock alert process...");

            // Get all admin and manager users with email addresses
            const users = await User.find({
                email: { $exists: true, $ne: null, $ne: "" },
                role: { $in: ["admin", "manager"] },
            }).select("_id username email role");

            if (users.length === 0) {
                console.log("❌ No admin/manager users with email addresses found");
                return { success: false, message: "No users with email found" };
            }

            const results = {
                total: users.length,
                sent: 0,
                failed: 0,
                noLowStock: 0,
                details: [],
            };

            // Process each user
            for (const user of users) {
                const result = await this.sendUserLowStockAlert(
                    user._id,
                    user.email,
                    user.username,
                    isTest,
                    triggeredBy
                );

                results.details.push({
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    ...result,
                });

                if (result.sent) {
                    results.sent++;
                } else if (result.reason === "no_low_stock") {
                    results.noLowStock++;
                } else {
                    results.failed++;
                }

                await new Promise((resolve) => setTimeout(resolve, 800));
            }

            console.log(`✅ Low stock alert process completed:
                📧 Sent: ${results.sent}
                ✅ No low stock: ${results.noLowStock}
                ❌ Failed: ${results.failed}
                📊 Total users: ${results.total}`);

            return { success: true, results };
        } catch (error) {
            console.error("❌ Error in low stock alert process:", error);
            return { success: false, error: error.message };
        }
    }

    // Start the cron job
    start() {
        if (this.isRunning) {
            console.log("⚠️ Low stock scheduler is already running");
            return;
        }

        // Schedule to run every Monday at 9:00 AM
        this.cronJob = cron.schedule(
            "0 0 9 * * 1",
            async () => {
                console.log("⏰ Weekly low stock alert cron job triggered");
                await this.sendAllUsersLowStockAlerts(false, null);
            },
            {
                scheduled: false,
                timezone: process.env.TIMEZONE || "Asia/Kolkata",
            }
        );

        this.cronJob.start();
        this.isRunning = true;

        console.log(
            "🚀 Low stock alert scheduler started - will run every Monday at 9:00 AM"
        );
    }

    // Stop the cron job
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.isRunning = false;
            console.log("⏸️ Low stock alert scheduler stopped");
        }
    }

    // Manual trigger for testing
    async triggerManually(isTest = true, triggeredBy = null) {
        console.log("🧪 Manually triggering low stock alerts for testing...");
        return await this.sendAllUsersLowStockAlerts(isTest, triggeredBy);
    }

    // Update threshold
    setThreshold(newThreshold) {
        this.threshold = newThreshold;
        console.log(`📊 Low stock threshold updated to: ${this.threshold}`);
    }

    // Get status
    getStatus() {
        let nextRun = null;
        try {
            if (this.cronJob) {
                if (typeof this.cronJob.getNextRun === "function") {
                    nextRun = this.cronJob.getNextRun();
                } else if (typeof this.cronJob.nextDate === "function") {
                    nextRun = this.cronJob.nextDate();
                }
            }
        } catch (e) {
            nextRun = null;
        }

        return {
            isRunning: this.isRunning,
            threshold: this.threshold,
            nextRun,
        };
    }
}

// Create singleton instance
const lowStockScheduler = new LowStockScheduler();

export default lowStockScheduler;
