import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import SessionGuard from "@/components/providers/SessionGuard";
import SocketProvider from "@/providers/SocketProvider";
import LastSeenTracker from "@/components/auth/LastSeenTracker";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProgressBarProvider from "@/components/providers/ProgressBarProvider";
import AnnouncementBanner from "@/components/home/AnnouncementBanner";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ad Space Marketplace",
  description: "Rent and list advertising spaces — billboards, LED displays, digital signage, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased overflow-x-hidden`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 overflow-x-hidden w-full" suppressHydrationWarning>
        <AuthProvider>
          <SessionGuard>
            <SocketProvider>
              <ProgressBarProvider>
                <LastSeenTracker />
                <div className="sticky top-0 z-50">
                  <AnnouncementBanner />
                  <Navbar />
                </div>
                <main className="flex-1 flex flex-col">
                  {children}
                </main>
                <Footer />
              </ProgressBarProvider>
            </SocketProvider>
          </SessionGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
