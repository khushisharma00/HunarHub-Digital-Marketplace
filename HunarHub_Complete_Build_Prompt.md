# HunarHub: Complete Build Prompt for Antigravity

You are my Senior Full-Stack Developer, Software Architect, UI/UX Designer, QA Engineer and DevOps Engineer. I am a B.Tech student on a MacBook Air M1 using VS Code. Explain everything in very simple English.

Build the COMPLETE project described in the attached PDF (hunarhub_sources.pdf): **"HunarHub – Digital Marketplace for Local Micro-Entrepreneurs"**. Implement EVERY feature listed below as real, working functionality (frontend + backend + database), not fake buttons or static screens. Do not stop to ask for approval. Make sensible decisions, note them in the README, and keep going until everything is built, tested and ready to deploy. Only ask me a question if something truly blocks you.

## CONTEXT

Local micro-entrepreneurs (cobblers, potters/kumhar, tailors, artisans, small vendors) lack digital visibility. HunarHub lets them showcase skills, sell handmade products and accept service requests, while customers discover and support local talent.

## SCOPE

- **IN:** responsive web platform; entrepreneur profiles and service listings; product marketplace for handmade items; order and service request management.
- **OUT (do NOT build):** native mobile apps, international shipping, advanced AI recommendations, logistics and delivery management.
- **FUTURE (document only, do not build):** mobile apps, digital payments and wallets, logistics integration, skill training and certification modules.

## ALL FEATURES TO BUILD

### Customer

1. Register and login
2. Browse local entrepreneurs by category: Cobbler, Potter (Kumhar), Tailor, Artisan, Small vendor
3. Search and filter by skill type, location (city) and price range, with pagination
4. View entrepreneur profile: skills and experience, product gallery, pricing details
5. Place service requests (choose service, date and available time slot, address or notes)
6. Purchase handmade products (cart or direct order with quantity)
7. Order and request history with status
8. Ratings and feedback (1 to 5 stars + comment) after a completed order or request

### Micro-entrepreneur

1. Registration and profile creation (name, skill type, experience, bio, city, area, photo)
2. Dashboard to manage profile
3. Skill and service listing (create, edit, delete, price)
4. Product listing with images and pricing (create, edit, delete, stock)
5. Accept or reject service requests
6. Manage availability (available days and time slots)
7. View orders and service requests and update their status
8. Earnings overview (totals and per-month, from COMPLETED orders and requests only)

### Admin

1. Approve and verify entrepreneurs (new entrepreneurs are hidden from the public until approved; admin can also reject or suspend)
2. Manage categories and skills (add, edit, delete)
3. Monitor all orders and service requests
4. Handle disputes and complaints (customer or entrepreneur raises one; admin reads it, writes a decision, marks it resolved)
5. Platform analytics and reports showing these KPIs, with simple charts:
   - Number of registered entrepreneurs
   - Number of active users
   - Service request conversion rate
   - Product sales volume
   - Average entrepreneur earnings
   - Customer satisfaction ratings (average rating)

### Shared

- In-app notifications (new request, accepted/rejected, status changes, approval, dispute updates) with unread count
- Status flows:
  - Service request: Pending, Accepted, Rejected, In progress, Completed, Cancelled, Disputed
  - Order: Placed, Confirmed, Ready, Completed, Cancelled
- Core entities: Users, Micro-Entrepreneurs, Skills/Categories, Products, Service Requests, Orders, Reviews (plus Availability, Notifications, Disputes)

## NON-FUNCTIONAL REQUIREMENTS

- **Performance:** page load under 3 seconds (pagination, database indexes, image size limits, lazy loading). Supports concurrent bookings: two customers can never book the same slot, and product stock can never go negative (use database transactions, row locking or unique constraints).
- **Security:** secure authentication and data protection (bcrypt password hashing, JWT, role checks on EVERY protected route, ownership checks, server-side validation, safe image upload with type and size limits, CORS limited to my frontend URL, login rate limiting, helmet security headers).
- **Reliability:** accurate order and request tracking (status history stored with timestamps).
- **Usability:** simple, intuitive, mobile-first UI. Consistent design, good contrast, accessible labels, loading, empty and error states. No dead "#" links, no unstyled forms, no unfinished pages, no broken images.

