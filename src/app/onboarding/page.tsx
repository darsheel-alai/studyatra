"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

type OnboardingStatus = {
  onboarding_completed: boolean;
  invoice_verified: boolean;
  access_key_verified: boolean;
  order_id: string | null;
};

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accessKey, setAccessKey] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Check onboarding status on mount
  useEffect(() => {
    if (isLoaded && user) {
      checkOnboardingStatus();
    }
  }, [isLoaded, user]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/onboarding/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        
        if (data.onboarding_completed) {
          router.push("/dashboard");
          return;
        }
        
        if (data.invoice_verified && !data.access_key_verified) {
          setStep(2);
        } else if (data.invoice_verified && data.access_key_verified) {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a PNG or JPG file. For PDF invoices, please take a screenshot.");
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleInvoiceUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/onboarding/verify-invoice", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify invoice");
        return;
      }

      setSuccess("Invoice verified successfully! Order ID: " + data.orderId);
      setTimeout(() => {
        setStep(2);
        setSelectedFile(null);
        setFilePreview(null);
        checkOnboardingStatus();
      }, 1500);
    } catch (error: any) {
      setError(error.message || "Failed to upload invoice");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAccessKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessKey.trim()) {
      setError("Please enter your access key");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/onboarding/verify-access-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessKey: accessKey.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify access key");
        return;
      }

      setSuccess(data.message || "Access key verified successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: any) {
      setError(error.message || "Failed to verify access key");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

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

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? "text-[#5A4FFF]" : "text-slate-600"}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? "bg-[#5A4FFF]" : "bg-slate-700"} text-sm font-semibold text-white`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Invoice</span>
            </div>
            <div className={`h-1 flex-1 mx-4 ${step >= 2 ? "bg-[#5A4FFF]" : "bg-slate-700"}`} />
            <div className={`flex items-center ${step >= 2 ? "text-[#5A4FFF]" : "text-slate-600"}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? "bg-[#5A4FFF]" : "bg-slate-700"} text-sm font-semibold text-white`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Access Key</span>
            </div>
          </div>
        </div>

        {/* Step 1: Invoice Upload */}
        {step === 1 && (
          <div className="rounded-3xl border border-slate-700/70 bg-slate-800/80 p-8 shadow-lg">
            <h2 className="mb-2 text-2xl font-bold text-slate-100">
              Verify Your Payment
            </h2>
            <p className="mb-6 text-sm text-slate-400">
              Upload the invoice from The Kid Company to verify your payment. We&apos;ll extract the order ID automatically.
            </p>

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Upload Invoice (PNG or JPG)
                </label>
                <p className="mb-2 text-xs text-slate-500">
                  If you have a PDF invoice, please take a screenshot and upload the image instead.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-200 hover:border-[#5A4FFF]/50 hover:bg-slate-800 transition-colors"
                >
                  {selectedFile ? selectedFile.name : "Choose File"}
                </button>
              </div>

              {filePreview && (
                <div className="rounded-xl border border-slate-700 overflow-hidden">
                  <img
                    src={filePreview}
                    alt="Invoice preview"
                    className="w-full h-auto"
                  />
                </div>
              )}

              <button
                onClick={handleInvoiceUpload}
                disabled={!selectedFile || isUploading}
                className="w-full rounded-full bg-[#5A4FFF] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:bg-[#4A3DF5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? "Verifying..." : "Verify Invoice"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Access Key */}
        {step === 2 && (
          <div className="rounded-3xl border border-slate-700/70 bg-slate-800/80 p-8 shadow-lg">
            <h2 className="mb-2 text-2xl font-bold text-slate-100">
              Enter Access Key
            </h2>
            <p className="mb-6 text-sm text-slate-400">
              Paste the access key from the .txt file you received after payment from The Kid Company.
            </p>

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
                {success}
              </div>
            )}

            <form onSubmit={handleAccessKeySubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Access Key
                </label>
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Paste your access key here"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-[#5A4FFF]/50 focus:ring-[#5A4FFF]/20 focus:outline-none focus:ring-2"
                  disabled={isVerifying}
                />
              </div>

              <button
                type="submit"
                disabled={!accessKey.trim() || isVerifying}
                className="w-full rounded-full bg-[#5A4FFF] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:bg-[#4A3DF5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isVerifying ? "Verifying..." : "Complete Onboarding"}
              </button>
            </form>

            <button
              onClick={() => setStep(1)}
              className="mt-4 w-full text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              ← Back to invoice upload
            </button>
          </div>
        )}

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Need help? Contact{" "}
          <a href="mailto:helpdesk@studyatra.in" className="text-[#5A4FFF] hover:text-indigo-400 transition-colors">
            helpdesk@studyatra.in
          </a>
        </p>
      </div>
    </div>
  );
}
