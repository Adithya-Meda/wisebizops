export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-1000">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 mb-2 transition-colors">Privacy Policy</h1>
      </div>

      <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 transition-colors">
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">1. Zero-Trust Architecture & Edge Caching</h2>
          <p>WiseBizOps is designed with a strict zero-trust, privacy-first architecture. We understand that infrastructure credentials and architectural data are highly sensitive.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>No Cloud Credentials Required:</strong> WiseBizOps never asks for, processes, or stores your AWS API Keys, IAM Roles, or Kubernetes cluster credentials.</li>
            <li><strong>Temporary Edge Caching:</strong> To provide ultra-low latency and optimize processing, telemetry data (such as anonymized log queries) may be temporarily cached at our Content Delivery Network (CDN) edge nodes. This cache is strictly ephemeral and automatically purged. We do not persist historical logs in primary databases.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">2. Security Logs and IP Addresses</h2>
          <p>For the strict purposes of mitigating Distributed Denial of Service (DDoS) attacks, preventing abuse, and enforcing API rate limits, we process and temporarily store User IP addresses. This data processing is conducted under the legal basis of "legitimate interest" to ensure network security and service reliability.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">3. Best-Effort PII Redaction</h2>
          <p>Before any data is analyzed by our systems or sent to secure AI models, it passes through an automated scrubbing protocol:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Heuristic Scrubbing:</strong> We employ automated heuristics that attempt to detect and redact common PII, including IPv4/IPv6 addresses, MAC addresses, Email addresses, and standard credential patterns.</li>
            <li><strong>User Responsibility:</strong> While we strive to mask sensitive data, our filters cannot guarantee the redaction of all proprietary information or novel token formats. You remain solely responsible for ensuring no sensitive credentials, trade secrets, or confidential PII are included in the logs or prompts you submit.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">4. No Tracking, Analytics, or Data Selling</h2>
          <p>We respect your right to privacy. WiseBizOps operates entirely without user accounts, tracking cookies, or invasive analytics pixels. We do not aggregate your usage data, and we will never sell, rent, or distribute any information to third-party advertisers or data brokers.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">5. Third-Party Subprocessors</h2>
          <p>To provide our services, data is processed statelessly over encrypted channels using the following enterprise-grade subprocessors:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Google (Gemini API):</strong> Utilized for advanced AI log analysis and architectural generation. Data is processed statelessly and is strictly opted-out of foundational model training.</li>
            <li><strong>Cloudflare:</strong> Operates our web application firewall (WAF) and AI Gateway proxy, responsible for securely routing LLM requests, caching duplicate prompt queries at the edge, and blocking malicious payloads.</li>
            <li><strong>Upstash (Redis):</strong> Utilized strictly for real-time memory tracking of IP addresses to enforce API rate limits and prevent automated bot abuse.</li>
            <li><strong>Supabase:</strong> Utilized strictly for querying our publicly maintained AWS pricing database. User architecture inputs are not stored here.</li>
          </ul>
        </section>
        
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">6. International Data Transfers & Compliance</h2>
          <p>By using our services, you acknowledge that your data may be processed in regions outside of your jurisdiction. We operate in compliance with standard industry practices, but we act solely as a processor of the telemetry you voluntarily provide.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">7. Contact Us</h2>
          <p>For any security, compliance, or privacy concerns, please contact our Data Protection Office at <a href='mailto:connect@wisebiz.online' className='text-zinc-900 dark:text-zinc-100 underline hover:no-underline transition-colors'>connect@wisebiz.online</a>.</p>
        </section>
      </div>
    </div>
  );
}
