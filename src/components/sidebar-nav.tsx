"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/" },
    { name: "Kubernetes Analyzer", href: "/k8s-analyzer" },
    { name: "AWS Cost Estimator", href: "/aws-estimator" }
  ];

  return (
    <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
      <div className="px-3 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Menu</div>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.name}
            href={item.href} 
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive 
                ? "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-semibold" 
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

