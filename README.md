# 💺 The Empty Seat

A MERN web app where people post spare tickets/seats (movies, concerts, sports, bus, train, flight, college events) and others request to join. Owners accept or reject, accepted requests become bookings, and users rate each other afterwards.

## Tech stack
React 18 + Vite · Express · MongoDB + Mongoose · JWT + bcryptjs · express-validator · multer · helmet · cors · rate-limit · recharts · lucide-react

## Requirements
Node.js 18+, MongoDB (local Community Server **or** free MongoDB Atlas).

## Setup (step by step)

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run seed                # creates demo users + listings
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

Open **http://localhost:5173**. Health check: http://localhost:5000/api/health

### MongoDB
- **Local:** start the service (`mongosh` should connect). Default `MONGO_URI=mongodb://127.0.0.1:27017/the-empty-seat`.
- **Atlas:** create a free cluster, add your IP under Network Access, copy the connection string into `MONGO_URI` in `backend/.env`.

### .env (backend)
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/the-empty-seat
JWT_SECRET=use_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
Frontend `.env`: `VITE_API_URL=http://localhost:5000/api`

## Demo accounts (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@emptyseat.com | Admin@123 |
| User | alex@example.com (has pending requests to accept) | User@123 |
| User | priya / karthik / divya / rahul / sneha @example.com | User@123 |

## Demo script
1. Log in as **alex** → Dashboard → *Received* → Accept Priya's request (seat reserved; Karthik auto-rejected).
2. Log in as **priya** → Notifications → see "request accepted"; Bookings shows Alex's contact.
3. As alex: *My Listings* → **Mark completed** → both users can **Leave a review**.
4. Log in as **admin** → Overview charts, Users (suspend), Listings (verify/remove), Reports.

## Database design
- **User** 1─N **Listing** (`owner`)
- **Listing** 1─N **JoinRequest** (unique `listing + requester`); JoinRequest stores `owner` too for fast lookups
- **User** 1─N **Notification** (refs listing/request)
- **Review**: reviewer, reviewedUser, listing, request (unique `reviewer + request`)
- **Report**: reporter → reportedUser and/or reportedListing
- **User.savedListings**: N↔N with Listing
"Seat owner" is not a stored role: a user owns a listing when `listing.owner === user._id`.

Listing status: `active → requested → reserved → completed` (also `cancelled`, `unavailable`, `removed`).
Request status: `pending, accepted, rejected, cancelled, completed`.

## Business rules enforced in backend
No self-requests · no duplicate requests (only a *cancelled* request can be re-sent) · only owner accepts/rejects/edits/deletes · accept is **atomic** (`findOneAndUpdate` with `availableSeats >= seats`) so no over-booking · when seats hit 0 the listing becomes *reserved* and other pending requests are auto-rejected · reviews only after completion, one per booking · suspended users blocked · passwords hashed · ticket proof private (owner/admin only) · phone/email revealed only after acceptance.

## API documentation
All responses: `{ success, data | message }`. Auth header: `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | – | name, email, phone, password |
| POST | /api/auth/login | – | email, password → `{user, token}` |
| GET | /api/auth/me | user | current user |
| GET | /api/users/profile | user | own profile + counts |
| PUT | /api/users/profile | user | multipart: name, phone, bio, location, profileImage |
| GET | /api/users/:id | – | public profile, listings, reviews |
| GET | /api/users/saved | user | saved listings |
| POST | /api/users/saved/:listingId | user | toggle save |
| GET | /api/listings | – | `q, category, location, date, minPrice, maxPrice, seatType, available, sort(newest/priceAsc/priceDesc/date), page, limit` |
| GET | /api/listings/mine | user | my listings |
| GET | /api/listings/:id | – | listing details |
| POST | /api/listings | user | multipart create (eventImage, ticketProof optional) |
| PUT | /api/listings/:id | owner | edit |
| DELETE | /api/listings/:id | owner | delete (blocked if accepted bookings exist) |
| PUT | /api/listings/:id/status | owner | `{status: unavailable/active/cancelled/completed}` |
| GET | /api/listings/:id/proof | owner/admin | private proof image |
| POST | /api/requests | user | `{listingId, message}` |
| GET | /api/requests/my · /received · /bookings | user | lists |
| PUT | /api/requests/:id/accept · /reject | owner | |
| PUT | /api/requests/:id/cancel | requester | |
| GET | /api/notifications · /count | user | list / unread count |
| PUT | /api/notifications/:id/read · /read-all | user | |
| POST | /api/reviews | user | `{requestId, rating 1-5, comment}` |
| GET | /api/reviews/user/:id | – | reviews of a user |
| POST | /api/reports | user | `{reportedUser?, reportedListing?, reason, description}` |
| GET | /api/admin/stats, /users, /listings, /requests, /reports | admin | |
| PUT | /api/admin/users/:id/suspend · /unsuspend | admin | |
| DELETE | /api/admin/listings/:id | admin | soft remove |
| PUT | /api/admin/listings/:id/verify | admin | `{status: verified/rejected}` |
| PUT | /api/admin/reports/:id | admin | `{status, adminNote}` |

### Test with curl
```bash
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"alex@example.com","password":"User@123"}'
curl http://localhost:5000/api/listings?category=movie&sort=priceAsc
```

## Folder structure
```
backend/  config/ controllers/ middleware/ models/ routes/ utils/ seed/ uploads/ server.js
frontend/ src/{components,context,pages,services,utils} App.jsx main.jsx styles.css
```

## Common errors
| Error | Fix |
|---|---|
| `MongoDB connection failed` | Start MongoDB or fix `MONGO_URI` |
| `EADDRINUSE 5000` | Change `PORT` in backend `.env` and `VITE_API_URL` in frontend `.env` |
| CORS error | `CLIENT_URL` must match the frontend URL exactly |
| Login fails after seeding | Run `npm run seed` again (it resets all data) |
| Frontend env change ignored | Restart `npm run dev` |
| Images not showing | Backend must be running; uploads are served from `/uploads/public` |

## Notes & future improvements
Payments are not processed (price is informational). "Mark completed" is allowed any time for demo purposes. Ideas: online payments, real-time chat/WebSockets, email/SMS alerts, Google login, QR ticket verification, maps, cloud image storage.
