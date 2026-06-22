"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function OutreachHubPage() {
  return (
    <div className="min-h-screen bg-[#fafcff] font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-400/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-cyan-400/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20 sm:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold tracking-wide mb-6 shadow-sm">
              Introducing AdSpace Outreach
            </span>
            <h1 className="text-5xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-800 to-slate-500 tracking-tight leading-[1.1] mb-8">
              Grow Beyond <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Outdoor Advertising
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
              Connect with influencers and digital marketing experts to amplify your campaigns and grow your brand into new dimensions.
            </p>
          </motion.div>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Card 1: Influencer Marketing */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl transform group-hover:scale-[1.02] transition-transform duration-500" />
            <div className="relative h-full flex flex-col bg-white/60 backdrop-blur-xl border border-white/80 p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 z-10 overflow-hidden">
              
              {/* Abstract Illustration */}
              <div className="h-48 w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-8 border border-blue-100/50 flex items-center justify-center relative overflow-hidden group-hover:shadow-inner transition-all duration-500">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl shadow-lg rotate-12 flex items-center justify-center text-white"
                  whileHover={{ rotate: 0, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
                <motion.div 
                  className="absolute -top-6 -right-6 w-24 h-24 bg-purple-400/20 rounded-full blur-xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                Influencer Marketing
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed flex-grow">
                Collaborate with Instagram, YouTube and LinkedIn creators to promote your products and campaigns.
              </p>
              
              <ul className="space-y-3 mb-10">
                {["Creator collaborations", "Sponsored posts", "Product promotions", "Regional influencers", "Brand awareness"].map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm font-medium text-slate-700">
                    <svg className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link 
                href="/outreach/browse?type=INDIVIDUAL"
                className="mt-auto group/btn inline-flex items-center justify-center px-6 py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
              >
                Explore Influencers
                <svg className="w-5 h-5 ml-2 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </motion.div>

          {/* Card 2: Digital Marketing */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-3xl transform group-hover:scale-[1.02] transition-transform duration-500" />
            <div className="relative h-full flex flex-col bg-white/60 backdrop-blur-xl border border-white/80 p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 z-10 overflow-hidden">
              
              {/* Abstract Illustration */}
              <div className="h-48 w-full bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl mb-8 border border-cyan-100/50 flex items-center justify-center relative overflow-hidden group-hover:shadow-inner transition-all duration-500">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                <motion.div 
                  className="w-40 h-24 bg-white rounded-xl shadow-lg flex flex-col p-3 border border-slate-100/50"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex gap-1.5 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 flex items-end gap-2 px-1">
                    <motion.div className="w-1/3 bg-cyan-200 rounded-t-sm" initial={{ height: "40%" }} animate={{ height: ["40%", "70%", "40%"] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}></motion.div>
                    <motion.div className="w-1/3 bg-blue-300 rounded-t-sm" initial={{ height: "60%" }} animate={{ height: ["60%", "40%", "60%"] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5, ease: "easeInOut" }}></motion.div>
                    <motion.div className="w-1/3 bg-indigo-400 rounded-t-sm" initial={{ height: "90%" }} animate={{ height: ["90%", "100%", "90%"] }} transition={{ repeat: Infinity, duration: 3, delay: 1, ease: "easeInOut" }}></motion.div>
                  </div>
                </motion.div>
                <motion.div 
                  className="absolute -bottom-6 -left-6 w-32 h-32 bg-cyan-400/20 rounded-full blur-xl"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                Digital Marketing Services
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed flex-grow">
                Discover SEO experts, Google Ads specialists, Meta Ads managers and full-service marketing agencies.
              </p>
              
              <ul className="space-y-3 mb-10">
                {["SEO", "Google Ads", "Meta Ads", "Social Media Marketing", "Branding"].map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm font-medium text-slate-700">
                    <svg className="w-5 h-5 mr-3 text-cyan-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link 
                href="/outreach/browse?type=DIGITAL_MARKETER"
                className="mt-auto group/btn inline-flex items-center justify-center px-6 py-4 bg-slate-900 hover:bg-cyan-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
              >
                Explore Services
                <svg className="w-5 h-5 ml-2 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
