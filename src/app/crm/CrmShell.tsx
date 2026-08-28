"use client";

import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

const GREEN = "#03fb83";
const LOGO = "https://raw.githubusercontent.com/edwardjanes/source-capital/0147b27fad891686f67559992e43319411f07ba4/logo.png";

const NAV_LINKS = [
  { href: "/crm/prospects", label: "Prospects" },
  { href: "/dashboard",     label: "← Dashboard" },
];

export default function CrmShell({ children, firstName }: { children: React.ReactNode; firstName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      {/* Top nav */}
      <header style={{
        borderBottom: "1px solid #1A2438",
        padding: "0 32px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "#080C14",
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
          <a href="/dashboard">
            <img src={LOGO} alt="Source Capital" style={{ height: "28px" }} />
          </a>
          <nav style={{ display: "flex", gap: "4px" }}>
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname.startsWith(href) && href !== "/dashboard";
              return (
                <a
                  key={href}
                  href={href}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: active ? 600 : 400,
                    color: active ? GREEN : "#94A3B8",
                    background: active ? "rgba(3,251,131,0.08)" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </a>
              );
            })}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13px", color: "#6B7280" }}>{firstName}</span>
          <button
            onClick={handleLogout}
            style={{
              fontSize: "13px", color: "#6B7280", background: "none",
              border: "1px solid #1A2438", borderRadius: "8px",
              padding: "6px 14px", cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {/* Page content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 32px" }}>
        {children}
      </main>
    </div>
  );
}
