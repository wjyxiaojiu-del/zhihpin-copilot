'use client';

const colorMap: Record<string, string> = {
  primary: 'bg-[#fde8df] text-[#9a4328]',
  green: 'bg-[#e4ede6] text-[#3d5e47]',
  yellow: 'bg-[#f3ece2] text-[#7a6840]',
  red: 'bg-[#fde5e3] text-[#8c2e24]',
  gray: 'bg-[#ece9e5] text-[#5e5a55]',
};

export default function Tag({ text, color = 'primary' }: { text: string; color?: string }) {
  return (
    <span className={`inline-block text-[12px] px-2.5 py-0.5 rounded-lg font-medium tag-hover cursor-default ${colorMap[color] || colorMap.primary}`}>
      {text}
    </span>
  );
}
