# HotelPro — Luxury Hotel Booking & Management System

HotelPro is a full-stack, enterprise-grade hotel booking and management platform designed with high-fidelity architecture, granular role-based access control (RBAC), and security-first principles.

This repository implements the complete three-module system:
- **Module 1: Foundation, MongoDB, MVC Backend, and Secure Authentication**
- **Module 2: Room Inventory, Booking Engine, Payments, and Hotel Operations**
- **Module 3: Complete Frontend Integration, Responsive UI, and End-to-End Validation**

---

## 1. Technology Stack

### Backend
- **Runtime & Framework**: Node.js (CommonJS) & Express.js
- **Database**: MongoDB (v9.0.4) with Mongoose ODM
- **Authentication**: Stateless JSON Web Tokens (`jsonwebtoken`), bcrypt password cryptography (`bcryptjs`) with dotted Gmail normalization protection
- **Security & Hardening**: `helmet`, `cors`, `express-rate-limit`, `express-validator`
- **Concurrency Control**: Per-room asynchronous serialized Promise queues (`roomLock.js`) ensuring overbooking prevention
- **Payments**: Multi-provider payment service supporting Development Mock provider & Razorpay with backend HMAC-SHA256 signature verification
- **Testing**: `jest`, `supertest` (9 test suites, 64 tests passing)

### Frontend
- **Framework & Tooling**: React 19, Vite
- **Routing**: React Router DOM (v7)
- **Networking**: Axios with centralized request/response token interceptors
- **Styling**: Bootstrap 5, Custom Luxury Design System (dark obsidian theme, champagne gold accents, glassmorphic panels)
- **Icons**: React Icons (`react-icons/fa`)
- **Shared Architecture**: Error Boundaries (`ErrorBoundary.jsx`), Unified Toasts (`ToastContext.jsx`), Status Badges (`StatusBadge.jsx`), Confirmation Dialogs (`ConfirmModal.jsx`), and Spinners (`LoadingSpinner.jsx`)

---

## 2. Architecture & Design Patterns

### Room Inventory Model
In HotelPro, a `Room` represents a distinct room category or numbered unit class.
- The `inventory` field defines the **baseline total physical capacity** of that room configuration (e.g., 5 identical Deluxe units).
- **Date-Dependent Availability**: Baseline `inventory` is **never decremented** when a booking is created. Instead, availability is computed dynamically for any requested check-in and check-out window:
  ```text
  overlappingBookings = COUNT(bookings WHERE
    room = roomId AND
    bookingStatus IN ['pending', 'confirmed', 'checked_in'] AND
    checkInDate < requestedCheckOut AND
    checkOutDate > requestedCheckIn
  )
  availableUnits = room.inventory - overlappingBookings
  ```
- If a room has historical bookings, administrative deletion is safely rejected or converted into an archival deactivation (`isActive: false`), preserving referential integrity and audit records.

### Date Overlap Rule & Hotel-Night Semantics
Two reservations overlap if and only if:
```text
existingCheckIn < requestedCheckOut && existingCheckOut > requestedCheckIn
```
Under standard hotel-night semantics, a guest checking out on the same calendar day that another guest arrives does **not** conflict. Cancelled bookings (`bookingStatus: 'cancelled'`) release inventory immediately.

### Concurrency Strategy & MongoDB Topology
1. **Topology Detection**:
   - The local Windows MongoDB instance runs in **standalone mode** (`setName: undefined`). Multi-document Mongoose transactions require an active replica set and are unavailable on standalone instances.
2. **In-Process Per-Room Queue (`roomLock.js`)**:
   - Concurrency for the Node.js server is guarded by an asynchronous serialized queue indexed by `roomId`.
   - Conflicting concurrent booking attempts for the same room are processed in sequential order through an atomic lock release guarantee (`try...finally`).
   - Inside the locked critical section, the server queries the database for overlapping reservations, validates that `availableUnits >= 1`, and saves the booking atomically before releasing the lock.
   - Tested under 10 concurrent racing threads attempting to book the last available unit: exactly 1 request succeeds with `201 Created` and 9 requests receive `409 Conflict`.
