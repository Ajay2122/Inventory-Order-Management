# Inventory & Order Management System

A full-stack MERN application for managing products, stock, and customer orders.

---

## Tech Stack

| Layer    | Technology                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Axios, React Hook Form, React Hot Toast, Headless UI |
| Backend  | Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs                                               |
| Auth     | JSON Web Tokens (JWT), Role-Based Access Control (RBAC)                                             |

---

## Features

### Product Module

- List products with search (by name/SKU), filter by category, sort, and pagination
- Create, edit, and delete products
- Unique SKU validation (enforced on backend)
- Low stock indicator (when stock ≤ reorderLevel)
- Active/inactive product status

### Order Module

- Create multi-item customer orders
- Server-side total calculation (not frontend)
- Stock availability validation before order placement
- Automatic stock deduction on order creation
- Automatic stock restoration on cancellation
- Update order status: Pending → Confirmed / Cancelled
- View detailed order breakdown in modal

### Dashboard

- Total Products, Total Orders, Pending Orders, Low Stock count
- Order status breakdown (Pending / Confirmed / Cancelled)
- Low stock products list
- Recent orders list

### Auth & RBAC

- JWT-based authentication
- Three roles:
  - **Admin**: Full access (CRUD on products, create/update orders, delete products)
  - **Manager**: Create/edit products, create orders, update order status
  - **Viewer**: Read-only access

---

## Project Structure

```
├── server/                    # Express backend
│   ├── config/db.js           # MongoDB connection
│   ├── controllers/           # Route handler logic
│   ├── middleware/
│   │   ├── auth.js            # JWT protect + restrictTo
│   │   ├── asyncHandler.js    # Async error wrapper
│   │   └── errorHandler.js    # Global error middleware
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── services/              # Business logic layer
│   ├── seeds/seed.js          # Database seeder
│   ├── utils/AppError.js      # Custom error class
│   └── server.js              # Entry point
│
└── client/                    # React + Vite frontend
    └── src/
        ├── components/
        │   ├── common/        # Badge, Button, Input, Modal, etc.
        │   ├── layout/        # Sidebar, Navbar, Layout
        │   ├── products/      # ProductForm
        │   └── orders/        # OrderForm, OrderStatusBadge
        ├── context/           # AuthContext
        ├── hooks/             # useDebounce
        ├── pages/             # Dashboard, Products, Orders, Login
        ├── services/          # Axios API calls
        └── utils/             # helpers (formatCurrency, formatDate)
```

---

## Setup & Installation

### Prerequisites

- Node.js v18+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Clone & Configure Backend

```bash
cd server
cp .env.example .env
# Edit .env — set your MONGO_URI and JWT_SECRET
npm install
```

### 2. Seed the Database

```bash
npm run seed
```

This creates:

- 3 users (admin / manager / viewer)
- 12 sample products across all categories
- 2 sample orders

### 3. Start the Backend

```bash
npm run dev     # development (nodemon)
npm start       # production
```

Server runs on **http://localhost:5000**

### 4. Configure & Start Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## Environment Variables

### server/.env

| Variable       | Description                | Default                                        |
| -------------- | -------------------------- | ---------------------------------------------- |
| NODE_ENV       | Environment                | development                                    |
| PORT           | Server port                | 5000                                           |
| MONGO_URI      | MongoDB connection string  | mongodb://localhost:27017/inventory_management |
| JWT_SECRET     | Secret key for JWT signing | (set a strong random value)                    |
| JWT_EXPIRES_IN | Token expiry duration      | 7d                                             |
| CORS_ORIGIN    | Allowed frontend origin    | http://localhost:5173                          |

### client/.env

| Variable     | Description          | Default                   |
| ------------ | -------------------- | ------------------------- |
| VITE_API_URL | Backend API base URL | http://localhost:5000/api |

---

## Demo Accounts

After running `npm run seed`:

| Role    | Email                 | Password    |
| ------- | --------------------- | ----------- |
| Admin   | admin@inventory.com   | Admin@123   |
| Manager | manager@inventory.com | Manager@123 |
| Viewer  | viewer@inventory.com  | Viewer@123  |

---

## API Documentation

### Auth

| Method | Endpoint           | Access    | Description           |
| ------ | ------------------ | --------- | --------------------- |
| POST   | /api/auth/login    | Public    | Login & receive JWT   |
| POST   | /api/auth/register | Public    | Register new user     |
| GET    | /api/auth/me       | Protected | Get current user info |
| GET    | /api/auth/users    | Admin     | List all users        |

### Products

| Method | Endpoint                 | Access         | Description                        |
| ------ | ------------------------ | -------------- | ---------------------------------- |
| GET    | /api/products            | All users      | List with search/filter/pagination |
| POST   | /api/products            | Admin, Manager | Create a product                   |
| GET    | /api/products/:id        | All users      | Get single product                 |
| PUT    | /api/products/:id        | Admin, Manager | Update a product                   |
| DELETE | /api/products/:id        | Admin only     | Delete a product                   |
| GET    | /api/products/categories | All users      | List valid categories              |

**GET /api/products query params:**

| Param     | Type    | Description                                 |
| --------- | ------- | ------------------------------------------- |
| search    | string  | Search by name or SKU                       |
| category  | string  | Filter by category                          |
| isActive  | boolean | Filter by active status                     |
| sortBy    | string  | name / price / stock / category / createdAt |
| sortOrder | string  | asc / desc                                  |
| page      | number  | Page number (default: 1)                    |
| limit     | number  | Items per page (default: 10, max: 100)      |

### Orders

