# CampusHub Week 4 — Database Documentation

## 1. Project Database Overview

CampusHub is a full-stack campus service platform built with Node.js, Express, MongoDB (Mongoose ODM), and React with Vite. The database architecture powers food ordering from campus shops, menu and inventory management, student review aggregation, private Xerox document printing, real-time notification alerts, and administrative analytics.

- **Primary Database Engine:** MongoDB (via Mongoose 8.x)
- **Local Isolated Database:** `campushub_week4_local` on `mongodb://127.0.0.1:27017`
- **Environment Isolation:** All testing, verification, and schema indexing strictly target the local database; remote MongoDB Atlas clusters are safeguarded from development/seed scripts.
- **Data Modeling Paradigm:** Document-oriented relational modeling with explicit foreign key ObjectIds (`ref`), embedded subdocuments for snapshots (`items` array in orders/carts), and atomic unique constraints for critical invariants (e.g. one review per order, one cart per user).

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string name
        string email UK
        string password "bcrypt hashed, select false"
        string role "student|faculty|shopkeeper|admin"
        string collegeId
        date createdAt
        date updatedAt
    }

    SHOP {
        ObjectId _id PK
        string name
        string category "canteen|foodcourt|bakery"
        string description
        boolean isOpen
        ObjectId shopkeeperId FK
        date createdAt
        date updatedAt
    }

    MENU_ITEM {
        ObjectId _id PK
        ObjectId shopId FK
        string name
        number price
        boolean isAvailable
        string category
        date createdAt
        date updatedAt
    }

    CART {
        ObjectId _id PK
        ObjectId userId FK_UK
        array items "CartItem subdocs"
        number totalAmount
        date createdAt
        date updatedAt
    }

    ORDER {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId shopId FK
        array items "OrderItem snapshots"
        number totalAmount
        string orderToken UK "sparse"
        string pickupToken UK "sparse"
        string paymentMethod "razorpay|pay_at_counter"
        string paymentStatus "pending|paid|failed|refunded"
        string razorpayOrderId
        string razorpayPaymentId
        string razorpaySignature
        string status "placed|preparing|ready|completed|cancelled"
        array statusHistory "StatusHistory subdocs"
        date createdAt "explicit"
        date updatedAt
    }

    REVIEW {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId shopId FK
        ObjectId orderId FK_UK
        number rating "1-5 integer"
        string comment "max 500 chars"
        date createdAt
        date updatedAt
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId orderId FK
        string message
        string type
        boolean isRead
        date createdAt
        date updatedAt
    }

    XEROX {
        ObjectId _id PK
        ObjectId student FK
        ObjectId shopkeeper FK
        string documentUrl
        number totalPages
        string printRange "full|selected-pages"
        number startPage
        number endPage
        string colorMode "black-and-white|color"
        number numberOfCopies
        string paperSize "A4"
        string printSides "single-sided|double-sided"
        boolean includeOHP
        number estimatedPrice
        string status "pending|accepted|rejected|printing|ready-for-pickup|completed|cancelled"
        string paymentMethod "upi|cash"
        string paymentStatus "pending|paid|failed|refunded"
        date createdAt
        date updatedAt
    }

    USER ||--o{ SHOP : "manages as shopkeeper (shopkeeperId)"
    USER ||--o{ ORDER : "places (userId)"
    USER ||--o{ REVIEW : "authors (userId)"
    USER ||--o{ NOTIFICATION : "receives (userId)"
    USER ||--|| CART : "owns active (userId, 1:1)"
    USER ||--o{ XEROX : "submits as student (student)"
    USER ||--o{ XEROX : "assigned as shopkeeper (shopkeeper)"
    SHOP ||--o{ MENU_ITEM : "offers (shopId)"
    SHOP ||--o{ ORDER : "fulfills (shopId)"
    SHOP ||--o{ REVIEW : "receives (shopId)"
    ORDER ||--o| REVIEW : "can have one (orderId, 1:1)"
    ORDER ||--o{ NOTIFICATION : "triggers (orderId)"
    MENU_ITEM ||--o{ CART : "referenced in items[]"
    MENU_ITEM ||--o{ ORDER : "snapshot in items[]"
```

---

## 3. Relational Architecture & Collection Relationships Summary

1. **User Identity & Role-Based Access:**
   - Every registered person belongs to `users`. The `role` field (`student`, `faculty`, `shopkeeper`, `admin`) defines access across all modules.
2. **Shop & Menu Ownership:**
   - Each `Shop` has a `shopkeeperId` referencing a `User` with `role === 'shopkeeper'`.
   - Each `MenuItem` has a foreign key `shopId` referencing the parent `Shop`. Menu grouping and queries are accelerated via compound index `{ shopId, category, name }`.
3. **Cart & Order Lifecycle:**
   - A student maintains at most one active `Cart` enforced by a unique index on `userId`.
   - Checking out transforms cart items into an immutable `Order` containing point-in-time price and name snapshots in `items[]`.
   - The order tracks status transitions in `statusHistory[]` and generates collision-resistant `orderToken` (for display) and `pickupToken` (for shopkeeper verification).
4. **Reviews & Completed Order Integrity:**
   - Completed orders can be reviewed once (`Review.orderId` has a unique index).
   - Reviews reference `userId` (author) and `shopId` (shop receiving feedback) with compound indexes for instant sorting.
5. **Xerox Printing Services:**
   - A student uploads a private document, creating a `Xerox` record referencing `student: req.user.id`.
   - A shopkeeper is assigned (`shopkeeper: req.user.id`) to fulfill the request.
   - Access to private document URLs is restricted strictly to the student owner, assigned shopkeeper, or admin.
6. **Notifications:**
   - Status updates on orders and printing requests dispatch records to `notifications` referencing `userId` and optionally `orderId`.

---

## 4. Comprehensive Data Dictionary

### Collection: `users`
Represents registered students, faculty members, shopkeepers, and campus administrators.

| Field | Type | Required | Unique | Defaults / Validation | Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | ObjectId | ✓ | ✓ | Auto-generated | Primary key |
| `name` | String | ✓ | ✗ | `trim: true` | Full display name |
| `email` | String | ✓ | ✓ | `lowercase: true`, `trim: true`, regex format | Unique login handle |
| `password` | String | ✓ | ✗ | `minlength: 6`, `select: false` | Bcrypt hashed pre-save |
| `role` | String | ✓ | ✗ | `enum: ['student', 'faculty', 'shopkeeper', 'admin']`, default: `'student'` | Role-based authorization |
| `collegeId` | String | ✓ | ✗ | `trim: true` | Institutional identification |
| `createdAt` | Date | — | — | Managed by `{ timestamps: true }` | Account creation timestamp |
| `updatedAt` | Date | — | — | Managed by `{ timestamps: true }` | Account update timestamp |

**Indexes:**
- `{ email: 1 }` (unique constraint)
- `{ role: 1 }` (optimizes admin role filters and user aggregation)

---

### Collection: `shops`
Represents campus dining facilities and service points (canteens, food courts, bakeries).

| Field | Type | Required | Unique | Defaults / Validation | Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | ObjectId | ✓ | ✓ | Auto-generated | Primary key |
| `name` | String | ✓ | ✗ | `trim: true` | Display name of the shop |
| `category` | String | ✓ | ✗ | `enum: ['canteen', 'foodcourt', 'bakery']` | Shop business classification |
| `description` | String | ✗ | ✗ | `trim: true`, default: `''` | Shop details and summary |
| `isOpen` | Boolean | ✗ | ✗ | default: `false` | Current trading/open status |
| `shopkeeperId` | ObjectId | ✗ | ✗ | `ref: 'User'`, default: `null` | Assigned shopkeeper manager |
| `createdAt` | Date | — | — | Managed by `{ timestamps: true }` | Shop creation timestamp |
| `updatedAt` | Date | — | — | Managed by `{ timestamps: true }` | Shop update timestamp |

**Indexes:**
- `{ shopkeeperId: 1 }` (queries shop assigned to logged-in shopkeeper)
- `{ category: 1 }` (filters shops by category)

---

### Collection: `menuitems`
Represents individual food items and products offered by campus shops.

| Field | Type | Required | Unique | Defaults / Validation | Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | ObjectId | ✓ | ✓ | Auto-generated | Primary key |
| `shopId` | ObjectId | ✓ | ✗ | `ref: 'Shop'` | Parent shop identifier |
| `name` | String | ✓ | ✗ | `trim: true` | Item display name |
| `price` | Number | ✓ | ✗ | `min: 0` | Price in Indian Rupees (₹) |
| `isAvailable` | Boolean | ✗ | ✗ | default: `true` | In-stock / orderable status |
| `category` | String | ✗ | ✗ | `trim: true`, default: `''` | Menu grouping label (e.g. Beverages) |
| `createdAt` | Date | — | — | Managed by `{ timestamps: true }` | Item creation timestamp |
| `updatedAt` | Date | — | — | Managed by `{ timestamps: true }` | Item update timestamp |

**Indexes:**
- `{ shopId: 1, category: 1, name: 1 }` (compound index for categorized shop menu listing)

---

### Collection: `orders`
Represents food orders placed by students and fulfilled by campus shops.

| Field | Type | Required | Unique | Defaults / Validation | Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | ObjectId | ✓ | ✓ | Auto-generated | Primary key |
| `userId` | ObjectId | ✓ | ✗ | `ref: 'User'` | Student placing the order |
| `shopId` | ObjectId | ✓ | ✗ | `ref: 'Shop'` | Fulfilling shop |
| `items` | Array | ✓ | ✗ | `validator: arr.length > 0` | Snapshot array of `orderItemSchema` |
| `items[]._id` | ObjectId | ✓ | ✗ | Auto-generated | Subdocument primary key |
| `items[].menuItemId` | ObjectId | ✓ | ✗ | `ref: 'MenuItem'` | Reference to original menu item |
| `items[].name` | String | ✓ | ✗ | `trim: true` | Point-in-time name snapshot |
| `items[].quantity` | Number | ✓ | ✗ | `min: 1` | Units ordered |
| `items[].price` | Number | ✓ | ✗ | `min: 0` | Point-in-time unit price snapshot |
| `totalAmount` | Number | ✓ | ✗ | `min: 0` | Total order value in INR |
| `orderToken` | String | ✗ | ✓ | `sparse: true`, `immutable: true`, `CH-XXXXXXXX` | Human-readable tracking token |
| `pickupToken` | String | ✗ | ✓ | `sparse: true`, `immutable: true`, 32-char hex | Secure QR/pickup verification token |
| `paymentMethod` | String | ✗ | ✗ | `enum: ['razorpay', 'pay_at_counter']`, default: `'pay_at_counter'` | Payment channel |
| `paymentStatus` | String | ✗ | ✗ | `enum: ['pending', 'paid', 'failed', 'refunded']`, default: `'pending'` | Gateway payment state |
| `razorpayOrderId` | String | ✗ | ✗ | default: `null` | Razorpay gateway order reference |
| `razorpayPaymentId` | String | ✗ | ✗ | default: `null` | Razorpay payment capture reference |
| `razorpaySignature` | String | ✗ | ✗ | default: `null` | HMAC verification signature |
| `status` | String | ✗ | ✗ | `enum: ['placed', 'preparing', 'ready', 'completed', 'cancelled']`, default: `'placed'` | Fulfillment state |
| `statusHistory` | Array | ✗ | ✗ | Auto-populated on create with initial status | Audit log of state transitions |
| `createdAt` | Date | ✗ | ✗ | default: `Date.now` | Explicit timestamp for query consistency |
| `updatedAt` | Date | — | — | Managed by `{ timestamps: { createdAt: false, updatedAt: true } }` | Last modified timestamp |

**Indexes:**
- `{ orderToken: 1 }` (unique, sparse)
- `{ pickupToken: 1 }` (unique, sparse)
- `{ userId: 1, createdAt: -1 }` (student order history listing)
- `{ shopId: 1, status: 1, createdAt: -1 }` (shopkeeper incoming queue filtering)
- `{ createdAt: -1, status: 1 }` (admin revenue and analytics aggregations)

---

### Collection: `reviews`
Represents customer ratings and feedback on completed shop orders.

| Field | Type | Required | Unique | Defaults / Validation | Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | ObjectId | ✓ | ✓ | Auto-generated | Primary key |
| `userId` | ObjectId | ✓ | ✗ | `ref: 'User'` | Student author of the review |
| `shopId` | ObjectId | ✓ | ✗ | `ref: 'Shop'` | Shop reviewed |
| `orderId` | ObjectId | ✓ | ✓ | `ref: 'Order'`, unique constraint | Enforces strictly one review per order |
| `rating` | Number | ✓ | ✗ | `min: 1`, `max: 5`, integer validation | Whole star rating |
| `comment` | String | ✗ | ✗ | `trim: true`, `maxlength: 500`, default: `''` | Review comments |
| `createdAt` | Date | — | — | Managed by `{ timestamps: true }` | Submission timestamp |
| `updatedAt` | Date | — | — | Managed by `{ timestamps: true }` | Last updated timestamp |

**Indexes:**
- `{ orderId: 1 }` (unique constraint — guarantees 1:1 order-to-review integrity)
- `{ shopId: 1, createdAt: -1 }` (chronological reviews display per shop)
- `{ userId: 1, createdAt: -1 }` (user review history index)

---

### Collection: `carts`
Represents the active shopping cart of a student.

| Field | Type | Required | Unique | Defaults / Validation | Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | ObjectId | ✓ | ✓ | Auto-generated | Primary key |
| `userId` | ObjectId | ✓ | ✓ | `ref: 'User'`, unique constraint | Exactly one cart per user |
| `items` | Array | ✗ | ✗ | default: `[]`, subdocument array | Active cart items |
| `items[]._id` | ObjectId | ✓ | ✗ | Auto-generated | Subdocument primary key |
| `items[].menuItemId` | ObjectId | ✓ | ✗ | `ref: 'MenuItem'` | Target menu item |
| `items[].quantity` | Number | ✓ | ✗ | `min: 1`, default: `1` | Units to purchase |
| `items[].price` | Number | ✓ | ✗ | `min: 0` | Price when added to cart |
| `totalAmount` | Number | ✗ | ✗ | `min: 0`, default: `0` | Computed via `cart.recalculateTotal()` |
| `createdAt` | Date | — | — | Managed by `{ timestamps: true }` | Cart initialization timestamp |
| `updatedAt` | Date | — | — | Managed by `{ timestamps: true }` | Cart update timestamp |

**Indexes:**
- `{ userId: 1 }` (unique constraint)

---

### Collection: `notifications`
Represents transactional notices sent to users regarding orders or Xerox tasks.

| Field | Type | Required | Unique | Defaults / Validation | Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | ObjectId | ✓ | ✓ | Auto-generated | Primary key |
| `userId` | ObjectId | ✓ | ✗ | `ref: 'User'` | Target user |
| `orderId` | ObjectId | ✗ | ✗ | `ref: 'Order'`, default: `null` | Associated order (if applicable) |
| `message` | String | ✓ | ✗ | `trim: true` | Human-readable notification text |
| `type` | String | ✗ | ✗ | default: `'order'` | Notification category |
| `isRead` | Boolean | ✗ | ✗ | default: `false` | Read acknowledgment state |
| `createdAt` | Date | — | — | Managed by `{ timestamps: true }` | Notification timestamp |
| `updatedAt` | Date | — | — | Managed by `{ timestamps: true }` | Last updated timestamp |

**Indexes:**
- `{ userId: 1, isRead: 1, createdAt: -1 }` (compound index for user unread/read queries)

---

### Collection: `xeroxes`
Represents document printing requests, page specifications, and fulfillment tracking.

| Field | Type | Required | Unique | Defaults / Validation | Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | ObjectId | ✓ | ✓ | Auto-generated | Primary key |
| `student` | ObjectId | ✓ | ✗ | `ref: 'User'` | Requesting student |
| `shopkeeper` | ObjectId | ✗ | ✗ | `ref: 'User'`, default: `null` | Assigned Xerox shopkeeper |
| `documentUrl` | String | ✓ | ✗ | `trim: true` | Relative path to uploaded PDF on disk |
| `totalPages` | Number | ✓ | ✗ | `min: 1`, `Number.isSafeInteger` | PDF total page count |
| `printRange` | String | ✓ | ✗ | `enum: ['full', 'selected-pages']`, default: `'full'` | Selected page range mode |
| `startPage` | Number | ✓ | ✗ | `min: 1`, `Number.isSafeInteger` | Range start page |
| `endPage` | Number | ✓ | ✗ | `min: 1`, `Number.isSafeInteger` | Range end page |
| `colorMode` | String | ✓ | ✗ | `enum: ['black-and-white', 'color']` | Print color mode |
| `numberOfCopies` | Number | ✓ | ✗ | `min: 1`, `max: 100`, `Number.isSafeInteger` | Copy count |
| `paperSize` | String | ✓ | ✗ | `enum: ['A4']`, default: `'A4'` | Standard paper size |
| `printSides` | String | ✓ | ✗ | `enum: ['single-sided', 'double-sided']` | Duplex / simplex printing |
| `includeOHP` | Boolean | ✗ | ✗ | default: `false` | Overhead projector sheet add-on |
| `estimatedPrice` | Number | ✓ | ✗ | `min: 0`, `Number.isFinite` | Calculated print cost in INR |
| `status` | String | ✗ | ✗ | `enum: ['pending', 'accepted', 'rejected', 'printing', 'ready-for-pickup', 'completed', 'cancelled']`, default: `'pending'` | Printing progress status |
| `paymentMethod` | String | ✓ | ✗ | `enum: ['upi', 'cash']` | Payment channel |
| `paymentStatus` | String | ✗ | ✗ | `enum: ['pending', 'paid', 'failed', 'refunded']`, default: `'pending'` | Payment status |
| `createdAt` | Date | — | — | Managed by `{ timestamps: true }` | Request submission timestamp |
| `updatedAt` | Date | — | — | Managed by `{ timestamps: true }` | Request update timestamp |

**Indexes:**
- `{ student: 1, createdAt: -1 }` (student printing history queries)
- `{ status: 1, createdAt: -1 }` (shopkeeper queue and status tracking)

---

## 5. Indexes and Unique Constraints Matrix

| Collection | Index Key Specification | Type | Purpose / Query Optimization |
| :--- | :--- | :---: | :--- |
| `users` | `{ email: 1 }` | Unique | Enforces unique email addresses at registration; speeds up login lookups |
| `users` | `{ role: 1 }` | Non-unique | Speeds up role-based queries and admin user aggregations |
| `shops` | `{ shopkeeperId: 1 }` | Non-unique | Speeds up shop resolution for authenticated shopkeepers |
| `shops` | `{ category: 1 }` | Non-unique | Speeds up category-based shop filtering (canteen, bakery, food court) |
| `menuitems` | `{ shopId: 1, category: 1, name: 1 }` | Compound | Fast retrieval and alphabetical ordering of categorized shop menus |
| `orders` | `{ orderToken: 1 }` | Unique (Sparse) | Instant collision-free lookup of human-readable order tokens (`CH-XXXXXXXX`) |
| `orders` | `{ pickupToken: 1 }` | Unique (Sparse) | Instant lookup for pickup verification and QR code token validation |
| `orders` | `{ userId: 1, createdAt: -1 }` | Compound | Powers student order history, pagination, and sorting |
| `orders` | `{ shopId: 1, status: 1, createdAt: -1 }` | Compound | Powers shopkeeper incoming orders dashboard filtered by status |
| `orders` | `{ createdAt: -1, status: 1 }` | Compound | Powers admin sales analytics, daily revenue, and reporting queries |
| `reviews` | `{ orderId: 1 }` | Unique | Invariant enforcement: guarantees exactly one review per completed order |
| `reviews` | `{ shopId: 1, createdAt: -1 }` | Compound | Speeds up shop review feed sorted newest-first |
| `reviews` | `{ userId: 1, createdAt: -1 }` | Compound | Speeds up review lookups by student author |
| `carts` | `{ userId: 1 }` | Unique | Invariant enforcement: strictly one shopping cart per user |
| `notifications` | `{ userId: 1, isRead: 1, createdAt: -1 }` | Compound | Speeds up notification badge counts and unread notification feeds |
| `xeroxes` | `{ student: 1, createdAt: -1 }` | Compound | Powers student Xerox request history |
| `xeroxes` | `{ status: 1, createdAt: -1 }` | Compound | Powers shopkeeper Xerox queue filtering by status |

---

## 6. Core Business & Authorization Rules

### 1. User Roles & Capabilities
- **Student (`role: 'student'`):**
  - Can browse shops and menu items.
  - Can manage an active shopping cart (`/api/cart`).
  - Can place orders (`POST /api/orders`) and cancel pending orders.
  - Can submit reviews for completed orders belonging to them (`POST /api/reviews`).
  - Can upload PDFs and submit Xerox printing requests (`/api/xerox`).
- **Faculty (`role: 'faculty'`):**
  - Can browse campus shops and menus.
  - Restricted from cart management and student-exclusive ordering flows.
- **Shopkeeper (`role: 'shopkeeper'`):**
  - Assigned to manage exactly one campus shop via `Shop.shopkeeperId`.
  - Can create, edit, delete, and toggle availability of menu items for their assigned shop (`/api/menu`).
  - Can view and manage incoming orders for their shop (`/api/orders/shop/incoming`, `PATCH /api/orders/:id/status`).
  - Can verify order pickups via `pickupToken` (`POST /api/orders/verify-pickup`).
  - Can view, accept, reject, print, and complete Xerox requests.
- **Admin (`role: 'admin'`):**
  - Full platform visibility.
  - Can access dashboard statistics and sales analytics (`/api/admin/stats`).
  - Can view all users, orders, and shops.
  - Can reassign shopkeepers to shops (`PATCH /api/admin/shops/:shopId/assign-shopkeeper`).

### 2. Cart Business Logic
- Strictly one active cart document per student (`Cart.userId` is unique).
- Cart routes apply `authMiddleware` and `studentMiddleware`; non-students receive `HTTP 403`.
- `Cart.totalAmount` is automatically recalculated from `items[].price * items[].quantity`.

### 3. Order Placement & State Lifecycle
- An order can only be created from items in a student's cart.
- Order creation captures an immutable snapshot of menu item names and prices in `Order.items[]`.
- State transitions follow: `placed` → `preparing` → `ready` → `completed` (or `cancelled`).
- Order cancellation is only allowed while the order is in `placed` status.
- Verification on pickup requires matching the 32-character hexadecimal `pickupToken`.

### 4. Review Eligibility Rules
- **Authentication:** Only authenticated students can submit reviews.
- **Order Ownership:** The review `orderId` must belong to the requesting student (`order.userId.toString() === req.user.id`). Attempting to review another user's order returns `HTTP 404`.
- **Status Gate:** The order must have `status === 'completed'`. Placed, preparing, ready, or cancelled orders cannot be reviewed.
- **Uniqueness:** A completed order can be reviewed at most once. Resubmitting an order ID triggers a duplicate key error (code 11000) mapped to `HTTP 409 Conflict`.
- **Rating Limits:** Whole numbers from 1 to 5. Comments are optional, trimmed, and capped at 500 characters.

### 5. Xerox Security & Validation Rules
- Supported page size is strictly `'A4'`.
- Number of copies must be an integer between 1 and 100.
- Backend parses the uploaded PDF via `pdf-lib` to ensure `totalPages`, `startPage`, and `endPage` strictly align with actual document metrics.
- Document downloads (`GET /api/xerox/:id/document`) are restricted to the student owner, assigned shopkeeper, or admin. All other users receive `HTTP 403`.

---

## 7. MongoDB Operational & Backup Guide

### Safe Local Development Practice
Always verify that `.env` configures local loopback MongoDB before starting services:
```bash
MONGO_URI=mongodb://127.0.0.1:27017/campushub_week4_local
```

### Local Database Backup & Restore

```bash
# Export local database
mongodump \
  --uri "mongodb://127.0.0.1:27017/campushub_week4_local" \
  --out ./backups/campushub-local-$(date +%Y%m%d) \
  --gzip

# Restore local database
mongorestore \
  --uri "mongodb://127.0.0.1:27017/campushub_week4_local" \
  --gzip \
  ./backups/campushub-local-20261116
```

### Seed Protection Checklist
The `scripts/seed.js` script contains strict safety checks:
1. Rejects execution if `SEED_TEST_DATABASE !== 'YES'`.
2. Validates hostname to strictly allow `127.0.0.1` and `localhost` with exact database name `campushub_week4_local`.
3. Verifies post-connection database properties before executing any upserts.
4. Uses additive upserts (`User.findOneAndUpdate`, `Shop.findOneAndUpdate`); never drops collections or deletes records.