3. **Multi-Instance Scaling Requirements**:
   - For multi-instance, clustered, or containerized deployments (multiple Node.js processes), the single-process in-memory queue must be upgraded to:
     - A MongoDB Replica Set (`rs.initiate()`) utilizing multi-document ACID transactions with snapshot isolation; OR
     - A distributed lock manager such as Redlock via Redis.

### Booking Lifecycle & State Transitions
The system enforces valid state transitions across the booking lifecycle:
- `pending`: Reservation created, payment pending or front-desk settlement chosen.
- `confirmed`: Room held, payment verified or guaranteed.
- `checked_in`: Guest arrived and verified by front-desk staff.
- `checked_out`: Stay completed; room automatically flagged as `dirty` for housekeeping.
- `cancelled`: Reservation cancelled by guest or admin; inventory immediately released.
- `completed`: Historical record of fully concluded stay.

### Payment Architecture & Mock Provider
- **Zero Plaintext Card Credentials**: Card numbers and CVVs are never handled or stored in MongoDB.
- **Provider Modes**:
  1. `mock`: Development-only simulated provider. Order creation generates a simulated order ID. Verification creates a cryptographic record and flags the booking paid without requiring external paid credentials.
  2. `razorpay`: Production/sandbox provider using official Razorpay orders API and cryptographic HMAC-SHA256 signature verification (`crypto.createHmac`).
- **Idempotency**: Duplicate payment verification requests for an already paid booking return the existing verified payment record safely without duplicate billing.

---

## 3. Project Directory Structure

