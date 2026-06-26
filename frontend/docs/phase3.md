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
│      - Formatted Responses: Markdown rendering (bolding, bullets).                                    │
│  - Chat History: Dynamic loading of previous sessions via Sidebar.                                    │
│  - Landing Page (Below Fold):                                                                         │
│      - Dynamic Content: Recently explored hotels (logged-in users) OR Trending hotels (visitors).     │
│  - Footer: Standard site footer.                                                                      │
│                                                                                                       │
│ 4. Backend/Database Changes                                                                           │
│  - Database:                                                                                          │
│      - Utilize existing schema (hotels, reviews, etc.).                                               │
│      - Create users table, chat_history, user_views.                                                  │
│  - Functionality:                                                                                     │
│      - Authentication-gated chat access.                                                              │
│      - Persistent chat sessions with context retention.                                               │
│                                                                                                       │
│ 5. Status: COMPLETED                                                                                  │