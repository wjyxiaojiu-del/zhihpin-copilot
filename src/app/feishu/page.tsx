'use client';

import { useState } from 'react';

export default function FeishuSettingsPage() {
  const [config, setConfig] = useState({
    appId: '',
    appSecret: '',
    webhookUrl: '',
    loginEnabled: false,
    docEnabled: false,
    pushEnabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const [testError, setTestError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; department: string } | null>(null);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      localStorage.setItem('feishu_config', JSON.stringify(config));
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  const handleTestWebhook = async () => {
    if (!config.webhookUrl) {
      setTestError('请先填写 Webhook URL');
      return;
    }
    setTesting(true);
    setTestError('');
    setTested(false);

    try {
      const res = await fetch('/api/feishu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: config.webhookUrl,
          messageType: 'test',
          data: {
            title: '智聘 Copilot 连接测试',
            content: '这是一条来自智聘 Copilot 的测试消息。如果你看到这条消息，说明 Webhook 配置成功！',
          },
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setTested(true);
        setTimeout(() => setTested(false), 5000);
      } else {
        setTestError(data.msg || '推送失败，请检查 Webhook URL');
      }
    } catch {
      setTestError('网络错误，请检查 Webhook URL 是否正确');
    }
    setTesting(false);
  };

  const handleLogin = () => {
    setLoggingIn(true);
    // 模拟飞书 OAuth 登录
    setTimeout(() => {
      setLoggedIn(true);
      setLoggingIn(false);
      setUser({
        name: '张经理',
        email: 'zhangjingli@company.com',
        department: '人力资源部',
      });
      localStorage.setItem('feishu_token', 'mock_token_001');
    }, 1500);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    localStorage.removeItem('feishu_token');
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-[#2d2a26]">飞书集成设置</h1>
        <p className="text-[14px] text-[#8a8580] mt-0.5">配置飞书应用，实现消息推送、文档创建和账号登录</p>
      </div>

      {/* Login Section */}
      <div className="glass-card rounded-xl p-5 mb-5 hover-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#fdf2ee] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c96442" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#2d2a26]">飞书账号登录</h3>
              <p className="text-[12px] text-[#8a8580]">使用飞书 OAuth 2.0 授权登录</p>
            </div>
          </div>
          {loggedIn && (
            <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#e4ede6] text-[#3d5e47] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59]" />
              已连接
            </span>
          )}
        </div>

        {loggedIn && user ? (
          <div className="bg-[#faf9f7] rounded-lg p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-[#c96442] flex items-center justify-center text-white text-[14px] font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-[#2d2a26]">{user.name}</div>
              <div className="text-[12px] text-[#8a8580]">{user.email} · {user.department}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border border-[#e8e4df] text-[12px] text-[#8a8580] hover:text-[#c0382b] hover:border-[#f0c0bc] transition-colors"
            >
              退出登录
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full py-2.5 bg-[#c96442] hover:bg-[#b85636] disabled:opacity-60 text-white rounded-lg text-[14px] font-medium transition-all flex items-center justify-center gap-2"
          >
            {loggingIn ? (
              <>
                <svg className="animate-spin-slow w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                正在跳转飞书授权...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                使用飞书账号登录
              </>
            )}
          </button>
        )}
      </div>

      {/* App Config */}
      <div className="glass-card rounded-xl p-5 mb-5 hover-glow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#fdf2ee] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c96442" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[#2d2a26]">应用配置</h3>
            <p className="text-[12px] text-[#8a8580]">在飞书开放平台创建应用后获取</p>
          </div>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-[13px] text-[#5e5a55] mb-1.5 font-medium">App ID</label>
            <input
              value={config.appId}
              onChange={e => setConfig({ ...config, appId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#e8e4df] text-[14px] transition-all"
              placeholder="cli_xxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#5e5a55] mb-1.5 font-medium">App Secret</label>
            <input
              type="password"
              value={config.appSecret}
              onChange={e => setConfig({ ...config, appSecret: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#e8e4df] text-[14px] transition-all"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
        </div>
      </div>

      {/* Webhook Config */}
      <div className="glass-card rounded-xl p-5 mb-5 hover-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#fdf2ee] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c96442" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#2d2a26]">Webhook 消息推送</h3>
              <p className="text-[12px] text-[#8a8580]">飞书群机器人 Webhook 地址（真实推送）</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.pushEnabled}
              onChange={e => setConfig({ ...config, pushEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-[#e8e4df] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c96442]"></div>
          </label>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-[13px] text-[#5e5a55] mb-1.5 font-medium">Webhook URL</label>
            <div className="flex gap-2">
              <input
                value={config.webhookUrl}
                onChange={e => setConfig({ ...config, webhookUrl: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border border-[#e8e4df] text-[14px] transition-all"
                placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx"
              />
              <button
                onClick={handleTestWebhook}
                disabled={testing}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  tested
                    ? 'bg-[#e4ede6] text-[#3d5e47] border border-[#c8ddd0]'
                    : testError
                      ? 'bg-[#fde5e3] text-[#8c2e24] border border-[#f0c0bc]'
                      : 'border border-[#e8e4df] text-[#5e5a55] hover:border-[#d5d0ca] hover:bg-[#f5f3f0]'
                }`}
              >
                {testing ? '测试中...' : tested ? '✓ 发送成功' : testError ? '✗ 失败' : '测试'}
              </button>
            </div>
            {testError && (
              <p className="text-[11px] text-[#c0382b] mt-1.5">{testError}</p>
            )}
            {tested && (
              <p className="text-[11px] text-[#4a7c59] mt-1.5">Webhook 测试成功！请检查飞书群消息。</p>
            )}
            <p className="text-[11px] text-[#a8a29e] mt-1.5">在飞书群设置 → 群机器人 → 自定义机器人中获取</p>
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="glass-card rounded-xl p-5 mb-5 hover-glow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#fdf2ee] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c96442" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[#2d2a26]">功能开关</h3>
            <p className="text-[12px] text-[#8a8580]">选择要启用的飞书功能</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'loginEnabled', label: '飞书登录', desc: '允许使用飞书账号登录系统' },
            { key: 'docEnabled', label: '文档创建', desc: '将 JD 和报告一键写入飞书文档' },
            { key: 'pushEnabled', label: '消息推送', desc: '将招聘结果推送到飞书群（需配置 Webhook）' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#faf9f7] transition-colors cursor-pointer">
              <div>
                <div className="text-[13px] font-medium text-[#2d2a26]">{item.label}</div>
                <div className="text-[12px] text-[#8a8580]">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={config[item.key as keyof typeof config] as boolean}
                onChange={e => setConfig({ ...config, [item.key]: e.target.checked })}
                className="w-4 h-4 rounded border-[#e8e4df] text-[#c96442] focus:ring-[#c96442]"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-[14px] px-6 py-2.5"
        >
          {saving ? '保存中...' : saved ? '✓ 已保存' : '保存配置'}
        </button>
      </div>

      {/* Guide */}
      <div className="mt-6 glass-card rounded-xl p-5">
        <h3 className="text-[13px] font-semibold text-[#2d2a26] mb-3">接入指南</h3>
        <div className="space-y-2.5 text-[13px] text-[#5e5a55] leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#c96442] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
            <span>前往 <a href="https://open.feishu.cn" target="_blank" rel="noopener noreferrer" className="text-[#c96442] underline">飞书开放平台</a> 创建企业自建应用</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#c96442] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
            <span>在应用详情页获取 App ID 和 App Secret</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#c96442] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
            <span>在飞书群中添加自定义机器人，复制 Webhook 地址</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#c96442] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
            <span>在应用权限中开启文档创建和消息发送权限</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#4a7c59] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">5</span>
            <span>填写上方配置后点击「测试」验证连通性</span>
          </div>
        </div>
      </div>
    </div>
  );
}
