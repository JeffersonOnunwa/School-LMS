import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type ServiceType = "website" | "portal" | "unsure";
type EngagementType = "one-time" | "subscription" | "unsure";
type CurrentSystem = "paper" | "excel" | "portal" | "";
type YesNo = "yes" | "no" | "";

interface IntakeFormData {
  schoolName: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  studentCount: string;
  studentCountFuture: string;
  staffCount: string;
  campusCount: string;
  serviceType: ServiceType | "";
  engagementType: EngagementType | "";
  currentSystem: CurrentSystem;
  hasPaystackAccount: YesNo;
  excludedModules: string[];
  addOns: string[];
  budgetRange: string;
  timeline: string;
  notes: string;
}

// Included in both plans by default — client can opt OUT, not in.
const DEFAULT_MODULES = [
  { id: "results", label: "Online result upload & report cards" },
  { id: "payments", label: "Online payments & receipts (Paystack)" },
  { id: "parent-portal", label: "Parent-facing portal access" },
];

// Not included by default — priced separately, client opts IN.
const ADD_ON_OPTIONS = [
  { id: "api", label: "API integration with existing systems" },
  { id: "emails", label: "School & student email accounts" },
  { id: "sms", label: "SMS notifications (text credits billed separately)" },
];

const STEPS = [
  "School details",
  "What you need",
  "Features",
  "Budget & timeline",
];

const emptyForm: IntakeFormData = {
  schoolName: "",
  contactName: "",
  contactRole: "",
  email: "",
  phone: "",
  studentCount: "",
  studentCountFuture: "",
  staffCount: "",
  campusCount: "",
  serviceType: "",
  engagementType: "",
  currentSystem: "",
  hasPaystackAccount: "",
  excludedModules: [],
  addOns: [],
  budgetRange: "",
  timeline: "",
  notes: "",
};

// ── Small UI primitives ──────────────────────────────────────────────────

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && (
          <span className="text-amber-600 dark:text-amber-400"> *</span>
        )}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-300 dark:focus:ring-slate-300";

