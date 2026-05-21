import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { aiChat, extractJSON, isAIAvailable } from '@/lib/ai/client';
import { execFile } from 'child_process';
import { writeFile, readFile, mkdtemp, rm, readdir, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join, extname } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// ===== MinerU 文本提取 =====

async function extractWithMinerU(buffer: Buffer, fileName: string): Promise<string | null> {
  const tempDir = await mkdtemp(join(tmpdir(), 'mineru-'));
  const inputPath = join(tempDir, fileName);
  const outputDir = join(tempDir, 'output');

  try {
    await writeFile(inputPath, buffer);
    await mkdir(outputDir, { recursive: true });

    // 调用 MinerU CLI
    await execFileAsync('mineru', [
      '-p', inputPath,
      '-o', outputDir,
      '-m', 'auto',
      '-b', 'pipeline',
      '-l', 'ch',
      '-f', 'false',  // 不解析公式
      '-t', 'true',   // 解析表格
    ], { timeout: 60000 });

    // 读取输出 — MinerU 会在 outputDir 下生成子目录
    const files = await readdir(outputDir, { recursive: true });
    const mdFile = files.find(f => typeof f === 'string' && f.endsWith('.md'));
    if (mdFile) {
      const content = await readFile(join(outputDir, mdFile), 'utf-8');
      return content;
    }

    // 尝试读取 auto 目录
    const autoDir = join(outputDir, 'auto');
    try {
      const autoFiles = await readdir(autoDir, { recursive: true });
      const autoMd = autoFiles.find(f => typeof f === 'string' && f.endsWith('.md'));
      if (autoMd) {
        const content = await readFile(join(autoDir, autoMd), 'utf-8');
        return content;
      }
    } catch { /* ignore */ }

    return null;
  } catch {
    return null;
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

// ===== 文本提取主函数 =====

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extname(file.name).toLowerCase();

  // 优先用 MinerU（支持 OCR、复杂排版）
  if (ext === '.pdf' || ext === '.docx' || ext === '.pptx' || ext === '.xlsx' || ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
    const mineruResult = await extractWithMinerU(buffer, file.name);
    if (mineruResult && mineruResult.length > 50) {
      return mineruResult;
    }
  }

  // 降级：pdf-parse
  if (ext === '.pdf') {
    try {
      const pdfParseModule = await import('pdf-parse') as unknown as { default: (buf: Buffer) => Promise<{ text: string }> };
      const data = await pdfParseModule.default(buffer);
      return data.text;
    } catch {
      return buffer.toString('utf-8').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ');
    }
  }

  // 降级：mammoth
  if (ext === '.docx') {
    try {
      const mammoth = await import('mammoth');
      const extractRawText = mammoth.default?.extractRawText || mammoth.extractRawText;
      const result = await extractRawText({ buffer });
      return result.value;
    } catch {
      return buffer.toString('utf-8').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ');
    }
  }

  // 图片文件（没有 MinerU 时的降级）
  if (['.png', '.jpg', '.jpeg', '.bmp', '.tiff'].includes(ext)) {
    return `[图片文件 ${file.name} - 需要 OCR 解析]`;
  }

  return file.text();
}

// ===== 分段解析引擎 =====

interface ResumeSection {
  title: string;
  content: string;
}

function detectSections(text: string): ResumeSection[] {
  const sectionPatterns = [
    { key: 'personal', patterns: ['个人信息', '基本信息', '个人资料', '联系方式'] },
    { key: 'education', patterns: ['教育背景', '教育经历', '学历', '教育信息'] },
    { key: 'work', patterns: ['工作经历', '工作经验', '职业经历', '工作信息', '任职经历'] },
    { key: 'project', patterns: ['项目经历', '项目经验', '项目介绍', '代表项目'] },
    { key: 'skills', patterns: ['专业技能', '技术栈', '技术能力', '技能特长', '核心技能'] },
    { key: 'self', patterns: ['自我评价', '自我介绍', '个人总结', '个人优势'] },
    { key: 'training', patterns: ['培训经历', '培训经验', '学习经历'] },
  ];

  const lines = text.split('\n');
  const sections: ResumeSection[] = [];
  let currentSection = 'header';
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let foundSection = false;
    for (const section of sectionPatterns) {
      for (const pattern of section.patterns) {
        if (trimmed.includes(pattern) && trimmed.length < 20) {
          if (currentContent.length > 0) {
            sections.push({ title: currentSection, content: currentContent.join('\n') });
          }
          currentSection = section.key;
          currentContent = [];
          foundSection = true;
          break;
        }
      }
      if (foundSection) break;
    }

    if (!foundSection) {
      currentContent.push(trimmed);
    }
  }

  if (currentContent.length > 0) {
    sections.push({ title: currentSection, content: currentContent.join('\n') });
  }

  return sections;
}

