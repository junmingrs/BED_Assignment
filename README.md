# Hawker Centre Management System (BED Assignment)

A full-stack hawker centre management system built for the Y2S1 BED Assignment. It lets customers browse stalls and menu items, place orders, and engage with stalls via ratings, complaints, and feedback — while vendors, operators, and NEA staff manage menus, promotions, rental agreements, inspections, and analytics.

## Tech Stack

- **Backend:** Node.js, Express 5
- **Database:** Microsoft SQL Server (MSSQL) via `mssql`
- **Authentication:** JWT (jsonwebtoken) with refresh tokens, role-based authorisation
- **Validation:** Joi
- **Emails:** Nodemailer (Gmail) — promotion blasts and order receipts
- **Chatbot:** Ollama (`ollama`) for customer AI chat
- **Real-time:** WebSocket (`ws`) server
- **API Docs:** swagger-autogen + swagger-ui-express
- **Frontend:** Static HTML/CSS/JS in `public/`, styled with Tailwind CSS
- **Testing:** Jest

## User Roles

| Role | Responsibilities |
|------|------------------|
| **Customer** | Browse hawker centres/stalls/menu items, add to cart, checkout, track orders, rate stalls, submit complaints and feedback |
| **Vendor** | Manage their stall, menu items, promotions, view orders and analytics, manage rental agreements |
| **Operator** | Oversee hawker centres, stalls, and rental agreements |
| **NEA** | Perform and manage stall inspections, view complaints and hawker centres |

Guests can browse and order without an account via a guest login.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Microsoft SQL Server instance
- A Gmail account (for sending promotional emails and receipts)
- An Ollama API key (for the customer chatbot)

### Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/junmingrs/BED_Assignment.git
   cd BED_Assignment
   npm install
   ```

2. Create `backend/.env` with the required environment variables (see below).

3. Set up the database schema (see `db.sql`) and update the connection settings in `backend/.env`.

4. Generate the Swagger documentation file:

   ```bash
   npm run swagger
   ```

5. Start the server:

   ```bash
   npm run dev
   ```

6. Open the app at [http://localhost:3000](http://localhost:3000) and the API docs at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

## Environment Variables

Create `backend/.env` in the `backend/` folder (this file is gitignored). The following variables are read from the environment:

| Variable | Description |
|----------|-------------|
| `PORT` | Port the server listens on (falls back to the script argument, e.g. `3000` or `3001`) |
| `DB_USER` | SQL Server username |
| `DB_PASSWORD` | SQL Server password |
| `DB_SERVER` | SQL Server host/address |
| `DB_DATABASE` | Database name |
| `DB_PORT` | SQL Server port |
| `JWT_SECRET_KEY` | Secret used to sign and verify JWT access token |
| `REFRESH_TOKEN_SECRET_KEY` | Secret used to sign and verify refresh token |
| `OLLAMA_API_KEY` | API key for the Ollama chatbot |
| `EMAIL_USER` | Gmail address used to send promotional emails and receipts |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the server with nodemon on port `3000` |
| `npm test` | Run the Jest test suite |
| `npm run swagger` | Regenerate `backend/swagger-output.json` from route definitions |

## Project Structure

```
BED_Assignment/
├── backend/
│   ├── app.js                    # Express app, routes, middleware, Swagger, WebSocket init
│   ├── db.js                     # MSSQL connection pool
│   ├── dbConfig.js               # Database config from environment variables
│   ├── helper.js                 # Shared helpers (e.g. getTimeFilter)
│   ├── swagger.js                # Swagger autogen configuration
│   ├── ws.js                     # WebSocket server (initWebServer, broadcast)
│   ├── config/
│   │   └── email.js              # Nodemailer transporter, promo + receipt emails
│   ├── controller/               # Route controllers (14 files)
│   ├── model/                    # Database models (14 files)
│   ├── middleware/
│   │   ├── auth.js               # authorise(...roles) JWT middleware
│   │   └── validate.js           # Joi validation, token verification
│   └── tests/                    # Jest tests (12 suites)
├── public/
│   ├── index.html                # Sign-in page
│   ├── register.html             # Registration page
│   ├── staff.html                # Staff entry point
│   ├── credit.html
│   ├── css/                      # Tailwind output + custom styles
│   ├── js/                       # Shared frontend logic (auth, cart, websocket, etc.)
│   ├── customer/                 # Customer pages (browse, cart, orders, profile, ...)
│   ├── vendor/                   # Vendor pages (menu, orders, analytics, stall, ...)
│   ├── operator/                 # Operator pages (hawkers, rental agreements, ...)
│   └── nea/                      # NEA pages (inspections, complaints, hawkers, ...)
└── package.json
```

## API Overview

The full API is documented with Swagger at `/api-docs`. Key endpoint groups: (# still need to verify this)

- **Auth:** `POST /register`, `POST /login`, `POST /loginGuest`, `POST /refresh`
- **Menu items:** `GET/POST/PUT/DELETE /menuitem`, `GET /menuitems`, `GET /menuitemsbystall/:stallId`, `GET /menuItemCuisine/:stallId/:itemCode`, `POST/DELETE/GET /menuitem/likes/:customerId`
- **Orders:** `POST /checkout`, `GET /order/:orderId`, `GET /customer/:customerId/orders`, `PATCH /orders/:orderId/:status`, `GET /stalls/:stallId/orders`
- **Stalls & hawker centres:** `GET /stalls`, `GET /stalls/:stallId`, `GET /vendors/:vendorId/stall`, `GET /hawkercentre`, `GET /hawkercentre/:id`
- **Promotions:** `GET/POST/PUT/DELETE /promotion`, `GET /promotion/code/:promotionCode`, `GET /promotion/stall/:stallId`, `GET /promotionActive`
- **Rental agreements:** `GET/POST/PUT /rentalagreement`, `GET /rentalagreement/:id`
- **Ratings:** `GET/POST /stalls/:stallId/ratings`, `DELETE /ratings/:ratingId`
- **Complaints:** `GET/POST /stalls/:stallId/complaints`, `DELETE /complaints/:complaintId`
- **Feedback:** `GET/POST /stalls/:stallId/feedback`, `DELETE /feedback/:feedbackId`
- **Inspections:** `GET/POST /stalls/:stallId/inspections`, `GET/PUT/DELETE /inspections/:inspectionId`
- **Analytics (vendor):** `GET /vendor/analytics/kpi/:stallId`, `GET /vendor/analytics/hourly-sales/:stallId`, `GET /vendor/analytics/top-items/:stallId`, `GET /vendor/analytics/ai-summary/:stallId`
- **Chatbot:** `POST /customer/chatbot/:customerId`
- **Customer profile:** `GET /customer/:customerId/profile`

All protected routes are enforced with `authorise(...roles)` using the JWT access token.

## Testing

The project uses Jest. Test suites live in `backend/tests/`.

```bash
npm test
```
