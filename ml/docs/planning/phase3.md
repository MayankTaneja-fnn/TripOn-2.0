                                                                                                     │
│ Phase 3: Frontend Development Plan - TripOn (Full-Stack Next.js)                                      │
│                                                                                                       │
│ 1. Objective                                                                                          │
│ Develop a full-stack Next.js (App Router) application ("TripOn") that integrates with the existing    │
│ RAG backend while adding a user management layer.                                                     │
│                                                                                                       │
│ 2. Technical Stack                                                                                    │
│  - Framework: Next.js 15+ (App Router, Tailwind CSS, TypeScript).                                     │
│  - Backend Communication: REST API (FastAPI backend).                                                 │
│  - Database: PostgreSQL/Supabase (existing + new users table).                                        │
│  - Auth: NextAuth.js (or similar) with Supabase Adapter.                                              │
│                                                                                                       │
│ 3. UI/UX Design & Features                                                                            │
│  - Navbar: "TripOn" branding, Links (AI Search, Hotels, Itinerary Planner), Login/Signup button.      │
│  - Landing Page (Hero):                                                                               │
│      - AI Chatbot Interface (half-screen, persistent history).                                        │
│      - Authentication Gate: Chat interaction requires user login.                                     │
│  - Landing Page (Below Fold):                                                                         │
│      - Dynamic Content: Recently explored hotels (logged-in users) OR Trending hotels (visitors).     │
│  - Footer: Standard site footer.                                                                      │
│                                                                                                       │
│ 4. Backend/Database Changes                                                                           │
│  - Database:                                                                                          │
│      - Utilize existing schema (hotels, reviews, etc.).                                               │
│      - Create users table: ID, username, email, hashed password, profile details.                     │
│      - Create chat_history and user_views tables (linked to user_id).                                 │
│  - Functionality:                                                                                     │
│      - Authentication-gated chat access.                                                              │
│      - Fetching and hydration of chat history and recently viewed hotels upon user login.             │
│                                                                                                       │
│ 5. Implementation Steps                                                                               │
│  1. Database Schema: Create users, chat_history, and user_views tables in Supabase.                   │
│  2. Auth Setup: Configure NextAuth/Supabase Auth.                                                     │
│  3. Frontend Architecture: Initialize Next.js, implement Layout (Navbar/Footer).                      │
│  4. Landing Page: Develop Chatbot interface + Trending/Recent section logic.                          │
│  5. API Integration: Connect components to Python backend, implement user-specific data fetching.     │
│                                                                                                       │
│ 6. Verification & Testing                                                                             │
│  - Login/Signup flow and auth-gated chat access.                                                      │
│  - Correct loading of user-specific history/viewed hotels after login.                                │
│  - UI responsiveness and design fidelity.                                                             │
│                                               