interface MessageReactionBarProps {
  onReact: (emoji: string) => void;
  position: "left" | "right";
  onClose: () => void;
}

export const EMOJIS = ["👍", "❤️", "😂", "😍", "🔥"];

export default function MessageReactionBar({ onReact, position, onClose }: MessageReactionBarProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div 
        className={`absolute z-50 -top-12 ${position === "right" ? "right-0" : "left-0"} bg-white rounded-full shadow-lg border border-slate-200 px-3 py-1.5 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200`}
      >
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              onReact(emoji);
              onClose();
            }}
            className="text-xl hover:scale-125 transition-transform duration-200 focus:outline-none"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
