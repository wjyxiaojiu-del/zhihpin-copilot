'use client';

import { useState } from 'react';
import Link from 'next/link';
import StepBar from '../components/StepBar';
import Tag from '../components/Tag';
import FeishuPush from '../components/FeishuPush';
import FeishuDoc from '../components/FeishuDoc';
import { jobsApi } from '@/lib/api';

interface GeneratedMatchRules {
  mustHave: string[];
  niceToHave: string[];
  eliminationCriteria: string[];
  interviewFocus: { topic: string; verification: string }[];
  salaryRange: string;
}

export default function CreateJobPage() {
  const [form, setForm] = useState({
    title: '前端开发工程师',
    companyType: '互联网科技公司',
    headcount: '2',
    responsibilities: '负责公司核心产品的前端开发与维护',
    requirements: '3年以上前端开发经验，熟悉 React/TypeScript',
    city: '北京',
    industry: '互联网',
  });
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [matchRules, setMatchRules] = useState<GeneratedMatchRules | null>(null);
  const [activeTab, setActiveTab] = useState<'jd' | 'rules'>('jd');
  const [generatedJD, setGeneratedJD] = useState<{
    responsibilities: string[];
    requirements: string[];
    bonuses: string[];
    salaryRange: string;
  }>({
    responsibilities: ['正在生成...'],
    requirements: [],
    bonuses: [],
    salaryRange: '',
  });
  const [aiPowered, setAiPowered] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setGenerated(false);
    setMatchRules(null);
    try {
      const result = await jobsApi.generate(form) as Record<string, unknown>;
      const jd = result.generatedJD as typeof generatedJD;
      const rules = result.matchRules as Record<string, unknown>;
      setGeneratedJD(jd);
      setMatchRules({
        mustHave: (rules.mustHave as string[]) || [],
        niceToHave: (rules.niceToHave as string[]) || [],
        eliminationCriteria: (rules.eliminationCriteria as string[]) || [],
        interviewFocus: ((rules.interviewFocus as string[]) || []).map(t => ({ topic: t, verification: '' })),
        salaryRange: jd.salaryRange || '',
      });
      setAiPowered(result.aiPowered as boolean);
      setGenerated(true);
    } catch {
      // fallback
      setGeneratedJD({
        responsibilities: [
          `负责${form.title}相关的日常工作`,
          '参与团队技术方案讨论与评审',
          '编写高质量代码并参与代码评审',
        ],
        requirements: ['本科及以上学历', '具备相关领域工作经验', '良好的沟通能力'],
        bonuses: ['有大型项目经验', '有技术博客或开源贡献'],
        salaryRange: '面议',
      });
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6">
      <StepBar current={0} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-[#2d2a26]">创建岗位</h1>
          <p className="text-[14px] text-[#8a8580] mt-0.5">填写基础信息，AI 自动生成结构化岗位 JD 和匹配规则</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-lg p-5 hover-glow">
            <h2 className="text-[14px] font-semibold text-[#2d2a26] mb-4 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8580" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              岗位信息
            </h2>
            <div className="space-y-3.5">
              <div>
                <label className="block text-[14px] text-[#5e5a55] mb-1.5 font-medium">岗位名称 *</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-[#e8e4df] text-[14px] transition-all"
                  placeholder="例：前端开发工程师"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] text-[#5e5a55] mb-1.5 font-medium">公司类型</label>
                  <select
                    value={form.companyType}
                    onChange={e => setForm({ ...form, companyType: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#e8e4df] text-[14px] bg-white transition-all"
                  >
                    <option>互联网科技公司</option>
                    <option>传统企业</option>
                    <option>创业公司</option>
                    <option>外企</option>
                    <option>国企/央企</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] text-[#5e5a55] mb-1.5 font-medium">招聘人数</label>
                  <input
                    type="number"
                    value={form.headcount}
                    onChange={e => setForm({ ...form, headcount: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#e8e4df] text-[14px] transition-all"
                    min="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] text-[#5e5a55] mb-1.5 font-medium">工作城市</label>
                  <input
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#e8e4df] text-[14px] transition-all"
                    placeholder="例：北京"
                  />
                </div>
                <div>
                  <label className="block text-[14px] text-[#5e5a55] mb-1.5 font-medium">行业</label>
                  <select
                    value={form.industry}
                    onChange={e => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#e8e4df] text-[14px] bg-white transition-all"
                  >
                    <option>互联网</option>
                    <option>金融</option>
                    <option>医疗</option>
                    <option>教育</option>
                    <option>制造业</option>
                    <option>电商</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[14px] text-[#5e5a55] mb-1.5 font-medium">核心职责</label>
                <textarea
                  value={form.responsibilities}
                  onChange={e => setForm({ ...form, responsibilities: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-[#e8e4df] text-[14px] resize-none transition-all"
                  placeholder="简要描述岗位的核心工作内容"
                />
              </div>
              <div>
                <label className="block text-[14px] text-[#5e5a55] mb-1.5 font-medium">候选人要求</label>
                <textarea
                  value={form.requirements}
                  onChange={e => setForm({ ...form, requirements: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-[#e8e4df] text-[14px] resize-none transition-all"
                  placeholder="简要描述对候选人的基本要求"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-2.5 btn-primary text-[14px] disabled:opacity-50 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin-slow w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI 分析中...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                    AI 生成岗位画像
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-lg p-5 min-h-[500px] hover-glow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-[#2d2a26] flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8580" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                生成结果
              </h2>
              {generated && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setActiveTab('jd')}
                    className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                      activeTab === 'jd' ? 'bg-[#c96442] text-white' : 'bg-[#f5f3f0] text-[#8a8580] hover:bg-[#ece9e5]'
                    }`}
                  >
                    岗位 JD
                  </button>
                  <button
                    onClick={() => setActiveTab('rules')}
                    className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                      activeTab === 'rules' ? 'bg-[#c96442] text-white' : 'bg-[#f5f3f0] text-[#8a8580] hover:bg-[#ece9e5]'
                    }`}
                  >
                    匹配规则
                  </button>
                </div>
              )}
            </div>

            {/* Empty State */}
            {!generated && !loading && (
              <div className="flex flex-col items-center justify-center h-80 text-[#a8a29e]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                <p className="text-[14px]">填写左侧信息后点击「AI 生成岗位画像」</p>
                <p className="text-[12px] mt-1">AI 将自动生成 JD、匹配规则和面试重点</p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center h-80">
                <div className="relative w-12 h-12 mb-4">
                  <div className="absolute inset-0 rounded-full border-[3px] border-[#e8e4df]" />
                  <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#c96442] animate-spin-slow" />
                </div>
                <p className="text-[14px] text-[#5e5a55] font-medium">AI 正在分析岗位需求...</p>
                <div className="mt-3 w-48">
                  <div className="h-1 bg-[#e8e4df] rounded-full overflow-hidden">
                    <div className="h-full bg-[#c96442] rounded-full animate-shimmer" style={{ width: '60%' }} />
                  </div>
                </div>
                <p className="text-[12px] text-[#a8a29e] mt-2">生成 JD + 匹配规则 + 面试重点</p>
              </div>
            )}

            {/* JD Tab */}
            {generated && activeTab === 'jd' && (
              <div className="animate-fade-in space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-[#e8e4df]">
                  <div className="w-10 h-10 rounded-md bg-[#fdf2ee] flex items-center justify-center text-[#c96442]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-bold text-[#2d2a26]">{form.title}</h3>
                    <p className="text-[12px] text-[#a8a29e]">{form.companyType} · {form.city} · 招 {form.headcount} 人</p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#e4ede6] text-[#3d5e47] font-medium flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    AI 已生成
                  </span>
                </div>

                {/* Responsibilities */}
                <Section title="岗位职责" color="blue">
                  {generatedJD.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#e0a68f] mt-1 shrink-0">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </Section>

                {/* Requirements */}
                <Section title="任职要求" color="blue">
                  {generatedJD.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#e0a68f] mt-1 shrink-0">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </Section>

                {/* Bonuses */}
                <div>
                  <h3 className="text-[13px] font-semibold text-[#3d5e47] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-[#4a7c59] rounded-full" />
                    加分项
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedJD.bonuses.map((b, i) => <Tag key={i} text={b} color="green" />)}
                  </div>
                </div>

                {/* Salary */}
                <div className="flex items-center gap-3 pt-3 border-t border-[#e8e4df]">
                  <span className="text-[13px] text-[#8a8580]">推荐薪资范围</span>
                  <span className="text-[15px] font-bold text-[#4a7c59]">{generatedJD.salaryRange}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-3">
                    <Link href="/candidates" className="btn-primary text-[14px] px-5 py-2">
                      下一步：筛选简历 →
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <FeishuDoc title={`${form.title} - 岗位 JD`} content={generatedJD.responsibilities.join('\n')} docType="jd" />
                    <FeishuPush type="jd" title={`${form.title} - 岗位 JD`} content={`岗位: ${form.title}\n薪资: ${generatedJD.salaryRange}`} />
                  </div>
                </div>
              </div>
            )}

            {/* Match Rules Tab */}
            {generated && activeTab === 'rules' && matchRules && (
              <div className="animate-fade-in space-y-5">
                {/* Must Have */}
                <div>
                  <h3 className="text-[13px] font-semibold text-[#8c2e24] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-[#c0382b] rounded-full" />
                    硬性条件（必须满足）
                  </h3>
                  <div className="space-y-1.5">
                    {matchRules.mustHave.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-[13px] text-[#5e5a55]">
                        <svg className="w-4 h-4 text-[#c0382b] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nice to Have */}
                <div>
                  <h3 className="text-[13px] font-semibold text-[#3d5e47] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-[#4a7c59] rounded-full" />
                    加分项
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {matchRules.niceToHave.map((r, i) => <Tag key={i} text={r} color="green" />)}
                  </div>
                </div>

                {/* Elimination Criteria */}
                <div>
                  <h3 className="text-[13px] font-semibold text-[#7a6840] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-[#c07d2c] rounded-full" />
                    淘汰项（命中任一直接淘汰）
                  </h3>
                  <div className="space-y-1.5">
                    {matchRules.eliminationCriteria.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-[13px] text-[#5e5a55]">
                        <svg className="w-4 h-4 text-[#c07d2c] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interview Focus */}
                <div>
                  <h3 className="text-[13px] font-semibold text-[#9a4328] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-[#c96442] rounded-full" />
                    面试重点（每项对应验证方式）
                  </h3>
                  <div className="space-y-2">
                    {matchRules.interviewFocus.map((f, i) => (
                      <div key={i} className="p-3 rounded-lg bg-[#fdf2ee] border border-[#e8d5cc]">
                        <div className="text-[13px] font-semibold text-[#9a4328] mb-1">{f.topic}</div>
                        <div className="text-[12px] text-[#5e5a55]">验证方式：{f.verification}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const colorMap: Record<string, { bar: string; text: string }> = {
    blue: { bar: 'bg-[#c96442]', text: 'text-[#9a4328]' },
    yellow: { bar: 'bg-[#c07d2c]', text: 'text-[#7a6840]' },
  };
  const s = colorMap[color] || colorMap.blue;
  return (
    <div>
      <h3 className={`text-[13px] font-semibold ${s.text} uppercase tracking-wide mb-2 flex items-center gap-1.5`}>
        <span className={`w-1 h-3 ${s.bar} rounded-full`} />
        {title}
      </h3>
      <ul className="space-y-1.5 text-[14px] text-[#5e5a55] leading-[1.7]">{children}</ul>
    </div>
  );
}
