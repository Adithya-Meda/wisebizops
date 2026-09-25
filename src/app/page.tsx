import Link from "next/link";
export default function Home() {
  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-primary-600 dark:text-primary-500 mb-2 transition-colors">Platform Overview</h1>
        <p className="text-sm text-zinc-500">Connect your infrastructure to start receiving real-time insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kubernetes Empty State */}
        <div className="group relative bg-gradient-to-br from-white/70 to-white/30 dark:from-[#111]/70 dark:to-[#050505]/40 backdrop-blur-2xl rounded-2xl border-x border-b border-white/60 dark:border-white/10 border-t-2 border-t-primary-400 dark:border-t-primary-500 shadow-[0_-4px_20px_rgba(var(--primary-rgb),0.15),0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] p-8 flex flex-col transition-colors overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/[0.01] dark:from-white/[0.02] to-transparent rounded-xl pointer-events-none"></div>
          <div className="w-12 h-12 rounded flex items-center justify-center bg-transparent mb-6">
            <img src="/k8s-3d.png?v=1" style={{ filter: "hue-rotate(var(--icon-hue))" }} alt="Kubernetes Analyzer" className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(var(--primary-rgb),0.4)]" />
          </div>
          <h3 className="text-base font-medium text-primary-700 dark:text-primary-400 mb-2 transition-colors">Kubernetes Connection</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-500 mb-8 flex-1 leading-relaxed transition-colors">Connect your EKS cluster via OIDC or parse raw pod logs to unlock real-time health metrics and diagnostics.</p>
          <Link href="/k8s-analyzer" className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl text-sm font-bold shadow-[inset_3px_3px_6px_rgba(255,255,255,0.3),inset_-3px_-3px_6px_rgba(var(--primary-rgb),0.8),4px_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[inset_5px_5px_8px_rgba(255,255,255,0.4),inset_-5px_-5px_8px_rgba(var(--primary-rgb),0.9),6px_6px_15px_rgba(0,0,0,0.2)] active:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_2px_rgba(var(--primary-rgb),0.5),2px_2px_4px_rgba(0,0,0,0.05)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95">
            Configure Kubernetes
          </Link>
        </div>

        {/* AWS Empty State */}
        <div className="group relative bg-gradient-to-br from-white/70 to-white/30 dark:from-[#111]/70 dark:to-[#050505]/40 backdrop-blur-2xl rounded-2xl border-x border-b border-white/60 dark:border-white/10 border-t-2 border-t-primary-400 dark:border-t-primary-500 shadow-[0_-4px_20px_rgba(var(--primary-rgb),0.15),0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] p-8 flex flex-col transition-colors overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/[0.01] dark:from-white/[0.02] to-transparent rounded-xl pointer-events-none"></div>
          <div className="w-12 h-12 rounded flex items-center justify-center bg-transparent mb-6">
            <img src="/calc-3d.png?v=5" style={{ filter: "hue-rotate(var(--icon-hue))" }} alt="AWS Cost Estimator" className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(var(--primary-rgb),0.4)]" />
          </div>
          <h3 className="text-base font-medium text-primary-700 dark:text-primary-400 mb-2 transition-colors">AWS Cost Intelligence</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-500 mb-8 flex-1 leading-relaxed transition-colors">Upload Terraform state files or define your architecture to accurately forecast monthly cloud spend.</p>
          <Link href="/aws-estimator" className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl text-sm font-bold shadow-[inset_3px_3px_6px_rgba(255,255,255,0.3),inset_-3px_-3px_6px_rgba(var(--primary-rgb),0.8),4px_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[inset_5px_5px_8px_rgba(255,255,255,0.4),inset_-5px_-5px_8px_rgba(var(--primary-rgb),0.9),6px_6px_15px_rgba(0,0,0,0.2)] active:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_2px_rgba(var(--primary-rgb),0.5),2px_2px_4px_rgba(0,0,0,0.05)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95">
            Estimate Costs
          </Link>
        </div>
      </div>
    </div>
  );
}
























