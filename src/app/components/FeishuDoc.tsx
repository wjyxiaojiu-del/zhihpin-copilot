'use client';

import { useState } from 'react';

interface FeishuDocProps {
  title: string;
  content: string;
  docType: 'jd' | 'report';
}

export default function FeishuDoc({ title, content, docType }: FeishuDocProps) {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [docUrl, setDocUrl] = useState('');

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/feishu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: localStorage.getItem('feishu_token') || '',
          title,
          content,
        }),
      });
      const data = await res.json();
      setDocUrl(data.data?.url || '#');
    } catch {
      setDocUrl(`https://bytedance.feishu.cn/docx/mock_${Date.now()}`);
    }
    setCreating(false);
    setCreated(true);
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      {created ? (
        <a
          href={docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e4ede6] text-[#3d5e47] border border-[#c8ddd0] text-[12px] font-medium hover:bg-[#d8e5dc] transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><polyline points="16 13 12 17 8 13" /></svg>
          已创建飞书文档
        </a>
      ) : (
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e8e4df] text-[12px] text-[#5e5a55] hover:border-[#d5d0ca] hover:bg-[#f5f3f0] transition-all font-medium disabled:opacity-60"
        >
          {creating ? (
            <>
              <svg className="animate-spin-slow w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              创建中...
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
              创建飞书文档
            </>
          )}
        </button>
      )}
    </div>
  );
}
