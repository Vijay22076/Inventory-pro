/**
 * Email Templates for InventoryPro
 * Centralized, secure, and client-compatible email templates for Admin, Manager, and Customer roles.
 */

// Centralized Brand & Color Palette
export const EMAIL_PALETTE = {
    brandDark: "#1e3a8a",      // Blue 900 (header fallback & gradient start)
    brandPrimary: "#2563eb",   // Blue 600 (header gradient end & buttons)
    brandLight: "#eff6ff",     // Blue 50
    brandBorder: "#bfdbfe",    // Blue 200
    brandAccent: "#1d4ed8",    // Blue 700 (OTP text)
    textPrimary: "#0f172a",    // Slate 900 (headers & emphasis)
    textSecondary: "#334155",  // Slate 700 (body paragraphs)
    textMuted: "#64748b",      // Slate 500 (subtext & helpers)
    textSubtle: "#94a3b8",     // Slate 400 (copyright & footnotes)
    bgBody: "#f1f5f9",         // Slate 100 (email canvas background)
    bgCard: "#ffffff",         // White (main card)
    bgAlt: "#f8fafc",          // Slate 50 (table headers & footer)
    borderColor: "#e2e8f0",    // Slate 200 (dividers & card borders)
    danger: "#dc2626",         // Red 600
    dangerText: "#991b1b",     // Red 800
    dangerBg: "#fef2f2",       // Red 50
    dangerBorder: "#fecaca",   // Red 200
    success: "#16a34a",        // Green 600
    successText: "#166534",    // Green 800
    successBg: "#f0fdf4",      // Green 50
    successBorder: "#bbf7d0",  // Green 200
    warning: "#f59e0b",        // Amber 500
    warningText: "#92400e",    // Amber 800
    warningBg: "#fffbeb",      // Amber 50
    warningBorder: "#fef3c7",  // Amber 200
};

const BRAND_NAME = process.env.APP_NAME || "InventoryPro";
const DEFAULT_SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.SENDER_EMAIL || "support@inventorypro.com";
const DEFAULT_FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * HTML Escaping Utility to prevent HTML injection / malformed email structure.
 */
export const escapeHtml = (val) => {
    if (val === null || val === undefined) return "";
    return String(val)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

/**
 * Sanitizes URLs to ensure only safe http, https, or mailto links are used.
 */
export const sanitizeUrl = (url, fallback = "#") => {
    if (!url || typeof url !== "string") return fallback;
    const trimmed = url.trim();
    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("mailto:")
    ) {
        return escapeHtml(trimmed);
    }
    return fallback;
};

/**
 * Bulletproof Button Generator with table fallbacks for Outlook and mobile clients.
 */
const renderBulletproofButton = (text, url) => {
    const safeUrl = sanitizeUrl(url);
    const safeText = escapeHtml(text);
    return `
        <!-- Bulletproof Button -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 28px auto;">
            <tr>
                <td align="center" bgcolor="${EMAIL_PALETTE.brandPrimary}" style="border-radius: 8px; background-color: ${EMAIL_PALETTE.brandPrimary};">
                    <a href="${safeUrl}" target="_blank" style="font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; border: 1px solid ${EMAIL_PALETTE.brandPrimary};">
                        ${safeText} &rarr;
                    </a>
                </td>
            </tr>
        </table>
    `;
};

/**
 * Base wrapper for consistent branding, responsive container, and email client fallbacks.
 */
