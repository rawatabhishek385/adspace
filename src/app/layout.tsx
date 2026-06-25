import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://adspace-marketplace.com"),
  title: {
    default: "AdSpace Marketplace | Rent Premium Advertising Spaces",
    template: "%s | AdSpace Marketplace",
  },
  description: "Find and rent the best outdoor billboards, digital signage, and LED displays for your advertising campaigns.",
  keywords: ["advertising space", "rent billboard", "digital signage", "LED display", "outdoor advertising", "ad space", "influencer marketing"],
  authors: [{ name: "AdSpace Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "AdSpace Marketplace",
    title: "AdSpace Marketplace | Rent Premium Advertising Spaces",
    description: "Find and rent the best outdoor billboards, digital signage, and LED displays for your advertising campaigns.",
    images: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/v1/adspace/banner.jpg",
        width: 1200,
        height: 630,
        alt: "AdSpace Marketplace Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdSpace Marketplace",
    description: "Find and rent the best outdoor billboards, digital signage, and LED displays.",
    images: ["https://res.cloudinary.com/demo/image/upload/v1/adspace/banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} min-h-[100dvh] antialiased overflow-x-hidden`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] flex flex-col bg-slate-50 text-slate-800 overflow-x-hidden w-full" suppressHydrationWarning>
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