function RadioCard({
  name,
  value,
  current,
  onChange,
  title,
  description,
}: {
  name: string;
  value: string;
  current: string;
  onChange: (v: string) => void;
  title: string;
  description: string;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
          : "border-slate-300 bg-white text-slate-900 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
      }`}
      aria-pressed={selected}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        readOnly
        className="sr-only"
      />
      <div className="font-medium">{title}</div>
      <div
        className={`mt-0.5 text-sm ${selected ? "opacity-90" : "opacity-70"}`}
      >
        {description}
      </div>
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────

export default function ClientIntakeForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<IntakeFormData>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const update = <K extends keyof IntakeFormData>(
    key: K,
    value: IntakeFormData[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const toggleExcludedModule = (id: string) =>
    setForm((f) => ({
      ...f,
      excludedModules: f.excludedModules.includes(id)
        ? f.excludedModules.filter((x) => x !== id)
        : [...f.excludedModules, id],
    }));

  const toggleAddOn = (id: string) =>
    setForm((f) => ({
      ...f,
      addOns: f.addOns.includes(id)
        ? f.addOns.filter((x) => x !== id)
        : [...f.addOns, id],
    }));

  const canAdvance = () => {
    if (step === 0)
      return form.schoolName && form.contactName && form.email && form.phone;
    if (step === 1) return form.serviceType && form.engagementType;
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
          subject: `New intake: ${form.schoolName}`,
          from_name: form.contactName,
          "School name": form.schoolName,
          "Contact name": form.contactName,
          "Contact role": form.contactRole,
          Email: form.email,
          Phone: form.phone,
          "Student count": form.studentCount,
          "Expected students in 2 years": form.studentCountFuture,
          "Staff count": form.staffCount,
          "Number of campuses": form.campusCount,
          "Service type": form.serviceType,
          "Engagement type": form.engagementType,
          "Current record system": form.currentSystem,
          "Existing Paystack account": form.hasPaystackAccount,
          "Default modules to exclude":
            form.excludedModules.join(", ") || "None — keep all",
          "Optional add-ons wanted": form.addOns.join(", ") || "None selected",
          "Budget range": form.budgetRange,
          Timeline: form.timeline,
          Notes: form.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setSubmitError(
          "Something went wrong sending your details. Please try again.",
        );
      }
    } catch {
      setSubmitError(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
          Thanks, {form.contactName.split(" ")[0]}.
        </h2>

        <p className="mt-3 text-slate-600 dark:text-slate-400">
          We've received {form.schoolName}'s details. Expect a tailored offer
          with feature pricing within 2 business days.
        </p>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <h3 className="font-medium text-slate-900 dark:text-slate-100">
            While you wait, check out our offer
          </h3>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Learn more about our features, pricing, and what we can offer your
            school.
          </p>

          <a
            href="/offer.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            View Our Offer
          </a>
          <a
            href="/offer.pdf"
            download="Our-Offer.pdf"
            className="mt-5 ml-5 inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Download Our Offer
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
          Client Intake
        </p>
        <h1 className="mt-1 font-serif text-3xl text-slate-900 dark:text-slate-100">
          Tell us about your school
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          A few questions so we can put together the right offer for you.
        </p>
      </header>

      {/* Step progress */}
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                i <= step
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
              }`}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 ${i < step ? "bg-slate-900 dark:bg-slate-100" : "bg-slate-200 dark:bg-slate-800"}`}
              />
            )}
          </li>
        ))}
      </ol>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-500">
        {STEPS[step]}
      </p>

      {/* Step 0: School details */}
      {step === 0 && (
        <div className="space-y-4">
          <Field label="School name" required>
            <input
              className={inputClass}
              value={form.schoolName}
              onChange={(e) => update("schoolName", e.target.value)}
              placeholder="e.g. Greenwood International School"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Your name" required>
              <input
                className={inputClass}
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
                placeholder="Full name"
              />
            </Field>
            <Field label="Your role">
              <input
                className={inputClass}
                value={form.contactRole}
                onChange={(e) => update("contactRole", e.target.value)}
                placeholder="e.g. Proprietor, Admin"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" required>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@school.edu.ng"
              />
            </Field>
            <Field label="Phone" required>
              <input
                type="tel"
                className={inputClass}
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="080..."
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Number of students">
              <input
                className={inputClass}
                value={form.studentCount}
                onChange={(e) => update("studentCount", e.target.value)}
                placeholder="e.g. 450"
              />
            </Field>
            <Field label="Expected students in 2 years">
              <input
                className={inputClass}
                value={form.studentCountFuture}
                onChange={(e) => update("studentCountFuture", e.target.value)}
                placeholder="e.g. 700"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Number of staff">
              <input
                className={inputClass}
                value={form.staffCount}
                onChange={(e) => update("staffCount", e.target.value)}
                placeholder="e.g. 30"
              />
            </Field>
            <Field label="Number of campuses">
              <input
                className={inputClass}
                value={form.campusCount}
                onChange={(e) => update("campusCount", e.target.value)}
                placeholder="e.g. 1"
              />
            </Field>
          </div>
        </div>
      )}

      {/* Step 1: What you need */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              What are you looking for? *
            </p>
            <div className="space-y-2">
              <RadioCard
                name="serviceType"
                value="website"
                current={form.serviceType}
                onChange={(v) => update("serviceType", v as ServiceType)}
                title="A basic website"
                description="Public-facing site with school info, admissions, and contact details."
              />
              <RadioCard
                name="serviceType"
                value="portal"
                current={form.serviceType}
                onChange={(v) => update("serviceType", v as ServiceType)}
                title="A full portal"
                description="Student/staff/parent logins, results, payments, and SMS."
              />
              <RadioCard
                name="serviceType"
                value="unsure"
                current={form.serviceType}
                onChange={(v) => update("serviceType", v as ServiceType)}
                title="Not sure yet"
                description="We can help you decide based on your needs and budget."
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              How would you prefer to pay? *
            </p>
            <div className="space-y-2">
              <RadioCard
                name="engagementType"
                value="one-time"
                current={form.engagementType}
                onChange={(v) => update("engagementType", v as EngagementType)}
                title="One-time payment"
                description="Pay once for the build, own the system outright."
              />
              <RadioCard
                name="engagementType"
                value="subscription"
                current={form.engagementType}
                onChange={(v) => update("engagementType", v as EngagementType)}
                title="Monthly subscription"
                description="Lower upfront cost, hosted and maintained by us."
              />
              <RadioCard
                name="engagementType"
                value="unsure"
                current={form.engagementType}
                onChange={(v) => update("engagementType", v as EngagementType)}
                title="Not sure yet"
                description="Show me pricing for both and I'll decide."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="How do you currently keep records?">
              <select
                className={inputClass}
                value={form.currentSystem}
                onChange={(e) =>
                  update("currentSystem", e.target.value as CurrentSystem)
                }
              >
                <option value="">Select one</option>
                <option value="paper">Paper</option>
                <option value="excel">Excel / spreadsheets</option>
                <option value="portal">Existing portal or software</option>
              </select>
            </Field>
            <Field label="Do you already have a Paystack account?">
              <select
                className={inputClass}
                value={form.hasPaystackAccount}
                onChange={(e) =>
                  update("hasPaystackAccount", e.target.value as YesNo)
                }
              >
                <option value="">Select one</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
          </div>
        </div>
      )}

      {/* Step 2: Features */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              Included by default
            </p>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-500">
              These come standard in both plans. Untick anything you don't need.
            </p>
            <div className="space-y-2">
              {DEFAULT_MODULES.map((opt) => {
                const excluded = form.excludedModules.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-300 px-4 py-3 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"
                  >
                    <input
                      type="checkbox"
                      checked={!excluded}
                      onChange={() => toggleExcludedModule(opt.id)}
                      className="h-4 w-4 rounded border-slate-400 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:text-slate-100"
                    />
                    <span
                      className={
                        excluded
                          ? "text-slate-400 line-through dark:text-slate-600"
                          : "text-slate-800 dark:text-slate-200"
                      }
                    >
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              Optional add-ons
            </p>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-500">
              Priced separately from the base package. Select anything you're
              interested in.
            </p>
            <div className="space-y-2">
              {ADD_ON_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-300 px-4 py-3 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"
                >
                  <input
                    type="checkbox"
                    checked={form.addOns.includes(opt.id)}
                    onChange={() => toggleAddOn(opt.id)}
                    className="h-4 w-4 rounded border-slate-400 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:text-slate-100"
                  />
                  <span className="text-slate-800 dark:text-slate-200">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Budget & timeline */}
      {step === 3 && (
        <div className="space-y-4">
          <Field label="Rough budget range (optional)">
            <input
              className={inputClass}
              value={form.budgetRange}
              onChange={(e) => update("budgetRange", e.target.value)}
              placeholder="e.g. ₦300,000 – ₦800,000"
            />
          </Field>
          <Field label="When do you need this live?">
            <input
              className={inputClass}
              value={form.timeline}
              onChange={(e) => update("timeline", e.target.value)}
              placeholder="e.g. Before next term starts"
            />
          </Field>
          <Field label="Anything else we should know?">
            <textarea
              className={`${inputClass} min-h-25`}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Current systems in use, specific pain points, etc."
            />
          </Field>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={`text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${step === 0 ? "invisible" : ""}`}
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canAdvance()}
            onClick={() => setStep((s) => s + 1)}
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-md bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {isSubmitting ? "Sending…" : "Submit"}
          </button>
        )}
      </div>
      {submitError && (
        <p className="mt-3 text-right text-sm text-red-600 dark:text-red-400">
          {submitError}
        </p>
      )}
    </div>
  );
}
