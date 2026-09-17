# Vercel deployment

Deploy this repository as two Vercel projects:

1. **Backend:** repository root, using the existing `vercel.json`.
2. **Frontend:** the `frontend` directory as the Vercel project root, using the Next.js framework.

## Backend environment variables

- `DATABASE_URL`: hosted PostgreSQL connection string. SQLite is intentionally rejected on Vercel.
- `FRONTEND_ORIGINS`: deployed frontend URL, for example `https://your-frontend.vercel.app`.
- `SEED_DEFAULT_AUTHORITY=1` only when the deployment should create or update the default authority account. Prefer creating production accounts explicitly.

The backend does not start its long-running weather monitor on Vercel. Run that work from a scheduled worker or a separate persistent service.

## Frontend environment variables

- `NEXT_PUBLIC_API_URL`: deployed backend URL, for example `https://your-backend.vercel.app`.

There is no production localhost fallback. Both projects must be deployed and their URLs must be configured before the frontend can make API requests.