const baseEmailWrapper = ({ content, previewText = "", categoryTag = "" }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <title>${escapeHtml(BRAND_NAME)}</title>
</head>
<body bgcolor="${EMAIL_PALETTE.bgBody}" style="margin: 0; padding: 0; background-color: ${EMAIL_PALETTE.bgBody}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${EMAIL_PALETTE.textPrimary}; -webkit-font-smoothing: antialiased;">
    ${previewText ? `
    <span style="display:none; font-size:1px; color:${EMAIL_PALETTE.bgBody}; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        ${escapeHtml(previewText)}
    </span>` : ""}

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${EMAIL_PALETTE.bgBody}" style="background-color: ${EMAIL_PALETTE.bgBody}; padding: 36px 12px;">
        <tr>
            <td align="center">
                <!-- Main Card Container -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${EMAIL_PALETTE.bgCard}" style="max-width: 620px; background-color: ${EMAIL_PALETTE.bgCard}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04); border: 1px solid ${EMAIL_PALETTE.borderColor};">
                    
                    <!-- Header with solid fallback for Outlook + gradient for modern clients -->
                    <tr>
                        <td bgcolor="${EMAIL_PALETTE.brandDark}" style="background-color: ${EMAIL_PALETTE.brandDark}; background: linear-gradient(135deg, ${EMAIL_PALETTE.brandDark} 0%, ${EMAIL_PALETTE.brandPrimary} 100%); padding: 26px 36px; text-align: left;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="vertical-align: middle;">
                                        <div style="display: inline-block;">
                                            <span style="font-size: 26px; vertical-align: middle; margin-right: 8px;">📦</span>
                                            <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; vertical-align: middle;">
                                                ${escapeHtml(BRAND_NAME)}
                                            </span>
                                        </div>
                                    </td>
                                    ${categoryTag ? `
                                    <td align="right" style="vertical-align: middle;">
                                        <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 4px 10px; border-radius: 9999px; display: inline-block;">
                                            ${escapeHtml(categoryTag)}
                                        </span>
                                    </td>` : ""}
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td bgcolor="${EMAIL_PALETTE.bgCard}" style="padding: 36px 36px 32px 36px; background-color: ${EMAIL_PALETTE.bgCard};">
                            ${content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td bgcolor="${EMAIL_PALETTE.bgAlt}" style="padding: 24px 36px; background-color: ${EMAIL_PALETTE.bgAlt}; border-top: 1px solid ${EMAIL_PALETTE.borderColor}; text-align: center;">
                            <p style="margin: 0 0 6px 0; font-size: 13px; color: ${EMAIL_PALETTE.textMuted};">
                                Need help? Contact our support team at 
                                <a href="mailto:${escapeHtml(DEFAULT_SUPPORT_EMAIL)}" style="color: ${EMAIL_PALETTE.brandPrimary}; text-decoration: none; font-weight: 500;">
                                    ${escapeHtml(DEFAULT_SUPPORT_EMAIL)}
                                </a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: ${EMAIL_PALETTE.textSubtle};">
                                &copy; ${new Date().getFullYear()} ${escapeHtml(BRAND_NAME)}. Smart Inventory. Efficient Warehousing. Better Management.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * 1. Welcome Email Template
 * Trigger: Account Registration
 * Subject: Welcome to InventoryPro – Your Account Is Ready!
 */
export const getWelcomeEmailTemplate = ({ username, loginUrl }) => {
    const rawUrl = loginUrl || `${DEFAULT_FRONTEND_URL}/login`;
    const safeUsername = escapeHtml(username || "Valued User");
    const safeUrl = sanitizeUrl(rawUrl);

    const content = `
        <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_PALETTE.textSecondary};">
            Dear <strong>${safeUsername}</strong>,
        </p>

        <h1 style="margin: 0 0 14px 0; font-size: 24px; font-weight: 800; color: ${EMAIL_PALETTE.textPrimary}; line-height: 1.3;">
            Welcome to ${escapeHtml(BRAND_NAME)}! 🎉
        </h1>

        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            We're excited to have you on board. Your account has been successfully created, and you can now access our Inventory and Warehouse Management System.
        </p>

        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">
            With ${escapeHtml(BRAND_NAME)}, you can:
        </p>

        <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: ${EMAIL_PALETTE.textSecondary};">
            <li>Manage products and inventory efficiently.</li>
            <li>Monitor real-time stock availability.</li>
            <li>Track warehouse operations and stock movements.</li>
            <li>Manage orders and inventory transactions.</li>
            <li>Receive automated low-stock notifications.</li>
        </ul>

        <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            Get started today and experience smarter inventory management.
        </p>

        ${renderBulletproofButton("Access Your Dashboard", safeUrl)}

        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: ${EMAIL_PALETTE.textMuted};">
            If you need any assistance, our support team is always ready to help.
        </p>

        <div style="border-top: 1px solid ${EMAIL_PALETTE.borderColor}; padding-top: 18px; margin-top: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${EMAIL_PALETTE.textSecondary}; font-weight: 600;">
                Best regards,
            </p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 700;">
                ${escapeHtml(BRAND_NAME)} Team
            </p>
            <p style="margin: 0; font-size: 13px; color: ${EMAIL_PALETTE.textMuted}; font-style: italic;">
                Smart Inventory. Efficient Warehousing. Better Management.
            </p>
        </div>
    `;

    return {
        subject: `Welcome to ${BRAND_NAME} – Your Account Is Ready!`,
        text: `Dear ${safeUsername},\n\nWelcome to ${BRAND_NAME}! Your account has been successfully created. Access your dashboard at: ${rawUrl}\n\nBest regards,\n${BRAND_NAME} Team`,
        html: baseEmailWrapper({
            content,
            previewText: `Welcome to ${BRAND_NAME}! Your account is ready.`,
            categoryTag: "Account registration",
        }),
    };
};

/**
 * 2. OTP Verification Email Template
 * Trigger: Security Verification (Email Verification or Action OTP)
 * Subject: Your InventoryPro Verification Code
 */
export const getOtpEmailTemplate = ({
    username,
    otp,
    title = "Verification Code",
    purpose = "verify your email address",
    expiryMinutes = 10,
}) => {
    const safeUsername = escapeHtml(username || "Valued User");
    const safeOtp = escapeHtml(otp || "");
    const safePurpose = escapeHtml(purpose);
    const safeMinutes = escapeHtml(expiryMinutes);

    const content = `
        <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_PALETTE.textSecondary};">
            Dear <strong>${safeUsername}</strong>,
        </p>

        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            We received a request to ${safePurpose} for your ${escapeHtml(BRAND_NAME)} account.
        </p>

        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            Please use the verification code below to complete the process:
        </p>

        <!-- Big OTP Card with table fallback -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 28px auto 24px auto;">
            <tr>
                <td align="center" bgcolor="${EMAIL_PALETTE.bgAlt}" style="background-color: ${EMAIL_PALETTE.bgAlt}; border: 2px dashed ${EMAIL_PALETTE.brandPrimary}; border-radius: 12px; padding: 18px 36px;">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: ${EMAIL_PALETTE.textMuted}; display: block; margin-bottom: 8px;">
                        YOUR ONE-TIME PASSWORD
                    </span>
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: ${EMAIL_PALETTE.brandAccent}; display: block; margin-left: 10px;">
                        ${safeOtp}
                    </span>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding-top: 10px;">
                    <p style="margin: 0; font-size: 13px; color: ${EMAIL_PALETTE.textMuted};">
                        ⏱ Valid for <strong>${safeMinutes} minutes</strong>
                    </p>
                </td>
            </tr>
        </table>

        <!-- Security Notice Box -->
        <div style="background-color: ${EMAIL_PALETTE.bgAlt}; border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; padding: 16px 18px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">
                🛡️ Important Security Information:
            </p>
            <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
                <li>This verification code is valid for <strong>${safeMinutes} minutes</strong> only.</li>
                <li>Never share this code with anyone.</li>
                <li>${escapeHtml(BRAND_NAME)} will never ask you to disclose your OTP.</li>
            </ul>
        </div>

        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: ${EMAIL_PALETTE.textMuted};">
            If you did not initiate this request, please ignore this email.
        </p>

        <div style="border-top: 1px solid ${EMAIL_PALETTE.borderColor}; padding-top: 18px; margin-top: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${EMAIL_PALETTE.textSecondary}; font-weight: 600;">
                Best regards,
            </p>
            <p style="margin: 0; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 700;">
                ${escapeHtml(BRAND_NAME)} Security Team
            </p>
        </div>
    `;

    return {
        subject: `Your ${BRAND_NAME} Verification Code`,
        text: `Dear ${safeUsername},\n\nYour ${BRAND_NAME} verification code is: ${otp}\n\nIt is valid for ${expiryMinutes} minutes. Never share this code with anyone.\n\nBest regards,\n${BRAND_NAME} Security Team`,
        html: baseEmailWrapper({
            content,
            previewText: `Your ${BRAND_NAME} verification code is ${otp}`,
            categoryTag: "Security verification",
        }),
    };
};

/**
 * 3. Low Stock Alert Email Template
 * Trigger: Automated Weekly or Triggered Inventory Check
 * Subject: Action Required: Low Stock Alert – InventoryPro
 */
export const getLowStockAlertEmailTemplate = ({
    username,
    lowStockProducts = [],
    threshold = 10,
}) => {
    // Correction 3: Do not send low-stock alert with zero products
    if (!lowStockProducts || !Array.isArray(lowStockProducts) || lowStockProducts.length === 0) {
        throw new Error("Cannot generate low stock alert email for zero products.");
    }

    const count = lowStockProducts.length;
    const restockUrl = `${DEFAULT_FRONTEND_URL}/products`;
    const safeUsername = escapeHtml(username || "Valued User");
    const formattedCount = String(count).padStart(2, "0");
    const formattedThreshold = String(threshold).padStart(2, "0");

    // Correction 2: Standardized 4-column table (Product | SKU | Available stock | Category)
    const rowsHtml = lowStockProducts
        .map((p, index) => {
            const bg = index % 2 === 0 ? EMAIL_PALETTE.bgCard : EMAIL_PALETTE.bgAlt;
            const name = escapeHtml(p.product_name || p.name || "Unknown Product");
            const sku = escapeHtml(p.product_code || p.code || "—");
            const stock = escapeHtml(p.stock !== undefined ? p.stock : 0);
            const category = escapeHtml(p.category_id?.category_name || p.category || "N/A");

            return `
                <tr bgcolor="${bg}" style="background-color: ${bg}; border-bottom: 1px solid ${EMAIL_PALETTE.borderColor};">
                    <td style="padding: 12px 14px; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 600;">${name}</td>
                    <td style="padding: 12px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textSecondary}; font-family: monospace;">${sku}</td>
                    <td align="center" style="padding: 12px 14px; text-align: center;">
                        <span style="background-color: ${EMAIL_PALETTE.dangerBg}; color: ${EMAIL_PALETTE.danger}; font-weight: 700; padding: 4px 10px; border-radius: 9999px; font-size: 13px; display: inline-block; border: 1px solid ${EMAIL_PALETTE.dangerBorder};">
                            ${stock}
                        </span>
                    </td>
                    <td style="padding: 12px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textMuted};">${category}</td>
                </tr>
            `;
        })
        .join("");

    const content = `
        <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_PALETTE.textSecondary};">
            Dear <strong>${safeUsername}</strong>,
        </p>

        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            This is an automated notification from ${escapeHtml(BRAND_NAME)} regarding products that have reached or fallen below their minimum stock levels.
        </p>

        <!-- Inventory Summary KPI Cards -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
            <tr>
                <td width="48%" bgcolor="${EMAIL_PALETTE.dangerBg}" style="background-color: ${EMAIL_PALETTE.dangerBg}; border: 1px solid ${EMAIL_PALETTE.dangerBorder}; border-radius: 8px; padding: 16px; text-align: center;">
                    <span style="display: block; font-size: 28px; font-weight: 800; color: ${EMAIL_PALETTE.danger}; line-height: 1;">
                        ${formattedCount}
                    </span>
                    <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${EMAIL_PALETTE.dangerText}; letter-spacing: 0.5px; margin-top: 6px;">
                        Low-stock products
                    </span>
                </td>
                <td width="4%"></td>
                <td width="48%" bgcolor="${EMAIL_PALETTE.successBg}" style="background-color: ${EMAIL_PALETTE.successBg}; border: 1px solid ${EMAIL_PALETTE.successBorder}; border-radius: 8px; padding: 16px; text-align: center;">
                    <span style="display: block; font-size: 28px; font-weight: 800; color: ${EMAIL_PALETTE.success}; line-height: 1;">
                        ${formattedThreshold}
                    </span>
                    <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${EMAIL_PALETTE.successText}; letter-spacing: 0.5px; margin-top: 6px;">
                        Minimum threshold
                    </span>
                </td>
            </tr>
        </table>

        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">
            Products Requiring Attention
        </p>

        <!-- Standardized 4-Column Table -->
        <div style="border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: left; border-collapse: collapse;">
                <thead>
                    <tr bgcolor="${EMAIL_PALETTE.bgAlt}" style="background-color: ${EMAIL_PALETTE.bgAlt}; border-bottom: 1px solid ${EMAIL_PALETTE.borderColor};">
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase;">Product</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase;">SKU</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: center;">Available stock</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase;">Category</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>

        <!-- Recommended Action Box -->
        <div style="background-color: ${EMAIL_PALETTE.warningBg}; border: 1px solid ${EMAIL_PALETTE.warningBorder}; border-left: 4px solid ${EMAIL_PALETTE.warning}; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: ${EMAIL_PALETTE.warningText};">
                Recommended Action:
            </p>
            <p style="margin: 0; font-size: 13px; color: ${EMAIL_PALETTE.warningText}; line-height: 1.5;">
                Please review the listed products and initiate the necessary restocking process to avoid inventory shortages and order fulfilment delays.
            </p>
        </div>

        ${renderBulletproofButton("Review Inventory", restockUrl)}

        <p style="margin: 0 0 24px 0; font-size: 13px; color: ${EMAIL_PALETTE.textMuted}; font-style: italic;">
            This is an automated inventory alert generated by ${escapeHtml(BRAND_NAME)}.
        </p>

        <div style="border-top: 1px solid ${EMAIL_PALETTE.borderColor}; padding-top: 18px; margin-top: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${EMAIL_PALETTE.textSecondary}; font-weight: 600;">
                Best regards,
            </p>
            <p style="margin: 0; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 700;">
                ${escapeHtml(BRAND_NAME)} Inventory Management Team
            </p>
        </div>
    `;

    return {
        subject: `Action Required: Low Stock Alert – ${BRAND_NAME}`,
        text: `Dear ${safeUsername},\n\nThis is an automated notification from ${BRAND_NAME} regarding ${count} product(s) that have fallen below the minimum threshold of ${threshold} units.\n\nPlease review inventory at: ${restockUrl}\n\nBest regards,\n${BRAND_NAME} Inventory Management Team`,
        html: baseEmailWrapper({
            content,
            previewText: `Action Required: ${count} product(s) have reached low stock limits.`,
            categoryTag: "Inventory alert",
        }),
    };
};

/**
 * 4. Password Reset Email Template
 * Trigger: User requested password reset
 * Subject: Password Reset Request – InventoryPro
 */
export const getPasswordResetEmailTemplate = ({
    username,
    resetUrl,
    otp,
    expiryMinutes = 15,
}) => {
    // Correction 4: Ensure at least one of resetUrl or otp is supplied
    if (!resetUrl && !otp) {
        throw new Error("Password reset email requires at least one of 'resetUrl' or 'otp'.");
    }

    const safeUsername = escapeHtml(username || "Valued User");
    const safeMinutes = escapeHtml(expiryMinutes);
    const safeOtp = otp ? escapeHtml(otp) : "";
    const safeResetUrl = resetUrl ? sanitizeUrl(resetUrl) : "";

    const content = `
        <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_PALETTE.textSecondary};">
            Dear <strong>${safeUsername}</strong>,
        </p>

        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            We received a request to reset the password associated with your ${escapeHtml(BRAND_NAME)} account.
        </p>

        ${safeResetUrl ? `
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            To create a new password, click the button below:
        </p>

        ${renderBulletproofButton("Reset your password securely", safeResetUrl)}

        <p style="margin: 0 0 24px 0; font-size: 13px; color: ${EMAIL_PALETTE.textMuted}; text-align: center;">
            ⏱ This link expires in <strong>${safeMinutes} minutes</strong>.
        </p>
        ` : ""}

        ${safeOtp ? `
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            Please use the password reset verification code below to complete the process:
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 24px auto;">
            <tr>
                <td align="center" bgcolor="${EMAIL_PALETTE.bgAlt}" style="background-color: ${EMAIL_PALETTE.bgAlt}; border: 2px dashed ${EMAIL_PALETTE.brandPrimary}; border-radius: 12px; padding: 16px 36px;">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: ${EMAIL_PALETTE.textMuted}; display: block; margin-bottom: 8px;">
                        YOUR PASSWORD RESET CODE
                    </span>
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: ${EMAIL_PALETTE.brandAccent}; display: block; margin-left: 10px;">
                        ${safeOtp}
                    </span>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding-top: 10px;">
                    <p style="margin: 0; font-size: 13px; color: ${EMAIL_PALETTE.textMuted};">
                        ⏱ This code expires in <strong>${safeMinutes} minutes</strong>.
                    </p>
                </td>
            </tr>
        </table>
        ` : ""}

        <!-- Security Notice Box -->
        <div style="background-color: ${EMAIL_PALETTE.bgAlt}; border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; padding: 16px 18px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">
                🛡️ Security Notice:
            </p>
            <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
                <li>This password reset ${safeResetUrl ? "link" : "code"} can only be used once.</li>
                <li>Do not share this ${safeResetUrl ? "link" : "code"} with anyone.</li>
                <li>Your existing password will remain unchanged until you complete the reset process.</li>
            </ul>
        </div>

        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: ${EMAIL_PALETTE.textMuted};">
            If you did not request a password reset, please ignore this email. Your account remains secure.
        </p>

        <div style="border-top: 1px solid ${EMAIL_PALETTE.borderColor}; padding-top: 18px; margin-top: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${EMAIL_PALETTE.textSecondary}; font-weight: 600;">
                Best regards,
            </p>
            <p style="margin: 0; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 700;">
                ${escapeHtml(BRAND_NAME)} Security Team
            </p>
        </div>
    `;

    return {
        subject: `Password Reset Request – ${BRAND_NAME}`,
        text: `Dear ${safeUsername},\n\nWe received a request to reset your ${BRAND_NAME} account password.\n${otp ? `Your code: ${otp}\n` : ""}${resetUrl ? `Reset link: ${resetUrl}\n` : ""}Expires in ${expiryMinutes} minutes.\n\nBest regards,\n${BRAND_NAME} Security Team`,
        html: baseEmailWrapper({
            content,
            previewText: `Password Reset Request for your ${BRAND_NAME} account`,
            categoryTag: "Account security",
        }),
    };
};

/**
 * 5. General Notification Email Template
 * Trigger: System, User, or Warehouse Event Notification
 * Subject: Important Update from InventoryPro
 */
export const getGeneralNotificationEmailTemplate = ({
    username,
    notification_type,
    notification_message,
    notification_date,
    dashboardUrl,
    customSubject,
}) => {
    const safeUsername = escapeHtml(username || "Valued User");
    const rawTargetUrl = dashboardUrl || `${DEFAULT_FRONTEND_URL}/dashboard`;
    const safeTargetUrl = sanitizeUrl(rawTargetUrl);
    const safeType = escapeHtml(notification_type || "System Update");
    const safeMessage = escapeHtml(notification_message || "An update was made to your account or warehouse configuration.");
    const safeDate = escapeHtml(notification_date || new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }));

    const content = `
        <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_PALETTE.textSecondary};">
            Dear <strong>${safeUsername}</strong>,
        </p>

        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            We would like to inform you about an important update related to your ${escapeHtml(BRAND_NAME)} account.
        </p>

        <!-- Notification Details Card -->
        <div style="background-color: ${EMAIL_PALETTE.bgAlt}; border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">
                📋 Notification Details
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 14px;">
                <tr>
                    <td width="35%" style="padding: 6px 0; color: ${EMAIL_PALETTE.textMuted}; font-weight: 600;">Notification Type:</td>
                    <td style="padding: 6px 0; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 700;">${safeType}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: ${EMAIL_PALETTE.textMuted}; font-weight: 600; vertical-align: top;">Message:</td>
                    <td style="padding: 6px 0; color: ${EMAIL_PALETTE.textSecondary}; line-height: 1.5;">${safeMessage}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: ${EMAIL_PALETTE.textMuted}; font-weight: 600;">Date & Time:</td>
                    <td style="padding: 6px 0; color: ${EMAIL_PALETTE.textPrimary};">${safeDate}</td>
                </tr>
            </table>
        </div>

        <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            Please log in to your ${escapeHtml(BRAND_NAME)} dashboard to review the details and take any necessary action.
        </p>

        ${renderBulletproofButton("View Dashboard", safeTargetUrl)}

        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: ${EMAIL_PALETTE.textMuted};">
            We appreciate your continued trust in ${escapeHtml(BRAND_NAME)}. Thank you for using our platform to manage your inventory and warehouse operations.
        </p>

        <div style="border-top: 1px solid ${EMAIL_PALETTE.borderColor}; padding-top: 18px; margin-top: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${EMAIL_PALETTE.textSecondary}; font-weight: 600;">
                Best regards,
            </p>
            <p style="margin: 0; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 700;">
                ${escapeHtml(BRAND_NAME)} Team
            </p>
        </div>
    `;

    return {
        subject: customSubject || `Important Update from ${BRAND_NAME}`,
        text: `Dear ${safeUsername},\n\n${notification_type || "System Update"}: ${notification_message || ""}\nDate: ${safeDate}\n\nView dashboard: ${rawTargetUrl}\n\nBest regards,\n${BRAND_NAME} Team`,
        html: baseEmailWrapper({
            content,
            previewText: `${safeType}: ${safeMessage}`,
            categoryTag: "System notification",
        }),
    };
};

