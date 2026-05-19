'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '工作台' },
  { href: '/create-job', label: '创建岗位' },
  { href: '/candidates', label: '简历筛选' },
  { href: '/interview', label: '面试管理' },
  { href: '/report', label: '评分报告' },
  { href: '/compare', label: '候选人对比' },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="h-14 glass border-b border-[#e8e4df]/60 flex items-center px-4 md:px-6 shrink-0 z-50">
      <Link href="/" className="flex items-center gap-2.5 mr-8">
        <div className="w-7 h-7 rounded-lg bg-[#c96442] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
            <path d="M5 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
            <path d="M19 16l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L17 18.5l1.5-.5.5-1.5z" />
          </svg>
        </div>
        <span className="text-[16px] font-bold text-[#2d2a26] tracking-tight">智聘 Copilot</span>
      </Link>
      <nav className="hidden md:flex items-center gap-0.5">
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-[14px] font-medium nav-link ${
                active
                  ? 'bg-[#fdf2ee] text-[#c96442]'
                  : 'text-[#8a8580] hover:text-[#2d2a26] hover:bg-[#f5f3f0]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/feishu"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
            pathname === '/feishu'
              ? 'bg-[#fdf2ee] text-[#c96442]'
              : 'text-[#8a8580] hover:text-[#2d2a26] hover:bg-[#f5f3f0]'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
          飞书设置
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f0f7f2] border border-[#c8ddd0]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4a7c59]" />
          <span className="text-[12px] font-medium text-[#3d5e47]">AI 就绪</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#e8e4df] flex items-center justify-center text-[12px] font-bold text-[#5e5a55]">
          HR
        </div>
      </div>
    </header>
  );
}
