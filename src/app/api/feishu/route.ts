import { NextResponse } from 'next/server';

// 飞书 Webhook 消息推送 - 支持真实推送
export async function POST(req: Request) {
  const body = await req.json();
  const { webhookUrl, messageType, data } = body;

  if (!webhookUrl) {
    // 无 webhook 地址时返回模拟成功
    return NextResponse.json({
      code: 0,
      msg: 'success (demo mode)',
      data: {
        messageId: `msg_${Date.now()}`,
        sendTime: new Date().toISOString(),
        messageType,
      },
    });
  }

  try {
    // 构建飞书消息卡片
    const card = buildFeishuCard(messageType, data);

    // 真实调用飞书 Webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'interactive',
        card,
      }),
    });

    const result = await response.json();

    if (result.code === 0 || result.StatusCode === 0) {
      return NextResponse.json({
        code: 0,
        msg: 'success',
        data: {
          messageId: `msg_${Date.now()}`,
          sendTime: new Date().toISOString(),
          messageType,
        },
      });
    } else {
      return NextResponse.json({
        code: result.code || -1,
        msg: result.msg || '推送失败',
      }, { status: 400 });
    }
  } catch (error) {
    // 推送失败时返回错误但不阻断流程
    return NextResponse.json({
      code: -1,
      msg: 'Webhook 推送失败',
      error: String(error),
    }, { status: 500 });
  }
}

// 飞书文档创建
export async function PUT(req: Request) {
  const body = await req.json();
  const { token, title, content } = body;

  // 模拟飞书文档创建
  const mockResponse = {
    code: 0,
    msg: 'success',
    data: {
      documentId: `doc_${Date.now()}`,
      title,
      url: `https://bytedance.feishu.cn/docx/mock_${Date.now()}`,
      createTime: new Date().toISOString(),
    },
  };

  await new Promise(r => setTimeout(r, 1000));

  return NextResponse.json(mockResponse);
}

// 构建飞书消息卡片
function buildFeishuCard(type: string, data: { title?: string; content?: string }) {
  const headerColor = {
    jd: 'blue',
    candidate: 'green',
    interview: 'orange',
    report: 'purple',
  }[type] || 'blue';

  const headerTitle = {
    jd: '📋 岗位 JD 已生成',
    candidate: '👤 候选人报告',
    interview: '🎯 面试安排',
    report: '📊 评分报告',
  }[type] || '智聘 Copilot';

  return {
    header: {
      title: { tag: 'plain_text', content: headerTitle },
      template: headerColor,
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**${data.title || '消息'}**\n\n${(data.content || '').substring(0, 500)}`,
        },
      },
      {
        tag: 'hr',
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `来自 智聘 Copilot · ${new Date().toLocaleString('zh-CN')}`,
          },
        ],
      },
    ],
  };
}