/**
 * 6. Return Status Update Email Template
 * Trigger: Admin/Manager updates a return request (authorized/approved, received/restocked, rejected)
 * Subject: Update on Return Request #${return_no} – InventoryPro
 */
export const getReturnStatusUpdateEmailTemplate = ({
    username,
    return_no,
    invoice_no,
    status,
    items = [],
    warehouse_name = "",
    resolution_notes = "",
    portalUrl,
}) => {
    const safeUsername = escapeHtml(username || "Valued Customer");
    const safeReturnNo = escapeHtml(return_no || "N/A");
    const safeInvoiceNo = escapeHtml(invoice_no || "N/A");
    const safeWhName = escapeHtml(warehouse_name);
    const safeNotes = escapeHtml(resolution_notes);
    const targetUrl = portalUrl || `${DEFAULT_FRONTEND_URL}/customer/returns`;

    let statusLabel = "Pending Review";
    let statusBg = EMAIL_PALETTE.warningBg;
    let statusBorder = EMAIL_PALETTE.warningBorder;
    let statusColor = EMAIL_PALETTE.warningText;
    let statusBadgeColor = EMAIL_PALETTE.warning;
    let statusSummary = "Your return request is currently being reviewed by our inventory management team.";

    if (status === "approved") {
        statusLabel = "Return Authorized";
        statusBg = EMAIL_PALETTE.brandLight;
        statusBorder = EMAIL_PALETTE.brandBorder;
        statusColor = EMAIL_PALETTE.brandDark;
        statusBadgeColor = EMAIL_PALETTE.brandPrimary;
        statusSummary = "Your return request has been authorized! Please prepare and dispatch the item(s) to our warehouse facility.";
    } else if (status === "received") {
        statusLabel = "Received & Restocked";
        statusBg = EMAIL_PALETTE.successBg;
        statusBorder = EMAIL_PALETTE.successBorder;
        statusColor = EMAIL_PALETTE.successText;
        statusBadgeColor = EMAIL_PALETTE.success;
        statusSummary = `Your return has been received at our warehouse${safeWhName ? ` (${safeWhName})` : ""} and successfully restocked into our inventory ledger.`;
    } else if (status === "rejected") {
        statusLabel = "Request Rejected";
        statusBg = EMAIL_PALETTE.dangerBg;
        statusBorder = EMAIL_PALETTE.dangerBorder;
        statusColor = EMAIL_PALETTE.dangerText;
        statusBadgeColor = EMAIL_PALETTE.danger;
        statusSummary = "Your return request could not be processed at this time. Please see the resolution notes below.";
    }

    const itemsRows = (items || []).map((it, idx) => {
        const bg = idx % 2 === 0 ? EMAIL_PALETTE.bgCard : EMAIL_PALETTE.bgAlt;
        const name = escapeHtml(it.product_name || it.name || "Returned Item");
        const code = escapeHtml(it.product_code || it.code || "—");
        const qty = escapeHtml(it.quantity || 1);
        return `
            <tr bgcolor="${bg}" style="background-color: ${bg}; border-bottom: 1px solid ${EMAIL_PALETTE.borderColor};">
                <td style="padding: 10px 14px; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 600;">${name}</td>
                <td style="padding: 10px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textSecondary}; font-family: monospace;">${code}</td>
                <td align="center" style="padding: 10px 14px; font-size: 14px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary}; text-align: center;">${qty}</td>
            </tr>
        `;
    }).join("");

    const content = `
        <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_PALETTE.textSecondary};">
            Dear <strong>${safeUsername}</strong>,
        </p>

        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            Here is an update regarding your return request <strong>#${safeReturnNo}</strong> associated with Order <strong>#${safeInvoiceNo}</strong>.
        </p>

        <!-- Status Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
            <tr>
                <td bgcolor="${statusBg}" style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-left: 5px solid ${statusBadgeColor}; border-radius: 8px; padding: 18px;">
                    <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${statusColor}; letter-spacing: 0.8px;">
                        Current Status
                    </span>
                    <span style="display: block; font-size: 22px; font-weight: 800; color: ${statusColor}; margin: 4px 0 6px 0;">
                        ${statusLabel}
                    </span>
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: ${statusColor};">
                        ${statusSummary}
                    </p>
                </td>
            </tr>
        </table>

        ${items && items.length > 0 ? `
        <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">
            Return Item(s):
        </p>
        <div style="border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: left; border-collapse: collapse;">
                <thead>
                    <tr bgcolor="${EMAIL_PALETTE.bgAlt}" style="background-color: ${EMAIL_PALETTE.bgAlt}; border-bottom: 1px solid ${EMAIL_PALETTE.borderColor};">
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase;">Product</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase;">SKU</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: center;">Qty</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>
        </div>
        ` : ""}

        ${safeNotes ? `
        <div style="background-color: ${EMAIL_PALETTE.bgAlt}; border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">
                Resolution & Warehouse Notes:
            </p>
            <p style="margin: 0; font-size: 13px; color: ${EMAIL_PALETTE.textSecondary}; line-height: 1.5;">
                ${safeNotes}
            </p>
        </div>
        ` : ""}

        ${renderBulletproofButton("View Return in Portal", targetUrl)}

        <div style="border-top: 1px solid ${EMAIL_PALETTE.borderColor}; padding-top: 18px; margin-top: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${EMAIL_PALETTE.textSecondary}; font-weight: 600;">
                Best regards,
            </p>
            <p style="margin: 0; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 700;">
                ${escapeHtml(BRAND_NAME)} Returns Department
            </p>
        </div>
    `;

    return {
        subject: `Update on Return Request #${return_no} – ${BRAND_NAME}`,
        text: `Dear ${safeUsername},\n\nYour return request #${return_no} status has been updated to: ${statusLabel}.\n\nView details: ${targetUrl}\n\nBest regards,\n${BRAND_NAME} Returns Team`,
        html: baseEmailWrapper({
            content,
            previewText: `Return #${return_no} status updated to ${statusLabel}`,
            categoryTag: "Return update",
        }),
    };
};

