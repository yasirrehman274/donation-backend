# Donation Management System — Backend

Production-ready REST API for the Donation Management System, built with
**Node.js, Express, MongoDB, Mongoose, JWT, bcrypt and Multer**.

It is a **drop-in replacement for the old `json-server`** so the existing
React + Tailwind admin panel keeps working without UI changes, while also
providing the full two-role (Admin / Member) system described in the spec:
JWT auth, approval flow, screenshot upload, dashboard, reports and loan
repayment auto-calculations.

---

## Requirements

- Node.js **18+** (tested on 22)
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup

```bash
cd backend
npm install
```

Copy the environment file and edit the values:

```bash
cp .env.example .env
```

Start MongoDB, then run:

```bash
npm run dev        # development (nodemon)
# or
npm start          # production
```

The API runs on **http://localhost:5000** — the exact base URL the frontend
uses (`src/api/axiosClient.js`), so the admin panel connects automatically.

A default admin is created automatically on first boot from the `ADMIN_*`
variables in `.env` (or run `npm run seed` manually).

### Default admin (from `.env`)

| Field  | Value            |
| ------ | ---------------- |
| Name   | Syed Zahid Ali   |
| Phone  | 03001234567      |
| Pass   | admin12345       |

> Change these in `.env` before production use.

---

## AUTH_ENABLED — the two modes

The current React admin panel has **no login screen** and cannot send a JWT
yet, so the backend ships with two modes controlled by `AUTH_ENABLED` in `.env`:

| Mode | `AUTH_ENABLED` | Behaviour |
| --- | --- | --- |
| **Compat** (default) | `false` | All admin/data routes are open. The existing panel works out of the box. Auth endpoints still work for building the member app. |
| **Secure** | `true` | Every route requires a valid JWT. Admin routes require the `admin` role. Members can only see/manage their own donations. |

The frontend API client already attaches `Bearer <token>` from
`localStorage['donation_token']` and clears it on 401 — so once a login screen
is added, set `AUTH_ENABLED=true` and everything is protected.

---

## Running tests

Tests use an in-memory MongoDB (no local database needed) and run against the
real HTTP API via supertest.

```bash
npm test
```

Covers: login, registration, profile, change-password, role protection, 401
handling, donation create/approve/reject, expense/surplus/loan/repayment CRUD,
loan remaining-amount auto-update, dashboard, reports, file upload,
notifications (REST + Socket.IO realtime, auto-reconnect).

---

## API overview

### Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | Login with `phone` + `password`, returns `{ user, token }` |
| POST | `/auth/register` | public | Register a member (`fullName`, `phone`, `password`) |
| GET | `/auth/profile` | any authenticated | Current user profile |
| PUT | `/auth/profile` | any authenticated | Update own `fullName` / `phone` (duplicate phone → 409) |
| PUT | `/auth/change-password` | any authenticated | `oldPassword`, `newPassword` |

### Users (admin only)

`GET /users`, `GET /users/:id`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id`

### Donations

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/donations` | admin/member | Create. Admin ⇒ `approved`; member ⇒ `pending` |
| GET | `/donations` | admin sees all / member sees own | Filters: `status`, `month`, `donorName`, `from`, `to` |
| GET | `/donations/my` | member | Own donations |
| GET | `/donations/:id` | admin/member (own) | Get one |
| PUT | `/donations/:id` | admin | Update |
| DELETE | `/donations/:id` | admin | Delete |
| PUT | `/donations/:id/approve` | admin | Approve (sets `approvedBy`, `approvedAt`) |
| PUT | `/donations/:id/reject` | admin | Reject |
| POST | `/donations/upload` | admin/member | `multipart/form-data`, field `screenshot` ⇒ `{ url }` |

### Expenses / Surplus (admin only)

Full CRUD on `/expenses` and `/surplus`. Surplus `month` is auto-derived from
`date`.

### Loans / Repayments (admin only)

