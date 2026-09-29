"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { registerSchema } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/client";

const passwordRequirements = [
  {
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "One digit",
    test: (value: string) => /[0-9]/.test(value),
  },
  {
    label: "One lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    label: "One uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "One special character (!@#$%^&*()-+)",
    test: (value: string) => /[!@#$%^&*()\-+]/.test(value),
  },
];

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || registered) {
      return;
    }

    setError(null);
    setSuccess(null);

    const result = registerSchema.safeParse({
      email,
      password,
      confirmPassword,
    });

    if (!result.success) {
      setError(
        result.error.issues[0]?.message ??
          "Please check your registration details.",
      );
      setSubmitting(false);
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      /*
       * Supabase may return a session immediately when email
       * confirmation is disabled, or no session when confirmation
       * is required.
       */
      if (data.session) {
        setRegistered(true);
        setSuccess("Account created. Redirecting you to your dashboard...");

        router.push("/dashboard");
        router.refresh();

        return;
      }

      setRegistered(true);
      setSuccess("Account created. Please head to sign in.");
    } catch (error) {
      console.error("Registration failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create your account.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090a] px-5">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-white"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-black">
              <Sparkles size={14} />
            </span>
            Prepora
          </Link>

          <h1 className="mt-8 text-2xl font-semibold tracking-[-0.035em] text-white">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Start building targeted interview preparation.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-white/20 bg-[#000000] p-5"
        >
          <div className="space-y-5">
            <Field
              label="Email"
              icon={<Mail size={14} />}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              required
            />

            {/* Password */}
            <div>
              <Field
                label="Password"
                icon={<LockKeyhole size={14} />}
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Create a strong password"
                required
              />

              <div className="mt-3 space-y-1.5 rounded-md border border-white/[0.05] bg-white/[0.015] px-3 py-2.5">
                <p className="mb-2 text-[11px] font-medium text-zinc-400">
                  Password requirements
                </p>

                {passwordRequirements.map((requirement) => {
                  const passed = requirement.test(password);

                  return (
                    <div
                      key={requirement.label}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[9px] transition-colors ${
                          passed
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : "border-zinc-700 text-transparent"
                        }`}
                      >
                        ✓
                      </span>

                      <span className="text-[11px] text-zinc-400">
                        {requirement.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Field
              label="Confirm password"
              icon={<LockKeyhole size={14} />}
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat your password"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-md border border-red-500/10 bg-red-500/[0.04] px-3 py-2.5">
              <p className="text-xs leading-5 text-red-400/70">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mt-5 rounded-md border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-2.5">
              <p className="text-xs leading-5 text-emerald-400/80">{success}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || registered}
            className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-xs font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                Creating account...
              </>
            ) : registered ? (
              <>
                Account created
                <span className="text-emerald-600">✓</span>
              </>
            ) : (
              <>
                Create account
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Secondary navigation */}
        <p className="mt-5 text-center text-xs text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-white font-bold transition-colors hover:text-white"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}

function Field({
  label,
  icon,
  type,
  value,
  onChange,
  placeholder,
  required = false,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300">
        {icon}
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-10 w-full rounded-md border border-white/20 bg-[#08090a] px-3 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-400 focus:border-white/[0.18]"
      />
    </label>
  );
}
