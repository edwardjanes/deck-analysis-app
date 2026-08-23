"use client";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { C, FONT_SANS } from "@/lib/theme";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function DashboardClient({ user }: { user: User }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleNewValuation() {
    const response = await fetch("/companies/new", { method: "POST" });
    const { company, redirect } = await response.json();
    if (redirect) {
      router.push(redirect);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: FONT_SANS,
      }}
    >
      {/* Nav */}
      <nav
        style={{
          background: C.nav,
          borderBottom: `1px solid ${C.border}`,
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Valuation Engine</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            background: "transparent",
            color: C.accent,
            border: `1px solid ${C.accentBorder}`,
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontFamily: FONT_SANS,
          }}
        >
          Logout
        </button>
      </nav>

      {/* Main */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
            Welcome, {user.email}
          </h2>
          <p style={{ color: C.textMuted, fontSize: "14px" }}>
            Create and manage company valuations
          </p>
        </div>

        <button
          onClick={handleNewValuation}
          style={{
            padding: "12px 24px",
            background: C.accent,
            color: "#000",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            fontFamily: FONT_SANS,
            cursor: "pointer",
          }}
        >
          + New Valuation
        </button>

        <div
          style={{
            marginTop: "32px",
            padding: "32px",
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: "12px",
            textAlign: "center",
            color: C.textMuted,
          }}
        >
          <p>No companies yet. Create your first valuation to get started.</p>
        </div>
      </div>
    </div>
  );
}
