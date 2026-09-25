"use client";
import { useState } from "react";
import { toast } from "sonner";

export default function K8sAnalyzer() {
  const [activeTab, setActiveTab] = useState("eks");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState("");
  const [isScrubbed, setIsScrubbed] = useState(false);



    const handleScrubPII = () => {
    if (!logs || logs.trim().length === 0) {
      toast.error("Please paste some logs first.");
      return;
    }

    let scrubbed = logs;
    // IPv4
    scrubbed = scrubbed.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[REDACTED_IP]');
    // Emails
    scrubbed = scrubbed.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, '[REDACTED_EMAIL]');
    // AWS Account IDs (12 digits)
    scrubbed = scrubbed.replace(/\b\d{12}\b/g, '[REDACTED_AWS_ACCOUNT]');
    // Bearer / JWT Tokens
    scrubbed = scrubbed.replace(/Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi, 'Bearer [REDACTED_TOKEN]');
    // MAC Addresses
    scrubbed = scrubbed.replace(/\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\b/g, '[REDACTED_MAC]');
    
    // Kubernetes Specific PII Scrubbing
    // Describe Pod fields
    scrubbed = scrubbed.replace(/^Name:\s+.+$/gm, 'Name:         [REDACTED_POD_NAME]');
    scrubbed = scrubbed.replace(/^Namespace:\s+.+$/gm, 'Namespace:    [REDACTED_NAMESPACE]');
    scrubbed = scrubbed.replace(/^Node:\s+.+$/gm, 'Node:         [REDACTED_NODE]');
    // Common internal node DNS (EC2, AKS, GKE)
    scrubbed = scrubbed.replace(/\bip-\d+-\d+-\d+-\d+\.ec2\.internal\b/gi, '[REDACTED_EC2_NODE]');
    scrubbed = scrubbed.replace(/\baks-[a-zA-Z0-9-]+-[0-9]+\b/gi, '[REDACTED_AKS_NODE]');
    scrubbed = scrubbed.replace(/\bgke-[a-zA-Z0-9-]+-[a-zA-Z0-9-]+-[a-zA-Z0-9]+\b/gi, '[REDACTED_GKE_NODE]');
    // Pod hashes in text (e.g. web-app-7984f4bf88-x9pt2)
    scrubbed = scrubbed.replace(/\b[a-zA-Z0-9-]+-[a-f0-9]{8,10}-[a-z0-9]{5}\b/g, '[REDACTED_POD_NAME]');
    
    // Dynamic / Generic Identifiers
    // Container IDs (Docker, Containerd, CRI-O)
    scrubbed = scrubbed.replace(/(?:containerd|docker|cri-o):\/\/[a-z0-9]{16,128}/gi, '[REDACTED_CONTAINER_ID]');
    // Image SHAs
    scrubbed = scrubbed.replace(/sha256:[a-z0-9]{8,128}/gi, 'sha256:[REDACTED_HASH]');
    // Standard UUIDs (often used for PVCs, Request IDs)
    scrubbed = scrubbed.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[REDACTED_UUID]');
    // Base64-like Secrets (Long alphanumeric strings without spaces)
    // scrubbed = scrubbed.replace(/\b[a-zA-Z0-9+\/]{40,}={0,2}\b/g, '[REDACTED_BASE64]');

    setLogs(scrubbed);
    setIsScrubbed(true);
    toast.success("Successfully scrubbed PII. Please review the output.");
  };

  const handleDiagnosis = async () => {
    if (!logs || logs.trim().length === 0) {
      toast.error("Please paste some logs to analyze.");
      return;
    }
    
    setIsProcessing(true);
    setResult(null);
    
    const diagnosisPromise = fetch('/api/k8s/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs })
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to diagnose logs');
      return data;
    }).then((data) => {
      setResult(data.diagnosis);
      setIsProcessing(false);
      return 'Diagnosis complete. Root cause identified.';
    }).catch((err) => {
      setIsProcessing(false);
      throw err;
    });

    toast.promise(diagnosisPromise, {
      loading: 'Diagnosing logs with AI...',
      success: (msg) => msg,
      error: (err) => err.message || 'Failed to diagnose logs.'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 max-w-6xl">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-primary-600 dark:text-primary-500 mb-2 flex items-center gap-3 transition-colors">
          <div className="w-12 h-12 rounded flex items-center justify-center bg-transparent mr-2"><img src="/k8s-3d.png?v=1" style={{ filter: "hue-rotate(var(--icon-hue))" }} alt="Kubernetes" className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(var(--primary-rgb),0.4)]" /></div>
          Kubernetes Analyzer
        </h1>
        <p className="text-sm text-zinc-500 ml-11">Securely diagnose CrashLoopBackOffs, OOMKills, and errors instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white/70 to-white/30 dark:from-[#111]/70 dark:to-[#050505]/40 backdrop-blur-2xl rounded-2xl border-x border-b border-white/60 dark:border-white/10 border-t-2 border-t-primary-400 dark:border-t-primary-500 shadow-[0_-4px_20px_rgba(var(--primary-rgb),0.15),0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden relative p-8 transition-colors">
            {isProcessing && (
               <div className="absolute top-0 left-0 w-full h-1 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                 <div className="w-1/3 h-full bg-primary-600 dark:bg-white animate-[pulse_1s_ease-in-out_infinite] translate-x-[-100%]"></div>
               </div>
            )}



            <div className="relative">
              
                <div className="space-y-4 animate-in fade-in duration-500">
                  <textarea value={logs} onChange={(e) => { setLogs(e.target.value); setIsScrubbed(false); }} placeholder="Paste kubectl describe pod here..." className="w-full rounded-2xl border border-primary-400/50 dark:border-primary-500/40 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-black/[0.03] dark:bg-black/20 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.03)] px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors min-h-[160px] font-mono text-xs resize-y "></textarea>
                  <div className="flex items-center gap-4">
                      <button onClick={handleScrubPII} disabled={isScrubbed || isProcessing} className="flex-1 px-4 py-2 bg-zinc-800 dark:bg-white/10 hover:bg-zinc-700 dark:hover:bg-white/20 text-white rounded-2xl text-sm font-bold shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.5),4px_4px_10px_rgba(0,0,0,0.15)] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                        {isScrubbed ? '✅ PII Scrubbed' : '🛡️ Scrub PII Data'}
                      </button>
                      <button onClick={handleDiagnosis} disabled={!isScrubbed || isProcessing} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl text-sm font-bold shadow-[inset_3px_3px_6px_rgba(255,255,255,0.3),inset_-3px_-3px_6px_rgba(var(--primary-rgb),0.8),4px_4px_10px_rgba(0,0,0,0.15)] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                        {isProcessing ? 'Analyzing...' : 'Run AI Diagnosis'}
                      </button>
                    </div>
                    <div className="flex flex-col items-center gap-1 mt-3">
                        <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-500/80 font-medium">🔒 PII Scrubbing runs 100% locally and does NOT use AI.</p>
                        <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-500/80 font-medium">⚠️ AI can make mistakes. Please verify remediation commands before applying them.</p>
                      </div>
                </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="">{result ? (
            <div className="bg-gradient-to-br from-white/70 to-white/30 dark:from-[#111]/70 dark:to-[#050505]/40 backdrop-blur-2xl rounded-2xl border-x border-b border-white/60 dark:border-white/10 border-t-2 border-t-primary-400 dark:border-t-primary-500 shadow-[0_-4px_20px_rgba(var(--primary-rgb),0.15),0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden relative p-8 transition-colors h-full animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">AI Diagnosis Report</h3>
                <div className="flex items-center gap-3">
                  <button onClick={() => {
                      const text = `Kubernetes Diagnosis Report\n\nRoot Cause: ${result.rootCause}\nConfidence: ${result.confidence}\n\nDescription:\n${result.description}\n\nRemediation:\n${result.remediation}`;
                      navigator.clipboard.writeText(text);
                      toast.success("Copied diagnosis to clipboard!");
                  }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-500 text-white hover:scale-110 active:scale-95 transition-all shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.3),inset_-1.5px_-1.5px_3px_rgba(var(--primary-rgb),0.8),2px_2px_5px_rgba(0,0,0,0.15)] hover:shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(var(--primary-rgb),0.9),3px_3px_8px_rgba(0,0,0,0.2)]" title="Copy text">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                  <button onClick={() => {
                      const text = `Kubernetes Diagnosis Report\n\nRoot Cause: ${result.rootCause}\nConfidence: ${result.confidence}\n\nDescription:\n${result.description}\n\nRemediation:\n${result.remediation}`;
                      const blob = new Blob([text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'k8s-diagnosis-report.txt';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success("Downloaded diagnosis report");
                  }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-500 text-white hover:scale-110 active:scale-95 transition-all shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.3),inset_-1.5px_-1.5px_3px_rgba(var(--primary-rgb),0.8),2px_2px_5px_rgba(0,0,0,0.15)] hover:shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(var(--primary-rgb),0.9),3px_3px_8px_rgba(0,0,0,0.2)]" title="Download text">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </button>
                  <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-500/20">
                    Confidence: {result.confidence}
                  </span>
                </div>
              </div>
              
              <h2 className="text-xl font-medium text-primary-600 dark:text-primary-500 mb-2">{result.rootCause}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">{result.description}</p>
              
              <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 border border-zinc-200 dark:border-white/10">
                <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-3 uppercase tracking-wider">Suggested Remediation</h4>
                <div className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">
                  {result.remediation}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-md rounded-2xl border-2 border-dashed border-primary-200 dark:border-primary-500/20 p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px] transition-colors">
                 <div className="relative w-40 h-40 bg-black/[0.03] dark:bg-black/30 rounded-full flex items-center justify-center mb-6 overflow-hidden shadow-[inset_4px_4px_10px_rgba(0,0,0,0.06),inset_-4px_-4px_10px_rgba(255,255,255,0.6)] dark:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.5),inset_-4px_-4px_10px_rgba(255,255,255,0.03)]"><div className="absolute inset-0 bg-[radial-gradient(circle,rgba(var(--primary-rgb),0.1)_1px,transparent_1px)] bg-[length:8px_8px] opacity-50"></div><div className="absolute top-0 left-0 right-0 h-1 bg-primary-400 shadow-[0_0_10px_var(--color-primary-400)] animate-[scan_2s_ease-in-out_infinite_alternate]"></div><img src="/k8s-3d.png?v=1" style={{ filter: "hue-rotate(var(--icon-hue))" }} alt="Kubernetes" className="w-16 h-16 relative z-10 object-contain drop-shadow-[0_4px_8px_rgba(var(--primary-rgb),0.4)]" /><style dangerouslySetInnerHTML={{__html: `@keyframes scan { from { transform: translateY(0); } to { transform: translateY(128px); } }`}} /></div>
                 <p className="text-sm text-zinc-400">Run an analysis to see the root-cause diagnosis and remediation here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}








































