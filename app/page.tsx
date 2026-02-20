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
    // 1. Move fetchBookmarks inside the useEffect
    const fetchBookmarks = async () => {
      const { data, error } = await supabase.from("bookmarks").select("*");
      if (!error && data) setBookmarks(data);
      console.log(data);
    };

    // Check active session
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // 2. Call it here
      if (session?.user) fetchBookmarks();
      setLoading(false);
    };

    checkUser();

    // Realtime subscription setup
    const channel = supabase
      .channel("realtime bookmarks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        (payload) => {
          // Optimistic UI updates based on database events
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

    // Insert into DB (Realtime subscription will update the UI)
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

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto font-sans">
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Smart Bookmarks</h1>
        {user ? (
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sign in with Google
          </button>
        )}
      </nav>

      {!user ? (
        <p className="text-gray-600 text-center mt-20">
          Please sign in to manage your bookmarks.
        </p>
      ) : (
        <div className="space-y-6 text-black">
          {/* Add Bookmark Form */}
          <form
            onSubmit={addBookmark}
            className="flex gap-2 p-4 bg-gray-100 rounded-lg"
          >
            <input
              type="text"
              placeholder="Title (e.g., Google)"
              className="border p-2 rounded flex-1"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              className="border p-2 rounded flex-1"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add
            </button>
          </form>

          {/* Bookmark List */}
          <ul className="space-y-3">
            {bookmarks.map((bookmark) => (
              <li
                key={bookmark.id}
                className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"
              >
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  {bookmark.title}
                </a>
                <button
                  onClick={() => deleteBookmark(bookmark.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </li>
            ))}
            {bookmarks.length === 0 && (
              <p className="text-gray-500 text-center">No bookmarks yet.</p>
            )}
          </ul>
        </div>
      )}
    </main>
  );
}
