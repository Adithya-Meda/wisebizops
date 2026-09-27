export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-1000">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 mb-2 transition-colors">Terms of Service</h1>
      </div>

      <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 transition-colors">
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">1. Acceptance of Terms</h2>
          <p>By accessing and using WiseBizOps, you accept and agree to be bound by the terms and provision of this agreement.</p>
        </section>
        
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">2. Tool Accuracy & Liability</h2>
          <p>Any financial or architectural estimations provided by the WiseBizOps suite are for informational and planning purposes only.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Estimations are calculated based on public cloud pricing models and heuristics.</li>
            <li>We are <strong>not liable</strong> for any discrepancies between our estimates and your actual cloud provider billing.</li>
            <li>Taxes, enterprise discounts, and dynamic usage spikes are not factored into the base estimates.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">3. Infrastructure Security & Connectivity</h2>
          <p>WiseBizOps does not connect directly to your live AWS or Kubernetes environments. However, the data you submit (e.g., logs, Terraform code) is transmitted securely over the internet to our third-party processing APIs. You are solely responsible for ensuring you have the legal right and corporate authorization to upload the textual logs and configurations you process through our tools.</p>
        </section>
        
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">4. AI Generation and Hallucinations</h2>
          <p>WiseBizOps utilizes advanced Artificial Intelligence (LLMs) to diagnose logs and generate architecture components.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>No Guarantee of Accuracy:</strong> AI-generated responses, including bash commands, Kubernetes YAML, or architectural advice, may contain errors, inaccuracies, or "hallucinations."</li>
            <li><strong>Assumption of Risk:</strong> You assume 100% of the risk associated with executing any AI-recommended remediation commands in your environments. You must independently verify all commands before applying them to production systems.</li>
            <li><strong>No Liability for Destructive Actions:</strong> Under no circumstances shall WiseBizOps be held liable for downtime, data loss, or system corruption resulting from the execution of AI-generated advice.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">5. Warranty Disclaimer (AS-IS)</h2>
          <p>The software and services are provided "as is" and "as available", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">6. Indemnification</h2>
          <p>You agree to indemnify, defend, and hold harmless WiseBizOps, its affiliates, and its operators from any claims, losses, damages, liabilities, including legal fees, arising out of your use or misuse of the platform, your violation of these Terms, or any breach of the representations, warranties, and covenants made by you herein.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">7. Governing Law</h2>
          <p>These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the creators of WiseBizOps reside, without regard to its conflict of law provisions.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">8. Trademark Attribution</h2>
          <p>
            Amazon Web Services and AWS are trademarks of Amazon.com, Inc. or its affiliates. Kubernetes is a registered trademark of The Linux Foundation. 
            WiseBizOps is an independent utility and is <strong>not affiliated with, endorsed by, or sponsored by</strong> Amazon Web Services or The Linux Foundation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">9. Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us at <a href='mailto:connect@wisebiz.online' className='text-zinc-900 dark:text-zinc-100 underline hover:no-underline transition-colors'>connect@wisebiz.online</a>.</p>
        </section>
      </div>
    </div>
  );
}