function getSection(sections: ResumeSection[], key: string): string {
  return sections.find(s => s.title === key)?.content || '';
}

// ===== 个人信息提取 =====

function extractPersonalInfo(headerText: string, fullText: string) {
  const info: Record<string, unknown> = {};

  // 姓名 - 通常在第一行，2-4个中文字符
  const lines = headerText.split('\n').slice(0, 5);
  for (const line of lines) {
    const nameMatch = line.match(/^([一-龥]{2,4})(?:\s|$|,|，)/);
    if (nameMatch && !/简历|求职|个人|应聘|岗位/.test(line)) {
      info.name = nameMatch[1];
      info.avatar = nameMatch[1].charAt(0);
      break;
    }
  }

  // 手机号
  const phoneMatch = fullText.match(/(?:手机|电话|tel|phone)[：:\s]*(1[3-9]\d{9})/i) || fullText.match(/(1[3-9]\d{9})/);
  if (phoneMatch) info.phone = phoneMatch[1] || phoneMatch[0];

  // 邮箱
  const emailMatch = fullText.match(/(?:邮箱|email|mail)[：:\s]*([\w.-]+@[\w.-]+\.\w+)/i) || fullText.match(/([\w.-]+@[\w.-]+\.\w+)/);
  if (emailMatch) info.email = emailMatch[1] || emailMatch[0];

  // 年龄 - 从出生年份推算
  const birthMatch = fullText.match(/(?:出生|生日|born)[：:\s]*(\d{4})/i) || fullText.match(/(\d{4})年.*出生/);
  if (birthMatch) {
    info.age = new Date().getFullYear() - parseInt(birthMatch[1]);
  } else {
    const ageMatch = fullText.match(/(\d{2})\s*岁/);
    if (ageMatch) info.age = parseInt(ageMatch[1]);
  }

  // 性别
  if (/性别[：:\s]*男|^男$/m.test(fullText) || /(?:^|\s)男(?:\s|$)/m.test(fullText)) info.gender = '男';
  else if (/性别[：:\s]*女|^女$/m.test(fullText) || /(?:^|\s)女(?:\s|$)/m.test(fullText)) info.gender = '女';

  return info;
}

// ===== 学历提取 =====

const TIER_985 = ['清华', '北大', '浙大', '复旦', '上海交通', '南京大学', '中国科学技术', '哈尔滨工业', '西安交通',
  '武汉大学', '华中科技', '中山', '四川', '同济', '北京师范', '东南', '天津', '南开', '山东', '厦门',
  '吉林', '大连理工', '北京理工', '华南理工', '电子科技', '湖南', '重庆', '中南', '兰州', '东北', '西北工业'];

const TIER_211 = ['北京邮电', '北京交通', '北京科技', '北京化工', '北京林业', '北京中医药', '北京外国语',
  '中央财经', '对外经济贸易', '中国政法', '华北电力', '中国地质', '中国矿业', '中国石油',
  '上海财经', '上海大学', '华东理工', '华东师范', '东华', '上海外国语', '南京理工', '南京航空',
  '南京师范', '苏州', '河海', '江南', '南京农业', '中国药科',
  '武汉理工', '华中师范', '华中农业', '中南财经', '中国地质（武汉）',
  '西安电子科技', '长安', '西北', '陕西师范', '第四军医',
  '电子科技', '四川农业', '西南交通', '西南财经',
  '厦门', '福州', '南昌',
  '郑州', '河南',
  '暨南', '华南师范',
  '哈尔滨工程', '东北林业', '东北农业',
  '辽宁', '大连海事',
  '安徽', '合肥工业',
  '湖南师范', '国防科技',
  '云南', '贵州', '广西',
  '内蒙古', '新疆', '西藏', '青海', '宁夏', '海南',
  '延边', '石河子'];

