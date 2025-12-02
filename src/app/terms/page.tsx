"use client";

import Link from "next/link";

const sections = [
  {
    title: "1. Acceptance of Terms",
    text: "By using Studyatra you agree to these Terms of Service and the Privacy Policy. If you are a parent or guardian, you are responsible for the student’s usage.",
  },
  {
    title: "2. Subscription & Payments",
    text: "Access to Studyatra requires a one-time ₹300 payment processed via The Kid Company. Once your invoice is verified, access is granted to the full suite of Studyatra features.",
  },
  {
    title: "3. Permitted Use",
    text: "You may use Studyatra only for personal, educational purposes. Do not attempt to copy, resell, or interfere with the platform. Automated scraping or abuse of AI features is prohibited.",
  },
  {
    title: "4. Content & AI Responses",
    text: "Studyatra relies on AI models to generate study material. Always double-check generated content before submitting as homework or exam answers.",
  },
  {
    title: "5. Termination",
    text: "We may suspend access if accounts are misused, payments are disputed, or the platform is abused. You can request account deletion by emailing support.",
  },
  {
    title: "6. Liability",
    text: "Studyatra is provided on an “as is” basis. We are not liable for exam outcomes or decisions based on AI-generated content, though we strive for accuracy.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6 lg:px-0">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-[#5A4FFF] transition-colors"
          >
            ← Back to home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-10">
          Last updated: {new Date().getFullYear()}
        </p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
              <p>{section.text}</p>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          <h2 className="text-xl font-semibold mb-3">Need help?</h2>
          <p>
            Contact us at{" "}
            <a
              href="mailto:helpdesk@studyatra.in"
              className="text-[#5A4FFF] hover:text-indigo-300"
            >
              helpdesk@studyatra.in
            </a>{" "}
            for any questions about billing or usage.
          </p>
        </section>
      </main>
    </div>
  );
}
