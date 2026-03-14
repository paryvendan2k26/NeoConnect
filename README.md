<p align="center">
  <img src="https://raw.githubusercontent.com/YOUR_USERNAME/neoconnect/main/banner.png" alt="NeoConnect Banner" width="100%" />
</p>

<p align="center">
  <a href="https://neo-connect-two.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://neoconnect-sxfd.onrender.com/api/health" target="_blank">
    <img src="https://img.shields.io/badge/API%20Server-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="API Server" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <a href="#introduction">Introduction</a> &nbsp;•&nbsp;
  <a href="#features">Features</a> &nbsp;•&nbsp;
  <a href="#architecture">Architecture</a> &nbsp;•&nbsp;
  <a href="#tech-stack">Tech Stack</a> &nbsp;•&nbsp;
  <a href="#installation">Installation</a> &nbsp;•&nbsp;
  <a href="#deployment">Deployment</a> &nbsp;•&nbsp;
  <a href="#roles">Roles</a> &nbsp;•&nbsp;
  <a href="#api">API Reference</a>
</p>

---

## Introduction

**NeoConnect** is a full-stack internal platform built to give corporate staff a structured, accountable channel to raise feedback, complaints, and safety concerns. It replaces untracked email chains with a transparent case management system that enforces role-based access, auto-generates tracking IDs, escalates unresolved cases automatically, and publishes outcomes to a public impact hub.

Built as a complete production-ready application in a 4-hour hackathon window, following a compressed Software Development Life Cycle — from requirements and schema design through to a live deployment on Vercel and Render.

---

## Live Deployment

