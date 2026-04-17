import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth-actions";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* 어드민 네비게이션 */}
      <nav className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-bold text-sm">
                AX 파트너스 관리자
              </Link>
              <div className="flex gap-4 text-sm">
                <Link
                  href="/admin/report"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  리포트 생성
                </Link>
                <Link
                  href="/admin/pipeline"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  파이프라인
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {session?.user && (
                <span className="text-gray-400">{session.user.email}</span>
              )}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* 콘텐츠 */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
