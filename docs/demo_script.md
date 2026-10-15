# HunarHub Video Demonstration & Presentation Script
**Duration**: 3 to 5 Minutes  
**Presenter**: Khushi Sharma (B.Tech Computer Science & Engineering)  
**Project**: HunarHub – Digital Marketplace for Local Micro-Entrepreneurs  

---

## 🎬 Video Recording Guide for the Student
- **Setup**: MacBook Air M1, screen recorder (QuickTime Player or OBS) with microphone enabled.
- **Preparation**:
  1. Have HunarHub running on `http://localhost:3000` or live deployed link.
  2. Have three browser tabs ready:
     - Tab 1: Marketplace Home / Browse
     - Tab 2: Customer Dashboard (`customer@hunarhub.com`)
     - Tab 3: SuperAdmin Console (`admin@hunarhub.com`)
- **Tone**: Professional, clear, confident, and enthusiastic about supporting local artisans.

---

## ⏱️ Video Script Timeline

### 0:00 - 0:45 | Introduction & Problem Statement
**[Camera: Face + Screen showing Homepage]**
> *"Hello everyone! My name is Khushi Sharma, a B.Tech Computer Science student, and today I am excited to present **HunarHub**, a digital marketplace and service booking platform built specifically for local Indian micro-entrepreneurs.*
>
> *In India, over 63 million micro-entrepreneurs—such as generational potters (kumhars), cobblers, master tailors, woodcraft artisans, and small vendors—possess world-class skills. However, they lack digital visibility and are excluded from mainstream e-commerce due to high commissions and complex onboarding.*
>
> *HunarHub solves this by providing verified digital storefronts, on-demand service scheduling, and an authentic handmade crafts marketplace operating on a zero-risk **Pay on Delivery and Pay on Completion** model."*

---

### 0:45 - 1:45 | Customer Discovery & Booking Flow
**[Screen Share: Navigating to Browse Talent & Artisan Profile]**
> *"Let's look at the customer experience. Here on the homepage, customers can browse by our 5 core trades: Cobbler, Potter, Tailor, Artisan, and Small Vendor.*
>
> *Clicking on **Browse Talent**, we can filter by city—such as Jaipur, Varanasi, or Lucknow—or search by specific skills like Chikankari or Kolhapuri leather.*
>
> *Let's view the profile of **Ramprasad Prajapati**, a master potter from Assi Ghat, Varanasi. Notice his verified artisan badge, detailed bio, skills, services offered, product gallery, and his weekly availability schedule.*
>
> *Now, let's book a service: I select his 'Custom Terracotta Planter Creation', pick a date, choose an available time slot, enter the address, and submit. Behind the scenes, our system utilizes **ACID database transactions to guarantee double-booking prevention**—two customers can never book the same slot simultaneously."*

---

### 1:45 - 2:30 | Handmade Products & Concurrency Safety
**[Screen Share: Marketplace & Shopping Cart]**
> *"Next, let's explore the **Handmade Marketplace**. Here, customers can buy genuine handcrafted goods. I'll add this 'Hand-Painted Terracotta Vase' to our cart and proceed to checkout.*
>
> *Notice our transparent pricing and clear 'Pay on Delivery' guarantee. No credit card is required. When I click 'Place Order', our backend executes an atomic inventory check: `stock >= quantity`. This guarantees that **product stock can never go negative or be oversold**, even during high-traffic concurrent purchases."*

---

### 2:30 - 3:30 | Micro-Entrepreneur & Customer Dashboards
**[Screen Share: Switching to Customer Dashboard and Entrepreneur Dashboard]**
> *"Now let's view the **Customer Dashboard**. Here, customers can track the live status lifecycle of their bookings and orders from Pending to In Progress and Completed. Once an order is completed, customers can leave a verified 1 to 5 star review.*
>
> *Next, let's switch to the **Entrepreneur Dashboard**. Here, the artisan sees their incoming requests and can accept or complete jobs.*
>
> *Crucially, our **Earnings Overview is calculated strictly from COMPLETED orders and requests**. Cancelled or pending orders never artificially inflate earnings. Artisans can also manage their services, handmade product stock, and weekly working slots with full ownership protection."*

---

### 3:30 - 4:15 | SuperAdmin Console & 6 Mandatory KPIs
**[Screen Share: Admin Dashboard Analytics]**
> *"Now let's examine the **SuperAdmin Console**. This is where platform trust and verification are maintained.*
>
> *In the **Approvals tab**, new micro-entrepreneurs remain hidden from the public until approved by an admin. Admins can also manage trade categories, inspect orders, and resolve customer grievances in our **Dispute Resolution Panel**.*
>
> *In the **Analytics tab**, we track our 6 core platform KPIs:
> 1. Registered Entrepreneurs (approved vs. pending)
> 2. Active Platform Users
> 3. Service Conversion Rate
> 4. Product Sales Volume & Revenue
> 5. Average Entrepreneur Earnings
> 6. Customer Satisfaction Score across verified reviews.*
>
> *All KPIs are backed by responsive monthly sales trend charts."*

---

### 4:15 - 5:00 | Engineering Rigor, Learnings & Conclusion
**[Camera: Face + Screen showing passing tests]**
> *"From a software engineering perspective, HunarHub is built using React 18, Node.js, Express, and PostgreSQL/SQLite with Knex.js. We implemented 30 automated integration tests covering authentication, RBAC, double-booking prevention, overselling prevention, review rules, earnings calculation, and disputes—and all 30 tests pass with 100% success.*
>
> *Through this capstone project, I gained deep hands-on experience in full-stack architecture, database transactions, concurrency safety, RESTful API design, and empathetic UI/UX designed for India's micro-entrepreneurs.*
>
> *Thank you for your time, and I invite you to explore HunarHub!"*
