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

  // Same verification the proxy does, and for the same reason it uses
  // getClaims() rather than getUser(): the signature is checked locally
  // against the project's public key, so this costs no network round trip.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", userId)
    .single();

  return profile;
});
