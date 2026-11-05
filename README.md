# Gym Management System

A working academic backend (with a small Bootstrap UI) that digitizes gym membership, class booking, waitlists, attendance, and branch reporting.

## 2. Problem Statement

Many gyms still track members, payments, class capacity, trainer schedules, and attendance in paper registers or disconnected spreadsheets. That makes expiry easy to miss, classes easy to overbook, waitlists unreliable, and branch reports slow or inconsistent. This project replaces that manual process with one connected MongoDB-backed API and role-based access.

## 3. Objectives

- Register and authenticate members, trainers, and branch admins.
- Sell membership plans using **server-side** price and duration.
- Expire and renew memberships without trusting the client.
- Schedule classes, enforce capacity, and manage waitlists fairly (FIFO).
- Record attendance and expose admin reports.
- Keep private data behind JWT + role + ownership checks.

## 4. Features

| Module | What it does |
| --- | --- |
| Auth | Register, login, JWT, bcrypt, `/me` |
| Plans | Admin create/update/deactivate plans |
| Memberships | Purchase, expiry, renewal |
| Trainers | Admin-managed profiles linked to User accounts |
| Classes | Schedule, capacity, trainer overlap, status |
| Bookings | Confirmed vs waitlisted, cancel, promote |
| Attendance | Class and general check-in |
| Notes | Diet/workout notes by trainers/admins |
| Notifications | In-app messages (no email/SMS) |
| Dashboard | One member payload for the UI |
| Reports | Attendance and membership aggregations |
| Frontend | Login/register + member/trainer/admin screens |

## 5. Technology Stack

- **Node.js** and **Express.js** — HTTP API
- **MongoDB** and **Mongoose** — data store and schemas
- **JWT** — stateless authentication
- **bcryptjs** — password hashing
- **express-validator** — request validation
- **Bootstrap 5** — minimal UI
- **Postman** — API demonstration

## 6. Architecture

```text
Browser / Postman
        ↓
   Express API (server.js)
        ↓
   Routes → Controllers
        ↓
   Services (membership, booking, notifications, reports)
        ↓
   Mongoose models
        ↓
   MongoDB
```

## 7. Database Schema

| Collection | Purpose |
| --- | --- |
| `branches` | Gym locations |
| `users` | Accounts (passwordHash never returned) |
| `membershipplans` | Purchasable plans |
| `memberships` | A member’s purchased period |
| `trainerprofiles` | Extra trainer fields, `userId` → User |
| `gymclasses` | Scheduled classes (`bookedCount` maintained by server) |
| `bookings` | Class reservations and waitlist |
| `attendances` | Check-in records |
| `workoutnotes` | Diet/workout notes |
| `notifications` | In-app alerts |

## 8. Relationships (references)

- Membership `memberId` → User, `planId` → MembershipPlan
- TrainerProfile `userId` → User, `branchId` → Branch
- Class `trainerId` → User (trainer), `branchId` → Branch
- Booking `classId` → Class, `memberId` → User
- Attendance `memberId` → User, optional `classId`
- WorkoutNote `memberId` / `trainerId` → User
- Notification `userId` → User

## 9. Embedding vs Referencing

References are used for users, plans, classes, bookings, and notes because those entities are updated independently, shared across screens, and would grow without bound if embedded (bookings inside a class, attendance history inside a user).

Small, tightly coupled flags stay on the same document (for example `bookedCount` on a class, `status` on a membership). The API loads related names with targeted `.populate()` only where the screen needs them, not deep `$lookup` chains.

## 10. Authentication

Passwords are hashed with bcrypt before save. Login compares the hash. Successful login returns a JWT signed with `JWT_SECRET` from `.env`. Protected routes use `Authorization: Bearer <token>`. Logout is stateless: the client discards the token (`POST /api/auth/logout` only confirms that).

## 11. RBAC

- **MEMBER** — own profile, purchase/renew membership, book/cancel own classes, check in, own notes/notifications/dashboard. Cannot manage plans, trainers, or reports.
- **TRAINER** — assigned classes, class attendance, notes for branch members. Cannot manage plans or admin reports.
- **BRANCH_ADMIN** — plans, trainers, classes, branch member list, reports.

## 12. Business Rules

- Plan price and duration come from MongoDB, never from the purchase body (`{ planId }` only).
- Active overlapping memberships are rejected; use **renew** to extend from the current `endDate`.
- ACTIVE memberships with `endDate` in the past are marked EXPIRED on read and by an hourly job.
- Booking requires ACTIVE membership, a SCHEDULED future class, and no existing non-cancelled booking.
- If `bookedCount < capacity`, status is CONFIRMED and `bookedCount` increments atomically. Otherwise WAITLISTED.
- Cancelling a CONFIRMED booking decrements count and promotes the earliest WAITLISTED booking.
- Class check-in requires a CONFIRMED booking, is unique per class, and sets booking to ATTENDED.
- Inactive trainers cannot be assigned to new classes. Cancelled classes cancel open bookings and notify members.

## 13. Installation

```bash
cd gym-fitness-management-system
npm install
```

MongoDB must be running locally or you must have an Atlas URI.

## 14. Environment Setup

Copy `.env.example` to `.env` and set values:

