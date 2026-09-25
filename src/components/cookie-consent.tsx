"use client";
import { useState, useEffect } from "react";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("wisebizops_cookie_consent");
    if (!consent) setShow(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("wisebizops_cookie_consent", "accepted");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-[360px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl z-50 p-4 flex flex-col gap-3 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/></svg>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cookie Consent</h4>
          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
            We use local storage strictly for functional purposes, like saving your AWS architecture and Dark Mode preference.
          </p>
        </div>
      </div>
      <button onClick={handleAccept} className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
        Accept & Continue
      </button>
    </div>
  );
}