/**
 * 7. Order Confirmation Email Template
 * Trigger: Customer places order or Admin creates order
 * Subject: Order Confirmation – Invoice #${invoice_no} – InventoryPro
 */
export const getOrderConfirmationEmailTemplate = ({
    username,
    invoice_no,
    order_date,
    items = [],
    sub_total = 0,
    gst = 0,
    total = 0,
    shipping_address,
    customer_phone,
    portalUrl,
}) => {
    const safeUsername = escapeHtml(username || "Valued Customer");
    const safeInvoiceNo = escapeHtml(invoice_no || "N/A");
    const safeDate = escapeHtml(order_date || new Date().toLocaleDateString("en-US", { dateStyle: "medium" }));
    const safeShippingAddress = escapeHtml(shipping_address || "");
    const safeCustomerPhone = escapeHtml(customer_phone || "");
    const targetUrl = portalUrl || `${DEFAULT_FRONTEND_URL}/customer/orders`;

    const itemsRows = (items || []).map((it, idx) => {
        const bg = idx % 2 === 0 ? EMAIL_PALETTE.bgCard : EMAIL_PALETTE.bgAlt;
        const name = escapeHtml(it.product_name || it.name || "Item");
        const code = escapeHtml(it.product_code || it.code || "");
        const image = it.product_image && String(it.product_image).startsWith("http") ? it.product_image : null;
        const qty = escapeHtml(it.quantity || 1);
        const price = Number(it.unitcost || it.selling_price || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
        const lineTotal = Number(it.total || (it.quantity * (it.unitcost || it.selling_price || 0))).toLocaleString("en-IN", { style: "currency", currency: "INR" });

        return `
            <tr bgcolor="${bg}" style="background-color: ${bg}; border-bottom: 1px solid ${EMAIL_PALETTE.borderColor};">
                <td style="padding: 10px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textPrimary};">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            ${image ? `
                            <td style="padding-right: 10px; vertical-align: middle;">
                                <img src="${image}" alt="${name}" width="38" height="38" style="width: 38px; height: 38px; object-fit: cover; border-radius: 6px; border: 1px solid ${EMAIL_PALETTE.borderColor}; display: block;" />
                            </td>
                            ` : ""}
                            <td style="vertical-align: middle;">
                                <div style="font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">${name}</div>
                                ${code ? `<div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: ${EMAIL_PALETTE.textMuted};">SKU: ${code}</div>` : ""}
                            </td>
                        </tr>
                    </table>
                </td>
                <td align="center" style="padding: 10px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textSecondary}; text-align: center; font-weight: 600;">${qty}</td>
                <td align="right" style="padding: 10px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textSecondary}; text-align: right;">${price}</td>
                <td align="right" style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary}; text-align: right;">${lineTotal}</td>
            </tr>
        `;
    }).join("");

    const fmtSubTotal = Number(sub_total || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
    const fmtGst = Number(gst || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
    const fmtTotal = Number(total || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });

    const content = `
        <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_PALETTE.textSecondary};">
            Dear <strong>${safeUsername}</strong>,
        </p>

        <h1 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 800; color: ${EMAIL_PALETTE.textPrimary};">
            Thank you for your order! 🛍️
        </h1>

        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            We have received your order <strong>#${safeInvoiceNo}</strong> placed on <strong>${safeDate}</strong>. Our fulfillment team is now preparing it.
        </p>

        <!-- Order Items Table -->
        <div style="border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: left; border-collapse: collapse;">
                <thead>
                    <tr bgcolor="${EMAIL_PALETTE.bgAlt}" style="background-color: ${EMAIL_PALETTE.bgAlt}; border-bottom: 1px solid ${EMAIL_PALETTE.borderColor};">
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase;">Product & SKU</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: center;">Qty</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: right;">Price</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>
        </div>

        <!-- Totals Table -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
            <tr>
                <td width="55%"></td>
                <td width="45%">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 14px;">
                        <tr>
                            <td style="padding: 4px 0; color: ${EMAIL_PALETTE.textMuted};">Subtotal:</td>
                            <td align="right" style="padding: 4px 0; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 600;">${fmtSubTotal}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: ${EMAIL_PALETTE.textMuted};">Tax / GST:</td>
                            <td align="right" style="padding: 4px 0; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 600;">${fmtGst}</td>
                        </tr>
                        <tr style="border-top: 1px solid ${EMAIL_PALETTE.borderColor};">
                            <td style="padding: 8px 0; font-size: 16px; font-weight: 800; color: ${EMAIL_PALETTE.textPrimary};">Grand Total:</td>
                            <td align="right" style="padding: 8px 0; font-size: 16px; font-weight: 800; color: ${EMAIL_PALETTE.brandPrimary};">${fmtTotal}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        ${safeShippingAddress ? `
        <!-- Delivery Address Box -->
        <div style="background-color: ${EMAIL_PALETTE.bgAlt}; border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${EMAIL_PALETTE.textMuted};">
                📍 Delivery Destination:
            </p>
            <p style="margin: 0; font-size: 13px; color: ${EMAIL_PALETTE.textPrimary}; line-height: 1.5;">
                ${safeShippingAddress}
                ${safeCustomerPhone ? `<br><span style="color: ${EMAIL_PALETTE.textMuted};">Contact:</span> ${safeCustomerPhone}` : ""}
            </p>
        </div>
        ` : ""}

        ${renderBulletproofButton("Track & View Order in Portal", targetUrl)}

        <div style="border-top: 1px solid ${EMAIL_PALETTE.borderColor}; padding-top: 18px; margin-top: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${EMAIL_PALETTE.textSecondary}; font-weight: 600;">
                Best regards,
            </p>
            <p style="margin: 0; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 700;">
                ${escapeHtml(BRAND_NAME)} Team
            </p>
        </div>
    `;

    return {
        subject: `Order Confirmation – #${invoice_no} – ${BRAND_NAME}`,
        text: `Dear ${safeUsername},\n\nThank you for your order #${invoice_no} totaling ${fmtTotal}.\n\nItems: ${(items || []).map(i => `${i.product_name} (x${i.quantity})`).join(", ")}\n\nDelivery to: ${shipping_address || "Standard"}\n\nView order details: ${targetUrl}\n\nBest regards,\n${BRAND_NAME} Team`,
        html: baseEmailWrapper({
            content,
            previewText: `Order #${invoice_no} confirmed totaling ${fmtTotal}`,
            categoryTag: "Order confirmed",
        }),
    };
};

