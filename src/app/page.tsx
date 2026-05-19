'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { mockCandidates } from './data/mockData';

const funnelStages = [
  { key: 'applied', label: '已投递', count: 128, color: 'bg-[#a8a29e]', textColor: 'text-[#5e5a55]' },
  { key: 'screened', label: 'AI 筛选', count: 24, color: 'bg-[#c07d2c]', textColor: 'text-[#7a6840]' },
  { key: 'interview', label: '面试中', count: 8, color: 'bg-[#c96442]', textColor: 'text-[#9a4328]' },
  { key: 'offer', label: '已发 Offer', count: 3, color: 'bg-[#4a7c59]', textColor: 'text-[#3d5e47]' },
  { key: 'hired', label: '已入职', count: 1, color: 'bg-[#2d7a4f]', textColor: 'text-[#2d7a4f]' },
];

const pipelineCandidates = [
  { ...mockCandidates[0], stage: 'interview', note: '薪资可谈到 35K，到岗 2 周', noteTime: '今天 14:30' },
  { ...mockCandidates[1], stage: 'interview', note: '二面约周四下午', noteTime: '昨天 16:20' },
  { ...mockCandidates[2], stage: 'screened', note: '', noteTime: '' },
  { ...mockCandidates[3], stage: 'screened', note: '建议转产品岗', noteTime: '3天前' },
  { ...mockCandidates[4], stage: 'applied', note: '', noteTime: '' },
];

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

// 今日待办数据
interface TodoItem {
  id: string;
  type: 'new_application' | 'overdue_feedback' | 'high_match_no_contact' | 'offer_risk' | 'interview_today';
  priority: 'urgent' | 'high' | 'medium';
  title: string;
  description: string;
  candidateName?: string;
  actionLabel: string;
  actionHref: string;
  timeAgo: string;
}

const mockTodos: TodoItem[] = [
  {
    id: '1',
    type: 'overdue_feedback',
    priority: 'urgent',
    title: '张明远面试反馈超时',
    description: '一面已超过 24 小时未收到反馈，请尽快提交',
    candidateName: '张明远',
    actionLabel: '提交反馈',
    actionHref: '/interview?id=c001',
    timeAgo: '26 小时前',
  },
  {
    id: '2',
    type: 'high_match_no_contact',
    priority: 'high',
    title: '高匹配候选人待联系',
    description: '张明远匹配度 92%，建议尽快安排二面',
    candidateName: '张明远',
    actionLabel: '安排面试',
    actionHref: '/interview?id=c001',
    timeAgo: '今天',
  },
  {
    id: '3',
    type: 'new_application',
    priority: 'high',
    title: '3 位新候选人待筛选',
    description: '有 3 位候选人已投递但尚未进行 AI 筛选',
    actionLabel: '立即筛选',
    actionHref: '/candidates',
    timeAgo: '今天',
  },
  {
    id: '4',
    type: 'interview_today',
    priority: 'urgent',
    title: '今日面试：李思涵',
    description: '李思涵 14:00 二面，面试官：张经理',
    candidateName: '李思涵',
    actionLabel: '查看面试题',
    actionHref: '/interview?id=c002',
    timeAgo: '14:00',
  },
  {
    id: '5',
    type: 'offer_risk',
    priority: 'medium',
    title: '张明远 Offer 跟进',
    description: 'Offer 已发出 3 天，待确认接受情况',
    candidateName: '张明远',
    actionLabel: '查看详情',
    actionHref: '/candidates?id=c001',
    timeAgo: '3 天前',
  },
];

const priorityConfig = {
  urgent: { bg: 'bg-[#fde5e3]', text: 'text-[#8c2e24]', border: 'border-[#f0c0bc]', dot: 'bg-[#c0382b]', label: '紧急' },
  high: { bg: 'bg-[#fdf2ee]', text: 'text-[#9a4328]', border: 'border-[#e8d5cc]', dot: 'bg-[#c96442]', label: '重要' },
  medium: { bg: 'bg-[#f3ece2]', text: 'text-[#7a6840]', border: 'border-[#e0d4be]', dot: 'bg-[#c07d2c]', label: '一般' },
};

