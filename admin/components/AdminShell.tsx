import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { auth } from '@/auth';
import { signOutAction } from '@/lib/auth-actions';
import Sidebar from './Sidebar';

export default async function AdminShell({ children }: { children: ReactNode }) {
  const session = await auth();
  // [DEV ONLY — REMOVE BEFORE COMMIT] 로컬 개발 시 위장 이메일 표시 (분별용)
  const displayEmail =
    session?.user?.email ??
    (process.env.NODE_ENV === "development" ? "dev@jocodingax.ai" : null);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-4 sticky top-0 z-10">
          {displayEmail && (
            <span className="text-sm text-gray-500 truncate max-w-[240px]">
              {displayEmail}
            </span>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </form>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
