'use client';

import { mockCandidates, mockJob } from '@/app/data/mockData';
import type {
  CandidateRecord, Evaluation, JobProfile, InterviewRecord,
  TodoItem, CandidateStage, ScoreDimension, ScoreEvidence,
} from './types';

const KEYS = {
  candidates: 'zhihpin_candidates',
  evaluations: 'zhihpin_evaluations',
  jobs: 'zhihpin_jobs',
  interviews: 'zhihpin_interviews',
  feishuConfig: 'feishu_config',
} as const;

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function write<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ===== 候选人 =====
export function getCandidates(jobId?: string): CandidateRecord[] {
  const all = read<CandidateRecord>(KEYS.candidates);
  if (jobId) return all.filter(c => c.jobId === jobId);
  return all;
}

export function getCandidate(id: string): CandidateRecord | undefined {
  return read<CandidateRecord>(KEYS.candidates).find(c => c.id === id);
}

export function saveCandidate(c: CandidateRecord) {
  const all = read<CandidateRecord>(KEYS.candidates);
  const idx = all.findIndex(x => x.id === c.id);
  if (idx >= 0) all[idx] = c; else all.push(c);
  write(KEYS.candidates, all);
}

export function updateCandidateStage(id: string, stage: CandidateStage) {
  const all = read<CandidateRecord>(KEYS.candidates);
  const c = all.find(x => x.id === id);
  if (c) { c.stage = stage; c.updatedAt = new Date().toISOString(); }
  write(KEYS.candidates, all);
}

// ===== 岗位 =====
export function getJobs(): JobProfile[] {
  return read<JobProfile>(KEYS.jobs);
}

export function saveJob(j: JobProfile) {
  const all = read<JobProfile>(KEYS.jobs);
  const idx = all.findIndex(x => x.id === j.id);
  if (idx >= 0) all[idx] = j; else all.push(j);
  write(KEYS.jobs, all);
}

// ===== 评估 =====
export function getEvaluations(candidateId?: string): Evaluation[] {
  const all = read<Evaluation>(KEYS.evaluations);
  if (candidateId) return all.filter(e => e.candidateId === candidateId);
  return all;
}

export function saveEvaluation(e: Evaluation) {
  const all = read<Evaluation>(KEYS.evaluations);
  const idx = all.findIndex(x => x.id === e.id);
  if (idx >= 0) all[idx] = e; else all.push(e);
  write(KEYS.evaluations, all);
}

// ===== 面试 =====
export function getInterviews(candidateId?: string): InterviewRecord[] {
  const all = read<InterviewRecord>(KEYS.interviews);
  if (candidateId) return all.filter(i => i.candidateId === candidateId);
  return all;
}

export function saveInterview(i: InterviewRecord) {
  const all = read<InterviewRecord>(KEYS.interviews);
  const idx = all.findIndex(x => x.id === i.id);
  if (idx >= 0) all[idx] = i; else all.push(i);
  write(KEYS.interviews, all);
}

// ===== 今日待办生成 =====
export function generateTodos(): TodoItem[] {
  const candidates = getCandidates();
  const now = new Date();
  const todos: TodoItem[] = [];

  // 1. 新投递未筛选
  const newApplied = candidates.filter(c => c.stage === 'applied');
  if (newApplied.length > 0) {
    todos.push({
      id: 'todo-new-applied',
      type: 'new_application',
      priority: 'high',
      title: `${newApplied.length} 位新候选人待筛选`,
      description: `有 ${newApplied.length} 位候选人已投递但尚未进行 AI 筛选`,
      actionLabel: '立即筛选',
      actionHref: '/candidates',
      createdAt: now.toISOString(),
    });
  }

  // 2. 超过 24 小时未反馈的面试
  const pendingFeedback = candidates.filter(c => {
    if (c.stage !== 'interview') return false;
    const updated = new Date(c.updatedAt);
    return (now.getTime() - updated.getTime()) > 24 * 60 * 60 * 1000;
  });
  for (const c of pendingFeedback) {
    todos.push({
      id: `todo-feedback-${c.id}`,
      type: 'overdue_feedback',
      priority: 'urgent',
      title: `${c.name} 面试反馈超时`,
      description: `${c.name} 的面试已超过 24 小时未收到反馈，请尽快提交`,
      candidateId: c.id,
      candidateName: c.name,
      actionLabel: '提交反馈',
      actionHref: `/interview?id=${c.id}`,
      createdAt: c.updatedAt,
    });
  }

  // 3. 高匹配但未联系
  const highMatchNoContact = candidates.filter(c =>
    c.stage === 'screened' && getCandidateScore(c) >= 80
  );
  for (const c of highMatchNoContact) {
    todos.push({
      id: `todo-contact-${c.id}`,
      type: 'high_match_no_contact',
      priority: 'high',
      title: `高匹配候选人 ${c.name} 待联系`,
      description: `${c.name} 匹配度 ${getCandidateScore(c)}%，建议尽快安排面试`,
      candidateId: c.id,
      candidateName: c.name,
      actionLabel: '安排面试',
      actionHref: `/interview?id=${c.id}`,
      createdAt: now.toISOString(),
    });
  }

  // 4. Offer 风险
  const offerCandidates = candidates.filter(c => c.stage === 'offer');
  for (const c of offerCandidates) {
    todos.push({
      id: `todo-offer-${c.id}`,
      type: 'offer_risk',
      priority: 'medium',
      title: `${c.name} Offer 跟进`,
      description: `${c.name} 的 Offer 待确认接受情况`,
      candidateId: c.id,
      candidateName: c.name,
      actionLabel: '查看详情',
      actionHref: `/candidates?id=${c.id}`,
      createdAt: now.toISOString(),
    });
  }

  // 5. 今日面试
  const todayInterviews = candidates.filter(c => {
    if (c.stage !== 'interview') return false;
    const updated = new Date(c.updatedAt);
    return updated.toDateString() === now.toDateString();
  });
  for (const c of todayInterviews) {
    todos.push({
      id: `todo-interview-today-${c.id}`,
      type: 'interview_today',
      priority: 'urgent',
      title: `今日面试：${c.name}`,
      description: `${c.name} 今日有面试安排`,
      candidateId: c.id,
      candidateName: c.name,
      actionLabel: '查看面试题',
      actionHref: `/interview?id=${c.id}`,
      createdAt: now.toISOString(),
    });
  }

  return todos.sort((a, b) => {
    const pOrder = { urgent: 0, high: 1, medium: 2 };
    return pOrder[a.priority] - pOrder[b.priority];
  });
}

