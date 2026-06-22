"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Footer() {
  const { data: session } = useSession();
  const [isInfluencer, setIsInfluencer] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsInfluencer(false);
      return;
    }

    fetch("/api/influencer/profile")
      .then((res) => {
        // If the endpoint returns OK, the user has an influencer profile
        if (res.ok) setIsInfluencer(true);
        else setIsInfluencer(false);
      })
      .catch(() => setIsInfluencer(false));
  }, [session?.user?.id]);

  return (
    <footer className="w-full bg-white border-t border-slate-200 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Branding */}
          <div className="col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-slate-800 tracking-tight">
                Ad<span className="text-blue-500">Space</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              The premier marketplace for buying and selling advertising spaces. 
              From digital billboards to transit ads, find the perfect spot for your next campaign.
            </p>
          </div>

          {/* Platform Links */}
          <div className="col-span-1">
            <h3 className="text-slate-800 font-semibold mb-4 uppercase text-sm tracking-wider">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/listings" className="text-slate-500 hover:text-blue-500 text-sm transition-colors">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link href="/dashboard/listings/create" className="text-slate-500 hover:text-blue-500 text-sm transition-colors">
                  List Your Space
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-500 hover:text-blue-500 text-sm transition-colors">
                  Dashboard
                </Link>
              </li>
              {!isInfluencer && (
                <li>
                  <Link href="/outreach/apply" className="text-slate-500 hover:text-blue-500 text-sm transition-colors">
                    Become an Influencer
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Company Links */}
          <div className="col-span-1">
            <h3 className="text-slate-800 font-semibold mb-4 uppercase text-sm tracking-wider">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-slate-500 hover:text-blue-500 text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-blue-500 text-sm transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-blue-500 text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-blue-500 text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} AdSpace Marketplace. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
           
           
          </div>
        </div>
      </div>
    </footer>
  );
}
