::: {align="center"}
# 🩸 LifeLink --- Blood Donation & Blood Bank Finder

### Connecting Blood Donors. Supporting Blood Seekers. Helping Save Lives.

A full-stack web application that helps people discover blood donors and
blood banks, create and track blood requests, and manage
donation-related workflows through role-based dashboards.

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/API-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

**[View
Repository](https://github.com/Tamreen207/Blood_Donation_Finder)**
:::

------------------------------------------------------------------------

## 📖 About LifeLink

Finding a suitable blood donor or blood bank during an emergency can be
difficult and time-sensitive. **LifeLink** is designed to make that
process easier by bringing blood seekers, donors, and blood banks
together on one platform.

The application provides workflows for searching donors and blood banks,
submitting blood requests, tracking requests, and managing user and
blood-bank information. It uses a React + Vite frontend, a Node.js +
Express backend, and MongoDB for data storage.

### 🎯 Project Goals

-   Make donor and blood-bank discovery easier.
-   Help users search using blood group and location information.
-   Support creation and tracking of regular and emergency blood
    requests.
-   Provide dedicated workflows for donors, seekers, blood banks, and
    administrators.
-   Organize donation-related information through a centralized web
    application.

## ✨ Features

  -----------------------------------------------------------------------
  Module                              Capabilities
  ----------------------------------- -----------------------------------
  **User accounts**                   Registration, login, and role-based
                                      experiences

  **Donor management**                Donor profiles and
                                      blood-group/location information

  **Find blood**                      Search for potential donors and
                                      blood banks

  **Blood requests**                  Create and track blood requests,
                                      including emergency requests

  **Blood banks**                     Blood-bank information and
                                      inventory/request workflows

  **Notifications**                   Notification interface for relevant
                                      application updates

  **Dashboard**                       Dashboard views for monitoring user
                                      workflows

  **Authentication**                  JWT-based authentication and
                                      protected routes

  **Administration**                  Administrative dashboard and
                                      endpoints where implemented
  -----------------------------------------------------------------------

> Features and access depend on the configured backend, database, and
> implemented user role.

## 🖥️ Application Screenshots

The screenshots below are linked to image files in the **root of this
GitHub repository**. Keep the filenames unchanged, or update the paths
if you move the images into another folder.

### Home

::: {align="center"}
`<img src="Home.png" alt="LifeLink home page" width="90%">`{=html}
```{=html}
<p>
```
`<em>`{=html}LifeLink landing page`</em>`{=html}
```{=html}
</p>
```
:::

### Login and Registration

::: {align="center"}
`<img src="login.png" alt="LifeLink login page" width="48%">`{=html}
`<img src="register.png" alt="LifeLink registration page" width="48%">`{=html}
```{=html}
<p>
```
`<em>`{=html}User authentication and account registration`</em>`{=html}
```{=html}
</p>
```
:::

### Dashboard

::: {align="center"}
`<img src="Dashboard.png" alt="LifeLink dashboard" width="90%">`{=html}
```{=html}
<p>
```
`<em>`{=html}Application dashboard`</em>`{=html}
```{=html}
</p>
```
:::

### Find Blood and Blood Banks

::: {align="center"}
`<img src="find_blood.png" alt="Find blood page" width="48%">`{=html}
`<img src="Blood_Banks.png" alt="Blood banks page" width="48%">`{=html}
```{=html}
<p>
```
`<em>`{=html}Blood search and blood-bank discovery`</em>`{=html}
```{=html}
</p>
```
:::

### Emergency Requests and Notifications

::: {align="center"}
`<img src="emergency-request.png" alt="Emergency blood request page" width="48%">`{=html}
`<img src="notifications.png" alt="Notifications page" width="48%">`{=html}
```{=html}
<p>
```
`<em>`{=html}Emergency request and notification workflows`</em>`{=html}
```{=html}
</p>
```
:::

### User Profile

::: {align="center"}
`<img src="profile.png" alt="LifeLink user profile" width="70%">`{=html}
```{=html}
<p>
```
`<em>`{=html}User profile`</em>`{=html}
```{=html}
</p>
```
:::

## 🧰 Technology Stack

  Layer             Technology
  ----------------- ------------------------------
  Frontend          React.js, Vite
  Styling           CSS
  Backend           Node.js, Express.js
  Database          MongoDB
  ODM               Mongoose
  Authentication    JSON Web Token (JWT)
  API style         REST API
  Testing           Node.js built-in test runner
  Version control   Git and GitHub

## 🏛️ High-Level Architecture

``` text
┌─────────────────────────────────────────────────────┐
│                    APPLICATION USERS                │
│          Donor  •  Seeker  •  Blood Bank  •  Admin   │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│                 FRONTEND — REACT + VITE             │
│             Pages • Components • UI • Services      │
└──────────────────────────┬──────────────────────────┘
                           │ HTTP / REST API
                           ▼
┌─────────────────────────────────────────────────────┐
│                BACKEND — NODE + EXPRESS             │
│       Routes • Controllers • Middleware • Services  │
│             Authentication • Validation             │
└──────────────────────────┬──────────────────────────┘
                           │ Mongoose
                           ▼
┌─────────────────────────────────────────────────────┐
│                      MONGODB                        │
│             Application and user data               │
└─────────────────────────────────────────────────────┘
```

## 📁 Project Structure

``` text
Blood_Donation_Finder/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── seed.js
│   └── .env.example
├── database/
│   └── schemas/
├── docs/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── tests/
├── Blood_Banks.png
├── Dashboard.png
├── Home.png
├── emergency-request.png
├── find_blood.png
├── login.png
├── notifications.png
├── profile.png
├── register.png
├── package.json
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following before running the application:

-   **Node.js 18 or later** (Node.js 20+ recommended)
-   **npm**
-   **MongoDB**, running locally or available through a MongoDB
    connection URI
-   **Git**

### 1. Clone the repository

``` bash
git clone https://github.com/Tamreen207/Blood_Donation_Finder.git
```

### 2. Open the project directory

``` bash
cd Blood_Donation_Finder
```

### 3. Install dependencies

``` bash
npm install --prefix backend && npm install --prefix frontend
```

### 4. Configure environment variables

Create `backend/.env` using `backend/.env.example` as a reference. Add
your MongoDB connection string and a strong JWT secret.

Example:

``` env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_strong_random_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

If your frontend requires a separate API base URL, create
`frontend/.env`:

``` env
VITE_API_BASE_URL=http://localhost:5000
```

**Keep secrets private.** Do not commit `.env` files, database
credentials, or production tokens to GitHub.

### 5. Start the application

From the project root:

``` bash
npm start
```

The start script builds the frontend and starts the backend server,
which serves the built frontend and API from the same origin.

  Service            Address
  ------------------ ----------------------------------
  Application        http://localhost:5000
  API health check   http://localhost:5000/api/health

### Development mode

To run the frontend and backend development servers together:

``` bash
npm run dev
```

  Service            Address
  ------------------ ----------------------------------
  Vite frontend      http://localhost:5173
  Backend API        http://localhost:5000
  API health check   http://localhost:5000/api/health

The Vite development server proxies `/api` requests to the backend.
MongoDB must be configured and available for database-dependent
features.

## 🧪 Testing

The project includes automated test suites using the Node.js built-in
test runner. The included suites are designed to run without a database;
complete database-backed workflows require a configured MongoDB instance
and test data.

Run all tests:

``` bash
npm test
```

Run an individual suite:

``` bash
npm run test:unit
npm run test:integration
npm run test:system
npm run test:whitebox
npm run test:blackbox
```

  Suite         Focus
  ------------- ---------------------------------------------------------
  Unit          Individual functions and utilities
  Integration   API behavior, authentication, and route interactions
  System        Project structure and required modules
  White-box     Internal logic and control-flow behavior
  Black-box     External API contracts, validation, and error responses

## 📦 Production Build

Build the frontend:

``` bash
npm run build
```

The production frontend output is generated in:

``` text
frontend/dist/
```

## 🔁 Typical User Workflow

1.  A user registers and signs in using the appropriate account type.
2.  A blood seeker searches using blood group and location requirements.
3.  The application displays potential donor or blood-bank matches.
4.  The seeker can submit a blood request, including an emergency
    request.
5.  Donors and blood banks can manage relevant request workflows.
6.  Users can view request-related updates through the application
    interface.

## 🔐 Security and Medical Safety

-   Use a strong, unique `JWT_SECRET`.
-   Keep database credentials and private configuration out of source
    control.
-   Use HTTPS and appropriate security controls in production.
-   Validate user input and protect routes according to user roles.
-   Do not present unverified, expired, or fabricated inventory as
    confirmed availability.
-   Donor eligibility, blood compatibility, laboratory crossmatching,
    and decisions to issue blood must be confirmed by qualified
    professionals at authorized blood centres.

**LifeLink is an information and coordination application. It does not
replace medical advice, professional donor screening, laboratory
testing, or the procedures of authorized blood centres.**

## 🚀 Possible Future Improvements

-   Real-time request notifications.
-   Email and SMS alerts.
-   Map-based donor and blood-bank discovery.
-   Additional emergency request coordination.
-   Improved inventory reporting and analytics.
-   Mobile application support.

## 🤝 Contributing

Suggestions and contributions are welcome.

1.  Fork the repository.
2.  Create a feature branch.
3.  Make and test your changes.
4.  Commit your changes.
5.  Push the branch and open a pull request.

``` bash
git checkout -b feature/your-feature
git add .
git commit -m "Describe your changes"
git push origin feature/your-feature
```

## 👩‍💻 Author

**Syed Tamreen**\
B.Tech --- Computer Science and Engineering\
Rajiv Gandhi University of Knowledge Technologies (RGUKT), RK Valley

-   **GitHub:** [@Tamreen207](https://github.com/Tamreen207)
-   **Project:** [LifeLink --- Blood Donation & Blood Bank
    Finder](https://github.com/Tamreen207/Blood_Donation_Finder)

------------------------------------------------------------------------

::: {align="center"}
### 🩸 Every Drop Counts. Every Donor Matters. Every Life Is Precious.

**Built with ❤️ to support blood donation and help people find blood
resources.**
:::
