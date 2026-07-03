# Authentication System

This project is for Advanced Cyber Security Assignment from BUC, which is built using the **MERN** stack with **TypeScript** on the frontend. It includes modern authentication features like **JWT**, **OTP verification**, **Google reCAPTCHA**, and **Google Login**.

---

## Tech Stack

### Frontend

- **React.js**
- **TypeScript**
- **Tailwind CSS**
- **Axios** for API requests
- **React Router DOM** for navigation

### Backend

- **Node.js**
- **Express.js**
- **Mongoose** (ODM for MongoDB)
- **JWT (JSON Web Token)** for authentication
- **OTP (One-Time Password)** verification system
- **Google reCAPTCHA** integration
- **Google Login (OAuth 2.0)** support

### Database

- **MongoDB** (via **Mongoose**)

1. Install mongo db compass from below link.

```bash
https://www.mongodb.com/try/download/compass
```

2. Click connect and enter connection string.

```bash
MONBODBURL='mongodb+srv://lynnmyat:Lynn1382003@authentication-system.lnqt3vc.mongodb.net/'
```

3. Check the test folder to see database.

---

## Installation & Setup

### 1. Extract the zip file

2. Backend Setup

```bash
cd backend
npm install
```

Run the backend:

```bash

npm run dev
```

3. Frontend Setup

```bash
cd frontend
npm install
```

Run the frontend:

```bash
npm run dev
```

Then open your browser and navigate to:

```bash
http://localhost:5173
```

## Environment Variables

Environment variables are already set up and not included here.

Note: It is already existed in the zip file.

## Authentication & Security

JWT is used for user authentication and session management.

OTP verification is used for user identity confirmation (email or phone-based).

Google reCAPTCHA is implemented to prevent bots.

Google Login (OAuth 2.0) allows users to sign in with their Google accounts.

## Features

User registration and login with JWT

OTP verification

Google Login (OAuth)

Protected routes and middleware

Role-based access control (optional)

Secure password hashing with bcrypt

Validation using Express Validator

Fully responsive UI with Tailwind CSS

## Scripts

Bakend

```bash
#Commands
npm run dev	    # Run backend in development mode
npm run start	# Start backend in production mode
```

Frontend

```bash
#Commands
npm run dev	    # Run frontend in development mode
npm run build	# Build frontend for production
npm run preview	# Preview production build
```
