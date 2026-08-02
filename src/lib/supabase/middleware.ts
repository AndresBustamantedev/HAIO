import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

// Shared by `proxy.ts` (Next.js 16 renamed `middleware.ts` -> `proxy.ts`,
// see node_modules/next/dist/docs/.../file-conventions/proxy.md). Refreshes
// the Supabase session cookie on every request so Server Components always
// see a valid session.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Required: this call refreshes the auth token and must not be removed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute    = pathname === "/login";
  // Rutas públicas que no requieren sesión: página de pago y sus APIs
  const isPublicRoute  = pathname.startsWith("/pagar/") || pathname.startsWith("/api/pay/");

  if (!user && !isAuthRoute && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
