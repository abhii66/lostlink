# LostLink — Campus Lost & Found Platform

## Documentation

---

## 1. Project Objective / Problem Statement

College and university campuses see a constant churn of lost and found items — water bottles, ID cards, bags, keys, electronics — that change hands informally through WhatsApp groups, notice boards, or word of mouth. This process is unstructured and unreliable:

- **No central record.** A found item and its lost counterpart are rarely reported to the same place, so matches happen by chance.
- **No way to verify ownership.** Even when a found item is announced, anyone can falsely claim it, since there is no mechanism to confirm the claimant is the true owner.
- **No visibility into status.** A student who loses an item has no way to track whether it has been found, claimed by someone else, or already returned.
- **Manual, slow matching.** Comparing a "lost" report against a "found" report by hand — checking category, description, location, and time — does not scale beyond a handful of items.

**Problem Statement:** Build a web application that lets students and staff report lost and found items, automatically surfaces likely matches between them, and provides a secure, question-based verification step before an item is handed back — replacing an ad-hoc, trust-based process with a structured, auditable one.

---

## 2. Proposed Solution

**LostLink** is a full-stack web application that acts as a digital lost-and-found desk for a campus:

1. A user who **loses** an item files a *Lost Report* describing it (category, description, location, date/time, optional photo).
2. A user who **finds** an item files a *Found Report* with the same details, plus a **private verification question** (e.g., "What sticker is on the laptop lid?") whose answer only the true owner would know.
3. On every new report, the system automatically runs a **weighted matching algorithm** against all open items of the opposite type and surfaces any strong matches to both parties.
4. If a claimant believes a found item is theirs, they submit an answer to the finder's verification question through a **Claim**.
5. The finder reviews the claim (the system also gives them a hint on whether the answer looks correct, without ever exposing the stored answer), then **Verifies** or **Rejects** it.
6. Once verified, the finder shares a **pickup location**, and the item is marked as **Returned** after hand-off — closing the loop.

This turns a chain of informal, unverifiable messages into a tracked workflow: **Report → Match → Claim → Verify → Return**.

---

## 3. Key Features

- **Authentication** — Email/password signup and login with JWT sessions stored in an HTTP-only cookie.
- **Report Lost / Found Items** — A single guided form (`ReportItem`) branches based on type; found items additionally require a private verification question and answer, and an optional photo upload.
- **Automated Match Detection** — Every new report is scored against all existing open items of the opposite type using a weighted algorithm; results above a confidence threshold are saved as `Match` records and shown on both users' dashboards with a human-readable explanation (e.g., "Same category", "Reported close in time").
- **Search & Browse** — Full-text/keyword search and filtering by type (Lost/Found), category, status, and location.
- **My Items Dashboard** — A user's own lost and found reports, grouped and status-tagged (`Open`, `Match Found`, `Claim Pending`, `Verified`, `Returned`).
- **Claim & Verification Workflow** — Claimants answer the finder's private question rather than simply asserting ownership; the finder sees an automatic correctness hint but always makes the final call.
- **Pickup Location Handoff** — Once a claim is verified, the finder supplies a location, which is then surfaced to the claimant so they know where to collect the item.
- **Status Tracking** — Every item carries a lifecycle status (`OPEN → MATCH_FOUND → CLAIM_PENDING → VERIFIED → RETURNED`) that is visible at every stage.
- **Protected Routes** — Pages that require a logged-in user redirect anonymous visitors to the login screen.
- **Image Uploads** — Optional item photos stored via Cloudinary.

---

## 4. Technologies Used

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI |
| **Vite** | Development server & build tooling |
| **React Router DOM v6** | Client-side routing & protected routes |
| **Zustand** | Lightweight global state management (auth store) |
| **Axios** | HTTP client for API communication |
| **Tailwind CSS v4** | Utility-first styling |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Database and object modeling (Users, Items, Matches, Claims) |
| **JSON Web Tokens (jsonwebtoken)** | Stateless authentication |
| **bcryptjs** | Password and verification-answer hashing |
| **cookie-parser** | Reading the HTTP-only auth cookie |
| **cors** | Cross-origin access control between frontend and backend |
| **Multer + Cloudinary (multer-storage-cloudinary)** | Image upload handling and hosting |
| **dotenv** | Environment variable configuration |

### Deployment
| Layer | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB (cloud-hosted) |

---

## 5. Implementation Details

### 5.1 Architecture

LostLink follows a classic **client–server, REST API architecture**:

```
React (Vite) frontend  ──HTTP (Axios, credentialed)──▶  Express REST API  ──Mongoose──▶  MongoDB
        │                                                       │
        └── Zustand auth store (JWT-cookie session) ◀───────────┘
```

### 5.2 Data Models

- **User** — `name`, `email`, `passwordHash`.
- **Item** — `userId` (reporter), `type` (`LOST`/`FOUND`), `name`, `category`, `description`, `location`, `date`, `time`, optional `image`, `status`, and — for `FOUND` items only — `verificationQuestion` and a hashed `verificationAnswerHash` (the plaintext answer is never stored or returned to any client). A text index on `name`, `description`, and `location` powers search.
- **Match** — `lostItemId`, `foundItemId`, a `score` (0–100), a `breakdown` of the score by category/description/location/time, an array of human-readable `matchingReasons`, and a `status` (`ACTIVE` / `DISMISSED` / `RESOLVED`). A unique compound index on the item pair prevents duplicate matches.
- **Claim** — `itemId` (the found item), the originating `matchId` (if any), `claimantId`, the claimant's `answer`, a `status` (`PENDING` / `VERIFIED` / `REJECTED`), and a `pickupLocation` set by the finder once the claim is verified.

