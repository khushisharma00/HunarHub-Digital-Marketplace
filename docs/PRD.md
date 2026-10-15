# Product Requirements Document (PRD)
# HunarHub – Digital Marketplace for Local Micro-Entrepreneurs

## 1. Document Overview
- **Project Name**: HunarHub
- **Document Version**: 1.0.0
- **Target Audience**: Micro-entrepreneurs (Cobblers, Potters, Tailors, Artisans, Small Vendors), Consumers, Platform Administrators
- **Date**: October 2026

---

## 2. Problem Statement & Motivation
India’s informal micro-entrepreneurial workforce comprises over 63 million enterprises, encompassing traditional craftspeople such as cobblers, clay potters (kumhars), master tailors, brass and woodcraft artisans, and neighborhood vendors. Despite their high skill level, these entrepreneurs face critical obstacles:
1. **Lack of Digital Discoverability**: Micro-entrepreneurs have no presence on major e-commerce platforms due to high listing fees, strict formal cataloging criteria, and payment barriers.
2. **Advance Payment Anxiety for Customers**: Consumers hesitate to book unverified local service providers online when upfront digital payments are demanded.
3. **Unstructured Scheduling**: Artisans lose revenue due to chaotic phone bookings, overlapping commitments, and double-booking errors.
4. **Counterfeits & Intermediaries**: Middlemen extract up to 70% of the sale value of traditional crafts, leaving artisans with meager subsistence earnings.

**HunarHub** eliminates intermediaries by giving micro-entrepreneurs an accessible digital storefront, conflict-free scheduling, and an inventory-safe marketplace with a transparent **"Pay on Delivery / Pay on Service Completion"** model.

---

## 3. User Personas

### Persona 1: Ramprasad Prajapati (Micro-Entrepreneur - Master Potter)
- **Age**: 52 | **Location**: Varanasi, UP
- **Background**: Third-generation potter crafting terracotta cookware and ornamental matkas.
- **Goals**: Wants direct orders from consumers across Varanasi without relying on tourist commission agents; wants customers to schedule pottery workshop sessions easily.
- **Pain Points**: Not tech-savvy, fears online scams, cannot handle complex inventory software.

### Persona 2: Ananya Deshmukh (Consumer / Customer)
- **Age**: 28 | **Location**: Jaipur, Rajasthan
- **Background**: Conscious urban professional seeking authentic hand-embroidered blouses, shoe repairs, and genuine clay kitchenware.
- **Goals**: Wants to find skilled, vetted craftsmen near her home; wants scheduled time slots without phone haggling; wants to inspect the work before paying.
- **Pain Points**: Frustrated by poor service reliability, hidden fees, and inability to find niche repairs.

### Persona 3: Platform SuperAdmin (Verification & Quality Officer)
- **Role**: Maintains platform trustworthiness, verifies artisan identity, resolves dispute escalations, and monitors platform growth metrics.

---

## 4. Scope of the System

### In-Scope (Fully Implemented)
- Responsive web marketplace (React 18 + Express + PostgreSQL/SQLite).
- Categorized browsing across 5 core trades: Cobbler, Potter (Kumhar), Tailor, Artisan, Small Vendor.
- Multi-dimensional filtering by keyword, craft category, city, and price range with pagination.
- Micro-entrepreneur profile management (bio, skills, pricing, weekly availability calendar).
- Concurrency-safe service booking with double-booking prevention.
- Inventory-safe handmade product purchasing with atomic stock decrement.
- Transparent "Pay on Delivery / Pay on Completion" workflow.
- Timestamped lifecycle tracking for bookings and product orders.
- Verified post-completion customer rating and feedback system.
- Micro-entrepreneur earnings overview (calculated strictly from completed orders and requests).
- SuperAdmin portal for artisan verification, category CRUD, dispute settlement, and analytics reports.

### Out of Scope (By Design)
- Native iOS/Android mobile apps.
- International shipping and customs handling.
- Complex AI neural search recommendation engines.
- Third-party courier tracking API integrations.

### Future Scope (Documented Roadmap)
- PWA / Offline-first mobile app with voice-based Hindi/regional language UI.
- Integrated digital escrow wallets and UPI AutoPay.
- Third-party hyper-local courier partner API integration (e.g. Dunzo, Porter).
- Government skill certification (PM Vishwakarma Yojana) verification badges.

