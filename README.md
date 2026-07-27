# GeoIhsan

Trucking station management system for managing trucks, drivers, clients, and transport transactions.

> This project is being built in phases. Phase 1 covers project scaffolding and Supabase connection wiring only — no authentication, database tables, or business logic yet.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) (`@supabase/supabase-js`, `@supabase/ssr`)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment example file and fill in your Supabase project credentials:

   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local` and set:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

   These values are found in your Supabase project's API settings.

3. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

- `src/app` — App Router pages and layouts
- `src/lib/supabase/client.ts` — Supabase client for browser/client components
- `src/lib/supabase/server.ts` — Supabase client for server components and route handlers

## Phases

This project is developed incrementally. Current phase:

- **Phase 1 (complete):** Project scaffold, Tailwind + ESLint setup, Supabase client wiring.

Authentication, database schema, and business logic will be introduced in later phases.
