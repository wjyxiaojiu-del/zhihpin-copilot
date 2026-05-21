import { NextResponse } from 'next/server';
import { aiChat, extractJSON, isAIAvailable } from '@/lib/ai/client';

function generateFallbackJD(title: string, city: string, industry: string) {
  return {
    generatedJD: {
      responsibilities: [
        `负责${title}相关的日常工作`,
        '参与团队技术方案讨论与评审',
        '编写高质量代码并参与代码评审',
        '持续优化工作流程和提升效率',
      ],
      requirements: [
        '本科及以上学历',
        '具备相关领域工作经验',
        '良好的沟通能力和团队协作意识',
        '较强的学习能力和责任心',
      ],
      bonuses: [
        '有大型项目经验',
        '有技术博客或开源贡献',
      ],
      interviewFocus: [
        '考察专业能力深度',
        '了解项目经验和解决问题能力',
        '评估沟通和团队协作能力',
      ],
      salaryRange: '面议',
    },
    matchRules: {
      mustHave: ['相关经验'],
      niceToHave: ['大厂背景'],
      eliminationCriteria: ['虚假简历'],
      schoolTier: '本科',
      degree: '本科',
      minWorkYears: 1,
      salaryRange: [15000, 30000],
      city: city || '北京',
      industry: industry || '互联网',
    },
  };
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, companyType, responsibilities, requirements, city, industry } = body;

  if (!isAIAvailable()) {
    return NextResponse.json({ success: true, aiPowered: false, ...generateFallbackJD(title, city, industry) });
  }

  const prompt = `你是一个专业的 HR 顾问。根据以下岗位信息，生成结构化的 JD 和匹配规则。

岗位：${title}
公司类型：${companyType || '未指定'}
城市：${city || '未指定'}
行业：${industry || '未指定'}
基础职责：${responsibilities || '未指定'}
基础要求：${requirements || '未指定'}

请返回 JSON 格式：
{
  "generatedJD": {
    "responsibilities": ["职责1", "职责2", ...],
    "requirements": ["要求1", "要求2", ...],
    "bonuses": ["加分项1", "加分项2", ...],
    "interviewFocus": ["面试重点1", "面试重点2", ...],
    "salaryRange": "薪资范围"
  },
  "matchRules": {
    "mustHave": ["硬性条件1", "硬性条件2", ...],
    "niceToHave": ["加分项1", "加分项2", ...],
    "eliminationCriteria": ["淘汰项1", "淘汰项2", ...],
    "schoolTier": "211",
    "degree": "本科",
    "minWorkYears": 3,
    "salaryRange": [20000, 35000],
    "city": "${city || '北京'}",
    "industry": "${industry || '互联网'}"
  }
}

只返回 JSON，不要其他内容。`;

  try {
    const response = await aiChat([{ role: 'user', content: prompt }]);
    const data = extractJSON(response) as Record<string, unknown>;
    return NextResponse.json({ success: true, aiPowered: true, ...data });
  } catch {
    return NextResponse.json({ success: true, aiPowered: false, ...generateFallbackJD(title, city, industry) });
  }
}
