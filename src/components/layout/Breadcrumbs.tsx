"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Map raw path segments to human-readable labels
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  listings: "My Listings",
  create: "Create Listing",
  edit: "Edit",
  admin: "Admin",
  categories: "Categories",
  users: "Users",
  reports: "Reports",
};

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Split into segments, filter out empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items: each item has a label and href
  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    // If it looks like an ID (MongoDB-style hex string), skip rendering this as a label
    const isId = /^[a-f0-9]{24,}$|^[0-9a-f-]{36}$/.test(segment);
    const label = isId ? null : (SEGMENT_LABELS[segment] ?? segment);
    return { href, label, isId };
  }).filter((c) => !c.isId && c.label);

  if (crumbs.length <= 1) return null; // No breadcrumbs for top-level pages

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-blue-500 transition-colors"
          >
            Home
          </Link>
        </li>

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {isLast ? (
                <span className="text-sm font-medium text-blue-500">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
