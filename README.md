# ⚡ Life OS

**Life OS** is an AI-powered, gamified life administration system designed to help you manage your tasks, track habits, monitor finances, and analyze your productivity—all in one place. It integrates local AI to serve as a smart assistant, making your life organization proactive and intelligent.

---

## 🌟 Key Features & Workflow

### 1. Smart Task Management
- Create, update, and manage daily tasks.
- Prioritize items and track their completion statuses.
- Gain XP (experience points) for completing tasks to level up your profile!

### 2. Habit Tracking & Heatmaps
- Build and monitor daily routines and habits.
- Visual heatmaps (similar to GitHub contributions) track your consistency over time.

### 3. Personal Finance & Budgeting
- Track income and expenses easily.
- Integrated **Finance AI Assistant** that analyzes your spending patterns and offers personalized budgeting recommendations.

### 4. Comprehensive Analytics
- A centralized dashboard visualizing your performance, energy matrix, and task completion rates.
- Charts and metric breakdowns to show exactly where your time and money go.

### 5. Gamified User Experience
- Earn XP, level up, and unlock visual achievements as you interact with your Life OS.
- A sleek, dynamic dark-mode UI powered by CSS Modules and GSAP micro-animations for a premium feel.

### 6. Robust Authentication
- Secure JWT-based email/password authentication.
- **One-Time Password (OTP)** recovery flow for forgotten passwords.
- **Google OAuth 2.0** integration for seamless one-click sign-in.

---

## 🛠️ Technology Stack

**Frontend:**
- **Framework:** Next.js (App Router) & React
- **Styling:** Vanilla CSS Modules with custom CSS variables (a custom, deeply-themed design system, entirely independent of Tailwind)
- **Animations:** GSAP (GreenSock Animation Platform)
- **Icons:** Lucide React

**Backend:**
- **Environment:** Node.js & Express.js
- **Database:** MongoDB & Mongoose
- **Authentication:** JWT (JSON Web Tokens) & Google OAuth2 API
- **Emails:** Nodemailer (SMTP) for OTP password resets and welcome emails

**AI Integration:**
- **Engine:** Ollama (running `phi3:latest` model locally) for privacy-focused AI chatbots and financial assistants.

---

## 🚀 Getting Started

Follow these steps to run the project locally. 

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** cluster (or local MongoDB instance)
- **Ollama** installed locally (if you wish to use the AI features) with the `phi3` model pulled (`ollama run phi3`).

### 2. Installation
Clone the repository and install all dependencies for both frontend and backend simultaneously from the root directory:
```bash
npm run install-all
```

### 3. Environment Setup

#### Backend Setup
1. Copy `backend/.env.example` to `backend/.env`.
2. Fill in your credentials:
   - `MONGO_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: A secure random string for JSON Web Tokens.
   - `SMTP_USER` & `SMTP_PASS`: Your Gmail address and a 16-character **Google App Password** for sending OTPs.
   - `FRONTEND_URL=http://localhost:3000` (for local development)
   - `ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`

#### Frontend Setup
1. Copy `frontend/.env.example` to `frontend/.env.local`.
2. The default local values use a Next.js rewrite proxy to prevent CORS issues:
   - `NEXT_PUBLIC_API_URL=/api`
   - `BACKEND_INTERNAL_URL=http://127.0.0.1:5000`
*(Note: For production or split-host deployments, set `NEXT_PUBLIC_API_URL` to your full public backend URL and rebuild the frontend).*

### 4. Google Sign-In Setup
To enable the "Sign in with Google" button:
1. Go to the **Google Cloud Console**.
2. Create an **OAuth 2.0 Client ID** (Web application type).
3. Add your exact redirect URI (e.g., `http://localhost:3000/google/callback`).
4. Copy the Client ID and Client Secret into your `backend/.env` file (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`).
5. *Note:* While the OAuth app is in "Testing" mode in Google Cloud, you must manually add your tester email accounts in the OAuth consent screen.
6. If the redirect URI, `FRONTEND_URL`, or Client credentials do not match exactly, Google sign-in will fail.

### 5. Running the Application
You can run both the frontend and backend servers concurrently with a single command from the **root directory**:

```bash
npm run dev
```

- **Frontend** will be available at: `http://localhost:3000`
- **Backend API** will be running at: `http://localhost:5000`