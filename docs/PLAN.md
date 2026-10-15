# HunarHub Architecture and Implementation Plan

## 1. System Overview
HunarHub is a digital marketplace connecting local Indian micro-entrepreneurs (Cobblers, Potters, Tailors, Artisans, Small Vendors) with customers for handmade products and on-demand local services.

## 2. Directory Structure
```
HunarHub-Digital Marketplace/
├── client/                     # React 18 + Vite + Tailwind CSS Frontend
│   ├── public/                 # Static assets, favicon, seed images
│   ├── src/
│   │   ├── api/                # Axios / Fetch API client with JWT interceptor
│   │   ├── components/         # Reusable UI components (Navbar, Footer, Modal, Cards, RatingStars)
│   │   ├── context/            # AuthContext, CartContext, NotificationContext
│   │   ├── pages/              # All specified pages
│   │   │   ├── Home.jsx
│   │   │   ├── Browse.jsx
│   │   │   ├── EntrepreneurProfile.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── ServiceRequestForm.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── CustomerDashboard.jsx
│   │   │   ├── EntrepreneurDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   └── NotFound.jsx
│   │   ├── App.jsx             # React Router configuration
│   │   ├── index.css           # Tailwind + Custom Design Tokens
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/                     # Node.js + Express REST API
│   ├── config/                 # DB configuration (Knex supporting PostgreSQL + SQLite)
│   ├── controllers/            # Request handlers
│   │   ├── authController.js
│   │   ├── entrepreneurController.js
│   │   ├── categoryController.js
│   │   ├── serviceController.js
│   │   ├── productController.js
│   │   ├── bookingController.js
│   │   ├── orderController.js
│   │   ├── reviewController.js
│   │   ├── notificationController.js
│   │   ├── disputeController.js
│   │   └── adminController.js
│   ├── middleware/             # auth, roles, rateLimit, upload, errorHandler
│   ├── migrations/             # Database table schemas
│   ├── routes/                 # Express API routes
│   ├── seeds/                  # Realistic Indian seed data (15 entrepreneurs, 40 items)
│   ├── tests/                  # Automated test suite (Jest / Supertest)
│   ├── uploads/                # Local uploaded images
│   ├── app.js                  # Express app setup
│   ├── server.js               # Entry point
│   └── package.json
├── docs/                       # Project documentation
│   ├── PLAN.md
│   ├── PRD.md
│   ├── technical_documentation.md
│   ├── project_report.md
│   ├── demo_script.md
│   └── submission_checklist.md
├── package.json                # Root package for workspace scripts
├── .env.example                # Environment variables template
├── .gitignore
└── README.md
```

## 3. Database Schema Entities
1. **users**: `id`, `full_name`, `email`, `password_hash`, `role` ('customer', 'entrepreneur', 'admin'), `phone`, `avatar`, `created_at`
2. **categories**: `id`, `name`, `slug`, `description`, `icon`, `is_active`, `created_at`
3. **entrepreneurs**: `id`, `user_id`, `category_id`, `business_name`, `skill_type`, `experience_years`, `bio`, `city`, `area`, `address`, `profile_photo`, `status` ('pending', 'approved', 'rejected', 'suspended'), `rating_avg`, `rating_count`, `created_at`
4. **services**: `id`, `entrepreneur_id`, `category_id`, `title`, `description`, `price`, `duration_mins`, `is_active`, `created_at`
5. **products**: `id`, `entrepreneur_id`, `category_id`, `name`, `description`, `price`, `stock`, `image_url`, `is_active`, `created_at`
6. **availability_slots**: `id`, `entrepreneur_id`, `day_of_week`, `start_time`, `end_time`, `is_active`
7. **service_requests**: `id`, `customer_id`, `entrepreneur_id`, `service_id`, `booking_date`, `time_slot`, `status` ('Pending', 'Accepted', 'Rejected', 'In progress', 'Completed', 'Cancelled', 'Disputed'), `address`, `notes`, `total_price`, `payment_method`, `payment_status`, `created_at`
8. **orders**: `id`, `customer_id`, `total_amount`, `status` ('Placed', 'Confirmed', 'Ready', 'Completed', 'Cancelled'), `delivery_address`, `contact_phone`, `notes`, `payment_method`, `payment_status`, `created_at`
9. **order_items**: `id`, `order_id`, `product_id`, `entrepreneur_id`, `quantity`, `unit_price`, `total_price`
10. **reviews**: `id`, `customer_id`, `entrepreneur_id`, `service_request_id`, `order_id`, `rating`, `comment`, `created_at` (UNIQUE constraint)
11. **notifications**: `id`, `user_id`, `title`, `message`, `type`, `link`, `is_read`, `created_at`
12. **disputes**: `id`, `raised_by_user_id`, `against_user_id`, `service_request_id`, `order_id`, `reason`, `details`, `status` ('Open', 'Under Review', 'Resolved', 'Dismissed'), `admin_decision`, `resolved_at`, `created_at`
13. **status_history**: `id`, `entity_type`, `entity_id`, `previous_status`, `new_status`, `changed_by_user_id`, `notes`, `created_at`

## 4. API Endpoints Map
- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- **Categories**: `/api/categories` (GET, POST, PUT, DELETE)
- **Entrepreneurs**: `/api/entrepreneurs` (GET with search, category, city, price filters, pagination), `/api/entrepreneurs/:id`, `/api/entrepreneurs/me`, `/api/entrepreneurs/profile`
- **Services**: `/api/services`, `/api/services/:id` (CRUD + ownership)
- **Products**: `/api/products`, `/api/products/:id` (CRUD + ownership)
- **Availability**: `/api/availability` (GET, POST, DELETE)
- **Service Requests**: `/api/service-requests` (POST with slot conflict detection, GET customer/entrepreneur, PATCH status with history)
- **Orders**: `/api/orders` (POST with inventory transaction check, GET, PATCH status)
- **Reviews**: `/api/reviews` (POST validation: only completed request/order, single review rule)
- **Notifications**: `/api/notifications` (GET, PATCH mark read)
- **Disputes**: `/api/disputes` (POST raise, GET user/admin, PATCH admin resolve)
- **Admin**: `/api/admin/entrepreneurs/pending`, `/api/admin/entrepreneurs/:id/status`, `/api/admin/analytics`, `/api/admin/orders`, `/api/admin/service-requests`
- **System**: `/health` (Health check)

## 5. Security & Concurrency Design
- **Double Booking**: Serializable transaction check + constraint preventing concurrent slot reservations.
- **Negative Stock**: `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?` within DB transaction.
- **Auth & RBAC**: JWT Bearer token + role check middleware (`requireRole('admin')`, `requireRole('entrepreneur')`).
- **Input Validation**: Express-validator / Joi schema sanitization on all mutations.
- **Upload Security**: Multer with file type (JPEG, PNG, WebP) and 5MB size limit.