function extractEducation(educationText: string, fullText: string) {
  const info: Record<string, unknown> = {};

  // 学校
  const schoolPatterns = [
    /([一-龥]{2,10}(?:大学|学院|科技大学|工业大学|师范大学|理工大学|工程大学))/,
    /([一-龥]{2,10}(?:高等|职业)?(?:技术|专科)?(?:学校|学院))/,
  ];
  for (const pattern of schoolPatterns) {
    const match = educationText.match(pattern) || fullText.match(pattern);
    if (match) {
      info.school = match[1];
      // 判断学校层次
      if (TIER_985.some(s => match[1].includes(s))) info.schoolTier = '985';
      else if (TIER_211.some(s => match[1].includes(s))) info.schoolTier = '211';
      else info.schoolTier = '双非';
      break;
    }
  }

  // 学历
  const degreePatterns = [
    { pattern: /博士|Ph\.?D/i, degree: '博士' },
    { pattern: /硕士|MBA|M\.?S\.?/i, degree: '硕士' },
    { pattern: /本科|学士|B\.?S\.?|B\.?A\.?/i, degree: '本科' },
    { pattern: /大专|专科|高职/i, degree: '大专' },
  ];
  for (const { pattern, degree } of degreePatterns) {
    if (pattern.test(educationText) || pattern.test(fullText)) {
      info.degree = degree;
      break;
    }
  }
  if (!info.degree) info.degree = '本科';

  // 专业 — 只从教育段落中提取
  const majorPatterns = [
    /专业[：:\s]*([一-龥a-zA-Z]{2,15})/,
    /(?:主修|方向)[：:\s]*([一-龥a-zA-Z]{2,15})/,
    /(?:计算机科学与技术|软件工程|信息工程|电子信息工程|通信工程|自动化|数学与应用数学|应用物理学|化学工程|生物工程|机械工程|土木工程|建筑学|经济学|工商管理|金融学|会计学|法学|新闻学|传播学|英语|日语|视觉传达设计|数字媒体艺术)/,
  ];
  for (const pattern of majorPatterns) {
    const match = educationText.match(pattern) || fullText.match(pattern);
    if (match) {
      info.major = (match[1] || match[0]).trim();
      break;
    }
  }

  return info;
}

// ===== 工作经历提取 =====

interface WorkExperience {
  company: string;
  title: string;
  period: string;
  description: string;
}

function extractWorkExperience(workText: string, fullText: string): WorkExperience[] {
  const text = workText || fullText;
  const experiences: WorkExperience[] = [];

  // 匹配 "公司名 | 职位 | 时间" 或 "公司名 职位 时间" 模式
  const companyPatterns = [
    /([一-龥a-zA-Z]{2,20}(?:科技|网络|信息|软件|互联网|集团|公司|企业|银行|证券|研究院|实验室)?)\s*[|｜,，]\s*([一-龥a-zA-Z]{2,15}(?:工程师|开发|设计|经理|主管|总监|架构师|运维|测试|产品|运营|顾问|分析师)?)\s*[|｜,，]?\s*((?:\d{4}[.\-/年])\s*[-–~至到]\s*(?:至今|现在|\d{4}[.\-/年]))/g,
    /([一-龥a-zA-Z]{2,20})\s*[,，]\s*([一-龥a-zA-Z]{2,15})\s*[,，]?\s*((?:\d{4}[.\-/年])\s*[-–~至到]\s*(?:至今|现在|\d{4}[.\-/年]))/g,
  ];

  for (const pattern of companyPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      experiences.push({
        company: match[1].trim(),
        title: match[2].trim(),
        period: match[3].trim(),
        description: '',
      });
    }
    if (experiences.length > 0) break;
  }

  // 如果没匹配到，尝试更宽松的模式
  if (experiences.length === 0) {
    const loosePattern = /([一-龥a-zA-Z]{2,20})\s*(?:公司|集团|科技|研究院)?\s*[|｜]?\s*([一-龥a-zA-Z]{2,10}(?:工程师|开发|设计|经理|主管)?)\s*[|｜]?\s*(\d{4}[.\-/年]\s*[-–~至到]\s*(?:至今|\d{4}[.\-/年]))/g;
    let match;
    while ((match = loosePattern.exec(text)) !== null) {
      experiences.push({
        company: match[1].trim(),
        title: match[2].trim(),
        period: match[3].trim(),
        description: '',
      });
    }
  }

  return experiences;
}

// ===== 项目提取 =====

interface Project {
  name: string;
  description: string;
}

