"use client";
import { usePathname } from "next/navigation";

export function BreadcrumbHeader() {
  const pathname = usePathname();
  
  let pageTitle = "Dashboard";
  if (pathname === "/k8s-analyzer") {
    pageTitle = "Kubernetes Analyzer";
  } else if (pathname === "/aws-estimator") {
    pageTitle = "AWS Cost Estimator";
  }

  return (
    <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
      Workspace / <span className="text-primary-600 dark:text-primary-500 font-bold">{pageTitle}</span>
    </h2>
  );
}
