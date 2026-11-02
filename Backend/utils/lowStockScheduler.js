import cron from "node-cron";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import transporter from "./nodemailer.js";
import { ApiError } from "./ApiError.js";
import { getLowStockAlertEmailTemplate } from "./emailTemplates.js";

class LowStockScheduler {
    constructor() {
        this.threshold = 10;
        this.isRunning = false;
    }

    // Method to send low stock alerts for a specific user
    async sendUserLowStockAlert(userId, userEmail, username) {
        try {
            const lowStockProducts = await Product.find({
                created_by: userId,
                $expr: {
                    $lt: ["$stock", { $ifNull: ["$min_threshold", this.threshold] }],
                },
            })
                .select(
                    "product_name product_code stock min_threshold buying_price selling_price"
                )
                .populate("category_id", "category_name")
                .sort({ stock: 1 });

            if (lowStockProducts.length === 0) {
                console.log(
                    `No low stock products found for user: ${username}`
                );
                return { sent: false, reason: "no_low_stock", count: 0 };
            }

            const template = getLowStockAlertEmailTemplate({
                username,
                lowStockProducts,
                threshold: this.threshold,
            });

            const mailOptions = {
                from: `"InventoryPro" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
                to: userEmail,
                ...template,
            };

            await transporter.sendMail(mailOptions);
            console.log(
                `Low stock alert sent to ${username} (${userEmail}) - ${lowStockProducts.length} products`
            );

            return {
                sent: true,
                count: lowStockProducts.length,
                email: userEmail,
                username: username,
            };
        } catch (error) {
            console.error(
                `Error sending low stock alert to ${username}:`,
                error
            );
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
    async sendAllUsersLowStockAlerts() {
        try {
            console.log("🔄 Starting weekly low stock alert process...");

            // Get all users with email addresses
            const users = await User.find({
                email: { $exists: true, $ne: null, $ne: "" },
            }).select("_id username email role");

            if (users.length === 0) {
                console.log("❌ No users with email addresses found");
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
                    user.username
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

                // Add small delay between emails to avoid overwhelming the email service
                await new Promise((resolve) => setTimeout(resolve, 1000));
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
        // Format: second minute hour day month dayOfWeek
        this.cronJob = cron.schedule(
            "0 0 9 * * 1",
            async () => {
                console.log("⏰ Weekly low stock alert cron job triggered");
                await this.sendAllUsersLowStockAlerts();
            },
            {
                scheduled: false,
                timezone: process.env.TIMEZONE || "Asia/Kolkata", // Adjust according to your timezone
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
    async triggerManually() {
        console.log("🧪 Manually triggering low stock alerts for testing...");
        return await this.sendAllUsersLowStockAlerts();
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
