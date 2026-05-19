'use client';

export default function LoadingBtn({ loading, onClick, children, className = '' }: {
  loading: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {loading && (
        <svg className="animate-spin-slow w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
