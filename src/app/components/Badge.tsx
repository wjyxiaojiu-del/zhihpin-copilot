'use client';

const styles: Record<string, { bg: string; text: string; dot: string }> = {
  '强烈推荐': { bg: 'bg-[#e4ede6]', text: 'text-[#3d5e47]', dot: 'bg-[#4a7c59]' },
  '推荐': { bg: 'bg-[#fde8df]', text: 'text-[#9a4328]', dot: 'bg-[#c96442]' },
  '待观察': { bg: 'bg-[#f3ece2]', text: 'text-[#7a6840]', dot: 'bg-[#c07d2c]' },
  '不推荐': { bg: 'bg-[#fde5e3]', text: 'text-[#8c2e24]', dot: 'bg-[#c0382b]' },
};

export default function Badge({ level }: { level: string }) {
  const s = styles[level] || styles['待观察'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[12px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {level}
    </span>
  );
}
