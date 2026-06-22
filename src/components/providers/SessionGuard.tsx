"use client";

import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isDuplicate, setIsDuplicate] = useState(false);
  const tabIdRef = useRef("");

  useEffect(() => {
    // If the server invalidated our session (e.g., logged into another browser),
    // token.id gets wiped, so session.user.id becomes empty. Log out immediately.
    if (status === "authenticated" && session?.user && !session.user.id) {
      signOut({ callbackUrl: "/login" });
    }
  }, [session, status]);

  useEffect(() => {
    // Generate a unique ID for this tab once
    if (!tabIdRef.current) {
      tabIdRef.current = Math.random().toString(36).substring(2);
    }
    
    if (status !== "authenticated") return;

    const channel = new BroadcastChannel("adspace_auth_sync");
    const tabId = tabIdRef.current;
    
    let isAcknowledged = false;
    let timeout: NodeJS.Timeout;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === "HELLO" && data.tabId !== tabId) {
        // A new tab is saying hello. We are already here, so tell them!
        channel.postMessage({ type: "ALREADY_HERE", to: data.tabId });
      } else if (data.type === "ALREADY_HERE" && data.to === tabId) {
        // Another tab told us they exist. We are a duplicate!
        isAcknowledged = true;
        setIsDuplicate(true);
      }
    };

    channel.addEventListener("message", handleMessage);

    // Say hello to other tabs
    channel.postMessage({ type: "HELLO", tabId });

    timeout = setTimeout(() => {
      // After 1 second, if no one replied, we are the only tab.
      if (!isAcknowledged && !isDuplicate) {
        const isInitialized = sessionStorage.getItem("tab_initialized");
        if (!isInitialized) {
          // We are the only tab, but we lack initialization.
          // This means this is a fresh session from a persistent cookie after closing the browser/tab.
          signOut({ callbackUrl: "/login" });
        }
      }
    }, 1000);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
      clearTimeout(timeout);
    };
  }, [status, isDuplicate]);

  if (isDuplicate) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white px-4">
        <div className="bg-white p-8 rounded-2xl max-w-md text-center border border-slate-200 shadow-xl">
          <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Multiple Tabs Detected</h2>
          <p className="text-slate-500 text-sm mb-6">
            Your account is actively logged in on another tab. For security reasons, please close this tab or return to your original session.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
