# HunarHub – Automated Testing Report (`docs/TESTING.md`)

This document provides complete documentation of all automated tests, test categories, assertions, and live test run results for **HunarHub: Digital Marketplace for Local Micro-Entrepreneurs**.

---

## 📊 Summary of Test Results

- **Test Framework**: Jest with Supertest
- **Target Suite**: `server/tests/api.test.js`
- **Total Test Suites**: 1 passed, 1 total
- **Total Tests**: **34 passed, 34 total**
- **Failures / Errors**: **0**
- **Test Runtime**: ~1.2 seconds (using isolated in-memory SQLite database per test run)

---

## 🧪 Detailed Test Breakdown (34 Tests across 12 Modules)

### 1. Authentication & Role-Based Access Control (RBAC)
- `[PASS]` **should register a customer successfully**: Verifies password hashing, JWT generation, and customer default role.
- `[PASS]` **should register an entrepreneur in pending status**: Verifies new artisans are automatically marked `pending` upon signup.
- `[PASS]` **should register a second entrepreneur for ownership conflict tests**: Sets up multi-tenant verification.
- `[PASS]` **should register an admin account directly in database and login**: Tests administrative credential verification.
- `[PASS]` **should reject login with invalid password**: Verifies 401 Unauthorized on mismatched credentials.
- `[PASS]` **should deny customer access to admin routes (403 Forbidden)**: Verifies customer role cannot access `/api/admin/*`.

### 2. Entrepreneur Verification & Visibility Rules
- `[PASS]` **should NOT show pending entrepreneur in public browse list**: Unapproved artisans remain invisible in public queries.
- `[PASS]` **should allow admin to approve entrepreneur**: Admin approves entrepreneur via `PATCH /api/admin/entrepreneurs/:id/status`.
- `[PASS]` **should now show approved entrepreneur in public browse list**: Approved entrepreneur immediately appears in `/api/entrepreneurs`.

### 3. Services & Products CRUD with Strict Ownership Enforcement
- `[PASS]` **should allow entrepreneur to create a service**: Verified artisan creates service with pricing and duration.
- `[PASS]` **should prevent another entrepreneur from editing or deleting that service (403)**: Non-owner artisan receives 403 Forbidden on update attempt.
- `[PASS]` **should allow owner to update service**: Service owner successfully updates service title and pricing.
- `[PASS]` **should allow entrepreneur to create a product with stock**: Product created with active inventory.
- `[PASS]` **should prevent another entrepreneur from editing product (403)**: Strict ownership checks enforced on product updates.

### 4. Search, Filter, and Pagination
- `[PASS]` **should filter entrepreneurs by city**: Queries for specific cities (e.g. Jaipur, Varanasi) return correct subset.
- `[PASS]` **should return empty list for non-matching search term**: Safe handling of zero-result queries.
- `[PASS]` **should paginate results with page and limit**: Validates pagination metadata (`page`, `limit`, `total`).

### 5. Concurrency Safety: Double-Booking Prevention
- `[PASS]` **should book an available service slot successfully**: First booking succeeds with 201 Created.
- `[PASS]` **CONCURRENCY TEST: should reject duplicate booking for the SAME slot & date with 409 Conflict**: A simultaneous or duplicate request for the exact same entrepreneur, date, and slot is rejected with `409 Conflict` and descriptive error message.

### 6. Concurrency Safety: Overselling & Stock Integrity
- `[PASS]` **CONCURRENCY TEST: should reject order when requested quantity exceeds available stock (400)**: Attempts to order quantity > available inventory are rejected.
- `[PASS]` **should process order when stock is sufficient and decrement inventory atomically**: In-stock order decrements stock inside a database transaction without race conditions.

### 7. Status Transitions, History Tracking, and Notifications
- `[PASS]` **should transition service request status through full flow**: `Pending` -> `Accepted` -> `In progress` -> `Completed`.
- `[PASS]` **should record complete status history with timestamps**: Verifies audit records inside `status_history` table.
- `[PASS]` **should send in-app notification to customer**: Customer receives notification upon status transition.

### 8. Customer Ratings & Reviews Rules
- `[PASS]` **should allow customer to submit review on Completed request**: Verified customer posts 1–5 star rating and comment.
- `[PASS]` **should REJECT duplicate second review on the same request (409 Conflict)**: Enforces rule of one review per completed booking.

### 9. Earnings Calculation
- `[PASS]` **should calculate earnings strictly from Completed status**: Revenue from pending, accepted, or cancelled requests is excluded; only `Completed` requests count towards earnings.

### 10. Dispute Management Flow
- `[PASS]` **should allow customer to raise dispute**: Customer files dispute on problematic booking.
- `[PASS]` **should allow admin to resolve dispute with decision**: Admin resolves dispute with binding notes.

### 11. Platform Admin Analytics KPIs
- `[PASS]` **should calculate accurate platform KPIs and charts**: Generates registered entrepreneurs count, active users, conversion rate, and revenue totals.

### 12. Payment Options: COD, Card, and UPI Handling
- `[PASS]` **should process order with Cash on Delivery (COD) and record Pending status**: Verifies Pay on Delivery order flow.
- `[PASS]` **should process order with UPI payment and record Paid status**: Verifies instant UPI confirmation.
- `[PASS]` **should process order with Card payment and record masked brand and Paid status**: Masked card details (brand and last 4 digits) recorded with zero raw card storage.
- `[PASS]` **should book service request with UPI payment and record Paid status**: Verifies upfront UPI service booking.

---

## 🏃 How to Run the Tests

From the project root:

```bash
# Run server test suite
npm --prefix server test

# Run frontend production build test
npm --prefix client run build

# Run database seeder
npm --prefix server run seed

# Run Python compilation test
python3 -m py_compile app.py
```
