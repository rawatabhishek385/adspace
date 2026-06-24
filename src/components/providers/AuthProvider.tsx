"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

function SessionWatcher({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      setWasAuthenticated(true);
    } else if (status === "unauthenticated" && wasAuthenticated) {
      // Session expired while user was actively using the app
      setWasAuthenticated(false);
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}&expired=true`);
    }
  }, [status, wasAuthenticated, router, pathname]);

  return <>{children}</>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // refetchInterval={15} ensures the client checks session validity every 15 seconds
  return (
    <SessionProvider refetchInterval={15}>
      <SessionWatcher>
        {children}
      </SessionWatcher>
    </SessionProvider>
  );
}
