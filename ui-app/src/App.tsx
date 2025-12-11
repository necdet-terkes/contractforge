// src/App.tsx

import React, { useState } from "react";
import { CheckoutView } from "./CheckoutView";
import { AdminView } from "./AdminView";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"checkout" | "admin">("checkout");

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem 1rem",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh"
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "2rem",
          borderBottom: "2px solid #dee2e6",
          paddingBottom: "0.75rem"
        }}
      >
        <button
          onClick={() => setActiveTab("checkout")}
          onMouseEnter={(e) => {
            if (activeTab !== "checkout") {
              e.currentTarget.style.backgroundColor = "#e9ecef";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "checkout") {
              e.currentTarget.style.backgroundColor = "#f7f7f7";
            }
          }}
          style={{
            padding: "0.625rem 1.25rem",
            borderRadius: "6px",
            border:
              activeTab === "checkout" ? "2px solid #0d6efd" : "1px solid #ced4da",
            backgroundColor: activeTab === "checkout" ? "#0d6efd" : "#f7f7f7",
            color: activeTab === "checkout" ? "#fff" : "#495057",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "0.95rem",
            transition: "all 0.15s ease"
          }}
        >
          Checkout
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          onMouseEnter={(e) => {
            if (activeTab !== "admin") {
              e.currentTarget.style.backgroundColor = "#e9ecef";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "admin") {
              e.currentTarget.style.backgroundColor = "#f7f7f7";
            }
          }}
          style={{
            padding: "0.625rem 1.25rem",
            borderRadius: "6px",
            border:
              activeTab === "admin" ? "2px solid #0d6efd" : "1px solid #ced4da",
            backgroundColor: activeTab === "admin" ? "#0d6efd" : "#f7f7f7",
            color: activeTab === "admin" ? "#fff" : "#495057",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "0.95rem",
            transition: "all 0.15s ease"
          }}
        >
          Admin
        </button>
      </div>

      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}
      >
        {activeTab === "checkout" ? <CheckoutView /> : <AdminView />}
      </div>
    </div>
  );
};