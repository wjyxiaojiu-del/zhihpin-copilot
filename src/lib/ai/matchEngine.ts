import type { CandidateRecord, MatchRules, ScoreDimension, ScoreEvidence, Evaluation } from '../types';

// 证据链评分引擎
export function evaluateCandidate(
  candidate: CandidateRecord,
  rules: MatchRules,
  jobId: string
): Evaluation {
  const dimensions: ScoreDimension[] = [];
  const resumeText = candidate.resumeText || '';

  // 1. 硬性匹配 (权重 0.3)
  const hardMatch = evaluateHardMatch(candidate, rules, resumeText);
  dimensions.push(hardMatch);

  // 2. 技能匹配 (权重 0.25)
  const skillMatch = evaluateSkillMatch(candidate, rules, resumeText);
  dimensions.push(skillMatch);

  // 3. 项目相关性 (权重 0.2)
  const projectMatch = evaluateProjectMatch(candidate, rules, resumeText);
  dimensions.push(projectMatch);

  // 4. 薪资匹配 (权重 0.1)
  const salaryMatch = evaluateSalaryMatch(candidate, rules, resumeText);
  dimensions.push(salaryMatch);

  // 5. 稳定性 (权重 0.1)
  const stabilityMatch = evaluateStability(candidate, rules, resumeText);
  dimensions.push(stabilityMatch);

  // 6. 潜力 (权重 0.05)
  const potentialMatch = evaluatePotential(candidate, rules, resumeText);
  dimensions.push(potentialMatch);

  // 计算总分
  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.weightedScore, 0)
  );

  // 确定等级
  const level = overallScore >= 85 ? '强烈推荐'
    : overallScore >= 70 ? '推荐'
    : overallScore >= 55 ? '待观察'
    : '不推荐';

  // 提取优势和风险（带证据）
  const strengths = extractStrengths(candidate, dimensions, resumeText);
  const risks = extractRisks(candidate, rules, dimensions, resumeText);

  // 生成评语
  const summary = generateSummary(candidate, overallScore, level, strengths, risks);

  return {
    id: `eval-${candidate.id}-${Date.now()}`,
    candidateId: candidate.id,
    jobId,
    overallScore,
    level,
    dimensions,
    strengths,
    risks,
    summary,
    createdAt: new Date().toISOString(),
  };
}

function evaluateHardMatch(c: CandidateRecord, r: MatchRules, resume: string): ScoreDimension {
  const evidences: ScoreEvidence[] = [];
  let totalScore = 0;
  let checks = 0;

  // 学历检查
  const degreeOrder = ['大专', '本科', '硕士', '博士'];
  const degreeOk = degreeOrder.indexOf(c.degree) >= degreeOrder.indexOf(r.degree);
  checks++;
  if (degreeOk) totalScore += 100;
  evidences.push({
    source: findEvidence(resume, c.degree),
    dimension: '学历要求',
    score: degreeOk ? 100 : 0,
    explanation: `要求${r.degree}及以上，候选人${c.degree}${degreeOk ? '，满足' : '，不满足'}`,
  });

  // 学校层次
  const tierOrder = ['大专', '二本', '双非', '211', '985'];
  const schoolOk = tierOrder.indexOf(c.schoolTier) >= tierOrder.indexOf(r.schoolTier);
  checks++;
  if (schoolOk) totalScore += 100;
  evidences.push({
    source: findEvidence(resume, c.school),
    dimension: '学校层次',
    score: schoolOk ? 100 : 0,
    explanation: `要求${r.schoolTier}及以上，候选人${c.schoolTier}（${c.school}）${schoolOk ? '，满足' : '，不满足'}`,
  });

  // 工作年限
  const yearsOk = c.workYears >= r.minWorkYears;
  checks++;
  if (yearsOk) totalScore += 100;
  evidences.push({
    source: findEvidence(resume, `${c.workYears}`),
    dimension: '工作经验',
    score: yearsOk ? 100 : 0,
    explanation: `要求${r.minWorkYears}年+，候选人${c.workYears}年${yearsOk ? '，满足' : '，不满足'}`,
  });

  const avgScore = checks > 0 ? Math.round(totalScore / checks) : 0;

  return {
    key: 'hardMatch',
    label: '硬性匹配',
    weight: 0.3,
    score: avgScore,
    weightedScore: Math.round(avgScore * 0.3),
    evidences,
  };
}