- `/loans` CRUD — `remainingAmount` is kept in sync with repayments.
- `/repayments` — GET (optional `?loanId=` filter), POST, DELETE.
  Adding a repayment lowers `remainingAmount`; when it reaches `0` the loan
  status becomes `paid`; deleting a repayment recalculates it.

### Dashboard

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/dashboard` | admin | Members, donations, pending, approved, expenses, loans, surplus, repayments, **current balance**, recent donations & expenses |
| GET | `/dashboard/mine` | member | Own totals + recent donations |

### Reports (admin only)

`GET /reports/monthly?year=`, `GET /reports/yearly`, `GET /reports/member-wise?userId=&year=`,
`GET /reports/expense?year=`, `GET /reports/loan`, `GET /reports/donation?year=&month=&donorName=`

### Notifications (admin only)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/notifications` | Recent notifications (`?limit=`, max 100) |
| GET | `/notifications/unread-count` | `{ count }` of unread notifications |
| PUT | `/notifications/:id/read` | Mark one notification as read |
| PUT | `/notifications/read-all` | Mark every notification as read |

Notifications are created whenever a family member submits a donation
(`title`, `message`, `type: "new-donation"`, `relatedDonation`, `isRead`,
`createdAt`). Approving a donation automatically marks its notifications as
read.

### Real-time events (Socket.IO)

The server exposes Socket.IO on the same port (`http://localhost:5000`).

| Event | Direction | Payload |
| --- | --- | --- |
| `new-donation` | server → admin | A member's new donation notification |
| `notifications-updated` | server → admin | Notifications changed (approval / mark read) |

Clients connect with `auth: { token }` (the same JWT used for REST). Only
**admin** tokens are accepted; the connection is rejected otherwise. Realtime
events ride on top of the persisted notification records, so a client can
always fall back to polling `GET /notifications`.

---

## Balance formula

```
Current Balance = Approved Donations + Surplus + Loan Repayments
                  - Expenses - Loans Given
```

Pending donations are **never** counted. Admin-created donations default to
`approved`, so the panel's own balance matches this.

## Frontend compatibility notes

The API mirrors what the React panel expects:

- All list endpoints return **bare arrays** (not `{ data: ... }` envelopes) —
  the frontend interceptor returns `response.data` directly.
- Records use the client-generated string ids (`id_...`) as the Mongo `_id`,
  so the frontend's `PUT/DELETE /:id` calls keep working.
- Frontend field names are used: `purpose`, `date`, `returnDate`,
  `borrowerName`, `donorName`, `loanId`, `month`, etc.
- `GET /repayments?loanId=...` filtering is supported.
- Screenshot uploads go to **Cloudinary** when `CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are set in `.env`; the
  `secure_url` is stored in MongoDB and temporary local files are deleted.
  Without those credentials the backend falls back to serving files from
  `/uploads/...` (CORS enabled for the panel origin).

## Security

- Helmet security headers
- Global rate limiter + stricter login limiter
- CORS restricted to `CORS_ORIGIN`
- JWT (expiry via `JWT_EXPIRES_IN`), bcrypt password hashing
- `express-validator` on every route
- Centralized error handling with proper HTTP status codes
- Passwords never returned by the API

## Project structure

```
backend/
├── src/
│   ├── config/        env, db connection, multer upload, socket.io
│   ├── controllers/   HTTP layer (thin)
│   ├── middleware/    authenticate, authorize, validate, errors
│   ├── models/        Mongoose schemas
│   ├── routes/        Express routers
│   ├── services/      business logic (reusable)
│   ├── uploads/       uploaded screenshots
│   ├── utils/         ApiError, asyncHandler, helpers, seed
│   ├── validations/   express-validator chains
│   ├── app.js         Express app (exported for tests)
│   └── server.js      bootstrap
├── tests/             node:test + supertest + mongodb-memory-server
├── .env.example
└── package.json
```
