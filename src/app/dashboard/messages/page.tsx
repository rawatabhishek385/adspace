import ReviewReminderCard from "@/components/reviews/ReviewReminderCard";

export default function MessagesEmptyState() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6">
        <ReviewReminderCard />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 pb-20">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-2">Your Messages</h3>
        <p className="text-sm">Select a conversation from the sidebar to start chatting.</p>
      </div>
    </div>
  );
}