function evaluateSkillMatch(c: CandidateRecord, r: MatchRules, resume: string): ScoreDimension {
  const evidences: ScoreEvidence[] = [];

  const mustHaveMatch = r.mustHave.filter(s =>
    c.skills.some(cs => cs.toLowerCase().includes(s.toLowerCase()))
  );
  const mustHaveMiss = r.mustHave.filter(s =>
    !c.skills.some(cs => cs.toLowerCase().includes(s.toLowerCase()))
  );
  const niceMatch = r.niceToHave.filter(s =>
    c.skills.some(cs => cs.toLowerCase().includes(s.toLowerCase()))
  );

  const mustScore = r.mustHave.length > 0
    ? Math.round((mustHaveMatch.length / r.mustHave.length) * 100)
    : 100;
  const niceBonus = r.niceToHave.length > 0
    ? Math.round((niceMatch.length / r.niceToHave.length) * 20)
    : 0;
  const score = Math.min(100, mustScore + niceBonus);

  // 为每个匹配的技能生成证据
  for (const skill of mustHaveMatch) {
    evidences.push({
      source: findEvidence(resume, skill),
      dimension: '核心技能匹配',
      score: 100,
      explanation: `核心技能「${skill}」匹配`,
    });
  }
  for (const skill of mustHaveMiss) {
    evidences.push({
      source: '',
      dimension: '核心技能缺失',
      score: 0,
      explanation: `核心技能「${skill}」未在简历中找到`,
    });
  }

  return {
    key: 'skillMatch',
    label: '技能匹配',
    weight: 0.25,
    score,
    weightedScore: Math.round(score * 0.25),
    evidences,
  };
}

function evaluateProjectMatch(c: CandidateRecord, r: MatchRules, resume: string): ScoreDimension {
  const evidences: ScoreEvidence[] = [];
  let score = 50; // 基础分

  // 检查项目是否包含相关关键词
  const allProjectText = c.projects.map(p => `${p.name} ${p.description}`).join(' ');
  const relevantKeywords = [...r.mustHave, ...r.niceToHave];

  let matchCount = 0;
  for (const kw of relevantKeywords) {
    if (allProjectText.toLowerCase().includes(kw.toLowerCase())) {
      matchCount++;
      evidences.push({
        source: findEvidence(resume, kw),
        dimension: '项目相关性',
        score: 80,
        explanation: `项目经历中包含关键词「${kw}」`,
      });
    }
  }

  if (relevantKeywords.length > 0) {
    score = Math.min(100, 50 + Math.round((matchCount / relevantKeywords.length) * 50));
  }

  // 大厂加分
  const bigCompanies = ['字节跳动', '阿里巴巴', '腾讯', '美团', '百度', '京东', '华为', '小米'];
  if (bigCompanies.some(co => c.currentCompany.includes(co))) {
    score = Math.min(100, score + 15);
    evidences.push({
      source: findEvidence(resume, c.currentCompany),
      dimension: '公司背景',
      score: 90,
      explanation: `${c.currentCompany} 大厂背景，项目质量有保障`,
    });
  }

  return {
    key: 'projectMatch',
    label: '项目相关性',
    weight: 0.2,
    score: Math.min(100, score),
    weightedScore: Math.round(Math.min(100, score) * 0.2),
    evidences,
  };
}