function getCandidateScore(c: CandidateRecord): number {
  // 简单计算匹配分
  const evals = getEvaluations(c.id);
  if (evals.length > 0) return evals[0].overallScore;
  return 70; // 默认分
}

// ===== 初始化 Mock 数据 =====
export function initMockData() {
  if (typeof window === 'undefined') return;
  if (getCandidates().length > 0) return;

  const jobId = 'job-001';
  const stages: CandidateStage[] = ['interview', 'interview', 'screened', 'screened', 'applied'];
  const now = new Date();

  mockCandidates.forEach((mc, i) => {
    const record: CandidateRecord = {
      id: mc.id,
      name: mc.name,
      avatar: mc.avatar,
      phone: mc.phone,
      email: mc.email,
      age: mc.age,
      gender: mc.gender,
      school: mc.school,
      schoolTier: mc.schoolTier,
      degree: mc.degree,
      major: mc.major,
      workYears: mc.workYears,
      currentCompany: mc.currentCompany,
      currentTitle: mc.currentTitle,
      jobHoppingCount: mc.jobHoppingCount,
      expectedSalary: mc.expectedSalary,
      background: mc.background,
      skills: mc.skills,
      projects: mc.projects,
      expectedPosition: mc.expectedPosition,
      stage: stages[i] || 'applied',
      jobId,
      appliedAt: new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - i * 12 * 60 * 60 * 1000).toISOString(),
      resumeText: mc.resume,
    };
    saveCandidate(record);
  });

  // 保存岗位
  const job: JobProfile = {
    id: jobId,
    title: mockJob.title,
    companyType: mockJob.companyType,
    headcount: mockJob.headcount,
    responsibilities: mockJob.responsibilities,
    requirements: mockJob.requirements,
    city: '北京',
    industry: '互联网',
    generatedJD: mockJob.generatedJD,
    matchRules: mockJob.matchRules ? {
      ...mockJob.matchRules,
      eliminationCriteria: ['缺少核心技能（React/TypeScript）', '薪资严重超出预算 50% 以上', '频繁跳槽（2年内3次以上）'],
      city: '北京',
      industry: '互联网',
    } : undefined,
    createdAt: now.toISOString(),
  };
  saveJob(job);

  // 保存评估
  mockCandidates.forEach(mc => {
    const evaluation: Evaluation = {
      id: `eval-${mc.id}`,
      candidateId: mc.id,
      jobId,
      overallScore: mc.matchScore,
      level: mc.level,
      dimensions: [
        { key: 'matchScore', label: '岗位匹配', weight: 0.3, score: mc.score.matchScore, weightedScore: mc.score.matchScore * 0.3, evidences: [] },
        { key: 'professional', label: '专业能力', weight: 0.25, score: mc.score.professional, weightedScore: mc.score.professional * 0.25, evidences: [] },
        { key: 'communication', label: '沟通表达', weight: 0.15, score: mc.score.communication, weightedScore: mc.score.communication * 0.15, evidences: [] },
        { key: 'potential', label: '成长潜力', weight: 0.15, score: mc.score.potential, weightedScore: mc.score.potential * 0.15, evidences: [] },
        { key: 'stability', label: '稳定性', weight: 0.15, score: mc.score.stability, weightedScore: mc.score.stability * 0.15, evidences: [] },
      ],
      strengths: mc.strengths.map(s => ({ text: s, evidence: '' })),
      risks: mc.risks.map(r => ({ text: r, evidence: '' })),
      summary: mc.summary,
      createdAt: now.toISOString(),
    };
    saveEvaluation(evaluation);
  });
}
