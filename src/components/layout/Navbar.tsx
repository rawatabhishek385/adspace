"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import { SocketEvents } from "@/lib/socket";
import { playNotificationSound } from "@/lib/audio";
import NotificationBell from "../notifications/NotificationBell";

const NavLink = ({ href, children, isActive, onClick }: { href: string; children: React.ReactNode; isActive: (path: string) => boolean; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void }) => (
  <Link
    href={href}
    onClick={onClick}
    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(href)
        ? "bg-blue-50 text-blue-600"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      }`}
  >
    {children}
  </Link>
);

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { socket, isConnected } = useSocket();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatar, setAvatar] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchAvatar = () => {
      if (session?.user?.id) {
        fetch(`/api/profile/${session.user.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data?.user?.avatar) {
              setAvatar(data.data.user.avatar);
            }
          })
          .catch((err) => console.warn("Could not fetch avatar:", err));
      }
    };

    if (session?.user) {
      fetch("/api/messages/unread")
        .then((res) => res.json())
        .then((data) => {
          if (data.count) setUnreadCount(data.count);
        })
        .catch((err) => console.warn("Could not fetch unread messages:", err));

      if (session.user.avatar) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAvatar(session.user.avatar);
      } else {
        fetchAvatar();
      }
    }

    window.addEventListener('profileUpdated', fetchAvatar);

    return () => {
      window.removeEventListener('profileUpdated', fetchAvatar);
    };
  }, [session]);

  // Listen for real-time message notifications via the socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewGlobalMessage = (data: any) => {
      setUnreadCount(prev => prev + 1);
      playNotificationSound();

      if (document.hidden && Notification.permission === "granted") {
        new Notification("New Message", {
          body: data?.message?.content || "You have received a new message.",
          icon: "/favicon.ico"
        });
      }
    };

    socket.on(SocketEvents.RECEIVE_MESSAGE, handleNewGlobalMessage);

    return () => {
      socket.off(SocketEvents.RECEIVE_MESSAGE, handleNewGlobalMessage);
    };
  }, [socket, isConnected]);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo & Primary Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-800 tracking-tight">
                Ad<span className="text-blue-500">Space</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-2">
              {session?.user && (
                <NavLink href="/dashboard" isActive={isActive}>
                  Dashboard
                </NavLink>
              )}
              {session?.user?.role === "ADMIN" && (
                <NavLink href="/admin" isActive={isActive}> 
                  Admin Dashboard
                </NavLink>
              )}
              <NavLink href="/listings" isActive={isActive}>Spaces</NavLink>
              <NavLink
                href="/nearby"
                isActive={isActive}
              >
                Nearby
              </NavLink>
              <NavLink href="/outreach/browse" isActive={isActive}>Outreach</NavLink>
            </div>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-20 h-8 bg-slate-200 animate-pulse rounded-lg" />
            ) : session?.user ? (
              <>
                <Link
                  href="/dashboard/listings/create"
                  className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  + Create Listing
                </Link>

                <NotificationBell />

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none"
                  >
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-blue-100 text-blue-600 ring-2 ring-blue-200">
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-medium">{session.user.name?.[0] || session.user.email?.[0] || "U"}</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white z-10">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="max-w-[150px] truncate">{session.user.name || session.user.email}</span>
                    <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden z-50">
                      <Link href={`/profile/${session.user.id}`} onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">My Profile</Link>
                      <div className="border-t border-slate-100 my-1"></div>
                      <Link href="/dashboard" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">Dashboard</Link>
                      <Link href="/dashboard/listings" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">My Listings</Link>
                      <Link href="/dashboard/messages" onClick={() => setIsDropdownOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                        Messages
                        {unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      {session.user.role === "ADMIN" && (
                        <>
                          <div className="border-t border-slate-100 my-1"></div>
                          <div className="px-4 py-1 mt-1 text-xs font-semibold text-blue-500 uppercase tracking-wider">Admin Area</div>
                          <Link href="/admin" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">Admin Dashboard</Link>
                          <Link href="/admin/categories" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">Categories</Link>
                        </>
                      )}

                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-500 hover:text-slate-800 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl z-50">
          <div className="px-2 pt-2 pb-4 space-y-1">
            {status === "authenticated" && (
              <>
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">Dashboard</Link>
                {session?.user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">Admin Dashboard</Link>
                )}
              </>
            )}
            <Link href="/listings" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">Spaces</Link>
            <Link 
              href="/nearby" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              Nearby
            </Link>
            <Link href="/outreach/browse" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">Outreach</Link>

            {status === "authenticated" ? (
              <>
                <div className="border-t border-slate-100 my-2 pt-2">
                  <div className="px-3 text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">My Account</div>
                  <Link href={`/profile/${session.user.id}`} onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">My Profile</Link>
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">Dashboard</Link>
                  <Link href="/dashboard/listings" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">My Listings</Link>
                  <Link href="/dashboard/listings/create" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">Create Listing</Link>

                  {session?.user.role === "ADMIN" && (
                    <>
                      <div className="border-t border-slate-100 my-2"></div>
                      <div className="px-3 pt-2 text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">Admin Area</div>
                      <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">Admin Dashboard</Link>
                      <Link href="/admin/categories" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">Categories</Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-slate-100 my-2 pt-2 flex flex-col gap-2 px-3">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center px-4 py-2 text-base font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Login</Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
