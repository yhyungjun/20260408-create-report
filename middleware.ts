import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // /login은 보호하지 않음
  if (pathname === "/login") return NextResponse.next();

  // /admin/* 접근 시: 로그인 필수 + @jocodingax.ai 도메인만
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(loginUrl);
    }

    const role = (req.auth.user as { role?: string })?.role;
    if (role !== "admin") {
      // 어드민이 아닌 유저가 /admin 접근 시 홈으로
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
})

export const config = {
  matcher: ["/admin/:path*", "/login"],
}
