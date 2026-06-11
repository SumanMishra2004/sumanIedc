"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/home/Footer";

export default function ContactClient() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    role: "student"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      toast.success("Thank you! Your message has been sent successfully.");
      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
        role: "student"
      });
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c0c] text-[#f0ede6] overflow-hidden">
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(201,245,59,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      
      {/* Gradient Blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-r from-violet-600/10 to-transparent" />
      <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none bg-gradient-to-l from-[#c9f53b]/5 to-transparent" />

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-16 z-10">
        
        {/* Title */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#c9f53b] text-xs font-bold tracking-[0.35em] uppercase mb-4 block"
          >
            ◆ REACH OUT ◆
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold uppercase tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Contact <span className="text-[#c9f53b]">Us</span>
          </motion.h1>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="h-[2px] w-20 bg-[#c9f53b]/60 mx-auto my-5"
          />
          <p className="max-w-2xl mx-auto text-sm text-white/50 leading-relaxed font-light">
            Have an innovative idea, research query, or want to collaborate with IEDC? Fill out the form below or reach us directly.
          </p>
        </div>

        {/* Form and Info Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          
          {/* Info Side (Left 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold uppercase tracking-wider text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Connect <span className="text-[#c9f53b]">Directly</span>
              </h2>
              <p className="text-sm text-white/55 font-light leading-relaxed">
                Whether you are a student developer looking for research resources, an academic requesting patent drafts, or an industry partner seeking hardware solutions, we are here to support you.
              </p>

              {/* Coordinates List */}
              <div className="flex flex-col gap-5 mt-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-[#c9f53b] shrink-0">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-0.5">Location</h4>
                    <p className="text-sm text-white/75 font-light leading-relaxed">
                      Innovation Block, Research Park,<br />Kolkata 700 001, West Bengal, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-[#c9f53b] shrink-0">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-0.5">Email Addresses</h4>
                    <p className="text-sm text-white/75 font-light leading-relaxed font-mono">
                      contact@iedc.edu.in<br />research.coordinator@iedc.edu.in
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-[#c9f53b] shrink-0">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-0.5">Phone Channels</h4>
                    <p className="text-sm text-white/75 font-light leading-relaxed">
                      +91 98765 43210 (Main Desk)<br />+91 98765 01234 (Research Lab Coordinator)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-[#c9f53b] shrink-0">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-0.5">Lab Working Hours</h4>
                    <p className="text-sm text-white/75 font-light leading-relaxed">
                      Monday – Saturday: 9:00 AM – 7:00 PM<br />(24/7 Access for Incubated Teams)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Vector Map Styling */}
            <div className="h-44 w-full rounded-2xl border border-white/5 bg-[#0e0e0e]/40 backdrop-blur-md relative overflow-hidden flex items-center justify-center">
              {/* Map background mockup using repeating patterns */}
              <div className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage: "radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)",
                  backgroundSize: "20px 20px"
                }}
              />
              {/* Map glowing roads simulation */}
              <div className="absolute top-[30%] left-0 w-full h-px bg-gradient-to-r from-transparent via-[#c9f53b]/30 to-transparent" />
              <div className="absolute top-[60%] left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
              <div className="absolute top-0 left-[45%] w-px h-full bg-gradient-to-b from-transparent via-[#c9f53b]/30 to-transparent" />
              
              {/* Glowing pin */}
              <div className="w-4 h-4 rounded-full bg-[#c9f53b] flex items-center justify-center absolute top-[45%] left-[45%] -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_#c9f53b]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0c0c0c]" />
                {/* Ping ring */}
                <div className="absolute inset-0 rounded-full border-2 border-[#c9f53b] animate-ping opacity-60 pointer-events-none" />
              </div>
              <span className="text-[10px] tracking-widest font-extrabold uppercase text-[#c9f53b] absolute top-[52%] left-[48%] select-none">
                IEDC CELL
              </span>
            </div>
          </div>

          {/* Form Side (Right 7 cols) */}
          <div className="lg:col-span-7 bg-[#0e0e0e]/80 border border-white/5 rounded-3xl p-8 backdrop-blur-xl relative">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-xs text-white/55 font-medium tracking-wide uppercase">Your Name <span className="text-[#c9f53b]">*</span></label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#c9f53b]/50 transition-colors text-white"
                    placeholder="Enter name"
                    required
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs text-white/55 font-medium tracking-wide uppercase">Your Email <span className="text-[#c9f53b]">*</span></label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#c9f53b]/50 transition-colors text-white"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Role select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="role" className="text-xs text-white/55 font-medium tracking-wide uppercase">Affiliation</label>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#c9f53b]/50 transition-colors text-white/80"
                  >
                    <option value="student" className="bg-[#0c0c0c] text-white">Student Developer</option>
                    <option value="faculty" className="bg-[#0c0c0c] text-white">Faculty Mentor</option>
                    <option value="industry" className="bg-[#0c0c0c] text-white">Industry Partner</option>
                    <option value="other" className="bg-[#0c0c0c] text-white">Other Affiliation</option>
                  </select>
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="subject" className="text-xs text-white/55 font-medium tracking-wide uppercase">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#c9f53b]/50 transition-colors text-white"
                    placeholder="Enter topic"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-xs text-white/55 font-medium tracking-wide uppercase">Message <span className="text-[#c9f53b]">*</span></label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  className="px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#c9f53b]/50 transition-colors text-white resize-none"
                  placeholder="How can we help you?"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold uppercase tracking-widest text-[#0c0c0c] bg-[#c9f53b] hover:bg-[#b8e030] transition-colors duration-200 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed select-none shadow-[0_0_20px_rgba(201,245,59,0.15)]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {loading ? (
                  <>
                    Sending Dispatch <Loader2 className="w-4 h-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Dispatch Message <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}
