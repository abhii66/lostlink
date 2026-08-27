# LostLink

Secure digital lost-and-found system for campus. MERN stack, JWT (httpOnly cookie) auth, weighted matching algorithm, private-question claim verification.

## Structure

```
backend/   Express API (ES modules, MongoDB/Mongoose, JWT cookie auth, Cloudinary uploads)
frontend/  React + Vite + Tailwind v4 + Zustand + React Router
```

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, Cloudinary keys (optional)
npm install
npm run dev             # http://localhost:5000
```

Cloudinary keys are optional — item image upload is skipped gracefully if unset (multer route still works, `req.file` will just be undefined if storage isn't configured; for a demo without Cloudinary, remove `upload.single("image")` from `item.routes.js` or leave the fields blank).

### 2. Frontend

```bash
cd frontend
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev              # http://localhost:5173
```

## Core flow implemented

Report → Match → Claim → Verify → Handover → Resolve

1. **Report** — `/report/lost` or `/report/found`. Found items require a private verification question + answer (answer is bcrypt-hashed, never returned to clients).
2. **Match** — on every new item, the backend runs a weighted comparison (`utils/matching.js`) against open items of the opposite type:
   - Category 25%, Description (keyword overlap) 35%, Location 25%, Time proximity 15%.
   - Matches ≥ 70% are persisted and shown with human-readable reasons ("Same category", "Reported close in time", etc).
3. **Claim** — a non-owner can hit "Claim Item" on a FOUND item and answer the finder's question.
4. **Verify** — the finder sees all claims on `/finder/claims/:itemId`, including a soft auto-check (`likelyCorrect`) against the stored hash, and manually Verifies or Rejects.
5. **Handover / Resolve** — once verified, the finder clicks "Mark as Returned"; the item status becomes `RETURNED` and further claims are blocked.

## Item status lifecycle

```
OPEN → MATCH_FOUND → CLAIM_PENDING → VERIFIED → RETURNED
```

A rejected claim reopens the item (back to `MATCH_FOUND`) rather than marking it returned.

## Demo script (matches the hackathon prompt)

1. User A reports a lost black backpack (Library, 2:00 PM).
2. User B reports a found black backpack (Library, 2:20 PM) with question "What logo is on the backpack?" / answer "Nike".
3. Open either item's detail page → see "Potential Match — 92%" with reasons.
4. As User A, click **Claim Item**, answer "Nike".
5. As User B, go to Dashboard → Pending Claims → **Verify**.
6. Click **Mark as Returned** → done.

## What's intentionally out of scope (per hackathon brief)

AI image recognition, ML models, social feed features, admin dashboards, mobile apps, real-time notifications (Socket.IO can be layered on later if time allows).
