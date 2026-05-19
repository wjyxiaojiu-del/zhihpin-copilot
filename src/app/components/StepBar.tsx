'use client';

import Link from 'next/link';

const steps = [
  { label: '创建岗位', href: '/create-job' },
  { label: '简历筛选', href: '/candidates' },
  { label: '面试辅助', href: '/interview' },
  { label: '评分报告', href: '/report' },
  { label: '对比决策', href: '/compare' },
];

export default function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-6 glass-card rounded-xl p-3">
      {steps.map((step, i) => (
        <div key={step.href} className="flex items-center flex-1">
          <Link href={step.href} className="flex items-center gap-2 min-w-0 group">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-transform group-hover:scale-110 ${
              i < current
                ? 'bg-[#4a7c59] text-white'
                : i === current
                ? 'bg-[#c96442] text-white'
                : 'bg-[#ece9e5] text-[#8a8580] group-hover:bg-[#d5d0ca]'
            }`}>
              {i < current ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : i + 1}
            </div>
            <span className={`text-[13px] font-medium truncate transition-colors ${i === current ? 'text-[#c96442]' : i < current ? 'text-[#4a7c59]' : 'text-[#8a8580] group-hover:text-[#5e5a55]'}`}>
              {step.label}
            </span>
          </Link>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-3 ${i < current ? 'bg-[#4a7c59]' : 'bg-[#e8e4df]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
