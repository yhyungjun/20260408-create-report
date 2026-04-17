'use client';

import { useState, useRef, useEffect } from 'react';
import SignOutButton from './SignOutButton';

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  } | null;
}

export default function UserMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) {
    return (
      <a
        href="/login"
        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        로그인
      </a>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="w-7 h-7 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
            {(user.name || user.email || '?')[0]}
          </div>
        )}
        <span className="hidden sm:inline">{user.name || '내 정보'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
            {user.role === 'admin' && (
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                관리자
              </span>
            )}
          </div>
          {user.role === 'admin' && (
            <a
              href="/admin"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              관리자 대시보드
            </a>
          )}
          <SignOutButton />
        </div>
      )}
    </div>
  );
}