```text
HotelPro/
├── Client/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                 # Axios instance with auth interceptors
│   │   ├── components/
│   │   │   ├── BookingModal.jsx         # Live date selector, price breakdown & payment modal
│   │   │   ├── ConfirmModal.jsx         # Accessible confirmation dialog for actions
│   │   │   ├── ErrorBoundary.jsx        # Dignified luxury error boundary
│   │   │   ├── Footer.jsx               # Shared footer with live API health status
│   │   │   ├── LoadingSpinner.jsx       # Gold themed spinner & loading states
│   │   │   ├── Navbar.jsx               # Responsive navigation bar with role badges
│   │   │   ├── ProtectedRoute.jsx       # Multi-role route guard component
│   │   │   └── StatusBadge.jsx          # Unified status badge across all views
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Authentication & session provider
│   │   │   └── ToastContext.jsx         # Real-time feedback notification toasts
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx           # Global luxury layout wrapper
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx            # Secure login with dotted Gmail fix
│   │   │   │   └── Register.jsx         # Guest registration with validation
│   │   │   ├── guest/
│   │   │   │   ├── GuestDashboard.jsx   # Guest portal with live stay telemetry
│   │   │   │   └── MyBookings.jsx       # Guest bookings list, cancellation & pay
│   │   │   ├── staff/
│   │   │   │   └── StaffDashboard.jsx   # Front desk check-in, check-out & housekeeping
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.jsx   # Live MongoDB aggregation, room & staff management
│   │   │   ├── Home.jsx                 # Public landing page with live availability search
│   │   │   └── NotFound.jsx             # 404 page
│   │   ├── App.jsx                      # Routing configuration with /my-bookings
│   │   ├── index.css                    # Luxury dark obsidian & gold design tokens
│   │   └── main.jsx                     # Vite React entry point
│   ├── package.json
│   └── vite.config.js
├── Server/
│   ├── config/
│   │   └── db.js                        # Reliable MongoDB connection & graceful shutdown
│   ├── controllers/
│   │   ├── authController.js            # Authentication HTTP handlers
│   │   ├── roomController.js            # Room CRUD & date availability handlers
│   │   ├── bookingController.js         # Booking reservation & cancellation handlers
│   │   ├── paymentController.js         # Order creation & signature verification
│   │   ├── adminController.js           # Administrative telemetry, metrics & staff provisioning
│   │   └── staffController.js           # Front desk check-in, check-out & housekeeping
│   ├── middleware/
│   │   ├── authMiddleware.js            # Bearer JWT verification & user attachment
│   │   ├── roleMiddleware.js            # Granular RBAC (isGuest, isStaff, isAdmin)
│   │   ├── errorMiddleware.js           # Centralized safe JSON error handler with status propagation
│   │   └── notFoundMiddleware.js        # Structured 404 handler
│   ├── models/
│   │   ├── User.js                      # User schema with bcrypt comparison & toJSON cleanup
│   │   ├── Room.js                      # Room schema with baseline inventory & housekeepingStatus
│   │   ├── Booking.js                   # Booking schema with pricing snapshots & operational dates
│   │   └── Payment.js                   # Payment schema (PCI-DSS compliant, provider references)
│   ├── routes/
│   │   ├── authRoutes.js                # Auth endpoints
│   │   ├── roomRoutes.js                # Room endpoints
│   │   ├── bookingRoutes.js             # Booking endpoints
│   │   ├── paymentRoutes.js             # Payment endpoints
│   │   ├── adminRoutes.js               # Admin endpoints
│   │   └── staffRoutes.js               # Staff operational endpoints
│   ├── services/
│   │   ├── authService.js               # Authentication queries & token logic
│   │   ├── roomService.js               # Room pagination, filtering & availability calculation
│   │   ├── bookingService.js            # Concurrency-safe booking engine & ownership checks
│   │   ├── paymentService.js            # Mock & Razorpay order generation & HMAC verification
│   │   ├── adminService.js              # Real-time MongoDB metrics aggregation & user listings
│   │   └── staffService.js              # Check-in, check-out & housekeeping state transitions
│   ├── tests/
│   │   ├── setup.js                     # Isolated test database manager (HotelPro_test)
│   │   ├── e2e.test.js                  # Complete Module 3 end-to-end integration test suite
│   │   ├── health.test.js               # Health check and 404 tests
│   │   ├── auth.test.js                 # Authentication & security test suite
│   │   ├── roles.test.js                # Role-based middleware authorization tests
│   │   ├── models.test.js               # Core schema validation & PCI safety tests
│   │   ├── rooms.test.js                # Room CRUD, filtering & availability tests
│   │   ├── bookings.test.js             # Booking creation, overlap & concurrency race tests
│   │   ├── payments.test.js             # Payment orders, HMAC verification & idempotency tests
│   │   └── operations.test.js           # Front desk check-in, check-out & housekeeping tests
│   ├── utils/
│   │   ├── jwt.js                       # JWT signing utility
│   │   ├── roomLock.js                  # Asynchronous per-room Promise serialized queue
│   │   ├── seedAdmin.js                 # Safe admin seeding utility
│   │   ├── resetAdminPassword.js        # Secure administrator password reset tool
│   │   └── seedRooms.js                 # Safe initial luxury suite seeding utility
│   ├── .env                             # Private environment configuration (IGNORED BY GIT)
│   ├── .env.example                     # Environment template with placeholders
│   ├── index.js                         # Express server entry point mounting API v1 routes
├── Project_Documentation/
│   ├── README.md                        # Documentation index
│   ├── Ideation Phase/
│   │   └── 1_Ideation_Phase.pdf
│   ├── Requirement Analysis/
│   │   └── 2_Requirement_Analysis.pdf
│   ├── Project Design Phase/
│   │   └── 3_Project_Design_Phase.pdf
│   ├── Project Planning Phase/
│   │   └── 4_Project_Planning_Phase.pdf
│   ├── Project Development Phase/
│   │   └── 5_Project_Development_Phase.pdf
│   ├── Performance Testing/
│   │   └── 6_Performance_Testing.pdf
│   └── Documentation and Demo/
│       └── 7_Documentation_and_Demo.pdf
├── package.json
└── README.md
```

---

## 4. Environment Variables

The application reads configuration from `Server/.env`. Template placeholders are maintained in `Server/.env.example`:

