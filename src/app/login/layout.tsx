import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | AdSpace Marketplace",
  description: "Sign in to AdSpace Marketplace to manage your advertising spaces, messages, and bookings.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