function evaluateSalaryMatch(c: CandidateRecord, r: MatchRules, resume: string): ScoreDimension {
  const evidences: ScoreEvidence[] = [];

  // 解析期望薪资
  const salaryMatch = c.expectedSalary.match(/(\d+)K?-(\d+)K?/i);
  let score = 70;

  if (salaryMatch) {
    const low = parseInt(salaryMatch[1]) * (c.expectedSalary.includes('K') || c.expectedSalary.includes('k') ? 1000 : 1);
    const high = parseInt(salaryMatch[2]) * (c.expectedSalary.includes('K') || c.expectedSalary.includes('k') ? 1000 : 1);
    const avg = (low + high) / 2;
    const budgetMid = (r.salaryRange[0] + r.salaryRange[1]) / 2;

    if (avg <= r.salaryRange[1]) {
      score = 90;
      evidences.push({
        source: findEvidence(resume, c.expectedSalary),
        dimension: '薪资匹配',
        score: 90,
        explanation: `期望薪资 ${c.expectedSalary} 在预算范围内`,
      });
    } else if (avg <= r.salaryRange[1] * 1.2) {
      score = 60;
      evidences.push({
        source: findEvidence(resume, c.expectedSalary),
        dimension: '薪资匹配',
        score: 60,
        explanation: `期望薪资 ${c.expectedSalary} 略超预算，需谈判`,
      });
    } else {
      score = 30;
      evidences.push({
        source: findEvidence(resume, c.expectedSalary),
        dimension: '薪资匹配',
        score: 30,
        explanation: `期望薪资 ${c.expectedSalary} 严重超出预算`,
      });
    }
  }

  return {
    key: 'salaryMatch',
    label: '薪资匹配',
    weight: 0.1,
    score,
    weightedScore: Math.round(score * 0.1),
    evidences,
  };
}

function evaluateStability(c: CandidateRecord, r: MatchRules, resume: string): ScoreDimension {
  const evidences: ScoreEvidence[] = [];
  let score = 80;

  // 跳槽次数
  if (c.jobHoppingCount === 0) {
    score = 90;
    evidences.push({
      source: '',
      dimension: '跳槽频率',
      score: 90,
      explanation: '无跳槽记录，稳定性好',
    });
  } else if (c.jobHoppingCount === 1) {
    score = 75;
    evidences.push({
      source: findEvidence(resume, c.currentCompany),
      dimension: '跳槽频率',
      score: 75,
      explanation: `跳槽 ${c.jobHoppingCount} 次，属正常范围`,
    });
  } else {
    score = 50;
    evidences.push({
      source: '',
      dimension: '跳槽频率',
      score: 50,
      explanation: `跳槽 ${c.jobHoppingCount} 次，需关注稳定性`,
    });
  }

  // 淘汰项检查
  if (r.eliminationCriteria) {
    for (const criteria of r.eliminationCriteria) {
      if (criteria.includes('频繁跳槽') && c.jobHoppingCount >= 3) {
        score = Math.min(score, 20);
        evidences.push({
          source: '',
          dimension: '淘汰项',
          score: 0,
          explanation: `命中淘汰项：${criteria}`,
        });
      }
    }
  }

  return {
    key: 'stability',
    label: '稳定性',
    weight: 0.1,
    score,
    weightedScore: Math.round(score * 0.1),
    evidences,
  };
}

function evaluatePotential(c: CandidateRecord, r: MatchRules, resume: string): ScoreDimension {
  const evidences: ScoreEvidence[] = [];
  let score = 60;

  // 学历潜力
  if (c.degree === '博士') { score += 20; }
  else if (c.degree === '硕士') { score += 10; }

  // 名校潜力
  if (c.schoolTier === '985') { score += 15; }
  else if (c.schoolTier === '211') { score += 10; }

  // 年轻候选人潜力
  if (c.age <= 25 && c.workYears >= 1) {
    score += 10;
    evidences.push({
      source: '',
      dimension: '成长潜力',
      score: 85,
      explanation: `${c.age}岁，${c.workYears}年经验，成长空间大`,
    });
  }

  score = Math.min(100, score);

  return {
    key: 'potential',
    label: '成长潜力',
    weight: 0.05,
    score,
    weightedScore: Math.round(score * 0.05),
    evidences,
  };
}