/**
 * 8. Order Status Update Email Template
 * Trigger: Order status updated (processing, completed, cancelled)
 * Subject: Update on Order #${invoice_no} – InventoryPro
 */
export const getOrderStatusUpdateEmailTemplate = ({
    username,
    invoice_no,
    order_status,
    total = 0,
    portalUrl,
}) => {
    const safeUsername = escapeHtml(username || "Valued Customer");
    const safeInvoiceNo = escapeHtml(invoice_no || "N/A");
    const targetUrl = portalUrl || `${DEFAULT_FRONTEND_URL}/customer/orders`;
    const fmtTotal = Number(total || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });

    let statusLabel = "Pending";
    let statusBg = EMAIL_PALETTE.warningBg;
    let statusBorder = EMAIL_PALETTE.warningBorder;
    let statusColor = EMAIL_PALETTE.warningText;
    let message = "Your order is being reviewed.";

    if (order_status === "processing") {
        statusLabel = "Processing";
        statusBg = EMAIL_PALETTE.brandLight;
        statusBorder = EMAIL_PALETTE.brandBorder;
        statusColor = EMAIL_PALETTE.brandDark;
        message = "Your order is currently being picked and packed at our warehouse facility.";
    } else if (order_status === "completed") {
        statusLabel = "Completed / Dispatched";
        statusBg = EMAIL_PALETTE.successBg;
        statusBorder = EMAIL_PALETTE.successBorder;
        statusColor = EMAIL_PALETTE.successText;
        message = "Your order has been completed and dispatched for fulfillment.";
    } else if (order_status === "cancelled") {
        statusLabel = "Cancelled";
        statusBg = EMAIL_PALETTE.dangerBg;
        statusBorder = EMAIL_PALETTE.dangerBorder;
        statusColor = EMAIL_PALETTE.dangerText;
        message = "Your order has been cancelled. Please contact our support team if you have any questions.";
    }

    const content = `
        <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_PALETTE.textSecondary};">
            Dear <strong>${safeUsername}</strong>,
        </p>

        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            The status of your Order <strong>#${safeInvoiceNo}</strong> (${fmtTotal}) has been updated.
        </p>

        <!-- Status Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
            <tr>
                <td bgcolor="${statusBg}" style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 8px; padding: 18px; text-align: center;">
                    <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${statusColor}; letter-spacing: 0.8px;">
                        Order Status
                    </span>
                    <span style="display: block; font-size: 24px; font-weight: 800; color: ${statusColor}; margin: 4px 0 6px 0;">
                        ${statusLabel}
                    </span>
                    <p style="margin: 0; font-size: 14px; color: ${statusColor};">
                        ${message}
                    </p>
                </td>
            </tr>
        </table>

        ${renderBulletproofButton("Track Order in Portal", targetUrl)}

        <div style="border-top: 1px solid ${EMAIL_PALETTE.borderColor}; padding-top: 18px; margin-top: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${EMAIL_PALETTE.textSecondary}; font-weight: 600;">
                Best regards,
            </p>
            <p style="margin: 0; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 700;">
                ${escapeHtml(BRAND_NAME)} Team
            </p>
        </div>
    `;

    return {
        subject: `Order #${invoice_no} Status: ${statusLabel} – ${BRAND_NAME}`,
        text: `Dear ${safeUsername},\n\nYour order #${invoice_no} is now: ${statusLabel}.\n\nView details: ${targetUrl}\n\nBest regards,\n${BRAND_NAME} Team`,
        html: baseEmailWrapper({
            content,
            previewText: `Order #${invoice_no} is now ${statusLabel}`,
            categoryTag: "Order update",
        }),
    };
};

