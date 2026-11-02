import { Order } from "../models/order.model.js";
import { OrderDetail } from "../models/order-detail.model.js";
import { Product } from "../models/product.model.js";
import { Customer } from "../models/customer.model.js";
import { Warehouse } from "../models/warehouse.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import orderService from "../services/order.service.js";
import PDFDocument from "pdfkit";
import transporter from "../utils/nodemailer.js";
import {
    getOrderConfirmationEmailTemplate,
    getOrderStatusUpdateEmailTemplate,
    getAdminNewOrderAlertEmailTemplate,
    getLowStockAlertEmailTemplate,
} from "../utils/emailTemplates.js";

const createOrder = asyncHandler(async (req, res, next) => {
    try {
        const order = await orderService.createOrder(req.body, req.user._id);
        if (order?._id) {
            sendOrderConfirmationNotification(order._id);
            if (req.body.items && Array.isArray(req.body.items)) {
                checkAndTriggerLowStockAlert(req.body.items.map((i) => i.product_id));
            }
        }
        return res
            .status(201)
            .json(new ApiResponse(201, order, "Order created successfully"));
    } catch (err) {
        return next(err);
    }
});

const getAllOrders = asyncHandler(async (req, res, next) => {
    const {
        search,
        customer_id,
        start_date,
        end_date,
        order_status,
        min_total,
        max_total,
        sort_by,
        sort_order,
        page = 1,
        limit = 10,
    } = req.query;

    const filter = {};

    if (req.user.role === "customer") {
        filter.$or = [
            { customer_user_id: req.user._id },
            { created_by: req.user._id },
        ];
    } else if (req.user.role === "manager") {
        const assignedIds = (req.user.assigned_warehouses || []).map((id) =>
            id?._id ? id._id : id
        );
        filter.$or = [
            { warehouse_id: { $in: assignedIds } },
            { created_by: req.user._id },
        ];
    } // Admin sees all orders

    if (search) {
        const searchClause = { invoice_no: { $regex: search, $options: "i" } };
        if (filter.$or) {
            filter.$and = [{ $or: filter.$or }, searchClause];
            delete filter.$or;
        } else {
            filter.$or = [searchClause];
        }
    }

    if (customer_id) filter.customer_id = customer_id;
    if (order_status) filter.order_status = order_status;

    if (start_date || end_date) {
        filter.order_date = {};
        if (start_date) filter.order_date.$gte = new Date(start_date);
        if (end_date) filter.order_date.$lte = new Date(end_date);
    }

    if (min_total || max_total) {
        filter.total = {};
        if (min_total) filter.total.$gte = parseFloat(min_total);
        if (max_total) filter.total.$lte = parseFloat(max_total);
    }

    const sortOptions = sort_by
        ? { [sort_by]: sort_order === "desc" ? -1 : 1 }
        : { createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate("customer_id", "name")
                .populate("warehouse_id", "warehouse_name warehouse_code")
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Order.countDocuments(filter),
        ]);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    orders,
                    pagination: {
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: Math.ceil(total / parseInt(limit)),
                    },
                },
                "Orders fetched successfully"
            )
        );
    } catch (err) {
        return next(new ApiError(500, err.message));
    }
});

const getAllOrdersAdmin = getAllOrders;

const getOrderDetails = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    try {
        const order = await Order.findById(id);

        if (!order) {
            return next(new ApiError(404, "Order not found"));
        }

        if (req.user.role === "customer") {
            const isOwner =
                (order.customer_user_id &&
                    order.customer_user_id.toString() === req.user._id.toString()) ||
                order.created_by.toString() === req.user._id.toString();
            if (!isOwner) {
                return next(
                    new ApiError(403, "You are not authorized to access this order")
                );
            }
        } else if (req.user.role === "manager") {
            const assignedIds = (req.user.assigned_warehouses || []).map((w) =>
                w?._id ? w._id.toString() : w.toString()
            );
            const whId = order.warehouse_id ? order.warehouse_id.toString() : null;
            if (
                whId &&
                !assignedIds.includes(whId) &&
                order.created_by.toString() !== req.user._id.toString()
            ) {
                return next(
                    new ApiError(
                        403,
                        "You are not authorized to view orders for unassigned facilities"
                    )
                );
            }
        }

        const details = await OrderDetail.getDetailsByOrderId(id);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    details,
                    "Order details fetched successfully"
                )
            );
    } catch (err) {
        return next(new ApiError(500, err.message));
    }
});

const updateOrderStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { order_status } = req.body;

    if (!order_status) {
        return next(new ApiError(400, "Order status is required"));
    }

    try {
        const order = await orderService.updateOrderStatus(
            id,
            order_status,
            req.user._id,
            req.user.role,
            req.user.assigned_warehouses || []
        );

        // Asynchronously notify customer of order status update
        sendOrderStatusNotification(id, order_status);

        return res
            .status(200)
            .json(
                new ApiResponse(200, order, "Order status updated successfully")
            );
    } catch (err) {
        return next(err);
    }
});

const generateInvoice = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    try {
        const orderDetails = await Order.getOrderWithDetails(
            id,
            req.user._id,
            req.user.role
        );

        if (!orderDetails) {
            return next(
                new ApiError(
                    404,
                    "Order not found or you don't have permission to access it"
                )
            );
        }

        const doc = new PDFDocument({
            margin: 50,
            size: "A4",
            bufferPages: true,
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=invoice-${orderDetails.invoice_no}.pdf`
        );

        doc.pipe(res);

        const primaryColor = "#34495e";
        const accentColor = "#3498db";
        const subtleColor = "#95a5a6";
        const highlightColor = "#2980b9";

        doc.fontSize(32)
            .fillColor(primaryColor)
            .font("Helvetica-Bold")
            .text("Inventory", 50, 50, { continued: true })
            .fillColor(accentColor)
            .text("Pro", { align: "left" });

        doc.moveTo(50, 90)
            .lineTo(550, 90)
            .strokeColor(subtleColor)
            .lineWidth(0.5)
            .stroke();

        doc.fontSize(11)
            .fillColor(subtleColor)
            .font("Helvetica")
            .text("INVOICE", 50, 105);

        doc.fontSize(20)
            .fillColor(primaryColor)
            .font("Helvetica-Bold")
            .text(`#${orderDetails.invoice_no}`, 50, 125);

        doc.fontSize(10)
            .fillColor(subtleColor)
            .font("Helvetica")
            .text(
                `Issued: ${new Date(orderDetails.order_date).toLocaleDateString()}`,
                50,
                150
            );

        doc.moveTo(50, 170).lineTo(550, 170).stroke(accentColor);

        const billingY = 190;
        doc.fontSize(11)
            .fillColor(subtleColor)
            .font("Helvetica")
            .text("BILL TO", 50, billingY);
        doc.fontSize(14)
            .fillColor(primaryColor)
            .font("Helvetica-Bold")
            .text(orderDetails.customer_name, 50, billingY + 20);
        doc.fontSize(10)
            .fillColor(primaryColor)
            .font("Helvetica")
            .text(orderDetails.customer_address, 50, billingY + 40, {
                width: 200,
            })
            .text(`Phone: ${orderDetails.customer_phone}`, 50, doc.y + 10);

        const tableTop = 290;
        doc.rect(50, tableTop, 500, 30).fill("#f8f9fa");

        doc.fillColor(primaryColor)
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("ITEM", 70, tableTop + 10)
            .text("QUANTITY", 280, tableTop + 10)
            .text("PRICE", 375, tableTop + 10)
            .text("AMOUNT", 470, tableTop + 10);

        doc.moveTo(50, tableTop + 30)
            .lineTo(550, tableTop + 30)
            .stroke(subtleColor);

        let tableRowY = tableTop + 40;
        const lineHeight = 25;

        orderDetails.orderItems.forEach((item, index) => {
            doc.fillColor(primaryColor)
                .font("Helvetica")
                .fontSize(10)
                .text(item.product_name, 70, tableRowY, { width: 200 })
                .text(item.quantity.toString(), 300, tableRowY)
                .text(`$${item.unitcost.toFixed(2)}`, 370, tableRowY)
                .font("Helvetica-Bold")
                .text(`$${item.total.toFixed(2)}`, 470, tableRowY);

            tableRowY += lineHeight;

            if (index < orderDetails.orderItems.length - 1) {
                doc.moveTo(70, tableRowY - 5)
                    .lineTo(530, tableRowY - 5)
                    .strokeColor(subtleColor)
                    .opacity(0.3)
                    .lineWidth(0.5)
                    .stroke()
                    .opacity(1);
            }
        });

        const summaryY = tableRowY + 20;
        doc.moveTo(350, summaryY)
            .lineTo(550, summaryY)
            .strokeColor(subtleColor)
            .lineWidth(0.5)
            .stroke();

        doc.fillColor(primaryColor)
            .font("Helvetica")
            .fontSize(10)
            .text("Subtotal", 370, summaryY + 10)
            .text(`$${orderDetails.sub_total.toFixed(2)}`, 470, summaryY + 10, {
                align: "right",
            })
            .text("GST (18%)", 370, summaryY + 30)
            .text(
                `$${(orderDetails.total - orderDetails.sub_total).toFixed(2)}`,
                470,
                summaryY + 30,
                { align: "right" }
            );

        doc.moveTo(350, summaryY + 50)
            .lineTo(550, summaryY + 50)
            .strokeColor(subtleColor)
            .lineWidth(0.5)
            .stroke();
        doc.moveTo(350, summaryY + 52)
            .lineTo(550, summaryY + 52)
            .strokeColor(subtleColor)
            .lineWidth(0.5)
            .stroke();

        doc.font("Helvetica-Bold")
            .fontSize(14)
            .text("TOTAL", 370, summaryY + 60)
            .fillColor(highlightColor)
            .text(`$${orderDetails.total.toFixed(2)}`, 470, summaryY + 60, {
                align: "right",
            });

        const noteY = summaryY + 100;
        doc.moveTo(50, noteY).lineTo(550, noteY).stroke(subtleColor);

        doc.fillColor(primaryColor)
            .fontSize(10)
            .font("Helvetica")
            .text("Payment Information", 50, noteY + 20, { continued: true })
            .font("Helvetica-Bold")
            .text(": Please include the invoice number with your payment.");

        doc.fontSize(12)
            .font("Helvetica-Bold")
            .fillColor(accentColor)
            .text("Thank you for your business!", 50, noteY + 50);

        doc.fontSize(8)
            .fillColor(subtleColor)
            .font("Helvetica")
            .text(
                `InventoryPro - Invoice #${orderDetails.invoice_no}`,
                50,
                700,
                {
                    align: "center",
                    width: 500,
                }
            );

        const pageCount = doc.bufferedPageCount;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
                .fillColor(subtleColor)
                .text(`Page ${i + 1} of ${pageCount}`, 50, 720, {
                    align: "center",
                    width: 500,
                });
        }

        doc.end();
    } catch (err) {
        return next(new ApiError(500, err.message));
    }
});

