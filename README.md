# ⚡ Life OS


**Life OS** is a comprehensive, AI-powered, gamified life administration system designed to help you manage tasks, track habits, monitor finances, and analyze productivity—all from a single, unified interface. By integrating local AI, Life OS serves as a smart assistant, making personal organization proactive, insightful, and engaging.

### 🌐 Live Deployment
Experience the live application here: **[Life OS Frontend](https://life-os-frontend-mu.vercel.app)**

---

## 🌟 Core Features & Workflow

Life OS is designed to be the central hub for your daily activities. Here is how the system works to streamline your life:

### 1. Smart Task Management
- **Workflow:** Users can create, update, and categorize daily tasks. Tasks can be prioritized, and their completion status is tracked in real-time.
- **Gamification:** Completing tasks rewards you with Experience Points (XP), allowing you to level up your profile and unlocking visual achievements, transforming mundane tasks into an engaging game.

### 2. Habit Tracking & Heatmaps
- **Workflow:** Build and monitor daily routines. The system tracks your consistency over time.
- **Visualization:** Visual heatmaps (similar to GitHub contribution graphs) provide a quick overview of your habit streaks and overall consistency.

### 3. Personal Finance & Budgeting
- **Workflow:** Easily log income and expenses. The integrated **Finance AI Assistant** analyzes your spending patterns, categorizes expenses, and offers personalized budgeting recommendations to optimize your financial health.

### 4. Comprehensive Analytics
- **Workflow:** A centralized dashboard aggregates data from tasks, habits, and finances.
- **Visualization:** Beautiful charts and metric breakdowns (powered by Recharts) visualize your performance, energy matrix, and task completion rates, showing exactly where your time and money go.

### 5. Robust Authentication & Security
- **Workflow:** Secure access to your personal data through JWT-based email/password authentication or seamless **Google OAuth 2.0** one-click sign-in.
- **Recovery:** Integrated One-Time Password (OTP) recovery flow for forgotten passwords.

---

## 🛠️ Technology Stack

Life OS is built with a modern, robust, and scalable technology stack, divided into a decoupled frontend and backend architecture.

### Frontend
- **Framework:** **Next.js (App Router)** & **React** for server-side rendering, routing, and building interactive UIs.
- **Styling:** **Vanilla CSS Modules** with a custom, deeply-themed design system and CSS variables. Ensures scoped styling without relying on utility classes like Tailwind.
- **Animations:** **GSAP (GreenSock Animation Platform)** for smooth, premium micro-animations and dynamic UI interactions.
- **Data Visualization:** **Recharts** for rendering responsive and composable charts in the analytics dashboard.
- **Icons & Utilities:** **Lucide React** for beautiful SVG icons, **Axios** for HTTP requests, and **date-fns** for precise date manipulation.

### Backend
- **Environment:** **Node.js** & **Express.js** providing a fast and minimalist web framework for the API.
- **Database:** **MongoDB** with **Mongoose** ODM for flexible, document-based data modeling.
- **Authentication:** **JSON Web Tokens (JWT)** for stateless session management, and **Google APIs** for OAuth2 integration.
- **Security:** **Helmet** for securing HTTP headers, **Bcrypt.js** for password hashing, and **Express Rate Limit** to prevent brute-force attacks.
- **Email Services:** **Nodemailer** (SMTP) for sending transactional emails, such as OTPs and welcome messages.
- **Validation:** **Express Validator** for robust API request data validation.

### AI Integration
- **Engine:** **Ollama** running the `phi3:latest` model locally. This provides privacy-focused, on-device AI capabilities for the smart chatbots and financial assistants without sending personal data to external APIs.

---

## 🚀 Getting Started Locally

Follow these steps to set up and run the project on your local machine.

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** cluster (Atlas) or local MongoDB instance
- **Ollama** installed locally with the `phi3` model pulled. Run `ollama run phi3` in your terminal to download and start the model.

### 2. Installation
Clone the repository and install dependencies for both the frontend and backend from the root directory:
```bash
git clone https://github.com/yourusername/life-os.git
cd life-os
npm run install-all
```

### 3. Environment Configuration

#### Backend Setup
1. Navigate to the `backend` directory and copy `.env.example` to `.env`.
2. Configure the following environment variables:
   - `MONGO_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: A secure random string for signing JWTs.
   - `SMTP_USER` & `SMTP_PASS`: Your email address and App Password for Nodemailer.
   - `FRONTEND_URL`: `http://localhost:3000` (for local development).
   - `ALLOWED_ORIGINS`: `http://localhost:3000,http://127.0.0.1:3000`
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From your Google Cloud Console OAuth 2.0 Client credentials.

#### Frontend Setup
1. Navigate to the `frontend` directory and copy `.env.example` to `.env.local`.
2. Configure the following variables (uses Next.js rewrites by default for local dev):
   - `NEXT_PUBLIC_API_URL=/api`
   - `BACKEND_INTERNAL_URL=http://127.0.0.1:5000`

### 4. Running the Application
Start both the frontend and backend development servers concurrently from the **root directory**:

```bash
npm run dev
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 📄 License
This project is licensed under the MIT License.
