# HunarHub – Complete Bug & Error Fix Log (`docs/FIXES.md`)

This document records all problems, bugs, and edge cases discovered during engineering audits of **HunarHub: Digital Marketplace for Local Micro-Entrepreneurs**, detailing their root cause and exact technical fix.

---

## 1. Flask Database Schema & Migration Bug
- **Location**: `app.py` lines 168–245 (`create_database`)
- **What Was Broken**: In `create_database()`, the `CREATE TABLE IF NOT EXISTS wishlist`, `orders`, and `order_items` blocks were indented inside `if product_count == 0:`. If the database already had product records (e.g., in a persistent or seeded database), `wishlist` and new `orders` tables were never created. Furthermore, the `orders` table lacked columns needed by checkout (`status`, `full_name`, `phone`, `address`, `city`, `state`, `pincode`, `payment_method`, `payment_status`), causing `sqlite3.OperationalError: table orders has no column named status` upon checkout.
- **Root Cause**: Accidental nested indentation inside the initial seed check, and missing table migrations for subsequent checkout enhancements.
- **The Fix**:
  1. Moved `wishlist`, `orders`, and `order_items` DDL statements to run unconditionally outside the `if product_count == 0:` block.
  2. Added a comprehensive dictionary of required columns (`needed_order_cols`) and ran safe `ALTER TABLE` queries with `try ... except sqlite3.OperationalError: pass` so existing databases are seamlessly upgraded without data loss.

---

## 2. Conflicting Dark Mode Event Listeners
- **Location**: `templates/base.html` lines 85–105
- **What Was Broken**: Clicking the theme toggle button `#themeToggleBtn` on `base.html` caused the theme to toggle on and immediately revert back to its previous state.
- **Root Cause**: `templates/base.html` contained an inline `addEventListener('click')` handler on `#themeToggleBtn` in addition to the event binding in `static/js/script.js`. When the user clicked the button, both handlers fired synchronously in sequence, effectively double-toggling and canceling the user's action.
- **The Fix**: Removed the duplicate inline click listener and duplicate script inclusion from `templates/base.html`, delegating all theme management solely to `static/js/script.js`.

---

## 3. Character Indexing Null-Safety in Jinja2 Profiles
- **Location**: `templates/profile.html` lines 178, 182, 204, 323
- **What Was Broken**: Accessing `user["full_name"][0]` and `user["role"]|title` threw a 500 error (`IndexError` / `TypeError`) if a user registered with an empty name or if the role was undefined.
- **Root Cause**: Direct index slicing `[0]` on strings without checking for empty string or null values.
- **The Fix**: Added defensive Jinja2 fallback expressions:
  - `{{ (user["full_name"] or 'User')[0]|upper }}`
  - `{{ (user["role"] or 'customer')|upper }}`
  - `{{ (user["role"] or 'customer')|title }}`

---

## 4. Duplicate Script Tags across Templates
- **Location**: `templates/index.html`, `templates/profile.html`, `templates/dashboard.html`
- **What Was Broken**: Multiple `<script src="{{ url_for('static', filename='js/script.js') }}"></script>` tags were appended before `</body>`.
- **Root Cause**: Scripts were both statically written and injected during automated updates.
- **The Fix**: Removed redundant script tags. Wrote an automated verification check ensuring exactly one script tag exists per standalone template.

---

## 5. Checkout UPI Link & QR Code Generation Fallbacks
- **Location**: `app.py` lines 2145–2175, `templates/checkout.html` lines 245–255
- **What Was Broken**: If the environment variable `HUNARHUB_UPI_ID` was not configured in `.env`, the UPI URL parameter generated `pa=None`. If `qrcode` generation encountered missing dependencies or encoding issues, the route would throw an unhandled 500 exception.
- **Root Cause**: Direct reliance on `os.getenv("HUNARHUB_UPI_ID")` without fallback, and lack of exception handling around the `qrcode.make()` method.
- **The Fix**:
  1. Defaulted `upi_id` to `"hunarhub@upi"` when the environment variable is null.
  2. Wrapped `qrcode.make()` in a `try ... except Exception:` block, safely falling back to an empty QR string.
  3. Added `{% if qr_code %}` conditional guards in `templates/checkout.html` so a broken image icon is never shown.

---

## 6. Admin Dashboard Fallback for Legacy Orders
- **Location**: `client/src/pages/AdminDashboard.jsx` line 544
- **What Was Broken**: Legacy order entries without an explicit `payment_method` attribute caused an empty `<p>` element with awkward layout shifting.
- **Root Cause**: Missing fallback for older seed or test orders created prior to multi-payment support.
- **The Fix**: Added a safe fallback expression: `{o.payment_method || 'Pay on Delivery'}`.

---

## 7. Working Tree Pollution from Local Backups
- **Location**: `.gitignore`
- **What Was Broken**: An untracked directory (`khushi2/`) was detected by Git, creating a dirty tree state.
- **Root Cause**: A temporary backup folder was placed in the workspace root.
- **The Fix**: Added `khushi2/` to `.gitignore`.

---