// 从简历中找证据
function findEvidence(resume: string, keyword: string): string {
  if (!resume || !keyword) return '';
  const lines = resume.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      return line.trim().substring(0, 100);
    }
  }
  return '';
}

function extractStrengths(c: CandidateRecord, dims: ScoreDimension[], resume: string) {
  const strengths: { text: string; evidence: string }[] = [];

  // 从高分维度提取
  for (const d of dims) {
    if (d.score >= 80) {
      const topEvidence = d.evidences.find(e => e.score >= 80);
      strengths.push({
        text: `${d.label}表现优秀（${d.score}分）`,
        evidence: topEvidence?.source || '',
      });
    }
  }

  // 额外优势
  if (c.schoolTier === '985') {
    strengths.push({ text: '985 名校背景', evidence: findEvidence(resume, c.school) });
  }
  if (c.workYears >= 3) {
    strengths.push({ text: `${c.workYears}年丰富工作经验`, evidence: '' });
  }

  return strengths.slice(0, 5);
}

function extractRisks(c: CandidateRecord, r: MatchRules, dims: ScoreDimension[], resume: string) {
  const risks: { text: string; evidence: string }[] = [];

  // 从低分维度提取
  for (const d of dims) {
    if (d.score < 60) {
      const lowEvidence = d.evidences.find(e => e.score < 60);
      risks.push({
        text: `${d.label}不足（${d.score}分）`,
        evidence: lowEvidence?.explanation || '',
      });
    }
  }

  // 额外风险
  if (c.jobHoppingCount >= 2) {
    risks.push({ text: `跳槽 ${c.jobHoppingCount} 次，稳定性风险`, evidence: '' });
  }

  const salaryMatch = c.expectedSalary.match(/(\d+)/);
  if (salaryMatch && parseInt(salaryMatch[1]) * 1000 > r.salaryRange[1]) {
    risks.push({ text: `期望薪资 ${c.expectedSalary} 可能超出预算`, evidence: findEvidence(resume, c.expectedSalary) });
  }

  return risks.slice(0, 5);
}

function generateSummary(c: CandidateRecord, score: number, level: string, strengths: { text: string }[], risks: { text: string }[]) {
  const parts = [
    `${c.name}，${c.school}${c.degree}，${c.workYears}年经验。`,
    `综合匹配度 ${score}%，评级「${level}」。`,
  ];

  if (strengths.length > 0) {
    parts.push(`核心优势：${strengths.slice(0, 2).map(s => s.text).join('、')}。`);
  }
  if (risks.length > 0) {
    parts.push(`需关注：${risks.slice(0, 2).map(r => r.text).join('、')}。`);
  }

  if (score >= 85) {
    parts.push('建议优先安排面试，重点确认薪资预期和到岗时间。');
  } else if (score >= 70) {
    parts.push('建议安排面试进一步评估。');
  } else if (score >= 55) {
    parts.push('可作为备选，建议面试时重点验证技术能力。');
  } else {
    parts.push('当前岗位匹配度较低，建议谨慎考虑。');
  }

  return parts.join('');
}

// HR 权重调整后重新计算
export function recalculateWithWeights(evalResult: Evaluation, newWeights: Record<string, number>): Evaluation {
  const updatedDims = evalResult.dimensions.map(d => ({
    ...d,
    weight: newWeights[d.key] ?? d.weight,
    weightedScore: Math.round(d.score * (newWeights[d.key] ?? d.weight)),
  }));

  const overallScore = Math.round(updatedDims.reduce((sum, d) => sum + d.weightedScore, 0));
  const level = overallScore >= 85 ? '强烈推荐' as const
    : overallScore >= 70 ? '推荐' as const
    : overallScore >= 55 ? '待观察' as const
    : '不推荐' as const;

  return {
    ...evalResult,
    dimensions: updatedDims,
    overallScore,
    level,
  };
}
