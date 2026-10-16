# 🍃 HunarHub MongoDB Integration Guide

Welcome to the MongoDB (Mongoose) architecture guide for **HunarHub: Digital Marketplace for Local Micro-Entrepreneurs**. This guide is designed specifically for students and developers working on macOS (Apple Silicon / M1 / M2 / M3) or any modern environment.

---

## 📌 1. Overview & Architecture

HunarHub features full **MERN Stack (MongoDB, Express, React, Node.js)** support via **Mongoose ORM** alongside its existing relational engine. 

### Why MongoDB for HunarHub?
- **Flexible Document Model**: Products, services, user profiles, and orders naturally map to JSON-like documents.
- **Micro-Entrepreneur Scaling**: Dynamic portfolios, variable service attributes, and rich reviews fit MongoDB's schema flexibility.
- **Embedded Documents & Fast Lookups**: Orders and bookings store snapshots of customer and product items without complex multi-table joins.

---

## 🗂️ 2. Mongoose Models Directory (`server/models/`)

All models are located in `server/models/` and re-exported centrally through `server/models/index.js`:

| Model | File | Key Features & Constraints |
| :--- | :--- | :--- |
| **User** | `User.js` | Auto bcrypt hashing via pre-save hook, email uniqueness, role enum (`customer`, `entrepreneur`, `admin`), password sanitization in `toJSON()`. |
| **Category** | `Category.js` | Slug generation, icon name, category type (`product`, `service`, `both`). |
| **Entrepreneur** | `Entrepreneur.js` | Ref to `User`, business bio, city, address, verification status (`pending`, `approved`, `rejected`), average rating, review count, total earnings. |
| **Product** | `Product.js` | Ref to `Entrepreneur`, price (min 0), stock (min 0), image URLs array, active status. |
| **Service** | `Service.js` | Ref to `Entrepreneur`, price (min 0), duration in minutes, image URL, active status. |
| **Order** | `Order.js` | Ref to `customer` (`User`), embedded order items with item prices, shipping address sub-document, payment status (`Pending`, `Paid`, `Failed`), order status (`Placed`, `Shipped`, `Delivered`). |
| **Booking** | `Booking.js` | Ref to `customer`, `entrepreneur`, and `service`, appointment date & time slot, status lifecycle history array (`Pending`, `Accepted`, `Completed`, `Cancelled`). |
| **Review** | `Review.js` | Rating (1-5), comment, compound unique index (`{ booking: 1, customer: 1 }`) preventing duplicate reviews for the same booking. |
| **Dispute** | `Dispute.js` | Ref to booking or order, reason, description, status (`Open`, `Under Review`, `Resolved`), admin resolution notes. |
| **Notification** | `Notification.js` | Ref to `User`, title, message, type, read status flag, UI redirect link. |
| **Availability** | `Availability.js` | Ref to `Entrepreneur`, day of week (0-6), start time, end time, active flag. |

---

## 🚀 3. How to Connect MongoDB

### Option A: MongoDB Atlas (Recommended for Cloud / Production)
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com/) and create a free account.
2. Create a free **M0 Sandbox** cluster (choose AWS/Google Cloud in your nearest region, e.g., Mumbai `ap-south-1`).
3. Under **Security → Database Access**, create a user (e.g., `hunarhub_admin`) and a password.
4. Under **Security → Network Access**, add IP `0.0.0.0/0` (allow access from anywhere).
5. Click **Connect → Drivers (Node.js)** and copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/hunarhub?retryWrites=true&w=majority
   ```
6. Add this string to your `.env` file in the project root:
   ```env
   MONGODB_URI=mongodb+srv://hunarhub_admin:YourPassword123@cluster0.mongodb.net/hunarhub?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB (Optional)
If you have MongoDB Community Server installed locally on your Mac via Homebrew (`brew install mongodb-community`):
```env
MONGODB_URI=mongodb://127.0.0.1:27017/hunarhub
```

### Option C: Zero-Config In-Memory Mode (For Instant Testing & Grading)
You do **not** need to install anything or sign up for Atlas to test MongoDB functionality! 
The test suite and memory seeder use `mongodb-memory-server` out-of-the-box.

---

## 🧪 4. Testing & Seeding Commands

All commands can be run directly from the project root:

### 1. Run the Mongoose Jest Test Suite
Runs all 6 unit and integration tests for Mongoose models in-memory:
```bash
npm --prefix server run test:mongo
```
*Tests verified: bcrypt hashing, email uniqueness, entrepreneur verification validation, product inventory bounds, order item calculations, and compound unique review constraints.*

### 2. Seed Sample Data (In-Memory Validation)
Validates that the entire MongoDB schema and seed dataset loads cleanly:
```bash
npm --prefix server run seed:mongo:memory
```

### 3. Seed Sample Data (To your MongoDB Atlas Cluster)
Once you have added `MONGODB_URI` to your `.env`:
```bash
npm --prefix server run seed:mongo
```

### 4. Check MongoDB Health Status
When the server is running on port 5001, visit or curl the telemetry endpoint:
```bash
curl http://localhost:5001/api/mongodb/status
```
Example JSON response:
```json
{
  "success": true,
  "mongodb": {
    "status": "connected",
    "host": "cluster0.mongodb.net",
    "name": "hunarhub",
    "readyState": 1
  }
}
```

---

## 👥 5. Demo Credentials Seeded into MongoDB

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@hunarhub.com` | `admin123` |
| **Customer** | `customer@hunarhub.com` | `customer123` |
| **Entrepreneur (Pottery)** | `ramprasad@hunarhub.com` | `password123` |
| **Entrepreneur (Handloom)** | `meenakshi@hunarhub.com` | `password123` |
| **Entrepreneur (Organic Spices)** | `tsering@hunarhub.com` | `password123` |

---

## 🔄 6. Dual-Database Coexistence

HunarHub's backend (`server/server.js`) is configured with dual-engine flexibility:
- **Relational (SQLite / PostgreSQL)**: Powers existing relational API routes seamlessly.
- **Document (MongoDB / Mongoose)**: Loaded automatically when `MONGODB_URI` is present in `.env`.
- All 40 backend tests (`npm --prefix server test`) and 13 Flask tests (`pytest tests/test_flask_app.py`) pass without conflict.
