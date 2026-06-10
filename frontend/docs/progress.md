# Project Progress - TripOn Frontend

## Summary of Completed Work
1. **Initial Setup:** Initialized Next.js 15+ application (App Router, TypeScript, Tailwind CSS).
2. **Database:** Initialized PostgreSQL tables (`users`, `chat_history`, `user_views`) using the migration scripts.
3. **Environment Setup:** Created `frontend/.env.example` to define required environment variables for Auth and Database services.
11. **Authentication UI:** Added Logout functionality to the Navbar using NextAuth server actions.

## Authentication Implementation Strategy

### Architecture Overview
We use **NextAuth.js (Auth.js)** as the primary authentication orchestrator.
1. **Flow:** NextAuth handles user credentials, while the **Supabase Adapter** persists session and user data directly into our PostgreSQL database (`users` table).
2. **Session Management:** NextAuth generates secure, encrypted session cookies stored in the user's browser, which are validated server-side for protected routes.

### Environment Configuration (The Keys)
These environment variables are critical for secure communication:

| Key | Purpose |
| :--- | :--- |
| `NEXTAUTH_SECRET` | A random string used to encrypt/decrypt session cookies. **Must remain private.** |
| `NEXTAUTH_URL` | The application base URL (e.g., `http://localhost:3000`). |
| `NEXT_PUBLIC_SUPABASE_URL` | The URL of the Supabase project. Safe for browser exposure. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key used for RLS-restricted database requests from the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Highly sensitive.** Bypasses RLS; used only server-side for administrative tasks. |

## Database Schema

### `users` Table
- `id`: UUID (Primary Key)
- `username`: VARCHAR(255)
- `email`: VARCHAR(255) (Unique)
- `password_hash`: TEXT
- `created_at`: TIMESTAMP

### `chat_history` Table
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key referencing `users.id`)
- `message`: TEXT
- `role`: VARCHAR(50)
- `timestamp`: TIMESTAMP

### `user_views` Table
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key referencing `users.id`)
- `hotel_id`: UUID
- `viewed_at`: TIMESTAMP
