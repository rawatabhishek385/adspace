interface FileMessageProps {
  url: string;
  name: string;
  size?: number | null;
  isMine: boolean;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileColor(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'text-red-500 bg-red-100';
    case 'doc': case 'docx': return 'text-blue-500 bg-blue-100';
    case 'xls': case 'xlsx': return 'text-green-500 bg-green-100';
    case 'zip': case 'rar': case '7z': return 'text-gray-500 bg-gray-100';
    default: return 'text-indigo-500 bg-indigo-100';
  }
}

export default function FileMessage({ url, name, size, isMine }: FileMessageProps) {
  const fileColor = getFileColor(name);

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all hover:-translate-y-0.5 max-w-xs sm:max-w-sm shadow-sm ${
        isMine 
          ? "bg-white/10 border-white/20 hover:bg-white/20 text-white" 
          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800"
      }`}
    >
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isMine ? "bg-white/20 text-white" : fileColor}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-semibold text-[13px] truncate">{name}</span>
        {size ? (
          <span className={`text-[11px] ${isMine ? "text-white/70" : "text-slate-500"}`}>{formatBytes(size)}</span>
        ) : null}
      </div>
      <div className={`shrink-0 p-1.5 rounded-full ${isMine ? "bg-white/10 hover:bg-white/20" : "bg-slate-100 hover:bg-slate-200"} transition-colors`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
    </a>
  );
}