```ini
MONGO_URI=mongodb://127.0.0.1:27017/HotelPro
PORT=8001
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_strong_random_secret
JWT_EXPIRES_IN=1d

# Module 2 & 3 Payment Gateway Configuration
# Options: 'mock' (default for local development & automated testing) or 'razorpay'
PAYMENT_PROVIDER=mock
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

> **Security Rule**: The `.env` file is excluded in `.gitignore` and must never be committed to source control or exposed in frontend code.

---

## 5. API Endpoints Contract

### Authentication & Profiles (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new guest account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve authenticated user profile |

### Rooms & Inventory (`/api/v1/rooms`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/rooms` | Public | Paginated room listing with filters (type, price, amenities) |
| `GET` | `/api/v1/rooms/availability` | Public | Dynamic date-range availability check (`?checkIn=&checkOut=&roomId=`) |
| `GET` | `/api/v1/rooms/:id` | Public | Retrieve room details by ID |
| `POST` | `/api/v1/rooms` | Admin Only | Create new suite with baseline inventory |
| `PATCH` | `/api/v1/rooms/:id` | Admin / Staff | Update room rates, inventory, status, or amenities |
| `DELETE` | `/api/v1/rooms/:id` | Admin Only | Safely archive or delete room |

### Bookings (`/api/v1/bookings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/bookings` | Authenticated | Create booking with server price calculation & concurrency lock |
| `GET` | `/api/v1/bookings/my` | Authenticated | Retrieve bookings owned by the authenticated user |
| `GET` | `/api/v1/bookings/:id` | Authenticated | Retrieve booking by ID (ownership enforced) |
| `PATCH` | `/api/v1/bookings/:id/cancel` | Authenticated | Cancel booking & release date-range inventory |

### Payments (`/api/v1/payments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/payments/create-order` | Authenticated | Generate payment order (Mock or Razorpay) |
| `POST` | `/api/v1/payments/verify` | Authenticated | Verify signature & update payment/booking state idempotently |
| `GET` | `/api/v1/payments/:bookingId` | Authenticated | View payment details for a booking |

### Staff Operations (`/api/v1/staff`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `PATCH` | `/api/v1/staff/bookings/:id/check-in` | Staff / Admin | Execute guest check-in transition |
| `PATCH` | `/api/v1/staff/bookings/:id/check-out` | Staff / Admin | Execute check-out transition & set room to dirty |
| `PATCH` | `/api/v1/staff/rooms/:id/housekeeping` | Staff / Admin | Update housekeeping status (`clean`, `dirty`, `cleaning_in_progress`, `inspected`) |

### Administration (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | Admin Only | Live MongoDB aggregation metrics (occupancy, revenue, status) |
| `GET` | `/api/v1/admin/rooms` | Admin Only | View all rooms (including archived) |
| `GET` | `/api/v1/admin/bookings` | Admin / Staff | Master bookings roster with search and status filters |
| `GET` | `/api/v1/admin/payments` | Admin Only | Master payment records and status audit |
| `GET` | `/api/v1/admin/users` | Admin Only | Safe user list (excluding passwords) |
| `POST` | `/api/v1/admin/staff` | Admin Only | Provision new authorized staff or administrator account |

---

## 6. Local Execution & Seed Utilities

### Step 1: Start Backend Server
```bash
cd Server
npm install
npm run dev
```

### Step 2: Seed Initial Luxury Suites (Optional)
If the database room inventory is empty:
```bash
cd Server
node utils/seedRooms.js
```

### Step 3: Seed Administrator (If not already created)
```bash
cd Server
npm run seed:admin
```

### Step 4: Start Frontend Client
```bash
cd Client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 7. Automated Test Suite & Verified Outcomes

Automated tests run against an **isolated test database** (`mongodb://127.0.0.1:27017/HotelPro_test`). The production database `HotelPro` is never cleared or altered during testing.

To run the complete test suite:
```bash
cd Server
npm test
```

