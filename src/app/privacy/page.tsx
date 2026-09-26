export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-1000">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 mb-2 transition-colors">Privacy Policy</h1>
        </div>

      <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 transition-colors">
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">1. Zero-Trust Architecture</h2>
          <p>WiseBizOps is designed with a strict zero-trust, privacy-first architecture. We understand that infrastructure credentials and architectural data are highly sensitive.</p>
        </section>
        
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">2. Data Processing (In-Memory Only)</h2>
          <p>When you use any diagnostic or estimation tools within the WiseBizOps suite:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>No Cloud Credentials Required:</strong> WiseBizOps operates entirely disconnected. We never ask for, process, or store your AWS API Keys, IAM Roles, or Kubernetes cluster credentials.</li>
            <li><strong>Terraform Files:</strong> Uploaded state files are parsed in-memory strictly for cost estimation and are destroyed immediately after the calculation.</li>
            <li><strong>Log Diagnostics:</strong> Kubectl logs are processed statelessly. We do not retain history of your cluster logs.</li>
          </ul>
                </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">3. Automated PII Redaction & Encryption</h2>
          <p>Before any data is analyzed by our systems or sent to secure AI models, it passes through a strict scrubbing protocol:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>PII Scrubbing:</strong> All IPv4/IPv6 addresses, MAC addresses, Email addresses, and credentials (e.g., API keys, Bearer tokens) are automatically detected and replaced with [REDACTED] tags.</li>
            <li><strong>Zero Persistence:</strong> We operate entirely statelessly. No diagnostic data, logs, or Terraform configurations are ever saved to a database, cached, or written to disk.</li>
          </ul>
        </section>

                <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">4. No Tracking, Analytics, or Data Selling</h2>
          <p>We respect your right to privacy. WiseBizOps operates entirely without user accounts, tracking cookies, or invasive analytics pixels. We do not aggregate your usage data, and we will never sell, rent, or distribute any information to third-party advertisers or data brokers.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">5. Third-Party Subprocessors</h2>
          <p>We utilize secure, enterprise-grade AI engines for log analysis and architecture description. No PII is intentionally transmitted, and all inputs are processed statelessly without being used for foundational model training.</p>
        </section>
        
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">6. Contact Us</h2>
          <p>For any security or privacy concerns, please contact our security team at <a href='mailto:connect@wisebiz.online' className='text-zinc-900 dark:text-zinc-100 underline hover:no-underline transition-colors'>connect@wisebiz.online</a>.</p>
        </section>
      </div>
    </div>
  );
}
