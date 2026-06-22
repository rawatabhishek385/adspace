interface ReplyPreviewProps {
  id?: string;
  content: string;
  senderName: string;
  onClose?: () => void;
  messageType?: "TEXT" | "IMAGE" | "FILE";
  fileName?: string;
  isDeleted?: boolean;
}

export default function ReplyPreview({ id, content, senderName, onClose, messageType = "TEXT", fileName, isDeleted }: ReplyPreviewProps) {
  const handleClick = () => {
    if (id) {
      const el = document.getElementById(`msg-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-indigo-400", "ring-offset-2", "transition-all");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-indigo-400", "ring-offset-2", "transition-all");
        }, 2000);
      }
    }
  };

  return (
    <div 
      className={`flex items-center justify-between bg-white/50 backdrop-blur-sm border-l-4 border-indigo-500 rounded-r-xl p-2.5 mb-2 text-sm relative overflow-hidden group shadow-sm ${id ? "cursor-pointer hover:bg-white/80 transition-colors" : ""}`}
      onClick={handleClick}
    >
      <div className="flex flex-col min-w-0 pr-8">
        <span className="font-semibold text-indigo-600 text-[13px] mb-0.5">{senderName}</span>
        {isDeleted ? (
          <span className="text-slate-400 italic text-[13px] truncate">This message was deleted</span>
        ) : messageType === "IMAGE" ? (
          <span className="text-slate-500 text-[13px] flex items-center gap-1.5 truncate">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Photo
          </span>
        ) : messageType === "FILE" ? (
          <span className="text-slate-500 text-[13px] flex items-center gap-1.5 truncate">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {fileName || "File"}
          </span>
        ) : (
          <p className="text-slate-600 text-[13px] truncate">{content}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
          title="Cancel reply"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
