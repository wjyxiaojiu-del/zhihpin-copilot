import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const candidates = await prisma.candidate.findMany({
    include: { evaluations: true },
  });
  const now = new Date();
  const todos: Array<{
    id: string;
    type: string;
    priority: string;
    title: string;
    description: string;
    candidateId?: string;
    candidateName?: string;
    actionLabel: string;
    actionHref: string;
    createdAt: string;
  }> = [];

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
    return (now.getTime() - c.updatedAt.getTime()) > 24 * 60 * 60 * 1000;
  });
  for (const c of pendingFeedback) {
    todos.push({
      id: `todo-feedback-${c.id}`,
      type: 'overdue_feedback',
      priority: 'urgent',
      title: `${c.name} 面试反馈超时`,
      description: `${c.name} 的面试已超过 24 小时未收到反馈`,
      candidateId: c.id,
      candidateName: c.name,
      actionLabel: '提交反馈',
      actionHref: `/interview?id=${c.id}`,
      createdAt: c.updatedAt.toISOString(),
    });
  }

  // 3. 高匹配但未联系
  const highMatch = candidates.filter(c => {
    if (c.stage !== 'screened') return false;
    const score = c.evaluations[0]?.overallScore ?? 70;
    return score >= 80;
  });
  for (const c of highMatch) {
    const score = c.evaluations[0]?.overallScore ?? 70;
    todos.push({
      id: `todo-contact-${c.id}`,
      type: 'high_match_no_contact',
      priority: 'high',
      title: `高匹配候选人 ${c.name} 待联系`,
      description: `${c.name} 匹配度 ${score}%，建议尽快安排面试`,
      candidateId: c.id,
      candidateName: c.name,
      actionLabel: '安排面试',
      actionHref: `/interview?id=${c.id}`,
      createdAt: now.toISOString(),
    });
  }

  // 4. Offer 跟进
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
    return c.updatedAt.toDateString() === now.toDateString();
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

  todos.sort((a, b) => {
    const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2 };
    return (pOrder[a.priority] ?? 3) - (pOrder[b.priority] ?? 3);
  });

  return NextResponse.json(todos);
}
