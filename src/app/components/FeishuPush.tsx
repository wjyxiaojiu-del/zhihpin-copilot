'use client';

import { useState, useRef, useEffect } from 'react';

interface FeishuPushProps {
  type: 'jd' | 'candidate' | 'interview' | 'report';
  title: string;
  content: string;
  webhookUrl?: string;
}

const typeLabels: Record<string, string> = {
  jd: '推送到飞书',
  candidate: '推送候选人报告',
  interview: '推送面试题',
  report: '推送评分报告',
};

export default function FeishuPush({ type, title, content, webhookUrl }: FeishuPushProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPreview) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (previewRef.current && !previewRef.current.contains(e.target as Node)) {
        setShowPreview(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPreview]);

  const handleSend = async () => {
    setSending(true);
    try {
      await fetch('/api/feishu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookUrl || '',
          messageType: type,
          data: { title, content },
        }),
      });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {
      // 演示模式，忽略错误
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }
    setSending(false);
  };

  return (
    <div className="relative inline-flex">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e8e4df] text-[12px] text-[#5e5a55] hover:border-[#d5d0ca] hover:bg-[#f5f3f0] transition-all font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          预览
        </button>
        <button
          onClick={handleSend}
          disabled={sending || sent}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
            sent
              ? 'bg-[#e4ede6] text-[#3d5e47] border border-[#c8ddd0]'
              : 'bg-[#c96442] text-white hover:bg-[#b85636] hover:shadow-md'
          } disabled:opacity-70`}
        >
          {sending ? (
            <>
              <svg className="animate-spin-slow w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              发送中...
            </>
          ) : sent ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              已发送
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              {typeLabels[type]}
            </>
          )}
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div ref={previewRef} className="absolute top-full right-0 mt-2 w-80 z-50 animate-fade-in">
          <div className="glass-card rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[13px] font-semibold text-[#2d2a26]">飞书消息预览</h4>
              <button onClick={() => setShowPreview(false)} className="text-[#a8a29e] hover:text-[#5e5a55]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Mock Feishu Message Card */}
            <div className="bg-white rounded-lg border border-[#e8e4df] overflow-hidden">
              <div className="bg-[#c96442] px-3 py-2">
                <span className="text-white text-[12px] font-medium">智聘 Copilot</span>
              </div>
              <div className="p-3">
                <h5 className="text-[14px] font-bold text-[#2d2a26] mb-2">{title}</h5>
                <div className="text-[12px] text-[#5e5a55] leading-relaxed whitespace-pre-line max-h-32 overflow-auto">
                  {content.substring(0, 200)}...
                </div>
                <div className="mt-3 pt-2 border-t border-[#f0ede8] flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#c96442] flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /></svg>
                  </div>
                  <span className="text-[10px] text-[#a8a29e]">来自 智聘 Copilot</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => { setShowPreview(false); handleSend(); }}
                className="px-3 py-1.5 bg-[#c96442] text-white rounded-lg text-[12px] font-medium hover:bg-[#b85636] transition-colors"
              >
                确认发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
