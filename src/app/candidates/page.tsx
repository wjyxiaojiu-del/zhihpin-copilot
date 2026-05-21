'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StepBar from '../components/StepBar';
import Badge from '../components/Badge';
import Tag from '../components/Tag';
import { mockCandidates, mockJob, type Candidate } from '../data/mockData';
import { candidatesApi, jobsApi } from '@/lib/api';

const schoolTiers = ['全部', '985', '211', '双非', '二本', '大专'];
const degrees = ['全部', '博士', '硕士', '本科', '大专'];

const tierColors: Record<string, { bg: string; text: string }> = {
  '985': { bg: 'bg-[#e4ede6]', text: 'text-[#3d5e47]' },
  '211': { bg: 'bg-[#fde8df]', text: 'text-[#9a4328]' },
  '双非': { bg: 'bg-[#f3ece2]', text: 'text-[#7a6840]' },
  '二本': { bg: 'bg-[#ece9e5]', text: 'text-[#5e5a55]' },
  '大专': { bg: 'bg-[#fde5e3]', text: 'text-[#8c2e24]' },
};

// 证据链评分组件
function EvidenceScorePanel({ candidate, job }: { candidate: Candidate; job: typeof mockJob }) {
  const [weights, setWeights] = useState({
    hardMatch: 30,
    skillMatch: 25,
    projectMatch: 20,
    salaryMatch: 10,
    stability: 10,
    potential: 5,
  });
  const [showWeightEditor, setShowWeightEditor] = useState(false);

  const rules = job.matchRules!;

  // 证据链评分
  const dimensions = [
    {
      key: 'hardMatch',
      label: '硬性匹配',
      score: calculateHardMatch(candidate, rules),
      evidences: [
        { source: `学历：${candidate.degree}`, score: candidate.degree === '硕士' || candidate.degree === '博士' ? 100 : 70, explanation: `${candidate.degree}学历` },
        { source: `学校：${candidate.school}`, score: candidate.schoolTier === '985' ? 100 : 70, explanation: `${candidate.schoolTier}层次` },
        { source: `经验：${candidate.workYears}年`, score: candidate.workYears >= 3 ? 100 : 60, explanation: `${candidate.workYears}年工作经验` },
      ],
    },
    {
      key: 'skillMatch',
      label: '技能匹配',
      score: calculateSkillMatch(candidate, rules),
      evidences: rules.mustHave.map(s => ({
        source: `技能：${s}`,
        score: candidate.skills.some(cs => cs.includes(s)) ? 100 : 0,
        explanation: candidate.skills.some(cs => cs.includes(s)) ? `掌握 ${s}` : `缺少 ${s}`,
      })),
    },
    {
      key: 'projectMatch',
      label: '项目相关性',
      score: calculateProjectMatch(candidate),
      evidences: candidate.projects.map(p => ({
        source: `项目：${p.name}`,
        score: 80,
        explanation: p.description.substring(0, 80),
      })),
    },
    {
      key: 'salaryMatch',
      label: '薪资匹配',
      score: calculateSalaryMatch(candidate, rules),
      evidences: [{ source: `期望：${candidate.expectedSalary}`, score: 75, explanation: '薪资在合理范围' }],
    },
    {
      key: 'stability',
      label: '稳定性',
      score: candidate.jobHoppingCount === 0 ? 90 : candidate.jobHoppingCount === 1 ? 75 : 50,
      evidences: [{ source: '', score: candidate.jobHoppingCount === 0 ? 90 : 75, explanation: `跳槽${candidate.jobHoppingCount}次` }],
    },
    {
      key: 'potential',
      label: '成长潜力',
      score: candidate.schoolTier === '985' ? 90 : 70,
      evidences: [{ source: '', score: 80, explanation: `${candidate.schoolTier}学校背景` }],
    },
  ];

  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * (weights[d.key as keyof typeof weights] / 100), 0)
  );

  const level = overallScore >= 85 ? '强烈推荐' : overallScore >= 70 ? '推荐' : overallScore >= 55 ? '待观察' : '不推荐';

  return (
    <div className="space-y-4">
      {/* 总分 */}
      <div className={`flex items-center gap-4 p-4 rounded-lg ${
        overallScore >= 85 ? 'bg-[#e4ede6] border border-[#c8ddd0]' :
        overallScore >= 70 ? 'bg-[#f3ece2] border border-[#e0d4be]' :
        'bg-[#fde5e3] border border-[#f0c0bc]'
      }`}>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-bold ${
          overallScore >= 85 ? 'bg-[#4a7c59] text-white' :
          overallScore >= 70 ? 'bg-[#c07d2c] text-white' :
          'bg-[#c0382b] text-white'
        }`}>
          {overallScore}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-[#2d2a26]">综合匹配度</span>
            <Badge level={level} />
          </div>
          <p className="text-[12px] text-[#8a8580] mt-0.5">基于证据链的多维度评分</p>
        </div>
        <button
          onClick={() => setShowWeightEditor(!showWeightEditor)}
          className="px-3 py-1.5 rounded-md border border-[#e8e4df] text-[12px] text-[#5e5a55] hover:border-[#c96442] hover:text-[#c96442] transition-all font-medium"
        >
          {showWeightEditor ? '收起' : '调整权重'}
        </button>
      </div>

      {/* 权重编辑器 */}
      {showWeightEditor && (
        <div className="p-4 rounded-lg bg-[#faf9f7] border border-[#e8e4df] animate-fade-in">
          <h4 className="text-[13px] font-semibold text-[#2d2a26] mb-3">HR 自定义权重</h4>
          <div className="space-y-2.5">
            {dimensions.map(d => (
              <div key={d.key} className="flex items-center gap-3">
                <span className="text-[12px] text-[#5e5a55] w-16 shrink-0">{d.label}</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={weights[d.key as keyof typeof weights]}
                  onChange={e => setWeights({ ...weights, [d.key]: parseInt(e.target.value) })}
                  className="flex-1 h-1.5 bg-[#e8e4df] rounded-full appearance-none cursor-pointer accent-[#c96442]"
                />
                <span className="text-[12px] font-medium text-[#2d2a26] w-8 text-right">{weights[d.key as keyof typeof weights]}%</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-[#e8e4df] flex items-center justify-between">
            <span className="text-[11px] text-[#a8a29e]">总权重：{Object.values(weights).reduce((a, b) => a + b, 0)}%</span>
            <button
              onClick={() => setWeights({ hardMatch: 30, skillMatch: 25, projectMatch: 20, salaryMatch: 10, stability: 10, potential: 5 })}
              className="text-[11px] text-[#c96442] hover:text-[#b85636] font-medium"
            >
              恢复默认
            </button>
          </div>
        </div>
      )}

      {/* 各维度评分 */}
      <div className="space-y-3">
        {dimensions.map(d => {
          const weighted = Math.round(d.score * (weights[d.key as keyof typeof weights] / 100));
          return (
            <div key={d.key}>
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-[13px] font-medium text-[#2d2a26] w-16 shrink-0">{d.label}</span>
                <div className="flex-1 h-2 bg-[#f0ede8] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      d.score >= 85 ? 'bg-[#4a7c59]' : d.score >= 70 ? 'bg-[#c96442]' : d.score >= 60 ? 'bg-[#c07d2c]' : 'bg-[#c0382b]'
                    }`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                <span className="text-[13px] font-bold text-[#2d2a26] w-8 text-right">{d.score}</span>
                <span className="text-[11px] text-[#a8a29e] w-12 text-right">×{weights[d.key as keyof typeof weights]}%</span>
                <span className="text-[12px] font-medium text-[#5e5a55] w-8 text-right">{weighted}</span>
              </div>
              {/* 证据链 */}
              <div className="ml-16 space-y-1">
                {d.evidences.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px]">
                    {e.score >= 80 ? (
                      <svg className="w-3.5 h-3.5 text-[#4a7c59] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : e.score >= 60 ? (
                      <span className="w-3.5 h-3.5 flex items-center justify-center text-[#c07d2c] shrink-0 mt-0.5">~</span>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-[#c0382b] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    )}
                    <span className="text-[#8a8580]">{e.explanation}</span>
                    {e.source && <span className="text-[#a8a29e] ml-auto truncate max-w-[200px]">依据：{e.source}</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function calculateHardMatch(c: Candidate, rules: typeof mockJob.matchRules): number {
  if (!rules) return 70;
  const degreeOrder = ['大专', '本科', '硕士', '博士'];
  const tierOrder = ['大专', '二本', '双非', '211', '985'];
  let score = 0;
  let checks = 0;
  if (degreeOrder.indexOf(c.degree) >= degreeOrder.indexOf(rules.degree)) score += 100; else score += 40;
  checks++;
  if (tierOrder.indexOf(c.schoolTier) >= tierOrder.indexOf(rules.schoolTier)) score += 100; else score += 50;
  checks++;
  if (c.workYears >= rules.minWorkYears) score += 100; else score += 40;
  checks++;
  return Math.round(score / checks);
}

function calculateSkillMatch(c: Candidate, rules: typeof mockJob.matchRules): number {
  if (!rules) return 70;
  const matched = rules.mustHave.filter(s => c.skills.some(cs => cs.includes(s)));
  const niceMatched = rules.niceToHave.filter(s => c.skills.some(cs => cs.includes(s)));
  const mustScore = (matched.length / rules.mustHave.length) * 80;
  const niceScore = (niceMatched.length / rules.niceToHave.length) * 20;
  return Math.min(100, Math.round(mustScore + niceScore));
}

function calculateProjectMatch(c: Candidate): number {
  const text = c.projects.map(p => `${p.name} ${p.description}`).join(' ');
  const keywords = ['React', 'TypeScript', 'Node.js', '性能优化', '架构'];
  const matched = keywords.filter(kw => text.includes(kw));
  return Math.min(100, 50 + matched.length * 12);
}

function calculateSalaryMatch(c: Candidate, rules: typeof mockJob.matchRules): number {
  if (!rules) return 70;
  const match = c.expectedSalary.match(/(\d+)K?-(\d+)K?/i);
  if (!match) return 70;
  const avg = (parseInt(match[1]) + parseInt(match[2])) / 2 * 1000;
  if (avg <= rules.salaryRange[1]) return 90;
  if (avg <= rules.salaryRange[1] * 1.2) return 60;
  return 30;
}

// 简历上传组件
function ResumeUpload({ onUploadDone, jobId }: { onUploadDone: () => void; jobId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [result, setResult] = useState<'idle' | 'done' | 'error'>('idle');

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      /\.(pdf|docx|txt|png|jpg|jpeg|bmp|tiff)$/i.test(f.name)
    );
    if (files.length > 0) handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    setParsing(true);
    setFileNames(files.map(f => f.name));
    setResult('idle');

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('jobId', jobId);

    try {
      const res = await fetch('/api/candidates/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setResult('done');
        onUploadDone();
        setTimeout(() => { setResult('idle'); setFileNames([]); }, 3000);
      } else {
        setResult('error');
      }
    } catch {
      setResult('error');
    } finally {
      setParsing(false);
    }
  };

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragging ? 'border-[#c96442] bg-[#fdf2ee]' : 'border-[#e8e4df] hover:border-[#d5d0ca]'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.bmp,.tiff"
          className="hidden"
          onChange={e => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) handleFiles(files);
          }}
        />
        <svg className="w-8 h-8 mx-auto mb-2 text-[#a8a29e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-[13px] text-[#5e5a55]">拖拽简历文件到此处，或</p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={parsing}
          className="mt-2 px-4 py-1.5 rounded-md bg-[#c96442] text-white text-[12px] font-medium hover:bg-[#b85636] transition-colors disabled:opacity-50"
        >
          {parsing ? '解析中...' : '选择文件'}
        </button>
        <p className="text-[11px] text-[#a8a29e] mt-2">支持 PDF / DOCX / TXT / PNG / JPG，可批量上传</p>
      </div>

      {/* 后台解析浮动提示 */}
      {parsing && (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-xl shadow-lg border border-[#e8e4df] p-4 max-w-[300px] animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="relative w-5 h-5 shrink-0">
              <div className="absolute inset-0 rounded-full border-2 border-[#e8e4df]" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#c96442] animate-spin-slow" />
            </div>
            <div>
              <span className="text-[13px] font-medium text-[#2d2a26]">后台解析中</span>
              <p className="text-[11px] text-[#8a8580]">{fileNames.join('、')}</p>
            </div>
          </div>
          <p className="text-[11px] text-[#a8a29e] mt-2">可以继续浏览其他候选人</p>
        </div>
      )}

      {result === 'done' && !parsing && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#e4ede6] rounded-xl shadow-lg border border-[#c8ddd0] p-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#3d5e47] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            <span className="text-[13px] font-medium text-[#3d5e47]">解析完成，已刷新列表</span>
          </div>
        </div>
      )}

      {result === 'error' && !parsing && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#fde5e3] rounded-xl shadow-lg border border-[#f0c0bc] p-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#8c2e24] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            <span className="text-[13px] text-[#8c2e24]">解析失败，请重试</span>
          </div>
        </div>
      )}
    </>
  );
}