### Actual Verified Test Results
```text
Test Suites: 9 passed, 9 total
Tests:       64 passed, 64 total
Snapshots:   0 total
Time:        34.001 s
Ran all test suites.

PASS tests/e2e.test.js
  √ Full E2E Lifecycle: Public browsing -> Guest signup & login -> Admin room setup -> Booking -> Payment -> Staff check-in/out -> RBAC barriers

PASS tests/bookings.test.js
  √ Valid booking creation with server-calculated totals
  √ Rejection of invalid dates, past dates, and nonexistent rooms
  √ Rejection of overlapping bookings when inventory is 1 unit
  √ Acceptance of adjacent stays (hotel-night boundary semantics)
  √ Guest isolation (guests cannot view other guests' bookings)
  √ Cancellation inventory release
  √ Concurrent booking race test (10 parallel reservation attempts: 1 success, 9 conflicts)

PASS tests/auth.test.js
  √ Dotted Gmail email normalization fix
  √ Bcrypt password hashing & JWT token issuance
  √ Privilege escalation protection (public registration defaults to guest)

PASS tests/rooms.test.js
  √ Admin-only room creation, updating, and archiving
  √ Role protection (guests cannot create or delete rooms)
  √ Dynamic date availability calculations
  √ Rejection of invalid room parameters

PASS tests/operations.test.js
  √ Front-desk check-in state transition
  √ Check-out transition with automatic housekeeping dirty flag
  √ Rejection of premature check-outs
  √ Housekeeping status transitions (clean, dirty, cleaning_in_progress, inspected)

PASS tests/payments.test.js
  √ Mock payment order creation & verification
  √ Idempotent duplicate verification handling
  √ Razorpay HMAC-SHA256 signature verification & forgery rejection
  √ Payment isolation and status synchronization

PASS tests/roles.test.js
  √ Multi-tier RBAC route enforcement

PASS tests/models.test.js
  √ PCI-DSS safety verification & Mongoose schema validation

PASS tests/health.test.js
  √ Health check & structured 404 handler
```

### Frontend Production Build
```bash
cd Client
npm run build
```
Result:
```text
✓ 104 modules transformed.
dist/index.html                   0.89 kB │ gzip:   0.48 kB
dist/assets/index-CVMxRZyL.css  234.11 kB │ gzip:  32.13 kB
dist/assets/index-BtGxPD7q.js   462.76 kB │ gzip: 133.16 kB
✓ built in 906ms
```

---

## 8. Known Limitations & Production Roadmap

1. **In-Process Promise Queue vs. Distributed Locks**:
   - The in-process per-room queue (`roomLock.js`) serializes booking attempts on a single Node.js instance.
   - For multi-instance, clustered, or Kubernetes deployments, MongoDB must be configured as a Replica Set (`rs.initiate()`) to support multi-document ACID transactions with snapshot isolation, or paired with a distributed lock manager such as Redlock (Redis).
2. **Third-Party Payment Webhooks**:
   - Real-time Razorpay server-to-server webhook ingestion requires a publicly accessible webhook endpoint (e.g., via ngrok during local development). The client-driven signature verification workflow implemented handles the local development and automated testing lifecycle.

---

## 9. Project Documentation

Comprehensive stage-wise project documentation PDFs with architecture diagrams, flowcharts, schemas, traceability matrices, test checklists, and runbooks:

1. [Ideation Phase](Project_Documentation/Ideation%20Phase/1_Ideation_Phase.pdf) — Project vision, problem statements, market positioning, target personas, and USP definition.
2. [Requirement Analysis](Project_Documentation/Requirement%20Analysis/2_Requirement_Analysis.pdf) — Functional and non-functional requirements, RBAC specifications, user stories, and acceptance criteria.
3. [Project Design Phase](Project_Documentation/Project%20Design%20Phase/3_Project_Design_Phase.pdf) — System architecture, high-level/low-level designs, database ERDs, state machines, and API specifications.
4. [Project Planning Phase](Project_Documentation/Project%20Planning%20Phase/4_Project_Planning_Phase.pdf) — WBS, sprint schedules, milestones, resource allocation, and risk management plan.
5. [Project Development Phase](Project_Documentation/Project%20Development%20Phase/5_Project_Development_Phase.pdf) — Coding standards, module implementations, Git branching strategies, and environment configurations.
6. [Performance Testing](Project_Documentation/Performance%20Testing/6_Performance_Testing.pdf) — Load test scenarios, concurrency race validations, throughput metrics, bottleneck analyses, and optimizations.
7. [Documentation and Demo](Project_Documentation/Documentation%20and%20Demo/7_Documentation_and_Demo.pdf) — User manuals, operational SOPs, API reference catalogs, demo runbooks, and submission readiness checklist.
