import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // [DEV ONLY — REMOVE BEFORE COMMIT] 로컬 개발 환경 인증 우회
  if (process.env.NODE_ENV === "development") return NextResponse.next();

  // /login은 보호하지 않음
  if (pathname === "/login") return NextResponse.next();

  // /questionnaire, /pay 접근 시: 로그인 필수
  if (pathname.startsWith("/questionnaire") || pathname.startsWith("/pay")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // /admin/* 접근 시: 로그인 필수 + @jocodingax.ai 도메인만
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(loginUrl);
    }

    const role = (req.auth.user as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
})

export const config = {
  matcher: ["/admin/:path*", "/login", "/questionnaire/:path*", "/pay/:path*"],
}
