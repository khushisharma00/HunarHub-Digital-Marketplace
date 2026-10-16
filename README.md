# HunarHub – Digital Marketplace for Local Micro-Entrepreneurs

> **Live Demo & Source Code**: Connecting local Indian micro-entrepreneurs (Cobblers, Potters/Kumhars, Tailors, Artisans, Small Vendors) with conscious customers for on-demand doorstep service bookings and authentic handmade crafts.

[![Tests](https://img.shields.io/badge/tests-34%20passed-success)](server/tests/api.test.js)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-v20%2B-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/database-PostgreSQL%20%7C%20SQLite-blue.svg)](https://www.postgresql.org/)

---

## 🌟 Executive Summary

Local micro-entrepreneurs form the backbone of India's cultural and informal economy. Traditional cobblers, generational kumhars (potters), master tailors, folk artisans, and neighborhood vendors lack digital visibility, discoverability, and fair pricing mechanisms.

**HunarHub** bridges this gap by providing:
1. **Verified Digital Storefronts** with skills, portfolio galleries, transparent pricing, and weekly availability calendars.
2. **On-Demand Service Scheduling** with conflict-free slot booking and concurrency protection.
3. **Handmade Products Marketplace** with inventory stock management and atomic transaction safety.
4. **Transparent "Pay on Delivery / Pay on Service Completion" Model**: Zero financial risk for customers, eliminating advance payment anxiety.
5. **Comprehensive Multi-Role Management**: Dedicated Dashboards for Customers, Micro-Entrepreneurs, and Platform SuperAdmins with real-time analytics.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Lucide Icons
- **Backend**: Node.js, Express REST API
- **Database**: PostgreSQL (Production on Render) with Knex.js query builder, featuring SQLite3 adapter for seamless zero-setup local development and automated testing
- **Authentication**: JWT (JSON Web Tokens), bcryptjs password hashing (10 salt rounds), Role-Based Access Control (RBAC)
- **Security**: Helmet HTTP headers, CORS whitelisting, Express Rate Limiting (15 attempts/15 mins on login), parameterized queries (SQL injection prevention), 5MB file upload filtering
- **Deployment**: Render (Backend + Managed PostgreSQL), Vercel/Netlify (Frontend)

---

## 🚀 Key Features Implemented

### 1. Customer Experience
- **Registration & Login**: Secure account creation with JWT authentication.
- **Categorized Discovery**: Browse by 5 core trades — Cobbler, Potter (Kumhar), Tailor, Artisan, Small Vendor.
- **Advanced Search & Filtering**: Filter by keyword, craft category, city (Jaipur, Varanasi, Lucknow, Delhi, Mumbai, Agra), and price range with pagination.
- **Entrepreneur Detail Profile**: Portfolio gallery, biography, services offered, handmade products, weekly availability schedule, and verified customer reviews.
- **Conflict-Free Service Booking**: Real-time calendar slot reservation. Double-booking prevention prevents two customers from booking the same slot on the same day.
- **Handmade Product Purchasing**: Persistent cart, stock validation, and Pay on Delivery checkout.
- **Order & Booking Tracking**: Live status lifecycle tracking (`Pending` -> `Accepted` -> `In progress` -> `Completed` / `Cancelled` / `Disputed`).
- **Post-Completion Reviews**: 1 to 5 star ratings and comments allowed strictly after service completion or order delivery (1 review per completed item).

### 2. Micro-Entrepreneur Portal
- **Onboarding & Verification**: Profile creation with trade category, skill specialization, experience years, bio, and area. Unapproved accounts remain hidden until admin verification.
- **Earnings Overview**: Real-time metrics calculated **strictly from COMPLETED orders and requests**. Monthly earnings breakdown.
- **Service & Product Management**: Full CRUD capabilities with ownership verification — artisans can only modify or delete their own offerings.
- **Availability Schedule**: Set recurring weekly days and working hours.
- **Order & Request Lifecycle Fulfillment**: Accept or reject requests, mark in progress, confirm packages, and mark completed upon collecting payment.

### 3. SuperAdmin Console
- **Artisan Approvals**: Approve, reject, or suspend micro-entrepreneurs. Approved artisans instantly appear in public search.
- **Trade & Category Management**: Add, update, and manage craft categories.
- **Dispute Resolution Panel**: Inspect customer or artisan grievances, enter binding administrative decisions, and mark resolved with notifications.
- **Platform Analytics & 6 Key KPIs**:
  1. *Registered Entrepreneurs* (Total, Approved, Pending)
  2. *Active Platform Users*
  3. *Service Request Conversion Rate* (`Completed / Total`)
  4. *Product Sales Volume & Revenue*
  5. *Average Entrepreneur Earnings*
  6. *Customer Satisfaction Ratings* (Average score across verified reviews)
  - Visual monthly revenue trend charts and category distribution breakdowns.

### 4. Shared Platform Systems
- **In-App Notification Center**: Real-time alerts for booking confirmations, status transitions, approval decisions, and dispute updates with live unread counter.
- **Audit Status History**: Timestamped state transition logs for every order and service request.

---

## ⚡ Concurrency & Data Integrity Safety

1. **Double-Booking Prevention**:
   - Booking requests execute within an ACID database transaction.
   - If an active booking already exists for `(entrepreneur_id, booking_date, time_slot)` where `status NOT IN ('Rejected', 'Cancelled')`, the transaction aborts and returns `409 Conflict`.
2. **Overselling Prevention**:
   - Checkout processes all items within a database transaction.
   - For every item: `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`.
   - If stock is insufficient, the transaction rolls back with `400 Bad Request`. Product stock can never become negative.
   - If an order is cancelled, stock is automatically restored.

---

## 📦 Quick Start & Local Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Installation
Clone the repository and install all dependencies for root, server, and client:
```bash
# Clone the repository
git clone https://github.com/khushisharma00/HunarHub-Digital-Marketplace.git
cd HunarHub-Digital-Marketplace

# Install all workspace dependencies
npm run install:all
```

### 2. Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
```
*(For local development, default values in `.env.example` run out of the box with zero external database setup).*

### 3. Database Seeding
Populate the database with 15 realistic Indian micro-entrepreneurs across 5 cities, 40 services & products, sample bookings, orders, and reviews:
```bash
npm run seed
```

### 4. Run Automated Test Suite
Execute the 30 automated integration and unit tests:
```bash
npm test
```

### 5. Start Development Servers
Run both backend API (port 5001) and Vite frontend (port 3000):
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

*(Alternatively, to run the unified production build on port 5001: `npm run build && npm start` and open **http://localhost:5001**).*

---

## 🔑 Demo Login Credentials

The seed script creates the following pre-configured test accounts (also accessible via 1-click buttons on the Login page):

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@hunarhub.com` | `admin123` | Full access to verification, disputes, and analytics |
| **Demo Customer** | `customer@hunarhub.com` | `password123` | Ananya Deshmukh (Orders, bookings, reviews) |
| **Demo Artisan** | `ramprasad@hunarhub.com` | `password123` | Ramprasad Prajapati (Master Potter, Varanasi) |
| **Demo Cobbler** | `shyamlal@hunarhub.com` | `password123` | Shyam Lal (Master Cobbler, Lucknow) |
| **Demo Tailor** | `meera@hunarhub.com` | `password123` | Meera Sharma (Bespoke Tailor, Jaipur) |

---

## 🧪 Automated Test Results

All 30 automated test suites pass with 100% success:

```
PASS tests/api.test.js
  1. Authentication & Role-Based Access Control
    ✓ should register a customer successfully
    ✓ should register an entrepreneur in pending status
    ✓ should register a second entrepreneur for ownership conflict tests
    ✓ should register an admin account directly in database and login
    ✓ should reject login with invalid password
    ✓ should deny customer access to admin routes (403 Forbidden)
  2. Entrepreneur Verification & Visibility Rules
    ✓ should NOT show pending entrepreneur in public browse list
    ✓ should allow admin to approve entrepreneur
    ✓ should now show approved entrepreneur in public browse list
  3. Services & Products CRUD with Ownership Enforcement
    ✓ should allow entrepreneur to create a service
    ✓ should prevent another entrepreneur from editing or deleting that service (403)
    ✓ should allow owner to update service
    ✓ should allow entrepreneur to create a product with stock
    ✓ should prevent another entrepreneur from editing product (403)
  4. Search, Filter, and Pagination
    ✓ should filter entrepreneurs by city
    ✓ should return empty list for non-matching search term
    ✓ should paginate results with page and limit
  5. Concurrency Safety: Double-Booking Prevention
    ✓ should book an available service slot successfully
    ✓ CONCURRENCY TEST: should reject duplicate booking for the SAME slot & date with 409 Conflict
  6. Concurrency Safety: Overselling & Stock Integrity
    ✓ CONCURRENCY TEST: should reject order when requested quantity exceeds available stock (400)
    ✓ should process order when stock is sufficient and decrement inventory atomically
  7. Status Transitions, History Tracking, and Notifications
    ✓ should transition service request status through full flow
    ✓ should record complete status history with timestamps
    ✓ should send in-app notification to customer
  8. Customer Ratings & Reviews Rules
    ✓ should allow customer to submit review on Completed request
    ✓ should REJECT duplicate second review on the same request (409 Conflict)
  9. Earnings Calculation (Completed Orders & Requests Only)
    ✓ should calculate earnings strictly from Completed status
  10. Dispute Management Flow
    ✓ should allow customer to raise dispute
    ✓ should allow admin to resolve dispute with decision
  11. Platform Admin Analytics KPIs
    ✓ should calculate accurate platform KPIs and charts

Test Suites: 1 passed, 1 total
Tests:       30 passed, 30 total
Time:        1.584 s
```

---

## 📚 Project Documentation

Detailed design documents, project reports, and submission materials are located in the `docs/` folder:
- [PLAN.md](docs/PLAN.md): Architectural implementation blueprint and schema
- [PRD.md](docs/PRD.md): Product Requirements Document
- [technical_documentation.md](docs/technical_documentation.md): API reference, schema definitions, and security specs
- [project_report.md](docs/project_report.md): Comprehensive B.Tech project report
- [demo_script.md](docs/demo_script.md): 3 to 5 minute demo video walkthrough script
- [submission_checklist.md](docs/submission_checklist.md): Step-by-step submission checklist & deployment guide