## DECISIONS (already made)

- Payments are a future enhancement: use a clearly labelled **"Pay on delivery / pay on service completion"** flow. Never claim a payment was processed. Never store card data.
- Location = city and area text plus a city filter. No paid map APIs.
- A review is only allowed by the customer of a COMPLETED order or request, once per order or request.

## TECH STACK

The PDF suggests this stack. Use it unless my workspace already has something compatible (inspect the workspace first):

- **Frontend:** React (Vite) + Tailwind CSS + React Router
- **Backend:** Node.js + Express REST API
- **Database:** PostgreSQL
- **Images:** Cloudinary in production (local folder in development)
- **Deployment:** frontend on Vercel or Netlify, backend and database on Render

## PAGES (all connected and working)

Home, Browse entrepreneurs, Entrepreneur profile, Product detail, Cart/Order, Service request form, Login/Register, Customer dashboard, Entrepreneur dashboard, Admin dashboard (approvals, categories, monitor, disputes, analytics), Notifications, 404 page.

## HOW TO WORK

1. First inspect the workspace and show what exists. Run the real install and build commands and show the output. Reuse what is good, fix what is broken or fake.
2. Write `docs/PLAN.md` briefly (schema, API list, folder structure), then immediately continue building. Do not wait for approval.
3. Build in this order, running the build and tests after each step and showing REAL output:
   1. Foundation, database, auth and roles
   2. Entrepreneur onboarding and admin approval
   3. Categories, services and products with image upload
   4. Browse, search and filters
   5. Availability, service requests and orders with concurrency safety
   6. Reviews and notifications
   7. The three dashboards, earnings, disputes and analytics
   8. UI polish and mobile responsiveness
   9. Seed script, tests, docs, deployment files
4. Provide complete files. No "..." and no "implement the rest yourself".
5. Never claim something works, or that tests passed, unless you actually ran it. Never invent links, accounts or features.

## CONFIG AND SECURITY RULES

- No hardcoded secrets or localhost URLs: use environment variables (`VITE_API_URL`, `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `CLOUDINARY_URL`, `PORT`). Provide `.env.example` with placeholders only. Put `.env`, `node_modules`, build folders and uploads in `.gitignore`.
- No hardcoded admin password: create the admin from environment variables or a one-time script.
- Add a `/health` endpoint and an SPA fallback so refresh and direct links do not 404.

## SEED DATA (`npm run seed`)

About 15 realistic entrepreneurs across at least 5 Indian cities and all 5 categories, about 40 services and products with realistic Indian prices, availability slots, sample orders and requests in different statuses, sample reviews, one demo customer and one demo admin. Passwords come from environment variables. Use locally generated or properly licensed images that match the items.

## TESTS (mandatory)

Automated tests for: register and login, role-based access, entrepreneur approval, service and product CRUD with ownership, search and filters, double-booking prevention, overselling prevention, status transitions, review rules, earnings calculation, notifications, disputes, admin-only routes. Then manually test the full customer, entrepreneur and admin flows. Show real results.

## SUBMISSION (the portal needs 4 links starting with https://)

1. **GitHub repository:** check `git status` for secrets, then give me exact commands to create the repo and push.
2. **Detailed project report:** create `README.md`, `docs/PRD.md`, `docs/technical_documentation.md` and `docs/project_report.md` (only what is really implemented), and export the report as .docx or PDF for Google Drive ("anyone with the link").
3. **Deployed link:** give me click-by-click steps for Render (PostgreSQL + backend), Vercel or Netlify (frontend), Cloudinary, every environment variable and where to find it, running the seed, and creating the admin. I paste secrets myself. Remind me the free Render service sleeps and the first load can take about a minute. After I give you the real live URL, test it and report real results.
4. **Feedback video:** write `docs/demo_script.md`, a 3 to 5 minute script about the demo, my experience and learnings. I record the video myself.

Also create `docs/submission_checklist.md`.

## FINAL ANSWER

A short list of what is done, what I must still do myself (accounts, pasting secrets, recording the video, filling the form), and the 4 submission links with their status.
