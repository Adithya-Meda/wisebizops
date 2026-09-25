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
          <p>You are solely responsible for ensuring you have the legal right and authorization to access the AWS and Kubernetes environments you connect to this platform. Using this platform to attempt unauthorized access to infrastructure is strictly prohibited.</p>
        </section>
        
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">4. Trademark Attribution</h2>
          <p>
            Amazon Web Services and AWS are trademarks of Amazon.com, Inc. or its affiliates. Kubernetes is a registered trademark of The Linux Foundation. 
            WiseBizOps is an independent utility and is <strong>not affiliated with, endorsed by, or sponsored by</strong> Amazon Web Services or The Linux Foundation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 transition-colors">5. Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us at <a href='mailto:connect@wisebiz.online' className='text-zinc-900 dark:text-zinc-100 underline hover:no-underline transition-colors'>connect@wisebiz.online</a>.</p>
        </section>
      </div>
    </div>
  );
}
