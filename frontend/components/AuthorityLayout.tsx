"use client";

import AuthoritySidebar from "./AuthoritySidebar";
import AuthorityMobileNav from "./AuthorityMobileNav";

export default function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <AuthoritySidebar />

      <div className="min-h-screen lg:pl-64">

        {children}

      </div>

      <AuthorityMobileNav />

    </div>
  );
}