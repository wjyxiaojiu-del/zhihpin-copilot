// 招聘流程状态
export type CandidateStage = 'applied' | 'screened' | 'interview' | 'offer' | 'hired' | 'rejected';

// 候选人完整数据
export interface CandidateRecord {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  age: number;
  gender: string;
  school: string;
  schoolTier: '985' | '211' | '双非' | '二本' | '大专';
  degree: '博士' | '硕士' | '本科' | '大专';
  major: string;
  workYears: number;
  currentCompany: string;
  currentTitle: string;
  jobHoppingCount: number;
  expectedSalary: string;
  background: string;
  skills: string[];
  projects: { name: string; description: string }[];
  expectedPosition: string;
  stage: CandidateStage;
  jobId: string;
  appliedAt: string;
  updatedAt: string;
  resumeText?: string;
  resumeFileName?: string;
}

// 证据链评分
export interface ScoreEvidence {
  source: string;       // 简历原文依据
  dimension: string;    // 评分维度
  score: number;        // 分数
  explanation: string;  // 评分理由
}

// 评分维度
export interface ScoreDimension {
  key: string;
  label: string;
  weight: number;       // HR 可调权重 0-1
  score: number;        // 原始分数 0-100
  weightedScore: number; // 加权分数
  evidences: ScoreEvidence[];
}

// 完整评估结果
export interface Evaluation {
  id: string;
  candidateId: string;
  jobId: string;
  overallScore: number;
  level: '强烈推荐' | '推荐' | '待观察' | '不推荐';
  dimensions: ScoreDimension[];
  strengths: { text: string; evidence: string }[];
  risks: { text: string; evidence: string }[];
  summary: string;
  createdAt: string;
}

// 岗位匹配规则
export interface MatchRules {
  mustHave: string[];         // 硬性条件
  niceToHave: string[];       // 加分项
  eliminationCriteria: string[]; // 淘汰项
  schoolTier: string;
  degree: string;
  minWorkYears: number;
  maxWorkYears?: number;
  salaryRange: [number, number];
  city: string;
  industry: string;
}

// 岗位画像
export interface JobProfile {
  id: string;
  title: string;
  companyType: string;
  headcount: number;
  responsibilities: string;
  requirements: string;
  city: string;
  industry: string;
  generatedJD?: {
    responsibilities: string[];
    requirements: string[];
    bonuses: string[];
    interviewFocus: string[];
    salaryRange: string;
  };
  matchRules?: MatchRules;
  createdAt: string;
}

// 面试记录
export interface InterviewRecord {
  id: string;
  candidateId: string;
  jobId: string;
  interviewerName: string;
  scheduledAt: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending_feedback';
  questions: InterviewQuestion[];
  feedback?: InterviewFeedback;
}

export interface InterviewQuestion {
  type: '专业能力' | '项目深挖' | '情景判断' | '团队协作';
  question: string;
  purpose: string;
  scoringCriteria?: string;
  expectedAnswer?: string;
}

export interface InterviewFeedback {
  overallRating: number;     // 1-5
  dimensions: {
    name: string;
    rating: number;
    comment: string;
  }[];
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
  summary: string;
  submittedAt: string;
  submittedBy: string;
}

// 今日待办
export interface TodoItem {
  id: string;
  type: 'new_application' | 'overdue_feedback' | 'high_match_no_contact' | 'offer_risk' | 'interview_today' | 'follow_up';
  priority: 'urgent' | 'high' | 'medium';
  title: string;
  description: string;
  candidateId?: string;
  candidateName?: string;
  jobId?: string;
  actionLabel: string;
  actionHref: string;
  createdAt: string;
}

// 飞书配置
export interface FeishuConfig {
  appId: string;
  appSecret: string;
  webhookUrl: string;
  loginEnabled: boolean;
  docEnabled: boolean;
  pushEnabled: boolean;
}

// 面试评分记录（面试官打分用）
export interface InterviewScoreRecord {
  interviewId: string;
  candidateId: string;
  scores: {
    dimension: string;
    score: number;
    comment: string;
  }[];
  overallComment: string;
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
  interviewerName: string;
  submittedAt: string;
}
