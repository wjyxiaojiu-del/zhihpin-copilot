import type { CandidateRecord } from '../types';

// 从文本中解析简历信息
export function parseResumeText(text: string, fileName?: string): Partial<CandidateRecord> {
  const result: Partial<CandidateRecord> = {
    resumeText: text,
    resumeFileName: fileName,
    skills: [],
    projects: [],
  };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 姓名 - 通常在第一行
  for (const line of lines.slice(0, 3)) {
    const nameMatch = line.match(/^[一-龥]{2,4}/);
    if (nameMatch && !line.includes('简历') && !line.includes('求职')) {
      result.name = nameMatch[0];
      result.avatar = nameMatch[0].charAt(0);
      break;
    }
  }

  // 手机号
  const phoneMatch = text.match(/1[3-9]\d{9}/);
  if (phoneMatch) result.phone = phoneMatch[0];

  // 邮箱
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) result.email = emailMatch[0];

  // 年龄
  const ageMatch = text.match(/(\d{2})岁/);
  if (ageMatch) result.age = parseInt(ageMatch[1]);

  // 性别
  if (text.includes('男')) result.gender = '男';
  else if (text.includes('女')) result.gender = '女';

  // 学校
  const schoolPatterns = [
    /([一-龥]+大学)/,
    /([一-龥]+学院)/,
    /([一-龥]+科技大学)/,
  ];
  for (const pattern of schoolPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.school = match[1];
      // 判断学校层次
      const tier1 = ['清华大学', '北京大学', '浙江大学', '复旦大学', '上海交通大学', '南京大学', '中国科学技术大学', '哈尔滨工业大学', '西安交通大学'];
      const tier2 = ['武汉大学', '华中科技大学', '中山大学', '四川大学', '同济大学', '北京师范大学', '东南大学', '天津大学', '南开大学', '山东大学', '厦门大学', '吉林大学', '大连理工大学', '北京理工大学', '华南理工大学', '电子科技大学', '湖南大学', '重庆大学', '中南大学', '兰州大学', '东北大学', '西北工业大学'];
      if (tier1.some(s => result.school!.includes(s))) result.schoolTier = '985';
      else if (tier2.some(s => result.school!.includes(s))) result.schoolTier = '985';
      else result.schoolTier = '双非';
      break;
    }
  }

  // 学历
  if (text.includes('博士')) result.degree = '博士';
  else if (text.includes('硕士')) result.degree = '硕士';
  else if (text.includes('本科') || text.includes('学士')) result.degree = '本科';
  else if (text.includes('大专') || text.includes('专科')) result.degree = '大专';
  else result.degree = '本科';

  // 专业
  const majorPatterns = [
    /专业[：:]\s*([一-龥]+)/,
    /([一-龥]+工程)/,
    /([一-龥]+科学)/,
    /([一-龥]+技术)/,
  ];
  for (const pattern of majorPatterns) {
    const match = text.match(pattern);
    if (match) { result.major = match[1]; break; }
  }

  // 工作年限
  const yearPatterns = [
    /(\d+)\s*年.*经验/,
    /经验[：:]\s*(\d+)\s*年/,
    /(\d+)\s*年.*工作/,
  ];
  for (const pattern of yearPatterns) {
    const match = text.match(pattern);
    if (match) { result.workYears = parseInt(match[1]); break; }
  }

  // 当前公司
  const companyPatterns = [
    /公司[：:]\s*([一-龥a-zA-Z]+)/,
    /([一-龥]+科技)/,
    /([一-龥]+网络)/,
    /([一-龥]+信息)/,
  ];
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) { result.currentCompany = match[1]; break; }
  }

  // 当前职位
  const titlePatterns = [
    /职位[：:]\s*([一-龥a-zA-Z]+)/,
    /岗位[：:]\s*([一-龥a-zA-Z]+)/,
    /(前端开发|后端开发|全栈开发|软件工程师|产品经理|设计师|测试工程师|运维工程师)/,
  ];
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match) { result.currentTitle = match[1]; break; }
  }

  // 技能提取
  const skillKeywords = [
    'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Node.js',
    'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
    'HTML', 'CSS', 'Sass', 'Less', 'Tailwind',
    'Webpack', 'Vite', 'Rollup', 'ESBuild',
    'Docker', 'Kubernetes', 'CI/CD', 'Git',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
    'AWS', 'Azure', 'GCP',
    '微前端', '微服务', 'GraphQL', 'REST',
    '性能优化', '算法', '数据结构',
    'React Native', 'Flutter', 'Swift', 'Kotlin',
    'TensorFlow', 'PyTorch', '机器学习', '深度学习',
    'jQuery', 'Bootstrap', 'Element UI', 'Ant Design',
    'Sass', 'CSS Modules', 'WebSocket', 'ECharts',
  ];
  const foundSkills: string[] = [];
  for (const skill of skillKeywords) {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }
  result.skills = foundSkills;

  // 项目提取
  const projects: { name: string; description: string }[] = [];
  const projectPatterns = [
    /项目[一二三四五六七八九十\d][：:]\s*(.+)/g,
    /项目名称[：:]\s*(.+)/g,
    /•\s*(.{5,50})项目/g,
  ];
  for (const pattern of projectPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 50) {
        // 找项目描述（后续几行）
        const idx = text.indexOf(match[0]);
        const afterText = text.substring(idx, idx + 200);
        const descLines = afterText.split('\n').slice(1, 4).join(' ').substring(0, 150);
        projects.push({ name, description: descLines || name });
      }
    }
  }
  if (projects.length > 0) result.projects = projects;

  // 薪资期望
  const salaryMatch = text.match(/期望薪资[：:]\s*(\d+K?-\d+K?)/i) ||
    text.match(/(\d+K-\d+K)/i) ||
    text.match(/(\d+[万千]-\d+[万千])/);
  if (salaryMatch) result.expectedSalary = salaryMatch[1];

  return result;
}

// 模拟文件内容提取（实际项目中需要用 pdf-parse / mammoth 等库）
export async function extractTextFromFile(file: File): Promise<string> {
  const text = await file.text();

  // 如果是纯文本，直接返回
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return text;
  }

  // PDF 和 DOCX 的简单文本提取
  // 实际项目中应使用 pdf-parse 和 mammoth 库
  // 这里做一个基本的文本清理
  if (file.name.endsWith('.pdf')) {
    // 简单清理 PDF 二进制内容，提取可读文本
    const cleaned = text
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ')
      .replace(/\s+/g, ' ');
    // 尝试提取中文和英文内容
    const matches = cleaned.match(/[一-龥a-zA-Z0-9\s.,;:!?，。；：！？、（）()\-+*/=@#$%^&]+/g);
    return matches ? matches.join('\n').trim() : cleaned;
  }

  if (file.name.endsWith('.docx')) {
    // DOCX 是 zip 格式，这里做简单处理
    // 实际项目中应使用 mammoth 库
    const cleaned = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ');
    const matches = cleaned.match(/[一-龥a-zA-Z0-9\s.,;:!?，。；：！？、（）()\-+*/=@#$%^&]+/g);
    return matches ? matches.join('\n').trim() : cleaned;
  }

  return text;
}
