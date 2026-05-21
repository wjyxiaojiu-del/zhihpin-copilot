'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StepBar from '../components/StepBar';
import Badge from '../components/Badge';
import { mockCandidates, mockInterviewQuestions, type InterviewQuestion } from '../data/mockData';
import FeishuPush from '../components/FeishuPush';
import { candidatesApi, interviewsApi } from '@/lib/api';

const typeConfig: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  '专业能力': { icon: '💡', bg: 'bg-[#fdf2ee]', text: 'text-[#9a4328]', border: 'border-[#e8d5cc]' },
  '项目深挖': { icon: '🔍', bg: 'bg-[#f0fdf4]', text: 'text-[#3d5e47]', border: 'border-[#c8ddd0]' },
  '情景判断': { icon: '🎯', bg: 'bg-[#f3ece2]', text: 'text-[#7a6840]', border: 'border-[#e0d4be]' },
  '团队协作': { icon: '🤝', bg: 'bg-[#f5f0eb]', text: 'text-[#6b4a30]', border: 'border-[#ddd4cc]' },
};

// 面试记录模板
interface InterviewFeedback {
  questionIdx: number;
  answer: string;
  score: number;
  comment: string;
}

interface InterviewSession {
  candidateId: string;
  interviewerName: string;
  startedAt: string;
  feedbacks: InterviewFeedback[];
  overallComment: string;
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire' | '';
  submitted: boolean;
}

function InterviewContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || 'c001';
  const [selectedId, setSelectedId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // 面试闭环状态
  const [mode, setMode] = useState<'prepare' | 'interview' | 'feedback'>('prepare');
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [session, setSession] = useState<InterviewSession>({
    candidateId: initialId,
    interviewerName: '',
    startedAt: '',
    feedbacks: [],
    overallComment: '',
    recommendation: '',
    submitted: false,
  });

  // 从 API 加载候选人
  const [apiCandidates, setApiCandidates] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    candidatesApi.list().then(setApiCandidates).catch(() => {});
  }, []);

  const allCandidates = apiCandidates.length > 0 ? apiCandidates : mockCandidates;
  const selectedCandidate = (allCandidates as Array<Record<string, unknown> & { id: string; name: string; avatar: string; school: string; schoolTier: string; degree: string; workYears: number; skills: string[]; matchScore: number; level: string }>).find(c => c.id === selectedId) || allCandidates[0] as Record<string, unknown> & { id: string; name: string; avatar: string; school: string; schoolTier: string; degree: string; workYears: number; skills: string[]; matchScore: number; level: string };

  const handleGenerate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setQuestions(null);
    setExpandedIdx(null);
    setMode('prepare');
    try {
      const result = await interviewsApi.generateQuestions(selectedId) as Record<string, unknown>;
      const qs = result.questions as InterviewQuestion[];
      setQuestions(qs);
      // Create an interview record to get an ID for feedback submission
      try {
        const job = (apiCandidates as Array<Record<string, unknown>>).find(c => c.id === selectedId)?.jobId as string || '';
        const created = await interviewsApi.create({ candidateId: selectedId, jobId: job }) as Record<string, unknown>;
        setInterviewId(created.id as string);
      } catch {
        setInterviewId(null);
      }
      setSession(prev => ({
        ...prev,
        candidateId: selectedId,
        feedbacks: qs.map((_, i) => ({ questionIdx: i, answer: '', score: 0, comment: '' })),
      }));
    } catch {
      // fallback to mock
      const qs = mockInterviewQuestions[selectedId] || [];
      setQuestions(qs);
      setSession(prev => ({
        ...prev,
        candidateId: selectedId,
        feedbacks: qs.map((_, i) => ({ questionIdx: i, answer: '', score: 0, comment: '' })),
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    if (!session.interviewerName) return;
    setMode('interview');
    setSession(prev => ({ ...prev, startedAt: new Date().toISOString() }));
  };

  const handleSubmitFeedback = async () => {
    if (interviewId) {
      try {
        await interviewsApi.submitFeedback({
          interviewId,
          feedback: {
            candidateId: selectedId,
            interviewerName: session.interviewerName,
            feedbacks: session.feedbacks,
            overallComment: session.overallComment,
            recommendation: session.recommendation,
            avgScore: session.feedbacks.length > 0
              ? Math.round(session.feedbacks.reduce((sum, f) => sum + f.score, 0) / session.feedbacks.filter(f => f.score > 0).length)
              : 0,
          },
        });
      } catch (e) {
        console.error('Failed to submit feedback:', e);
      }
    }
    setSession(prev => ({ ...prev, submitted: true }));
    setMode('feedback');
  };

  const updateFeedback = (idx: number, field: keyof InterviewFeedback, value: string | number) => {
    setSession(prev => ({
      ...prev,
      feedbacks: prev.feedbacks.map((f, i) => i === idx ? { ...f, [field]: value } : f),
    }));
  };

  const avgScore = session.feedbacks.length > 0
    ? Math.round(session.feedbacks.reduce((sum, f) => sum + f.score, 0) / session.feedbacks.filter(f => f.score > 0).length)
    : 0;

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-6">
      <StepBar current={2} />

      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-[#2d2a26]">面试管理</h1>
        <p className="text-[14px] text-[#8a8580] mt-0.5">AI 生成面试题 → 面试官打分 → 自动汇总反馈</p>
      </div>

      {/* Candidate Selector */}
      <div className="glass-card rounded-lg p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-[#2d2a26]">选择候选人</h2>
          {selectedCandidate && (
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-[#a8a29e]">已选中</span>
              <span className="text-[14px] font-medium text-[#2d2a26]">{selectedCandidate.name}</span>
              <Badge level={selectedCandidate.level} />
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(allCandidates as Array<Record<string, unknown> & { id: string; name: string; avatar: string; matchScore: number }>).map(c => (
            <button
              key={c.id}
              onClick={() => { setSelectedId(c.id); setQuestions(null); setMode('prepare'); }}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-md border text-[14px] transition-all hover-scale ${
                selectedId === c.id
                  ? 'border-[#c96442] bg-[#fdf2ee] text-[#9a4328]'
                  : 'border-[#e8e4df] text-[#5e5a55] hover:border-[#d5d0ca] hover:bg-[#f9f8f6]'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[14px] font-bold ${
                selectedId === c.id ? 'bg-[#c96442] text-white' : 'bg-[#e8e4df] text-[#8a8580]'
              }`}>
                {c.avatar}
              </div>
              <div className="text-left">
                <div className="font-medium leading-tight">{c.name}</div>
                <div className="text-[13px] text-[#a8a29e]">{c.matchScore}% 匹配</div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-[#f0ede8] flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-2 bg-[#c96442] hover:bg-[#b85636] disabled:bg-[#e0a68f] text-white rounded-md text-[14px] font-medium transition-colors flex items-center gap-2"
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
                生成面试问题
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass-card rounded-lg p-10">
          <div className="flex items-center justify-center gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-[3px] border-[#e8e4df]" />
              <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#c96442] animate-spin-slow" />
            </div>
            <div>
              <p className="text-[14px] text-[#5e5a55] font-medium">正在分析 {selectedCandidate?.name} 的背景...</p>
              <p className="text-[14px] text-[#a8a29e] mt-0.5">生成个性化面试问题中</p>
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      {questions && (
        <div className="animate-fade-in">
          {/* 面试模式切换 */}
          <div className="glass-card rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[14px] font-semibold text-[#2d2a26]">面试问题</span>
                <span className="text-[14px] text-[#a8a29e]">共 {questions.length} 道</span>
                <div className="flex gap-1.5">
                  {Object.entries(typeConfig).map(([type, cfg]) => {
                    const count = questions.filter(q => q.type === type).length;
                    return count > 0 ? (
                      <span key={type} className={`text-[14px] px-2 py-0.5 rounded ${cfg.bg} ${cfg.text} border ${cfg.border} font-medium`}>
                        {type} {count}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMode('prepare')}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                    mode === 'prepare' ? 'bg-[#c96442] text-white' : 'bg-[#f5f3f0] text-[#8a8580] hover:bg-[#ece9e5]'
                  }`}
                >
                  准备阶段
                </button>
                <button
                  onClick={() => setMode('interview')}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                    mode === 'interview' ? 'bg-[#c96442] text-white' : 'bg-[#f5f3f0] text-[#8a8580] hover:bg-[#ece9e5]'
                  }`}
                >
                  面试记录
                </button>
                <button
                  onClick={() => setMode('feedback')}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                    mode === 'feedback' ? 'bg-[#c96442] text-white' : 'bg-[#f5f3f0] text-[#8a8580] hover:bg-[#ece9e5]'
                  }`}
                >
                  反馈汇总
                </button>
              </div>
            </div>

            {/* 面试官信息 */}
            {mode === 'prepare' && (
              <div className="mt-3 pt-3 border-t border-[#f0ede8] flex items-center gap-3">
                <label className="text-[13px] text-[#5e5a55]">面试官：</label>
                <input
                  value={session.interviewerName}
                  onChange={e => setSession(prev => ({ ...prev, interviewerName: e.target.value }))}
                  className="px-3 py-1.5 rounded-md border border-[#e8e4df] text-[13px] w-40"
                  placeholder="输入姓名"
                />
                <button
                  onClick={handleStartInterview}
                  disabled={!session.interviewerName}
                  className="px-4 py-1.5 bg-[#4a7c59] hover:bg-[#3d6b4a] disabled:bg-[#d5d0ca] text-white rounded-md text-[13px] font-medium transition-colors"
                >
                  开始面试
                </button>
              </div>
            )}
          </div>

          {/* 准备阶段 - 问题清单 */}
          {mode === 'prepare' && (
            <div className="space-y-2">
              {questions.map((q, i) => {
                const cfg = typeConfig[q.type] || typeConfig['专业能力'];
                const expanded = expandedIdx === i;
                return (
                  <div key={i} className={`glass-card rounded-lg overflow-hidden transition-all ${expanded ? 'border-[#e0a68f]' : 'border-[#e8e4df]'}`}>
                    <button
                      onClick={() => setExpandedIdx(expanded ? null : i)}
                      className="w-full p-4 text-left flex items-start gap-3 hover:bg-[#f9f8f6] transition-colors"
                    >
                      <span className={`w-7 h-7 rounded flex items-center justify-center text-[14px] font-bold shrink-0 ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[14px] px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} border ${cfg.border} font-medium`}>
                            {cfg.icon} {q.type}
                          </span>
                        </div>
                        <p className="text-[14px] text-[#2d2a26] font-medium leading-relaxed">{q.question}</p>
                      </div>
                      <svg className={`w-4 h-4 text-[#a8a29e] shrink-0 mt-1.5 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expanded && (
                      <div className="px-4 pb-4 ml-10 animate-fade-in space-y-2">
                        <div className="bg-[#f3ece2] border border-[#e8d8b8] rounded-md p-3">
                          <p className="text-[14px] font-semibold text-[#7a6840] mb-1">考察目的</p>
                          <p className="text-[14px] text-[#5c4d2e] leading-relaxed">{q.purpose}</p>
                        </div>
                        <div className="bg-[#fdf2ee] border border-[#e8d5cc] rounded-md p-3">
                          <p className="text-[14px] font-semibold text-[#9a4328] mb-1">评分标准</p>
                          <p className="text-[14px] text-[#5e5a55] leading-relaxed">
                            {q.type === '专业能力' ? '能说出核心原理、最佳实践、踩坑经验。答出 80% 以上为优秀。' :
                             q.type === '项目深挖' ? '能清晰描述个人贡献、技术方案选择理由、遇到的困难和解决方案。' :
                             q.type === '情景判断' ? '能平衡需求与排期，有沟通策略，展示问题解决能力。' :
                             '能展示开放心态、有理有据地表达观点，有团队合作意识。'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 面试记录模式 */}
          {mode === 'interview' && (
            <div className="space-y-4">
              {questions.map((q, i) => {
                const cfg = typeConfig[q.type] || typeConfig['专业能力'];
                const fb = session.feedbacks[i];
                return (
                  <div key={i} className="glass-card rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`w-7 h-7 rounded flex items-center justify-center text-[14px] font-bold shrink-0 ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[12px] px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} border ${cfg.border} font-medium`}>
                            {cfg.icon} {q.type}
                          </span>
                        </div>
                        <p className="text-[14px] text-[#2d2a26] font-medium">{q.question}</p>
                        <p className="text-[12px] text-[#8a8580] mt-1">考察：{q.purpose}</p>
                      </div>
                    </div>

                    <div className="ml-10 space-y-2.5">
                      <div>
                        <label className="text-[12px] text-[#5e5a55] mb-1 block">候选人回答要点</label>
                        <textarea
                          value={fb?.answer || ''}
                          onChange={e => updateFeedback(i, 'answer', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 rounded-md border border-[#e8e4df] text-[13px] resize-none"
                          placeholder="记录候选人的回答要点..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-[12px] text-[#5e5a55] mb-1 block">评分</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(score => (
                              <button
                                key={score}
                                onClick={() => updateFeedback(i, 'score', score)}
                                className={`w-8 h-8 rounded-md text-[13px] font-bold transition-all ${
                                  fb?.score === score
                                    ? 'bg-[#c96442] text-white'
                                    : 'bg-[#f5f3f0] text-[#8a8580] hover:bg-[#ece9e5]'
                                }`}
                              >
                                {score}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex-[2]">
                          <label className="text-[12px] text-[#5e5a55] mb-1 block">备注</label>
                          <input
                            value={fb?.comment || ''}
                            onChange={e => updateFeedback(i, 'comment', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-[#e8e4df] text-[13px]"
                            placeholder="补充说明..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 总评 */}
              <div className="glass-card rounded-lg p-4">
                <h3 className="text-[14px] font-semibold text-[#2d2a26] mb-3">面试总评</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] text-[#5e5a55] mb-1 block">综合评语</label>
                    <textarea
                      value={session.overallComment}
                      onChange={e => setSession(prev => ({ ...prev, overallComment: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border border-[#e8e4df] text-[13px] resize-none"
                      placeholder="对候选人的整体评价..."
                    />
                  </div>
                  <div>
                    <label className="text-[12px] text-[#5e5a55] mb-1 block">录用建议</label>
                    <div className="flex gap-2">
                      {[
                        { key: 'strong_hire', label: '强烈推荐', color: 'bg-[#4a7c59] text-white' },
                        { key: 'hire', label: '推荐', color: 'bg-[#c96442] text-white' },
                        { key: 'maybe', label: '待定', color: 'bg-[#c07d2c] text-white' },
                        { key: 'no_hire', label: '不推荐', color: 'bg-[#c0382b] text-white' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => setSession(prev => ({ ...prev, recommendation: opt.key as InterviewSession['recommendation'] }))}
                          className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                            session.recommendation === opt.key ? opt.color : 'bg-[#f5f3f0] text-[#8a8580] hover:bg-[#ece9e5]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmitFeedback}
                  className="px-6 py-2 bg-[#c96442] hover:bg-[#b85636] text-white rounded-md text-[14px] font-medium transition-colors"
                >
                  提交面试反馈
                </button>
              </div>
            </div>
          )}

          {/* 反馈汇总 */}
          {mode === 'feedback' && (
            <div className="space-y-4">
              {/* 评分概览 */}
              <div className="glass-card rounded-lg p-5">
                <h3 className="text-[14px] font-semibold text-[#2d2a26] mb-4">评分概览</h3>
                <div className="flex items-center gap-6 mb-4">
                  <div className="text-center">
                    <div className={`text-[36px] font-bold ${avgScore >= 4 ? 'text-[#4a7c59]' : avgScore >= 3 ? 'text-[#c96442]' : 'text-[#c0382b]'}`}>
                      {avgScore || '-'}
                    </div>
                    <div className="text-[12px] text-[#a8a29e]">平均分（/5）</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {questions.map((q, i) => {
                      const fb = session.feedbacks[i];
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[12px] text-[#5e5a55] w-32 truncate">{q.question.substring(0, 15)}...</span>
                          <div className="flex-1 h-2 bg-[#f0ede8] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                fb?.score >= 4 ? 'bg-[#4a7c59]' : fb?.score >= 3 ? 'bg-[#c96442]' : fb?.score >= 2 ? 'bg-[#c07d2c]' : 'bg-[#c0382b]'
                              }`}
                              style={{ width: `${(fb?.score || 0) * 20}%` }}
                            />
                          </div>
                          <span className="text-[12px] font-bold text-[#2d2a26] w-4 text-right">{fb?.score || '-'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#f0ede8]">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5e5a55]">录用建议</span>
                    <span className={`text-[13px] font-semibold px-3 py-1 rounded ${
                      session.recommendation === 'strong_hire' ? 'bg-[#e4ede6] text-[#3d5e47]' :
                      session.recommendation === 'hire' ? 'bg-[#fde8df] text-[#9a4328]' :
                      session.recommendation === 'maybe' ? 'bg-[#f3ece2] text-[#7a6840]' :
                      session.recommendation === 'no_hire' ? 'bg-[#fde5e3] text-[#8c2e24]' :
                      'bg-[#f5f3f0] text-[#8a8580]'
                    }`}>
                      {session.recommendation === 'strong_hire' ? '强烈推荐' :
                       session.recommendation === 'hire' ? '推荐' :
                       session.recommendation === 'maybe' ? '待定' :
                       session.recommendation === 'no_hire' ? '不推荐' : '未填写'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 各题详情 */}
              <div className="glass-card rounded-lg p-5">
                <h3 className="text-[14px] font-semibold text-[#2d2a26] mb-3">各题反馈详情</h3>
                <div className="space-y-3">
                  {questions.map((q, i) => {
                    const fb = session.feedbacks[i];
                    return (
                      <div key={i} className="p-3 rounded-lg bg-[#faf9f7] border border-[#f0ede8]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[11px] px-1.5 py-0.5 rounded ${typeConfig[q.type]?.bg} ${typeConfig[q.type]?.text} font-medium`}>
                            {q.type}
                          </span>
                          <span className="text-[13px] font-medium text-[#2d2a26] flex-1">{q.question.substring(0, 50)}...</span>
                          <span className={`text-[14px] font-bold ${
                            (fb?.score || 0) >= 4 ? 'text-[#4a7c59]' : (fb?.score || 0) >= 3 ? 'text-[#c96442]' : 'text-[#c0382b]'
                          }`}>{fb?.score || '-'}/5</span>
                        </div>
                        {fb?.answer && <p className="text-[12px] text-[#8a8580] mb-1">回答：{fb.answer}</p>}
                        {fb?.comment && <p className="text-[12px] text-[#5e5a55]">备注：{fb.comment}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 综合评语 */}
              {session.overallComment && (
                <div className="glass-card rounded-lg p-5">
                  <h3 className="text-[14px] font-semibold text-[#2d2a26] mb-2">综合评语</h3>
                  <p className="text-[14px] text-[#5e5a55] leading-relaxed">{session.overallComment}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Link href={`/report?id=${selectedId}`} className="btn-primary text-[14px] px-5 py-2">
                    查看评分报告 →
                  </Link>
                  <Link href="/candidates" className="btn-ghost text-[14px] px-5 py-2">
                    返回筛选
                  </Link>
                </div>
                <FeishuPush
                  type="interview"
                  title={`${selectedCandidate?.name} - 面试反馈`}
                  content={`面试官：${session.interviewerName}\n平均分：${avgScore}/5\n建议：${session.recommendation}\n\n${session.overallComment}`}
                />
              </div>
            </div>
          )}

          {/* 原始问题列表（准备阶段） */}
          {mode === 'prepare' && (
            <div className="flex items-center justify-between mt-5">
              <div className="flex gap-3">
                <Link href={`/report?id=${selectedId}`} className="btn-primary text-[14px] px-5 py-2">
                  下一步：评分报告 →
                </Link>
                <Link href="/candidates" className="btn-ghost text-[14px] px-5 py-2">
                  返回筛选
                </Link>
              </div>
              <FeishuPush
                type="interview"
                title={`${selectedCandidate?.name} - 面试题`}
                content={questions.map((q, i) => `${i+1}. [${q.type}] ${q.question}\n   考察: ${q.purpose}`).join('\n\n')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="max-w-[1000px] mx-auto px-6 py-6"><StepBar current={2} /></div>}>
      <InterviewContent />
    </Suspense>
  );
}
