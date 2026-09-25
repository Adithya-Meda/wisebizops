import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { ColorSwitcher } from "@/components/color-switcher";
import { BreadcrumbHeader } from "@/components/breadcrumb-header";
import { SidebarNav } from "@/components/sidebar-nav";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { BackgroundParticles } from "@/components/background-particles";
import { CyberGrid } from "@/components/cyber-grid";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = { title: "WiseBizOps" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>

      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let color = localStorage.getItem('color-theme');
                if (!color) color = 'emerald';
                document.documentElement.setAttribute('data-color', color);
              } catch (e) {}
            `,
          }}
        />
      </head>

      
        <body className={`${inter.className} flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-300 antialiased transition-colors duration-300 selection:bg-primary-500/20 dark:selection:bg-primary-500/40 relative overflow-hidden`}>
        <style dangerouslySetInnerHTML={{__html: `
  @keyframes edge-flash {
    0%, 100% { border-top-color: var(--color-primary-400); box-shadow: 0 -4px 20px rgba(var(--primary-rgb),0.4), 0 12px 40px rgba(0,0,0,0.08); }
    50% { border-top-color: rgba(var(--primary-rgb),0.1); box-shadow: 0 -2px 5px rgba(var(--primary-rgb),0.05), 0 12px 40px rgba(0,0,0,0.08); }
  }
  .animate-edge-flash {
    animation: edge-flash 2.5s infinite ease-in-out;
  }
  @keyframes float-header-icon {
    0%, 100% { transform: translateY(0) scale(1) rotate(0deg); box-shadow: 0 0 10px rgba(var(--primary-rgb),0.2); }
    33% { transform: translateY(-4px) scale(1.15) rotate(8deg); box-shadow: 0 0 20px rgba(var(--primary-rgb),0.6); }
    66% { transform: translateY(3px) scale(0.9) rotate(-8deg); box-shadow: 0 0 5px rgba(var(--primary-rgb),0.1); }
  }
  .animate-float-header {
    animation: float-header-icon 4s infinite ease-in-out;
    border-color: rgba(var(--primary-rgb),0.5);
    color: var(--color-primary-400);
  }

  @keyframes random-float {
    0% { transform: translate(0px, 0px) rotate(0deg) scale(1); box-shadow: 0 0 10px rgba(var(--primary-rgb),0.2); }
    20% { transform: translate(15px, -15px) rotate(15deg) scale(1.1); box-shadow: 0 0 20px rgba(var(--primary-rgb),0.5); }
    40% { transform: translate(-10px, 15px) rotate(-10deg) scale(0.9); box-shadow: 0 0 5px rgba(var(--primary-rgb),0.1); }
    60% { transform: translate(15px, 15px) rotate(25deg) scale(1.05); box-shadow: 0 0 15px rgba(var(--primary-rgb),0.3); }
    80% { transform: translate(-15px, -10px) rotate(-15deg) scale(0.95); box-shadow: 0 0 8px rgba(var(--primary-rgb),0.2); }
    100% { transform: translate(0px, 0px) rotate(0deg) scale(1); box-shadow: 0 0 10px rgba(var(--primary-rgb),0.2); }
  }
  .animate-random-float {
    animation: random-float 10s infinite ease-in-out;
  }
  
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(var(--primary-rgb),0.4);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--primary-rgb),0.6);
  }

  /* 3D CSS Cube */
  .css-3d-cube-wrapper { perspective: 800px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
  .css-3d-cube { width: 20px; height: 20px; position: relative; transform-style: preserve-3d; animation: spin-cube 10s infinite linear; }
  @keyframes spin-cube { from { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); } to { transform: rotateX(360deg) rotateY(360deg) rotateZ(180deg); } }
  .cube-face { position: absolute; width: 20px; height: 20px; border: 1.5px solid var(--color-primary-400); background: rgba(var(--primary-rgb),0.15); box-shadow: inset 0 0 8px rgba(var(--primary-rgb),0.5); }
  .cube-front  { transform: rotateY(  0deg) translateZ(10px); }
  .cube-back   { transform: rotateY(180deg) translateZ(10px); }
  .cube-right  { transform: rotateY( 90deg) translateZ(10px); }
  .cube-left   { transform: rotateY(-90deg) translateZ(10px); }
  .cube-top    { transform: rotateX( 90deg) translateZ(10px); }
  .cube-bottom { transform: rotateX(-90deg) translateZ(10px); }
  
  
  
  /* Isomorphic 3D Calculator */
  .css-3d-calc-wrapper { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; perspective: 800px; }
  .isomorphic-calc {
    width: 22px; height: 30px;
    background: rgba(var(--primary-rgb),0.15);
    border: 1px solid var(--color-primary-400);
    border-radius: 3px;
    transform: rotateX(55deg) rotateZ(-45deg);
    transform-style: preserve-3d;
    box-shadow: 
      -1px 1px 0 #059669,
      -2px 2px 0 #059669,
      -3px 3px 0 #059669,
      -4px 4px 10px rgba(var(--primary-rgb),0.4);
    animation: spin-calc 8s infinite linear;
    display: flex; flex-direction: column; padding: 2px; gap: 2px;
  }
  @keyframes spin-calc { 
    0% { transform: rotateX(55deg) rotateZ(0deg); box-shadow: -1px 1px 0 #059669, -2px 2px 0 #059669, -3px 3px 0 #059669, -4px 4px 10px rgba(var(--primary-rgb),0.4); } 
    50% { transform: rotateX(55deg) rotateZ(180deg); box-shadow: 1px -1px 0 #059669, 2px -2px 0 #059669, 3px -3px 0 #059669, 4px -4px 10px rgba(var(--primary-rgb),0.4); }
    100% { transform: rotateX(55deg) rotateZ(360deg); box-shadow: -1px 1px 0 #059669, -2px 2px 0 #059669, -3px 3px 0 #059669, -4px 4px 10px rgba(var(--primary-rgb),0.4); } 
  }
  .iso-screen { width: 100%; height: 8px; background: rgba(var(--primary-rgb),0.4); border-radius: 1px; border: 1px solid rgba(var(--primary-rgb),0.8); }
  .iso-keys { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; flex: 1; }
  .iso-key { background: rgba(var(--primary-rgb),0.2); border: 1px solid rgba(var(--primary-rgb),0.5); border-radius: 1px; }

  /* 3D CSS Chart */
  .css-3d-chart-wrapper { perspective: 800px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
  .css-3d-chart { width: 24px; height: 24px; position: relative; transform-style: preserve-3d; animation: spin-chart 8s infinite linear; }
  @keyframes spin-chart { from { transform: rotateX(-20deg) rotateY(0deg); } to { transform: rotateX(-20deg) rotateY(360deg); } }
  .chart-bar { position: absolute; bottom: 0; width: 6px; transform-style: preserve-3d; }
  .bar-1 { height: 8px; transform: translateX(-8px) translateZ(0); }
  .bar-2 { height: 14px; transform: translateX(0px) translateZ(0); }
  .bar-3 { height: 22px; transform: translateX(8px) translateZ(0); }
  .b-face { position: absolute; background: rgba(var(--primary-rgb),0.4); border: 1px solid var(--color-primary-400); box-shadow: inset 0 0 4px var(--color-primary-400); }
  .b-front, .b-back, .b-left, .b-right { width: 6px; bottom: 0; }
  .b-top { width: 6px; height: 6px; top: 0; transform: rotateX(90deg) translateZ(3px); transform-origin: top; }
  .bar-1 .b-front, .bar-1 .b-back, .bar-1 .b-left, .bar-1 .b-right { height: 8px; }
  .bar-2 .b-front, .bar-2 .b-back, .bar-2 .b-left, .bar-2 .b-right { height: 14px; }
  .bar-3 .b-front, .bar-3 .b-back, .bar-3 .b-left, .bar-3 .b-right { height: 22px; }
  .b-front { transform: translateZ(3px); }
  .b-back { transform: translateZ(-3px); }
  .b-left { transform: rotateY(-90deg) translateZ(3px); }
  .b-right { transform: rotateY(90deg) translateZ(3px); }

  /* 3D CSS Pyramid */
  .css-3d-pyramid-wrapper { perspective: 800px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
  .css-3d-pyramid { width: 24px; height: 24px; position: relative; transform-style: preserve-3d; animation: spin-pyramid 8s infinite linear; }
  @keyframes spin-pyramid { from { transform: rotateX(-20deg) rotateY(0deg); } to { transform: rotateX(-20deg) rotateY(360deg); } }
  .pyr-face { position: absolute; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 20px solid rgba(var(--primary-rgb),0.2); filter: drop-shadow(0 0 2px var(--color-primary-400)); }
  .pyr-front { transform: translateZ(10px) rotateX(30deg); transform-origin: bottom; }
  .pyr-back  { transform: translateZ(-10px) rotateX(-30deg); transform-origin: bottom; }
  .pyr-right { transform: translateX(10px) rotateY(90deg) rotateX(30deg); transform-origin: bottom; }
  .pyr-left  { transform: translateX(-10px) rotateY(-90deg) rotateX(30deg); transform-origin: bottom; }
  .pyr-bottom { position: absolute; width: 20px; height: 20px; background: rgba(var(--primary-rgb),0.3); transform: rotateX(90deg) translateZ(-10px); box-shadow: 0 0 10px var(--color-primary-400); }

  `}} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <CyberGrid />
          <BackgroundParticles />
          
          <aside className="w-[260px] flex flex-col z-10 bg-transparent transition-colors duration-500">
            <div className="h-16 flex items-center px-6 transition-colors duration-500">
              <Link href="/" className="flex items-center gap-2 font-medium text-sm tracking-wide text-zinc-900 dark:text-zinc-100">
                <img src="/icon.jpg" alt="WiseBizOps Logo" className="w-6 h-6 rounded-md shadow-sm" />
                <span className="text-lg tracking-tight text-primary-600 dark:text-primary-500 font-bold">WiseBizOps</span>
              </Link>
            </div>
            <SidebarNav />
            <div className="mt-auto p-6 transition-colors duration-500">
              <div className="flex flex-col gap-2">
                <Link href="/privacy" className="text-xs font-medium text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="text-xs font-medium text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 transition-colors">Terms of Service</Link>
                <div className="text-[10px] text-primary-600/70 dark:text-primary-500/70 mt-2">&copy; 2026 WiseBizOps. All rights reserved.</div>
              </div>
            </div>
          </aside>
          
          {/* Clay Divider */}
          <div className="w-[4px] my-8 rounded-full shadow-[inset_1.5px_1.5px_3px_rgba(5,150,105,0.4),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.7)] dark:shadow-[inset_1.5px_1.5px_3px_rgba(var(--primary-rgb),0.7),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.05)] bg-primary-500/10 dark:bg-primary-500/15 z-20 transition-colors flex-shrink-0"></div>
          
          <main className="flex-1 flex flex-col overflow-hidden z-10 relative">
            <header className="h-16 flex items-center justify-between px-10 bg-transparent z-20 transition-colors duration-500">
              <BreadcrumbHeader />
              <div className="flex items-center gap-3">
                  <ColorSwitcher />
                  <ThemeToggle />
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-10 relative">
              <div className="max-w-5xl mx-auto relative z-10">
                {children}
              </div>
            </div>
          </main>
        </ThemeProvider>
        <Toaster position="top-center" richColors theme="system" />
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}



 

 















