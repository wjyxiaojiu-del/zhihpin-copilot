import { NextResponse } from 'next/server';

// 面试管理 API
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, interviewId, candidateId, feedback, scores } = body;

    await new Promise(r => setTimeout(r, 800));

    switch (action) {
      case 'create': {
        // 创建面试安排
        const interview = {
          id: `interview-${Date.now()}`,
          candidateId,
          jobId: body.jobId || 'job-001',
          interviewerName: body.interviewerName || '待分配',
          scheduledAt: body.scheduledAt || new Date().toISOString(),
          status: 'scheduled',
          questions: body.questions || [],
          createdAt: new Date().toISOString(),
        };
        return NextResponse.json({ success: true, interview });
      }

      case 'submit_feedback': {
        // 提交面试反馈
        const feedbackRecord = {
          interviewId,
          candidateId,
          feedback: feedback || {},
          scores: scores || [],
          submittedAt: new Date().toISOString(),
        };
        return NextResponse.json({ success: true, feedback: feedbackRecord });
      }

      case 'generate_questions': {
        // 根据候选人背景生成面试问题
        const questions = generateInterviewQuestions(body.candidate);
        return NextResponse.json({ success: true, questions });
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: '操作失败', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get('candidateId');

  // 返回面试记录（模拟）
  await new Promise(r => setTimeout(r, 500));

  const interviews = [
    {
      id: 'interview-001',
      candidateId: candidateId || 'c001',
      interviewerName: '张经理',
      scheduledAt: new Date().toISOString(),
      status: 'completed',
      feedback: {
        overallRating: 4,
        dimensions: [
          { name: '技术能力', rating: 4, comment: 'React 基础扎实' },
          { name: '沟通表达', rating: 4, comment: '表达清晰' },
          { name: '项目经验', rating: 5, comment: '项目经验丰富' },
        ],
        recommendation: 'hire',
        summary: '候选人技术能力优秀，建议录用',
      },
    },
  ];

  return NextResponse.json({ success: true, interviews });
}

function generateInterviewQuestions(candidate: Record<string, unknown>) {
  const skills = (candidate.skills as string[]) || [];
  const projects = (candidate.projects as { name: string; description: string }[]) || [];

  const questions = [
    {
      type: '专业能力',
      question: `请详细介绍你在${skills[0] || '前端'}方面的使用经验和深入理解？`,
      purpose: '考察核心技能的深度',
      scoringCriteria: '能说出原理、最佳实践、踩坑经验',
      expectedAnswer: '应包含：1. 使用场景 2. 核心原理 3. 性能优化经验',
    },
    {
      type: '项目深挖',
      question: projects[0]
        ? `你提到的「${projects[0].name}」项目，你具体负责哪些部分？遇到过什么技术难点？`
        : '请介绍一个你最有成就感的项目，你在其中的角色是什么？',
      purpose: '了解实际项目参与深度',
      scoringCriteria: '能清晰描述个人贡献、技术方案、解决的问题',
    },
    {
      type: '情景判断',
      question: '如果产品经理突然要求在一个已排期的功能上增加复杂交互，你会怎么处理？',
      purpose: '考察需求管理和沟通协调能力',
      scoringCriteria: '能平衡需求与排期，有沟通策略',
    },
    {
      type: '团队协作',
      question: '在代码评审中，如果你和同事对某个实现方案有分歧，你会怎么处理？',
      purpose: '了解团队协作和冲突解决方式',
      scoringCriteria: '能展示开放心态、有理有据地表达观点',
    },
  ];

  return questions;
}