## 8. React Three-State Theme Mode & System Preference Sync
- **Location**: `client/src/context/ThemeContext.jsx`, `client/index.html`, `client/src/components/Navbar.jsx`
- **What Was Broken**: The previous dark mode toggle only toggled between light and dark without honoring live system OS theme changes. When a user visited the site in system mode, the site did not react to OS changes.
- **Root Cause**: `ThemeContext` only stored binary `'light'` / `'dark'` strings and lacked a `window.matchMedia('(prefers-color-scheme: dark)')` change listener.
- **The Fix**:
  1. Expanded `ThemeContext` to support `'light'`, `'dark'`, and `'system'` states.
  2. Added a live `matchMedia` listener that re-evaluates theme if the Mac OS theme changes while the browser tab is open.
  3. Added inline `<head>` script in `client/index.html` evaluating `system` preference prior to React mounting.
  4. Added `aria-label`, `aria-pressed`, and keyboard triggers (Enter / Space) to desktop and mobile toggle buttons.
  5. Added `@media (prefers-reduced-motion: reduce)` in `client/src/index.css` to respect accessibility guidelines.

---

## 9. Missing Authentication Templates Causing 500 Internal Server Errors
- **Location**: `templates/forgot_password.html`, `templates/reset_password.html`, `templates/login.html`
- **What Was Broken**: Clicking "Forgot Password?" or accessing `/forgot_password` threw `jinja2.exceptions.TemplateNotFound: forgot_password.html`, returning a 500 error.
- **Root Cause**: The view function `forgot_password` in `app.py` called `render_template("forgot_password.html")`, but the file did not exist in `templates/`.
- **The Fix**: Created modern `forgot_password.html` and `reset_password.html` templates with complete dark mode and password visibility toggles, and connected the `Forgot Password?` link in `login.html`.

---

## 10. Pyrefly & VS Code `missing-import` Diagnostic Warnings
- **Location**: `.vscode/settings.json`, `pyrefly.toml`, `pyproject.toml`
- **What Was Broken**: VS Code and Pyrefly flagged `flask`, `qrcode`, `dotenv`, `itsdangerous`, and `werkzeug` as `missing-import`.
- **Root Cause**: VS Code defaulted to the macOS system Python (`/usr/bin/python3`) where packages were not installed, rather than `.venv/bin/python3`.
- **The Fix**: Added `.vscode/settings.json`, `pyrefly.toml`, and `pyproject.toml` pointing explicitly to `.venv/bin/python3` and `.venv/lib/python3.12/site-packages`.

---

## 11. Pyrefly `bad-argument-type` & Duplicate Unreachable Code
- **Location**: `app.py` lines 40, 1106, 1609, 1874, 2157
- **What Was Broken**: Pyrefly reported 4 strict type check errors:
  1. `app.secret_key` (type `bytes | str | None`) passed to `URLSafeTimedSerializer`.
  2. `image_file.filename` (type `str | None`) passed to `secure_filename`.
  3. Mixed string/float types appended to `params: list[str]`.
  4. Keyword argument `format="PNG"` on `qr.save()`.
  5. Duplicate unreachable block in `edit_product`.
- **The Fix**: Defined string constant `SECRET_KEY`, guarded `image_file.filename`, typed `params: list = []`, used positional `"PNG"`, and deleted dead code block.

---

## 12. Missing Modern React `/profile` Route & Customer Profile Update Endpoints
- **Location**: `client/src/App.jsx`, `client/src/pages/Profile.jsx`, `server/controllers/authController.js`, `server/routes/authRoutes.js`
- **What Was Broken**: Navigating to `/profile` in the React frontend returned a 404 Not Found error. Customers had no portal to update their name, email, phone, or password.
- **The Fix**: Created `client/src/pages/Profile.jsx`, added `/profile` route to `App.jsx`, added links in `Navbar.jsx`, and implemented `PUT /api/auth/profile` and `POST /api/auth/change-password` in the backend.

---

---

## 14. Missing Comprehensive Dark/Light Mode Styling & Stale Browser Cache
- **Location**: `static/css/style.css`, `static/js/script.js`, `templates/profile.html`, `templates/dashboard.html`, `templates/seller_dashboard.html`, `templates/base.html`, `app.py`
- **What Was Broken**: Clicking the theme toggle button in the navbar did not properly switch the Profile and Dashboard views into dark mode. Cards, disabled input fields, and headings remained bright white with dark text. In addition, the browser cached older `style.css` and `script.js` files, preventing updates from rendering.
- **Root Cause**:
  1. Profile card (`.hh-profile-premium-card`), heading (`.hh-profile-card-heading h2`), disabled inputs, and dashboard KPI cards had hardcoded light background colors (`#ffffff`) and dark text (`#13231f`) with no dark mode override selectors.
  2. Flask default static file caching kept serving older CSS/JS files without refreshing changes.
  3. Toggle buttons lacked immediate inline fallback handlers if clicked before external script parsing finished.
- **The Fix**:
  1. Added full dark mode support across `[data-bs-theme="dark"]`, `[data-theme="dark"]`, and `html.dark` in `static/css/style.css` for Profile, Customer Dashboard, Seller Dashboard, Admin Dashboard, and Auth cards.
  2. Enhanced `static/js/script.js` to synchronize theme classes and attributes across both `<html>` and `<body>`, dynamically toggle sun/moon icons, and sync across tabs via `storage` events.
  3. Added inline `onclick` fallbacks and cache-busting query params (`?v=2.6`) across all templates.
  4. Configured `SEND_FILE_MAX_AGE_DEFAULT = 0` and an `@app.after_request` hook in `app.py` sending `Cache-Control: no-cache, no-store, must-revalidate` for all static assets during development.
  5. Implemented an automated Flask test suite (`tests/test_flask_app.py`, 13 tests) verifying that all routes, authentication, dashboards, profile editing, and theme buttons render with 100% success.


