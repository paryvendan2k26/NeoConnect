# NeoConnect — Staff Feedback & Case Management Platform

A full-stack platform for transparent staff feedback, complaint tracking, polls, and a public impact hub.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS |
| Backend | Node.js · Express.js |
| Database | MongoDB · Mongoose |
| Auth | JWT (7-day expiry, localStorage) |
| Escalation | node-cron (daily 8am, 7 working-day rule) |
| File uploads | multer |

---

## Getting Started

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)

### 2. Backend setup

```bash
cd server
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

The server starts on **http://localhost:5000**

### 3. Seed demo data

```bash
cd server
node seed.js
```

This creates 6 demo accounts (all password: `password123`):

| Email | Role |
|---|---|
| admin@neo.com | Admin |
| jane@neo.com | Secretariat |
| mark@neo.com | Case Manager |
| lisa@neo.com | Case Manager |
| alice@neo.com | Staff |
| bob@neo.com | Staff |

### 4. Frontend setup

```bash
cd client
cp .env.local.example .env.local
npm install
npm run dev
```

The app starts on **http://localhost:3000**

---

## Features by Role

### Staff
- Submit cases (with optional anonymity + file attachments)
- Track case status via tracking ID
- Vote on polls
- View Public Hub (digests, meeting minutes, resolved impact)

### Case Manager
- View assigned cases
- Add notes (internal or visible)
- Update status
- Fill resolution impact fields

### Secretariat
- Full case inbox with filters
- Assign cases to case managers
- Create/manage polls
- Upload meeting minutes
- Publish digests

### Admin
- All secretariat permissions
- User management (role changes, activate/deactivate)

---

## API Overview

| Group | Base Path |
|---|---|
| Auth | `/api/auth` |
| Cases | `/api/cases` |
| Polls | `/api/polls` |
| Hub (digests, minutes, impact) | `/api/hub` |
| Users | `/api/users` |

---

## Escalation Logic

A `node-cron` job runs daily at **8:00 AM**. Any case that:
- Is NOT resolved
- Has had no response for **7+ working days** (weekends excluded)

…is automatically set to `Escalated` status.

The clock resets whenever a note is added or status is updated (via `lastResponseAt`).
