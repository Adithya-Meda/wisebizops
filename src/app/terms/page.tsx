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
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">2. Estimation Accuracy & Liability</h2>
          <p>The AWS Cost Estimator is provided for informational and planning purposes only.</p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>Estimations are calculated based on public cloud pricing models and heuristics.</li>
            <li>We are <strong>not liable</strong> for any discrepancies between our estimates and your actual cloud provider billing.</li>
            <li>Taxes, enterprise discounts, and dynamic usage spikes are not factored into the base estimates.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">3. Infrastructure Security</h2>
          <p>WiseBizOps is a disconnected, offline parser. It does not connect to your live AWS or Kubernetes environments. You are solely responsible for ensuring you have the right to copy and upload the textual logs and Terraform code you process through our tools.</p>
        </section>
        
                <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">4. Warranty Disclaimer (AS-IS)</h2>
          <p className="uppercase text-xs font-semibold">The software and services are provided "as is" and "as available", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">5. Indemnification</h2>
          <p>You agree to indemnify, defend, and hold harmless WiseBizOps, its affiliates, and its operators from any claims, losses, damages, liabilities, including legal fees, arising out of your use or misuse of the platform, your violation of these Terms, or any breach of the representations, warranties, and covenants made by you herein.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">6. Governing Law</h2>
          <p>These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the creators of WiseBizOps reside, without regard to its conflict of law provisions.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">7. Trademark Attribution</h2>
          <p>
            Amazon Web Services and AWS are trademarks of Amazon.com, Inc. or its affiliates. Kubernetes is a registered trademark of The Linux Foundation. 
            WiseBizOps is an independent utility and is <strong>not affiliated with, endorsed by, or sponsored by</strong> Amazon Web Services or The Linux Foundation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">8. Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us at <a href='mailto:connect@wisebiz.online' className='text-zinc-900 dark:text-zinc-100 underline hover:no-underline transition-colors'>connect@wisebiz.online</a>.</p>
        </section>
      </div>
    </div>
  );
}
