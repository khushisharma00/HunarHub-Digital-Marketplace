# PROJECT REPORT
## HunarHub – Digital Marketplace for Local Micro-Entrepreneurs

---

**Academic Project Report**  
**Degree**: Bachelor of Technology (B.Tech) in Computer Science & Engineering  
**Author**: Khushi Sharma  
**Date**: October 2026  
**Institution**: Department of Computer Science & Engineering  

---

## ABSTRACT

The rapid digitization of the Indian economy has predominantly benefited large organized retailers and commercial service aggregators. Meanwhile, traditional informal micro-entrepreneurs—such as generational potters (kumhars), cobblers, independent tailors, indigenous artisans, and local street vendors—remain digitally invisible. They face high listing commissions on corporate platforms, complex formal onboarding requirements, customer mistrust regarding upfront digital payments, and scheduling chaos.

**HunarHub** is a digital marketplace and service booking platform engineered specifically for local micro-entrepreneurs. Built on a modern full-stack architecture comprising React 18, Node.js, Express, and PostgreSQL (with SQLite compatibility), the platform empowers micro-entrepreneurs to showcase their skills, manage product inventory with concurrency protection, and schedule on-demand service appointments without double-booking conflicts. The system operates on a transparent **"Pay on Delivery / Pay on Service Completion"** paradigm, eliminating advance payment anxiety for consumers. 

The platform features role-based access control across three user tiers: Customers, Micro-Entrepreneurs, and Platform SuperAdmins. A comprehensive automated test suite consisting of 30 test cases validates all critical functional requirements, including role enforcement, double-booking prevention, atomic inventory locking, dispute resolution, and platform KPI calculations.

---

## 1. INTRODUCTION

### 1.1 Context and Background
India's informal micro-enterprise sector sustains millions of families. Craft clusters across regions—such as the Blue Pottery of Jaipur, Terracotta of Gorakhpur and Varanasi, Chikankari of Lucknow, and traditional shoemaking in Agra—are renowned for extraordinary skill and cultural heritage. However, the lack of digital visibility forces these artisans to rely heavily on middlemen who extract up to 70% of product margins.

### 1.2 Problem Formulation
Existing commercial marketplaces (Amazon, Flipkart, Urban Company) fail micro-entrepreneurs due to:
1. **Aggressive Listing Fees and Commission Cuts**: Margins of 20% to 35% make micro-business participation unprofitable.
2. **Payment Hesitation**: Customers are reluctant to pay advance fees to local informal artisans without seeing the finished product or inspecting the repair.
3. **Double-Booking and Concurrency Failures**: Manual phone bookings lead to missed appointments, schedule clashes, and customer frustration.
4. **Lack of Identity Verification**: Customers fear counterfeit crafts and unreliable service providers.

### 1.3 Project Objectives
- Engineer a responsive, mobile-first web marketplace connecting customers directly with local micro-entrepreneurs.
- Implement an atomic slot reservation engine that eliminates double-booking conflicts.
- Implement an inventory control mechanism guaranteeing that product stock cannot be oversold or become negative.
- Implement an administrative verification workflow where new micro-entrepreneurs must be vetted before public listing.
- Provide transparent earnings computation derived strictly from completed transactions.
- Deliver a SuperAdmin console featuring platform analytics with real-time computation of 6 primary KPIs.

---

## 2. LITERATURE SURVEY & RELATED WORK

| Platform / Approach | Primary Focus | Limitations for Micro-Entrepreneurs |
| :--- | :--- | :--- |
| **Urban Company** | Standardized urban home services | High onboarding fees, strict corporatized requirements; excludes traditional trades like cobblers and potters. |
| **Etsy India** | Global handmade and vintage goods | Requires digital payment gateways, international shipping logistics, and charges listing fees per item. |
| **ONDC (Open Network)** | Open e-commerce protocol | Complex API integration layer; lacks dedicated on-demand slot scheduling for local repair trades. |
| **HunarHub (Proposed)** | Hyperlocal micro-entrepreneurs across 5 core trades | Zero advance commission, Pay on Delivery/Completion, conflict-free scheduling, admin verification. |

---

## 3. SYSTEM ARCHITECTURE & DESIGN

### 3.1 Architectural Overview
HunarHub follows a decoupled client-server architecture:
- **Presentation Layer**: A single-page application built with React 18, Vite, and Tailwind CSS. State is managed through dedicated React Contexts (`AuthContext`, `CartContext`), providing reactive cart updates and live notification counters.
- **API & Business Logic Layer**: A modular Node.js and Express RESTful API utilizing controller-service-repository patterns. Protected endpoints verify JWT Bearer tokens and enforce role-based access control.
- **Persistence Layer**: Relational data storage utilizing Knex.js. In production on Render, the system connects to managed PostgreSQL with connection pooling. In local development and automated testing environments, it utilizes an embedded SQLite3 engine with zero setup overhead.

### 3.2 Database Entities & Relationships
The relational schema comprises 13 core entities:
1. `users`: Authentication credentials, roles ('customer', 'entrepreneur', 'admin'), contact details.
2. `categories`: Predefined trades (Cobbler, Potter, Tailor, Artisan, Small Vendor).
3. `entrepreneurs`: Artisan business profiles, verification statuses ('pending', 'approved', 'rejected', 'suspended'), ratings.
4. `services`: On-demand skill listings with durations and prices in ₹.
5. `products`: Physical handcrafted goods with inventory quantities.
6. `availability_slots`: Recurring weekly working days and hours.
7. `service_requests`: Bookings with dates, time slots, address, and status lifecycle.
8. `orders` & `order_items`: Multi-item shopping orders with delivery details.
9. `reviews`: Post-completion customer ratings (1-5 stars) and feedback.
10. `notifications`: In-app alert messages with unread tracking.
11. `disputes`: Grievance records and administrative resolution determinations.
12. `status_history`: Complete audit trail of entity lifecycle transitions.

