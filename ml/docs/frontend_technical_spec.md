# TripOn Frontend Technical Specification

## 1. Project Directory Structure
We will adopt a professional, modular structure following Next.js best practices to ensure separation of concerns.

```text
tripon-frontend/
├── src/
│   ├── app/              # Next.js App Router (pages and layouts)
│   │   ├── (auth)/       # Auth-specific routes
│   │   ├── (main)/       # Main application routes (landing, hotels)
│   │   ├── api/          # Next.js API routes (if needed for proxying)
│   │   ├── layout.tsx    # Root layout (Navbar/Footer)
│   │   └── page.tsx      # Landing page
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Atomic components (button, input, modal)
│   │   ├── layout/       # Navbar, Footer
│   │   └── chat/         # Chatbot interface components
│   ├── services/         # API client services (FastAPI integration)
│   ├── hooks/            # Custom React hooks (logic reuse)
│   ├── lib/              # Utils, Supabase/NextAuth config
│   └── types/            # TypeScript definitions
├── public/               # Static assets
└── tailwind.config.ts    # Tailwind CSS configuration
```

## 2. Database Schema (PostgreSQL/Supabase)

### Table: `users`
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE, NOT NULL)
- `password_hash` (TEXT, NOT NULL)
- `username` (TEXT)
- `created_at` (TIMESTAMP)

### Table: `chat_history`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `query` (TEXT)
- `response` (TEXT)
- `timestamp` (TIMESTAMP)

### Table: `user_views`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `hotel_id` (UUID, FK -> hotels.id)
- `viewed_at` (TIMESTAMP)

## 3. Implementation Workflow
1. **Initialize Project:** Create Next.js application with TypeScript and Tailwind.
2. **Setup Infrastructure:** Configure modular folder structure.
3. **Database Migration:** Apply SQL schema changes to Supabase.
4. **Develop Authentication:** Setup NextAuth/Supabase Auth.
5. **Develop UI/UX:** Implement modular components as per structural plan.
6. **API Integration:** Connect UI to Python backend services.
