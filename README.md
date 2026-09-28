# Feedants — Competition Details Screen (Full Stack)

A functional implementation of the Competition Details screen: React Native (Expo SDK 57 +
Expo Router, TypeScript), Node.js/Express, MongoDB. Everything on screen — prize pool, dates,
spots, winners, rewards, referral link, policy/video links — is served from the database
through the API; nothing is hardcoded in the app.

## Project structure

```
feedants-competition/
  backend/    Express + MongoDB API (controllers, models, routes, seed)
  frontend/   Expo app (src/app = routes, src/components, src/hooks, src/api)
```

## Running the backend

```bash
cd backend
cp .env.example .env      # fill in MONGO_URI and JWT_SECRET
npm install
npm run seed              # creates one sample competition matching the design
npm run dev               # http://localhost:5000  (health check: /health)
```

| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string, **including the database name** (e.g. `.../feedants?...`) |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |

`.env` files are git-ignored. Never commit real credentials; only the `.env.example`
placeholders are tracked.

## Running the frontend

```bash
cd frontend
cp .env.example .env      # set EXPO_PUBLIC_API_BASE_URL to your backend URL
npm install
npx expo start            # scan the QR code with Expo Go
```

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Backend base URL including `/api`, e.g. `http://192.168.1.23:5000/api` |

`EXPO_PUBLIC_API_BASE_URL` is read in `src/api/client.ts`. On a physical phone use your
computer's LAN IP (not `localhost`), and restart `expo start` after editing `.env` (values are
inlined at bundler start, not hot-reloaded).

### Routes (Expo Router, `frontend/src/app`)

| File | Route | Purpose |
|---|---|---|
| `_layout.tsx` | — | Root stack layout |
| `index.tsx` | `/` | Loads `GET /api/competitions` (with retry) and redirects to the first competition |
| `competition/[id].tsx` | `/competition/:id` | The Competition Details screen |
| `login.tsx` | `/login` | Login / sign-up with client + server validation |
| `results/[id].tsx` | `/results/:id` | Placeholder results screen |

## API overview

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account (validates name, email format, password ≥ 8 chars) |
| POST | `/api/auth/login` | — | Get JWT |
| GET | `/api/competitions` | optional | List competitions |
| GET | `/api/competitions/:id` | optional | Full details + computed state for the current user |
| POST | `/api/competitions/:id/register` | required | Reserve a spot (atomic) |
| POST | `/api/competitions/:id/submit` | required | Upload entry (registered users, submission window only) |

## Key design decisions

**State is derived, never stored.** The competition document never stores an "isOpen" or
"status" flag. Whether registration is open, closed, in the submission window, being judged,
or has results is computed on every request from the current server time vs. the stored
dates and the spots counter (`derivePhase` in `competitionController.js`). This avoids a
background job having to flip status fields at exact timestamps, and eliminates any chance of
the UI and the "truth" drifting apart.

**Concurrency-safe spot booking.** With a limited number of spots and many users hitting
"Register" near a deadline, two people can't be allowed to grab the last spot simultaneously.
This is handled with a single atomic MongoDB operation:

```js
Competition.findOneAndUpdate(
  { _id, bookedSpots: { $lt: totalSpots }, "dates.registerBefore": { $gt: now } },
  { $inc: { bookedSpots: 1 } }
)
```

Because MongoDB executes the condition-check-and-write as one atomic operation per document,
two simultaneous requests can never both succeed once spots are exhausted — no distributed
lock or transaction needed for this part. A unique compound index on
`(competition, user)` in the `Registration` collection independently prevents the same user
from double-booking (e.g. a retried request), with a rollback of the spot counter if that
insert fails after the counter was already incremented.

**Server clock is the source of truth for time.** The countdown timer's target date comes
from the backend, and the app anchors its local ticking clock to a `serverTime` timestamp
returned with every request, so a skewed device clock doesn't show a wrong countdown.

**The bottom CTA button's label/action come from the backend** (`cta: { label, action,
enabled }`), not from business rules duplicated in the frontend. This keeps "what should the
user see and be able to do right now" in one place instead of two implementations that can
drift.

**Validation on both sides.** Login/sign-up rules (name length, email format, password
length) are checked in the app for instant feedback and re-checked in the backend
(`authController.js`, plus an email `match` on the `User` schema). The backend is the source
of truth; the frontend check is a convenience.

**Per-user referral link.** The API returns `referral.link` (base URL + the viewer's user id)
along with `rewardPerSignup`, so the "Refer & Earn" card, "Copy Link" and the share sheet all
use server-provided data.

**Screen refreshes on focus.** Returning to the details screen (e.g. after logging in)
silently re-fetches, so the "Registered" state and CTA update without a manual pull-to-refresh.

## Assumptions

- **Auth is minimal.** Email/password + JWT — enough to have a real per-user "am I
  registered" state, not a production identity system (no OTP, social login, password reset).
- **Payment is not integrated.** `entryFee` is displayed and "Secure payments powered by
  Razorpay" is shown as in the design, but registration only reserves a spot. Razorpay
  checkout would sit in front of `POST /register` in production.
- **Submission upload is stubbed.** "Upload Submission" sends a placeholder media URL to
  `POST /submit`. The backend rules (registered users only, inside the submission window, one
  entry per user) are real; the media picker and cloud-storage upload are not.
- **One registration and one submission per user per competition**, matching the single
  "Upload Submission" state shown in the design.
- **Spots copy is generated, not stored.** "Only 19 spots left" and "1 / 20 Booked" are
  computed from `totalSpots` / `spotsLeft`, so they can't go stale.
- **Out of scope for this module:** the ENG/हिंदी language toggle, the "Ad Here" slot, the
  bottom tab bar, the results screen and the "Hear From Our Users" page.

## Trade-offs / what I'd change for production

- **Booking counter vs. counting registrations:** `bookedSpots` is a maintained counter for
  fast reads, with `Registration` documents as the source of truth for *who*. At scale these
  two could theoretically drift if a crash happens between steps; I'd add a periodic
  reconciliation job (`bookedSpots = count(Registration where status=registered)`) as a
  safety net, or compute spots-left live from the Registration count once traffic patterns
  justify the extra read cost.
- **Caching:** `GET /competitions/:id` is a hot read. I'd add a short-TTL cache (Redis) for
  the competition's static fields, computing only the per-user bits (registration/submission
  state) on each request, to keep this cheap under high concurrent read load.
- **Idempotency keys** on the register/submit endpoints would make client retries fully safe
  beyond what the unique index already provides.
- **Notifications:** a real product would push/email users as phases change (registration
  closing soon, submissions open, results out) — not built here.
- **File uploads:** direct-to-cloud-storage uploads (presigned URLs) with type/virus scanning
  rather than accepting an arbitrary `mediaUrl`.
- **Auth hardening:** refresh tokens, secure token storage, login rate limiting and account
  lockout.
- **Testing:** I'd write unit/integration tests first for the two critical pieces —
  `derivePhase` (a phase-transition table test) and `registerForCompetition` (a load test
  firing many simultaneous requests at the last spot to prove no overbooking).
- **Home route:** `src/app/index.tsx` currently redirects to the first competition returned by
  the API; a production app would render a real competitions list/home screen there.