import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | AdSpace Marketplace",
  description: "Create an account on AdSpace Marketplace to list your advertising spaces or find the perfect billboard for your campaign.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
