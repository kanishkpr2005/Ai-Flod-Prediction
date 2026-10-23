"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Building2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

const DEFAULT_AUTHORITY_EMAIL = "kanishkpratapsingh1705@gmail.com";

type UserRole = "USER" | "AUTHORITY";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialRole = searchParams.get("role") === "authority" ? "AUTHORITY" : "USER";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [area, setArea] = useState("");
  const [role, setRole] = useState<UserRole>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all mandatory fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (role === "AUTHORITY") {
      if (normalizedEmail !== DEFAULT_AUTHORITY_EMAIL.toLowerCase()) {
        setError(
          `Authority registration is restricted to the approved authority email: ${DEFAULT_AUTHORITY_EMAIL}`
        );
        return;
      }
    }

    if (role === "USER") {
      if (normalizedEmail === DEFAULT_AUTHORITY_EMAIL.toLowerCase()) {
        setError(
          "This email is reserved for Authority Command Center access. Please select Authority role or use a personal email."
        );
        return;
      }
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          password,
          role: role.toLowerCase(),
          area: area.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Registration failed. Please verify connection and details.");
        return;
      }

      setSuccess(
        `${role === "AUTHORITY" ? "Authority" : "Citizen"} account created successfully. Redirecting to sign in...`
      );

      setTimeout(() => {
        router.push(`/login?role=${role.toLowerCase()}`);
      }, 1200);
    } catch (err) {
      console.error("Signup error:", err);
      setError("Cannot connect to backend server. Verify server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="relative mx-auto w-full max-w-lg">
        {/* HEADER */}
        <div className="mb-8 text-center">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border shadow-xl ${
              role === "AUTHORITY"
                ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                : "bg-red-600/20 border-red-500/40 text-red-400"
            }`}
          >
            {role === "AUTHORITY" ? <Building2 className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Create Platform Account</h1>
          <p className="mt-1 text-xs text-slate-400">
            Sign up for district flood intelligence warnings or emergency authority dispatch
          </p>
        </div>

        {/* SIGNUP CARD */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur">
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ROLE TOGGLE */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Register Account Type
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("USER")}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    role === "USER"
                      ? "border-red-500 bg-red-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <User className={`h-5 w-5 ${role === "USER" ? "text-red-400" : "text-slate-400"}`} />
                  <p className={`mt-2 text-xs font-bold ${role === "USER" ? "text-red-400" : "text-white"}`}>
                    Citizen User
                  </p>
                  <p className="text-[10px] text-slate-500">Public early warning & SOS</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("AUTHORITY")}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    role === "AUTHORITY"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <Building2 className={`h-5 w-5 ${role === "AUTHORITY" ? "text-blue-400" : "text-slate-400"}`} />
                  <p className={`mt-2 text-xs font-bold ${role === "AUTHORITY" ? "text-blue-400" : "text-white"}`}>
                    Authority
                  </p>
                  <p className="text-[10px] text-slate-500">NDMA / DDMA command center</p>
                </button>
              </div>
            </div>

            {/* FULL NAME */}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-300">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Officer Rajesh Verma"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-300">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === "AUTHORITY" ? DEFAULT_AUTHORITY_EMAIL : "name@example.com"}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* DISTRICT / AREA */}
            <div>
              <label htmlFor="area" className="mb-1.5 block text-xs font-medium text-slate-300">
                Designated District or Operational Area
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="area"
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Agra, Patna, All Districts"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Used to filter priority flood warnings and regional notifications.
              </p>
            </div>

            {/* PASSWORD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${
                role === "AUTHORITY"
                  ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30"
                  : "bg-red-600 hover:bg-red-500 shadow-red-900/30"
              }`}
            >
              <span>
                {loading
                  ? "Creating Account..."
                  : role === "AUTHORITY"
                  ? "Register Authority Account"
                  : "Register Citizen Account"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* AUTHORITY POLICY NOTICE */}
          <div
            className={`mt-5 rounded-xl border p-3.5 text-xs ${
              role === "AUTHORITY"
                ? "border-blue-500/20 bg-blue-500/5 text-blue-300"
                : "border-slate-800 bg-slate-950/60 text-slate-400"
            }`}
          >
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
              <div>
                {role === "AUTHORITY" ? (
                  <p>
                    <strong>Authority Policy:</strong> Command Center registration requires authorization. The default
                    approved root account is <span className="font-mono text-white">{DEFAULT_AUTHORITY_EMAIL}</span>.
                  </p>
                ) : (
                  <p>
                    <strong>Public Access:</strong> Citizen accounts can receive district warnings, view 590-district risk
                    levels, and trigger emergency SOS assistance.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SIGN IN LINK */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 ml-1">
              Sign In Here →
            </Link>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center text-xs text-slate-500 space-y-2">
          <p>© 2026 AI Flood Prediction Platform</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/" className="hover:text-slate-400">Home</Link>
            <Link href="/privacy" className="hover:text-slate-400">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-400">Terms</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-950" />}>
      <SignupForm />
    </Suspense>
  );
}
