"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800/80 ring-1 ring-slate-700/60">
              <span className="text-xl font-extrabold text-[#5A4FFF]">S</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight text-slate-100">
                Studyatra
              </span>
              <span className="text-xs text-slate-400">
                AI-Powered Study Companion
              </span>
            </div>
          </Link>
        </div>

        {/* Clerk SignUp Component */}
        <div className="flex justify-center">
          <SignUp
            appearance={{
              baseTheme: dark,
              variables: {
                colorBackground: "#1e293b",
                colorInputBackground: "#0f172a",
                colorInputText: "#f1f5f9",
                colorPrimary: "#5A4FFF",
                colorText: "#f1f5f9",
                colorTextSecondary: "#94a3b8",
                borderRadius: "0.75rem",
              },
              elements: {
                rootBox: "mx-auto w-full",
                card: "!bg-slate-800/80 !border !border-slate-700/70 !shadow-none !rounded-3xl",
                headerTitle: "!text-2xl !font-bold !text-slate-100",
                headerSubtitle: "!text-sm !text-slate-400",
                socialButtonsBlockButton:
                  "!border !border-slate-700 !bg-slate-900/50 !text-slate-100 hover:!bg-slate-800 transition-colors !rounded-xl",
                formButtonPrimary:
                  "!bg-[#5A4FFF] hover:!bg-[#4A3DF5] !text-white !shadow-lg !shadow-indigo-400/40 transition-all !rounded-full",
                formFieldInput:
                  "!bg-slate-900/50 !border-slate-700 !text-slate-100 !placeholder-slate-500 focus:!border-[#5A4FFF]/50 focus:!ring-[#5A4FFF]/20 !rounded-xl",
                formFieldLabel: "!text-slate-300",
                footerActionLink: "!text-[#5A4FFF] hover:!text-indigo-400",
                identityPreviewText: "!text-slate-300",
                identityPreviewEditButton: "!text-[#5A4FFF] hover:!text-indigo-400",
                formResendCodeLink: "!text-[#5A4FFF] hover:!text-indigo-400",
                otpCodeFieldInput: "!bg-slate-900/50 !border-slate-700 !text-slate-100 !rounded-xl",
                alertText: "!text-red-400",
                formFieldErrorText: "!text-red-400",
                formFieldSuccessText: "!text-emerald-400",
                dividerLine: "!bg-slate-700",
                dividerText: "!text-slate-400",
                footerAction: "!text-slate-400",
                formFieldInputShowPasswordButton: "!text-slate-400 hover:!text-slate-300",
                formFieldInputShowPasswordIcon: "!text-slate-400",
              },
            }}
            routing="path"
            path="/signup"
            signInUrl="/login"
            afterSignUpUrl="/onboarding"
          />
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-500">
          By signing up, you agree to Studyatra&apos;s{" "}
          <Link href="/terms" className="hover:text-slate-400 transition-colors">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:text-slate-400 transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