---

## 4. IMPLEMENTATION OF CRITICAL FEATURES

### 4.1 Concurrency Safety: Double-Booking Prevention
A common failure in appointment systems occurs when two concurrent users attempt to book the same artisan for the same time slot simultaneously. HunarHub prevents this by executing booking creations within ACID database transactions:
```javascript
await db.transaction(async (trx) => {
  const existing = await trx('service_requests')
    .where({ entrepreneur_id, booking_date, time_slot })
    .whereNotIn('status', ['Rejected', 'Cancelled'])
    .first();

  if (existing) {
    throw new Error('This time slot is already booked for the selected date.');
  }
  // Proceed with booking insertion
});
```
If a conflicting booking exists, the transaction immediately rolls back and returns HTTP `409 Conflict`.

### 4.2 Concurrency Safety: Overselling Prevention
To prevent negative inventory when multiple customers purchase the same handmade item concurrently, HunarHub utilizes conditional atomic decrements within a database transaction:
```javascript
const affected = await trx('products')
  .where('id', product.id)
  .andWhere('stock', '>=', requestedQty)
  .decrement('stock', requestedQty);

if (affected === 0) {
  throw new Error('Insufficient stock available.');
}
```
If available stock is less than the requested quantity, the decrement affects 0 rows, triggering an immediate transaction rollback and returning HTTP `400 Bad Request`.

### 4.3 Transparent "Pay on Delivery / Completion" Model
To address customer hesitation, HunarHub completely replaces third-party payment gateways with an explicit **Pay on Delivery** (for products) and **Pay on Completion** (for services) model. Customers pay directly via Cash or direct UPI upon inspecting the craftsmanship.

### 4.4 Verified Reviews Restriction
To eliminate fake reviews:
- A review can only be submitted by the customer who placed the order or service request.
- The status of the target order or service request must strictly be `Completed`.
- Unique database constraints (`UNIQUE(service_request_id)` and `UNIQUE(order_id)`) guarantee that each completed transaction can be reviewed at most once.

---

## 5. TESTING & VERIFICATION

A comprehensive automated test suite was developed using Jest and Supertest (`tests/api.test.js`). All 30 tests execute cleanly in under 2 seconds:

| Test Group | Test Cases | Result |
| :--- | :--- | :--- |
| **Authentication & RBAC** | Registration, login, invalid credentials, role restrictions | PASS (6/6) |
| **Entrepreneur Verification** | Pending profile hiding, admin approval, public visibility | PASS (3/3) |
| **Services & Products CRUD** | Creation, update, delete, ownership protection | PASS (5/5) |
| **Search & Filters** | City filtering, keyword search, pagination limits | PASS (3/3) |
| **Concurrency: Double-Booking** | Normal booking, duplicate slot rejection (409 Conflict) | PASS (2/2) |
| **Concurrency: Stock Integrity** | Overselling rejection (400), atomic decrement verification | PASS (2/2) |
| **Status Transitions & History** | Full lifecycle flow, status history audit timestamps | PASS (3/3) |
| **Customer Review Rules** | Review on completed job, duplicate review rejection | PASS (2/2) |
| **Earnings Calculation** | Strict aggregation from completed status only | PASS (1/1) |
| **Dispute Management** | Grievance submission, administrative resolution decision | PASS (2/2) |
| **Platform Analytics KPIs** | Verification of all 6 calculated KPIs | PASS (1/1) |

---

## 6. PLATFORM ANALYTICS & KPIS EVALUATION

The SuperAdmin analytics engine computes 6 key performance indicators:
1. **Registered Entrepreneurs**: Categorized by Approval status (Approved vs Pending vs Suspended).
2. **Active Users**: Total active customer accounts utilizing the marketplace.
3. **Service Request Conversion Rate**: Percentage of placed requests that reach `Completed` status (`Completed / Total * 100%`).
4. **Product Sales Volume**: Total physical units sold and gross platform merchandise value.
5. **Average Entrepreneur Earnings**: Platform revenue divided by active approved entrepreneurs.
6. **Customer Satisfaction Score**: Average star rating across all verified post-service reviews.

---

## 7. CONCLUSION & FUTURE ENHANCEMENTS

HunarHub successfully demonstrates a purpose-built, high-performance digital marketplace for India's micro-entrepreneurs. By addressing the real-world friction points of digital discoverability, scheduling conflicts, inventory overselling, and advance payment mistrust, HunarHub provides grassroots craftspeople with an equitable, accessible digital future.

### Future Work:
1. **Voice-Assisted Regional Interface**: Integrating speech-to-text in Hindi, Marathi, and Bengali to allow illiterate artisans to manage bookings via voice commands.
2. **Government Scheme Integration**: Cross-referencing artisan profiles with PM Vishwakarma Yojana credentials for automatic verified badges.
3. **Progressive Web App (PWA)**: Providing offline caching and push notifications on low-cost mobile handsets.
