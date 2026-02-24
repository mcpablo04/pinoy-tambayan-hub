// src/components/UserMenu.tsx
"use client";

import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { LogOut, User, Settings, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function UserMenu() {
  const { profile, signOutApp, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse" />;
  }

  if (!profile) {
    return (
      <Link 
        href="/login" 
        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all shadow-lg shadow-blue-600/20"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900/50 border border-white/10 p-1 pr-3 rounded-full hover:bg-slate-800 transition-all"
      >
        <img 
          src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}&background=random`} 
          alt="Profile" 
          className="w-8 h-8 rounded-full object-cover border border-white/10"
        />
        <span className="text-white text-xs font-semibold hidden sm:block">
          {profile.displayName?.split(' ')[0]}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-4 border-b border-white/5">
              <p className="text-white text-sm font-bold truncate">{profile.displayName}</p>
              <p className="text-slate-500 text-[10px] truncate">{profile.email}</p>
            </div>
            
            <div className="p-2">
              <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm">
                <User size={16} /> Profile
              </Link>
              <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm">
                <Settings size={16} /> Settings
              </Link>
              <button 
                onClick={() => signOutApp()}
                className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm mt-1"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}