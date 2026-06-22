"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

export default function InfluencersPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Phase 1: No actual backend connection
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-purple-100 selection:text-purple-900 pb-20">
      
      {/* Hero Section */}
      <div className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-[50%] -left-[10%] w-[60%] h-[100%] rounded-full bg-purple-400/10 blur-[120px]" />
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
            <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 tracking-tight mb-6">
              Influencer Marketing
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Reach your audience authentically through trusted creators, industry experts, and regional influencers.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        
        {/* Categories Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Discover by Category</h2>
            <p className="text-slate-600">Find the perfect voice for your brand's unique niche.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Fashion", emoji: "👗", color: "from-pink-500 to-rose-500" },
              { name: "Tech", emoji: "💻", color: "from-blue-500 to-cyan-500" },
              { name: "Travel", emoji: "✈️", color: "from-amber-400 to-orange-500" },
              { name: "Food", emoji: "🍔", color: "from-red-500 to-orange-600" },
              { name: "Fitness", emoji: "💪", color: "from-emerald-500 to-teal-500" },
              { name: "Lifestyle", emoji: "✨", color: "from-purple-500 to-indigo-500" },
            ].map((cat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center group cursor-pointer"
              >
                <div className={`w-14 h-14 mx-auto rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-inner mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {cat.emoji}
                </div>
                <h3 className="font-semibold text-slate-800">{cat.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-24 bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="text-center mb-12 relative z-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-600">A simple process to launch your next big campaign.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {[
              { step: "01", title: "Submit Requirements", desc: "Tell us about your brand, goals, and budget using the form below." },
              { step: "02", title: "Find Creators", desc: "We'll hand-pick the best influencers that align perfectly with your target audience." },
              { step: "03", title: "Launch Campaign", desc: "Collaborate, review content, and watch your brand awareness soar." }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                {idx !== 2 && <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-slate-100" />}
                <div className="relative bg-white w-16 h-16 mx-auto rounded-full border-4 border-purple-50 flex items-center justify-center font-bold text-purple-600 text-xl shadow-sm mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-center text-slate-800 mb-2">{item.title}</h3>
                <p className="text-center text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Form Section */}
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="text-center mb-8 relative z-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Request Campaign</h2>
            <p className="text-slate-600">Fill out the details below and our team will get in touch.</p>
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
              <p className="text-green-700">Thank you for your interest. Our outreach team will contact you shortly.</p>
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
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white" placeholder="Acme Corp" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Email</label>
                <input required type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white" placeholder="john@company.com" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Industry Category</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white text-slate-700 appearance-none">
                    <option>Fashion</option>
                    <option>Tech</option>
                    <option>Travel</option>
                    <option>Food</option>
                    <option>Fitness</option>
                    <option>Lifestyle</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Estimated Budget</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white text-slate-700 appearance-none">
                    <option>Under $1,000</option>
                    <option>$1,000 - $5,000</option>
                    <option>$5,000 - $10,000</option>
                    <option>$10,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Campaign Goal</label>
                <textarea required rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white resize-none" placeholder="Describe what you want to achieve..."></textarea>
              </div>

              <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-purple-600 text-white rounded-xl font-bold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                Request Influencer Campaign
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