/**
 * 9. Admin New Order Alert Email Template
 * Trigger: Customer places order via portal or online checkout
 * Subject: 🛒 New Customer Order Placed – #${invoice_no} – InventoryPro
 */
export const getAdminNewOrderAlertEmailTemplate = ({
    admin_name,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    invoice_no,
    order_date,
    warehouse_name,
    items = [],
    sub_total = 0,
    gst = 0,
    total = 0,
    adminPortalUrl,
}) => {
    const safeAdminName = escapeHtml(admin_name || "Admin");
    const safeCustomerName = escapeHtml(customer_name || "Customer");
    const safeCustomerEmail = escapeHtml(customer_email || "N/A");
    const safeCustomerPhone = escapeHtml(customer_phone || "N/A");
    const safeShippingAddress = escapeHtml(shipping_address || "Standard Delivery");
    const safeInvoiceNo = escapeHtml(invoice_no || "N/A");
    const safeDate = escapeHtml(order_date || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }));
    const safeWarehouse = escapeHtml(warehouse_name || "Central Fulfillment Center");
    const targetUrl = adminPortalUrl || `${DEFAULT_FRONTEND_URL}/orders`;

    const itemsRows = (items || []).map((it, idx) => {
        const bg = idx % 2 === 0 ? EMAIL_PALETTE.bgCard : EMAIL_PALETTE.bgAlt;
        const name = escapeHtml(it.product_name || it.name || "Item");
        const code = escapeHtml(it.product_code || it.code || "");
        const image = it.product_image && String(it.product_image).startsWith("http") ? it.product_image : null;
        const qty = escapeHtml(it.quantity || 1);
        const price = Number(it.unitcost || it.selling_price || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
        const lineTotal = Number(it.total || (it.quantity * (it.unitcost || it.selling_price || 0))).toLocaleString("en-IN", { style: "currency", currency: "INR" });

        return `
            <tr bgcolor="${bg}" style="background-color: ${bg}; border-bottom: 1px solid ${EMAIL_PALETTE.borderColor};">
                <td style="padding: 10px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textPrimary};">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            ${image ? `
                            <td style="padding-right: 10px; vertical-align: middle;">
                                <img src="${image}" alt="${name}" width="38" height="38" style="width: 38px; height: 38px; object-fit: cover; border-radius: 6px; border: 1px solid ${EMAIL_PALETTE.borderColor}; display: block;" />
                            </td>
                            ` : ""}
                            <td style="vertical-align: middle;">
                                <div style="font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">${name}</div>
                                ${code ? `<div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: ${EMAIL_PALETTE.textMuted};">SKU: ${code}</div>` : ""}
                            </td>
                        </tr>
                    </table>
                </td>
                <td align="center" style="padding: 10px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textSecondary}; text-align: center; font-weight: 600;">${qty}</td>
                <td align="right" style="padding: 10px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textSecondary}; text-align: right;">${price}</td>
                <td align="right" style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary}; text-align: right;">${lineTotal}</td>
            </tr>
        `;
    }).join("");

    const fmtSubTotal = Number(sub_total || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
    const fmtGst = Number(gst || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
    const fmtTotal = Number(total || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });

    const content = `
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td>
                        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1d4ed8; display: block; margin-bottom: 4px;">
                            ADMIN NOTIFICATION • NEW ORDER RECEIVED
                        </span>
                        <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #1e3a8a;">
                            Invoice #${safeInvoiceNo}
                        </h2>
                    </td>
                    <td align="right" style="text-align: right;">
                        <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">
                            Pending Fulfillment
                        </span>
                    </td>
                </tr>
            </table>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 15px; color: ${EMAIL_PALETTE.textSecondary}; line-height: 1.6;">
            A customer has just placed an order on <strong>${escapeHtml(BRAND_NAME)}</strong>. Details of the customer and the ordered products are provided below:
        </p>

        <!-- Customer & Order Meta Grid -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
            <tr>
                <td width="48%" valign="top" style="background-color: ${EMAIL_PALETTE.bgAlt}; border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; padding: 14px 16px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${EMAIL_PALETTE.textMuted}; margin-bottom: 6px;">
                        👤 Customer Information
                    </div>
                    <div style="font-size: 14px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary}; margin-bottom: 4px;">
                        ${safeCustomerName}
                    </div>
                    <div style="font-size: 12px; color: ${EMAIL_PALETTE.textSecondary}; margin-bottom: 2px;">
                        📧 ${safeCustomerEmail}
                    </div>
                    <div style="font-size: 12px; color: ${EMAIL_PALETTE.textSecondary};">
                        📞 ${safeCustomerPhone}
                    </div>
                </td>
                <td width="4%"></td>
                <td width="48%" valign="top" style="background-color: ${EMAIL_PALETTE.bgAlt}; border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; padding: 14px 16px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${EMAIL_PALETTE.textMuted}; margin-bottom: 6px;">
                        🏢 Warehouse & Order Meta
                    </div>
                    <div style="font-size: 13px; color: ${EMAIL_PALETTE.textPrimary}; margin-bottom: 4px;">
                        <strong>Warehouse:</strong> ${safeWarehouse}
                    </div>
                    <div style="font-size: 13px; color: ${EMAIL_PALETTE.textPrimary}; margin-bottom: 4px;">
                        <strong>Order Date:</strong> ${safeDate}
                    </div>
                    <div style="font-size: 13px; color: ${EMAIL_PALETTE.textPrimary};">
                        <strong>Items Count:</strong> ${(items || []).length} product(s)
                    </div>
                </td>
            </tr>
        </table>

        <!-- Shipping Address Card -->
        <div style="background-color: ${EMAIL_PALETTE.bgAlt}; border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${EMAIL_PALETTE.textMuted}; margin-bottom: 4px;">
                📍 Shipping / Delivery Destination
            </div>
            <div style="font-size: 13px; color: ${EMAIL_PALETTE.textPrimary}; line-height: 1.5;">
                ${safeShippingAddress}
            </div>
        </div>

        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${EMAIL_PALETTE.textPrimary};">
            Ordered Products Breakdown:
        </h3>

        <!-- Order Items Table -->
        <div style="border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; overflow: hidden; margin-bottom: 18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: left; border-collapse: collapse;">
                <thead>
                    <tr bgcolor="${EMAIL_PALETTE.bgAlt}" style="background-color: ${EMAIL_PALETTE.bgAlt}; border-bottom: 1px solid ${EMAIL_PALETTE.borderColor};">
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase;">Product & SKU</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: center;">Qty</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: right;">Unit Price</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: right;">Line Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>
        </div>

        <!-- Totals Table -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
            <tr>
                <td width="55%"></td>
                <td width="45%">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 14px;">
                        <tr>
                            <td style="padding: 4px 0; color: ${EMAIL_PALETTE.textMuted};">Subtotal:</td>
                            <td align="right" style="padding: 4px 0; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 600;">${fmtSubTotal}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: ${EMAIL_PALETTE.textMuted};">GST (18%):</td>
                            <td align="right" style="padding: 4px 0; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 600;">${fmtGst}</td>
                        </tr>
                        <tr style="border-top: 1px solid ${EMAIL_PALETTE.borderColor};">
                            <td style="padding: 8px 0; font-size: 16px; font-weight: 800; color: ${EMAIL_PALETTE.textPrimary};">Order Total:</td>
                            <td align="right" style="padding: 8px 0; font-size: 16px; font-weight: 800; color: ${EMAIL_PALETTE.brandPrimary};">${fmtTotal}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        ${renderBulletproofButton("Manage Order in Admin Portal", targetUrl)}

        <div style="border-top: 1px solid ${EMAIL_PALETTE.borderColor}; padding-top: 18px; margin-top: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${EMAIL_PALETTE.textSecondary}; font-weight: 600;">
                Best regards,
            </p>
            <p style="margin: 0; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 700;">
                ${escapeHtml(BRAND_NAME)} Order Processing System
            </p>
        </div>
    `;

    return {
        subject: `🛒 New Customer Order Placed – #${invoice_no} – ${BRAND_NAME}`,
        text: `New customer order #${invoice_no} received from ${safeCustomerName} (${safeCustomerEmail}) totaling ${fmtTotal}.\n\nItems: ${(items || []).map(i => `${i.product_name} (x${i.quantity}) - ₹${i.total}`).join(", ")}\n\nDelivery destination: ${shipping_address || "Standard"}\n\nManage in Admin Portal: ${targetUrl}\n\nInventoryPro Order System`,
        html: baseEmailWrapper({
            content,
            previewText: `New order #${invoice_no} by ${safeCustomerName} totaling ${fmtTotal}`,
            categoryTag: "Admin notification",
        }),
    };
};