// Customer: Self-service checkout for customer portal
const customerCheckout = asyncHandler(async (req, res, next) => {
    try {
        const { items, shipping_address } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return next(new ApiError(400, "Order must contain at least one item"));
        }

        // Find or create Customer profile for this customer user
        let customer = await Customer.findOne({ user_id: req.user._id });
        if (!customer) {
            customer = await Customer.create({
                name: req.user.username,
                email: req.user.email,
                phone: req.user.phone || "0000000000",
                address: shipping_address
                    ? `${shipping_address.street || ""}, ${shipping_address.city || ""}`
                    : "Customer Address",
                user_id: req.user._id,
                created_by: req.user._id,
            });
        }

        // Resolve default warehouse
        const defaultWh =
            (await Warehouse.findOne({ is_default: true })) ||
            (await Warehouse.findOne());

        if (!defaultWh) {
            return next(new ApiError(500, "No fulfillment warehouse available"));
        }

        let subTotal = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product_id);
            if (!product) {
                return next(new ApiError(404, `Product not found: ${item.product_id}`));
            }
            if (product.stock < item.quantity) {
                return next(
                    new ApiError(
                        400,
                        `Insufficient stock for product: ${product.product_name}`
                    )
                );
            }

            const itemTotal = product.selling_price * parseInt(item.quantity, 10);
            subTotal += itemTotal;

            processedItems.push({
                product_id: product._id,
                quantity: parseInt(item.quantity, 10),
                unit_price: product.selling_price,
                total: itemTotal,
            });
        }

        const gst = Math.round(subTotal * 0.18 * 100) / 100;
        const total = Math.round((subTotal + gst) * 100) / 100;

        const invoice_no = `INV-${Date.now().toString().slice(-6)}`;

        const order = await Order.create({
            customer_id: customer._id,
            customer_user_id: req.user._id,
            warehouse_id: defaultWh._id,
            order_date: new Date(),
            order_status: "pending",
            total_products: processedItems.reduce(
                (acc, cur) => acc + cur.quantity,
                0
            ),
            sub_total: subTotal,
            gst,
            total,
            invoice_no,
            shipping_address: shipping_address || null,
            created_by: req.user._id,
        });

        const orderDetails = processedItems.map((item) => ({
            order_id: order._id,
            product_id: item.product_id,
            quantity: item.quantity,
            unitcost: item.unit_price,
            unit_price: item.unit_price,
            total: item.total,
            created_by: req.user._id,
        }));

        await OrderDetail.insertMany(orderDetails);

        const createdOrder = await Order.findById(order._id)
            .populate("customer_id", "name email phone")
            .populate("warehouse_id", "warehouse_name");

        // Asynchronously notify customer with Order Confirmation Email and check low stock
        sendOrderConfirmationNotification(order._id);
        checkAndTriggerLowStockAlert(processedItems.map((i) => i.product_id));

        return res
            .status(201)
            .json(new ApiResponse(201, createdOrder, "Order placed successfully"));
    } catch (err) {
        return next(new ApiError(500, err.message));
    }
});