| Service | URL | Platform |
|---|---|---|
| Frontend Application | [neo-connect-two.vercel.app](https://neo-connect-two.vercel.app) | Vercel |
| Backend API | [neoconnect-sxfd.onrender.com/api](https://neoconnect-sxfd.onrender.com/api) | Render |
| Database | MongoDB Atlas M0 Free Cluster | MongoDB Atlas |

> The backend runs on Render's free tier and may take up to 30 seconds to respond after a period of inactivity. The first request wakes the server — subsequent requests are instant.

---

## Demo Accounts

All accounts use the password `password123`.

| Role | Email | Access Level |
|---|---|---|
| Administrator | admin@neo.com | Full system access, user management |
| Secretariat | jane@neo.com | Case inbox, assign to CM, analytics, hub management |
| Case Manager | mark@neo.com | Assigned cases, notes, status updates, impact fields |
| Case Manager | lisa@neo.com | Assigned cases, notes, status updates, impact fields |
| Staff | alice@neo.com | Submit cases, vote on polls, view hub |
| Staff | bob@neo.com | Submit cases, vote on polls, view hub |

---

## Features

### Case Management
- Auto-generated tracking IDs in `NEO-YYYY-NNN` format via Mongoose pre-save hook
- Anonymous submission — submitter identity stored server-side but never exposed to non-admin roles
- File attachments — up to 5 files, 10MB each (photos, PDFs)
- Full case lifecycle: `New` → `Assigned` → `In Progress` → `Pending` → `Resolved` / `Escalated`
- Notes system with internal (staff-hidden) and external note types
- Impact and resolution fields: Impact Summary, Action Taken, What Changed

### Escalation Engine
- Automated `node-cron` job runs daily at 08:00
- Calculates working days (Monday–Friday) since last response or assignment
- Cases with no response for 7 or more working days are automatically set to `Escalated`
- Escalation clock resets on every note addition or status change

### Role-Based Access Control
- Four distinct roles enforced at both API middleware and UI render level
- Secretariat: manages inbox, assigns cases, never submits or gets assigned
- Case Manager: works only on their assigned cases, locked out after resolution
- Staff: submits cases and votes on polls, no access to management views
- Admin: full system access including user management

### Polls
- Staff vote once per poll — enforced server-side
- Results persist across page refresh (derived from server data, not component state)
- Secretariat always sees results without voting
- Secretariat and Admin can create, close, and reopen polls

### Public Hub
- Quarterly digest publishing
- Meeting minutes archive with PDF upload and tag-based search
- Impact feed — resolved cases auto-publish when a Case Manager marks status as Resolved
- Visible to all authenticated users

### Analytics Dashboard
- Cases by status — bar chart with colour-coded status segments
- Cases by category — pie chart breakdown
- Open cases by department — horizontal bar chart highlighting heaviest load
- Hotspot alerts — department and category combinations with 5+ open cases

---

## Architecture

```
neoconnect/
├── client/                    # Next.js 16 frontend (App Router)
│   ├── app/
│   │   ├── (auth)/            # Login, Register — no sidebar, no auth guard
│   │   │   ├── login/
│   │   │   └── register/
│   │   └── (dashboard)/       # Auth-guarded, role-aware sidebar layout
│   │       ├── dashboard/     # Role-aware home with stats
│   │       ├── cases/         # Full inbox (secretariat/admin)
│   │       │   ├── [id]/      # Case detail — notes, assign, status, impact
│   │       │   ├── my-cases/  # CM's assigned cases view
│   │       │   └── new/       # Case submission form
│   │       ├── polls/         # Voting and results
│   │       ├── hub/           # Digests, impact feed, minutes
│   │       ├── analytics/     # Charts and hotspot detection
│   │       └── admin/         # User management (admin only)
│   ├── components/
│   │   ├── Sidebar.tsx        # Role-filtered navigation
│   │   ├── StatusBadge.tsx    # Status and severity tag components
│   │   └── ui/                # Button, Card, Input, Badge, Select, Switch, Alert
│   └── lib/
│       ├── api.ts             # Axios instance with JWT interceptors
│       ├── auth-context.tsx   # Login, register, logout, session rehydration
│       └── utils.ts           # Tailwind merge utility
│
└── server/                    # Express.js backend
    ├── src/
    │   ├── index.js           # Entry point — DB connect, middleware, cron init
    │   ├── models/
    │   │   ├── User.js        # bcrypt password, role enum, isActive flag
    │   │   ├── Case.js        # Tracking ID hook, notes subdocument, lifecycle fields
    │   │   ├── Poll.js        # Options with vote arrays
    │   │   └── Hub.js         # Minute and Digest schemas
    │   ├── routes/
    │   │   ├── auth.js        # Register, login, me
    │   │   ├── cases.js       # Full CRUD, assign, update, analytics aggregation
    │   │   ├── polls.js       # Create, vote, toggle
    │   │   ├── hub.js         # Digests, impact feed, minutes upload
    │   │   └── users.js       # User management (admin)
    │   ├── middleware/
    │   │   └── auth.js        # JWT verify + requireRole() factory
    │   └── utils/
    │       └── escalation.js  # node-cron working-day escalation job
    └── seed.js                # Demo data — 6 accounts, 6 cases, polls, digest
```

**Communication pattern:** The Next.js client communicates exclusively with the Express API over HTTP using JWT Bearer tokens. An Axios request interceptor injects the token automatically. A response interceptor clears the session and redirects to `/login` on any 401 response.

---

## Tech Stack

### Frontend

| Package | Version | Purpose |
|---|---|---|
| Next.js | 16.1.6 | App Router, SSR, static generation |
| React | 19.2.x | UI rendering, hooks, context |
| TypeScript | 5.x | Static typing |
| Tailwind CSS | 4.x | Utility-first styling |
| Axios | 1.13.x | HTTP client with interceptors |
| Recharts | 3.8.x | Bar and pie charts for analytics |
| Lucide React | 0.577.x | Icon library |
| class-variance-authority | 0.7.x | Type-safe button/component variants |

### Backend

| Package | Version | Purpose |
|---|---|---|
| Express | 4.19.x | HTTP server and routing |
| Mongoose | 8.4.x | MongoDB ODM, schema hooks, aggregations |
| jsonwebtoken | 9.0.x | JWT signing and verification |
| bcryptjs | 2.4.x | Password hashing (10 salt rounds) |
| multer | 1.4.x-lts | Multipart file upload to disk |
| node-cron | 3.0.x | Scheduled escalation job |
| cors | 2.8.x | Cross-origin resource sharing |
| dotenv | 16.4.x | Environment variable loading |

---

## Installation

### Prerequisites
- Node.js 18 or later
- MongoDB running locally on port 27017, or a MongoDB Atlas connection string
- npm 9 or later

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/neoconnect.git
cd neoconnect
```

### 2. Configure and start the backend

```bash
cd server
cp .env.example .env
```

Edit `.env` and set the required values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neoconnect
JWT_SECRET=your-secret-key-minimum-32-characters-long
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

```bash
npm install
npm run dev
```

The server starts on `http://localhost:5000`. You will see `MongoDB connected` and `[Cron] Escalation job scheduled` in the terminal.

### 3. Seed demo data

In a separate terminal, with the server running:

```bash
cd server
node seed.js
```

This creates 6 demo accounts, 6 cases across all status types, a poll with votes, and a published quarterly digest.

### 4. Configure and start the frontend

```bash
cd client
cp .env.local.example .env.local
```

Set the API URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm install
npm run dev
```

The frontend starts on `http://localhost:3000`. Open it in your browser and log in with any of the demo accounts.

---

## Deployment

### Step 1 — Deploy frontend to Vercel

1. Push the repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Set the **Root Directory** to `client`
4. Add environment variable: `NEXT_PUBLIC_API_URL` = `http://placeholder.com/api` (update after backend is live)
5. Deploy — note the Vercel URL provided (e.g. `https://neoconnect.vercel.app`)

### Step 2 — Deploy backend to Render

1. Go to [render.com](https://render.com) and create a new **Web Service**
2. Connect the same GitHub repository
3. Set **Root Directory** to `server`, **Build Command** to `npm install`, **Start Command** to `node src/index.js`
4. Add the following environment variables:

```
PORT              = 5000
MONGODB_URI       = mongodb+srv://user:password@cluster.mongodb.net/neoconnect
JWT_SECRET        = your-long-random-secret-key
NODE_ENV          = production
CLIENT_URL        = https://your-vercel-app.vercel.app
```

5. Deploy — note the Render URL (e.g. `https://neoconnect-api.onrender.com`)

### Step 3 — Connect frontend to backend

1. Go to Vercel → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` to `https://neoconnect-api.onrender.com/api`
3. Go to Deployments → Redeploy the latest deployment

### Step 4 — Seed the production database

```bash
cd server
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/neoconnect node seed.js
```

---

## Roles and Permissions

| Action | Staff | Case Manager | Secretariat | Admin |
|---|:---:|:---:|:---:|:---:|
| Submit a case | Yes | No | No | Yes |
| Submit anonymously | Yes | No | No | Yes |
| View own submitted cases | Yes | Yes | Yes | Yes |
| Vote on polls | Yes | Yes | No | Yes |
| View Public Hub | Yes | Yes | Yes | Yes |
| View all cases (inbox) | No | No | Yes | Yes |
| Assign cases to Case Managers | No | No | Yes | Yes |
| View own assigned cases | No | Yes | No | Yes |
| Update case status | No | Yes | No | Yes |
| Add notes to cases | No | Yes | No | Yes |
| Fill impact and resolution fields | No | Yes | No | Yes |
| Edit after case is resolved | No | No | No | Yes |
| View poll results without voting | No | No | Yes | Yes |
| Create and toggle polls | No | No | Yes | Yes |
| Upload meeting minutes | No | No | Yes | Yes |
| Create quarterly digests | No | No | Yes | Yes |
| View analytics dashboard | No | No | Yes | Yes |
| Manage user roles and status | No | No | No | Yes |
| Delete user accounts | No | No | No | Yes |

---

## API Reference

All routes are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Authentication — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account. Body: `{ name, email, password, department, role }` |
| POST | `/auth/login` | Public | Authenticate. Returns `{ token, user }` |
| GET | `/auth/me` | Bearer | Returns the authenticated user object |

### Cases — `/api/cases`

| Method | Path | Required Role | Description |
|---|---|---|---|
| POST | `/cases` | Staff, Admin | Submit new case. Accepts `multipart/form-data` with optional attachments |
| GET | `/cases` | Secretariat, Admin | All cases with optional filters: `?status=&category=&severity=` |
| GET | `/cases/my-cases` | Case Manager+ | Cases assigned to the authenticated user |
| GET | `/cases/submitted` | Any auth | Cases submitted by the authenticated user |
| GET | `/cases/:id` | Role-checked | Single case. Staff may only access their own submissions |
| PATCH | `/cases/:id/assign` | Secretariat, Admin | Assign case. Body: `{ assignedTo: userId }` |
| PATCH | `/cases/:id/update` | Case Manager, Admin | Update status, add note, set impact fields |
| GET | `/cases/analytics/summary` | Secretariat, Admin | Aggregated stats: by status, category, department, hotspots |

### Polls — `/api/polls`

| Method | Path | Required Role | Description |
|---|---|---|---|
| GET | `/polls` | Any auth | All polls |
| POST | `/polls` | Secretariat, Admin | Create poll. Body: `{ question, options: [{ text }], endsAt? }` |
| POST | `/polls/:id/vote` | Any auth | Vote. Body: `{ optionIndex }`. One vote per user enforced server-side |
| PATCH | `/polls/:id/toggle` | Secretariat, Admin | Toggle `isActive` between true and false |

### Hub — `/api/hub`

| Method | Path | Required Role | Description |
|---|---|---|---|
| GET | `/hub/digests` | Any auth | Published quarterly digests |
| POST | `/hub/digests` | Secretariat, Admin | Create digest |
| GET | `/hub/impact` | Any auth | Resolved public cases with impact fields |
| GET | `/hub/minutes` | Any auth | Meeting minutes. Supports `?search=` query |
| POST | `/hub/minutes` | Secretariat, Admin | Upload meeting minutes PDF |

### Users — `/api/users`

| Method | Path | Required Role | Description |
|---|---|---|---|
| GET | `/users` | Secretariat, Admin | All users |
| GET | `/users/case-managers` | Secretariat, Admin | Active Case Managers only — used for assignment dropdown |
| PATCH | `/users/:id` | Admin | Update role or `isActive` status |
| DELETE | `/users/:id` | Admin | Permanently delete a user account |

---

## Environment Variables

### Backend — `server/.env`

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP server port. Default: `5000` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing. Minimum 32 characters |
| `NODE_ENV` | No | Set to `production` when deployed |
| `CLIENT_URL` | Yes | Frontend origin for CORS. No trailing slash |

### Frontend — `client/.env.local`

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the Express API including `/api` suffix |

---

## Scripts

### Backend

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon — auto-restart on file changes |
| `npm start` | Start without nodemon — for production |
| `node seed.js` | Seed the database with demo accounts and sample data |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build optimised production bundle |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint across the codebase |

---

## Data Models

### Case

The core entity. Includes embedded notes, file attachment metadata, and resolution fields.

```
trackingId      String        Auto-generated: NEO-YYYY-NNN
title           String        Required
description     String        Required
category        Enum          Safety | Policy | Facilities | HR | Other
department      String        Required
location        String        Optional
severity        Enum          Low | Medium | High
status          Enum          New | Assigned | In Progress | Pending | Resolved | Escalated
isAnonymous     Boolean       Hides submitter in all non-admin responses
submittedBy     ObjectId      Always stored — never exposed when isAnonymous
assignedTo      ObjectId      Set by secretariat on assignment
assignedAt      Date          Escalation clock start point
lastResponseAt  Date          Reset on note add or status change
resolvedAt      Date          Auto-set when status transitions to Resolved
isPublic        Boolean       Auto-set to true on Resolved — feeds Public Hub
impactSummary   String        CM fills on resolution
actionTaken     String        CM fills on resolution
whatChanged     String        CM fills on resolution
attachments     Array         filename, originalName, mimetype
notes           Array         author, text, isInternal, addedAt
```

---

## Escalation Logic

The escalation engine runs via `node-cron` every day at 08:00:

1. Queries all cases with status `Assigned`, `In Progress`, or `Pending` that have an `assignedAt` date
2. For each case, the reference date is `lastResponseAt` if set, otherwise `assignedAt`
3. Counts working days (Monday–Friday) between the reference date and the current time
4. If working days is 7 or more, sets `status` to `Escalated` and saves the case
5. The clock resets whenever a note is added or a status update is made via `PATCH /cases/:id/update`

---

## License

This project is licensed under the MIT License.

---

<p align="center">
  Built with Next.js, Express.js, and MongoDB Atlas
</p>
