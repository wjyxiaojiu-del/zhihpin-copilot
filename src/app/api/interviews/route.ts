import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { aiChat, extractJSON, isAIAvailable } from '@/lib/ai/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get('candidateId');

  const where = candidateId ? { candidateId } : {};
  const interviews = await prisma.interview.findMany({ where, orderBy: { createdAt: 'desc' } });

  return NextResponse.json(interviews.map(i => ({
    ...i,
    questions: i.questions ? JSON.parse(i.questions) : [],
    feedback: i.feedback ? JSON.parse(i.feedback) : null,
  })));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const interview = await prisma.interview.create({
          data: {
            candidateId: body.candidateId,
            jobId: body.jobId,
            interviewerName: body.interviewerName || '待分配',
            scheduledAt: new Date(body.scheduledAt || Date.now()),
            status: 'scheduled',
            questions: body.questions ? JSON.stringify(body.questions) : null,
          },
        });
        return NextResponse.json({
          ...interview,
          questions: interview.questions ? JSON.parse(interview.questions) : [],
        });
      }

      case 'generate_questions': {
        const candidate = await prisma.candidate.findUnique({ where: { id: body.candidateId } });
        if (!candidate) {
          return NextResponse.json({ error: '候选人不存在' }, { status: 404 });
        }

        const skills = JSON.parse(candidate.skills);
        const projects = JSON.parse(candidate.projects);

        const fallbackQuestions = [
          { type: '专业能力', question: `请介绍一下你在${skills[0] || '相关技术'}方面的使用经验？`, purpose: '考察核心技能深度', scoringCriteria: '能说出原理和实践经验' },
          { type: '项目深挖', question: projects[0] ? `你提到的「${projects[0].name}」项目，你具体负责哪些部分？` : '请介绍一个你最有成就感的项目', purpose: '了解项目参与深度', scoringCriteria: '能清晰描述个人贡献' },
          { type: '情景判断', question: '如果产品经理突然要求在一个已排期的功能上增加复杂交互，你会怎么处理？', purpose: '考察需求管理能力', scoringCriteria: '能平衡需求与排期' },
          { type: '团队协作', question: '在代码评审中，如果你和同事对某个实现方案有分歧，你会怎么处理？', purpose: '了解团队协作方式', scoringCriteria: '有理有据地表达观点' },
        ];

        if (!isAIAvailable()) {
          return NextResponse.json({ success: true, aiPowered: false, questions: fallbackQuestions });
        }

        const prompt = `你是一个资深面试官。根据候选人背景生成 6 个面试问题。

候选人：${candidate.name}
学校：${candidate.school}（${candidate.schoolTier}）${candidate.degree}
工作经验：${candidate.workYears}年，当前公司：${candidate.currentCompany}
技能：${skills.join('、')}
项目：${projects.map((p: { name: string; description: string }) => `${p.name}：${p.description}`).join('; ')}

请返回 JSON（只返回 JSON）：
[
  { "type": "专业能力", "question": "问题内容", "purpose": "考察目的", "scoringCriteria": "评分标准", "expectedAnswer": "期望答案要点" },
  { "type": "项目深挖", "question": "...", "purpose": "...", "scoringCriteria": "...", "expectedAnswer": "..." },
  { "type": "情景判断", "question": "...", "purpose": "...", "scoringCriteria": "...", "expectedAnswer": "..." },
  { "type": "团队协作", "question": "...", "purpose": "...", "scoringCriteria": "...", "expectedAnswer": "..." }
]`;

        try {
          const response = await aiChat([{ role: 'user', content: prompt }], { temperature: 0.5 });
          const questions = extractJSON(response);
          return NextResponse.json({ success: true, aiPowered: true, questions });
        } catch {
          return NextResponse.json({ success: true, aiPowered: false, questions: fallbackQuestions });
        }
      }

      case 'submit_feedback': {
        const feedback = {
          ...body.feedback,
          submittedAt: new Date().toISOString(),
        };

        const interview = await prisma.interview.update({
          where: { id: body.interviewId },
          data: {
            feedback: JSON.stringify(feedback),
            status: 'completed',
          },
        });

        return NextResponse.json({
          ...interview,
          questions: interview.questions ? JSON.parse(interview.questions) : [],
          feedback: interview.feedback ? JSON.parse(interview.feedback) : null,
        });
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: '操作失败', details: String(error) }, { status: 500 });
  }
}