| Method | Endpoint               | Access         | Description                    |
| ------ | ---------------------- | -------------- | ------------------------------ |
| GET    | /api/orders            | All users      | List orders with pagination    |
| POST   | /api/orders            | All users      | Create order (validates stock) |
| GET    | /api/orders/:id        | All users      | Get order details              |
| PUT    | /api/orders/:id/status | Admin, Manager | Update order status            |

**POST /api/orders body:**

```json
{
  "customerName": "John Smith",
  "customerEmail": "john@example.com",
  "items": [{ "productId": "<ObjectId>", "quantity": 2 }],
  "notes": "Optional note"
}
```

### Dashboard

| Method | Endpoint               | Access    | Description            |
| ------ | ---------------------- | --------- | ---------------------- |
| GET    | /api/dashboard/summary | All users | Aggregated KPI summary |

---

## Business Logic Implementation

### Stock Validation & Deduction

Stock is pre-validated for all items before touching the database. Then each item is deducted atomically using `findOneAndUpdate` with a `$gte` guard — if any deduction fails (race condition), a manual rollback restores every item already decremented and the order is rejected.

### Total Amount Calculation

`totalAmount = Σ (product.price × item.quantity)` — computed entirely on the backend using live prices from the database. Frontend shows an estimate but the server value is authoritative.

### Stock Restoration on Cancellation

When an order is cancelled, stock is restored atomically for every item using `$inc: { stock: +quantity }` — one update per item, no replica set required.

### Unique SKU

SKU uniqueness is enforced by both a Mongoose schema unique index and a pre-check in the service layer with a clear error message.

### Low Stock Detection

`stock <= reorderLevel` — queried with a MongoDB `$expr` operator, fully server-side.

---

## Assessment Q&A

**1. What happens if two users place orders for the same product simultaneously?**

Both requests hit at the same time, both see stock: 5, both think they can order 3. Without any guard you end up at -1 stock and two angry customers. I handle it with MongoDB's atomic `findOneAndUpdate` — it only deducts if the stock is still enough at the exact moment of the write:

```js
Product.findOneAndUpdate(
  { _id: productId, stock: { $gte: quantity } },
  { $inc: { stock: -quantity } },
);
```

The second request gets `null` back (stock already gone), I roll back anything I already touched, and return an error. No replica set, no transactions required.

**2. Why should totalAmount always be calculated on the backend?**

If you let the frontend send the total, someone can open DevTools, change `totalAmount` to `0.01`, and get a $500 order for basically free. I've seen it happen. The server pulls real prices from the database and recalculates — whatever number the client sends is completely ignored.

**3. How would you handle returned products?**

Add a `Returned` status and restore stock the same way cancellation does — `$inc: { stock: +quantity }`. For partial returns I'd add a `returnedItems` array on the order to track exactly which items came back and how many. The original order stays untouched so the audit trail is intact.

**4. What reports would be useful for store owners?**

Revenue by date range, best-selling products, low stock alerts, inventory value (stock × price per item), order fulfilment rate, and cancellation rate. Those cover 90% of what a store owner actually looks at day to day.

**5. What is the difference between cancelling and deleting an order?**

Cancelling just changes the status — the record stays in the database, stock gets restored, everything is traceable. Deleting wipes the record out completely. The moment you delete an order your revenue reports are wrong, your stock might be off, and you have no idea what happened. I wouldn't even build a delete endpoint for orders in a real system.

**6. How would you secure APIs for different user roles?**

Two middleware functions chained on every route. `protect` checks the JWT and loads the user onto `req.user`. `restrictTo` checks the role and kills the request with a 403 if it doesn't match:

```js
router.delete("/:id", protect, restrictTo("admin"), deleteProduct);
```

The frontend hides buttons based on role too, but that's just to avoid confusing the user — the server is where the actual enforcement happens.

---

### Project Planning

**1. How would you divide this project into development tasks?**

I'd start with the database schema and auth since nothing else works without them. Then Product CRUD, then Orders (they depend on products for stock and price), then Dashboard. Once the API is solid I'd move to the frontend — Login and routing first, then Products page, Orders page, Dashboard, then hook up the RBAC everywhere. Testing and cleanup at the end.

**2. Which APIs would you build first and why?**

Auth first, always. Nothing else works without a valid token. Then Products because Orders need them. Then Orders. Dashboard last since it's just reading from collections that are already built — easy to add once everything else is working.

**3. What edge cases would you test?**

Ordering more stock than available, two users ordering the same low-stock item at the same time, ordering a product that got deactivated, cancelling an order that's already cancelled, changing status to what it already is, a viewer trying to POST a product, an expired or modified JWT, creating two products with the same SKU, sending an empty items array on an order, and a product that gets deleted while an order for it is pending.

**4. How would you estimate project development time?**

Break it down by feature and be honest about it:

| Area                         | Hours |
| ---------------------------- | ----- |
| Auth API                     | 1h    |
| Product CRUD                 | 1h    |
| Order logic + stock safety   | 1h    |
| Dashboard API                | 1h    |
| Frontend (all pages + state) | 2h    |
| RBAC, errors, testing        | 1h    |

**5. What questions would you ask the client before starting development?**

1. What can each role actually do — any edge cases beyond the obvious read/write split?
2. Does stock hard-stop at zero or can it go negative (backorders)?
3. Are customers just a name on the order or do they have their own accounts?
4. Any email or notification requirements when an order is placed or confirmed?
5. How many products are we talking — 50 or 50,000? Matters for indexing decisions.
6. Any third-party systems to connect — payment gateway, accounting software, barcode scanner?
7. Can orders ever be deleted or are they permanent records?

---
