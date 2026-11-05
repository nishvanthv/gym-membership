# PROJECT STATUS

## Completed

- Project setup (Express, MongoDB/Mongoose, env, gitignore)
- MVC folders: models, controllers, routes, middleware, services, validators, utils
- Authentication: register, login, JWT, bcrypt, `/api/auth/me`, logout (client-side token discard)
- RBAC: MEMBER, TRAINER, BRANCH_ADMIN
- Membership plans, purchase, expiry job, renewal
- Trainer profiles linked to User accounts
- Class scheduling with trainer overlap and capacity rules
- Booking engine with waitlist FIFO promotion
- Attendance check-in
- Workout/diet notes
- Internal notifications
- Member dashboard and admin reports
- Bootstrap frontend connected to live APIs
- Postman collection and environment
- Seed script and automated demo-flow script
- README, PROJECT_RULES.md, this status file

## In Progress

- End-to-end database-backed verification, pending a running MongoDB instance

## Remaining

- Run seed, demo flow, and authenticated edge-case tests against MongoDB
- Complete final academic requirement matrix after runtime testing

## Bugs Found

- Attendance and membership reports were not consistently restricted to the authenticated admin's branch
- Some staff read/cancel paths did not enforce branch ownership or trainer assignment
- Booking promotion and cancellation used separate reads/updates, leaving a concurrency consistency risk

## Bugs Fixed

- Branch-scoped attendance and membership report aggregation
- Branch and trainer-assignment checks for staff booking/class access
- Safer FIFO waitlist promotion with an atomic slot reservation and rollback when no waitlisted booking remains
- Date validation for attendance report query parameters

## Known Limitations

- Membership expiry notifications for expiring soon are implemented but not scheduled by default to avoid duplicate notifications
- Transaction-backed booking workflows require a MongoDB deployment that supports transactions; the fallback remains application-level compensation

## Testing Status

- JavaScript syntax check: passed for 57 files
- Public health route: passed (`200`, expected response)
- `npm install --cache .npm-cache`: passed; 137 packages installed
- `npm start`: blocked by unavailable MongoDB at `127.0.0.1:27017`
- Database-backed auth, seed, demo, booking, waitlist, attendance, and report tests: blocked by MongoDB availability