```text
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/gym_fitness_p18
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Never commit `.env`.

## 15. Running the Project

```bash
npm run seed
npm run dev
```

Open [http://localhost:5000](http://localhost:5000).

**Demo accounts (development only, created by seed):**

- Admin: `admin@gym.local` / `Admin@123`
- Trainer: `trainer@gym.local` / `Trainer@123`
- Member: `member@gym.local` / `Member@123`

End-to-end waitlist demo (server must already be running):

```bash
npm run demo
```

## 16. API Documentation

Success shape:

```json
{ "success": true, "message": "...", "data": {} }
```

Error shape:

```json
{ "success": false, "message": "...", "errorCode": "VALIDATION_ERROR" }
```

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/health` | Public |
| POST | `/api/auth/register` | Public (always MEMBER) |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| POST | `/api/auth/logout` | Authenticated |
| GET | `/api/branches` | Public |
| POST | `/api/branches` | BRANCH_ADMIN |
| GET | `/api/branches/members` | TRAINER, BRANCH_ADMIN |
| GET/POST | `/api/plans` | GET auth; POST admin |
| GET/PUT | `/api/plans/:id` | GET auth; PUT admin |
| PATCH | `/api/plans/:id/status` | Admin |
| DELETE | `/api/plans/:id` | Admin (blocked if referenced) |
| POST | `/api/memberships` | MEMBER (`{ planId }`) |
| GET | `/api/memberships/my` | MEMBER |
| GET | `/api/memberships/:id` | Owner or staff |
| POST | `/api/memberships/:id/renew` | MEMBER |
| CRUD-style | `/api/trainers` | Admin writes; list is authenticated |
| POST/GET/PUT | `/api/classes` | Admin/trainer writes; members can list |
| PATCH | `/api/classes/:id/status` | Admin/trainer |
| POST | `/api/classes/:id/book` | MEMBER |
| GET | `/api/classes/:id/bookings` | Admin/trainer |
| POST | `/api/bookings/:id/cancel` | Owner or staff |
| GET | `/api/bookings/my` | MEMBER |
| POST | `/api/attendance/checkin` | MEMBER |
| GET | `/api/attendance/my` | MEMBER |
| GET | `/api/attendance/class/:classId` | Trainer of class or admin |
| POST/GET | `/api/members/:memberId/notes` | Staff write; owner or staff read |
| PUT/DELETE | `/api/notes/:id` | Staff |
| GET | `/api/notifications` | Authenticated (own) |
| PATCH | `/api/notifications/:id/read` | Owner |
| GET | `/api/member/dashboard` | MEMBER |
| GET | `/api/trainer/dashboard` | TRAINER |
| GET | `/api/admin/reports/attendance` | BRANCH_ADMIN |
| GET | `/api/admin/reports/memberships` | BRANCH_ADMIN |

Typical HTTP codes: 201 create, 200 read/update, 400 validation, 401 auth, 403 role, 404 missing, 409 business conflict, 500 unexpected.

## 17. Postman

1. Import `postman/gym-membership-api.postman_collection.json`
2. Import `postman/gym-membership-api.postman_environment.json`
3. Select the environment, run seed, start the server
4. Run **Auth → Login admin**, then create plan/trainer/class, then member purchase/book

Tests on several requests save `adminToken`, `memberToken`, `planId`, `classId`, and similar variables automatically.

## 18. Demo Flow

1. Login as Branch Admin.
2. Create plan **Premium**, 1 month, sample price.
3. Create a trainer.
4. Create class **Yoga**, capacity **2**, future start time.
5. Register Member A, purchase membership, book Yoga → **CONFIRMED**.
6. Register Member B, purchase, book → **CONFIRMED** (class full).
7. Register Member C, purchase, book → **WAITLISTED**.
8. Member A cancels → Member C promoted to **CONFIRMED** and notified.
9. Member C checks in → attendance row, booking **ATTENDED**.
10. Trainer opens class attendance; admin opens both reports.

`npm run demo` executes this path against a running server.

## 19. Limitations

- Notifications are stored in MongoDB only (no email/SMS).
- JWT logout does not use a server-side denylist.
- Reports are branch-aware but attendance “by branch” is a simple class-id filter, not a heavy `$lookup` pipeline.
- Designed for a single running Node process and a student MongoDB instance.

## 20. Verification Notes

- JavaScript syntax validation passes for all project scripts and server files.
- The public `GET /api/health` route returns the documented response without a database connection.
- Full database-backed verification requires MongoDB running at the configured `MONGODB_URI`; with the default local URI, the server reports a clear connection error if MongoDB is unavailable.

## 21. Future Improvements

- Payment gateway for real checkout
- Email reminders for expiry and waitlist promotion
- QR-based gym door check-in
- Replica-set transactions around booking + waitlist under high load
- Pagination and full-text class search

## 22. Indexes

Created in Mongoose schemas: unique `users.email`; `memberships.memberId/status/endDate`; `classes.trainerId/startTime`; bookings `classId+memberId` unique for active statuses; `attendance.memberId`; plus supporting branch/role indexes.

## 23. Requirement matrix (implementation)

| Requirement | Implemented? | Evidence |
| --- | --- | --- |
| Registration / login / bcrypt / JWT | Yes | `controllers/authController.js`, `middleware/auth.js` |
| Plans CRUD + deactivate | Yes | `controllers/planController.js` |
| Purchase from planId only | Yes | `services/membershipService.js` |
| Expiry / renewal | Yes | membership service + hourly job in `server.js` |
| Trainers | Yes | `controllers/trainerController.js` |
| Classes + overlap + capacity | Yes | `classController.js`, `bookingService.js` |
| Waitlist FIFO | Yes | `bookingService.promoteWaitlist` |
| Attendance | Yes | `attendanceController.js` |
| Notes / notifications | Yes | note + notification controllers |
| Dashboard / reports | Yes | dashboard + report services |
| RBAC / errors / validation | Yes | middleware + validators + `errorHandler.js` |
| Postman / README | Yes | `postman/`, this file |
