"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

type UserRole = "USER" | "AUTHORITY";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] =
    useState<UserRole>("USER");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

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

    const targetEmail = forgotEmail.trim().toLowerCase();
    const cleanCode = forgotCode.trim();

    if (!cleanCode) {
      setForgotError("Please enter the 6-digit verification code.");
      return;
    }

    if (!newPassword.trim()) {
      setForgotError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters long.");
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
          email: targetEmail,
          code: cleanCode,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setForgotError(data.message || "Failed to reset password. Please check the code.");
        return;
      }

      setForgotSuccess(data.message || "Password updated successfully!");
      setForgotStep("SUCCESS");
      setEmail(targetEmail);
      setPassword(newPassword);
    } catch (err) {
      console.error("Reset password error:", err);
      setForgotError("Cannot connect to server. Please check your connection.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password.trim()) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      // =====================================================
      // BACKEND LOGIN
      // =====================================================

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail ||
            data.message ||
            "Unable to sign in with these credentials."
        );
        return;
      }

      // =====================================================
      // LOGIN ERROR
      // =====================================================

      if (!data.success) {
        setError(
          data.message ||
            "Invalid email or password."
        );

        return;
      }

      // =====================================================
      // BACKEND USER
      // =====================================================

      const backendUser = data.user;

      if (!backendUser) {
        setError(
          "Login successful but user information was not received."
        );

        return;
      }

      // =====================================================
      // VERIFY SELECTED ROLE
      // =====================================================

      const backendRole =
        String(
          backendUser.role || "user"
        ).toUpperCase();

      if (role === "AUTHORITY") {
        if (backendRole !== "AUTHORITY") {
          setError(
            "This account is not registered as an authority account."
          );

          return;
        }
      }

      if (role === "USER") {
        if (backendRole !== "USER") {
          setError(
            "This account is registered as an authority account. Please select Authority."
          );

          return;
        }
      }

      // =====================================================
      // SAVE REAL LOGIN SESSION
      // =====================================================

      const loginData = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        role: backendRole,
        loggedIn: true,
        loginTime:
          new Date().toISOString(),
      };

      localStorage.setItem(
        "disaster_user",
        JSON.stringify(loginData)
      );

      // =====================================================
      // ROLE BASED REDIRECT
      // =====================================================

      if (backendRole === "AUTHORITY") {
        router.push(
          "/authority-dashboard"
        );
      } else {
        router.push(
          "/user-dashboard"
        );
      }

    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        "Cannot connect to the backend server. If using Render free tier, the backend may be waking up (please wait 30 seconds and retry), or verify your NEXT_PUBLIC_API_URL."
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

      <div className="relative mx-auto flex min-h-[90vh] max-w-md items-center justify-center">

        <div className="w-full">

          {/* HEADER */}

          <div className="mb-8 text-center">

            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl text-4xl shadow-xl ${
                role === "AUTHORITY"
                  ? "bg-blue-600 shadow-blue-600/20"
                  : "bg-red-600 shadow-red-600/20"
              }`}
            >
              {role === "AUTHORITY"
                ? "🏛️"
                : "🚨"}
            </div>

            <h1 className="mt-6 text-3xl font-bold">
              Rakshak Ai
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Emergency response and disaster
              monitoring platform
            </p>

          </div>

          {/* LOGIN CARD */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">

            <h2 className="text-2xl font-bold">
              Welcome Back
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Select your role and login to
              access the appropriate dashboard.
            </p>

            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                🚨 {error}
              </div>
            )}

            <form
              onSubmit={handleLogin}
              className="mt-6 space-y-5"
            >

              {/* ROLE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Login As
                </label>

                <div className="grid grid-cols-2 gap-3">

                  {/* USER */}

                  <button
                    type="button"
                    onClick={() =>
                      setRole("USER")
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      role === "USER"
                        ? "border-red-500 bg-red-500/10"
                        : "border-slate-700 bg-slate-950 hover:border-slate-600"
                    }`}
                  >

                    <div className="text-2xl">
                      👤
                    </div>

                    <p
                      className={`mt-2 text-sm font-bold ${
                        role === "USER"
                          ? "text-red-400"
                          : "text-white"
                      }`}
                    >
                      User
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Public emergency access
                    </p>

                  </button>

                  {/* AUTHORITY */}

                  <button
                    type="button"
                    onClick={() =>
                      setRole("AUTHORITY")
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      role === "AUTHORITY"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 bg-slate-950 hover:border-slate-600"
                    }`}
                  >

                    <div className="text-2xl">
                      🏛️
                    </div>

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
                      Emergency control center
                    </p>

                  </button>

                </div>

              </div>

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:ring-2 ${
                    role === "AUTHORITY"
                      ? "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                      : "border-slate-700 focus:border-red-500 focus:ring-red-500/20"
                  }`}
                />

              </div>

              {/* PASSWORD */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <div className="relative">

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className={`w-full rounded-xl border bg-slate-950 px-4 py-3 pr-20 text-white outline-none placeholder:text-slate-600 focus:ring-2 ${
                      role === "AUTHORITY"
                        ? "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                        : "border-slate-700 focus:border-red-500 focus:ring-red-500/20"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              {/* REMEMBER */}

              <div className="flex items-center justify-between text-sm">

                <label className="flex items-center gap-2 text-slate-400">

                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                  />

                  Remember me

                </label>

                <button
                  type="button"
                  onClick={handleOpenForgot}
                  className="font-medium text-blue-400 transition hover:text-blue-300 hover:underline"
                >
                  Forgot password?
                </button>

              </div>

              {/* LOGIN */}

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
                  ? "Signing in..."
                  : role === "AUTHORITY"
                  ? "Login as Authority →"
                  : "Login as User →"}
              </button>

              <div className="pt-2">
                <p className="mb-3 text-center text-xs uppercase tracking-[0.2em] text-slate-500">
                  New here?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="/signup?role=user"
                    className="rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-center text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                  >
                    Sign up as User
                  </a>

                  <a
                    href="/signup?role=authority"
                    className="rounded-xl border border-blue-500/30 bg-blue-500/5 px-3 py-2.5 text-center text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10"
                  >
                    Sign up as Authority
                  </a>
                </div>
              </div>

            </form>

            {/* INFO */}

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
                    <span className="font-semibold text-blue-400">
                      🏛️ Authority Access:
                    </span>{" "}
                    Access the Authority Control
                    Center with disaster alerts,
                    GIS map, SOS requests and
                    response management.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-red-400">
                      👤 User Access:
                    </span>{" "}
                    Access the User Dashboard for
                    emergency services and SOS
                    requests.
                  </>
                )}

              </p>

            </div>

          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            🔒 Rakshak Ai Emergency System
          </p>

        </div>

      </div>

      {/* =====================================================
          FORGOT PASSWORD MODAL
      ===================================================== */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-blue-500/10 sm:p-8">
            
            {/* Close button */}
            <button
              type="button"
              onClick={handleCloseForgot}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white"
            >
              ✕
            </button>

            {/* Step 1: Request verification code */}
            {forgotStep === "EMAIL" && (
              <div>
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl text-blue-400 border border-blue-500/20">
                    📧
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-white">Reset Password</h2>
                  <p className="mt-2 text-xs text-slate-400">
                    Enter your registered email address to receive a 6-digit verification code.
                  </p>
                </div>

                {forgotError && (
                  <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    🚨 {forgotError}
                  </div>
                )}

                <form onSubmit={handleSendResetCode} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    {forgotLoading ? "Sending verification code..." : "Send Verification Code →"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseForgot}
                    className="w-full py-2 text-center text-xs text-slate-400 hover:text-white"
                  >
                    Cancel and Return to Login
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Verify OTP and Set New Password */}
            {forgotStep === "VERIFY_RESET" && (
              <div>
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 text-2xl text-green-400 border border-green-500/20">
                    🔐
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-white">Verify & Reset</h2>
                  <p className="mt-2 text-xs text-slate-400">
                    Verification code sent to <span className="font-semibold text-blue-400">{forgotEmail}</span>
                  </p>
                </div>

                {forgotError && (
                  <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    🚨 {forgotError}
                  </div>
                )}

                {forgotSuccess && (
                  <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-xs text-green-300">
                    ✅ {forgotSuccess}
                  </div>
                )}

                {devNotice && (
                  <div className="mt-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
                    ℹ️ {devNotice}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 123456"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center font-mono text-xl tracking-[0.3em] text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        New Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-[11px] text-blue-400 hover:text-blue-300"
                      >
                        {showNewPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Confirm New Password
                    </label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full rounded-xl bg-green-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-green-500 disabled:opacity-50"
                  >
                    {forgotLoading ? "Resetting password..." : "Change Password & Login →"}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setForgotStep("EMAIL")}
                      className="text-slate-400 hover:text-white"
                    >
                      ← Change Email
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

            {/* Step 3: Success state */}
            {forgotStep === "SUCCESS" && (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-3xl text-green-400 border border-green-500/20">
                  🎉
                </div>
                <h2 className="mt-4 text-2xl font-bold text-white">Password Changed!</h2>
                <p className="mt-2 text-xs text-slate-400">
                  Your password has been successfully updated. Your new credentials have been filled into the login form.
                </p>

                <button
                  type="button"
                  onClick={handleCloseForgot}
                  className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Proceed to Login →
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </main>
  );
}