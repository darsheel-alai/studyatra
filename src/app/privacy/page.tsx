"use client";

import Link from "next/link";

const sections = [
  {
    title: "Information We Collect",
    items: [
      "Account details provided during signup (name, email).",
      "Usage data such as chats, generated notes, and progress metrics.",
      "Files you upload for onboarding verification.",
    ],
  },
  {
    title: "How We Use Your Data",
    items: [
      "Power core Studyatra features like chat, notes, tests, and timetables.",
      "Maintain your progress dashboard and leaderboards.",
      "Verify subscription payments and provide customer support.",
    ],
  },
  {
    title: "Data Protection",
    items: [
      "All traffic is encrypted via HTTPS.",
      "Payment details are handled by The Kid Company’s systems.",
      "Access to internal tools is limited to authorized team members.",
    ],
  },
  {
    title: "Your Rights",
    items: [
      "Request deletion of your Studyatra account.",
      "Export chat history and generated materials.",
      "Update profile details via the dashboard.",
    ],
  },
];

export default function PrivacyPage() {
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

        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-10">
          Effective date: {new Date().getFullYear()}
        </p>

        <p className="text-sm text-slate-300 mb-8 leading-relaxed">
          Studyatra is built for Indian students and families, and we treat your
          data with care. This page explains what we collect, why we collect it,
          and how you can control it.
        </p>

        <div className="space-y-8">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
              <ul className="space-y-2 text-sm text-slate-300">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5A4FFF]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          <h2 className="text-xl font-semibold mb-3">Questions?</h2>
          <p>
            Reach us at{" "}
            <a
              href="mailto:helpdesk@studyatra.in"
              className="text-[#5A4FFF] hover:text-indigo-300"
            >
              helpdesk@studyatra.in
            </a>{" "}
            and we’ll respond within 2 business days.
          </p>
        </section>
      </main>
    </div>
  );
}
