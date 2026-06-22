"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

export default function DigitalMarketingPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Phase 1: No actual backend connection
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-cyan-100 selection:text-cyan-900 pb-20">
      
      {/* Hero Section */}
      <div className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-[50%] -left-[10%] w-[60%] h-[100%] rounded-full bg-cyan-400/10 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[50%] h-[100%] rounded-full bg-blue-400/10 blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <Link href="/outreach" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-8">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Outreach
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-900 tracking-tight mb-6">
              Digital Marketing Services
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Connect with top-tier agencies and freelancers to optimize your online presence and drive conversions.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        
        {/* Services Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Services</h2>
            <p className="text-slate-600">Everything you need to dominate the digital landscape.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "SEO Optimization", desc: "Rank higher on Google and drive organic traffic.", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
              { name: "Google Ads", desc: "High-converting search and display campaigns.", icon: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" },
              { name: "Meta Ads", desc: "Targeted advertising on Facebook and Instagram.", icon: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" },
              { name: "Social Media", desc: "Engaging content and community management.", icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              { name: "Content Marketing", desc: "Compelling copy, blogs, and video production.", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
              { name: "Web Development", desc: "High-performance landing pages and funnels.", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
            ].map((service, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600 mb-6 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={service.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{service.name}</h3>
                <p className="text-slate-600">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Process Section */}
        <div className="mb-24 bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="text-center mb-12 relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">The Process</h2>
            <p className="text-slate-400">From brief to execution in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {[
              { step: "01", title: "Share Requirements", desc: "Outline your goals, current metrics, and what success looks like to you." },
              { step: "02", title: "Get Matched", desc: "We connect you with vetted experts who specialize in your industry." },
              { step: "03", title: "Grow Business", desc: "Execute the strategy, monitor performance, and scale your brand." }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                {idx !== 2 && <div className="hidden md:block absolute top-8 left-1/2 w-full h-[1px] bg-slate-700" />}
                <div className="relative bg-slate-800 w-16 h-16 mx-auto rounded-full border border-slate-600 flex items-center justify-center font-bold text-cyan-400 text-xl shadow-inner mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-center text-white mb-2">{item.title}</h3>
                <p className="text-center text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Form Section */}
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="text-center mb-8 relative z-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Request Service</h2>
            <p className="text-slate-600">Tell us what you need and we'll match you with the right experts.</p>
          </div>

          {isSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 text-green-800 p-8 rounded-2xl text-center border border-green-200"
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Request Received!</h3>
              <p className="text-green-700">Thank you. Our digital marketing team will review and contact you shortly.</p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="mt-6 text-sm font-medium text-green-600 hover:text-green-800 underline"
              >
                Submit another request
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name</label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white" placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Name</label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white" placeholder="TechFlow Inc." />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Email</label>
                <input required type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white" placeholder="jane@techflow.com" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Required</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white text-slate-700 appearance-none">
                    <option>SEO Optimization</option>
                    <option>Google Ads</option>
                    <option>Meta Ads</option>
                    <option>Social Media Marketing</option>
                    <option>Content Marketing</option>
                    <option>Web Development</option>
                    <option>Multiple/Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Monthly Budget</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white text-slate-700 appearance-none">
                    <option>Under $1,000</option>
                    <option>$1,000 - $3,000</option>
                    <option>$3,000 - $10,000</option>
                    <option>$10,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Details</label>
                <textarea required rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white resize-none" placeholder="Describe your current marketing stack and goals..."></textarea>
              </div>

              <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-cyan-600 text-white rounded-xl font-bold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                Submit Request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
