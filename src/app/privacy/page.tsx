import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg0)] text-[var(--color-text-primary)] py-24 px-5">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-8 inline-block">&larr; Back to home</Link>
        <h1 className="text-4xl font-extrabold mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
          <p><strong className="text-[var(--color-text-primary)]">Last updated:</strong> February 2026</p>

          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8">1. Information We Collect</h2>
          <p>When you create an account, we collect your email address, name, and profile picture (if signing in with Google). When you use our services, we process the questions and text you submit to provide AI-generated responses.</p>

          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8">2. How We Use Your Information</h2>
          <p>We use your information to provide, maintain, and improve our services. Your submitted questions are processed by AI models to generate responses and are not shared with third parties for marketing purposes.</p>

          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8">3. Data Storage</h2>
          <p>Your account data is stored securely using Supabase (hosted on AWS). Payment information is processed and stored by Stripe — we never have access to your full card details.</p>

          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8">4. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Google Gemini API — for AI-powered responses</li>
            <li>Supabase — for authentication and data storage</li>
            <li>Stripe — for payment processing</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8">5. Your Rights</h2>
          <p>You can request deletion of your account and associated data at any time by contacting us at support@axiom.study.</p>

          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-8">6. Contact</h2>
          <p>For questions about this privacy policy, contact us at <a href="mailto:support@axiom.study" className="text-emerald-400 hover:underline">support@axiom.study</a>.</p>
        </div>
      </div>
    </div>
  );
}
