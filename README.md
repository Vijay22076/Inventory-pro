# 📦 InventoryPro — Enterprise Multi-Tenant Inventory & Warehouse Management System

[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.x-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/express-4.x-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/mongodb-Mongoose%208.x-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

**InventoryPro** is a production-ready, full-stack **Inventory Management System (IMS), Warehouse Management System (WMS), and Customer E-Commerce Storefront** built on the MERN stack (MongoDB, Express, React, Node.js). 

Designed for enterprise inventory tracking, multi-facility warehouse operations, and seamless digital commerce, InventoryPro handles the complete supply-chain lifecycle: from supplier procurement and atomic multi-warehouse stock allocations to customer ordering, automated Razorpay payment verification, instant GST invoice generation, automated customer return workflows (RMA), low-stock weekly schedulers, and double-entry immutable audit ledgers.

---

## 📑 Table of Contents

- [Key System Capabilities](#-key-system-capabilities)
- [System Personas & Role-Based Access Control](#-system-personas--role-based-access-control)
- [System Architecture](#-system-architecture)
- [Core Functional Modules](#-core-functional-modules)
  - [1. Product Catalog & Multi-Image Gallery](#1-product-catalog--multi-image-gallery)
  - [2. Warehouse Management System (WMS)](#2-warehouse-management-system-wms)
  - [3. Customer Storefront & Online Ordering](#3-customer-storefront--online-ordering)
  - [4. Customer Returns & RMA with Automated Refunds](#4-customer-returns--rma-with-automated-refunds)
  - [5. Business Reports & Low-Stock Alerts Engine](#5-business-reports--low-stock-alerts-engine)
  - [6. Immutable Double-Entry Stock Ledger](#6-immutable-double-entry-stock-ledger)
- [Technology Stack](#-technology-stack)
- [Database Architecture (17 Data Models)](#-database-architecture-17-data-models)
- [REST API Reference](#-rest-api-reference)
- [Installation & Getting Started](#-installation--getting-started)
- [Environment Variables](#-environment-variables)
- [Default System Credentials](#-default-system-credentials)
- [Security & Engineering Highlights](#-security--engineering-highlights)
- [Contributing & License](#-contributing--license)

---

## 🧠 Key System Capabilities

- **Atomic Stock Deductions & Replenishments**: Uses atomic MongoDB updates (`findOneAndUpdate` with `$gte` guards) and MongoDB session transactions (`startTransaction` / `abortTransaction`) to eliminate overselling and race conditions under heavy concurrent ordering.
- **Enterprise Multi-Image Support**: Products support galleries with up to 8 high-resolution images, primary cover photo selection, dynamic thumbnail switchers in drawers, table indicators (`+2`, `+3`), and storefront order preview carousels.
- **Rigid WMS Location Hierarchy**: Facility addresses strictly enforce `Street/Landmark → State (Dropdown) → City (Dropdown) → 6-digit PIN code ([0-9]{6})` with facility contact noise removed.
- **Dual-Party Automated Return Notifications**: When a customer requests a product return, automated Nodemailer/SMTP emails are simultaneously delivered to the **customer** (with tracking details) and the **admin** (with action-required review links).
- **Automated Razorpay Payment & Instant Refund Engine**: Online payment gateway verification via HMAC-SHA256 signatures, paired with automated Razorpay Refund API execution when administrators approve customer returns.
- **Automated Low-Stock Scheduler & Live Audit**: In-process `node-cron` scan runs every Monday at 9:00 AM IST to alert administrators of items falling below minimum safety thresholds, backed by a persistent MongoDB `AlertLog` table and an interactive manual test trigger in the UI.
- **On-the-Fly Branded GST Tax Invoices**: Generates PDF tax invoices on demand with `pdfkit`, incorporating itemised tables, GST tax rates, HSN codes, company details, and authorized signatures.
- **CSV Bulk Product Upload**: Ingests up to 500 rows per batch with per-row validation, reference resolution for categories/units, and HTTP 207 Multi-Status partial error reporting.

---

## 👥 System Personas & Role-Based Access Control

The platform enforces a strict 3-tier Role-Based Access Control (RBAC) hierarchy backed by JWT authentication:

```
                  ┌───────────────────────────────┐
                  │       System Personas         │
                  └──────────────┬────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
   ┌───────────┐           ┌───────────┐           ┌───────────┐
   │   Admin   │           │  Manager  │           │ Customer  │
   └─────┬─────┘           └─────┬─────┘           └─────┬─────┘
         │                       │                       │
         ├─ Full Global Access   ├─ Assigned Facilities  ├─ E-Commerce Storefront
         ├─ User & Role Mgmt     ├─ Inbound GRN          ├─ Live Stock Browsing
         ├─ Facility Allocations ├─ Stock Transfers      ├─ Cart & Instant Checkout
         ├─ Master Stock Reports ├─ Cycle Counts / Adj.  ├─ Real-time Order Tracking
         ├─ Alert Audit Controls ├─ RMA Approvals        ├─ Return Requests (RMA)
         └─ Financial Overview   └─ Warehouse Ledgers    └─ Saved Addresses & OTPs
```

| Feature / Permission | Admin | Warehouse Manager | Customer |
| :--- | :---: | :---: | :---: |
| Global Analytics & Valuation Dashboard | ✅ | ❌ | ❌ |
| User & Role Management (`/users`) | ✅ | ❌ | ❌ |
| Create / Edit Products & Galleries | ✅ | ❌ | ❌ |
| Warehouse Facility Setup & Location Config | ✅ | ❌ | ❌ |
| Inter-Warehouse Transfers & Approvals | ✅ | ✅ (Assigned) | ❌ |
| Stock Counts & Adjustments (`adjustment_add/deduct`) | ✅ | ✅ (Assigned) | ❌ |
| Customer Storefront Catalog (`/customer/catalog`) | ✅ | ✅ | ✅ |
| Place Orders & Pay via Razorpay / COD | ❌ | ❌ | ✅ |
| Request Product Returns (RMA) | ❌ | ❌ | ✅ |
| Authorize Returns & Issue Razorpay Refunds | ✅ | ✅ | ❌ |
| Restock Returned Goods into Facility | ✅ | ✅ | ❌ |
| Low-Stock Scheduler Controls & Audit Logs | ✅ | ❌ | ❌ |
| Stream Branded PDF Tax Invoices | ✅ | ✅ | ✅ (Own) |

---

## 🏛️ System Architecture

The application is structured into decoupled, maintainable layers following the **Controller-Service-Repository** pattern:

```
Frontend (React 18 + Vite + Ant Design + Tailwind CSS)
   │
   ▼ HTTP Requests / Axios Interceptors (JWT Bearer Token / HTTP-only Cookies)
Backend API (Express 4.x + Node.js ESM)
   │
   ├── Middlewares:
   │     ├── auth.middleware.js        (JWT extraction from Cookie/Header, user validation)
   │     ├── rbac.middleware.js        (requireRole: 'admin', 'manager', 'customer')
   │     ├── multer.middleware.js      (Memory/disk storage + MIME image/CSV validation)
   │     └── error.middleware.js       (Centralized error serialization to ApiError)
   │
   ├── Controllers:
   │     ├── product.controller.js     (Product CRUD, multi-image upload, stock ledger)
   │     ├── order.controller.js       (Order lifecycle, PDF invoice streaming)
   │     ├── payment.controller.js     (Razorpay order creation, HMAC signature verification)
   │     ├── return.controller.js      (Customer return requests, status machine, restock)
   │     ├── warehouse.controller.js   (WMS operations, facility CRUD, bin locations)
   │     └── scheduler.controller.js   (Cron controls, manual alert trigger, alert logs)
   │
   ├── Services:
   │     ├── order.service.js          (Order state machine, atomic stock deduction)
   │     ├── purchase.service.js       (Procurement lifecycle, GRN receiving, return preview)
   │     ├── warehouse.service.js      (Stock synchronization, multi-facility allocation)
   │     └── adjustment.service.js     (Physical inventory variance reconciliation)
   │
   └── Data & Utilities:
         ├── models/                   (17 Mongoose schemas with compound indexes)
         ├── utils/nodemailer.js       (Gmail SMTP singleton over TLS/SSL)
         ├── utils/emailTemplates.js   (Inline CSS, responsive HTML email templates)
         └── utils/lowStockScheduler.js(Singleton cron engine with alert logging)
```

---

## 🎯 Core Functional Modules

### 1. Product Catalog & Multi-Image Gallery
- **Product Identification**: Strictly enforces an 8-character uppercase alphanumeric SKU (`[A-Z0-9]{8}`, e.g., `MBP16001`, `ACGM0101`).
- **Multi-Image Gallery**: Upload up to 8 photos per item. Allows designated primary cover selection, live interactive thumbnail switching in product drawers, and drag-and-drop reordering.
- **Stock Tracking**: Stores unit cost, selling price, safety alert threshold (default: 10 units), and warehouse bin location (`A-01-01`).
- **Bulk CSV Upload**: Validates rows, resolves category and unit IDs automatically, deduplicates SKU codes, and returns HTTP 207 Multi-Status reports for failed rows.

### 2. Warehouse Management System (WMS)
- **Facility Master**: Create regional fulfillment centers (`WH-BLR-01`, `WH-MUM-01`) with strict location ordering: `Street/Landmark → State → City → 6-digit PIN code`.
- **Bin/Rack Locations**: Tracks precise storage locations within aisles and bins (`A-01-01`, `F-01-10`).
- **Inter-Warehouse Stock Transfers**: Manages inventory balancing between hubs with full status transitions (`pending → in_transit → completed / cancelled`).
- **Cycle Counts & Stock Adjustments**: Supports physical audit counts, calculating variances and logging double-entry movements (`adjustment_add` / `adjustment_deduct`) to maintain balanced books.

### 3. Customer Storefront & Online Ordering
- **Customer Shopping Experience**: Live catalog browsing with category tabs, real-time stock badges, search and price filters, multi-photo indicators, and product detail views.
- **Cart & Instant Checkout**: Persistent multi-item cart calculating subtotal, GST (18%), and final invoice total.
- **Payment Flexibility**:
  - **Online Payment**: Integrated Razorpay modal (UPI, Cards, NetBanking, Wallets) with cryptographically verified HMAC-SHA256 signatures.
  - **Cash on Delivery (COD)**: Instant order dispatch option with automated receipt generation.
- **Branded Tax Invoices**: Download official A4 PDF tax invoices with itemized totals, GST breakdowns, company credentials, and payment metadata.

### 4. Customer Returns & RMA with Automated Refunds
- **7-Day Customer Return Window**: Customers can select delivered orders, choose items to return, select categorized return reasons (`Defective`, `Damaged in Transit`, `Wrong Item`, `Size/Fit Issue`, `Other`), and enter details.
- **Dual Email Notification Engine**:
  - 📧 **Customer Confirmation**: Branded email confirming return submission, return reference `#RET-XXXXXX`, items, and tracking link.
  - 📧 **Admin Alert**: Immediate operational alert dispatched to administrators containing customer info, order number, warehouse facility, return reason, and review CTA.
- **Automated Razorpay Refund Execution**: When an admin authorizes a return, the system automatically calls the Razorpay Refund API to return the purchase amount to the customer's original payment method.
- **Warehouse Restock Reconciliation**: When returned items arrive at the facility, managers restock items directly into WMS inventory, restoring stock levels and logging an `adjustment_add` in the immutable Stock Ledger.

### 5. Business Reports & Low-Stock Alerts Engine
- **Reports Dashboard**:
  - **Stock Report**: In-stock, low-stock ($\le 10$), and out-of-stock inventory with valuation.
  - **Sales Report**: Daily, weekly, and monthly revenue analytics with filterable date ranges.
  - **Purchase Report**: Procurement expenditure, supplier order status, and GRN receipts.
  - **Top Products**: High-velocity products ranked by quantity sold and revenue generated.
- **Alerts & Audit Logs Module**:
  - Displays real-time logs of automated weekly cron scans and manual tests.
  - Displays KPI summary cards: Total Alerts Sent, Minimum Threshold ($\le 10$), Cron Schedule (Every Monday 9:00 AM IST), and SMTP Channel status.
  - Filterable audit history showing timestamps, trigger events (`Manual Test`, `Weekly Cron`), recipient email, alerted SKUs, deficit tags, and delivery status with SMTP message IDs.
  - **Trigger Live Alert**: Header and audit tab button allowing administrators to trigger a live low-stock email scan with modal confirmation.

### 6. Immutable Double-Entry Stock Ledger
Every stock mutation is recorded with before/after counts, quantity change, reference numbers, and timestamps:
- `purchase_receipt`: Inward goods from supplier purchase orders (GRN).
- `order_dispatch`: Outward customer sales order fulfillment.
- `transfer_out` / `transfer_in`: Inter-warehouse regional stock movements.
- `adjustment_add` / `adjustment_deduct`: Physical count reconciliations, product stock edits, and manual audits.
- `purchase_return`: Outward return of inventory back to suppliers.

---

## 🛠️ Technology Stack

| Layer | Component | Version / Library |
| :--- | :--- | :--- |
| **Frontend** | Framework | React 18, Vite 6.x |
| | Routing | React Router DOM v7 |
| | UI Components | Ant Design 5.x, Ant Design Icons |
| | Styling | Tailwind CSS 3.x, Custom CSS |
| | Charts & Analytics | Recharts, @ant-design/plots |
| | HTTP Client | Axios with request/response interceptors |
| | Toast Notifications | React Hot Toast |
| **Backend** | Runtime | Node.js (ES Modules, `"type": "module"`) |
| | Framework | Express 4.x |
| | Database Engine | MongoDB 7.x / MongoDB Atlas |
| | ODM | Mongoose 8.x |
| | Authentication | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| | File Uploads | Multer, Cloudinary SDK v2 |
| | Payments | Razorpay SDK (`razorpay`) with HMAC-SHA256 verification |
| | Email Engine | Nodemailer with Gmail SSL/TLS (port 465) |
| | PDF Generation | PDFKit (streaming A4 documents) |
| | Scheduler | `node-cron` (Weekly Cron Singleton) |
| | Barcode / QR | `bwip-js` (Code128, QR Code) |

---

## 🗄️ Database Architecture (17 Data Models)

```
       ┌───────────┐         1:N        ┌──────────────┐
       │   User    ├───────────────────►│   Category   │
       └─────┬─────┘                    └──────────────┘
             │               1:N        ┌──────────────┐
             ├─────────────────────────►│     Unit     │
             │                          └──────────────┘
             │               1:N        ┌──────────────┐
             ├─────────────────────────►│  Warehouse   │
             │                          └──────┬───────┘
             │                                 │
             │               1:N               ▼ 1:N
             ├─────────────────────────►┌──────────────┐
             │                          │WarehouseStock│
             │                          └──────▲───────┘
             │               1:N               │ 1:N
             ├─────────────────────────►┌──────┴───────┐
             │                          │   Product    │
             │                          └──────▲───────┘
             │                                 │ 1:N
             ▼ 1:N                             │
       ┌───────────┐         1:N        ┌──────┴───────┐
       │   Order   ├───────────────────►│ OrderDetail  │
       └─────┬─────┘                    └──────────────┘
             │               1:N        ┌──────────────┐
             ├─────────────────────────►│ReturnRequest │
             │                          └──────────────┘
             ▼ 1:N                              ▲
       ┌───────────┐                            │
       │StockLedger├────────────────────────────┘
       └───────────┘
```

1. **`User`**: Core identity model supporting roles (`admin`, `manager`, `customer`), password hashing, assigned warehouses, shipping addresses, OTP issuance, and token refresh.
2. **`Product`**: Product details, 8-character SKU, multi-image gallery array (`images`), primary cover (`product_image`), pricing, stock, min threshold, bin location, and category/unit references.
3. **`Warehouse`**: Facility metadata, warehouse code, capacity, default flag, and address (`street`, `state`, `city`, `pincode`).
4. **`WarehouseStock`**: Compound relationship mapping stock quantity and bin location per product per warehouse.
5. **`StockLedger`**: Double-entry ledger recording `quantity_before`, `quantity_change`, `quantity_after`, `transaction_type`, and `reference_no`.
6. **`Order`**: Sales orders, invoice numbers (`INV-XXXXXX`), order status, customer details, warehouse reference, totals, and Razorpay payment details.
7. **`OrderDetail`**: Line items for orders, recording product ID, quantity, unit cost, and line total.
8. **`ReturnRequest`**: RMA management storing `return_no` (`RET-XXXXXX`), order reference, returned items, reason, admin notes, status (`pending`, `approved`, `rejected`, `received`), and Razorpay refund details.
9. **`AlertLog`**: Persistent record of every alert transmission (`manual_test`, `scheduled_cron`, `order_event`), recipient email, alerted SKUs, delivery status, and SMTP message IDs.
10. **`Category`**: Product classification with user-level isolation and admin global visibility.
11. **`Unit`**: Measurement units (Piece, Box, Kilogram, Set, Meter, Liter).
12. **`Supplier`**: Vendor profiles, contact details, and bank account information.
13. **`Customer`**: External customer business profiles.
14. **`Purchase`**: Procurement orders (`PUR-XXXXXX`), supplier reference, status machine, and totals.
15. **`PurchaseDetail`**: Line items for purchases, recording unit cost, received quantities, and return histories.
16. **`StockTransfer`**: Inter-warehouse transfer records with transit tracking and approval signatures.
17. **`StockAdjustment`**: Physical inventory reconciliation records storing counted vs system variances.

---

## 🔌 REST API Reference

Base URL: `http://localhost:3001/api/v1`

All responses follow a consistent envelope structure:
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Operation successful",
  "success": true
}
```

### Core API Groups

| Group | Method | Endpoint | Access | Description |
| :--- | :---: | :--- | :---: | :--- |
| **Auth** | `POST` | `/users/register` | Public | Register new user account with role selection |
| | `POST` | `/users/login` | Public | Authenticate user, set HTTP-only JWT cookies |
| | `POST` | `/users/logout` | Private | Revoke refresh token and clear cookies |
| | `POST` | `/users/send-change-password-otp` | Private | Validates current password, sends 6-digit email OTP |
| | `POST` | `/users/verify-change-password-otp` | Private | Validates 6-digit email OTP |
| | `POST` | `/users/change-password` | Private | Commits new password with bcrypt hashing |
| | `GET` | `/users/current-user` | Private | Retrieve active authenticated session profile |
| **Products** | `GET` | `/products` | Private | List products with pagination, search, and category filters |
| | `POST` | `/products` | Admin | Create product with up to 8 gallery images |
| | `PATCH` | `/products/:id` | Admin | Update product details, stock adjustments, and gallery images |
| | `DELETE` | `/products/:id` | Admin | Soft/hard delete product from catalog |
| | `POST` | `/products/bulk-upload` | Admin | Upload CSV containing up to 500 product records |
| **Warehouses** | `GET` | `/warehouses` | Private | List all regional warehouse facilities |
| | `POST` | `/warehouses` | Admin | Create warehouse with state/city dropdowns and 6-digit PIN |
| | `PUT` | `/warehouses/:id` | Admin | Update warehouse facility address and details |
| | `GET` | `/warehouses/stock` | Private | Query product inventory per facility |
| | `POST` | `/transfers` | Manager+ | Initiate inter-warehouse stock transfer |
| | `POST` | `/adjustments` | Manager+ | Submit cycle count physical stock adjustment |
| **Customer Storefront** | `GET` | `/products` | Customer | Browse catalog with live regional availability |
| | `POST` | `/payments/create-order` | Customer | Create Razorpay payment order |
| | `POST` | `/payments/verify` | Customer | Verify HMAC-SHA256 signature and complete order |
| | `GET` | `/orders/my-orders` | Customer | View customer order history and tracking |
| | `GET` | `/orders/:id/invoice` | Customer | Stream branded PDF tax invoice |
| **Returns & RMA** | `POST` | `/returns/request` | Customer | Submit return request (**triggers emails to customer & admin**) |
| | `GET` | `/returns/my-returns` | Customer | View customer return requests and statuses |
| | `GET` | `/returns` | Manager+ | Admin/Manager review all incoming return requests |
| | `PATCH` | `/returns/:id/status` | Manager+ | Approve/reject return (triggers automated Razorpay refund) |
| | `PATCH` | `/returns/:id/process` | Manager+ | Receive returned goods and restock into warehouse |
| **Reports & Scheduler** | `GET` | `/reports/stock` | Private | Fetch real-time stock valuation and deficit report |
| | `GET` | `/reports/sales` | Private | Fetch sales revenue and order volume analytics |
| | `GET` | `/scheduler/logs` | Admin | Fetch audit history of alert transmissions |
| | `POST` | `/scheduler/trigger-alerts`| Admin | Manually trigger low-stock alert scan and email dispatch |

---

## 🚀 Installation & Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **MongoDB**: Local MongoDB instance (`127.0.0.1:27017`) or MongoDB Atlas URI
- **Google Chrome**: For headless Puppeteer automation and test verification
- **Gmail Account**: With an App Password generated for SMTP email dispatch

### 1. Clone the Repository
```bash
git clone (https://github.com/rayapatiravitheja/Inventory-pro)
cd Inventory-pro
```

### 2. Backend Setup
```bash
cd Backend
npm install
```

Create `.env` file in the `Backend/` directory:
```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/IMS
NODE_ENV=development

ACCESS_TOKEN_SECRET=your_super_secret_access_jwt_key_here_minimum_32_characters
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_jwt_key_here_minimum_32_characters
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary Storage (optional in local dev with disk storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gmail SMTP Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_16_digit_app_password
SENDER_EMAIL=your_email@gmail.com
ADMIN_EMAIL=rayapatiravitheja@gmail.com

# Razorpay Payment Gateway (Test or Live Keys)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

FRONTEND_URL=http://localhost:5173
TIMEZONE=Asia/Kolkata
```

Start the Backend Development Server:
```bash
npm run dev
# Server will listen on http://localhost:3001
```

### 3. Frontend Setup
```bash
cd ../Frontend
npm install
```

Start the Frontend Vite Development Server:
```bash
npm run dev
# Application will launch on http://localhost:5173
```

---

## 🔑 Default System Credentials

| Role | Email Address | Password | Intended Use |
| :--- | :--- | :--- | :--- |
| **Administrator** | `rayapatiravitheja@gmail.com` | `Theja@1822` | Master oversight, reports, low-stock alerts, product setup |
| **Warehouse Manager** | `manager@inventorypro.com` | `Manager@123` | Inbound receiving, warehouse stock management, transfers |
| **Customer** | `99230040998@klu.ac.in` | `Customer@123` | Storefront catalog, cart, Razorpay checkout, return requests |

---

## 🔒 Security & Engineering Highlights

- **Bcrypt Password Security**: All user passwords are encrypted using `bcryptjs` with salt round 10 before saving to MongoDB.
- **Double-Entry Reconciliation**: Every stock change is mirrored by a permanent `StockLedger` event (`adjustment_add`, `adjustment_deduct`, `order_dispatch`, `purchase_receipt`), ensuring full visibility into inventory movements.
- **Clean Dev/Prod Sanitization**: Verification OTPs are transmitted strictly via encrypted email and are never leaked to client responses or rendered in the DOM.
- **Automated Razorpay Refunds**: Return authorizations trigger instant online refund requests with transaction tracking IDs saved to the database.
- **Robust Error Handling**: Structured `ApiError` instances ensure error responses have predictable HTTP status codes and actionable messages.

---

## 📄 License & Author

Distributed under the **MIT License**.

- **Author**: Ravi Theja Rayapati
- **Repository**: [GitHub — InventoryPro](https://github.com/rayapatiravitheja/Infoziant-MERN)
- **Contact**: `rayapatiravitheja@gmail.com`

---

<div align="center">
  <strong>InventoryPro</strong> — Engineered with precision for modern supply-chain excellence.
</div>
