# PROJECT RULES

These rules are non-negotiable for P18 — Gym & Fitness Membership Management System.

1. Never store plaintext passwords.
2. Never hardcode secrets.
3. Never trust memberId from the client when JWT can identify the member.
4. Never trust client-supplied membership price.
5. Never trust client-supplied membership duration.
6. Always validate input.
7. Always check authorization.
8. Never allow duplicate bookings.
9. Never allow class capacity to be exceeded.
10. Never allow expired memberships to book classes.
11. Never expose private member data to unauthorized users.
12. Use centralized error handling.
13. Keep controllers readable.
14. Put complicated business logic in services.
15. Keep README synchronized with implementation.
16. Do not add unnecessary dependencies.
17. Do not create fake frontend data.
18. Test business workflows, not only individual endpoints.
