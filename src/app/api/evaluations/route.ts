import { NextResponse } from 'next/server';

// 评估 API - 基于证据链的候选人评分
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { candidate, jobId } = body;

    if (!candidate) {
      return NextResponse.json({ error: '缺少候选人数据' }, { status: 400 });
    }

    // 模拟 AI 评分过程
    await new Promise(r => setTimeout(r, 1500));

    // 基于简历内容的评分逻辑
    const evaluation = generateEvaluation(candidate, jobId || 'job-001');

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    return NextResponse.json(
      { error: '评估失败', details: String(error) },
      { status: 500 }
    );
  }
}

function generateEvaluation(candidate: Record<string, unknown>, jobId: string) {
  const skills = (candidate.skills as string[]) || [];
  const resumeText = (candidate.resumeText as string) || '';

  // 技能匹配评分
  const coreSkills = ['React', 'TypeScript', 'Node.js'];
  const matchedCore = coreSkills.filter(s =>
    skills.some((cs: string) => cs.toLowerCase().includes(s.toLowerCase()))
  );
  const skillScore = Math.round((matchedCore.length / coreSkills.length) * 100);

  // 学历评分
  const degreeScores: Record<string, number> = { '博士': 100, '硕士': 85, '本科': 70, '大专': 50 };
  const degreeScore = degreeScores[candidate.degree as string] || 60;

  // 经验评分
  const workYears = candidate.workYears as number || 0;
  const expScore = Math.min(100, 50 + workYears * 10);

  // 项目评分
  const projects = (candidate.projects as { name: string; description: string }[]) || [];
  const projectScore = Math.min(100, 40 + projects.length * 15);

  // 稳定性评分
  const jobHopping = candidate.jobHoppingCount as number || 0;
  const stabilityScore = Math.max(40, 100 - jobHopping * 20);

  // 潜力评分
  const schoolTierScores: Record<string, number> = { '985': 90, '211': 80, '双非': 65, '二本': 55, '大专': 45 };
  const potentialScore = schoolTierScores[candidate.schoolTier as string] || 60;

  const dimensions = [
    {
      key: 'hardMatch',
      label: '硬性匹配',
      weight: 0.3,
      score: Math.round((degreeScore + (candidate.schoolTier === '985' ? 90 : 70) + expScore) / 3),
      evidences: [
        { source: `学历：${candidate.degree}`, dimension: '学历要求', score: degreeScore, explanation: `${candidate.degree}学历` },
        { source: `学校：${candidate.school}`, dimension: '学校层次', score: schoolTierScores[candidate.schoolTier as string] || 60, explanation: `${candidate.schoolTier}层次` },
      ],
    },
    {
      key: 'skillMatch',
      label: '技能匹配',
      weight: 0.25,
      score: skillScore,
      evidences: skills.slice(0, 5).map((s: string) => ({
        source: `技能：${s}`,
        dimension: '技能匹配',
        score: coreSkills.some(cs => s.toLowerCase().includes(cs.toLowerCase())) ? 100 : 60,
        explanation: `候选人掌握 ${s}`,
      })),
    },
    {
      key: 'projectMatch',
      label: '项目相关性',
      weight: 0.2,
      score: projectScore,
      evidences: projects.slice(0, 3).map((p: { name: string; description: string }) => ({
        source: `项目：${p.name}`,
        dimension: '项目经历',
        score: 80,
        explanation: p.description.substring(0, 100),
      })),
    },
    {
      key: 'salaryMatch',
      label: '薪资匹配',
      weight: 0.1,
      score: 75,
      evidences: [{ source: `期望：${candidate.expectedSalary}`, dimension: '薪资期望', score: 75, explanation: '薪资在合理范围' }],
    },
    {
      key: 'stability',
      label: '稳定性',
      weight: 0.1,
      score: stabilityScore,
      evidences: [{ source: '', dimension: '跳槽次数', score: stabilityScore, explanation: `跳槽${jobHopping}次` }],
    },
    {
      key: 'potential',
      label: '成长潜力',
      weight: 0.05,
      score: potentialScore,
      evidences: [{ source: '', dimension: '学校背景', score: potentialScore, explanation: `${candidate.schoolTier}学校` }],
    },
  ];

  // 计算加权总分
  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0)
  );

  const level = overallScore >= 85 ? '强烈推荐'
    : overallScore >= 70 ? '推荐'
    : overallScore >= 55 ? '待观察'
    : '不推荐';

  return {
    id: `eval-${candidate.id}-${Date.now()}`,
    candidateId: candidate.id,
    jobId,
    overallScore,
    level,
    dimensions: dimensions.map(d => ({
      ...d,
      weightedScore: Math.round(d.score * d.weight),
    })),
    strengths: matchedCore.length > 0
      ? [{ text: `核心技能匹配：${matchedCore.join('、')}`, evidence: skills.join('、') }]
      : [],
    risks: jobHopping >= 2
      ? [{ text: `跳槽${jobHopping}次，稳定性风险`, evidence: '' }]
      : [],
    summary: `${candidate.name}，${candidate.school}${candidate.degree}，${workYears}年经验。综合匹配度${overallScore}%，评级「${level}」。`,
    createdAt: new Date().toISOString(),
  };
}
