import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Named "proxy.ts" per Next.js 16 convention (formerly "middleware.ts").
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