function extractProjects(projectText: string, fullText: string): Project[] {
  const text = projectText || fullText;
  const projects: Project[] = [];

  // 匹配 "项目名" 或 "项目X：名称" 模式
  const projectPatterns = [
    /(?:项目[一二三四五六七八九十\d][：:.]?\s*|项目名称[：:.]?\s*|•\s*)(.{3,40})(?:\n|$)/g,
    /(?:项目经历|项目经验)[：:.]?\s*\n((?:.*\n){1,3})/g,
  ];

  for (const pattern of projectPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 50 && !name.includes('简历')) {
        // 提取项目描述（后续几行）
        const idx = text.indexOf(match[0]);
        const afterText = text.substring(idx + match[0].length, idx + match[0].length + 300);
        const descLines = afterText.split('\n')
          .filter(l => l.trim() && !l.match(/^(项目[一二三四五六七八九十\d]|项目名称)/))
          .slice(0, 3)
          .join(' ')
          .substring(0, 200);
        projects.push({ name, description: descLines || name });
      }
    }
    if (projects.length > 0) break;
  }

  return projects;
}

// ===== 技能提取 =====

const SKILL_KEYWORDS = [
  // 前端
  'React', 'Vue', 'Vue.js', 'Vue3', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Remix',
  'TypeScript', 'JavaScript', 'ES6+', 'HTML5', 'CSS3', 'Sass', 'Less', 'Tailwind CSS',
  'Webpack', 'Vite', 'Rollup', 'ESBuild', 'Turbopack',
  'Redux', 'Vuex', 'Pinia', 'MobX', 'Zustand', 'Recoil',
  'React Native', 'Flutter', 'Electron', 'Taro', 'uni-app',
  'jQuery', 'Bootstrap', 'Element UI', 'Ant Design', 'Material UI', 'Chakra UI',
  // 后端
  'Node.js', 'Express', 'Koa', 'NestJS', 'Fastify',
  'Python', 'Django', 'Flask', 'FastAPI',
  'Java', 'Spring', 'Spring Boot', 'SpringCloud',
  'Go', 'Gin', 'Fiber',
  'Rust', 'Actix', 'Tokio',
  'C++', 'C#', '.NET', 'PHP', 'Laravel',
  // 数据库
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
  'Elasticsearch', 'ClickHouse', 'TiDB', 'Cassandra',
  // 云和运维
  'Docker', 'Kubernetes', 'K8s', 'CI/CD', 'Jenkins', 'GitHub Actions',
  'AWS', 'Azure', 'GCP', '阿里云', '腾讯云',
  'Nginx', 'Linux', 'Shell', 'Bash',
  // AI/ML
  'TensorFlow', 'PyTorch', '机器学习', '深度学习', 'NLP', '计算机视觉',
  'LLM', 'GPT', 'Transformer', 'RAG', 'LangChain',
  // 其他
  'Git', 'SVN', 'GraphQL', 'REST', 'gRPC', 'WebSocket',
  '微服务', '微前端', '性能优化', '架构设计',
  '算法', '数据结构', '设计模式',
  'Figma', 'Sketch', 'Photoshop', 'UI/UX',
];

function extractSkills(text: string): string[] {
  return SKILL_KEYWORDS.filter(s => text.toLowerCase().includes(s.toLowerCase()));
}

// ===== 工作年限推算 =====

function extractWorkYears(text: string, experiences: WorkExperience[]): number {
  // 从文本中直接提取
  const yearPatterns = [
    /(\d{1,2})\s*年.*(?:经验|工作|从业)/,
    /(?:经验|工作|从业)[：:\s]*(\d{1,2})\s*年/,
    /共\s*(\d{1,2})\s*年/,
  ];
  for (const pattern of yearPatterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1]);
  }

  // 从工作经历推算
  if (experiences.length > 0) {
    let totalMonths = 0;
    for (const exp of experiences) {
      const periodMatch = exp.period.match(/(\d{4})[.\-/年]\s*[-–~至到]\s*(?:(\d{4})[.\-/年]|至今|现在)/);
      if (periodMatch) {
        const startYear = parseInt(periodMatch[1]);
        const endYear = periodMatch[2] ? parseInt(periodMatch[2]) : new Date().getFullYear();
        totalMonths += (endYear - startYear) * 12;
      }
    }
    if (totalMonths > 0) return Math.round(totalMonths / 12);
  }

  return 0;
}

// ===== 跳槽次数推算 =====

function estimateJobHopping(experiences: WorkExperience[]): number {
  if (experiences.length <= 1) return 0;
  return experiences.length - 1;
}

// ===== 主解析函数 =====

