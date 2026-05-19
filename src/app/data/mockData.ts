export interface Job {
  id: string;
  title: string;
  companyType: string;
  headcount: number;
  responsibilities: string;
  requirements: string;
  generatedJD?: {
    responsibilities: string[];
    requirements: string[];
    bonuses: string[];
    interviewFocus: string[];
    salaryRange: string;
  };
  matchRules?: {
    mustHave: string[];
    niceToHave: string[];
    schoolTier: string;
    degree: string;
    minWorkYears: number;
    salaryRange: [number, number];
  };
}

export interface Candidate {
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
  matchScore: number;
  level: '强烈推荐' | '推荐' | '待观察' | '不推荐';
  strengths: string[];
  risks: string[];
  interviewDirection: string[];
  score: {
    matchScore: number;
    professional: number;
    communication: number;
    potential: number;
    stability: number;
  };
  summary: string;
  resume: string;
}

export interface InterviewQuestion {
  type: '专业能力' | '项目深挖' | '情景判断' | '团队协作';
  question: string;
  purpose: string;
}

export const mockJob: Job = {
  id: 'job-001',
  title: '前端开发工程师',
  companyType: '互联网科技公司',
  headcount: 2,
  responsibilities: '负责公司核心产品的前端开发与维护',
  requirements: '3年以上前端开发经验',
  generatedJD: {
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
  },
  matchRules: {
    mustHave: ['React', 'TypeScript', '3年以上经验'],
    niceToHave: ['Node.js', 'Webpack', '微前端', '性能优化'],
    schoolTier: '211' as const,
    degree: '本科' as const,
    minWorkYears: 2,
    salaryRange: [20000, 35000],
  },
};

