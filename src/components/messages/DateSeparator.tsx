import { isToday, isYesterday, format } from "date-fns";

interface DateSeparatorProps {
  date: Date;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  let label = "";
  if (isToday(date)) {
    label = "Today";
  } else if (isYesterday(date)) {
    label = "Yesterday";
  } else {
    label = format(date, "MMMM d, yyyy");
  }

  return (
    <div className="flex justify-center my-6 relative z-0">
      <div className="bg-white/60 backdrop-blur-md rounded-full px-4 py-1.5 shadow-sm border border-slate-200/50">
        <span className="text-[11px] font-semibold text-slate-500/80 uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
}
