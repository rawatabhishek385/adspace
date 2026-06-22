"use client";

import NextTopLoader from "nextjs-toploader";

export default function ProgressBarProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <NextTopLoader
        height={4}
        color="#3b82f6"
        showSpinner={false}
      />
    </>
  );
}
