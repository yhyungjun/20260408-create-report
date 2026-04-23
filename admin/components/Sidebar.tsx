'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Sparkles,
  FileText,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/admin/customers', label: '고객 응답', icon: Users },
  { href: '/admin/questionnaires', label: '설문지 설정', icon: ClipboardList },
  { href: '/admin/pre-meeting', label: '미팅 숙지안', icon: Sparkles },
  { href: '/admin/report', label: '리포트 생성기', icon: FileText },
  { href: '/admin/stats', label: '유저 통계', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="h-14 flex items-center px-6 border-b border-gray-200">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white text-[11px] font-bold tracking-tight">
            AX
          </span>
          <span className="text-sm font-semibold text-gray-900">파트너스 관리자</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${active ? 'text-violet-600' : 'text-gray-400'}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          조코딩 AX 파트너스
          <br />
          사전 기업 진단 컨설팅
        </p>
      </div>
    </aside>
  );
}