function parseResumeWithRegex(text: string) {
  const sections = detectSections(text);
  const personalInfo = extractPersonalInfo(getSection(sections, 'header'), text);
  const educationInfo = extractEducation(getSection(sections, 'education'), text);
  const experiences = extractWorkExperience(getSection(sections, 'work'), text);
  const projects = extractProjects(getSection(sections, 'project'), text);
  const skills = extractSkills(text);
  const workYears = extractWorkYears(text, experiences);

  const currentExp = experiences[0];

  return {
    ...personalInfo,
    ...educationInfo,
    workYears,
    currentCompany: currentExp?.company || '',
    currentTitle: currentExp?.title || '',
    jobHoppingCount: estimateJobHopping(experiences),
    expectedSalary: (text.match(/期望薪资[：:\s]*(\d+K?-\d+K?)/i) || text.match(/(\d+K-\d+K)/i) || [''])[0],
    background: `${educationInfo.school || ''}${educationInfo.degree || ''}，${workYears}年经验`.replace(/^，/, ''),
    skills,
    projects: projects.length > 0 ? projects : [{ name: '暂无项目信息', description: '简历中未提取到项目经历' }],
    expectedPosition: (text.match(/(?:期望|意向|求职)[：:\s]*(?:岗位|职位)[：:\s]*([一-龥a-zA-Z]{2,15})/) || [''])[0],
  };
}

async function parseResumeWithAI(text: string, fileName: string) {
  const prompt = `你是一个专业的简历解析引擎。从以下简历文本中提取结构化信息。请仔细分析简历内容，准确提取每个字段。

简历文件名：${fileName}
简历内容：
${text.substring(0, 4000)}

请返回 JSON 格式（只返回 JSON，不要其他内容）：
{
  "name": "姓名",
  "phone": "手机号（如果有的话）",
  "email": "邮箱（如果有的话）",
  "age": 年龄（数字，如果无法确定则根据毕业年份推算）,
  "gender": "男/女",
  "school": "最高学历学校名",
  "schoolTier": "985/211/双非/二本/大专（根据学校判断）",
  "degree": "博士/硕士/本科/大专",
  "major": "专业",
  "workYears": 工作年限（数字）,
  "currentCompany": "当前/最近公司名",
  "currentTitle": "当前/最近职位",
  "jobHoppingCount": 跳槽次数（数字，工作经历数-1）,
  "expectedSalary": "期望薪资（如 30K-40K）",
  "background": "一句话背景描述（50字以内）",
  "skills": ["技能1", "技能2", ...],
  "projects": [{"name": "项目名", "description": "项目描述（50字以内）"}, ...],
  "expectedPosition": "期望岗位"
}`;

  const response = await aiChat([{ role: 'user', content: prompt }], { temperature: 0.1 });
  return extractJSON(response);
}

async function parseResume(text: string, fileName: string) {
  if (isAIAvailable()) {
    try {
      return await parseResumeWithAI(text, fileName);
    } catch {
      return parseResumeWithRegex(text);
    }
  }
  return parseResumeWithRegex(text);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const jobId = formData.get('jobId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '请上传至少一个文件' }, { status: 400 });
    }

    if (!jobId) {
      return NextResponse.json({ error: '缺少 jobId' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      const text = await extractText(file);
      const parsed = await parseResume(text, file.name) as Record<string, unknown>;

      const candidate = await prisma.candidate.create({
        data: {
          name: (parsed.name as string) || file.name.replace(/\.\w+$/, ''),
          avatar: ((parsed.name as string) || '?').charAt(0),
          phone: (parsed.phone as string) || '',
          email: (parsed.email as string) || '',
          age: (parsed.age as number) || 0,
          gender: (parsed.gender as string) || '',
          school: (parsed.school as string) || '',
          schoolTier: (parsed.schoolTier as string) || '双非',
          degree: (parsed.degree as string) || '本科',
          major: (parsed.major as string) || '',
          workYears: (parsed.workYears as number) || 0,
          currentCompany: (parsed.currentCompany as string) || '',
          currentTitle: (parsed.currentTitle as string) || '',
          jobHoppingCount: (parsed.jobHoppingCount as number) || 0,
          expectedSalary: (parsed.expectedSalary as string) || '',
          background: (parsed.background as string) || '',
          skills: JSON.stringify(parsed.skills || []),
          projects: JSON.stringify(parsed.projects || []),
          expectedPosition: (parsed.expectedPosition as string) || '',
          stage: 'applied',
          resumeText: text.substring(0, 10000),
          resumeFileName: file.name,
          jobId,
        },
      });

      results.push({
        ...candidate,
        skills: JSON.parse(candidate.skills),
        projects: JSON.parse(candidate.projects),
      });
    }

    return NextResponse.json({ success: true, count: results.length, candidates: results });
  } catch (error) {
    return NextResponse.json({ error: '文件处理失败', details: String(error) }, { status: 500 });
  }
}
