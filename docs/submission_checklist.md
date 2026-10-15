# HunarHub Portal Submission Checklist & Deployment Guide

This document contains click-by-click instructions for deploying HunarHub and submitting the 4 required portal links.

---

## 📋 The 4 Required Submission Links

| # | Item | Status | Submission URL Format |
| :- | :--- | :---: | :--- |
| **1** | **GitHub Repository** | Ready to Push | `https://github.com/khushisharma00/HunarHub-Digital-Marketplace` |
| **2** | **Project Report** | Generated (`docs/project_report.html`) | Google Drive Link (`https://drive.google.com/file/d/...`) |
| **3** | **Live Deployed Application** | Deploy steps below | `https://hunarhub.onrender.com` or `https://hunarhub.vercel.app` |
| **4** | **Feedback / Demo Video** | Script Ready (`docs/demo_script.md`) | YouTube / Google Drive Link (`https://...`) |

---

## 🚀 LINK 1: GitHub Repository (Check Secrets & Push)

### Step 1.1: Verify Git Status and Excluded Secrets
Check that `.env`, `.sqlite`, and `node_modules` are excluded:
```bash
git status
```

### Step 1.2: Commit and Push to GitHub
Run the following commands in your terminal:
```bash
cd "/Users/khushisharma/Desktop/HunarHub-Digital Marketplace"

# Add all files
git add .

# Commit with detailed descriptive message
git commit -m "Complete HunarHub Full-Stack Marketplace: React Vite, Node Express, PostgreSQL, Concurrency Locks, 30 Passing Tests"

# Push to your remote repository
git push origin main
```
*Your GitHub Link*: **`https://github.com/khushisharma00/HunarHub-Digital-Marketplace`**

---

## ☁️ LINK 2: Live Deployed Application

You have two easy deployment options:
- **Option A (Simplest - 1-Click Unified on Render)**: Render hosts both Backend API and React Frontend together with SPA fallback!
- **Option B (Decoupled)**: Render hosts Backend + Database, and Vercel hosts Frontend.

### Step 2.1: Create Free PostgreSQL Database on Render
1. Go to **[https://dashboard.render.com](https://dashboard.render.com)** and log in.
2. Click **New +** -> **PostgreSQL**.
3. Fill in:
   - **Name**: `hunarhub-db`
   - **Database**: `hunarhub`
   - **User**: `hunarhub_user`
   - **Region**: Choose closest (e.g., Singapore or Frankfurt or Oregon)
   - **Plan**: Free
4. Click **Create Database**.
5. Once created, copy the **Internal Database URL** (or External Database URL). It looks like:
   `postgres://hunarhub_user:xxxxxx@dpg-xxxxx.render.com/hunarhub`

### Step 2.2: Create Web Service on Render
1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository: `khushisharma00/HunarHub-Digital-Marketplace`.
3. Configure:
   - **Name**: `hunarhub-marketplace`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: Leave blank (root)
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run install:all && npm run build
     ```
   - **Start Command**:
     ```bash
     node server/server.js
     ```
   - **Plan**: Free

### Step 2.3: Add Environment Variables in Render
In the **Environment** tab, add these keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `DATABASE_URL` | *Paste your Render PostgreSQL connection string* | Managed database |
| `JWT_SECRET` | `hunarhub_super_secret_jwt_key_2026_secure` | Token encryption |
| `PORT` | `10000` | Render default port |
| `CLIENT_ORIGIN` | `*` | Allowed origins |
| `ADMIN_PASSWORD` | `admin123` | Password for admin@hunarhub.com |
| `DEFAULT_PASSWORD` | `password123` | Password for demo accounts |

Click **Save Changes** and deploy!

### Step 2.4: Seed the Production Database on Render
1. In your Render Web Service dashboard, click **Shell** in the left sidebar.
2. Run the seed command inside the shell:
   ```bash
   npm run seed
   ```
   *This automatically populates the PostgreSQL database with the 15 realistic entrepreneurs, 40 services and products, sample bookings, and reviews!*

> ⚠️ **Note on Free Render Hosting**: Free Render web services spin down after 15 minutes of inactivity. When accessed after inactivity, the first request may take ~50 seconds to wake up. Once awake, performance is instant.

---

## 📄 LINK 3: Project Report (Google Drive Link)

### Step 3.1: Export the Generated Report
1. Open `docs/project_report.html` in your browser:
   - In VS Code, right-click `docs/project_report.html` -> "Open in Default Browser" or open `http://localhost:5001/`
2. Click the top-right button: **"Print / Save to PDF"** (or press `Cmd + P`).
3. Set Destination to **"Save as PDF"**, set Margins to "Default", and click **Save**.
4. Name the file `HunarHub_Project_Report_Khushi_Sharma.pdf`.

### Step 3.2: Upload to Google Drive
1. Go to **[https://drive.google.com](https://drive.google.com)**.
2. Upload `HunarHub_Project_Report_Khushi_Sharma.pdf`.
3. Right-click the uploaded file -> **Share** -> **General access**: Change to **"Anyone with the link"** (Viewer).
4. Click **Copy link**.
   *Paste this link into Submission Link #2*.

---

## 🎥 LINK 4: Feedback & Demo Video (3-5 Minutes)

### Step 4.1: Record the Video
1. Open QuickTime Player on your MacBook Air M1 -> **File** -> **New Screen Recording**.
2. Select your microphone so your voice is recorded clearly.
3. Follow the verbatim script provided in **`docs/demo_script.md`** (covers Problem, Discovery, Concurrency Double-Booking Prevention, Inventory Protection, Pay on Delivery, and Admin KPIs).

### Step 4.2: Upload Video
1. Upload the recorded `.mp4` / `.mov` file to **YouTube** (set visibility to "Unlisted" or "Public") OR upload to **Google Drive** (set sharing to "Anyone with the link can view").
2. Copy the shareable video link.
   *Paste this link into Submission Link #4*.
