import { NextResponse } from 'next/server';

// 飞书 OAuth 登录模拟
export async function POST(req: Request) {
  const body = await req.json();
  const { code } = body;

  // 模拟飞书 OAuth 流程
  // 真实场景:
  // 1. 前端跳转: https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=xxx&redirect_uri=xxx
  // 2. 用户授权后回调拿到 code
  // 3. 用 code 换取 user_access_token
  // 4. 用 token 获取用户信息

  await new Promise(r => setTimeout(r, 600));

  return NextResponse.json({
    code: 0,
    data: {
      accessToken: `token_${Date.now()}`,
      user: {
        name: '张经理',
        avatar: '',
        email: 'zhangjingli@company.com',
        department: '人力资源部',
        userId: 'feishu_user_001',
      },
    },
  });
}