// Helper: send order confirmation email to both Customer and Admin
const sendOrderConfirmationNotification = async (orderId) => {
    try {
        const order = await Order.findById(orderId)
            .populate("customer_id")
            .populate("customer_user_id", "email username name phone")
            .populate("warehouse_id", "warehouse_name warehouse_code");

        if (!order) return;

        const customerUser = order.customer_user_id;
        const customerProfile = order.customer_id;
        const customerEmail = customerUser?.email || customerProfile?.email;
        const customerName =
            customerUser?.username ||
            customerUser?.name ||
            customerProfile?.name ||
            "Valued Customer";
        const customerPhone = customerUser?.phone || customerProfile?.phone || "";

        const formatAddress = (addr) => {
            if (!addr) return "";
            if (typeof addr === "string") return addr;
            const parts = [
                addr.street || addr.address_line,
                addr.city,
                addr.state,
                addr.pincode || addr.postal_code,
            ].filter(Boolean);
            return parts.length > 0 ? parts.join(", ") : "";
        };

        const formattedShippingAddress =
            formatAddress(order.shipping_address) ||
            (customerProfile?.address ? String(customerProfile.address) : "Standard Delivery Address");

        const details = await OrderDetail.find({ order_id: order._id }).populate(
            "product_id",
            "product_name product_code product_image selling_price"
        );

        const items = details.map((d) => ({
            product_name: d.product_id?.product_name || "Product Item",
            product_code: d.product_id?.product_code || "",
            product_image: d.product_id?.product_image || "",
            quantity: d.quantity,
            unitcost: d.unitcost || d.unit_price || d.product_id?.selling_price || 0,
            total: d.total || ((d.unitcost || d.unit_price || 0) * d.quantity),
        }));

        const orderDateStr = order.order_date
            ? new Date(order.order_date).toLocaleDateString("en-IN", {
                  dateStyle: "medium",
              })
            : new Date().toLocaleDateString("en-IN", { dateStyle: "medium" });

        // 1. Send Order Confirmation Email to Customer
        if (customerEmail) {
            try {
                const customerTemplate = getOrderConfirmationEmailTemplate({
                    username: customerName,
                    invoice_no: order.invoice_no,
                    order_date: orderDateStr,
                    items,
                    sub_total: order.sub_total,
                    gst: order.gst,
                    total: order.total,
                    shipping_address: formattedShippingAddress,
                    customer_phone: customerPhone,
                    portalUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/customer/orders`,
                });

                await transporter.sendMail({
                    from: `"InventoryPro" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
                    to: customerEmail,
                    ...customerTemplate,
                });
                console.log(
                    `📧 Customer order confirmation sent to ${customerEmail} for Invoice #${order.invoice_no}`
                );
            } catch (custErr) {
                console.warn(
                    "⚠️ Failed sending customer order confirmation email:",
                    custErr.message
                );
            }
        }

        // 2. Send Order Notification Email to Admin(s)
        try {
            const adminUsers = await User.find({ role: "admin" }).select(
                "email username name"
            );
            const adminEmails = new Set();

            adminUsers.forEach((admin) => {
                if (admin.email && admin.email.includes("@")) {
                    adminEmails.add(admin.email.trim().toLowerCase());
                }
            });

            if (
                process.env.ADMIN_EMAIL &&
                process.env.ADMIN_EMAIL.includes("@")
            ) {
                adminEmails.add(process.env.ADMIN_EMAIL.trim().toLowerCase());
            }

            if (
                adminEmails.size === 0 &&
                (process.env.SENDER_EMAIL || process.env.EMAIL_USER)
            ) {
                adminEmails.add(
                    (process.env.SENDER_EMAIL || process.env.EMAIL_USER)
                        .trim()
                        .toLowerCase()
                );
            }

            if (adminEmails.size > 0) {
                const adminTemplate = getAdminNewOrderAlertEmailTemplate({
                    admin_name: "Admin",
                    customer_name: customerName,
                    customer_email: customerEmail || "N/A",
                    customer_phone: customerPhone || "N/A",
                    shipping_address: formattedShippingAddress,
                    invoice_no: order.invoice_no,
                    order_date: orderDateStr,
                    warehouse_name:
                        order.warehouse_id?.warehouse_name ||
                        "Main Fulfillment Warehouse",
                    items,
                    sub_total: order.sub_total,
                    gst: order.gst,
                    total: order.total,
                    adminPortalUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/orders`,
                });

                for (const adminTo of Array.from(adminEmails)) {
                    await transporter.sendMail({
                        from: `"InventoryPro Order Alerts" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
                        to: adminTo,
                        ...adminTemplate,
                    });
                    console.log(
                        `📧 Admin new order alert sent to ${adminTo} for Invoice #${order.invoice_no}`
                    );
                }
            }
        } catch (adminErr) {
            console.warn(
                "⚠️ Failed sending admin new order alert email:",
                adminErr.message
            );
        }
    } catch (err) {
        console.warn("⚠️ Order confirmation notification failed:", err.message);
    }
};

