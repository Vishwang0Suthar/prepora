"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Building2,
  CalendarDays,
  Check,
  FileText,
  Layers3,
  MessageSquare,
  Target,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen text-white">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0 animate-grid-glow opacity-[0.085]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Navigation */}
      <header className="sticky top-0 z-50    border-white/20 bg-black border-b backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-5">
            <Image
              src="/svg/logo.svg"
              alt="Prepora"
              width={32}
              height={32}
              className="h-8 lg:h-16 w-8 lg:w-16"
              priority
            />

            <span className="text-xl font-semibold tracking-[-0.02em] text-zinc-100">
              Prepora
            </span>
          </Link>

          <nav className="flex items-center gap-2 lg:gap-6">
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="group inline-flex h-9 items-center gap-2 rounded-md bg-white px-3.5 text-sm font-medium text-black transition-all hover:bg-zinc-200"
            >
              Get started
              <ArrowRight
                size={13}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10  flex-col gap-y-100  border-white/20">
        {/* Large background word */}
        <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 select-none whitespace-nowrap text-[18vw] font-semibold leading-none tracking-[-0.08em] text-white/[0.025]">
          PREPORA
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-12 sm:pb-42 ">
          <div className="mx-auto max-w-5xl text-center">
            {/* Eyebrow */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-200" />

              <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-300">
                AI interview preparation
              </span>

              <span className="h-1.5 w-1.5 rounded-full bg-zinc-200" />
            </div>

            {/* Hero title */}
            <div>
              <p className="mb-5 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                From job description to interview-ready
              </p>

              <h1 className="text-3xl font-semibold leading-[0.94] tracking-[-0.06em] text-zinc-100 lg:text-7xl ">
                Prepare for the interview.
                <br />
                <span className="font-serif font-normal italic tracking-[-0.045em] text-zinc-400">
                  Know what matters.
                </span>
              </h1>

              <p className="mx-auto mt-8 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                Prepora turns a job description into a personalized preparation
                system — researching the company, identifying what matters,
                generating targeted questions, and building your preparation
                schedule.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex h-11 items-center hover:invert duration-300 justify-center gap-2 rounded-md bg-white px-5 text-xs font-medium text-black transition-all hover:bg-zinc-200"
              >
                Build my interview plan
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>

              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-5 text-xs text-zinc-400 transition-colors hover:border-white/40 hover:text-zinc-200"
              >
                I already have an account
              </Link>
            </div>

            {/* Product flow */}
            <div className="mx-auto mt-14 flex max-w-3xl  items-center justify-center gap-2 flex-row sm:gap-3">
              <FlowStep label="Your job desc" icon={<FileText size={11} />} />

              <ArrowRight className="hidden text-zinc-300 sm:block" size={15} />

              <ProcessingStep />

              <ArrowRight className="hidden text-zinc-300 sm:block" size={15} />

              <FlowStep label="Your prep plan" icon={<Target size={14} />} />
            </div>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto mt-20 max-w-7xl">
            <div className="absolute -inset-10 bg-white/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-xl border border-white/20 bg-black shadow-md">
              {/* Browser top */}
              <div className="flex h-10 items-center justify-between border-white/20 px-2 lg:px-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                </div>

                <div className="rounded-md border border-white/20 px-3 py-1 text-xs text-white">
                  prepora.app
                </div>

                <div className="w-10" />
              </div>

              {/* Preview */}
              <div className="grid min-h-0 grid-cols-1 sm:min-h-[330px] sm:grid-cols-[150px_1fr]">
                {/* Sidebar */}
                <div className="   border-white/20 p-3 sm:  -0 sm:border-r sm:p-4">
                  <div className="text-xs font-semibold text-zinc-300">
                    Prepora
                  </div>

                  <div className="mt-3 flex gap-1 overflow-hidden sm:mt-8 sm:block sm:space-y-1">
                    {[
                      "Overview",
                      "Questions",
                      "Practice",
                      "Flashcards",
                      "Schedule",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className={`shrink-0 rounded-md px-2 py-1.5 text-[10px] sm:px-2.5 sm:py-2 sm:text-xs ${
                          index === 0
                            ? "bg-white/20 text-zinc-200"
                            : "text-zinc-400"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main preview */}
                <div className="p-4 sm:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 sm:text-xs">
                        Interview kit
                      </p>

                      <h3 className="mt-1.5 truncate text-base font-medium tracking-[-0.025em] text-zinc-200 sm:mt-2 sm:text-lg">
                        Software Engineer
                      </h3>

                      <p className="mt-1 truncate text-[10px] text-zinc-400 sm:text-xs">
                        Requirements · Questions · Practice
                      </p>
                    </div>

                    <span className="shrink-0 rounded border border-white/20 px-2 py-1 text-[10px] text-zinc-300 sm:text-xs">
                      READY
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="mt-5 grid grid-cols-3 gap-1.5 sm:mt-8 sm:gap-2">
                    <PreviewStat value="12" label="Requirements" />
                    <PreviewStat value="36" label="Questions" />
                    <PreviewStat value="18" label="Flashcards" />
                  </div>

                  {/* Preparation plan */}
                  <div className="mt-2.5 border border-white/20 p-3 sm:mt-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-zinc-400 sm:text-xs">
                        Preparation plan
                      </span>

                      <span className="text-[10px] text-zinc-400 sm:text-xs">
                        5 days
                      </span>
                    </div>

                    <div className="mt-3 flex gap-1.5 overflow-hidden sm:mt-4 sm:grid sm:grid-cols-5 sm:gap-2">
                      {[1, 2, 3, 4, 5].map((day) => (
                        <div
                          key={day}
                          className="min-w-[58px] flex-1 border border-white/20 p-2 sm:min-w-0 sm:p-3"
                        >
                          <span className="text-[9px] text-zinc-400 sm:text-xs">
                            DAY {day}
                          </span>

                          <div className="mt-2 h-0.5 w-full bg-white/20 sm:mt-3 sm:h-1">
                            <div
                              className="h-full bg-zinc-400"
                              style={{ width: `${35 + day * 10}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="mt-16 grid border border-white/20 bg-black sm:grid-cols-4">
            <PipelineItem
              number="01"
              title="Extract"
              description="Identify the requirements hidden inside the role."
            />

            <PipelineItem
              number="02"
              title="Research"
              description="Understand the company and interview context."
            />

            <PipelineItem
              number="03"
              title="Generate"
              description="Create questions and material mapped to the role."
            />

            <PipelineItem
              number="04"
              title="Prepare"
              description="Turn everything into a practical preparation plan."
            />
          </div>
        </div>
      </section>

      {/* Feature section */}
      <section className="relative z-10    border-white/20">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-300">
                Built around the role
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-zinc-200 sm:text-4xl">
                No generic preparation.
                <br />
                <span className="text-zinc-300">
                  Just what your interview needs.
                </span>
              </h2>
            </div>

            <p className="max-w-sm text-sm leading-6 text-zinc-300">
              Prepora connects every part of your preparation back to the
              requirements extracted from the job description.
            </p>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden border border-white/20 bg-white/20 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<Target size={16} />}
              number="01"
              title="Requirement extraction"
              description="Separate technical, behavioural, and domain requirements from the job description."
            />

            <Feature
              icon={<Building2 size={16} />}
              number="02"
              title="Company research"
              description="Build a concise company brief using relevant public information."
            />

            <Feature
              icon={<MessageSquare size={16} />}
              number="03"
              title="Targeted questions"
              description="Generate interview questions tied directly to what the role requires."
            />

            <Feature
              icon={<Layers3 size={16} />}
              number="04"
              title="Flashcards"
              description="Turn important concepts into quick material for repeated review."
            />

            <Feature
              icon={<Brain size={16} />}
              number="05"
              title="Practice"
              description="Work through questions and track your confidence as you prepare."
            />

            <Feature
              icon={<CalendarDays size={16} />}
              number="06"
              title="Preparation schedule"
              description="Distribute the preparation across the days you actually have."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="relative overflow-hidden border border-white/20 bg-black px-6 py-20 text-center sm:px-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_55%)]" />

            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-300">
                Your preparation starts here
              </p>

              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-zinc-200 sm:text-5xl">
                Know what to prepare before you walk in.
              </h2>

              <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-zinc-300">
                Give Prepora the role. We'll structure the preparation.
              </p>

              <Link
                href="/register"
                className="group mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-xs font-medium text-black transition-all hover:bg-zinc-200"
              >
                Create your interview kit
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FlowStep({
  label,
  icon,
  active = false,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-3 py-2.5 ${
        active
          ? "border-white/30 bg-white/[0.06] text-zinc-200"
          : "border-white/20 bg-black text-zinc-400"
      }`}
    >
      {icon}

      <span className="text-xs lg:text-lg">{label}</span>
    </div>
  );
}

function ProcessingStep() {
  return (
    <div className="group flex hover:-translate-y-1 hover:scale-105 duration-300 items-center gap-2 rounded-md border border-white/30 bg-white/[0.06] px-3 py-2.5 text-zinc-200">
      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
        <span className="absolute h-3.5 w-3.5 animate-ping rounded-full bg-white" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-zinc-300" />
      </span>

      <span className="text-xs lg:text-lg">Prepora analyzes it</span>
    </div>
  );
}

function PipelineItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-white/20 p-5 last:border-0 sm:border-r sm:last:border-r-0">
      <div className="text-xs font-semibold tracking-[0.12em] text-zinc-400">
        {number}
      </div>

      <h3 className="mt-8 text-sm font-medium text-zinc-300">{title}</h3>

      <p className="mt-2 text-xs leading-5 text-zinc-300">{description}</p>
    </div>
  );
}

function PreviewStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-white/20 p-3 sm:p-4">
      <p className="text-lg font-semibold tracking-[-0.03em] text-zinc-200 sm:text-xl">
        {value}
      </p>

      <p className="mt-1 truncate text-[9px] text-zinc-400 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function Feature({
  icon,
  number,
  title,
  description,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group bg-black p-6 transition-all duration-300 hover:invert sm:p-7">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/20 text-zinc-300 transition-colors group-hover:text-zinc-300">
          {icon}
        </div>

        <span className="text-xs font-medium tracking-[0.12em] text-zinc-800">
          {number}
        </span>
      </div>

      <h3 className="mt-7 text-sm font-medium text-zinc-300">{title}</h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-300">
        {description}
      </p>

      <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-zinc-400 transition-colors group-hover:text-zinc-300">
        <Check size={11} />
        Role-specific
      </div>
    </div>
  );
}
