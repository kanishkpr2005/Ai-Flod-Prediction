"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Building2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Shield,
  HelpCircle,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

type UserRole = "USER" | "AUTHORITY";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // FORGOT PASSWORD STATE
  // =========================================================
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"EMAIL" | "VERIFY_RESET" | "SUCCESS">("EMAIL");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [devNotice, setDevNotice] = useState("");

  const handleOpenForgot = () => {
    setIsForgotOpen(true);
    setForgotStep("EMAIL");
    setForgotEmail(email.trim());
    setForgotCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotError("");
    setForgotSuccess("");
    setDevNotice("");
  };

  const handleCloseForgot = () => {
    setIsForgotOpen(false);
    setForgotError("");
    setForgotSuccess("");
    setDevNotice("");
  };

  const handleSendResetCode = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setDevNotice("");

    const targetEmail = forgotEmail.trim().toLowerCase();
    if (!targetEmail) {
      setForgotError("Please enter your registered email address.");
      return;
    }

    try {
      setForgotLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setForgotError(data.message || "Unable to send verification code.");
        return;
      }

      setForgotSuccess(data.message || `Verification code sent to ${targetEmail}.`);
      if (data.dev_code) {
        setForgotCode(data.dev_code);
        setDevNotice(`Testing Notice: Your verification code is ${data.dev_code}`);
      }
      setForgotStep("VERIFY_RESET");
    } catch (err) {
      console.error("Forgot password error:", err);
      setForgotError("Cannot connect to server. Please check backend connection.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotCode.trim()) {
      setForgotError("Please enter the 6-digit verification code.");
      return;
    }

    if (newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError("Passwords do not match.");
      return;
    }

    try {
      setForgotLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          code: forgotCode.trim(),
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setForgotError(data.message || "Failed to reset password. Check code or expiration.");
        return;
      }

      setEmail(forgotEmail);
      setPassword(newPassword);
      setForgotStep("SUCCESS");
    } catch (err) {
      console.error("Reset password error:", err);
      setForgotError("Cannot connect to server. Please retry.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || data.detail || "Invalid email or password.");
        return;
      }

      const backendUser = data.user;
      if (!backendUser) {
        setError("Login succeeded but user information was not received.");
        return;
      }

      const backendRole = String(backendUser.role || "user").toUpperCase();

      if (role === "AUTHORITY" && backendRole !== "AUTHORITY") {
        setError("This account is not registered as an authority account.");
        return;
      }

      if (role === "USER" && backendRole !== "USER") {
        setError("This account is registered as an authority account. Please select Authority role.");
        return;
      }

      const loginData = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        role: backendRole,
        area: backendUser.area || "",
        loggedIn: true,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem("disaster_user", JSON.stringify(loginData));

      if (backendRole === "AUTHORITY") {
        router.push("/authority-dashboard");
      } else {
        router.push("/user-dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Cannot connect to backend server. Verify server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="relative mx-auto w-full max-w-md">
        {/* LOGO & TITLE */}
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

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            AI Flood Prediction Platform
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Secure Authentication & Disaster Operations Portal
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur">
          <div className="border-b border-slate-800 pb-4 mb-5">
            <h2 className="text-lg font-bold text-white tracking-tight">Portal Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">Select your role to access your dedicated terminal.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* ROLE SELECTION */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sign In As
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
                  <p className="text-[10px] text-slate-500">Public early warning</p>
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
                  <p className="text-[10px] text-slate-500">Command Center</p>
                </button>
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-medium text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgot}
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${
                role === "AUTHORITY"
                  ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30"
                  : "bg-red-600 hover:bg-red-500 shadow-red-900/30"
              }`}
            >
              <span>{loading ? "Authenticating..." : role === "AUTHORITY" ? "Access Command Center" : "Access Citizen Portal"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* SIGNUP LINKS */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block mb-2">Need an account?</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link
                href="/signup?role=user"
                className="py-2 px-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300 transition"
              >
                Sign Up as Citizen
              </Link>
              <Link
                href="/signup?role=authority"
                className="py-2 px-3 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition"
              >
                Authority Signup
              </Link>
            </div>
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

      {/* FORGOT PASSWORD MODAL */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            {forgotStep === "EMAIL" && (
              <div>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-white">Reset Password</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Enter your registered email address to receive a 6-digit verification code.
                  </p>
                </div>

                {forgotError && (
                  <div className="mt-3 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleSendResetCode} className="mt-4 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter registered email"
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-bold transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    {forgotLoading ? "Sending Code..." : "Send Verification Code"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseForgot}
                    className="w-full py-1 text-center text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}

            {forgotStep === "VERIFY_RESET" && (
              <div>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-white">Verify & Reset Password</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Verification code sent to <strong className="text-blue-400">{forgotEmail}</strong>
                  </p>
                </div>

                {forgotError && (
                  <div className="mt-3 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                    {forgotError}
                  </div>
                )}

                {devNotice && (
                  <div className="mt-2 p-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-[11px] text-blue-300">
                    {devNotice}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="mt-4 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full px-3 py-2 text-center font-mono text-lg tracking-widest rounded-lg border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">New Password</label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Confirm New Password</label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-bold transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {forgotLoading ? "Resetting..." : "Save Password & Sign In"}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep("EMAIL")}
                      className="text-slate-400 hover:text-white"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSendResetCode}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              </div>
            )}

            {forgotStep === "SUCCESS" && (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-white">Password Updated Successfully</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Your new credentials are saved. You can now proceed to login.
                </p>
                <button
                  type="button"
                  onClick={handleCloseForgot}
                  className="mt-5 w-full py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold transition hover:bg-blue-500"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}