// Helper: send order status update email
const sendOrderStatusNotification = async (orderId, newStatus) => {
    try {
        const order = await Order.findById(orderId)
            .populate("customer_id")
            .populate("customer_user_id", "email username name");

        if (!order) return;

        const customerUser = order.customer_user_id;
        const customerProfile = order.customer_id;
        const recipientEmail = customerUser?.email || customerProfile?.email;
        const customerName = customerUser?.username || customerProfile?.name || "Valued Customer";

        if (!recipientEmail) return;

        const emailTemplate = getOrderStatusUpdateEmailTemplate({
            username: customerName,
            invoice_no: order.invoice_no,
            order_status: newStatus,
            total: order.total,
            portalUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/customer/orders`,
        });

        await transporter.sendMail({
            from: `"InventoryPro" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
            to: recipientEmail,
            ...emailTemplate,
        });
        console.log(`📧 Order status update email sent to ${recipientEmail} (Invoice: #${order.invoice_no}, Status: ${newStatus})`);
    } catch (err) {
        console.warn("⚠️ Order status update email failed:", err.message);
    }
};

const checkAndTriggerLowStockAlert = async (productIds) => {
    try {
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) return;
        const uniqueIds = [...new Set(productIds.map((id) => (id?._id || id).toString()))];

        const products = await Product.find({ _id: { $in: uniqueIds } }).populate(
            "category_id",
            "category_name"
        );

        const lowStockProducts = products.filter((p) => {
            const threshold =
                p.min_threshold !== undefined && p.min_threshold !== null
                    ? p.min_threshold
                    : 5;
            return (p.stock || 0) <= threshold;
        });

        if (lowStockProducts.length === 0) return;

        const adminUsers = await User.find({
            role: { $in: ["admin", "manager"] },
        }).select("email username name");

        const adminEmails = new Set();
        adminUsers.forEach((u) => {
            if (u.email && u.email.includes("@")) {
                adminEmails.add(u.email.trim().toLowerCase());
            }
        });

        if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.includes("@")) {
            adminEmails.add(process.env.ADMIN_EMAIL.trim().toLowerCase());
        }
        if (
            adminEmails.size === 0 &&
            process.env.EMAIL_USER &&
            process.env.EMAIL_USER.includes("@")
        ) {
            adminEmails.add(process.env.EMAIL_USER.trim().toLowerCase());
        }

        if (adminEmails.size === 0) return;

        const emailTemplate = getLowStockAlertEmailTemplate({
            username: "Inventory Administrator",
            lowStockProducts: lowStockProducts.map((p) => ({
                product_name: p.product_name,
                product_code: p.product_code,
                stock: p.stock,
                category: p.category_id?.category_name || "General",
            })),
            threshold: 5,
        });

        for (const recipient of adminEmails) {
            try {
                await transporter.sendMail({
                    from: `"InventoryPro Alert" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
                    to: recipient,
                    ...emailTemplate,
                });
                console.log(
                    `🚨 Instant low-stock email alert sent to ${recipient} for ${lowStockProducts.length} items`
                );
            } catch (sendErr) {
                console.warn(
                    `⚠️ Failed sending low stock alert to ${recipient}:`,
                    sendErr.message
                );
            }
        }
    } catch (err) {
        console.warn("⚠️ checkAndTriggerLowStockAlert error:", err.message);
    }
};

export {
    createOrder,
    getAllOrders,
    getAllOrdersAdmin,
    getOrderDetails,
    updateOrderStatus,
    generateInvoice,
    customerCheckout,
    sendOrderConfirmationNotification,
    checkAndTriggerLowStockAlert,
};
