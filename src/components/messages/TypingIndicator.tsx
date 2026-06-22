import { motion } from "framer-motion";

export default function TypingIndicator({ name }: { name: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-2 self-start bg-white/70 backdrop-blur-md rounded-2xl px-4 py-2 border border-slate-200/60 shadow-sm mt-2 ml-1"
    >
      <span className="text-xs font-medium text-slate-500">{name} is typing</span>
      <div className="flex gap-1">
        <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
        <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
        <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
      </div>
    </motion.div>
  );
}
