import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 获取飞书配置（隐藏敏感字段）
export async function GET() {
  let config = await prisma.feishuConfig.findFirst();
  if (!config) {
    config = await prisma.feishuConfig.create({ data: { id: 'default' } });
  }
  return NextResponse.json({
    ...config,
    appSecret: config.appSecret ? '******' : '',
    webhookUrl: config.webhookUrl ? '已配置' : '',
  });
}

// PUT: 更新飞书配置（只允许更新安全字段）
export async function PUT(req: Request) {
  const body = await req.json();
  const allowedFields: Record<string, unknown> = {};
  const whitelist = ['appId', 'appSecret', 'webhookUrl', 'loginEnabled', 'docEnabled', 'pushEnabled'];
  for (const key of whitelist) {
    if (key in body) allowedFields[key] = body[key];
  }

  const existing = await prisma.feishuConfig.findFirst();

  if (existing) {
    await prisma.feishuConfig.update({
      where: { id: existing.id },
      data: allowedFields,
    });
    return NextResponse.json({ success: true });
  }

  await prisma.feishuConfig.create({ data: { id: 'default', ...allowedFields } });
  return NextResponse.json({ success: true });
}

// POST: 飞书 Webhook 推送
export async function POST(req: Request) {
  const body = await req.json();
  const { webhookUrl, messageType, data } = body;

  if (!webhookUrl) {
    return NextResponse.json({
      code: 0,
      msg: 'success (demo mode)',
      data: { messageId: `msg_${Date.now()}`, sendTime: new Date().toISOString(), messageType },
    });
  }

  try {
    const card = buildFeishuCard(messageType, data);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg_type: 'interactive', card }),
    });

    const result = await response.json();
    if (result.code === 0 || result.StatusCode === 0) {
      return NextResponse.json({
        code: 0,
        msg: 'success',
        data: { messageId: `msg_${Date.now()}`, sendTime: new Date().toISOString(), messageType },
      });
    }
    return NextResponse.json({ code: result.code || -1, msg: result.msg || '推送失败' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ code: -1, msg: 'Webhook 推送失败', error: String(error) }, { status: 500 });
  }
}

function buildFeishuCard(type: string, data: { title?: string; content?: string }) {
  const headerColor: Record<string, string> = {
    jd: 'blue', candidate: 'green', interview: 'orange', report: 'purple',
  };
  const headerTitle: Record<string, string> = {
    jd: '📋 岗位 JD 已生成', candidate: '👤 候选人报告',
    interview: '🎯 面试安排', report: '📊 评分报告',
  };

  return {
    header: {
      title: { tag: 'plain_text', content: headerTitle[type] || '智聘 Copilot' },
      template: headerColor[type] || 'blue',
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: `**${data.title || '消息'}**\n\n${(data.content || '').substring(0, 500)}` } },
      { tag: 'hr' },
      { tag: 'note', elements: [{ tag: 'plain_text', content: `来自 智聘 Copilot · ${new Date().toLocaleString('zh-CN')}` }] },
    ],
  };
}
