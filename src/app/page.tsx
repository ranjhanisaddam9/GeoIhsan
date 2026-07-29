import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";

export default async function Home() {
  const profile = await getUserProfile();
  redirect(profile ? "/dashboard" : "/login");
}
