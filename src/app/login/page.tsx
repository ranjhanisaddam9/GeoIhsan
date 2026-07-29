"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INVALID_CREDENTIALS_MESSAGE = "Invalid login credentials";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // Auth itself is still email-based (that's how Supabase Auth works) —
    // resolve the entered username to its account email first. A missing
    // username and a wrong password both surface the same generic error,
    // so this lookup can't be used to enumerate valid usernames.
    const { data: email, error: lookupError } = await supabase.rpc(
      "email_for_username",
      { p_username: username.trim() },
    );

    if (lookupError || !email) {
      setLoading(false);
      setError(INVALID_CREDENTIALS_MESSAGE);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center bg-zinc-50 bg-cover bg-center px-6 dark:bg-black"
      style={{ backgroundImage: "url('/login-bg.png')" }}
    >
      <div className="w-full max-w-sm rounded-lg border border-white/30 bg-white/20 p-8 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/log0.png" alt="GeoIhsan" className="mx-auto h-48 w-auto" />

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-green-500 dark:focus:ring-green-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-green-500 dark:focus:ring-green-500"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 dark:hover:bg-green-500"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