export const mockCandidates: Candidate[] = [
  {
    id: 'c001',
    name: '张明远',
    avatar: '张',
    phone: '138****6721',
    email: 'zhangmy@gmail.com',
    age: 27,
    gender: '男',
    school: '浙江大学',
    schoolTier: '985',
    degree: '硕士',
    major: '计算机科学与技术',
    workYears: 3,
    currentCompany: '字节跳动',
    currentTitle: '前端开发工程师',
    jobHoppingCount: 1,
    expectedSalary: '30K-40K',
    background: '3年大厂经验，现任字节跳动前端开发',
    skills: ['React', 'TypeScript', 'Node.js', 'Webpack', '微前端', '性能优化', 'Docker', 'CI/CD'],
    projects: [
      { name: '抖音创作者平台', description: '负责创作者数据分析模块，日活 50w+，独立完成前端架构选型和技术方案设计' },
      { name: '飞书审批流程', description: '独立完成审批流程可视化编辑器，支持复杂嵌套条件配置，用户满意度提升 35%' },
      { name: '内部组件库建设', description: '主导搭建部门级 React 组件库，覆盖 60+ 通用组件，接入 Storybook 文档' },
    ],
    expectedPosition: '前端开发工程师',
    matchScore: 92,
    level: '强烈推荐',
    strengths: ['大厂背景，技术扎实', 'React 生态深度使用', '有架构设计经验', '有组件库建设经验'],
    risks: ['薪资期望可能较高（30K-40K）', '当前在职，到岗时间不确定', '跳槽 1 次需关注稳定性'],
    interviewDirection: ['深挖微前端架构设计', '询问性能优化具体案例', '了解离职动机', '确认薪资弹性'],
    score: { matchScore: 92, professional: 90, communication: 85, potential: 88, stability: 75 },
    summary: '技术实力突出，大厂经验丰富，是当前候选人中最匹配的人选。985 硕士背景，3 年字节经验，React 技术栈深度使用。建议重点沟通薪资预期和到岗时间。',
    resume: `张明远 | 前端开发工程师
手机: 138****6721 | 邮箱: zhangmy@gmail.com | 27岁 | 男

━━━ 教育背景 ━━━
浙江大学 | 硕士 | 计算机科学与技术 | 2019-2022
- GPA 3.8/4.0，获校级优秀毕业论文
- 研究方向：Web 前端性能优化

━━━ 工作经历 ━━━
字节跳动 | 前端开发工程师 | 2022.07 - 至今（3年）

项目一：抖音创作者平台（2023.03 - 至今）
• 负责创作者数据分析模块的前端架构设计与核心开发
• 使用 React + TypeScript + ECharts 构建数据可视化面板
• 日活 50w+，首屏加载时间优化至 1.2s（原 3.5s）
• 主导前端微前端改造，将 5 个子应用独立部署

项目二：飞书审批流程编辑器（2022.07 - 2023.02）
• 独立完成审批流程可视化编辑器开发
• 支持拖拽、嵌套条件、并行分支等复杂交互
• 用户满意度从 72% 提升至 95%

项目三：内部组件库 ZK-UI（2022.10 - 2023.06）
• 主导搭建部门级 React 组件库，覆盖 60+ 通用组件
• 接入 Storybook 文档和自动化测试
• 部门内 3 个项目接入使用

━━━ 技术栈 ━━━
核心: React, TypeScript, Node.js
构建: Webpack, Vite, Rollup
其他: Docker, CI/CD, Nginx, Git

━━━ 自我评价 ━━━
3 年大厂前端开发经验，擅长 React 生态和性能优化。有架构设计和组件库建设经验，具备良好的工程化思维。`,
  },
  {
    id: 'c002',
    name: '李思涵',
    avatar: '李',
    phone: '159****3842',
    email: 'lisihan@163.com',
    age: 25,
    gender: '女',
    school: '武汉大学',
    schoolTier: '985',
    degree: '本科',
    major: '软件工程',
    workYears: 2,
    currentCompany: '美团',
    currentTitle: '前端开发工程师',
    jobHoppingCount: 0,
    expectedSalary: '22K-28K',
    background: '2年中厂经验，现任美团前端开发',
    skills: ['Vue', 'React', 'TypeScript', 'Sass', 'Git', 'Element UI', 'Webpack'],
    projects: [
      { name: '美团商家后台', description: '负责订单管理模块重构，引入虚拟列表和懒加载，加载速度提升 40%' },
      { name: '营销活动页面', description: '累计完成 20+ 营销活动页面开发，搭建活动模板体系' },
      { name: '商家数据看板', description: '独立开发商家经营数据看板，集成 10+ 数据源' },
    ],
    expectedPosition: '前端开发工程师',
    matchScore: 85,
    level: '推荐',
    strengths: ['项目经验丰富', '学习能力强', '沟通协作好', '有性能优化经验'],
    risks: ['React 经验相对较少（主力 Vue）', '缺乏大型架构经验', '2 年经验偏短'],
    interviewDirection: ['评估从 Vue 转 React 的适应能力', '了解项目重构的具体思路', '考察技术深度'],
    score: { matchScore: 85, professional: 82, communication: 88, potential: 85, stability: 80 },
    summary: '综合素质良好，有成长潜力。985 本科，2 年美团经验，Vue 技术栈扎实但 React 需要适应期。适合团队培养，性价比高。',
    resume: `李思涵 | 前端开发工程师
手机: 159****3842 | 邮箱: lisihan@163.com | 25岁 | 女

━━━ 教育背景 ━━━
武汉大学 | 本科 | 软件工程 | 2018-2022
- 专业排名前 15%，获校级奖学金

━━━ 工作经历 ━━━
美团 | 前段开发工程师 | 2022.07 - 至今（2年）

项目一：美团商家后台重构（2023.01 - 至今）
• 负责订单管理模块的前端重构
• 引入虚拟列表优化长列表渲染，大数据量场景性能提升 40%
• 使用 Vue 3 + TypeScript + Pinia 技术栈

项目二：营销活动页面体系（2022.07 - 2022.12）
• 累计完成 20+ 营销活动页面开发
• 搭建活动模板体系，新活动上线时间从 3 天缩短至 1 天

项目三：商家数据看板（2023.06 - 至今）
• 独立开发商家经营数据看板
• 集成 10+ 数据源，支持多维度数据筛选和导出

━━━ 技术栈 ━━━
核心: Vue 3, React, TypeScript
UI: Element UI, Ant Design
构建: Webpack, Vite

━━━ 自我评价 ━━━
2 年前端开发经验，Vue 技术栈扎实。学习能力强，最近在自学 React，希望能往全栈方向发展。`,
  },
  {
    id: 'c003',
    name: '王浩宇',
    avatar: '王',
    phone: '176****9153',
    email: 'wanghaoyu@qq.com',
    age: 24,
    gender: '男',
    school: '南京邮电大学',
    schoolTier: '双非',
    degree: '本科',
    major: '信息工程',
    workYears: 1,
    currentCompany: '某创业公司',
    currentTitle: '前端开发',
    jobHoppingCount: 0,
    expectedSalary: '12K-16K',
    background: '1年创业公司经验',
    skills: ['HTML', 'CSS', 'JavaScript', 'Vue', 'jQuery', 'Bootstrap', 'Element UI'],
    projects: [
      { name: '企业官网', description: '独立完成 3 个企业官网前端开发，使用原生 JS + jQuery' },
      { name: '后台管理系统', description: '基于 Element UI 开发管理后台，包含用户、权限、报表模块' },
    ],
    expectedPosition: '前端开发工程师',
    matchScore: 68,
    level: '待观察',
    strengths: ['有独立开发能力', '学习意愿强', '性价比高'],
    risks: ['技术栈较老旧（jQuery/原生JS为主）', '缺乏团队协作经验', 'TypeScript 经验不足', '双非本科学历'],
    interviewDirection: ['了解技术更新计划', '考察基础功底', '评估学习能力', '是否有意愿学 React/TS'],
    score: { matchScore: 68, professional: 65, communication: 70, potential: 72, stability: 68 },
    summary: '双非本科，1 年经验，技术栈偏传统。有独立开发能力但缺乏现代前端技术栈经验。如果团队有培养计划且预算有限可以考虑，否则不太建议直接录用。',
    resume: `王浩宇 | 前端开发
手机: 176****9153 | 邮箱: wanghaoyu@qq.com | 24岁 | 男

━━━ 教育背景 ━━━
南京邮电大学 | 本科 | 信息工程 | 2019-2023

━━━ 工作经历 ━━━
某创业公司 | 前端开发 | 2023.07 - 至今（1年）

项目一：企业官网开发（2023.08 - 2023.12）
• 独立完成 3 个企业官网前端开发
• 使用原生 JavaScript + jQuery + Bootstrap
• 负责页面切图、交互实现和响应式适配

项目二：后台管理系统（2024.01 - 至今）
• 基于 Vue 2 + Element UI 开发企业管理后台
• 包含用户管理、权限控制、数据报表等模块
• 使用 Axios 对接后端 RESTful API

━━━ 技术栈 ━━━
核心: HTML, CSS, JavaScript, Vue 2
UI: Element UI, Bootstrap
工具: jQuery, Git

━━━ 自我评价 ━━━
1 年前端开发经验，能独立完成项目开发。正在自学 Vue 3 和 TypeScript，希望加入更大的团队提升自己。`,
  },
  {
    id: 'c004',
    name: '陈雨桐',
    avatar: '陈',
    phone: '183****2746',
    email: 'chenyutong@foxmail.com',
    age: 26,
    gender: '女',
    school: '湖南工商大学',
    schoolTier: '二本',
    degree: '本科',
    major: '市场营销',
    workYears: 0,
    currentCompany: '无',
    currentTitle: '无',
    jobHoppingCount: 0,
    expectedSalary: '8K-12K',
    background: '转行前端，培训班6个月',
    skills: ['HTML', 'CSS', 'JavaScript', 'React 基础', 'Git 基础'],
    projects: [
      { name: '电商小程序（培训项目）', description: '培训班项目，仿写电商小程序，包含商品列表、购物车、订单' },
      { name: 'Todo App', description: '个人练手项目，使用 React Hooks 实现增删改查' },
      { name: '个人博客', description: '使用 Hexo 搭建的个人技术博客' },
    ],
    expectedPosition: '前端开发工程师',
    matchScore: 55,
    level: '待观察',
    strengths: ['转行决心强', '有基础功底', '学习态度好'],
    risks: ['非科班出身（市场营销专业）', '无实际工作经验', '技术深度不够', '二本学历，培训班背景'],
    interviewDirection: ['考察基础是否扎实', '了解自学能力', '评估成长速度', '确认转行动机'],
    score: { matchScore: 55, professional: 50, communication: 72, potential: 65, stability: 60 },
    summary: '二本市场营销转行，培训班 6 个月。基础功底有待验证，项目均为培训/练手项目。建议作为储备人才，或安排更长时间的培养计划。',
    resume: `陈雨桐 | 前端开发（转行）
手机: 183****2746 | 邮箱: chenyutong@foxmail.com | 26岁 | 女

━━━ 教育背景 ━━━
湖南工商大学 | 本科 | 市场营销 | 2017-2021

━━━ 培训经历 ━━━
某 IT 培训机构 | 前端开发 | 2023.09 - 2024.02（6个月）
- 学习 HTML/CSS/JavaScript/React 基础
- 完成 3 个项目实战

━━━ 项目经历 ━━━
项目一：电商小程序（培训项目）
• 使用微信小程序原生框架开发
• 包含商品列表、购物车、订单管理功能
• 个人独立完成前端页面和交互

项目二：Todo App（个人项目）
• 使用 React + Hooks 实现增删改查
• 使用 localStorage 做数据持久化
• GitHub 地址: github.com/chenyutong/todo-app

项目三：个人技术博客
• 使用 Hexo + GitHub Pages 搭建
• 记录学习笔记和踩坑记录

━━━ 技术栈 ━━━
基础: HTML, CSS, JavaScript
框架: React（基础）
工具: Git, npm

━━━ 自我评价 ━━━
市场营销专业转行前端开发，培训班学习 6 个月。对前端开发有热情，学习态度认真，希望获得一个入行机会。`,
  },
  {
    id: 'c005',
    name: '刘子轩',
    avatar: '刘',
    phone: '150****8394',
    email: 'liuzixuan@hust.edu.cn',
    age: 22,
    gender: '男',
    school: '华中科技大学',
    schoolTier: '985',
    degree: '本科',
    major: '计算机科学与技术',
    workYears: 0,
    currentCompany: '应届生',
    currentTitle: '无',
    jobHoppingCount: 0,
    expectedSalary: '15K-20K',
    background: '应届毕业生，无正式工作经验',
    skills: ['React', 'TypeScript', 'CSS Modules', 'Git', 'Node.js 基础', '算法'],
    projects: [
      { name: '毕业设计：在线协作文档', description: '基于 React + WebSocket 的实时协作编辑器，支持多人同时编辑' },
      { name: '校园二手交易平台', description: '团队项目（4人），负责前端开发，使用 React + Ant Design' },
      { name: 'ACM 竞赛', description: '校 ACM 队成员，获省级银奖' },
    ],
    expectedPosition: '前端开发工程师',
    matchScore: 45,
    level: '不推荐',
    strengths: ['985 名校背景', '学习能力强', '有潜力', '算法基础扎实'],
    risks: ['无工作经验', '无法独立承担项目', '培养成本高', '短期产出有限'],
    interviewDirection: ['考察技术基础和学习能力', '了解项目中的具体贡献', '评估抗压能力', '了解职业规划'],
    score: { matchScore: 45, professional: 42, communication: 68, potential: 80, stability: 40 },
    summary: '985 应届生，潜力不错但短期无法满足岗位需求。如果公司有校招计划可以重点关注，社招场景不建议考虑。',
    resume: `刘子轩 | 前端开发（应届）
手机: 150****8394 | 邮箱: liuzixuan@hust.edu.cn | 22岁 | 男

━━━ 教育背景 ━━━
华中科技大学 | 本科 | 计算机科学与技术 | 2021-2025（应届）
- GPA 3.6/4.0，专业排名前 20%
- 校 ACM 队成员，获省级银奖
- 获校级一等奖学金

━━━ 项目经历 ━━━
项目一：在线协作文档（毕业设计）
• 技术栈: React + TypeScript + WebSocket + Yjs
• 实现多人实时协作编辑，支持富文本和 Markdown
• 使用 CRDT 算法解决冲突问题

项目二：校园二手交易平台（团队项目）
• 4 人团队，负责前端开发
• 技术栈: React + Ant Design + Axios
• 实现商品发布、搜索、聊天、交易等功能

项目三：ACM 竞赛
• 校 ACM 队成员，获省级银奖
• 熟悉常用数据结构和算法

━━━ 技术栈 ━━━
核心: React, TypeScript, Node.js（基础）
其他: CSS Modules, Git, WebSocket

━━━ 自我评价 ━━━
应届本科生，对前端开发有浓厚兴趣。算法基础扎实，学习能力强。希望加入一个技术氛围好的团队，快速成长。`,
  },
];