function MatchAnalysis({ candidate, job }: { candidate: Candidate; job: typeof mockJob }) {
  const rules = job.matchRules!;
  const skillMatch = rules.mustHave.filter(s => candidate.skills.some(cs => cs.includes(s)));
  const skillMiss = rules.mustHave.filter(s => !candidate.skills.some(cs => cs.includes(s)));
  const niceMatch = rules.niceToHave.filter(s => candidate.skills.some(cs => cs.includes(s)));

  const tierOrder = ['大专', '二本', '双非', '211', '985'];
  const degreeOrder = ['大专', '本科', '硕士', '博士'];
  const schoolOk = tierOrder.indexOf(candidate.schoolTier) >= tierOrder.indexOf(rules.schoolTier);
  const degreeOk = degreeOrder.indexOf(candidate.degree) >= degreeOrder.indexOf(rules.degree);
  const yearsOk = candidate.workYears >= rules.minWorkYears;

  const checks = [
    { label: '学历要求', pass: degreeOk, detail: `要求${rules.degree}，候选人${candidate.degree}` },
    { label: '学校层次', pass: schoolOk, detail: `要求${rules.schoolTier}+，候选人${candidate.schoolTier}` },
    { label: '工作经验', pass: yearsOk, detail: `要求${rules.minWorkYears}年+，候选人${candidate.workYears}年` },
    { label: '核心技能', pass: skillMiss.length === 0, detail: skillMiss.length > 0 ? `缺少: ${skillMiss.join('、')}` : '全部匹配' },
  ];

  const passCount = checks.filter(c => c.pass).length;

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-3 p-3 rounded-lg ${
        passCount === 4 ? 'bg-[#e4ede6] border border-[#c8ddd0]' :
        passCount >= 2 ? 'bg-[#f3ece2] border border-[#e0d4be]' :
        'bg-[#fde5e3] border border-[#f0c0bc]'
      }`}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold ${
          passCount === 4 ? 'bg-[#4a7c59] text-white' :
          passCount >= 2 ? 'bg-[#c07d2c] text-white' :
          'bg-[#c0382b] text-white'
        }`}>
          {passCount}/{checks.length}
        </div>
        <div>
          <div className={`text-[13px] font-semibold ${
            passCount === 4 ? 'text-[#3d5e47]' : passCount >= 2 ? 'text-[#7a6840]' : 'text-[#8c2e24]'
          }`}>
            {passCount === 4 ? '高度匹配' : passCount >= 2 ? '部分匹配' : '匹配度低'}
          </div>
          <div className="text-[12px] text-[#8a8580]">满足 {passCount}/{checks.length} 项硬性要求</div>
        </div>
      </div>

      <div className="space-y-1.5">
        {checks.map(check => (
          <div key={check.label} className="flex items-center gap-2 text-[13px]">
            {check.pass ? (
              <svg className="w-4 h-4 text-[#4a7c59] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg className="w-4 h-4 text-[#c0382b] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            )}
            <span className={`font-medium ${check.pass ? 'text-[#5e5a55]' : 'text-[#8c2e24]'}`}>{check.label}</span>
            <span className="text-[#a8a29e] ml-auto">{check.detail}</span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-[#f0ede8]">
        <div className="text-[12px] text-[#8a8580] mb-1.5">技能匹配</div>
        <div className="flex flex-wrap gap-1">
          {skillMatch.map(s => <Tag key={s} text={`${s} ✓`} color="green" />)}
          {niceMatch.map(s => <Tag key={s} text={s} color="primary" />)}
          {skillMiss.map(s => <Tag key={s} text={`${s} ✗`} color="red" />)}
        </div>
      </div>

      <div className="pt-2 border-t border-[#f0ede8]">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#8a8580]">薪资期望</span>
          <span className="font-medium text-[#2d2a26]">{candidate.expectedSalary}</span>
        </div>
        <div className="flex items-center justify-between text-[13px] mt-1">
          <span className="text-[#8a8580]">岗位预算</span>
          <span className="font-medium text-[#4a7c59]">{job.generatedJD?.salaryRange}</span>
        </div>
      </div>
    </div>
  );
}

function ResumeModal({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-[700px] w-full max-h-[85vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e4df]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ede8df] flex items-center justify-center text-[14px] font-bold text-[#6b4a30]">
              {candidate.avatar}
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#2d2a26]">{candidate.name} 的简历</h3>
              <p className="text-[12px] text-[#a8a29e]">{candidate.school} · {candidate.degree} · {candidate.major}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#f5f3f0] flex items-center justify-center transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8580" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <pre className="text-[13px] text-[#5e5a55] leading-[1.8] whitespace-pre-wrap font-sans">{candidate.resume}</pre>
        </div>
        <div className="px-6 py-3 border-t border-[#e8e4df] flex justify-between items-center bg-[#faf9f7] rounded-b-xl">
          <span className="text-[12px] text-[#a8a29e]">AI 已完成简历解析</span>
          <button onClick={onClose} className="px-4 py-1.5 text-[13px] text-[#5e5a55] hover:text-[#2d2a26] border border-[#e8e4df] rounded-lg hover:bg-white transition-colors">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function CandidatesContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || 'c001';
  const [selected, setSelected] = useState<string>(initialId);
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('全部');
  const [filterDegree, setFilterDegree] = useState<string>('全部');
  const [showResume, setShowResume] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [apiCandidates, setApiCandidates] = useState<Candidate[]>([]);
  const [apiJob, setApiJob] = useState<typeof mockJob | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [cands, jobs] = await Promise.all([candidatesApi.list(), jobsApi.list()]);
        if (cands.length > 0) {
          const mapped = cands.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: c.name as string,
            avatar: c.avatar as string,
            phone: c.phone as string,
            email: c.email as string,
            age: c.age as number,
            gender: c.gender as string,
            school: c.school as string,
            schoolTier: c.schoolTier as Candidate['schoolTier'],
            degree: c.degree as Candidate['degree'],
            major: c.major as string,
            workYears: c.workYears as number,
            currentCompany: c.currentCompany as string,
            currentTitle: c.currentTitle as string,
            jobHoppingCount: c.jobHoppingCount as number,
            expectedSalary: c.expectedSalary as string,
            background: c.background as string,
            skills: c.skills as string[],
            projects: c.projects as { name: string; description: string }[],
            expectedPosition: c.expectedPosition as string,
            matchScore: (c.evaluations as Array<{ overallScore: number }>)?.[0]?.overallScore ?? 70,
            level: (() => {
              const score = (c.evaluations as Array<{ overallScore: number }>)?.[0]?.overallScore ?? 70;
              return score >= 85 ? '强烈推荐' as const : score >= 70 ? '推荐' as const : score >= 55 ? '待观察' as const : '不推荐' as const;
            })(),
            strengths: [], risks: [], interviewDirection: [],
            score: { matchScore: 70, professional: 70, communication: 70, potential: 70, stability: 70 },
            summary: '',
            resume: (c.resumeText as string) || '',
          })) as Candidate[];
          setApiCandidates(mapped);
        }
        if (jobs.length > 0) {
          const j = jobs[0] as Record<string, unknown>;
          setApiJob({
            id: j.id as string, title: j.title as string, companyType: j.companyType as string,
            headcount: j.headcount as number, responsibilities: j.responsibilities as string,
            requirements: j.requirements as string,
            generatedJD: j.generatedJD as typeof mockJob.generatedJD,
            matchRules: j.matchRules as typeof mockJob.matchRules,
          });
        }
      } catch (e) {
        console.error('Failed to load candidates:', e);
      }
    }
    load();
  }, []);

  const allCandidates = apiCandidates.length > 0 ? apiCandidates : mockCandidates;
  const job = apiJob || mockJob;

  const filtered = allCandidates
    .filter(c => filterLevel === 'all' || c.level === filterLevel)
    .filter(c => filterTier === '全部' || c.schoolTier === filterTier)
    .filter(c => filterDegree === '全部' || c.degree === filterDegree)
    .sort((a, b) => sortBy === 'score' ? b.matchScore - a.matchScore : a.name.localeCompare(b.name));

  const selectedCandidate = allCandidates.find(c => c.id === selected) || allCandidates[0];

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
      <StepBar current={1} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-[#2d2a26]">简历筛选</h1>
          <p className="text-[14px] text-[#8a8580] mt-0.5">AI 已完成 {allCandidates.length} 份简历的智能评估与排序</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c96442] text-white text-[13px] font-medium hover:bg-[#b85636] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          上传简历
        </button>
      </div>

      {/* 上传区域 */}
      {showUpload && (
        <div className="glass-card rounded-lg p-5 mb-4 animate-fade-in">
          <h3 className="text-[14px] font-semibold text-[#2d2a26] mb-3">批量导入简历</h3>
          <ResumeUpload jobId={job.id} onUploadDone={async () => {
            // 上传成功后重新加载候选人列表
            try {
              const cands = await candidatesApi.list();
              if (cands.length > 0) {
                const mapped = cands.map((c: Record<string, unknown>) => ({
                  id: c.id as string,
                  name: c.name as string,
                  avatar: c.avatar as string,
                  school: c.school as string,
                  schoolTier: c.schoolTier as Candidate['schoolTier'],
                  degree: c.degree as Candidate['degree'],
                  major: c.major as string,
                  workYears: c.workYears as number,
                  currentCompany: c.currentCompany as string,
                  currentTitle: c.currentTitle as string,
                  jobHoppingCount: c.jobHoppingCount as number,
                  expectedSalary: c.expectedSalary as string,
                  background: c.background as string,
                  phone: c.phone as string,
                  email: c.email as string,
                  age: c.age as number,
                  gender: c.gender as string,
                  skills: c.skills as string[],
                  projects: c.projects as { name: string; description: string }[],
                  expectedPosition: c.expectedPosition as string,
                  matchScore: (c.evaluations as Array<{ overallScore: number }>)?.[0]?.overallScore ?? 70,
                  level: (() => {
                    const score = (c.evaluations as Array<{ overallScore: number }>)?.[0]?.overallScore ?? 70;
                    return score >= 85 ? '强烈推荐' as const : score >= 70 ? '推荐' as const : score >= 55 ? '待观察' as const : '不推荐' as const;
                  })(),
                  strengths: [], risks: [], interviewDirection: [],
                  score: { matchScore: 70, professional: 70, communication: 70, potential: 70, stability: 70 },
                  summary: '',
                  resume: (c.resumeText as string) || '',
                })) as Candidate[];
                setApiCandidates(mapped);
                // 自动选中最新上传的候选人
                if (mapped.length > 0) setSelected(mapped[0].id);
              }
            } catch (e) {
              console.error('Failed to refresh candidates:', e);
            }
            setShowUpload(false);
          }} />
        </div>
      )}

      {/* Filters */}
      <div className="glass-card rounded-lg p-4 mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-[#8a8580] w-12 shrink-0">推荐度</span>
          {['all', '强烈推荐', '推荐', '待观察', '不推荐'].map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all hover-scale ${
                filterLevel === level
                  ? 'bg-[#c96442] text-white'
                  : 'bg-white border border-[#e8e4df] text-[#5e5a55] hover:border-[#e0a68f]'
              }`}
            >
              {level === 'all' ? '全部' : level}
              {level !== 'all' && (
                <span className="ml-1 opacity-60">{allCandidates.filter(c => c.level === level).length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-[#8a8580] w-12 shrink-0">学校</span>
          {schoolTiers.map(tier => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all hover-scale ${
                filterTier === tier
                  ? 'bg-[#c96442] text-white'
                  : tierColors[tier]
                    ? `${tierColors[tier].bg} ${tierColors[tier].text} border border-transparent`
                    : 'bg-white border border-[#e8e4df] text-[#5e5a55] hover:border-[#e0a68f]'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-[#8a8580] w-12 shrink-0">学历</span>
          {degrees.map(deg => (
            <button
              key={deg}
              onClick={() => setFilterDegree(deg)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all hover-scale ${
                filterDegree === deg
                  ? 'bg-[#c96442] text-white'
                  : 'bg-white border border-[#e8e4df] text-[#5e5a55] hover:border-[#e0a68f]'
              }`}
            >
              {deg}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[12px] text-[#a8a29e]">{filtered.length} 人</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'score' | 'name')}
              className="px-2 py-1 rounded border border-[#e8e4df] text-[12px] bg-white"
            >
              <option value="score">匹配度 ↓</option>
              <option value="name">姓名 A-Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Candidate List */}
        <div className="lg:col-span-3 space-y-2">
          {filtered.length === 0 && (
            <div className="glass-card rounded-lg p-12 text-center">
              <svg className="w-10 h-10 mx-auto mb-3 text-[#d5d0ca]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <p className="text-[14px] text-[#a8a29e]">当前筛选条件下没有候选人</p>
              <button onClick={() => { setFilterLevel('all'); setFilterTier('全部'); setFilterDegree('全部'); }} className="mt-2 text-[13px] text-[#c96442] hover:text-[#b85636] font-medium">清除所有筛选</button>
            </div>
          )}
          {filtered.map((c, i) => {
            const active = selected === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`glass-card rounded-lg p-4 cursor-pointer transition-all hover-lift ${
                  active ? 'border-[#c96442] shadow-sm ring-1 ring-[#f0d5c8]' : 'border-[#e8e4df] hover:border-[#d5d0ca]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-7 h-7 rounded flex items-center justify-center text-[14px] font-bold shrink-0 ${
                    i === 0 ? 'bg-[#c96442] text-white' : i === 1 ? 'bg-[#e0a68f] text-white' : 'bg-[#f0ede8] text-[#a8a29e]'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#ede8df] flex items-center justify-center text-[14px] font-bold text-[#6b4a30] shrink-0">
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[14px] font-semibold text-[#2d2a26]">{c.name}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${tierColors[c.schoolTier]?.bg} ${tierColors[c.schoolTier]?.text}`}>
                        {c.schoolTier}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#f5f3f0] text-[#5e5a55] font-medium">{c.degree}</span>
                      <Badge level={c.level} />
                    </div>
                    <div className="text-[13px] text-[#a8a29e] truncate">{c.school} · {c.major} · {c.workYears}年经验 · {c.currentCompany}</div>
                    <div className="flex gap-1 mt-1.5">
                      {c.skills.slice(0, 4).map(s => <Tag key={s} text={s} color="primary" />)}
                      {c.skills.length > 4 && <Tag text={`+${c.skills.length - 4}`} color="gray" />}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-[20px] font-bold leading-none ${
                      c.matchScore >= 85 ? 'text-[#4a7c59]' : c.matchScore >= 70 ? 'text-[#c96442]' : c.matchScore >= 60 ? 'text-[#c07d2c]' : 'text-[#c0382b]'
                    }`}>
                      {c.matchScore}%
                    </div>
                    <div className="text-[12px] text-[#a8a29e] mt-0.5">匹配度</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-lg sticky top-6">
            <div className="p-5 border-b border-[#e8e4df]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#ede8df] flex items-center justify-center text-[14px] font-bold text-[#6b4a30]">
                  {selectedCandidate.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-bold text-[#2d2a26]">{selectedCandidate.name}</h3>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${tierColors[selectedCandidate.schoolTier]?.bg} ${tierColors[selectedCandidate.schoolTier]?.text}`}>
                      {selectedCandidate.schoolTier}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#f5f3f0] text-[#5e5a55] font-medium">{selectedCandidate.degree}</span>
                  </div>
                  <p className="text-[13px] text-[#a8a29e]">{selectedCandidate.school} · {selectedCandidate.major}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-[28px] font-bold leading-none ${
                    selectedCandidate.matchScore >= 85 ? 'text-[#4a7c59]' : 'text-[#c96442]'
                  }`}>{selectedCandidate.matchScore}%</div>
                  <Badge level={selectedCandidate.level} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] mt-3 pt-3 border-t border-[#f0ede8]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#a8a29e]">年龄</span>
                  <span className="text-[#5e5a55] font-medium">{selectedCandidate.age}岁</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#a8a29e]">经验</span>
                  <span className="text-[#5e5a55] font-medium">{selectedCandidate.workYears}年</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#a8a29e]">公司</span>
                  <span className="text-[#5e5a55] font-medium">{selectedCandidate.currentCompany}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#a8a29e]">跳槽</span>
                  <span className="text-[#5e5a55] font-medium">{selectedCandidate.jobHoppingCount}次</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#a8a29e]">期望</span>
                  <span className="text-[#c96442] font-medium">{selectedCandidate.expectedSalary}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#a8a29e]">电话</span>
                  <span className="text-[#5e5a55] font-medium">{selectedCandidate.phone}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-[#f0ede8]">
                <button
                  onClick={() => setShowResume(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#e8e4df] text-[13px] font-medium text-[#5e5a55] hover:border-[#c96442] hover:text-[#c96442] hover:bg-[#fdf2ee] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  查看简历
                </button>
                <button
                  onClick={() => { setShowEvidence(!showEvidence); setShowMatch(false); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    showEvidence
                      ? 'bg-[#c96442] text-white'
                      : 'border border-[#e8e4df] text-[#5e5a55] hover:border-[#c96442] hover:text-[#c96442] hover:bg-[#fdf2ee]'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /><path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" /></svg>
                  证据链评分
                </button>
                <button
                  onClick={() => { setShowMatch(!showMatch); setShowEvidence(false); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    showMatch
                      ? 'bg-[#c96442] text-white'
                      : 'border border-[#e8e4df] text-[#5e5a55] hover:border-[#c96442] hover:text-[#c96442] hover:bg-[#fdf2ee]'
                  }`}
                >
                  匹配分析
                </button>
              </div>
            </div>

            {/* Evidence Score Panel */}
            {showEvidence && (
              <div className="p-5 border-b border-[#e8e4df] bg-[#faf9f7] animate-fade-in">
                <h4 className="text-[13px] font-semibold text-[#2d2a26] mb-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c96442" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /></svg>
                  证据链评分引擎
                </h4>
                <EvidenceScorePanel candidate={selectedCandidate} job={job} />
              </div>
            )}

            {/* AI Match Analysis */}
            {showMatch && (
              <div className="p-5 border-b border-[#e8e4df] bg-[#faf9f7] animate-fade-in">
                <h4 className="text-[13px] font-semibold text-[#2d2a26] mb-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c96442" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /></svg>
                  岗位匹配分析
                </h4>
                <MatchAnalysis candidate={selectedCandidate} job={job} />
              </div>
            )}

            <div className="p-5 space-y-4 max-h-[calc(100vh-400px)] overflow-auto">
              <DetailSection title="技能标签">
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills.map(s => {
                    const jdSkills = [...(job.matchRules?.mustHave || []), ...(job.matchRules?.niceToHave || [])];
                    const match = jdSkills.some(js => s.includes(js));
                    return <Tag key={s} text={s} color={match ? 'primary' : 'gray'} />;
                  })}
                </div>
              </DetailSection>

              <DetailSection title="项目经历">
                {selectedCandidate.projects.map(p => (
                  <div key={p.name} className="py-2 border-b border-[#f0ede8] last:border-0">
                    <span className="text-[13px] font-medium text-[#2d2a26]">{p.name}</span>
                    <p className="text-[13px] text-[#8a8580] mt-0.5">{p.description}</p>
                  </div>
                ))}
              </DetailSection>

              <DetailSection title="核心优势" color="green">
                {selectedCandidate.strengths.map(s => (
                  <div key={s} className="flex items-start gap-2 text-[13px] text-[#5e5a55]">
                    <svg className="w-3.5 h-3.5 text-[#4a7c59] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {s}
                  </div>
                ))}
              </DetailSection>

              <DetailSection title="潜在风险" color="red">
                {selectedCandidate.risks.map(r => (
                  <div key={r} className="flex items-start gap-2 text-[13px] text-[#5e5a55]">
                    <svg className="w-3.5 h-3.5 text-[#c0382b] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    {r}
                  </div>
                ))}
              </DetailSection>
            </div>

            <div className="p-4 border-t border-[#e8e4df] flex gap-2">
              <Link href={`/interview?id=${selected}`} className="flex-1 py-2 bg-[#c96442] hover:bg-[#b85636] text-white rounded-md text-[13px] font-medium text-center transition-colors">
                生成面试题
              </Link>
              <Link href={`/report?id=${selected}`} className="flex-1 py-2 border border-[#e8e4df] text-[#5e5a55] rounded-md text-[13px] font-medium text-center hover:bg-[#f9f8f6] transition-colors">
                评分报告
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showResume && <ResumeModal candidate={selectedCandidate} onClose={() => setShowResume(false)} />}
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<div className="max-w-[1200px] mx-auto px-6 py-6"><StepBar current={1} /></div>}>
      <CandidatesContent />
    </Suspense>
  );
}

function DetailSection({ title, color, children }: { title: string; color?: string; children: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    green: 'text-[#3d5e47]',
    red: 'text-[#8c2e24]',
    yellow: 'text-[#7a6840]',
  };
  return (
    <div>
      <h4 className={`text-[13px] font-semibold uppercase tracking-wider mb-2 ${colorMap[color || ''] || 'text-[#8a8580]'}`}>
        {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
