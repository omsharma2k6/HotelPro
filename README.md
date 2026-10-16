# HotelPro — Luxury Hotel Booking & Management System

HotelPro is a full-stack, enterprise-grade hotel booking and management platform designed with high-fidelity architecture, granular role-based access control (RBAC), and security-first principles. 

This repository implements **Module 1: Foundation, MongoDB, MVC Backend, and Secure Authentication**. It establishes the complete foundational architecture required for Module 2 (Booking Engine & Room Inventory) and Module 3 (Advanced Portals & Analytics) to build upon seamlessly.

---

## 1. Technology Stack

### Backend
- **Runtime & Framework**: Node.js (v24.x) & Express.js (CommonJS)
- **Database**: MongoDB (v9.0.4) with Mongoose ODM
- **Authentication**: Stateless JSON Web Tokens (`jsonwebtoken`), bcrypt password cryptography (`bcryptjs`)
- **Security & Hardening**: `helmet`, `cors`, `express-rate-limit`, `express-validator`
- **Testing**: `jest`, `supertest`

### Frontend
- **Framework & Tooling**: React 19, Vite
- **Routing**: React Router DOM (v7)
- **Networking**: Axios with centralized request/response token interceptors
- **Styling**: Bootstrap 5, Custom Luxury Design System (dark obsidian theme, champagne gold accents, glassmorphic panels)
- **Icons**: React Icons (`react-icons/fa`)

---

## 2. Project Directory Structure

```text
HotelPro/
├── Client/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                 # Axios instance with auth interceptors
│   │   ├── assets/                      # Static brand assets
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Shared responsive navigation bar
│   │   │   ├── Footer.jsx               # Shared footer with live API health status
│   │   │   └── ProtectedRoute.jsx       # Multi-role route guard component
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Centralized authentication & session provider
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx           # Global layout wrapper
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx            # Secure login with demo autofill helper
│   │   │   │   └── Register.jsx         # Guest registration with validation
│   │   │   ├── guest/
│   │   │   │   └── GuestDashboard.jsx   # Guest portal & upcoming stays teaser
│   │   │   ├── staff/
│   │   │   │   └── StaffDashboard.jsx   # Operational desk & housekeeping overview
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.jsx   # Executive metrics, live telemetry & health
│   │   │   ├── Home.jsx                 # Public landing page with suite previews
│   │   │   └── NotFound.jsx             # 404 page
│   │   ├── routes/
│   │   │   └── routes.js                # Route path constants
│   │   ├── utils/
│   │   │   └── formatters.js            # Currency & date formatting helpers
│   │   ├── App.jsx                      # Main routing configuration
│   │   ├── index.css                    # Luxury design system & tokens
│   │   └── main.jsx                     # Vite React entry point
│   ├── index.html                       # HTML5 entry with luxury typography
│   ├── package.json                     # Frontend dependencies
│   └── vite.config.js                   # Vite configuration (port 5173)
├── Server/
│   ├── config/
│   │   └── db.js                        # Reliable MongoDB connection & graceful shutdown
│   ├── controllers/
│   │   └── authController.js            # Registration, Login, and Current User logic
│   ├── middleware/
│   │   ├── authMiddleware.js            # Bearer JWT verification & user attachment
│   │   ├── roleMiddleware.js            # Granular RBAC (guest, staff, admin)
│   │   ├── errorMiddleware.js           # Centralized safe JSON error handler
│   │   └── notFoundMiddleware.js        # Structured 404 handler
│   ├── models/
│   │   ├── User.js                      # User schema with bcrypt comparison & toJSON cleanup
│   │   ├── Room.js                      # Room schema with baseline inventory model
│   │   ├── Booking.js                   # Booking schema with pricing snapshots
│   │   └── Payment.js                   # Payment schema (PCI-DSS compliant, no card numbers)
│   ├── routes/
│   │   └── authRoutes.js                # Express validator & rate-limited auth routes
│   ├── services/
│   │   └── authService.js               # Reusable authentication service queries
│   ├── tests/
│   │   ├── setup.js                     # Isolated test database manager (HotelPro_test)
│   │   ├── health.test.js               # Health check and 404 tests
│   │   ├── auth.test.js                 # Authentication & security test suite
│   │   ├── roles.test.js                # Role-based middleware authorization tests
│   │   └── models.test.js               # Core schema validation & PCI safety tests
│   ├── uploads/
│   │   └── .gitkeep                     # Asset storage placeholder
│   ├── utils/
│   │   ├── jwt.js                       # JWT signing utility
│   │   └── seedAdmin.js                 # Safe interactive / env-driven admin seeding
│   ├── .env                             # Private environment configuration (IGNORED BY GIT)
│   ├── .env.example                     # Environment template with placeholders
│   ├── index.js                         # Express server entry point
│   └── package.json                     # Backend dependencies & test scripts
├── .gitignore                           # Git ignore rules protecting .env and build files
├── package.json                         # Root package script aggregator
└── README.md                            # Comprehensive documentation
```

