import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/env";

const PROTECTED = ["/start", "/teraz", "/zaplanuj", "/sesje", "/sesja", "/profil"];
const AUTH_PAGES = ["/logowanie", "/rejestracja"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Odświeża sesję Supabase w ciasteczkach i pilnuje dostępu do stron aplikacji. */
export async function proxy(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;

  if (!user && matches(pathname, PROTECTED)) {
    const url = request.nextUrl.clone();
    url.pathname = "/logowanie";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (user && matches(pathname, AUTH_PAGES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/start";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/|sw.js|manifest.webmanifest|icons/|favicon.ico|.*\\.(?:png|svg|jpg|webp|ico)$).*)"],
};