### 5.3 Authentication Flow

Passwords are hashed with **bcryptjs** before storage. On login, the server signs a JWT containing the user's ID and sets it as an **HTTP-only cookie**, so it isn't accessible to client-side JavaScript (mitigating XSS token theft). A `protect` Express middleware verifies this cookie on every protected route and attaches `req.userId`. On the frontend, a Zustand `authStore` calls `GET /api/auth/me` on app load to silently restore the session if a valid cookie exists, and exposes `login`, `register`, `logout`, and `checkAuth` actions to the rest of the app; `ProtectedRoute` uses this store to redirect unauthenticated users to `/login`.

### 5.4 Matching Algorithm

Matching is rule-based rather than ML-based, chosen for transparency and reliability on a small dataset. Implemented in `utils/matching.js`, a candidate `LOST`/`FOUND` pair is scored out of 100 across four weighted signals:

| Signal | Weight | Method |
|---|---|---|
| Category | 25 | Exact match on category enum |
| Description | 35 | Jaccard similarity between tokenized, stop-word-filtered name + description text |
| Location | 25 | Exact match on normalized location string, or partial credit for shared significant words |
| Time proximity | 15 | Decaying score based on the hour gap between the reported lost and found timestamps |

Pairs scoring at or above `MATCH_THRESHOLD` (70) are persisted as a `Match` document with an explanation array (e.g., "Same category (Electronics)", "Reported close in time"), and both items' statuses flip from `OPEN` to `MATCH_FOUND`. Matching runs automatically and synchronously whenever a new item is reported (`runMatchingFor`), comparing the new item against every open item of the opposite type.

### 5.5 Claim & Verification Workflow

1. `POST /api/claims` — a claimant submits an `answer` for a found item; the item's status moves to `CLAIM_PENDING`. A user cannot claim their own reported item.
2. `GET /api/claims/for-item/:itemId` — the finder views all claims on their item. The server independently re-checks each submitted answer against the stored hash and attaches a `likelyCorrect` hint — but never reveals the hash or the true answer — leaving the final decision to the finder.
3. `PATCH /api/claims/:id/verify` — the finder verifies a claim and supplies a required `pickupLocation`; the item status becomes `VERIFIED`, and any other pending claims on the same item are auto-rejected.
4. `PATCH /api/claims/:id/reject` — the finder rejects a claim; if no other claims are pending, the item reverts to `MATCH_FOUND`.
5. `GET /api/claims/mine/:itemId` — lets the claimant check their own claim's status and retrieve the pickup location once verified.
6. `PATCH /api/claims/:id/return` — after hand-off, the finder marks the item `RETURNED`, and all related matches are marked `RESOLVED`.

### 5.6 Frontend Structure

- **Pages** — `Login`, `Signup`, `Dashboard` (matches, pending claims, recent items), `ReportItem` (lost/found form), `SearchBrowse` (filters), `ItemDetails` (single item + its matches + claim/manage actions), `ClaimVerification` (answer the finder's question), `FinderClaims` (review claims on an item), `MyItems`.
- **Components** — `Navbar`, `ItemCard` (list/grid item preview), `StatusBadge` (color-coded lifecycle status), `ProtectedRoute`.
- **State** — a single Zustand `authStore` for session state; per-page local state (`useState`/`useEffect`) for data fetched via the shared `axios` instance, which is configured with `withCredentials: true` so the auth cookie is sent on every request.

---

## 6. Future Scope

- **Real-time notifications** (email or push) when a new match is found or a claim status changes, instead of requiring users to check the dashboard.
- **Chat between claimant and finder** for coordinating hand-off logistics beyond a single location string.
- **Multi-question / multi-factor verification** for higher-value items, rather than a single Q&A pair.
- **Admin/moderator role** for campus lost-and-found offices to oversee disputed claims or flagged reports.
- **Geolocation-based location matching** (map pins, campus building selector) instead of free-text location comparison.
- **Improved matching** using embeddings or a lightweight ML model for description similarity instead of Jaccard similarity on tokens, to catch paraphrased descriptions.
- **Mobile app** (React Native) or PWA support for on-the-go reporting.
- **Analytics dashboard** for campus administration (recovery rates, common lost categories, hotspot locations).
- **QR-code claim tickets** generated on verification, to be physically shown at pickup.

---

## 7. References / Bibliography

1. React Documentation — https://react.dev
2. Vite Documentation — https://vitejs.dev
3. React Router Documentation — https://reactrouter.com
4. Zustand Documentation — https://zustand-demo.pmnd.rs
5. Tailwind CSS Documentation — https://tailwindcss.com/docs
6. Express.js Documentation — https://expressjs.com
7. Mongoose Documentation — https://mongoosejs.com/docs
8. MongoDB Documentation — https://www.mongodb.com/docs
9. JSON Web Tokens — https://jwt.io/introduction
10. bcrypt.js — https://github.com/dcodeIO/bcrypt.js
11. Cloudinary Documentation — https://cloudinary.com/documentation
12. Jaccard Index (similarity measure) — https://en.wikipedia.org/wiki/Jaccard_index
13. Vercel Deployment Documentation — https://vercel.com/docs
14. Render Deployment Documentation — https://render.com/docs

---

*Document prepared for the LostLink project*
