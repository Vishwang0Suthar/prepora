"use client";

import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  FileText,
  Link2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";

import { apiRequest } from "@/lib/api";
import type { CreateKitRequest, CreateKitResponse } from "@/types/api";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const createKitSchema = z.object({
  company: z.string().trim().min(1, "Company name is required."),

  company_url: z.string().trim().url("Enter a valid company URL."),

  role: z.string().trim().min(1, "Role is required."),

  location: z.string().trim(),

  jd_text: z
    .string()
    .trim()
    .min(50, "Job description must contain at least 50 characters."),

  days_available: z
    .number()
    .int()
    .min(1, "Preparation time must be at least 1 day.")
    .max(60, "Preparation time cannot exceed 60 days."),
});

export default function NewKitPage() {
  const router = useRouter();

  const [company, setCompany] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [jdText, setJdText] = useState("");
  const [daysAvailable, setDaysAvailable] = useState(5);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    const validation = createKitSchema.safeParse({
      company,
      company_url: companyUrl,
      role,
      location,
      jd_text: jdText,
      days_available: daysAvailable,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    setSubmitting(true);

    try {
      const payload: CreateKitRequest = {
        company: validation.data.company,
        company_url: validation.data.company_url,
        role: validation.data.role,
        location: validation.data.location,
        jd_text: validation.data.jd_text,
        days_available: validation.data.days_available,
      };

      const response = await apiRequest<CreateKitResponse>("/api/kits", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.kit?.id) {
        throw new Error("Kit creation failed.");
      }

      /*
       * The backend has created the kit row and returned its ID.
       *
       * Generation continues in the background.
       * Move the user to the kit page immediately.
       */
      router.replace(`/kits/${response.kit.id}`);
    } catch (error) {
      console.error("Failed to create interview kit:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to create interview kit.";

      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard"
        className="mb-8 inline-flex items-center gap-2 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </Link>

      <div className="mb-10">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-zinc-600">
          <Sparkles size={13} />
          Interview kit
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">
          Create a new kit
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">
          Give Prepora the job description and company context. We&apos;ll turn
          it into targeted interview preparation.
        </p>
      </div>

      <div className="mb-8 flex items-center gap-1 rounded-lg border border-white/20 bg-[#000000] p-1">
        <button
          type="button"
          className="flex-1 rounded-md bg-white/[0.08] px-4 py-2.5 text-xs font-medium text-white"
        >
          Single kit
        </button>

        <button
          type="button"
          disabled
          className="flex-1 cursor-not-allowed rounded-md px-4 py-2.5 text-xs font-medium text-zinc-500"
        >
          Multiple kits
          <span className="ml-2 rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] uppercase tracking-wide">
            Soon
          </span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-lg border border-white/20 bg-[#000000]">
          <div className="border-b border-white/20 px-5 py-4">
            <h2 className="text-sm font-medium text-zinc-200">
              Role information
            </h2>

            <p className="mt-1 text-xs text-zinc-600">
              Basic information about the position.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field
              label="Company"
              icon={<Building2 size={14} />}
              value={company}
              onChange={setCompany}
              placeholder="e.g. Stripe"
              required
            />

            <Field
              label="Company URL"
              icon={<Link2 size={14} />}
              value={companyUrl}
              onChange={setCompanyUrl}
              placeholder="https://stripe.com"
              type="url"
              required
            />

            <Field
              label="Role"
              icon={<FileText size={14} />}
              value={role}
              onChange={setRole}
              placeholder="e.g. Software Engineer"
              required
            />

            <Field
              label="Location"
              icon={<MapPin size={14} />}
              value={location}
              onChange={setLocation}
              placeholder="e.g. Remote / Bengaluru"
            />
          </div>
        </section>

        <section className="rounded-lg border border-white/20 bg-[#000000]">
          <div className="border-b border-white/20 px-5 py-4">
            <h2 className="text-sm font-medium text-zinc-200">
              Job description
            </h2>

            <p className="mt-1 text-xs text-zinc-600">
              Paste the complete job description for the most accurate
              preparation.
            </p>
          </div>

          <div className="p-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300">
                <FileText size={14} />
                Job description
                <span className="text-red-400">*</span>
              </span>

              <textarea
                value={jdText}
                onChange={(event) => setJdText(event.target.value)}
                required
                minLength={50}
                rows={14}
                placeholder="Paste the job description here..."
                className="w-full resize-y rounded-md border border-white/20 bg-[#08090a] px-4 py-3 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-500 transition-colors focus:border-white/[0.18]"
              />
            </label>

            <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
              <span>Minimum 50 characters</span>

              <span>{jdText.length.toLocaleString()} characters</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white/20 bg-[#000000]">
          <div className="border-b border-white/20 px-5 py-4">
            <h2 className="text-sm font-medium text-zinc-200">
              Preparation timeline
            </h2>

            <p className="mt-1 text-xs text-zinc-600">
              How many days do you have before the interview?
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/[0.03] text-zinc-300">
                <CalendarDays size={16} />
              </div>

              <div className="flex-1">
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={daysAvailable}
                  onChange={(event) =>
                    setDaysAvailable(Number(event.target.value))
                  }
                  className="w-full accent-white"
                />

                <div className="mt-2 flex justify-between text-xs text-zinc-500">
                  <span>1 day</span>
                  <span>30 days</span>
                  <span>60 days</span>
                </div>
              </div>

              <div className="w-20 shrink-0 rounded-md border border-white/20 bg-[#08090a] px-3 py-2 text-center">
                <span className="text-lg font-semibold text-zinc-200">
                  {daysAvailable}
                </span>

                <span className="ml-1 text-xs text-zinc-600">days</span>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <ErrorState
            title="Unable to create interview kit"
            description={error}
            action={
              <button
                type="button"
                onClick={() => setError(null)}
                className="rounded-md border border-white/20 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-white/[0.14] hover:text-zinc-200"
              >
                Dismiss
              </button>
            }
          />
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-white/20 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard"
            className="flex h-10 items-center justify-center rounded-md border border-white/20 px-5 text-xs font-medium text-zinc-300 hover:bg-white/[0.03] hover:text-zinc-300"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-white px-5 text-xs font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" />
                Creating kit...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate interview kit
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300">
        {icon}
        {label}
        {required && <span className="text-red-400">*</span>}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-10 w-full rounded-md border border-white/20 bg-[#08090a] px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 transition-colors focus:border-white/[0.18]"
      />
    </label>
  );
}
