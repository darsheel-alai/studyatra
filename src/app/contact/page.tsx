"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setStatus((prev) =>
      prev === "success" || prev === "error" ? "idle" : prev
    );
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "We couldn't send your message.");
      }

      setStatus("success");
      setFormState({ name: "", email: "", message: "" });
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't send your message."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-6 lg:px-0">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-[#5A4FFF] transition-colors"
          >
            ← Back to home
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Reach us
              </p>
              <h1 className="text-3xl font-bold mt-2">Contact Studyatra</h1>
              <p className="text-sm text-slate-400 mt-3">
                We usually respond within 2 business days. Include your order ID
                if your query is about billing.
              </p>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                  Email
                </p>
                <a
                  href="mailto:helpdesk@studyatra.in"
                  className="text-lg font-semibold text-[#5A4FFF] hover:text-indigo-300"
                >
                  helpdesk@studyatra.in
                </a>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                  Phone / WhatsApp
                </p>
                <a
                  href="tel:+919876543210"
                  className="text-lg font-semibold text-slate-100 hover:text-[#5A4FFF]"
                >
                  +91 879 2205 707
                </a>
                <p className="text-xs text-slate-500 mt-1">
                  Mon–Sun · 9 AM to 5 PM IST
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-2xl font-semibold mb-2">Send us a note</h2>
            <p className="text-sm text-slate-400 mb-6">
              This form sends an email to our support team.
            </p>

            <form
              className="space-y-4"
              onSubmit={handleSubmit}
              aria-live="polite"
            >
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-[#5A4FFF]/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-[#5A4FFF]/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formState.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-[#5A4FFF]/40 focus:outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-[#5A4FFF] py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:bg-[#4A3DF5] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Sending..." : "Send message"}
              </button>

              {status === "success" && (
                <p className="text-xs text-emerald-400">
                  Thanks! We received your message and will get back shortly.
                </p>
              )}

              {status === "error" && (
                <p className="text-xs text-rose-400">
                  {errorMessage ??
                    "Something went wrong. Please email helpdesk@studyatra.in directly."}
                </p>
              )}
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