---

## 3. Prerequisites

- **Node.js**: `v18.x` or higher (verified on `v24.13.0`)
- **npm**: `v9.x` or higher (verified on `v11.6.2`)
- **MongoDB**: Community Server `v7.x` or `v9.x` running on local Windows service (`127.0.0.1:27017`)

---

## 4. Environment Variables Setup

The application reads configuration from `Server/.env`. A template is provided in `Server/.env.example`:

```ini
MONGO_URI=mongodb://127.0.0.1:27017/HotelPro
PORT=8001
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_strong_random_secret
JWT_EXPIRES_IN=1d
```

> **Security Rule**: The `.env` file is excluded in `.gitignore` and must never be committed to source control or exposed in frontend code.

---

## 5. Initial Administrator Seeding

To maintain strict security separation, **public user registration can only create accounts with the `guest` role**. The initial administrator account must be created via the protected seeding utility.

### Seeding Procedure

Run the seed script from the `Server/` directory:

```bash
cd Server
npm run seed:admin
```

The script will prompt interactively for:
1. Admin Full Name
2. Admin Email Address
3. Admin Phone Number
4. Admin Password (minimum 8 characters)

Alternatively, credentials can be passed via environment variables:

**PowerShell (Windows)**:
```powershell
$env:ADMIN_NAME="Hotel Administrator"; $env:ADMIN_EMAIL="admin@hotelpro.local"; $env:ADMIN_PASSWORD="AdminPassword2026!"; $env:ADMIN_PHONE="+15559876543"; npm run seed:admin
```

**Bash / macOS / Linux**:
```bash
ADMIN_NAME="Hotel Administrator" ADMIN_EMAIL="admin@hotelpro.local" ADMIN_PASSWORD="AdminPassword2026!" ADMIN_PHONE="+15559876543" npm run seed:admin
```

> **Idempotency Note**: If an administrator with that email already exists, the script halts safely without altering the existing administrator's password.

---

## 6. Local Development Workflow

### Terminal 1: Backend Server

```bash
cd Server
npm install
npm run dev
```

The backend server connects to MongoDB and begins listening on `http://localhost:8001`.
- Health Endpoint: `http://localhost:8001/api/health`

### Terminal 2: Frontend Client

```bash
cd Client
npm install
npm run dev
```

The Vite development server starts on `http://localhost:5173`.

---

## 7. API Endpoints Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | System status and MongoDB readiness check |
| `POST` | `/api/v1/auth/register` | Public (Rate-limited) | Register new user (**always assigned `guest` role**) |
| `POST` | `/api/v1/auth/login` | Public (Rate-limited) | Authenticate user and receive signed JWT |
| `GET` | `/api/v1/auth/me` | Protected (Bearer JWT) | Retrieve authenticated user's profile |

---

## 8. Automated Testing

Automated tests run against an **isolated test database** (`mongodb://127.0.0.1:27017/HotelPro_test`). The production database `HotelPro` is never cleared or modified during test execution.

To run the complete test suite:

```bash
cd Server
npm test
```

### Test Coverage Highlights
- **Health & Routing**: Confirms structured health response and 404 JSON handling.
- **Registration**: Validates input formats, password strength, rejection of mismatched passwords, duplicate email handling, and password hashing.
- **Privilege Escalation Prevention**: Verifies that client-supplied `role: "admin"` in public registration is ignored and assigned `guest`.
- **Credential Protection**: Asserts that API responses never contain `password` or `passwordHash`.
- **Authentication**: Validates bcrypt password verification, deactivated account lockout, and JWT token issuance.
- **Session Verification**: Verifies valid Bearer tokens, and rejects missing, malformed, tampered, or expired tokens.
- **Role-Based Authorization**: Tests `guest`, `staff`, and `admin` permission boundaries.
- **Core Data Models**: Validates schema constraints for Room, Booking, and Payment (PCI-DSS compliance verified).

---

## 9. Security & Compliance Notes

1. **Password Cryptography**: Passwords are saved exclusively as salted hashes (`bcryptjs`, 10 rounds). Plaintext passwords and confirmation passwords are never stored.
2. **JWT Bearer Authentication**: Auth tokens are signed using the private `JWT_SECRET` loaded from `Server/.env`. The secret is never sent to the client.
3. **PCI-DSS Compliance**: The `Payment` schema does not accept or store credit card numbers, expiration dates, or CVV/CVC security codes.
4. **Authoritative Backend**: Role enforcement is verified on the backend for every protected endpoint. Frontend route guards provide user experience routing, but the server remains authoritative.
5. **Rate Limiting**: Authentication endpoints are rate-limited to mitigate brute-force attacks.