export const mockInterviewQuestions: Record<string, InterviewQuestion[]> = {
  c001: [
    { type: '专业能力', question: '请详细介绍一下微前端的架构方案，你们团队是如何做技术选型的？', purpose: '考察对微前端架构的深度理解和技术决策能力' },
    { type: '专业能力', question: 'React Hooks 的闭包陷阱你遇到过吗？是如何解决的？', purpose: '验证 React 核心原理的掌握程度' },
    { type: '项目深挖', question: '抖音创作者平台的数据分析模块，你具体负责哪些部分？遇到过什么技术难点？', purpose: '了解实际项目参与深度和技术贡献' },
    { type: '项目深挖', question: '飞书审批流程可视化编辑器的设计思路是什么？如何处理复杂嵌套场景？', purpose: '评估独立设计和解决问题的能力' },
    { type: '情景判断', question: '如果产品经理突然要求在一个已排期的功能上增加复杂交互，你会怎么处理？', purpose: '考察需求管理和沟通协调能力' },
    { type: '团队协作', question: '在代码评审中，如果你和同事对某个实现方案有分歧，你会怎么处理？', purpose: '了解团队协作和冲突解决方式' },
  ],
  c002: [
    { type: '专业能力', question: 'Vue 和 React 的核心差异是什么？你从 Vue 转到 React 遇到了哪些挑战？', purpose: '评估技术迁移能力和对两个框架的理解深度' },
    { type: '专业能力', question: '你提到将商家后台加载速度提升了 40%，具体用了哪些优化手段？', purpose: '验证性能优化的实际经验' },
    { type: '项目深挖', question: '20 多个营销活动页面，你是如何保证开发效率和代码质量的？', purpose: '了解工程化思维和效率提升方法' },
    { type: '情景判断', question: '如果上线后发现一个严重 bug，但修复需要改动较大，你会怎么处理？', purpose: '考察问题处理和风险控制能力' },
    { type: '团队协作', question: '描述一次你和其他团队紧密合作完成项目的经历', purpose: '了解跨团队协作能力' },
    { type: '团队协作', question: '你怎么看待前端代码规范？你们团队是如何制定和执行的？', purpose: '评估工程规范意识' },
  ],
  c003: [
    { type: '专业能力', question: '你平时主要用 jQuery 和 Vue，对 React 有了解吗？你觉得它们的核心区别是什么？', purpose: '了解技术广度和对新技术的认知' },
    { type: '专业能力', question: '你开发的后台管理系统，状态管理是怎么做的？有没有遇到复杂状态的处理？', purpose: '考察状态管理的理解和实践' },
    { type: '项目深挖', question: '独立开发企业官网的过程中，你是如何保证页面性能和兼容性的？', purpose: '了解工程实践能力' },
    { type: '情景判断', question: '如果让你从零开始搭建一个新项目，你会如何选择技术栈？', purpose: '评估技术决策能力' },
    { type: '团队协作', question: '你之前都是独立开发，如果加入一个多人协作的团队，你觉得自己需要适应什么？', purpose: '了解自我认知和适应能力' },
    { type: '团队协作', question: '你平时是如何学习新技术的？最近在学什么？', purpose: '评估学习能力和技术热情' },
  ],
  c004: [
    { type: '专业能力', question: '请解释一下 JavaScript 的事件循环机制', purpose: '考察基础功底是否扎实' },
    { type: '专业能力', question: 'React 中 key 属性的作用是什么？如果不设置会怎样？', purpose: '验证 React 基础理解' },
    { type: '项目深挖', question: '你的电商小程序项目中，购物车的状态管理是怎么实现的？', purpose: '了解项目实现的深度' },
    { type: '情景判断', question: '如果遇到一个你完全不会的技术问题，你会怎么解决？', purpose: '考察解决问题的方法和态度' },
    { type: '团队协作', question: '培训期间有没有和同学协作完成的项目？你是怎么分工的？', purpose: '了解团队协作经验' },
    { type: '团队协作', question: '你为什么从前端转行？你对前端开发的理解是什么？', purpose: '了解转行动机和职业规划' },
  ],
  c005: [
    { type: '专业能力', question: '你的毕业设计用了 WebSocket，能说说 WebSocket 和 HTTP 的区别吗？', purpose: '考察对网络协议的理解' },
    { type: '专业能力', question: 'React 中 useState 和 useReducer 分别适合什么场景？', purpose: '验证 React Hooks 的掌握程度' },
    { type: '项目深挖', question: '在线协作文档项目中，多人同时编辑时冲突是怎么处理的？', purpose: '了解技术方案设计能力' },
    { type: '情景判断', question: '如果你的代码在评审中被指出了很多问题，你会怎么处理？', purpose: '考察抗压能力和学习态度' },
    { type: '团队协作', question: '在校园项目中，你是如何和团队成员协作的？有没有遇到过分歧？', purpose: '了解团队协作经验' },
    { type: '团队协作', question: '你对第一份工作的期望是什么？未来 3 年的职业规划是什么？', purpose: '了解职业规划和稳定性' },
  ],
};
