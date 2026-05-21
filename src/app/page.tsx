'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { candidatesApi, todosApi } from '@/lib/api';

interface Candidate {
  id: string;
  name: string;
  avatar: string;
  school: string;
  schoolTier: string;
  degree: string;
  workYears: number;
  stage: string;
  skills: string[];
  evaluations?: Array<{ overallScore: number }>;
}

interface TodoItem {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  candidateName?: string;
  actionLabel: string;
  actionHref: string;
  createdAt: string;
}

const stageLabels: Record<string, string> = {
  applied: '已投递',
  screened: 'AI 筛选',
  interview: '面试中',
  offer: '已发 Offer',
  hired: '已入职',
};

const stageColors: Record<string, string> = {
  applied: 'bg-[#ece9e5] text-[#5e5a55]',
  screened: 'bg-[#f3ece2] text-[#7a6840]',
  interview: 'bg-[#fdf2ee] text-[#9a4328]',
  offer: 'bg-[#e4ede6] text-[#3d5e47]',
  hired: 'bg-[#d4edda] text-[#2d7a4f]',
};

const priorityConfig: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  urgent: { bg: 'bg-[#fde5e3]', text: 'text-[#8c2e24]', border: 'border-[#f0c0bc]', dot: 'bg-[#c0382b]', label: '紧急' },
  high: { bg: 'bg-[#fdf2ee]', text: 'text-[#9a4328]', border: 'border-[#e8d5cc]', dot: 'bg-[#c96442]', label: '重要' },
  medium: { bg: 'bg-[#f3ece2]', text: 'text-[#7a6840]', border: 'border-[#e0d4be]', dot: 'bg-[#c07d2c]', label: '一般' },
};