/**
 * 12. Customer Return Request Confirmation Email Template
 * Trigger: Customer submits a return request for an order
 * Recipient: Customer
 */
export const getCustomerReturnConfirmationEmailTemplate = ({
    username,
    return_no,
    invoice_no,
    reason,
    notes,
    items = [],
    warehouse_name = "",
    portalUrl,
}) => {
    const safeUsername = escapeHtml(username || "Valued Customer");
    const safeReturnNo = escapeHtml(return_no || "N/A");
    const safeInvoiceNo = escapeHtml(invoice_no || "N/A");
    const safeReason = escapeHtml(reason || "Not specified");
    const safeNotes = escapeHtml(notes || "");
    const safeWhName = escapeHtml(warehouse_name || "Central Fulfillment Hub");
    const targetUrl = portalUrl || `${DEFAULT_FRONTEND_URL}/customer/returns`;

    const itemsRows = (items || []).map((it, idx) => {
        const bg = idx % 2 === 0 ? EMAIL_PALETTE.bgCard : EMAIL_PALETTE.bgAlt;
        const name = escapeHtml(it.product_name || "Returned Item");
        const code = escapeHtml(it.product_code || "—");
        const image = it.product_image && String(it.product_image).startsWith("http") ? it.product_image : null;
        const qty = escapeHtml(it.quantity || 1);
        const price = Number(it.unit_price || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });

        return `
            <tr bgcolor="${bg}" style="background-color: ${bg}; border-bottom: 1px solid ${EMAIL_PALETTE.borderColor};">
                <td style="padding: 10px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textPrimary};">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            ${image ? `
                            <td style="padding-right: 10px; vertical-align: middle;">
                                <img src="${image}" alt="${name}" width="38" height="38" style="width: 38px; height: 38px; object-fit: cover; border-radius: 6px; border: 1px solid ${EMAIL_PALETTE.borderColor}; display: block;" />
                            </td>
                            ` : ""}
                            <td style="vertical-align: middle;">
                                <div style="font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">${name}</div>
                                ${code ? `<div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: ${EMAIL_PALETTE.textMuted};">SKU: ${code}</div>` : ""}
                            </td>
                        </tr>
                    </table>
                </td>
                <td align="center" style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary}; text-align: center;">${qty}</td>
                <td align="right" style="padding: 10px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textSecondary}; text-align: right;">${price}</td>
            </tr>
        `;
    }).join("");

    const content = `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td>
                        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #15803d; display: block; margin-bottom: 4px;">
                            RETURN REQUEST INITIATED
                        </span>
                        <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #166534;">
                            Return #${safeReturnNo}
                        </h2>
                    </td>
                    <td align="right" style="text-align: right;">
                        <span style="display: inline-block; background-color: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">
                            Under Review
                        </span>
                    </td>
                </tr>
            </table>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 16px; color: ${EMAIL_PALETTE.textSecondary};">
            Dear <strong>${safeUsername}</strong>,
        </p>

        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: ${EMAIL_PALETTE.textSecondary};">
            We have received your return request for Order <strong>#${safeInvoiceNo}</strong>. Our inventory inspection team is currently reviewing your request.
        </p>

        <!-- Return Meta Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px; background-color: ${EMAIL_PALETTE.bgAlt}; border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; padding: 14px 16px;">
            <tr>
                <td width="50%" valign="top">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${EMAIL_PALETTE.textMuted}; margin-bottom: 4px;">
                        Reason for Return
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">
                        ${safeReason}
                    </div>
                </td>
                <td width="50%" valign="top">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${EMAIL_PALETTE.textMuted}; margin-bottom: 4px;">
                        Fulfillment Facility
                    </div>
                    <div style="font-size: 13px; font-weight: 600; color: ${EMAIL_PALETTE.textPrimary};">
                        ${safeWhName}
                    </div>
                </td>
            </tr>
            ${safeNotes ? `
            <tr>
                <td colspan="2" style="padding-top: 10px; border-top: 1px dashed ${EMAIL_PALETTE.borderColor}; margin-top: 10px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${EMAIL_PALETTE.textMuted}; margin-bottom: 2px;">
                        Customer Comments
                    </div>
                    <div style="font-size: 12px; color: ${EMAIL_PALETTE.textSecondary}; font-style: italic;">
                        "${safeNotes}"
                    </div>
                </td>
            </tr>
            ` : ""}
        </table>

        <!-- Items Table -->
        <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">
            Items to Return:
        </p>
        <div style="border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: left; border-collapse: collapse;">
                <thead>
                    <tr bgcolor="${EMAIL_PALETTE.bgAlt}" style="background-color: ${EMAIL_PALETTE.bgAlt}; border-bottom: 1px solid ${EMAIL_PALETTE.borderColor};">
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase;">Product</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: center;">Qty</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>
        </div>

        <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #1e293b;">
                What happens next?
            </p>
            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #475569;">
                Our warehouse team will inspect your return request within 24–48 hours. Once approved, you will receive an update email with item drop-off/pickup instructions and automated refund status.
            </p>
        </div>

        ${renderBulletproofButton("Track Return Status in Portal", targetUrl)}

        <div style="border-top: 1px solid ${EMAIL_PALETTE.borderColor}; padding-top: 18px; margin-top: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${EMAIL_PALETTE.textSecondary}; font-weight: 600;">
                Best regards,
            </p>
            <p style="margin: 0; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 700;">
                ${escapeHtml(BRAND_NAME)} Customer Support & Returns
            </p>
        </div>
    `;

    return {
        subject: `Return Request Received - #${return_no} (Order #${invoice_no}) – ${BRAND_NAME}`,
        text: `Dear ${safeUsername},\n\nWe have received your return request #${return_no} for Order #${invoice_no}.\nReason: ${safeReason}\n\nTrack status: ${targetUrl}\n\nBest regards,\n${BRAND_NAME} Team`,
        html: baseEmailWrapper({
            content,
            previewText: `Return request #${return_no} received for Order #${invoice_no}`,
            categoryTag: "Return confirmation",
        }),
    };
};

