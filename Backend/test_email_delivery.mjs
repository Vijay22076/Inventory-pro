import transporter from "./utils/nodemailer.js";
import dotenv from "dotenv";
dotenv.config();

async function testEmail() {
    console.log("Testing email with sender:", process.env.SENDER_EMAIL);
    try {
        const info = await transporter.sendMail({
            from: `"InventoryPro Test" <${process.env.SENDER_EMAIL}>`,
            to: "rayapatiravitheja@gmail.com",
            subject: "InventoryPro Test Alert Verification",
            text: "This is a test low stock alert email verification from InventoryPro.",
            html: "<h3>InventoryPro Test Alert</h3><p>This confirms that email alerts are working properly.</p>",
        });
        console.log("Email sent successfully! MessageId:", info.messageId);
    } catch (err) {
        console.error("Email sending failed with error:", err);
    }
}

testEmail().catch(console.error);

