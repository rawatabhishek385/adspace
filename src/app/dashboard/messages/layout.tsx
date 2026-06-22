"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import ConversationsSidebar from "@/components/messages/ConversationsSidebar";
import { getSocket } from "@/lib/socket";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  useEffect(() => {
    // Socket connection is now handled globally in Navbar.tsx
  }, [session?.user?.id]);

  // If we are on mobile and viewing a specific chat, hide the sidebar.
  // We check this by seeing if the pathname has an ID after /dashboard/messages
  const isViewingChat = pathname.startsWith("/dashboard/messages/") && pathname !== "/dashboard/messages";

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white backdrop-blur-xl border border-slate-200 rounded-2xl overflow-hidden mt-6 shadow-xl">
      {/* Sidebar - hidden on mobile if viewing chat */}
      <div
        className={`${
          isViewingChat ? "hidden md:flex" : "flex"
        } w-full md:w-72 lg:w-80 flex-col border-r border-slate-200 shrink-0 bg-white/80`}
      >
        <ConversationsSidebar />
      </div>

      {/* Main Chat Area - hidden on mobile if NOT viewing chat */}
      <div
        className={`${
          !isViewingChat ? "hidden md:flex" : "flex"
        } flex-1 flex-col bg-white/40 relative overflow-hidden`}
      >
        {children}
      </div>
    </div>
  );
}
