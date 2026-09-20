# ⚡ Apex ERP — Automatic User & Customer Management System

An enterprise-grade Customer, EMI Installment, and Financial Management ERP system built with a high-performance modern tech stack.

---

## 🌟 Key Features

- **🔐 Complete Authentication & Access Guard**:
  - Secure JWT authentication with bcrypt-hashed passwords.
  - Default Admin Account: `patilabhay717@gmail.com` / `Abhay@1234`.
  - Protected routes, glassmorphism login screen with one-click demo fill, profile dropdown, and instant logout.
- **👥 Massive 2,000+ Customer Directory**:
  - Pre-seeded with 2,000 realistic customer profiles across 30+ Indian cities.
  - Fast pagination (10, 25, 50, 100 per page), instant search by name, mobile, or customer code.
  - Multi-status filtering (All, Fully Paid, Partial, Pending, Overdue).
- **💳 Purchases & EMI Installment Tracking**:
  - Automatic installment schedule generation with custom interest and down payment calculation.
  - Real-time status tracking (PAID, PARTIAL, PENDING, OVERDUE).
- **📄 Instant Receipts & Payment History**:
  - Unique receipt numbers (`REC-YYYYMM-XXXXXX`).
  - Support for multiple payment modes: UPI, Cash, Bank Transfer, Card, Cheque.
- **📊 Real-time Executive Dashboard & Reports**:
  - KPI cards (Total Sales, Total Collected, Outstanding, Overdue).
  - 6-month sales and collection trend charts.
  - Exportable reports in CSV and visual formats.

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, React Router, Vanilla CSS Design System, Lucide Icons
- **Backend**: Node.js, Express, Prisma ORM, JWT, BcryptJS
- **Database**: SQLite (`dev.db`)
- **Utility Tools**: Date-Fns, Multer

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Abhipatel12345/Automatic-User-Management-System.git
cd Automatic-User-Management-System
```

### 2. Install Dependencies

**Root dependencies:**
```bash
npm install
```

**Backend server dependencies:**
```bash
cd server
npm install
```

**Frontend client dependencies:**
```bash
cd ../client
npm install
```

### 3. Database Setup & Seeding

In the `server` directory:
```bash
# Push schema to SQLite
npx prisma db push

# (Optional) Re-seed 2,000 customer records anytime
npm run prisma:seed:2k
```

### 4. Run Locally

**Start Backend (Port 5000):**
```bash
cd server
npm run dev
```

**Start Frontend (Port 5173):**
```bash
cd client
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 🔑 Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Enterprise Admin** | `patilabhay717@gmail.com` | `Abhay@1234` |

*(A 1-click **"Fill Demo"** button is also available directly on the login page.)*

---

## 📂 Project Structure

```
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── api/                # API client with JWT Bearer attachment
│   │   ├── components/         # Layout, Header, Sidebar, Assistant, Modals
│   │   ├── context/            # AuthContext (login, logout, session)
│   │   ├── pages/              # Dashboard, Customers, Purchases, Payments, Reports
│   │   └── App.jsx             # Main Router & ProtectedRoute Guard
│   └── package.json
├── server/                     # Node.js + Express Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma ORM models (Customer, User, Purchase, etc.)
│   │   ├── seed_2k.js          # Fast 2,000 customer generator
│   │   └── dev.db              # SQLite Database
│   ├── src/
│   │   ├── controllers/        # Auth, Customer, Dashboard, Payment, Purchase
│   │   ├── middlewares/        # JWT Authentication Guard
│   │   ├── routes/             # Express API Routes
│   │   └── server.js           # Server entry point
│   └── package.json
├── .gitignore
└── README.md
```

---

## 📄 License

MIT License © 2026 Abhay Patil.
