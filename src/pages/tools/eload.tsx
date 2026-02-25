"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Smartphone, ChevronLeft, Calculator, Info } from "lucide-react";
import MetaHead from "../../components/MetaHead";

export default function EloadCalculator() {
  const [amount, setAmount] = useState<string>("");
  const [serviceFee, setServiceFee] = useState<string>("2");
  const [discountPct, setDiscountPct] = useState<string>("0");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const numbers = useMemo(() => {
    const amt = Math.max(0, Number(amount || 0));
    const fee = Math.max(0, Number(serviceFee || 0));
    const disc = Math.min(100, Math.max(0, Number(discountPct || 0)));
    const discounted = amt * (1 - disc / 100);
    const total = discounted + fee;
    return {
      discounted: Math.round(discounted * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [amount, serviceFee, discountPct]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 pt-32">
      <MetaHead title="E-load Calculator | Pinoy Tambayan Hub" />
      
      <div className="max-w-2xl mx-auto px-6">
        <Link href="/tools" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-500 transition-colors mb-8">
          <ChevronLeft size={14} /> Back to Tools
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center shadow-xl border border-blue-500/20">
            <Smartphone size={24} />
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
            E-load <span className="text-blue-500 text-xl block">Calculator</span>
          </h1>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Load Amount (₱)</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="e.g., 50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:border-blue-500 outline-none transition-all font-bold text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Service Fee (₱)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={serviceFee}
                  onChange={(e) => setServiceFee(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:border-blue-500 outline-none transition-all font-bold text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Discount (%)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:border-blue-500 outline-none transition-all font-bold text-lg"
                />
              </div>
            </div>

            {/* RESULT */}
            <div className="mt-8 bg-blue-600/5 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Breakdown</span>
                <Calculator size={16} className="text-blue-500" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-400">Net Amount</span>
                  <span>₱{numbers.discounted.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-400">Add Service Fee</span>
                  <span>₱{parseFloat(serviceFee || "0").toFixed(2)}</span>
                </div>
                <div className="h-px bg-white/5 my-2" />
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-500">Total to Pay</span>
                  <span className="text-3xl font-black text-white italic tracking-tighter">₱{numbers.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-3 px-6">
          <Info size={16} className="text-slate-600 mt-1" />
          <p className="text-[10px] text-slate-600 font-bold uppercase leading-relaxed tracking-wide">
            Note: These are estimates for your convenience. Please double-check with your provider for exact promo pricing.
          </p>
        </div>
      </div>
    </div>
  );
}