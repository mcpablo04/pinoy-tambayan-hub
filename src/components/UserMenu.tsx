"use client";

import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { LogOut, User, Settings, ChevronDown, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { confirmToast } from "./ToastConfirm"; // Path to your toast utility

export default function UserMenu() {
  const { profile, signOutApp, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Handle Logout with our custom async confirm
  const handleLogout = async () => {
    setIsOpen(false);
    const confirmed = await confirmToast({
      title: "Logout?",
      description: "You'll need to sign back in to participate in the community.",
      confirmText: "Sign Out",
      variant: "destructive"
    });
    
    if (confirmed) {
      signOutApp();
    }
  };

  if (loading) {
    return <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse border border-white/5" />;
  }

  if (!profile) {
    return (
      <Link 
        href="/login" 
        className="btn btn-primary !py-2 !px-5 shadow-blue-500/10"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-1 pr-4 rounded-full transition-all border duration-300 ${
          isOpen 
          ? "bg-white/10 border-white/20 shadow-lg" 
          : "bg-white/5 border-white/5 hover:border-white/10"
        }`}
      >
        <div className="relative">
          <img 
            src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`} 
            alt="" 
            className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#020617] rounded-full" />
        </div>
        
        <span className="text-white text-xs font-black uppercase tracking-tight hidden sm:block">
          {profile.displayName?.split(' ')[0]}
        </span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Transparent Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-56 bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-2xl z-20 overflow-hidden ring-1 ring-black/50"
            >
              {/* User Header */}
              <div className="p-4 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-sm font-black truncate">{profile.displayName}</p>
                  <ShieldCheck size={14} className="text-blue-400" />
                </div>
                <p className="text-slate-500 text-[10px] font-medium truncate tracking-wide">{profile.email}</p>
              </div>
              
              {/* Menu Actions */}
              <div className="p-2">
                <Link 
                  href="/profile" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all text-xs font-bold"
                >
                  <User size={16} className="text-slate-500" /> My Profile
                </Link>
                <Link 
                  href="/settings" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all text-xs font-bold"
                >
                  <Settings size={16} className="text-slate-500" /> Settings
                </Link>
                
                <div className="my-2 border-t border-white/5" />

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-xs font-black uppercase tracking-widest"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}