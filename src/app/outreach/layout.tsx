import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AdSpace Outreach Hub | Find Marketing Partners",
  description: "Connect with verified digital marketing agencies and influencers to boost your ad campaigns.",
  openGraph: {
    title: "AdSpace Outreach Hub",
    description: "Connect with verified digital marketing agencies and influencers to boost your ad campaigns.",
    type: "website",
  },
};

export default function OutreachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
