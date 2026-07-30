# Natty Gym — Gym Management System

A full-stack gym management system built for **Natty Gym**, covering four branches across Nairobi and Kiambu County: Kahawa Sukari, Membley, Ruiru Kihunguro, and Kenyatta Road.

**Live demo:** [natty-gym-system.vercel.app](https://natty-gym-system.vercel.app)

Test login:
- Email: `admin@nattygym.com`
- Password: *(ask the repo owner — not published here for obvious reasons)*

---

## Features

- **Staff authentication** — register/login/logout with JWT sessions stored in httpOnly cookies, role-based access (admin/staff)
- **Members** — add, view, edit, and deactivate gym members per branch
- **Memberships & payments** — enroll a member into a plan (daily, weekly, bi-weekly, monthly, quarterly, half-yearly, yearly, student, kids); expiry is calculated automatically and a payment record is created in the same step; memberships can be cancelled
- **Check-in / check-out** — front-desk attendance tracking that only allows check-in for members with an active, unexpired membership
- **Register** — tracks how many days each member actually attended within their current membership period, with an expandable day-by-day log
- **Shop** — point-of-sale for gym products (drinks, supplements, apparel & accessories), with per-branch stock tracking, cart checkout, and restocking
- **Revenue** — combined view of membership payments and shop sales, broken down by branch and payment method
- **Branches** — read-only view of each location's services and pricing

## Branch pricing

| Tier | Kahawa Sukari / Membley / Ruiru Kihunguro | Kenyatta Road |
|---|---|---|
| Daily | KSh 450 | KSh 450 |
| Weekly | KSh 1,900 | KSh 1,900 |
| Bi-weekly (2 wks) | KSh 2,500 | KSh 2,500 |
| Monthly | KSh 4,500 | KSh 4,000 |
| Quarterly (3 mo) | KSh 12,500 | KSh 10,500 |
| Yearly | KSh 45,000 | KSh 40,000 |
| Student (monthly, w/ valid Student ID) | KSh 3,500 flat, all branches | |
| Kids (daily, w/ birth certificate) | KSh 450 flat, all branches | |

## Tech stack

- **Frontend:** Next.js (App Router, JavaScript), Tailwind CSS
- **Backend:** Next.js API routes, Mongoose
- **Database:** MongoDB Atlas
- **Auth:** JWT (jsonwebtoken) + bcryptjs, httpOnly cookies
- **Hosting:** Vercel

## Project structure

```
src/
  app/
    (app)/              # authenticated routes — shared sidebar layout
      layout.js
      dashboard/
      members/
      check-in/
      memberships/
      register/
      shop/
      revenue/
      branches/
    api/                 # all backend routes
      auth/
      members/
      memberships/
      attendance/
      products/
      sales/
    login/
    page.js              # redirects to /login or /dashboard
  components/
    Logo.js
    Sidebar.js
  lib/
    dbConnect.js         # MongoDB connection helper
    auth.js              # JWT sign/verify
    requireAuth.js        # auth guard used in API routes
  models/
    Branch.js
    MembershipPlan.js
    User.js
    Member.js
    Membership.js
    Payment.js
    Attendance.js
    Product.js
    Sale.js
```

## Running locally

1. Clone the repo and install dependencies:
   ```
   git clone https://github.com/maureenmuchoki-hub/natty-gym-system.git
   cd natty-gym-system
   npm install
   ```

2. Create a `.env.local` file in the project root:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_random_secret_string
   ```

3. Run the dev server:
   ```
   npm run dev
   ```

4. Visit `http://localhost:3000`

## Deployment

Deployed on [Vercel](https://vercel.com), connected directly to this GitHub repo — every push to `main` triggers a new deployment automatically. Environment variables (`MONGODB_URI`, `JWT_SECRET`) are set in the Vercel project settings, not committed to the repo.

---
Developed by NMaureen Muchoki who previously worked for Natty Gym.