import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { aiChat, extractJSON, isAIAvailable } from '@/lib/ai/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get('candidateId');

  const where = candidateId ? { candidateId } : {};
  const evaluations = await prisma.evaluation.findMany({ where, orderBy: { createdAt: 'desc' } });

  return NextResponse.json(evaluations.map(e => ({
    ...e,
    dimensions: JSON.parse(e.dimensions),
    strengths: JSON.parse(e.strengths),
    risks: JSON.parse(e.risks),
  })));
}

function generateFallbackEvaluation(candidate: { name: string; school: string; schoolTier: string; degree: string; workYears: number; jobHoppingCount: number; expectedSalary: string }, skills: string[], matchRules: { mustHave?: string[]; degree?: string; minWorkYears?: number }) {
  const mustHave = matchRules.mustHave || [];
  const matchedSkills = mustHave.filter(s => skills.some(cs => cs.toLowerCase().includes(s.toLowerCase())));
  const skillScore = mustHave.length > 0 ? Math.round((matchedSkills.length / mustHave.length) * 100) : 70;

  const degreeScores: Record<string, number> = { '博士': 100, '硕士': 85, '本科': 70, '大专': 50 };
  const degreeScore = degreeScores[candidate.degree] || 60;
  const expScore = Math.min(100, 50 + candidate.workYears * 10);
  const hardScore = Math.round((degreeScore + expScore) / 2);

  const tierScores: Record<string, number> = { '985': 90, '211': 80, '双非': 65, '二本': 55, '大专': 45 };
  const potentialScore = tierScores[candidate.schoolTier] || 60;
  const stabilityScore = Math.max(40, 100 - candidate.jobHoppingCount * 20);

  const dimensions = [
    { key: 'hardMatch', label: '硬性匹配', weight: 0.3, score: hardScore, evidences: [{ source: `${candidate.degree}`, dimension: '学历', score: degreeScore, explanation: `${candidate.degree}学历` }] },
    { key: 'skillMatch', label: '技能匹配', weight: 0.25, score: skillScore, evidences: matchedSkills.map(s => ({ source: s, dimension: '技能', score: 100, explanation: `掌握 ${s}` })) },
    { key: 'projectMatch', label: '项目相关性', weight: 0.2, score: 65, evidences: [] },
    { key: 'salaryMatch', label: '薪资匹配', weight: 0.1, score: 70, evidences: [{ source: candidate.expectedSalary, dimension: '薪资', score: 70, explanation: '薪资待评估' }] },
    { key: 'stability', label: '稳定性', weight: 0.1, score: stabilityScore, evidences: [] },
    { key: 'potential', label: '成长潜力', weight: 0.05, score: potentialScore, evidences: [] },
  ];

  const overallScore = Math.round(dimensions.reduce((sum, d) => sum + d.score * d.weight, 0));
  const level = overallScore >= 85 ? '强烈推荐' : overallScore >= 70 ? '推荐' : overallScore >= 55 ? '待观察' : '不推荐';

  return {
    overallScore, level,
    dimensions: dimensions.map(d => ({ ...d, weightedScore: Math.round(d.score * d.weight) })),
    strengths: matchedSkills.length > 0 ? [{ text: `技能匹配：${matchedSkills.join('、')}`, evidence: '' }] : [],
    risks: candidate.jobHoppingCount >= 2 ? [{ text: `跳槽${candidate.jobHoppingCount}次`, evidence: '' }] : [],
    summary: `${candidate.name}，${candidate.school}${candidate.degree}，${candidate.workYears}年经验。综合匹配度 ${overallScore}%，评级「${level}」。`,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { candidateId, jobId } = body;

    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!candidate || !job) {
      return NextResponse.json({ error: '候选人或岗位不存在' }, { status: 404 });
    }

    const matchRules = job.matchRules ? JSON.parse(job.matchRules) : {};
    const candidateSkills = JSON.parse(candidate.skills);
    const candidateProjects = JSON.parse(candidate.projects);

    // AI 评估 or 规则降级
    let data: Record<string, unknown>;

    if (isAIAvailable()) {
      const prompt = `你是一个专业的招聘评估引擎。根据候选人简历和岗位要求，进行六维度评分。

## 岗位信息
岗位：${job.title}
匹配规则：${JSON.stringify(matchRules, null, 2)}

## 候选人信息
姓名：${candidate.name}
学校：${candidate.school}（${candidate.schoolTier}）
学历：${candidate.degree}，专业：${candidate.major}
工作年限：${candidate.workYears}年
当前公司：${candidate.currentCompany}
当前职位：${candidate.currentTitle}
跳槽次数：${candidate.jobHoppingCount}
期望薪资：${candidate.expectedSalary}
技能：${candidateSkills.join('、')}
项目经历：${candidateProjects.map((p: { name: string; description: string }) => `${p.name} - ${p.description}`).join('; ')}

请返回 JSON（只返回 JSON，不要其他内容）：
{
  "overallScore": 85,
  "level": "强烈推荐/推荐/待观察/不推荐",
  "dimensions": [
    { "key": "hardMatch", "label": "硬性匹配", "weight": 0.3, "score": 90, "evidences": [{"source": "简历原文", "dimension": "学历要求", "score": 100, "explanation": "满足要求"}] },
    { "key": "skillMatch", "label": "技能匹配", "weight": 0.25, "score": 80, "evidences": [] },
    { "key": "projectMatch", "label": "项目相关性", "weight": 0.2, "score": 85, "evidences": [] },
    { "key": "salaryMatch", "label": "薪资匹配", "weight": 0.1, "score": 70, "evidences": [] },
    { "key": "stability", "label": "稳定性", "weight": 0.1, "score": 80, "evidences": [] },
    { "key": "potential", "label": "成长潜力", "weight": 0.05, "score": 75, "evidences": [] }
  ],
  "strengths": [{"text": "优势描述", "evidence": "简历证据"}],
  "risks": [{"text": "风险描述", "evidence": "简历证据"}],
  "summary": "综合评语"
}`;

      try {
        const response = await aiChat([{ role: 'user', content: prompt }], { temperature: 0.2 });
        data = extractJSON(response) as Record<string, unknown>;
      } catch {
        data = generateFallbackEvaluation(candidate, candidateSkills, matchRules) as unknown as Record<string, unknown>;
      }
    } else {
      data = generateFallbackEvaluation(candidate, candidateSkills, matchRules) as unknown as Record<string, unknown>;
    }

    const dimensions = (data.dimensions as Array<Record<string, unknown>>).map(d => ({
      ...d,
      weightedScore: Math.round((d.score as number) * (d.weight as number)),
    }));

    const evaluation = await prisma.evaluation.create({
      data: {
        candidateId,
        jobId,
        overallScore: data.overallScore as number,
        level: data.level as string,
        dimensions: JSON.stringify(dimensions),
        strengths: JSON.stringify(data.strengths),
        risks: JSON.stringify(data.risks),
        summary: data.summary as string,
      },
    });

    return NextResponse.json({
      ...evaluation,
      dimensions,
      strengths: data.strengths,
      risks: data.risks,
    });
  } catch (error) {
    return NextResponse.json({ error: '评估失败', details: String(error) }, { status: 500 });
  }
}
