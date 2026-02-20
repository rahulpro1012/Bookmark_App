"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

// Define Bookmark type
type Bookmark = {
  id: string;
  title: string;
  url: string;
  user_id: string;
};

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data, error } = await supabase.from("bookmarks").select("*");
      if (!error && data) setBookmarks(data);
    };

    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) fetchBookmarks();
      setLoading(false);
    };

    checkUser();

    const channel = supabase
      .channel("realtime bookmarks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBookmarks((prev) => [...prev, payload.new as Bookmark]);
          } else if (payload.eventType === "DELETE") {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBookmarks([]);
  };

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("bookmarks").insert({
      title: newTitle,
      url: newUrl,
      user_id: user.id,
    });

    if (!error) {
      setNewTitle("");
      setNewUrl("");
    }
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().match({ id });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-slate-200 rounded mb-4"></div>
          <div className="text-slate-400">Loading your space...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              Smart Bookmarks
            </h1>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:block">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm hover:shadow"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>
          )}
        </header>

        {/* Main Content Area */}
        {!user ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Secure & Private
            </h2>
            <p className="text-slate-500 max-w-sm mx-auto">
              Sign in to manage your personal bookmarks. Your data is synced in
              real-time and kept completely private.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add Bookmark Form */}
            <form
              onSubmit={addBookmark}
              className="flex flex-col sm:flex-row gap-3 p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all"
            >
              <input
                type="text"
                placeholder="Title (e.g., GitHub)"
                className="flex-1 bg-transparent px-4 py-2.5 outline-none placeholder:text-slate-400"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
              <div className="hidden sm:block w-px bg-slate-200 my-2"></div>
              <input
                type="url"
                placeholder="https://..."
                className="flex-[1.5] bg-transparent px-4 py-2.5 outline-none placeholder:text-slate-400"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 font-medium transition-colors sm:w-auto w-full mt-2 sm:mt-0"
              >
                Save
              </button>
            </form>

            {/* Bookmark List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Your Links
                </h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {bookmarks.map((bookmark) => (
                  <li
                    key={bookmark.id}
                    className="group flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 sm:p-6 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-start gap-4 overflow-hidden">
                      <div className="mt-1 bg-slate-100 p-2 rounded-lg text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </div>
                      <div className="truncate">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-semibold text-slate-800 hover:text-blue-600 transition-colors block truncate"
                        >
                          {bookmark.title}
                        </a>
                        <span className="text-sm text-slate-400 truncate block mt-0.5">
                          {bookmark.url}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="opacity-100 sm:opacity-0 group-hover:opacity-100 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-all self-start sm:self-auto"
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {bookmarks.length === 0 && (
                  <div className="p-12 text-center text-slate-400">
                    <p>No bookmarks yet. Add your first one above!</p>
                  </div>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
