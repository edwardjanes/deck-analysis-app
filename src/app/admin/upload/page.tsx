"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function AdminUploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    businessName: "",
    country: "",
  });

  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch profile to check sc_admin flag
        const { data: profile } = await supabase
          .from("profiles")
          .select("sc_admin")
          .eq("id", user.id)
          .single();

        if (!profile?.sc_admin) {
          setError("You do not have admin access");
          setIsChecking(false);
          return;
        }

        setIsAdmin(true);
        setError("");
      } catch (err) {
        console.error("Admin check error:", err);
        setError("Failed to verify admin status");
      } finally {
        setIsChecking(false);
      }
    };

    checkAdmin();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError("File must be smaller than 25MB");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessId("");

    if (!formData.email || !formData.firstName || !formData.businessName || !formData.country || !file) {
      setError("Please fill in all required fields and select a PDF");
      return;
    }

    setIsLoading(true);

    try {
      const submitFormData = new FormData();
      submitFormData.append("email", formData.email);
      submitFormData.append("firstName", formData.firstName);
      submitFormData.append("lastName", formData.lastName);
      submitFormData.append("businessName", formData.businessName);
      submitFormData.append("country", formData.country);
      submitFormData.append("deck", file);

      const response = await fetch("/api/admin/submit", {
        method: "POST",
        body: submitFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "Failed to upload deck");
        return;
      }

      setSuccessId(data.id);
      setFormData({ email: "", firstName: "", lastName: "", businessName: "", country: "" });
      setFile(null);

      // Auto-trigger analysis
      setTimeout(() => {
        fetch(`/api/analyse/${data.id}`, { method: "POST" }).catch(() => {
          // Analysis will trigger on the backend
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#888888" }}>Checking admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ backgroundColor: "#111111", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "40px", maxWidth: "400px", textAlign: "center" }}>
          <h1 style={{ color: "#ff6b6b", marginBottom: "16px" }}>Access Denied</h1>
          <p style={{ color: "#888888", marginBottom: "20px" }}>
            {error || "You do not have admin access to this page."}
          </p>
          <a href="/dashboard" style={{ color: "#2563eb", textDecoration: "none" }}>
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", padding: "20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ color: "#FFFFFF", marginBottom: "8px", fontSize: "28px" }}>Internal Deck Upload</h1>
        <p style={{ color: "#888888", marginBottom: "32px" }}>Upload a customer's pitch deck for analysis</p>

        {successId && (
          <div style={{
            backgroundColor: "#1a3a2a",
            border: "1px solid #2d5a47",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
          }}>
            <p style={{ color: "#4ade80", marginBottom: "8px", fontWeight: "600" }}>✓ Upload successful!</p>
            <p style={{ color: "#888888", marginBottom: "12px" }}>Submission ID: <code style={{ color: "#4ade80" }}>{successId}</code></p>
            <p style={{ color: "#888888", fontSize: "14px" }}>
              Analysis is running. Results will be pushed to GHL only (no customer emails sent).
            </p>
            <a
              href={`/investment-score/results/${successId}`}
              style={{
                display: "inline-block",
                marginTop: "12px",
                color: "#4ade80",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              View Results →
            </a>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: "#3a1a1a",
            border: "1px solid #5a2d2d",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "24px",
            color: "#ff6b6b",
            fontSize: "14px",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{
          backgroundColor: "#111111",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          padding: "24px",
        }}>
          {/* Email */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="customer@example.com"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "#0A0A0A",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                color: "#FFFFFF",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* First Name */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="John"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "#0A0A0A",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                color: "#FFFFFF",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Last Name */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Doe"
              style={{
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "#0A0A0A",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                color: "#FFFFFF",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Business Name */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
              Business Name *
            </label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              placeholder="Acme Inc"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "#0A0A0A",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                color: "#FFFFFF",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Country */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
              Country *
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="United Kingdom"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "#0A0A0A",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                color: "#FFFFFF",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* PDF Upload */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
              Pitch Deck (PDF) *
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              required
              style={{
                display: "block",
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "#0A0A0A",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                color: "#FFFFFF",
                fontSize: "14px",
                cursor: "pointer",
              }}
            />
            {file && <p style={{ color: "#888888", fontSize: "12px", marginTop: "8px" }}>Selected: {file.name}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: isLoading ? "#444444" : "#2563eb",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Uploading..." : "Upload & Analyze"}
          </button>
        </form>

        <p style={{ color: "#666666", fontSize: "12px", marginTop: "16px", textAlign: "center" }}>
          This page is for internal use only. Analysis results will automatically sync to GHL.
        </p>
      </div>
    </div>
  );
}
