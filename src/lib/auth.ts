import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "manager";

export type UserProfile = {
  id: string;
  full_name: string | null;
  role: UserRole | null;
  is_active: boolean;
};

// Wrapped in React's cache() so the dashboard layout and each page can both
// call this without doubling up the auth + profile round trip per request.
export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single();

  return profile;
});
