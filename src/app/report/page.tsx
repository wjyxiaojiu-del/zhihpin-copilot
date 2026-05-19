'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StepBar from '../components/StepBar';
import Badge from '../components/Badge';
import Tag from '../components/Tag';
import { mockCandidates } from '../data/mockData';
import FeishuPush from '../components/FeishuPush';
import FeishuDoc from '../components/FeishuDoc';

const dimensions = [
  { key: 'matchScore' as const, label: '岗位匹配', desc: '与 JD 要求的吻合程度' },
  { key: 'professional' as const, label: '专业能力', desc: '技术深度与工程能力' },
  { key: 'communication' as const, label: '沟通表达', desc: '表达清晰度与协作能力' },
  { key: 'potential' as const, label: '成长潜力', desc: '学习能力与发展空间' },
  { key: 'stability' as const, label: '稳定性', desc: '在职时长与跳槽频率' },
];

function getScoreLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 85) return { label: '优秀', color: 'text-[#3d5e47]', bg: 'bg-[#e4ede6]' };
  if (score >= 70) return { label: '良好', color: 'text-[#9a4328]', bg: 'bg-[#dbeafe]' };
  if (score >= 60) return { label: '一般', color: 'text-[#7a6840]', bg: 'bg-[#f3ece2]' };
  return { label: '较弱', color: 'text-[#8c2e24]', bg: 'bg-[#fde5e3]' };
}

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const dims = [
    { key: 'matchScore', angle: -90 },
    { key: 'professional', angle: -18 },
    { key: 'communication', angle: 54 },
    { key: 'potential', angle: 126 },
    { key: 'stability', angle: 198 },
  ];
  const cx = 110, cy = 110, r = 70;
  const pt = (angle: number, ratio: number) => {
    const rad = (angle * Math.PI) / 180;
    return [cx + r * ratio * Math.cos(rad), cy + r * ratio * Math.sin(rad)];
  };

  const points = dims.map(d => {
    const val = (scores[d.key] || 0) / 100;
    return pt(d.angle, val);
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';

  return (
    <svg viewBox="0 0 220 220" className="w-[200px] h-[200px]">
      {/* Grid rings */}
      {[0.2, 0.4, 0.6, 0.8, 1.0].map(s => (
        <polygon
          key={s}
          points={dims.map(d => pt(d.angle, s).join(',')).join(' ')}
          fill="none" stroke="#e8e4df" strokeWidth={0.5}
        />
      ))}
      {/* Axes + labels */}
      {dims.map((d, i) => {
        const end = pt(d.angle, 1);
        const label = pt(d.angle, 1.22);
        const dimLabel = dimensions[i].label;
        return (
          <g key={d.key}>
            <line x1={cx} y1={cy} x2={end[0]} y2={end[1]} stroke="#e8e4df" strokeWidth={0.5} />
            <text x={label[0]} y={label[1]} textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-[#8a8580]" style={{ fontSize: 9 }}>
              {dimLabel}
            </text>
          </g>
        );
      })}
      {/* Data area */}
      <path d={path} fill="rgba(201,100,66,0.1)" stroke="#c96442" strokeWidth={1.5} />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="#c96442" />
      ))}
    </svg>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || 'c001';
  const [selectedId, setSelectedId] = useState(initialId);
  const candidate = mockCandidates.find(c => c.id === selectedId) || mockCandidates[0];

  const overallLevel = getScoreLevel(candidate.matchScore);

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6">
      <StepBar current={3} />

      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-[#2d2a26]">候选人评分报告</h1>
        <p className="text-[14px] text-[#8a8580] mt-0.5">AI 多维度结构化评估，辅助录用决策</p>
      </div>

      {/* Candidate Tabs */}
      <div className="flex gap-1.5 mb-5 bg-white rounded-lg border border-[#e8e4df] p-1.5 inline-flex">
        {mockCandidates.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[14px] transition-all ${
              selectedId === c.id
                ? 'bg-[#c96442] text-white font-medium'
                : 'text-[#8a8580] hover:text-[#2d2a26] hover:bg-[#f0ede8]'
            }`}
          >
            <span className="font-medium">{c.name}</span>
            <span className={`text-[14px] ${selectedId === c.id ? 'text-blue-200' : 'text-[#a8a29e]'}`}>{c.matchScore}%</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Profile + Radar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profile Card */}
          <div className="glass-card rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-[#ede8df] flex items-center justify-center text-[20px] font-bold text-[#6b4a30]">
                {candidate.avatar}
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[#2d2a26]">{candidate.name}</h3>
                <p className="text-[14px] text-[#a8a29e]">{candidate.school} · {candidate.degree} · {candidate.major}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge level={candidate.level} />
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#f5f3f0] text-[#5e5a55] font-medium">{candidate.schoolTier}</span>
                </div>
              </div>
            </div>
            <p className="text-[14px] text-[#5e5a55] mb-4">{candidate.background}</p>

            {/* Radar */}
            <div className="flex justify-center">
              <RadarChart scores={candidate.score} />
            </div>

            {/* Overall Score */}
            <div className="text-center mt-3 pt-3 border-t border-[#f0ede8]">
              <div className="text-[28px] font-bold text-[#c96442] leading-none">{candidate.matchScore}%</div>
              <div className="text-[14px] text-[#a8a29e] mt-1">综合匹配度</div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="glass-card rounded-lg p-5">
            <h4 className="text-[14px] font-semibold text-[#2d2a26] mb-3 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8580" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /><path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" /><path d="M11 17v.01" /><path d="M7 14v.01" /></svg>
              AI 综合评价
            </h4>
            <p className="text-[14px] text-[#5e5a55] leading-[1.8]">{candidate.summary}</p>
            <div className="mt-4 pt-3 border-t border-[#f0ede8] flex items-center justify-between">
              <span className="text-[14px] text-[#8a8580]">录用建议</span>
              <Badge level={candidate.level} />
            </div>
          </div>
        </div>

        {/* Right: Scores + Details */}
        <div className="lg:col-span-3 space-y-4">
          {/* Score Breakdown */}
          <div className="glass-card rounded-lg p-5">
            <h3 className="text-[14px] font-semibold text-[#2d2a26] mb-4">评分明细</h3>
            <div className="space-y-3">
              {dimensions.map(dim => {
                const score = candidate.score[dim.key];
                const level = getScoreLevel(score);
                return (
                  <div key={dim.key} className="flex items-center gap-4">
                    <div className="w-16 shrink-0">
                      <div className="text-[14px] font-medium text-[#2d2a26]">{dim.label}</div>
                      <div className="text-[14px] text-[#a8a29e]">{dim.desc}</div>
                    </div>
                    <div className="flex-1 h-2 bg-[#f0ede8] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          score >= 85 ? 'bg-[#4a7c59]' : score >= 70 ? 'bg-[#c96442]' : score >= 60 ? 'bg-[#c07d2c]' : 'bg-[#c0382b]'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="w-12 text-right">
                      <span className="text-[14px] font-bold text-[#2d2a26]">{score}</span>
                    </div>
                    <span className={`text-[14px] px-1.5 py-0.5 rounded font-medium ${level.bg} ${level.color}`}>
                      {level.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-lg p-5">
              <h4 className="text-[14px] font-semibold text-[#3d5e47] mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59]" />
                核心优势
              </h4>
              <ul className="space-y-2">
                {candidate.strengths.map(s => (
                  <li key={s} className="text-[14px] text-[#5e5a55] flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-[#4a7c59] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-lg p-5">
              <h4 className="text-[14px] font-semibold text-[#8c2e24] mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c0382b]" />
                潜在风险
              </h4>
              <ul className="space-y-2">
                {candidate.risks.map(r => (
                  <li key={r} className="text-[14px] text-[#5e5a55] flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-[#c0382b] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interview Direction + Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-lg p-5">
              <h4 className="text-[14px] font-semibold text-[#7a6840] mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c07d2c]" />
                建议面试方向
              </h4>
              <div className="space-y-1.5">
                {candidate.interviewDirection.map(d => (
                  <div key={d} className="text-[14px] text-[#5e5a55] flex items-start gap-2">
                    <span className="text-[#c07d2c] shrink-0">▸</span>{d}
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-lg p-5">
              <h4 className="text-[14px] font-semibold text-[#8a8580] mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a8a29e]" />
                技能覆盖
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map(s => {
                  const jdSkills = ['React', 'TypeScript', 'Node.js', 'Webpack', 'Vue'];
                  const match = jdSkills.some(js => s.includes(js));
                  return <Tag key={s} text={s} color={match ? 'primary' : 'gray'} />;
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Link href="/compare" className="btn-primary text-[14px] px-5 py-2">
                候选人对比 →
              </Link>
              <Link href="/interview" className="btn-ghost text-[14px] px-5 py-2">
                ← 返回面试题
              </Link>
            </div>
            <div className="flex gap-2">
              <FeishuDoc
                title={`${candidate.name} - 评分报告`}
                content={`候选人: ${candidate.name}\n学校: ${candidate.school}\n匹配度: ${candidate.matchScore}%\n评级: ${candidate.level}\n\n优势: ${candidate.strengths.join('、')}\n风险: ${candidate.risks.join('、')}\n\n评语: ${candidate.summary}`}
                docType="report"
              />
              <FeishuPush
                type="report"
                title={`${candidate.name} - 评分报告`}
                content={`候选人: ${candidate.name}\n匹配度: ${candidate.matchScore}%\n评级: ${candidate.level}\n优势: ${candidate.strengths.join('、')}\n风险: ${candidate.risks.join('、')}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="max-w-[1100px] mx-auto px-6 py-6"><StepBar current={3} /></div>}>
      <ReportContent />
    </Suspense>
  );
}
