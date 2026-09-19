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
        "Cannot connect to backend. Make sure FastAPI is running on port 8000."
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
              AI Disaster Management
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
                  onClick={() =>
                    setError(
                      "Password recovery will be connected with backend authentication."
                    )
                  }
                  className="text-blue-400 hover:text-blue-300"
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
            🔒 AI Disaster Management Emergency
            System
          </p>

        </div>

      </div>

    </main>
  );
}