const typeIcons = {
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
};

export default function Home() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    pipelineCandidates.forEach(c => { if (c.note) initial[c.id] = c.note; });
    return initial;
  });
  const [showAllTodos, setShowAllTodos] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' }));
  }, []);

  const filteredPipeline = selectedStage
    ? pipelineCandidates.filter(c => c.stage === selectedStage)
    : pipelineCandidates;

  const handleSaveNote = (id: string) => {
    setNotes(prev => ({ ...prev, [id]: noteText }));
    setEditingNote(null);
    setNoteText('');
  };

  const urgentCount = mockTodos.filter(t => t.priority === 'urgent').length;
  const highCount = mockTodos.filter(t => t.priority === 'high').length;
  const displayTodos = showAllTodos ? mockTodos : mockTodos.slice(0, 4);

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
            {showAllTodos ? '收起' : `查看全部 ${mockTodos.length} 项`}
          </button>
        </div>

        <div className="space-y-2">
          {displayTodos.map(todo => {
            const pc = priorityConfig[todo.priority];
            return (
              <div
                key={todo.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${pc.border} ${pc.bg} transition-all hover-lift`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pc.text} shrink-0`}>
                  {typeIcons[todo.type]}
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
                  <span className="text-[11px] text-[#a8a29e]">{todo.timeAgo}</span>
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
          <h2 className="text-[14px] font-semibold text-[#2d2a26]">招聘漏斗 · 前端开发工程师</h2>
          <span className="text-[12px] text-[#a8a29e]">本周数据</span>
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
        <div className="flex gap-1 mt-2">
          {funnelStages.map((s, i) => (
            <div key={s.key} className="flex-1 text-center">
              {i > 0 ? (
                <span className="text-[11px] text-[#a8a29e]">
                  → {Math.round(funnelStages[i].count / funnelStages[i - 1].count * 100)}%
                </span>
              ) : (
                <span className="text-[11px] text-[#a8a29e]">投递</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0ede8]">
          <span className="text-[12px] text-[#8a8580]">整体转化率</span>
          <span className="text-[14px] font-bold text-[#c96442]">{Math.round(funnelStages[4].count / funnelStages[0].count * 100)}%（投递→入职）</span>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-[#2d2a26]">候选人流水</h2>
          <div className="flex gap-1.5">
            {Object.entries(stageLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedStage(selectedStage === key ? null : key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  selectedStage === key
                    ? stageColors[key]
                    : 'bg-[#f5f3f0] text-[#8a8580] hover:bg-[#ece9e5]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredPipeline.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg border border-[#e8e4df] hover:border-[#d5d0ca] hover:bg-[#faf9f7] transition-all group">
              <div className="w-9 h-9 rounded-full bg-[#ede8df] flex items-center justify-center text-[13px] font-bold text-[#6b4a30] shrink-0">
                {c.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-[#2d2a26]">{c.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${stageColors[c.stage]}`}>
                    {stageLabels[c.stage]}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5f3f0] text-[#5e5a55] font-medium">{c.schoolTier}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5f3f0] text-[#5e5a55] font-medium">{c.degree}</span>
                  <span className="text-[10px] text-[#a8a29e]">{c.school} · {c.workYears}年</span>
                </div>
                {editingNote === c.id ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveNote(c.id)}
                      className="flex-1 px-2 py-1 rounded border border-[#e8e4df] text-[12px] focus:border-[#c96442] focus:ring-1 focus:ring-[#f0d5c8] outline-none"
                      placeholder="输入备注，回车保存..."
                      autoFocus
                    />
                    <button onClick={() => handleSaveNote(c.id)} className="text-[11px] text-[#c96442] font-medium hover:text-[#b85636]">保存</button>
                    <button onClick={() => { setEditingNote(null); setNoteText(''); }} className="text-[11px] text-[#a8a29e] hover:text-[#5e5a55]">取消</button>
                  </div>
                ) : notes[c.id] ? (
                  <div className="flex items-center gap-1.5 mt-1" onClick={() => { setEditingNote(c.id); setNoteText(notes[c.id]); }}>
                    <svg className="w-3 h-3 text-[#c07d2c] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    <span className="text-[12px] text-[#7a6840] cursor-pointer hover:text-[#5e5a55]">{notes[c.id]}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingNote(c.id); setNoteText(''); }}
                    className="text-[11px] text-[#a8a29e] hover:text-[#c96442] mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    添加备注
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className={`text-[16px] font-bold ${
                    c.matchScore >= 85 ? 'text-[#4a7c59]' : c.matchScore >= 70 ? 'text-[#c96442]' : 'text-[#a8a29e]'
                  }`}>{c.matchScore}%</div>
                  <div className="text-[10px] text-[#a8a29e]">匹配</div>
                </div>
                <Link href={`/candidates?id=${c.id}`} className="px-2.5 py-1.5 rounded-md border border-[#e8e4df] text-[11px] text-[#5e5a55] hover:border-[#c96442] hover:text-[#c96442] hover:bg-[#fdf2ee] transition-all font-medium">
                  查看
                </Link>
              </div>
            </div>
          ))}
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
                title: 'AI 生成 JD',
                desc: '输入岗位基础信息，AI 自动生成结构化的岗位职责、任职要求、薪资建议',
                step: '1',
                href: '/create-job',
              },
              {
                icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>),
                title: '简历批量导入',
                desc: '支持 PDF/DOCX/TXT 上传，AI 自动解析姓名、学历、技能、经历',
                step: '2',
                href: '/candidates',
              },
              {
                icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>),
                title: '面试问题生成',
                desc: '根据候选人背景生成个性化面试题，覆盖专业能力、项目深挖、情景判断',
                step: '3',
                href: '/interview',
              },
              {
                icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>),
                title: '候选人对比决策',
                desc: '多候选人横向对比，雷达图可视化，AI 给出结构化录用建议',
                step: '4',
                href: '/compare',
              },
            ].map((f, i) => (
              <Link
                key={f.title}
                href={f.href}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="group glass-card rounded-lg p-4 hover-lift hover:border-[#e0a68f] hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    hoveredFeature === i ? 'bg-[#c96442] text-white' : 'bg-[#fdf2ee] text-[#c96442]'
                  }`}>
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
              { value: '128', label: '收到简历', icon: '📄' },
              { value: '24', label: 'AI 推荐', icon: '🤖' },
              { value: '8', label: '进入面试', icon: '💬' },
              { value: '3', label: '发出 Offer', icon: '🎉' },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-lg border border-[#e8e4df] p-3 hover-lift transition-colors">
                <div className="text-[16px] mb-1">{m.icon}</div>
                <div className="text-[20px] font-bold text-[#2d2a26]">{m.value}</div>
                <div className="text-[12px] text-[#a8a29e]">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-[#e8e4df] p-4">
            <h3 className="text-[13px] font-semibold text-[#2d2a26] mb-3">招聘效率对比</h3>
            <div className="space-y-2.5">
              {[
                { label: '传统方式', time: '30 分钟/份', width: '100%', color: 'bg-[#e8e4df]' },
                { label: 'AI 初筛 + HR 复核', time: '3 秒/份', width: '5%', color: 'bg-[#c96442]' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-[#5e5a55]">{item.label}</span>
                    <span className="text-[12px] font-medium text-[#2d2a26]">{item.time}</span>
                  </div>
                  <div className="h-2 bg-[#f0ede8] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: item.width }} />
                  </div>
                </div>
              ))}
            </div>
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