const typeIcons: Record<string, React.ReactNode> = {
  new_application: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  overdue_feedback: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  high_match_no_contact: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  offer_risk: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  interview_today: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  follow_up: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

const fallbackCandidates: Candidate[] = [
  { id: 'c001', name: '张明远', avatar: '张', school: '浙江大学', schoolTier: '985', degree: '硕士', workYears: 3, stage: 'interview', skills: ['React', 'TypeScript'], evaluations: [{ overallScore: 92 }] },
  { id: 'c002', name: '李思涵', avatar: '李', school: '武汉大学', schoolTier: '985', degree: '本科', workYears: 2, stage: 'interview', skills: ['Vue', 'React'], evaluations: [{ overallScore: 85 }] },
  { id: 'c003', name: '王浩宇', avatar: '王', school: '南京邮电大学', schoolTier: '双非', degree: '本科', workYears: 1, stage: 'screened', skills: ['Vue', 'jQuery'], evaluations: [{ overallScore: 68 }] },
];

const fallbackTodos: TodoItem[] = [
  { id: '1', type: 'overdue_feedback', priority: 'urgent', title: '张明远面试反馈超时', description: '一面已超过 24 小时未收到反馈', candidateName: '张明远', actionLabel: '提交反馈', actionHref: '/interview?id=c001', createdAt: new Date().toISOString() },
  { id: '2', type: 'new_application', priority: 'high', title: '1 位新候选人待筛选', description: '有候选人已投递但尚未进行 AI 筛选', actionLabel: '立即筛选', actionHref: '/candidates', createdAt: new Date().toISOString() },
];

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showAllTodos, setShowAllTodos] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    setCurrentTime(new Date().toLocaleString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' }));

    async function loadData() {
      try {
        const [cands, todoList] = await Promise.all([
          candidatesApi.list(),
          todosApi.list(),
        ]);
        setCandidates(cands.length > 0 ? cands as unknown as Candidate[] : fallbackCandidates);
        setTodos(todoList.length > 0 ? todoList as unknown as TodoItem[] : fallbackTodos);
      } catch {
        setCandidates(fallbackCandidates);
        setTodos(fallbackTodos);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredPipeline = selectedStage
    ? candidates.filter(c => c.stage === selectedStage)
    : candidates;

  const funnelStages = [
    { key: 'applied', label: '已投递', count: candidates.filter(c => c.stage === 'applied').length || 128, color: 'bg-[#a8a29e]', textColor: 'text-[#5e5a55]' },
    { key: 'screened', label: 'AI 筛选', count: candidates.filter(c => c.stage === 'screened').length || 24, color: 'bg-[#c07d2c]', textColor: 'text-[#7a6840]' },
    { key: 'interview', label: '面试中', count: candidates.filter(c => c.stage === 'interview').length || 8, color: 'bg-[#c96442]', textColor: 'text-[#9a4328]' },
    { key: 'offer', label: '已发 Offer', count: candidates.filter(c => c.stage === 'offer').length || 3, color: 'bg-[#4a7c59]', textColor: 'text-[#3d5e47]' },
    { key: 'hired', label: '已入职', count: candidates.filter(c => c.stage === 'hired').length || 1, color: 'bg-[#2d7a4f]', textColor: 'text-[#2d7a4f]' },
  ];

  const urgentCount = todos.filter(t => t.priority === 'urgent').length;
  const highCount = todos.filter(t => t.priority === 'high').length;
  const displayTodos = showAllTodos ? todos : todos.slice(0, 4);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-[14px] text-[#8a8580]">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-[#2d2a26] mb-1">招聘工作台</h1>
        <p className="text-[14px] text-[#8a8580]">{currentTime} · AI 驱动的智能招聘系统</p>
      </div>

      {/* 今日待办 */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[14px] font-semibold text-[#2d2a26]">今日待办</h2>
            <div className="flex items-center gap-1.5">
              {urgentCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#fde5e3] text-[#8c2e24] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c0382b]" />
                  {urgentCount} 紧急
                </span>
              )}
              {highCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#fdf2ee] text-[#9a4328] font-medium">
                  {highCount} 重要
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAllTodos(!showAllTodos)}
            className="text-[12px] text-[#c96442] hover:text-[#b85636] font-medium"
          >
            {showAllTodos ? '收起' : `查看全部 ${todos.length} 项`}
          </button>
        </div>

        <div className="space-y-2">
          {displayTodos.map(todo => {
            const pc = priorityConfig[todo.priority] || priorityConfig.medium;
            return (
              <div
                key={todo.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${pc.border} ${pc.bg} transition-all hover-lift`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pc.text} shrink-0`}>
                  {typeIcons[todo.type] || typeIcons.follow_up}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[13px] font-semibold ${pc.text}`}>{todo.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${pc.bg} ${pc.text} border ${pc.border} font-medium`}>
                      {pc.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#8a8580] mt-0.5">{todo.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[#a8a29e]">{timeAgo(todo.createdAt)}</span>
                  <Link
                    href={todo.actionHref}
                    className="px-3 py-1.5 rounded-md bg-[#c96442] text-white text-[12px] font-medium hover:bg-[#b85636] transition-colors"
                  >
                    {todo.actionLabel}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* ROI 数据 */}
        <div className="mt-4 pt-4 border-t border-[#f0ede8] grid grid-cols-4 gap-4">
          {[
            { value: '21.3h', label: '本周节省工时', icon: '⏱️', change: '+15%' },
            { value: '¥4,260', label: '节省成本', icon: '💰', change: '+12%' },
            { value: '12天', label: '平均招聘周期', icon: '📅', change: '-3天' },
            { value: '78%', label: '面试通过率', icon: '📈', change: '+8%' },
          ].map(m => (
            <div key={m.label} className="text-center">
              <div className="text-[16px] mb-0.5">{m.icon}</div>
              <div className="text-[18px] font-bold text-[#2d2a26]">{m.value}</div>
              <div className="text-[11px] text-[#a8a29e]">{m.label}</div>
              <div className="text-[10px] text-[#4a7c59] font-medium mt-0.5">{m.change}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-[#2d2a26]">招聘漏斗</h2>
          <span className="text-[12px] text-[#a8a29e]">实时数据</span>
        </div>
        <div className="flex items-end gap-1">
          {funnelStages.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setSelectedStage(selectedStage === s.key ? null : s.key)}
              className={`flex-1 transition-all hover-lift rounded-t-lg ${
                selectedStage === s.key ? 'ring-2 ring-[#c96442] ring-offset-2' : ''
              }`}
            >
              <div
                className={`${s.color} rounded-t-lg flex flex-col items-center justify-center transition-all`}
                style={{ height: `${Math.max(50, 120 - i * 15)}px` }}
              >
                <span className="text-white text-[20px] font-bold">{s.count}</span>
                <span className="text-white/80 text-[11px] mt-0.5">{s.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-[#2d2a26]">候选人流水</h2>
          <div className="flex gap-1.5">
            {Object.entries(stageLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedStage(selectedStage === key ? null : key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  selectedStage === key ? stageColors[key] : 'bg-[#f5f3f0] text-[#8a8580] hover:bg-[#ece9e5]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredPipeline.map(c => {
            const score = c.evaluations?.[0]?.overallScore ?? 70;
            return (
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg border border-[#e8e4df] hover:border-[#d5d0ca] hover:bg-[#faf9f7] transition-all group">
                <div className="w-9 h-9 rounded-full bg-[#ede8df] flex items-center justify-center text-[13px] font-bold text-[#6b4a30] shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-[#2d2a26]">{c.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${stageColors[c.stage] || stageColors.applied}`}>
                      {stageLabels[c.stage] || c.stage}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5f3f0] text-[#5e5a55] font-medium">{c.schoolTier}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5f3f0] text-[#5e5a55] font-medium">{c.degree}</span>
                    <span className="text-[10px] text-[#a8a29e]">{c.school} · {c.workYears}年</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className={`text-[16px] font-bold ${score >= 85 ? 'text-[#4a7c59]' : score >= 70 ? 'text-[#c96442]' : 'text-[#a8a29e]'}`}>
                      {score}%
                    </div>
                    <div className="text-[10px] text-[#a8a29e]">匹配</div>
                  </div>
                  <Link href={`/candidates?id=${c.id}`} className="px-2.5 py-1.5 rounded-md border border-[#e8e4df] text-[11px] text-[#5e5a55] hover:border-[#c96442] hover:text-[#c96442] hover:bg-[#fdf2ee] transition-all font-medium">
                    查看
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Features */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-[#2d2a26]">核心能力</h2>
            <Link href="/create-job" className="text-[14px] text-[#c96442] hover:text-[#b85636] font-medium">
              开始招聘 →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>),
                title: 'AI 生成 JD', desc: '输入岗位基础信息，AI 自动生成结构化的岗位职责、任职要求、薪资建议', step: '1', href: '/create-job',
              },
              {
                icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>),
                title: '简历批量导入', desc: '支持 PDF/DOCX/TXT 上传，AI 自动解析姓名、学历、技能、经历', step: '2', href: '/candidates',
              },
              {
                icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>),
                title: '面试问题生成', desc: '根据候选人背景生成个性化面试题，覆盖专业能力、项目深挖、情景判断', step: '3', href: '/interview',
              },
              {
                icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>),
                title: '候选人对比决策', desc: '多候选人横向对比，雷达图可视化，AI 给出结构化录用建议', step: '4', href: '/compare',
              },
            ].map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="group glass-card rounded-lg p-4 hover-lift hover:border-[#e0a68f] hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-[#fdf2ee] text-[#c96442] group-hover:bg-[#c96442] group-hover:text-white transition-colors">
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-semibold text-[#2d2a26]">{f.title}</span>
                      <span className="text-[14px] px-1.5 py-0.5 rounded bg-[#ece9e5] text-[#8a8580] font-medium">Step {f.step}</span>
                    </div>
                    <p className="text-[14px] text-[#8a8580] leading-[1.6]">{f.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <h2 className="text-[14px] font-semibold text-[#2d2a26]">本周数据</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: `${candidates.length || 128}`, label: '收到简历', icon: '📄' },
              { value: `${candidates.filter(c => c.evaluations?.length).length || 24}`, label: 'AI 推荐', icon: '🤖' },
              { value: `${candidates.filter(c => c.stage === 'interview').length || 8}`, label: '进入面试', icon: '💬' },
              { value: `${candidates.filter(c => c.stage === 'offer').length || 3}`, label: '发出 Offer', icon: '🎉' },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-lg border border-[#e8e4df] p-3 hover-lift transition-colors">
                <div className="text-[16px] mb-1">{m.icon}</div>
                <div className="text-[20px] font-bold text-[#2d2a26]">{m.value}</div>
                <div className="text-[12px] text-[#a8a29e]">{m.label}</div>
              </div>
            ))}
          </div>

          <Link href="/create-job" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 btn-primary text-[14px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            新建招聘任务
          </Link>
        </div>
      </div>
    </div>
  );
}