/**
 * 13. Admin New Return Request Alert Email Template
 * Trigger: Customer submits a return request
 * Recipient: Admin(s)
 */
export const getAdminNewReturnAlertEmailTemplate = ({
    admin_name,
    customer_name,
    customer_email,
    customer_phone,
    return_no,
    invoice_no,
    reason,
    notes,
    items = [],
    warehouse_name = "",
    adminPortalUrl,
}) => {
    const safeAdminName = escapeHtml(admin_name || "Admin");
    const safeCustomerName = escapeHtml(customer_name || "Customer");
    const safeCustomerEmail = escapeHtml(customer_email || "N/A");
    const safeCustomerPhone = escapeHtml(customer_phone || "N/A");
    const safeReturnNo = escapeHtml(return_no || "N/A");
    const safeInvoiceNo = escapeHtml(invoice_no || "N/A");
    const safeReason = escapeHtml(reason || "Not specified");
    const safeNotes = escapeHtml(notes || "");
    const safeWhName = escapeHtml(warehouse_name || "Central Fulfillment Hub");
    const targetUrl = adminPortalUrl || `${DEFAULT_FRONTEND_URL}/returns`;

    const itemsRows = (items || []).map((it, idx) => {
        const bg = idx % 2 === 0 ? EMAIL_PALETTE.bgCard : EMAIL_PALETTE.bgAlt;
        const name = escapeHtml(it.product_name || "Returned Item");
        const code = escapeHtml(it.product_code || "—");
        const image = it.product_image && String(it.product_image).startsWith("http") ? it.product_image : null;
        const qty = escapeHtml(it.quantity || 1);
        const price = Number(it.unit_price || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
        const lineTotal = Number((it.quantity || 1) * (it.unit_price || 0)).toLocaleString("en-IN", { style: "currency", currency: "INR" });

        return `
            <tr bgcolor="${bg}" style="background-color: ${bg}; border-bottom: 1px solid ${EMAIL_PALETTE.borderColor};">
                <td style="padding: 10px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textPrimary};">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            ${image ? `
                            <td style="padding-right: 10px; vertical-align: middle;">
                                <img src="${image}" alt="${name}" width="38" height="38" style="width: 38px; height: 38px; object-fit: cover; border-radius: 6px; border: 1px solid ${EMAIL_PALETTE.borderColor}; display: block;" />
                            </td>
                            ` : ""}
                            <td style="vertical-align: middle;">
                                <div style="font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">${name}</div>
                                ${code ? `<div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: ${EMAIL_PALETTE.textMuted};">SKU: ${code}</div>` : ""}
                            </td>
                        </tr>
                    </table>
                </td>
                <td align="center" style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary}; text-align: center;">${qty}</td>
                <td align="right" style="padding: 10px 14px; font-size: 13px; color: ${EMAIL_PALETTE.textSecondary}; text-align: right;">${price}</td>
                <td align="right" style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary}; text-align: right;">${lineTotal}</td>
            </tr>
        `;
    }).join("");

    const content = `
        <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td>
                        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #c2410c; display: block; margin-bottom: 4px;">
                            ADMIN NOTIFICATION • NEW RETURN REQUEST
                        </span>
                        <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #9a3412;">
                            Return #${safeReturnNo}
                        </h2>
                    </td>
                    <td align="right" style="text-align: right;">
                        <span style="display: inline-block; background-color: #ffedd5; color: #c2410c; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">
                            Action Required
                        </span>
                    </td>
                </tr>
            </table>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 15px; color: ${EMAIL_PALETTE.textSecondary}; line-height: 1.6;">
            A customer has submitted a new product return request on <strong>${escapeHtml(BRAND_NAME)}</strong>. Details of the customer, order, and requested items are shown below:
        </p>

        <!-- Customer & Order Meta Grid -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
            <tr>
                <td width="48%" valign="top" style="background-color: ${EMAIL_PALETTE.bgAlt}; border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; padding: 14px 16px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${EMAIL_PALETTE.textMuted}; margin-bottom: 6px;">
                        👤 Customer Details
                    </div>
                    <div style="font-size: 14px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary}; margin-bottom: 4px;">
                        ${safeCustomerName}
                    </div>
                    <div style="font-size: 12px; color: ${EMAIL_PALETTE.textSecondary}; margin-bottom: 2px;">
                        📧 ${safeCustomerEmail}
                    </div>
                    <div style="font-size: 12px; color: ${EMAIL_PALETTE.textSecondary};">
                        📞 ${safeCustomerPhone}
                    </div>
                </td>
                <td width="4%"></td>
                <td width="48%" valign="top" style="background-color: ${EMAIL_PALETTE.bgAlt}; border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; padding: 14px 16px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${EMAIL_PALETTE.textMuted}; margin-bottom: 6px;">
                        📦 Order & Warehouse
                    </div>
                    <div style="font-size: 14px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary}; margin-bottom: 4px;">
                        Order #${safeInvoiceNo}
                    </div>
                    <div style="font-size: 12px; color: ${EMAIL_PALETTE.textSecondary}; margin-bottom: 2px;">
                        Facility: <strong>${safeWhName}</strong>
                    </div>
                    <div style="font-size: 12px; color: #c2410c; font-weight: 600;">
                        Reason: ${safeReason}
                    </div>
                </td>
            </tr>
        </table>

        ${safeNotes ? `
        <div style="background-color: #f8fafc; border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${EMAIL_PALETTE.textMuted}; margin-bottom: 4px;">
                Customer Notes / Explanation
            </div>
            <div style="font-size: 13px; color: ${EMAIL_PALETTE.textPrimary}; line-height: 1.5;">
                "${safeNotes}"
            </div>
        </div>
        ` : ""}

        <!-- Items Table -->
        <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: ${EMAIL_PALETTE.textPrimary};">
            Requested Return Item(s):
        </p>
        <div style="border: 1px solid ${EMAIL_PALETTE.borderColor}; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: left; border-collapse: collapse;">
                <thead>
                    <tr bgcolor="${EMAIL_PALETTE.bgAlt}" style="background-color: ${EMAIL_PALETTE.bgAlt}; border-bottom: 1px solid ${EMAIL_PALETTE.borderColor};">
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase;">Product</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: center;">Qty</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: right;">Unit Price</th>
                        <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${EMAIL_PALETTE.textSecondary}; text-transform: uppercase; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>
        </div>

        ${renderBulletproofButton("Review & Process Return in Admin Portal", targetUrl)}

        <div style="border-top: 1px solid ${EMAIL_PALETTE.borderColor}; padding-top: 18px; margin-top: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${EMAIL_PALETTE.textSecondary}; font-weight: 600;">
                Best regards,
            </p>
            <p style="margin: 0; font-size: 14px; color: ${EMAIL_PALETTE.textPrimary}; font-weight: 700;">
                ${escapeHtml(BRAND_NAME)} Returns & RMA Processing System
            </p>
        </div>
    `;

    return {
        subject: `⚠️ New Customer Return Request – #${return_no} (Order #${invoice_no}) – ${BRAND_NAME}`,
        text: `New customer return request #${return_no} submitted by ${safeCustomerName} (${safeCustomerEmail}) for Order #${invoice_no}.\nReason: ${safeReason}\n\nReview in Admin Portal: ${targetUrl}\n\nInventoryPro Returns System`,
        html: baseEmailWrapper({
            content,
            previewText: `New return request #${return_no} submitted by ${safeCustomerName} for Order #${invoice_no}`,
            categoryTag: "Admin return alert",
        }),
    };
};
