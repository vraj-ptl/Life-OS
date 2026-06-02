# Life-OS

## Environment setup

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Fill in `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, and Google credentials.
3. For local development, keep:
   - `FRONTEND_URL=http://localhost:3000`
   - `ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env.local`.
2. Default local values use a Next.js rewrite proxy:
   - `NEXT_PUBLIC_API_URL=/api`
   - `BACKEND_INTERNAL_URL=http://127.0.0.1:5000`

For split-host deployments, set `NEXT_PUBLIC_API_URL` to your public backend URL including `/api` (example: `https://api.example.com/api`) and rebuild the frontend.

## Google sign-in setup

In Google Cloud Console:

1. Create an OAuth client (Web application).
2. Add this exact redirect URI:
   - `{FRONTEND_URL}/google/callback`
   - Example local: `http://localhost:3000/google/callback`
3. While app is in Testing mode, add your tester accounts in the OAuth consent screen.

If redirect URI, `FRONTEND_URL`, or `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` do not match exactly, Google sign-in will fail.