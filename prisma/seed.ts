import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean
  await prisma.interview.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();
  await prisma.feishuConfig.deleteMany();

  // Create job
  const job = await prisma.job.create({
    data: {
      id: 'job-001',
      title: '前端开发工程师',
      companyType: '互联网科技公司',
      headcount: 2,
      responsibilities: '负责公司核心产品的前端开发与维护',
      requirements: '3年以上前端开发经验',
      city: '北京',
      industry: '互联网',
      generatedJD: JSON.stringify({
        responsibilities: [
          '负责公司 SaaS 产品的前端架构设计与核心模块开发',
          '参与产品需求评审，提出前端技术方案并推动落地',
          '优化前端性能，提升页面加载速度和用户交互体验',
          '编写高质量、可维护的前端代码，参与代码评审',
          '与后端、产品、设计团队紧密协作，确保项目按时交付',
        ],
        requirements: [
          '本科及以上学历，计算机相关专业优先',
          '3 年以上前端开发经验，熟练掌握 React/Vue 生态',
          '精通 TypeScript、HTML5、CSS3，熟悉响应式布局',
          '熟悉 Webpack/Vite 等构建工具，有性能优化经验',
          '具备良好的代码规范和团队协作意识',
        ],
        bonuses: [
          '有大型 SaaS 产品开发经验',
          '熟悉 Node.js，有全栈开发能力',
          '有微前端、低代码平台等技术实践',
          '参与过开源项目或有技术博客',
        ],
        interviewFocus: [
          '考察 React 核心原理（Hooks、虚拟 DOM、Diff 算法）',
          '通过项目经历评估实际工程能力',
          '了解性能优化思路和实战经验',
          '评估技术视野和学习能力',
        ],
        salaryRange: '20K-35K / 月（14 薪）',
      }),
      matchRules: JSON.stringify({
        mustHave: ['React', 'TypeScript', '3年以上经验'],
        niceToHave: ['Node.js', 'Webpack', '微前端', '性能优化'],
        eliminationCriteria: ['缺少核心技能（React/TypeScript）', '薪资严重超出预算 50% 以上', '频繁跳槽（2年内3次以上）'],
        schoolTier: '211',
        degree: '本科',
        minWorkYears: 2,
        salaryRange: [20000, 35000],
        city: '北京',
        industry: '互联网',
      }),
    },
  });

  // Candidates data
  const candidatesData = [
    {
      id: 'c001', name: '张明远', avatar: '张', phone: '138****6721', email: 'zhangmy@gmail.com',
      age: 27, gender: '男', school: '浙江大学', schoolTier: '985', degree: '硕士',
      major: '计算机科学与技术', workYears: 3, currentCompany: '字节跳动',
      currentTitle: '前端开发工程师', jobHoppingCount: 1, expectedSalary: '30K-40K',
      background: '3年大厂经验，现任字节跳动前端开发',
      skills: JSON.stringify(['React', 'TypeScript', 'Node.js', 'Webpack', '微前端', '性能优化', 'Docker', 'CI/CD']),
      projects: JSON.stringify([
        { name: '抖音创作者平台', description: '负责创作者数据分析模块，日活 50w+，独立完成前端架构选型和技术方案设计' },
        { name: '飞书审批流程', description: '独立完成审批流程可视化编辑器，支持复杂嵌套条件配置，用户满意度提升 35%' },
        { name: '内部组件库建设', description: '主导搭建部门级 React 组件库，覆盖 60+ 通用组件，接入 Storybook 文档' },
      ]),
      expectedPosition: '前端开发工程师', stage: 'interview',
      resumeText: `张明远 | 前端开发工程师\n手机: 138****6721 | 邮箱: zhangmy@gmail.com | 27岁 | 男\n\n教育背景: 浙江大学 | 硕士 | 计算机科学与技术 | 2019-2022\n工作经历: 字节跳动 | 前端开发工程师 | 2022.07 - 至今（3年）\n技术栈: React, TypeScript, Node.js, Webpack, Vite, Docker, CI/CD`,
    },
    {
      id: 'c002', name: '李思涵', avatar: '李', phone: '159****3842', email: 'lisihan@163.com',
      age: 25, gender: '女', school: '武汉大学', schoolTier: '985', degree: '本科',
      major: '软件工程', workYears: 2, currentCompany: '美团',
      currentTitle: '前端开发工程师', jobHoppingCount: 0, expectedSalary: '22K-28K',
      background: '2年中厂经验，现任美团前端开发',
      skills: JSON.stringify(['Vue', 'React', 'TypeScript', 'Sass', 'Git', 'Element UI', 'Webpack']),
      projects: JSON.stringify([
        { name: '美团商家后台', description: '负责订单管理模块重构，引入虚拟列表和懒加载，加载速度提升 40%' },
        { name: '营销活动页面', description: '累计完成 20+ 营销活动页面开发，搭建活动模板体系' },
        { name: '商家数据看板', description: '独立开发商家经营数据看板，集成 10+ 数据源' },
      ]),
      expectedPosition: '前端开发工程师', stage: 'interview',
      resumeText: `李思涵 | 前端开发工程师\n手机: 159****3842 | 邮箱: lisihan@163.com | 25岁 | 女\n\n教育背景: 武汉大学 | 本科 | 软件工程 | 2018-2022\n工作经历: 美团 | 前端开发工程师 | 2022.07 - 至今（2年）\n技术栈: Vue 3, React, TypeScript, Element UI, Webpack, Vite`,
    },
    {
      id: 'c003', name: '王浩宇', avatar: '王', phone: '176****9153', email: 'wanghaoyu@qq.com',
      age: 24, gender: '男', school: '南京邮电大学', schoolTier: '双非', degree: '本科',
      major: '信息工程', workYears: 1, currentCompany: '某创业公司',
      currentTitle: '前端开发', jobHoppingCount: 0, expectedSalary: '12K-16K',
      background: '1年创业公司经验',
      skills: JSON.stringify(['HTML', 'CSS', 'JavaScript', 'Vue', 'jQuery', 'Bootstrap', 'Element UI']),
      projects: JSON.stringify([
        { name: '企业官网', description: '独立完成 3 个企业官网前端开发，使用原生 JS + jQuery' },
        { name: '后台管理系统', description: '基于 Element UI 开发管理后台，包含用户、权限、报表模块' },
      ]),
      expectedPosition: '前端开发工程师', stage: 'screened',
      resumeText: `王浩宇 | 前端开发\n手机: 176****9153 | 邮箱: wanghaoyu@qq.com | 24岁 | 男\n\n教育背景: 南京邮电大学 | 本科 | 信息工程 | 2019-2023\n工作经历: 某创业公司 | 前端开发 | 2023.07 - 至今（1年）\n技术栈: HTML, CSS, JavaScript, Vue 2, Element UI, jQuery, Bootstrap`,
    },
    {
      id: 'c004', name: '陈雨桐', avatar: '陈', phone: '183****2746', email: 'chenyutong@foxmail.com',
      age: 26, gender: '女', school: '湖南工商大学', schoolTier: '二本', degree: '本科',
      major: '市场营销', workYears: 0, currentCompany: '无',
      currentTitle: '无', jobHoppingCount: 0, expectedSalary: '8K-12K',
      background: '转行前端，培训班6个月',
      skills: JSON.stringify(['HTML', 'CSS', 'JavaScript', 'React 基础', 'Git 基础']),
      projects: JSON.stringify([
        { name: '电商小程序（培训项目）', description: '培训班项目，仿写电商小程序，包含商品列表、购物车、订单' },
        { name: 'Todo App', description: '个人练手项目，使用 React Hooks 实现增删改查' },
        { name: '个人博客', description: '使用 Hexo 搭建的个人技术博客' },
      ]),
      expectedPosition: '前端开发工程师', stage: 'screened',
      resumeText: `陈雨桐 | 前端开发（转行）\n手机: 183****2746 | 邮箱: chenyutong@foxmail.com | 26岁 | 女\n\n教育背景: 湖南工商大学 | 本科 | 市场营销 | 2017-2021\n培训经历: 某 IT 培训机构 | 前端开发 | 2023.09 - 2024.02（6个月）\n技术栈: HTML, CSS, JavaScript, React（基础）, Git`,
    },
    {
      id: 'c005', name: '刘子轩', avatar: '刘', phone: '150****8394', email: 'liuzixuan@hust.edu.cn',
      age: 22, gender: '男', school: '华中科技大学', schoolTier: '985', degree: '本科',
      major: '计算机科学与技术', workYears: 0, currentCompany: '应届生',
      currentTitle: '无', jobHoppingCount: 0, expectedSalary: '15K-20K',
      background: '应届毕业生，无正式工作经验',
      skills: JSON.stringify(['React', 'TypeScript', 'CSS Modules', 'Git', 'Node.js 基础', '算法']),
      projects: JSON.stringify([
        { name: '毕业设计：在线协作文档', description: '基于 React + WebSocket 的实时协作编辑器，支持多人同时编辑' },
        { name: '校园二手交易平台', description: '团队项目（4人），负责前端开发，使用 React + Ant Design' },
        { name: 'ACM 竞赛', description: '校 ACM 队成员，获省级银奖' },
      ]),
      expectedPosition: '前端开发工程师', stage: 'applied',
      resumeText: `刘子轩 | 前端开发（应届）\n手机: 150****8394 | 邮箱: liuzixuan@hust.edu.cn | 22岁 | 男\n\n教育背景: 华中科技大学 | 本科 | 计算机科学与技术 | 2021-2025（应届）\n技术栈: React, TypeScript, Node.js（基础）, CSS Modules, Git, WebSocket`,
    },
  ];

  const now = new Date();
  for (let i = 0; i < candidatesData.length; i++) {
    const c = candidatesData[i];
    await prisma.candidate.create({
      data: {
        ...c,
        jobId: job.id,
        appliedAt: new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - i * 12 * 60 * 60 * 1000),
      },
    });
  }

  // Evaluations
  const evalsData = [
    { candidateId: 'c001', overallScore: 92, level: '强烈推荐',
      dimensions: [{ key: 'matchScore', label: '岗位匹配', weight: 0.3, score: 92, weightedScore: 28, evidences: [] }, { key: 'professional', label: '专业能力', weight: 0.25, score: 90, weightedScore: 23, evidences: [] }, { key: 'communication', label: '沟通表达', weight: 0.15, score: 85, weightedScore: 13, evidences: [] }, { key: 'potential', label: '成长潜力', weight: 0.15, score: 88, weightedScore: 13, evidences: [] }, { key: 'stability', label: '稳定性', weight: 0.15, score: 75, weightedScore: 11, evidences: [] }],
      strengths: [{ text: '大厂背景，技术扎实', evidence: '' }, { text: 'React 生态深度使用', evidence: '' }],
      risks: [{ text: '薪资期望可能较高（30K-40K）', evidence: '' }],
      summary: '技术实力突出，大厂经验丰富，是当前候选人中最匹配的人选。' },
    { candidateId: 'c002', overallScore: 85, level: '推荐',
      dimensions: [{ key: 'matchScore', label: '岗位匹配', weight: 0.3, score: 85, weightedScore: 26, evidences: [] }, { key: 'professional', label: '专业能力', weight: 0.25, score: 82, weightedScore: 21, evidences: [] }, { key: 'communication', label: '沟通表达', weight: 0.15, score: 88, weightedScore: 13, evidences: [] }, { key: 'potential', label: '成长潜力', weight: 0.15, score: 85, weightedScore: 13, evidences: [] }, { key: 'stability', label: '稳定性', weight: 0.15, score: 80, weightedScore: 12, evidences: [] }],
      strengths: [{ text: '项目经验丰富', evidence: '' }, { text: '学习能力强', evidence: '' }],
      risks: [{ text: 'React 经验相对较少（主力 Vue）', evidence: '' }],
      summary: '综合素质良好，有成长潜力。985 本科，2 年美团经验。' },
    { candidateId: 'c003', overallScore: 68, level: '待观察',
      dimensions: [{ key: 'matchScore', label: '岗位匹配', weight: 0.3, score: 68, weightedScore: 20, evidences: [] }, { key: 'professional', label: '专业能力', weight: 0.25, score: 65, weightedScore: 16, evidences: [] }, { key: 'communication', label: '沟通表达', weight: 0.15, score: 70, weightedScore: 11, evidences: [] }, { key: 'potential', label: '成长潜力', weight: 0.15, score: 72, weightedScore: 11, evidences: [] }, { key: 'stability', label: '稳定性', weight: 0.15, score: 68, weightedScore: 10, evidences: [] }],
      strengths: [{ text: '有独立开发能力', evidence: '' }],
      risks: [{ text: '技术栈较老旧', evidence: '' }],
      summary: '双非本科，1 年经验，技术栈偏传统。' },
    { candidateId: 'c004', overallScore: 55, level: '待观察',
      dimensions: [{ key: 'matchScore', label: '岗位匹配', weight: 0.3, score: 55, weightedScore: 17, evidences: [] }, { key: 'professional', label: '专业能力', weight: 0.25, score: 50, weightedScore: 13, evidences: [] }, { key: 'communication', label: '沟通表达', weight: 0.15, score: 72, weightedScore: 11, evidences: [] }, { key: 'potential', label: '成长潜力', weight: 0.15, score: 65, weightedScore: 10, evidences: [] }, { key: 'stability', label: '稳定性', weight: 0.15, score: 60, weightedScore: 9, evidences: [] }],
      strengths: [{ text: '转行决心强', evidence: '' }],
      risks: [{ text: '非科班出身', evidence: '' }],
      summary: '二本市场营销转行，培训班 6 个月。' },
    { candidateId: 'c005', overallScore: 45, level: '不推荐',
      dimensions: [{ key: 'matchScore', label: '岗位匹配', weight: 0.3, score: 45, weightedScore: 14, evidences: [] }, { key: 'professional', label: '专业能力', weight: 0.25, score: 42, weightedScore: 11, evidences: [] }, { key: 'communication', label: '沟通表达', weight: 0.15, score: 68, weightedScore: 10, evidences: [] }, { key: 'potential', label: '成长潜力', weight: 0.15, score: 80, weightedScore: 12, evidences: [] }, { key: 'stability', label: '稳定性', weight: 0.15, score: 40, weightedScore: 6, evidences: [] }],
      strengths: [{ text: '985 名校背景', evidence: '' }],
      risks: [{ text: '无工作经验', evidence: '' }],
      summary: '985 应届生，潜力不错但短期无法满足岗位需求。' },
  ];

  for (const e of evalsData) {
    await prisma.evaluation.create({
      data: {
        ...e,
        dimensions: JSON.stringify(e.dimensions),
        strengths: JSON.stringify(e.strengths),
        risks: JSON.stringify(e.risks),
        jobId: job.id,
      },
    });
  }

  // Interviews
  await prisma.interview.create({
    data: {
      candidateId: 'c001',
      jobId: job.id,
      interviewerName: '张经理',
      scheduledAt: new Date(),
      status: 'completed',
      questions: JSON.stringify([
        { type: '专业能力', question: '请详细介绍一下微前端的架构方案', purpose: '考察微前端架构理解' },
        { type: '项目深挖', question: '抖音创作者平台的数据分析模块，你具体负责哪些部分？', purpose: '了解项目深度' },
      ]),
      feedback: JSON.stringify({
        overallRating: 4,
        dimensions: [
          { name: '技术能力', rating: 4, comment: 'React 基础扎实' },
          { name: '沟通表达', rating: 4, comment: '表达清晰' },
        ],
        recommendation: 'hire',
        summary: '候选人技术能力优秀，建议录用',
        submittedAt: new Date().toISOString(),
        submittedBy: '张经理',
      }),
    },
  });

  // Feishu config
  await prisma.feishuConfig.create({
    data: { id: 'default' },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