---

## 5. Functional Requirements Breakdown

### 5.1 Authentication & Authorization
- **FR-AUTH-1**: Users can register as Customer or Micro-Entrepreneur.
- **FR-AUTH-2**: Micro-entrepreneurs must provide business name, trade category, specialization, experience, city, and area.
- **FR-AUTH-3**: Passwords must be hashed using bcrypt (10 rounds).
- **FR-AUTH-4**: All protected routes require JWT Bearer authentication.
- **FR-AUTH-5**: Role-Based Access Control (RBAC) strictly prevents unauthorized route access.
- **FR-AUTH-6**: Rate limiting restricts login attempts to 15 requests per 15 minutes per IP.

### 5.2 Micro-Entrepreneur Verification & Discovery
- **FR-ENT-1**: Newly registered micro-entrepreneurs are marked with `status = 'pending'`.
- **FR-ENT-2**: Unapproved entrepreneurs are strictly hidden from public browse and search queries.
- **FR-ENT-3**: Admin can transition status to `approved`, `rejected`, or `suspended`.
- **FR-ENT-4**: Approved entrepreneurs are discoverable by city, skill category, and price range.

### 5.3 Services & On-Demand Booking
- **FR-SRV-1**: Entrepreneurs can create, edit, and deactivate services with prices in ₹ and estimated duration.
- **FR-SRV-2**: Entrepreneurs manage recurring weekly availability slots (Day of week, Start time, End time).
- **FR-SRV-3**: Concurrency Lock: The system prevents two customers from booking the same entrepreneur for the same date and time slot.
- **FR-SRV-4**: Status Flow: `Pending` -> `Accepted` / `Rejected` -> `In progress` -> `Completed` / `Cancelled` / `Disputed`.

### 5.4 Handmade Products & Order Fulfillment
- **FR-PRD-1**: Entrepreneurs can list handmade products with title, description, price (₹), stock quantity, and photo.
- **FR-PRD-2**: Stock Lock: Orders execute within database transactions. If stock is insufficient, the transaction rolls back. Stock never goes negative.
- **FR-PRD-3**: Order Status Flow: `Placed` -> `Confirmed` -> `Ready` -> `Completed` / `Cancelled`.
- **FR-PRD-4**: Stock is restored automatically if an order is cancelled.

### 5.5 Reviews & Ratings
- **FR-REV-1**: Customers can rate (1 to 5 stars) and comment only after an order or service request reaches `Completed` status.
- **FR-REV-2**: Enforce exactly one review per completed order or service request.
- **FR-REV-3**: Entrepreneur average rating and review count recalculate automatically upon new review submission.

### 5.6 Earnings Calculation
- **FR-EARN-1**: Earnings are aggregated **strictly from Completed orders and requests**. Cancelled or pending orders never contribute to earnings.
- **FR-EARN-2**: Monthly breakdown displays historical earnings by `YYYY-MM`.

### 5.7 Dispute & Complaint Management
- **FR-DISP-1**: Customers or entrepreneurs can raise a dispute against an order or booking.
- **FR-DISP-2**: SuperAdmin reads grievances, writes binding decisions, and marks disputes `Resolved` or `Dismissed`.

### 5.8 Platform Analytics & 6 Mandatory KPIs
- **FR-KPIN-1**: Total registered entrepreneurs with approval breakdown.
- **FR-KPIN-2**: Total active registered users.
- **FR-KPIN-3**: Service request conversion rate (`Completed / Total * 100%`).
- **FR-KPIN-4**: Product sales volume (total units sold and gross revenue).
- **FR-KPIN-5**: Average entrepreneur earnings across platform.
- **FR-KPIN-6**: Customer satisfaction score (average rating).

---

## 6. Non-Functional Requirements
- **Performance**: Sub-3 second page loads achieved via server-side pagination, database indexes on foreign keys and search fields, and optimized bundle sizes.
- **Security**: JWT authentication, Helmet headers, CORS origin restrictions, parameterized SQL queries, input validation, and 5MB image upload restrictions.
- **Reliability & Auditability**: Every status update is recorded with previous status, new status, timestamp, and user ID in `status_history`.
- **Usability**: Mobile-first responsive layout, accessible contrast, zero broken links, and friendly empty states.
