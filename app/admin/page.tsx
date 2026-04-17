import { auth } from "@/auth";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
      <p className="text-gray-500 mb-8">
        {session?.user?.name ?? session?.user?.email}님, 안녕하세요.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/report"
          className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 mb-1">리포트 생성기</h3>
          <p className="text-sm text-gray-500">
            미팅 노트와 설문 데이터로 사전 기업 진단 리포트를 생성합니다.
          </p>
        </Link>

        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-400 mb-1">파이프라인 관리</h3>
          <p className="text-sm text-gray-400">
            결제 → 설문 → 미팅 → 리포트 자동화 파이프라인 (준비 중)
          </p>
        </div>
      </div>
    </div>
  );
}
