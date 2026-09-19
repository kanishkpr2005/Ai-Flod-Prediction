"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

const DEFAULT_AUTHORITY_EMAIL =
  "kanishkpratapsingh1705@gmail.com";

type UserRole = "USER" | "AUTHORITY";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialRole =
    searchParams.get("role") === "authority"
      ? "AUTHORITY"
      : "USER";

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
      setError("Please fill in all fields.");
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
          "Authority registration is restricted to the approved authority email: kanishkpratapsingh1705@gmail.com"
        );
        return;
      }
    }

    if (role === "USER") {
      if (normalizedEmail === DEFAULT_AUTHORITY_EMAIL.toLowerCase()) {
        setError(
          "This email is reserved for authority access. Please choose the authority signup option or use a different email."
        );
        return;
      }
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        setError(data.message || "Registration failed. Please try again.");
        return;
      }

      setSuccess(
        `${role === "AUTHORITY" ? "Authority" : "User"} account created successfully. Redirecting to login...`
      );

      setTimeout(() => {
        router.push(`/login?role=${role.toLowerCase()}`);
      }, 1200);
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        "Cannot connect to backend. Make sure the API server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full border border-red-500/20" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full border border-blue-500/20" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-[90vh] max-w-lg items-center justify-center">
        <div className="w-full">
          <div className="mb-8 text-center">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl text-4xl shadow-xl ${
                role === "AUTHORITY"
                  ? "bg-blue-600 shadow-blue-600/20"
                  : "bg-red-600 shadow-red-600/20"
              }`}
            >
              {role === "AUTHORITY" ? "🏛️" : "🚨"}
            </div>

            <h1 className="mt-6 text-3xl font-bold">Create Your Account</h1>
            <p className="mt-2 text-sm text-slate-400">
              Sign up as a user or an authorized authority.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                🚨 {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="area"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  District or area for flood alerts
                </label>
                <input
                  id="area"
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Example: Agra"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Users receive HIGH and CRITICAL flood warnings for this area.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Sign up as
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("USER")}
                    className={`rounded-xl border p-4 text-left transition ${
                      role === "USER"
                        ? "border-red-500 bg-red-500/10"
                        : "border-slate-700 bg-slate-950 hover:border-slate-600"
                    }`}
                  >
                    <div className="text-2xl">👤</div>
                    <p
                      className={`mt-2 text-sm font-bold ${
                        role === "USER" ? "text-red-400" : "text-white"
                      }`}
                    >
                      User
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Public emergency access
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("AUTHORITY")}
                    className={`rounded-xl border p-4 text-left transition ${
                      role === "AUTHORITY"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 bg-slate-950 hover:border-slate-600"
                    }`}
                  >
                    <div className="text-2xl">🏛️</div>
                    <p
                      className={`mt-2 text-sm font-bold ${
                        role === "AUTHORITY"
                          ? "text-blue-400"
                          : "text-white"
                      }`}
                    >
                      Authority
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Government response access
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-300">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:ring-2 ${
                    role === "AUTHORITY"
                      ? "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                      : "border-slate-700 focus:border-red-500 focus:ring-red-500/20"
                  }`}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    role === "AUTHORITY"
                      ? DEFAULT_AUTHORITY_EMAIL
                      : "you@example.com"
                  }
                  className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:ring-2 ${
                    role === "AUTHORITY"
                      ? "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                      : "border-slate-700 focus:border-red-500 focus:ring-red-500/20"
                  }`}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className={`w-full rounded-xl border bg-slate-950 px-4 py-3 pr-20 text-white outline-none placeholder:text-slate-600 focus:ring-2 ${
                      role === "AUTHORITY"
                        ? "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                        : "border-slate-700 focus:border-red-500 focus:ring-red-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-300">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:ring-2 ${
                    role === "AUTHORITY"
                      ? "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                      : "border-slate-700 focus:border-red-500 focus:ring-red-500/20"
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-xl px-4 py-3.5 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  role === "AUTHORITY"
                    ? "bg-blue-600 hover:bg-blue-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {loading
                  ? "Creating account..."
                  : role === "AUTHORITY"
                    ? "Create Authority Account"
                    : "Create User Account"}
              </button>
            </form>

            <div
              className={`mt-6 rounded-xl border p-4 ${
                role === "AUTHORITY"
                  ? "border-blue-500/20 bg-blue-500/5"
                  : "border-red-500/20 bg-red-500/5"
              }`}
            >
              <p className="text-xs leading-5 text-slate-400">
                {role === "AUTHORITY" ? (
                  <>
                    <span className="font-semibold text-blue-400">Authority rule:</span>{" "}
                    Authority registration is restricted to the approved authority email: {DEFAULT_AUTHORITY_EMAIL}.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-red-400">User rule:</span>{" "}
                    Regular users can only create public user accounts and cannot register as authority.
                  </>
                )}
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-semibold text-blue-400 hover:text-blue-300"
              >
                Login here
              </button>
            </p>
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
