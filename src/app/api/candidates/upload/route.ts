import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const jobId = formData.get('jobId') as string || 'job-001';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '请上传至少一个文件' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      // 读取文件内容
      let text = '';
      try {
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          text = await file.text();
        } else if (file.name.endsWith('.pdf')) {
          // PDF 解析 - 提取可读文本
          const raw = await file.text();
          const cleaned = raw.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ');
          const matches = cleaned.match(/[一-龥a-zA-Z0-9\s.,;:!?，。；：！？、（）()\-+*/=@#$%^&]+/g);
          text = matches ? matches.join('\n').trim() : cleaned;
        } else if (file.name.endsWith('.docx')) {
          // DOCX 解析
          const raw = await file.text();
          const cleaned = raw.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ');
          const matches = cleaned.match(/[一-龥a-zA-Z0-9\s.,;:!?，。；：！？、（）()\-+*/=@#$%^&]+/g);
          text = matches ? matches.join('\n').trim() : cleaned;
        } else {
          text = await file.text();
        }
      } catch {
        text = `无法解析文件 ${file.name} 的内容`;
      }

      // 从文本中提取信息
      const parsed = parseResumeText(text, file.name);

      results.push({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        parsed,
        rawText: text.substring(0, 5000), // 限制返回长度
      });
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      candidates: results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: '文件处理失败', details: String(error) },
      { status: 500 }
    );
  }
}

function parseResumeText(text: string, fileName?: string) {
  const result: Record<string, unknown> = {
    resumeText: text,
    resumeFileName: fileName,
    skills: [],
    projects: [],
  };

  // 姓名
  for (const line of text.split('\n').slice(0, 3)) {
    const nameMatch = line.trim().match(/^[一-龥]{2,4}/);
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

  // 学校
  const schoolMatch = text.match(/([一-龥]+(?:大学|学院|科技大学))/);
  if (schoolMatch) result.school = schoolMatch[1];

  // 学历
  if (text.includes('博士')) result.degree = '博士';
  else if (text.includes('硕士')) result.degree = '硕士';
  else if (text.includes('本科') || text.includes('学士')) result.degree = '本科';
  else if (text.includes('大专') || text.includes('专科')) result.degree = '大专';
  else result.degree = '本科';

  // 工作年限
  const yearMatch = text.match(/(\d+)\s*年.*(?:经验|工作)/);
  if (yearMatch) result.workYears = parseInt(yearMatch[1]);

  // 技能
  const skillKeywords = [
    'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Node.js',
    'Python', 'Java', 'Go', 'Rust', 'C++', 'HTML', 'CSS',
    'Webpack', 'Vite', 'Docker', 'Git', 'MySQL', 'PostgreSQL', 'MongoDB',
    'Redis', '微前端', '微服务', 'GraphQL', '性能优化',
    'jQuery', 'Bootstrap', 'Element UI', 'Ant Design',
  ];
  const skills = skillKeywords.filter(s => text.toLowerCase().includes(s.toLowerCase()));
  result.skills = skills;

  // 期望薪资
  const salaryMatch = text.match(/(\d+K?-\d+K?)/i);
  if (salaryMatch) result.expectedSalary = salaryMatch[1];

  return result;
}
