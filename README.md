# StockFlow — SaaS Inventory Management Platform

StockFlow is a production-quality Multi-Tenant SaaS inventory management application designed for small businesses to track products, manage stock levels, receive automated low-stock warnings, and review valuation and audit metrics.

---

## Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v7)
- **State & Data Fetching**: TanStack React Query (v5)
- **Forms & Validation**: React Hook Form with Zod schemas
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios with centralized Bearer token interceptor

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MySQL 8.0 with Sequelize ORM
- **Security**: JWT Authentication, bcryptjs, Helmet, CORS
- **Validation**: express-validator

---

## Multi-Tenant Security Invariants

1. **Row-Level Tenant Isolation**: Every tenant entity (`users`, `products`, `stock_logs`) belongs to an `organization_id`.
2. **Untrusted Client Invariant**: `organization_id` is never accepted from request parameters, queries, or bodies. It is extracted strictly from the cryptographically verified JWT token via `req.user.organization_id`.
3. **Scoped SKU Uniqueness**: Unique compound constraint on `(organization_id, sku)`. Different organizations can use the same SKU without collision.
4. **Audit Trail**: All stock adjustments (`in`, `out`, `adjustment`) are recorded immutably in `stock_logs` with timestamps, delta, user ID, and reason.
5. **Overdraw Prevention**: Concurrency row-locking (`t.LOCK.UPDATE`) prevents stock from dropping below zero.

---

## Project Structure

```
SaaS_Inventory_Management_System/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & environment configurations
│   │   ├── controllers/     # MVC HTTP controllers
│   │   ├── middleware/      # Auth, Request validation & Global Error Handler
│   │   ├── models/          # Sequelize models (Organization, User, Product, StockLog)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic & DB transactions
│   │   ├── validators/      # express-validator schemas
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point & DB sync
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Centralized Axios client & API endpoints
│   │   ├── components/
│   │   │   ├── common/      # ProtectedRoute
│   │   │   ├── layout/      # AppLayout (Sidebar, Navbar, User status)
│   │   │   └── ui/          # Button, Input, Modal, Badge, StatCard, EmptyState, Spinner
│   │   ├── context/         # AuthContext & useAuth hook
│   │   ├── pages/
│   │   │   ├── auth/        # Login, Signup
│   │   │   ├── dashboard/   # Metric KPIs, Low-stock banner, Watchlist, Recent audit
│   │   │   ├── products/    # Product list, Search, Filters, Add/Edit modal, Stock modal
│   │   │   └── settings/    # Organization details & threshold configuration
│   │   ├── schemas/         # Zod schemas
│   │   ├── App.jsx          # Route definitions
│   │   └── main.jsx
│   ├── .env
│   ├── .env.example
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## Getting Started

### 1. Database Configuration
Ensure MySQL 8.0 is running locally on port `3306`.
Check `backend/.env` for your database credentials:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=stockflow_db
DB_USER=root
DB_PASSWORD=rushi3717
JWT_SECRET=stockflow_super_secret_jwt_key_2026_production_ready
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
*Note: The backend will automatically create the `stockflow_db` database and synchronize all tables on startup.*

### 2. Run the Backend
```bash
cd backend
npm install
npm run dev # or npm start
```
The API will start at `http://localhost:5000`.

### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## API Endpoints (v1)

### Authentication
- `POST /api/v1/auth/signup` — Create new organization and admin account
- `POST /api/v1/auth/login` — Sign in and obtain JWT
- `GET /api/v1/auth/me` — Get current user and organization details

### Products
- `GET /api/v1/products` — List products (supports `search`, `category`, `is_low_stock`, `page`)
- `GET /api/v1/products/categories` — Get distinct categories
- `GET /api/v1/products/:id` — Get single product
- `POST /api/v1/products` — Create product
- `PUT /api/v1/products/:id` — Update product
- `DELETE /api/v1/products/:id` — Delete product

### Stock Management
- `POST /api/v1/stock/products/:id/adjust` — Adjust stock (`in`, `out`, `adjustment`)
- `GET /api/v1/stock/products/:id/logs` — Get immutable stock audit trail

### Dashboard & Analytics
- `GET /api/v1/dashboard/summary` — Overview metrics, urgent low-stock items, and recent activity

### Organization Settings
- `GET /api/v1/settings/organization` — Get organization defaults
- `PUT /api/v1/settings/organization` — Update organization name & default low-stock threshold

