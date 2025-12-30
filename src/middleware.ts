import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/api"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Check if admin exists in database (used for redirects)
  const checkAdmin = async () => {
    const { data: adminData } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1);
    return adminData && adminData.length > 0;
  };

  // If user is not logged in and trying to access protected route
  if (!user && !isPublicRoute) {
    const hasAdmin = await checkAdmin();
    const url = request.nextUrl.clone();
    url.pathname = hasAdmin ? "/login" : "/register";
    return NextResponse.redirect(url);
  }

  // If on /login but no admin exists - redirect to /register
  if (!user && pathname === "/login") {
    const hasAdmin = await checkAdmin();
    if (!hasAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/register";
      return NextResponse.redirect(url);
    }
  }

  // If user is logged in and trying to access auth pages (but not API routes)
  const authPages = ["/login", "/register"];
  const isAuthPage = authPages.some((route) => pathname.startsWith(route));

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
