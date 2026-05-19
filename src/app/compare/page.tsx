'use client';

import { useState } from 'react';
import Link from 'next/link';
import StepBar from '../components/StepBar';
import Badge from '../components/Badge';
import Tag from '../components/Tag';
import { mockCandidates } from '../data/mockData';
import FeishuPush from '../components/FeishuPush';

const dims = [
  { key: 'matchScore' as const, label: '岗位匹配' },
  { key: 'professional' as const, label: '专业能力' },
  { key: 'communication' as const, label: '沟通表达' },
  { key: 'potential' as const, label: '成长潜力' },
  { key: 'stability' as const, label: '稳定性' },
];

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>(['c001', 'c002', 'c003']);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const comparing = mockCandidates.filter(c => selected.includes(c.id));
  const topId = comparing.length > 0 ? comparing.reduce((a, b) => a.matchScore >= b.matchScore ? a : b).id : '';

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6">
      <StepBar current={4} />

      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-[#2d2a26]">候选人对比</h1>
        <p className="text-[14px] text-[#8a8580] mt-0.5">多维度横向对比，快速锁定最佳人选</p>
      </div>

      {/* Selector */}
      <div className="glass-card rounded-lg p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-[#2d2a26]">选择对比候选人（2-4 位）</h2>
          <span className="text-[14px] text-[#a8a29e]">已选 {selected.length} 位</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {mockCandidates.map(c => {
            const active = selected.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md border text-[14px] transition-all hover-scale ${
                  active
                    ? 'border-[#c96442] bg-[#fdf2ee] text-[#9a4328]'
                    : 'border-[#e8e4df] text-[#8a8580] hover:border-[#d5d0ca] hover:bg-[#faf9f7]'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[14px] font-bold ${
                  active ? 'bg-[#c96442] text-white' : 'bg-[#e8e4df] text-[#8a8580]'
                }`}>
                  {c.avatar}
                </div>
                <span className="font-medium">{c.name}</span>
                {active && <svg className="w-3.5 h-3.5 text-[#c96442]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </button>
            );
          })}
        </div>
      </div>

      {comparing.length < 2 ? (
        <div className="bg-white rounded-lg border border-[#e8e4df] p-16 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-[#d5d0ca]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
          <p className="text-[14px] text-[#a8a29e]">请至少选择 2 位候选人进行对比</p>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* Profile Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {comparing.map(c => {
              const isTop = c.id === topId;
              return (
                <div key={c.id} className={`glass-card rounded-lg p-4 relative ${isTop ? 'border-[#c96442] ring-1 ring-[#f0d5c8]' : 'border-[#e8e4df]'}`}>
                  {isTop && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#c96442] text-white text-[11px] font-bold rounded">
                      最佳推荐
                    </div>
                  )}
                  <div className="flex flex-col items-center pt-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold mb-2 ${
                      isTop ? 'bg-[#c96442] text-white' : 'bg-[#ede8df] text-[#6b4a30]'
                    }`}>
                      {c.avatar}
                    </div>
                    <h3 className="text-[14px] font-bold text-[#2d2a26]">{c.name}</h3>
                    <p className="text-[14px] text-[#a8a29e] mb-2">{c.school} · {c.degree}</p>
                    <div className={`text-[28px] font-bold leading-none ${isTop ? 'text-[#c96442]' : 'text-[#5e5a55]'}`}>
                      {c.matchScore}%
                    </div>
                    <div className="mt-1.5"><Badge level={c.level} /></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dimension Table */}
          <div className="glass-card rounded-lg overflow-x-auto">
            <div className="px-5 py-3 border-b border-[#e8e4df] bg-[#faf9f7]">
              <h3 className="text-[14px] font-semibold text-[#2d2a26]">维度对比</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f0ede8]">
                  <th className="text-left px-5 py-2.5 text-[14px] text-[#a8a29e] font-medium w-28">评估维度</th>
                  {comparing.map(c => (
                    <th key={c.id} className="text-center px-3 py-2.5 text-[14px] text-[#a8a29e] font-medium">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dims.map(dim => {
                  const values = comparing.map(c => c.score[dim.key]);
                  const maxVal = Math.max(...values);
                  return (
                    <tr key={dim.key} className="border-b border-[#f9f8f6] hover:bg-[#faf9f7] transition-colors">
                      <td className="px-5 py-3 text-[14px] text-[#5e5a55] font-medium">{dim.label}</td>
                      {comparing.map(c => {
                        const val = c.score[dim.key];
                        const isMax = val === maxVal;
                        return (
                          <td key={c.id} className="text-center px-3 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-14 h-1.5 bg-[#f0ede8] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${isMax ? 'bg-[#c96442]' : 'bg-[#d5d0ca]'}`} style={{ width: `${val}%` }} />
                              </div>
                              <span className={`text-[14px] font-semibold w-8 text-right ${isMax ? 'text-[#c96442]' : 'text-[#a8a29e]'}`}>
                                {val}
                              </span>
                              {isMax && <span className="text-[14px] text-[#c96442]">★</span>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Skills & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-lg p-4">
              <h3 className="text-[14px] font-semibold text-[#2d2a26] mb-3">技能覆盖</h3>
              <div className="space-y-3">
                {comparing.map(c => (
                  <div key={c.id}>
                    <p className="text-[14px] text-[#8a8580] mb-1.5 font-medium">{c.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {c.skills.map(s => <Tag key={s} text={s} color="primary" />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-lg p-4">
              <h3 className="text-[14px] font-semibold text-[#2d2a26] mb-3">风险点</h3>
              <div className="space-y-3">
                {comparing.map(c => (
                  <div key={c.id}>
                    <p className="text-[14px] text-[#8a8580] mb-1.5 font-medium">{c.name}</p>
                    <ul className="space-y-1">
                      {c.risks.map(r => (
                        <li key={r} className="text-[14px] text-[#8a8580] flex items-start gap-1.5">
                          <span className="text-[#c0382b] mt-0.5 shrink-0">!</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="glass-card rounded-lg p-5">
            <h3 className="text-[14px] font-semibold text-[#2d2a26] mb-4 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8580" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              AI 综合推荐
            </h3>
            <div className="space-y-3">
              {comparing
                .sort((a, b) => b.matchScore - a.matchScore)
                .map((c, i) => (
                  <div key={c.id} className={`flex items-start gap-4 p-4 rounded-md ${i === 0 ? 'glass-panel' : 'bg-[#faf9f7] border border-[#f0ede8]'}`}>
                    <div className={`w-7 h-7 rounded flex items-center justify-center text-[14px] font-bold shrink-0 ${i === 0 ? 'bg-[#c96442] text-white' : 'bg-[#e8e4df] text-[#8a8580]'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-semibold text-[#2d2a26]">{c.name}</span>
                        <Badge level={c.level} />
                      </div>
                      <p className="text-[14px] text-[#8a8580] leading-relaxed">{c.summary}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-[20px] font-bold ${i === 0 ? 'text-[#c96442]' : 'text-[#a8a29e]'}`}>{c.matchScore}%</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Link href="/" className="btn-primary text-[14px] px-5 py-2">
                返回工作台
              </Link>
              <button className="btn-ghost text-[14px] px-5 py-2 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                导出报告
              </button>
            </div>
            <FeishuPush
              type="candidate"
              title="候选人对比报告"
              content={comparing.sort((a,b) => b.matchScore - a.matchScore).map((c, i) => `${i+1}. ${c.name} | 匹配度: ${c.matchScore}% | ${c.level}\n   优势: ${c.strengths.join('、')}`).join('\n\n')}
            />
          </div>
        </div>
      )}
    </div>
  );
}
