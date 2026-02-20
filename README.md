# Smart Bookmarks Manager

A fast, real-time bookmark management application built with Next.js and Supabase. Users can securely log in with their Google accounts to save, view, and manage their personal bookmark collections.

## Features

- **Google OAuth Login:** Secure authentication using Supabase Auth (no email/password management required).
- **Private Collections:** Database Row Level Security (RLS) ensures users can completely manage their own data while preventing access to others' bookmarks.
- **Real-time Syncing:** Powered by Supabase Realtime. Adding or deleting a bookmark instantly updates the UI across all active browser tabs without requiring a page refresh.
- **Modern UI:** A responsive, slick dark-mode interface built with Tailwind CSS.

## Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend as a Service:** Supabase
- **Database:** PostgreSQL
- **Deployment:** Vercel

---

## Challenges & Solutions

Building this app presented a few interesting technical challenges:

**1. Next.js Asynchronous `cookies()` API**

- **The Problem:** In the auth callback route (`app/auth/callback/route.ts`), TypeScript threw an error: `Property 'get' does not exist on type 'Promise<ReadonlyRequestCookies>'`.
- **The Solution:** Recent Next.js versions updated dynamic APIs like `cookies()` to be asynchronous. The fix was updating the Supabase SSR setup to `await cookies()` before attempting to call methods like `.get()` or `.set()`.

**2. React `useEffect` Dependency Warnings**

- **The Problem:** The React linter warned about a missing `fetchBookmarks` dependency inside the main `useEffect` hook handling the realtime subscription and session checks.
- **The Solution:** To prevent unnecessary re-renders or infinite loops, I refactored the code by moving the `fetchBookmarks` function definition entirely _inside_ the `useEffect` block, perfectly scoping it to where it was needed.

**3. Row Level Security (RLS) Blocks**

- **The Problem:** Even after successfully authenticating, initial attempts to read or write bookmarks failed because Supabase denies all database access by default.
- **The Solution:** Implemented strict PostgreSQL RLS policies ensuring that `SELECT`, `INSERT`, and `DELETE` operations only succeed if the `user_id` on the database row matches the active authenticated user's `auth.uid()`.

---

## Local Development

Follow these steps to run the app locally.

Prerequisites

- Node.js (v18+ recommended)
- npm (comes with Node.js) or an alternative package manager

Quick start

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd bookmark-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment variables
   - Copy/create a `.env.local` file in the project root and add your Supabase project values:

     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

   - How to get these values: create a project at https://app.supabase.com, open connect Settings → API Keys, then copy the `anon` public key and the project URL.

4. Run the development server:

   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:3000 by default.

Other useful scripts

- `npm run build` — create an optimized production build
- `npm start` — run the production build locally
- `npm run lint` — run ESLint checks

Tips & troubleshooting

- Ensure your `.env.local` is in the repository root (next to `package.json`).
- If auth or database calls fail, verify your Supabase RLS policies and that the keys in `.env.local` match the project.
- If the dev server is already running on port 3000, run `PORT=3001 npm run dev` (or set `PORT` on Windows PowerShell: `$env:PORT=3001; npm run dev`).

Deploying

This project is ready for deployment on Vercel. Connect your repository to Vercel and add the same environment variables in the Vercel project settings.

---

## Live Demo

- Vercel: https://bookmark-app-dusky.vercel.app/ (replace with your project's URL)
